import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { verifyAdminRequest } from '../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

// Default platform configuration state
let platformConfig = {
  platformName: 'Caution Studio',
  supportEmail: 'admin@cautionstudioz.com',
  platformFeePct: 20,
  producerFeePct: 80,
  currency: 'NGN',
  basicLeasePrice: 15000,
  premiumLeasePrice: 45000,
  exclusivePrice: 250000,
  previewCutoffSeconds: 15,
  watermarkIntervalSeconds: 20,
  autoPublishTracks: true,
  emailOnNewUpload: true,
  emailOnSale: true
};

// GET /api/settings - Fetch platform settings & admin directory (Executive Only)
export async function GET(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const supabase = getServiceRoleClient();

    // 1. Fetch active admin team from public.admin_users
    const { data: adminList, error: adminErr } = await supabase
      .from('admin_users')
      .select('id, user_id, email, role, is_active, created_at')
      .order('created_at', { ascending: true });

    if (adminErr) {
      console.warn('Could not read admin_users:', adminErr);
    }

    // 2. Telemetry metadata
    const systemTelemetry = {
      storageBucket: process.env.R2_BUCKET_NAME || 'caution-studio-audio',
      storageStatus: 'operational',
      databaseHost: 'yvsoqighrijqqnojelgp.supabase.co',
      databaseStatus: 'connected',
      payments: {
        paystack: 'enabled',
        stripe: 'configured'
      }
    };

    return NextResponse.json({
      config: platformConfig,
      admins: adminList || [],
      telemetry: systemTelemetry
    });
  } catch (err: any) {
    console.error('Error fetching admin settings:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/settings - Update platform settings, admin credentials or add admins (Executive Only)
export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;
    const supabase = getServiceRoleClient();

    // Action 1: Update platform configuration
    if (action === 'update_config') {
      platformConfig = {
        ...platformConfig,
        ...payload
      };
      return NextResponse.json({ success: true, config: platformConfig });
    }

    // Action 2: Change admin password
    if (action === 'change_password') {
      const { email, newPassword } = payload;
      if (!email || !newPassword) {
        return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
      }

      // Look up user by email
      const { data: userList, error: listErr } = await supabase.auth.admin.listUsers();
      if (listErr || !userList?.users) {
        return NextResponse.json({ error: 'Failed to access user directory' }, { status: 500 });
      }

      const targetUser = userList.users.find(
        (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (!targetUser) {
        return NextResponse.json({ error: `User with email ${email} was not found` }, { status: 404 });
      }

      const { error: updateErr } = await supabase.auth.admin.updateUserById(targetUser.id, {
        password: newPassword
      });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `Password updated successfully for ${email}`
      });
    }

    // Action 3: Add new admin
    if (action === 'add_admin') {
      const { email, role = 'superadmin', password } = payload;
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Check if user already exists in auth
      const { data: userList } = await supabase.auth.admin.listUsers();
      let targetUser = userList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

      if (!targetUser) {
        if (!password || password.length < 8) {
          return NextResponse.json({
            error: 'User does not exist. A password of at least 8 characters is required to create the account.'
          }, { status: 400 });
        }

        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: password,
          email_confirm: true,
          app_metadata: { is_admin: true, role: 'admin' },
          user_metadata: { full_name: 'Studio Admin', handle: cleanEmail.split('@')[0] }
        });

        if (createErr || !created.user) {
          return NextResponse.json({ error: createErr?.message || 'Failed to create admin' }, { status: 400 });
        }
        targetUser = created.user;
      } else {
        // Upgrade existing user to admin
        await supabase.auth.admin.updateUserById(targetUser.id, {
          app_metadata: {
            ...(targetUser.app_metadata || {}),
            is_admin: true,
            role: 'admin'
          }
        });
      }

      // Insert/Upsert into public.admin_users
      const { error: upsertErr } = await supabase
        .from('admin_users')
        .upsert(
          {
            user_id: targetUser.id,
            email: cleanEmail,
            role: role,
            is_active: true
          },
          { onConflict: 'email' }
        );

      if (upsertErr) {
        console.warn('Upsert into admin_users error:', upsertErr);
      }

      return NextResponse.json({
        success: true,
        message: `Admin ${cleanEmail} has been authorized with ${role} privileges.`
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error handling admin settings post:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
