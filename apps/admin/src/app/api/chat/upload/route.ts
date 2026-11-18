import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '../../../../lib/r2Server';
import { verifyAdminRequest } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No media file provided' }, { status: 400 });
    }

    const contentType = file.type || 'application/octet-stream';
    const isImage = contentType.startsWith('image/');
    const isAudio = contentType.startsWith('audio/') || file.name.endsWith('.wav') || file.name.endsWith('.mp3');

    if (!isImage && !isAudio) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only image and audio files are supported in Studio Chat.' },
        { status: 400 }
      );
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_AUDIO_SIZE_BYTES;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds the limit (${isImage ? '15MB for images' : '50MB for audio'})` },
        { status: 400 }
      );
    }

    const safeFilename = file.name
      .replace(/[/\\?%*:|"<>#]/g, '')
      .replace(/\s+/g, '_')
      .trim();

    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const mediaType = isImage ? 'image' : 'audio';
    const r2Key = `chat-media/${new Date().getFullYear()}/${timestamp}-${uniqueId}-${safeFilename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadToR2(r2Key, buffer, contentType);

    const publicR2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || 'https://media.cautionstudioz.com';
    const mediaUrl = publicR2 ? `${publicR2.replace(/\/$/, '')}/${r2Key}` : `/api/media/${r2Key}`;

    return NextResponse.json({
      success: true,
      media_url: mediaUrl,
      media_key: r2Key,
      media_type: mediaType,
      media_name: file.name,
      media_size: file.size
    });
  } catch (err: any) {
    console.error('Error uploading chat media to R2:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to upload chat media to R2' },
      { status: 500 }
    );
  }
}

