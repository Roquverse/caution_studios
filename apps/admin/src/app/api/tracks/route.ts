import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { uploadToR2 } from '../../../lib/r2Server';
import { verifyAdminRequest } from '../../../lib/adminAuth';
import { sendAdminNotification } from '../../../lib/emailNotifier';

export const dynamic = 'force-dynamic';

// Helper to generate a clean URL-friendly slug
function generateSlug(text: string) {
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${clean || 'track'}-${randomSuffix}`;
}

// GET /api/tracks - Retrieve full catalog with producer & licenses
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();

    const { data: beats, error } = await supabase
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching beats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tracks: beats || [] });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/tracks:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/tracks - Admin uploads audio, cover artwork, and registers beat in DB
export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const supabase = getServiceRoleClient();
    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let bodyData: any = {};
    let audioFile: File | null = null;
    let coverFile: File | null = null;
    let stemsFile: File | null = null;

    if (isJson) {
      bodyData = await req.json();
    } else {
      const formData = await req.formData();
      bodyData = {
        title: formData.get('title') as string,
        artist: formData.get('artist') as string,
        genre: formData.get('genre') as string,
        bpm: formData.get('bpm') as string,
        musicalKey: formData.get('musicalKey') as string,
        durationSeconds: formData.get('durationSeconds') as string,
        description: formData.get('description') as string,
        status: formData.get('status') as string,
        moods: formData.get('moods') as string,
        tags: formData.get('tags') as string,
        basicPrice: formData.get('basicPrice') as string,
        premiumPrice: formData.get('premiumPrice') as string,
        exclusivePrice: formData.get('exclusivePrice') as string,
        masterAudioKey: formData.get('masterAudioKey') as string,
        stemsKey: formData.get('stemsKey') as string,
        coverUrl: formData.get('coverUrl') as string,
      };
      audioFile = formData.get('audio') as File | null;
      coverFile = formData.get('cover') as File | null;
      stemsFile = formData.get('stems') as File | null;
    }

    const title = (bodyData.title as string) || '';
    const artistName = (bodyData.artist as string) || 'Caution Studio';
    const genre = (bodyData.genre as string) || 'Cinematic';
    const bpm = parseInt(bodyData.bpm as string, 10) || 120;
    const musicalKey = (bodyData.musicalKey as string) || 'C Minor';
    const durationSeconds = parseInt(bodyData.durationSeconds as string, 10) || 180;
    const description = (bodyData.description as string) || '';
    const status = (bodyData.status as string) || 'live';

    // Pricing (in kobo / cents: ₦15,000 = 1500000, ₦45,000 = 4500000, ₦250,000 = 25000000)
    const basicPrice = parseInt(bodyData.basicPrice as string, 10) || 1500000;
    const premiumPrice = parseInt(bodyData.premiumPrice as string, 10) || 4500000;
    const exclusivePrice = parseInt(bodyData.exclusivePrice as string, 10) || 25000000;

    // Moods and Tags
    const moods = Array.isArray(bodyData.moods)
      ? bodyData.moods
      : typeof bodyData.moods === 'string' && bodyData.moods.trim()
      ? bodyData.moods.split(',').map((m: string) => m.trim()).filter(Boolean)
      : ['Epic'];

    const tags = Array.isArray(bodyData.tags)
      ? bodyData.tags
      : typeof bodyData.tags === 'string' && bodyData.tags.trim()
      ? bodyData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : ['Instrumental'];

    if (!title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // 1. Resolve Producer Profile
    let producerId: string | null = null;
    const { data: profiles } = await supabase.from('profiles').select('id, handle, display_name').limit(1);
    if (profiles && profiles.length > 0) {
      producerId = profiles[0].id;
    } else {
      // Create admin default profile if none exists
      const { data: newProfile, error: pErr } = await supabase
        .from('profiles')
        .insert({
          id: '64d47dcb-3d1f-41dd-8400-46f39c5b0750',
          handle: 'caution_admin',
          display_name: 'Caution Studio',
          roles: ['producer', 'artist'],
          plan: 'plus'
        })
        .select()
        .single();

      if (newProfile) {
        producerId = newProfile.id;
      }
    }

    if (!producerId) {
      return NextResponse.json({ error: 'Unable to assign producer profile' }, { status: 500 });
    }

    const slug = generateSlug(title);

    // 2. Resolve Master Audio Key
    let masterAudioKey: string | null = bodyData.masterAudioKey || null;

    if (!masterAudioKey && audioFile && audioFile.size > 0) {
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      const ext = audioFile.name.split('.').pop()?.toLowerCase() || 'wav';
      masterAudioKey = `masters/${slug}_${Date.now()}.${ext}`;
      await uploadToR2(masterAudioKey, audioBuffer, audioFile.type || 'audio/wav');
    }

    if (!masterAudioKey) {
      return NextResponse.json({ error: 'Master audio file is required' }, { status: 400 });
    }

    // 3. Resolve Cover Artwork
    let coverUrl: string = bodyData.coverUrl && bodyData.coverUrl.trim()
      ? bodyData.coverUrl.trim()
      : '/images/album_neon_dj.jpg';

    if (coverFile && coverFile.size > 0) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const coverExt = coverFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const coverKey = `covers/${slug}_${Date.now()}.${coverExt}`;
      await uploadToR2(coverKey, coverBuffer, coverFile.type || 'image/jpeg');
      coverUrl = `/api/media/${coverKey}`;
    }

    // 4. Resolve Stems ZIP
    let stemsKey: string | null = bodyData.stemsKey || null;

    if (!stemsKey && stemsFile && stemsFile.size > 0) {
      const stemsBuffer = Buffer.from(await stemsFile.arrayBuffer());
      stemsKey = `stems/${slug}_${Date.now()}.zip`;
      await uploadToR2(stemsKey, stemsBuffer, 'application/zip');
    }

    // 5. Insert Record into Supabase `beats` table
    const { data: newBeat, error: beatErr } = await supabase
      .from('beats')
      .insert({
        producer_id: producerId,
        slug,
        title,
        description,
        genre,
        moods,
        tags,
        bpm,
        musical_key: musicalKey,
        cover_url: coverUrl,
        status: status as any,
        master_wav_key: masterAudioKey,
        preview_clean_key: masterAudioKey,
        preview_tagged_key: masterAudioKey,
        stems_zip_key: stemsKey,
        duration_seconds: durationSeconds,
        published_at: status === 'live' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (beatErr) {
      console.error('Error inserting beat into database:', beatErr);
      return NextResponse.json({ error: beatErr.message }, { status: 500 });
    }

    // 6. Insert License Tiers into `beat_licenses`
    const licensesToInsert = [
      { beat_id: newBeat.id, type: 'basic', price_cents: basicPrice, enabled: true },
      { beat_id: newBeat.id, type: 'premium', price_cents: premiumPrice, enabled: true },
      { beat_id: newBeat.id, type: 'exclusive', price_cents: exclusivePrice, enabled: true }
    ];

    const { error: licErr } = await supabase.from('beat_licenses').insert(licensesToInsert);
    if (licErr) {
      console.warn('Warning inserting licenses:', licErr.message);
    }

    // 7. Send Activity Email Notification to support@cautionstudioz.com
    sendAdminNotification({
      event: 'BEAT_UPLOADED',
      subject: `New Master Track Uploaded: "${title}"`,
      title: 'Master Track Catalog Addition',
      description: `A new track "${title}" (${genre}, ${bpm} BPM) was published to the master catalog by ${artistName}.`,
      actor: {
        name: artistName,
        role: 'Admin'
      },
      details: {
        'Track Title': title,
        'Artist / Producer': artistName,
        'Genre': genre,
        'BPM': bpm,
        'Musical Key': musicalKey,
        'Master Audio Key': masterAudioKey || 'None',
        'Stems ZIP Key': stemsKey || 'None',
        'Basic License': `₦${(basicPrice / 100).toLocaleString('en-NG')}`,
        'Premium License': `₦${(premiumPrice / 100).toLocaleString('en-NG')}`,
        'Exclusive License': `₦${(exclusivePrice / 100).toLocaleString('en-NG')}`
      },
      ctaUrl: `https://admin.cautionstudioz.com/tracks`,
      ctaText: 'View in Admin Catalog'
    }).catch((err) => console.warn('Failed to send admin notification email:', err));

    return NextResponse.json({
      success: true,
      beat: {
        ...newBeat,
        producer: { display_name: artistName },
        licenses: licensesToInsert
      }
    });
  } catch (err: any) {
    console.error('Error creating track:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload track' }, { status: 500 });
  }
}
