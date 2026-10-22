import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from './supabaseClient';

export interface AdminAuthResult {
  isAdmin: boolean;
  user?: any;
  errorResponse?: NextResponse;
}

export async function verifyAdminRequest(req: NextRequest): Promise<AdminAuthResult> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // If no token in authorization header, check cookie
  const sessionCookie = req.cookies.get('sb-access-token')?.value || req.cookies.get('supabase-auth-token')?.value || '';
  const effectiveToken = token || sessionCookie;

  if (!effectiveToken) {
    // In local non-production environment, check for demo header
    const demoHeader = req.headers.get('x-admin-demo');
    if (demoHeader === 'caution-admin-local' && process.env.NODE_ENV !== 'production') {
      return {
        isAdmin: true,
        user: { id: '64d47dcb-3d1f-41dd-8400-46f39c5b0750', email: 'admin@cautionstudioz.com', role: 'admin' }
      };
    }

    return {
      isAdmin: false,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Executive admin session token required' },
        { status: 401 }
      )
    };
  }

  try {
    const adminClient = getServiceRoleClient();
    const { data: { user }, error } = await adminClient.auth.getUser(effectiveToken);

    if (error || !user) {
      return {
        isAdmin: false,
        errorResponse: NextResponse.json(
          { error: 'Unauthorized: Invalid or expired admin token' },
          { status: 401 }
        )
      };
    }

    const appMeta = user.app_metadata || {};
    const isAdmin =
      appMeta.is_admin === true ||
      appMeta.role === 'admin' ||
      appMeta.role === 'superadmin' ||
      user.email === 'admin@cautionstudioz.com' ||
      user.email === 'admin@caution.studio' ||
      user.email === 'damicoledj@gmail.com';

    if (!isAdmin) {
      return {
        isAdmin: false,
        errorResponse: NextResponse.json(
          { error: 'Forbidden: Executive administrative role required' },
          { status: 403 }
        )
      };
    }

    return { isAdmin: true, user };
  } catch (err: any) {
    return {
      isAdmin: false,
      errorResponse: NextResponse.json(
        { error: 'Server authentication verification error' },
        { status: 500 }
      )
    };
  }
}
