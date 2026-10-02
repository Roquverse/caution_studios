import { Track, SubscriptionPlan } from '@caution/types';

export const MOCK_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'The Morning Sunrise',
    artist: 'Maximilian Vance',
    duration: 148,
    formattedDuration: '2:28',
    genre: ['Cinematic', 'Orchestral'],
    mood: ['Epic', 'Uplifting'],
    theme: ['Cinematic', 'Travel'],
    instruments: ['Piano', 'Strings', 'Brass'],
    bpm: 92,
    coverUrl: '/images/album_sunrise.jpg',
    audioUrl: '',
    waveform: [
      0.15, 0.25, 0.4, 0.6, 0.75, 0.85, 0.9, 0.65, 0.4, 0.35,
      0.5, 0.7, 0.8, 0.95, 0.75, 0.5, 0.3, 0.45, 0.65, 0.8,
      0.9, 0.85, 0.7, 0.55, 0.4, 0.3, 0.6, 0.8, 0.75, 0.6,
      0.45, 0.35, 0.5, 0.65, 0.4, 0.25, 0.2
    ],
    isFeatured: true,
    downloadsCount: 3840,
    playsCount: 24200
  },
  {
    id: 'track-2',
    title: 'Beat Blitz',
    artist: 'Kroma Sound',
    duration: 91,
    formattedDuration: '1:31',
    genre: ['Electronic', 'Funk'],
    mood: ['Energetic', 'Uplifting'],
    theme: ['Gaming', 'Commercial', 'Vlog'],
    instruments: ['Synthesizer', 'Drums', 'Bass'],
    bpm: 124,
    coverUrl: '/images/album_neon_dj.jpg',
    audioUrl: '',
    waveform: [
      0.4, 0.7, 0.85, 0.9, 0.65, 0.8, 0.95, 0.85, 0.6, 0.75,
      0.9, 0.8, 0.95, 1.0, 0.7, 0.8, 0.6, 0.85, 0.9, 0.75,
      0.9, 0.85, 0.7, 0.8, 0.95, 0.85, 0.65, 0.75, 0.85, 0.7,
      0.8, 0.9, 0.65, 0.5, 0.7, 0.5, 0.35
    ],
    isFeatured: true,
    isSpotlight: true,
    downloadsCount: 5910,
    playsCount: 41200
  },
  {
    id: 'track-3',
    title: 'Open Air Kiss',
    artist: 'Luna Horizon',
    duration: 159,
    formattedDuration: '2:39',
    genre: ['Electronic', 'Hip Hop', 'Lofi'],
    mood: ['Chill', 'Peaceful'],
    theme: ['Vlog', 'Travel'],
    instruments: ['Electric Guitar', 'Synthesizer', 'Drums'],
    bpm: 86,
    coverUrl: '/images/golden_clef.jpg',
    audioUrl: '',
    waveform: [
      0.2, 0.3, 0.45, 0.55, 0.65, 0.6, 0.7, 0.55, 0.4, 0.45,
      0.6, 0.7, 0.75, 0.65, 0.5, 0.4, 0.35, 0.5, 0.6, 0.7,
      0.65, 0.5, 0.4, 0.3, 0.55, 0.65, 0.6, 0.5, 0.45, 0.35,
      0.3, 0.4, 0.5, 0.35, 0.3, 0.2, 0.15
    ],
    downloadsCount: 2450,
    playsCount: 16700
  },
  {
    id: 'track-4',
    title: 'Mystery Box - Instrumental',
    artist: 'Solstice Project',
    duration: 89,
    formattedDuration: '1:29',
    genre: ['Cinematic', 'Ambient'],
    mood: ['Dramatic', 'Dark'],
    theme: ['Cinematic', 'Gaming'],
    instruments: ['Strings', 'Synthesizer'],
    bpm: 78,
    coverUrl: '/images/album_sunrise.jpg',
    audioUrl: '',
    waveform: [
      0.2, 0.35, 0.5, 0.65, 0.7, 0.8, 0.6, 0.45, 0.4, 0.55,
      0.7, 0.85, 0.9, 0.75, 0.6, 0.45, 0.35, 0.5, 0.65, 0.75,
      0.8, 0.7, 0.55, 0.4, 0.5, 0.65, 0.7, 0.6, 0.45, 0.35,
      0.3, 0.4, 0.35, 0.25, 0.2, 0.15, 0.1
    ],
    isSpotlight: true,
    downloadsCount: 1890,
    playsCount: 12100
  },
  {
    id: 'track-5',
    title: 'Soothe My Mind',
    artist: 'Elysian Beats',
    duration: 240,
    formattedDuration: '4:00',
    genre: ['Electronic', 'Hip Hop', 'Lofi'],
    mood: ['Chill', 'Peaceful', 'Romantic'],
    theme: ['Vlog', 'Podcast'],
    instruments: ['Piano', 'Synthesizer', 'Bass'],
    bpm: 84,
    coverUrl: '/images/golden_clef.jpg',
    audioUrl: '',
    waveform: [
      0.15, 0.25, 0.35, 0.5, 0.6, 0.55, 0.65, 0.5, 0.4, 0.45,
      0.55, 0.65, 0.7, 0.6, 0.45, 0.35, 0.3, 0.45, 0.55, 0.65,
      0.6, 0.5, 0.4, 0.3, 0.45, 0.55, 0.5, 0.4, 0.35, 0.3,
      0.25, 0.3, 0.35, 0.25, 0.2, 0.15, 0.1
    ],
    downloadsCount: 4210,
    playsCount: 29800
  },
  {
    id: 'track-6',
    title: 'Hoodie Season',
    artist: 'Metro Boom',
    duration: 191,
    formattedDuration: '3:11',
    genre: ['Hip Hop'],
    mood: ['Chill', 'Energetic'],
    theme: ['Fashion', 'Vlog', 'Commercial'],
    instruments: ['Drums', 'Bass', 'Synthesizer'],
    bpm: 130,
    coverUrl: '/images/hero_boombox.jpg',
    audioUrl: '',
    waveform: [
      0.3, 0.5, 0.7, 0.85, 0.95, 0.8, 0.7, 0.8, 0.9, 0.75,
      0.85, 0.95, 1.0, 0.85, 0.7, 0.6, 0.75, 0.9, 0.85, 0.75,
      0.85, 0.95, 0.8, 0.7, 0.8, 0.9, 0.75, 0.65, 0.7, 0.6,
      0.5, 0.65, 0.5, 0.4, 0.3, 0.2, 0.15
    ],
    downloadsCount: 5120,
    playsCount: 38900
  },
  {
    id: 'track-7',
    title: 'Galaxy Groove',
    artist: 'Funk Spectrum',
    duration: 115,
    formattedDuration: '1:55',
    genre: ['Pop', 'Funk'],
    mood: ['Uplifting', 'Energetic'],
    theme: ['Commercial', 'Gaming', 'Vlog'],
    instruments: ['Electric Guitar', 'Bass', 'Drums', 'Brass'],
    bpm: 118,
    coverUrl: '/images/album_neon_dj.jpg',
    audioUrl: '',
    waveform: [
      0.35, 0.6, 0.8, 0.9, 0.85, 0.75, 0.9, 0.95, 0.8, 0.7,
      0.85, 0.95, 0.9, 0.85, 0.7, 0.8, 0.9, 0.85, 0.75, 0.85,
      0.95, 0.9, 0.8, 0.7, 0.85, 0.9, 0.75, 0.65, 0.75, 0.6,
      0.5, 0.6, 0.45, 0.35, 0.25, 0.2, 0.15
    ],
    isFeatured: true,
    downloadsCount: 3100,
    playsCount: 22400
  }
];

