'use client';

import React, { useState } from 'react';
import { Testimonial } from '@caution/types';
import { Rating } from './Rating';
import { Avatar } from './Avatar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export interface TestimonialsSectionProps {
  testimonials?: Testimonial[];
  className?: string;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'David Smith',
    role: 'Founder',
    company: 'YNT Studio',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote:
      'The licensing workflow is effortlessly smooth. As a commercial director, I have cleared dozens of YouTube brand campaigns without a single copyright claim.'
  },
  {
    id: '2',
    name: 'Olvin Roy',
    role: 'Content Creator',
    company: 'PixelCraft',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote:
      'Finding fresh cinematic and lofi beats used to take hours. With the instant waveform previews and mood filters, I pick my soundtrack in minutes.'
  },
  {
    id: '3',
    name: 'John Doe',
    role: 'Head of Media',
    company: 'Apex Media',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote:
      'Outstanding audio fidelity and production quality. Every track sounds mixed and mastered for cinema sound systems and streaming platforms.'
  },
  {
    id: '4',
    name: 'Sarah Chen',
    role: 'Indie Filmmaker',
    company: 'Chen Films',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote:
      'Having full worldwide coverage across TikTok, cinema, and broadcast gives our production agency complete peace of mind with international clients.'
  }
];

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonials = DEFAULT_TESTIMONIALS,
  className
}) => {
  const [startIndex, setStartIndex] = useState(0);

  const prev = () => {
    setStartIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, testimonials.length - 3)));
  };

  const next = () => {
    setStartIndex((prev) => (prev + 3 < testimonials.length ? prev + 1 : 0));
  };

  const visibleTestimonials = testimonials.slice(startIndex, startIndex + 3);

  return (
    <section className={cn('py-20 lg:py-28 bg-white', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
            Client Testimonials
          </h2>
        </div>

        {/* Carousel Container with Arrows */}
        <div className="relative flex items-center">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonials"
            className="hidden md:flex absolute -left-4 xl:-left-6 z-10 h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-black focus:outline-none"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {visibleTestimonials.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-[#FAFAFA] p-7 transition-all duration-300 hover:shadow-soft-card hover:bg-white hover:border-gray-200"
              >
                <div>
                  {/* Top: Avatar & Stars */}
                  <div className="flex items-center justify-between mb-5">
                    <Avatar
                      src={item.avatar}
                      name={item.name}
                      size="lg"
                    />
                    <Rating value={item.rating} size="sm" />
                  </div>

                  {/* Quote */}
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed italic mb-6">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-4 border-t border-gray-100/80">
                  <h4 className="text-sm font-bold text-gray-950">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-400 font-medium">
                    {item.company}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={next}
            aria-label="Next testimonials"
            className="hidden md:flex absolute -right-4 xl:-right-6 z-10 h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-black focus:outline-none"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
