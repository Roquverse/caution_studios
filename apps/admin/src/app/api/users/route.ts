import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

// GET /api/users - Retrieve all creators and subscribers with auth emails
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();

    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Try fetching auth users to match emails
    let emailMap: Record<string, string> = {};
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData?.users) {
        authData.users.forEach((u) => {
          if (u.id && u.email) {
            emailMap[u.id] = u.email;
          }
        });
      }
    } catch (authErr) {
      console.warn('Could not list auth users:', authErr);
    }

    const enrichedUsers = (users || []).map((u) => ({
      ...u,
      email: emailMap[u.id] || `${u.handle}@caution.studio`
    }));

    return NextResponse.json({ users: enrichedUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
