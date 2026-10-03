'use client';

import React, { useState } from 'react';
import { Button } from '@caution/ui';
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, Disc3, Sparkles } from 'lucide-react';

interface LetsTalkSectionProps {
  onBookCall: () => void;
}

export const LetsTalkSection: React.FC<LetsTalkSectionProps> = ({ onBookCall }) => {
  const [selectedDay, setSelectedDay] = useState<number>(14);
  const [selectedSlot, setSelectedSlot] = useState<string>('2:30 PM');

  const days = [
    { num: 28, current: false }, { num: 29, current: false }, { num: 30, current: false },
    { num: 1, current: true }, { num: 2, current: true }, { num: 3, current: true }, { num: 4, current: true },
    { num: 5, current: true }, { num: 6, current: true }, { num: 7, current: true }, { num: 8, current: true },
    { num: 9, current: true }, { num: 10, current: true }, { num: 11, current: true },
    { num: 12, current: true }, { num: 13, current: true }, { num: 14, current: true }, { num: 15, current: true },
    { num: 16, current: true }, { num: 17, current: true }, { num: 18, current: true },
    { num: 19, current: true }, { num: 20, current: true }, { num: 21, current: true }, { num: 22, current: true },
    { num: 23, current: true }, { num: 24, current: true }, { num: 25, current: true },
    { num: 26, current: true }, { num: 27, current: true }, { num: 28, current: true }, { num: 29, current: true },
    { num: 30, current: true }, { num: 31, current: true }, { num: 1, current: false }
  ];

  const timeSlots = ['11:00 AM', '2:30 PM', '4:15 PM', '6:00 PM'];

  return (
    <section id="contact" className="bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] sm:rounded-[44px] bg-[#07090D] border border-white/10 p-8 sm:p-12 lg:p-16 text-white shadow-2xl">
          {/* Ambient Lighting */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-[#04564f]/20 blur-[130px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold tracking-widest uppercase text-[#2dd4bf] block">
                Direct A&R Strategy Session
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05]">
                Let’s Talk About <br className="hidden sm:block" />
                Your Music
              </h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-lg leading-relaxed">
                Connect 1-on-1 with our executive team. We review your catalog, analyze current streaming bottlenecks, and formulate a targeted marketing blueprint tailored to your sound.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  pill
                  onClick={onBookCall}
                  className="bg-[#04564f] hover:bg-[#03453f] text-white px-8 py-4 font-bold shadow-lg shadow-[#04564f]/30 transition-all transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  Book a Call
                </Button>
                <div className="flex items-center gap-3 px-2">
                  <div className="flex -space-x-2">
                    <div className="h-9 w-9 rounded-full bg-emerald-600 border-2 border-[#07090D] flex items-center justify-center text-xs font-bold text-white">
                      AR
                    </div>
                    <div className="h-9 w-9 rounded-full bg-teal-600 border-2 border-[#07090D] flex items-center justify-center text-xs font-bold text-white">
                      CS
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="text-white font-semibold block">4 Curators Online</span>
                    Next opening today
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Calendar Widget Mockup */}
            <div className="lg:col-span-6">
              <div className="bg-[#0E131B]/95 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative">
                {/* Calendar Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#2dd4bf]" />
                    <span className="font-bold text-white text-base">October 2026</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Day of Week */}
                <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 mb-2">
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                  <span>S</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {days.map((day, idx) => {
                    const isSelected = day.current && day.num === selectedDay;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => day.current && setSelectedDay(day.num)}
                        disabled={!day.current}
                        className={`h-9 sm:h-10 rounded-xl flex items-center justify-center font-medium transition-all ${
                          isSelected
                            ? 'bg-[#04564f] text-white font-bold ring-2 ring-[#2dd4bf]/40 shadow-md'
                            : day.current
                            ? 'text-gray-200 hover:bg-white/10'
                            : 'text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {day.num}
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots Selector */}
                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2.5">
                    <span className="flex items-center gap-1.5 font-semibold text-gray-300">
                      <Clock className="h-3.5 w-3.5 text-[#2dd4bf]" /> Available Times (GMT+1)
                    </span>
                    <span className="text-[#2dd4bf]">30 min consultation</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {timeSlots.map((slot) => {
                      const isChosen = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`text-xs py-2 px-2.5 rounded-xl font-medium transition-all ${
                            isChosen
                              ? 'bg-[#04564f] text-white font-bold shadow-md'
                              : 'bg-white/5 hover:bg-white/10 text-gray-300'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom confirm CTA inside calendar */}
                <div className="mt-5 pt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Selected: <span className="text-white font-bold">Oct {selectedDay}, {selectedSlot}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onBookCall}
                    className="text-xs font-bold text-[#2dd4bf] hover:text-white transition-colors flex items-center gap-1"
                  >
                    Confirm Session →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
