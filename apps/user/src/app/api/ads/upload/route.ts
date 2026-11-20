import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '../../../../lib/r2Server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'audio';
    const title = (formData.get('title') as string) || 'ad';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const safeSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) || 'ad';
    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() || (type === 'cover' ? 'jpg' : 'mp3');
    const folder = type === 'cover' ? 'covers' : 'ads';
    const r2Key = `${folder}/${safeSlug}_${timestamp}.${ext}`;

    const contentType = file.type || (type === 'cover' ? 'image/jpeg' : 'audio/mpeg');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadToR2(r2Key, buffer, contentType);

    const publicR2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || 'https://media.cautionstudioz.com';
    const mediaUrl = publicR2 ? `${publicR2.replace(/\/$/, '')}/${r2Key}` : `/api/media/${r2Key}`;

    return NextResponse.json({
      success: true,
      url: mediaUrl,
      key: r2Key
    });
  } catch (error: any) {
    console.error('Error in /api/ads/upload:', error);
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 });
  }
}
