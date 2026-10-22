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

    const updateFields: Record<string, any> = {};
    if (body.plan !== undefined) updateFields.plan = body.plan;
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

