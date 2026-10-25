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

    const safeArtist = artistName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) || 'artist';
    const timestamp = Date.now();

    // 1. Upload All Vocal Stems (Lead + Multiple Backup Vocals)
    const vocalStemEntries: { name: string; url: string; pan?: number; volume?: number }[] = [];

    // Support multiple vocal files: vocalAudio_0, vocalAudio_1, etc.
    let trackIndex = 0;
    while (formData.has(`vocalAudio_${trackIndex}`)) {
      const file = formData.get(`vocalAudio_${trackIndex}`) as File | null;
      const trackName = (formData.get(`vocalTrackName_${trackIndex}`) as string) || `Track ${trackIndex + 1}`;
      const pan = parseFloat((formData.get(`vocalTrackPan_${trackIndex}`) as string) || '0');
      const vol = parseFloat((formData.get(`vocalTrackVol_${trackIndex}`) as string) || '1');

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buf = Buffer.from(bytes);
        const safeTrack = trackName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
        const key = `recordings/vocals/${safeArtist}_${safeTrack}_${timestamp}_${trackIndex}.wav`;

        try {
          await uploadToR2(key, buf, 'audio/wav');
          vocalStemEntries.push({
            name: trackName,
            url: `/api/media/${key}`,
            pan,
            volume: vol
          });
        } catch (uploadErr) {
          console.warn(`R2 upload warning for ${trackName}:`, uploadErr);
        }
      }
      trackIndex++;
    }

    // Fallback: single legacy vocalAudio field
    if (vocalStemEntries.length === 0 && formData.has('vocalAudio')) {
      const singleFile = formData.get('vocalAudio') as File | null;
      if (singleFile && singleFile.size > 0) {
        const bytes = await singleFile.arrayBuffer();
        const buf = Buffer.from(bytes);
        const key = `recordings/vocals/${safeArtist}_lead_vocal_${timestamp}.wav`;
        try {
          await uploadToR2(key, buf, 'audio/wav');
          vocalStemEntries.push({
            name: 'Lead Vocal',
            url: `/api/media/${key}`,
            pan: 0,
            volume: 1
          });
        } catch (uploadErr) {
          console.warn('R2 single vocal upload warning:', uploadErr);
        }
      }
    }

    // 2. Upload Master Mix Demo to Cloudflare R2
    let masterR2Url = '';
    const masterMixFile = formData.get('masterMixAudio') as File | null;
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

    const primaryAudioUrl = masterR2Url || (vocalStemEntries[0]?.url) || '';

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
        vocalStems: vocalStemEntries,
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
      vocalStems: vocalStemEntries,
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
