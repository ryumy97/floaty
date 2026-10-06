import type { FloatyRect, FloatyTransitionConfig } from './types';

export interface RectAnimation {
  /** Stops the animation without calling `onFinish`. */
  cancel(): void;
  /** Milliseconds left until the animation finishes. */
  remaining(): number;
}

export function rectStyle(rect: FloatyRect) {
  return {
    transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
}

export function applyRect(el: HTMLElement, rect: FloatyRect) {
  const style = rectStyle(rect);
  el.style.transform = style.transform;
  el.style.width = style.width;
  el.style.height = style.height;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Animates `el` from `from` to `to`. The caller must already have applied
 * `to` as the element's resting inline style (FLIP "last" state).
 */
export function animateRect(
  el: HTMLElement,
  from: FloatyRect,
  to: FloatyRect,
  { duration, easing }: FloatyTransitionConfig,
  onFinish: () => void,
): RectAnimation {
  const keyframes = [rectStyle(from), rectStyle(to)];

  if (typeof el.animate === 'function') {
    const animation = el.animate(keyframes, { duration, easing });
    animation.onfinish = onFinish;
    return {
      cancel: () => {
        animation.onfinish = null;
        animation.cancel();
      },
      remaining: () => {
        const t = Number(animation.currentTime ?? 0);
        return Math.max(0, duration - t);
      },
    };
  }

  return animateWithFrames(el, from, to, duration, easingFunction(easing), onFinish);
}

function animateWithFrames(
  el: HTMLElement,
  from: FloatyRect,
  to: FloatyRect,
  duration: number,
  ease: (t: number) => number,
  onFinish: () => void,
): RectAnimation {
  const start = performance.now();
  let frame = 0;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const step = (now: number) => {
    const t = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
    const e = ease(t);
    applyRect(el, {
      x: lerp(from.x, to.x, e),
      y: lerp(from.y, to.y, e),
      width: lerp(from.width, to.width, e),
      height: lerp(from.height, to.height, e),
    });
    if (t < 1) {
      frame = requestAnimationFrame(step);
    } else {
      frame = 0;
      onFinish();
    }
  };
  step(start);

  return {
    cancel: () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      applyRect(el, to);
    },
    remaining: () => Math.max(0, duration - (performance.now() - start)),
  };
}

const NAMED_EASINGS: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

export function easingFunction(easing: string): (t: number) => number {
  const named = NAMED_EASINGS[easing.trim()];
  const match = /^cubic-bezier\(([^)]+)\)$/.exec(easing.trim());
  const points = named ?? (match ? match[1].split(',').map(Number) : null);
  if (!points || points.length !== 4 || points.some(Number.isNaN)) {
    return cubicBezier(...NAMED_EASINGS['ease-in-out']);
  }
  return cubicBezier(points[0], points[1], points[2], points[3]);
}

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const coord = (t: number, p1: number, p2: number) =>
    3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 20; i++) {
      const cx = coord(t, x1, x2);
      if (Math.abs(cx - x) < 1e-5) break;
      if (cx < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return coord(t, y1, y2);
  };
}
