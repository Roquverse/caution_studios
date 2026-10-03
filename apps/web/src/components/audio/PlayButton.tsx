'use client';

import React from 'react';
import { Play, Pause, Loader2, Lock } from 'lucide-react';
import { BeatStatus } from '@caution/types';

interface PlayButtonProps {
  status?: BeatStatus;
  isPlaying?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  status = 'live',
  isPlaying = false,
  onClick,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const isSold = status === 'sold';
  const isProcessing = status === 'processing';
  const isDraft = status === 'draft';

  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-10 px-3.5 text-xs gap-2',
    lg: 'h-12 px-5 text-sm gap-2.5'
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (isSold) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center justify-center font-medium rounded-pill border border-border bg-surface text-sold cursor-not-allowed ${sizeStyles[size]} ${className}`}
        title="Beat sold exclusively"
      >
        <Lock className={iconSizes[size]} />
        {showLabel && <span>Sold</span>}
      </button>
    );
  }

  if (isProcessing) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center justify-center font-medium rounded-pill border border-border bg-surface text-text-muted cursor-wait ${sizeStyles[size]} ${className}`}
        title="Processing audio..."
      >
        <Loader2 className={`${iconSizes[size]} animate-spin text-accent-live`} />
        {showLabel && <span>Processing</span>}
      </button>
    );
  }

  if (isDraft) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center justify-center font-medium rounded-pill border border-border bg-surface text-text-faint cursor-not-allowed ${sizeStyles[size]} ${className}`}
      >
        <Play className={iconSizes[size]} />
        {showLabel && <span>Draft</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium rounded-pill transition-colors duration-150 select-none ${
        isPlaying
          ? 'bg-accent-live text-bg border border-accent-live hover:bg-accent-live/90'
          : 'bg-accent text-text border border-accent hover:bg-[#135d56]'
      } ${sizeStyles[size]} ${className}`}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {isPlaying ? (
        <Pause className={`${iconSizes[size]} fill-current`} />
      ) : (
        <Play className={`${iconSizes[size]} fill-current ml-0.5`} />
      )}
      {showLabel && <span>{isPlaying ? 'Pause' : 'Preview'}</span>}
    </button>
  );
};
