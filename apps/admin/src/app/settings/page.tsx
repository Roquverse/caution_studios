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
  Sparkles
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
        <div className="border-b border-zinc-800">
          <div className="flex items-center gap-6 text-xs font-medium overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`pb-3 -mb-px transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'general'
                  ? 'border-[#2dd4bf] text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>General & Economics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('licensing')}
              className={`pb-3 -mb-px transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'licensing'
                  ? 'border-[#2dd4bf] text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Licensing & Audio Rules</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`pb-3 -mb-px transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'security'
                  ? 'border-[#2dd4bf] text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admins & Security</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('infrastructure')}
              className={`pb-3 -mb-px transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'infrastructure'
                  ? 'border-[#2dd4bf] text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              <span>Cloud & Storage</span>
            </button>
          </div>
        </div>

        {/* TAB 1: General & Economics */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs space-y-4">
              <div className="pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-semibold text-white">Platform Identity & Contact</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Global branding and administrative communication channels</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={config.platformName}
                    onChange={(e) => setConfig({ ...config, platformName: e.target.value })}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Executive Support Email
                  </label>
                  <input
                    type="email"
                    value={config.supportEmail}
                    onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Platform Economics */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs space-y-4">
              <div className="pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-semibold text-white">Marketplace Economics</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Platform split and revenue distributions across licenses</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
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
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Caution Studio fee (default: 20%)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Producer Royalty Split (%)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={config.producerFeePct}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Disbursed to beat producers (80%)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Primary Currency
                  </label>
                  <select
                    value={config.currency}
                    onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  >
                    <option value="NGN">Nigerian Naira (NGN ₦)</option>
                    <option value="USD">United States Dollar (USD $)</option>
                  </select>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Base gateway settlement currency</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-semibold text-xs px-4 py-2 rounded-md transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Licensing & Audio Rules */}
        {activeTab === 'licensing' && (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs space-y-4">
              <div className="pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-semibold text-white">Default License Price Presets</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Standard license pricing applied during producer uploads</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Basic Lease (₦)
                  </label>
                  <input
                    type="number"
                    value={config.basicLeasePrice}
                    onChange={(e) => setConfig({ ...config, basicLeasePrice: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Standard MP3 streaming rights</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Premium Lease (₦)
                  </label>
                  <input
                    type="number"
                    value={config.premiumLeasePrice}
                    onChange={(e) => setConfig({ ...config, premiumLeasePrice: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">WAV master + track stems</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Exclusive Buyout (₦)
                  </label>
                  <input
                    type="number"
                    value={config.exclusivePrice}
                    onChange={(e) => setConfig({ ...config, exclusivePrice: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Full copyright & Content ID transfer</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs space-y-4">
              <div className="pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-semibold text-white">Audio Playback & Teaser Protection</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Enforce preview limits for guest visitors and watermark cadence</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Guest Teaser Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    value={config.previewCutoffSeconds}
                    onChange={(e) => setConfig({ ...config, previewCutoffSeconds: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Enforces 15s cutoff before sign-up prompt</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Producer Tag Watermark Interval (Seconds)
                  </label>
                  <input
                    type="number"
                    value={config.watermarkIntervalSeconds}
                    onChange={(e) => setConfig({ ...config, watermarkIntervalSeconds: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Repeats audio voice protection tag</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-semibold text-xs px-4 py-2 rounded-md transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Admins & Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Active Administrators Directory */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">Authorized Administrators</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Staff members with executive clearance to administrative controls</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-semibold text-xs px-3 py-1.5 rounded-md transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Authorize Admin</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">
                      <th className="pb-2.5 px-3">Administrator</th>
                      <th className="pb-2.5 px-3">Role</th>
                      <th className="pb-2.5 px-3">Status</th>
                      <th className="pb-2.5 px-3">Authorized On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-[10px]">
                              {admin.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-white block">{admin.email}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">{admin.user_id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] px-2 py-0.5 rounded font-semibold">
                            {admin.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 text-[11px] font-mono">
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
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs space-y-4">
              <div className="pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-semibold text-white">Change Admin Password</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Directly update security credentials for any executive administrator</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Select Administrator Email
                  </label>
                  <select
                    value={targetAdminEmail}
                    onChange={(e) => setTargetAdminEmail(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  >
                    {admins.map((adm) => (
                      <option key={adm.id} value={adm.email}>
                        {adm.email} ({adm.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordUpdating}
                    className="inline-flex items-center gap-2 bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-semibold text-xs px-4 py-2 rounded-md transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Key className="h-3.5 w-3.5" />
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
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs space-y-4">
              <div className="pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-semibold text-white">Storage & Compute Infrastructure</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Live connectivity to R2 master storage, database, and gateways</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Cloudflare R2 */}
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#2dd4bf]" />
                      Cloudflare R2 Bucket
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Bucket Name: <span className="font-mono text-zinc-200">caution-studio-audio</span>
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Stores master 24-bit WAVs, track stems, 320kbps MP3s, and artwork.
                  </p>
                </div>

                {/* Supabase */}
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <Server className="h-4 w-4 text-emerald-400" />
                      Supabase PostgreSQL
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Connected
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Host: <span className="font-mono text-zinc-200">yvsoqighrijqqnojelgp.supabase.co</span>
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Row Level Security (RLS) active • Realtime replication enabled.
                  </p>
                </div>

                {/* Paystack Gateway */}
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-amber-400" />
                      Paystack Gateway (NGN)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Operational
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Direct local payments in Naira • Split disbursements to Nigerian bank accounts.
                  </p>
                </div>

                {/* Stripe Connect */}
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-400" />
                      Stripe Connect (USD)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Operational
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Global card processing • Automatic international producer payouts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Authorize New Admin */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#0c0d10] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#2dd4bf]" />
                  <span>Authorize New Administrator</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ops@cautionstudioz.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Temporary / Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Administrative Role
                  </label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  >
                    <option value="superadmin">Superadmin (Full Access)</option>
                    <option value="manager">Catalog & Licensing Manager</option>
                    <option value="support">Creator Support Specialist</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 rounded-md border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingAdmin}
                    className="inline-flex items-center gap-1.5 bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-semibold text-xs px-3.5 py-1.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
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
