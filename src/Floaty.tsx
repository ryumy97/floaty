import { useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import { animateRect, applyRect, prefersReducedMotion, type RectAnimation } from './animate';
import { useFloatyLayer } from './layer';
import { floatyStore, measureElement, rectsEqual, selectSnapshot } from './store';
import type { FloatyRect, FloatyTransition, FloatyTransitionConfig } from './types';
import { useIsomorphicLayoutEffect } from './utils';

export interface FloatyProps {
  /** Matches the `floatyId` of one or more `<FloatyAnchor>`s. */
  floatyId: string;
  children?: ReactNode;
  /**
   * `false` snaps to the new anchor instantly. An object overrides the
   * global default `{ duration, easing }` set with `configureFloaty`.
   */
  transition?: FloatyTransition;
  /**
   * Keep children mounted (hidden) while no anchor exists, so their state
   * survives layouts without an anchor. Defaults to `true`.
   */
  keepMounted?: boolean;
  /** Animate when the active anchor itself moves or resizes. Defaults to `true`. */
  animateLayoutChanges?: boolean;
  className?: string;
  style?: CSSProperties;
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}

/**
 * Renders `children` once, in a shared overlay layer, positioned over the
 * active `<FloatyAnchor>` with the same `floatyId`. Place it somewhere that
 * stays mounted across layout changes so its children keep their state.
 */
export function Floaty({
  floatyId,
  children,
  transition,
  keepMounted = true,
  animateLayoutChanges = true,
  className,
  style,
  onTransitionStart,
  onTransitionEnd,
}: FloatyProps) {
  const layer = useFloatyLayer();
  const snapshot = useStore(floatyStore, selectSnapshot(floatyId));
  const defaults = useStore(floatyStore, (state) => state.config.transition);

  const itemRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<RectAnimation | null>(null);
  const lastAnchorRef = useRef<HTMLElement | null>(null);

  const config: FloatyTransitionConfig | false =
    transition === false
      ? false
      : {
          duration: transition?.duration ?? defaults.duration,
          easing: transition?.easing ?? defaults.easing,
        };
  const latest = useRef({ config, animateLayoutChanges, onTransitionStart, onTransitionEnd });
  latest.current = { config, animateLayoutChanges, onTransitionStart, onTransitionEnd };

  useIsomorphicLayoutEffect(() => {
    const el = itemRef.current;
    const { anchor, rect, reason } = snapshot;
    const running = animationRef.current;
    const { setAnimating } = floatyStore.getState();

    const stop = () => {
      if (!animationRef.current) return;
      animationRef.current.cancel();
      animationRef.current = null;
      setAnimating(floatyId, false);
    };

    if (!el || !layer) {
      stop();
      lastAnchorRef.current = null;
      return;
    }

    const prevAnchor = lastAnchorRef.current;
    lastAnchorRef.current = anchor;

    if (!anchor || !rect) {
      stop();
      setState(el, 'hidden');
      return;
    }

    const { config, animateLayoutChanges, onTransitionStart, onTransitionEnd } = latest.current;
    const layerRect = measureElement(layer);
    const to = relativeTo(rect, layerRect);

    const anchorSwitched = prevAnchor !== null && prevAnchor !== anchor;
    const layoutShifted = prevAnchor === anchor && reason === 'layout' && animateLayoutChanges;
    const scrolledMidAnimation = running !== null && prevAnchor === anchor && reason === 'scroll';
    const shouldAnimate =
      config !== false &&
      !prefersReducedMotion() &&
      (anchorSwitched || layoutShifted || scrolledMidAnimation);

    const duration = config && scrolledMidAnimation ? running.remaining() : config ? config.duration : 0;
    const from = shouldAnimate ? relativeTo(measureElement(el), layerRect) : null;

    running?.cancel();
    animationRef.current = null;
    applyRect(el, to);

    if (!config || !from || duration <= 0 || rectsEqual(from, to)) {
      setState(el, 'visible');
      if (running) {
        setAnimating(floatyId, false);
        onTransitionEnd?.();
      }
      return;
    }

    setState(el, 'animating');
    if (!running) {
      setAnimating(floatyId, true);
      onTransitionStart?.();
    }
    animationRef.current = animateRect(el, from, to, { duration, easing: config.easing }, () => {
      animationRef.current = null;
      setState(el, 'visible');
      floatyStore.getState().setAnimating(floatyId, false);
      latest.current.onTransitionEnd?.();
    });
  }, [floatyId, layer, snapshot.version, snapshot.anchor, keepMounted]);

  useIsomorphicLayoutEffect(
    () => () => {
      animationRef.current?.cancel();
      animationRef.current = null;
      floatyStore.getState().setAnimating(floatyId, false);
    },
    [floatyId],
  );

  if (!layer) return null;
  if (!keepMounted && !snapshot.anchor) return null;

  return createPortal(
    <div
      ref={itemRef}
      data-floaty={floatyId}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
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
