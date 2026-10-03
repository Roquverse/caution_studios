import React from 'react';
import { Lock } from 'lucide-react';

interface SoldOverlayProps {
  className?: string;
  label?: string;
}

export const SoldOverlay: React.FC<SoldOverlayProps> = ({
  className = '',
  label = 'Sold Exclusively'
}) => {
  return (
    <div
      className={`absolute inset-0 bg-bg/85 flex flex-col items-center justify-center p-3 text-center border border-border select-none z-10 ${className}`}
    >
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface border border-border text-sold text-xs font-bold uppercase tracking-wider">
        <Lock className="h-3 w-3" />
        <span>{label}</span>
      </div>
    </div>
  );
};
