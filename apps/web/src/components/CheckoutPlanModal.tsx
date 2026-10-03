'use client';

import React, { useState } from 'react';
import { Modal, Button } from '@caution/ui';
import { CheckCircle2, ShieldCheck, CreditCard, Sparkles, Lock, ArrowRight } from 'lucide-react';

interface CheckoutPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: string;
  } | null;
}

export const CheckoutPlanModal: React.FC<CheckoutPlanModalProps> = ({
  isOpen,
  onClose,
  plan
}) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  if (!plan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setEmail('');
    setName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={isSuccess ? 'Payment Successful' : `Subscribe to ${plan.name}`}
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="py-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-[#04564f]">
            <CheckCircle2 className="h-10 w-10 text-[#04564f]" />
          </div>
          <h3 className="text-xl font-black text-gray-950">
            Welcome to {plan.name}!
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your receipt and license credentials for <strong className="text-gray-900">{plan.price}</strong> have been sent to <strong className="text-gray-900">{email || 'your email'}</strong>.
          </p>
          <div className="pt-3">
            <Button
              variant="primary"
              pill
              onClick={handleReset}
              className="bg-[#04564f] hover:bg-[#03453f] text-white px-8 py-2.5 font-bold text-xs"
            >
              Access Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summary Box */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Selected Tier
              </div>
              <div className="text-base font-black text-gray-900">{plan.name}</div>
            </div>
            <div className="text-xl font-black text-[#04564f]">
              {plan.price}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Full Name or Stage Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Samuel Ade"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#04564f] focus:outline-none focus:ring-1 focus:ring-[#04564f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="artist@cautionstudio.com"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#04564f] focus:outline-none focus:ring-1 focus:ring-[#04564f]"
            />
          </div>

          {/* Secure Payment Note */}
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span>256-bit encrypted checkout via Paystack / Flutterwave</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-xs font-semibold text-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              pill
              className="bg-[#04564f] hover:bg-[#03453f] text-white px-6 py-2.5 font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              Pay {plan.price}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
