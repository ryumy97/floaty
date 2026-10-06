import { settleTime, sizeSpringParams, springAt, springParams, type SpringParams } from './spring';
import type {
  FloatyEasingTransition,
  FloatyRect,
  FloatySpringTransition,
  FloatyTransitionConfig,
} from './types';

const AXES = ['x', 'y', 'width', 'height'] as const;
type Axis = (typeof AXES)[number];

export const ZERO_RECT: FloatyRect = { x: 0, y: 0, width: 0, height: 0 };

function mapRect(fn: (axis: Axis) => number): FloatyRect {
  return { x: fn('x'), y: fn('y'), width: fn('width'), height: fn('height') };
}

/** `delta + from - to`: a gap carried over when the target jumps from `from` to `to`. */
export function shiftDelta(delta: FloatyRect, from: FloatyRect, to: FloatyRect): FloatyRect {
  return mapRect((a) => delta[a] + from[a] - to[a]);
}

/** Gap between the visible box and its target (px), and how fast it changes (px/s). */
export interface MotionState {
  delta: FloatyRect;
  velocity: FloatyRect;
}

const AT_REST: MotionState = { delta: ZERO_RECT, velocity: ZERO_RECT };

/** Trajectory of the gap from its initial value to zero. */
export interface MotionCurve {
  /** Milliseconds until the gap is zero; `0` means there is nothing to animate. */
  duration: number;
  at(t: number): MotionState;
  /** Set when the whole curve is one CSS-eased segment. */
  easing?: string;
}

export interface Motion {
  current(): MotionState;
  /** Stops without calling `onFinish` and restores the element's resting styles. */
  cancel(): void;
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

const round = (n: number) => Math.round(n * 100) / 100 || 0;
const calc = (d: number) => `calc(100% ${d < 0 ? '-' : '+'} ${Math.abs(round(d))}px)`;

/** Styles that draw a box `delta` away from its parent's box. */
export function deltaStyle(delta: FloatyRect) {
  return {
    transform: `translate3d(${round(delta.x)}px, ${round(delta.y)}px, 0)`,
    width: calc(delta.width),
    height: calc(delta.height),
  };
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function createCurve(
  config: FloatyTransitionConfig,
  delta: FloatyRect,
  velocity: FloatyRect = ZERO_RECT,
): MotionCurve {
  return config.type === 'spring'
    ? springCurve(config, delta, velocity)
    : easingCurve(config, delta);
}

function easingCurve({ duration, easing }: FloatyEasingTransition, delta: FloatyRect): MotionCurve {
  const ease = easingFunction(easing);
  const still = AXES.every((a) => delta[a] === 0);
  return {
    duration: still ? 0 : Math.max(0, duration),
    easing,
    at(t) {
      if (duration <= 0 || t >= duration) return AT_REST;
      const p = Math.max(0, t / duration);
      const step = 1e-3;
      const slope = (ease(Math.min(1, p + step)) - ease(p)) / step;
      const remaining = 1 - ease(p);
      return {
        delta: mapRect((a) => delta[a] * remaining),
        velocity: mapRect((a) => (-delta[a] * slope * 1000) / duration),
      };
    },
  };
}

function springCurve(
  config: FloatySpringTransition,
  delta: FloatyRect,
  velocity: FloatyRect,
): MotionCurve {
  const position = springParams(config);
  const size = sizeSpringParams(config.bounceSize, position);
  const paramsOf = (a: Axis): SpringParams => (a === 'x' || a === 'y' ? position : size);
  const from = (a: Axis) => ({ value: delta[a], velocity: velocity[a] });
  const duration = Math.max(...AXES.map((a) => settleTime(paramsOf(a), from(a)))) * 1000;
  return {
    duration,
    at(t) {
      if (t >= duration) return AT_REST;
      const delta = { ...ZERO_RECT };
      const velocity = { ...ZERO_RECT };
      for (const a of AXES) {
        const s = springAt(paramsOf(a), from(a), Math.max(0, t) / 1000);
        delta[a] = s.value;
        velocity[a] = s.velocity;
      }
      return { delta, velocity };
    },
  };
}

const FRAME_MS = 1000 / 60;

function sampleKeyframes(curve: MotionCurve): Keyframe[] {
  const count = Math.max(1, Math.ceil(curve.duration / FRAME_MS));
  const keyframes: Keyframe[] = [];
  for (let i = 0; i <= count; i++) {
    keyframes.push(deltaStyle(curve.at((curve.duration * i) / count).delta));
  }
  return keyframes;
}

/**
 * Animates `el` (whose resting box equals its parent's) along `curve`. The
 * gap is drawn relative to the parent, so moving the parent never disturbs
 * a running animation.
 */
export function playCurve(el: HTMLElement, curve: MotionCurve, onFinish: () => void): Motion {
  if (typeof el.animate === 'function') {
    const keyframes = curve.easing
      ? [deltaStyle(curve.at(0).delta), deltaStyle(ZERO_RECT)]
      : sampleKeyframes(curve);
    const animation = el.animate(keyframes, {
      duration: curve.duration,
      easing: curve.easing ?? 'linear',
    });
    animation.onfinish = onFinish;
    return {
      current: () => curve.at(Number(animation.currentTime ?? 0)),
      cancel: () => {
        animation.onfinish = null;
        animation.cancel();
      },
    };
  }
  return playWithFrames(el, curve, onFinish);
}

function playWithFrames(el: HTMLElement, curve: MotionCurve, onFinish: () => void): Motion {
  const rest = { transform: el.style.transform, width: el.style.width, height: el.style.height };
  const restore = () => Object.assign(el.style, rest);
  const start = performance.now();
  let frame = 0;

  const step = (now: number) => {
    const t = now - start;
    if (t >= curve.duration) {
      frame = 0;
      restore();
      onFinish();
      return;
    }
    Object.assign(el.style, deltaStyle(curve.at(t).delta));
    frame = requestAnimationFrame(step);
  };
  step(start);

  return {
    current: () => curve.at(performance.now() - start),
    cancel: () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      restore();
    },
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
