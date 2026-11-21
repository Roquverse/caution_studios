'use client';

import React, { useState, useEffect } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { supabase } from '../../lib/supabaseClient';
import {
  Sliders,
  Shield,
  Key,
  Database,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Plus,
  Lock,
  Mail,
  Clock,
  Radio,
  FileCheck,
  Server,
  Layers,
  Sparkles,
  X
} from 'lucide-react';

interface AdminMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface PlatformConfig {
  platformName: string;
  supportEmail: string;
  platformFeePct: number;
  producerFeePct: number;
  currency: string;
  basicLeasePrice: number;
  premiumLeasePrice: number;
  exclusivePrice: number;
  previewCutoffSeconds: number;
  watermarkIntervalSeconds: number;
  autoPublishTracks: boolean;
  emailOnNewUpload: boolean;
  emailOnSale: boolean;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'licensing' | 'security' | 'infrastructure'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Platform configuration state
  const [config, setConfig] = useState<PlatformConfig>({
    platformName: 'Caution Studio',
    supportEmail: 'admin@cautionstudioz.com',
    platformFeePct: 20,
    producerFeePct: 80,
    currency: 'NGN',
    basicLeasePrice: 15000,
    premiumLeasePrice: 45000,
    exclusivePrice: 250000,
    previewCutoffSeconds: 15,
    watermarkIntervalSeconds: 20,
    autoPublishTracks: true,
    emailOnNewUpload: true,
    emailOnSale: true
  });

  // Admins list
  const [admins, setAdmins] = useState<AdminMember[]>([]);

