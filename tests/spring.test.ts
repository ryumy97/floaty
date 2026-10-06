import { describe, expect, it } from 'vitest';
import { createCurve } from '../src/animate';
import { settleTime, sizeSpringParams, springAt, springParams } from '../src/spring';

const from = { value: 100, velocity: 0 };

describe('springParams', () => {
  it('maps visual options to frequency and damping ratio', () => {
    expect(springParams({ duration: 500 })).toEqual({ omega: 4 * Math.PI, zeta: 1 });
    expect(springParams({ duration: 500, bounce: 0.25 }).zeta).toBeCloseTo(0.75);
    expect(springParams({ duration: 500, bounce: -0.5 }).zeta).toBeCloseTo(2);
  });

  it('maps physical options to the same parameters', () => {
    const omega = 10;
    const zeta = 0.4;
    const params = springParams({ stiffness: omega * omega * 2, damping: 2 * zeta * omega * 2, mass: 2 });
    expect(params.omega).toBeCloseTo(omega);
    expect(params.zeta).toBeCloseTo(zeta);
  });

  it('critically damps size unless bounceSize is given', () => {
    const position = springParams({ duration: 400, bounce: 0.5 });
    expect(sizeSpringParams(undefined, position)).toEqual({ omega: position.omega, zeta: 1 });
    expect(sizeSpringParams(false, position).zeta).toBe(1);
    expect(sizeSpringParams({ duration: 400, bounce: 0.2 }, position).zeta).toBeCloseTo(0.8);
  });
});

describe('springAt', () => {
  const cases = {
    underdamped: { omega: 12, zeta: 0.3 },
    critical: { omega: 12, zeta: 1 },
    overdamped: { omega: 12, zeta: 2 },
  };

  it.each(Object.entries(cases))('%s: starts at the initial state and settles', (_, params) => {
    const start = { value: 100, velocity: -250 };
    const s0 = springAt(params, start, 0);
    expect(s0.value).toBeCloseTo(100);
    expect(s0.velocity).toBeCloseTo(-250);
    const end = springAt(params, start, settleTime(params, start));
    expect(Math.abs(end.value)).toBeLessThan(0.5);
    expect(Math.abs(end.velocity)).toBeLessThan(5);
  });

  it.each(Object.entries(cases))('%s: continuing from a sampled state matches the original', (_, params) => {
    const mid = springAt(params, from, 0.12);
    const direct = springAt(params, from, 0.3);
    const resumed = springAt(params, mid, 0.18);
    expect(resumed.value).toBeCloseTo(direct.value, 6);
    expect(resumed.velocity).toBeCloseTo(direct.velocity, 6);
  });

  it('overshoots only when underdamped', () => {
    const minOver = (params: { omega: number; zeta: number }) => {
      let min = Infinity;
      for (let t = 0; t < 2; t += 0.005) min = Math.min(min, springAt(params, from, t).value);
      return min;
    };
    expect(minOver(cases.underdamped)).toBeLessThan(-1);
    expect(minOver(cases.critical)).toBeGreaterThanOrEqual(0);
    expect(minOver(cases.overdamped)).toBeGreaterThanOrEqual(0);
  });

  it('snaps when the visual duration is zero', () => {
    expect(settleTime(springParams({ duration: 0 }), from)).toBe(0);
  });
});

describe('spring curve', () => {
  it('bounces position but not size by default', () => {
    const curve = createCurve(
      { type: 'spring', duration: 400, bounce: 0.5 },
      { x: -100, y: 0, width: -100, height: 0 },
    );
    let maxX = -Infinity;
    let maxWidth = -Infinity;
    for (let t = 0; t <= curve.duration; t += 5) {
      const { delta } = curve.at(t);
      maxX = Math.max(maxX, delta.x);
      maxWidth = Math.max(maxWidth, delta.width);
    }
    expect(maxX).toBeGreaterThan(1);
    expect(maxWidth).toBeLessThanOrEqual(0);
  });

  it('carries velocity into a retargeted curve', () => {
    const config = { type: 'spring', duration: 400, bounce: 0.2 } as const;
    const first = createCurve(config, { x: -200, y: 0, width: 0, height: 0 });
    const state = first.at(80);
    const second = createCurve(config, state.delta, state.velocity);
    expect(second.at(0).velocity.x).toBeCloseTo(state.velocity.x);
    expect(second.at(50).delta.x).toBeCloseTo(first.at(130).delta.x, 6);
  });
});
