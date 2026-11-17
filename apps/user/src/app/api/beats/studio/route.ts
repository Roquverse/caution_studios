import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { TrackItem, FALLBACK_BEATS } from '../../../../types/tracks';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getServiceRoleClient();

    const { data: dbBeats, error } = await supabase
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
      .order('created_at', { ascending: false });

    if (error || !dbBeats || dbBeats.length === 0) {
      return NextResponse.json({
        beats: FALLBACK_BEATS,
        freeBeats: FALLBACK_BEATS,
        allBeats: FALLBACK_BEATS
      });
    }

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

      const licenses = Array.isArray(b.licenses) ? b.licenses : [];
      const basicLic = licenses.find((l: any) => l.type === 'basic');
      const premiumLic = licenses.find((l: any) => l.type === 'premium');
      const exclusiveLic = licenses.find((l: any) => l.type === 'exclusive');
      const beatTags: string[] = Array.isArray(b.tags) ? b.tags : [];

      const paidLicensesDisabled =
        licenses.length > 0 &&
        (!premiumLic || premiumLic.enabled === false || premiumLic.price_cents <= 100) &&
        (!exclusiveLic || exclusiveLic.enabled === false || exclusiveLic.price_cents <= 100);

      const isFreeTagged =
        (basicLic?.price_cents !== undefined && basicLic.price_cents <= 100) ||
        paidLicensesDisabled ||
        b.is_free_beat === true ||
        beatTags.some((t: string) => t.toLowerCase() === 'free' || t.toLowerCase() === 'free download') ||
        b.title?.toLowerCase().includes('(free)') ||
        b.title?.toLowerCase().includes('[free]') ||
        b.category === 'free';

      const rawPrice = basicLic?.price_cents ? basicLic.price_cents / 100 : (isFreeTagged ? 0 : 3000);
      const priceNgn = isFreeTagged || rawPrice <= 1 ? 0 : rawPrice;
      const exclusivePriceNgn = isFreeTagged
        ? 0
        : exclusiveLic?.price_cents
        ? exclusiveLic.price_cents / 100
        : 50000;

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
        category: isFreeTagged ? 'free' : 'playlists',
        audioUrl,
        masterUrl,
        previewCleanUrl,
        previewTaggedUrl,
        bpm: b.bpm || 120,
        genre: b.genre || 'Afrobeats',
        musicalKey: b.musical_key || 'C Minor',
        priceNgn,
        exclusivePriceNgn,
        isFree: isFreeTagged,
        tags: beatTags,
        playCount: b.play_count || 0
      };
    });

    const freeBeats = allMapped.filter((b) => b.isFree || !b.priceNgn || b.priceNgn <= 1);

    // Sort allBeats so Free Beats appear first, followed by the rest of the catalog
    const sortedAllBeats = [
      ...freeBeats,
      ...allMapped.filter((b) => !(b.isFree || !b.priceNgn || b.priceNgn <= 1))
    ];

    return NextResponse.json({
      beats: sortedAllBeats,
      freeBeats,
      allBeats: sortedAllBeats
    });
  } catch (err: any) {
    console.error('Error in GET /api/beats/studio:', err);
    return NextResponse.json(
      { beats: FALLBACK_BEATS, freeBeats: FALLBACK_BEATS, allBeats: FALLBACK_BEATS },
      { status: 200 }
    );
  }
}

