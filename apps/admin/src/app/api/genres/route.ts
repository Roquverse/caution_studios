import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

interface GenreItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  trackCount?: number;
}

const GENRES_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'genres.json');

const DEFAULT_GENRES: GenreItem[] = [
  { id: 'afrobeats', name: 'Afrobeats', slug: 'afrobeats', description: 'West African pop, dancehall rhythms, percussion and groove.' },
  { id: 'amapiano', name: 'Amapiano', slug: 'amapiano', description: 'Deep house, jazz and lounge music with log-drum basslines.' },
  { id: 'hip-hop', name: 'Hip Hop', slug: 'hip-hop', description: '808 beats, trap drums, boom-bap, modern rap instrumentals.' },
  { id: 'cinematic', name: 'Cinematic', slug: 'cinematic', description: 'Orchestral, trailer, score, and ambient dramatic compositions.' },
  { id: 'electronic', name: 'Electronic', slug: 'electronic', description: 'EDM, house, techno, future bass, synthwave and club productions.' },
  { id: 'r-and-b', name: 'R&B', slug: 'r-and-b', description: 'Soulful chord progressions, smooth vocal chops, mellow bounce.' },
  { id: 'funk', name: 'Funk', slug: 'funk', description: 'Groovy basslines, syncopated guitars, retro and neo-funk vibes.' },
  { id: 'lofi', name: 'Lofi', slug: 'lofi', description: 'Chill, vintage, jazzy beats with vinyl crackle and relaxed tempos.' },
  { id: 'pop', name: 'Pop', slug: 'pop', description: 'Catchy melodies, commercial radio ready hooks and modern arrangements.' },
  { id: 'rock', name: 'Rock', slug: 'rock', description: 'Electric guitars, live acoustic drums, alternative and indie energies.' }
];

function readGenres(): GenreItem[] {
  try {
    if (fs.existsSync(GENRES_FILE_PATH)) {
      const data = fs.readFileSync(GENRES_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading genres.json:', err);
  }
  return DEFAULT_GENRES;
}

function writeGenres(genres: GenreItem[]) {
  try {
    const dir = path.dirname(GENRES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(GENRES_FILE_PATH, JSON.stringify(genres, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing genres.json:', err);
  }
}

// GET /api/genres - Return all genres with track counts
export async function GET() {
  try {
    const storedGenres = readGenres();
    const supabase = getServiceRoleClient();

    // Query all beats to compute live track counts per genre
    const { data: beats, error } = await supabase
      .from('beats')
      .select('genre');

    const counts: Record<string, number> = {};
    if (!error && beats) {
      for (const b of beats) {
        if (b.genre) {
          const key = b.genre.trim().toLowerCase();
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    }

    // Merge any genres in DB that aren't yet in genres.json
    const genreMap = new Map<string, GenreItem>();
    for (const g of storedGenres) {
      genreMap.set(g.name.trim().toLowerCase(), {
        ...g,
        trackCount: counts[g.name.trim().toLowerCase()] || 0
      });
    }

    if (!error && beats) {
      for (const b of beats) {
        if (b.genre) {
          const key = b.genre.trim().toLowerCase();
          if (!genreMap.has(key)) {
            const formatted = b.genre.trim().charAt(0).toUpperCase() + b.genre.trim().slice(1);
            genreMap.set(key, {
              id: key.replace(/[^a-z0-9]/g, '-'),
              name: formatted,
              slug: key.replace(/[^a-z0-9]/g, '-'),
              description: `Community catalog genre for ${formatted}`,
              trackCount: counts[key] || 1
            });
          }
        }
      }
    }

    const finalGenres = Array.from(genreMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ genres: finalGenres });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch genres' }, { status: 500 });
  }
}

// POST /api/genres - Add a new genre
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name?.trim();
    const description = body.description?.trim() || '';

    if (!name) {
      return NextResponse.json({ error: 'Genre name is required' }, { status: 400 });
    }

    const currentGenres = readGenres();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const existing = currentGenres.find(
      (g) => g.name.toLowerCase() === name.toLowerCase() || g.slug === slug
    );

    if (existing) {
      return NextResponse.json({ error: 'A genre with this name already exists' }, { status: 409 });
    }

    const newGenre: GenreItem = {
      id: slug,
      name,
      slug,
      description: description || `Studio catalog beats categorized under ${name}`,
      trackCount: 0
    };

    currentGenres.push(newGenre);
    writeGenres(currentGenres);

    return NextResponse.json({ success: true, genre: newGenre });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create genre' }, { status: 500 });
  }
}

// PATCH /api/genres - Rename or update genre
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { oldName, name, description } = body;

    if (!oldName || !name) {
      return NextResponse.json({ error: 'oldName and new name are required' }, { status: 400 });
    }

    const currentGenres = readGenres();
    const index = currentGenres.findIndex((g) => g.name.toLowerCase() === oldName.trim().toLowerCase());

    if (index === -1) {
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }

    const updatedSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    currentGenres[index] = {
      ...currentGenres[index],
      name: name.trim(),
      slug: updatedSlug,
      description: description !== undefined ? description : currentGenres[index].description
    };

    writeGenres(currentGenres);

    // If the genre name changed, update existing beats in Supabase
    if (oldName.trim().toLowerCase() !== name.trim().toLowerCase()) {
      const supabase = getServiceRoleClient();
      await supabase
        .from('beats')
        .update({ genre: name.trim() })
        .eq('genre', oldName.trim());
    }

    return NextResponse.json({ success: true, genre: currentGenres[index] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update genre' }, { status: 500 });
  }
}

// DELETE /api/genres - Delete a genre
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Genre name parameter is required' }, { status: 400 });
    }

    const currentGenres = readGenres();
    const filtered = currentGenres.filter((g) => g.name.toLowerCase() !== name.trim().toLowerCase());

    if (filtered.length === currentGenres.length) {
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }

    writeGenres(filtered);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete genre' }, { status: 500 });
  }
}
