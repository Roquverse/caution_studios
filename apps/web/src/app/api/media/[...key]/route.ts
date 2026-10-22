import { NextRequest, NextResponse } from 'next/server';
import { getFromR2 } from '../../../../lib/r2Server';

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    const rawKey = Array.isArray(params.key) ? params.key.join('/') : params.key;
    if (!rawKey) {
      return NextResponse.json({ error: 'Missing object key' }, { status: 400 });
    }

    // Clean key and protect against path traversal
    const cleanKey = rawKey.replace(/\\/g, '/');
    if (cleanKey.includes('..') || cleanKey.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const object = await getFromR2(cleanKey);
    if (!object.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stream = object.Body.transformToWebStream();

    let contentType = object.ContentType;
    if (!contentType || contentType === 'application/octet-stream') {
      if (cleanKey.endsWith('.wav')) contentType = 'audio/wav';
      else if (cleanKey.endsWith('.mp3')) contentType = 'audio/mpeg';
      else if (cleanKey.endsWith('.flac')) contentType = 'audio/flac';
      else if (cleanKey.endsWith('.zip')) contentType = 'application/zip';
      else if (cleanKey.endsWith('.png')) contentType = 'image/png';
      else if (cleanKey.endsWith('.jpg') || cleanKey.endsWith('.jpeg')) contentType = 'image/jpeg';
      else contentType = 'application/octet-stream';
    }

    const isDownload = req.nextUrl.searchParams.get('download') === '1' || req.nextUrl.searchParams.get('download') === 'true';
    const customFilename = req.nextUrl.searchParams.get('filename') || cleanKey.split('/').pop() || 'caution-audio.mp3';

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': object.ContentLength ? String(object.ContentLength) : '',
      'Cache-Control': isDownload ? 'private, no-cache' : 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes'
    };

    if (isDownload) {
      responseHeaders['Content-Disposition'] = `attachment; filename="${customFilename}"`;
    } else {
      responseHeaders['Content-Disposition'] = 'inline';
    }

    return new NextResponse(stream, {
      headers: responseHeaders
    });
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }
    console.error('Error fetching R2 media:', err);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
