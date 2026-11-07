import { NextRequest, NextResponse } from 'next/server';
import { getFromR2 } from '../../../../lib/r2Server';

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    const fullKey = params.key.join('/');
    if (!fullKey) {
      return NextResponse.json({ error: 'Missing object key' }, { status: 400 });
    }

    // If an R2 public CDN / custom domain is configured, redirect directly to Cloudflare
    // to bypass Vercel Fast Origin Transfer completely (0 Vercel bandwidth used).
    const publicR2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || 'https://media.cautionstudioz.com';
    if (publicR2) {
      const targetCdnUrl = `${publicR2.replace(/\/$/, '')}/${fullKey}`;
      return NextResponse.redirect(targetCdnUrl, { status: 307 });
    }

    const object = await getFromR2(fullKey);
    if (!object.Body) {
      return NextResponse.json({ error: 'Media file empty' }, { status: 404 });
    }

    const stream = object.Body.transformToWebStream();

    let contentType = object.ContentType;
    if (!contentType || contentType === 'application/octet-stream') {
      if (fullKey.endsWith('.wav')) contentType = 'audio/wav';
      else if (fullKey.endsWith('.mp3')) contentType = 'audio/mpeg';
      else if (fullKey.endsWith('.flac')) contentType = 'audio/flac';
      else if (fullKey.endsWith('.zip')) contentType = 'application/zip';
      else contentType = 'application/octet-stream';
    }

    return new Response(stream as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': object.ContentLength ? String(object.ContentLength) : '',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }
    console.error('Error fetching media:', err);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
