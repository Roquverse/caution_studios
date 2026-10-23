export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  subscribers?: string;
  tracksCount?: string;
  duration: string;
  durationSeconds: number;
  date?: string;
  coverUrl: string;
  isLiked?: boolean;
  isListenLater?: boolean;
  category?: string;
  audioUrl?: string;
  priceNgn?: number;
  bpm?: number;
  genre?: string;
  musicalKey?: string;
  playCount?: number;
}

export interface ProducerItem {
  rank: number;
  name: string;
  subscribers: string;
  coverUrl: string;
  handle: string;
}

export interface HistoryItem {
  track: TrackItem;
  listenedAt: string;
  timestamp: number;
}

export const FALLBACK_BEATS: TrackItem[] = [
  {
    id: 'b69f00b8-61ce-4b5a-94f5-27e1fc9a44df',
    title: 'Alex morgan afrobeat instrumental summer groove 573648',
    artist: 'Arakunrin Cole',
    subscribers: '@arakunrincole',
    tracksCount: '120 BPM • Cinematic',
    date: '4 Oct, 2026',
    duration: '2:23',
    durationSeconds: 143,
    coverUrl: '/api/media/covers/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151618223.png',
    audioUrl: '/api/media/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151618223.wav',
    bpm: 120,
    genre: 'Cinematic',
    musicalKey: 'C Minor',
    priceNgn: 3000,
    playCount: 0,
    category: 'playlists'
  },
  {
    id: '27b5d6b8-f2c7-46bc-807f-79e93ca4508c',
    title: 'Neon Overdrive',
    artist: 'Arakunrin Cole',
    subscribers: '@arakunrincole',
    tracksCount: '128 BPM • Electronic',
    date: '4 Oct, 2026',
    duration: '3:00',
    durationSeconds: 180,
    coverUrl: '/images/album_neon_dj.jpg',
    bpm: 128,
    genre: 'Electronic',
    musicalKey: 'F Minor',
    priceNgn: 2999,
    playCount: 1,
    category: 'playlists'
  }
];

export const FALLBACK_PRODUCERS: ProducerItem[] = [
  {
    rank: 1,
    name: 'Arakunrin Cole',
    subscribers: '@arakunrincole • Verified Producer',
    coverUrl: '/api/media/avatars/64d47dcb-3d1f-41dd-8400-46f39c5b0750-1791132868902.jpg',
    handle: 'arakunrincole'
  },
  {
    rank: 2,
    name: 'Olajide Samuel Ojo',
    subscribers: '@olajide_samuel_ojo • Verified Producer',
    coverUrl: '/images/artist_studio_mic.jpg',
    handle: 'olajide_samuel_ojo'
  }
];
