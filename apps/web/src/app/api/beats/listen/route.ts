import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { beatId, action = 'play' } = body;

    if (!beatId) {
      return NextResponse.json({ error: 'beatId is required' }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(beatId);
    if (!isUUID) {
      return NextResponse.json({ success: true, beatId, play_count: 1, download_count: 1, mock: true });
    }

    const supabase = getServiceRoleClient();

    const { data: beat, error: fetchError } = await supabase
      .from('beats')
      .select('id, title, producer_id, play_count, free_commercial_downloads_count')
      .eq('id', beatId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!beat) {
      return NextResponse.json({ success: true, beatId, play_count: 1, download_count: 1 });
    }

    if (action === 'download') {
      const newDownloadCount = (beat.free_commercial_downloads_count || 0) + 1;

      await supabase
        .from('beats')
        .update({ free_commercial_downloads_count: newDownloadCount })
        .eq('id', beatId);

      return NextResponse.json({
        success: true,
        beatId,
        action: 'download',
        play_count: beat.play_count || 0,
        download_count: newDownloadCount
      });
    }

    const newPlayCount = (beat.play_count || 0) + 1;

    await supabase
      .from('beats')
      .update({ play_count: newPlayCount })
      .eq('id', beatId);

    return NextResponse.json({
      success: true,
      beatId,
      action: 'play',
      play_count: newPlayCount,
      download_count: beat.free_commercial_downloads_count || 0
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

