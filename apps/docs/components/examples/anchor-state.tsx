'use client';

// #region example
import { Floaty, FloatyAnchor, useFloatyState } from '@floaty/react';
import { useState } from 'react';

type CounterState = { color: string };

function Counter() {
  const state = useFloatyState<CounterState>();
  const [count, setCount] = useState(0); // kept in every color
  return (
    <button
      type="button"
      onClick={() => setCount(count + 1)}
      style={{
        width: '100%',
        height: '100%',
        background: state?.color,
        transition: 'background-color 300ms',
      }}
    >
      Clicked {count} times
    </button>
  );
}

export default function App() {
  const [docked, setDocked] = useState(false);
  return (
    <>
      <Floaty floatyId="counter">
        <Counter />
      </Floaty>

      <button type="button" onClick={() => setDocked(!docked)}>
        {docked ? 'Move to main' : 'Dock to sidebar'}
      </button>

      <div style={{ display: 'flex', gap: 16, marginTop: 16, height: 200 }}>
        <main style={{ flex: 1 }}>
          {!docked && (
            <FloatyAnchor floatyId="counter" state={{ color: '#4f46e5' }} style={{ height: 200 }} />
          )}
        </main>
        <aside style={{ width: 160 }}>
          {docked && (
            <FloatyAnchor floatyId="counter" state={{ color: '#0d9488' }} style={{ height: 48 }} />
          )}
        </aside>
      </div>
    </>
  );
}
// #endregion
