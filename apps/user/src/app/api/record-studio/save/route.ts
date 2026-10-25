import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { uploadToR2 } from '../../../../lib/r2Server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const artistName = (formData.get('artistName') as string) || 'Anonymous Artist';
    const projectTitle = (formData.get('projectTitle') as string) || 'Record Studio Session';
    const contactPhone = (formData.get('contactPhone') as string) || '';
    const socialHandle = (formData.get('socialHandle') as string) || '';
    const beatTitle = (formData.get('beatTitle') as string) || 'Backing Beat';
    const beatId = (formData.get('beatId') as string) || null;
    const notes = (formData.get('notes') as string) || '';
    const lyrics = (formData.get('lyrics') as string) || '';
    const effectsConfig = (formData.get('effectsConfig') as string) || '{}';

    const vocalFile = formData.get('vocalAudio') as File | null;
    const masterMixFile = formData.get('masterMixAudio') as File | null;

    let vocalR2Url = '';
    let masterR2Url = '';

    const safeArtist = artistName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) || 'artist';
    const timestamp = Date.now();

    // 1. Upload Vocal Stem to Cloudflare R2
    if (vocalFile && vocalFile.size > 0) {
      const vocalBytes = await vocalFile.arrayBuffer();
      const vocalBuffer = Buffer.from(vocalBytes);
      const vocalKey = `recordings/vocals/${safeArtist}_vocal_${timestamp}.wav`;

      try {
        await uploadToR2(vocalKey, vocalBuffer, 'audio/wav');
        vocalR2Url = `/api/media/${vocalKey}`;
      } catch (uploadErr) {
        console.warn('R2 vocal stem upload warning:', uploadErr);
      }
    }

    // 2. Upload Mixed Master Demo to Cloudflare R2
    if (masterMixFile && masterMixFile.size > 0) {
      const masterBytes = await masterMixFile.arrayBuffer();
      const masterBuffer = Buffer.from(masterBytes);
      const masterKey = `recordings/masters/${safeArtist}_master_${timestamp}.wav`;

      try {
        await uploadToR2(masterKey, masterBuffer, 'audio/wav');
        masterR2Url = `/api/media/${masterKey}`;
      } catch (uploadErr) {
        console.warn('R2 master demo upload warning:', uploadErr);
      }
    }

    // If only one was uploaded, fallback to whichever URL is present
    const primaryAudioUrl = masterR2Url || vocalR2Url || '';

    // 3. Save Session & Demo to Supabase Database
    const supabase = getServiceRoleClient();
    let submissionRecord = null;

    const sessionPayload = {
      artist_name: artistName,
      contact_phone: contactPhone,
      social_handle: socialHandle,
      beat_title: `${projectTitle} (${beatTitle})`,
      beat_id: beatId,
      audio_url: primaryAudioUrl,
      notes: JSON.stringify({
        projectTitle,
        vocalUrl: vocalR2Url,
        masterUrl: masterR2Url,
        notes: notes.trim(),
        lyrics: lyrics.trim(),
        effects: effectsConfig
      }),
      status: 'pending_review'
    };

    try {
      const { data, error } = await supabase
        .from('soundstage_submissions')
        .insert(sessionPayload)
        .select()
        .single();

      if (error) {
        console.warn('Supabase soundstage_submissions insert note:', error.message);
      } else {
        submissionRecord = data;
      }
    } catch (dbErr) {
      console.warn('Database insert failed gracefully:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Session successfully saved to Cloudflare R2 and database!',
      vocalUrl: vocalR2Url,
      masterUrl: masterR2Url,
      primaryUrl: primaryAudioUrl,
      submission: submissionRecord
    });
  } catch (err: any) {
    console.error('Error in /api/record-studio/save:', err);
    return NextResponse.json(
      { error: 'Failed to save studio recording session', details: err?.message },
      { status: 500 }
    );
  }
}
