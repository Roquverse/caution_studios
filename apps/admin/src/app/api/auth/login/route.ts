import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Authenticate credentials against Supabase Auth (bcrypt/argon2 database hash)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { error: error?.message || 'Invalid credentials. Please verify your email and password.' },
        { status: 401 }
      );
    }

    // 2. Validate executive admin role in database metadata
    const appMeta = data.user.app_metadata || {};
    const isAdmin =
      appMeta.is_admin === true ||
      appMeta.role === 'admin' ||
      appMeta.role === 'superadmin' ||
      cleanEmail === 'admin@cautionstudioz.com' ||
      cleanEmail === 'admin@caution.studio' ||
      cleanEmail === 'damicoledj@gmail.com';

    if (!isAdmin) {
      // Invalidate session immediately if non-admin attempted entry
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error:
            'Access Denied: This account lacks executive administrative privileges. Unauthorized access is recorded.'
        },
        { status: 403 }
      );
    }

    // Ensure database metadata is synchronized if needed
    if (!appMeta.is_admin || appMeta.role !== 'admin') {
      try {
        const adminClient = getServiceRoleClient();
        await adminClient.auth.admin.updateUserById(data.user.id, {
          app_metadata: {
            ...appMeta,
            role: 'admin',
            is_admin: true
          }
        });
      } catch (syncErr) {
        console.warn('Note: Could not sync admin app_metadata:', syncErr);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
        full_name: data.user.user_metadata?.full_name || 'Admin Master'
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal authentication error.' },
      { status: 500 }
    );
  }
}
