'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  CheckCircle2,
  Download,
  Star,
  Menu,
  ShoppingBag,
  Mic,
  Lock,
  Megaphone,
  Sliders,
  ShieldCheck,
  Compass,
  Trophy,
  LayoutGrid,
  Music,
  Repeat,
  Shuffle,
  Maximize2,
  ChevronDown,
  Upload,
  ArrowRight,
  Flame,
  Filter
} from 'lucide-react';
import { audioSynth, TrackRow, WaveformVisualizer } from '@caution/ui';
import { MarketplaceBeatCard } from '../components/MarketplaceBeatCard';
import { UserDropdown } from '../components/UserDropdown';
import { UserHeader } from '../components/UserHeader';
import { UserSidebar } from '../components/UserSidebar';
import { UserAdModal } from '../components/UserAdModal';
import { UserMarketplaceView, isFreeBeat } from '../components/UserMarketplaceView';
import { UserRecordStudioModal } from '../components/UserRecordStudioModal';
import { useUserSubscription, setCachedUserPlan } from '../lib/subscription';
import { supabase } from '../lib/supabaseClient';
import {
  useAppSettings,
  resolveAudioForQuality,
  findHarmonicallyMatchedBeat
} from '../lib/settings';
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
  const { isSubscribed, plan } = useUserSubscription();
  const isPro = plan === 'pro';
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
  const { settings } = useAppSettings();

  const [likesCount, setLikesCount] = useState(0);
  const [streamsCount, setStreamsCount] = useState(0);
  const [songsPlayedCount, setSongsPlayedCount] = useState(0);
  const [songsPlayedSinceLastAd, setSongsPlayedSinceLastAd] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('caution:beats-played-since-ad');
        if (stored) return parseInt(stored, 10) || 0;
      } catch (e) {}
    }
    return 0;
  });
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adModalType, setAdModalType] = useState<'listening' | 'download'>('listening');
  const [isDownloadLimitModalOpen, setIsDownloadLimitModalOpen] = useState(false);
  const [rewardNotification, setRewardNotification] = useState<string | null>(null);
  const [paidBeatPurchaseTrack, setPaidBeatPurchaseTrack] = useState<TrackItem | null>(null);
  const [purchaseTier, setPurchaseTier] = useState<'premium' | 'exclusive'>('premium');
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [isPurchasingBeat, setIsPurchasingBeat] = useState(false);

  // Redesign filters & sorting state
  const [sortOption, setSortOption] = useState<'popular' | 'latest' | 'price_low' | 'price_high'>('popular');
  const [bpmFilter, setBpmFilter] = useState<'all' | 'slow' | 'mid' | 'fast'>('all');
  const [keyFilter, setKeyFilter] = useState<string>('all');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [userProfile, setUserProfile] = useState<{ name: string; avatar: string }>({
    name: 'Holy',
    avatar: '/images/artist_studio_mic.jpg'
  });
  const [purchasedBeats, setPurchasedBeats] = useState<any[]>([]);
  const [loadingPurchased, setLoadingPurchased] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<{
    name: string;
    handle: string;
    coverUrl: string;
    beatsCount?: string;
  } | null>(null);
  const [producerUploads, setProducerUploads] = useState<TrackItem[]>([]);
  const [loadingProducerUploads, setLoadingProducerUploads] = useState(false);
  const downloadQuota = useDailyDownloadQuota(isPro);
  const router = useRouter();

  const handleSelectProducer = async (producer: {
    name: string;
    handle: string;
    coverUrl: string;
    beatsCount?: string;
  }) => {
    setSelectedProducer(producer);
    setActiveNav('discover');
    setLoadingProducerUploads(true);
    try {
      // 1. Immediately extract from current playlistRows
      const localMatches = playlistRows.filter(
        (b) =>
          b.artist?.toLowerCase() === producer.name.toLowerCase() ||
          (producer.handle && b.subscribers?.toLowerCase().includes(producer.handle.toLowerCase())) ||
          (b.title && b.title.toLowerCase().includes(producer.name.toLowerCase()))
      );
      setProducerUploads(localMatches);

      // 2. Query Supabase for all active beats uploaded by this producer (exclude sold / exclusive beats)
      const [beatsRes, licRes] = await Promise.all([
        supabase
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
          .order('created_at', { ascending: false }),
        supabase.from('licenses').select('beat_id, type')
      ]);

      const exclusiveIds = new Set<string>();
      if (licRes.data) {
        licRes.data.forEach((l: any) => {
          if (l.beat_id && String(l.type || '').toLowerCase().trim() === 'exclusive') {
            exclusiveIds.add(l.beat_id);
          }
        });
      }

      const dbBeats = (beatsRes.data || []).filter((b: any) => b.status === 'live' && !exclusiveIds.has(b.id));

      if (dbBeats && dbBeats.length > 0) {
        const r2Cdn = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') || 'https://media.cautionstudioz.com';
        const matches = dbBeats.filter((b: any) => {
          const prodName = b.producer?.display_name || '';
          const prodHandle = b.producer?.handle || '';
          return (
            prodName.toLowerCase() === producer.name.toLowerCase() ||
            (producer.handle && prodHandle.toLowerCase() === producer.handle.toLowerCase()) ||
            (b.title && b.title.toLowerCase().includes(producer.name.toLowerCase()))
          );
        });

        if (matches.length > 0) {
          const mappedMatches: TrackItem[] = matches.map((b: any) => {
            const audioKey = b.preview_clean_key || b.preview_tagged_key || b.master_wav_key;
            let audioUrl = '';
            if (audioKey) {
              if (audioKey.startsWith('http') || audioKey.startsWith('/')) {
                audioUrl = audioKey;
              } else if (r2Cdn) {
                audioUrl = `${r2Cdn}/${audioKey}`;
              } else {
                audioUrl = `/api/media/${audioKey}`;
              }
            } else {
              audioUrl = r2Cdn
                ? `${r2Cdn}/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3`
                : '/api/media/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3';
            }
            const basicLic = b.licenses?.find((l: any) => l.type === 'basic') || b.beat_licenses?.find((l: any) => l.type === 'basic');
            const premiumLic = b.licenses?.find((l: any) => l.type === 'premium') || b.beat_licenses?.find((l: any) => l.type === 'premium');
            const exclusiveLic = b.licenses?.find((l: any) => l.type === 'exclusive') || b.beat_licenses?.find((l: any) => l.type === 'exclusive');
            const beatTags: string[] = Array.isArray(b.tags) ? b.tags : [];

            const hasPaidPremium = Boolean(premiumLic && premiumLic.enabled !== false && Number(premiumLic.price_cents) > 100);
            const hasPaidExclusive = Boolean(exclusiveLic && exclusiveLic.enabled !== false && Number(exclusiveLic.price_cents) > 100);
            const hasPaidBasic = Boolean(basicLic && basicLic.enabled !== false && Number(basicLic.price_cents) > 100);

            // A beat is a Paid Beat if it has an enabled paid license
            const isPaidBeat = hasPaidPremium || hasPaidExclusive || hasPaidBasic;
            const isFree = !isPaidBeat;

            const premiumPriceNgn = hasPaidPremium
              ? Math.round(premiumLic.price_cents / 100)
              : (hasPaidExclusive ? Math.max(30000, Math.round(exclusiveLic.price_cents / 100 * 0.25)) : 0);

            const exclusivePriceNgn = hasPaidExclusive
              ? Math.round(exclusiveLic.price_cents / 100)
              : 0;

            const basicPriceNgn = hasPaidBasic
              ? Math.round(basicLic.price_cents / 100)
              : 0;

            const priceNgn = isFree ? 0 : (premiumPriceNgn || basicPriceNgn || exclusivePriceNgn);

            const durationSec = b.duration_seconds || 180;
            const mins = Math.floor(durationSec / 60);
            const secs = Math.floor(durationSec % 60);

            return {
              id: b.id,
              title: b.title,
              artist: b.producer?.display_name || producer.name,
              subscribers: '@' + (b.producer?.handle || producer.handle),
              tracksCount: `${b.bpm || 120} BPM • ${b.genre || 'Beat'}`,
              date: new Date(b.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
              duration: `${mins}:${secs.toString().padStart(2, '0')}`,
              durationSeconds: durationSec,
              coverUrl: b.cover_url || producer.coverUrl,
              category: isFree ? 'free' : 'playlists',
              audioUrl,
              bpm: b.bpm || 120,
              genre: b.genre || 'Electronic',
              musicalKey: b.musical_key || 'C Minor',
              priceNgn,
              premiumPriceNgn,
              exclusivePriceNgn,
              isFree,
              tags: beatTags,
              playCount: b.play_count || 0,
              downloadCount: Number(b.download_count || b.free_commercial_downloads_count || 0),
              purchaseCount: 0
            };
          });

          setProducerUploads(mappedMatches);
        }
      }
    } catch (err) {
      console.warn('Error fetching producer uploads:', err);
    } finally {
      setLoadingProducerUploads(false);
    }
  };

  const handleOpenRecordStudio = (track?: TrackItem) => {
    if (audioRef.current) audioRef.current.pause();
    audioSynth.stop();
    setIsPlaying(false);
    if (track) {
      if (!isFreeBeat(track) && !isPro) {
        router.push('/studio');
        return;
      }
      router.push(`/studio?beatId=${encodeURIComponent(track.id)}`);
    } else {
      router.push('/studio');
    }
  };

  // Backwards-compatible aliases
  const isSoundstageOpen = false;
  const setIsSoundstageOpen = (_val: boolean) => {};
  const handleOpenSoundstage = handleOpenRecordStudio;
  const soundstageTrack = null;

  // Table beats seeded from real database beats
  const [playlistRows, setPlaylistRows] = useState<TrackItem[]>(effectiveBeats);
  const [newReleases, setNewReleases] = useState<TrackItem[]>(effectiveBeats.slice(0, 4));
  const [producers, setProducers] = useState<ProducerItem[]>(effectiveProducers);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeListenSessionRef = useRef<string | null>(null);
  const hasTriggeredUpgradeModalRef = useRef(false);
  const pendingTrackRef = useRef<TrackItem | null>(null);
  const pendingDownloadTrackRef = useRef<TrackItem | null>(null);
  const nextAdTriggerRef = useRef<number>(2); // Spotify threshold: triggers after 2 beats, then randomly 2 or 3 beats

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

  // Global listener for subscription modal requests
  useEffect(() => {
    const handleOpenSubModal = () => setShowUpgradeModal(true);
    window.addEventListener('caution:open-subscription-modal', handleOpenSubModal);
    return () => window.removeEventListener('caution:open-subscription-modal', handleOpenSubModal);
  }, []);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Handle URL navigation tab parameter (e.g. ?tab=browse or ?tab=charts)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'marketplace' || tab === 'beats' || tab === 'browse') {
        setActiveNav('browse');
      } else if (tab === 'charts') {
        setActiveNav('charts');
      } else if (tab === 'genres') {
        setActiveNav('genres');
      } else if (tab === 'favorites' || tab === 'fav') {
        setActiveNav('fav');
      } else if (tab === 'playlists' || tab === 'later' || tab === 'history') {
        setActiveNav(tab);
      } else if (tab === 'discover' || tab === 'feed') {
        setActiveNav('feed');
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

  // Load purchased beats / licenses
  useEffect(() => {
    async function loadPurchasedBeats() {
      try {
        setLoadingPurchased(true);
        const res = await fetch('/api/library');
        if (res.ok) {
          const data = await res.json();
          if (data.items) setPurchasedBeats(data.items);
        }
      } catch (err) {
        console.warn('Could not load purchased beats:', err);
      } finally {
        setLoadingPurchased(false);
      }
    }
    loadPurchasedBeats();
  }, [activeNav]);

  // Audio timer fallback for synthesizers or audio events
  useEffect(() => {
    let interval: any;
    if (isPlaying && (!currentTrack.audioUrl || !audioRef.current)) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const limit = currentTrack.durationSeconds;
          if (prev >= limit) {
            audioSynth.stop();
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.durationSeconds, currentTrack.audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      const normalizedVol = settings.volumeNormalization ? Math.min(1, volume * 0.85) : volume;
      audioRef.current.volume = isMuted ? 0 : normalizedVol;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted, settings.volumeNormalization]);

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

  // Verify Paystack redirect payments (subscriptions or beat licenses)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const allRefs = urlParams.getAll('reference');
    const paystackRef = allRefs.find((r) => r.startsWith('CS_')) || allRefs[allRefs.length - 1] || urlParams.get('trxref') || urlParams.get('reference');
    if (paystackRef) {
      (async () => {
        try {
          const sessionRes = await supabase.auth.getSession();
          const session = sessionRes.data.session;
          const currentUserId = session?.user?.id || null;
          const currentUserEmail = session?.user?.email || null;
          const authToken = session?.access_token;

          const res = await fetch('/api/paystack/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
            },
            body: JSON.stringify({
              reference: paystackRef,
              userId: currentUserId,
              email: currentUserEmail
            })
          });

          const data = await res.json();
          if (data.verified || data.status) {
            const planTier = data.plan === 'pro' ? 'pro' : (data.plan === 'plus' || data.type === 'subscription' ? 'plus' : null);
            if (planTier === 'pro') {
              setCachedUserPlan('pro');
              setRewardNotification('🎉 Caution Pro active! Unlimited ad-free downloads and in-browser Studio unlocked.');
            } else if (planTier === 'plus') {
              setCachedUserPlan('plus');
              setRewardNotification('🎉 Caution Plus active! Monthly beats & commercial clearance unlocked.');
            } else {
              const beatName = data.beatTitle ? `"${data.beatTitle}"` : 'beat';
              const isExclusive = data.license === 'exclusive' || (data.items && data.items.some((it: any) => it.license === 'exclusive'));
              if (isExclusive && data.beatId) {
                // Immediately deactivate the exclusively purchased beat from the dashboard
                setPlaylistRows((prev) => prev.filter((b) => b.id !== data.beatId));
                setNewReleases((prev) => prev.filter((b) => b.id !== data.beatId));
                setRewardNotification(`🎉 Congratulations! You have acquired exclusive rights to ${beatName}. It is now deactivated from the public store and available in your Library.`);
              } else {
                setRewardNotification(`🎉 Payment verified via Paystack! Commercial license & master stems for ${beatName} unlocked.`);
              }
            }
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err) {
          console.error('Paystack verification error:', err);
        }
      })();
    }
  }, []);

  // Background refresh to catch any newly created beats seamlessly without flashing (filters out sold / exclusive beats)
  useEffect(() => {
    async function refreshDatabaseBeats() {
      try {
        const [beatsRes, licRes] = await Promise.all([
          supabase
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
            .order('created_at', { ascending: false }),
          supabase.from('licenses').select('beat_id, type')
        ]);

        const exclusiveIds = new Set<string>();
        if (licRes.data) {
          licRes.data.forEach((l: any) => {
            if (l.beat_id && String(l.type || '').toLowerCase().trim() === 'exclusive') {
              exclusiveIds.add(l.beat_id);
            }
          });
        }

        const dbBeats = (beatsRes.data || []).filter((b: any) => b.status === 'live' && !exclusiveIds.has(b.id));

        if (dbBeats && dbBeats.length > 0) {
          const savedCounts = localStorage.getItem('caution_beat_play_counts');
          const localCounts: Record<string, number> = savedCounts ? JSON.parse(savedCounts) : {};

          const r2Cdn = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') || 'https://media.cautionstudioz.com';

          const formatMediaUrl = (urlOrKey?: string | null): string => {
            if (!urlOrKey) return '';
            const clean = String(urlOrKey).trim();
            if (!clean) return '';
            if (clean.startsWith('/api/media/')) {
              const rawKey = clean.replace('/api/media/', '').split('?')[0];
              return `${r2Cdn}/${encodeURI(decodeURIComponent(rawKey))}`;
            }
            if (clean.startsWith('http://') || clean.startsWith('https://')) {
              if (clean.includes('/api/media/')) {
                const rawKey = clean.split('/api/media/')[1]?.split('?')[0];
                return `${r2Cdn}/${encodeURI(decodeURIComponent(rawKey))}`;
              }
              return encodeURI(decodeURI(clean));
            }
            if (clean.startsWith('/images/')) return clean;
            return `${r2Cdn}/${encodeURI(decodeURIComponent(clean.replace(/^\//, '')))}`;
          };

          const mapped: TrackItem[] = dbBeats.map((b) => {
            const audioKey = b.preview_clean_key || b.preview_tagged_key || b.master_wav_key;
            let audioUrl = formatMediaUrl(audioKey);
            if (!audioUrl) {
              audioUrl = `${r2Cdn}/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3`;
            }

            const previewCleanUrl = formatMediaUrl(b.preview_clean_key) || audioUrl;
            const previewTaggedUrl = formatMediaUrl(b.preview_tagged_key) || audioUrl;
            const masterUrl = formatMediaUrl(b.master_wav_key) || audioUrl;

            let coverUrl = formatMediaUrl(b.cover_url);
            if (!coverUrl) coverUrl = '/images/album_neon_dj.jpg';

            const basicLic = b.licenses?.find((l: any) => l.type === 'basic') || b.beat_licenses?.find((l: any) => l.type === 'basic');
            const premiumLic = b.licenses?.find((l: any) => l.type === 'premium') || b.beat_licenses?.find((l: any) => l.type === 'premium');
            const exclusiveLic = b.licenses?.find((l: any) => l.type === 'exclusive') || b.beat_licenses?.find((l: any) => l.type === 'exclusive');
            const beatTags: string[] = Array.isArray(b.tags) ? b.tags : [];

            const hasPaidPremium = Boolean(premiumLic && premiumLic.enabled !== false && Number(premiumLic.price_cents) > 100);
            const hasPaidExclusive = Boolean(exclusiveLic && exclusiveLic.enabled !== false && Number(exclusiveLic.price_cents) > 100);
            const hasPaidBasic = Boolean(basicLic && basicLic.enabled !== false && Number(basicLic.price_cents) > 100);

            // A beat is a Paid Beat if it has an enabled paid license
            const isPaidBeat = hasPaidPremium || hasPaidExclusive || hasPaidBasic;
            const isFreeBeatItem = !isPaidBeat;

            const premiumPriceNgn = hasPaidPremium
              ? Math.round(premiumLic.price_cents / 100)
              : (hasPaidExclusive ? Math.max(30000, Math.round(exclusiveLic.price_cents / 100 * 0.25)) : 0);

            const exclusivePriceNgn = hasPaidExclusive
              ? Math.round(exclusiveLic.price_cents / 100)
              : 0;

            const basicPriceNgn = hasPaidBasic
              ? Math.round(basicLic.price_cents / 100)
              : 0;

            const priceNgn = isFreeBeatItem ? 0 : (premiumPriceNgn || basicPriceNgn || exclusivePriceNgn);
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
              coverUrl,
              category: isFreeBeatItem ? 'free' : 'playlists',
              audioUrl,
              previewCleanUrl,
              previewTaggedUrl,
              masterUrl,
              bpm: b.bpm || 120,
              genre: b.genre || 'Electronic',
              musicalKey: b.musical_key || 'C Minor',
              priceNgn,
              premiumPriceNgn,
              exclusivePriceNgn,
              isFree: isFreeBeatItem,
              tags: beatTags,
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

  const executePlayTrack = (track: TrackItem) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    hasTriggeredUpgradeModalRef.current = false;
    setCurrentTime(0);
    recordListeningHistory(track);

    // Record play count for this newly started song
    activeListenSessionRef.current = track.id;
    recordTrackListen(track);

    const targetAudioSrc = resolveAudioForQuality(track, settings.audioQuality);
    const targetVol = isMuted ? 0 : (settings.volumeNormalization ? Math.min(1, volume * 0.85) : volume);

    if (audioRef.current) {
      if (targetAudioSrc) {
        audioRef.current.src = targetAudioSrc;
        audioRef.current.volume = targetVol;
        audioRef.current.load();

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name !== 'AbortError') {
              console.warn('Audio playback error on primary source, attempting fallback:', err);
              // Fallback to proxy route if CDN was blocked or had network error
              if (audioRef.current && track.audioUrl && !audioRef.current.src.includes('/api/media/')) {
                const audioKey = track.audioUrl.split('.com/')[1] || track.audioUrl;
                audioRef.current.src = `/api/media/${audioKey}`;
                audioRef.current.load();
                audioRef.current.play().catch(() => {
                  audioSynth.playTrack(track.id, () => {});
                });
              } else {
                audioSynth.playTrack(track.id, () => {});
              }
            }
          });
        }
      } else {
        audioRef.current.pause();
        audioSynth.playTrack(track.id, () => {});
      }
    } else if (!targetAudioSrc) {
      audioSynth.playTrack(track.id, () => {});
    }
  };

  const handlePlayToggle = (track: TrackItem) => {
    // 1. Immediately stop any active synth
    audioSynth.stop();

    // Active subscription check: users must have an active subscription (Caution Plus ₦3k or Pro ₦10k) to play beats
    if (!isSubscribed) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setShowUpgradeModal(true);
      return;
    }

    if (currentTrack.id === track.id) {
      if (isPlaying) {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const isNewAudition = activeListenSessionRef.current !== track.id;

        // Spotify-style audio ad check: triggers after playing 2 beats or more (pro tier is 100% ad-free)
        // Ensure user's very first song of a visit is never blocked by an ad
        if (!isPro && songsPlayedCount > 0 && isNewAudition && songsPlayedSinceLastAd >= nextAdTriggerRef.current) {
          setSongsPlayedSinceLastAd(0);
          try { sessionStorage.setItem('caution:beats-played-since-ad', '0'); } catch (e) {}
          nextAdTriggerRef.current = Math.random() < 0.5 ? 2 : 3;

          setIsPlaying(false);
          pendingTrackRef.current = track;
          setAdModalType('listening');
          setIsAdModalOpen(true);
          return;
        }

        setIsPlaying(true);
        hasTriggeredUpgradeModalRef.current = false;
        recordListeningHistory(track);

        // Record play count if this is a new listening audition session
        if (isNewAudition) {
          activeListenSessionRef.current = track.id;
          recordTrackListen(track);
          const nextPlayed = songsPlayedSinceLastAd + 1;
          setSongsPlayedSinceLastAd(nextPlayed);
          setSongsPlayedCount((prev) => prev + 1);
          try { sessionStorage.setItem('caution:beats-played-since-ad', String(nextPlayed)); } catch (e) {}
        }

        const targetAudioSrc = resolveAudioForQuality(track, settings.audioQuality);
        const targetVol = isMuted ? 0 : (settings.volumeNormalization ? Math.min(1, volume * 0.85) : volume);

        if (targetAudioSrc && audioRef.current) {
          if (audioRef.current.src !== targetAudioSrc && !audioRef.current.src.endsWith(targetAudioSrc)) {
            audioRef.current.src = targetAudioSrc;
            audioRef.current.load();
          }
          audioRef.current.volume = targetVol;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              if (err.name !== 'AbortError') {
                console.warn('Audio playback error on resume:', err);
                audioSynth.playTrack(track.id, () => {});
              }
            });
          }
        } else {
          audioSynth.playTrack(track.id, () => {});
        }
      }
    } else {
      // 2. Switching to a completely different track: Stop previous audio immediately
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioSynth.stop();

      // Spotify-style audio ad: first 15 seconds unskippable, triggers randomly after playing 2 beats or more (pro is 100% ad-free)
      // Never block on the first song audition of a visit
      if (!isPro && songsPlayedCount > 0 && songsPlayedSinceLastAd >= nextAdTriggerRef.current) {
        // Reset count and choose a new random interval (2 or 3 songs) for the next ad
        setSongsPlayedSinceLastAd(0);
        try { sessionStorage.setItem('caution:beats-played-since-ad', '0'); } catch (e) {}
        nextAdTriggerRef.current = Math.random() < 0.5 ? 2 : 3;

        // Hold the intended track, stop music playback, and open the ad modal
        setIsPlaying(false);
        pendingTrackRef.current = track;
        setAdModalType('listening');
        setIsAdModalOpen(true);
        return; // DO NOT PLAY THE INTENDED SONG! THE AD PLAYS INSTEAD!
      }

      const nextPlayed = songsPlayedSinceLastAd + 1;
      setSongsPlayedSinceLastAd(nextPlayed);
      setSongsPlayedCount((prev) => prev + 1);
      try { sessionStorage.setItem('caution:beats-played-since-ad', String(nextPlayed)); } catch (e) {}

      executePlayTrack(track);
    }
  };

  const handleRowSeek = (ratio: number) => {
    const targetSec = Math.round(Math.max(0, Math.min(1, ratio)) * currentTrack.durationSeconds);
    setCurrentTime(targetSec);
    if (audioRef.current) {
      audioRef.current.currentTime = targetSec;
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

  const handleDownload = async (track: TrackItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!track) return;

    // Active subscription check: users must have an active subscription (Caution Plus ₦3k or Pro ₦10k) to download beats
    if (!isSubscribed) {
      setShowUpgradeModal(true);
      return;
    }

    // Check if beat is paid (locked behind individual purchase)
    const isPaid = !isFreeBeat(track);
    if (isPaid && !isSubscribed) {
      setPaidBeatPurchaseTrack(track);
      setRewardNotification('Downloads are locked for paid beats. Purchase a license to download WAV master & stems.');
      return;
    }

    // Check daily download allowance (5 base for Pro subscribers, 2 base for Free tier + ad bonuses)
    const quotaState = getDailyDownloadState(isPro);
    if (!quotaState.canDownload) {
      pendingDownloadTrackRef.current = track;
      setIsDownloadLimitModalOpen(true);
      return;
    }

    setDownloadingId(track.id);
    setPlaylistRows((prev) =>
      prev.map((b) => (b.id === track.id ? { ...b, downloadCount: (b.downloadCount || 0) + 1 } : b))
    );
    const newQuota = recordBeatDownload(track.id, track.title, isPro);
    setDownloadToast({
      title: track.title,
      artist: track.artist,
      remaining: newQuota.remaining,
      bonusUsed: quotaState.bonus > 0 && quotaState.used >= quotaState.baseLimit
    });

    // Record beat download in Supabase database for creator threshold & royalty tracking
    fetch('/api/beats/listen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beatId: track.id, action: 'download' })
    }).catch((err) => {
      console.warn('Could not sync download count to backend:', err);
    });

    try {
      const safeTitle = (track.title || 'track').replace(/[/\\?%*:|"<>#]/g, '').trim();
      const safeArtist = (track.artist || 'Caution Studio').replace(/[/\\?%*:|"<>#]/g, '').trim();

      // Detect correct file extension from audio source (mp3, wav, etc.)
      const sourceUrl = track.audioUrl || track.masterUrl || track.previewCleanUrl || '';
      const extMatch = sourceUrl.match(/\.(mp3|wav|flac|aac|m4a|zip)(\?.*)?$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : (sourceUrl.includes('.wav') ? 'wav' : 'mp3');
      const filename = `${safeTitle} - ${safeArtist}.${ext}`;

      // Extract raw R2 key so we route through /api/media with proper ResponseContentDisposition
      let mediaKey = '';
      if (sourceUrl.includes('media.cautionstudioz.com/')) {
        mediaKey = sourceUrl.split('media.cautionstudioz.com/')[1]?.split('?')[0];
      } else if (sourceUrl.includes('/api/media/')) {
        mediaKey = sourceUrl.split('/api/media/')[1]?.split('?')[0];
      } else if (sourceUrl.startsWith('http')) {
        mediaKey = sourceUrl.split('?')[0].replace(/^https?:\/\/[^/]+\//, '');
      } else {
        mediaKey = sourceUrl || `masters/${track.id}.${ext}`;
      }

      // Ensure media key is properly encoded for spaces and special characters
      const encodedMediaKey = mediaKey.split('/').map(encodeURIComponent).join('/');
      const downloadEndpoint = `/api/media/${encodedMediaKey}?download=1&filename=${encodeURIComponent(filename)}`;

      // Detect iOS Safari / WebKit: blob: URLs cannot be loaded by iOS AVPlayer in standalone tabs
      // which results in the crossed-out play icon if the user clicks "View".
      // Navigating directly to downloadEndpoint allows iOS Safari to either save to Files or
      // view/stream with native QuickTime/AVPlayer support.
      const isIOS = typeof navigator !== 'undefined' && (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      );

      if (isIOS) {
        window.location.href = downloadEndpoint;
      } else {
        const link = document.createElement('a');
        link.href = downloadEndpoint;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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

  // Redesign Right Sidebar: Real Top Producers from live database beats and creator profiles
  const topProducersList = useMemo(() => {
    const realProducersMap = new Map<
      string,
      { name: string; beatsCount: string; coverUrl: string; handle: string; count: number }
    >();

    // 1. Group from loaded playlistRows (real database beats)
    playlistRows.forEach((b) => {
      const artistName = (b.artist || '').trim();
      if (artistName && artistName.toLowerCase() !== 'caution studio') {
        const key = artistName.toLowerCase();
        const existing = realProducersMap.get(key);
        if (existing) {
          existing.count += 1;
          existing.beatsCount = `${existing.count} ${existing.count === 1 ? 'beat' : 'beats'}`;
        } else {
          realProducersMap.set(key, {
            name: artistName,
            beatsCount: '1 beat',
            coverUrl: b.coverUrl || '/images/african_producer_beats.jpg',
            handle: b.subscribers?.replace(/^@/, '') || artistName.toLowerCase().replace(/\s+/g, ''),
            count: 1
          });
        }
      }
    });

    // 2. Merge with server-provided producer profiles
    (producers || []).forEach((p) => {
      const pName = (p.name || '').trim();
      if (pName && !pName.toLowerCase().includes('admin') && pName.toLowerCase() !== 'caution producer') {
        const key = pName.toLowerCase();
        const count = playlistRows.filter((b) => b.artist?.toLowerCase() === key).length;
        const existing = realProducersMap.get(key);
        if (existing) {
          if (p.coverUrl && !p.coverUrl.includes('placeholder')) existing.coverUrl = p.coverUrl;
          if (p.handle) existing.handle = p.handle;
          if (count > existing.count) {
            existing.count = count;
            existing.beatsCount = `${count} ${count === 1 ? 'beat' : 'beats'}`;
          }
        } else {
          realProducersMap.set(key, {
            name: pName,
            beatsCount: `${count > 0 ? count : 1} ${count === 1 ? 'beat' : 'beats'}`,
            coverUrl: p.coverUrl || '/images/african_producer_beats.jpg',
            handle: p.handle || pName.toLowerCase().replace(/\s+/g, ''),
            count: count > 0 ? count : 1
          });
        }
      }
    });

    const list = Array.from(realProducersMap.values()).sort((a, b) => b.count - a.count);
    return list;
  }, [producers, playlistRows]);

  // Redesign Right Sidebar: This Week's Charts
  const thisWeeksCharts = useMemo(() => {
    const sorted = [...playlistRows].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    return sorted.slice(0, 3);
  }, [playlistRows]);

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

  // Search, genre, bpm, and price filtered rows with sorting
  const filteredRows = useMemo(() => {
    let rows = [...playlistRows];

    if (selectedGenre && selectedGenre !== 'All' && selectedGenre !== 'All Genres') {
      const normSelected = selectedGenre.toLowerCase().replace(/s$/, '').trim();
      rows = rows.filter((r) => {
        const trackGenre = (r.genre || '').toLowerCase().replace(/s$/, '').trim();
        return (
          trackGenre === normSelected ||
          trackGenre.includes(normSelected) ||
          normSelected.includes(trackGenre) ||
          (Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase().replace(/s$/, '').includes(normSelected)))
        );
      });
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

    if (bpmFilter === 'slow') {
      rows = rows.filter((r) => (r.bpm || 120) < 100);
    } else if (bpmFilter === 'mid') {
      rows = rows.filter((r) => (r.bpm || 120) >= 100 && (r.bpm || 120) <= 130);
    } else if (bpmFilter === 'fast') {
      rows = rows.filter((r) => (r.bpm || 120) > 130);
    }

    if (priceFilter === 'free') {
      rows = rows.filter((r) => isFreeBeat(r));
    } else if (priceFilter === 'paid') {
      rows = rows.filter((r) => !isFreeBeat(r));
    }

    if (sortOption === 'popular') {
      rows.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    } else if (sortOption === 'latest') {
      rows.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    } else if (sortOption === 'price_low') {
      rows.sort((a, b) => (a.priceNgn || 0) - (b.priceNgn || 0));
    } else if (sortOption === 'price_high') {
      rows.sort((a, b) => (b.priceNgn || 0) - (a.priceNgn || 0));
    }

    return rows;
  }, [playlistRows, selectedGenre, searchQuery, bpmFilter, priceFilter, sortOption]);

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
    <div className="h-screen w-full max-w-[100vw] overflow-hidden bg-[#111214] text-[#eceef2] flex flex-col font-sans selection:bg-[#2bbbad] selection:text-black">
      {/* HTML5 Audio Element for Real Streaming from Cloudflare R2 & Database */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        {...({ disableRemotePlayback: true } as React.AudioHTMLAttributes<HTMLAudioElement>)}
        onContextMenu={(e) => e.preventDefault()}
        onPlay={() => {
          audioSynth.stop();
        }}
        onPlaying={() => {
          audioSynth.stop();
        }}
        onTimeUpdate={(e) => {
          const sec = e.currentTarget.currentTime;
          const isPaid = !isFreeBeat(currentTrack);

          // Crossfade: smoothly fade out volume as track nears end
          if (settings.crossfadeSeconds > 0 && currentTrack.durationSeconds > 0 && audioRef.current && !isMuted) {
            const timeLeft = currentTrack.durationSeconds - sec;
            if (timeLeft <= settings.crossfadeSeconds && timeLeft >= 0) {
              const fadeRatio = Math.max(0, timeLeft / settings.crossfadeSeconds);
              const targetVol = settings.volumeNormalization ? Math.min(1, volume * 0.85) : volume;
              audioRef.current.volume = targetVol * fadeRatio;
            }
          }

          // Audio watermark anti-rip protection: watermark pulse at 10s and 22s during paid preview
          if (isPaid && !isSubscribed) {
            const roundedSec = Math.floor(sec);
            if (roundedSec === 10 || roundedSec === 22) {
              audioSynth.playPreviewWatermark();
            }
          }

          // If track reaches 20 seconds and hasn't been counted for this session, store the count
          if (sec >= 20 && activeListenSessionRef.current !== currentTrack.id) {
            activeListenSessionRef.current = currentTrack.id;
            recordTrackListen(currentTrack);
          }

          setCurrentTime(Math.floor(sec));
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          activeListenSessionRef.current = null;

          // Check user's Autoplay setting: if disabled, stop playback completely
          if (!settings.autoplay) {
            return;
          }

          // Autoplay enabled: find harmonically matched beat using Camelot Wheel
          const harmonicNext = findHarmonicallyMatchedBeat(currentTrack, playlistRows);
          if (harmonicNext) {
            handlePlayToggle(harmonicNext);
          } else {
            const currentIndex = playlistRows.findIndex((r) => r.id === currentTrack.id);
            if (currentIndex !== -1 && playlistRows.length > 0) {
              const nextIndex = (currentIndex + 1) % playlistRows.length;
              if (playlistRows[nextIndex]) {
                handlePlayToggle(playlistRows[nextIndex]);
              }
            }
          }
        }}
        onError={(err) => {
          const target = err.currentTarget;
          if (target.error && target.error.code === 1) return; // Media aborted by user navigation
          console.warn('Real audio stream error:', err);
        }}
      />

      {/* 1. TOP HEADER - REUSABLE UNIFIED HEADER */}
      <UserHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 bg-[#121316] h-full flex flex-col p-4 border-r border-white/10 shadow-2xl">
            <UserSidebar
              activeNav={activeNav}
              onNavigate={(id) => {
                setMobileMenuOpen(false);
                if (id === 'discover') setActiveNav('feed');
                else if (['browse', 'charts', 'genres', 'playlists', 'fav', 'history'].includes(id)) {
                  setActiveNav(id);
                }
              }}
              favoritesCount={favoritesList.length}
              onOpenStudio={() => {
                setMobileMenuOpen(false);
                handleOpenRecordStudio();
              }}
              userProfile={userProfile}
              onItemClick={() => setMobileMenuOpen(false)}
              className="!flex w-full border-r-0 p-0"
            />
          </div>
        </div>
      )}

      {/* 2. BODY CONTENT (3-COLUMN MARKETPLACE LAYOUT) */}
      <div className="flex-1 flex w-full max-w-full min-w-0 overflow-hidden relative pb-[72px]">
        {/* REUSABLE UNIFIED USER SIDEBAR */}
        <UserSidebar
          activeNav={activeNav}
          onNavigate={(id) => {
            if (id === 'discover') setActiveNav('feed');
            else if (['browse', 'charts', 'genres', 'playlists', 'fav', 'history'].includes(id)) {
              setActiveNav(id);
            }
          }}
          favoritesCount={favoritesList.length}
          onOpenStudio={() => handleOpenRecordStudio()}
          userProfile={userProfile}
        />

        {/* CENTER MAIN VIEW */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-24 overflow-y-auto min-w-0 max-w-full space-y-5 sm:space-y-6 bg-[#111214]">
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
                <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-2">
                  {favoritesList.map((row) => {
                    const isCurrent = currentTrack.id === row.id;
                    const isFree = isFreeBeat(row);
                    return (
                      <TrackRow
                        key={'fav-' + row.id}
                        track={row}
                        variant="dark"
                        isCurrent={isCurrent}
                        isPlaying={isCurrent && isPlaying}
                        currentTime={isCurrent ? currentTime : 0}
                        isFavorited={true}
                        isListenLater={listenLaterIds.includes(row.id)}
                        isDownloading={downloadingId === row.id}
                        isDownloadLocked={!isFree}
                        onPlayToggle={handlePlayToggle}
                        onSeek={handleRowSeek}
                        onDownload={(t, e) => handleDownload(t, e)}
                        onLockedDownloadClick={(t) => setPaidBeatPurchaseTrack(t)}
                        onFavoriteToggle={(t) => toggleLike(t.id)}
                        onListenLaterToggle={(t) => toggleListenLater(t)}
                      />
                    );
                  })}
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
                <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-2">
                  {listenLaterList.map((row) => {
                    const isCurrent = currentTrack.id === row.id;
                    const isFree = isFreeBeat(row);
                    return (
                      <TrackRow
                        key={'later-' + row.id}
                        track={row}
                        variant="dark"
                        isCurrent={isCurrent}
                        isPlaying={isCurrent && isPlaying}
                        currentTime={isCurrent ? currentTime : 0}
                        isFavorited={Boolean(row.isLiked || likedTrackIds.includes(row.id))}
                        isListenLater={true}
                        isDownloading={downloadingId === row.id}
                        isDownloadLocked={!isFree}
                        onPlayToggle={handlePlayToggle}
                        onSeek={handleRowSeek}
                        onDownload={(t, e) => handleDownload(t, e)}
                        onLockedDownloadClick={(t) => setPaidBeatPurchaseTrack(t)}
                        onFavoriteToggle={(t) => toggleLike(t.id)}
                        onListenLaterToggle={(t) => toggleListenLater(t)}
                      />
                    );
                  })}
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
                <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-2">
                  {listeningHistory.map((item, idx) => {
                    const row = item.track;
                    const isCurrent = currentTrack.id === row.id;
                    const isFree = isFreeBeat(row);
                    return (
                      <TrackRow
                        key={'hist-' + row.id + '-' + idx}
                        track={row}
                        variant="dark"
                        isCurrent={isCurrent}
                        isPlaying={isCurrent && isPlaying}
                        currentTime={isCurrent ? currentTime : 0}
                        isFavorited={Boolean(row.isLiked || likedTrackIds.includes(row.id))}
                        isListenLater={listenLaterIds.includes(row.id)}
                        isDownloading={downloadingId === row.id}
                        isDownloadLocked={!isFree}
                        subtitleOverride={`${row.artist} • ${row.genre || 'Afrobeats'} · ${item.listenedAt}`}
                        onPlayToggle={handlePlayToggle}
                        onSeek={handleRowSeek}
                        onDownload={(t, e) => handleDownload(t, e)}
                        onLockedDownloadClick={(t) => setPaidBeatPurchaseTrack(t)}
                        onFavoriteToggle={(t) => toggleLike(t.id)}
                        onListenLaterToggle={(t) => toggleListenLater(t)}
                      />
                    );
                  })}
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
              currentTime={currentTime}
              onSeek={handleRowSeek}
              handlePlayToggle={handlePlayToggle}
              likedTrackIds={likedTrackIds}
              toggleLike={toggleLike}
              listenLaterIds={listenLaterIds}
              toggleListenLater={toggleListenLater}
              handleDownload={handleDownload}
              downloadingId={downloadingId}
              onOpenRecordStudio={handleOpenRecordStudio}
              onOpenSoundstage={handleOpenRecordStudio}
              onTriggerAd={() => setIsAdModalOpen(true)}
              bonusDownloads={downloadQuota.bonus}
              remainingDownloads={downloadQuota.remaining}
            />
          ) : activeNav === 'purchased' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-white tracking-tight">My Purchased Beats</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#e53935]/15 text-[#e53935] border border-[#e53935]/30">
                      {purchasedBeats.length} {purchasedBeats.length === 1 ? 'License' : 'Licenses'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Access your uncompressed 24-bit Master WAV files, multi-track Stems (.ZIP), and official PDF license certificates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveNav('discover')}
                  className="px-4 py-2 rounded-full bg-[#16181d] hover:bg-white/[0.06] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Browse Beat Store
                </button>
              </div>

              {loadingPurchased ? (
                <div className="p-12 text-center rounded-2xl bg-[#121316] border border-white/[0.06] space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-[#e53935] border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-gray-400">Loading your licensed beats...</p>
                </div>
              ) : purchasedBeats.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#121316] border border-white/[0.06] space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#e53935]/10 text-[#e53935] flex items-center justify-center mx-auto">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">No purchased beats yet</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Explore the marketplace to lease beats, download uncompressed master WAVs, and unlock trackout stems.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav('discover')}
                    className="px-5 py-2.5 rounded-full bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-bold transition-all shadow-lg shadow-[#e53935]/20 cursor-pointer"
                  >
                    Browse Trending Beats
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchasedBeats.map((item) => {
                    const beat = item.beat || {};
                    const producerName = beat.producer?.display_name || beat.producer?.name || item.producer || 'Studio Producer';
                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl bg-[#121316] border border-white/[0.06] hover:border-white/15 transition-all space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative group">
                              <img
                                src={beat.cover_url || beat.coverUrl || '/images/studio_mixing_console.jpg'}
                                alt={beat.title || 'Beat'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-white">{beat.title || 'Untitled Beat'}</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#e53935]/15 text-[#e53935] border border-[#e53935]/30">
                                  {item.type || 'Premium Beat Plan'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                By {producerName} · {beat.genre || 'Afrobeats'} · {beat.bpm || 110} BPM
                              </p>
                              <p className="text-[11px] font-mono text-gray-500 mt-1">
                                Ref: {item.licenseNumber || 'lic-' + (item.id || '').slice(0, 8)} · Purchased {item.issuedDate}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            {item.masterWavUrl ? (
                              <a
                                href={item.masterWavUrl}
                                download
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold border border-white/10 transition-colors"
                              >
                                <Download className="h-3.5 w-3.5 text-[#e53935]" />
                                <span>Download WAV</span>
                              </a>
                            ) : null}

                            {item.stemsZipUrl ? (
                              <a
                                href={item.stemsZipUrl}
                                download
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold border border-white/10 transition-colors"
                              >
                                <Download className="h-3.5 w-3.5 text-[#e53935]" />
                                <span>Stems (.ZIP)</span>
                              </a>
                            ) : null}

                            {item.agreementPdfKey ? (
                              <a
                                href={item.agreementPdfKey}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-transparent hover:bg-white/[0.05] text-gray-300 hover:text-white text-xs font-medium border border-white/[0.08] transition-colors"
                              >
                                <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                                <span>PDF License</span>
                              </a>
                            ) : null}
                          </div>
                        </div>

                        {/* Stream Cap Progress Bar */}
                        <div className="pt-2 border-t border-white/[0.04]">
                          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mb-1.5">
                            <span>Stream cap</span>
                            <span>
                              {item.streamCap
                                ? `${(item.streamsUsed || 0).toLocaleString()} / ${item.streamCap.toLocaleString()} streams`
                                : 'Unlimited Streams'}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#e53935] rounded-full"
                              style={{
                                width: item.streamCap
                                  ? `${Math.min(100, ((item.streamsUsed || 0) / item.streamCap) * 100)}%`
                                  : '100%'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeNav === 'browse' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Browse Beats</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Explore high-quality beats, filter by BPM, musical key, or price.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    aria-label="Sort beats order"
                    className="bg-[#16181d] border border-white/[0.08] text-gray-300 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#e53935] cursor-pointer"
                  >
                    <option value="popular">Most popular</option>
                    <option value="latest">Latest uploads</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Genre Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['All', 'Afrobeats', 'Hip-Hop', 'R&B', 'Drill', 'Amapiano', 'Trap', 'Pop', 'Electronic'].map((genre) => {
                  const isActive = selectedGenre.toLowerCase() === genre.toLowerCase();
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#e53935] text-white shadow-md shadow-[#e53935]/25'
                          : 'bg-[#16181d] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>

              {/* Grid of Marketplace Beat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRows.map((beat) => (
                  <MarketplaceBeatCard
                    key={beat.id}
                    track={beat}
                    isCurrent={currentTrack.id === beat.id}
                    isPlaying={currentTrack.id === beat.id && isPlaying}
                    isLiked={Boolean(beat.isLiked || likedTrackIds.includes(beat.id))}
                    onPlayToggle={handlePlayToggle}
                    onLikeToggle={(id: string) => toggleLike(id)}
                    onLicenseClick={(t: TrackItem) => setPaidBeatPurchaseTrack(t)}
                    onDownloadClick={(t: TrackItem) => handleDownload(t)}
                  />
                ))}
              </div>
            </div>
          ) : activeNav === 'charts' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    <h2 className="text-2xl font-black text-white tracking-tight">Top Charts</h2>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    The most streamed and acquired instrumentals across Caution Studio.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {mostListenedBeats.map((track, idx) => {
                  const isThisPlaying = isPlaying && currentTrack.id === track.id;
                  const isFree = isFreeBeat(track);
                  return (
                    <div
                      key={track.id}
                      onClick={() => handlePlayToggle(track)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#121316] border border-white/[0.04] hover:border-white/15 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className={`text-xl font-black font-mono w-6 text-center shrink-0 ${idx === 0 ? 'text-[#e53935]' : 'text-gray-500'}`}>
                          {idx + 1}
                        </span>

                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {isThisPlaying ? <Pause className="h-4 w-4 fill-white text-white" /> : <Play className="h-4 w-4 fill-white text-white ml-0.5" />}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isThisPlaying ? 'text-[#e53935]' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span className="truncate">{track.artist}</span>
                            <span>•</span>
                            <span>{track.genre}</span>
                            <span>•</span>
                            <span>{track.bpm || 110} BPM</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono font-semibold text-gray-400">
                          {(track.playCount || 0).toLocaleString()} plays
                        </span>
                        {isFree ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            FREE
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaidBeatPurchaseTrack(track);
                            }}
                            className="px-3.5 py-1 rounded-full text-xs font-bold font-mono bg-[#e53935] hover:bg-[#d32f2f] text-white transition-colors cursor-pointer"
                          >
                            ₦{(track.premiumPriceNgn || track.priceNgn || 50000).toLocaleString()}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeNav === 'genres' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Explore Genres</h2>
                  <p className="text-xs text-gray-400 mt-1">Select a genre category to discover tailored productions.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Afrobeats', count: '140+ beats', img: '/images/studio_mixing_console.jpg' },
                  { name: 'Hip-Hop', count: '95+ beats', img: '/images/album_neon_dj.jpg' },
                  { name: 'R&B', count: '70+ beats', img: '/images/artist_studio_mic.jpg' },
                  { name: 'Drill', count: '55+ beats', img: '/images/cinematic_hero_tunnel.jpg' },
                  { name: 'Amapiano', count: '85+ beats', img: '/images/african_producer_beats.jpg' },
                  { name: 'Trap', count: '65+ beats', img: '/images/album_sunrise.jpg' },
                  { name: 'Pop', count: '45+ beats', img: '/images/golden_clef.jpg' },
                  { name: 'Electronic', count: '40+ beats', img: '/images/diamond_playlist_art.jpg' }
                ].map((cat) => (
                  <div
                    key={cat.name}
                    onClick={() => {
                      setSelectedGenre(cat.name);
                      setActiveNav('discover');
                    }}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06] hover:border-white/20 transition-all"
                  >
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-base font-bold text-white group-hover:text-[#e53935] transition-colors">{cat.name}</h3>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">{cat.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedProducer ? (
            <div className="space-y-6">
              {/* Producer Header Banner */}
              <div className="relative rounded-2xl overflow-hidden bg-[#121316] border border-white/[0.06] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#e53935] shrink-0 shadow-lg shadow-[#e53935]/20">
                    <img src={selectedProducer.coverUrl} alt={selectedProducer.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{selectedProducer.name}</h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#e53935]/15 text-[#e53935] border border-[#e53935]/30">
                        VERIFIED PRODUCER
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      @{selectedProducer.handle} · Creator Catalog · {producerUploads.length} {producerUploads.length === 1 ? 'beat' : 'beats'} uploaded
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProducer(null)}
                  className="px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
                >
                  <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                  <span>Back to all beats</span>
                </button>
              </div>

              {/* Producer Uploads Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    All beats by {selectedProducer.name}
                  </h2>
                  <span className="text-xs font-mono font-bold text-gray-400">
                    {producerUploads.length} tracks
                  </span>
                </div>

                {loadingProducerUploads ? (
                  <div className="p-12 text-center rounded-2xl bg-[#121316] border border-white/[0.04] space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-[#e53935] border-t-transparent animate-spin mx-auto" />
                    <p className="text-xs text-gray-400">Fetching all uploads by {selectedProducer.name}...</p>
                  </div>
                ) : producerUploads.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl bg-[#121316] border border-white/[0.04] space-y-3">
                    <p className="text-sm font-semibold text-white">No beats found for {selectedProducer.name}.</p>
                    <button
                      type="button"
                      onClick={() => setSelectedProducer(null)}
                      className="px-4 py-2 rounded-full bg-[#e53935] text-white text-xs font-bold hover:bg-[#d32f2f] transition-colors cursor-pointer"
                    >
                      Browse Marketplace
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {producerUploads.map((beat) => (
                      <MarketplaceBeatCard
                        key={beat.id}
                        track={beat}
                        isCurrent={currentTrack.id === beat.id}
                        isPlaying={currentTrack.id === beat.id && isPlaying}
                        isLiked={Boolean(beat.isLiked || likedTrackIds.includes(beat.id))}
                        onPlayToggle={handlePlayToggle}
                        onLikeToggle={(id: string) => toggleLike(id)}
                        onLicenseClick={(t: TrackItem) => setPaidBeatPurchaseTrack(t)}
                        onDownloadClick={(t: TrackItem) => handleDownload(t)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* 1. EDITORIAL HERO BANNER */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-[#121316] border border-white/[0.06] min-h-[220px] sm:min-h-[260px] flex items-center p-6 sm:p-10">
                <img
                  src="/images/studio_mixing_console.jpg"
                  alt="Studio Console"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e12]/95 via-[#0d0e12]/80 to-black/30" />

                <div className="relative z-10 max-w-xl space-y-3">
                  <span className="text-[11px] font-mono font-medium tracking-wider text-gray-400 uppercase">
                    — THE SOUND OF THE WEEK
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    Find your next sound.
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-300 font-normal">
                    Beats made for what you&apos;re creating.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveNav('browse')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-bold transition-all shadow-lg shadow-[#e53935]/25 cursor-pointer"
                    >
                      <span>Explore featured beats</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. GENRE SHORTCUTS */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['Afrobeats', 'Hip-Hop', 'R&B', 'Drill', 'Amapiano', 'Trap', 'Pop', 'Electronic'].map((genre) => {
                  const isActive = selectedGenre.toLowerCase() === genre.toLowerCase();
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setSelectedGenre(isActive ? 'All' : genre)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white/[0.12] text-white border border-white/20'
                          : 'bg-[#16181d] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>

              {/* 3. TRENDING BEATS */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-white tracking-tight">Trending beats</h2>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as any)}
                      aria-label="Sort trending beats"
                      className="bg-[#16181d] border border-white/[0.08] text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#e53935] cursor-pointer"
                    >
                      <option value="popular">Most popular</option>
                      <option value="latest">Latest uploads</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setBpmFilter(bpmFilter === 'all' ? 'mid' : 'all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                        bpmFilter !== 'all' ? 'bg-[#e53935]/15 border-[#e53935]/40 text-[#e53935]' : 'bg-[#16181d] border-white/[0.08] text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>BPM</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setKeyFilter(keyFilter === 'all' ? 'C maj' : 'all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                        keyFilter !== 'all' ? 'bg-[#e53935]/15 border-[#e53935]/40 text-[#e53935]' : 'bg-[#16181d] border-white/[0.08] text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>Key</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPriceFilter(priceFilter === 'all' ? 'paid' : 'all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                        priceFilter !== 'all' ? 'bg-[#e53935]/15 border-[#e53935]/40 text-[#e53935]' : 'bg-[#16181d] border-white/[0.08] text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>Price</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {filteredRows.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl bg-[#121316] border border-white/[0.04] space-y-3">
                    <p className="text-sm font-semibold text-white">No tracks match your current filters.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGenre('All');
                        setBpmFilter('all');
                        setPriceFilter('all');
                        setKeyFilter('all');
                      }}
                      className="px-4 py-2 rounded-full bg-[#e53935] text-white text-xs font-bold hover:bg-[#d32f2f] transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredRows.slice(0, 9).map((beat) => (
                      <MarketplaceBeatCard
                        key={beat.id}
                        track={beat}
                        isCurrent={currentTrack.id === beat.id}
                        isPlaying={currentTrack.id === beat.id && isPlaying}
                        isLiked={Boolean(beat.isLiked || likedTrackIds.includes(beat.id))}
                        onPlayToggle={handlePlayToggle}
                        onLikeToggle={(id: string) => toggleLike(id)}
                        onLicenseClick={(t: TrackItem) => setPaidBeatPurchaseTrack(t)}
                        onDownloadClick={(t: TrackItem) => handleDownload(t)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 4. FEATURED PRODUCERS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white tracking-tight">Featured producers</h2>
                  <button
                    type="button"
                    onClick={() => setActiveNav('browse')}
                    className="text-xs font-semibold text-[#e53935] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>See all</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {topProducersList.map((producer) => (
                    <div
                      key={producer.handle || producer.name}
                      onClick={() => handleSelectProducer(producer)}
                      className="p-3 rounded-2xl bg-[#121316] border border-white/[0.04] hover:border-white/15 transition-all text-center cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-black/40 border border-white/10 mx-auto mb-2.5 relative">
                        <img
                          src={producer.coverUrl}
                          alt={producer.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-xs font-bold text-white truncate">{producer.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{producer.beatsCount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>

        {/* RIGHT SIDEBAR - COMMERCIAL MARKETPLACE WIDGETS */}
        <aside className="w-80 border-l border-white/[0.06] bg-[#121316] p-4 shrink-0 hidden xl:flex flex-col space-y-6 h-full overflow-y-auto pb-28">
          {/* TOP PRODUCERS */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-bold text-white">Top producers</span>
              <button
                type="button"
                onClick={() => setActiveNav('browse')}
                className="text-[11px] text-[#e53935] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>See all</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>

            <div className="space-y-3">
              {topProducersList.slice(0, 4).map((producer) => (
                <div
                  key={producer.handle || producer.name}
                  onClick={() => handleSelectProducer(producer)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-black/40 border border-white/10 shrink-0">
                    <img
                      src={producer.coverUrl}
                      alt={producer.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{producer.name}</p>
                    <p className="text-[11px] text-gray-500 font-mono">{producer.beatsCount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* THIS WEEK'S CHARTS */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-bold text-white">This week&apos;s charts</span>
              <button
                type="button"
                onClick={() => setActiveNav('charts')}
                className="text-[11px] text-[#e53935] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>See all</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>

            <div className="space-y-3">
              {thisWeeksCharts.map((track, idx) => {
                const isThisPlaying = isPlaying && currentTrack.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => handlePlayToggle(track)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-gray-500 w-3 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {isThisPlaying ? (
                            <Pause className="h-3.5 w-3.5 fill-white text-white" />
                          ) : (
                            <Play className="h-3.5 w-3.5 fill-white text-white ml-0.5" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isThisPlaying ? 'text-[#e53935]' : 'text-white'}`}>
                          {track.title}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono font-bold text-gray-400 shrink-0">
                      {isFreeBeat(track) ? 'FREE' : track.priceNgn ? `₦${track.priceNgn.toLocaleString()}` : '$39'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SELL YOUR BEATS PROMOTIONAL CARD */}
          <div className="relative rounded-2xl overflow-hidden p-5 border border-white/[0.08] bg-[#16181d] space-y-3 mt-auto shrink-0 mb-4 shadow-lg">
            <img
              src="/images/artist_studio_mic.jpg"
              alt="Studio Microphone"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/80 to-transparent" />

            <div className="relative z-10 space-y-2">
              <h3 className="text-base font-black text-white leading-tight">Sell your beats.</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Reach creators worldwide on Caution.
              </p>
              <div className="pt-2">
                <a
                  href="https://creator.cautionstudioz.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-bold transition-all shadow-md shadow-[#e53935]/25"
                >
                  <span>Start Selling</span>
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM PERSISTENT PLAYER BAR */}
      <footer className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#16181c] border-t border-[#2a2d34] px-3 sm:px-4 z-50 flex items-center">
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
              </div>

              {/* Publisher name */}
              <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                {currentTrack.artist}
              </p>

              {/* Row below Publisher name: Download icon + Music bar right beside download + Music count on same line */}
              <div className="flex items-center gap-1.5 mt-1 w-full">
                {isFreeBeat(currentTrack) ? (
                  <button
                    type="button"
                    onClick={(e) => handleDownload(currentTrack, e)}
                    title="Download Free Beat (WAV)"
                    className={`p-0.5 text-gray-400 hover:text-[#2dd4bf] transition-colors shrink-0 cursor-pointer ${
                      downloadingId === currentTrack.id ? 'text-[#2dd4bf]' : ''
                    }`}
                  >
                    <Download className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPaidBeatPurchaseTrack(currentTrack);
                    }}
                    title="Download Locked · License Required"
                    className="p-0.5 text-gray-500 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
                  >
                    <Lock className="h-3 w-3" />
                  </button>
                )}

                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const targetSec = Math.round(ratio * currentTrack.durationSeconds);
                    setCurrentTime(targetSec);
                    if (audioRef.current) {
                      audioRef.current.currentTime = targetSec;
                    }
                  }}
                  className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden cursor-pointer relative"
                >
                  <div
                    className="h-full bg-[#e53935] transition-all"
                    style={{ width: `${progressRatio}%` }}
                  />
                </div>

                <span className="text-[9px] font-mono text-gray-400 shrink-0 tabular-nums">
                  {formatTime(currentTime)} / {currentTrack.duration}
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
              className="w-8 h-8 rounded-full bg-white hover:bg-[#f2f2f2] text-black flex items-center justify-center"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current translate-x-0.5" />
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

            {isFreeBeat(currentTrack) && (
              <button
                type="button"
                onClick={() => handleOpenRecordStudio(currentTrack)}
                className="p-1.5 text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                aria-label="Open Record Studio DAW"
                title="Record Studio (DAW)"
              >
                <Mic className="h-4 w-4 text-teal-400" />
              </button>
            )}

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
        <div className="hidden md:flex w-full items-center justify-between gap-6">
          {/* Left: Artwork + Title + Producer */}
          <div className="flex items-center gap-3 w-64 shrink-0 min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0 relative group cursor-pointer" onClick={() => handlePlayToggle(currentTrack)}>
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {isPlaying ? <Pause className="h-4 w-4 fill-white text-white" /> : <Play className="h-4 w-4 fill-white text-white ml-0.5" />}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate" title={currentTrack.title}>
                {currentTrack.title}
              </p>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Center: Controls + Red Waveform Scrubber */}
          <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5 min-w-0">
            {/* Top row controls: Shuffle, Prev, Play/Pause circle, Next, Repeat */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  const randomIndex = Math.floor(Math.random() * playlistRows.length);
                  if (playlistRows[randomIndex]) handlePlayToggle(playlistRows[randomIndex]);
                }}
                className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Shuffle"
              >
                <Shuffle className="h-4 w-4" />
              </button>

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
                className="w-9 h-9 rounded-full bg-white hover:bg-[#e0e0e0] text-black flex items-center justify-center transition-transform hover:scale-105 shadow-md shadow-white/20 cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current ml-0.5" />
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
                onClick={() => {
                  setCurrentTime(0);
                  if (audioRef.current) audioRef.current.currentTime = 0;
                }}
                className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Repeat track"
              >
                <Repeat className="h-4 w-4" />
              </button>
            </div>

            {/* Bottom scrubber row: Current Time + Red Waveform / Progress + Duration */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[10px] font-mono text-gray-400 w-8 text-right shrink-0 tabular-nums">
                {formatTime(currentTime)}
              </span>

              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const targetSec = Math.round(ratio * currentTrack.durationSeconds);
                  setCurrentTime(targetSec);
                  if (audioRef.current) {
                    audioRef.current.currentTime = targetSec;
                  }
                }}
                className="flex-1 h-3 flex items-center cursor-pointer relative group"
              >
                <div className="w-full h-1 bg-[#262833] rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-[#e53935] rounded-full transition-all"
                    style={{ width: `${progressRatio}%` }}
                  />
                </div>
              </div>

              <span className="text-[10px] font-mono text-gray-400 w-8 shrink-0 tabular-nums">
                {currentTrack.duration}
              </span>
            </div>
          </div>

          {/* Right: Volume + Red Slider + Maximize */}
          <div className="flex items-center gap-3 w-64 justify-end shrink-0">
            <button
              type="button"
              onClick={() => toggleLike(currentTrack.id)}
              className="p-1.5 text-gray-400 hover:text-[#e53935] transition-colors cursor-pointer"
              title="Add to Favorites"
            >
              <Heart
                className={`h-4 w-4 ${
                  currentTrack.isLiked || likedTrackIds.includes(currentTrack.id)
                    ? 'fill-[#e53935] text-[#e53935]'
                    : ''
                }`}
              />
            </button>

            <div className="flex items-center gap-2 text-gray-400">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 hover:text-white transition-colors cursor-pointer"
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
                className="w-20 h-1 bg-white/20 rounded-lg accent-[#e53935] cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => handleOpenRecordStudio(currentTrack)}
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Open Studio"
            >
              <Mic className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen?.();
                } else {
                  document.documentElement.requestFullscreen?.();
                }
              }}
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
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
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-[#121316] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-5 cursor-default shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e53935]/15 border border-[#e53935]/30 flex items-center justify-center text-[#e53935]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Active Subscription Required</h3>
                  <p className="text-[11px] text-gray-400">Choose a plan to unlock instant beat streaming, downloads & recording</p>
                </div>
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

            <p className="text-xs text-gray-300 leading-relaxed">
              Caution Studio is a curated membership platform for artists. An active <strong>Caution Plus (₦3,000/mo)</strong> or <strong>Caution Pro (₦10,000/mo)</strong> subscription is required to play and download beats.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Caution Plus */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">Caution Plus</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">Standard</span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white">₦3,000</span>
                    <span className="text-xs text-gray-400"> / month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#2dd4bf] shrink-0" />
                      <span>Full catalog playback</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#2dd4bf] shrink-0" />
                      <span>62 beat downloads / month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#2dd4bf] shrink-0" />
                      <span>Commercial release rights</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/subscriptions"
                  onClick={handleCloseUpgradeModal}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white text-center transition-colors block border border-white/10"
                >
                  Get Plus (₦3,000)
                </Link>
              </div>

              {/* Caution Pro */}
              <div className="p-4 rounded-xl bg-[#e53935]/10 border border-[#e53935]/30 flex flex-col justify-between space-y-4 relative overflow-hidden">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#e53935] uppercase tracking-wider">Caution Pro</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e53935] text-white font-black">POPULAR</span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white">₦10,000</span>
                    <span className="text-xs text-gray-400"> / month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#e53935] shrink-0" />
                      <span><strong>Unlimited downloads & streaming</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#e53935] shrink-0" />
                      <span><strong>100% Ad-Free experience</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#e53935] shrink-0" />
                      <span>In-browser Studio Suite (/studio)</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/subscriptions"
                  onClick={handleCloseUpgradeModal}
                  className="w-full py-2.5 rounded-xl bg-[#e53935] hover:bg-[#d32f2f] text-xs font-bold text-white text-center transition-all block shadow-lg shadow-red-500/20"
                >
                  Get Pro (₦10,000)
                </Link>
              </div>
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
            className="relative w-full max-w-md rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-7 shadow-2xl text-white overflow-hidden text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsDownloadLimitModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 mx-auto mb-4 shadow-inner">
              <Download className="h-6 w-6" />
            </div>

            <h3 className="text-xl font-black text-white tracking-tight">
              {isPro
                ? downloadQuota.canEarnBonus
                  ? 'Daily 5 Pro Downloads Used'
                  : 'Daily Pro Download & Ad Limit Reached'
                : downloadQuota.canEarnBonus
                  ? 'Daily 2-Download Limit Reached'
                  : 'Daily Limit Reached (2 Free + 2 Ad Bonuses Used)'}
            </h3>
            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
              {isPro ? (
                downloadQuota.canEarnBonus ? (
                  pendingDownloadTrackRef.current ? (
                    <>
                      You’ve used your 5 included Pro downloads today. Stream a sponsored ad to unlock and download <strong className="text-teal-300">&ldquo;{pendingDownloadTrackRef.current.title}&rdquo;</strong> (+1 bonus download)!
                    </>
                  ) : (
                    <>
                      You have used your 5 included Pro downloads for today. Stream a sponsored ad to earn <strong className="text-teal-300">+1 bonus download</strong>!
                    </>
                  )
                ) : (
                  <>
                    You have reached the maximum daily downloads limit for today. Your included 5 downloads reset tomorrow.
                  </>
                )
              ) : (
                downloadQuota.canEarnBonus ? (
                  pendingDownloadTrackRef.current ? (
                    <>
                      You’ve used your 2 free downloads today. Stream a 15-second sponsored ad to unlock and download <strong className="text-teal-300">&ldquo;{pendingDownloadTrackRef.current.title}&rdquo;</strong> ({downloadQuota.bonusRemaining} of 2 bonus left today)!
                    </>
                  ) : (
                    <>
                      You have downloaded your quota for today. Stream a 15-second sponsored ad to earn <strong className="text-teal-300">+1 bonus download</strong> ({downloadQuota.bonusRemaining} of 2 bonus left today)!
                    </>
                  )
                ) : (
                  <>
                    You have used all 2 free daily downloads and both of your 2 bonus ad downloads for today (4 total). Free downloads reset after 24 hours.
                  </>
                )
              )}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              {downloadQuota.canEarnBonus ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDownloadLimitModalOpen(false);
                    setAdModalType('download');
                    setIsAdModalOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-lg shadow-[#2dd4bf]/20 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {pendingDownloadTrackRef.current
                      ? `Stream Sponsored Ad & Download Beat`
                      : `Stream Sponsored Ad (+1 Download)`}
                  </span>
                </button>
              ) : (
                <div className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs text-center">
                  Daily Download Limit Reached
                </div>
              )}

              {isPro ? (
                <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Caution Pro Active: 5 beats included daily + ad unlocks extra beats</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsDownloadLimitModalOpen(false);
                    router.push('/subscriptions');
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#2dd4bf]" />
                  <span>Upgrade to Caution Pro for 5 Daily Downloads &amp; Studio</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spotify-Style Unskippable (15s) Audio Ad Modal */}
      <UserAdModal
        isOpen={isAdModalOpen}
        adType={adModalType}
        pendingDownloadTitle={adModalType === 'download' ? (pendingDownloadTrackRef.current?.title || null) : null}
        onClose={(unlocked) => {
          setIsAdModalOpen(false);
          // 1. If ad was listened to in order to download a beat:
          if (adModalType === 'download' && pendingDownloadTrackRef.current) {
            const trackToDownload = pendingDownloadTrackRef.current;
            pendingDownloadTrackRef.current = null;
            if (unlocked) {
              setRewardNotification(
                `🎉 Sponsor visit & ad verified! +1 bonus download unlocked. Downloading "${trackToDownload.title}" now!`
              );
              handleDownload(trackToDownload);
              setTimeout(() => setRewardNotification(null), 6000);
            }
          }
          // 2. If ad was triggered by playing a song:
          else if (pendingTrackRef.current) {
            const trackToResume = pendingTrackRef.current;
            pendingTrackRef.current = null;
            setSongsPlayedSinceLastAd(1);
            setSongsPlayedCount((prev) => prev + 1);
            try { sessionStorage.setItem('caution:beats-played-since-ad', '1'); } catch (e) {}
            executePlayTrack(trackToResume);
          }
        }}
        onRewardEarned={(bonusCount) => {
          setRewardNotification(
            `You completed the 15-second sponsored ad! +1 bonus download credited for today (total bonus: ${bonusCount}).`
          );
          setTimeout(() => setRewardNotification(null), 6000);
        }}
      />

      {/* 30-SECOND PREVIEW PURCHASE MODAL FOR PAID BEATS */}
      {paidBeatPurchaseTrack && !isFreeBeat(paidBeatPurchaseTrack) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-7 shadow-2xl text-white overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setPaidBeatPurchaseTrack(null);
                setPurchaseComplete(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Commercial Beat · License & Stems</span>
            </div>

            <h2 className="text-xl font-black text-white truncate">
              {paidBeatPurchaseTrack.title}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Produced by {paidBeatPurchaseTrack.artist} · {paidBeatPurchaseTrack.bpm || 110} BPM · {paidBeatPurchaseTrack.genre}
            </p>

            {(() => {
              const premiumPrice =
                paidBeatPurchaseTrack.premiumPriceNgn && paidBeatPurchaseTrack.premiumPriceNgn > 0
                  ? paidBeatPurchaseTrack.premiumPriceNgn
                  : paidBeatPurchaseTrack.priceNgn && paidBeatPurchaseTrack.priceNgn >= 20000
                  ? paidBeatPurchaseTrack.priceNgn
                  : 30000;
              const exclusivePrice =
                paidBeatPurchaseTrack.exclusivePriceNgn && paidBeatPurchaseTrack.exclusivePriceNgn > 0
                  ? paidBeatPurchaseTrack.exclusivePriceNgn
                  : 100000;

              return (
                <>
                  <div className="mt-5 space-y-3">
                    {/* 1. Premium Beat Plan (WAV Master + Stems) */}
                    <div
                      onClick={() => setPurchaseTier('premium')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        purchaseTier === 'premium'
                          ? 'bg-[#e53935]/15 border-[#e53935]/60 ring-1 ring-[#e53935]/40 text-white'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-gray-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">
                            Premium Beat Plan (WAV Master + Stems)
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#e53935]/20 text-[#e53935] border border-[#e53935]/30">
                            MOST POPULAR
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          24-Bit WAV Master + Trackout ZIP Stems · 500,000 Streams · Commercial Release
                        </p>
                      </div>
                      <span className="text-sm font-black text-[#e53935] shrink-0 ml-3">
                        ₦{premiumPrice.toLocaleString()}
                      </span>
                    </div>

                    {/* 2. 100% Exclusive Rights Buyout */}
                    <div
                      onClick={() => setPurchaseTier('exclusive')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        purchaseTier === 'exclusive'
                          ? 'bg-purple-500/15 border-purple-500/60 ring-1 ring-purple-500/40 text-purple-200'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-gray-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">
                            100% Exclusive Rights Buyout (1-of-1)
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            SOLE BUYOUT
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Unlimited Streams · Master + All Stems · Retired from Store · Full Legal Copyright Transfer
                        </p>
                      </div>
                      <span className="text-sm font-black text-purple-400 shrink-0 ml-3">
                        ₦{exclusivePrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Exclusive & Prior License Notice */}
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                    <span className="font-bold text-amber-400">Important:</span> You can sell a beat under a Premium License and later sell it exclusively, but the exclusive buyer must understand that previous premium licenses remain valid.
                  </div>

                  <div className="mt-6">
                    {purchaseComplete ? (
                      <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-1">
                        <p className="text-xs font-bold text-emerald-300">License Acquired Successfully!</p>
                        <p className="text-[11px] text-gray-300">Beat master unlocked for full streaming & downloads.</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isPurchasingBeat}
                        onClick={async () => {
                          if (!paidBeatPurchaseTrack) return;
                          setIsPurchasingBeat(true);
                          try {
                            const sessionRes = await supabase.auth.getSession();
                            const userEmail = sessionRes.data.session?.user?.email || 'buyer@cautionstudioz.com';
                            const userId = sessionRes.data.session?.user?.id || null;

                            const priceNgn = purchaseTier === 'exclusive' ? exclusivePrice : premiumPrice;
                            const orderId = `beat_${paidBeatPurchaseTrack.id.slice(0, 8)}_${Date.now()}`;

                            const res = await fetch('/api/paystack/initialize', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                email: userEmail,
                                amountNgn: priceNgn,
                                orderId,
                                callbackUrl: `${window.location.origin}/?type=purchase&beat_id=${paidBeatPurchaseTrack.id}`,
                                metadata: {
                                  type: 'purchase',
                                  order_id: orderId,
                                  beat_id: paidBeatPurchaseTrack.id,
                                  beat_title: paidBeatPurchaseTrack.title,
                                  license: purchaseTier,
                                  priceNgn,
                                  user_id: userId
                                }
                              })
                            });

                            const data = await res.json();
                            const redirectUrl = data.data?.authorization_url || data.authorization_url;
                            if (redirectUrl && (redirectUrl.startsWith('https://checkout.paystack.com') || redirectUrl.startsWith('http'))) {
                              window.location.href = redirectUrl;
                              return;
                            }

                            if (!data.status || data.configured === false || data.error === 'PAYSTACK_NOT_CONFIGURED') {
                              throw new Error('Paystack API keys not configured in Vercel. Please add PAYSTACK_SECRET_KEY in Vercel settings.');
                            } else {
                              throw new Error(data.error || 'Failed to initialize payment gateway');
                            }
                          } catch (err: any) {
                            console.error('License checkout error:', err);
                            setRewardNotification('Could not start Paystack checkout: ' + (err.message || 'Error'));
                            setIsPurchasingBeat(false);
                          }
                        }}
                        className="w-full py-3 rounded-xl bg-[#e53935] hover:bg-[#d32f2f] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-lg shadow-[#e53935]/25 cursor-pointer disabled:opacity-60"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>
                          {isPurchasingBeat
                            ? 'Connecting to Paystack...'
                            : `Pay & License ₦${(purchaseTier === 'exclusive' ? exclusivePrice : premiumPrice).toLocaleString()}`}
                        </span>
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
export default UserPortalClient;
