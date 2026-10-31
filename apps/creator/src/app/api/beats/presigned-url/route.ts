import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '../../../../lib/r2Server';
import { supabase as publicSupabase } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

function cleanSlug(text: string) {
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${clean || 'beat'}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const { data: { user } } = await publicSupabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    if (!userId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/sb-token=([^;]+)/);
      if (match) {
        const { data: { user } } = await publicSupabase.auth.getUser(match[1]);
        if (user) userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Producer sign-in required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { filename, contentType, type, title } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const safeTitleSlug = cleanSlug(title || filename.split('.')[0] || 'track');
    const ext = filename.split('.').pop()?.toLowerCase() || (type === 'audio' ? 'wav' : type === 'stems' ? 'zip' : 'jpg');

    let key = '';
    if (type === 'audio') {
      key = `masters/${safeTitleSlug}_${Date.now()}.${ext}`;
    } else if (type === 'stems') {
      key = `stems/${safeTitleSlug}_${Date.now()}.${ext}`;
    } else if (type === 'cover') {
      key = `covers/${safeTitleSlug}_${Date.now()}.${ext}`;
    } else {
      key = `uploads/${safeTitleSlug}_${Date.now()}.${ext}`;
    }

    const uploadUrl = await getPresignedUploadUrl(key, contentType || 'application/octet-stream');

    return NextResponse.json({
      uploadUrl,
      key
    });
  } catch (err: any) {
    console.error('Error generating presigned upload URL:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate presigned upload URL' },
      { status: 500 }
    );
  }
}

