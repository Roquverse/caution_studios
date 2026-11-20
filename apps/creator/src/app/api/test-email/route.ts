import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetEmail = searchParams.get('to') || process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || '';

  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USER || '').trim().replace(/^['"]|['"]$/g, '');
  const pass = (process.env.SMTP_PASS || '').trim().replace(/^['"]|['"]$/g, '');
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const from = process.env.EMAIL_FROM || (user ? `"Caution Studio" <${user}>` : '');
  const resendKey = process.env.RESEND_API_KEY;

  const diagnostics = {
    deploymentTimestamp: new Date().toISOString(),
    app: "creator (creator.cautionstudioz.com)",
    resendConfigured: !!resendKey,
    smtpHost: host || null,
    smtpPort: port,
    smtpSecure: secure,
    smtpUser: user ? `${user.substring(0, 3)}***@${user.split('@')[1] || 'domain'}` : null,
    smtpPassConfigured: !!pass,
    smtpPassLength: pass.length,
    emailFrom: from || null,
    targetEmail: targetEmail || null
  };

  if (!resendKey && (!host || !user || !pass)) {
    return NextResponse.json(
      {
        success: false,
        message: 'No email credentials detected in environment variables on Creator Studio. Add SMTP_HOST, SMTP_USER, SMTP_PASS (or RESEND_API_KEY) in Vercel project settings for Creator Studio.',
        diagnostics
      },
      { status: 400 }
    );
  }

  if (!targetEmail) {
    return NextResponse.json(
      {
        success: false,
        message: 'Please provide a recipient email via ?to=your_email@example.com',
        diagnostics
      },
      { status: 400 }
    );
  }

  // 1. Test Resend if present
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: from || 'Caution Studio <orders@cautionstudioz.com>',
          to: [targetEmail],
          subject: '🧪 Caution Studio Creator Test Email (Resend)',
          html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Caution Studio Email Test</h2><p>Your Resend API configuration on Creator Studio is working!</p></div>`
        })
      });
      const data = await res.json();
      if (res.ok) {
        return NextResponse.json({
          success: true,
          provider: 'resend',
          message: `Test email successfully sent to ${targetEmail} via Resend`,
          details: data,
          diagnostics
        });
      }
      return NextResponse.json(
        {
          success: false,
          provider: 'resend',
          message: 'Resend API returned an error',
          details: data,
          diagnostics
        },
        { status: 502 }
      );
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          provider: 'resend',
          message: err?.message || 'Failed connecting to Resend API',
          diagnostics
        },
        { status: 500 }
      );
    }
  }

  // 2. Test SMTP
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 6000,
      socketTimeout: 12000
    });

    const info = await transporter.sendMail({
      from,
      to: targetEmail,
      subject: '🧪 Caution Studio Creator Test Email (SMTP)',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #07090D; color: #f3f4f6; padding: 30px; border-radius: 10px;">
          <h2 style="color: #2dd4bf; margin-top: 0;">Caution Studio SMTP Test (Creator)</h2>
          <p>Your SMTP email configuration is active and working correctly on Creator Studio!</p>
          <p style="color: #9ca3af; font-size: 13px;">Host: ${host} &bull; Port: ${port} &bull; User: ${user}</p>
        </div>
      `
    });

    return NextResponse.json({
      success: true,
      provider: 'smtp',
      message: `Test email successfully sent to ${targetEmail} via SMTP!`,
      messageId: info.messageId,
      diagnostics
    });
  } catch (smtpErr: any) {
    return NextResponse.json(
      {
        success: false,
        provider: 'smtp',
        errorName: smtpErr?.name,
        errorCode: smtpErr?.code,
        errorMessage: smtpErr?.message,
        smtpResponse: smtpErr?.response || null,
        message: 'SMTP failed to send. Check credentials or port/security settings.',
        diagnostics
      },
      { status: 500 }
    );
  }
}
