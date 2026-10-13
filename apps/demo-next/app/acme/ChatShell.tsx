'use client';

import { createFloaty } from '@floaty/react';
import Link from 'next/link';
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { ExampleHeader } from '../ExampleHeader';

interface ChatAnchorState {
  form: 'bubble' | 'panel' | 'page';
}

export const chat = createFloaty<ChatAnchorState>('support-chat');

const ChatContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(
  null,
);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error('useChat() must be used inside <ChatShell>.');
  return value;
}

export function ChatShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ChatContext.Provider value={{ open, setOpen }}>
      <div className="ex">
        <ExampleHeader
          logo="Acme"
          home="/acme"
          links={[
            { href: '/acme', label: 'Product' },
            { href: '/acme/pricing', label: 'Pricing' },
            { href: '/acme/docs', label: 'Docs' },
            { href: '/acme/support', label: 'Support' },
          ]}
        />
        {children}
      </div>

      {/* Resizing this one anchor between bubble and panel animates like a move. */}
      <div className="chat-dock">
        <chat.FloatyAnchor
          className={`chat-dock-anchor${open ? ' open' : ''}`}
          state={{ form: open ? 'panel' : 'bubble' }}
        />
      </div>

      <chat.Floaty transition={{ type: 'spring', duration: 450, bounce: 0.15 }}>
        <Chat />
      </chat.Floaty>
    </ChatContext.Provider>
  );
}

/** The support page's slot; wins over the dock while mounted. */
export function ChatPageAnchor() {
  const { setOpen } = useChat();
  // Leaving the page drops the conversation back into the open panel, not the bubble.
  useEffect(() => setOpen(true), [setOpen]);
  return <chat.FloatyAnchor className="chat-page-anchor" priority={1} state={{ form: 'page' }} />;
}

export function TalkToSales({ children }: { children: ReactNode }) {
  const { setOpen } = useChat();
  return (
    <button type="button" className="ex-primary" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

interface Message {
  id: number;
  from: 'agent' | 'you';
  text: string;
}

const REPLIES: [RegExp, string][] = [
  [/price|pricing|cost|plan/i, 'Our Team plan is $12 per seat per month, billed yearly. Want me to set up a trial?'],
  [/trial|demo/i, 'Done! A 14-day trial is on its way to your inbox.'],
  [/bug|error|broken|issue/i, 'Sorry about that. Could you tell me which page you were on? I will pass it to the team.'],
  [/hi|hello|hey/i, 'Hi! What can I help you with today?'],
];

function replyTo(text: string): string {
  return (
    REPLIES.find(([pattern]) => pattern.test(text))?.[1] ??
    'Thanks! Let me check that with the team and get back to you here.'
  );
}

function Chat() {
  const form = chat.useFloatyState()?.form ?? 'bubble';
  const { setOpen } = useChat();
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: 'agent', text: 'Hi, I am Sam from Acme. Ask me anything, I will stay with you on every page.' },
  ]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const nextId = useRef(1);
  const isBubble = form === 'bubble';
  const isBubbleRef = useRef(isBubble);
  isBubbleRef.current = isBubble;

  useEffect(() => {
    if (!isBubble) setUnread(0);
  }, [isBubble]);

  useLayoutEffect(() => {
    const el = list.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    stickToBottom.current = true;
    setMessages((m) => [...m, { id: nextId.current++, from: 'you', text }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: nextId.current++, from: 'agent', text: replyTo(text) }]);
      if (isBubbleRef.current) setUnread((u) => u + 1);
    }, 1200);
  };

  return (
    <div className={`chat ${form}`} data-testid="chat">
      <button
        type="button"
        className="chat-bubble ex-form"
        inert={!isBubble}
        aria-label="Open chat"
        onClick={() => setOpen(true)}
      >
        💬
        {unread > 0 && isBubble && <span className="chat-unread">{unread}</span>}
      </button>

      <div className="chat-window ex-form" inert={isBubble}>
        <div className="chat-head">
          <span className="chat-avatar">S</span>
          <div>
            <strong>Acme support</strong>
            <span>{typing ? 'Sam is typing…' : 'Sam · replies in a minute'}</span>
          </div>
          {form === 'panel' && (
            <>
              <Link href="/acme/support" className="chat-icon" aria-label="Expand chat">
                ⤢
              </Link>
              <button
                type="button"
                className="chat-icon"
                aria-label="Minimize chat"
                onClick={() => setOpen(false)}
              >
                –
              </button>
            </>
          )}
        </div>
        <div
          ref={list}
          className="chat-messages"
          data-testid="chat-messages"
          onScroll={(e) => {
            const el = e.currentTarget;
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
          }}
        >
          {messages.map((message) => (
            <p key={message.id} className={`chat-message ${message.from}`}>
              {message.text}
            </p>
          ))}
          {typing && <p className="chat-message agent typing">• • •</p>}
        </div>
        <form className="chat-input" onSubmit={send}>
          <input
            aria-label="Message"
            placeholder="Write a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" disabled={!draft.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
