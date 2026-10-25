import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, supabase as publicSupabase } from '../../../../lib/supabaseClient';
import { uploadToR2 } from '../../../../lib/r2Server';

export const dynamic = 'force-dynamic';

function generateSlug(text: string) {
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${clean || 'beat'}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const supabase = getServiceRoleClient();

    // 1. Resolve Producer ID
    let producerId = formData.get('producerId') as string | null;

    if (!producerId) {
      // Try to read auth token from header or cookie
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user } } = await publicSupabase.auth.getUser(token);
        if (user) producerId = user.id;
      }
    }

    if (!producerId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/sb-token=([^;]+)/);
      if (match) {
        const { data: { user } } = await publicSupabase.auth.getUser(match[1]);
        if (user) producerId = user.id;
      }
    }

    if (!producerId) {
      return NextResponse.json(
        { error: 'Unauthorized: Producer ID is required to upload beats' },
        { status: 401 }
      );
    }

    // 2. Extract Metadata
    const title = (formData.get('title') as string) || '';
    if (!title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const genre = (formData.get('genre') as string) || 'Afrobeats';
    const bpm = parseInt(formData.get('bpm') as string, 10) || 110;
    const musicalKey = (formData.get('musicalKey') as string) || 'C Minor';
    const tagsRaw = (formData.get('tags') as string) || '';
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
    const durationSeconds = parseInt(formData.get('durationSeconds') as string, 10) || 180;
    const enableFreeStreaming = formData.get('enableFreeStreaming') !== 'false';

    const priceBasic = parseInt(formData.get('priceBasic') as string, 10) || 3000;
    const pricePremium = parseInt(formData.get('pricePremium') as string, 10) || 30000;
    const priceExclusive = parseInt(formData.get('priceExclusive') as string, 10) || 100000;

    const slug = generateSlug(title);

    // 3. Upload Audio File (Required)
    const audioFile = formData.get('audio') as File | null;
    let masterAudioKey: string | null = null;

    if (audioFile && audioFile.size > 0) {
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      const ext = audioFile.name.split('.').pop()?.toLowerCase() || 'wav';
      masterAudioKey = `masters/${slug}_${Date.now()}.${ext}`;
      await uploadToR2(masterAudioKey, audioBuffer, audioFile.type || 'audio/wav');
    } else {
      // Fallback: Default caution studio master demo track if not provided
      masterAudioKey = 'masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3';
    }

    // 4. Upload Cover Art (Optional)
    const coverFile = (formData.get('cover') || formData.get('artwork')) as File | null;
    const requestedCoverUrl = formData.get('coverUrl') as string | null;
    let coverUrl = requestedCoverUrl && requestedCoverUrl.trim() ? requestedCoverUrl.trim() : '/images/studio_mixing_console.jpg';

    if (coverFile && coverFile.size > 0) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const coverExt = coverFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const coverKey = `covers/${slug}_${Date.now()}.${coverExt}`;
      await uploadToR2(coverKey, coverBuffer, coverFile.type || 'image/jpeg');
      coverUrl = `/api/media/${coverKey}`;
    }

    // 5. Upload Stems Archive (Optional)
    const stemsFile = formData.get('stems') as File | null;
    let stemsKey: string | null = null;

    if (stemsFile && stemsFile.size > 0) {
      const stemsBuffer = Buffer.from(await stemsFile.arrayBuffer());
      stemsKey = `stems/${slug}_${Date.now()}.zip`;
      await uploadToR2(stemsKey, stemsBuffer, 'application/zip');
    }

    // 6. Insert Beat Record
    const { data: newBeat, error: beatErr } = await supabase
      .from('beats')
      .insert({
        producer_id: producerId,
        slug,
        title: title.trim(),
        genre,
        bpm,
        musical_key: musicalKey,
        tags,
        moods: ['Studio Master'],
        status: 'live',
        cover_url: coverUrl,
        master_wav_key: masterAudioKey,
        preview_clean_key: masterAudioKey,
        preview_tagged_key: masterAudioKey,
        stems_zip_key: stemsKey,
        duration_seconds: durationSeconds,
        published_at: new Date().toISOString(),
        is_free_stream_enabled: enableFreeStreaming,
        producer_tag_free: true
      })
      .select()
      .single();

    if (beatErr || !newBeat) {
      console.error('Database beat insertion error:', beatErr);
      return NextResponse.json(
        { error: beatErr?.message || 'Failed to create beat in database' },
        { status: 500 }
      );
    }

    // 7. Insert Beat Licenses
    await supabase.from('beat_licenses').insert([
      { beat_id: newBeat.id, type: 'basic', price_cents: priceBasic * 100, enabled: true },
      { beat_id: newBeat.id, type: 'premium', price_cents: pricePremium * 100, enabled: true },
      { beat_id: newBeat.id, type: 'exclusive', price_cents: priceExclusive * 100, enabled: true }
    ]);

    return NextResponse.json({
      success: true,
      beat: newBeat
    });
  } catch (err: any) {
    console.error('Error handling creator beat upload:', err);
    return NextResponse.json(
      { error: err.message || 'Server error uploading beat' },
      { status: 500 }
    );
  }
}
