'use client';

import React from 'react';
import { UserNav } from '../../components/UserNav';
import { Button, Badge } from '@caution/ui';
import { CreditCard, Check, ShieldCheck, Download } from 'lucide-react';

export default function UserBillingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <UserNav activePath="/billing" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100">
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">
            Subscription & Billing
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your payment method, plan tier, and download billing invoices.
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-950">Pro Commercial Annual</h2>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                $19.99 / month • Renews automatically on November 15, 2026
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" pill>
                Change Plan
              </Button>
              <Button variant="primary" size="sm" pill>
                Manage Payment Method
              </Button>
            </div>
          </div>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 text-gray-700">
              <Check className="h-4 w-4 text-[#1E50FF] stroke-[3]" />
              <span>Unlimited WAV & MP3 downloads</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Check className="h-4 w-4 text-[#1E50FF] stroke-[3]" />
              <span>Worldwide commercial client clearance</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Check className="h-4 w-4 text-[#1E50FF] stroke-[3]" />
              <span>Broadcast, cinema & streaming rights</span>
            </div>
          </div>
        </div>

        {/* Invoices History */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-950">Billing History & Receipts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr className="hover:bg-slate-50">
                  <td className="py-3 font-mono font-medium text-gray-700">INV-2026-0091</td>
                  <td className="py-3 text-gray-500">Oct 01, 2026</td>
                  <td className="py-3 font-semibold text-gray-900">$239.88</td>
                  <td className="py-3">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Paid
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => alert('Invoice receipt downloaded!')}
                      className="text-[#1E50FF] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> PDF
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
