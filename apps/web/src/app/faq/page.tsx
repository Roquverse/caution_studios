'use client';

import React from 'react';
import { Navbar, Footer, FAQSection, Button } from '@caution/ui';
import { HelpCircle, Mail } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Navbar
        brandName="Caution Studio"
        currentPath="/faq"
        onStartFree={() => (window.location.href = 'http://localhost:3001/register')}
        onSignIn={() => (window.location.href = 'http://localhost:3001/login')}
        userPortalUrl="http://localhost:3002"
        adminPortalUrl="http://localhost:3003"
        onNavigate={(href) => (window.location.href = href)}
      />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-10">
          <h1 className="text-4xl font-black text-gray-950 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Everything you need to know about our royalty-free music licensing, YouTube Content ID clearance, and pricing.
          </p>
        </div>

        <FAQSection />

        <div className="max-w-2xl mx-auto px-4 text-center pb-20">
          <div className="bg-blue-50/70 border border-blue-200/60 rounded-3xl p-8 space-y-4">
            <Mail className="h-8 w-8 text-[#1E50FF] mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">Still have questions?</h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto">
              Our licensing support specialists are ready to help clarify custom licenses, multi-channel clearances, or enterprise broadcast contracts.
            </p>
            <Button
              variant="primary"
              size="md"
              pill
              onClick={() => (window.location.href = '/contact')}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </main>

      <Footer brandName="Caution Studio" />
    </div>
  );
}
