'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Cast,
  Activity,
  ListMusic,
  Heart,
  Clock,
  Calendar,
  Play,
  Pause,
  MoreVertical,
  ChevronRight,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  ListOrdered,
  X,
  Sparkles,
  Check,
  Download,
  Star,
  Menu,
  ShoppingBag,
  Mic
} from 'lucide-react';
import { audioSynth } from '@caution/ui';
import { UserDropdown } from '../components/UserDropdown';
import { UserAdModal } from '../components/UserAdModal';
import { UserMarketplaceView } from '../components/UserMarketplaceView';
import { UserSoundstageModal } from '../components/UserSoundstageModal';
import { useUserSubscription, FREE_PREVIEW_LIMIT_SECONDS } from '../lib/subscription';
import { supabase } from '../lib/supabaseClient';
import {
  useDailyDownloadQuota,
  recordBeatDownload,
  getDailyDownloadState
} from '../lib/downloadQuota';

import {
  TrackItem,
  ProducerItem,
  HistoryItem,
  FALLBACK_BEATS,
  FALLBACK_PRODUCERS
} from '../types/tracks';

export type { TrackItem, ProducerItem, HistoryItem };
export { FALLBACK_BEATS, FALLBACK_PRODUCERS };

interface UserPortalClientProps {
  initialBeats: TrackItem[];
  initialProducers: ProducerItem[];
}

