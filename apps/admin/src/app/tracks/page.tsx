'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import {
  Button,
  Badge,
  Input,
  Modal,
  SearchInput,
  MOCK_TRACKS
} from '@caution/ui';
import { Track } from '@caution/types';
import {
  Plus,
  UploadCloud,
  Edit,
  Trash2,
  Sparkles,
  Music,
  Check
} from 'lucide-react';

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState<Track[]>(MOCK_TRACKS);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for new track upload
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Cinematic');
  const [mood, setMood] = useState('Epic');
  const [bpm, setBpm] = useState(120);

  const handleCreateTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist) return;

    const newTrack: Track = {
      id: `track-${Date.now()}`,
      title,
      artist,
      duration: 180,
      formattedDuration: '3:00',
      genre: [genre],
      mood: [mood],
      theme: ['Commercial', 'Cinematic'],
      instruments: ['Synthesizer', 'Drums'],
      bpm: Number(bpm),
      coverUrl: '/images/album_neon_dj.jpg',
      audioUrl: '',
      waveform: [
        0.2, 0.4, 0.6, 0.8, 0.9, 0.7, 0.5, 0.6, 0.8, 0.95, 0.8, 0.6, 0.4, 0.3,
        0.5, 0.7, 0.8, 0.9, 0.7, 0.5, 0.3, 0.4, 0.6, 0.8, 0.7, 0.5, 0.3
      ],
      isFeatured: true,
      downloadsCount: 0,
      playsCount: 0
    };

    setTracks([newTrack, ...tracks]);
    setIsModalOpen(false);
    setTitle('');
    setArtist('');
    alert(`Track "${title}" successfully added to catalog!`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this track from the catalog?')) {
      setTracks(tracks.filter((t) => t.id !== id));
    }
  };

  const toggleSpotlight = (id: string) => {
    setTracks(
      tracks.map((t) => (t.id === id ? { ...t, isSpotlight: !t.isSpotlight } : t))
    );
  };

  const filtered = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase()) ||
      t.genre.some((g) => g.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16">
      <AdminNav activePath="/tracks" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-950 tracking-tight">
              Catalog Audio Manager
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Add new recordings, configure metadata tags, assign BPM, and toggle spotlight status.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            pill
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setIsModalOpen(true)}
          >
            Upload New Track
          </Button>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-80">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                placeholder="Search catalog by title, artist, genre..."
              />
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Total {filtered.length} tracks registered
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Recording Title</th>
                  <th className="pb-3">Artist / Composer</th>
                  <th className="pb-3">Genres</th>
                  <th className="pb-3">BPM</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3 text-center">Spotlight</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((track) => (
                  <tr key={track.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="h-10 w-10 rounded-lg object-cover shadow-2xs"
                        />
                        <span className="font-bold text-gray-900">{track.title}</span>
                      </div>
                    </td>

                    <td className="py-3.5 text-gray-600 font-medium">
                      {track.artist}
                    </td>

                    <td className="py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {track.genre.map((g) => (
                          <span
                            key={g}
                            className="bg-gray-100 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 font-mono text-gray-700">
                      {track.bpm}
                    </td>

                    <td className="py-3.5 font-mono text-gray-500">
                      {track.formattedDuration}
                    </td>

                    <td className="py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSpotlight(track.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          track.isSpotlight
                            ? 'text-amber-500 bg-amber-50'
                            : 'text-gray-300 hover:text-gray-500'
                        }`}
                        title="Toggle Spotlight"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                    </td>

                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => alert(`Edit track "${track.title}"`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(track.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Upload Track Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Audio Track to Catalog"
        description="Add a new master recording with metadata, genre tags, and BPM."
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" pill onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" pill onClick={handleCreateTrack}>
              Publish Track
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTrack} className="space-y-4">
          <Input
            label="Track Title"
            required
            placeholder="e.g. Neon Horizon"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            label="Artist or Composer Name"
            required
            placeholder="e.g. Solstice Sound"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-white focus:outline-none focus:border-black"
              >
                <option value="Cinematic">Cinematic</option>
                <option value="Electronic">Electronic</option>
                <option value="Funk">Funk</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Lofi">Lofi</option>
                <option value="Pop">Pop</option>
                <option value="Rock">Rock</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-white focus:outline-none focus:border-black"
              >
                <option value="Uplifting">Uplifting</option>
                <option value="Epic">Epic</option>
                <option value="Chill">Chill</option>
                <option value="Dramatic">Dramatic</option>
                <option value="Energetic">Energetic</option>
              </select>
            </div>
          </div>

          <Input
            label="BPM (Beats per Minute)"
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
          />

          {/* Audio Upload Dropzone */}
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-black transition-colors cursor-pointer bg-slate-50/50">
            <UploadCloud className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <span className="text-xs font-semibold text-gray-700 block">
              Drag and drop master audio (WAV, FLAC, MP3 320kbps)
            </span>
            <span className="text-[10px] text-gray-400 mt-1 block">
              Maximum file size: 100MB • Waveform automatically analyzed
            </span>
          </div>
        </form>
      </Modal>
    </div>
  );
}
