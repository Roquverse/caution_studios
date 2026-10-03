import { LicenseType } from '@caution/types';

export interface LicenseTerms {
  type: LicenseType;
  name: string;
  defaultPriceNgn: number;
  defaultPriceCents: number;
  streamCap: number | null; // null = unlimited
  videoCap: number | null;
  distributionCap: string;
  filesDelivered: string[];
  includesStems: boolean;
  isExclusive: boolean;
  radioBroadcasting: boolean;
  forProfitLivePerformances: boolean;
  description: string;
}

export const LICENSE_DEFINITIONS: Record<LicenseType, LicenseTerms> = {
  basic: {
    type: 'basic',
    name: 'Starter Lease',
    defaultPriceNgn: 3000,
    defaultPriceCents: 3000, // $30.00
    streamCap: 100000,
    videoCap: 1,
    distributionCap: 'Up to 2,500 copies (CD/digital sales)',
    filesDelivered: ['Master MP3 (320kbps untagged)'],
    includesStems: false,
    isExclusive: false,
    radioBroadcasting: false,
    forProfitLivePerformances: false,
    description: 'Perfect for demo recording, YouTube, TikTok, and introductory streaming releases.'
  },
  premium: {
    type: 'premium',
    name: 'Premium Beat Lease',
    defaultPriceNgn: 30000,
    defaultPriceCents: 15000, // $150.00
    streamCap: 500000,
    videoCap: 2,
    distributionCap: 'Up to 10,000 copies (CD/digital sales)',
    filesDelivered: [
      'Master WAV (24-bit 44.1kHz)',
      'Master MP3 (320kbps)',
      'Separated Trackout Stems (.ZIP)'
    ],
    includesStems: true,
    isExclusive: false,
    radioBroadcasting: true,
    forProfitLivePerformances: true,
    description: 'For serious artists. Includes separated track stems, radio play, and commercial streaming clearance.'
  },
  exclusive: {
    type: 'exclusive',
    name: 'Exclusive Rights',
    defaultPriceNgn: 100000,
    defaultPriceCents: 60000, // $600.00
    streamCap: null, // Unlimited
    videoCap: null, // Unlimited
    distributionCap: 'Unlimited commercial sales and distribution',
    filesDelivered: [
      'Sole Master WAV (24-bit studio quality)',
      'Master MP3 (320kbps)',
      'Full Separated Trackout Stems (.ZIP)',
      'Exclusive Copyright Assignment Contract'
    ],
    includesStems: true,
    isExclusive: true,
    radioBroadcasting: true,
    forProfitLivePerformances: true,
    description: '100% sole exclusive ownership. The beat is permanently retired from Caution Studio.'
  }
};

/**
 * Generate standard Caution Studio Legal Agreement Document (HTML/PDF representation)
 */
export function generateLicenseAgreementHtml(params: {
  licenseId: string;
  licenseType: LicenseType;
  beatTitle: string;
  producerName: string;
  buyerName: string;
  buyerEmail: string;
  amountPaid: string;
  date: string;
}): string {
  const terms = LICENSE_DEFINITIONS[params.licenseType];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Caution Studio License Agreement - ${params.licenseId}</title>
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; background: #0B0C0C; color: #F5F5F2; padding: 40px; margin: 0; line-height: 1.6; }
    .header { border-bottom: 1px solid #26292A; padding-bottom: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.03em; color: #F5F5F2; }
    .badge { background: #121414; border: 1px solid #26292A; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; color: #3DBFA8; }
    .section { margin-bottom: 24px; background: #121414; border: 1px solid #26292A; border-radius: 6px; padding: 20px; }
    .title { font-size: 16px; font-weight: 700; color: #F5F5F2; margin-top: 0; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .label { font-size: 11px; text-transform: uppercase; color: #A9ABA8; font-weight: 600; }
    .value { font-size: 14px; font-weight: 600; color: #F5F5F2; margin-top: 2px; }
    .clause { font-size: 13px; color: #A9ABA8; margin-bottom: 8px; }
    .footer { border-top: 1px solid #26292A; padding-top: 20px; font-size: 12px; color: #6B6E6C; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">CAUTION STUDIO</div>
      <div style="font-size: 12px; color: #A9ABA8; margin-top: 4px;">Music Rights & Master Audio Clearance</div>
    </div>
    <div class="badge">${terms.name.toUpperCase()}</div>
  </div>

  <div class="section">
    <div class="title">Agreement Parties & Master Details</div>
    <div class="grid">
      <div>
        <div class="label">Composition / Beat Title</div>
        <div class="value">${params.beatTitle}</div>
      </div>
      <div>
        <div class="label">Producer (Grantor)</div>
        <div class="value">${params.producerName}</div>
      </div>
      <div>
        <div class="label">Licensee / Buyer</div>
        <div class="value">${params.buyerName} (${params.buyerEmail})</div>
      </div>
      <div>
        <div class="label">Execution Date</div>
        <div class="value">${params.date}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="title">Permitted Rights & Limitations</div>
    <div class="clause">1. <strong>Audio Streams:</strong> ${terms.streamCap === null ? 'Unlimited monetized streams.' : `Capped at ${terms.streamCap.toLocaleString()} total monetized streams across digital service providers.`}</div>
    <div class="clause">2. <strong>Music Videos:</strong> ${terms.videoCap === null ? 'Unlimited music video synchronization rights.' : `Permitted on up to ${terms.videoCap} monetized music video (e.g., YouTube, Vevo).`}</div>
    <div class="clause">3. <strong>Broadcasting:</strong> ${terms.radioBroadcasting ? 'Terrestrial and satellite radio rotation permitted.' : 'No terrestrial broadcast without prior written agreement.'}</div>
    <div class="clause">4. <strong>Trackout Stems:</strong> ${terms.includesStems ? 'Full WAV trackout stems granted for mixing and vocal adaptation.' : 'Stereo master audio only. Stems not included.'}</div>
    <div class="clause">5. <strong>Exclusivity:</strong> ${terms.isExclusive ? 'Sole exclusive ownership. All future licensing terminated permanently.' : 'Non-exclusive. Grantor reserves rights to license this master to third parties.'}</div>
  </div>

  <div class="footer">
    Document Reference: ${params.licenseId} · Caution Studio Platform Security Verification · Tamper-evident electronic record.
  </div>
</body>
</html>`;
}
