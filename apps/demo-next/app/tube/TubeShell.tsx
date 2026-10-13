'use client';

import { createFloaty } from '@floaty/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { formatTime, getVideo, type Video } from './videos';

interface PlayerAnchorState {
  mode: 'full' | 'mini';
}

/** The one video player of the app, shared by the watch page and the mini player dock. */
export const player = createFloaty<PlayerAnchorState>('video');

/** Duration of the player's flight, shared with the CSS morph between its forms. */
const FLIGHT_MS = 550;

interface TubeContextValue {
  nowPlaying: Video | null;
  history: Video[];
  theater: boolean;
  setTheater: (theater: boolean) => void;
  closePlayer: () => void;
}

const TubeContext = createContext<TubeContextValue | null>(null);

export function useTube(): TubeContextValue {
  const value = useContext(TubeContext);
  if (!value) throw new Error('useTube() must be used inside <TubeShell>.');
  return value;
}

function watchedIdFrom(pathname: string): string | null {
  const match = /^\/tube\/watch\/([^/]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Lives in the `/tube` layout, so it stays mounted across client-side navigations
 * between its pages, and with it the player inside `<player.Floaty>`.
 */
export function TubeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null);
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [theater, setTheater] = useState(false);

  // Derived during render so the player switches videos in the same commit as the route.
  const watchedId = watchedIdFrom(pathname);
  if (watchedId && watchedId !== nowPlayingId && getVideo(watchedId)) {
    setNowPlayingId(watchedId);
    setHistoryIds((ids) => [watchedId, ...ids.filter((id) => id !== watchedId)]);
  }

  const nowPlaying = nowPlayingId ? (getVideo(nowPlayingId) ?? null) : null;
  const value: TubeContextValue = {
    nowPlaying,
    history: historyIds.map((id) => getVideo(id)).filter((v): v is Video => !!v),
    theater,
    setTheater,
    closePlayer: () => setNowPlayingId(null),
  };

  return (
    <TubeContext.Provider value={value}>
      <div className="tube">
        <TubeHeader pathname={pathname} />
        {children}
      </div>

      {/* Lower priority than the watch page's anchor: the fallback on every other page. */}
      {nowPlaying && (
        <div className="tube-dock">
          <player.FloatyAnchor className="tube-dock-anchor" state={{ mode: 'mini' }} />
        </div>
      )}

      <player.Floaty transition={{ type: 'spring', duration: FLIGHT_MS, bounce: 0.12 }}>
        {nowPlaying && <Player key={nowPlaying.id} video={nowPlaying} />}
      </player.Floaty>
    </TubeContext.Provider>
  );
}

function TubeHeader({ pathname }: { pathname: string }) {
  const links = [
    { href: '/tube', label: 'Home' },
    { href: '/tube/library', label: 'Library' },
  ];
  return (
    <header className="tube-header">
      <Link href="/tube" className="tube-logo">
        Floatube
      </Link>
      <nav className="tube-nav">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <Link href="/" className="tube-back">
        All examples
      </Link>
    </header>
  );
}

function Player({ video }: { video: Video }) {
  const { closePlayer } = useTube();
  // Switches at take-off; the CSS transitions morph between the forms during the flight.
  const mode = player.useFloatyState()?.mode ?? 'full';
  const mini = mode === 'mini';
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const ended = elapsed >= video.duration;

  useEffect(() => {
    if (!playing || ended) return;
    const timer = setInterval(() => setElapsed((e) => Math.min(e + 1, video.duration)), 1000);
    return () => clearInterval(timer);
  }, [playing, ended, video.duration]);

  const togglePlay = () => {
    if (ended) setElapsed(0);
    setPlaying((p) => ended || !p);
  };
  const isPlaying = playing && !ended;

  const playButton = (
    <button
      type="button"
      className="tube-icon-button"
      aria-label={isPlaying ? 'Pause' : 'Play'}
      onClick={togglePlay}
    >
      {isPlaying ? '❚❚' : '▶'}
    </button>
  );
  const time = (active: boolean) => (
    <span data-testid={active ? 'elapsed' : undefined}>{formatTime(elapsed)}</span>
  );

  // Both control panels stay rendered and cross-fade; the hidden one is inert.
  return (
    <div
      className={`tube-player ${mode}`}
      style={{ '--hue': video.hue, '--flight': `${FLIGHT_MS}ms` } as CSSProperties}
      data-testid="player"
    >
      <div
        className={`tube-screen${isPlaying ? ' playing' : ''}`}
        onClick={mini ? undefined : togglePlay}
      >
        <div className="tube-art" />
        <span className="tube-screen-title">{video.title}</span>
        {mini && (
          <Link
            href={`/tube/watch/${video.id}`}
            className="tube-expand"
            aria-label="Expand player"
          />
        )}
      </div>
      <div className="tube-panel tube-panel-full" inert={mini}>
        {playButton}
        <span className="tube-time">
          {time(!mini)} / {formatTime(video.duration)}
        </span>
        <input
          type="range"
          className="tube-seek"
          aria-label="Seek"
          min={0}
          max={video.duration}
          value={elapsed}
          onChange={(e) => setElapsed(Number(e.target.value))}
        />
      </div>
      <div className="tube-panel tube-panel-mini" inert={!mini}>
        {playButton}
        <div className="tube-mini-info">
          <strong>{video.title}</strong>
          {time(mini)}
        </div>
        <button
          type="button"
          className="tube-icon-button"
          aria-label="Close player"
          onClick={closePlayer}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** The watch page's slot for the player; wins over the dock while mounted. */
export function PlayerAnchor() {
  return <player.FloatyAnchor className="tube-player-anchor" priority={1} state={{ mode: 'full' }} />;
}

export function WatchLayout({ details, upNext }: { details: ReactNode; upNext: ReactNode }) {
  const { theater } = useTube();
  return (
    <div className={`tube-watch${theater ? ' theater' : ''}`}>
      <div className="tube-watch-player">
        <PlayerAnchor />
      </div>
      <div className="tube-watch-details">{details}</div>
      <div className="tube-watch-upnext">{upNext}</div>
    </div>
  );
}

export function TheaterToggle() {
  const { theater, setTheater } = useTube();
  return (
    <button
      type="button"
      className="tube-pill"
      aria-pressed={theater}
      onClick={() => setTheater(!theater)}
    >
      Theater mode
    </button>
  );
}

export function NowPlayingBadge({ id }: { id: string }) {
  const { nowPlaying } = useTube();
  return nowPlaying?.id === id ? <span className="tube-badge">Now playing</span> : null;
}

export function Thumbnail({ video, small }: { video: Video; small?: boolean }) {
  return (
    <div
      className={`tube-thumb${small ? ' small' : ''}`}
      style={{ '--hue': video.hue } as CSSProperties}
    >
      <NowPlayingBadge id={video.id} />
      <span className="tube-duration">{formatTime(video.duration)}</span>
    </div>
  );
}

export function History() {
  const { history } = useTube();
  if (history.length === 0) {
    return (
      <p className="tube-empty">
        Nothing watched yet. <Link href="/tube">Find something to watch</Link>.
      </p>
    );
  }
  return (
    <ul className="tube-rows">
      {history.map((video) => (
        <li key={video.id}>
          <Link href={`/tube/watch/${video.id}`} className="tube-row">
            <Thumbnail video={video} small />
            <span>
              <strong>{video.title}</strong>
              <span className="tube-meta">
                {video.channel} · {video.views}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
