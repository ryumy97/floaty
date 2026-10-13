# @floaty/react

```bash
pnpm add @floaty/react
```

Render React content **on top of the screen** that follows layout placeholders, so the
content **keeps its state** when the surrounding layout switches from one structure to
another (grid to list, page to sidebar, expanded to mini player, ...).

Peer dependencies: `react` and `react-dom` (>= 18). State is shared through a single
[zustand](https://github.com/pmndrs/zustand) store, so no provider is needed.

## How it works

For a detailed design write-up (state model, commit-phase timing, animation model,
trade-offs, and decision records), see [ARCHITECTURE.md](./ARCHITECTURE.md).

- `<Floaty floatyId="x">` renders its children once, into an overlay layer that is
  appended to `document.body` on first use (and removed when the last `Floaty` unmounts).
  Place it somewhere that stays mounted when the layout changes, and its children keep
  their state.
- `<FloatyAnchor floatyId="x">` is a plain `div` placeholder that reserves space in your
  layout. The floating content is positioned and sized over the active anchor.
- When the active anchor changes (one layout unmounts and another mounts), the content
  animates from its old rect to the new one (FLIP, via the Web Animations API) with an
  easing curve or a spring, or snaps if transitions are disabled or the user prefers
  reduced motion. Scrolling during a transition never restarts it.
- Content is positioned in document coordinates, so page scrolling moves it natively in
  the same frame as the page. Anchors inside `position: fixed` containers get fixed
  positioning instead. Only nested scroll containers and stuck sticky anchors need a
  JavaScript re-measure.

## Usage

```tsx
import { Floaty, FloatyAnchor, configureFloaty } from '@floaty/react';

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
| `anchorGracePeriod` | `number`: ms the last anchor stays active after it unmounts (see below); `0` releases immediately | `150` |

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

Render one `<Floaty>` per `floatyId`. If several are mounted, only the first renders (a
warning is logged in development); when it unmounts, the next one takes over.

| Prop | Type | Default |
| --- | --- | --- |
| `floatyId` | `string` | required |
| `children` | `ReactNode \| (state, { hasAnchor, isAnimating, settledState }) => ReactNode` | |
| `transition` | `false`, easing or spring (see [Transitions](#transitions)) | global default |
| `keepMounted` | `true`: keep children mounted (hidden) while no anchor exists; `'afterAnchor'`: the same, but wait for a size before mounting them the first time (see below); `false`: unmount them | `true` |
| `animateLayoutChanges` | `boolean`: also animate when the active anchor itself moves or resizes | `true` |
| `className` / `style` | styling of the visible box around `children` (avoid `transform`, `width`, `height`) | |
| `onTransitionStart` / `onTransitionEnd` | `() => void` | |

The content renders as `div[data-floaty] > div[data-floaty-content]`. The outer element sits
on the anchor's rect and exposes `data-floaty-state="hidden" | "visible" | "animating"`; the
inner element is the visible box that animates and receives `className` and `style`.

#### Content that measures itself

With the default `keepMounted`, content mounts right away, hidden. Before any anchor has
been measured it has no size to take, so its box is `0 × 0`. Content that sizes itself
from its container on mount (charts, maps, canvases, video players, virtualized lists)
then measures zero. Use `keepMounted="afterAnchor"` for such content: it mounts once the
first anchor has been measured, already at that anchor's size (even for layout effects in
the content), and then stays mounted like `true`. Hidden content always keeps the last
known size, including when `Floaty` itself remounts.

### `<FloatyAnchor>`

Accepts all `div` props (including a native `id`) plus `floatyId`, an optional `state`
and an optional `priority` (default `0`).

If several anchors share a `floatyId`, the one with the highest `priority` is active;
among equal priorities, the most recently mounted one. When it unmounts, the next one by
the same rule becomes active again, and changing `priority` switches (and animates) to the
new winner. "Most recently mounted" follows React's layout-effect order, so anchors that
mount together resolve by tree order (the later sibling wins, and a parent wins over an
anchor nested inside it), and an anchor whose `floatyId` changes or that a React 19
`<Activity>` reveals counts as newly mounted. Set `priority` whenever two anchors can be
mounted at once and the winner matters:

```tsx
<FloatyAnchor floatyId="player" priority={1} /> {/* detail view: always wins */}
<FloatyAnchor floatyId="player" />              {/* list item */}
```

When the last anchor unmounts, the content stays where it was for `anchorGracePeriod` ms
before hiding. An anchor that mounts within that window (after a lazy route, a `Suspense`
fallback, or data loading) still animates from the old position instead of snapping.
`useFloaty().hasAnchor` stays `true` during the window.

Anchors are re-measured on resize (`ResizeObserver`), on moves without resize such as an
image loading or a sibling expanding above them (`IntersectionObserver`), on window resize,
any scroll, and whenever the anchor re-renders.

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

#### Switching form on landing

If a form only fits the destination box (a mini player's controls, a compact card), switch
it when the content lands instead of when it takes off. `useFloatyTransition<S>()` returns
`{ state, settledState, isAnimating }`; `settledState` keeps the previous anchor's state
for the whole transition and switches once the content lands (immediately if the move
snaps):

```tsx
function Player() {
  const { settledState } = useFloatyTransition<PlayerState>();
  return <PlayerView mode={settledState?.mode ?? 'full'} />;
}
```

Render-function children get it as `status.settledState`. Combine `state`,
`settledState` and `isAnimating` for custom effects such as a cross-fade between forms.

### `useFloaty(floatyId)`

Returns `{ hasAnchor, isAnimating, rect, state, remeasure }`. Moves are detected
automatically; `remeasure()` forces a re-measure, for example where `IntersectionObserver`
is unavailable or to animate a move that happened right after a scroll.

A component re-renders only when a field it reads changes. Reading `rect` re-renders on
every scroll frame; reading only `hasAnchor`, `isAnimating` or `state` does not. Likewise,
scrolling never re-renders `<Floaty>` or calls its render-function children.

### `createFloaty<S>(floatyId)`

Binds the components and hooks to one id and types its anchor `state`, so a typo in an id
or a mismatched state shape is a compile error instead of content that never shows. Call
it once at module scope:

```tsx
// player.ts
export const player = createFloaty<{ mode: 'full' | 'mini' }>('player');

// App.tsx
<player.Floaty>{(state) => <Player mode={state?.mode ?? 'full'} />}</player.Floaty>
<player.FloatyAnchor state={{ mode: 'mini' }} />   // `state={{ mode: 'tiny' }}` doesn't compile
const { hasAnchor } = player.useFloaty();
```

It returns `{ floatyId, Floaty, FloatyAnchor, useFloaty, useFloatyState,
useFloatyTransition }`, which take the same props and return the same values as the
unbound API, without `floatyId`. They share the global store, so they can be mixed with
`<Floaty floatyId="player">`. The bound `useFloatyState()` and `useFloatyTransition()`
also throw if called inside another id's content.

### Notes

The store is module-global: every React root on the page shares the same `floatyId`
namespace. An id's entry is dropped once no anchor, `Floaty` or `useFloaty` uses it, so
dynamic ids don't leak; the last `rect` and `state` are kept only while something reads
the id. With server rendering, nothing floats on the server (the layer is created on
the client), and anchors only register in the browser. The package is marked
`'use client'`, so React Server Components (for example in the Next.js App Router) can
render `<Floaty>` and `<FloatyAnchor>` directly.

### Portal side effects

Floating content is rendered into a layer at the end of `body` (DOM) from wherever
`<Floaty>` is placed (React). It is never inside the anchor, so:

- **CSS** inherits from `body` and the layer, not the anchor's ancestors: theme classes,
  CSS variables, fonts and colors set on a page wrapper don't reach it, and selectors like
  `.card:hover .title` or `@container` queries from the anchor's side don't match. Use
  `configureFloaty({ layerClassName })`, `<Floaty className>`, or anchor `state`.
- **React context and events** come from `<Floaty>`'s position in the React tree. Providers
  and `onClick` handlers around the anchor don't see the content.
- **Native events and DOM checks** go through the layer to `body`: `anchorParent.contains(
  target)` is `false` for the content, so click-outside handlers should also accept
  `target.closest('[data-floaty]')`.
- **Forms and modals**: inputs aren't part of a `<form>` around the anchor (use the `form`
  attribute), and content anchored inside a modal `<dialog>` is covered and inert.

See section 12.1 of [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full list.

## Development

This package lives in the [Floaty monorepo](../../README.md); see the root README for the
demos, docs site and end-to-end tests. Within this package:

```bash
pnpm --filter @floaty/react test       # vitest + React Testing Library
pnpm --filter @floaty/react typecheck
pnpm --filter @floaty/react build      # dist/ (ESM + CJS + .d.ts)
```
