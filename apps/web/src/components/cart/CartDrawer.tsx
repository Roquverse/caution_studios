'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAudio } from '../audio/AudioProvider';
import { X, Trash2, ShoppingBag, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { formatNaira, initializePaystack } from '../../lib/paystack';
import { LICENSE_DEFINITIONS } from '@caution/licenses';

export const CartDrawer: React.FC = () => {
  const { cart, removeFromCart, clearCart, isCartOpen, setIsCartOpen } = useAudio();
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');

  if (!isCartOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.priceCents, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsProcessing(true);

    try {
      const orderId = `ord_${Date.now()}`;
      const res = await initializePaystack({
        email: email || 'artist@cautionstudio.com',
        amountNgn: subtotal,
        orderId,
        metadata: {
          items: cart.map((i) => ({ beat_id: i.beat.id, license: i.licenseType }))
        }
      });

      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-border flex flex-col justify-between p-6">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-accent-live" />
                <span className="text-sm font-bold uppercase tracking-wider text-text">
                  Your Cart ({cart.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-sm border border-border text-text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="h-12 w-12 rounded-pill bg-surface-2 border border-border mx-auto flex items-center justify-center text-text-muted">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-text">Your cart is empty</div>
                <div className="text-xs text-text-muted max-w-xs mx-auto">
                  Browse through original beats by verified producers and add leases to your cart.
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="h-8 px-4 rounded-pill bg-accent hover:bg-[#135d56] text-text text-xs font-medium border border-accent"
                  >
                    Browse beats
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[50vh] pr-1">
                {cart.map((item) => {
                  const def = LICENSE_DEFINITIONS[item.licenseType];
                  return (
                    <div
                      key={`${item.beat.id}-${item.licenseType}`}
                      className="p-3 rounded-sm bg-surface-2 border border-border flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-sm overflow-hidden bg-surface border border-border shrink-0">
                          {item.beat.cover_url && (
                            <img src={item.beat.cover_url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-text truncate">{item.beat.title}</div>
                          <div className="text-[11px] text-accent-live font-medium">
                            {def.name}
                          </div>
                          <div className="text-[10px] text-text-muted">
                            By {item.beat.producer?.display_name || 'Producer'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono font-bold text-text">
                          {formatNaira(item.priceCents)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.beat.id, item.licenseType)}
                          className="p-1 text-text-faint hover:text-danger rounded-sm"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Checkout Area */}
          {cart.length > 0 && (
            <form onSubmit={handleCheckout} className="pt-4 border-t border-border space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Licensee email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="artist@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-sm bg-surface-2 border border-border text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-accent-live"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal</span>
                  <span className="font-mono text-text">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>License delivery</span>
                  <span className="text-accent-live font-medium">Instant PDF + WAV</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-text pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="font-mono text-accent-live">{formatNaira(subtotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full h-11 rounded-pill bg-accent hover:bg-[#135d56] disabled:opacity-50 text-text font-bold text-xs uppercase tracking-wider border border-accent flex items-center justify-center gap-2 shadow-sm"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{isProcessing ? 'Connecting...' : `Pay ${formatNaira(subtotal)} with Paystack`}</span>
              </button>

              <div className="text-[11px] text-text-faint text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-live" />
                <span>Secured with 256-bit bank grade encryption</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
