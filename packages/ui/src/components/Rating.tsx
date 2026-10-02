import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../utils/cn';

export interface RatingProps {
  value: number; // 0 to 5
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  readOnly?: boolean;
  onChange?: (val: number) => void;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  size = 'md',
  className,
  readOnly = true,
  onChange
}) => {
  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {Array.from({ length: max }).map((_, idx) => {
        const starNumber = idx + 1;
        const isFilled = starNumber <= value;

        return (
          <button
            key={idx}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(starNumber)}
            className={cn(
              'focus:outline-none transition-transform',
              !readOnly && 'hover:scale-110 cursor-pointer'
            )}
          >
            <Star
              className={cn(
                sizeMap[size],
                isFilled
                  ? 'fill-[#FBBF24] text-[#FBBF24]'
                  : 'fill-gray-200 text-gray-200'
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
