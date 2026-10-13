'use client';

import {
  Floaty,
  FloatyAnchor,
  configureFloaty,
  useFloaty,
  useFloatyState,
  useFloatyTransition,
  type FloatyTransition,
} from '@floaty/react';
import { useEffect, useState } from 'react';

configureFloaty({ transition: { easing: 'cubic-bezier(0.22, 1, 0.36, 1)' } });

type Layout = 'grid' | 'list' | 'sidebar' | 'dock' | 'scroll box' | 'deferred' | 'hidden';

const LAYOUTS: Layout[] = ['grid', 'list', 'sidebar', 'dock', 'scroll box', 'deferred', 'hidden'];

interface CounterState {
  label: string;
  step: number;
  compact?: boolean;
}

interface PlayerState {
  mode: 'full' | 'mini';
}

function Counter() {
  const state = useFloatyState<CounterState>();
  const step = state?.step ?? 1;
  const [count, setCount] = useState(0);
  return (
    <div className={`card counter${state?.compact ? ' compact' : ''}`}>
      {!state?.compact && <strong>{state?.label ?? 'Counter'}</strong>}
      <span className="count">{count}</span>
      <button type="button" onClick={() => setCount((c) => c + step)}>
        +{step}
      </button>
    </div>
  );
}

function Player({ switchOnLanding }: { switchOnLanding: boolean }) {
  const { state, settledState } = useFloatyTransition<PlayerState>();
  const mode = (switchOnLanding ? settledState : state)?.mode ?? 'full';
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [playing]);
  const time = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  return (
    <div className={`card player ${mode}`}>
      <div className="screen">
        {mode === 'full' && <span>{playing ? 'Playing' : 'Paused'}</span>}
        <span className="time">{time}</span>
      </div>
      <button type="button" onClick={() => setPlaying((p) => !p)}>
        {playing ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}

function Status() {
  const player = useFloaty<PlayerState>('player');
  const counter = useFloaty<CounterState>('counter');
  return (
    <p className="status">
      player: {player.hasAnchor ? player.state?.mode : 'no anchor'}
      {player.isAnimating ? ' (animating)' : ''} | counter step: {counter.state?.step ?? '-'}
    </p>
  );
}

function Placeholder({ label }: { label: string }) {
  return <div className="placeholder">{label}</div>;
}

/** Grows with its own state, moving the anchors below without re-rendering them. */
function Expander() {
  const [open, setOpen] = useState(false);
  return (
    <div className="placeholder" style={{ minHeight: open ? 320 : 120 }}>
      <button type="button" onClick={() => setOpen((o) => !o)}>
        {open ? 'Collapse' : 'Expand'} this row
      </button>
    </div>
  );
}

function Placeholders({ label, count, from = 1 }: { label: string; count: number; from?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Placeholder key={i} label={`${label} ${from + i}`} />
      ))}
    </>
  );
}

