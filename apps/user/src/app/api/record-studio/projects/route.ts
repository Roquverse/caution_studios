import { NextRequest, NextResponse } from 'next/server';
import { authenticateStudioRequest } from '../../../../lib/studioAuth';

export const dynamic = 'force-dynamic';

// GET /api/record-studio/projects - List saved studio projects for the signed-in user
export async function GET(req: NextRequest) {
  try {
    const ctx = await authenticateStudioRequest(req);
    if (!ctx) return NextResponse.json({ projects: [] }, { status: 401 });

    const { data, error } = await ctx.supabase
      .from('studio_projects')
      .select('id, title, beat_id, beat_data, bpm, musical_key, time_signature, lyrics, notes, created_at, updated_at')
      .eq('user_id', ctx.user.id)
      .order('updated_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('Could not fetch studio projects from db:', error.message);
      return NextResponse.json({ projects: [] });
    }

    return NextResponse.json({ projects: data || [] });
  } catch (err: any) {
    console.error('Error fetching studio projects:', err);
    return NextResponse.json({ projects: [] }, { status: 500 });
  }
}

// POST /api/record-studio/projects - Save or update studio project (Caution Pro only)
export async function POST(req: NextRequest) {
  try {
    const ctx = await authenticateStudioRequest(req);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (ctx.plan !== 'pro') {
      return NextResponse.json(
        { success: false, error: 'Saving studio sessions is a Caution Pro feature.', reason: 'pro_required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, title, beatId, beatData, vocalTracks, masterUrl, bpm, musicalKey, timeSignature, effects, lyrics, notes } = body;

    const payload = {
      user_id: ctx.user.id,
      title: (title || 'Untitled Session').trim(),
      beat_id: beatId || null,
      beat_data: beatData || null,
      vocal_tracks: vocalTracks || [],
      master_url: masterUrl || null,
      bpm: bpm || 92,
      musical_key: musicalKey || 'F Minor',
      time_signature: timeSignature || '4/4',
      effects: effects || {},
      lyrics: (lyrics || '').trim(),
      notes: (notes || '').trim(),
      updated_at: new Date().toISOString()
    };

    const isUuid = typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id);

    let result;
    if (isUuid) {
      const { data, error } = await ctx.supabase
        .from('studio_projects')
        .upsert({ id, ...payload })
        .eq('user_id', ctx.user.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await ctx.supabase.from('studio_projects').insert(payload).select().single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, message: 'Studio project saved to cloud database', project: result });
  } catch (err: any) {
    console.warn('Could not save studio project to cloud:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Database save skipped' }, { status: 500 });
  }
}
