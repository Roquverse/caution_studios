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

    // 1. Fetch current beat telemetry
    const { data: beat, error: fetchError } = await supabase
      .from('beats')
      .select('id, title, producer_id, play_count, free_commercial_downloads_count')
      .eq('id', beatId)
      .maybeSingle();

    if (fetchError) {
      console.warn('Error fetching beat for telemetry increment:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!beat) {
      return NextResponse.json({ success: true, beatId, play_count: 1, download_count: 1 });
    }

    if (action === 'download') {
      const newDownloadCount = (beat.free_commercial_downloads_count || 0) + 1;

      const { error: updateError } = await supabase
        .from('beats')
        .update({ free_commercial_downloads_count: newDownloadCount })
        .eq('id', beatId);

      if (updateError) {
        console.warn('Error updating beat download count:', updateError);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      // Check if producer crossed a 10,000 pay threshold milestone
      if (beat.producer_id) {
        try {
          const { data: producerBeats } = await supabase
            .from('beats')
            .select('play_count, free_commercial_downloads_count')
            .eq('producer_id', beat.producer_id);

          const totalDownloads = (producerBeats || []).reduce(
            (acc, b) => acc + (b.free_commercial_downloads_count || 0),
            0
          );

          if (totalDownloads > 0 && totalDownloads % 10000 === 0) {
            await supabase.from('producer_download_incentives').insert({
              producer_id: beat.producer_id,
              qualifying_downloads: 10000,
              reward_amount_ngn: 30000,
              status: 'credited'
            });

            const { data: prodProfile } = await supabase
              .from('profiles')
              .select('available_balance_ngn')
              .eq('id', beat.producer_id)
              .maybeSingle();

            await supabase
              .from('profiles')
              .update({
                is_verified: true,
                available_balance_ngn: (Number(prodProfile?.available_balance_ngn) || 0) + 30000
              })
              .eq('id', beat.producer_id);
          }
        } catch (e) {
          console.warn('Error checking producer download threshold:', e);
        }
      }

      return NextResponse.json({
        success: true,
        beatId,
        action: 'download',
        play_count: beat.play_count || 0,
        download_count: newDownloadCount
      });
    }

    // Default: action === 'play'
    const newPlayCount = (beat.play_count || 0) + 1;

    const { error: updateError } = await supabase
      .from('beats')
      .update({ play_count: newPlayCount })
      .eq('id', beatId);

    if (updateError) {
      console.warn('Error updating beat play count:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // Also increment producer's streaming_streams_count in profiles if producer_id exists
    if (beat.producer_id) {
      try {
        const { data: prodProfile } = await supabase
          .from('profiles')
          .select('streaming_streams_count')
          .eq('id', beat.producer_id)
          .maybeSingle();

        await supabase
          .from('profiles')
          .update({
            streaming_streams_count: (Number(prodProfile?.streaming_streams_count) || 0) + 1
          })
          .eq('id', beat.producer_id);
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      beatId,
      action: 'play',
      play_count: newPlayCount,
      download_count: beat.free_commercial_downloads_count || 0
    });
  } catch (err: any) {
    console.error('Unexpected error in /api/beats/listen:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