function Content({ layout }: { layout: Layout }) {
  switch (layout) {
    case 'grid':
      return (
        <div className="grid">
          <FloatyAnchor floatyId="player" className="anchor big" state={{ mode: 'full' }} />
          <FloatyAnchor
            floatyId="counter"
            className="anchor"
            state={{ label: 'Grid counter', step: 1 }}
          />
          <Placeholders label="Item" count={18} />
        </div>
      );
    case 'list':
      return (
        <div className="list">
          <Expander />
          <Placeholders label="Row" count={2} />
          <FloatyAnchor
            floatyId="counter"
            className="anchor row"
            state={{ label: 'List counter (x10)', step: 10 }}
          />
          <Placeholders label="Row" count={6} from={4} />
          <FloatyAnchor floatyId="player" className="anchor row tall" state={{ mode: 'full' }} />
          <Placeholders label="Row" count={10} from={10} />
        </div>
      );
    case 'sidebar':
      return (
        <div className="with-sidebar">
          <aside>
            <FloatyAnchor floatyId="player" className="anchor mini" state={{ mode: 'mini' }} />
            <FloatyAnchor
              floatyId="counter"
              className="anchor mini"
              state={{ label: 'Sidebar', step: 1, compact: true }}
            />
          </aside>
          <main>
            <Placeholders label="Main content" count={12} />
          </main>
        </div>
      );
    case 'dock':
      return (
        <div className="list">
          <FloatyAnchor
            floatyId="counter"
            className="anchor row"
            state={{ label: 'Page counter', step: 1 }}
          />
          <Placeholders label="Row" count={14} />
          <div className="dock">
            <FloatyAnchor floatyId="player" className="anchor mini" state={{ mode: 'mini' }} />
          </div>
        </div>
      );
    case 'scroll box':
      return (
        <div className="scroll-box" data-testid="scroll-box">
          <Placeholders label="Box item" count={3} />
          <FloatyAnchor floatyId="player" className="anchor row tall" state={{ mode: 'full' }} />
          <Placeholders label="Box item" count={2} from={4} />
          <FloatyAnchor
            floatyId="counter"
            className="anchor row"
            state={{ label: 'Scroll box counter', step: 1 }}
          />
          <Placeholders label="Box item" count={6} from={6} />
        </div>
      );
    case 'deferred':
      return <Deferred />;
    case 'hidden':
      return <Placeholder label="No anchors here: floaties are hidden but keep their state." />;
  }
}

/** Mounts its anchor one commit after the layout, like a lazy route or Suspense boundary. */
function Deferred() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="list">
      <Placeholder label="Deferred layout: the player anchor mounts after 50ms" />
      {ready ? (
        <FloatyAnchor floatyId="player" className="anchor row tall" state={{ mode: 'full' }} />
      ) : (
        <Placeholder label="Loading..." />
      )}
      <Placeholders label="Row" count={4} />
    </div>
  );
}

export function App() {
  const [layout, setLayout] = useState<Layout>('grid');
  const [animated, setAnimated] = useState(true);
  const [duration, setDuration] = useState(400);
  const [kind, setKind] = useState<'easing' | 'spring'>('easing');
  const [bounce, setBounce] = useState(0.3);
  const [switchOnLanding, setSwitchOnLanding] = useState(false);
  const transition: FloatyTransition = !animated
    ? false
    : kind === 'spring'
      ? { type: 'spring', duration, bounce }
      : { duration };

  return (
    <>
      <header>
        <h1>Floaty playground</h1>
        <nav>
          {LAYOUTS.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={layout === l}
              onClick={() => setLayout(l)}
            >
              {l}
            </button>
          ))}
        </nav>
        <label>
          <input type="checkbox" checked={animated} onChange={(e) => setAnimated(e.target.checked)} />
          animate
        </label>
        <label>
          duration
          <input
            type="range"
            min={0}
            max={1500}
            step={50}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          {duration}ms
        </label>
        <label>
          <select value={kind} onChange={(e) => setKind(e.target.value as 'easing' | 'spring')}>
            <option value="easing">easing</option>
            <option value="spring">spring</option>
          </select>
        </label>
        {kind === 'spring' && (
          <label>
            bounce
            <input
              type="range"
              min={-0.5}
              max={0.9}
              step={0.05}
              value={bounce}
              onChange={(e) => setBounce(Number(e.target.value))}
            />
            {bounce.toFixed(2)}
          </label>
        )}
        <label>
          <input
            type="checkbox"
            checked={switchOnLanding}
            onChange={(e) => setSwitchOnLanding(e.target.checked)}
          />
          player switches form on landing
        </label>
        <Status />
      </header>

      <Floaty floatyId="player" transition={transition}>
        <Player switchOnLanding={switchOnLanding} />
      </Floaty>
      <Floaty floatyId="counter" transition={transition}>
        <Counter />
      </Floaty>

      <Content layout={layout} />
    </>
  );
}
