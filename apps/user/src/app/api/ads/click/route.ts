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
      .select('id, clicks_count')
      .eq('id', adId)
      .maybeSingle();

    if (current) {
      await supabase
        .from('ad_campaigns')
        .update({ clicks_count: (current.clicks_count || 0) + 1 })
        .eq('id', adId);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

