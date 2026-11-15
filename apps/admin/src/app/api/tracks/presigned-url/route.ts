import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '../../../../lib/r2Server';
import { verifyAdminRequest } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

function getActualSafeName(title?: string, filename?: string) {
  const base = (title && title.trim()) || (filename ? filename.replace(/\.[^/.]+$/, '') : 'track');
  const clean = base
    .trim()
    .replace(/[/\\?%*:|"<>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || 'track';
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

    const actualName = getActualSafeName(title, filename);
    const ext = filename.split('.').pop()?.toLowerCase() || (type === 'audio' ? 'wav' : type === 'stems' ? 'zip' : 'jpg');

    let key = '';
    let finalContentType = contentType;
    if (type === 'audio') {
      key = `masters/${actualName}.${ext}`;
      if (!finalContentType) finalContentType = 'audio/wav';
    } else if (type === 'stems') {
      const stemExt = ext.includes('zip') || ext.includes('rar') || ext.includes('tar') || ext.includes('7z') ? ext : 'zip';
      key = `stems/${actualName} - Stems.${stemExt}`;
      if (!finalContentType || finalContentType === 'application/octet-stream') finalContentType = 'application/zip';
    } else if (type === 'cover') {
      key = `covers/${actualName} - Artwork.${ext}`;
      if (!finalContentType) finalContentType = 'image/jpeg';
    } else {
      key = `uploads/${actualName}.${ext}`;
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

