'use client';

import { createFloaty } from '@floaty/react';
import type { ReactNode } from 'react';

const blob = createFloaty<{ children: ReactNode }>('blob');

const Content = () => {
  const state = blob.useFloatyState();

  return state?.children;
};

export const Blob = () => {
  return (
    <blob.Floaty
      className="flex size-full items-center justify-center rounded-2xl bg-float font-medium text-float-foreground shadow-float"
      transition={{ type: 'spring', duration: 450, bounce: 0.2 }}
    >
      <Content />
    </blob.Floaty>
  );
};

export const BlobAnchor = blob.FloatyAnchor;
