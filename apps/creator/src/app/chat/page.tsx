'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
  Play,
  Pause,
  Download,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  media_url?: string;
  media_key?: string;
  media_type?: 'image' | 'audio' | 'file';
  media_name?: string;
  media_size?: number;
  media_duration?: number;
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
  isAdmin?: boolean;
  messages: ChatMessage[];
}

export default function StudioChatPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeCounterpartId, setActiveCounterpartId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Staged Media Attachment
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  const [stagedFileType, setStagedFileType] = useState<'image' | 'audio' | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Playback
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Image Lightbox
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // WebSocket Realtime & Typing State
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [isConnectedWs, setIsConnectedWs] = useState(false);
  const wsChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Designated Executive Admin IDs
  const adminIdsRef = useRef<Set<string>>(
    new Set([
      'c855e1b8-b34c-4b1d-986b-373e70ec423f', // Studio Admin (admin@cautionstudioz.com)
      '9db03bfb-2dc1-42dd-888c-32daa24fe93a'  // Caution Admin (admin@caution.studio)
    ])
  );
  const primaryAdminIdRef = useRef<string>('c855e1b8-b34c-4b1d-986b-373e70ec423f');
  const activeCounterpartIdRef = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    activeCounterpartIdRef.current = activeCounterpartId;
  }, [activeCounterpartId]);

  // Checks whether a message belongs to the official executive admin support thread
  const isMessageAdminSupport = (msg: { sender_id?: string; recipient_id?: string }) => {
    if (!msg.sender_id || !msg.recipient_id) return false;
    return (
      adminIdsRef.current.has(msg.sender_id) ||
      adminIdsRef.current.has(msg.recipient_id) ||
      msg.sender_id === msg.recipient_id // System automated beat purchase notifications
    );
  };

  const fetchChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // 1. Fetch Official Studio Admin Info
      let adminId = primaryAdminIdRef.current;
      try {
        const adminRes = await fetch('/api/chat/admin-info', { cache: 'no-store' });
        if (adminRes.ok) {
          const adminData = await adminRes.json();
          if (adminData.adminId) {
            adminId = adminData.adminId;
            primaryAdminIdRef.current = adminData.adminId;
          }
          if (Array.isArray(adminData.allAdminIds)) {
            adminData.allAdminIds.forEach((id: string) => adminIdsRef.current.add(id));
          }
        }
      } catch (e) {}

      // 2. Query chats involving this creator
      const { data: chatsData, error: chatsErr } = await supabase
        .from('chats')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (chatsErr) {
        console.error('Error fetching chats:', chatsErr);
      }

      const chats = chatsData || [];

      // Group messages by counterpart
      // All admin messages and automated system purchase notifications route to the official admin support thread
      const threadMap = new Map<string, ChatMessage[]>();
      chats.forEach((msg: ChatMessage) => {
        let threadKey: string;
        if (isMessageAdminSupport(msg)) {
          threadKey = adminId;
        } else {
          threadKey = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        }

        if (!threadKey) return;
        if (!threadMap.has(threadKey)) {
          threadMap.set(threadKey, []);
        }
        threadMap.get(threadKey)!.push(msg);
      });

      // Ensure Admin thread is ALWAYS present and pinned
      if (!threadMap.has(adminId)) {
        threadMap.set(adminId, []);
      }

      // Collect external artist counterpart IDs (excluding admin)
      const nonAdminCounterparts = Array.from(threadMap.keys()).filter(
        (id) => !adminIdsRef.current.has(id) && id !== adminId
      );

      const profileMap = new Map<string, any>();
      if (nonAdminCounterparts.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, handle, avatar_url, primary_role, roles')
          .in('id', nonAdminCounterparts);

        (profilesData || []).forEach((p) => profileMap.set(p.id, p));
      }

      const builtThreads: ChatThread[] = [];
      threadMap.forEach((msgs, otherId) => {
        const isAdmin = otherId === adminId || adminIdsRef.current.has(otherId);
        const profile = profileMap.get(otherId);
        const lastMsg = msgs[msgs.length - 1];
        const date = lastMsg ? new Date(lastMsg.created_at) : new Date();
        const timeStr = lastMsg
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Support';

        let lastPreview = lastMsg?.content || 'Direct conversation with Caution Studio Executive Admin';
        if (lastMsg?.media_type === 'image') lastPreview = '📷 [Image attachment]';
        else if (lastMsg?.media_type === 'audio') lastPreview = '🎵 [Audio voice message]';

        builtThreads.push({
          counterpartId: otherId,
          artistName: isAdmin ? 'Caution Studio Executive Admin' : profile?.display_name || 'Verified Artist',
          artistHandle: isAdmin ? '@caution_admin' : profile?.handle ? `@${profile.handle.replace(/^@/, '')}` : '@artist',
          avatar: isAdmin ? '/images/caution_admin_avatar.png' : profile?.avatar_url || '',
          lastMessage: lastPreview,
          time: timeStr,
          unread: false,
          project: isAdmin ? 'Platform Operations & Support' : 'Studio Collaboration',
          isAdmin,
          messages: msgs
        });
      });

      // Sort: Admin thread pinned first, then newest messages
      builtThreads.sort((a, b) => {
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        const timeA = a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].created_at).getTime() : 0;
        const timeB = b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].created_at).getTime() : 0;
        return timeB - timeA;
      });

      setThreads(builtThreads);
      if (builtThreads.length > 0 && !activeCounterpartIdRef.current) {
        setActiveCounterpartId(builtThreads[0].counterpartId);
      }
    } catch (err: any) {
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Realtime instant message appender
  const appendMessage = (newMsg: ChatMessage) => {
    setThreads((prevThreads) => {
      if (!currentUserId) return prevThreads;

      const targetAdminId = primaryAdminIdRef.current;
      let counterpartId: string;
      if (isMessageAdminSupport(newMsg)) {
        counterpartId = targetAdminId;
      } else {
        counterpartId = newMsg.sender_id === currentUserId ? newMsg.recipient_id : newMsg.sender_id;
      }

      if (!counterpartId) return prevThreads;

      const date = new Date(newMsg.created_at || Date.now());
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let previewText = newMsg.content || '';
      if (newMsg.media_type === 'image') previewText = '📷 [Image attachment]';
      else if (newMsg.media_type === 'audio') previewText = '🎵 [Audio message]';

      let found = false;
      const updated = prevThreads.map((t) => {
        if (t.counterpartId === counterpartId) {
          found = true;
          if (
            t.messages.some(
              (m) =>
                m.id === newMsg.id ||
                (m.id?.startsWith('temp_') && m.content === newMsg.content && m.sender_id === newMsg.sender_id) ||
                (m.created_at === newMsg.created_at && m.content === newMsg.content)
            )
          ) {
            return t;
          }
          return {
            ...t,
            lastMessage: previewText,
            time: timeStr,
            messages: [...t.messages, newMsg]
          };
        }
        return t;
      });

      if (!found) {
        fetchChats();
        return prevThreads;
      }

      return updated.sort((a, b) => {
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        const timeA = a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].created_at).getTime() : 0;
        const timeB = b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].created_at).getTime() : 0;
        return timeB - timeA;
      });
    });
  };

  useEffect(() => {
    fetchChats();

    // High-speed WebSocket Channel for direct messaging, typing & Postgres changes
    const channel = supabase.channel('caution_realtime_chat', {
      config: {
        broadcast: { self: false }
      }
    });

    wsChannelRef.current = channel;

    // 1. Direct WebSocket broadcast from peer (< 30ms latency)
    channel.on('broadcast', { event: 'chat_message' }, ({ payload }) => {
      if (
        payload &&
        (payload.recipient_id === currentUserId ||
          payload.sender_id === currentUserId ||
          isMessageAdminSupport(payload))
      ) {
        appendMessage(payload);
        setIsPeerTyping(false);
      }
    });

    // 2. WebSocket typing indicator
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload?.targetProducerId === currentUserId) {
        if (payload?.isTyping) {
          setIsPeerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsPeerTyping(false), 3000);
        } else {
          setIsPeerTyping(false);
        }
      }
    });

    // 3. Fallback: Postgres CDC stream
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
      if (payload.new) {
        const newMsg = payload.new as ChatMessage;
        if (
          newMsg.recipient_id === currentUserId ||
          newMsg.sender_id === currentUserId ||
          isMessageAdminSupport(newMsg)
        ) {
          appendMessage(newMsg);
        }
      }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnectedWs(true);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnectedWs(false);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeCounterpartId, threads]);

  const activeThread = threads.find((t) => t.counterpartId === activeCounterpartId) || threads[0];

  // Handle media selection (Image or Audio)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const isAud = file.type.startsWith('audio/') || file.name.endsWith('.wav') || file.name.endsWith('.mp3');

    if (!isImg && !isAud) {
      alert('Only images (PNG, JPG, WEBP) and audio files (WAV, MP3) are supported.');
      return;
    }

    setStagedFile(file);
    setStagedFileType(isImg ? 'image' : 'audio');
    setStagedPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveStagedFile = () => {
    setStagedFile(null);
    setStagedFileType(null);
    if (stagedPreviewUrl) URL.revokeObjectURL(stagedPreviewUrl);
    setStagedPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (wsChannelRef.current && activeThread) {
      wsChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          producerId: currentUserId,
          targetProducerId: activeThread.counterpartId,
          isTyping: e.target.value.trim().length > 0
        }
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !stagedFile) || !currentUserId || !activeThread || sending) return;

    const messageText = newMessage.trim();

    // Contact audit check only for external artist messages (allowed when messaging official admin)
    if (!activeThread.isAdmin) {
      const hasPhoneOrEmail = /(\+?\d{10,14}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/.test(
        messageText
      );
      if (hasPhoneOrEmail) {
        alert(
          'Caution Studio Contact Protection: External phone numbers and emails are masked. Please coordinate stems and licensing directly inside Caution Studio.'
        );
        return;
      }
    }

    setSending(true);

    try {
      let mediaUrl: string | undefined;
      let mediaKey: string | undefined;
      let mediaType: 'image' | 'audio' | undefined;
      let mediaName: string | undefined;
      let mediaSize: number | undefined;

      // 1. Upload media to R2 if attached
      if (stagedFile) {
        setUploadingMedia(true);
        const formData = new FormData();
        formData.append('file', stagedFile);

        const uploadRes = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.media_url) {
          throw new Error(uploadData.error || 'Failed to upload media to R2');
        }

        mediaUrl = uploadData.media_url;
        mediaKey = uploadData.media_key;
        mediaType = uploadData.media_type;
        mediaName = uploadData.media_name;
        mediaSize = uploadData.media_size;
      }

      const targetRecipientId = activeThread.isAdmin
        ? primaryAdminIdRef.current
        : activeThread.counterpartId;

      // 2. Create optimistic message payload (0ms latency!)
      const optimisticMsg: ChatMessage = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender_id: currentUserId,
        recipient_id: targetRecipientId,
        content: messageText,
        media_url: mediaUrl,
        media_key: mediaKey,
        media_type: mediaType,
        media_name: mediaName,
        media_size: mediaSize,
        created_at: new Date().toISOString()
      };

      appendMessage(optimisticMsg);

      // Instantly broadcast via WebSocket to counterpart (< 30ms latency)
      if (wsChannelRef.current) {
        wsChannelRef.current.send({
          type: 'broadcast',
          event: 'chat_message',
          payload: optimisticMsg
        });
        wsChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { producerId: currentUserId, targetProducerId: targetRecipientId, isTyping: false }
        });
      }

      // Reset input immediately
      setNewMessage('');
      handleRemoveStagedFile();

      // 3. Persist in chats table
      const { error: insertErr } = await supabase.from('chats').insert({
        sender_id: currentUserId,
        recipient_id: targetRecipientId,
        content: messageText,
        media_url: mediaUrl,
        media_key: mediaKey,
        media_type: mediaType,
        media_name: mediaName,
        media_size: mediaSize,
        is_encrypted: !activeThread.isAdmin,
        has_contact_info: false
      });

      if (insertErr) throw insertErr;

      // Reset input
      setNewMessage('');
      handleRemoveStagedFile();
      await fetchChats();
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
      setUploadingMedia(false);
    }
  };

  // Audio Playback
  const handleToggleAudio = (url: string) => {
    if (playingAudioUrl === url) {
      if (audioPlayerRef.current?.paused) {
        audioPlayerRef.current.play();
      } else {
        audioPlayerRef.current?.pause();
        setPlayingAudioUrl(null);
      }
    } else {
      setPlayingAudioUrl(url);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play();
      }
    }
  };

  return (
    <CreatorShell>
      {/* Hidden audio element for chat audio playback */}
      <audio
        ref={audioPlayerRef}
        onTimeUpdate={() => {
          if (audioPlayerRef.current) {
            setAudioCurrentTime(audioPlayerRef.current.currentTime);
            setAudioDuration(audioPlayerRef.current.duration || 0);
          }
        }}
        onEnded={() => setPlayingAudioUrl(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Producer Studio Chat & Admin Messages
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Direct real-time messaging with Caution Studio Admin, licensed artists, and recording vocalists
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-[#e53935]/10 border border-[#e53935]/20 text-[#e53935] text-xs font-semibold flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            <span>R2 Media & Cloud Audio Active</span>
          </span>
        </div>
      </div>

      {/* Contact Protection Banner */}
      <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center gap-3">
        <ShieldCheck className="h-4 w-4 text-[#e53935] shrink-0" />
        <span className="text-xs text-zinc-400 leading-snug">
          Need help with stems verification, exclusive buyouts, or catalog inquiries? Message the <strong>Caution Studio Executive Admin</strong> directly anytime.
        </span>
      </div>

      {/* Chat Container */}
      {loading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 h-[560px] flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-[#e53935] animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-[#0A0D14] h-[600px] flex overflow-hidden shadow-2xl">
          {/* Thread Sidebar */}
          <div className="w-full sm:w-80 border-r border-zinc-800 flex flex-col bg-[#07090D]">
            <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Messages ({threads.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
              {threads.map((t) => {
                const isActive = activeThread?.counterpartId === t.counterpartId;
                return (
                  <button
                    key={t.counterpartId}
                    type="button"
                    onClick={() => setActiveCounterpartId(t.counterpartId)}
                    className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-[#151D2A] border-l-2 border-[#e53935]'
                        : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {t.isAdmin ? (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#e53935] to-[#b71c1c] flex items-center justify-center text-zinc-950 font-black text-sm shadow-md">
                          CS
                        </div>
                      ) : t.avatar ? (
                        <img
                          src={t.avatar}
                          alt={t.artistName}
                          className="h-10 w-10 rounded-full object-cover border border-zinc-700"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-[#e53935]">
                          {t.artistName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#07090D]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-white truncate">
                          {t.artistName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0">{t.time}</span>
                      </div>
                      <span className="text-[10px] text-[#e53935] font-mono block truncate">
                        {t.project}
                      </span>
                      <p className="text-xs text-zinc-400 truncate mt-1">
                        {t.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message View Area */}
          {activeThread ? (
            <div className="flex-1 flex flex-col bg-[#07090D] min-w-0">
              {/* Active Conversation Top Bar */}
              <div className="h-14 border-b border-zinc-800 px-5 flex items-center justify-between bg-[#0B0E17]">
                <div className="flex items-center gap-3 min-w-0">
                  {activeThread.isAdmin ? (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#e53935] to-[#b71c1c] flex items-center justify-center text-zinc-950 font-black text-xs shadow-md">
                      CS
                    </div>
                  ) : activeThread.avatar ? (
                    <img
                      src={activeThread.avatar}
                      alt={activeThread.artistName}
                      className="h-9 w-9 rounded-full object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-[#e53935]">
                      {activeThread.artistName.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white flex items-center gap-2 truncate">
                      {activeThread.artistName}
                      {activeThread.isAdmin && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#e53935] text-white uppercase">
                          Official
                        </span>
                      )}
                    </span>
                    {isPeerTyping ? (
                      <span className="text-[11px] text-[#e53935] font-medium animate-pulse flex items-center gap-1">
                        <span>Typing</span>
                        <span className="flex gap-0.5">
                          <span className="h-1 w-1 bg-[#e53935] rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-1 w-1 bg-[#e53935] rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-1 w-1 bg-[#e53935] rounded-full animate-bounce" />
                        </span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#e53935] block font-mono truncate">
                        {activeThread.artistHandle} &bull; {activeThread.project}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
                      isConnectedWs
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isConnectedWs ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="hidden sm:inline">{isConnectedWs ? 'WebSocket' : 'Connecting'}</span>
                  </div>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {activeThread.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
                    <Sparkles className="h-8 w-8 text-[#e53935]/40 mb-2" />
                    <p className="text-sm text-zinc-300 font-medium">Start conversation with {activeThread.artistName}</p>
                    <p className="text-zinc-500 text-xs mt-1 text-center max-w-sm">
                      Send questions regarding beat stems, custom licensing, contract terms, or share audio samples directly.
                    </p>
                  </div>
                ) : (
                  activeThread.messages.map((m) => {
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
                          className={`max-w-[75%] rounded-2xl p-4 shadow-md ${
                            isProducer
                              ? 'bg-gradient-to-br from-[#124b42] to-[#0c352f] text-white rounded-br-none border border-[#e53935]/30'
                              : 'bg-[#121620] text-zinc-200 rounded-bl-none border border-zinc-800'
                          }`}
                        >
                          {/* Message Author Header */}
                          <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-400 mb-1.5 font-medium">
                            <span>{isProducer ? 'You (Producer)' : activeThread.artistName}</span>
                            <span className="font-mono">{timeStr}</span>
                          </div>

                          {/* Text Content */}
                          {m.content && (
                            <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                              {m.content}
                            </p>
                          )}

                          {/* Media Attachment: Image */}
                          {m.media_type === 'image' && m.media_url && (
                            <div className="mt-2.5 rounded-lg overflow-hidden border border-zinc-700/60 bg-black/40">
                              <img
                                src={m.media_url}
                                alt={m.media_name || 'Chat image'}
                                onClick={() => setLightboxImageUrl(m.media_url || null)}
                                className="max-h-64 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              />
                              <div className="p-2 bg-black/60 flex items-center justify-between text-[11px] text-zinc-300">
                                <span className="truncate max-w-[180px]">
                                  {m.media_name || 'Image Attachment'}
                                </span>
                                <a
                                  href={m.media_url}
                                  download={m.media_name || 'image.jpg'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#e53935] hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <Download className="h-3 w-3" /> Save
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Media Attachment: Audio */}
                          {m.media_type === 'audio' && m.media_url && (
                            <div className="mt-2.5 p-3 rounded-xl bg-black/50 border border-zinc-700/60 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleAudio(m.media_url!)}
                                className="h-10 w-10 rounded-full bg-[#e53935] text-[#042f2e] flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0 shadow-md"
                              >
                                {playingAudioUrl === m.media_url ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4 fill-current ml-0.5" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="font-semibold text-white truncate max-w-[160px]">
                                    {m.media_name || 'Audio Track / Voice Message'}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#e53935]">
                                    {playingAudioUrl === m.media_url
                                      ? `${Math.floor(audioCurrentTime)}s / ${Math.floor(audioDuration)}s`
                                      : m.media_size ? `${Math.round(m.media_size / 1024 / 1024 * 10) / 10} MB` : 'Audio'}
                                  </span>
                                </div>

                                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#e53935] transition-all"
                                    style={{
                                      width:
                                        playingAudioUrl === m.media_url && audioDuration > 0
                                          ? `${(audioCurrentTime / audioDuration) * 100}%`
                                          : '0%'
                                    }}
                                  />
                                </div>
                              </div>

                              <a
                                href={m.media_url}
                                download={m.media_name || 'audio-track.wav'}
                                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                                title="Download audio file"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Staged File Preview Bar */}
              {stagedFile && (
                <div className="px-5 py-2.5 bg-[#0B0E17] border-t border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {stagedFileType === 'image' && stagedPreviewUrl ? (
                      <img
                        src={stagedPreviewUrl}
                        alt="Preview"
                        className="h-12 w-12 rounded object-cover border border-zinc-700"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#e53935]">
                        <Music className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-white truncate max-w-xs">{stagedFile.name}</p>
                      <p className="text-[10px] text-zinc-400">
                        {Math.round(stagedFile.size / 1024 / 1024 * 10) / 10} MB &bull; {stagedFileType === 'image' ? 'Image attachment' : 'Audio track/voice note'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveStagedFile}
                    className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
                    title="Remove attachment"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Send Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 border-t border-zinc-800 bg-[#090C12] flex items-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/*,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/x-m4a,audio/flac,audio/ogg,audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  title="Attach images, screenshots, audio stems, or voice notes"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  className="p-2.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder={`Message ${activeThread.artistName}...`}
                  disabled={sending}
                  className="flex-1 bg-[#121620] border border-zinc-800 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#e53935]"
                />

                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !stagedFile) || sending}
                  className="px-4 py-2.5 rounded-xl bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{uploadingMedia ? 'Uploading...' : 'Sending...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="h-3.5 w-3.5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      )}

      {/* Lightbox for Image Preview */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setLightboxImageUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-zinc-300"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={lightboxImageUrl}
              alt="Expanded preview"
              className="max-h-[85vh] max-w-full rounded-lg object-contain border border-zinc-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </CreatorShell>
  );
}
