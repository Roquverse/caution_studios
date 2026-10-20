import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

// GET /api/stats - Aggregated platform statistics with real financial & catalog data
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();

    // 1. Total tracks and genre breakdown
    const { data: allBeats, error: beatsErr } = await supabase
      .from('beats')
      .select('id, title, slug, genre, bpm, play_count, cover_url, duration_seconds, status, created_at')
      .order('created_at', { ascending: false });
    if (beatsErr) console.error('beatsErr:', beatsErr);

    const tracksCount = allBeats ? allBeats.length : 0;
    const totalPlays = (allBeats || []).reduce((acc, curr) => acc + (curr.play_count || 0), 0);

    // 2. Real Orders & Platform Revenue
    const { data: allOrders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, buyer_id, status, subtotal_cents, total_cents, paystack_reference, created_at, profiles(display_name, handle)')
      .order('created_at', { ascending: false });
    if (ordersErr) console.error('ordersErr:', ordersErr);

    const paidOrders = (allOrders || []).filter((o) => o.status === 'paid');
    const totalRevenueCents = paidOrders.reduce((acc, curr) => acc + (curr.total_cents || 0), 0);
    const totalRevenue = totalRevenueCents / 100;

    // Month-over-month comparison for revenue growth
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);

    const currentMonthRevenueCents = paidOrders
      .filter((o) => new Date(o.created_at) >= startOfCurrentMonth)
      .reduce((acc, curr) => acc + (curr.total_cents || 0), 0);

    const prevMonthRevenueCents = paidOrders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d >= startOfPrevMonth && d < startOfCurrentMonth;
      })
      .reduce((acc, curr) => acc + (curr.total_cents || 0), 0);

    let revenueGrowthPct = 0;
    if (prevMonthRevenueCents > 0) {
      revenueGrowthPct = ((currentMonthRevenueCents - prevMonthRevenueCents) / prevMonthRevenueCents) * 100;
    } else if (currentMonthRevenueCents > 0) {
      revenueGrowthPct = 100;
    }

    // 3. Profiles & Subscribers
    const { data: allProfiles, error: usersErr } = await supabase
      .from('profiles')
      .select('id, handle, display_name, avatar_url, roles, plan, created_at')
      .order('created_at', { ascending: false });
    if (usersErr) console.error('usersErr:', usersErr);

    const usersCount = allProfiles ? allProfiles.length : 0;
    const plusCount = (allProfiles || []).filter((p) => p.plan === 'plus').length;

    // Match auth emails for recent profiles
    let recentUsers = (allProfiles || []).slice(0, 6);
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      if (authUsers?.users) {
        const emailMap = new Map(authUsers.users.map((u) => [u.id, u.email]));
        recentUsers = recentUsers.map((p) => ({
          ...p,
          email: emailMap.get(p.id) || `${p.handle}@user.caution`
        }));
      }
    } catch (e) {
      console.warn('Could not list auth emails:', e);
    }

    // 4. Monthly Distribution Chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyVolumes: { [key: number]: number } = {};
    for (let i = 0; i < 12; i++) monthlyVolumes[i] = 0;

    paidOrders.forEach((o) => {
      const d = new Date(o.created_at);
      if (d.getFullYear() === currentYear) {
        monthlyVolumes[d.getMonth()] = (monthlyVolumes[d.getMonth()] || 0) + (o.total_cents || 0);
      }
    });

    const maxMonthRev = Math.max(...Object.values(monthlyVolumes), 1);
    const monthlyData = monthNames.slice(0, currentMonth + 1).map((month, idx) => {
      const val = monthlyVolumes[idx] || 0;
      const heightPct = val > 0 ? Math.max(Math.round((val / maxMonthRev) * 100), 18) : 12;
      return {
        month,
        value: val / 100,
        height: `${heightPct}%`,
        isCurrent: idx === currentMonth
      };
    });

    // 5. Recent formatted orders
    const recentOrders = (allOrders || []).slice(0, 8).map((o: any) => ({
      id: o.id,
      buyer_name: o.profiles?.display_name || 'Guest Creator',
      buyer_handle: o.profiles?.handle || 'creator',
      total: (o.total_cents || 0) / 100,
      status: o.status,
      reference: o.paystack_reference || `REF-${o.id.substring(0, 8).toUpperCase()}`,
      created_at: o.created_at
    }));

    // 6. Genre analytics breakdown
    const genreCounts: { [key: string]: number } = {};
    (allBeats || []).forEach((b) => {
      const g = b.genre || 'Afrobeats';
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });

    return NextResponse.json({
      tracksCount,
      usersCount,
      plusCount,
      totalPlays,
      ordersCount: allOrders ? allOrders.length : 0,
      totalRevenue,
      totalRevenueCents,
      revenueGrowthPct,
      monthlyData,
      recentTracks: (allBeats || []).slice(0, 6),
      recentUsers,
      recentOrders,
      genreCounts
    });
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
