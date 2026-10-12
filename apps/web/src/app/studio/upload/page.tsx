'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNav } from '../../../components/layout/TopNav';
import { HomeFooter } from '../../../components/home/HomeFooter';
import { formatNaira } from '../../../lib/paystack';
import {
  Upload,
  Music,
  CheckCircle2,
  FileAudio,
  Archive,
  Image,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';

export default function StudioUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    genre: 'Afrobeats',
    bpm: '',
    key: '',
    moods: [] as string[],
    description: '',
    tags: '',
    basicPrice: 3000,
    premiumPrice: 30000,
    exclusivePrice: 100000,
    basicEnabled: true,
    premiumEnabled: true,
    exclusiveEnabled: true,
    wavFileName: '',
    stemsFileName: '',
    coverFileName: ''
  });

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep((step + 1) as any);
    } else {
      handlePublish();
    }
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-24">
      <TopNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between pb-6 border-b border-border mb-8">
          <div>
            <Link
              href="/studio"
              className="text-xs text-text-muted hover:text-text flex items-center gap-1 mb-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to studio</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-text tracking-[-0.03em]">
              Upload new beat
            </h1>
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-7 w-7 rounded-sm flex items-center justify-center text-xs font-mono font-bold transition-colors border ${
                  step === s
                    ? 'bg-accent-live text-bg border-accent-live'
                    : step > s
                    ? 'bg-surface-2 text-text border-border'
                    : 'bg-surface text-text-faint border-border'
                }`}
              >
                {step > s ? <Check className="h-3.5 w-3.5" /> : `0${s}`}
              </div>
            ))}
          </div>
        </div>

        {isSuccess ? (
          <div className="py-16 text-center space-y-4 rounded-sm bg-surface border border-border p-8">
            <div className="h-16 w-16 rounded-pill bg-surface-2 border border-accent-live mx-auto flex items-center justify-center text-accent-live">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-text">Beat published successfully!</h2>
            <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
              Your audio job has been queued. Previews are being encoded and your beat is live on the marketplace.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <Link
                href="/beats"
                className="h-10 px-6 rounded-pill bg-accent hover:bg-[#135d56] text-text font-bold text-xs uppercase tracking-wider flex items-center border border-accent"
              >
                View on marketplace
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setStep(1);
                  setFormData({
                    title: '',
                    genre: 'Afrobeats',
                    bpm: '',
                    key: '',
                    moods: [],
                    description: '',
                    tags: '',
                    basicPrice: 3000,
                    premiumPrice: 30000,
                    exclusivePrice: 100000,
                    basicEnabled: true,
                    premiumEnabled: true,
                    exclusiveEnabled: true,
                    wavFileName: '',
                    stemsFileName: '',
                    coverFileName: ''
                  });
                }}
                className="h-10 px-6 rounded-pill bg-surface hover:bg-surface-2 text-text font-bold text-xs uppercase tracking-wider border border-border"
              >
                Upload another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleNextStep} className="space-y-6">
            {/* Step 1: Files Upload */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Step 1: Direct Audio Master Uploads
                </div>

                {/* Master WAV Dropzone */}
                <div className="p-6 rounded-sm bg-surface border-2 border-dashed border-border hover:border-text-faint text-center space-y-3 cursor-pointer">
                  <FileAudio className="h-8 w-8 text-accent-live mx-auto" />
                  <div>
                    <span className="text-sm font-bold text-text block">
                      Master WAV File (Required)
                    </span>
                    <span className="text-xs text-text-muted">
                      24-bit 44.1kHz or 48kHz uncompressed stereo WAV
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".wav"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFormData({
                          ...formData,
                          wavFileName: e.target.files[0].name,
                          title: formData.title || e.target.files[0].name.replace('.wav', '')
                        });
                      }
                    }}
                    className="hidden"
                    id="wav-file"
                  />
                  <label
                    htmlFor="wav-file"
                    className="inline-block h-8 px-4 rounded-pill bg-surface-2 border border-border text-xs text-text cursor-pointer hover:bg-border"
                  >
                    {formData.wavFileName ? `Selected: ${formData.wavFileName}` : 'Choose WAV file'}
                  </label>
                </div>

                {/* Stems ZIP Dropzone */}
                <div className="p-6 rounded-sm bg-surface border border-border text-center space-y-3 cursor-pointer">
                  <Archive className="h-7 w-7 text-text-muted mx-auto" />
                  <div>
                    <span className="text-sm font-bold text-text block">
                      Separated Trackout Stems (.ZIP)
                    </span>
                    <span className="text-xs text-text-muted">
                      Required for Premium &amp; Exclusive license fulfillment
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFormData({ ...formData, stemsFileName: e.target.files[0].name });
                      }
                    }}
                    className="hidden"
                    id="stems-file"
                  />
                  <label
                    htmlFor="stems-file"
                    className="inline-block h-8 px-4 rounded-pill bg-surface-2 border border-border text-xs text-text cursor-pointer hover:bg-border"
                  >
                    {formData.stemsFileName ? `Selected: ${formData.stemsFileName}` : 'Choose ZIP archive'}
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Metadata */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Step 2: Beat Details &amp; Arrangement
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Beat Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Lagos Nights"
                    className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-xs text-text focus:outline-none focus:border-accent-live"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">
                      Primary Genre
                    </label>
                    <select
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-xs text-text focus:outline-none focus:border-accent-live"
                    >
                      <option value="Afrobeats">Afrobeats</option>
                      <option value="Amapiano">Amapiano</option>
                      <option value="Trap">Trap</option>
                      <option value="R&B">R&B</option>
                      <option value="Drill">Drill</option>
                      <option value="Dancehall">Dancehall</option>
                      <option value="Pop">Pop</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">
                      Tempo (BPM)
                    </label>
                    <input
                      type="number"
                      value={formData.bpm}
                      onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                      placeholder="e.g. 106"
                      className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-accent-live font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">
                      Musical Key
                    </label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                      placeholder="e.g. C Minor"
                      className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-accent-live font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. Burna Boy, Asake, Guitar, Fast 808"
                    className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-accent-live"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Licensing & Pricing */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Step 3: License Pricing (80% Producer Payout via Paystack)
                </div>

                {/* Tier 1: Starter */}
                <div className="p-4 rounded-sm bg-surface border border-border flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-text">Starter Lease</div>
                    <div className="text-xs text-text-muted">100k streams · MP3 master</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-accent-live">
                      {formatNaira(formData.basicPrice)}
                    </span>
                    <span className="text-xs text-text-muted">You earn: {formatNaira(formData.basicPrice * 0.8)}</span>
                  </div>
                </div>

                {/* Tier 2: Premium */}
                <div className="p-4 rounded-sm bg-surface border border-border flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-text">Premium Beat Plan</div>
                    <div className="text-xs text-text-muted">500k streams · WAV + Trackout Stems</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-accent-live">
                      {formatNaira(formData.premiumPrice)}
                    </span>
                    <span className="text-xs text-text-muted">You earn: {formatNaira(formData.premiumPrice * 0.8)}</span>
                  </div>
                </div>

                {/* Tier 3: Exclusive */}
                <div className="p-4 rounded-sm bg-surface border border-border flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-text">Exclusive Rights</div>
                    <div className="text-xs text-text-muted">Sole ownership · Beat retired permanently</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-accent-live">
                      {formatNaira(formData.exclusivePrice)}
                    </span>
                    <span className="text-xs text-text-muted">You earn: {formatNaira(formData.exclusivePrice * 0.8)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Buttons */}
            <div className="pt-6 border-t border-border flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as any)}
                  className="h-10 px-5 rounded-pill border border-border text-xs font-semibold text-text hover:bg-surface"
                >
                  Previous
                </button>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={isPublishing}
                className="h-10 px-6 rounded-pill bg-accent hover:bg-[#135d56] text-text font-bold text-xs uppercase tracking-wider border border-accent flex items-center gap-2 shadow-sm"
              >
                <span>{step === 3 ? (isPublishing ? 'Publishing...' : 'Publish Beat') : 'Continue'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        )}
      </main>

      <HomeFooter />
    </div>
  );
}
