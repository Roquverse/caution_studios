'use client';

import React from 'react';
import { Track } from '@caution/types';
import { Modal } from './Modal';
import { Button } from './Button';
import { ShieldCheck, Download, Copy, Check, FileText } from 'lucide-react';

export interface LicenseCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  userName?: string;
}

export const LicenseCertificateModal: React.FC<LicenseCertificateModalProps> = ({
  isOpen,
  onClose,
  track,
  userName = 'Verified Creator'
}) => {
  const [copied, setCopied] = React.useState(false);
  const licenseNumber = track ? `LIC-${track.id.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}` : 'LIC-SAMPLE-9921';

  if (!track) return null;

  const copyLicense = () => {
    navigator.clipboard.writeText(licenseNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAudio = () => {
    // Trigger download of track audio sample
    const blob = new Blob([`Caution Royalty-Free Track: ${track.title} by ${track.artist}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.title.toLowerCase().replace(/\s+/g, '_')}_master.mp3`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Commercial License Certificate"
      description="Cleared for worldwide digital & commercial video synchronization"
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" pill onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            pill
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={downloadAudio}
          >
            Download WAV / MP3
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Certificate Card */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-5 shadow-inner">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2 text-zinc-900">
              <ShieldCheck className="h-5 w-5 text-black" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Official Content ID Clearance
              </span>
            </div>
            <span className="text-[11px] font-mono font-semibold bg-zinc-200 text-zinc-900 px-2 py-0.5 rounded-full">
              Perpetual Sync
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Track Title</span>
              <span className="text-sm font-bold text-gray-900 mt-0.5 block">{track.title}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Composer / Artist</span>
              <span className="text-sm font-bold text-gray-900 mt-0.5 block">{track.artist}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Licensed To</span>
              <span className="text-gray-900 font-semibold mt-0.5 block">{userName}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Coverage</span>
              <span className="text-gray-900 font-semibold mt-0.5 block">YouTube, TikTok, Broadcast, All Platforms</span>
            </div>
          </div>

          {/* License Key box */}
          <div className="mt-5 p-3 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">License Key</span>
              <span className="font-mono text-xs font-semibold text-gray-800">{licenseNumber}</span>
            </div>
            <button
              type="button"
              onClick={copyLicense}
              className="flex items-center gap-1 text-xs text-black hover:underline font-semibold"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2.5 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <FileText className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          <p>
            This certificate guarantees you are legally authorized to monetize videos featuring this recording without receiving third-party copyright claims.
          </p>
        </div>
      </div>
    </Modal>
  );
};
