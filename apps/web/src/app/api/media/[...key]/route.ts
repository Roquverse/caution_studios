import { NextRequest, NextResponse } from 'next/server';
import { getFromR2 } from '../../../../lib/r2Server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    const rawKey = Array.isArray(params.key) ? params.key.join('/') : params.key;
    if (!rawKey) {
      return NextResponse.json({ error: 'Missing object key' }, { status: 400 });
    }

    // Path traversal defense
    const cleanKey = rawKey.replace(/\\/g, '/');
    if (cleanKey.includes('..') || cleanKey.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Security categorization: Public vs Protected assets
    const isMasterOrStem = cleanKey.startsWith('masters/') || cleanKey.startsWith('stems/') || cleanKey.startsWith('licenses/');

    if (isMasterOrStem) {
      // Require authentication
      const authHeader = req.headers.get('authorization') || '';
      const urlToken = req.nextUrl.searchParams.get('token') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim() || urlToken;

      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized: Access to studio masters and stems requires a valid license session' },
          { status: 401 }
        );
      }

      const supabase = getServiceRoleClient();
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

      if (authErr || !user) {
        // Allow demo token for local testing if not in strict production
        const isDemo = token.startsWith('demo_') && process.env.NODE_ENV !== 'production';
        if (!isDemo) {
          return NextResponse.json({ error: 'Invalid or expired license authorization token' }, { status: 401 });
        }
      }

      // Check admin status or license ownership if user authenticated
      if (user) {
        const appMeta = user.app_metadata || {};
        const isAdmin = appMeta.is_admin === true || appMeta.role === 'admin';

        if (!isAdmin) {
          // Extract beat identifier or file name from key
          const fileName = cleanKey.split('/').pop() || '';
          const beatIdentifier = fileName.split('-')[0].split('.')[0];

          // Check if user has an issued license or paid order item for this beat
          const { data: userLicense } = await supabase
            .from('licenses')
            .select('id')
            .eq('buyer_id', user.id)
            .or(`beat_id.eq.${beatIdentifier},agreement_pdf_key.eq.${cleanKey}`)
            .maybeSingle();

          const { data: userOrder } = await supabase
            .from('order_items')
            .select('id, orders!inner(buyer_id, status)')
            .eq('orders.buyer_id', user.id)
            .eq('orders.status', 'paid')
            .maybeSingle();

          if (!userLicense && !userOrder) {
            return NextResponse.json(
              { error: 'Forbidden: No active commercial license found for this studio master' },
              { status: 403 }
            );
          }
        }
      }
    }

    const object = await getFromR2(cleanKey);
    if (!object.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Convert AWS SDK stream to Web ReadableStream
    const stream = object.Body.transformToWebStream();

    const isDownload = cleanKey.startsWith('masters/') || cleanKey.startsWith('stems/') || cleanKey.startsWith('licenses/');
    const fileName = cleanKey.split('/').pop() || 'media';

    return new NextResponse(stream, {
      headers: {
        'Content-Type': object.ContentType || 'application/octet-stream',
        'Content-Length': object.ContentLength ? String(object.ContentLength) : '',
        'Content-Disposition': isDownload ? `attachment; filename="${fileName}"` : 'inline',
        'Cache-Control': isDownload ? 'private, no-cache' : 'public, max-age=31536000, immutable'
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
