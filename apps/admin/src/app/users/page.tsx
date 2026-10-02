'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import { Button, Badge, Avatar, SearchInput } from '@caution/ui';
import { Mail, CheckCircle2, MoreVertical } from 'lucide-react';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');

  const users = [
    {
      id: 'USR-101',
      name: 'Alex Rivers',
      email: 'alex@pixelcraft.studio',
      plan: 'Pro Commercial',
      joined: 'Sep 2025',
      channelsCount: 3,
      status: 'Active'
    },
    {
      id: 'USR-102',
      name: 'David Smith',
      email: 'david@yntstudios.com',
      plan: 'Studio Enterprise',
      joined: 'Jan 2025',
      channelsCount: 8,
      status: 'Active'
    },
    {
      id: 'USR-103',
      name: 'Sarah Chen',
      email: 'sarah@chenfilms.io',
      plan: 'Social Creator',
      joined: 'Mar 2026',
      channelsCount: 1,
      status: 'Active'
    },
    {
      id: 'USR-104',
      name: 'Marcus Vance',
      email: 'marcus@soundscape.cc',
      plan: 'Free Trial',
      joined: 'Oct 2026',
      channelsCount: 1,
      status: 'Trialing'
    }
  ];

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.plan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16">
      <AdminNav activePath="/users" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-950 tracking-tight">
              Creator Subscribers & Users
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Active subscriptions, whitelisted creators, and enterprise account management.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            pill
            onClick={() => alert('Inviting new creator seat...')}
          >
            Invite Subscriber
          </Button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="w-full sm:w-80">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search creators by name, email, plan..."
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Subscription Plan</th>
                  <th className="pb-3">Connected Channels</th>
                  <th className="pb-3">Member Since</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <span className="font-bold text-gray-900 block">{u.name}</span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 font-semibold text-gray-800">
                      {u.plan}
                    </td>

                    <td className="py-3.5 font-medium text-gray-600">
                      {u.channelsCount} channels
                    </td>

                    <td className="py-3.5 text-gray-400">
                      {u.joined}
                    </td>

                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> {u.status}
                      </span>
                    </td>

                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => alert(`Managing user ${u.name}`)}
                        className="p-1 text-gray-400 hover:text-black rounded"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
