import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const adminClient = getServiceRoleClient();
    const { data: { user }, error } = await adminClient.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
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
      return NextResponse.json({ error: 'Forbidden: Executive privileges required' }, { status: 403 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: appMeta.role || 'admin',
        full_name: user.user_metadata?.full_name || 'Admin Master',
        handle: user.user_metadata?.handle || 'caution_admin'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error verifying token' }, { status: 500 });
  }
}
