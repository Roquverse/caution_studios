import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { sendAdminNotification } from '../../../lib/emailNotifier';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabase
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: campaigns, error } = await query;

    if (error) {
      console.error('Error fetching admin ads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaigns: campaigns || [] });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/ads:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      songTitle,
      artistName,
      campaignName,
      packageName,
      priceNgn,
      targetPlays,
      audioUrl,
      coverUrl,
      spotifyUrl,
      appleMusicUrl,
      audiomackUrl,
      youtubeUrl,
      status
    } = body;

    if (!songTitle || !artistName) {
      return NextResponse.json({ error: 'Song title and artist name are required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const { data: newCampaign, error } = await supabase
      .from('ad_campaigns')
      .insert({
        song_title: songTitle.trim(),
        artist_name: artistName.trim(),
        campaign_name: campaignName?.trim() || `Promote "${songTitle}"`,
        package_name: packageName || 'starter',
        price_ngn: Number(priceNgn) || 15000,
        target_plays: Number(targetPlays) || 10000,
        delivered_plays: 0,
        clicks_count: 0,
        audio_url: audioUrl || null,
        cover_url: coverUrl || '/images/hero_boombox.jpg',
        spotify_url: spotifyUrl || null,
        apple_music_url: appleMusicUrl || null,
        audiomack_url: audiomackUrl || null,
        youtube_url: youtubeUrl || null,
        status: status || 'active',
        starts_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting ad campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await sendAdminNotification({
      event: 'AD_PROMOTION_SUBMITTED',
      subject: `📢 Admin Created Sponsored Ad: "${songTitle}" by ${artistName}`,
      title: 'Sponsored Ad Campaign Injected by Admin',
      description: `A sponsored ad was injected into rotation by the executive team.`,
      details: {
        'Song Title': songTitle,
        'Artist': artistName,
        'Package': packageName || 'Custom',
        'Target Plays': (targetPlays || 10000).toLocaleString(),
        'Status': status || 'active'
      },
      ctaUrl: 'https://admin.cautionstudioz.com/ads'
    });

    return NextResponse.json({ success: true, campaign: newCampaign });
  } catch (err: any) {
    console.error('Error in POST /api/ads:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
