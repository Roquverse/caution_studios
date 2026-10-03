/**
 * Caution Studio Database & Application Types
 * Matching Supabase Schema (Spec Section 6)
 */

export type AppRole = 'artist' | 'producer';
export type BeatStatus = 'draft' | 'processing' | 'live' | 'sold' | 'removed';
export type LicenseType = 'basic' | 'premium' | 'exclusive';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PlanTier = 'free' | 'plus';

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  roles: AppRole[];
  plan: PlanTier;
  stripe_customer_id?: string | null;
  stripe_account_id?: string | null;
  stripe_payouts_enabled: boolean;
  basic_leases_used_this_period: number;
  period_resets_at?: string | null;
  created_at: string;
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
  company: string;
  avatar: string;
  rating: number;
  quote: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug?: string;
  priceMonthly?: number;
  priceYearly?: number;
  billingPeriod?: string;
  badge?: string;
  popular?: boolean;
  price?: string;
  period?: string;
  description: string;
  isRecommended?: boolean;
  features: string[];
  coverage?: string[];
}
