import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '../../../../lib/r2Server';
import { verifyAdminRequest } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

function cleanSlug(text: string) {
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${clean || 'track'}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const body = await req.json();
    const { filename, contentType, type, title } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const safeTitleSlug = cleanSlug(title || filename.split('.')[0] || 'track');
    const ext = filename.split('.').pop()?.toLowerCase() || (type === 'audio' ? 'wav' : type === 'stems' ? 'zip' : 'jpg');

    let key = '';
    let finalContentType = contentType;
    if (type === 'audio') {
      key = `masters/${safeTitleSlug}_${Date.now()}.${ext}`;
      if (!finalContentType) finalContentType = 'audio/wav';
    } else if (type === 'stems') {
      const stemExt = ext.includes('zip') || ext.includes('rar') || ext.includes('tar') || ext.includes('7z') ? ext : 'zip';
      key = `stems/${safeTitleSlug}_${Date.now()}.${stemExt}`;
      if (!finalContentType || finalContentType === 'application/octet-stream') finalContentType = 'application/zip';
    } else if (type === 'cover') {
      key = `covers/${safeTitleSlug}_${Date.now()}.${ext}`;
      if (!finalContentType) finalContentType = 'image/jpeg';
    } else {
      key = `uploads/${safeTitleSlug}_${Date.now()}.${ext}`;
      if (!finalContentType) finalContentType = 'application/octet-stream';
    }

    const uploadUrl = await getPresignedUploadUrl(key, finalContentType);

    return NextResponse.json({
      uploadUrl,
      key
    });
  } catch (err: any) {
    console.error('Error generating admin presigned upload URL:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate presigned upload URL' },
      { status: 500 }
    );
  }
}
