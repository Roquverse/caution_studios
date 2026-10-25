'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ArtworkUploader } from './ArtworkUploader';
import { supabase } from '../lib/supabaseClient';

interface UpdateArtworkModalProps {
  beat: {
    id: string;
    title: string;
    coverUrl?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (beatId: string, newCoverUrl: string) => void;
}

export function UpdateArtworkModal({
  beat,
  isOpen,
  onClose,
  onSuccess
}: UpdateArtworkModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen || !beat) return null;

  const handleArtworkChange = (file: File | null, presetUrl: string | null) => {
    setSelectedFile(file);
    setSelectedPresetUrl(presetUrl);
    setErrorMessage('');
  };

  const handleSave = async () => {
    if (!selectedFile && !selectedPresetUrl) {
      setErrorMessage('Please select a new artwork image or choose a studio preset.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const match = document.cookie.match(/sb-token=([^;]+)/);
        const matchRefresh = document.cookie.match(/sb-refresh=([^;]+)/);
        if (match && matchRefresh) {
          const { data } = await supabase.auth.setSession({
            access_token: match[1],
            refresh_token: matchRefresh[1]
          });
          session = data.session;
        }
      }

      const formData = new FormData();
      if (selectedFile) {
        formData.append('artwork', selectedFile);
      }
      if (selectedPresetUrl) {
        formData.append('coverUrl', selectedPresetUrl);
      }

      const res = await fetch(`/api/beats/${beat.id}/artwork`, {
        method: 'POST',
        body: formData,
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update artwork');
      }

      setSuccessMessage('Artwork updated successfully!');
      onSuccess(beat.id, data.coverUrl);

      setTimeout(() => {
        onClose();
        setSuccessMessage('');
        setLoading(false);
      }, 900);
    } catch (err: any) {
      console.error('Error updating artwork:', err);
      setErrorMessage(err.message || 'Failed to update artwork. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 text-zinc-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#2dd4bf]/10 text-[#2dd4bf] border border-[#2dd4bf]/20">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Update Beat Artwork
              </h2>
              <p className="text-xs text-zinc-400">
                Track: <span className="text-zinc-200 font-semibold">{beat.title}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Uploader Body */}
        <div className="mt-5">
          <ArtworkUploader
            initialArtworkUrl={beat.coverUrl}
            onArtworkChange={handleArtworkChange}
            title="Custom Beat Artwork"
            description="Upload your high-definition cover art or select a studio preset for this track."
          />
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading || (!selectedFile && !selectedPresetUrl)}
            className="px-5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading & Updating...</span>
              </>
            ) : (
              <span>Save Artwork</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
