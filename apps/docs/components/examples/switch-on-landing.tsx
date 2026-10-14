'use client';

// #region example
import { Floaty, FloatyAnchor, useFloatyTransition } from '@floaty/react';
import { useState } from 'react';

type CounterState = { compact: boolean };

function Counter() {
  const { state, settledState } = useFloatyTransition<CounterState>();
  const [count, setCount] = useState(0);
  // Compact as soon as it leaves for the sidebar (`state`), and full again
  // only once it has landed in the main area (`settledState`).
  const compact = state?.compact || settledState?.compact;
  return (
    <button
      type="button"
      onClick={() => setCount(count + 1)}
      style={{ width: '100%', height: '100%', whiteSpace: 'nowrap', overflow: 'hidden' }}
    >
      {compact ? count : `Clicked ${count} times`}
    </button>
  );
}

export default function App() {
  const [docked, setDocked] = useState(false);
  return (
    <>
      <Floaty floatyId="counter-landing">
        <Counter />
      </Floaty>

      <button type="button" onClick={() => setDocked(!docked)}>
        {docked ? 'Move to main' : 'Dock to sidebar'}
      </button>

      <div style={{ display: 'flex', gap: 16, marginTop: 16, height: 200 }}>
        <main style={{ flex: 1 }}>
          {!docked && (
            <FloatyAnchor
              floatyId="counter-landing"
              state={{ compact: false }}
              style={{ height: 200 }}
            />
          )}
        </main>
        <aside style={{ width: 64 }}>
          {docked && (
            <FloatyAnchor
              floatyId="counter-landing"
              state={{ compact: true }}
              style={{ height: 64 }}
            />
          )}
        </aside>
      </div>
    </>
  );
}
// #endregion
