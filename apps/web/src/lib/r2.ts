/**
 * Cloudflare R2 Media Storage Client Helpers (Spec Section 1 & 7.1)
 * Zero egress bandwidth storage for Master WAV, Stems, and MP3 previews.
 */

export interface R2UploadUrlParams {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}

export function getR2PublicUrl(key: string): string {
  const domain = process.env.NEXT_PUBLIC_R2_DOMAIN;
  if (domain) {
    return `https://${domain}/${key}`;
  }
  return `/api/media/${encodeURIComponent(key)}`;
}

/**
 * Request a presigned URL to upload directly from client to Cloudflare R2
 */
export async function getPresignedUploadUrl(params: R2UploadUrlParams): Promise<{ uploadUrl: string; key: string }> {
  const response = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    // Demo fallback for development without active R2 credentials
    return {
      uploadUrl: `/api/upload/mock-upload?key=${encodeURIComponent(params.key)}`,
      key: params.key
    };
  }

  return await response.json();
}
