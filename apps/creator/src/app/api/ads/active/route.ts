import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
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

    if (validCampaigns.length > 0) {
      // Fisher-Yates shuffle for true random distribution
      const shuffled = [...validCampaigns];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return NextResponse.json({ ads: shuffled, count: shuffled.length });
    }

    // Default high-converting fallbacks if no database ads are active yet
    const fallbacks = [
      {
        id: 'promo-fallback-1',
        song_title: 'Midnight Lagos',
        artist_name: 'Teniola Sound',
        campaign_name: 'Stream the new breakout single "Midnight Lagos" out on all DSPs now!',
        genre: 'Afro-Soul',
        cover_url: '/images/artist_studio_mic.jpg',
        spotify_url: 'https://open.spotify.com',
        apple_music_url: 'https://music.apple.com',
        audiomack_url: 'https://audiomack.com',
        youtube_url: 'https://youtube.com',
        status: 'active'
      },
      {
        id: 'promo-fallback-2',
        song_title: 'Golden Horizon',
        artist_name: 'Zino Waves',
        campaign_name: 'Infectious Amapiano summer fusion playing across clubs & radio.',
        genre: 'Amapiano',
        cover_url: '/images/album_sunrise.jpg',
        spotify_url: 'https://open.spotify.com',
        apple_music_url: 'https://music.apple.com',
        audiomack_url: 'https://audiomack.com',
        youtube_url: 'https://youtube.com',
        status: 'active'
      }
    ];

    // Pick random fallback
    const shuffledFallbacks = fallbacks.sort(() => 0.5 - Math.random());
    return NextResponse.json({ ads: shuffledFallbacks, count: shuffledFallbacks.length });
  } catch (err: any) {
    console.error('Active ads route error:', err);
    return NextResponse.json({ error: 'Failed to fetch ads', ads: [] }, { status: 500 });
  }
}
