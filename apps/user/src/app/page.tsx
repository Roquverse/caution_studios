'use client';

import React, { useState } from 'react';
import { UserNav } from '../components/UserNav';
import {
  StatsCard,
  Button,
  Badge,
  Card,
  TrackRow,
  LicenseCertificateModal,
  AudioPlayer,
  audioSynth,
  MOCK_TRACKS
} from '@caution/ui';
import { Track } from '@caution/types';
import {
  Download,
  ShieldCheck,
  Youtube,
  Radio,
  Plus,
  FileText,
  ExternalLink
} from 'lucide-react';

export default function UserDashboard() {
  const [tracks] = useState<Track[]>(MOCK_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [licenseModalTrack, setLicenseModalTrack] = useState<Track | null>(null);

  const [channels, setChannels] = useState([
    { platform: 'YouTube', handle: '@alexrivers_cinema', verified: true },
    { platform: 'TikTok', handle: '@riversfilmmaking', verified: true },
    { platform: 'Instagram', handle: '@alexrivers.raw', verified: true }
  ]);

  const [newChannelHandle, setNewChannelHandle] = useState('');

  const handlePlayToggle = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      audioSynth.playTrack(track.id, (secs) => {
        setCurrentTime((prev) => {
          if (prev >= track.duration) {
            audioSynth.stop();
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.25;
        });
      });
    }
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelHandle) return;
    setChannels((prev) => [
      ...prev,
      { platform: 'YouTube', handle: newChannelHandle, verified: true }
    ]);
    setNewChannelHandle('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      <UserNav activePath="/" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-gray-950 tracking-tight">
                Hello, Alex Rivers!
              </h1>
              <Badge variant="success" size="sm">
                Pro Plan Active
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              Your account is cleared for unlimited commercial synchronization and YouTube monetization.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              pill
              onClick={() => (window.location.href = '/licenses')}
              leftIcon={<FileText className="h-3.5 w-3.5" />}
            >
              My Licenses
            </Button>
            <Button
              variant="primary"
              size="sm"
              pill
              onClick={() => (window.location.href = '/library')}
              leftIcon={<Download className="h-3.5 w-3.5" />}
            >
              Browse Music
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Downloads"
            value="48"
            change="+12 this month"
            isPositive={true}
            icon={<Download className="h-4 w-4" />}
          />
          <StatsCard
            title="Active Whitelist"
            value="3 Channels"
            subtitle="Content ID protected"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <StatsCard
            title="Copyright Claims"
            value="0 Claims"
            subtitle="100% clean monetization"
            isPositive={true}
            icon={<Radio className="h-4 w-4" />}
          />
          <StatsCard
            title="Subscription"
            value="Pro Commercial"
            subtitle="Renews Nov 2026"
            icon={<FileText className="h-4 w-4" />}
          />
        </div>

        {/* Channels Whitelist Section */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Monetization & Channel Whitelist
              </h2>
              <p className="text-xs text-gray-500">
                Videos published to these connected accounts are automatically cleared from copyright claims.
              </p>
            </div>

            <form onSubmit={handleAddChannel} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Add YouTube or TikTok handle..."
                value={newChannelHandle}
                onChange={(e) => setNewChannelHandle(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 focus:outline-none focus:border-black w-full sm:w-56"
              />
              <Button type="submit" variant="primary" size="sm" pill leftIcon={<Plus className="h-3 w-3" />}>
                Add
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {channels.map((chan, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-slate-50/60"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <Youtube className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{chan.handle}</span>
                    <span className="text-[10px] text-gray-400">{chan.platform}</span>
                  </div>
                </div>

                <Badge variant="success" size="sm">
                  Active Clearance
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Downloaded & Cleared Tracks */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Recently Downloaded & Cleared Tracks
              </h2>
              <p className="text-xs text-gray-500">
                Click any track to listen or generate an official PDF license certificate.
              </p>
            </div>
            <a href="/library" className="text-xs text-black hover:underline font-semibold">
              Explore All Tracks
            </a>
          </div>

          <div className="space-y-2">
            {tracks.slice(0, 4).map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isPlaying={isPlaying}
                isCurrent={currentTrack?.id === track.id}
                currentTime={currentTrack?.id === track.id ? currentTime : 0}
                onPlayToggle={handlePlayToggle}
                onDownload={(t) => setLicenseModalTrack(t)}
                onFavoriteToggle={() => {}}
                onShare={() => {}}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Floating Audio Player */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        onPlayToggle={() => {
          if (!currentTrack) return;
          handlePlayToggle(currentTrack);
        }}
        onSeek={(r) => {
          if (currentTrack) setCurrentTime(r * currentTrack.duration);
        }}
        onDownload={(t) => setLicenseModalTrack(t)}
      />

      {/* License Certificate Modal */}
      <LicenseCertificateModal
        isOpen={!!licenseModalTrack}
        onClose={() => setLicenseModalTrack(null)}
        track={licenseModalTrack}
        userName="Alex Rivers (PixelCraft Studios)"
      />
    </div>
  );
}
