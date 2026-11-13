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
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_AUTH_URL ||
      'https://auth.cautionstudioz.com';
    const redirectTo = `${origin.replace(/\/$/, '')}/reset-password`;

    // 1. Trigger Supabase native Auth reset
    const { error: standardResetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (standardResetError) {
      console.warn('Standard Supabase reset error:', standardResetError.message);
    }

    // 2. Generate cryptographically signed recovery link via Supabase Service Role Admin
    let actionLink = '';
    try {
      const adminClient = getServiceRoleClient();
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo
        }
      });

      if (!linkError && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link;
      } else if (linkError) {
        console.warn('Admin generateLink error:', linkError.message);
      }
    } catch (err: any) {
      console.warn('Could not generate admin recovery link:', err?.message);
    }

    // 3. Dispatch styled Caution Studio recovery email
    if (actionLink) {
      await sendPasswordResetEmail({
        to: email,
        resetUrl: actionLink,
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
          redirectTarget: redirectTo
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
