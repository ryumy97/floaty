import { useEffect, useState } from 'react';
import { Floaty, FloatyAnchor, configureFloaty, useFloaty } from 'floaty-component';

configureFloaty({ transition: { easing: 'cubic-bezier(0.22, 1, 0.36, 1)' } });

type Layout = 'grid' | 'list' | 'sidebar' | 'hidden';

const LAYOUTS: Layout[] = ['grid', 'list', 'sidebar', 'hidden'];

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="card counter">
      <strong>Counter</strong>
      <span className="count">{count}</span>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        +1
      </button>
    </div>
  );
}

function Player() {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [playing]);
  return (
    <div className="card player">
      <div className="screen">
        <span>{playing ? 'Playing' : 'Paused'}</span>
        <span className="time">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
        </span>
      </div>
      <button type="button" onClick={() => setPlaying((p) => !p)}>
        {playing ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}

function Status() {
  const player = useFloaty('player');
  return (
    <p className="status">
      player: {player.hasAnchor ? 'anchored' : 'no anchor'}
      {player.isAnimating ? ' (animating)' : ''}
    </p>
  );
}

function Placeholder({ label }: { label: string }) {
  return <div className="placeholder">{label}</div>;
}

function Content({ layout }: { layout: Layout }) {
  switch (layout) {
    case 'grid':
      return (
        <div className="grid">
          <FloatyAnchor floatyId="player" className="anchor big" />
          <FloatyAnchor floatyId="counter" className="anchor" />
          <Placeholder label="Item" />
          <Placeholder label="Item" />
          <Placeholder label="Item" />
        </div>
      );
    case 'list':
      return (
        <div className="list">
          <Placeholder label="Row" />
          <FloatyAnchor floatyId="counter" className="anchor row" />
          <Placeholder label="Row" />
          <FloatyAnchor floatyId="player" className="anchor row tall" />
          <Placeholder label="Row" />
        </div>
      );
    case 'sidebar':
      return (
        <div className="with-sidebar">
          <aside>
            <FloatyAnchor floatyId="player" className="anchor mini" />
            <FloatyAnchor floatyId="counter" className="anchor mini" />
          </aside>
          <main>
            <Placeholder label="Main content" />
          </main>
        </div>
      );
    case 'hidden':
      return <Placeholder label="No anchors here: floaties are hidden but keep their state." />;
  }
}

export function App() {
  const [layout, setLayout] = useState<Layout>('grid');
  const [animated, setAnimated] = useState(true);
  const [duration, setDuration] = useState(400);
  const transition = animated ? { duration } : (false as const);

  return (
    <>
      <header>
        <h1>floaty-component</h1>
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
        <Status />
      </header>

      <Floaty floatyId="player" transition={transition}>
        <Player />
      </Floaty>
      <Floaty floatyId="counter" transition={transition}>
        <Counter />
      </Floaty>

      <Content layout={layout} />
    </>
  );
}
