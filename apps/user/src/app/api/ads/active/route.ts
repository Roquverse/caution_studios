import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedType = searchParams.get('type') || 'listening'; // 'listening' | 'download'

    const supabase = getServiceRoleClient();
    const { data: campaigns, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching active ad campaigns:', error.message);
    }

    const validCampaigns = (campaigns || []).filter(
      (c) => c.audio_url && c.audio_url.trim().length > 0 && (c.target_plays == null || (c.delivered_plays || 0) < c.target_plays)
    );

    // Filter by requested ad type (listening vs download)
    let filtered = validCampaigns.filter((c) => {
      const type = (c as any).ad_type;
      const name = (c.campaign_name || '').toLowerCase();
      const pkg = (c.package_name || '').toLowerCase();

      if (requestedType === 'download') {
        if (type === 'download' || name.includes('download') || pkg.includes('download')) return true;
        if (!type || type === 'all') return true;
        return false;
      } else {
        if (type === 'listening' || name.includes('stream') || name.includes('listen')) return true;
        if (!type || type === 'all') return true;
        return false;
      }
    });

    if (filtered.length === 0 && validCampaigns.length > 0) {
      filtered = validCampaigns;
    }

    if (filtered.length > 0) {
      // Fisher-Yates shuffle for true random distribution
      const shuffled = [...filtered];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return NextResponse.json({ ads: shuffled, count: shuffled.length, type: requestedType });
    }

    // Default high-converting fallbacks tailored for listening vs downloads
    const listeningFallbacks = [
      {
        id: 'promo-fallback-listening-1',
        song_title: 'Midnight Lagos',
        artist_name: 'Teniola Sound',
        campaign_name: 'Stream the new breakout single "Midnight Lagos" out on all DSPs now!',
        genre: 'Afro-Soul',
        cover_url: '/images/artist_studio_mic.jpg',
        audio_url: 'https://media.cautionstudioz.com/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3',
        spotify_url: 'https://open.spotify.com',
        apple_music_url: 'https://music.apple.com',
        audiomack_url: 'https://audiomack.com',
        youtube_url: 'https://youtube.com',
        status: 'active',
        ad_type: 'listening'
      },
      {
        id: 'promo-fallback-listening-2',
        song_title: 'Golden Horizon',
        artist_name: 'Zino Waves',
        campaign_name: 'Infectious Amapiano summer fusion playing across clubs & radio.',
        genre: 'Amapiano',
        cover_url: '/images/album_sunrise.jpg',
        audio_url: 'https://media.cautionstudioz.com/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3',
        spotify_url: 'https://open.spotify.com',
        apple_music_url: 'https://music.apple.com',
        audiomack_url: 'https://audiomack.com',
        youtube_url: 'https://youtube.com',
        status: 'active',
        ad_type: 'listening'
      }
    ];

    const downloadFallbacks = [
      {
        id: 'promo-fallback-download-1',
        song_title: 'Lagos Nightdrive',
        artist_name: 'Seyi Blaze',
        campaign_name: 'Sponsored Download: Stream 15s to unlock your free high-definition beat master!',
        genre: 'Afro-Fusion',
        cover_url: '/images/hero_boombox.jpg',
        audio_url: 'https://media.cautionstudioz.com/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3',
        spotify_url: 'https://open.spotify.com',
        apple_music_url: 'https://music.apple.com',
        audiomack_url: 'https://audiomack.com',
        youtube_url: 'https://youtube.com',
        status: 'active',
        ad_type: 'download'
      },
      {
        id: 'promo-fallback-download-2',
        song_title: 'Soundstage Vibe',
        artist_name: 'Caution All-Stars',
        campaign_name: 'Unlock 1 extra beat download per 15s sponsor audition (restricted to 2 extra/day).',
        genre: 'Highlife Drill',
        cover_url: '/images/album_neon_dj.jpg',
        audio_url: 'https://media.cautionstudioz.com/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3',
        spotify_url: 'https://open.spotify.com',
        apple_music_url: 'https://music.apple.com',
        audiomack_url: 'https://audiomack.com',
        youtube_url: 'https://youtube.com',
        status: 'active',
        ad_type: 'download'
      }
    ];

    const chosenFallbacks = requestedType === 'download' ? downloadFallbacks : listeningFallbacks;
    const shuffledFallbacks = chosenFallbacks.sort(() => 0.5 - Math.random());
    return NextResponse.json({ ads: shuffledFallbacks, count: shuffledFallbacks.length, type: requestedType });
  } catch (err: any) {
    console.error('Active ads route error:', err);
    return NextResponse.json({ error: 'Failed to fetch ads', ads: [] }, { status: 500 });
  }
}