  // Password change state
  const [targetAdminEmail, setTargetAdminEmail] = useState('admin@cautionstudioz.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  // New admin state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('superadmin');
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.admins) setAdmins(data.admins);
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          payload: config
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setSuccessMsg('Platform settings updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }

    setPasswordUpdating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          payload: {
            email: targetAdminEmail,
            newPassword
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccessMsg(`Password successfully updated for ${targetAdminEmail}`);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating password');
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    setAddingAdmin(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_admin',
          payload: {
            email: newAdminEmail,
            role: newAdminRole,
            password: newAdminPassword
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authorize administrator');
      }

      setSuccessMsg(data.message || 'Administrator successfully authorized');
      setShowAddModal(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchSettings();
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding administrator');
    } finally {
      setAddingAdmin(false);
    }
  };

  return (
    <AdminShell activePath="/settings">
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Admin Settings</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Executive platform controls, licensing economics, security clearance, and storage telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSettings}
              title="Refresh Settings"
              className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-white/[0.06]">
          <div className="flex items-center gap-6 text-xs font-medium overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`pb-3 -mb-px transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'general'
                  ? 'border-[#e53935] text-white font-bold'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-[#ff6b67]" />
              <span>General & Economics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('licensing')}
              className={`pb-3 -mb-px transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'licensing'
                  ? 'border-[#e53935] text-white font-bold'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5 text-amber-400" />
              <span>Licensing & Audio Rules</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`pb-3 -mb-px transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'security'
                  ? 'border-[#e53935] text-white font-bold'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-sky-400" />
              <span>Admins & Security</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('infrastructure')}
              className={`pb-3 -mb-px transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'infrastructure'
                  ? 'border-[#e53935] text-white font-bold'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Server className="h-3.5 w-3.5 text-emerald-400" />
              <span>Cloud & Storage</span>
            </button>
          </div>
        </div>

        {/* TAB 1: General & Economics */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-6 shadow-sm hover:border-white/[0.12] transition-colors space-y-5">
              <div className="pb-3 border-b border-white/[0.06]">
                <h3 className="text-base font-extrabold text-white tracking-tight">Platform Identity & Contact</h3>
                <p className="text-xs text-gray-400 mt-1">Global branding and administrative communication channels</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={config.platformName}
                    onChange={(e) => setConfig({ ...config, platformName: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Executive Support Email
                  </label>
                  <input
                    type="email"
                    value={config.supportEmail}
                    onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Platform Economics */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-6 shadow-sm hover:border-white/[0.12] transition-colors space-y-5">
              <div className="pb-3 border-b border-white/[0.06]">
                <h3 className="text-base font-extrabold text-white tracking-tight">Marketplace Economics</h3>
                <p className="text-xs text-gray-400 mt-1">Platform split and revenue distributions across licenses</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Platform Commission (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.platformFeePct}
                    onChange={(e) => {
                      const fee = Number(e.target.value);
                      setConfig({
                        ...config,
                        platformFeePct: fee,
                        producerFeePct: 100 - fee
                      });
                    }}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  />
                  <span className="text-[11px] text-gray-500 mt-1.5 block">Caution Studio fee (default: 20%)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Producer Royalty Split (%)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={config.producerFeePct}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12]/50 border border-white/[0.05] text-xs text-gray-400 font-mono"
                  />
                  <span className="text-[11px] text-gray-500 mt-1.5 block">Disbursed to beat producers (80%)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Primary Currency
                  </label>
                  <select
                    value={config.currency}
                    onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  >
                    <option value="NGN">Nigerian Naira (NGN ₦)</option>
                    <option value="USD">United States Dollar (USD $)</option>
                  </select>
                  <span className="text-[11px] text-gray-500 mt-1.5 block">Base gateway settlement currency</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-red-950/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Licensing & Audio Rules */}
        {activeTab === 'licensing' && (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-6 shadow-sm hover:border-white/[0.12] transition-colors space-y-5">
              <div className="pb-3 border-b border-white/[0.06]">
                <h3 className="text-base font-extrabold text-white tracking-tight">Default License Price Presets</h3>
                <p className="text-xs text-gray-400 mt-1">Standard license pricing applied during producer uploads</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Basic Lease (₦)
                  </label>
                  <input
                    type="number"
                    value={config.basicLeasePrice}
                    onChange={(e) => setConfig({ ...config, basicLeasePrice: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  />
                  <span className="text-[11px] text-gray-500 mt-1.5 block">Standard MP3 streaming rights</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Premium Lease (₦)
                  </label>
                  <input
                    type="number"
                    value={config.premiumLeasePrice}
                    onChange={(e) => setConfig({ ...config, premiumLeasePrice: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  />
                  <span className="text-[11px] text-gray-500 mt-1.5 block">WAV master + track stems</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Exclusive Buyout (₦)
                  </label>
                  <input
                    type="number"
                    value={config.exclusivePrice}
                    onChange={(e) => setConfig({ ...config, exclusivePrice: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  />
                  <span className="text-[11px] text-gray-500 mt-1.5 block">Full copyright & Content ID transfer</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-6 shadow-sm hover:border-white/[0.12] transition-colors space-y-5">
              <div className="pb-3 border-b border-white/[0.06]">
                <h3 className="text-base font-extrabold text-white tracking-tight">Audio Playback & Teaser Protection</h3>
                <p className="text-xs text-gray-400 mt-1">Enforce preview limits for guest visitors and watermark cadence</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Guest Teaser Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    value={config.previewCutoffSeconds}
                    onChange={(e) => setConfig({ ...config, previewCutoffSeconds: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  />
                  <span className="text-[11px] text-gray-500 mt-1.5 block">Enforces 15s cutoff before sign-up prompt</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Producer Tag Watermark Interval (Seconds)
                  </label>
                  <input
                    type="number"
                    value={config.watermarkIntervalSeconds}
                    onChange={(e) => setConfig({ ...config, watermarkIntervalSeconds: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  />
                  <span className="text-[11px] text-gray-500 mt-1.5 block">Repeats audio voice protection tag</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-red-950/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Admins & Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Active Administrators Directory */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-6 shadow-sm hover:border-white/[0.12] transition-colors space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">Authorized Administrators</h3>
                  <p className="text-xs text-gray-400 mt-1">Staff members with executive clearance to administrative controls</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Authorize Admin</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-gray-400 uppercase tracking-wider text-[10px] font-semibold">
                      <th className="pb-3 px-3">Administrator</th>
                      <th className="pb-3 px-3">Role</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Authorized On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#0d0e12] border border-white/[0.08] flex items-center justify-center font-bold text-white text-[11px]">
                              {admin.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-white block">{admin.email}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{admin.user_id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="bg-[#e53935]/15 text-[#ff6b67] border border-[#e53935]/30 text-[10px] px-2.5 py-0.5 rounded-md font-bold">
                            {admin.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-[11px] font-mono">
                          {new Date(admin.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-6 shadow-sm hover:border-white/[0.12] transition-colors space-y-5">
              <div className="pb-3 border-b border-white/[0.06]">
                <h3 className="text-base font-extrabold text-white tracking-tight">Change Admin Password</h3>
                <p className="text-xs text-gray-400 mt-1">Directly update security credentials for any executive administrator</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Select Administrator Email
                  </label>
                  <select
                    value={targetAdminEmail}
                    onChange={(e) => setTargetAdminEmail(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  >
                    {admins.map((adm) => (
                      <option key={adm.id} value={adm.email}>
                        {adm.email} ({adm.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordUpdating}
                    className="inline-flex items-center gap-2 bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Key className="h-4 w-4" />
                    <span>{passwordUpdating ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: Cloud & Storage */}
        {activeTab === 'infrastructure' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-6 shadow-sm hover:border-white/[0.12] transition-colors space-y-5">
              <div className="pb-3 border-b border-white/[0.06]">
                <h3 className="text-base font-extrabold text-white tracking-tight">Storage & Compute Infrastructure</h3>
                <p className="text-xs text-gray-400 mt-1">Live connectivity to R2 master storage, database, and gateways</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Cloudflare R2 */}
                <div className="p-4 rounded-xl bg-[#0d0e12] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#ff6b67]" />
                      Cloudflare R2 Bucket
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Bucket Name: <span className="font-mono text-white">caution-studio-audio</span>
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Stores master 24-bit WAVs, track stems, 320kbps MP3s, and artwork.
                  </p>
                </div>

                {/* Supabase */}
                <div className="p-4 rounded-xl bg-[#0d0e12] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Server className="h-4 w-4 text-emerald-400" />
                      Supabase PostgreSQL
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Connected
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Host: <span className="font-mono text-white">yvsoqighrijqqnojelgp.supabase.co</span>
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Row Level Security (RLS) active • Realtime replication enabled.
                  </p>
                </div>

                {/* Paystack Gateway */}
                <div className="p-4 rounded-xl bg-[#0d0e12] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-amber-400" />
                      Paystack Gateway (NGN)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Operational
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Direct local payments in Naira • Split disbursements to Nigerian bank accounts.
                  </p>
                </div>

                {/* Stripe Connect */}
                <div className="p-4 rounded-xl bg-[#0d0e12] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-400" />
                      Stripe Connect (USD)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Operational
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Global card processing • Automatic international producer payouts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Authorize New Admin */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#12141c] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#ff6b67]" />
                  <span>Authorize New Administrator</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ops@cautionstudioz.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Temporary / Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Administrative Role
                  </label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#e53935] focus:ring-1 focus:ring-[#e53935]/40 transition-colors"
                  >
                    <option value="superadmin">Superadmin (Full Access)</option>
                    <option value="manager">Catalog & Licensing Manager</option>
                    <option value="support">Creator Support Specialist</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingAdmin}
                    className="inline-flex items-center gap-2 bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{addingAdmin ? 'Authorizing...' : 'Confirm Clearance'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
