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

    const object = await getFromR2(fullKey);
    if (!object.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Convert AWS SDK stream to Web ReadableStream
    const stream = object.Body.transformToWebStream();

    return new NextResponse(stream, {
      headers: {
        'Content-Type': object.ContentType || 'application/octet-stream',
        'Content-Length': object.ContentLength ? String(object.ContentLength) : '',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }
    console.error('Error fetching R2 media:', err);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
