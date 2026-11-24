import { NextRequest, NextResponse } from 'next/server';
import { supabase as publicSupabase, getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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
      return NextResponse.json({
        profile: {
          display_name: 'Creator Studio',
          handle: 'producer',
          is_verified: false,
          trial_ends_at: null
        },
        availableBalanceNgn: 0,
        pendingBalanceNgn: 0,
        totalSalesCount: 0,
        totalSalesNgn: 0,
        totalPlaysCount: 0,
        totalDownloadsCount: 0,
        monthlyDownloadsCount: 0,
        monthlyDownloadThreshold: 10000,
        monthlyThresholdPct: 0,
        monthlyDownloadsRemaining: 10000,
        currentMonthPeriod: new Date().toISOString().slice(0, 7) + '-01',
        downloadRewardNgn: 0,
        thresholdRemaining: 10000,
        trialDaysRemaining: 0,
        beats: [],
        purchases: []
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    }

    // 1. Fetch Producer Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const isAdminAccount = Boolean(
      profile?.roles?.includes('admin') ||
      profile?.handle?.toLowerCase().includes('admin') ||
      (profile?.email && profile.email.toLowerCase().includes('admin')) ||
      (profile?.email && profile.email.toLowerCase() === 'damicoledj@gmail.com')
    );

    // 2. Fetch Producer Beats with Licenses (strictly only beats uploaded by this creator)
    const { data: dbBeats, error: beatsErr } = await supabase
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
      .order('created_at', { ascending: false });

    if (beatsErr) {
      console.warn('Error fetching producer beats in telemetry:', beatsErr);
    }

    const beats = dbBeats || [];

    // 3. Calculate Plays, Downloads & Monthly Incentive Metrics (Collective across all uploads)
    const totalPlaysCount = beats.reduce((acc, b) => acc + (Number(b.play_count) || 0), 0);
    const totalDownloadsCount = beats.reduce(
      (acc, b) => acc + (Number(b.free_commercial_downloads_count || b.download_count) || 0),
      0
    );

    const currentMonthPeriod = new Date().toISOString().slice(0, 7) + '-01'; // e.g. "2026-11-01"

    const { data: incentiveRows } = await supabase
      .from('producer_download_incentives')
      .select('*')
      .eq('producer_id', userId)
      .order('month_period', { ascending: false });

    // Find current month incentive tracking record
    const currentMonthRecord = (incentiveRows || []).find(
      (r: any) => r.month_period && r.month_period.startsWith(currentMonthPeriod.slice(0, 7))
    );

    // Monthly downloads count resets to 0 every month
    const monthlyDownloadsCount = currentMonthRecord
      ? Number(currentMonthRecord.qualifying_downloads || 0)
      : 0;

    const monthlyDownloadThreshold = 10000;
    const monthlyThresholdPct = Math.min(
      100,
      Number(((monthlyDownloadsCount / monthlyDownloadThreshold) * 100).toFixed(2))
    );
    const monthlyDownloadsRemaining = Math.max(0, monthlyDownloadThreshold - monthlyDownloadsCount);

    // Total incentive rewards across all monthly cycles
    const totalIncentiveRewardsNgn = (incentiveRows || []).reduce(
      (acc: number, r: any) => acc + Number(r.reward_amount_ngn || 0),
      0
    );
    const downloadRewardNgn = totalIncentiveRewardsNgn;
    const combinedActivityCount = totalPlaysCount + totalDownloadsCount;

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

    // If not an admin, restrict sales to this producer's beats
    if (!isAdminAccount) {
      orderQuery = orderQuery.eq('producer_id', userId);
    }

    const { data: orderItems } = await orderQuery;
    let paidOrderItems: any[] = (orderItems || []).filter(
      (item: any) => {
        const orderObj = Array.isArray(item.order) ? item.order[0] : item.order;
        return !orderObj || orderObj.status === 'paid';
      }
    );

    // Also check licenses table in case orders were recorded directly as licenses
    if (beats.length > 0) {
      try {
        const beatIds = beats.map((b) => `'${b.id}'`).join(',');
        const { data: dbLicenses } = await supabase
          .from('licenses')
          .select(`
            id,
            order_item_id,
            beat_id,
            buyer_id,
            type,
            stream_cap,
            video_cap,
            license_number,
            price_cents,
            producer_amount_cents,
            issued_at,
            status,
            buyer:profiles!buyer_id (
              display_name,
              handle
            ),
            beat:beats!beat_id (
              title,
              cover_url
            )
          `)
          .in('beat_id', beats.map((b) => b.id));

        if (dbLicenses && dbLicenses.length > 0) {
          const existingOrderItemIds = new Set(paidOrderItems.map((oi: any) => oi.id));
          const existingBeatIds = new Set(paidOrderItems.map((oi: any) => oi.beat_id));

          for (const lic of dbLicenses) {
            if (lic.order_item_id && existingOrderItemIds.has(lic.order_item_id)) continue;

            const grossCents = lic.price_cents || 1500000;
            const producerCutCents = lic.producer_amount_cents || Math.round(grossCents * 0.8);

            paidOrderItems.push({
              id: lic.id,
              beat_id: lic.beat_id,
              producer_id: userId,
              price_cents: grossCents,
              producer_amount_cents: producerCutCents,
              license: lic.type || 'premium',
              order: {
                id: lic.order_item_id || lic.id,
                status: 'paid',
                created_at: lic.issued_at,
                buyer: lic.buyer || { display_name: 'Verified Artist', handle: 'artist' }
              },
              beat: lic.beat || { title: 'Studio Instrumental', cover_url: '' }
            });
          }
        }
      } catch (e) {
        console.warn('Error fetching licenses for telemetry:', e);
      }
    }

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

    // 5. Fetch Payouts History & Calculate Available Balance for Withdrawal
    const { data: payouts } = await supabase
      .from('payouts')
      .select('*')
      .eq('producer_id', userId)
      .order('created_at', { ascending: false });

    const totalWithdrawnOrPendingNgn = (payouts || [])
      .filter((p: any) => p.status === 'completed' || p.status === 'pending')
      .reduce((acc: number, p: any) => acc + (Number(p.amount_ngn) || 0), 0);

    const totalEarningsNgn = totalSalesEarningsNgn + downloadRewardNgn;
    const computedAvailableBalanceNgn = Math.max(0, totalEarningsNgn - totalWithdrawnOrPendingNgn);
    const availableBalanceNgn = profile?.available_balance_ngn
      ? Math.max(Number(profile.available_balance_ngn), computedAvailableBalanceNgn)
      : computedAvailableBalanceNgn;

    return NextResponse.json({
      profile: profile || null,
      beats: enrichedBeats,
      totalPlaysCount,
      totalDownloadsCount,
      monthlyDownloadsCount,
      monthlyDownloadThreshold,
      monthlyThresholdPct,
      monthlyDownloadsRemaining,
      currentMonthPeriod,
      combinedActivityCount,
      payThreshold: 10000,
      downloadRewardNgn,
      totalSalesEarningsNgn,
      totalEarningsNgn,
      totalWithdrawnNgn: totalWithdrawnOrPendingNgn,
      availableBalanceNgn,
      licensesSoldCount: paidOrderItems.length,
      orderItems: paidOrderItems,
      payouts: payouts || []
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (err: any) {
    console.error('Error in GET /api/creator/telemetry:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

