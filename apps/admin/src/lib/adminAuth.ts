import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from './supabaseClient';

export interface AdminAuthResult {
  isAdmin: boolean;
  user?: any;
  errorResponse?: NextResponse;
}

export async function verifyAdminRequest(req: NextRequest): Promise<AdminAuthResult> {
  const authHeader = req.headers.get('authorization') || '';
  let token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // If no auth header, check query param (e.g. for direct download links)
  if (!token) {
    const url = new URL(req.url);
    token = url.searchParams.get('token') || '';
  }

  // Check for session cookie across common Supabase cookie names
  let sessionCookie = '';
  const allCookies = req.cookies.getAll();

  // Handle potential chunked cookies (sb-*-auth-token.0, sb-*-auth-token.1)
  const chunkedMap: Record<string, string[]> = {};
  for (const cookie of allCookies) {
    const match = cookie.name.match(/^(sb-[a-z0-9]+-auth-token)\.(\d+)$/);
    if (match) {
      const base = match[1];
      const idx = parseInt(match[2], 10);
      if (!chunkedMap[base]) chunkedMap[base] = [];
      chunkedMap[base][idx] = cookie.value;
    }
  }

  for (const base in chunkedMap) {
    const combined = chunkedMap[base].join('');
    try {
      const parsed = JSON.parse(decodeURIComponent(combined));
      if (parsed?.access_token) {
        sessionCookie = parsed.access_token;
        break;
      } else if (Array.isArray(parsed) && parsed[0]) {
        sessionCookie = parsed[0];
        break;
      }
    } catch {}
  }

  if (!sessionCookie) {
    for (const cookie of allCookies) {
      if (
        cookie.name.includes('-auth-token') ||
        cookie.name.includes('access-token') ||
        cookie.name.includes('sb-token') ||
        cookie.name === 'sb-token'
      ) {
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
          if (cookie.value.length > 40) {
            sessionCookie = cookie.value;
            break;
          }
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
        user: { id: 'c855e1b8-b34c-4b1d-986b-373e70ec423f', email: 'admin@cautionstudioz.com', role: 'superadmin' }
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
    const userMeta = user.user_metadata || {};
    const email = (user.email || '').toLowerCase().trim();

    let isDbAdmin = false;
    try {
      const { data: prof } = await adminClient
        .from('profiles')
        .select('roles, handle')
        .eq('id', user.id)
        .maybeSingle();

      const userRoles = prof?.roles || [];
      const handle = (prof?.handle || '').toLowerCase();

      if (
        userRoles.includes('admin') ||
        userRoles.includes('superadmin') ||
        handle.includes('admin') ||
        handle === 'arakunrincole' ||
        handle === 'olajide_samuel_ojo' ||
        handle === 'jaiden'
      ) {
        isDbAdmin = true;
      }
    } catch (e) {}

    const isAdmin =
      appMeta.is_admin === true ||
      appMeta.role === 'admin' ||
      appMeta.role === 'superadmin' ||
      userMeta.is_admin === true ||
      userMeta.role === 'admin' ||
      userMeta.primary_role === 'admin' ||
      email === 'admin@cautionstudioz.com' ||
      email === 'admin@caution.studio' ||
      email === 'damicoledj@gmail.com' ||
      email === 'jaidenolajide@gmail.com' ||
      email === 'cautionstudioz@gmail.com' ||
      email.endsWith('@cautionstudioz.com') ||
      email.endsWith('@caution.studio') ||
      isDbAdmin;

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
