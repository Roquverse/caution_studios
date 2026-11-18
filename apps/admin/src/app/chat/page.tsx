'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { supabase } from '../../lib/supabaseClient';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  Music,
  Play,
  Pause,
  Download,
  X,
  User,
  CheckCheck,
  Loader2,
  Sparkles,
  ExternalLink,
  Plus,
  RefreshCw,
  Sliders
} from 'lucide-react';

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
  read_at?: string;
}

interface ProducerThread {
  producerId: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export default function AdminProducerChatPage() {
  const [loading, setLoading] = useState(true);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ProducerThread[]>([]);
  const [activeProducerId, setActiveProducerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Staged Media Attachment for current message
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  const [stagedFileType, setStagedFileType] = useState<'image' | 'audio' | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Playback in Chat
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Lightbox for image preview
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // New Chat Modal state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [allProducers, setAllProducers] = useState<any[]>([]);
  const [loadingProducers, setLoadingProducers] = useState(false);
  const [producerSearch, setProducerSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch admin session and existing chat threads
  const loadChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAdminUserId(user.id);
      }

      // Fetch all chat messages
      const { data: chatsData, error: chatsErr } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: true });

      if (chatsErr) {
        console.error('Error fetching admin chats:', chatsErr);
        setLoading(false);
        return;
      }

      if (!chatsData || chatsData.length === 0) {
        setThreads([]);
        setLoading(false);
        return;
      }

      // Determine participants (all user IDs involved in chats)
      const participantIds = new Set<string>();
      chatsData.forEach((c) => {
        if (c.sender_id) participantIds.add(c.sender_id);
        if (c.recipient_id) participantIds.add(c.recipient_id);
      });

      // Fetch profiles of all participants
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, handle, avatar_url, role, primary_role')
        .in('id', Array.from(participantIds));

      const profileMap = new Map<string, any>();
      (profilesData || []).forEach((p) => profileMap.set(p.id, p));

      // Current admin ID
      const curAdminId = user?.id;

      // Group chats by producer counterpart
      const threadMap = new Map<string, ChatMessage[]>();
      chatsData.forEach((msg: ChatMessage) => {
        // Counterpart is the other person (or whichever person is not this admin)
        const counterpartId = msg.sender_id === curAdminId ? msg.recipient_id : msg.sender_id;
        if (!counterpartId) return;

        if (!threadMap.has(counterpartId)) {
          threadMap.set(counterpartId, []);
        }
        threadMap.get(counterpartId)!.push(msg);
      });

      const builtThreads: ProducerThread[] = [];
      threadMap.forEach((msgs, pId) => {
        const prof = profileMap.get(pId);
        const lastMsg = msgs[msgs.length - 1];
        const date = new Date(lastMsg.created_at);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let previewText = lastMsg.content || '';
        if (lastMsg.media_type === 'image') previewText = '📷 [Image attachment]';
        else if (lastMsg.media_type === 'audio') previewText = '🎵 [Audio voice message]';

        builtThreads.push({
          producerId: pId,
          displayName: prof?.display_name || prof?.handle || 'Producer',
          handle: prof?.handle ? `@${prof.handle}` : '@creator',
          avatarUrl: prof?.avatar_url || '',
          lastMessage: previewText,
          lastMessageTime: timeStr,
          unreadCount: 0,
          messages: msgs
        });
      });

      // Sort by newest message
      builtThreads.sort((a, b) => {
        const timeA = new Date(a.messages[a.messages.length - 1].created_at).getTime();
        const timeB = new Date(b.messages[b.messages.length - 1].created_at).getTime();
        return timeB - timeA;
      });

