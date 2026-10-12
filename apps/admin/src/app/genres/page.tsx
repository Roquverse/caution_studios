'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '../../components/AdminShell';
import {
  Tag,
  Plus,
  Search,
  Music2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';

interface GenreItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  trackCount?: number;
}

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreDesc, setNewGenreDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Edit modal state
  const [editingGenre, setEditingGenre] = useState<GenreItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/genres');
      if (res.ok) {
        const data = await res.json();
        setGenres(data.genres || []);
      }
    } catch (err) {
      console.error('Failed to load genres:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch('/api/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGenreName.trim(),
          description: newGenreDesc.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create genre');
        return;
      }

      setNewGenreName('');
      setNewGenreDesc('');
      setShowAddModal(false);
      fetchGenres();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating genre');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGenre || !editName.trim()) return;

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch('/api/genres', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName: editingGenre.name,
          name: editName.trim(),
          description: editDesc.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update genre');
        return;
      }

      setEditingGenre(null);
      fetchGenres();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating genre');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGenre = async (genre: GenreItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the "${genre.name}" genre? Any tracks currently using this genre will retain their tags.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/genres?name=${encodeURIComponent(genre.name)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchGenres();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete genre');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredGenres = genres.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalTracks = genres.reduce((acc, g) => acc + (g.trackCount || 0), 0);
  const topGenre = [...genres].sort((a, b) => (b.trackCount || 0) - (a.trackCount || 0))[0];

  return (
    <AdminShell activePath="/genres">
      <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#2dd4bf]/10 text-[#2dd4bf]">
                <Tag className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Genre Management
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Curate, configure, and manage studio genres. These genres automatically populate the track upload and editing dropdowns as well as the client marketplace filter tabs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMsg('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-[#2dd4bf]/10 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Genre</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Total Active Genres
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {genres.length}
            </div>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">
              Configured across studio catalog
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Assigned Catalog Beats
            </span>
            <div className="text-2xl font-black text-[#2dd4bf] mt-1">
              {totalTracks}
            </div>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">
              Live tracks categorized in database
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Top Catalog Genre
            </span>
            <div className="text-2xl font-black text-amber-400 mt-1 truncate">
              {topGenre ? `${topGenre.name} (${topGenre.trackCount || 0})` : 'Afrobeats'}
            </div>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">
              Most populated catalog category
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search genres by name or description..."
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#2dd4bf] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {filteredGenres.length} {filteredGenres.length === 1 ? 'genre' : 'genres'}
          </span>
        </div>

        {/* Genres Table */}
        <div className="rounded-xl border border-zinc-800 bg-[#0E1015] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/50">
                  <th className="py-3 px-4 font-semibold">Genre</th>
                  <th className="py-3 px-4 font-semibold">Slug Identifier</th>
                  <th className="py-3 px-4 font-semibold">Catalog Beats</th>
                  <th className="py-3 px-4 font-semibold hidden md:table-cell">Description</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      <div className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-ping" />
                        <span>Loading studio genres...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredGenres.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      No genres matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredGenres.map((genre) => (
                    <tr key={genre.id || genre.name} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 text-[#2dd4bf] flex items-center justify-center font-bold text-xs uppercase">
                            {genre.name.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs block">
                              {genre.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                        {genre.slug}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                          <Music2 className="h-3 w-3 text-[#2dd4bf]" />
                          <span>{genre.trackCount || 0} {genre.trackCount === 1 ? 'beat' : 'beats'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 text-xs hidden md:table-cell max-w-xs truncate">
                        {genre.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/tracks?genre=${encodeURIComponent(genre.name)}`}
                            title="View tracks in this genre"
                            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setErrorMsg('');
                              setEditingGenre(genre);
                              setEditName(genre.name);
                              setEditDesc(genre.description || '');
                            }}
                            title="Edit Genre"
                            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-[#2dd4bf] transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteGenre(genre)}
                            title="Delete Genre"
                            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Genre Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121316] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#2dd4bf]" />
                <h3 className="text-base font-bold text-white">Add New Genre</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateGenre} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Genre Name <span className="text-[#2dd4bf]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  placeholder="e.g. Amapiano, Drill, Trap, Highlife"
                  className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newGenreDesc}
                  onChange={(e) => setNewGenreDesc(e.target.value)}
                  placeholder="Short description of this musical category..."
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Genre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Genre Modal */}
      {editingGenre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121316] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-[#2dd4bf]" />
                <h3 className="text-base font-bold text-white">Edit Genre: {editingGenre.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingGenre(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateGenre} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Genre Name <span className="text-[#2dd4bf]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingGenre(null)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
