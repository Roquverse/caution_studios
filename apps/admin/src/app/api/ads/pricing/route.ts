import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { verifyAdminRequest } from '../../../../lib/adminAuth';

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

export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const body = await req.json();
    const {
      stream_ad_price_ngn,
      download_ad_price_ngn,
      both_placements_price_ngn,
      stream_ad_plays,
      download_ad_plays,
      both_placements_plays
    } = body;

    const streamPrice = Number(stream_ad_price_ngn) || 15000;
    const downloadPrice = Number(download_ad_price_ngn) || 15000;
    const bothPrice = Number(both_placements_price_ngn) || 25000;

    const payload = {
      stream_ad_price_ngn: streamPrice,
      download_ad_price_ngn: downloadPrice,
      both_placements_price_ngn: bothPrice,
      stream_ad_plays: Number(stream_ad_plays) || 5000,
      download_ad_plays: Number(download_ad_plays) || 5000,
      both_placements_plays: Number(both_placements_plays) || 12000
    };

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        key: 'ad_pricing',
        value: payload,
        updated_at: new Date().toISOString()
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ad placement pricing updated successfully',
      pricing: payload
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update pricing' }, { status: 500 });
  }
}

