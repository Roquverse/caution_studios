import { NextRequest, NextResponse } from 'next/server';
import { supabase as publicSupabase, getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    let userId = req.nextUrl.searchParams.get('userId') || null;
    let userEmail: string | null = null;

    // 1. Resolve authentication
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const { data: { user } } = await publicSupabase.auth.getUser(token);
      if (user?.id) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    if (!userId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/(?:^|;\s*)sb-token=([^;]+)/);
      if (match && match[1]) {
        try {
          const token = decodeURIComponent(match[1]);
          const { data: { user } } = await publicSupabase.auth.getUser(token);
          if (user?.id) {
            userId = user.id;
            userEmail = user.email || null;
          }
        } catch (e) {}
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Producer session required' }, { status: 401 });
    }

    // 2. Fetch Producer Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!userEmail) {
      userEmail = profile?.email || null;
    }

    const isAdminAccount = Boolean(
      profile?.roles?.includes('admin') ||
      profile?.handle?.toLowerCase().includes('admin') ||
      (userEmail && (
        userEmail.toLowerCase().includes('admin') ||
        userEmail.toLowerCase() === 'damicoledj@gmail.com'
      ))
    );

    // 3. Fetch Producer's beats for telemetry counts
    const { data: producerBeats } = await supabase
      .from('beats')
      .select('id, play_count, download_count, free_commercial_downloads_count')
      .eq('producer_id', userId);

    const totalPlaysCount = (producerBeats || []).reduce((acc, b) => acc + (Number(b.play_count) || 0), 0);
    const totalDownloadsCount = (producerBeats || []).reduce(
      (acc, b) => acc + (Number(b.free_commercial_downloads_count || b.download_count) || 0),
      0
    );

    // 4. Fetch all paid order items with full relations (via service role to bypass client RLS)
    const { data: orderItems, error: oiErr } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        beat_id,
        producer_id,
        license,
        price_cents,
        producer_amount_cents,
        platform_fee_cents,
        order:orders!order_id (
          id,
          buyer_id,
          status,
          total_cents,
          paystack_reference,
          created_at,
          buyer:profiles!buyer_id (
            id,
            display_name,
            handle,
            avatar_url
          )
        ),
        beat:beats!beat_id (
          id,
          title,
          slug,
          genre,
          cover_url,
          bpm,
          duration_seconds,
          producer_id,
          producer:profiles!producer_id (
            id,
            display_name,
            handle,
            avatar_url
          )
        )
      `)
      .order('id', { ascending: false });

    if (oiErr) {
      console.error('Error querying order_items in /api/creator/licenses:', oiErr);
    }

    // 5. Fetch licenses table records
    const { data: dbLicenses } = await supabase
      .from('licenses')
      .select(`
        id,
        order_item_id,
        buyer_id,
        beat_id,
        type,
        stream_cap,
        video_cap,
        agreement_pdf_key,
        issued_at,
        license_number,
        price_cents,
        producer_amount_cents,
        status
      `);

    const licensesByOrderItemId = new Map<string, any>();
    const licensesByBeatId = new Map<string, any[]>();
    (dbLicenses || []).forEach((lic) => {
      if (lic.order_item_id) {
        licensesByOrderItemId.set(lic.order_item_id, lic);
      }
      if (lic.beat_id) {
        const arr = licensesByBeatId.get(lic.beat_id) || [];
        arr.push(lic);
        licensesByBeatId.set(lic.beat_id, arr);
      }
    });

    // 6. Map and harmonize license records
    const records: any[] = [];
    const seenItemIds = new Set<string>();

    for (const item of (orderItems || [])) {
      const order = Array.isArray(item.order) ? item.order[0] : item.order;
      if (order && order.status && order.status !== 'paid') continue;

      const beat = Array.isArray(item.beat) ? item.beat[0] : item.beat;
      const producer = Array.isArray(beat?.producer) ? beat.producer[0] : (beat?.producer || null);
      const buyer = Array.isArray(order?.buyer) ? order.buyer[0] : (order?.buyer || null);

      const lic = licensesByOrderItemId.get(item.id) || null;
      const rawTier = (lic?.type || item.license || 'premium').toLowerCase();

      let tierName = 'Premium Lease (WAV + Stems)';
      let coverage = 'Commercial Video Sync & Streaming (Up to 500,000 streams)';

      if (rawTier === 'exclusive') {
        tierName = '100% Exclusive Rights Buyout';
        coverage = 'Perpetual Worldwide · Unlimited Distribution · Master Ownership';
      } else if (rawTier === 'basic') {
        tierName = 'Starter MP3 Lease';
        coverage = 'Social Media Sync & Streaming (Up to 100,000 streams)';
      }

      const grossPriceNgn = Math.round((item.price_cents || lic?.price_cents || 1500000) / 100);
      const payoutNgn = Math.round((item.producer_amount_cents || lic?.producer_amount_cents || (item.price_cents ? item.price_cents * 0.8 : 1200000)) / 100);

      const isOwnBeat = (item.producer_id === userId) || (beat?.producer_id === userId);

      const issuedDateStr = lic?.issued_at || order?.created_at
        ? new Date(lic?.issued_at || order?.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : 'Recent';

      seenItemIds.add(item.id);

      records.push({
        id: item.id,
        licenseNumber: lic?.license_number || `CS-LIC-${item.id.slice(0, 8).toUpperCase()}`,
        reference: order?.paystack_reference || `lic-${item.id.slice(0, 8)}`,
        beatId: item.beat_id || beat?.id,
        beatTitle: beat?.title || 'Studio Master Instrumental',
        beatCoverUrl: beat?.cover_url || '/images/studio_mixing_console.jpg',
        buyerId: order?.buyer_id || buyer?.id,
        buyerName: buyer?.display_name || 'Verified Artist',
        buyerHandle: buyer?.handle ? `@${buyer.handle}` : '@artist',
        producerId: item.producer_id || beat?.producer_id,
        producerName: producer?.display_name || 'Caution Studio Producer',
        producerHandle: producer?.handle ? `@${producer.handle}` : '@creator',
        tier: tierName,
        rawTier,
        priceNgn: grossPriceNgn,
        creatorPayoutNgn: payoutNgn,
        issuedAt: issuedDateStr,
        coverage,
        status: 'Active & Whitelisted',
        agreementPdfKey: lic?.agreement_pdf_key || null,
        isOwnBeat
      });
    }

    return NextResponse.json({
      licenses: records,
      isExecutiveAdmin: isAdminAccount,
      totalPlaysCount,
      totalDownloadsCount
    });
  } catch (err: any) {
    console.error('Error in GET /api/creator/licenses:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
