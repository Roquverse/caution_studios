'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  Check,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export interface StudioPresetArtwork {
  id: string;
  name: string;
  url: string;
  genreTag: string;
}

export const STUDIO_ARTWORK_PRESETS: StudioPresetArtwork[] = [
  {
    id: 'studio-console',
    name: 'Studio Console',
    url: '/images/studio_mixing_console.jpg',
    genreTag: 'Master Studio'
  },
  {
    id: 'neon-dj',
    name: 'Neon DJ Night',
    url: '/images/album_neon_dj.jpg',
    genreTag: 'Club / Party'
  },
  {
    id: 'sunrise-afro',
    name: 'Sunrise Groove',
    url: '/images/album_sunrise.jpg',
    genreTag: 'Afrobeats'
  },
  {
    id: 'boombox',
    name: 'Retro Boombox',
    url: '/images/hero_boombox.jpg',
    genreTag: 'Hip-Hop / Trap'
  },
  {
    id: 'golden-clef',
    name: 'Golden Clef',
    url: '/images/golden_clef.jpg',
    genreTag: 'R&B / Soul'
  },
  {
    id: 'studio-mic',
    name: 'Vocal Studio Mic',
    url: '/images/artist_studio_mic.jpg',
    genreTag: 'Acoustic / Live'
  }
];

interface ArtworkUploaderProps {
  initialArtworkUrl?: string | null;
  onArtworkChange: (file: File | null, presetUrl: string | null) => void;
  title?: string;
  description?: string;
}

export function ArtworkUploader({
  initialArtworkUrl,
  onArtworkChange,
  title = 'Beat Cover Artwork',
  description = 'Add high-res square cover art (1:1 ratio). Appears on Caution marketplace, streaming app, and player.'
}: ArtworkUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialArtworkUrl || null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial artwork url if it changes externally
  useEffect(() => {
    if (initialArtworkUrl && !selectedFile && !selectedPresetId) {
      setPreviewUrl(initialArtworkUrl);
      const match = STUDIO_ARTWORK_PRESETS.find((p) => p.url === initialArtworkUrl);
      if (match) setSelectedPresetId(match.id);
    }
  }, [initialArtworkUrl]);

  // Clean up object URLs when unmounting or changing files
  useEffect(() => {
    return () => {
      if (selectedFile && previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [selectedFile, previewUrl]);

  const handleFileProcess = (file: File) => {
    setErrorMsg(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Invalid file format. Please upload a PNG, JPG, or WebP image.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size too large. Artwork must be under 10MB.');
      return;
    }

    // Create object URL
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setSelectedPresetId(null);
    onArtworkChange(file, null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // Reset file input value to allow selecting same file again if needed
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleSelectPreset = (preset: StudioPresetArtwork) => {
    setErrorMsg(null);
    if (selectedFile && previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setSelectedPresetId(preset.id);
    setPreviewUrl(preset.url);
    onArtworkChange(null, preset.url);
  };

  const handleRemoveArtwork = () => {
    if (selectedFile && previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedPresetId(null);
    setErrorMsg(null);
    onArtworkChange(null, null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-zinc-200 block">
            {title}
          </label>
          {description && (
            <p className="text-[11px] text-zinc-400 mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-[10px] font-mono text-[#2dd4bf] bg-[#2dd4bf]/10 px-2 py-0.5 rounded border border-[#2dd4bf]/20">
          1:1 Square Artwork
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Artwork Preview / Upload Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left Side: Artwork Preview or Drop Area */}
        <div className="md:col-span-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleInputChange}
          />

          {previewUrl ? (
            <div className="relative group rounded-xl overflow-hidden border-2 border-zinc-700/80 bg-zinc-950 aspect-square shadow-lg shadow-black/40">
              <img
                src={previewUrl}
                alt="Beat Artwork Preview"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-center backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Replace Image</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveArtwork}
                  className="px-2.5 py-1 rounded-md bg-zinc-800/90 hover:bg-rose-500/80 text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Badge for source */}
              <div className="absolute top-2 left-2 pointer-events-none">
                {selectedFile ? (
                  <span className="bg-emerald-500/90 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                    Custom Upload
                  </span>
                ) : selectedPresetId ? (
                  <span className="bg-[#2dd4bf]/90 backdrop-blur-xs text-zinc-950 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                    Preset Theme
                  </span>
                ) : (
                  <span className="bg-zinc-800/80 backdrop-blur-xs text-zinc-300 text-[9px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                    Current Cover
                  </span>
                )}
              </div>

              {selectedFile && (
                <div className="absolute bottom-2 inset-x-2 bg-zinc-900/90 backdrop-blur-xs rounded px-2 py-1 text-[10px] text-zinc-300 truncate pointer-events-none border border-zinc-700/50">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl aspect-square flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-[#2dd4bf] bg-[#2dd4bf]/10 scale-[1.01]'
                  : 'border-zinc-700 hover:border-[#2dd4bf]/70 bg-zinc-950/70 hover:bg-zinc-900/60'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mb-3 text-[#2dd4bf] group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold text-white block">
                Upload Custom Artwork
              </span>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Drag and drop image here, or{' '}
                <span className="text-[#2dd4bf] underline">browse</span>
              </span>
              <span className="text-[10px] text-zinc-500 mt-2 block font-mono">
                PNG, JPG, WebP up to 10MB
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Quick Action & Studio Presets */}
        <div className="md:col-span-7 space-y-3.5">
          <div className="bg-zinc-950/60 rounded-lg p-3.5 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#2dd4bf]" />
                <span>Need quick artwork? Choose a studio preset</span>
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-[#2dd4bf] hover:underline font-medium"
              >
                Upload your own
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">
              Producers can upload custom album art anytime, or select one of our curated high-resolution studio covers below:
            </p>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {STUDIO_ARTWORK_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id || (!selectedFile && previewUrl === preset.url);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`relative rounded-lg overflow-hidden border text-left transition-all group cursor-pointer ${
                      isSelected
                        ? 'border-[#2dd4bf] ring-2 ring-[#2dd4bf]/40'
                        : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900'
                    }`}
                  >
                    <div className="aspect-square w-full relative">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#2dd4bf]/20 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-[#2dd4bf] text-black flex items-center justify-center shadow-md">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-1.5 bg-zinc-950/90 border-t border-zinc-800/60">
                      <span className="text-[10px] font-semibold text-white block truncate">
                        {preset.name}
                      </span>
                      <span className="text-[9px] text-zinc-400 block truncate">
                        {preset.genreTag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Producer Pro Tips */}
          <div className="rounded-lg p-3 bg-zinc-950/40 border border-zinc-800/60 text-[11px] text-zinc-400 space-y-1">
            <span className="text-zinc-300 font-semibold block text-[11px]">
              Producer Artwork Guidelines:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] text-zinc-400 leading-relaxed">
              <li>Use 1:1 aspect ratio square images (recommended 1500 × 1500px).</li>
              <li>Include beat title or producer watermark for brand recognition.</li>
              <li>Eye-catching artwork increases stream plays and licensing sales by up to 45%.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
