import { type CSSProperties, type ReactNode, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import {
  applyRect,
  createCurve,
  type Motion,
  playCurve,
  prefersReducedMotion,
  shiftDelta,
  ZERO_RECT,
} from './animate';
import { useFloatyLayer } from './layer';
import {
  floatyStore,
  measureElement,
  rectsEqual,
  resolveTransition,
  selectSnapshot,
} from './store';
import type { FloatyRect, FloatySnapshot, FloatyTransition } from './types';
import { FloatyContentContext } from './useFloatyState';
import { useIsomorphicLayoutEffect } from './utils';

export interface FloatyRenderStatus<S = unknown> {
  hasAnchor: boolean;
  isAnimating: boolean;
  /**
   * The state of the anchor the content rests on: during a transition it keeps
   * the previous anchor's state and switches once the content lands.
   */
  settledState: S | undefined;
}

export interface FloatyProps<S = unknown> {
  /** Matches the `floatyId` of one or more `<FloatyAnchor>`s. */
  floatyId: string;
  /**
   * Content to float. Pass a function to render from the active anchor's
   * `state`; the returned tree keeps its React state across anchor switches.
   */
  children?: ReactNode | ((state: S | undefined, status: FloatyRenderStatus<S>) => ReactNode);
  /**
   * `false` snaps to the new anchor instantly. `{ duration?, easing? }`
   * overrides the global easing default set with `configureFloaty`;
   * `{ type: 'spring', ... }` uses a spring instead.
   */
  transition?: FloatyTransition;
  /**
   * Keep children mounted (hidden) while no anchor exists, so their state
   * survives layouts without an anchor. `'afterAnchor'` waits until an anchor
   * has given the content a size before mounting it the first time (for
   * self-measuring content), then keeps it mounted. Defaults to `true`.
   */
  keepMounted?: boolean | 'afterAnchor';
  /** Animate when the active anchor itself moves or resizes. Defaults to `true`. */
  animateLayoutChanges?: boolean;
  /**
   * z-index of this floaty's overlay layer. Overrides the global default from
   * `configureFloaty({ zIndex })` (1000). Each `<Floaty>` has its own layer, so
   * different values can interleave with page UI.
   */
  zIndex?: number;
  /** Applied to the visible box that wraps `children`. */
  className?: string;
  /** Applied to the visible box; avoid `transform`, `width` and `height`. */
  style?: CSSProperties;
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}

/**
 * Renders `children` once, in a private overlay layer on `document.body`,
 * positioned over the active `<FloatyAnchor>` with the same `floatyId`. Place
 * it somewhere that stays mounted across layout changes so its children keep
 * their state.
 */
export function Floaty<S = unknown>({
  floatyId,
  children,
  transition,
  keepMounted = true,
  animateLayoutChanges = true,
  zIndex,
  className,
  style,
  onTransitionStart,
  onTransitionEnd,
}: FloatyProps<S>) {
  const layer = useFloatyLayer(zIndex);
  // Only what affects rendering; rect changes are applied without re-rendering.
  const select = selectSnapshot(floatyId);
  const anchor = useStore(floatyStore, (s) => select(s).anchor);
  const anchorState = useStore(floatyStore, (s) => select(s).state);
  const isAnimating = useStore(floatyStore, (s) => select(s).isAnimating);
  const hasSize = useStore(floatyStore, (s) => select(s).rect !== null);
  const defaults = useStore(floatyStore, (state) => state.config.transition);
  const [token] = useState(() => ({}));
  const [settledState, setSettledState] = useState(anchorState);
  const isOwner = useStore(floatyStore, (s) => s.owners[floatyId]?.[0] === token);

  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const motionRef = useRef<Motion | null>(null);
  const lastAnchorRef = useRef<HTMLElement | null>(null);
  const lastTargetRef = useRef<Placement | null>(null);
  const appliedRef = useRef<{ version: number; outer: HTMLElement } | null>(null);

  const config = resolveTransition(transition, defaults);
  const latest = useRef({ config, animateLayoutChanges, onTransitionStart, onTransitionEnd });
  latest.current = { config, animateLayoutChanges, onTransitionStart, onTransitionEnd };

  // Anchor changes are positioned from this effect after React re-renders, so an
  // anchor swap within one commit is seen as a single switch (section 9). Rect
  // changes of the positioned anchor are applied straight from the store
  // subscription, so scroll and layout updates never re-render this component.
  useIsomorphicLayoutEffect(() => {
    const update = (snapshot: FloatySnapshot) => {
      const outer = outerRef.current;
      const applied = appliedRef.current;
      if (outer && applied?.version === snapshot.version && applied.outer === outer) return;
      // A new outer element (the layer was recreated while this Floaty stayed
      // mounted, as in a StrictMode effect replay during hydration) has no
      // transform yet, so the last target no longer describes it.
      if (outer && applied && applied.outer !== outer) lastTargetRef.current = null;
      appliedRef.current = outer ? { version: snapshot.version, outer } : null;
      position(snapshot);
    };
    update(select(floatyStore.getState()));
    return floatyStore.subscribe((state, prev) => {
      const snapshot = select(state);
      if (snapshot !== select(prev) && snapshot.anchor === lastAnchorRef.current) {
        update(snapshot);
      }
    });
  }, [floatyId, layer, anchor, keepMounted, isOwner, hasSize]);

  // Runs after positioning: on an animated switch the motion has already
  // started, so the settled state waits for the transition to end.
  useIsomorphicLayoutEffect(() => {
    if (!motionRef.current) setSettledState(anchorState);
  }, [anchorState, isAnimating]);

  // The outer element always sits exactly on the target (the "offset"); the
  // inner element only animates the remaining gap (the "delta") towards it.
  // Target changes move the outer element and never touch a running animation.
  function position({ anchor, rect, reason }: FloatySnapshot) {
    const outer = outerRef.current;
    const inner = innerRef.current;
    const running = motionRef.current;
    const { setAnimating } = floatyStore.getState();

    const stop = () => {
      if (!motionRef.current) return;
      motionRef.current.cancel();
      motionRef.current = null;
      setAnimating(floatyId, false);
      latest.current.onTransitionEnd?.();
    };

    if (!outer || !inner || !layer) {
      stop();
      lastAnchorRef.current = null;
      lastTargetRef.current = null;
      return;
    }

    const prevAnchor = lastAnchorRef.current;
    const prevTarget = lastTargetRef.current;
    lastAnchorRef.current = anchor;

    if (!anchor || !rect) {
      stop();
      lastTargetRef.current = null;
      setState(outer, 'hidden');
      return;
    }

    const { config, animateLayoutChanges, onTransitionStart, onTransitionEnd } = latest.current;
    const sameAnchor = prevAnchor === anchor;
    const layerRect = measureElement(layer);
    // Anchors inside a fixed or sticky container don't move with the page (a stuck
    // sticky container keeps the same viewport rect, so no re-measure would notice
    // the page scrolling), so the outer element is fixed too and uses viewport
    // coordinates; everything else uses document coordinates (relative to the
    // absolute layer).
    const fixed =
      prevTarget && sameAnchor && reason !== 'layout'
        ? prevTarget.fixed
        : inViewportContainer(anchor);
    const next: Placement = { rect: fixed ? rect : relativeTo(rect, layerRect), fixed };
    lastTargetRef.current = next;
    if (!prevTarget || prevTarget.fixed !== fixed)
      outer.style.position = fixed ? 'fixed' : 'absolute';
    if (!prevTarget || prevTarget.fixed !== fixed || !rectsEqual(prevTarget.rect, next.rect)) {
      applyRect(outer, next.rect);
    }

    const anchorSwitched = prevAnchor !== null && !sameAnchor;
    // Easing rides along with mid-flight layout shifts; springs absorb them
    // into the gap and keep their velocity.
    const layoutShifted =
      sameAnchor &&
      reason === 'layout' &&
      animateLayoutChanges &&
      (!running || (config !== false && config.type === 'spring'));

    if (!prevTarget || !(anchorSwitched || layoutShifted)) {
      if (!prevTarget) stop();
      if (!motionRef.current) setState(outer, 'visible');
      return;
    }

    const { delta: currentDelta, velocity } = running?.current() ?? {
      delta: ZERO_RECT,
      velocity: ZERO_RECT,
    };
    const delta = shiftDelta(
      currentDelta,
      toViewport(prevTarget, layerRect),
      toViewport(next, layerRect),
    );
    const curve =
      config !== false && !prefersReducedMotion() ? createCurve(config, delta, velocity) : null;

    running?.cancel();
    motionRef.current = null;

    if (!curve || curve.duration <= 0) {
      setState(outer, 'visible');
      if (running) {
        setAnimating(floatyId, false);
        onTransitionEnd?.();
      }
      return;
    }

    setState(outer, 'animating');
    if (!running) {
      setAnimating(floatyId, true);
      onTransitionStart?.();
    }
    motionRef.current = playCurve(inner, curve, () => {
      motionRef.current = null;
      setState(outer, 'visible');
      floatyStore.getState().setAnimating(floatyId, false);
      latest.current.onTransitionEnd?.();
    });
  }

  useIsomorphicLayoutEffect(() => {
    const { retain, claimFloaty } = floatyStore.getState();
    const release = retain(floatyId);
    const unclaim = claimFloaty(floatyId, token);
    return () => {
      // Only the instance running the transition owns `isAnimating`.
      if (motionRef.current) {
        motionRef.current.cancel();
        motionRef.current = null;
        floatyStore.getState().setAnimating(floatyId, false);
      }
      unclaim();
      release();
    };
  }, [floatyId, token]);

  const contentContext = useMemo(
    () => ({ floatyId, state: anchorState, settledState, isAnimating }),
    [floatyId, anchorState, settledState, isAnimating],
  );

  if (!layer || !isOwner) return null;
  if (!keepMounted && !anchor) return null;
  if (keepMounted === 'afterAnchor' && !hasSize) return null;

  const content =
    typeof children === 'function'
      ? children(anchorState as S | undefined, {
          hasAnchor: anchor !== null,
          isAnimating,
          settledState: settledState as S | undefined,
        })
      : children;

  // Content layout effects run before the positioning effect, so the outer
  // element gets the known size at render. It always matches what positioning
  // applies, so React never overwrites a different value.
  const size = select(floatyStore.getState()).rect;

  return createPortal(
    <div
      ref={outerRef}
      data-floaty={floatyId}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size ? `${size.width}px` : undefined,
        height: size ? `${size.height}px` : undefined,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    >
      <div
        ref={innerRef}
        data-floaty-content=""
        className={className}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',
          willChange: 'transform',
          ...style,
        }}
      >
        <FloatyContentContext.Provider value={contentContext}>
          {content}
        </FloatyContentContext.Provider>
      </div>
    </div>,
    layer,
  );
}

