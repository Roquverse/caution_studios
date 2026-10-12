import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { deleteFromR2 } from '../../../../lib/r2Server';

// GET /api/tracks/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceRoleClient();
    const { data: beat, error } = await supabase
      .from('beats')
      .select('*, licenses:beat_licenses(*)')
      .eq('id', params.id)
      .maybeSingle();

    if (error || !beat) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    return NextResponse.json({ beat });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/tracks/[id] - Admin edits track metadata or status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json();

    const updateFields: Record<string, any> = {};
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.genre !== undefined) updateFields.genre = body.genre;
    if (body.bpm !== undefined) updateFields.bpm = Number(body.bpm);
    if (body.musical_key !== undefined) updateFields.musical_key = body.musical_key;
    if (body.duration_seconds !== undefined) updateFields.duration_seconds = Number(body.duration_seconds);
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.moods !== undefined) updateFields.moods = body.moods;
    if (body.tags !== undefined) updateFields.tags = body.tags;

    const { data: updated, error } = await supabase
      .from('beats')
      .update(updateFields)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update licenses if provided
    if (body.basicPrice || body.premiumPrice || body.exclusivePrice) {
      if (body.basicPrice) {
        await supabase
          .from('beat_licenses')
          .upsert(
            { beat_id: params.id, type: 'basic', price_cents: body.basicPrice, enabled: true },
            { onConflict: 'beat_id,type' }
          );
      }
      if (body.premiumPrice) {
        await supabase
          .from('beat_licenses')
          .upsert(
            { beat_id: params.id, type: 'premium', price_cents: body.premiumPrice, enabled: true },
            { onConflict: 'beat_id,type' }
          );
      }
      if (body.exclusivePrice) {
        await supabase
          .from('beat_licenses')
          .upsert(
            { beat_id: params.id, type: 'exclusive', price_cents: body.exclusivePrice, enabled: true },
            { onConflict: 'beat_id,type' }
          );
      }
    }

    const { data: updatedLicenses } = await supabase
      .from('beat_licenses')
      .select('*')
      .eq('beat_id', params.id);

    return NextResponse.json({
      success: true,
      beat: {
        ...updated,
        licenses: updatedLicenses || []
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/tracks/[id] - Admin removes track from database and R2 storage
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceRoleClient();

    // 1. Fetch keys to clean up storage
    const { data: beat } = await supabase
      .from('beats')
      .select('master_wav_key, stems_zip_key, preview_clean_key, cover_url')
      .eq('id', params.id)
      .maybeSingle();

    if (beat) {
      if (beat.master_wav_key) await deleteFromR2(beat.master_wav_key);
      if (beat.stems_zip_key) await deleteFromR2(beat.stems_zip_key);
      if (beat.preview_clean_key && beat.preview_clean_key !== beat.master_wav_key) {
        await deleteFromR2(beat.preview_clean_key);
      }
    }

    // 2. Delete beat record (cascades to licenses)
    const { error } = await supabase.from('beats').delete().eq('id', params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Track deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
