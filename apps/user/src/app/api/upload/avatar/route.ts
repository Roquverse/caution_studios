import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '../../../../lib/r2Server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload JPG, PNG, WEBP or GIF' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const targetUserId = userId && userId !== 'demo-user' ? userId : '64d47dcb-3d1f-41dd-8400-46f39c5b0750';
    const key = `avatars/${targetUserId}-${Date.now()}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Upload to Cloudflare R2
    await uploadToR2(key, buffer, file.type);

    // 2. Build media URL served by R2
    const avatarUrl = `/api/media/${key}`;

    // 3. Sync directly into Supabase database (profiles table)
    const supabaseService = getServiceRoleClient();
    const { data: updatedProfile, error: dbError } = await supabaseService
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', targetUserId)
      .select()
      .maybeSingle();

    if (dbError) {
      console.warn('Database avatar update warning:', dbError.message);
    }

    return NextResponse.json({
      success: true,
      key,
      avatarUrl,
      profile: updatedProfile
    });
  } catch (err: any) {
    console.error('Error uploading avatar to R2/database:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process avatar upload' },
      { status: 500 }
    );
  }
}
