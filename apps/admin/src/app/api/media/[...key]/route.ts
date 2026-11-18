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

    const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;
    const isDownload = searchParams.get('download') === '1' || searchParams.get('download') === 'true';
    const customFilename = searchParams.get('filename') || fullKey.split('/').pop() || 'download';

    // If an R2 public CDN / custom domain is configured, and not forcing attachment download, redirect directly
    const publicR2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || 'https://media.cautionstudioz.com';
    if (publicR2 && !isDownload) {
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
      else if (fullKey.endsWith('.ogg')) contentType = 'audio/ogg';
      else if (fullKey.endsWith('.m4a') || fullKey.endsWith('.aac')) contentType = 'audio/aac';
      else if (fullKey.endsWith('.zip')) contentType = 'application/zip';
      else if (fullKey.endsWith('.png')) contentType = 'image/png';
      else if (fullKey.endsWith('.jpg') || fullKey.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (fullKey.endsWith('.webp')) contentType = 'image/webp';
      else if (fullKey.endsWith('.gif')) contentType = 'image/gif';
      else contentType = 'application/octet-stream';
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': object.ContentLength ? String(object.ContentLength) : '',
      'Cache-Control': 'public, max-age=31536000, immutable'
    };

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(customFilename)}"; filename*=UTF-8''${encodeURIComponent(customFilename)}`;
    }

    return new Response(stream as any, {
      status: 200,
      headers
    });
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }
    console.error('Error fetching media:', err);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
