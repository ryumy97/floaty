/**
 * Progress curves for the transitions playground. They must match the math in
 * `packages/react/src/animate.ts` (cubic-bezier easing) and `spring.ts` (visual springs),
 * so the graph shows what Floaty actually plays.
 */

export type Bezier = readonly [number, number, number, number];

const KEYWORDS: Record<string, Bezier> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

export const PRESETS: Record<string, Bezier> = {
  ease: KEYWORDS.ease,
  'ease-in': KEYWORDS['ease-in'],
  'ease-out': KEYWORDS['ease-out'],
  'ease-in-out': KEYWORDS['ease-in-out'],
  'back-out': [0.34, 1.56, 0.64, 1],
  'back-in-out': [0.68, -0.6, 0.32, 1.6],
};

const same = (a: Bezier, b: Bezier) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6);

export function presetOf(points: Bezier): string | undefined {
  return Object.keys(PRESETS).find((name) => same(PRESETS[name], points));
}

/** The CSS easing string Floaty receives: a keyword when one matches, else `cubic-bezier()`. */
export function easingString(points: Bezier): string {
  const keyword = Object.keys(KEYWORDS).find((name) => same(KEYWORDS[name], points));
  return keyword ?? `cubic-bezier(${points.map((v) => Math.round(v * 100) / 100).join(', ')})`;
}

export function cubicBezier([x1, y1, x2, y2]: Bezier) {
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

/** A curve from 0 to 1 over `duration` ms. */
export interface Curve {
  duration: number;
  at(ms: number): number;
}

export function easingCurve(points: Bezier, duration: number): Curve {
  const ease = cubicBezier(points);
  return { duration, at: (ms) => ease(Math.min(1, Math.max(0, ms / duration))) };
}

/** Natural angular frequency (rad/s) and damping ratio of a spring. */
export interface SpringParams {
  omega: number;
  zeta: number;
}

/** `duration` is the period in ms, `bounce` from -1 to 1. */
export function visualSpring(duration: number, bounce: number): SpringParams {
  const b = Math.min(0.99, Math.max(-0.99, bounce));
  return { omega: (2 * Math.PI) / (duration / 1000), zeta: b >= 0 ? 1 - b : 1 / (1 + b) };
}

export function physicalSpring(stiffness: number, damping: number, mass: number): SpringParams {
  const omega = Math.sqrt(stiffness / mass);
  return { omega, zeta: damping / (2 * mass * omega) };
}

export function toVisual({ omega, zeta }: SpringParams) {
  return {
    duration: (2 * Math.PI * 1000) / omega,
    bounce: Math.max(-0.99, zeta <= 1 ? 1 - zeta : 1 / zeta - 1),
  };
}

export function toPhysical({ omega, zeta }: SpringParams, mass: number) {
  return { stiffness: mass * omega * omega, damping: 2 * mass * omega * zeta };
}

/** Unit spring from 0 to 1, settled within 0.1%. */
export function springCurve({ omega, zeta }: SpringParams): Curve {
  const gap = (s: number) => {
    if (zeta < 1 - 1e-6) {
      const wd = omega * Math.sqrt(1 - zeta * zeta);
      return (
        Math.exp(-zeta * omega * s) * (Math.cos(wd * s) + ((zeta * omega) / wd) * Math.sin(wd * s))
      );
    }
    if (zeta <= 1 + 1e-6) return (1 + omega * s) * Math.exp(-omega * s);
    const root = omega * Math.sqrt(zeta * zeta - 1);
    const r1 = -zeta * omega + root;
    const r2 = -zeta * omega - root;
    const c2 = -r1 / (r2 - r1);
    return (1 - c2) * Math.exp(r1 * s) + c2 * Math.exp(r2 * s);
  };
  let settle = 10;
  for (let s = 1 / 120; s < 10; s += 1 / 120) {
    if (Math.abs(gap(s)) < 1e-3 && Math.abs(gap(s + 1 / 120)) < 1e-3) {
      settle = s;
      break;
    }
  }
  return { duration: settle * 1000, at: (ms) => (ms >= settle * 1000 ? 1 : 1 - gap(ms / 1000)) };
}
