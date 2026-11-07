import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { uploadToR2 } from '../../../../lib/r2Server';
import { sendAdminNotification } from '../../../../lib/emailNotifier';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const artistName = (formData.get('artistName') as string) || 'Anonymous Artist';
    const contactPhone = (formData.get('contactPhone') as string) || '';
    const socialHandle = (formData.get('socialHandle') as string) || '';
    const beatTitle = (formData.get('beatTitle') as string) || 'Free Beat';
    const beatId = (formData.get('beatId') as string) || null;
    const notes = (formData.get('notes') as string) || '';
    const audioFile = formData.get('audio') as File | null;

    let audioUrl = '';

    if (audioFile && audioFile.size > 0) {
      const bytes = await audioFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeArtist = artistName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25);
      const key = `demos/${safeArtist}_${Date.now()}.wav`;
      
      try {
        await uploadToR2(key, buffer, 'audio/wav');
        audioUrl = `/api/media/${key}`;
      } catch (uploadErr) {
        console.warn('Could not upload demo to R2, proceeding with record creation:', uploadErr);
      }
    }

    const supabase = getServiceRoleClient();

    // Insert record if table exists
    try {
      const { data, error } = await supabase
        .from('soundstage_submissions')
        .insert({
          artist_name: artistName,
          contact_phone: contactPhone,
          social_handle: socialHandle,
          beat_title: beatTitle,
          beat_id: beatId,
          audio_url: audioUrl,
          notes: notes,
          status: 'pending_review'
        })
        .select()
        .single();

      if (error) {
        console.warn('Note: soundstage_submissions table insert error:', error.message);
      }
    } catch (dbErr) {
      console.warn('Database insert failed gracefully:', dbErr);
    }

    await sendAdminNotification({
      event: 'SOUNDSTAGE_SUBMISSION',
      subject: `🎤 New Soundstage Audition: ${artistName} ("${beatTitle}")`,
      title: 'Soundstage Artist Audition Submitted',
      description: `An artist recorded a live vocal audition and submitted it for Caution Studio A&R review.`,
      details: {
        'Artist Name': artistName,
        'Social Handle': socialHandle || 'N/A',
        'Phone / WhatsApp': contactPhone || 'N/A',
        'Beat Track': beatTitle,
        'Audio Recording': audioUrl ? `https://media.cautionstudioz.com/${audioUrl.replace('/api/media/', '')}` : 'Processed',
        'Artist Notes': notes || 'None'
      },
      ctaUrl: 'https://admin.cautionstudioz.com'
    });

    return NextResponse.json({
      success: true,
      message: 'Demo received successfully! Caution Studio A&R team will review your take.',
      audioUrl
    });
  } catch (err: any) {
    console.error('Error handling soundstage submission:', err);
    return NextResponse.json(
      { error: 'Failed to process submission', details: err?.message },
      { status: 500 }
    );
  }
}
