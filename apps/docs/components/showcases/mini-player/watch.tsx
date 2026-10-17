'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { player, Thumb } from './player';
import { usePlaying } from './shell';
import { VIDEOS, type Video } from './videos';

export function MiniPlayerWatch({ video }: { video: Video }) {
  const { setPlayingId } = usePlaying();
  const others = VIDEOS.filter((item) => item.id !== video.id);

  useEffect(() => {
    setPlayingId(video.id);
  }, [setPlayingId, video.id]);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_280px]">
      <div>
        <Link
          href="/examples/mini-player"
          className="mb-4 inline-block text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        >
          ← Back to list
        </Link>
        <player.FloatyAnchor
          className="aspect-video w-full"
          state={{ mode: 'full', videoId: video.id }}
        />
        <h1 className="mt-4 text-xl font-semibold sm:text-2xl">{video.title}</h1>
        <p className="mt-1 text-fd-muted-foreground">
          {video.channel} · {video.views}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-fd-muted-foreground">{video.description}</p>
      </div>
      <aside>
        <h2 className="mb-3 text-sm font-semibold text-fd-muted-foreground">Up next</h2>
        <ul className="space-y-3">
          {others.slice(0, 4).map((item) => (
            <li key={item.id}>
              <Link
                href={`/examples/mini-player/${item.id}`}
                className="flex w-full gap-3 rounded-lg text-left transition-colors hover:bg-fd-accent"
              >
                <div className="w-28 shrink-0 overflow-hidden rounded-md">
                  <Thumb video={item} />
                </div>
                <span className="min-w-0 py-0.5">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-fd-muted-foreground">
                    {item.channel}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
