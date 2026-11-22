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

    // Helper function to track producer's monthly download incentive (only downloads count, collective across uploads, resets monthly)
    const recordProducerMonthlyDownload = async (producerId: string) => {
      try {
        const currentMonthPeriod = new Date().toISOString().slice(0, 7) + '-01'; // First of current month e.g. "2026-11-01"

        const { data: monthRow } = await supabase
          .from('producer_download_incentives')
          .select('*')
          .eq('producer_id', producerId)
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

          // If a new 10,000 download milestone was reached this month, credit producer profile
          if (newMilestones > currentMilestones) {
            const addedReward = (newMilestones - currentMilestones) * 30000;
            const { data: prodProfile } = await supabase
              .from('profiles')
              .select('available_balance_ngn')
              .eq('id', producerId)
              .maybeSingle();

            await supabase
              .from('profiles')
              .update({
                is_verified: true,
                available_balance_ngn: (Number(prodProfile?.available_balance_ngn) || 0) + addedReward
              })
              .eq('id', producerId);
          }
        } else {
          // Initialize tracking row for current month
          await supabase
            .from('producer_download_incentives')
            .insert({
              producer_id: producerId,
              month_period: currentMonthPeriod,
              qualifying_downloads: 1,
              milestones_reached: 0,
              reward_amount_ngn: 0,
              payout_status: 'pending'
            });
        }
      } catch (e) {
        console.warn('Error recording producer monthly download incentive:', e);
      }
    };

    if (action === 'download') {
      // Enforce active subscription check if auth token is present
      const authHeader = req.headers.get('authorization');
      const cookieHeader = req.headers.get('cookie') || '';
      const matchToken = cookieHeader.match(/(?:^|;\s*)sb-token=([^;]*)/);
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '')
        : matchToken ? decodeURIComponent(matchToken[1]) : null;

      if (token) {
        try {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('plan, subscription_expires_at')
              .eq('id', user.id)
              .maybeSingle();

            const plan = (profile?.plan || '').toLowerCase();
            const isSub = plan === 'plus' || plan === 'pro';
            const isExpired = profile?.subscription_expires_at && new Date(profile.subscription_expires_at).getTime() < Date.now();
            if (!isSub || isExpired) {
              return NextResponse.json(
                { success: false, error: 'SUBSCRIPTION_REQUIRED', message: 'Active Caution Plus or Pro subscription required' },
                { status: 403 }
              );
            }
          }
        } catch (e) {
          console.warn('Subscription check error on download action:', e);
        }
      }

      const newDownloadCount = (beat.free_commercial_downloads_count || 0) + 1;

      const { error: updateError } = await supabase
        .from('beats')
        .update({ free_commercial_downloads_count: newDownloadCount })
        .eq('id', beatId);

      if (updateError) {
        console.warn('Error updating beat download count:', updateError);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      // Record monthly download incentive (collective across all uploads, resets monthly)
      if (beat.producer_id) {
        await recordProducerMonthlyDownload(beat.producer_id);
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

    // Increment producer's streaming count in profiles (plays do not count toward download incentive)
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
