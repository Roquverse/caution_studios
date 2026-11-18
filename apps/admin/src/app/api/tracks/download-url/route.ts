import { NextRequest, NextResponse } from 'next/server';
import { getPresignedDownloadUrl } from '../../../../lib/r2Server';
import { verifyAdminRequest } from '../../../../lib/adminAuth';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const body = await req.json();
    const { key, filename, beatId, type } = body;

    let targetKey = key;
    let targetFilename = filename;

    // If beatId and type are specified, look up beat from database
    if (beatId && !targetKey) {
      const supabase = getServiceRoleClient();
      const { data: beat, error: beatErr } = await supabase
        .from('beats')
        .select('id, title, master_wav_key, preview_clean_key, stems_zip_key')
        .eq('id', beatId)
        .maybeSingle();

      if (beatErr || !beat) {
        return NextResponse.json({ error: 'Beat track not found' }, { status: 404 });
      }

      const beatTitle = beat.title || 'Caution Beat';

      if (type === 'wav' || type === 'master') {
        targetKey = beat.master_wav_key;
        targetFilename = `${beatTitle} - Master (24-bit).wav`;
      } else if (type === 'stems' || type === 'zip') {
        targetKey = beat.stems_zip_key;
        targetFilename = `${beatTitle} - Stems.zip`;
      } else if (type === 'preview' || type === 'mp3') {
        targetKey = beat.preview_clean_key || beat.master_wav_key;
        targetFilename = `${beatTitle} - Preview.mp3`;
      }
    }

    if (!targetKey) {
      return NextResponse.json(
        { error: 'Asset not found for this beat track. It may not have been uploaded yet.' },
        { status: 404 }
      );
    }

    const safeFilename = targetFilename || targetKey.split('/').pop() || 'caution-beat-asset';

    try {
      const downloadUrl = await getPresignedDownloadUrl(targetKey, safeFilename, 60 * 60 * 24 * 7);
      return NextResponse.json({
        success: true,
        downloadUrl,
        key: targetKey,
        filename: safeFilename
      });
    } catch (e) {
      // Fallback to local streaming proxy if presigning fails
      const fallbackUrl = `/api/media/${encodeURIComponent(targetKey)}?download=1&filename=${encodeURIComponent(safeFilename)}`;
      return NextResponse.json({
        success: true,
        downloadUrl: fallbackUrl,
        key: targetKey,
        filename: safeFilename
      });
    }
  } catch (err: any) {
    console.error('Error generating admin beat download URL:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