      setThreads(builtThreads);
      if (builtThreads.length > 0 && !activeProducerId) {
        setActiveProducerId(builtThreads[0].producerId);
      }
    } catch (err) {
      console.error('Error loading admin chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();

    // Subscribe to new chat inserts in real time
    const channel = supabase
      .channel('admin_chats_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, () => {
        loadChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeProducerId, threads]);

  const activeThread = threads.find((t) => t.producerId === activeProducerId) || threads[0];

  // Fetch list of registered producers for starting a new chat
  const handleOpenNewChat = async () => {
    setIsNewChatOpen(true);
    setLoadingProducers(true);
    try {
      const { data: producers } = await supabase
        .from('profiles')
        .select('id, display_name, handle, avatar_url, role, primary_role')
        .order('created_at', { ascending: false })
        .limit(50);

      setAllProducers(producers || []);
    } catch (e) {
      console.error('Error fetching producers list:', e);
    } finally {
      setLoadingProducers(false);
    }
  };

  const handleStartChatWithProducer = (producer: any) => {
    setIsNewChatOpen(false);
    const existing = threads.find((t) => t.producerId === producer.id);
    if (existing) {
      setActiveProducerId(producer.id);
    } else {
      const newThread: ProducerThread = {
        producerId: producer.id,
        displayName: producer.display_name || producer.handle || 'Producer',
        handle: producer.handle ? `@${producer.handle}` : '@creator',
        avatarUrl: producer.avatar_url || '',
        lastMessage: 'Conversation started',
        lastMessageTime: 'Just now',
        unreadCount: 0,
        messages: []
      };
      setThreads([newThread, ...threads]);
      setActiveProducerId(producer.id);
    }
  };

  // Handle media selection (Image or Audio)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const isAud = file.type.startsWith('audio/') || file.name.endsWith('.wav') || file.name.endsWith('.mp3');

    if (!isImg && !isAud) {
      alert('Only image files (PNG, JPG, WEBP) and audio files (WAV, MP3) are supported.');
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

  // Send message with optional media
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !stagedFile) || sending || !activeThread) return;

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

      // 2. Identify sender ID
      let senderId = adminUserId;
      if (!senderId) {
        const { data: { user } } = await supabase.auth.getUser();
        senderId = user?.id || '64d47dcb-3d1f-41dd-8400-46f39c5b0750';
      }

      // 3. Insert into chats table
      const { error: insertErr } = await supabase.from('chats').insert({
        sender_id: senderId,
        recipient_id: activeThread.producerId,
        content: newMessage.trim(),
        media_url: mediaUrl,
        media_key: mediaKey,
        media_type: mediaType,
        media_name: mediaName,
        media_size: mediaSize,
        is_encrypted: false,
        has_contact_info: false
      });

      if (insertErr) throw insertErr;

      // Clean up input
      setNewMessage('');
      handleRemoveStagedFile();
      await loadChats();
    } catch (err: any) {
      console.error('Error sending admin message:', err);
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
      setUploadingMedia(false);
    }
  };

  // Audio Playback controls
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

  const filteredThreads = threads.filter(
    (t) =>
      t.displayName.toLowerCase().includes(search.toLowerCase()) ||
      t.handle.toLowerCase().includes(search.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell activePath="/chat">
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

      {/* Main Chat Layout Container */}
      <div className="h-[calc(100vh-120px)] flex flex-col bg-[#07090D] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-[#090C12]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 text-[#2dd4bf]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                Producer Direct Messages & Support
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live R2 Media
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Direct messaging with verified creators, stems delivery reviews, and studio audio feedback
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNewChat}
              className="px-3 py-1.5 rounded-lg bg-[#2dd4bf] text-[#042f2e] text-xs font-bold hover:bg-[#2dd4bf]/90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Conversation</span>
            </button>
            <button
              type="button"
              onClick={loadChats}
              className="p-2 rounded-lg bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
              title="Refresh messages"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content Columns: Left (Threads) + Right (Active Thread) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Producers Threads List */}
          <div className="w-80 sm:w-88 border-r border-zinc-800 bg-[#0A0D14] flex flex-col">
            {/* Search Input */}
            <div className="p-3 border-b border-zinc-800/80">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search producers or messages..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
              {loading ? (
                <div className="p-8 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#2dd4bf]" />
                  <span>Loading conversations...</span>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  <p>No producer chats found</p>
                  <button
                    type="button"
                    onClick={handleOpenNewChat}
                    className="mt-3 text-[#2dd4bf] hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" /> Start a chat with a producer
                  </button>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = activeThread?.producerId === thread.producerId;
                  return (
                    <button
                      key={thread.producerId}
                      type="button"
                      onClick={() => setActiveProducerId(thread.producerId)}
                      className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                        isActive ? 'bg-[#151D2A] border-l-2 border-[#2dd4bf]' : 'hover:bg-zinc-900/60'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {thread.avatarUrl ? (
                          <img
                            src={thread.avatarUrl}
                            alt={thread.displayName}
                            className="h-10 w-10 rounded-full object-cover border border-zinc-700"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 font-bold text-sm">
                            {thread.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0A0D14]" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-semibold text-xs text-white truncate">
                            {thread.displayName}
                          </span>
                          <span className="text-[10px] text-zinc-500 flex-shrink-0">
                            {thread.lastMessageTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono truncate">{thread.handle}</p>
                        <p className="text-[11px] text-zinc-400 truncate mt-1">
                          {thread.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Chat Thread Area */}
          <div className="flex-1 flex flex-col bg-[#07090D]">
            {activeThread ? (
              <>
                {/* Active Thread Header */}
                <div className="px-6 py-3 border-b border-zinc-800 bg-[#0B0E17] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activeThread.avatarUrl ? (
                      <img
                        src={activeThread.avatarUrl}
                        alt={activeThread.displayName}
                        className="h-9 w-9 rounded-full object-cover border border-zinc-700"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-xs">
                        {activeThread.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        {activeThread.displayName}
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2dd4bf]/10 text-[#2dd4bf] border border-[#2dd4bf]/20">
                          Producer
                        </span>
                      </h2>
                      <p className="text-xs text-zinc-400 font-mono">{activeThread.handle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={`/tracks?search=${encodeURIComponent(activeThread.displayName)}`}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                      title="View producer beats catalog"
                    >
                      <Music className="h-3.5 w-3.5 text-[#2dd4bf]" />
                      <span>View Beats</span>
                    </a>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {activeThread.messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
                      <Sparkles className="h-8 w-8 text-[#2dd4bf]/40 mb-2" />
                      <p className="text-sm text-zinc-300 font-medium">Start conversation with {activeThread.displayName}</p>
                      <p className="text-zinc-500 text-xs mt-1">
                        Send text messages, preview beats, or share stems and cover artwork directly.
                      </p>
                    </div>
                  ) : (
                    activeThread.messages.map((msg) => {
                      const isAdminMsg = msg.sender_id === adminUserId || (!adminUserId && msg.sender_id !== activeThread.producerId);
                      const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl p-4 shadow-md ${
                              isAdminMsg
                                ? 'bg-gradient-to-br from-[#124b42] to-[#0c352f] text-white rounded-br-none border border-[#2dd4bf]/30'
                                : 'bg-[#121620] text-zinc-200 rounded-bl-none border border-zinc-800'
                            }`}
                          >
                            {/* Message Author Header */}
                            <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-400 mb-1.5 font-medium">
                              <span>{isAdminMsg ? 'Executive Admin' : activeThread.displayName}</span>
                              <span className="font-mono">{timeStr}</span>
                            </div>

                            {/* Text Content */}
                            {msg.content && (
                              <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                                {msg.content}
                              </p>
                            )}

                            {/* Media Attachment: Image */}
                            {msg.media_type === 'image' && msg.media_url && (
                              <div className="mt-2.5 rounded-lg overflow-hidden border border-zinc-700/60 bg-black/40">
                                <img
                                  src={msg.media_url}
                                  alt={msg.media_name || 'Chat image'}
                                  onClick={() => setLightboxImageUrl(msg.media_url || null)}
                                  className="max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                />
                                <div className="p-2 bg-black/60 flex items-center justify-between text-[11px] text-zinc-300">
                                  <span className="truncate max-w-[200px]">
                                    {msg.media_name || 'Image Attachment'}
                                  </span>
                                  <a
                                    href={msg.media_url}
                                    download={msg.media_name || 'image.jpg'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#2dd4bf] hover:underline flex items-center gap-1 font-semibold"
                                  >
                                    <Download className="h-3 w-3" /> Save
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Media Attachment: Audio */}
                            {msg.media_type === 'audio' && msg.media_url && (
                              <div className="mt-2.5 p-3 rounded-xl bg-black/50 border border-zinc-700/60 flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAudio(msg.media_url!)}
                                  className="h-10 w-10 rounded-full bg-[#2dd4bf] text-[#042f2e] flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0 shadow-md"
                                >
                                  {playingAudioUrl === msg.media_url ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4 fill-current ml-0.5" />
                                  )}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-semibold text-white truncate max-w-[180px]">
                                      {msg.media_name || 'Audio Track / Voice Message'}
                                    </span>
                                    <span className="text-[10px] font-mono text-[#2dd4bf]">
                                      {playingAudioUrl === msg.media_url
                                        ? `${Math.floor(audioCurrentTime)}s / ${Math.floor(audioDuration)}s`
                                        : msg.media_size ? `${Math.round(msg.media_size / 1024 / 1024 * 10) / 10} MB` : 'Audio'}
                                    </span>
                                  </div>

                                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#2dd4bf] transition-all"
                                      style={{
                                        width:
                                          playingAudioUrl === msg.media_url && audioDuration > 0
                                            ? `${(audioCurrentTime / audioDuration) * 100}%`
                                            : '0%'
                                      }}
                                    />
                                  </div>
                                </div>

                                <a
                                  href={msg.media_url}
                                  download={msg.media_name || 'audio-track.wav'}
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
                  <div className="px-6 py-2.5 bg-[#0B0E17] border-t border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {stagedFileType === 'image' && stagedPreviewUrl ? (
                        <img
                          src={stagedPreviewUrl}
                          alt="Preview"
                          className="h-12 w-12 rounded object-cover border border-zinc-700"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#2dd4bf]">
                          <Music className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-white truncate max-w-xs">{stagedFile.name}</p>
                        <p className="text-[10px] text-zinc-400">
                          {Math.round(stagedFile.size / 1024 / 1024 * 10) / 10} MB &bull; {stagedFileType === 'image' ? 'Image file' : 'Audio file'}
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

                {/* Bottom Input Area */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 bg-[#090C12] border-t border-zinc-800 flex items-center gap-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,audio/*,.wav,.mp3"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center justify-center disabled:opacity-50"
                    title="Attach image or audio file"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${activeThread.displayName}...`}
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-[#121620] border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#2dd4bf]"
                  />

                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !stagedFile) || sending}
                    className="px-4 py-2.5 rounded-xl bg-[#2dd4bf] text-[#042f2e] text-xs sm:text-sm font-bold hover:bg-[#2dd4bf]/90 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{uploadingMedia ? 'Uploading...' : 'Sending...'}</span>
                      </>
                    ) : (
                      <>
                        <span>Send</span>
                        <Send className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
                <MessageSquare className="h-10 w-10 text-zinc-700 mb-3" />
                <p className="text-base text-zinc-300 font-semibold">Select a conversation</p>
                <p className="text-zinc-500 text-xs mt-1">Choose a producer from the left to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Images */}
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

      {/* New Conversation Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C0F17] border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#2dd4bf]" />
                Start Chat with Producer
              </h3>
              <button
                type="button"
                onClick={() => setIsNewChatOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={producerSearch}
                onChange={(e) => setProducerSearch(e.target.value)}
                placeholder="Search by name or handle..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#2dd4bf]"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 pr-1">
              {loadingProducers ? (
                <div className="p-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#2dd4bf]" />
                  <span>Loading producers list...</span>
                </div>
              ) : allProducers.length === 0 ? (
                <p className="p-6 text-center text-zinc-500 text-xs">No producers found</p>
              ) : (
                allProducers
                  .filter(
                    (p) =>
                      (p.display_name || '').toLowerCase().includes(producerSearch.toLowerCase()) ||
                      (p.handle || '').toLowerCase().includes(producerSearch.toLowerCase())
                  )
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleStartChatWithProducer(p)}
                      className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-zinc-900/80 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={p.display_name}
                            className="h-8 w-8 rounded-full object-cover border border-zinc-700"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-xs font-bold">
                            {(p.display_name || p.handle || 'P').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-white">{p.display_name || p.handle || 'Producer'}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">@{p.handle || 'creator'}</p>
                        </div>
                      </div>

                      <span className="text-[10px] text-[#2dd4bf] font-bold">Message &rarr;</span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

