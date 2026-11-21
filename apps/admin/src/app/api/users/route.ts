import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { verifyAdminRequest } from '../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET /api/users - Retrieve all creators and subscribers with auth emails (Executive Only)
export async function GET(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const supabase = getServiceRoleClient();

    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch auth users to match emails and deactivation status
    let emailMap: Record<string, string> = {};
    let deactivatedMap: Record<string, boolean> = {};

    try {
      let page = 1;
      const perPage = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: authData, error: authListError } = await supabase.auth.admin.listUsers({
          page,
          perPage
        });

        if (authListError || !authData?.users || authData.users.length === 0) {
          hasMore = false;
          break;
        }

        authData.users.forEach((u) => {
          if (u.id) {
            if (u.email) {
              emailMap[u.id] = u.email;
            }
            const isBanned = Boolean(u.banned_until && new Date(u.banned_until) > new Date());
            const isMetaDeactivated = Boolean(
              u.user_metadata?.is_deactivated || u.app_metadata?.is_deactivated
            );
            deactivatedMap[u.id] = isBanned || isMetaDeactivated;
          }
        });

        if (authData.users.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
      }
    } catch (authErr) {
      console.warn('Could not list auth users:', authErr);
    }

    const enrichedUsers = (users || []).map((u) => ({
      ...u,
      plan: u.plan === 'pro' || u.stripe_customer_id === 'plan:pro' ? 'pro' : u.plan,
      email: emailMap[u.id] || u.email || 'No email registered',
      is_deactivated: Boolean(u.is_deactivated || deactivatedMap[u.id])
    }));

    return NextResponse.json({ users: enrichedUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch users' }, { status: 500 });
  }
}
