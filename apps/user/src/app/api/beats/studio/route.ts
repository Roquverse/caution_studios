import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { TrackItem, FALLBACK_BEATS } from '../../../../types/tracks';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getServiceRoleClient();

    const [beatsRes, licRes, oiRes] = await Promise.all([
      supabase
        .from('beats')
        .select(`
          *,
          producer:producer_id (
            id,
            display_name,
            handle,
            avatar_url
          ),
          licenses:beat_licenses (
            type,
            price_cents,
            enabled
          )
        `)
        .eq('status', 'live')
        .order('created_at', { ascending: false }),
      supabase.from('licenses').select('beat_id'),
      supabase.from('order_items').select('beat_id, order:orders!order_id(status)')
    ]);

    const dbBeats = beatsRes.data;
    const error = beatsRes.error;

    if (error || !dbBeats || dbBeats.length === 0) {
      return NextResponse.json({
        beats: FALLBACK_BEATS,
        freeBeats: FALLBACK_BEATS,
        allBeats: FALLBACK_BEATS
      });
    }

    const licenseCountMap: Record<string, number> = {};
    const orderItemCountMap: Record<string, number> = {};

    if (licRes.data) {
      licRes.data.forEach((l: any) => {
        if (l.beat_id) {
          licenseCountMap[l.beat_id] = (licenseCountMap[l.beat_id] || 0) + 1;
        }
      });
    }

    if (oiRes.data) {
      oiRes.data.forEach((oi: any) => {
        const orderStatus = (oi as any)?.order?.status;
        if (oi.beat_id && (!orderStatus || orderStatus === 'paid' || orderStatus === 'completed')) {
          orderItemCountMap[oi.beat_id] = (orderItemCountMap[oi.beat_id] || 0) + 1;
        }
      });
    }

    const purchaseCountMap: Record<string, number> = {};
    const allBeatIds = new Set([...Object.keys(licenseCountMap), ...Object.keys(orderItemCountMap)]);
    allBeatIds.forEach((id) => {
      purchaseCountMap[id] = Math.max(licenseCountMap[id] || 0, orderItemCountMap[id] || 0);
    });

    const r2Cdn = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') || 'https://media.cautionstudioz.com';
    const resolveAudioKey = (key?: string) => {
      if (!key) return undefined;
      if (key.startsWith('http') || key.startsWith('/')) return key;
      return `${r2Cdn}/${key}`;
    };

    const allMapped: TrackItem[] = dbBeats.map((b: any) => {
      const masterUrl = resolveAudioKey(b.master_wav_key);
      const previewCleanUrl = resolveAudioKey(b.preview_clean_key);
      const previewTaggedUrl = resolveAudioKey(b.preview_tagged_key);

      const audioKey = b.preview_clean_key || b.preview_tagged_key || b.master_wav_key;
      let audioUrl = '';
      if (audioKey) {
        if (audioKey.startsWith('http') || audioKey.startsWith('/')) {
          audioUrl = audioKey;
        } else if (r2Cdn) {
          audioUrl = `${r2Cdn}/${audioKey}`;
        } else {
          audioUrl = `/api/media/${audioKey}`;
        }
      } else {
        audioUrl = `${r2Cdn}/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3`;
      }

      const licenses = Array.isArray(b.licenses) ? b.licenses : Array.isArray(b.beat_licenses) ? b.beat_licenses : [];
      const basicLic = licenses.find((l: any) => l.type === 'basic');
      const premiumLic = licenses.find((l: any) => l.type === 'premium');
      const exclusiveLic = licenses.find((l: any) => l.type === 'exclusive');
      const beatTags: string[] = Array.isArray(b.tags) ? b.tags : [];

      const hasPaidPremium = Boolean(premiumLic && premiumLic.enabled !== false && Number(premiumLic.price_cents) > 100);
      const hasPaidExclusive = Boolean(exclusiveLic && exclusiveLic.enabled !== false && Number(exclusiveLic.price_cents) > 100);
      const hasPaidBasic = Boolean(basicLic && basicLic.enabled !== false && Number(basicLic.price_cents) > 100);

      // A beat is a Paid Beat if it has an enabled paid license
      const isPaidBeat = hasPaidPremium || hasPaidExclusive || hasPaidBasic;
      const isFree = !isPaidBeat;

      const premiumPriceNgn = hasPaidPremium
        ? Math.round(premiumLic.price_cents / 100)
        : (hasPaidExclusive ? Math.max(30000, Math.round(exclusiveLic.price_cents / 100 * 0.25)) : 0);

      const exclusivePriceNgn = hasPaidExclusive
        ? Math.round(exclusiveLic.price_cents / 100)
        : 0;

      const basicPriceNgn = hasPaidBasic
        ? Math.round(basicLic.price_cents / 100)
        : 0;

      const priceNgn = isFree ? 0 : (premiumPriceNgn || basicPriceNgn || exclusivePriceNgn);

      const durationSec = b.duration_seconds || 180;
      const mins = Math.floor(durationSec / 60);
      const secs = Math.floor(durationSec % 60);

      return {
        id: b.id,
        title: b.title,
        artist: b.producer?.display_name || 'Caution Studio',
        subscribers: '@' + (b.producer?.handle || 'caution'),
        tracksCount: `${b.bpm || 120} BPM • ${b.genre || 'Beat'}`,
        date: new Date(b.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        duration: `${mins}:${secs.toString().padStart(2, '0')}`,
        durationSeconds: durationSec,
        coverUrl: b.cover_url || '/images/album_neon_dj.jpg',
        category: isFree ? 'free' : 'playlists',
        audioUrl,
        masterUrl,
        previewCleanUrl,
        previewTaggedUrl,
        bpm: b.bpm || 120,
        genre: b.genre || 'Afrobeats',
        musicalKey: b.musical_key || 'C Minor',
        priceNgn,
        premiumPriceNgn,
        exclusivePriceNgn,
        isFree,
        tags: beatTags,
        playCount: b.play_count || 0,
        downloadCount: Number(b.download_count || b.free_commercial_downloads_count || 0),
        purchaseCount: purchaseCountMap[b.id] || 0
      };
    });

    const freeBeats = allMapped.filter((b) => b.isFree);

    return NextResponse.json({
      beats: allMapped,
      freeBeats,
      allBeats: allMapped
    });
  } catch (err: any) {
    console.error('Error in GET /api/beats/studio:', err);
    return NextResponse.json(
      { beats: FALLBACK_BEATS, freeBeats: FALLBACK_BEATS, allBeats: FALLBACK_BEATS },
      { status: 200 }
    );
  }
}

