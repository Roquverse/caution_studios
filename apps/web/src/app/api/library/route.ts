import { NextRequest, NextResponse } from 'next/server';
import { supabase as publicSupabase, getServiceRoleClient } from '../../../lib/supabaseClient';
import { getPresignedDownloadUrl } from '../../../lib/r2Server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    let userId = req.nextUrl.searchParams.get('userId') || null;
    let userEmail: string | null = null;

    // 1. Identify user from Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const { data: { user } } = await publicSupabase.auth.getUser(token);
      if (user?.id) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    // 2. Identify user from cookies if not provided
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
      return NextResponse.json({ items: [] });
    }

    // Fetch user profile email if not extracted yet
    if (!userEmail) {
      try {
        const { data: prof } = await supabase.from('profiles').select('email').eq('id', userId).maybeSingle();
        if (prof?.email) userEmail = prof.email;
      } catch (e) {}
    }

    const purchasedItems: any[] = [];
    const seenBeatIds = new Set<string>();

    // 3. Query licenses table for buyer
    try {
      const { data: licenses } = await supabase
        .from('licenses')
        .select(`
          id,
          order_id,
          order_item_id,
          type,
          license_type,
          license_number,
          stream_cap,
          issued_at,
          pdf_url,
          agreement_pdf_key,
          beat:beat_id (
            id,
            title,
            bpm,
            genre,
            cover_url,
            master_wav_key,
            stems_zip_key,
            producer:producer_id (
              id,
              display_name,
              handle
            )
          )
        `)
        .eq('buyer_id', userId)
        .order('issued_at', { ascending: false });

      if (licenses && licenses.length > 0) {
        for (const lic of licenses) {
          const beat = lic.beat as any;
          if (!beat || seenBeatIds.has(beat.id)) continue;
          seenBeatIds.add(beat.id);

          let masterWavUrl: string | null = null;
          let stemsZipUrl: string | null = null;

          if (beat.master_wav_key) {
            try {
              masterWavUrl = await getPresignedDownloadUrl(beat.master_wav_key, `${beat.title} - Master WAV.wav`, 60 * 60 * 24);
            } catch (e) {
              masterWavUrl = `/api/media/${encodeURIComponent(beat.master_wav_key)}?download=1&filename=${encodeURIComponent(`${beat.title} - Master WAV.wav`)}`;
            }
          }

          if (beat.stems_zip_key) {
            try {
              stemsZipUrl = await getPresignedDownloadUrl(beat.stems_zip_key, `${beat.title} - Stems.zip`, 60 * 60 * 24);
            } catch (e) {
              stemsZipUrl = `/api/media/${encodeURIComponent(beat.stems_zip_key)}?download=1&filename=${encodeURIComponent(`${beat.title} - Stems.zip`)}`;
            }
          }

          const rawType = lic.type || lic.license_type || 'premium';
          const formattedType =
            rawType === 'exclusive' ? 'Exclusive License' : rawType === 'basic' ? 'Starter Lease' : 'Premium Beat Plan';

          purchasedItems.push({
            licenseId: lic.license_number || `lic-${(lic.order_item_id || lic.id).slice(0, 8)}`,
            beat: {
              id: beat.id,
              title: beat.title,
              bpm: beat.bpm || 110,
              genre: beat.genre || 'Afrobeats',
              cover_url: beat.cover_url || '/images/studio_mixing_console.jpg',
              producer: beat.producer || { display_name: 'Studio Producer', handle: 'producer' }
            },
            type: formattedType,
            rawType,
            issuedDate: lic.issued_at
              ? new Date(lic.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recently Purchased',
            streamCap: lic.stream_cap || (rawType === 'exclusive' ? null : 500000),
            streamsUsed: 0,
            hasStems: !!beat.stems_zip_key,
            masterWavUrl,
            stemsZipUrl,
            agreementPdfKey: lic.agreement_pdf_key || lic.pdf_url || null
          });
        }
      }
    } catch (err) {
      console.warn('Error reading licenses in /api/library:', err);
    }

    // 4. Also query paid orders with order_items
    try {
      const { data: paidOrders } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          created_at,
          paystack_reference,
          order_items (
            id,
            license,
            price_cents,
            beat:beat_id (
              id,
              title,
              bpm,
              genre,
              cover_url,
              master_wav_key,
              stems_zip_key,
              producer:producer_id (
                id,
                display_name,
                handle
              )
            )
          )
        `)
        .eq('buyer_id', userId)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (paidOrders && paidOrders.length > 0) {
        for (const order of paidOrders) {
          const items = (order as any).order_items || [];
          for (const item of items) {
            const beat = item.beat;
            if (!beat || seenBeatIds.has(beat.id)) continue;
            seenBeatIds.add(beat.id);

            let masterWavUrl: string | null = null;
            let stemsZipUrl: string | null = null;

            if (beat.master_wav_key) {
              try {
                masterWavUrl = await getPresignedDownloadUrl(beat.master_wav_key, `${beat.title} - Master WAV.wav`, 60 * 60 * 24);
              } catch (e) {
                masterWavUrl = `/api/media/${encodeURIComponent(beat.master_wav_key)}?download=1&filename=${encodeURIComponent(`${beat.title} - Master WAV.wav`)}`;
              }
            }

            if (beat.stems_zip_key) {
              try {
                stemsZipUrl = await getPresignedDownloadUrl(beat.stems_zip_key, `${beat.title} - Stems.zip`, 60 * 60 * 24);
              } catch (e) {
                stemsZipUrl = `/api/media/${encodeURIComponent(beat.stems_zip_key)}?download=1&filename=${encodeURIComponent(`${beat.title} - Stems.zip`)}`;
              }
            }

            const rawType = item.license || 'premium';
            const formattedType =
              rawType === 'exclusive' ? 'Exclusive License' : rawType === 'basic' ? 'Starter Lease' : 'Premium Beat Plan';

            purchasedItems.push({
              licenseId: `lic-${item.id.slice(0, 8)}`,
              beat: {
                id: beat.id,
                title: beat.title,
                bpm: beat.bpm || 110,
                genre: beat.genre || 'Afrobeats',
                cover_url: beat.cover_url || '/images/studio_mixing_console.jpg',
                producer: beat.producer || { display_name: 'Studio Producer', handle: 'producer' }
              },
              type: formattedType,
              rawType,
              issuedDate: order.created_at
                ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently Purchased',
              streamCap: rawType === 'exclusive' ? null : 500000,
              streamsUsed: 0,
              hasStems: !!beat.stems_zip_key,
              masterWavUrl,
              stemsZipUrl,
              agreementPdfKey: null
            });
          }
        }
      }
    } catch (err) {
      console.warn('Error reading orders in /api/library:', err);
    }

    return NextResponse.json({
      items: purchasedItems
    });
  } catch (err: any) {
    console.error('Error in GET /api/library:', err);
    return NextResponse.json({ error: err.message || 'Server error', items: [] }, { status: 500 });
  }
}
