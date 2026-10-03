'use client';

import React from 'react';
import { FilterState } from '@caution/types';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface BeatFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  genres?: string[];
  moods?: string[];
}

export const BeatFilters: React.FC<BeatFiltersProps> = ({
  filters,
  onFilterChange,
  genres = ['All', 'Afrobeats', 'Amapiano', 'Trap', 'R&B', 'Drill', 'Dancehall', 'Lofi', 'Pop'],
  moods = ['All', 'Energetic', 'Club', 'Dark', 'Chill', 'Vibrant', 'Romantic', 'Uplifting']
}) => {
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleGenreToggle = (genre: string) => {
    if (genre === 'All') {
      onFilterChange({ ...filters, selectedGenres: [] });
      return;
    }

    const current = filters.selectedGenres;
    const exists = current.includes(genre);
    const updated = exists ? current.filter((g) => g !== genre) : [...current, genre];
    onFilterChange({ ...filters, selectedGenres: updated });
  };

  const handleMoodSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFilterChange({ ...filters, selectedMoods: val === 'All' ? [] : [val] });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sortBy: e.target.value as any });
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Search & Dropdown Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-faint">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearch}
            placeholder="Search by title, producer, or sound..."
            className="w-full h-10 pl-9 pr-3 rounded-sm bg-surface border border-border text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-accent-live transition-colors"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-faint hover:text-text"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns: Mood & Sort */}
        <div className="flex items-center gap-2.5">
          <select
            value={filters.selectedMoods[0] || 'All'}
            onChange={handleMoodSelect}
            className="h-10 px-3 rounded-sm bg-surface border border-border text-xs text-text focus:outline-none focus:border-accent-live cursor-pointer"
          >
            <option value="All">All Moods</option>
            {moods.filter((m) => m !== 'All').map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={filters.sortBy || 'popular'}
            onChange={handleSortChange}
            className="h-10 px-3 rounded-sm bg-surface border border-border text-xs text-text focus:outline-none focus:border-accent-live cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Latest Releases</option>
            <option value="bpm">BPM (Fast to Slow)</option>
          </select>
        </div>
      </div>

      {/* Horizontal Genre Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {genres.map((genre) => {
          const isSelected =
            genre === 'All'
              ? filters.selectedGenres.length === 0
              : filters.selectedGenres.includes(genre);

          return (
            <button
              key={genre}
              type="button"
              onClick={() => handleGenreToggle(genre)}
              className={`h-8 px-3 rounded-pill text-xs font-medium transition-colors shrink-0 select-none ${
                isSelected
                  ? 'bg-accent text-text border border-accent'
                  : 'bg-surface border border-border text-text-muted hover:text-text hover:border-text-faint'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>
  );
};
