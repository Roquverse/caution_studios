'use client';

import React, { useRef } from 'react';

interface WaveformProps {
  peaks?: number[] | null;
  progress: number; // 0 to 1
  onSeek?: (ratio: number) => void;
  height?: number;
  className?: string;
  barWidth?: number;
  barGap?: number;
}

export const Waveform: React.FC<WaveformProps> = ({
  peaks,
  progress,
  onSeek,
  height = 32,
  className = '',
  barWidth = 2,
  barGap = 2
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback peaks if not provided
  const data = peaks && peaks.length > 0 ? peaks : [
    0.3, 0.5, 0.8, 0.6, 0.4, 0.7, 0.9, 0.6, 0.5, 0.8,
    0.9, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3, 0.6, 0.8, 0.7
  ];

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{ height }}
      className={`relative flex items-center gap-[2px] cursor-pointer select-none group w-full ${className}`}
      aria-label="Audio waveform seeker"
      role="slider"
      aria-valuenow={Math.round(progress * 100)}
    >
      {data.map((peak, idx) => {
        const itemRatio = idx / data.length;
        const isPlayed = itemRatio <= progress;

        return (
          <div
            key={idx}
            className="flex-1 transition-colors duration-75 rounded-[1px]"
            style={{
              height: `${Math.max(12, Math.min(100, peak * 100))}%`,
              backgroundColor: isPlayed ? 'var(--accent-live)' : 'var(--border)'
            }}
          />
        );
      })}
    </div>
  );
};
