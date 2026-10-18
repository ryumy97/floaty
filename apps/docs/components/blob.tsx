'use client';

import { createFloaty } from '@ryumy97/floaty-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** `className` reshapes the blob per anchor, so it can match the anchor's corner radius. */
const blob = createFloaty<{ children: ReactNode; className?: string }>('blob');

const Content = () => {
  const state = blob.useFloatyState();

  return (
    <div
      className={cn(
        'flex size-full items-center justify-center rounded-2xl bg-float font-medium text-float-foreground shadow-float transition-[border-radius] duration-300',
        state?.className,
      )}
    >
      {state?.children}
    </div>
  );
};

export const Blob = () => {
  return (
    <blob.Floaty
      className="size-full"
      style={{ pointerEvents: 'none' }}
      transition={{ type: 'spring', duration: 450, bounce: 0.2 }}
    >
      <Content />
    </blob.Floaty>
  );
};

export const BlobAnchor = blob.FloatyAnchor;
