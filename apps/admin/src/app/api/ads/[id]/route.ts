import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { verifyAdminRequest } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing campaign id' }, { status: 400 });
    }

    const body = await req.json();
    const supabase = getServiceRoleClient();

    const allowedFields: Record<string, any> = {};
    if (body.renew) {
      allowedFields.status = 'active';
      allowedFields.starts_at = new Date().toISOString();
      allowedFields.ends_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      if (body.status !== undefined) allowedFields.status = body.status;
      if (body.starts_at !== undefined) allowedFields.starts_at = body.starts_at;
      if (body.ends_at !== undefined) allowedFields.ends_at = body.ends_at;
    }
    if (body.target_plays !== undefined) allowedFields.target_plays = Number(body.target_plays);
    if (body.price_ngn !== undefined) allowedFields.price_ngn = Number(body.price_ngn);
    if (body.campaign_name !== undefined) allowedFields.campaign_name = body.campaign_name;
    if (body.spotify_url !== undefined) allowedFields.spotify_url = body.spotify_url;
    if (body.apple_music_url !== undefined) allowedFields.apple_music_url = body.apple_music_url;
    if (body.audiomack_url !== undefined) allowedFields.audiomack_url = body.audiomack_url;
    if (body.youtube_url !== undefined) allowedFields.youtube_url = body.youtube_url;

    const { data: updated, error } = await supabase
      .from('ad_campaigns')
      .update(allowedFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ad campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaign: updated });
  } catch (err: any) {
    console.error('Error in PATCH /api/ads/[id]:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing campaign id' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase.from('ad_campaigns').delete().eq('id', id);

    if (error) {
      console.error('Error deleting ad campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/ads/[id]:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

