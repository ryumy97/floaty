# TODO

Findings from the architecture review of `docs/ARCHITECTURE.md` against `src/`. Update
`docs/ARCHITECTURE.md` alongside each change (see `AGENTS.md`).

## High priority

- [x] **Retargeting restarts the easing curve** (`src/Floaty.tsx`, positioning effect)
  - Shipped (ADR-7, section 7.2). Deviations from the plan below: the anchor-switch gap is
    computed from the last target and the running curve instead of measuring the inner
    element, so `tests/setup.ts` needed no composed-rect fake.
  - Scroll mid-transition starts a new `ease-in-out` animation every frame (near-zero
    initial velocity), so content crawls while scrolling and catches up afterwards.
  - Continuous `layout` reasons (window drag-resize, CSS-transitioned anchor size) start a
    fresh full-duration animation every frame, so content trails far behind.
  - Approach: split every change into an **offset** and an **animating** part.
    `visual = target + Δ · (1 - ease(p))`, where the target (offset) is written directly
    and only Δ (the gap to the target when a transition starts) is eased to 0 on its own clock.

    | Event | Offset (outer) | Animating Δ (inner) |
    | --- | --- | --- |
    | Scroll, at rest or mid-flight | update | untouched |
    | Anchor switch | update | measure inner's visual rect, start new Δ |
    | Layout shift at rest (`animateLayoutChanges`) | update | start Δ = old target - new target |
    | Layout shift mid-flight | update | untouched |
    | First placement, `transition={false}`, reduced motion | update | none |

  - Removes the `scrolledMidAnimation` branch and `RectAnimation.remaining()`, and the
    per-frame `getBoundingClientRect()` read while scrolling mid-flight.
  - Decisions:
    1. **Layout shift mid-flight rides along as offset.** The content jumps with the anchor,
       exactly like scroll. Accepted for the easing driver; additive per-change Δ stacking is
       not pursued, because the spring driver (below) absorbs mid-flight shifts into Δ while
       keeping velocity.
    2. **DOM structure: outer + inner wrapper.**
       - Outer (`data-floaty`, `data-floaty-state`, `aria-hidden`, `visibility`):
         `position: absolute; top: 0; left: 0`, imperative `transform: translate3d(target)`,
         `width`/`height` = target, `pointer-events: none`. Never animated.
       - Inner (visible box): receives user `className` and `style`, `pointer-events: auto`,
         `box-sizing: border-box`, rests at `width: 100%; height: 100%`. Runs the Δ animation:
         `{ transform: translate(dx, dy), width: calc(100% + dw), height: calc(100% + dh) }`
         to `{ transform: none, width: 100%, height: 100% }`, `fill: none`.
       - `tests/setup.ts`: the `getBoundingClientRect` fake must compose the outer rect with
         the inner's inline/animated delta; update tests that read `[data-floaty]` styles.
    3. **No-WAAPI fallback uses the same split.** The outer is written the same way in both
       paths; the `requestAnimationFrame` fallback writes the inner's Δ styles each frame and
       never touches the outer, so scroll offsets apply even mid-flight.

- [x] **Spring animation (damped harmonic oscillator)** (new `src/spring.ts`, `src/animate.ts`,
  `src/types.ts`). Depends on the offset/animating split above.
  - Shipped (section 7.4, README "Transitions"). Final decisions:
    - Both attribute forms: physical `{ type: 'spring', stiffness, damping, mass? }` and
      visual `{ type: 'spring', duration, bounce? }` (bounce defaults to `0`).
    - `bounceSize: false | spring attributes`; `false` (default) = position spring
      critically damped, so the size never overshoots.
    - `Motion` simplified to `current()` + `cancel()`; a retarget builds a new curve from
      the current gap and velocity instead of `jump()`/`onSettle()`.
    - Spring is opt-in; the global default stays easing. Untyped partial transitions are
      easing and fall back to `DEFAULT_TRANSITION` when the global default is a spring.
    - Gesture velocity stays internal (`createCurve(config, delta, velocity)`).
  - Model: one 1D spring per axis (x, y, width, height) on Δ:
    `m·Δ'' + c·Δ' + k·Δ = 0`, `visual = target + Δ`.
    - Offset (scroll): target only; spring untouched.
    - Retarget (anchor switch, layout shift mid-flight): `Δ += oldTarget - newTarget`,
      velocity kept, so momentum carries through interruptions.
  - Solver: closed-form `springAt(params, { delta, velocity }, t)` for underdamped,
    critically damped and overdamped cases, plus `settleTime(...)` (|Δ| and |v| below ~0.5px).
    Analytic state means retargets need no layout read: `visual = oldTarget + Δ(t)`.
  - Drivers:
    - WAAPI: on start/retarget, sample `springAt` at ~60 Hz up to the slowest axis's settle
      time into keyframes on the inner element, `easing: 'linear'`. Sample keyframes rather
      than a CSS `linear()` easing, because after a retarget each axis has its own Δ/v ratio.
    - rAF fallback: evaluate `springAt` per frame and write the inner's Δ styles.
  - Unify easing and spring behind one `Motion` interface:
    `start(delta, velocity?)`, `jump(deltaChange)`, `current()`, `cancel()`, `onSettle(cb)`.
    Easing ignores velocity. Make the easing driver's "current Δ" analytic too.
  - API: `transition: { type: 'spring', duration, bounce }` (perceptual default;
    `ω0 = 2π / duration`, `ζ = 1 - bounce`) or `{ type: 'spring', stiffness, damping, mass }`.
    Same shape for `configureFloaty`; `transition={false}` and reduced motion still snap.
  - Open decisions:
    - Bounce on size: option to keep width/height critically damped (position-only bounce),
      possibly as the default. Negative sizes clamp via `calc(100% + Δ)`.
    - `isAnimating` / `onTransitionEnd` fire at settle; retargets extend the transition.
    - Keep `start(delta, velocity)` open for future gesture "throw" velocity.
  - Docs: rewrite ADR-4 (springs now supported) and section 7 around the motion driver.
  - Order: (1) offset/animating split with easing, (2) `Motion` interface + analytic Δ,
    (3) `spring.ts` with unit tests, spring driver, `transition` API.

- [ ] **Fixed-layer scroll lag** (`src/layer.ts`, `src/useRectTracker.ts`)
  - Scrolling is composited off the main thread; JS-driven following can lag a frame or
    jitter (mobile, trackpad momentum). Section 7.3's "instantaneous" claim is optimistic.
  - Proposed: when the anchor's only scroller is the document, position in page coordinates
    (absolute layer) so native scrolling moves the content; JS tracking only for nested
    scroll containers.

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
- [ ] **Doc fixes in `docs/ARCHITECTURE.md`**
  - Section 10: style writes are four properties (`visibility`) plus `data-floaty-state`.
  - Section 4: dependency graph is missing `Floaty`/`FloatyAnchor`/`useRectTracker` -> `utils`.
  - Section 6.2: note that window `resize` reports `scroll` (snaps), while the anchor's
    `ResizeObserver` usually reports `layout` in the same frame.
- [ ] **Playwright suite against `demo/`** to cover real scrolling, layout shifts and
  multi-commit anchor swaps that jsdom cannot reproduce.
