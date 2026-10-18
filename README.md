# Floaty

Making easier to manage floating components.

In React, changing layout would often unmount and remount resulting loosing states inside the components.

Floaty lets React component move between places in your layout without remounting by separating **what** is rendered from **where** it appears.

## Get Started

```bash
pnpm add @ryumy97/floaty-react
```

- `<Floaty>` renders your content **once**, in a layer on top of the page. Put it in a
  shell that stays mounted and its state survives every layout change (including Next.js
  client navigations).
- `<FloatyAnchor>` is an empty placeholder in your layouts. It reserves space; the floating
  content is drawn over whichever anchor is active.

## Examples

This example describes an simple counter persisting and state between layout shift.

```jsx
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
```

For more examples visit [floaty.ryumy.com/examples](https://floaty.ryumy.com/examples).

## Documentation

[floaty.ryumy.com/docs](https://floaty.ryumy.com/docs)

## Releasing

Publish `@ryumy97/floaty-react` by opening a `release/x.y.z` PR that bumps
`packages/react/package.json`, then merging to `main`. After CI and E2E pass, a GitHub
Release is created and the package is published to npm. See [AGENTS.md](AGENTS.md#releasing-ryumy97floaty-react).

## License

MIT