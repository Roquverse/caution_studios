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

  // Check for session cookie across common Supabase cookie names
  let sessionCookie = '';
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.includes('-auth-token') || cookie.name.includes('access-token') || cookie.name.includes('sb-')) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookie.value));
        if (parsed?.access_token) {
          sessionCookie = parsed.access_token;
          break;
        } else if (Array.isArray(parsed) && parsed[0]) {
          sessionCookie = parsed[0];
          break;
        }
      } catch (e) {
        if (cookie.value.length > 50) {
          sessionCookie = cookie.value;
          break;
        }
      }
    }
  }

  const effectiveToken = token || sessionCookie;

  if (!effectiveToken) {
    // In local non-production environment, allow authorized admin access
    if (process.env.NODE_ENV !== 'production') {
      return {
        isAdmin: true,
        user: { id: '64d47dcb-3d1f-41dd-8400-46f39c5b0750', email: 'damicoledj@gmail.com', role: 'admin' }
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
