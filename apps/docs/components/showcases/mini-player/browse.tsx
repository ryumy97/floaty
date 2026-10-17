'use client';

import Link from 'next/link';
import { player, Thumb } from './player';
import { usePlaying } from './shell';
import { getVideo, VIDEOS } from './videos';

export function MiniPlayerBrowse() {
  const { playingId } = usePlaying();
  const playing = playingId ? getVideo(playingId) : null;

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Browse</h1>
        <p className="mt-2 text-fd-muted-foreground">
          Pick a video, then leave the watch page — the player docks in the corner and keeps going.
          Click the mini player to open it again.
        </p>
      </div>

      {playing && (
        <div className="mb-3 text-sm font-medium text-fd-muted-foreground">
          Now playing · {playing.title}
        </div>
      )}

      <div className="grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {VIDEOS.map((item) => (
          <Link
            key={item.id}
            href={`/examples/mini-player/${item.id}`}
            className={`overflow-hidden rounded-xl border text-left transition-colors hover:bg-fd-accent ${
              item.id === playingId ? 'border-float bg-fd-card ring-1 ring-float/40' : 'bg-fd-card'
            }`}
          >
            <Thumb video={item} />
            <span className="block space-y-0.5 px-3 py-2">
              <span className="block truncate text-sm font-medium">{item.title}</span>
              <span className="block truncate text-xs text-fd-muted-foreground">
                {item.channel}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="fixed right-4 bottom-4 z-10 w-44 sm:right-6 sm:bottom-6 sm:w-52">
        <player.FloatyAnchor
          className="aspect-video w-full"
          state={
            playingId ? { mode: 'mini', videoId: playingId } : { mode: 'empty', videoId: null }
          }
        />
      </div>
    </div>
  );
}
