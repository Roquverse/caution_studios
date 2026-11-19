import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { verifyAdminRequest } from '../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET /api/licenses - Returns all songs with their uploaded producers, configured licenses, and all issued generated licenses (Executive Only)
export async function GET(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const supabase = getServiceRoleClient();

    // 1. Fetch all songs/beats with their uploader/producer profile
    const { data: beats, error: beatsErr } = await supabase
      .from('beats')
      .select(`
        id,
        title,
        slug,
        genre,
        bpm,
        musical_key,
        cover_url,
        status,
        duration_seconds,
        play_count,
        like_count,
        created_at,
        producer_id,
        producer:profiles!producer_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (beatsErr) {
      console.error('Error fetching beats for licenses:', beatsErr);
      return NextResponse.json({ error: beatsErr.message }, { status: 500 });
    }

    // 2. Fetch all configured license tiers for beats
    const { data: beatLicenses, error: blErr } = await supabase
      .from('beat_licenses')
      .select('beat_id, type, price_cents, enabled');

    if (blErr) console.warn('Could not fetch beat_licenses:', blErr);

    // 3. Fetch all generated / issued licenses
    const { data: issuedLicenses, error: licErr } = await supabase
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
        buyer:profiles!buyer_id (
          id,
          display_name,
          handle,
          avatar_url
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
        ),
        order_item:order_items!order_item_id (
          id,
          price_cents,
          platform_fee_cents,
          producer_amount_cents,
          order:orders!order_id (
            id,
            paystack_reference,
            total_cents,
            status,
            created_at
          )
        )
      `)
      .order('issued_at', { ascending: false });

    if (licErr) console.warn('Could not fetch issued licenses:', licErr);

    // 4. Also fetch all paid order items to guarantee 100% sync
    const { data: allOrderItems } = await supabase
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

    // Format issued licenses list
    const seenOrderItemIds = new Set<string>();
    const seenLicenseIds = new Set<string>();

    const formattedIssued: any[] = [];

    (issuedLicenses || []).forEach((lic: any) => {
      seenLicenseIds.add(lic.id);
      if (lic.order_item_id) seenOrderItemIds.add(lic.order_item_id);

      const beat = lic.beat || {};
      const producer = beat.producer || {};
      const buyer = lic.buyer || {};
      const orderItem = lic.order_item || {};
      const order = orderItem.order || {};

      formattedIssued.push({
        id: lic.id,
        type: lic.type || 'premium',
        stream_cap: lic.stream_cap || 500000,
        video_cap: lic.video_cap || 1,
        agreement_pdf_key: lic.agreement_pdf_key,
        issued_at: lic.issued_at || order.created_at,
        price_cents: orderItem.price_cents || order.total_cents || 1500000,
        reference: order.paystack_reference || `lic-${(lic.order_item_id || lic.id).substring(0, 8)}`,
        song: {
          id: beat.id || lic.beat_id,
          title: beat.title || 'Untitled Master',
          slug: beat.slug,
          genre: beat.genre || 'Afrobeats',
          cover_url: beat.cover_url || '/images/album_neon_dj.jpg'
        },
        producer: {
          id: producer.id || beat.producer_id,
          display_name: producer.display_name || 'Caution Studio Producer',
          handle: producer.handle || 'producer',
          avatar_url: producer.avatar_url || null
        },
        buyer: {
          id: buyer.id || lic.buyer_id,
          display_name: buyer.display_name || 'Licensed Creator',
          handle: buyer.handle || 'creator',
          avatar_url: buyer.avatar_url || null
        }
      });
    });

    // Merge any paid order items not already recorded in licenses
    (allOrderItems || []).forEach((item: any) => {
      if (seenOrderItemIds.has(item.id)) return;
      const order = Array.isArray(item.order) ? item.order[0] : item.order;
      if (order && order.status && order.status !== 'paid') return;

      const beat = Array.isArray(item.beat) ? item.beat[0] : item.beat;
      const producer = beat?.producer || null;
      const buyer = order?.buyer || null;

      seenOrderItemIds.add(item.id);

      formattedIssued.push({
        id: item.id,
        type: item.license || 'premium',
        stream_cap: item.license === 'exclusive' ? 0 : 500000,
        video_cap: 1,
        agreement_pdf_key: `licenses/${item.id}/agreement.pdf`,
        issued_at: order?.created_at || new Date().toISOString(),
        price_cents: item.price_cents || order?.total_cents || 1500000,
        reference: order?.paystack_reference || `lic-${item.id.substring(0, 8)}`,
        song: {
          id: beat?.id || item.beat_id,
          title: beat?.title || 'Studio Master Instrumental',
          slug: beat?.slug,
          genre: beat?.genre || 'Afrobeats',
          cover_url: beat?.cover_url || '/images/album_neon_dj.jpg'
        },
        producer: {
          id: producer?.id || item.producer_id,
          display_name: producer?.display_name || 'Caution Studio Producer',
          handle: producer?.handle || 'producer',
          avatar_url: producer?.avatar_url || null
        },
        buyer: {
          id: buyer?.id || order?.buyer_id,
          display_name: buyer?.display_name || 'Licensed Creator',
          handle: buyer?.handle || 'creator',
          avatar_url: buyer?.avatar_url || null
        }
      });
    });

    // Sort by newest first
    formattedIssued.sort((a, b) => new Date(b.issued_at || 0).getTime() - new Date(a.issued_at || 0).getTime());

    // Map configured licenses by beat_id
    const licensesByBeat = new Map<string, any[]>();
    (beatLicenses || []).forEach((bl) => {
      const list = licensesByBeat.get(bl.beat_id) || [];
      list.push(bl);
      licensesByBeat.set(bl.beat_id, list);
    });

    // Count issued licenses per beat
    const issuedCountByBeat = new Map<string, number>();
    formattedIssued.forEach((lic) => {
      const bId = lic.song?.id;
      if (bId) {
        const current = issuedCountByBeat.get(bId) || 0;
        issuedCountByBeat.set(bId, current + 1);
      }
    });

    // Format songs catalog list with uploader & license options
    const songsWithLicenses = (beats || []).map((beat: any) => {
      const configured = licensesByBeat.get(beat.id) || [
        { type: 'basic', price_cents: 1500000, enabled: true },
        { type: 'premium', price_cents: 4500000, enabled: true },
        { type: 'exclusive', price_cents: 25000000, enabled: true }
      ];

      return {
        id: beat.id,
        title: beat.title,
        slug: beat.slug,
        genre: beat.genre || 'Afrobeats',
        bpm: beat.bpm || 120,
        cover_url: beat.cover_url || '/images/album_neon_dj.jpg',
        status: beat.status,
        duration_seconds: beat.duration_seconds,
        created_at: beat.created_at,
        uploader: {
          id: beat.producer?.id || beat.producer_id,
          display_name: beat.producer?.display_name || 'Caution Studio Producer',
          handle: beat.producer?.handle || 'caution_producer',
          avatar_url: beat.producer?.avatar_url || null
        },
        licenseTiers: configured,
        generatedLicenseCount: issuedCountByBeat.get(beat.id) || 0
      };
    });

    // Summary telemetry
    const uniqueProducers = new Set((beats || []).map((b) => b.producer_id)).size;
    const totalIssuedRevenueCents = formattedIssued.reduce(
      (sum, l) => sum + (l.price_cents || 0),
      0
    );

    return NextResponse.json({
      songs: songsWithLicenses,
      issuedLicenses: formattedIssued,
      metrics: {
        totalSongs: beats ? beats.length : 0,
        totalIssued: formattedIssued.length,
        totalIssuedRevenue: totalIssuedRevenueCents / 100,
        uniqueProducers
      }
    });
  } catch (err: any) {
    console.error('Error fetching admin licenses:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
