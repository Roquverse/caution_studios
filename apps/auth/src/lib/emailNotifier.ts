import nodemailer from 'nodemailer';

export type ActivityEventType =
  | 'AD_PROMOTION_SUBMITTED'
  | 'BEAT_UPLOADED'
  | 'NEW_USER_REGISTERED'
  | 'LICENSE_PURCHASED'
  | 'SOUNDSTAGE_SUBMISSION'
  | 'PAYOUT_REQUESTED'
  | 'GENERAL_ACTIVITY';

export interface ActivityNotification {
  event: ActivityEventType;
  subject: string;
  title: string;
  description: string;
  actor?: {
    name?: string;
    email?: string;
    role?: string;
    id?: string;
  };
  details: Record<string, string | number | boolean | null | undefined>;
  ctaUrl?: string;
  ctaText?: string;
}

const EVENT_CONFIG: Record<
  ActivityEventType,
  { label: string; badgeBg: string; badgeColor: string; icon: string }
> = {
  AD_PROMOTION_SUBMITTED: {
    label: 'Song Promotion Ad',
    badgeBg: '#78350f',
    badgeColor: '#fde68a',
    icon: '📢'
  },
  BEAT_UPLOADED: {
    label: 'Beat Catalog Upload',
    badgeBg: '#064e3b',
    badgeColor: '#a7f3d0',
    icon: '🎵'
  },
  NEW_USER_REGISTERED: {
    label: 'Account Registration',
    badgeBg: '#1e3a8a',
    badgeColor: '#bfdbfe',
    icon: '👤'
  },
  LICENSE_PURCHASED: {
    label: 'Beat License Purchase',
    badgeBg: '#14532d',
    badgeColor: '#86efac',
    icon: '💰'
  },
  SOUNDSTAGE_SUBMISSION: {
    label: 'Soundstage Audition',
    badgeBg: '#581c87',
    badgeColor: '#e9d5ff',
    icon: '🎙️'
  },
  PAYOUT_REQUESTED: {
    label: 'Producer Payout Request',
    badgeBg: '#701a75',
    badgeColor: '#f5d0fe',
    icon: '💳'
  },
  GENERAL_ACTIVITY: {
    label: 'Studio Telemetry',
    badgeBg: '#374151',
    badgeColor: '#e5e7eb',
    icon: '⚡'
  }
};

/**
 * Dispatches an automated email alert for platform activity directly to support@cautionstudioz.com.
 * Supports Resend API, SMTP, or graceful structured console logging.
 * NEVER throws or blocks caller execution.
 */
export async function sendAdminNotification(
  notification: ActivityNotification
): Promise<{ success: boolean; id?: string; error?: string }> {
  const recipient = process.env.NOTIFICATION_EMAIL || 'support@cautionstudioz.com';
  const cfg = EVENT_CONFIG[notification.event] || EVENT_CONFIG.GENERAL_ACTIVITY;
  const timestamp = new Date().toUTCString();

  const formattedDetailsRows = Object.entries(notification.details)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([key, val]) => `
      <tr>
        <td style="padding: 10px 14px; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-family: monospace; border-bottom: 1px solid #1f242d; width: 35%;">
          ${escapeHtml(key.replace(/_/g, ' '))}
        </td>
        <td style="padding: 10px 14px; font-size: 13px; color: #f3f4f6; font-weight: 600; border-bottom: 1px solid #1f242d;">
          ${escapeHtml(String(val))}
        </td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(notification.subject)}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #07090D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0F131C; border: 1px solid #1F2432; border-radius: 12px; overflow: hidden;">
          <!-- Top Header Brand -->
          <tr>
            <td style="padding: 24px 28px; background: linear-gradient(135deg, #090B10 0%, #111726 100%); border-bottom: 1px solid #1F2432;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">CAUTION STUDIO</span>
                    <span style="font-size: 10px; font-weight: 700; color: #2dd4bf; background: rgba(45, 212, 191, 0.15); border: 1px solid rgba(45, 212, 191, 0.3); padding: 2px 8px; border-radius: 9999px; margin-left: 8px; text-transform: uppercase;">
                      Activity Alert
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; background-color: ${cfg.badgeBg}; color: ${cfg.badgeColor};">
                      ${cfg.icon} ${cfg.label}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px;">
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                ${escapeHtml(notification.title)}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
                ${escapeHtml(notification.description)}
              </p>

              <!-- Details Table -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #07090D; border: 1px solid #1F2432; border-radius: 8px; margin-bottom: 24px; border-collapse: collapse;">
                ${formattedDetailsRows}
              </table>

              ${
                notification.ctaUrl
                  ? `
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                  <tr>
                    <td>
                      <a href="${notification.ctaUrl}" style="display: inline-block; background-color: #2dd4bf; color: #042f2e; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 8px;">
                        ${escapeHtml(notification.ctaText || 'View in Admin Dashboard')} →
                      </a>
                    </td>
                  </tr>
                </table>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background-color: #07090D; border-top: 1px solid #1F2432; font-size: 11px; color: #6b7280; text-align: center;">
              Caution Studio Platform Telemetry &bull; Automated notification sent to <strong>${recipient}</strong><br/>
              Timestamp: ${timestamp}
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // 1. Try Resend HTTP API (Fastest and works with 0 open ports on serverless)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Caution Studio <notifications@cautionstudioz.com>',
          to: [recipient],
          subject: `${cfg.icon} ${notification.subject}`,
          html: htmlContent
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Notification Sent via Resend to ${recipient}]`, notification.subject, data);
        return { success: true, id: data.id };
      }
      const errText = await res.text();
      console.warn('Resend API dispatch error:', errText);
    } catch (e: any) {
      console.warn('Resend API request failed, trying SMTP fallback:', e?.message);
    }
  }

  // 2. Try SMTP Transport via Nodemailer
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Caution Studio" <${process.env.SMTP_USER}>`,
        to: recipient,
        subject: `${cfg.icon} ${notification.subject}`,
        html: htmlContent
      });

      console.log(`[Notification Sent via SMTP to ${recipient}]`, notification.subject, info.messageId);
      return { success: true, id: info.messageId };
    } catch (smtpErr: any) {
      console.warn('SMTP dispatch error:', smtpErr?.message);
    }
  }

  // 3. Fallback: Log full formatted notification telemetry to server console
  console.log(
    `[ADMIN NOTIFICATION -> ${recipient}] ${cfg.icon} ${notification.subject}\n` +
      JSON.stringify(notification.details, null, 2)
  );

  return { success: true, id: 'console-logged' };
}

