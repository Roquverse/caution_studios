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

function getSmtpTransporter() {
  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USER || '').trim().replace(/^['"]|['"]$/g, '');
  const pass = (process.env.SMTP_PASS || '').trim().replace(/^['"]|['"]$/g, '');
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) return null;

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 12000,
      greetingTimeout: 8000,
      socketTimeout: 15000
    }),
    user
  };
}

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
  const smtpSetup = getSmtpTransporter();
  if (smtpSetup) {
    try {
      const fromAddr = process.env.EMAIL_FROM || `"Caution Studio" <${smtpSetup.user}>`;
      const info = await smtpSetup.transporter.sendMail({
        from: fromAddr,
        to: recipient,
        subject: `${cfg.icon} ${notification.subject}`,
        html: htmlContent
      });

      console.log(`[Notification Sent via SMTP to ${recipient}]`, notification.subject, info.messageId);
      return { success: true, id: info.messageId };
    } catch (smtpErr: any) {
      console.error('[SMTP notification error]:', smtpErr?.message, smtpErr?.code, smtpErr?.response || '');
    }
  }

  // 3. Fallback: Log full formatted notification telemetry to server console
  console.log(
    `[ADMIN NOTIFICATION -> ${recipient}] ${cfg.icon} ${notification.subject}\n` +
      JSON.stringify(notification.details, null, 2)
  );

  return { success: true, id: 'console-logged' };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface PurchasedBeatEmailItem {
  beatTitle: string;
  producerName?: string;
  licenseType: string;
  priceNgn: number;
  stemsDownloadUrl?: string | null;
  masterWavDownloadUrl?: string | null;
  hasStems?: boolean;
}

export interface BeatPurchaseDeliveryEmailParams {
  buyerEmail: string;
  buyerName?: string;
  orderId?: string;
  reference: string;
  totalAmountNgn: number;
  items: PurchasedBeatEmailItem[];
}

/**
 * Dispatches a delivery email with direct audio stems and master WAV download links
 * to the buyer immediately following a successful beat purchase.
 * NEVER throws or blocks caller execution.
 */
