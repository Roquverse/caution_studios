'use client';

import React, { useState } from 'react';
import { CreatorShell } from '../../components/CreatorShell';
import {
  MessageSquare,
  ShieldCheck,
  Send,
  Paperclip,
  CheckCheck,
  Lock,
  AlertCircle,
  Music,
  User,
  Sparkles
} from 'lucide-react';

interface ChatThread {
  id: string;
  artistName: string;
  artistHandle: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  project: string;
}

export default function StudioChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: 't-1',
      artistName: 'David Soundz',
      artistHandle: '@david_soundz',
      avatar: '/images/artist_studio_mic.jpg',
      lastMessage: 'Can you export the drum stems at 24-bit without the master limiter?',
      time: '12m ago',
      unread: true,
      project: 'Lagos Nights (Afrobeats Master)'
    },
    {
      id: 't-2',
      artistName: 'Kroma Sound Lab',
      artistHandle: '@dj_kroma',
      avatar: '/images/album_neon_dj.jpg',
      lastMessage: 'The amapiano log drum groove is perfect. Vocals are being recorded today.',
      time: '2h ago',
      unread: false,
      project: 'Piano Fever - Amapiano Stems'
    },
    {
      id: 't-3',
      artistName: 'Tokyo Daze Records',
      artistHandle: '@tokyo_daze',
      avatar: '/images/hero_boombox.jpg',
      lastMessage: 'Thanks for the quick stem delivery!',
      time: '1d ago',
      unread: false,
      project: 'Neon Overdrive Synthwave'
    }
  ]);

  const [activeThreadId, setActiveThreadId] = useState('t-1');
  const [newMessage, setNewMessage] = useState('');

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const [messages, setMessages] = useState([
    {
      id: 'm-1',
      sender: 'artist',
      text: 'Hey bro! I just purchased the Exclusive Rights for Lagos Nights. The beat is incredible.',
      time: '10:45 AM'
    },
    {
      id: 'm-2',
      sender: 'producer',
      text: 'Appreciate it David! Glad you like the groove. Full stems zip is in your library.',
      time: '10:48 AM'
    },
    {
      id: 'm-3',
      sender: 'artist',
      text: 'Can you export the drum stems at 24-bit without the master limiter?',
      time: '11:02 AM'
    }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Contact audit check
    const hasPhoneOrEmail = /(\+?\d{10,14}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/.test(newMessage);
    if (hasPhoneOrEmail) {
      alert('Caution Studio Contact Protection: External phone numbers and emails are masked. Please coordinate stems and licensing directly inside Caution Studio.');
      return;
    }

    setMessages([
      ...messages,
      {
        id: `m-${Date.now()}`,
        sender: 'producer',
        text: newMessage,
        time: 'Just now'
      }
    ]);
    setNewMessage('');
  };

  return (
    <CreatorShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Studio Artist Collaboration Chat
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Direct real-time messaging with licensed artists, recording labels, and vocalists
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 text-[#2dd4bf] text-xs font-semibold flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            <span>Encrypted Studio Channel</span>
          </span>
        </div>
      </div>

      {/* Contact Protection Banner */}
      <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center gap-3">
        <ShieldCheck className="h-4 w-4 text-[#2dd4bf] shrink-0" />
        <span className="text-xs text-zinc-400 leading-snug">
          Caution Studio protects producers: Messages are monitored for copyright compliance and contract fulfillment. All collaboration remains on-platform to guarantee escrow security.
        </span>
      </div>

      {/* Chat Container */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 h-[560px] flex overflow-hidden shadow-sm">
        {/* Thread Sidebar */}
        <div className="w-full sm:w-80 border-r border-zinc-800 flex flex-col bg-[#0c0d10]">
          <div className="p-3 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Active Artist Inquiries ({threads.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveThreadId(t.id)}
                className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                  activeThreadId === t.id
                    ? 'bg-zinc-800/80 text-white'
                    : 'hover:bg-zinc-800/40 text-zinc-400'
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-xs font-bold text-[#2dd4bf]">
                  {t.artistName.substring(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">
                      {t.artistName}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{t.time}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    {t.project}
                  </span>
                  <p className="text-xs text-zinc-400 truncate mt-1">
                    {t.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message View Area */}
        <div className="flex-1 flex flex-col bg-zinc-950/60 min-w-0">
          {/* Active Conversation Top Bar */}
          <div className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-900/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-[#2dd4bf]">
                {activeThread.artistName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {activeThread.artistName} ({activeThread.artistHandle})
                </span>
                <span className="text-[10px] text-[#2dd4bf] block font-mono truncate">
                  Project: {activeThread.project}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Online</span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m) => {
              const isProducer = m.sender === 'producer';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isProducer ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 text-xs leading-relaxed ${
                      isProducer
                        ? 'bg-[#2dd4bf] text-zinc-950 font-medium rounded-br-none'
                        : 'bg-zinc-800/90 text-zinc-100 rounded-bl-none border border-zinc-700/60'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 px-1">
                    {m.time}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Send Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center gap-2"
          >
            <button
              type="button"
              title="Attach audio stems or files"
              onClick={() => alert('Select stems or audio preview to attach.')}
              className="p-2 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message to the recording artist..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
            />

            <button
              type="submit"
              className="p-2 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    </CreatorShell>
  );
}
