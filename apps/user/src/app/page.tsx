import { supabase } from '../lib/supabaseClient';
import UserPortalClient from './UserPortalClient';
import { TrackItem, ProducerItem, FALLBACK_BEATS, FALLBACK_PRODUCERS } from '../types/tracks';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UserPortalPage() {
  let initialBeats: TrackItem[] = FALLBACK_BEATS;
  let initialProducers: ProducerItem[] = FALLBACK_PRODUCERS;

  try {
    const { data: dbBeats, error: beatErr } = await supabase
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
      initialBeats = dbBeats.map((b) => {
        const audioKey = b.master_wav_key || b.preview_clean_key || b.preview_tagged_key;
        const audioUrl = audioKey ? `/api/media/${audioKey}` : '';
        const basicLic = b.licenses?.find((l: any) => l.type === 'basic');
        const priceNgn = basicLic?.price_cents ? basicLic.price_cents / 100 : 3000;
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
          category: 'playlists',
          audioUrl,
          bpm: b.bpm || 120,
          genre: b.genre || 'Electronic',
          musicalKey: b.musical_key || 'C Minor',
          priceNgn,
          playCount: b.play_count || 0
        };
      });
    }

    const beatProducerIds = new Set((dbBeats || []).map((b: any) => b.producer_id).filter(Boolean));

    const { data: dbProfiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbProfiles && dbProfiles.length > 0) {
      const producerProfiles = dbProfiles.filter((p: any) => {
        const roles: string[] = Array.isArray(p.roles) ? p.roles : [];
        const isExplicitProducer = roles.includes('producer');
        const isAdminAccount =
          p.handle?.toLowerCase().includes('admin') ||
          p.display_name?.toLowerCase().includes('studio admin') ||
          p.display_name?.toLowerCase().includes('master admin');
        const hasUploadedBeats = beatProducerIds.has(p.id);

        return (isExplicitProducer && !isAdminAccount) || hasUploadedBeats;
      });

      if (producerProfiles.length > 0) {
        initialProducers = producerProfiles.map((p, idx) => ({
          rank: idx + 1,
          name: p.display_name || p.handle || 'Caution Producer',
          subscribers: `@${p.handle || 'caution'} • Verified Producer`,
          coverUrl: p.avatar_url || '/images/artist_studio_mic.jpg',
          handle: p.handle || 'caution'
        }));
      }
    }
  } catch (err) {
    console.warn('Could not load database beats on server SSR:', err);
  }

  return (
    <UserPortalClient
      initialBeats={initialBeats}
      initialProducers={initialProducers}
    />
  );
}