export async function sendBeatPurchaseDeliveryEmail(
  params: BeatPurchaseDeliveryEmailParams
): Promise<{ success: boolean; id?: string; error?: string }> {
  const recipient = (params.buyerEmail || '').trim();
  if (!recipient) {
    console.warn('sendBeatPurchaseDeliveryEmail: No recipient email provided');
    return { success: false, error: 'Missing recipient email' };
  }

  const timestamp = new Date().toUTCString();
  const customerName = params.buyerName || recipient.split('@')[0] || 'Artist';

  const itemsHtml = params.items
    .map((item) => {
      const licenseLabel =
        item.licenseType === 'exclusive'
          ? 'Exclusive Rights (Sole Ownership)'
          : item.licenseType === 'premium'
          ? 'Premium Beat Plan (WAV + Stems)'
          : 'Commercial Beat License';

      const stemsButtonHtml = item.stemsDownloadUrl
        ? `
          <a href="${item.stemsDownloadUrl}" style="display: inline-block; background-color: #2dd4bf; color: #042f2e; font-weight: 700; font-size: 13px; padding: 12px 20px; border-radius: 8px; text-decoration: none; margin-right: 8px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(45, 212, 191, 0.25);">
            🎛️ Download Trackout Stems (.ZIP)
          </a>
        `
        : '';

      const wavButtonHtml = item.masterWavDownloadUrl
        ? `
          <a href="${item.masterWavDownloadUrl}" style="display: inline-block; background-color: #1e2432; color: #f3f4f6; border: 1px solid #374151; font-weight: 700; font-size: 13px; padding: 12px 20px; border-radius: 8px; text-decoration: none; margin-bottom: 8px;">
            🎵 Download Master WAV (24-bit)
          </a>
        `
        : '';

      return `
        <div style="background-color: #07090D; border: 1px solid #1F2432; border-radius: 10px; padding: 20px; margin-bottom: 18px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size: 10px; font-weight: 700; color: #2dd4bf; background: rgba(45, 212, 191, 0.12); border: 1px solid rgba(45, 212, 191, 0.25); padding: 2px 8px; border-radius: 9999px; text-transform: uppercase;">
                  ${escapeHtml(licenseLabel)}
                </span>
                <h3 style="margin: 8px 0 4px 0; font-size: 17px; font-weight: 700; color: #ffffff;">
                  ${escapeHtml(item.beatTitle)}
                </h3>
                <p style="margin: 0 0 14px 0; font-size: 12px; color: #9ca3af;">
                  Produced by <strong style="color: #e5e7eb;">${escapeHtml(item.producerName || 'Caution Studio Creator')}</strong> &bull; ₦${item.priceNgn.toLocaleString()}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 6px;">
                ${stemsButtonHtml}
                ${wavButtonHtml}
                ${!item.stemsDownloadUrl && !item.masterWavDownloadUrl ? `
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #f59e0b;">
                    Files are being prepared. You can also download anytime from your digital Library.
                  </p>
                ` : ''}
              </td>
            </tr>
          </table>
        </div>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Beat Stems & Audio Files - Caution Studio</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #07090D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #0F131C; border: 1px solid #1F2432; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);">
          <!-- Brand Header -->
          <tr>
            <td style="padding: 26px 30px; background: linear-gradient(135deg, #090B10 0%, #111726 100%); border-bottom: 1px solid #1F2432;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 19px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px;">CAUTION STUDIO</span>
                    <span style="font-size: 10px; font-weight: 700; color: #2dd4bf; background: rgba(45, 212, 191, 0.15); border: 1px solid rgba(45, 212, 191, 0.3); padding: 3px 8px; border-radius: 9999px; margin-left: 8px; text-transform: uppercase;">
                      Beat Stems & Audio Delivery
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; background-color: #14532d; color: #86efac;">
                      PAID & LICENSED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                Your Audio Stems & Master Files Are Ready 🎧
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                Hi <strong>${escapeHtml(customerName)}</strong>, thank you for your order! Your commercial beat license and uncompressed trackout stems are ready for download below.
              </p>

              <!-- Order Summary Meta Card -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #07090D; border: 1px solid #1F2432; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 14px; font-size: 11px; color: #9ca3af; text-transform: uppercase; font-family: monospace; border-bottom: 1px solid #1F2432;">
                    PAYSTACK REFERENCE
                  </td>
                  <td style="padding: 10px 14px; font-size: 12px; color: #f3f4f6; font-family: monospace; font-weight: 600; border-bottom: 1px solid #1F2432;">
                    ${escapeHtml(params.reference)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 11px; color: #9ca3af; text-transform: uppercase; font-family: monospace;">
                    TOTAL AMOUNT PAID
                  </td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #2dd4bf; font-weight: 700;">
                    ₦${params.totalAmountNgn.toLocaleString()} NGN
                  </td>
                </tr>
              </table>

              <!-- Beat Items & Download Buttons -->
              <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #d1d5db; text-transform: uppercase; letter-spacing: 0.5px;">
                Purchased Beats & Audio Stems
              </h2>
              ${itemsHtml}

              <!-- Persistent Library Link -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 10px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px; background-color: rgba(45, 212, 191, 0.05); border: 1px solid rgba(45, 212, 191, 0.2); border-radius: 8px;">
                    <strong style="color: #2dd4bf; font-size: 13px; display: block; margin-bottom: 4px;">Always Available in Your Library</strong>
                    <span style="color: #9ca3af; font-size: 12px; line-height: 1.5; display: block; margin-bottom: 10px;">
                      Your purchased stems, master WAV files, and signed legal license certificates are securely stored in your Caution Studio digital vault.
                    </span>
                    <a href="https://cautionstudioz.com/library" style="display: inline-block; background-color: #2dd4bf; color: #042f2e; text-decoration: none; font-weight: 700; font-size: 12px; padding: 8px 16px; border-radius: 6px;">
                      Open Caution Studio Library &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Legal & Rights Info -->
              <div style="padding: 14px 16px; background-color: #07090D; border: 1px solid #1F2432; border-radius: 8px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
                <strong style="color: #e5e7eb;">Commercial License Rights:</strong> You are granted rights to record vocals, mix, master, and commercially distribute songs created with this beat across DSPs (Spotify, Apple Music, YouTube) according to your license agreement. You retain 100% of your master recording royalties.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 22px 30px; background-color: #07090D; border-top: 1px solid #1F2432; font-size: 11px; color: #6b7280; text-align: center; line-height: 1.5;">
              Caution Studio Audio Delivery &bull; Sent to <strong>${escapeHtml(recipient)}</strong><br/>
              Need help or have questions about your stems? Contact our VIP support team at <a href="mailto:support@cautionstudioz.com" style="color: #2dd4bf; text-decoration: none;">support@cautionstudioz.com</a>.<br/>
              Timestamp: ${timestamp}
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const emailSubject = `🎧 Your Beat Stems & Audio Files Are Ready: ${params.items.map((i) => i.beatTitle).join(', ')}`;

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
          from: process.env.EMAIL_FROM || 'Caution Studio <orders@cautionstudioz.com>',
          to: [recipient],
          subject: emailSubject,
          html: htmlContent
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Beat Purchase Email Sent via Resend to ${recipient}]`, emailSubject, data);
        return { success: true, id: data.id };
      }
      const errText = await res.text();
      console.warn('Resend API dispatch error:', errText);
    } catch (e: any) {
      console.warn('Resend API request failed, trying SMTP fallback:', e?.message);
    }
  }

  // 2. Try SMTP Transport via Nodemailer
  const smtpSetup = getSmtpTransporter();
  if (smtpSetup) {
    try {
      const fromAddr = process.env.EMAIL_FROM || `"Caution Studio" <${smtpSetup.user}>`;
      const info = await smtpSetup.transporter.sendMail({
        from: fromAddr,
        to: recipient,
        subject: emailSubject,
        html: htmlContent
      });

      console.log(`[Beat Purchase Email Sent via SMTP to ${recipient}]`, emailSubject, info.messageId);
      return { success: true, id: info.messageId };
    } catch (smtpErr: any) {
      console.error('[SMTP beat purchase email error]:', smtpErr?.message, smtpErr?.code, smtpErr?.response || '');
    }
  }

  // 3. Fallback: Log full formatted notification telemetry to server console
  console.log(
    `[BEAT PURCHASE DELIVERY EMAIL -> ${recipient}] ${emailSubject}\n` +
      JSON.stringify(
        {
          reference: params.reference,
          totalAmountNgn: params.totalAmountNgn,
          items: params.items.map((i) => ({
            beatTitle: i.beatTitle,
            hasStems: !!i.stemsDownloadUrl,
            stemsUrl: i.stemsDownloadUrl
          }))
        },
        null,
        2
      )
  );

  return { success: true, id: 'console-logged' };
}
