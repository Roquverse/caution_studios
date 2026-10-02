export type MoodType =
  | 'Uplifting'
  | 'Epic'
  | 'Chill'
  | 'Dramatic'
  | 'Energetic'
  | 'Dark'
  | 'Romantic'
  | 'Peaceful';

export type VideoThemeType =
  | 'Vlog'
  | 'Commercial'
  | 'Cinematic'
  | 'Travel'
  | 'Gaming'
  | 'Fashion'
  | 'Corporate'
  | 'Podcast';

export type GenreType =
  | 'Cinematic'
  | 'Electronic'
  | 'Funk'
  | 'Hip Hop'
  | 'Lofi'
  | 'Pop'
  | 'Rock'
  | 'Ambient'
  | 'Acoustic'
  | 'Orchestral';

export type InstrumentType =
  | 'Acoustic Guitar'
  | 'Electric Guitar'
  | 'Piano'
  | 'Synthesizer'
  | 'Drums'
  | 'Strings'
  | 'Brass'
  | 'Bass';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  formattedDuration: string; // e.g. "2:28"
  genre: string[];
  mood: string[];
  theme: string[];
  instruments: string[];
  bpm: number;
  coverUrl: string;
  audioUrl: string;
  waveform: number[]; // relative heights between 0.1 and 1.0 for rendering
  isFeatured?: boolean;
  isSpotlight?: boolean;
  downloadsCount?: number;
  playsCount?: number;
  hasVocal?: boolean;
  createdAt?: string;
}

export type LicensePlan = 'creator' | 'pro' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: LicensePlan;
  priceMonthly: number;
  priceYearly: number;
  billingPeriod: 'monthly' | 'yearly';
  description: string;
  badge?: string;
  popular?: boolean;
  features: string[];
  coverage: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number; // 1-5
  quote: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: 'general' | 'licensing' | 'billing' | 'technical';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'creator';
  channels?: {
    platform: 'youtube' | 'tiktok' | 'twitch' | 'instagram' | 'facebook';
    handle: string;
    whitelisted: boolean;
  }[];
  subscription?: {
    planId: string;
    planName: string;
    status: 'active' | 'canceled' | 'trialing';
    renewDate: string;
  };
  favorites?: string[]; // track IDs
}

export interface DownloadRecord {
  id: string;
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  coverUrl: string;
  downloadedAt: string;
  licenseNumber: string;
  intendedPlatform: string;
  fileFormat: 'WAV' | 'MP3';
}

export interface FilterState {
  searchQuery: string;
  selectedMoods: string[];
  selectedThemes: string[];
  selectedGenres: string[];
  selectedInstruments: string[];
  spotlightOnly: boolean;
  minBpm?: number;
  maxBpm?: number;
  sortBy: 'popular' | 'newest' | 'duration' | 'bpm';
}
