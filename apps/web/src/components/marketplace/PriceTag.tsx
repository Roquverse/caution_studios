import React from 'react';
import { formatNaira } from '../../lib/paystack';

interface PriceTagProps {
  amountNgn: number;
  period?: string;
  isSold?: boolean;
  className?: string;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  amountNgn,
  period,
  isSold = false,
  className = ''
}) => {
  if (isSold) {
    return (
      <span className={`text-sold font-mono font-bold text-xs uppercase tracking-wider ${className}`}>
        Sold
      </span>
    );
  }

  return (
    <div className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className="font-mono font-bold text-text">
        {formatNaira(amountNgn)}
      </span>
      {period && (
        <span className="text-[11px] text-text-muted font-normal">
          {period}
        </span>
      )}
    </div>
  );
};
