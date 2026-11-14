import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceRoleClient } from '../../../../lib/supabaseClient';
import { sendPasswordResetEmail, sendAdminNotification } from '../../../../lib/emailNotifier';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email ? String(body.email).toLowerCase().trim() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_AUTH_URL ||
      req.headers.get('origin') ||
      'https://auth.cautionstudioz.com';
    const cleanOrigin = origin.replace(/\/$/, '');

    // 1. Generate cryptographically signed recovery token and 6-digit OTP via Supabase Service Role Admin
    let otpCode = '';
    let hashedToken = '';
    let resetUrl = `${cleanOrigin}/reset-password?email=${encodeURIComponent(email)}`;

    try {
      const adminClient = getServiceRoleClient();
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email
      });

      if (!linkError && linkData?.properties) {
        otpCode = linkData.properties.email_otp || '';
        hashedToken = linkData.properties.hashed_token || '';
        if (otpCode) {
          resetUrl = `${cleanOrigin}/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(otpCode)}`;
        }
      } else if (linkError) {
        console.warn('Admin generateLink error:', linkError.message);
      }
    } catch (err: any) {
      console.warn('Could not generate admin recovery link:', err?.message);
    }

    // 2. Dispatch official Caution Studio branded recovery email with direct link & 6-digit code
    if (otpCode || resetUrl) {
      await sendPasswordResetEmail({
        to: email,
        resetUrl,
        code: otpCode || undefined,
        userName: email.split('@')[0]
      });

      // Also notify support@cautionstudioz.com
      await sendAdminNotification({
        event: 'GENERAL_ACTIVITY',
        subject: `Password Reset Requested: ${email}`,
        title: 'Account Password Recovery Dispatched',
        description: `A user has requested a password reset link for ${email}.`,
        details: {
          email,
          requestedAt: new Date().toISOString(),
          resetCode: otpCode || 'N/A',
          redirectTarget: resetUrl
        }
      });
    }

    // Always return success to prevent email enumeration / account snooping
    return NextResponse.json({
      success: true,
      message: `If an account with ${email} exists, password reset instructions have been dispatched.`
    });
  } catch (err: any) {
    console.error('Password reset handler error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing password reset' },
      { status: 500 }
    );
  }
}

