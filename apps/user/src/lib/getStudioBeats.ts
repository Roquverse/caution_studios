import { supabase } from './supabaseClient';
import { TrackItem, ProducerItem, FALLBACK_BEATS, FALLBACK_PRODUCERS } from '../types/tracks';

export async function getStudioBeats(): Promise<{ beats: TrackItem[]; producers: ProducerItem[] }> {
  let beats: TrackItem[] = FALLBACK_BEATS;
  let producers: ProducerItem[] = FALLBACK_PRODUCERS;

  try {
    const { data: dbBeats } = await supabase
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

    if (dbBeats && dbBeats.length > 0) {
      beats = dbBeats.map((b) => {
        const audioKey = b.master_wav_key || b.preview_clean_key || b.preview_tagged_key;
        let audioUrl = '';
        if (audioKey) {
          audioUrl = audioKey.startsWith('http') || audioKey.startsWith('/') ? audioKey : `/api/media/${audioKey}`;
        } else {
          audioUrl = '/api/media/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3';
        }
        const basicLic = b.licenses?.find((l: any) => l.type === 'basic');
        const exclusiveLic = b.licenses?.find((l: any) => l.type === 'exclusive');
        const beatTags: string[] = Array.isArray(b.tags) ? b.tags : [];
        const isFreeTagged =
          beatTags.some((t: string) => t.toLowerCase() === 'free' || t.toLowerCase() === 'free download') ||
          b.title?.toLowerCase().includes('(free)') ||
          b.title?.toLowerCase().includes('[free]') ||
          b.category === 'free';

        const priceNgn = isFreeTagged
          ? 0
          : basicLic?.price_cents
          ? basicLic.price_cents / 100
          : 3000;
        const exclusivePriceNgn = exclusiveLic?.price_cents
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
          bpm: b.bpm || 120,
          genre: b.genre || 'Electronic',
          musicalKey: b.musical_key || 'C Minor',
          priceNgn,
          exclusivePriceNgn,
          isFree: isFreeTagged,
          tags: beatTags,
          playCount: b.play_count || 0
        };
      });
    }

    const { data: dbProfiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbProfiles && dbProfiles.length > 0) {
      const beatProducerIds = new Set((dbBeats || []).map((b: any) => b.producer_id).filter(Boolean));
      const producerProfiles = dbProfiles.filter((p: any) => {
        const roles: string[] = Array.isArray(p.roles) ? p.roles : [];
        const isExplicitProducer = roles.includes('producer');
        const isAdminAccount =
          p.handle?.toLowerCase().includes('admin') ||
          p.display_name?.toLowerCase().includes('studio admin') ||
          p.display_name?.toLowerCase().includes('caution team');
        const hasUploadedBeats = beatProducerIds.has(p.id);
        return (isExplicitProducer && !isAdminAccount) || hasUploadedBeats;
      });

      if (producerProfiles.length > 0) {
        producers = producerProfiles.map((p: any, idx: number) => ({
          rank: idx + 1,
          name: p.display_name || p.handle || 'Caution Producer',
          subscribers: `@${p.handle || 'caution'} • Verified Producer`,
          coverUrl: p.avatar_url || '/images/artist_studio_mic.jpg',
          handle: p.handle || 'caution'
        }));
      }
    }
  } catch (err) {
    console.warn('Error fetching studio beats, using fallbacks:', err);
  }

  return { beats, producers };
}
