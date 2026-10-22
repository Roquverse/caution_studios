/**
 * Caution Studio Database & Application Types
 * Matching Supabase Schema (Spec Section 6 & Latest 2026 Migrations)
 */

export type AppRole = 'artist' | 'producer';
export type BeatStatus = 'draft' | 'processing' | 'live' | 'sold' | 'removed';
export type LicenseType = 'basic' | 'premium' | 'exclusive';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PlanTier = 'free' | 'plus';
export type AdPackage = 'starter' | 'pro' | 'studio_blast';
export type AdStatus = 'pending_payment' | 'active' | 'completed' | 'paused';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
export type IncentiveStatus = 'pending' | 'verified' | 'paid' | 'withheld';

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  roles: AppRole[];
  primary_role?: AppRole;
  plan: PlanTier;
  stripe_customer_id?: string | null;
  stripe_account_id?: string | null;
  stripe_payouts_enabled: boolean;
  basic_leases_used_this_period: number;
  period_resets_at?: string | null;
  is_verified?: boolean;
  verification_reason?: string;
  streaming_earnings_cents?: number;
  streaming_streams_count?: number;
  trial_ends_at?: string | null;
  promo_applied?: string | null;

  // Paystack & Banking Additions (2026 Policy Update)
  paystack_bank_code?: string | null;
  paystack_bank_name?: string | null;
  paystack_account_number?: string | null;
  paystack_account_name?: string | null;
  paystack_recipient_code?: string | null;
  available_balance_ngn?: number;
  pending_balance_ngn?: number;

  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_encrypted: boolean;
  has_contact_info: boolean;
  contact_audit_note?: string;
  read_at?: string | null;
  created_at: string;
}

export interface PromotedSong {
  id: string;
  artist_id?: string;
  title: string;
  artist_name: string;
  cover_url: string;
  duration_seconds: number;
  snippet_seconds: number;
  genre: string;
  streaming_links: {
    spotify?: string;
    apple_music?: string;
    audiomack?: string;
    youtube?: string;
  };
}

export interface AdCampaign {
  id: string;
  advertiser_id?: string | null;
  campaign_name: string;
  artist_name: string;
  song_title: string;
  package_name: AdPackage;
  price_ngn: number;
  target_plays: number;
  delivered_plays: number;
  clicks_count: number;
  audio_url?: string | null;
  cover_url?: string | null;
  spotify_url?: string | null;
  apple_music_url?: string | null;
  audiomack_url?: string | null;
  youtube_url?: string | null;
  paystack_reference?: string | null;
  status: AdStatus;
  starts_at: string;
  ends_at?: string | null;
  created_at: string;
}

export interface ProducerDownloadIncentive {
  id: string;
  producer_id: string;
  month_period: string; // YYYY-MM-01
  qualifying_downloads: number;
  rollover_downloads: number;
  milestones_reached: number;
  reward_amount_ngn: number;
  payout_status: IncentiveStatus;
  payout_reference?: string | null;
  verified_at?: string | null;
  created_at: string;
}

export interface PayoutRecord {
  id: string;
  producer_id: string;
  amount_ngn: number;
  fee_ngn: number;
  net_ngn: number;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  paystack_transfer_reference?: string | null;
  status: PayoutStatus;
  created_at: string;
  completed_at?: string | null;
}

export interface Beat {
  id: string;
  producer_id: string;
  slug: string;
  title: string;
  description?: string | null;
  genre: string;
  moods: string[];
  tags: string[];
  bpm?: number | null;
  musical_key?: string | null;
  cover_url?: string | null;
  status: BeatStatus;
  master_wav_key?: string | null;
  stems_zip_key?: string | null;
  preview_tagged_key?: string | null;
  preview_clean_key?: string | null;
  waveform_peaks?: number[] | null;
  duration_seconds?: number | null;
  play_count: number;
  like_count: number;
  sold_at?: string | null;
  published_at?: string | null;

  // Free Streaming & License Policy additions
  is_free_stream_enabled?: boolean;
  producer_tag_free?: boolean;
  free_commercial_downloads_count?: number;

  created_at: string;

  // Joined fields for UI convenience
  producer?: Profile;
  licenses?: BeatLicense[];
}

export interface BeatLicense {
  beat_id: string;
  type: LicenseType;
  price_cents: number;
  enabled: boolean;
}

export interface Order {
  id: string;
  buyer_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  credit_cents: number;
  tax_cents: number;
  total_cents: number;
  stripe_payment_intent_id?: string | null;
  paystack_reference?: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  beat_id: string;
  producer_id: string;
  license: LicenseType;
  price_cents: number;
  platform_fee_cents: number;
  producer_amount_cents: number;
  beat?: Beat;
}

export interface License {
  id: string;
  order_item_id: string;
  buyer_id: string;
  beat_id: string;
  type: LicenseType;
  stream_cap?: number | null;
  video_cap?: number | null;
  agreement_pdf_key: string;
  issued_at: string;
  beat?: Beat;
}

export interface Like {
  user_id: string;
  beat_id: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  producer_id: string;
}

export interface AudioJob {
  id: string;
  beat_id: string;
  state: 'queued' | 'running' | 'done' | 'failed';
  error?: string | null;
  attempts: number;
  created_at: string;
}

export interface ProducerTag {
  producer_id: string;
  tag_audio_key: string;
}

export interface CartItem {
  beat: Beat;
  licenseType: LicenseType;
  priceCents: number;
}

export interface FilterState {
  searchQuery: string;
  selectedGenres: string[];
  selectedMoods: string[];
  bpmRange?: [number, number];
  musicalKey?: string;
  producer?: string;
  sortBy?: 'popular' | 'newest' | 'price_low' | 'price_high' | 'bpm';
  selectedThemes?: string[];
  selectedInstruments?: string[];
  spotlightOnly?: boolean;
}

/** Legacy / UI Compatibility Interface */
export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  formattedDuration: string;
  genre: string[];
  mood: string[];
  theme: string[];
  instruments: string[];
  bpm: number;
  coverUrl: string;
  audioUrl: string;
  waveform: number[];
  isFeatured?: boolean;
  isSpotlight?: boolean;
  downloadsCount?: number;
  playsCount?: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar: string;
  rating: number;
  quote: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  billingPeriod: 'monthly' | 'yearly';
  description: string;
  badge?: string;
  popular?: boolean;
  features: string[];
  coverage: string[];
}

