import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, supabase as publicSupabase } from '../../../../../lib/supabaseClient';
import { uploadToR2, deleteFromR2 } from '../../../../../lib/r2Server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const beatId = params.id;
    if (!beatId) {
      return NextResponse.json({ error: 'Beat ID is required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // 1. Resolve Producer ID from auth token or cookies
    let producerId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const { data: { user } } = await publicSupabase.auth.getUser(token);
      if (user) producerId = user.id;
    }

    if (!producerId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/sb-token=([^;]+)/);
      if (match) {
        const { data: { user } } = await publicSupabase.auth.getUser(match[1]);
        if (user) producerId = user.id;
      }
    }

    // 2. Fetch the target beat
    const { data: beat, error: beatFetchErr } = await supabase
      .from('beats')
      .select('id, producer_id, slug, cover_url, title')
      .eq('id', beatId)
      .maybeSingle();

    if (beatFetchErr || !beat) {
      return NextResponse.json({ error: 'Beat not found' }, { status: 404 });
    }

    // 3. Verify ownership (if user authenticated)
    if (producerId && beat.producer_id && beat.producer_id !== producerId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update artwork for your own beats' },
        { status: 403 }
      );
    }

    // 4. Extract artwork file or preset URL from request
    const contentType = req.headers.get('content-type') || '';
    let newCoverUrl = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const artworkFile = (formData.get('artwork') || formData.get('cover')) as File | null;
      const presetUrl = formData.get('coverUrl') as string | null;

      if (artworkFile && artworkFile.size > 0) {
        if (!artworkFile.type.startsWith('image/')) {
          return NextResponse.json(
            { error: 'Invalid file type. Please upload a valid image file (JPG, PNG, WebP).' },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await artworkFile.arrayBuffer());
        const ext = artworkFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const coverKey = `covers/${beat.slug || 'beat'}_${Date.now()}.${ext}`;

        await uploadToR2(coverKey, buffer, artworkFile.type || 'image/jpeg');
        newCoverUrl = `/api/media/${coverKey}`;

        // Cleanup old R2 custom cover if applicable
        if (beat.cover_url && beat.cover_url.startsWith('/api/media/covers/')) {
          const oldKey = beat.cover_url.replace('/api/media/', '');
          deleteFromR2(oldKey).catch((e) => console.warn('Could not remove previous cover:', e));
        }
      } else if (presetUrl && presetUrl.trim()) {
        newCoverUrl = presetUrl.trim();
      } else {
        return NextResponse.json({ error: 'No artwork file or preset provided' }, { status: 400 });
      }
    } else {
      const body = await req.json();
      if (body.coverUrl && typeof body.coverUrl === 'string') {
        newCoverUrl = body.coverUrl.trim();
      } else {
        return NextResponse.json({ error: 'Missing coverUrl in JSON payload' }, { status: 400 });
      }
    }

    // 5. Update beat cover_url in database
    const { data: updatedBeat, error: updateErr } = await supabase
      .from('beats')
      .update({ cover_url: newCoverUrl })
      .eq('id', beatId)
      .select()
      .single();

    if (updateErr) {
      console.error('Failed to update beat cover_url:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      coverUrl: newCoverUrl,
      beat: updatedBeat
    });
  } catch (err: any) {
    console.error('Error updating beat artwork:', err);
    return NextResponse.json(
      { error: err.message || 'Server error while updating artwork' },
      { status: 500 }
    );
  }
}
