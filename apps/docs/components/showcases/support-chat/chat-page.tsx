'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { chat } from './chat';
import { useChatOpen } from './open';

/** Full-page chat: the floaty anchors in the center, open, and cannot be closed here. */
export function SupportChatPage() {
  const { setOpen } = useChatOpen();

  useEffect(() => {
    setOpen(true);
  }, [setOpen]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-8 sm:px-6">
      <Link
        href="/examples/support-chat"
        className="mb-4 w-fit text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        ← Back to product
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Talk to sales</h1>
      <chat.FloatyAnchor
        className="h-[min(32rem,70dvh)] w-full"
        priority={1}
        state={{ form: 'page' }}
      />
    </div>
  );
}
