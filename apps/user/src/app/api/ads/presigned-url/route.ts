import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '../../../../lib/r2Server';

export const dynamic = 'force-dynamic';

function cleanSlug(text: string) {
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${clean || 'ad'}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, contentType, type, title } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const safeTitleSlug = cleanSlug(title || filename.split('.')[0] || 'ad');
    const ext = filename.split('.').pop()?.toLowerCase() || (type === 'audio' ? 'mp3' : 'jpg');

    let key = '';
    let finalContentType = contentType;
    if (type === 'audio') {
      key = `ads/${safeTitleSlug}_${Date.now()}.${ext}`;
      if (!finalContentType) finalContentType = 'audio/mpeg';
    } else if (type === 'cover') {
      key = `covers/ads_${safeTitleSlug}_${Date.now()}.${ext}`;
      if (!finalContentType) finalContentType = 'image/jpeg';
    } else {
      key = `ads/${safeTitleSlug}_${Date.now()}.${ext}`;
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

