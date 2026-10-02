'use client';

import React from 'react';
import { Button } from '@caution/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 p-8 shadow-soft-card space-y-4">
        <h1 className="text-4xl font-black text-gray-950">404</h1>
        <h2 className="text-base font-bold text-gray-800">Admin Section Not Found</h2>
        <p className="text-xs text-gray-500">
          The requested management view or dataset was not found.
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            size="sm"
            pill
            onClick={() => (window.location.href = '/')}
          >
            Back to Overview
          </Button>
        </div>
      </div>
    </div>
  );
}
