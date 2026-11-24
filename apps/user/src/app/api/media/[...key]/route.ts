import { NextRequest, NextResponse } from 'next/server';
import { getFromR2, getPresignedDownloadUrl, checkObjectExistsInR2 } from '../../../../lib/r2Server';
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

    const fullKey = decodeURIComponent(rawKey.replace(/\\/g, '/'));
    if (fullKey.includes('..') || fullKey.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Confidential stems protection: Stems ZIP archives require commercial license order clearance
    if (fullKey.startsWith('stems/')) {
      return NextResponse.json(
        { error: 'Forbidden: Confidential trackout stems require verified commercial license' },
        { status: 403 }
      );
    }

    const isDownload = req.nextUrl.searchParams.get('download') === '1' || req.nextUrl.searchParams.get('download') === 'true';
    const customFilename = req.nextUrl.searchParams.get('filename') || fullKey.split('/').pop() || 'caution-track.mp3';

    // If downloading, check that object exists in storage and generate a presigned R2 URL
    // with ResponseContentDisposition so Cloudflare R2 serves the exact header:
    // Content-Disposition: attachment; filename="[Title] - [Producer].mp3"
    // This ensures all browsers (iOS Safari, Android, Chrome) save the file with the clean title & creator name.
    if (isDownload) {
      // Record commercial download telemetry and creator download incentives in Supabase
      try {
        const supabase = getServiceRoleClient();
        let { data: matchedBeat } = await supabase
          .from('beats')
          .select('id, producer_id, free_commercial_downloads_count')
          .or(`master_wav_key.eq.${fullKey},preview_clean_key.eq.${fullKey},preview_tagged_key.eq.${fullKey},stems_zip_key.eq.${fullKey}`)
          .limit(1)
          .maybeSingle();

        if (!matchedBeat) {
          const stripped = fullKey.replace(/^(masters|stems|previews|audio)\//, '');
          const { data: fallbackBeat } = await supabase
            .from('beats')
            .select('id, producer_id, free_commercial_downloads_count')
            .or(`master_wav_key.ilike.%${stripped}%,preview_clean_key.ilike.%${stripped}%`)
            .limit(1)
            .maybeSingle();
          matchedBeat = fallbackBeat;
        }

        if (matchedBeat) {
          const newCount = (matchedBeat.free_commercial_downloads_count || 0) + 1;
          await supabase
            .from('beats')
            .update({ free_commercial_downloads_count: newCount })
            .eq('id', matchedBeat.id);

          // Update producer monthly download incentive tracker if producer_id exists
          if (matchedBeat.producer_id) {
            const currentMonthPeriod = new Date().toISOString().slice(0, 7) + '-01';
            const { data: monthRow } = await supabase
              .from('producer_download_incentives')
              .select('*')
              .eq('producer_id', matchedBeat.producer_id)
              .eq('month_period', currentMonthPeriod)
              .maybeSingle();

            if (monthRow) {
              const newQualifying = (Number(monthRow.qualifying_downloads) || 0) + 1;
              const currentMilestones = Number(monthRow.milestones_reached) || 0;
              const newMilestones = Math.floor(newQualifying / 10000);
              const newReward = newMilestones * 30000;

              await supabase
                .from('producer_download_incentives')
                .update({
                  qualifying_downloads: newQualifying,
                  milestones_reached: newMilestones,
                  reward_amount_ngn: newReward
                })
                .eq('id', monthRow.id);

              if (newMilestones > currentMilestones) {
                const addedReward = (newMilestones - currentMilestones) * 30000;
                const { data: prodProfile } = await supabase
                  .from('profiles')
                  .select('available_balance_ngn')
                  .eq('id', matchedBeat.producer_id)
                  .maybeSingle();

                await supabase
                  .from('profiles')
                  .update({
                    is_verified: true,
                    available_balance_ngn: (Number(prodProfile?.available_balance_ngn) || 0) + addedReward
                  })
                  .eq('id', matchedBeat.producer_id);
              }
            } else {
              await supabase
                .from('producer_download_incentives')
                .insert({
                  producer_id: matchedBeat.producer_id,
                  month_period: currentMonthPeriod,
                  qualifying_downloads: 1,
                  milestones_reached: 0,
                  reward_amount_ngn: 0,
                  payout_status: 'pending'
                });
            }
          }
        }
      } catch (dlTelemetryErr) {
        console.warn('Error recording download telemetry in media route:', dlTelemetryErr);
      }

      try {
        const exists = await checkObjectExistsInR2(fullKey);
        if (!exists) {
          return NextResponse.json(
            { error: 'This audio file is still uploading or processing in storage. Please wait a few moments and try again.' },
            { status: 404 }
          );
        }

        const presignedDownloadUrl = await getPresignedDownloadUrl(fullKey, customFilename);
        return NextResponse.redirect(presignedDownloadUrl, { status: 307 });
      } catch (presignErr) {
        console.warn('Presigned download URL generation failed, falling back:', presignErr);
      }
    }

    // If an R2 public CDN / custom domain is configured, redirect directly to Cloudflare
    // to bypass Vercel Fast Origin Transfer completely (0 Vercel bandwidth used).
    const publicR2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || 'https://media.cautionstudioz.com';
    if (publicR2 && !isDownload) {
      const targetCdnUrl = `${publicR2.replace(/\/$/, '')}/${fullKey}`;
      return NextResponse.redirect(targetCdnUrl, { status: 307 });
    }

    const rangeHeader = req.headers.get('range');
    const object = await getFromR2(fullKey, rangeHeader || undefined);
    if (!object.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stream = object.Body.transformToWebStream();

    let contentType = object.ContentType;
    if (!contentType || contentType === 'application/octet-stream') {
      if (fullKey.endsWith('.wav')) contentType = 'audio/wav';
      else if (fullKey.endsWith('.mp3')) contentType = 'audio/mpeg';
      else if (fullKey.endsWith('.flac')) contentType = 'audio/flac';
      else if (fullKey.endsWith('.zip')) contentType = 'application/zip';
      else if (fullKey.endsWith('.png')) contentType = 'image/png';
      else if (fullKey.endsWith('.jpg') || fullKey.endsWith('.jpeg')) contentType = 'image/jpeg';
      else contentType = 'application/octet-stream';
    }

    const isPartial = Boolean(rangeHeader && object.ContentRange);

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': object.ContentLength ? String(object.ContentLength) : '',
      'Accept-Ranges': 'bytes',
      'Cache-Control': isDownload ? 'private, no-cache' : 'public, max-age=31536000, immutable'
    };

    if (object.ContentRange) {
      responseHeaders['Content-Range'] = object.ContentRange;
    }

    if (isDownload) {
      responseHeaders['Content-Disposition'] = `attachment; filename="${customFilename}"`;
    } else {
      responseHeaders['Content-Disposition'] = 'inline';
    }

    return new NextResponse(stream, {
      status: isPartial ? 206 : 200,
      headers: responseHeaders
    });
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }
    console.error('Error fetching R2 media:', err);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
