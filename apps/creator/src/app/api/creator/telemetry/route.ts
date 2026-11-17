import { NextRequest, NextResponse } from 'next/server';
import { supabase as publicSupabase, getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    let userId = req.nextUrl.searchParams.get('userId') || null;

    if (!userId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user } } = await publicSupabase.auth.getUser(token);
        if (user?.id) userId = user.id;
      }
    }

    if (!userId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/(?:^|;\s*)sb-token=([^;]+)/);
      if (match && match[1]) {
        try {
          const token = decodeURIComponent(match[1]);
          const { data: { user } } = await publicSupabase.auth.getUser(token);
          if (user?.id) userId = user.id;
        } catch (e) {}
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Producer session required' }, { status: 401 });
    }

    // 1. Fetch Producer Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const isAdminAccount =
      profile?.roles?.includes('admin') ||
      profile?.handle?.toLowerCase().includes('admin');

    // 2. Fetch Producer Beats with Licenses
    let { data: dbBeats } = await supabase
      .from('beats')
      .select(`
        *,
        licenses:beat_licenses (
          type,
          price_cents,
          enabled
        )
      `)
      .eq('producer_id', userId)
      .order('play_count', { ascending: false });

    // If an admin account logs into Creator Studio and has 0 direct beats under its admin ID,
    // load all platform beats so the admin can inspect full Plays & Downloads telemetry
    if ((!dbBeats || dbBeats.length === 0) && isAdminAccount) {
      const { data: allBeats } = await supabase
        .from('beats')
        .select(`
          *,
          licenses:beat_licenses (
            type,
            price_cents,
            enabled
          )
        `)
        .order('play_count', { ascending: false });
      dbBeats = allBeats || [];
    }

    const beats = dbBeats || [];

    // 3. Calculate Plays, Downloads & Pay Threshold Metrics
    const totalPlaysCount = beats.reduce((acc, b) => acc + (Number(b.play_count) || 0), 0);
    let totalDownloadsCount = beats.reduce(
      (acc, b) => acc + (Number(b.free_commercial_downloads_count || b.download_count) || 0),
      0
    );

    const { data: incentiveRows } = await supabase
      .from('producer_download_incentives')
      .select('reward_amount_ngn, qualifying_downloads')
      .eq('producer_id', userId);

    const incReward = (incentiveRows || []).reduce((acc, r) => acc + Number(r.reward_amount_ngn || 0), 0);
    const incDownloads = (incentiveRows || []).reduce((acc, r) => acc + Number(r.qualifying_downloads || 0), 0);
    if (incDownloads > totalDownloadsCount) {
      totalDownloadsCount = incDownloads;
    }

    const combinedActivityCount = totalPlaysCount + totalDownloadsCount;
    const payThreshold = 10000;
    const playsThresholdPct = Math.min(100, Number(((totalPlaysCount / payThreshold) * 100).toFixed(2)));
    const downloadsThresholdPct = Math.min(100, Number(((totalDownloadsCount / payThreshold) * 100).toFixed(2)));
    const combinedThresholdPct = Math.min(100, Number(((combinedActivityCount / payThreshold) * 100).toFixed(2)));
    const computedReward = Math.floor(totalDownloadsCount / payThreshold) * 30000;
    const downloadRewardNgn = Math.max(computedReward, incReward);

    // 4. Fetch Order Items & Sales (via Service Role so RLS on orders never blocks producer visibility)
    let orderQuery = supabase
      .from('order_items')
      .select(`
        id,
        beat_id,
        producer_id,
        price_cents,
        producer_amount_cents,
        license,
        order:order_id (
          id,
          status,
          created_at,
          buyer:buyer_id (
            display_name,
            handle
          )
        ),
        beat:beat_id (
          title,
          cover_url
        )
      `)
      .order('id', { ascending: false });

    if (!isAdminAccount || (dbBeats && dbBeats.some((b) => b.producer_id === userId))) {
      orderQuery = orderQuery.eq('producer_id', userId);
    }

    const { data: orderItems } = await orderQuery;
    const paidOrderItems = (orderItems || []).filter(
      (item: any) => !item.order || item.order?.status === 'paid'
    );

    const totalSalesEarningsNgn = Math.round(
      paidOrderItems.reduce((acc: number, item: any) => acc + (Number(item.producer_amount_cents) || 0), 0) / 100
    );

    // Count sales per beat
    const salesCountByBeat: Record<string, number> = {};
    for (const item of paidOrderItems) {
      if (item.beat_id) {
        salesCountByBeat[item.beat_id] = (salesCountByBeat[item.beat_id] || 0) + 1;
      }
    }

    const enrichedBeats = beats.map((b) => ({
      ...b,
      play_count: Number(b.play_count) || 0,
      downloads_count: Number(b.free_commercial_downloads_count || b.download_count) || 0,
      sales_count: salesCountByBeat[b.id] || (b.status === 'sold' ? 1 : 0)
    }));

    // 5. Fetch Payouts History
    const { data: payouts } = await supabase
      .from('payouts')
      .select('*')
      .eq('producer_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      profile: profile || null,
      beats: enrichedBeats,
      totalPlaysCount,
      totalDownloadsCount,
      combinedActivityCount,
      payThreshold,
      playsThresholdPct,
      downloadsThresholdPct,
      combinedThresholdPct,
      downloadRewardNgn,
      totalSalesEarningsNgn,
      licensesSoldCount: paidOrderItems.length,
      orderItems: paidOrderItems,
      payouts: payouts || []
    });
  } catch (err: any) {
    console.error('Error in GET /api/creator/telemetry:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

