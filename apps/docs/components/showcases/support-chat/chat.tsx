'use client';

import { createFloaty } from '@ryumy97/floaty-react';
import { type FormEvent, useState } from 'react';
import { useChatOpen } from './open';

export type ChatForm = 'bubble' | 'panel' | 'page';

export const chat = createFloaty<{ form: ChatForm }>('showcase-chat');

interface Message {
  id: number;
  from: 'agent' | 'you';
  text: string;
}

function Chat() {
  const form = chat.useFloatyState()?.form ?? 'bubble';
  const { setOpen } = useChatOpen();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: 'agent', text: 'Hi! What can I help you with today?' },
  ]);
  const [draft, setDraft] = useState('');
  const isBubble = form === 'bubble';
  const canMinimize = form === 'panel';

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((list) => [
      ...list,
      { id: Date.now(), from: 'you', text },
      {
        id: Date.now() + 1,
        from: 'agent',
        text: 'Thanks — I will look into that and get back to you.',
      },
    ]);
    setDraft('');
  };

  return (
    <div className="relative size-full overflow-hidden rounded-2xl bg-fd-card text-fd-card-foreground shadow-float">
      <button
        type="button"
        aria-label="Open chat"
        onClick={() => setOpen(true)}
        className="absolute inset-0 flex items-center justify-center bg-float text-float-foreground transition-opacity duration-200"
        inert={isBubble ? undefined : true}
        style={{ opacity: isBubble ? 1 : 0 }}
      >
        <span className="text-sm font-semibold">Chat</span>
      </button>

      <div
        className="absolute inset-0 flex min-h-0 flex-col transition-opacity duration-200"
        inert={isBubble ? true : undefined}
        style={{ opacity: isBubble ? 0 : 1 }}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2 sm:px-4 sm:py-3">
          <span className="text-sm font-semibold">Support</span>
          {canMinimize && (
            <button
              type="button"
              aria-label="Minimize chat"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs text-fd-muted-foreground hover:bg-fd-muted"
            >
              Minimize
            </button>
          )}
        </header>
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 text-sm sm:p-4">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${
                message.from === 'you'
                  ? 'ml-auto bg-float text-float-foreground'
                  : 'bg-fd-muted text-fd-foreground'
              }`}
            >
              {message.text}
            </li>
          ))}
        </ul>
        <form onSubmit={send} className="flex shrink-0 gap-2 border-t p-2 sm:p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message…"
            aria-label="Message"
            className="min-w-0 flex-1 rounded-lg border bg-fd-background px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          />
          <button
            type="submit"
            className="rounded-lg bg-fd-primary px-3 text-sm font-medium text-fd-primary-foreground"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export function ChatFloaty() {
  return (
    <chat.Floaty className="size-full" transition={{ type: 'spring', duration: 450, bounce: 0.15 }}>
      <Chat />
    </chat.Floaty>
  );
}
