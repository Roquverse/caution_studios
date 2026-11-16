import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email ? String(body.email).toLowerCase().trim() : '';
    const code = body.code ? String(body.code).trim().replace(/\s+/g, '') : '';
    const password = body.password ? String(body.password).trim() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }
    if (!code || code.length < 6) {
      return NextResponse.json({ error: 'A valid 6-digit code is required' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // 1. Verify OTP with Supabase Auth
    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery'
    });

    if (otpError || !otpData?.user) {
      const msg = otpError?.message || '';
      const isExpired = msg.toLowerCase().includes('expired');
      const isInvalid = msg.toLowerCase().includes('invalid');

      return NextResponse.json(
        {
          error: isExpired
            ? 'The 6-digit code has expired. If you requested multiple codes, please enter the code from the most recent email.'
            : isInvalid
            ? 'Invalid 6-digit code. Please verify the code in your latest email or request a new one.'
            : msg || 'Verification failed. Please check your code.'
        },
        { status: 400 }
      );
    }

    // 2. Update user's password using Admin Service Role Client
    const adminClient = getServiceRoleClient();
    const { error: updateError } = await adminClient.auth.admin.updateUserById(otpData.user.id, {
      password
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated'
    });
  } catch (err: any) {
    console.error('Reset password route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing password update' },
      { status: 500 }
    );
  }
}

