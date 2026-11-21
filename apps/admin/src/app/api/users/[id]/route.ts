import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { verifyAdminRequest } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

// PATCH /api/users/[id] - Update user plan or roles (Admin Only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const supabase = getServiceRoleClient();
    const body = await req.json();

    // 0. Soft-delete / Deactivate or Reactivate action if requested
    if (body.is_deactivated !== undefined || body.action === 'deactivate' || body.action === 'reactivate') {
      const deactivate = body.is_deactivated === true || body.action === 'deactivate';

      const { data: authData } = await supabase.auth.admin.getUserById(params.id);
      const existingMeta = authData?.user?.user_metadata || {};
      const existingAppMeta = authData?.user?.app_metadata || {};

      const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(params.id, {
        ban_duration: deactivate ? '876000h' : 'none',
        user_metadata: {
          ...existingMeta,
          is_deactivated: deactivate,
          deactivated_at: deactivate ? new Date().toISOString() : null
        },
        app_metadata: {
          ...existingAppMeta,
          is_deactivated: deactivate
        }
      });

      if (authUpdateErr) {
        return NextResponse.json({ error: authUpdateErr.message }, { status: 500 });
      }

      // Best effort update in profiles table if column exists
      try {
        await supabase
          .from('profiles')
          .update({ is_deactivated: deactivate })
          .eq('id', params.id);
      } catch (e) {}

      // If deactivated, revoke admin clearance
      if (deactivate) {
        await supabase.from('admin_users').delete().eq('user_id', params.id);
      }

      return NextResponse.json({
        success: true,
        message: deactivate ? 'User account deactivated successfully' : 'User account reactivated successfully',
        is_deactivated: deactivate
      });
    }

    // 1. Password update if requested by admin
    let passwordUpdated = false;
    if (body.password !== undefined && body.password !== null) {
      const pwd = String(body.password).trim();
      if (pwd.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      const { error: pwdErr } = await supabase.auth.admin.updateUserById(params.id, {
        password: pwd
      });

      if (pwdErr) {
        return NextResponse.json(
          { error: `Failed to update password: ${pwdErr.message}` },
          { status: 500 }
        );
      }
      passwordUpdated = true;
    }

    const updateFields: Record<string, any> = {};
    if (body.plan !== undefined) {
      updateFields.plan = body.plan;
      updateFields.stripe_customer_id = `plan:${body.plan}`;
      try {
        await supabase.auth.admin.updateUserById(params.id, {
          user_metadata: { plan: body.plan }
        });
      } catch (e) {}
    }
    if (body.display_name !== undefined) updateFields.display_name = body.display_name;
    if (body.handle !== undefined) updateFields.handle = body.handle;

    let targetRole: 'artist' | 'producer' | 'admin' | null = null;
    if (body.role) {
      targetRole = body.role;
    } else if (body.roles && Array.isArray(body.roles)) {
      if (body.roles.includes('admin')) targetRole = 'admin';
      else if (body.roles.includes('producer')) targetRole = 'producer';
      else targetRole = 'artist';
    }

    if (targetRole) {
      if (targetRole === 'admin') {
        updateFields.primary_role = 'admin';
        updateFields.roles = ['admin', 'producer', 'artist'];

        // Get user email
        const { data: authData } = await supabase.auth.admin.getUserById(params.id);
        const email = authData?.user?.email || `${params.id}@caution.studio`;

        // Grant administrative clearance
        await supabase
          .from('admin_users')
          .upsert(
            { user_id: params.id, email, role: 'superadmin', is_active: true },
            { onConflict: 'user_id' }
          );

        // Sync Supabase Auth metadata
        await supabase.auth.admin.updateUserById(params.id, {
          user_metadata: {
            primary_role: 'admin',
            role: 'admin',
            roles: ['admin', 'producer', 'artist'],
            is_admin: true
          },
          app_metadata: {
            role: 'admin',
            is_admin: true
          }
        });
      } else if (targetRole === 'producer') {
        updateFields.primary_role = 'producer';
        updateFields.roles = ['producer', 'artist'];

        // Remove from admin_users if previously an admin
        await supabase.from('admin_users').delete().eq('user_id', params.id);

        // Sync Supabase Auth metadata
        await supabase.auth.admin.updateUserById(params.id, {
          user_metadata: {
            primary_role: 'producer',
            role: 'producer',
            roles: ['producer', 'artist'],
            is_admin: false
          },
          app_metadata: {
            role: 'producer',
            is_admin: false
          }
        });
      } else {
        // Artist
        updateFields.primary_role = 'artist';
        updateFields.roles = ['artist'];

        // Remove from admin_users
        await supabase.from('admin_users').delete().eq('user_id', params.id);

        // Sync Supabase Auth metadata
        await supabase.auth.admin.updateUserById(params.id, {
          user_metadata: {
            primary_role: 'artist',
            role: 'artist',
            roles: ['artist'],
            is_admin: false
          },
          app_metadata: {
            role: 'artist',
            is_admin: false
          }
        });
      }
    }

    if (Object.keys(updateFields).length === 0 && !targetRole) {
      if (passwordUpdated) {
        return NextResponse.json({ success: true, message: 'Password updated successfully' });
      }
      return NextResponse.json({ success: true, message: 'No changes requested' });
    }

    let { data: updated, error } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', params.id)
      .select()
      .single();

    if (error && error.message && error.message.includes('primary_role')) {
      delete updateFields.primary_role;
      const retry = await supabase
        .from('profiles')
        .update(updateFields)
        .eq('id', params.id)
        .select()
        .single();
      updated = retry.data;
      error = retry.error;
    }

    if (error && error.message && error.message.includes('plan_tier')) {
      updateFields.plan = body.plan === 'pro' ? 'plus' : body.plan;
      const retryPlan = await supabase
        .from('profiles')
        .update(updateFields)
        .eq('id', params.id)
        .select()
        .single();
      updated = retryPlan.data;
      error = retryPlan.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (updated && updated.stripe_customer_id === 'plan:pro') {
      updated.plan = 'pro';
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Soft-delete / deactivate user (Admin Only)
// Preserves all user rows and relations in the database, only suspending access
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const supabase = getServiceRoleClient();
    const userId = params.id;

    // Fetch existing user to preserve metadata
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    const existingMeta = authData?.user?.user_metadata || {};
    const existingAppMeta = authData?.user?.app_metadata || {};

    // 1. Soft-ban in Supabase Auth (blocks login, revokes active sessions)
    const { error: banErr } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: '876000h', // 100 years
      user_metadata: {
        ...existingMeta,
        is_deactivated: true,
        deactivated_at: new Date().toISOString()
      },
      app_metadata: {
        ...existingAppMeta,
        is_deactivated: true
      }
    });

    if (banErr) {
      return NextResponse.json({ error: banErr.message }, { status: 500 });
    }

    // 2. Best-effort update to profiles table if column exists
    try {
      await supabase
        .from('profiles')
        .update({ is_deactivated: true })
        .eq('id', userId);
    } catch (e) {
      // Profiles schema might not have is_deactivated column yet
    }

    // 3. Remove from admin_users if present
    await supabase.from('admin_users').delete().eq('user_id', userId);

    return NextResponse.json({
      success: true,
      message: 'User account deactivated successfully (all database records preserved)',
      is_deactivated: true
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}


