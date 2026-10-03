'use client';

import React, { useState } from 'react';
import { Beat, LicenseType } from '@caution/types';
import { LICENSE_DEFINITIONS } from '@caution/licenses';
import { formatNaira } from '../../lib/paystack';
import { Check, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { useAudio } from '../audio/AudioProvider';

interface LicenseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  beat: Beat | null;
}

export const LicenseSelectorModal: React.FC<LicenseSelectorModalProps> = ({
  isOpen,
  onClose,
  beat
}) => {
  const { addToCart } = useAudio();
  const [selectedType, setSelectedType] = useState<LicenseType>('premium');

  if (!isOpen || !beat) return null;

  const tiers: LicenseType[] = ['basic', 'premium', 'exclusive'];

  const handleSelectAndCheckout = (type: LicenseType) => {
    addToCart(beat, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-bg/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl rounded-sm bg-surface border border-border p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between pb-6 border-b border-border">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent-live">
                Select License Tier
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-text mt-1">
                {beat.title}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Produced by {beat.producer?.display_name || 'Caution Studio'} · Instant digital delivery
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-sm border border-border text-text-muted hover:text-text"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 3 License Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {tiers.map((tierKey) => {
              const def = LICENSE_DEFINITIONS[tierKey];
              const isSelected = selectedType === tierKey;
              const isSold = beat.status === 'sold' && tierKey === 'exclusive';

              return (
                <div
                  key={tierKey}
                  onClick={() => !isSold && setSelectedType(tierKey)}
                  className={`relative p-5 rounded-sm flex flex-col justify-between cursor-pointer transition-colors border ${
                    isSold
                      ? 'bg-surface-2 opacity-50 border-border cursor-not-allowed'
                      : isSelected
                      ? 'bg-surface-2 border-accent-live ring-1 ring-accent-live'
                      : 'bg-surface border-border hover:border-text-faint'
                  }`}
                >
                  {tierKey === 'premium' && (
                    <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-sm bg-accent border border-accent text-[10px] font-bold text-text uppercase tracking-wider">
                      Recommended
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-bold text-text">{def.name}</div>
                    <div className="text-2xl font-black font-mono text-text mt-2">
                      {formatNaira(def.defaultPriceNgn)}
                    </div>
                    <div className="text-[11px] text-text-muted mt-1 leading-relaxed">
                      {def.description}
                    </div>

                    {/* Features list */}
                    <ul className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-text-muted">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent-live shrink-0" />
                        <span>
                          {def.streamCap ? `${def.streamCap.toLocaleString()} streams` : 'Unlimited streams'}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent-live shrink-0" />
                        <span>
                          {def.videoCap ? `${def.videoCap} music video` : 'Unlimited music videos'}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent-live shrink-0" />
                        <span>{def.filesDelivered[0]}</span>
                      </li>
                      {def.includesStems && (
                        <li className="flex items-center gap-2 text-text font-medium">
                          <Check className="h-3.5 w-3.5 text-accent-live shrink-0" />
                          <span>Trackout stems included</span>
                        </li>
                      )}
                      {def.isExclusive && (
                        <li className="flex items-center gap-2 text-accent-live font-semibold">
                          <Check className="h-3.5 w-3.5 text-accent-live shrink-0" />
                          <span>100% Sole exclusive ownership</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      disabled={isSold}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSold) handleSelectAndCheckout(tierKey);
                      }}
                      className={`w-full h-9 rounded-pill font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border ${
                        isSold
                          ? 'bg-surface text-sold border-border cursor-not-allowed'
                          : isSelected
                          ? 'bg-accent hover:bg-[#135d56] text-text border-accent'
                          : 'bg-surface hover:bg-surface-2 text-text border-border'
                      }`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>{isSold ? 'Sold Exclusively' : `Choose ${def.name}`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Security Note */}
          <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-accent-live" />
              <span>Full legal contract generated upon Paystack clearance.</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-text-muted hover:text-text"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
