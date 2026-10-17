'use client';

import Link from 'next/link';
import { chat } from './chat';
import { useChatOpen } from './open';

/** Product page with a docked chat bubble that opens into a panel. */
export function SupportChatHome() {
  const { open, setOpen } = useChatOpen();

  return (
    <div className="relative flex-1 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-sm font-medium text-fd-muted-foreground">Acme</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ship with confidence</h1>
        <p className="mt-4 text-lg text-fd-muted-foreground">
          Click the chat dock to open it here, or talk to sales to open a full-page conversation —
          the draft and messages stay put either way.
        </p>
        <Link
          href="/examples/support-chat/chat"
          onClick={() => setOpen(true)}
          className="mt-8 inline-flex h-10 items-center rounded-lg bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground"
        >
          Talk to sales
        </Link>
      </div>

      <div
        className={`fixed right-4 bottom-4 z-10 sm:right-6 sm:bottom-6 ${
          open ? 'h-80 w-80' : 'h-14 w-14'
        }`}
      >
        <chat.FloatyAnchor className="size-full" state={{ form: open ? 'panel' : 'bubble' }} />
      </div>
    </div>
  );
}
