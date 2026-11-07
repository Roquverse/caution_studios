import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { adId } = await req.json();
    if (!adId || adId.startsWith('promo-fallback')) {
      return NextResponse.json({ ok: true });
    }

    const supabase = getServiceRoleClient();
    const { data: current } = await supabase
      .from('ad_campaigns')
      .select('id, delivered_plays, target_plays')
      .eq('id', adId)
      .maybeSingle();

    if (current) {
      const nextCount = (current.delivered_plays || 0) + 1;
      const updates: any = { delivered_plays: nextCount };
      if (current.target_plays && nextCount >= current.target_plays) {
        updates.status = 'completed';
      }
      await supabase.from('ad_campaigns').update(updates).eq('id', adId);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
