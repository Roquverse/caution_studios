'use client';

import React from 'react';
import { Headphones, ShieldCheck, Download } from 'lucide-react';

export const WorkflowProcessSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: Headphones,
      title: 'Preview every track',
      description:
        'Listen to full arrangements with precomputed waveforms. Filter by genre, BPM, key, or producer to find the exact sonic foundation for your song.'
    },
    {
      num: '02',
      icon: ShieldCheck,
      title: 'Lease or buy exclusively',
      description:
        'Choose your license tier. When an exclusive is purchased, our atomic database lock instantly retires the beat from the store so no one else can buy it.'
    },
    {
      num: '03',
      icon: Download,
      title: 'Instant downloads & contract',
      description:
        'Pay smoothly via Paystack. Get immediate access to 24-bit WAV master files, separated stems, and an electronically signed agreement in your library.'
    }
  ];

  return (
    <section id="process" className="bg-bg py-16 sm:py-24 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-live">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-text tracking-[-0.03em] mt-1">
            From preview to release in minutes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-6 rounded-sm bg-surface border border-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                    <span className="font-mono text-xs font-bold text-accent-live">
                      {step.num}
                    </span>
                    <Icon className="h-5 w-5 text-text-muted" />
                  </div>
                  <h3 className="text-base font-bold text-text mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
