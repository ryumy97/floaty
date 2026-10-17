'use client';

import { createContext, useContext } from 'react';

export const ChatOpenContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function useChatOpen() {
  const value = useContext(ChatOpenContext);
  if (!value) throw new Error('useChatOpen() must be used inside SupportChatShell.');
  return value;
}
