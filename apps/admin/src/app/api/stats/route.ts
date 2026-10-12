import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

// GET /api/stats - Aggregated platform statistics
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();

    // 1. Total tracks count
    const { count: tracksCount, error: countErr } = await supabase
      .from('beats')
      .select('*', { count: 'exact', head: true });
    if (countErr) console.error('countErr:', countErr);

    // 2. Total profiles count
    const { count: usersCount, error: usersErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (usersErr) console.error('usersErr:', usersErr);

    // 3. Plus subscribers count
    const { count: plusCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'plus');

    // 4. Recent tracks
    const { data: recentTracks, error: recErr } = await supabase
      .from('beats')
      .select('id, title, slug, genre, bpm, play_count, cover_url, duration_seconds, status, created_at')
      .order('created_at', { ascending: false })
      .limit(6);
    if (recErr) console.error('recErr:', recErr);

    // 5. Total plays
    const { data: playsData } = await supabase
      .from('beats')
      .select('play_count');

    const totalPlays = (playsData || []).reduce((acc, curr) => acc + (curr.play_count || 0), 0);

    // 6. Total orders / licenses count
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const { data: allBeats, error: beatsErr } = await supabase
      .from('beats')
      .select('id, title, slug, genre, bpm, play_count, cover_url, duration_seconds, status, created_at')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      tracksCount: allBeats ? allBeats.length : 0,
      usersCount: usersCount || 0,
      plusCount: plusCount || 0,
      totalPlays,
      ordersCount: ordersCount || 0,
      recentTracks: (allBeats || []).slice(0, 6)
    });
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
