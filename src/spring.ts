import type { FloatySpringOptions } from './types';

/** Natural angular frequency (rad/s) and damping ratio of a unit-mass spring. */
export interface SpringParams {
  omega: number;
  zeta: number;
}

/** Position (px) and velocity (px/s) of one axis. */
export interface SpringState {
  value: number;
  velocity: number;
}

const MAX_SETTLE_SECONDS = 10;
const SETTLE_STEP_SECONDS = 1 / 120;

export function springParams(options: FloatySpringOptions): SpringParams {
  if (options.stiffness !== undefined) {
    const mass = options.mass ?? 1;
    const omega = Math.sqrt(Math.max(0, options.stiffness) / mass);
    const zeta = omega > 0 ? Math.max(0, options.damping) / (2 * mass * omega) : 1;
    return { omega, zeta };
  }
  const duration = options.duration / 1000;
  const bounce = Math.min(0.99, Math.max(-0.99, options.bounce ?? 0));
  return {
    omega: duration > 0 ? (2 * Math.PI) / duration : Infinity,
    zeta: bounce >= 0 ? 1 - bounce : 1 / (1 + bounce),
  };
}

export function sizeSpringParams(
  bounceSize: false | FloatySpringOptions | undefined,
  position: SpringParams,
): SpringParams {
  return bounceSize
    ? springParams(bounceSize)
    : { omega: position.omega, zeta: Math.max(1, position.zeta) };
}

/**
 * Closed-form solution of `x'' + 2ζωx' + ω²x = 0` at time `t` (seconds),
 * starting from `value` and `velocity`. The spring rests at 0.
 */
export function springAt({ omega, zeta }: SpringParams, from: SpringState, t: number): SpringState {
  const { value: x0, velocity: v0 } = from;
  if (!Number.isFinite(omega)) return { value: 0, velocity: 0 };
  if (omega === 0) return { value: x0 + v0 * t, velocity: v0 };

  if (zeta < 1 - 1e-6) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    const decay = Math.exp(-zeta * omega * t);
    const a = x0;
    const b = (v0 + zeta * omega * x0) / wd;
    const cos = Math.cos(wd * t);
    const sin = Math.sin(wd * t);
    return {
      value: decay * (a * cos + b * sin),
      velocity: decay * (-zeta * omega * (a * cos + b * sin) + wd * (b * cos - a * sin)),
    };
  }

  if (zeta <= 1 + 1e-6) {
    const decay = Math.exp(-omega * t);
    const b = v0 + omega * x0;
    return {
      value: (x0 + b * t) * decay,
      velocity: (b - omega * (x0 + b * t)) * decay,
    };
  }

  const root = omega * Math.sqrt(zeta * zeta - 1);
  const r1 = -zeta * omega + root;
  const r2 = -zeta * omega - root;
  const c2 = (v0 - r1 * x0) / (r2 - r1);
  const c1 = x0 - c2;
  const e1 = Math.exp(r1 * t);
  const e2 = Math.exp(r2 * t);
  return { value: c1 * e1 + c2 * e2, velocity: c1 * r1 * e1 + c2 * r2 * e2 };
}

/**
 * Seconds until the spring is within `restDelta` px of rest and slower than
 * `restSpeed` px/s. Capped at 10 seconds.
 */
export function settleTime(
  params: SpringParams,
  from: SpringState,
  restDelta = 0.5,
  restSpeed = 5,
): number {
  const atRest = (s: SpringState) =>
    Math.abs(s.value) < restDelta && Math.abs(s.velocity) < restSpeed;
  if (atRest(from) || !Number.isFinite(params.omega)) return 0;
  for (let t = SETTLE_STEP_SECONDS; t < MAX_SETTLE_SECONDS; t += SETTLE_STEP_SECONDS) {
    if (atRest(springAt(params, from, t))) return t;
  }
  return MAX_SETTLE_SECONDS;
}
