import React from 'react';
import { formatNaira } from '../../lib/paystack';

interface EarningsChartProps {
  data?: { month: string; amountNgn: number }[];
  totalEarningsNgn?: number;
}

export const EarningsChart: React.FC<EarningsChartProps> = ({
  data = [
    { month: 'May', amountNgn: 45000 },
    { month: 'Jun', amountNgn: 78000 },
    { month: 'Jul', amountNgn: 110000 },
    { month: 'Aug', amountNgn: 92000 },
    { month: 'Sep', amountNgn: 160000 },
    { month: 'Oct', amountNgn: 245000 }
  ],
  totalEarningsNgn = 730000
}) => {
  const max = Math.max(...data.map((d) => d.amountNgn));
  const points = data.map((d, idx) => {
    const x = (idx / (data.length - 1)) * 360 + 20;
    const y = 140 - (d.amountNgn / max) * 110;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="p-6 rounded-sm bg-surface border border-border space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Net Producer Revenue (80% Payout)
          </span>
          <div className="text-2xl font-black font-mono text-text mt-1">
            {formatNaira(totalEarningsNgn)}
          </div>
        </div>
        <span className="text-xs font-mono text-accent-live bg-surface-2 border border-border px-2.5 py-1 rounded-sm">
          +48% vs last month
        </span>
      </div>

      {/* SVG Single Thin Line Chart (No Gradients) */}
      <div className="h-44 w-full">
        <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          {/* Horizontal hairline reference lines */}
          <line x1="0" y1="30" x2="400" y2="30" stroke="#26292A" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1="85" x2="400" y2="85" stroke="#26292A" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1="140" x2="400" y2="140" stroke="#26292A" strokeWidth="1" />

          {/* Single Thin Line in Accent Live */}
          <polyline
            fill="none"
            stroke="var(--accent-live)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Dots on line points */}
          {data.map((d, idx) => {
            const x = (idx / (data.length - 1)) * 360 + 20;
            const y = 140 - (d.amountNgn / max) * 110;
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3"
                fill="var(--bg)"
                stroke="var(--accent-live)"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </div>

      {/* Months X-Axis */}
      <div className="flex justify-between text-xs font-mono text-text-faint px-2">
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </div>
  );
};
