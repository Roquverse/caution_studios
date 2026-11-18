import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

const KNOWN_ADMIN_IDS = [
  'c855e1b8-b34c-4b1d-986b-373e70ec423f', // admin@cautionstudioz.com (Studio Admin)
  '9db03bfb-2dc1-42dd-888c-32daa24fe93a'  // admin@caution.studio
];

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();

    // 1. Fetch active admin records from admin_users using service role client (bypasses RLS)
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('user_id, email, role')
      .eq('is_active', true)
      .not('user_id', 'is', null);

    const allAdminIds: string[] = [];
    let primaryAdminId: string | null = null;

    if (adminUsers && adminUsers.length > 0) {
      for (const a of adminUsers) {
        if (!a.user_id) continue;
        // Exclude producer Cole if present
        if (a.user_id === '64d47dcb-3d1f-41dd-8400-46f39c5b0750') continue;

        allAdminIds.push(a.user_id);
        if (a.email === 'admin@cautionstudioz.com' || a.email === 'admin@caution.studio') {
          primaryAdminId = a.user_id;
        }
      }
      if (!primaryAdminId && allAdminIds.length > 0) {
        primaryAdminId = allAdminIds[0];
      }
    }

    // Fallback to designated studio admin IDs if query returned empty
    if (!primaryAdminId) {
      primaryAdminId = KNOWN_ADMIN_IDS[0];
      KNOWN_ADMIN_IDS.forEach((id) => {
        if (!allAdminIds.includes(id)) allAdminIds.push(id);
      });
    } else {
      KNOWN_ADMIN_IDS.forEach((id) => {
        if (!allAdminIds.includes(id)) allAdminIds.push(id);
      });
    }

    return NextResponse.json({
      adminId: primaryAdminId,
      allAdminIds: Array.from(new Set(allAdminIds)),
      name: 'Caution Studio Executive Admin',
      handle: '@caution_admin',
      role: 'Platform Operations & Support',
      avatar: '/images/caution_admin_avatar.png'
    });
  } catch (err: any) {
    console.error('Error resolving admin info:', err);
    return NextResponse.json({
      adminId: KNOWN_ADMIN_IDS[0],
      allAdminIds: KNOWN_ADMIN_IDS,
      name: 'Caution Studio Executive Admin',
      handle: '@caution_admin',
      role: 'Platform Operations & Support'
    });
  }
}


