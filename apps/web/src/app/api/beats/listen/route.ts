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

      // Record monthly download incentive for creator (resets monthly to 0, collective across uploads)
      if (beat.producer_id) {
        try {
          const currentMonthPeriod = new Date().toISOString().slice(0, 7) + '-01';
          const { data: monthRow } = await supabase
            .from('producer_download_incentives')
            .select('*')
            .eq('producer_id', beat.producer_id)
            .eq('month_period', currentMonthPeriod)
            .maybeSingle();

          if (monthRow) {
            const newQualifying = (Number(monthRow.qualifying_downloads) || 0) + 1;
            const currentMilestones = Number(monthRow.milestones_reached) || 0;
            const newMilestones = Math.floor(newQualifying / 10000);
            const newReward = newMilestones * 30000;

            await supabase
              .from('producer_download_incentives')
              .update({
                qualifying_downloads: newQualifying,
                milestones_reached: newMilestones,
                reward_amount_ngn: newReward
              })
              .eq('id', monthRow.id);

            if (newMilestones > currentMilestones) {
              const addedReward = (newMilestones - currentMilestones) * 30000;
              const { data: prodProfile } = await supabase
                .from('profiles')
                .select('available_balance_ngn')
                .eq('id', beat.producer_id)
                .maybeSingle();

              await supabase
                .from('profiles')
                .update({
                  is_verified: true,
                  available_balance_ngn: (Number(prodProfile?.available_balance_ngn) || 0) + addedReward
                })
                .eq('id', beat.producer_id);
            }
          } else {
            await supabase
              .from('producer_download_incentives')
              .insert({
                producer_id: beat.producer_id,
                month_period: currentMonthPeriod,
                qualifying_downloads: 1,
                milestones_reached: 0,
                reward_amount_ngn: 0,
                payout_status: 'pending'
              });
          }
        } catch (e) {
          console.warn('Error recording web monthly download incentive:', e);
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

