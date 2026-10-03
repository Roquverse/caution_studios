'use client';

import React, { useState } from 'react';
import { FilterState } from '@caution/types';
import { ChevronDown, ChevronRight, Sparkles, SlidersHorizontal, Check } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../utils/cn';

export interface FilterSidebarProps {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onStartFree?: () => void;
  onPricingClick?: () => void;
  className?: string;
}

const MOODS = ['Uplifting', 'Epic', 'Chill', 'Dramatic', 'Energetic', 'Dark', 'Romantic', 'Peaceful'];
const THEMES = ['Vlog', 'Commercial', 'Cinematic', 'Travel', 'Gaming', 'Fashion', 'Corporate', 'Podcast'];
const GENRES = ['Cinematic', 'Electronic', 'Funk', 'Hip Hop', 'Lofi', 'Pop', 'Rock', 'Ambient', 'Acoustic'];
const INSTRUMENTS = ['Acoustic Guitar', 'Electric Guitar', 'Piano', 'Synthesizer', 'Drums', 'Strings', 'Bass'];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChange,
  onStartFree,
  onPricingClick,
  className
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('genre');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleItem = (listName: 'selectedMoods' | 'selectedThemes' | 'selectedGenres' | 'selectedInstruments', value: string) => {
    const current = filters[listName] || [];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onChange({ [listName]: updated });
  };

  const sections = [
    { id: 'mood', name: 'Mood', items: MOODS, selected: filters.selectedMoods || [], key: 'selectedMoods' as const },
    { id: 'theme', name: 'Video Theme', items: THEMES, selected: filters.selectedThemes || [], key: 'selectedThemes' as const },
    { id: 'genre', name: 'Genre', items: GENRES, selected: filters.selectedGenres || [], key: 'selectedGenres' as const },
    { id: 'instrument', name: 'Instrument', items: INSTRUMENTS, selected: filters.selectedInstruments || [], key: 'selectedInstruments' as const }
  ];

  return (
    <aside className={cn('w-full md:w-56 shrink-0 flex flex-col space-y-4 text-left select-none', className)}>
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </span>
        {(((filters.selectedGenres?.length || 0) > 0) ||
          ((filters.selectedMoods?.length || 0) > 0) ||
          ((filters.selectedThemes?.length || 0) > 0) ||
          ((filters.selectedInstruments?.length || 0) > 0) ||
          filters.spotlightOnly) && (
          <button
            type="button"
            onClick={() =>
              onChange({
                selectedGenres: [],
                selectedMoods: [],
                selectedThemes: [],
                selectedInstruments: [],
                spotlightOnly: false
              })
            }
            className="text-xs text-[#04564f] font-semibold hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-1">
        {sections.map((sec) => {
          const isOpen = expandedSection === sec.id;
          const activeCount = sec.selected.length;

          return (
            <div key={sec.id} className="border-b border-gray-100/80 pb-2">
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="flex w-full items-center justify-between py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
              >
                <span className="flex items-center gap-2">
                  {sec.name}
                  {activeCount > 0 && (
                    <span className="h-4 w-4 rounded-full bg-[#04564f] text-white text-[10px] font-bold flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {isOpen && (
                <div className="pt-1.5 pb-2 flex flex-wrap gap-1.5 animate-fadeIn">
                  {sec.items.map((item) => {
                    const isSelected = sec.selected.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleItem(sec.key, item)}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full transition-all flex items-center gap-1',
                          isSelected
                            ? 'bg-[#04564f] text-white font-medium shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        {item}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Spotlight Option */}
        <div className="py-2 border-b border-gray-100/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onChange({ spotlightOnly: !filters.spotlightOnly })}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-black"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#04564f]" /> Spotlight
            </span>
            <div
              className={cn(
                'w-9 h-5 rounded-full transition-colors relative p-0.5',
                filters.spotlightOnly ? 'bg-[#04564f]' : 'bg-gray-200'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-white transition-transform',
                  filters.spotlightOnly ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Action CTA & Pricing links matching screenshot */}
      <div className="pt-3 space-y-2">
        <Button
          variant="primary"
          size="sm"
          pill
          className="w-full text-xs font-semibold py-2.5 shadow-sm"
          onClick={onStartFree}
        >
          START FREE NOW
        </Button>
        <button
          type="button"
          onClick={onPricingClick}
          className="w-full text-center text-xs text-gray-500 hover:text-gray-900 transition-colors py-1 font-medium"
        >
          Pricing
        </button>
      </div>
    </aside>
  );
};
