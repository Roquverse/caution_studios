import React from 'react';

interface StatBlockProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({
  label,
  value,
  subtext,
  trend
}) => {
  return (
    <div className="p-5 rounded-sm bg-surface border border-border flex flex-col justify-between">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
        {label}
      </span>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-black font-mono text-text">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-mono font-medium text-accent-live">
            {trend}
          </span>
        )}
      </div>
      {subtext && (
        <span className="text-[11px] text-text-faint mt-1">
          {subtext}
        </span>
      )}
    </div>
  );
};
