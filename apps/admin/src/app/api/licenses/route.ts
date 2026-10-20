import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

// GET /api/licenses - Returns all songs with their uploaded producers, configured licenses, and all issued generated licenses
export async function GET(req: NextRequest) {
  try {
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

    // Map configured licenses by beat_id
    const licensesByBeat = new Map<string, any[]>();
    (beatLicenses || []).forEach((bl) => {
      const list = licensesByBeat.get(bl.beat_id) || [];
      list.push(bl);
      licensesByBeat.set(bl.beat_id, list);
    });

    // Count issued licenses per beat
    const issuedCountByBeat = new Map<string, number>();
    (issuedLicenses || []).forEach((lic) => {
      const current = issuedCountByBeat.get(lic.beat_id) || 0;
      issuedCountByBeat.set(lic.beat_id, current + 1);
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

    // Format issued licenses list
    const formattedIssued = (issuedLicenses || []).map((lic: any) => {
      const beat = lic.beat || {};
      const producer = beat.producer || {};
      const buyer = lic.buyer || {};
      const orderItem = lic.order_item || {};
      const order = orderItem.order || {};

      return {
        id: lic.id,
        type: lic.type || 'basic',
        stream_cap: lic.stream_cap || 100000,
        video_cap: lic.video_cap || 1,
        agreement_pdf_key: lic.agreement_pdf_key,
        issued_at: lic.issued_at,
        price_cents: orderItem.price_cents || order.total_cents || 1500000,
        reference: order.paystack_reference || `LIC-${lic.id.substring(0, 8).toUpperCase()}`,
        song: {
          id: beat.id || lic.beat_id,
          title: beat.title || 'Untitled Master',
          slug: beat.slug,
          genre: beat.genre,
          cover_url: beat.cover_url || '/images/album_neon_dj.jpg'
        },
        producer: {
          id: producer.id || beat.producer_id,
          display_name: producer.display_name || 'Studio Producer',
          handle: producer.handle || 'producer',
          avatar_url: producer.avatar_url || null
        },
        buyer: {
          id: buyer.id || lic.buyer_id,
          display_name: buyer.display_name || 'Licensed Creator',
          handle: buyer.handle || 'creator',
          avatar_url: buyer.avatar_url || null
        }
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
