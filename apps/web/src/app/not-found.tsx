'use client';

import React from 'react';
import { Button } from '@caution/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-white">
      <div className="max-w-md w-full rounded-3xl border border-gray-100 p-8 shadow-soft-card space-y-4">
        <h1 className="text-4xl font-black text-gray-950">404</h1>
        <h2 className="text-base font-bold text-gray-800">Track or Page Not Found</h2>
        <p className="text-xs text-gray-500">
          We couldn&apos;t find the page you were looking for in our music catalog.
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            size="sm"
            pill
            onClick={() => (window.location.href = '/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
