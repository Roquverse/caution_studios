import React from 'react';
import { cn } from '../utils/cn';

export interface BrandsRowProps {
  className?: string;
}

export const BrandsRow: React.FC<BrandsRowProps> = ({ className }) => {
  const brands = [
    {
      name: 'Logoipsum',
      color: 'text-teal-600',
      icon: (
        <svg className="w-5 h-5 text-teal-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="7" cy="12" r="5" fillOpacity="0.8" />
          <circle cx="17" cy="12" r="5" fillOpacity="0.5" />
        </svg>
      )
    },
    {
      name: 'Logoipsum',
      color: 'text-gray-700',
      icon: (
        <svg className="w-5 h-5 text-gray-700 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2zm0 5l6.5 13H5.5L12 7z" />
        </svg>
      )
    },
    {
      name: 'Logoipsum',
      color: 'text-indigo-600',
      icon: (
        <svg className="w-5 h-5 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="4" fillOpacity="0.7" />
        </svg>
      )
    },
    {
      name: 'Logoipsum',
      color: 'text-purple-600',
      icon: (
        <svg className="w-5 h-5 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )
    },
    {
      name: 'Logoipsum',
      color: 'text-rose-500',
      icon: (
        <svg className="w-5 h-5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="8" fillOpacity="0.75" />
          <circle cx="12" cy="12" r="3" fill="#ffffff" />
        </svg>
      )
    }
  ];

  return (
    <div className={cn('py-8 border-y border-gray-100 bg-white/50', className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-around gap-6 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
          {brands.map((brand, idx) => (
            <div key={idx} className="flex items-center gap-2 font-bold text-gray-800 text-sm tracking-tight">
              {brand.icon}
              <span>{brand.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
