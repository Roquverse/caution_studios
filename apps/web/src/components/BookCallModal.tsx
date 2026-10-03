'use client';

import React, { useState } from 'react';
import { Modal, Button } from '@caution/ui';
import { Calendar, Clock, CheckCircle2, Music, User, Mail, Phone, Send } from 'lucide-react';

interface BookCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookCallModal: React.FC<BookCallModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    genre: 'Afrobeats',
    demoLink: '',
    timeSlot: '2:30 PM (WAT)'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      genre: 'Afrobeats',
      demoLink: '',
      timeSlot: '2:30 PM (WAT)'
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={submitted ? 'Call Booked' : 'Book an A&R Strategy Session'}
      maxWidth="xl"
    >
      {submitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-[#04564f]">
            <CheckCircle2 className="h-10 w-10 text-[#04564f]" />
          </div>
          <h3 className="text-xl font-black text-gray-950">
            Session Confirmed, {formData.name || 'Artist'}!
          </h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            Our Senior A&R Team will meet with you at <strong className="text-gray-900">{formData.timeSlot}</strong>. A calendar invite and Google Meet link have been sent to <strong className="text-gray-900">{formData.email || 'your email'}</strong>.
          </p>
          <div className="pt-4">
            <Button
              variant="primary"
              pill
              onClick={handleReset}
              className="bg-[#04564f] hover:bg-[#03453f] text-white px-8 py-2.5 font-bold text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-gray-500">
            Schedule a complimentary 30-minute consultation with our A&R directors to review your tracks, discuss licensing, and design your playlist campaign.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Artist / Stage Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Burna Boy, Rema"
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-[#04564f] focus:outline-none focus:ring-1 focus:ring-[#04564f]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="artist@example.com"
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-[#04564f] focus:outline-none focus:ring-1 focus:ring-[#04564f]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Phone / WhatsApp
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+234 801 234 5678"
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-[#04564f] focus:outline-none focus:ring-1 focus:ring-[#04564f]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Primary Genre
              </label>
              <select
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#04564f] focus:outline-none focus:ring-1 focus:ring-[#04564f]"
              >
                <option value="Afrobeats">Afrobeats</option>
                <option value="Amapiano">Amapiano</option>
                <option value="Hip Hop / Rap">Hip Hop / Rap</option>
                <option value="R&B / Soul">R&B / Soul</option>
                <option value="Pop / Electronic">Pop / Electronic</option>
                <option value="Gospel">Gospel</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Music Demo or Spotify Link
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Music className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={formData.demoLink}
                onChange={(e) => setFormData({ ...formData, demoLink: e.target.value })}
                placeholder="https://open.spotify.com/track/... or Soundcloud/Drive"
                className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-[#04564f] focus:outline-none focus:ring-1 focus:ring-[#04564f]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-xs font-semibold text-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              pill
              className="bg-[#04564f] hover:bg-[#03453f] text-white px-6 py-2.5 font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Confirm Booking
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
