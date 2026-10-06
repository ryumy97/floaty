# floaty-component

Render React content **on top of the screen** that follows layout placeholders, so the
content **keeps its state** when the surrounding layout switches from one structure to
another (grid to list, page to sidebar, expanded to mini player, ...).

Peer dependencies: `react` and `react-dom` (>= 18). State is shared through a single
[zustand](https://github.com/pmndrs/zustand) store, so no provider is needed.

## How it works

For a detailed design write-up (state model, commit-phase timing, animation model,
trade-offs, and decision records), see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

- `<Floaty floatyId="x">` renders its children once, into a fixed overlay layer that is
  appended to `document.body` on first use (and removed when the last `Floaty` unmounts).
  Place it somewhere that stays mounted when the layout changes, and its children keep
  their state.
- `<FloatyAnchor floatyId="x">` is a plain `div` placeholder that reserves space in your
  layout. The floating content is positioned and sized over the active anchor.
- When the active anchor changes (one layout unmounts and another mounts), the content
  animates from its old rect to the new one (FLIP, via the Web Animations API) with an
  easing curve or a spring, or snaps if transitions are disabled or the user prefers
  reduced motion. Scrolling during a transition never restarts it.

## Usage

```tsx
import { Floaty, FloatyAnchor, configureFloaty } from 'floaty-component';

configureFloaty({ zIndex: 1000, transition: { duration: 300, easing: 'ease-in-out' } });

function App() {
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  return (
    <>
      <Floaty floatyId="player">
        <VideoPlayer /> {/* never remounts */}
      </Floaty>

      {layout === 'grid' ? (
        <Grid>
          <FloatyAnchor floatyId="player" style={{ height: 320 }} />
        </Grid>
      ) : (
        <List>
          <FloatyAnchor floatyId="player" id="player-slot" style={{ height: 80 }} />
        </List>
      )}
    </>
  );
}
```

## API

### `configureFloaty(options)`

Global options; can be called at any time (changes apply immediately).

| Option | Type | Default |
| --- | --- | --- |
| `zIndex` | `number` | `1000` |
| `transition` | easing or spring (see [Transitions](#transitions)) | `{ duration: 300, easing: 'ease-in-out' }` |
| `layerClassName` | `string` | |

`resetFloaty()` restores the initial state (useful between tests).

### Transitions

`transition` (global or per `Floaty`) is one of:

```ts
false                                           // snap (per Floaty only)
{ duration?: 300, easing?: 'ease-in-out' }      // easing: any CSS easing
{ type: 'spring', duration: 400, bounce?: 0 }   // spring, visual attributes
{ type: 'spring', stiffness: 300, damping: 25, mass?: 1 } // spring, physical attributes
```

- **Visual spring:** `duration` is the perceptual duration in ms (the spring's period);
  `bounce` ranges from `-1` to `1`: `0` settles without overshoot, positive values bounce,
  negative values are overdamped. The tail may run slightly past `duration`.
- **Physical spring:** `stiffness`, `damping` and `mass` of a damped harmonic oscillator,
  with time in seconds.
- **`bounceSize`** (springs only): `false` (default) animates width and height with the
  same spring critically damped, so the box never overshoots its size. Pass spring
  attributes (visual or physical) to give the size its own spring, e.g.
  `{ type: 'spring', duration: 400, bounce: 0.3, bounceSize: { duration: 400, bounce: 0.1 } }`.
- Objects without `type: 'spring'` are easing transitions; missing fields come from the
  global easing default (or `{ duration: 300, easing: 'ease-in-out' }` if the global
  default is a spring).
- Interruptions keep momentum with springs: a new anchor or a layout shift mid-flight
  continues from the current position and velocity. Scrolling never restarts a transition.

### `<Floaty>`

| Prop | Type | Default |
| --- | --- | --- |
| `floatyId` | `string` | required |
| `children` | `ReactNode \| (state, { hasAnchor, isAnimating }) => ReactNode` | |
| `transition` | `false`, easing or spring (see [Transitions](#transitions)) | global default |
| `keepMounted` | `boolean`: keep children mounted (hidden) while no anchor exists | `true` |
| `animateLayoutChanges` | `boolean`: also animate when the active anchor itself moves or resizes | `true` |
| `className` / `style` | styling of the visible box around `children` (avoid `transform`, `width`, `height`) | |
| `onTransitionStart` / `onTransitionEnd` | `() => void` | |

The content renders as `div[data-floaty] > div[data-floaty-content]`. The outer element sits
on the anchor's rect and exposes `data-floaty-state="hidden" | "visible" | "animating"`; the
inner element is the visible box that animates and receives `className` and `style`.

### `<FloatyAnchor>`

Accepts all `div` props (including a native `id`) plus `floatyId` and an optional `state`.
If several anchors share a `floatyId`, the most recently mounted one is active; when it
unmounts, the previous one becomes active again.

Anchors are re-measured on resize (`ResizeObserver`), window resize, any scroll, and
whenever the anchor re-renders.

### Anchor state

Each anchor can pass a `state` value to the floating content, so the same component
can render or behave differently per layout while keeping its own React state:

```tsx
function Counter() {
  const state = useFloatyState<{ step: number; compact?: boolean }>();
  const [count, setCount] = useState(0); // preserved across layouts
  return <button onClick={() => setCount((c) => c + (state?.step ?? 1))}>{count}</button>;
}

<Floaty floatyId="counter"><Counter /></Floaty>

<FloatyAnchor floatyId="counter" state={{ step: 1 }} />                {/* grid */}
<FloatyAnchor floatyId="counter" state={{ step: 10, compact: true }} /> {/* sidebar */}
```

- **`useFloatyState<S>()`** reads the active anchor's state inside the content. It throws
  if called outside `<Floaty>` content.
- **Render-function children** pass it as props instead:
  `<Floaty<PlayerState> floatyId="player">{(state) => <Player mode={state?.mode} />}</Floaty>`.
- **`useFloaty<S>(floatyId).state`** reads it anywhere else.

The state switches in the same commit as the anchor, so content re-renders into its new
form while it animates to the new position. Changing the `state` prop of the active anchor
re-renders the content without moving it. State is compared shallowly, so inline object
literals don't cause extra renders. While no anchor exists, the last active anchor's state
is kept.

### `useFloaty(floatyId)`

Returns `{ hasAnchor, isAnimating, rect, state, remeasure }`. Call `remeasure()` after
layout changes that neither resize nor re-render the anchor (for example, a CSS-only change
on an ancestor).

### Notes

The store is module-global: every React root on the page shares the same `floatyId`
namespace. With server rendering, nothing floats on the server (the layer is created on
the client), and anchors only register in the browser.

## Development

```bash
pnpm install
pnpm dev          # demo playground (demo/)
pnpm test         # vitest + React Testing Library
pnpm typecheck
pnpm build        # dist/ (ESM + CJS + .d.ts)
```
