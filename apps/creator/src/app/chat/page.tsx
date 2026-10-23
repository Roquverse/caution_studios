'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  beat_id?: string;
  order_id?: string;
}

interface ChatThread {
  counterpartId: string;
  artistName: string;
  artistHandle: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  project: string;
  messages: ChatMessage[];
}

export default function StudioChatPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeCounterpartId, setActiveCounterpartId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // Query chats involving this creator
      const { data: chatsData, error: chatsErr } = await supabase
        .from('chats')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (chatsErr) {
        console.error('Error fetching chats:', chatsErr);
        setLoading(false);
        return;
      }

      if (!chatsData || chatsData.length === 0) {
        setThreads([]);
        setLoading(false);
        return;
      }

      // Collect counterpart user IDs
      const counterpartIds = Array.from(
        new Set(
          chatsData.map((c) => (c.sender_id === user.id ? c.recipient_id : c.sender_id))
        )
      );

      // Fetch profiles of counterparts
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, handle, avatar_url')
        .in('id', counterpartIds);

      const profileMap = new Map<string, any>();
      (profilesData || []).forEach((p) => profileMap.set(p.id, p));

      // Group messages by counterpart
      const threadMap = new Map<string, ChatMessage[]>();
      chatsData.forEach((msg: ChatMessage) => {
        const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        if (!threadMap.has(otherId)) {
          threadMap.set(otherId, []);
        }
        threadMap.get(otherId)!.push(msg);
      });

      const builtThreads: ChatThread[] = [];
      threadMap.forEach((msgs, otherId) => {
        const profile = profileMap.get(otherId);
        const lastMsg = msgs[msgs.length - 1];
        const date = new Date(lastMsg.created_at);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        builtThreads.push({
          counterpartId: otherId,
          artistName: profile?.display_name || 'Verified Artist',
          artistHandle: profile?.handle ? `@${profile.handle}` : '@artist',
          avatar: profile?.avatar_url || '',
          lastMessage: lastMsg.content,
          time: timeStr,
          unread: false,
          project: 'Studio Collaboration',
          messages: msgs
        });
      });

      setThreads(builtThreads);
      if (builtThreads.length > 0 && !activeCounterpartId) {
        setActiveCounterpartId(builtThreads[0].counterpartId);
      }
    } catch (err: any) {
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const activeThread = threads.find((t) => t.counterpartId === activeCounterpartId) || threads[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !activeThread) return;

    // Contact audit check
    const hasPhoneOrEmail = /(\+?\d{10,14}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/.test(
      newMessage
    );
    if (hasPhoneOrEmail) {
      alert(
        'Caution Studio Contact Protection: External phone numbers and emails are masked. Please coordinate stems and licensing directly inside Caution Studio.'
      );
      return;
    }

    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    try {
      const { error: insertErr } = await supabase.from('chats').insert({
        sender_id: currentUserId,
        recipient_id: activeThread.counterpartId,
        content: text,
        is_encrypted: true,
        has_contact_info: false
      });

      if (insertErr) throw insertErr;

      // Refresh chat list
      await fetchChats();
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
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
      {loading ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 h-[500px] flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700 mx-auto flex items-center justify-center text-zinc-400 mb-4">
            <MessageSquare className="h-6 w-6 text-[#2dd4bf]" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Active Artist Chats Yet</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            When recording artists or labels license your beats or request custom stems, encrypted collaboration channels will open directly in this workspace.
          </p>
        </div>
      ) : (
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
                  key={t.counterpartId}
                  type="button"
                  onClick={() => setActiveCounterpartId(t.counterpartId)}
                  className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                    activeThread?.counterpartId === t.counterpartId
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
          {activeThread ? (
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
                {activeThread.messages.map((m) => {
                  const isProducer = m.sender_id === currentUserId;
                  const timeStr = new Date(m.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
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
                        {m.content}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono mt-1 px-1">
                        {timeStr}
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
                  onClick={() => alert('Audio stems upload will open file picker.')}
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
                  disabled={sending || !newMessage.trim()}
                  className="p-2 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 stroke-[2.5]" />
                  )}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      )}
    </CreatorShell>
  );
}
