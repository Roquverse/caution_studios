import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, supabase as publicSupabase } from '../../../../lib/supabaseClient';
import { uploadToR2 } from '../../../../lib/r2Server';
import { sendAdminNotification } from '../../../../lib/emailNotifier';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let bodyData: any = {};
    let audioFile: File | null = null;
    let coverFile: File | null = null;

    if (isJson) {
      bodyData = await req.json();
    } else {
      const formData = await req.formData();
      bodyData = {
        advertiserId: formData.get('advertiserId') as string,
        artistName: formData.get('artistName') as string,
        songTitle: formData.get('songTitle') as string,
        campaignName: formData.get('campaignName') as string,
        packageName: formData.get('packageName') as string,
        priceNgn: formData.get('priceNgn') as string,
        targetPlays: formData.get('targetPlays') as string,
        audioUrl: formData.get('audioUrl') as string,
        coverUrl: formData.get('coverUrl') as string,
        spotifyUrl: formData.get('spotifyUrl') as string,
        appleMusicUrl: formData.get('appleMusicUrl') as string,
        audiomackUrl: formData.get('audiomackUrl') as string,
        youtubeUrl: formData.get('youtubeUrl') as string,
        advertiserEmail: formData.get('advertiserEmail') as string
      };
      audioFile = formData.get('audio') as File | null;
      coverFile = formData.get('cover') as File | null;
    }

    const supabase = getServiceRoleClient();

    // Resolve Advertiser ID
    let advertiserId = bodyData.advertiserId;
    let advertiserEmail = bodyData.advertiserEmail || '';

    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const { data: { user } } = await publicSupabase.auth.getUser(token);
      if (user) {
        advertiserId = user.id;
        advertiserEmail = user.email || advertiserEmail;
      }
    }

    if (!advertiserId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/sb-token=([^;]+)/);
      if (match) {
        const { data: { user } } = await publicSupabase.auth.getUser(match[1]);
        if (user) {
          advertiserId = user.id;
          advertiserEmail = user.email || advertiserEmail;
        }
      }
    }

    const songTitle = (bodyData.songTitle as string) || '';
    const artistName = (bodyData.artistName as string) || 'Artist';
    if (!songTitle.trim()) {
      return NextResponse.json({ error: 'Song title is required' }, { status: 400 });
    }

    const packageName = bodyData.packageName || 'starter';
    const tierMap: Record<string, { price: number; plays: number }> = {
      starter: { price: 15000, plays: 5000 },
      pro: { price: 35000, plays: 15000 },
      studio_blast: { price: 75000, plays: 40000 }
    };

    const tierInfo = tierMap[packageName] || tierMap.starter;
    const priceNgn = parseInt(bodyData.priceNgn as string, 10) || tierInfo.price;
    const targetPlays = parseInt(bodyData.targetPlays as string, 10) || tierInfo.plays;

    const safeSlug = songTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) || 'ad';
    const timestamp = Date.now();

    // 1. Upload audio if provided as file
    let audioUrl = bodyData.audioUrl || '';
    if (audioFile && audioFile.size > 0) {
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      const ext = audioFile.name.split('.').pop()?.toLowerCase() || 'mp3';
      const key = `ads/${safeSlug}_${timestamp}.${ext}`;
      await uploadToR2(key, audioBuffer, audioFile.type || 'audio/mpeg');
      audioUrl = `https://media.cautionstudioz.com/${key}`;
    }

    // 2. Upload cover if provided as file
    let coverUrl = bodyData.coverUrl || '/images/hero_boombox.jpg';
    if (coverFile && coverFile.size > 0) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const ext = coverFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const key = `covers/ads_${safeSlug}_${timestamp}.${ext}`;
      await uploadToR2(key, coverBuffer, coverFile.type || 'image/jpeg');
      coverUrl = `https://media.cautionstudioz.com/${key}`;
    }

    // 3. Insert into Supabase ad_campaigns
    const { data: newCampaign, error: dbError } = await supabase
      .from('ad_campaigns')
      .insert({
        advertiser_id: advertiserId || null,
        campaign_name: bodyData.campaignName || `Promote "${songTitle}"`,
        artist_name: artistName,
        song_title: songTitle,
        package_name: packageName,
        price_ngn: priceNgn,
        target_plays: targetPlays,
        delivered_plays: 0,
        clicks_count: 0,
        audio_url: audioUrl,
        cover_url: coverUrl,
        spotify_url: bodyData.spotifyUrl || null,
        apple_music_url: bodyData.appleMusicUrl || null,
        audiomack_url: bodyData.audiomackUrl || null,
        youtube_url: bodyData.youtubeUrl || null,
        status: 'active',
        starts_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to insert ad campaign into DB:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 4. Send Email Notification to support@cautionstudioz.com
    await sendAdminNotification({
      event: 'AD_PROMOTION_SUBMITTED',
      subject: `📢 New Song Promotion Ad: "${songTitle}" by ${artistName}`,
      title: `New Song Promotion Campaign Created`,
      description: `A user has just submitted a new song promotion campaign for unskippable 3-song rotation across Caution Studio.`,
      actor: {
        id: advertiserId || 'guest',
        name: artistName,
        email: advertiserEmail || 'Not provided'
      },
      details: {
        'Song Title': songTitle,
        'Artist / Creator': artistName,
        'Package': packageName.toUpperCase(),
        'Amount (NGN)': `₦${priceNgn.toLocaleString()}`,
        'Target Plays': targetPlays.toLocaleString(),
        'Advertiser Email': advertiserEmail || 'Anonymous',
        'Spotify': bodyData.spotifyUrl || 'N/A',
        'Apple Music': bodyData.appleMusicUrl || 'N/A',
        'Audiomack': bodyData.audiomackUrl || 'N/A',
        'YouTube': bodyData.youtubeUrl || 'N/A',
        'Campaign ID': newCampaign.id,
        'Status': 'active'
      },
      ctaUrl: 'https://admin.cautionstudioz.com/ads',
      ctaText: 'Review Campaign in Admin'
    });

    return NextResponse.json({ success: true, campaign: newCampaign });
  } catch (err: any) {
    console.error('Ad creation error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
