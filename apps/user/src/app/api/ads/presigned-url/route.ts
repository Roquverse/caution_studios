import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '../../../../lib/r2Server';

export const dynamic = 'force-dynamic';

function getActualSafeName(title?: string, filename?: string) {
  const base = (title && title.trim()) || (filename ? filename.replace(/\.[^/.]+$/, '') : 'ad');
  const clean = base
    .trim()
    .replace(/[/\\?%*:|"<>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || 'ad';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, contentType, type, title } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const actualName = getActualSafeName(title, filename);
    const ext = filename.split('.').pop()?.toLowerCase() || (type === 'audio' ? 'mp3' : 'jpg');

    let key = '';
    let finalContentType = contentType;
    if (type === 'audio') {
      key = `ads/${actualName}.${ext}`;
      if (!finalContentType) finalContentType = 'audio/mpeg';
    } else if (type === 'cover') {
      key = `covers/ads_${actualName}.${ext}`;
      if (!finalContentType) finalContentType = 'image/jpeg';
    } else {
      key = `ads/${actualName}.${ext}`;
      if (!finalContentType) finalContentType = 'application/octet-stream';
    }

    const uploadUrl = await getPresignedUploadUrl(key, finalContentType);

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl: `https://media.cautionstudioz.com/${key}`
    });
  } catch (err: any) {
    console.error('Error generating ad presigned upload URL:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate presigned upload URL' },
      { status: 500 }
    );
  }
}

