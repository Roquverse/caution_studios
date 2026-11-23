import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { deleteFromR2 } from '../../../../lib/r2Server';
import { verifyAdminRequest } from '../../../../lib/adminAuth';

// GET /api/tracks/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

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
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

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

    // 1. Resolve & update Producer Name if changed
    const targetArtist = (body.artist || body.producerName || '').trim();
    if (targetArtist) {
      const handleCandidate = targetArtist.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').slice(0, 30) || 'producer';
      const { data: matched } = await supabase
        .from('profiles')
        .select('id')
        .or(`display_name.ilike.%${targetArtist}%,handle.ilike.%${handleCandidate}%`)
        .limit(1);

      if (matched && matched.length > 0) {
        updateFields.producer_id = matched[0].id;
      } else {
        try {
          const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
          const email = `producer_${handleCandidate}_${uniqueSuffix}@cautionstudioz.com`;
          const { data: newUser } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              full_name: targetArtist,
              display_name: targetArtist,
              handle: handleCandidate,
              primary_role: 'producer',
              roles: ['producer']
            }
          });

          if (newUser?.user) {
            const { data: newProf } = await supabase
              .from('profiles')
              .upsert({
                id: newUser.user.id,
                display_name: targetArtist,
                handle: handleCandidate,
                roles: ['producer'],
                plan: 'plus'
              })
              .select('id')
              .single();

            if (newProf?.id) {
              updateFields.producer_id = newProf.id;
            }
          }
        } catch (e) {
          console.warn('Could not auto-create producer profile on edit:', e);
        }
      }
    }

    // 2. Free vs Paid Beat distribution flag
    const hasFreeFlag = body.isFree !== undefined || body.isFreeTrack !== undefined;
    const isFree = Boolean(body.isFree !== undefined ? body.isFree : body.isFreeTrack);
    if (hasFreeFlag) {
      updateFields.is_free_stream_enabled = isFree;
      if (isFree) {
        const currentTags = Array.isArray(updateFields.tags)
          ? updateFields.tags
          : Array.isArray(body.tags)
            ? body.tags
            : [];
        if (!currentTags.includes('Free')) currentTags.push('Free');
        if (!currentTags.includes('Free Download')) currentTags.push('Free Download');
        updateFields.tags = currentTags;
      }
    }

    const { data: updated, error } = await supabase
      .from('beats')
      .update(updateFields)
      .eq('id', params.id)
      .select(`
        *,
        producer:producer_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Update licenses according to Free vs Paid status
    if (hasFreeFlag && isFree) {
      await supabase.from('beat_licenses').upsert([
        { beat_id: params.id, type: 'basic', price_cents: 1, enabled: true },
        { beat_id: params.id, type: 'premium', price_cents: 1, enabled: false },
        { beat_id: params.id, type: 'exclusive', price_cents: 1, enabled: false }
      ], { onConflict: 'beat_id,type' });
    } else if (hasFreeFlag && !isFree) {
      const premPrice = Number(body.premiumPrice) || 5000000;
      const exclPrice = Number(body.exclusivePrice) || 20000000;
      await supabase.from('beat_licenses').upsert([
        { beat_id: params.id, type: 'basic', price_cents: 1, enabled: false },
        { beat_id: params.id, type: 'premium', price_cents: premPrice, enabled: true },
        { beat_id: params.id, type: 'exclusive', price_cents: exclPrice, enabled: true }
      ], { onConflict: 'beat_id,type' });
    } else if (body.premiumPrice || body.exclusivePrice) {
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
      // Keep basic disabled for paid beats
      await supabase
        .from('beat_licenses')
        .upsert(
          { beat_id: params.id, type: 'basic', price_cents: 1, enabled: false },
          { onConflict: 'beat_id,type' }
        );
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
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

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