export function UserPortalClient({ initialBeats, initialProducers }: UserPortalClientProps) {
  const { isSubscribed } = useUserSubscription();
  const effectiveBeats = initialBeats && initialBeats.length > 0 ? initialBeats : FALLBACK_BEATS;
  const effectiveProducers = initialProducers && initialProducers.length > 0 ? initialProducers : FALLBACK_PRODUCERS;

  const [activeNav, setActiveNav] = useState('feed');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlists, setPlaylists] = useState([
    { name: 'Afrobeat & Groove', color: '#2dd4bf' },
    { name: 'Electronic & Synth', color: '#10B981' },
    { name: 'Cinematic & Scoring', color: '#F59E0B' },
    { name: 'Studio Vault Stems', color: '#8B5CF6' }
  ]);

  // Clean initial state - NO dummy IDs to prevent flash of fake counts
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);
  const [listenLaterIds, setListenLaterIds] = useState<string[]>([]);
  const [listeningHistory, setListeningHistory] = useState<HistoryItem[]>([]);

  // Current track initialized directly to the real first database track
  const [currentTrack, setCurrentTrack] = useState<TrackItem>(effectiveBeats[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const [likesCount, setLikesCount] = useState(0);
  const [streamsCount, setStreamsCount] = useState(0);
  const [songsPlayedCount, setSongsPlayedCount] = useState(0);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isDownloadLimitModalOpen, setIsDownloadLimitModalOpen] = useState(false);
  const [rewardNotification, setRewardNotification] = useState<string | null>(null);
  const downloadQuota = useDailyDownloadQuota();
  const [isSoundstageOpen, setIsSoundstageOpen] = useState(false);
  const [soundstageTrack, setSoundstageTrack] = useState<TrackItem | null>(null);

  const handleOpenSoundstage = (track?: TrackItem) => {
    if (audioRef.current) audioRef.current.pause();
    audioSynth.stop();
    setIsPlaying(false);
    if (track) setSoundstageTrack(track);
    else if (currentTrack) setSoundstageTrack(currentTrack);
    setIsSoundstageOpen(true);
  };

  // Table beats seeded from real database beats
  const [playlistRows, setPlaylistRows] = useState<TrackItem[]>(effectiveBeats);
  const [newReleases, setNewReleases] = useState<TrackItem[]>(effectiveBeats.slice(0, 4));
  const [producers, setProducers] = useState<ProducerItem[]>(effectiveProducers);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeListenSessionRef = useRef<string | null>(null);
  const hasTriggeredUpgradeModalRef = useRef(false);

  const handleCloseUpgradeModal = () => {
    setShowUpgradeModal(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentTime(0);
    setIsPlaying(false);
    audioSynth.stop();
  };

  // Allow closing upgrade modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showUpgradeModal) {
        handleCloseUpgradeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUpgradeModal]);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Handle URL navigation tab parameter (e.g. ?tab=marketplace or ?tab=beats)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'marketplace' || tab === 'beats') {
        setActiveNav('marketplace');
      } else if (tab === 'playlists' || tab === 'fav' || tab === 'later' || tab === 'history') {
        setActiveNav(tab);
      }
    }
  }, []);

  // Load billing invoices
  useEffect(() => {
    async function loadInvoices() {
      try {
        setLoadingInvoices(true);
        const res = await fetch('/api/billing');
        if (res.ok) {
          const data = await res.json();
          if (data.invoices) setInvoices(data.invoices);
        }
      } catch (err) {
        console.warn('Could not load billing invoices:', err);
      } finally {
        setLoadingInvoices(false);
      }
    }
    loadInvoices();
  }, []);

  // Audio timer fallback for synthesizers or audio events
  useEffect(() => {
    let interval: any;
    if (isPlaying && (!currentTrack.audioUrl || !audioRef.current)) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const limit = isSubscribed ? currentTrack.durationSeconds : Math.min(FREE_PREVIEW_LIMIT_SECONDS, currentTrack.durationSeconds);
          if (prev >= limit) {
            audioSynth.stop();
            setIsPlaying(false);
            if (!isSubscribed && !hasTriggeredUpgradeModalRef.current) {
              hasTriggeredUpgradeModalRef.current = true;
              setShowUpgradeModal(true);
            }
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.durationSeconds, isSubscribed, currentTrack.audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Load user saved local preferences on mount
  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem('caution_favorites');
      if (savedLikes) {
        const parsed = JSON.parse(savedLikes);
        if (Array.isArray(parsed)) {
          setLikedTrackIds(parsed);
          setLikesCount(parsed.length);
        }
      }
      const savedLater = localStorage.getItem('caution_listen_later');
      if (savedLater) {
        const parsed = JSON.parse(savedLater);
        if (Array.isArray(parsed)) setListenLaterIds(parsed);
      }
      const savedHist = localStorage.getItem('caution_listening_history');
      if (savedHist) {
        const parsed = JSON.parse(savedHist);
        if (Array.isArray(parsed) && parsed.length > 0) setListeningHistory(parsed);
      }
      const savedCounts = localStorage.getItem('caution_beat_play_counts');
      if (savedCounts) {
        const parsed = JSON.parse(savedCounts);
        if (parsed && typeof parsed === 'object') {
          setPlaylistRows((prev) =>
            prev.map((t) => (parsed[t.id] !== undefined ? { ...t, playCount: Math.max(t.playCount || 0, parsed[t.id]) } : t))
          );
          setNewReleases((prev) =>
            prev.map((t) => (parsed[t.id] !== undefined ? { ...t, playCount: Math.max(t.playCount || 0, parsed[t.id]) } : t))
          );
          setCurrentTrack((prev) => (parsed[prev.id] !== undefined ? { ...prev, playCount: Math.max(prev.playCount || 0, parsed[prev.id]) } : prev));
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
  }, []);

  // Background refresh to catch any newly created beats seamlessly without flashing
  useEffect(() => {
    async function refreshDatabaseBeats() {
      try {
        const { data: dbBeats, error } = await supabase
          .from('beats')
          .select(`
            *,
            producer:producer_id (
              id,
              display_name,
              handle,
              avatar_url
            ),
            licenses:beat_licenses (
              type,
              price_cents,
              enabled
            )
          `)
          .eq('status', 'live')
          .order('created_at', { ascending: false });

        if (dbBeats && dbBeats.length > 0) {
          const savedCounts = localStorage.getItem('caution_beat_play_counts');
          const localCounts: Record<string, number> = savedCounts ? JSON.parse(savedCounts) : {};

          const mapped: TrackItem[] = dbBeats.map((b) => {
            const audioKey = b.master_wav_key || b.preview_clean_key || b.preview_tagged_key;
            let audioUrl = '';
            if (audioKey) {
              audioUrl = audioKey.startsWith('http') || audioKey.startsWith('/') ? audioKey : `/api/media/${audioKey}`;
            } else {
              audioUrl = '/api/media/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3';
            }
            const basicLic = b.licenses?.find((l: any) => l.type === 'basic');
            const priceNgn = basicLic?.price_cents ? basicLic.price_cents / 100 : 3000;
            const durationSec = b.duration_seconds || 180;
            const mins = Math.floor(durationSec / 60);
            const secs = Math.floor(durationSec % 60);
            const dbPlays = b.play_count || 0;
            const localStored = localCounts[b.id];
            const playCount = localStored !== undefined ? Math.max(dbPlays, localStored) : dbPlays;

            return {
              id: b.id,
              title: b.title,
              artist: b.producer?.display_name || 'Caution Studio',
              subscribers: '@' + (b.producer?.handle || 'caution'),
              tracksCount: `${b.bpm || 120} BPM • ${b.genre || 'Beat'}`,
              date: new Date(b.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
              duration: `${mins}:${secs.toString().padStart(2, '0')}`,
              durationSeconds: durationSec,
              coverUrl: b.cover_url || '/images/album_neon_dj.jpg',
              category: 'playlists',
              audioUrl,
              bpm: b.bpm || 120,
              genre: b.genre || 'Electronic',
              musicalKey: b.musical_key || 'C Minor',
              priceNgn,
              playCount
            };
          });

          setPlaylistRows(mapped);
          setNewReleases(mapped.slice(0, 4));

          // If user has not started playback, synchronize currentTrack to the real database track
          setCurrentTrack((prev) => {
            const matching = mapped.find((m) => m.id === prev.id);
            return matching || mapped[0] || prev;
          });

          // Also refresh verified producers (only producers)
          const { data: dbProfiles } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

          if (dbProfiles && dbProfiles.length > 0) {
            const beatProducerIds = new Set((dbBeats || []).map((b: any) => b.producer_id).filter(Boolean));
            const producerProfiles = dbProfiles.filter((p: any) => {
              const roles: string[] = Array.isArray(p.roles) ? p.roles : [];
              const isExplicitProducer = roles.includes('producer');
              const isAdminAccount =
                p.handle?.toLowerCase().includes('admin') ||
                p.display_name?.toLowerCase().includes('studio admin') ||
                p.display_name?.toLowerCase().includes('master admin');
              const hasUploadedBeats = beatProducerIds.has(p.id);

              return (isExplicitProducer && !isAdminAccount) || hasUploadedBeats;
            });

            if (producerProfiles.length > 0) {
              setProducers(
                producerProfiles.map((p, idx) => ({
                  rank: idx + 1,
                  name: p.display_name || p.handle || 'Caution Producer',
                  subscribers: `@${p.handle || 'caution'} • Verified Producer`,
                  coverUrl: p.avatar_url || '/images/artist_studio_mic.jpg',
                  handle: p.handle || 'caution'
                }))
              );
            }
          }
        }
      } catch (err) {
        console.warn('Could not refresh database beats:', err);
      }
    }
    refreshDatabaseBeats();
  }, []);

  const recordListeningHistory = (track: TrackItem) => {
    setListeningHistory((prev) => {
      const filtered = prev.filter((item) => item.track.id !== track.id);
      const newEntry: HistoryItem = {
        track,
        listenedAt: 'Just now',
        timestamp: Date.now()
      };
      const updated = [newEntry, ...filtered].slice(0, 50);
      try {
        localStorage.setItem('caution_listening_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const recordTrackListen = (track: TrackItem) => {
    if (!track || !track.id) return;

    // 1. Update in React states immediately
    const updatePlayCount = (item: TrackItem): TrackItem => {
      if (item.id === track.id) {
        return { ...item, playCount: (item.playCount || 0) + 1 };
      }
      return item;
    };

    setPlaylistRows((prev) => prev.map(updatePlayCount));
    setNewReleases((prev) => prev.map(updatePlayCount));
    setCurrentTrack((prev) => (prev.id === track.id ? { ...prev, playCount: (prev.playCount || 0) + 1 } : prev));
    setStreamsCount((prev) => prev + 1);

    // 2. Persist to localStorage so the counter is permanently preserved across reloads
    try {
      const stored = localStorage.getItem('caution_beat_play_counts');
      const counts: Record<string, number> = stored ? JSON.parse(stored) : {};
      const newCount = (counts[track.id] ?? track.playCount ?? 0) + 1;
      counts[track.id] = newCount;
      localStorage.setItem('caution_beat_play_counts', JSON.stringify(counts));
    } catch (e) {
      console.warn('Could not save play count to localStorage:', e);
    }

    // 3. Persist to backend database asynchronously
    fetch('/api/beats/listen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beatId: track.id })
    }).catch((err) => {
      console.warn('Could not sync play count to backend:', err);
    });
  };

  const handlePlayToggle = (track: TrackItem) => {
    // 1. Immediately stop any active synth
    audioSynth.stop();

    if (currentTrack.id === track.id) {
      if (isPlaying) {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (!isSubscribed && currentTime >= FREE_PREVIEW_LIMIT_SECONDS) {
          setCurrentTime(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }
        setIsPlaying(true);
        hasTriggeredUpgradeModalRef.current = false;
        recordListeningHistory(track);

        // Record play count if this is a new listening audition session
        if (activeListenSessionRef.current !== track.id) {
          activeListenSessionRef.current = track.id;
          recordTrackListen(track);
        }

        if (track.audioUrl && audioRef.current) {
          if (audioRef.current.src !== track.audioUrl && !audioRef.current.src.endsWith(track.audioUrl)) {
            audioRef.current.src = track.audioUrl;
          }
          audioRef.current.volume = isMuted ? 0 : volume;
          audioRef.current.play().catch((err) => {
            if (err.name !== 'AbortError') {
              console.warn('Audio playback error:', err);
              audioSynth.playTrack(track.id, () => {}, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
            }
          });
        } else {
          audioSynth.playTrack(track.id, () => {}, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
        }
      }
    } else {
      // 2. Switching to a completely different track: Stop previous audio immediately
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioSynth.stop();

      // Check 3-song unskippable audio ad threshold (Audiomack / Spotify model)
      const nextCount = songsPlayedCount + 1;
      setSongsPlayedCount(nextCount);
      if (!isSubscribed && nextCount > 0 && nextCount % 3 === 0) {
        setIsAdModalOpen(true);
      }

      setCurrentTrack(track);
      setIsPlaying(true);
      hasTriggeredUpgradeModalRef.current = false;
      setCurrentTime(0);
      recordListeningHistory(track);

      // Record play count for this newly started song
      activeListenSessionRef.current = track.id;
      recordTrackListen(track);

      if (audioRef.current) {
        if (track.audioUrl) {
          audioRef.current.src = track.audioUrl;
          audioRef.current.currentTime = 0;
          audioRef.current.volume = isMuted ? 0 : volume;
          audioRef.current.play().catch((err) => {
            if (err.name !== 'AbortError') {
              console.warn('Audio playback error:', err);
              audioSynth.playTrack(track.id, () => {}, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
            }
          });
        } else {
          audioRef.current.pause();
          audioSynth.playTrack(track.id, () => {}, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
        }
      } else if (!track.audioUrl) {
        audioSynth.playTrack(track.id, () => {}, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
      }
    }
  };

  const toggleLike = (id: string) => {
    setLikedTrackIds((prev) => {
      const isAlready = prev.includes(id);
      const next = isAlready ? prev.filter((item) => item !== id) : [...prev, id];
      setLikesCount((c) => (isAlready ? Math.max(0, c - 1) : c + 1));
      try {
        localStorage.setItem('caution_favorites', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setPlaylistRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, isLiked: !row.isLiked } : row))
    );

    setNewReleases((prev) =>
      prev.map((row) => (row.id === id ? { ...row, isLiked: !row.isLiked } : row))
    );

    if (currentTrack.id === id) {
      setCurrentTrack((prev) => ({
        ...prev,
        isLiked: !prev.isLiked
      }));
    }
  };

  const toggleListenLater = (track: TrackItem) => {
    setListenLaterIds((prev) => {
      const isAlready = prev.includes(track.id);
      const next = isAlready ? prev.filter((item) => item !== track.id) : [...prev, track.id];
      try {
        localStorage.setItem('caution_listen_later', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setPlaylistRows((prev) =>
      prev.map((row) => (row.id === track.id ? { ...row, isListenLater: !row.isListenLater } : row))
    );
    setNewReleases((prev) =>
      prev.map((row) => (row.id === track.id ? { ...row, isListenLater: !row.isListenLater } : row))
    );
    if (currentTrack.id === track.id) {
      setCurrentTrack((prev) => ({ ...prev, isListenLater: !prev.isListenLater }));
    }
  };

  // Song download handler & toast feedback
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<{
    title: string;
    artist: string;
    remaining?: number;
    bonusUsed?: boolean;
  } | null>(null);

  const handleDownload = (track: TrackItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!track) return;

    // Check daily download allowance (base + ad bonus)
    const quotaState = getDailyDownloadState();
    if (!isSubscribed && !quotaState.canDownload) {
      setIsDownloadLimitModalOpen(true);
      return;
    }

    setDownloadingId(track.id);
    const newQuota = recordBeatDownload(track.id, track.title);
    setDownloadToast({
      title: track.title,
      artist: track.artist,
      remaining: newQuota.remaining,
      bonusUsed: quotaState.bonus > 0 && quotaState.used >= quotaState.baseLimit
    });

    try {
      const safeTitle = (track.title || 'track').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
      const safeArtist = (track.artist || 'Caution Studio').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
      const filename = `${safeTitle} - ${safeArtist}.wav`;

      let targetUrl = track.audioUrl;
      if (targetUrl) {
        const sep = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${sep}download=1&filename=${encodeURIComponent(filename)}`;
      } else {
        targetUrl = `/api/media/masters/${track.id}.wav?download=1&filename=${encodeURIComponent(filename)}`;
      }

      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download trigger error:', err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
      setTimeout(() => setDownloadToast(null), 4000);
    }
  };

  // Filtered collections
  const allKnownTracks = useMemo(() => {
    const map = new Map<string, TrackItem>();
    const all = [
      ...playlistRows,
      ...newReleases,
      ...listeningHistory.map((h) => h.track),
      currentTrack
    ];
    for (const t of all) {
      if (t && t.id && !map.has(t.id)) {
        map.set(t.id, t);
      }
    }
    return Array.from(map.values());
  }, [playlistRows, newReleases, listeningHistory, currentTrack]);

  const favoritesList = allKnownTracks.filter((t) => t.isLiked || likedTrackIds.includes(t.id));
  const listenLaterList = allKnownTracks.filter((t) => t.isListenLater || listenLaterIds.includes(t.id));

  // Top Most Listened Beats (sorted by play count descending)
  const mostListenedBeats = useMemo(() => {
    const tracks = [...allKnownTracks];
    return tracks.sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 5);
  }, [allKnownTracks]);

  // Top Rated Song - sorted by play count or first master beat
  const topRatedSong = useMemo(() => {
    if (!playlistRows || playlistRows.length === 0) return null;
    const sorted = [...playlistRows].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    return sorted[0];
  }, [playlistRows]);

  // Genres added by admin in genre section + any unique genres from database tracks
  const adminGenreList = useMemo(() => {
    // Standard genres configured in admin genre section
    const adminStandardGenres = [
      'All',
      'Afrobeats',
      'Cinematic',
      'Electronic',
      'Hip Hop',
      'R&B',
      'Funk',
      'Lofi',
      'Pop',
      'Rock'
    ];

    const dbTrackGenres = playlistRows
      .map((t) => t.genre)
      .filter((g): g is string => Boolean(g && g.trim()));

    const seen = new Set<string>();
    const result: string[] = [];

    seen.add('all');
    result.push('All');

    for (const g of [...dbTrackGenres, ...adminStandardGenres.slice(1)]) {
      const lower = g.trim().toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        const formatted = g.trim().charAt(0).toUpperCase() + g.trim().slice(1);
        result.push(formatted);
      }
    }

    return result;
  }, [playlistRows]);

  // Search and genre filtered rows
  const filteredRows = useMemo(() => {
    let rows = playlistRows;

    if (selectedGenre && selectedGenre !== 'All') {
      rows = rows.filter(
        (r) => r.genre && r.genre.trim().toLowerCase() === selectedGenre.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.artist.toLowerCase().includes(q) ||
          (r.genre && r.genre.toLowerCase().includes(q))
      );
    }

    return rows;
  }, [playlistRows, selectedGenre, searchQuery]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const colors = ['#EC4899', '#3B82F6', '#14B8A6', '#F97316'];
    const randomColor = colors[playlists.length % colors.length];
    setPlaylists([...playlists, { name: newPlaylistName.trim(), color: randomColor }]);
    setNewPlaylistName('');
    setShowCreatePlaylistModal(false);
  };

  const progressRatio = currentTrack.durationSeconds > 0 ? (currentTime / currentTrack.durationSeconds) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#08090B] text-white flex flex-col font-sans selection:bg-[#04564f] selection:text-white pb-24">
      {/* HTML5 Audio Element for Real Streaming from Cloudflare R2 & Database */}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => {
          audioSynth.stop();
        }}
        onPlaying={() => {
          audioSynth.stop();
        }}
        onTimeUpdate={(e) => {
          const sec = e.currentTarget.currentTime;
          const limit = isSubscribed
            ? currentTrack.durationSeconds
            : Math.min(FREE_PREVIEW_LIMIT_SECONDS, currentTrack.durationSeconds);

          // If track reaches 20 seconds and hasn't been counted for this session, store the count
          if (sec >= 20 && activeListenSessionRef.current !== currentTrack.id) {
            activeListenSessionRef.current = currentTrack.id;
            recordTrackListen(currentTrack);
          }

          if (sec >= limit) {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
            setCurrentTime(0);
            setIsPlaying(false);
            audioSynth.stop();
            if (!isSubscribed && !hasTriggeredUpgradeModalRef.current) {
              hasTriggeredUpgradeModalRef.current = true;
              setShowUpgradeModal(true);
            }
          } else {
            setCurrentTime(Math.floor(sec));
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          activeListenSessionRef.current = null;
        }}
        onError={(err) => {
          const target = err.currentTarget;
          if (target.error && target.error.code === 1) return; // Media aborted by user navigation
          console.warn('Real audio stream error:', err);
        }}
      />

      {/* 1. TOP HEADER - MOBILE RESPONSIVE */}
      <header className="h-16 border-b border-white/[0.06] bg-[#0A0B0E] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40">
        {/* Far Left: Brand Logo */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-7 sm:h-8 w-auto object-contain brightness-0 invert max-w-[130px] sm:max-w-[190px]"
            />
          </Link>
        </div>

        {/* Center: Search (Desktop Only) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative flex items-center w-full">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artists, songs or albums"
              className="w-full h-10 pl-10 pr-9 rounded-lg bg-[#141518] border border-white/[0.06] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-white"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Far Right: User Profile & Hamburger on Mobile, Plus Action Buttons on Desktop */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Desktop-only Action Buttons */}
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/20 hover:border-white/40 text-xs font-semibold text-white/90 transition-colors cursor-pointer"
          >
            <span>My channel</span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          </button>

          <button
            type="button"
            className="hidden md:flex p-2 text-gray-400 hover:text-white transition-colors"
            title="Airplay / Cast"
          >
            <Cast className="h-4 w-4" />
          </button>

          {/* Hamburger Menu Trigger (Mobile only) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
          </button>

          {/* User Profile Dropdown (Always visible on far right) */}
          <UserDropdown />
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 md:hidden bg-[#0A0B0E]/95 backdrop-blur-2xl border-b border-white/10 p-5 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Mobile Search */}
          <div className="relative flex items-center w-full mb-5">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artists, songs or albums"
              className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#141518] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-white"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Primary Nav */}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveNav('feed');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeNav === 'feed'
                    ? 'text-white bg-white/[0.08] font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Activity className={`h-4 w-4 ${activeNav === 'feed' ? 'text-[#2dd4bf]' : 'text-gray-400'}`} />
                <span className={activeNav === 'feed' ? 'text-[#2dd4bf]' : ''}>Feed</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveNav('playlists');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeNav === 'playlists'
                    ? 'text-white bg-white/[0.08] font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <ListMusic className="h-4 w-4 text-gray-400" />
                <span>Playlists</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveNav('marketplace');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeNav === 'marketplace'
                    ? 'text-[#E8B896] bg-[#E8B896]/10 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className={`h-4 w-4 ${activeNav === 'marketplace' ? 'text-[#E8B896]' : 'text-gray-400'}`} />
                  <span className={activeNav === 'marketplace' ? 'text-[#E8B896]' : ''}>Beat Store</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#E8B896]/20 text-[#E8B896] uppercase">
                  Store
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenSoundstage();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Mic className="h-4 w-4 text-teal-400" />
                  <span>Record Vocal (Studio)</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-300 uppercase">
                  Studio
                </span>
              </button>
            </nav>

            {/* YOUR MUSIC */}
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 px-3.5 mb-2">
                YOUR MUSIC
              </p>
              <div className="space-y-1">
                {[
                  { id: 'fav', label: 'Favourites', icon: Heart, count: favoritesList.length, activeColor: 'text-red-500' },
                  { id: 'later', label: 'Listen Later', icon: Clock, count: listenLaterList.length, activeColor: 'text-[#2dd4bf]' },
                  { id: 'history', label: 'History', icon: Calendar, count: listeningHistory.length, activeColor: 'text-[#2dd4bf]' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={'mobile-' + item.id}
                      type="button"
                      onClick={() => {
                        setActiveNav(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isActive ? 'text-white bg-white/[0.08] font-bold' : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? item.activeColor : 'text-gray-400'}`} />
                        <span className={isActive ? 'font-semibold text-white' : ''}>{item.label}</span>
                      </div>
                      {item.count > 0 && (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-white/10 text-white' : 'text-gray-500'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Actions: Channel & Upgrade */}
            <div className="pt-4 border-t border-white/[0.06] space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#04564f]/30 border border-[#2dd4bf]/20 text-xs font-bold text-[#2dd4bf] hover:bg-[#04564f]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>My Channel & Clearances</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <Link
                href="/subscriptions"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-gray-300 hover:text-white transition-colors"
              >
                <span>Subscription Plans</span>
                <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. BODY CONTENT (3-COLUMN SPLIT) */}
      <div className="flex-1 flex w-full">
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-64 border-r border-white/[0.06] bg-[#0A0B0E] p-5 shrink-0 hidden md:flex flex-col justify-between">
          <div className="space-y-6">
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveNav('feed')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeNav === 'feed'
                    ? 'text-white bg-white/[0.04]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Activity className={`h-4 w-4 ${activeNav === 'feed' ? 'text-[#2dd4bf]' : 'text-gray-400'}`} />
                <span className={activeNav === 'feed' ? 'font-semibold text-[#2dd4bf]' : ''}>Feed</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveNav('playlists')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeNav === 'playlists'
                    ? 'text-white bg-white/[0.04]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <ListMusic className="h-4 w-4 text-gray-400" />
                <span>Playlists</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveNav('marketplace')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeNav === 'marketplace'
                    ? 'text-[#E8B896] bg-[#E8B896]/10 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className={`h-4 w-4 ${activeNav === 'marketplace' ? 'text-[#E8B896]' : 'text-gray-400'}`} />
                  <span className={activeNav === 'marketplace' ? 'text-[#E8B896]' : ''}>Beat Store</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#E8B896]/20 text-[#E8B896] uppercase">
                  Store
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenSoundstage()}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition-all cursor-pointer mt-1"
                title="Open Studio Vocal Recorder"
              >
                <div className="flex items-center gap-3">
                  <Mic className="h-4 w-4 text-teal-400" />
                  <span>Record Vocal</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-300 uppercase">
                  Studio
                </span>
              </button>
            </nav>

            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 px-3 mb-2">
                YOUR MUSIC
              </p>
              <div className="space-y-0.5">
                {[
                  { id: 'fav', label: 'Favourites', icon: Heart, count: favoritesList.length, activeColor: 'text-red-500' },
                  { id: 'later', label: 'Listen Later', icon: Clock, count: listenLaterList.length, activeColor: 'text-[#2dd4bf]' },
                  { id: 'history', label: 'History', icon: Calendar, count: listeningHistory.length, activeColor: 'text-[#2dd4bf]' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive ? 'text-white bg-white/[0.04]' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? item.activeColor : 'text-gray-400'}`} />
                        <span className={isActive ? 'font-semibold text-white' : ''}>{item.label}</span>
                      </div>
                      {item.count > 0 && (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isActive ? 'bg-white/10 text-white' : 'text-gray-500'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] text-[10px] text-gray-500">
            <span>Caution Studio v2.4</span>
          </div>
        </aside>

        {/* CENTER MAIN VIEW */}
        <main className="flex-1 p-5 sm:p-6 lg:p-7 pb-28 sm:pb-28 overflow-y-auto min-w-0 space-y-6">
          {activeNav === 'fav' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                      <Heart className="h-5 w-5 fill-red-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Your Favourites</h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {favoritesList.length} {favoritesList.length === 1 ? 'track' : 'tracks'} stored in your personal favorites library
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {favoritesList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handlePlayToggle(favoritesList[0])}
                      className="px-4 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                      <span>Play All</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveNav('feed')}
                    className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Return to Feed
                  </button>
                </div>
              </div>

              {favoritesList.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#121316] border border-white/[0.06] space-y-4">
                  <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                    <Heart className="h-7 w-7 stroke-[2]" />
                  </div>
                  <h3 className="text-lg font-bold text-white">No favourites yet</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Tap the heart icon on any beat or production across Caution Studio to save it here in your personal library.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveNav('feed')}
                    className="px-4 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Discover Music
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-3">
                  <div className="hidden sm:flex items-center justify-between px-3 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-1">
                    <div className="w-72 sm:w-80">Track / Producer</div>
                    <div className="w-36 text-left">BPM & Plays</div>
                    <div className="hidden lg:block w-28">Basic Lease</div>
                    <div className="w-36 text-right">Actions</div>
                  </div>

                  <div className="space-y-2">
                    {favoritesList.map((row) => {
                      const isThisPlaying = isPlaying && currentTrack.id === row.id;
                      return (
                        <div
                          key={'fav-' + row.id}
                          onClick={() => handlePlayToggle(row)}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 w-72 sm:w-80">
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                              <img
                                src={row.coverUrl}
                                alt={row.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              {isThisPlaying && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-ping" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isThisPlaying ? 'text-[#2dd4bf]' : 'text-white'}`}>
                                {row.title}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">{row.artist}</p>
                            </div>
                          </div>

                          <div className="hidden sm:block text-xs font-mono text-gray-400 text-left w-36 truncate">
                            <p className="truncate">{row.tracksCount || `${row.bpm || 120} BPM • ${row.genre || 'Beat'}`}</p>
                            <p className="text-[10px] text-[#2dd4bf] font-semibold mt-0.5">
                              {(row.playCount || 0).toLocaleString()} plays
                            </p>
                          </div>

                          <div className="hidden lg:flex items-center text-xs font-mono font-bold text-[#2dd4bf] w-28">
                            {row.priceNgn ? `₦${row.priceNgn.toLocaleString('en-NG')}` : '₦3,000'}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-36 justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleListenLater(row);
                              }}
                              title={listenLaterIds.includes(row.id) ? "Remove from Listen Later" : "Add to Listen Later"}
                              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                listenLaterIds.includes(row.id) ? 'text-[#2dd4bf] bg-[#2dd4bf]/10' : 'text-gray-500 hover:text-[#2dd4bf]'
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(row.id);
                              }}
                              title="Remove from Favourites"
                              className="p-1.5 rounded-full text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer"
                            >
                              <Heart className="h-3.5 w-3.5 fill-red-500" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDownload(row, e)}
                              title="Download Song (WAV)"
                              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                downloadingId === row.id ? 'text-[#2dd4bf] bg-[#2dd4bf]/10 animate-pulse' : 'text-gray-500 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayToggle(row);
                              }}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                isThisPlaying ? 'bg-[#04564f] text-[#2dd4bf]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {isThisPlaying ? (
                                <Pause className="h-3.5 w-3.5 fill-current" />
                              ) : (
                                <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : activeNav === 'later' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#2dd4bf]/10 text-[#2dd4bf]">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Listen Later</h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {listenLaterList.length} {listenLaterList.length === 1 ? 'song' : 'songs'} queued for upcoming audition sessions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {listenLaterList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handlePlayToggle(listenLaterList[0])}
                      className="px-4 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                      <span>Start Queue</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveNav('feed')}
                    className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Return to Feed
                  </button>
                </div>
              </div>

              {listenLaterList.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#121316] border border-white/[0.06] space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#2dd4bf]/10 text-[#2dd4bf] flex items-center justify-center mx-auto">
                    <Clock className="h-7 w-7 stroke-[2]" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Your Listen Later queue is empty</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Click the clock icon on any track card, row, or player bar to bookmark it for later review and auditioning.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveNav('feed')}
                    className="px-4 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Explore Beats
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-3">
                  <div className="hidden sm:flex items-center justify-between px-3 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-1">
                    <div className="w-72 sm:w-80">Track / Producer</div>
                    <div className="w-36 text-left">BPM & Plays</div>
                    <div className="hidden lg:block w-28">Basic Lease</div>
                    <div className="w-36 text-right">Actions</div>
                  </div>

                  <div className="space-y-2">
                    {listenLaterList.map((row) => {
                      const isThisPlaying = isPlaying && currentTrack.id === row.id;
                      return (
                        <div
                          key={'later-' + row.id}
                          onClick={() => handlePlayToggle(row)}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 w-72 sm:w-80">
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                              <img
                                src={row.coverUrl}
                                alt={row.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              {isThisPlaying && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-ping" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isThisPlaying ? 'text-[#2dd4bf]' : 'text-white'}`}>
                                {row.title}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">{row.artist}</p>
                            </div>
                          </div>

                          <div className="hidden sm:block text-xs font-mono text-gray-400 text-left w-36 truncate">
                            <p className="truncate">{row.tracksCount || `${row.bpm || 120} BPM • ${row.genre || 'Beat'}`}</p>
                            <p className="text-[10px] text-[#2dd4bf] font-semibold mt-0.5">
                              {(row.playCount || 0).toLocaleString()} plays
                            </p>
                          </div>

                          <div className="hidden lg:flex items-center text-xs font-mono font-bold text-[#2dd4bf] w-28">
                            {row.priceNgn ? `₦${row.priceNgn.toLocaleString('en-NG')}` : '₦3,000'}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-36 justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleListenLater(row);
                              }}
                              title="Remove from Listen Later"
                              className="p-1.5 rounded-full text-[#2dd4bf] bg-[#2dd4bf]/15 hover:bg-[#2dd4bf]/25 transition-colors cursor-pointer"
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(row.id);
                              }}
                              title="Favorite"
                              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                row.isLiked || likedTrackIds.includes(row.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`h-3.5 w-3.5 ${row.isLiked || likedTrackIds.includes(row.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDownload(row, e)}
                              title="Download Song (WAV)"
                              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                downloadingId === row.id ? 'text-[#2dd4bf] bg-[#2dd4bf]/10 animate-pulse' : 'text-gray-500 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayToggle(row);
                              }}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                isThisPlaying ? 'bg-[#04564f] text-[#2dd4bf]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {isThisPlaying ? (
                                <Pause className="h-3.5 w-3.5 fill-current" />
                              ) : (
                                <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : activeNav === 'history' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#2dd4bf]/10 text-[#2dd4bf]">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Listening History</h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Track and replay all your recently audited beats and full session streams
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {listeningHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setListeningHistory([]);
                        try {
                          localStorage.removeItem('caution_listening_history');
                        } catch (e) {}
                      }}
                      className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Clear History
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveNav('feed')}
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Return to Feed
                  </button>
                </div>
              </div>

              {listeningHistory.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#121316] border border-white/[0.06] space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#2dd4bf]/10 text-[#2dd4bf] flex items-center justify-center mx-auto">
                    <Calendar className="h-7 w-7 stroke-[2]" />
                  </div>
                  <h3 className="text-lg font-bold text-white">No listening history yet</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Whenever you play beats or audition previews on Caution Studio, your history will be recorded automatically here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveNav('feed')}
                    className="px-4 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Start Auditioning
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-3">
                  <div className="hidden sm:flex items-center justify-between px-3 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-1">
                    <div className="w-72 sm:w-80">Track / Producer</div>
                    <div className="w-36 text-left">Auditioned Time</div>
                    <div className="hidden lg:block w-28">Basic Lease</div>
                    <div className="w-36 text-right">Actions</div>
                  </div>

                  <div className="space-y-2">
                    {listeningHistory.map((item, idx) => {
                      const row = item.track;
                      const isThisPlaying = isPlaying && currentTrack.id === row.id;
                      return (
                        <div
                          key={'hist-' + row.id + '-' + idx}
                          onClick={() => handlePlayToggle(row)}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 w-72 sm:w-80">
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                              <img
                                src={row.coverUrl}
                                alt={row.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              {isThisPlaying && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-ping" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isThisPlaying ? 'text-[#2dd4bf]' : 'text-white'}`}>
                                {row.title}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">{row.artist}</p>
                            </div>
                          </div>

                          <div className="hidden sm:block text-xs font-mono text-gray-400 text-left w-36 truncate">
                            <p className="truncate text-gray-300">{item.listenedAt}</p>
                            <p className="text-[10px] text-[#2dd4bf] font-semibold mt-0.5">
                              {(row.playCount || 0).toLocaleString()} total plays
                            </p>
                          </div>

                          <div className="hidden lg:flex items-center text-xs font-mono font-bold text-[#2dd4bf] w-28">
                            {row.priceNgn ? `₦${row.priceNgn.toLocaleString('en-NG')}` : '₦3,000'}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-36 justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleListenLater(row);
                              }}
                              title={listenLaterIds.includes(row.id) ? "In Listen Later" : "Add to Listen Later"}
                              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                listenLaterIds.includes(row.id) ? 'text-[#2dd4bf] bg-[#2dd4bf]/10' : 'text-gray-500 hover:text-[#2dd4bf]'
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(row.id);
                              }}
                              title="Favorite"
                              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                row.isLiked || likedTrackIds.includes(row.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`h-3.5 w-3.5 ${row.isLiked || likedTrackIds.includes(row.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDownload(row, e)}
                              title="Download Song (WAV)"
                              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                downloadingId === row.id ? 'text-[#2dd4bf] bg-[#2dd4bf]/10 animate-pulse' : 'text-gray-500 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayToggle(row);
                              }}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                isThisPlaying ? 'bg-[#04564f] text-[#2dd4bf]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {isThisPlaying ? (
                                <Pause className="h-3.5 w-3.5 fill-current" />
                              ) : (
                                <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : activeNav === 'playlists' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-2xl font-black text-white">Your Playlists</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Custom collections and mood boards for your ongoing studio sessions
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveNav('feed')}
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Return to Feed
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlistRows.slice(0, 6).map((item) => (
                  <div
                    key={'pl-card-' + item.id}
                    onClick={() => handlePlayToggle(item)}
                    className="p-4 rounded-2xl bg-[#121316] border border-white/[0.06] hover:border-white/20 transition-all cursor-pointer group"
                  >
                    <div className="aspect-square w-full rounded-xl overflow-hidden bg-black/40 border border-white/10 relative mb-3">
                      <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#2dd4bf] bg-black/70 px-2 py-0.5 rounded border border-white/10">
                          {item.tracksCount || `${item.bpm || 120} BPM`}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-[#04564f] text-[#2dd4bf] flex items-center justify-center shadow-lg">
                          <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#2dd4bf] transition-colors truncate">{item.title}</h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{item.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : activeNav === 'marketplace' ? (
            <UserMarketplaceView
              tracks={playlistRows}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              handlePlayToggle={handlePlayToggle}
              likedTrackIds={likedTrackIds}
              toggleLike={toggleLike}
              listenLaterIds={listenLaterIds}
              toggleListenLater={toggleListenLater}
              handleDownload={handleDownload}
              downloadingId={downloadingId}
              onOpenSoundstage={handleOpenSoundstage}
              onTriggerAd={() => setIsAdModalOpen(true)}
              bonusDownloads={downloadQuota.bonus}
              remainingDownloads={downloadQuota.remaining}
            />
          ) : (
            <>
              {/* TWO HERO CARDS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Top Rated Song (Updated from Featured Studio Vault) */}
                <div className="lg:col-span-5 bg-[#121316] border border-white/[0.06] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        5.0
                      </span>
                      <p className="text-[11px] font-mono text-gray-400">
                        • #1 Top Rated • Caution Studio
                      </p>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                      Top Rated Song
                    </h2>
                  </div>

                  <div className="my-6 flex justify-center relative">
                    <div
                      onClick={() => {
                        if (topRatedSong) handlePlayToggle(topRatedSong);
                      }}
                      className="w-48 h-48 rounded-xl overflow-hidden shadow-2xl relative border border-white/10 group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                    >
                      <img
                        src={topRatedSong?.coverUrl || '/images/album_neon_dj.jpg'}
                        alt={topRatedSong?.title || 'Top Rated Song'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                      <div className="absolute top-2.5 left-2.5">
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30">
                          <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                          Top Rated
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-white truncate">
                            {topRatedSong?.title || 'Neon Overdrive'}
                          </p>
                          <p className="text-[10px] text-gray-300 truncate">
                            {topRatedSong?.artist || 'Arakunrin Cole'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {topRatedSong && (
                            <button
                              type="button"
                              onClick={(e) => handleDownload(topRatedSong, e)}
                              title="Download Song (WAV)"
                              className="w-7 h-7 rounded-full bg-black/60 hover:bg-[#2dd4bf] hover:text-black text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                          )}
                          <div className="w-8 h-8 rounded-full bg-[#04564f] text-[#2dd4bf] flex items-center justify-center shadow-lg">
                            {isPlaying && currentTrack.id === topRatedSong?.id ? (
                              <Pause className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-16 bg-[#04564f]/30 blur-2xl pointer-events-none rounded-full" />
                </div>

                {/* Cinematic Hero Player: Database Master Recording (Desktop only) */}
                <div className="hidden lg:flex lg:col-span-7 bg-[#121316] border border-white/[0.06] rounded-2xl relative overflow-hidden flex-col justify-between p-6 min-h-[300px]">
                  <img
                    src={currentTrack.coverUrl || '/images/cinematic_hero_tunnel.jpg'}
                    alt={currentTrack.title}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-black/40 to-black/60" />

                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-mono text-gray-300 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                        <span>{currentTrack.artist}</span>
                        <span>•</span>
                        <span>{currentTrack.date || 'Caution Studio'}</span>
                        <span>•</span>
                        <span className="text-[#2dd4bf] font-bold">{(currentTrack.playCount || 0).toLocaleString()} plays</span>
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                        {currentTrack.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDownload(currentTrack, e)}
                        title="Download Song (WAV)"
                        className={`p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-colors cursor-pointer ${
                          downloadingId === currentTrack.id ? 'text-[#2dd4bf] border-[#2dd4bf]/40' : 'text-white hover:text-[#2dd4bf]'
                        }`}
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleListenLater(currentTrack)}
                        title={listenLaterIds.includes(currentTrack.id) ? "Remove from Listen Later" : "Add to Listen Later"}
                        className={`p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-colors cursor-pointer ${
                          listenLaterIds.includes(currentTrack.id)
                            ? 'text-[#2dd4bf] border-[#2dd4bf]/40'
                            : 'text-white hover:text-[#2dd4bf]'
                        }`}
                      >
                        <Clock className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleLike(currentTrack.id)}
                        className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Heart className={`h-4 w-4 ${currentTrack.isLiked || likedTrackIds.includes(currentTrack.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-gray-300 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="relative z-10 flex justify-center my-8">
                    <button
                      type="button"
                      onClick={() => handlePlayToggle(currentTrack)}
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-[#04564f] hover:border-[#2dd4bf] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg"
                    >
                      {isPlaying ? (
                        <Pause className="h-7 w-7 fill-white" />
                      ) : (
                        <Play className="h-7 w-7 fill-white translate-x-0.5" />
                      )}
                    </button>
                  </div>

                  <div className="relative z-10 pt-2">
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        const targetSec = Math.round(ratio * currentTrack.durationSeconds);
                        if (!isSubscribed && targetSec > FREE_PREVIEW_LIMIT_SECONDS) {
                          setCurrentTime(0);
                          if (audioRef.current) {
                            audioRef.current.currentTime = 0;
                            audioRef.current.pause();
                          }
                          audioSynth.stop();
                          setIsPlaying(false);
                          hasTriggeredUpgradeModalRef.current = true;
                          setShowUpgradeModal(true);
                          return;
                        }
                        setCurrentTime(targetSec);
                        if (audioRef.current) {
                          audioRef.current.currentTime = targetSec;
                        }
                      }}
                      className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-2 cursor-pointer relative"
                    >
                      <div
                        className="h-full bg-gradient-to-r from-[#04564f] to-[#2dd4bf] transition-all duration-300"
                        style={{ width: `${progressRatio}%` }}
                      />
                      {!isSubscribed && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
                          style={{ left: `${Math.min(100, (FREE_PREVIEW_LIMIT_SECONDS / currentTrack.durationSeconds) * 100)}%` }}
                          title="15-second free preview limit"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-300">
                      <span>{formatTime(currentTime)}</span>
                      <span>{currentTrack.duration}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MIDDLE GENRE TABS & BEATS TABLE */}
              <div className="space-y-4">
                <div className="flex items-center gap-6 border-b border-white/[0.06] pb-3 text-xs font-semibold overflow-x-auto scrollbar-none">
                  {adminGenreList.map((genreName) => {
                    const isActive = selectedGenre.toLowerCase() === genreName.toLowerCase();
                    return (
                      <button
                        key={genreName}
                        type="button"
                        onClick={() => setSelectedGenre(genreName)}
                        className={`relative py-1 transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                          isActive ? 'text-[#2dd4bf]' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>{genreName}</span>
                        {isActive && (
                          <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#2dd4bf]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Table Header */}
                <div className="hidden sm:flex items-center justify-between px-3 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-1">
                  <div className="w-72 sm:w-80">Track / Producer</div>
                  <div className="w-36 text-left">BPM & Plays</div>
                  <div className="hidden md:block w-36">Release Date</div>
                  <div className="hidden lg:block w-28">Basic Lease</div>
                  <div className="w-36 text-right">Actions</div>
                </div>

                <div className="space-y-2">
                  {filteredRows.length === 0 ? (
                    <div className="p-10 text-center rounded-xl bg-[#121316] border border-white/[0.04] space-y-3">
                      <p className="text-sm font-semibold text-white">No tracks found in {selectedGenre}</p>
                      <p className="text-xs text-gray-400">Try selecting another genre or view all available beats.</p>
                      <button
                        type="button"
                        onClick={() => setSelectedGenre('All')}
                        className="px-4 py-2 rounded-lg bg-[#2dd4bf] text-black text-xs font-bold hover:bg-[#26b4a2] transition-colors cursor-pointer"
                      >
                        Browse All Genres
                      </button>
                    </div>
                  ) : (
                    filteredRows.map((row) => {
                    const isThisPlaying = isPlaying && currentTrack.id === row.id;
                    return (
                      <div
                        key={row.id}
                        onClick={() => handlePlayToggle(row)}
                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#121316] hover:bg-[#181a1f] border border-white/[0.04] hover:border-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 w-72 sm:w-80">
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                            <img
                              src={row.coverUrl}
                              alt={row.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {isThisPlaying && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-ping" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${isThisPlaying ? 'text-[#2dd4bf]' : 'text-white'}`}>
                              {row.title}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              {row.artist}
                            </p>
                          </div>
                        </div>

                        <div className="hidden sm:block text-xs font-mono text-gray-400 text-left w-36 truncate">
                          <p className="truncate">{row.tracksCount || `${row.bpm || 120} BPM • ${row.genre || 'Beat'}`}</p>
                          <p className="text-[10px] text-[#2dd4bf] font-semibold mt-0.5">
                            {(row.playCount || 0).toLocaleString()} plays
                          </p>
                        </div>

                        <div className="hidden md:block text-xs text-gray-500 w-36 truncate">
                          {row.date}
                        </div>

                        <div className="hidden lg:flex items-center text-xs font-mono font-bold text-[#2dd4bf] w-28">
                          {row.priceNgn ? `₦${row.priceNgn.toLocaleString('en-NG')}` : '₦3,000'}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-36 justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleListenLater(row);
                            }}
                            title={listenLaterIds.includes(row.id) ? "Remove from Listen Later" : "Add to Listen Later"}
                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                              listenLaterIds.includes(row.id) ? 'text-[#2dd4bf] bg-[#2dd4bf]/10' : 'text-gray-500 hover:text-[#2dd4bf]'
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(row.id);
                            }}
                            title="Favorite"
                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                              row.isLiked || likedTrackIds.includes(row.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${row.isLiked || likedTrackIds.includes(row.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownload(row, e)}
                            title="Download Song (WAV)"
                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                              downloadingId === row.id ? 'text-[#2dd4bf] bg-[#2dd4bf]/10 animate-pulse' : 'text-gray-500 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayToggle(row);
                            }}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                              isThisPlaying
                                ? 'bg-[#04564f] text-[#2dd4bf]'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {isThisPlaying ? (
                              <Pause className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              </div>

              {/* BOTTOM ROW: PROMO BANNER */}
              {showPromoBanner && (
                <div className="w-full bg-gradient-to-r from-[#171821] via-[#1a1b24] to-[#1e1724] border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                  <button
                    type="button"
                    onClick={() => setShowPromoBanner(false)}
                    className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-white transition-colors z-20 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="max-w-md relative z-10 space-y-2">
                    <h4 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      Check the power of Caution Studio
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed pt-1">
                      Enjoy uninterrupted high-fidelity audio, separated multi-track stem downloads, and commercial sync licenses.
                    </p>
                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-5 py-2.5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer shadow-md"
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  </div>

                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-56 sm:w-64 h-56 sm:h-64 pointer-events-none opacity-90 overflow-hidden">
                    <img
                      src="/images/ribbon_promo_wave.jpg"
                      alt="3D Wave Ribbon"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-72 lg:w-80 border-l border-white/[0.06] bg-[#0A0B0E] p-5 shrink-0 hidden xl:flex flex-col space-y-6 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                NEW RELEASES
              </span>
              <button type="button" className="text-xs text-[#2dd4bf] hover:underline font-semibold">
                See all
              </button>
            </div>

            <div className="space-y-3">
              {newReleases.map((nr) => (
                <div
                  key={nr.id}
                  onClick={() => handlePlayToggle(nr)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                    <img
                      src={nr.coverUrl}
                      alt={nr.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-3.5 w-3.5 fill-white text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{nr.title}</p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{nr.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MOST LISTENED BEATS (TOP 5) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                MOST LISTENED BEATS
              </span>
              <span className="text-[10px] font-mono text-[#2dd4bf] font-semibold">
                TOP 5
              </span>
            </div>

            <div className="space-y-2.5">
              {mostListenedBeats.map((track, idx) => {
                const isThisPlaying = isPlaying && currentTrack.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => handlePlayToggle(track)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="text-base font-black font-mono shrink-0 select-none w-4 text-center text-transparent"
                        style={{
                          WebkitTextStroke: '1px #6B7280'
                        }}
                      >
                        {idx + 1}
                      </span>

                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isThisPlaying ? (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-ping" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="h-3.5 w-3.5 fill-white text-white" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isThisPlaying ? 'text-[#2dd4bf]' : 'text-white'}`}>
                          {track.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[10px] text-gray-500 truncate max-w-[65px]">{track.artist}</p>
                          <span className="text-gray-600 text-[9px]">•</span>
                          <span className="text-[10px] font-mono font-semibold text-[#2dd4bf] shrink-0">
                            {(track.playCount || 0).toLocaleString()} plays
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleListenLater(track);
                        }}
                        className={`p-1 transition-colors cursor-pointer ${
                          track.isListenLater || listenLaterIds.includes(track.id)
                            ? 'text-[#2dd4bf] hover:text-[#2dd4bf]/80'
                            : 'text-gray-500 hover:text-white'
                        }`}
                        title={track.isListenLater || listenLaterIds.includes(track.id) ? 'In Listen Later' : 'Add to Listen Later'}
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track.id);
                        }}
                        className={`p-1 transition-colors cursor-pointer ${
                          track.isLiked || likedTrackIds.includes(track.id)
                            ? 'text-red-500 hover:text-red-400'
                            : 'text-gray-500 hover:text-red-400'
                        }`}
                        title={track.isLiked || likedTrackIds.includes(track.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                      >
                        <Heart className={`h-3.5 w-3.5 ${track.isLiked || likedTrackIds.includes(track.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDownload(track, e)}
                        className={`p-1 transition-colors cursor-pointer ${
                          downloadingId === track.id ? 'text-[#2dd4bf]' : 'text-gray-500 hover:text-white'
                        }`}
                        title="Download Song (WAV)"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VERIFIED STUDIO PRODUCERS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                VERIFIED PRODUCERS
              </span>
              <button type="button" className="text-xs text-[#2dd4bf] hover:underline font-semibold">
                See all
              </button>
            </div>

            <div className="space-y-3">
              {producers.map((artist) => (
                <div
                  key={artist.rank + '-' + artist.handle}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className="text-2xl font-black font-mono shrink-0 select-none text-transparent"
                      style={{
                        WebkitTextStroke: '1.2px #4B5563'
                      }}
                    >
                      {artist.rank}
                    </span>

                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
                      <img
                        src={artist.coverUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{artist.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{artist.subscribers}</p>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM PERSISTENT PLAYER BAR */}
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-[#0A0B0E]/95 backdrop-blur-xl border-t border-white/[0.08] px-3 sm:px-6 z-50 flex items-center">
        {/* MOBILE PLAYER (Viewport < md) */}
        <div className="flex md:hidden w-full items-center justify-between gap-2.5">
          {/* Left: Album Cover + Metadata Column */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              onClick={() => handlePlayToggle(currentTrack)}
              className="w-11 h-11 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0 cursor-pointer relative group"
            >
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {isPlaying ? <Pause className="h-3.5 w-3.5 text-white" /> : <Play className="h-3.5 w-3.5 text-white" />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* Reduced music title */}
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-[11px] font-bold text-white truncate max-w-[130px] sm:max-w-[170px]" title={currentTrack.title}>
                  {currentTrack.title}
                </p>
                {!isSubscribed && (
                  <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    15s
                  </span>
                )}
              </div>

              {/* Publisher name */}
              <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                {currentTrack.artist}
              </p>

              {/* Row below Publisher name: Download icon + Music bar right beside download + Music count on same line */}
              <div className="flex items-center gap-1.5 mt-1 w-full">
                <button
                  type="button"
                  onClick={(e) => handleDownload(currentTrack, e)}
                  title="Download Song (WAV)"
                  className={`p-0.5 text-gray-400 hover:text-[#2dd4bf] transition-colors shrink-0 cursor-pointer ${
                    downloadingId === currentTrack.id ? 'text-[#2dd4bf]' : ''
                  }`}
                >
                  <Download className="h-3 w-3" />
                </button>

                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const targetSec = Math.round(ratio * currentTrack.durationSeconds);
                    if (!isSubscribed && targetSec > FREE_PREVIEW_LIMIT_SECONDS) {
                      setCurrentTime(0);
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.pause();
                      }
                      audioSynth.stop();
                      setIsPlaying(false);
                      hasTriggeredUpgradeModalRef.current = true;
                      setShowUpgradeModal(true);
                      return;
                    }
                    setCurrentTime(targetSec);
                    if (audioRef.current) {
                      audioRef.current.currentTime = targetSec;
                    }
                  }}
                  className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden cursor-pointer relative"
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#04564f] to-[#2dd4bf] transition-all"
                    style={{ width: `${progressRatio}%` }}
                  />
                  {!isSubscribed && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
                      style={{ left: `${Math.min(100, (FREE_PREVIEW_LIMIT_SECONDS / currentTrack.durationSeconds) * 100)}%` }}
                    />
                  )}
                </div>

                <span className="text-[9px] font-mono text-gray-400 shrink-0 tabular-nums">
                  {formatTime(currentTime)} / {!isSubscribed ? '0:15' : currentTrack.duration}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Clean Control Icons (Shuffle removed) */}
          <div className="flex items-center gap-1 shrink-0 pl-1">
            <button
              type="button"
              onClick={() => {
                if (currentTime > 3) {
                  setCurrentTime(0);
                  if (audioRef.current) audioRef.current.currentTime = 0;
                } else {
                  const currentIndex = playlistRows.findIndex((t) => t.id === currentTrack.id);
                  const prevIndex = (currentIndex - 1 + playlistRows.length) % (playlistRows.length || 1);
                  if (playlistRows[prevIndex]) handlePlayToggle(playlistRows[prevIndex]);
                }
              }}
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Previous track"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => handlePlayToggle(currentTrack)}
              className="w-8 h-8 rounded-full bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] flex items-center justify-center transition-colors shadow-md cursor-pointer"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-white" />
              ) : (
                <Play className="h-4 w-4 fill-white translate-x-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const currentIndex = playlistRows.findIndex((t) => t.id === currentTrack.id);
                const nextIndex = (currentIndex + 1) % (playlistRows.length || 1);
                if (playlistRows[nextIndex]) handlePlayToggle(playlistRows[nextIndex]);
              }}
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Next track"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => handleOpenSoundstage(currentTrack)}
              className="p-1.5 text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
              aria-label="Record song over beat"
              title="Record Song"
            >
              <Mic className="h-4 w-4 text-teal-400" />
            </button>

            <button
              type="button"
              onClick={() => toggleLike(currentTrack.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              aria-label="Favorite"
            >
              <Heart
                className={`h-4 w-4 ${
                  currentTrack.isLiked || likedTrackIds.includes(currentTrack.id)
                    ? 'fill-red-500 text-red-500'
                    : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* DESKTOP PLAYER (Viewport >= md) */}
        <div className="hidden md:flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-64 shrink-0 min-w-0">
            <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
                {!isSubscribed && (
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors shrink-0 cursor-pointer"
                    title="Free preview is limited to 15 seconds. Click to upgrade for full tracks."
                  >
                    15s Preview
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">{currentTrack.artist}</p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5 min-w-0">
            {/* Desktop Control Buttons without Shuffle */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  if (currentTime > 3) {
                    setCurrentTime(0);
                    if (audioRef.current) audioRef.current.currentTime = 0;
                  } else {
                    const currentIndex = playlistRows.findIndex((t) => t.id === currentTrack.id);
                    const prevIndex = (currentIndex - 1 + playlistRows.length) % (playlistRows.length || 1);
                    if (playlistRows[prevIndex]) handlePlayToggle(playlistRows[prevIndex]);
                  }
                }}
                className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => handlePlayToggle(currentTrack)}
                className="w-8 h-8 rounded-full bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] flex items-center justify-center transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-white" />
                ) : (
                  <Play className="h-4 w-4 fill-white translate-x-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const currentIndex = playlistRows.findIndex((t) => t.id === currentTrack.id);
                  const nextIndex = (currentIndex + 1) % (playlistRows.length || 1);
                  if (playlistRows[nextIndex]) handlePlayToggle(playlistRows[nextIndex]);
                }}
                className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <SkipForward className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => toggleLike(currentTrack.id)}
                className={`p-1 transition-colors cursor-pointer ${
                  currentTrack.isLiked || likedTrackIds.includes(currentTrack.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                }`}
                title={currentTrack.isLiked || likedTrackIds.includes(currentTrack.id) ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <Heart className={`h-3.5 w-3.5 ${currentTrack.isLiked || likedTrackIds.includes(currentTrack.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => toggleListenLater(currentTrack)}
                className={`p-1 transition-colors cursor-pointer ${
                  currentTrack.isListenLater || listenLaterIds.includes(currentTrack.id) ? 'text-[#2dd4bf]' : 'text-gray-400 hover:text-white'
                }`}
                title={currentTrack.isListenLater || listenLaterIds.includes(currentTrack.id) ? 'In Listen Later' : 'Add to Listen Later'}
              >
                <Clock className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => handleDownload(currentTrack, e)}
                className={`p-1 transition-colors cursor-pointer ${
                  downloadingId === currentTrack.id ? 'text-[#2dd4bf]' : 'text-gray-400 hover:text-white'
                }`}
                title="Download Current Song (WAV)"
              >
                <Download className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleOpenSoundstage(currentTrack)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-semibold transition-colors cursor-pointer ml-1"
                title="Record your vocals or song idea directly over this beat"
              >
                <Mic className="h-3 w-3 text-teal-400" />
                <span className="hidden lg:inline text-[11px]">Record Vocal</span>
              </button>
            </div>

            <div className="w-full flex items-center gap-3">
              <span className="text-[10px] font-mono text-gray-500 w-8 text-right shrink-0">
                {formatTime(currentTime)}
              </span>
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const targetSec = Math.round(ratio * currentTrack.durationSeconds);
                  if (!isSubscribed && targetSec > FREE_PREVIEW_LIMIT_SECONDS) {
                    setCurrentTime(0);
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0;
                      audioRef.current.pause();
                    }
                    audioSynth.stop();
                    setIsPlaying(false);
                    hasTriggeredUpgradeModalRef.current = true;
                    setShowUpgradeModal(true);
                    return;
                  }
                  setCurrentTime(targetSec);
                  if (audioRef.current) {
                    audioRef.current.currentTime = targetSec;
                  }
                }}
                className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer relative group"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#04564f] to-[#2dd4bf] transition-all"
                  style={{ width: `${progressRatio}%` }}
                />
                {!isSubscribed && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
                    style={{ left: `${Math.min(100, (FREE_PREVIEW_LIMIT_SECONDS / currentTrack.durationSeconds) * 100)}%` }}
                    title="15-second free preview limit"
                  />
                )}
              </div>
              <span className="text-[10px] font-mono text-gray-500 w-8 shrink-0">
                {!isSubscribed ? '0:15' : currentTrack.duration}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 w-64 justify-end shrink-0">
            <div className="flex items-center gap-1.5 text-gray-400">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-16 h-1 bg-white/20 rounded-lg accent-[#2dd4bf] cursor-pointer"
              />
            </div>

            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
              title="Equalizer"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
              title="Playlist Queue"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* CREATE PLAYLIST MODAL */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#121316] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Playlist</h3>
              <button
                type="button"
                onClick={() => setShowCreatePlaylistModal(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1">
                  Playlist Title
                </label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. Late Night Synthwave"
                  className="w-full h-10 px-3 rounded-lg bg-[#181a1f] border border-white/10 text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePlaylistModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#04564f] hover:bg-[#03453f] text-xs font-bold text-white uppercase tracking-wider"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPGRADE SUBSCRIPTION MODAL */}
      {showUpgradeModal && (
        <div 
          onClick={handleCloseUpgradeModal}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-[#121316] border border-white/10 rounded-2xl p-6 space-y-5 cursor-default shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#2dd4bf]" />
                <h3 className="text-lg font-black text-white">Upgrade to Caution Plus</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseUpgradeModal}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              {!isSubscribed
                ? "You've reached the 15-second preview limit for free accounts. Upgrade to Caution Plus to unlock unlimited full-length streaming, WAV stem downloads, and commercial licensing."
                : "Unlock unlimited 24-bit lossless streaming, stem downloads, multi-track separation, and automated synchronization clearance for commercial releases."}
            </p>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2.5 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#2dd4bf]" />
                <span>Unlimited high-fidelity streaming & downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#2dd4bf]" />
                <span>WAV trackout stems (.ZIP) for every track</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#2dd4bf]" />
                <span>Commercial synchronization rights for YouTube, TikTok & DSPs</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-white">₦3,000</span>
                <span className="text-xs text-gray-400"> / month</span>
              </div>
              <Link
                href="/subscriptions"
                onClick={handleCloseUpgradeModal}
                className="px-5 py-2.5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-xs font-bold text-white uppercase tracking-wider transition-colors inline-block text-center cursor-pointer"
              >
                Upgrade to Plus
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* DOWNLOAD TOAST NOTIFICATION */}
      {downloadToast && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3 bg-[#121316] border border-[#2dd4bf]/40 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300">
          <div className="w-8 h-8 rounded-full bg-[#04564f] text-[#2dd4bf] flex items-center justify-center shrink-0">
            <Download className="h-4 w-4 animate-bounce" />
          </div>
          <div>
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Downloading Audio Master</span>
              {downloadToast.bonusUsed && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  Ad Bonus Used
                </span>
              )}
            </p>
            <p className="text-[11px] text-gray-400 truncate max-w-[220px]">
              {downloadToast.title} • {downloadToast.artist}
            </p>
            {downloadToast.remaining !== undefined && (
              <p className="text-[10px] text-teal-400 font-mono mt-0.5">
                {downloadToast.remaining} {downloadToast.remaining === 1 ? 'download' : 'downloads'} left today
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDownloadToast(null)}
            className="p-1 text-gray-500 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* REWARD EARNED TOAST NOTIFICATION */}
      {rewardNotification && (
        <div className="fixed top-20 right-6 z-50 max-w-sm p-4 rounded-2xl bg-[#0F131C] border border-teal-500/40 text-white shadow-2xl animate-in slide-in-from-top-4 duration-300 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-teal-300">Benefit Earned</p>
            <p className="text-xs text-gray-200 mt-0.5 leading-snug">{rewardNotification}</p>
          </div>
          <button
            type="button"
            onClick={() => setRewardNotification(null)}
            className="p-1 text-gray-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* DAILY DOWNLOAD LIMIT REACHED MODAL */}
      {isDownloadLimitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-7 shadow-2xl text-white overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsDownloadLimitModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 mb-4 shadow-inner">
              <Download className="h-6 w-6" />
            </div>

            <h3 className="text-xl font-black text-white tracking-tight">
              Daily Download Limit Reached
            </h3>
            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
              You have downloaded your quota for today. Stream an artist sponsored track through ads to instantly earn <strong className="text-teal-300">+1 bonus beat download</strong> for today!
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDownloadLimitModalOpen(false);
                  setIsAdModalOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-lg shadow-[#2dd4bf]/20 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Stream Artist Track (+1 Download)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDownloadLimitModalOpen(false);
                  setShowUpgradeModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer"
              >
                <span>Upgrade to Plus for Unlimited Downloads</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Song Unskippable Audio Ad (Audiomack / Spotify Model) */}
      <UserAdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onRewardEarned={(bonusCount) => {
          setRewardNotification(
            `You streamed the sponsored artist song! +1 bonus beat download has been credited for today (total bonus: ${bonusCount}).`
          );
          setTimeout(() => setRewardNotification(null), 6000);
        }}
      />

      {/* Soundstage In-Browser Vocal & Song Recorder */}
      <UserSoundstageModal
        isOpen={isSoundstageOpen}
        onClose={() => setIsSoundstageOpen(false)}
        preselectedTrack={soundstageTrack}
        availableTracks={effectiveBeats}
      />
    </div>
  );
}
export default UserPortalClient;
