'use client';

import { createFloaty } from '@ryumy97/floaty-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getVideo, type Video } from './videos';

export type PlayerMode = 'full' | 'mini' | 'empty';

export interface PlayerState {
  mode: PlayerMode;
  videoId: string | null;
}

export const player = createFloaty<PlayerState>('showcase-player');

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function EmptyMini() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-anchor bg-anchor-fill p-2 text-center text-fd-muted-foreground shadow-none">
      <span className="text-lg opacity-50" aria-hidden>
        ▶
      </span>
      <span className="text-[10px] leading-tight">Nothing playing</span>
    </div>
  );
}

function Player() {
  const state = player.useFloatyState();
  const mode = state?.mode ?? 'empty';
  const video = state?.videoId ? getVideo(state.videoId) : null;
  const [elapsed, setElapsed] = useState(12);
  const isMini = mode === 'mini';
  const isEmpty = mode === 'empty' || !video;

  // biome-ignore lint/correctness/useExhaustiveDependencies: restart the playhead when the video changes
  useEffect(() => {
    setElapsed(12);
  }, [video?.id]);

  useEffect(() => {
    if (!video) return;
    const id = setInterval(() => setElapsed((t) => (t >= video.duration ? 0 : t + 1)), 1000);
    return () => clearInterval(id);
  }, [video]);

  if (isEmpty) {
    return <EmptyMini />;
  }

  const body = (
    <>
      <div
        className={`flex flex-1 items-center justify-center rounded-xl ${
          isMini ? 'min-h-0' : 'min-h-32'
        }`}
        style={{ background: `hsl(${video.hue} 45% 22%)` }}
      >
        <span className={isMini ? 'text-lg' : 'text-4xl'} aria-hidden>
          ▶
        </span>
      </div>
      <div className={`mt-2 ${isMini ? 'space-y-1' : 'space-y-2'}`}>
        {!isMini && <p className="truncate text-sm font-medium sm:text-base">{video.title}</p>}
        <div className="h-1 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-1000 linear"
            style={{ width: `${(elapsed / video.duration) * 100}%` }}
          />
        </div>
        <p className={`tabular-nums text-white/80 ${isMini ? 'text-[10px]' : 'text-xs'}`}>
          {formatTime(elapsed)} / {formatTime(video.duration)}
        </p>
      </div>
    </>
  );

  const shell = `flex size-full flex-col overflow-hidden bg-float text-float-foreground shadow-float ${
    isMini ? 'rounded-xl p-2' : 'rounded-2xl p-3 sm:p-4'
  }`;

  if (isMini) {
    return (
      <Link
        href={`/examples/mini-player/${video.id}`}
        className={`${shell} cursor-pointer text-left`}
        aria-label={`Open ${video.title}`}
      >
        {body}
      </Link>
    );
  }

  return <div className={shell}>{body}</div>;
}

export function PlayerFloaty() {
  return (
    <player.Floaty
      className="size-full"
      transition={{ type: 'spring', duration: 450, bounce: 0.2 }}
    >
      <Player />
    </player.Floaty>
  );
}

export function Thumb({ video }: { video: Video }) {
  return (
    <div
      className="flex aspect-video items-center justify-center text-white/90"
      style={{ background: `hsl(${video.hue} 40% 35%)` }}
      aria-hidden
    >
      ▶
    </div>
  );
}
