'use client';

import React, { useState, useEffect } from 'react';
import { CreatorShell } from '../../components/CreatorShell';
import { supabase } from '../../lib/supabaseClient';
import {
  CreditCard,
  DollarSign,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Wallet,
  ArrowRight
} from 'lucide-react';

interface PayoutRecord {
  id: string;
  date: string;
  bank: string;
  amountNgn: number;
  feeNgn: number;
  netNgn: number;
  reference: string;
  status: string;
}

export default function PayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const [availableBalanceNgn, setAvailableBalanceNgn] = useState(0);
  const [pendingClearanceNgn, setPendingClearanceNgn] = useState(0);
  const [totalPaidOutNgn, setTotalPaidOutNgn] = useState(0);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadPayoutData() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (!userId) {
          if (isMounted) setLoading(false);
          return;
        }

        // 1. Fetch Profile Banking Details & Balances
        const { data: profile } = await supabase
          .from('profiles')
          .select('paystack_bank_name, paystack_account_number, paystack_account_name, available_balance_ngn, pending_balance_ngn')
          .eq('id', userId)
          .maybeSingle();

        if (profile && isMounted) {
          setBankName(profile.paystack_bank_name || '');
          setAccountNumber(profile.paystack_account_number || '');
          setAccountName(profile.paystack_account_name || '');
          setAvailableBalanceNgn(Number(profile.available_balance_ngn) || 0);
          setPendingClearanceNgn(Number(profile.pending_balance_ngn) || 0);
        }

        // 2. Fetch Payouts History
        const { data: payouts } = await supabase
          .from('payouts')
          .select('*')
          .eq('producer_id', userId)
          .order('created_at', { ascending: false });

        if (payouts && isMounted) {
          const completedTotal = payouts
            .filter((p) => p.status === 'completed')
            .reduce((acc, p) => acc + (Number(p.amount_ngn) || 0), 0);
          setTotalPaidOutNgn(completedTotal);

          const formatted: PayoutRecord[] = payouts.map((p) => ({
            id: p.id,
            date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            bank: `${p.bank_name || 'Bank'} ···· ${p.account_number ? p.account_number.slice(-4) : '****'}`,
            amountNgn: Number(p.amount_ngn) || 0,
            feeNgn: Number(p.fee_ngn) || 100,
            netNgn: Number(p.net_ngn) || (Number(p.amount_ngn) - 100),
            reference: p.paystack_transfer_reference || `trf_${p.id.slice(0, 8)}`,
            status: p.status === 'completed' ? 'Completed' : (p.status === 'failed' ? 'Failed' : 'Pending')
          }));
          setPayoutHistory(formatted);
        }
      } catch (err) {
        console.error('Error loading payout information:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPayoutData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        alert('You must be signed in.');
        setSavingBank(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          paystack_bank_name: bankName.trim(),
          paystack_account_number: accountNumber.trim(),
          paystack_account_name: accountName.trim()
        })
        .eq('id', userId);

      if (error) throw error;

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error('Error saving bank details:', err);
      alert('Could not save bank details. Please try again.');
    } finally {
      setSavingBank(false);
    }
  };

  const handleWithdraw = async () => {
    if (!accountNumber || !bankName) {
      alert('Please configure your Nigerian bank account first.');
      return;
    }

    if (availableBalanceNgn < 2000) {
      alert('Minimum payout withdrawal is ₦2,000.');
      return;
    }

    setWithdrawing(true);
    setWithdrawError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        setWithdrawing(false);
        return;
      }

      const amountToWithdraw = availableBalanceNgn;
      const fee = 100;
      const net = amountToWithdraw - fee;

      // 1. Insert payout row
      const { data: payout, error: payoutErr } = await supabase
        .from('payouts')
        .insert({
          producer_id: userId,
          amount_ngn: amountToWithdraw,
          fee_ngn: fee,
          net_ngn: net,
          bank_name: bankName,
          bank_code: '058',
          account_number: accountNumber,
          account_name: accountName,
          status: 'pending'
        })
        .select()
        .single();

      if (payoutErr) throw payoutErr;

      // 2. Update balances in profiles
      await supabase
        .from('profiles')
        .update({
          available_balance_ngn: 0,
          pending_balance_ngn: pendingClearanceNgn + amountToWithdraw
        })
        .eq('id', userId);

      setAvailableBalanceNgn(0);
      setPendingClearanceNgn((prev) => prev + amountToWithdraw);

      if (payout) {
        setPayoutHistory((prev) => [
          {
            id: payout.id,
            date: 'Today',
            bank: `${bankName} ···· ${accountNumber.slice(-4)}`,
            amountNgn: amountToWithdraw,
            feeNgn: fee,
            netNgn: net,
            reference: `trf_${payout.id.slice(0, 8)}`,
            status: 'Pending'
          },
          ...prev
        ]);
      }

      setWithdrawSuccess(true);
      setTimeout(() => setWithdrawSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error requesting withdrawal:', err);
      setWithdrawError(err.message || 'Failed to request withdrawal.');
    } finally {
      setWithdrawing(false);
    }
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
            Configure your Nigerian bank account to receive automated 80% sales payouts and streaming royalties
          </p>
        </div>

        <button
          type="button"
          onClick={handleWithdraw}
          disabled={withdrawing || availableBalanceNgn < 2000}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {withdrawing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing Transfer...</span>
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              <span>Withdraw to Bank (₦{availableBalanceNgn.toLocaleString()})</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-7 w-7 text-[#2dd4bf] animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Loading wallet & payout ledger...</span>
        </div>
      ) : (
        <>
          {withdrawSuccess && (
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold block text-sm">Withdrawal Request Queued!</span>
                <span>Your transfer is queued via Paystack and will settle into your Nigerian bank account within 24 hours.</span>
              </div>
            </div>
          )}

          {withdrawError && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4 text-red-400 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-xs">{withdrawError}</span>
            </div>
          )}

          {/* 3 Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
              <span className="text-xs font-medium text-zinc-400 block">Available for Withdrawal</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-white">
                  ₦{availableBalanceNgn.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-[#2dd4bf] mt-1 font-medium">
                Instant disbursement to Nigerian bank
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
              <span className="text-xs font-medium text-zinc-400 block">Pending Clearance</span>
              <div className="mt-2">
                <span className="text-3xl font-bold font-mono text-zinc-300">
                  ₦{pendingClearanceNgn.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Clearing within 24-48 hours
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
              <span className="text-xs font-medium text-zinc-400 block">Total Lifetime Paid Out</span>
              <div className="mt-2">
                <span className="text-3xl font-bold font-mono text-emerald-400">
                  ₦{totalPaidOutNgn.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Net 80% splits & streaming royalties
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Bank Settings Form */}
            <div className="lg:col-span-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                <Building className="h-4 w-4 text-[#2dd4bf]" />
                <h3 className="text-sm font-semibold text-white">Bank Account Configuration</h3>
              </div>

              {isSaved && (
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Bank details saved to your profile!</span>
                </div>
              )}

              <form onSubmit={handleSaveBank} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Select Nigerian Bank</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="">Select a Bank...</option>
                    <option value="Access Bank">Access Bank</option>
                    <option value="Guaranty Trust Bank (GTB)">Guaranty Trust Bank (GTB)</option>
                    <option value="Zenith Bank">Zenith Bank</option>
                    <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                    <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                    <option value="Kuda Bank">Kuda Bank (Microfinance)</option>
                    <option value="Opay">Opay / Paycom</option>
                    <option value="Moniepoint">Moniepoint MFB</option>
                    <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
                    <option value="Fidelity Bank">Fidelity Bank</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">10-Digit NUBAN Account Number</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="0123456789"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Account Name (Must match your ID)</label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 uppercase focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingBank}
                  className="w-full py-2 px-3 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingBank ? 'Saving...' : 'Save Bank Details'}
                </button>
              </form>
            </div>

            {/* Right: Payout Ledger History */}
            <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-white mb-1">Disbursement History</h3>
              <p className="text-xs text-zinc-400 mb-4">Complete audit trail of all Paystack transfers and fees</p>

              {payoutHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Destination</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Fee</th>
                        <th className="py-2.5 px-3 text-right">Net Received</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                      {payoutHistory.map((row) => (
                        <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-3 font-sans text-zinc-300">{row.date}</td>
                          <td className="py-3 px-3 text-zinc-400">{row.bank}</td>
                          <td className="py-3 px-3 text-right text-zinc-300">
                            ₦{row.amountNgn.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right text-zinc-500">
                            ₦{row.feeNgn}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            ₦{row.netNgn.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                row.status === 'Completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : row.status === 'Pending'
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center space-y-2">
                  <CreditCard className="h-8 w-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400 font-medium">No payout requests yet</p>
                  <p className="text-[11px] text-zinc-500">
                    Once you earn from beat sales or free stream royalties, your balance can be withdrawn directly here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </CreatorShell>
  );
}
