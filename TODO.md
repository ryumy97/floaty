# TODO

Findings from the architecture review of `docs/ARCHITECTURE.md` against `src/`. Update
`docs/ARCHITECTURE.md` alongside each change (see `AGENTS.md`).

## High priority

- [ ] **Undetected moves from sibling layout changes** (`src/useRectTracker.ts`)
  - An image or async content above the anchor moves it without resize, scroll or re-render.
  - Proposed: IntersectionObserver-based position detection (as in Floating UI
    `autoUpdate({ layoutShift: true })`), as an option or default.

- [ ] **Same-commit invariant is fragile** (section 9)
  - Lazy routes, `Suspense`, route loaders, or data-gated anchors split unmount and mount
    across commits: content hides, forgets the old anchor, and snaps.
  - Proposed: grace window that keeps the last rect after the anchor becomes `null` and
    animates from it if a new anchor appears within N ms.
  - Document the known breaking patterns in section 9 or 12.

## Medium priority

- [ ] **Store entries are never garbage-collected** (`src/store.ts`)
  - `snapshots[id]` and `anchors[id]` (including the last `state`) persist forever; dynamic
    ids leak. Drop entries with no anchors and no subscribers; clarify in section 5.2 that
    `rect` survives anchor removal only while subscribed.

- [ ] **Re-render scope on scroll** (`src/Floaty.tsx`, `src/useFloaty.ts`)
  - `Floaty` and every `useFloaty` consumer re-render each scroll frame because `rect`
    changes; render-function children run every frame. Contradicts section 10.
  - Proposed: narrow `Floaty`'s subscription (`version`, `anchor`, `state`, `isAnimating`),
    apply scroll positioning via `floatyStore.subscribe`, give `useFloaty` a selector or make
    `rect` opt-in.

- [ ] **Document portal side effects** (section 12)
  - CSS inheritance (fonts, colors, CSS variables, theme classes) comes from `body`, not the
    anchor; container queries and parent `:hover` do not apply.
  - React events bubble through `Floaty`'s tree, native events to `body`; click handlers
    around an anchor never see clicks on the content.

- [ ] **Duplicate `Floaty` per `floatyId`**
  - Both write `isAnimating`; the first to unmount clears the other's flag.
  - Promote the dev warning from future work.

- [ ] **Content morphs instantly at the old box size** (section 6.4)
  - Expose a transition phase or previous state so content can choose when to switch form.

- [ ] **Anchor stack order** (ADR-6)
  - Same-commit mounts resolve by layout-effect order, not intent; re-registration
    (`floatyId` change, React 19 `<Activity>` reveal) jumps to the top.
  - Document it; consider an explicit `priority` prop.

## Lower priority

- [ ] **Typed channels**: `createFloaty<S>(id)` returning bound `Floaty`, `FloatyAnchor`,
  `useFloaty` and `useFloatyState`, linking state types and paving the way to scoped stores.
- [ ] **First mount without an anchor**: with `keepMounted`, content mounts in an unsized
  hidden wrapper, so self-measuring components (charts, maps, video) see the wrong size.
  Document or mitigate.
- [ ] **Doc fix in `docs/ARCHITECTURE.md`** section 6.2: note that window `resize` reports
  `scroll` (snaps), while the anchor's `ResizeObserver` usually reports `layout` in the same
  frame.

## Test coverage

Current suite: 74 jsdom tests (`pnpm test`) and 13 Playwright tests against the demo
(`pnpm test:e2e`). Update section 15 of `docs/ARCHITECTURE.md` as these land.

### Real browser (Playwright against `demo/`)

- [ ] Optional: frame-timing or screenshot checks for scroll lag and jitter.
- [ ] Run e2e in CI (needs `pnpm exec playwright install --with-deps chromium`); consider
  adding WebKit and Firefox projects.