/**
 * Sends a secure, beautifully formatted Password Reset Email directly to the user.
 * Tries Resend API, SMTP, or logs recovery link for local testing/troubleshooting.
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  code?: string;
  userName?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { to, resetUrl, code, userName } = params;
  const greeting = userName ? `Hello ${userName},` : 'Hello Creator,';
  const timestamp = new Date().toUTCString();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Caution Studio</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #07090D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #eceef2;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #07090D; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #0c0e14; border: 1px solid #1f242d; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="padding: 28px 32px; background: linear-gradient(180deg, #11141c 0%, #0c0e14 100%); border-bottom: 1px solid #1f242d;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                            CAUTION <span style="color: #2dd4bf;">STUDIO</span>
                          </span>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; color: #2dd4bf; background-color: rgba(45, 212, 191, 0.1); border: 1px solid rgba(45, 212, 191, 0.3); padding: 4px 10px; border-radius: 4px;">
                            Account Security
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 36px 32px;">
                    <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">
                      Reset Your Account Password
                    </h1>
                    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                      ${escapeHtml(greeting)}<br/><br/>
                      We received a request to reset the password for your Caution Studio account (<strong>${escapeHtml(to)}</strong>).
                      Use the 6-digit recovery code below or click the button to set your new password:
                    </p>

                    ${
                      code
                        ? `
                    <!-- 6-Digit Verification Code -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                      <tr>
                        <td align="center">
                          <div style="background-color: #12151d; border: 1px dashed rgba(45, 212, 191, 0.5); border-radius: 8px; padding: 20px 32px; display: inline-block;">
                            <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin-bottom: 8px;">
                              6-Digit Password Reset Code
                            </div>
                            <div style="font-size: 36px; font-weight: 900; font-family: monospace; letter-spacing: 8px; color: #2dd4bf;">
                              ${escapeHtml(code)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    `
                        : ''
                    }

                    <!-- CTA Button -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" style="display: inline-block; background-color: #04564f; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; padding: 14px 32px; border-radius: 8px; border: 1px solid #2dd4bf; box-shadow: 0 4px 14px rgba(4, 86, 79, 0.4);">
                            Reset Password on Caution Studio &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback URL -->
                    <p style="margin: 24px 0 12px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                      If the button above does not work, copy and paste this link into your browser:
                    </p>
                    <div style="background-color: #12151d; border: 1px solid #1f242d; border-radius: 6px; padding: 12px; word-break: break-all; font-family: monospace; font-size: 11px; color: #2dd4bf;">
                      <a href="${resetUrl}" style="color: #2dd4bf; text-decoration: none;">${resetUrl}</a>
                    </div>

                    <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #1f242d;">
                      <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                        &#9888; <strong>Security Notice:</strong> This password reset link will expire in 1 hour. If you did not request this password reset, please disregard this email &mdash; your account credentials remain safe and untouched.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #07090D; border-top: 1px solid #1f242d; font-size: 11px; color: #6b7280; text-align: center;">
                    Caution Studio &bull; Next-Gen Music Licensing, Beat Store & Recording Cloud<br/>
                    <a href="https://cautionstudioz.com" style="color: #2dd4bf; text-decoration: none; margin-top: 4px; display: inline-block;">cautionstudioz.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // 1. Try Resend HTTP API
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Caution Studio <security@cautionstudioz.com>',
          to: [to],
          subject: '🔐 Reset Your Caution Studio Password',
          html: htmlContent
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Password Reset Email Sent via Resend to ${to}]`, data);
        return { success: true, id: data.id };
      }
      const errText = await res.text();
      console.warn('Resend API password reset error:', errText);
    } catch (e: any) {
      console.warn('Resend API failed, falling back to SMTP:', e?.message);
    }
  }

  // 2. Try SMTP via Nodemailer
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Caution Studio Security" <${process.env.SMTP_USER}>`,
        to,
        subject: '🔐 Reset Your Caution Studio Password',
        html: htmlContent
      });

      console.log(`[Password Reset Email Sent via SMTP to ${to}]`, info.messageId);
      return { success: true, id: info.messageId };
    } catch (smtpErr: any) {
      console.warn('SMTP password reset error:', smtpErr?.message);
    }
  }

  // 3. Fallback log for local development
  console.log(`[PASSWORD RESET LINK for ${to}]: ${resetUrl}`);
  return { success: true, id: 'logged' };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
