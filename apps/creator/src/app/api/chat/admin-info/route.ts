import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Try to find user from admin_users
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('user_id, email, role')
      .eq('is_active', true)
      .not('user_id', 'is', null)
      .limit(1)
      .maybeSingle();

    let adminId = adminUser?.user_id;

    // 2. If not found, look in profiles for admin role
    if (!adminId) {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id, display_name, handle')
        .or('role.eq.admin,primary_role.eq.admin')
        .limit(1)
        .maybeSingle();
      adminId = adminProfile?.id;
    }

    // 3. Fallback to known default or first profile
    if (!adminId) {
      const { data: fallbackProf } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();
      adminId = fallbackProf?.id || '64d47dcb-3d1f-41dd-8400-46f39c5b0750';
    }

    return NextResponse.json({
      adminId,
      name: 'Caution Studio Executive Admin',
      handle: '@caution_admin',
      role: 'Platform Operations & Support',
      avatar: '/images/caution_admin_avatar.png'
    });
  } catch (err: any) {
    return NextResponse.json({
      adminId: '64d47dcb-3d1f-41dd-8400-46f39c5b0750',
      name: 'Caution Studio Executive Admin',
      handle: '@caution_admin'
    });
  }
}

