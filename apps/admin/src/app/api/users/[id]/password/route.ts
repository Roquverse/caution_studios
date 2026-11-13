import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../../lib/supabaseClient';
import { verifyAdminRequest } from '../../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

// POST /api/users/[id]/password - Explicit Admin password reset/update
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const { password } = await req.json();

    if (!password || typeof password !== 'string' || password.trim().length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Verify user exists
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(params.id);
    if (getUserError || !userData?.user) {
      return NextResponse.json(
        { error: 'User not found in authentication registry' },
        { status: 404 }
      );
    }

    // Update password via Supabase Auth Admin
    const { error: updateError } = await supabase.auth.admin.updateUserById(params.id, {
      password: password.trim()
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password updated successfully for ${userData.user.email || params.id}`
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error while updating password' },
      { status: 500 }
    );
  }
}