export const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-creator',
    name: 'Social Creator',
    slug: 'creator',
    priceMonthly: 14.99,
    priceYearly: 9.99,
    billingPeriod: 'yearly',
    description: 'Perfect for YouTubers, streamers, and social media video creators.',
    features: [
      'Unlimited music & SFX downloads',
      'Clearance for 1 channel per platform',
      'YouTube, TikTok, Instagram, Twitch',
      'Full monetization safe coverage',
      'High-quality WAV & MP3 files'
    ],
    coverage: ['YouTube', 'TikTok', 'Instagram', 'Twitch', 'Facebook', 'Podcasts']
  },
  {
    id: 'plan-pro',
    name: 'Pro Commercial',
    slug: 'pro',
    priceMonthly: 29.99,
    priceYearly: 19.99,
    billingPeriod: 'yearly',
    description: 'For freelance filmmakers, creative agencies, and commercial clients.',
    badge: 'Most Popular',
    popular: true,
    features: [
      'Everything in Social Creator',
      'Worldwide commercial client projects',
      'TV, broadcast & streaming commercials',
      'Film festivals & cinema distribution',
      'Unlimited client project clearances',
      'Multi-seat agency team licenses'
    ],
    coverage: [
      'Commercial Ads',
      'Broadcast & Cable',
      'Cinema & Film Festivals',
      'Client Projects',
      'Websites & Apps',
      'Worldwide Perpetual'
    ]
  },
  {
    id: 'plan-enterprise',
    name: 'Studio Enterprise',
    slug: 'enterprise',
    priceMonthly: 79.99,
    priceYearly: 59.99,
    billingPeriod: 'yearly',
    description: 'Custom coverage for production studios, television networks, and game developers.',
    features: [
      'Unlimited enterprise organization seats',
      'Custom indemnity & legal protection up to $1M',
      'Dedicated music curation specialist',
      'Stems & multi-track instrumentals access',
      'Custom API & automated metadata feed'
    ],
    coverage: ['All Media Types', 'Global Broadcast', 'Video Games & Apps', 'Indemnity Guarantee']
  }
];
