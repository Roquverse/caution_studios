'use client';

import React, { useState } from 'react';
import { CreatorShell } from '../../components/CreatorShell';
import {
  CreditCard,
  DollarSign,
  ArrowUpRight,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  Wallet
} from 'lucide-react';

export default function PayoutsPage() {
  const [bankName, setBankName] = useState('Guaranty Trust Bank (GTB)');
  const [accountNumber, setAccountNumber] = useState('0129384756');
  const [accountName, setAccountName] = useState('ARAKUNRIN COLE (PRODUCER ENT.)');
  const [isSaved, setIsSaved] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const availableBalanceNgn = 245000;
  const pendingClearanceNgn = 45000;
  const totalPaidOutNgn = 485000;

  const payoutHistory = [
    {
      id: 'PAY-89201',
      date: 'Oct 15, 2026',
      bank: 'GTBank ···· 4756',
      amountNgn: 180000,
      feeNgn: 100,
      netNgn: 179900,
      reference: 'pstk_trf_99201824',
      status: 'Completed'
    },
    {
      id: 'PAY-88102',
      date: 'Sep 30, 2026',
      bank: 'GTBank ···· 4756',
      amountNgn: 140000,
      feeNgn: 100,
      netNgn: 139900,
      reference: 'pstk_trf_88301923',
      status: 'Completed'
    },
    {
      id: 'PAY-87034',
      date: 'Sep 15, 2026',
      bank: 'GTBank ···· 4756',
      amountNgn: 165000,
      feeNgn: 100,
      netNgn: 164900,
      reference: 'pstk_trf_77192034',
      status: 'Completed'
    }
  ];

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleWithdraw = () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setWithdrawSuccess(true);
      setTimeout(() => setWithdrawSuccess(false), 5000);
    }, 1500);
  };

  return (
    <CreatorShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Paystack Payouts & Earnings
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure your Nigerian bank account to receive automated 80% sales payouts
          </p>
        </div>

        <button
          type="button"
          onClick={handleWithdraw}
          disabled={withdrawing || availableBalanceNgn <= 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {withdrawing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Initiating Paystack Transfer...</span>
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4 stroke-[2.5]" />
              <span>Withdraw ₦{availableBalanceNgn.toLocaleString()}</span>
            </>
          )}
        </button>
      </div>

      {withdrawSuccess && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold block text-sm">Payout Request Sent to Paystack!</span>
            Transfer reference generated. Funds will hit your GTBank account within 5–15 minutes.
          </div>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Available Balance</span>
            <div className="p-1.5 rounded-md bg-[#2dd4bf]/10 text-[#2dd4bf]">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              ₦{availableBalanceNgn.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-[#2dd4bf] mt-1">Ready for instant bank transfer</p>
        </div>

        {/* Pending Clearance */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Pending Clearance</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-300">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              ₦{pendingClearanceNgn.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Clears 24 hours after license delivery</p>
        </div>

        {/* Total Paid Out */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Lifetime Paid Out</span>
            <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              ₦{totalPaidOutNgn.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Disbursed via Paystack direct transfers</p>
        </div>
      </div>

      {/* Paystack Bank Account Configuration */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Building className="h-4 w-4 text-[#2dd4bf]" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                Paystack Direct Deposit Account
              </h3>
              <p className="text-xs text-zinc-400">
                Your primary bank account for beat sales revenue & streaming royalties
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            Verified Subaccount
          </span>
        </div>

        <form onSubmit={handleSaveBank} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Bank Name</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
            >
              <option value="Guaranty Trust Bank (GTB)">Guaranty Trust Bank (GTB)</option>
              <option value="Access Bank">Access Bank</option>
              <option value="Zenith Bank">Zenith Bank</option>
              <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
              <option value="First Bank of Nigeria">First Bank of Nigeria</option>
              <option value="Kuda Bank">Kuda Bank</option>
              <option value="Opay">Opay Digital Services</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">NUBAN Account Number (10 Digits)</label>
            <input
              type="text"
              required
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Verified Account Name</label>
            <input
              type="text"
              readOnly
              value={accountName}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-400 font-mono cursor-not-allowed"
            />
          </div>

          <div className="sm:col-span-3 flex items-center justify-between pt-2">
            <span className="text-[11px] text-zinc-500">
              Validated automatically with the Nigerian Inter-Bank Settlement System (NIBSS).
            </span>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs transition-colors cursor-pointer"
            >
              {isSaved ? 'Bank Details Updated!' : 'Update Bank Details'}
            </button>
          </div>
        </form>
      </div>

      {/* Payout Ledger Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-1">Transfer History</h3>
        <p className="text-xs text-zinc-400 mb-4">Past withdrawals sent to your Nigerian bank</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Bank Destination</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3 text-right">Gross Amount</th>
                <th className="py-2.5 px-3 text-right">Net Received</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
              {payoutHistory.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-3 text-zinc-300">{row.date}</td>
                  <td className="py-3 px-3 text-zinc-300 font-sans">{row.bank}</td>
                  <td className="py-3 px-3 text-zinc-500">{row.reference}</td>
                  <td className="py-3 px-3 text-right text-zinc-400">
                    ₦{row.amountNgn.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    ₦{row.netNgn.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment & Revenue Policy Disclosure Footer */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-white block">Official 80/20 Split & Download Incentive Policy</span>
          <span>Earn 80% on paid sales + ₦30,000 for every 10,000 qualifying free commercial downloads.</span>
        </div>
        <a
          href="https://cautionstudioz.com/payment-policy"
          target="_blank"
          rel="noreferrer"
          className="text-[#2dd4bf] hover:underline font-semibold shrink-0"
        >
          View Full Policy Document →
        </a>
      </div>
    </CreatorShell>
  );
}
