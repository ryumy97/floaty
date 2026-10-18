'use client';

// #region example
import { Floaty, FloatyAnchor } from '@ryumy97/floaty-react';
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button
      type="button"
      onClick={() => setCount(count + 1)}
      style={{ width: '100%', height: '100%' }}
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
          {!docked && <FloatyAnchor floatyId="counter" style={{ height: 200 }} />}
        </main>
        <aside style={{ width: 160 }}>
          {docked && <FloatyAnchor floatyId="counter" style={{ height: 48 }} />}
        </aside>
      </div>
    </>
  );
}
// #endregion