type FloatyState = 'hidden' | 'visible' | 'animating';

function setState(el: HTMLElement, state: FloatyState) {
  el.dataset.floatyState = state;
  if (state === 'hidden') {
    el.style.visibility = 'hidden';
    el.setAttribute('aria-hidden', 'true');
  } else {
    el.style.visibility = '';
    el.removeAttribute('aria-hidden');
  }
}

/** Where the outer element sits: viewport coordinates if `fixed`, else layer (document) coordinates. */
interface Placement {
  rect: FloatyRect;
  fixed: boolean;
}

function toViewport({ rect, fixed }: Placement, layerRect: FloatyRect): FloatyRect {
  return fixed ? rect : { ...rect, x: rect.x + layerRect.x, y: rect.y + layerRect.y };
}

/**
 * Whether the element sits in a fixed or sticky container. While a sticky container
 * is not stuck it scrolls with the page, which changes the anchor's viewport rect,
 * so the scroll re-measure keeps fixed placement in sync.
 */
function inViewportContainer(el: Element): boolean {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const { position } = getComputedStyle(node);
    if (position === 'fixed' || position === 'sticky') return true;
  }
  return false;
}

function relativeTo(rect: FloatyRect, origin: FloatyRect): FloatyRect {
  return {
    x: rect.x - origin.x,
    y: rect.y - origin.y,
    width: rect.width,
    height: rect.height,
  };
}
