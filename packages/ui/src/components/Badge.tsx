import React from 'react';
import { cn } from '../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'secondary' | 'outline' | 'success' | 'warning' | 'dark';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border border-gray-200/60',
    brand: 'bg-blue-50 text-[#1E50FF] border border-blue-200/60',
    secondary: 'bg-slate-100 text-slate-800',
    outline: 'border border-gray-300 text-gray-600 bg-transparent',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/70',
    dark: 'bg-gray-900 text-white border border-gray-800'
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 font-medium',
    md: 'text-xs px-3 py-1 font-medium'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
