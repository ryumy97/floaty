import { useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import {
  applyRect,
  createCurve,
  playCurve,
  prefersReducedMotion,
  shiftDelta,
  ZERO_RECT,
  type Motion,
} from './animate';
import { useFloatyLayer } from './layer';
import { floatyStore, measureElement, resolveTransition, selectSnapshot } from './store';
import type { FloatyRect, FloatyTransition } from './types';
import { FloatyContentContext } from './useFloatyState';
import { useIsomorphicLayoutEffect } from './utils';

export interface FloatyRenderStatus {
  hasAnchor: boolean;
  isAnimating: boolean;
}

export interface FloatyProps<S = unknown> {
  /** Matches the `floatyId` of one or more `<FloatyAnchor>`s. */
  floatyId: string;
  /**
   * Content to float. Pass a function to render from the active anchor's
   * `state`; the returned tree keeps its React state across anchor switches.
   */
  children?: ReactNode | ((state: S | undefined, status: FloatyRenderStatus) => ReactNode);
  /**
   * `false` snaps to the new anchor instantly. `{ duration?, easing? }`
   * overrides the global easing default set with `configureFloaty`;
   * `{ type: 'spring', ... }` uses a spring instead.
   */
  transition?: FloatyTransition;
  /**
   * Keep children mounted (hidden) while no anchor exists, so their state
   * survives layouts without an anchor. Defaults to `true`.
   */
  keepMounted?: boolean;
  /** Animate when the active anchor itself moves or resizes. Defaults to `true`. */
  animateLayoutChanges?: boolean;
  /** Applied to the visible box that wraps `children`. */
  className?: string;
  /** Applied to the visible box; avoid `transform`, `width` and `height`. */
  style?: CSSProperties;
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}

/**
 * Renders `children` once, in a shared overlay layer, positioned over the
 * active `<FloatyAnchor>` with the same `floatyId`. Place it somewhere that
 * stays mounted across layout changes so its children keep their state.
 */
export function Floaty<S = unknown>({
  floatyId,
  children,
  transition,
  keepMounted = true,
  animateLayoutChanges = true,
  className,
  style,
  onTransitionStart,
  onTransitionEnd,
}: FloatyProps<S>) {
  const layer = useFloatyLayer();
  const snapshot = useStore(floatyStore, selectSnapshot(floatyId));
  const defaults = useStore(floatyStore, (state) => state.config.transition);

  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const motionRef = useRef<Motion | null>(null);
  const lastAnchorRef = useRef<HTMLElement | null>(null);
  const lastTargetRef = useRef<FloatyRect | null>(null);

  const config = resolveTransition(transition, defaults);
  const latest = useRef({ config, animateLayoutChanges, onTransitionStart, onTransitionEnd });
  latest.current = { config, animateLayoutChanges, onTransitionStart, onTransitionEnd };

  // The outer element always sits exactly on the target (the "offset"); the
  // inner element only animates the remaining gap (the "delta") towards it.
  // Scrolls move the outer element and never touch a running animation.
  useIsomorphicLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    const { anchor, rect, reason } = snapshot;
    const running = motionRef.current;
    const { setAnimating } = floatyStore.getState();

    const stop = () => {
      if (!motionRef.current) return;
      motionRef.current.cancel();
      motionRef.current = null;
      setAnimating(floatyId, false);
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
    const to = relativeTo(rect, measureElement(layer));
    lastTargetRef.current = to;
    applyRect(outer, to);

    const sameAnchor = prevAnchor === anchor;
    const anchorSwitched = prevAnchor !== null && !sameAnchor;
    // Easing rides along with mid-flight layout shifts; springs absorb them
    // into the gap and keep their velocity.
    const layoutShifted =
      sameAnchor &&
      reason === 'layout' &&
      animateLayoutChanges &&
      (!running || (config !== false && config.type === 'spring'));

    if (!prevTarget || !(anchorSwitched || layoutShifted)) {
      if (!running) setState(outer, 'visible');
      return;
    }

    const { delta: currentDelta, velocity } = running?.current() ?? {
      delta: ZERO_RECT,
      velocity: ZERO_RECT,
    };
    const delta = shiftDelta(currentDelta, prevTarget, to);
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
  }, [floatyId, layer, snapshot.version, snapshot.anchor, keepMounted]);

  useIsomorphicLayoutEffect(
    () => () => {
      motionRef.current?.cancel();
      motionRef.current = null;
      floatyStore.getState().setAnimating(floatyId, false);
    },
    [floatyId],
  );

  const contentContext = useMemo(
    () => ({ floatyId, state: snapshot.state }),
    [floatyId, snapshot.state],
  );

  if (!layer) return null;
  if (!keepMounted && !snapshot.anchor) return null;

  const content =
    typeof children === 'function'
      ? children(snapshot.state as S | undefined, {
          hasAnchor: snapshot.anchor !== null,
          isAnimating: snapshot.isAnimating,
        })
      : children;

  return createPortal(
    <div
      ref={outerRef}
      data-floaty={floatyId}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
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

function relativeTo(rect: FloatyRect, origin: FloatyRect): FloatyRect {
  return {
    x: rect.x - origin.x,
    y: rect.y - origin.y,
    width: rect.width,
    height: rect.height,
  };
}
