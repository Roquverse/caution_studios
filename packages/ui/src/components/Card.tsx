import React from 'react';
import { cn } from '../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, hover = false, glass = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border border-gray-100 bg-white p-6 shadow-soft-card transition-all duration-300',
          hover && 'hover:-translate-y-1 hover:shadow-premium hover:border-gray-200',
          glass && 'bg-white/80 backdrop-blur-md border-white/40 shadow-soft-card',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
