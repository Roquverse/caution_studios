'use client';

import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { Plus, Minus } from 'lucide-react';

export interface AccordionItemData {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItemData[];
  defaultOpenId?: string;
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpenId,
  allowMultiple = false,
  className
}) => {
  const [openIds, setOpenIds] = useState<string[]>(
    defaultOpenId ? [defaultOpenId] : []
  );

  const toggle = (id: string) => {
    if (allowMultiple) {
      setOpenIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={cn('space-y-3 w-full', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div
            key={item.id}
            className={cn(
              'rounded-xl border transition-all duration-200 overflow-hidden',
              isOpen
                ? 'bg-zinc-50 border-zinc-300 shadow-sm'
                : 'bg-white border-gray-200/70 hover:border-gray-300'
            )}
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between px-6 py-5 text-left font-semibold text-gray-900 transition-colors"
            >
              <span className="text-base text-gray-850 font-medium">{item.title}</span>
              <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500">
                {isOpen ? (
                  <Minus className="h-4 w-4 text-black" />
                ) : (
                  <Plus className="h-4 w-4 text-gray-600" />
                )}
              </span>
            </button>
            {isOpen && (
              <div className="px-6 pb-6 pt-1 text-sm text-gray-600 leading-relaxed border-t border-zinc-200">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
