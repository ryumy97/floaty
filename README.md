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
  animates from its old rect to the new one (FLIP, via the Web Animations API), or snaps
  if transitions are disabled or the user prefers reduced motion.

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
| `transition` | `{ duration?: number; easing?: string }` | `{ duration: 300, easing: 'ease-in-out' }` |
| `layerClassName` | `string` | |

`resetFloaty()` restores the initial state (useful between tests).

### `<Floaty>`

| Prop | Type | Default |
| --- | --- | --- |
| `floatyId` | `string` | required |
| `transition` | `false \| { duration?, easing? }` | global default |
| `keepMounted` | `boolean`: keep children mounted (hidden) while no anchor exists | `true` |
| `animateLayoutChanges` | `boolean`: also animate when the active anchor itself moves or resizes | `true` |
| `className` / `style` | wrapper styling | |
| `onTransitionStart` / `onTransitionEnd` | `() => void` | |

The wrapper exposes `data-floaty-state="hidden" | "visible" | "animating"` for styling.

### `<FloatyAnchor>`

Accepts all `div` props (including a native `id`) plus `floatyId`. If several anchors share
a `floatyId`, the most recently mounted one is active; when it unmounts, the previous one
becomes active again.

Anchors are re-measured on resize (`ResizeObserver`), window resize, any scroll, and
whenever the anchor re-renders.

### `useFloaty(floatyId)`

Returns `{ hasAnchor, isAnimating, rect, remeasure }`. Call `remeasure()` after layout
changes that neither resize nor re-render the anchor (for example, a CSS-only change on
an ancestor).

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
