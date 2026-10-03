'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  quote: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: '1',
    name: 'David Smith',
    role: 'XYZ',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote:
      'Lorem ipsum dolor sit amet, are consectetur adipiscing elit, sed very eiusmod tempor incididunt ut labore et dolore magna aliqua. and Auctor eu augue ut lectus arcu bibendum at. Porttitor leo a diam sollicitudin tempor id eu nisl. Accumsan nisl scelerisqu eu ultrices vitae auctor eu.'
  },
  {
    id: '2',
    name: 'Olvin Roy',
    role: 'Client',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote:
      'Maecenas faucibus eros ipsum, at lobortis libero commodo eget. Vestibulum feugiat dolor vitae are bibendum efficitur. Sed et vulputate eros. Aenean sem, egestas quis finibus eget, euismod id diam. Aenean posuere mauris nec tellus commodo fermentum a vestibulum sem tempor id are eu nis.'
  },
  {
    id: '3',
    name: 'John Deo',
    role: 'ABC',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote:
      'Morbi eget dictum ante, feugiat Cras turpis ligula, elementum at justo sed, ornare molestie turpis. Pellentesque tempus ipsum tincidunt libero interdum, non eleifend velit egestas. Nullam nunc leo, pulvinar non posuere in, are euismod quis magna. Etiam quis pharetra elit, a accumsan.'
  },
  {
    id: '4',
    name: 'Sarah Jenkins',
    role: 'Film Director',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote:
      'The licensing process on Caution Studio is blazing fast. Finding untagged beats and commercial stems ready for cinema and YouTube saved our post-production team weeks of back-and-forth.'
  }
];

export const ClientTestimonialsSection: React.FC = () => {
  const [startIndex, setStartIndex] = useState<number>(0);

  const prev = () => {
    setStartIndex((prevIdx) => (prevIdx > 0 ? prevIdx - 1 : Math.max(0, TESTIMONIALS.length - 3)));
  };

  const next = () => {
    setStartIndex((prevIdx) => (prevIdx + 3 < TESTIMONIALS.length ? prevIdx + 1 : 0));
  };

  const visibleTestimonials = TESTIMONIALS.slice(startIndex, startIndex + 3);

  return (
    <section className="bg-white py-20 lg:py-28 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight">
            Client Testimonials
          </h2>
        </div>

        {/* Carousel Container with Arrows on sides */}
        <div className="relative flex items-center justify-center">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonials"
            className="hidden md:flex absolute -left-5 lg:-left-7 z-10 h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Testimonial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
            {visibleTestimonials.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300"
              >
                <div>
                  {/* Top row: Avatar + 5 Stars */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="h-11 w-11 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-100">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* 5 Yellow Stars */}
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Quote Body */}
                  <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed italic mb-6">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-950">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {item.role}
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
            className="hidden md:flex absolute -right-5 lg:-right-7 z-10 h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
