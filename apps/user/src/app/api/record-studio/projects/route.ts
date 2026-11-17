import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

// GET /api/record-studio/projects - List saved studio projects for the user
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let query = supabase
      .from('studio_projects')
      .select('id, title, beat_id, beat_data, bpm, musical_key, time_signature, lyrics, notes, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.limit(30);

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

// POST /api/record-studio/projects - Save or update studio project in cloud database
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json();

    const {
      id,
      userId,
      title,
      beatId,
      beatData,
      vocalTracks,
      masterUrl,
      bpm,
      musicalKey,
      timeSignature,
      effects,
      lyrics,
      notes
    } = body;

    const payload = {
      user_id: userId || null,
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

    let result;
    if (id && !id.startsWith('proj_')) {
      // Valid UUID, update existing record
      const { data, error } = await supabase
        .from('studio_projects')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Fallback to insert if not found
        const { data: inserted, error: insertErr } = await supabase
          .from('studio_projects')
          .insert({ id, ...payload })
          .select()
          .single();
        if (insertErr) throw insertErr;
        result = inserted;
      } else {
        result = data;
      }
    } else {
      // Insert new project
      const { data, error } = await supabase
        .from('studio_projects')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      message: 'Studio project saved to cloud database',
      project: result
    });
  } catch (err: any) {
    console.warn('Could not save studio project to cloud:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Database save skipped' },
      { status: 500 }
    );
  }
}
