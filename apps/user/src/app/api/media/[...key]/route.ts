import { NextRequest, NextResponse } from 'next/server';
import { getFromR2 } from '../../../../lib/r2Server';

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    const fullKey = Array.isArray(params.key) ? params.key.join('/') : params.key;
    if (!fullKey) {
      return NextResponse.json({ error: 'Missing object key' }, { status: 400 });
    }

    const rangeHeader = req.headers.get('range');
    const object = await getFromR2(fullKey, rangeHeader || undefined);
    if (!object.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stream = object.Body.transformToWebStream();

    let contentType = object.ContentType;
    if (!contentType || contentType === 'application/octet-stream') {
      if (fullKey.endsWith('.wav')) contentType = 'audio/wav';
      else if (fullKey.endsWith('.mp3')) contentType = 'audio/mpeg';
      else if (fullKey.endsWith('.flac')) contentType = 'audio/flac';
      else if (fullKey.endsWith('.zip')) contentType = 'application/zip';
      else if (fullKey.endsWith('.png')) contentType = 'image/png';
      else if (fullKey.endsWith('.jpg') || fullKey.endsWith('.jpeg')) contentType = 'image/jpeg';
      else contentType = 'application/octet-stream';
    }

    const isDownload = req.nextUrl.searchParams.get('download') === '1' || req.nextUrl.searchParams.get('download') === 'true';
    const customFilename = req.nextUrl.searchParams.get('filename') || fullKey.split('/').pop() || 'caution-track.wav';
    const isPartial = Boolean(rangeHeader && object.ContentRange);

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': object.ContentLength ? String(object.ContentLength) : '',
      'Accept-Ranges': 'bytes',
      'Cache-Control': isDownload ? 'private, no-cache' : 'public, max-age=31536000, immutable'
    };

    if (object.ContentRange) {
      responseHeaders['Content-Range'] = object.ContentRange;
    }

    if (isDownload) {
      responseHeaders['Content-Disposition'] = `attachment; filename="${customFilename}"`;
    } else {
      responseHeaders['Content-Disposition'] = 'inline';
    }

    return new NextResponse(stream, {
      status: isPartial ? 206 : 200,
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
