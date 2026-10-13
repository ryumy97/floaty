'use client';

import { Floaty, FloatyAnchor, useFloatyState } from '@floaty/react';
import { useState } from 'react';

type Layout = 'card' | 'row';

function Counter() {
  const state = useFloatyState<{ compact: boolean }>();
  const [count, setCount] = useState(0);
  return (
    <button
      type="button"
      onClick={() => setCount((c) => c + 1)}
      className="flex size-full items-center justify-center rounded-xl bg-fd-primary font-medium text-fd-primary-foreground"
    >
      {state?.compact ? count : `Clicked ${count} times`}
    </button>
  );
}

/** Live example: one stateful button following two different layouts. */
export function LayoutDemo() {
  const [layout, setLayout] = useState<Layout>('card');
  return (
    <div className="not-prose my-6 rounded-xl border bg-fd-card p-4">
      <div className="mb-4 flex gap-2">
        {(['card', 'row'] as const).map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={layout === name}
            onClick={() => setLayout(name)}
            className="rounded-md border px-3 py-1 text-sm aria-pressed:bg-fd-accent aria-pressed:text-fd-accent-foreground"
          >
            {name}
          </button>
        ))}
      </div>

      <Floaty floatyId="docs-demo" transition={{ type: 'spring', duration: 450, bounce: 0.2 }}>
        <Counter />
      </Floaty>

      {layout === 'card' ? (
        <div className="grid grid-cols-2 items-center gap-4">
          <FloatyAnchor floatyId="docs-demo" state={{ compact: false }} className="h-40" />
          <p className="text-sm text-fd-muted-foreground">
            Click the button, then switch layouts. It is rendered once, in a layer on top of
            the page, so its count survives the switch.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <p className="flex-1 text-sm text-fd-muted-foreground">
            Same component instance, now compact: the anchor passes{' '}
            <code>{'{ compact: true }'}</code> as state.
          </p>
          <FloatyAnchor floatyId="docs-demo" state={{ compact: true }} className="size-12" />
        </div>
      )}
    </div>
  );
}
