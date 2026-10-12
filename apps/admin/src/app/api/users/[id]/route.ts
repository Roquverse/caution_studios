import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

// PATCH /api/users/[id] - Update user plan or roles
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json();

    const updateFields: Record<string, any> = {};
    if (body.plan !== undefined) updateFields.plan = body.plan;
    if (body.roles !== undefined) updateFields.roles = body.roles;
    if (body.display_name !== undefined) updateFields.display_name = body.display_name;
    if (body.handle !== undefined) updateFields.handle = body.handle;

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
