'use client';

import React, { useRef } from 'react';
import { cn } from '../utils/cn';

export interface WaveformVisualizerProps {
  waveform?: number[];
  progress?: number; // 0 to 1
  isPlaying?: boolean;
  onSeek?: (ratio: number) => void;
  height?: number;
  className?: string;
  activeColor?: string;
  inactiveColor?: string;
}

// Generate default smooth waveform data if none provided
const defaultWaveformData = [
  0.2, 0.4, 0.3, 0.6, 0.8, 0.5, 0.9, 0.7, 0.4, 0.6, 0.85, 0.95, 0.7, 0.4, 0.3,
  0.5, 0.8, 0.6, 0.75, 0.9, 0.6, 0.4, 0.7, 0.8, 0.5, 0.3, 0.6, 0.85, 0.7, 0.5,
  0.4, 0.6, 0.75, 0.9, 0.65, 0.5, 0.8, 0.7, 0.4, 0.3, 0.5, 0.6, 0.4, 0.2
];

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  waveform = defaultWaveformData,
  progress = 0,
  isPlaying = false,
  onSeek,
  height = 28,
  className,
  activeColor = '#04564f',
  inactiveColor = '#E2E8F0'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
      role="slider"
      aria-label="Audio scrubber"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      className={cn(
        'group relative flex items-center gap-[2.5px] cursor-pointer select-none py-1 transition-opacity',
        className
      )}
      style={{ height: `${height}px` }}
    >
      {waveform.map((val, idx) => {
        const barRatio = idx / waveform.length;
        const isPassed = barRatio <= progress;
        // Subtle dance animation when playing and near playback head
        const isNearHead = isPlaying && Math.abs(barRatio - progress) < 0.1;
        const barHeight = Math.max(12, Math.round(val * height));

        return (
          <div
            key={idx}
            className="flex-1 rounded-full transition-all duration-150 group-hover:opacity-90"
            style={{
              height: `${isNearHead ? Math.min(height, barHeight * 1.2) : barHeight}px`,
              backgroundColor: isPassed ? activeColor : inactiveColor,
              transformOrigin: 'center'
            }}
          />
        );
      })}
    </div>
  );
};
