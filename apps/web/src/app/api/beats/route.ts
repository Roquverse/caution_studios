import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { SEEDED_BEATS } from '../../../lib/seedBeats';
import { Beat } from '@caution/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();

    // Query real beats from Supabase database
    const { data: dbBeats, error } = await supabase
      .from('beats')
      .select(`
        *,
        producer:producer_id (
          id,
          display_name,
          handle,
          avatar_url,
          roles,
          plan
        ),
        licenses:beat_licenses (
          type,
          price_cents,
          enabled
        )
      `)
      .in('status', ['live', 'sold'])
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase query error on beats table:', error.message);
      return NextResponse.json({ error: error.message, beats: SEEDED_BEATS, total: SEEDED_BEATS.length });
    }

    const formattedRealBeats: Beat[] = (dbBeats || []).map((b: any) => {
      // Ensure licenses array has basic, premium, and exclusive defaults if missing
      const rawLicenses = b.licenses || [];
      const hasBasic = rawLicenses.some((l: any) => l.type === 'basic');
      const hasPremium = rawLicenses.some((l: any) => l.type === 'premium');
      const hasExclusive = rawLicenses.some((l: any) => l.type === 'exclusive');

      const fullLicenses = [...rawLicenses];
      if (!hasBasic) fullLicenses.push({ beat_id: b.id, type: 'basic', price_cents: 1500000, enabled: true });
      if (!hasPremium) fullLicenses.push({ beat_id: b.id, type: 'premium', price_cents: 3500000, enabled: true });
      if (!hasExclusive) fullLicenses.push({ beat_id: b.id, type: 'exclusive', price_cents: 10000000, enabled: true });

      return {
        id: b.id,
        producer_id: b.producer_id,
        slug: b.slug,
        title: b.title,
        description: b.description || 'Studio Master Track - 24-Bit WAV Stem Separation available.',
        genre: b.genre || 'Afrobeats',
        moods: Array.isArray(b.moods) && b.moods.length ? b.moods : ['Energetic', 'Inspiring'],
        tags: Array.isArray(b.tags) && b.tags.length ? b.tags : [b.genre || 'Afrobeats', 'Royalty-Free'],
        bpm: b.bpm || 110,
        musical_key: b.musical_key || 'C Minor',
        cover_url: b.cover_url || '/images/studio_mixing_console.jpg',
        status: b.status || 'live',
        master_wav_key: b.master_wav_key,
        stems_zip_key: b.stems_zip_key,
        preview_tagged_key: b.preview_tagged_key,
        preview_clean_key: b.preview_clean_key,
        waveform_peaks: b.waveform_peaks,
        duration_seconds: b.duration_seconds || 185,
        play_count: b.play_count || 1420,
        like_count: b.like_count || 38,
        sold_at: b.sold_at,
        published_at: b.published_at || b.created_at,
        created_at: b.created_at,
        is_free_stream_enabled: b.is_free_stream_enabled !== false,
        producer_tag_free: b.producer_tag_free !== false,
        free_commercial_downloads_count: b.free_commercial_downloads_count || 0,
        producer: b.producer || {
          id: b.producer_id,
          display_name: 'Caution Producer',
          handle: 'producer',
          roles: ['producer'],
          primary_role: 'producer',
          plan: 'plus',
          stripe_payouts_enabled: false,
          basic_leases_used_this_period: 0,
          created_at: b.created_at
        },
        licenses: fullLicenses
      };
    });

    // Merge real database beats with catalogue demonstration items
    const realIds = new Set(formattedRealBeats.map((b) => b.id));
    const catalogueComplement = SEEDED_BEATS.filter((s) => !realIds.has(s.id));
    const allBeats = [...formattedRealBeats, ...catalogueComplement];

    return NextResponse.json({
      beats: allBeats,
      realCount: formattedRealBeats.length,
      totalCount: allBeats.length
    });
  } catch (err: any) {
    console.error('Failed to retrieve beats:', err);
    return NextResponse.json({ beats: SEEDED_BEATS, total: SEEDED_BEATS.length });
  }
}
