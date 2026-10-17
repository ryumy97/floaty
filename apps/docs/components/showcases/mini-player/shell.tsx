'use client';

import { createContext, type ReactNode, useContext, useState } from 'react';
import { ShowcaseHeader } from '../showcase-header';
import { PlayerFloaty } from './player';

const PlayingContext = createContext<{
  playingId: string | null;
  setPlayingId: (id: string) => void;
} | null>(null);

export function usePlaying() {
  const value = useContext(PlayingContext);
  if (!value) throw new Error('usePlaying() must be used inside MiniPlayerShell.');
  return value;
}

/** Keeps the floaty player mounted across browse and watch routes. */
export function MiniPlayerShell({ children }: { children: ReactNode }) {
  const [playingId, setPlayingId] = useState<string | null>(null);

  return (
    <PlayingContext.Provider value={{ playingId, setPlayingId }}>
      <div className="flex min-h-0 flex-1 flex-col bg-fd-background text-fd-foreground">
        <PlayerFloaty />
        <ShowcaseHeader />
        <div className="relative flex-1 overflow-auto">{children}</div>
      </div>
    </PlayingContext.Provider>
  );
}
