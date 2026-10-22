import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '../../../../lib/r2Server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const requestedUserId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate mime type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload JPG, PNG, WEBP or GIF' },
        { status: 400 }
      );
    }

    // Limit size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const supabaseService = getServiceRoleClient();
    let effectiveUserId = requestedUserId;

    // Verify authentication if token provided
    if (token) {
      const { data: { user }, error: authErr } = await supabaseService.auth.getUser(token);
      if (authErr || !user) {
        return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
      }

      // Check IDOR: If caller specifies a different userId than their authenticated ID
      if (requestedUserId && requestedUserId !== user.id) {
        const appMeta = user.app_metadata || {};
        const isAdmin = appMeta.is_admin === true || appMeta.role === 'admin';
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Forbidden: Cannot update avatar for another user' },
            { status: 403 }
          );
        }
      }
      effectiveUserId = user.id;
    }

    const targetUserId = effectiveUserId && effectiveUserId !== 'demo-user'
      ? effectiveUserId
      : '64d47dcb-3d1f-41dd-8400-46f39c5b0750';

    // Determine extension safely
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `avatars/${targetUserId}-${Date.now()}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Upload to Cloudflare R2
    await uploadToR2(key, buffer, file.type);

    // 2. Build media URL served by R2
    const avatarUrl = `/api/media/${key}`;

    // 3. Sync directly into Supabase database (profiles table)
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
