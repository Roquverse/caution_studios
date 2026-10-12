import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { beatId } = body;

    if (!beatId) {
      return NextResponse.json({ error: 'beatId is required' }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(beatId);
    if (!isUUID) {
      return NextResponse.json({ success: true, beatId, play_count: 1, mock: true });
    }

    const supabase = getServiceRoleClient();

    // 1. Fetch current play count
    const { data: beat, error: fetchError } = await supabase
      .from('beats')
      .select('id, play_count')
      .eq('id', beatId)
      .maybeSingle();

    if (fetchError) {
      console.warn('Error fetching beat for play count increment:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!beat) {
      // Beat not in DB (e.g. offline/mock track), still return success for client telemetry
      return NextResponse.json({ success: true, beatId, play_count: 1 });
    }

    const newPlayCount = (beat.play_count || 0) + 1;

    // 2. Increment in database
    const { error: updateError } = await supabase
      .from('beats')
      .update({ play_count: newPlayCount })
      .eq('id', beatId);

    if (updateError) {
      console.warn('Error updating beat play count:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      beatId,
      play_count: newPlayCount
    });
  } catch (err: any) {
    console.error('Unexpected error in /api/beats/listen:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
