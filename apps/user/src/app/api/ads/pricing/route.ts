import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

const DEFAULT_AD_PRICING = {
  stream_ad_price_ngn: 15000,
  download_ad_price_ngn: 15000,
  both_placements_price_ngn: 25000,
  stream_ad_plays: 5000,
  download_ad_plays: 5000,
  both_placements_plays: 12000
};

export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'ad_pricing')
      .maybeSingle();

    if (error || !data?.value) {
      return NextResponse.json(DEFAULT_AD_PRICING);
    }

    return NextResponse.json({
      ...DEFAULT_AD_PRICING,
      ...data.value
    });
  } catch (err: any) {
    return NextResponse.json(DEFAULT_AD_PRICING);
  }
}

