'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '@caution/types';
import {
  X,
  Send,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Mic,
  Calendar,
  CheckCheck,
  PhoneCall,
  Sparkles,
  Info
} from 'lucide-react';

interface ProducerChatModalProps {
  producer: Profile;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'artist' | 'producer';
  text: string;
  timestamp: string;
  hasContact?: boolean;
}

// Regex to detect phone numbers in international or local Nigerian format
const PHONE_NUMBER_REGEX = /(?:\+?234|0)[789][01]\d{8}|\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;

export const ProducerChatModal: React.FC<ProducerChatModalProps> = ({
  producer,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'producer',
      text: `Salute! I'm ${producer.display_name}. Let's make some heat. Tell me about your track or studio recording project.`,
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [contactWarning, setContactWarning] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Real-time phone number detection for safety and traceability
  useEffect(() => {
    if (PHONE_NUMBER_REGEX.test(inputText)) {
      setContactWarning(
        'Phone number detected: For your safety, contact exchanges are cryptographically logged for platform traceability. Keep payments on Caution Studio until meeting in person.'
      );
    } else {
      setContactWarning(null);
    }
  }, [inputText]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const containsContact = PHONE_NUMBER_REGEX.test(text);

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'artist',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasContact: containsContact
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setContactWarning(null);

    // Simulate Producer Reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          sender: 'producer',
          text: containsContact
            ? `Noted! Got your number recorded on our encrypted session log. I'll text you before we book the booth session. Let's lock in the sound!`
            : `Sounds solid! Let's schedule the recording session. Do you need custom vocal arrangement or should I prep the instrumental stems?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  const quickPrompts = [
    '🎙️ Book studio recording session',
    '🎹 Custom Afrobeats production inquiry',
    '🎚️ Exclusive license & vocal stems'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#0B0E14] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: '620px' }}
      >
        {/* Header */}
        <div className="p-4 bg-[#0F131C] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10">
              {producer.avatar_url ? (
                <img src={producer.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                  {producer.display_name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B0E14]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">{producer.display_name}</h3>
                <span className="px-1.5 py-0.5 rounded-[4px] bg-[#04564f]/30 border border-[#2dd4bf]/40 text-[9px] font-bold text-[#2dd4bf] flex items-center gap-1">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  <span>Verified Partner</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                <span>@{producer.handle}</span>
                <span>·</span>
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <Lock className="h-2.5 w-2.5" />
                  <span>Encrypted & Traceable</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security & Traceability Notice */}
        <div className="px-4 py-2 bg-[#04564f]/15 border-b border-[#2dd4bf]/20 flex items-center gap-2 text-[11px] text-teal-200">
          <Lock className="h-3.5 w-3.5 text-[#2dd4bf] shrink-0" />
          <span className="leading-snug">
            <strong>Secure Studio Session Chat:</strong> Only verified streaming producers can access direct chat. Contact sharing is audited for personal safety and fraud traceability until meeting in person.
          </span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => {
            const isArtist = msg.sender === 'artist';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isArtist ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                    isArtist
                      ? 'bg-[#04564f] text-white rounded-br-xs'
                      : 'bg-[#151A24] text-gray-200 border border-white/10 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.hasContact && (
                    <div className="mt-1.5 pt-1.5 border-t border-white/20 text-[10px] text-amber-300 flex items-center gap-1 font-mono">
                      <ShieldCheck className="h-3 w-3 shrink-0" />
                      <span>Traceable contact exchange logged</span>
                    </div>
                  )}
                </div>
                <div className="mt-1 px-1 flex items-center gap-1 text-[9px] text-gray-500 font-mono">
                  <span>{msg.timestamp}</span>
                  {isArtist && <CheckCheck className="h-3 w-3 text-[#2dd4bf]" />}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#151A24] px-3 py-2 rounded-xl w-fit border border-white/5">
              <span className="text-[11px] font-mono">{producer.display_name} is typing</span>
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-3 py-2 bg-[#0F131C] border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Contact Warning Banner */}
        {contactWarning && (
          <div className="px-4 py-2 bg-amber-500/15 border-t border-amber-500/30 flex items-center gap-2 text-[11px] text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="leading-snug">{contactWarning}</span>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-[#0F131C] border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${producer.display_name} about recording...`}
            className="flex-1 h-10 px-3.5 rounded-lg bg-[#0B0E14] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="h-10 px-4 rounded-lg bg-[#04564f] hover:bg-[#135d56] disabled:opacity-40 disabled:hover:bg-[#04564f] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Send</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
