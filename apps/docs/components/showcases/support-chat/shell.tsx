'use client';

import { type ReactNode, useState } from 'react';
import { ShowcaseHeader } from '../showcase-header';
import { ChatFloaty } from './chat';
import { ChatOpenContext } from './open';

/** Keeps the floaty chat and open state mounted across the product page and /chat. */
export function SupportChatShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <ChatOpenContext.Provider value={{ open, setOpen }}>
      <div className="flex min-h-0 flex-1 flex-col bg-fd-background text-fd-foreground">
        <ChatFloaty />
        <ShowcaseHeader />
        <div className="relative flex-1 overflow-auto">{children}</div>
      </div>
    </ChatOpenContext.Provider>
  );
}
