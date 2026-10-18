'use client';

import { Floaty, FloatyAnchor, type FloatyTransition } from '@ryumy97/floaty-react';
import { type PointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  type Bezier,
  type Curve,
  easingCurve,
  easingString,
  PRESETS,
  physicalSpring,
  presetOf,
  springCurve,
  toPhysical,
  toVisual,
  visualSpring,
} from '@/lib/curves';

type Mode = 'easing' | 'spring';

const W = 440;
const H = 440;
const PAD = 12;

const Y_MIN = -0.6;
const Y_MAX = 1.6;
/** Progress shown beyond the handles, so a drag can pull them further out. */
const HANDLE_ROOM = 0.25;
const round = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Maps time (in units of the linear duration) and progress onto the SVG with the same scale
 * on both axes, so linear is a 45° diagonal across a square.
 */
interface Scale {
  toX(t: number): number;
  toY(v: number): number;
  fromX(x: number): number;
  fromY(y: number): number;
}

function createScale(span: number, lo: number, hi: number): Scale {
  const plot = Math.min(W, H) - 2 * PAD;
  const unit = Math.min(plot / (hi - lo), plot / span);
  const ox = (W - unit * span) / 2;
  const oy = (H - unit * (hi - lo)) / 2;
  return {
    toX: (t) => ox + t * unit,
    toY: (v) => oy + (hi - v) * unit,
    fromX: (x) => (x - ox) / unit,
    fromY: (y) => hi - (y - oy) / unit,
  };
}

function path(curve: Curve, unitMs: number, span: number, scale: Scale) {
  const steps = 160;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (span * i) / steps;
    const x = scale.toX(t);
    d += `${i ? 'L' : 'M'}${x.toFixed(1)},${scale.toY(curve.at(t * unitMs)).toFixed(1)}`;
  }
  return d;
}

function Handles({
  points,
  onChange,
  onDragging,
  scale,
  range: [lo, hi],
}: {
  points: Bezier;
  onChange: (points: Bezier) => void;
  onDragging: (dragging: boolean) => void;
  scale: Scale;
  range: [number, number];
}) {
  const [x1, y1, x2, y2] = points;
  const { toX, toY } = scale;

  const drag = (index: 0 | 1) => (event: PointerEvent<SVGCircleElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const matrix = event.currentTarget.ownerSVGElement?.getScreenCTM()?.inverse();
    if (!matrix) return;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    const x = round(clamp(scale.fromX(p.x), 0, 1));
    const y = round(clamp(scale.fromY(p.y), lo, hi));
    onChange(index === 0 ? [x, y, x2, y2] : [x1, y1, x, y]);
  };

  const handle = (index: 0 | 1, cx: number, cy: number) => (
    <circle
      cx={toX(cx)}
      cy={toY(cy)}
      r={7}
      aria-label={`Control point ${index + 1}`}
      className="cursor-grab fill-fd-background stroke-float active:cursor-grabbing"
      strokeWidth={2.5}
      style={{ touchAction: 'none' }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onDragging(true);
      }}
      onPointerMove={drag(index)}
      onLostPointerCapture={() => onDragging(false)}
    />
  );

  return (
    <g>
      <line
        x1={toX(0)}
        y1={toY(0)}
        x2={toX(x1)}
        y2={toY(y1)}
        className="stroke-float/50"
        strokeWidth={1.5}
      />
      <line
        x1={toX(1)}
        y1={toY(1)}
        x2={toX(x2)}
        y2={toY(y2)}
        className="stroke-float/50"
        strokeWidth={1.5}
      />
      {handle(0, x1, y1)}
      {handle(1, x2, y2)}
    </g>
  );
}

function Graph({
  curve,
  linear,
  playhead,
  bezier,
}: {
  curve: Curve;
  linear: Curve;
  playhead: number | null;
  bezier?: { points: Bezier; onChange: (points: Bezier) => void };
}) {
  const unitMs = linear.duration;
  const span = Math.max(curve.duration, unitMs) / unitMs;
  const samples = Array.from({ length: 81 }, (_, i) => curve.at((span * unitMs * i) / 80));
  const fit: [number, number] = bezier
    ? [
        Math.max(Y_MIN, Math.min(0, bezier.points[1], bezier.points[3]) - HANDLE_ROOM),
        Math.min(Y_MAX, Math.max(1, bezier.points[1], bezier.points[3]) + HANDLE_ROOM),
      ]
    : [Math.min(-0.05, ...samples), Math.max(1.05, ...samples)];
  const [frozen, setFrozen] = useState<[number, number] | null>(null);
  const [lo, hi] = frozen ?? fit;
  const scale = createScale(span, lo, hi);
  const { toX, toY } = scale;
  const x = playhead === null ? null : toX(Math.min(playhead / unitMs, span));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="aspect-square h-auto w-full select-none"
      role="img"
      aria-label="Progress over time"
    >
      <rect
        x={toX(0)}
        y={toY(1)}
        width={toX(1) - toX(0)}
        height={toY(0) - toY(1)}
        fill="none"
        className="stroke-fd-border"
        strokeDasharray="2 4"
      />
      <line x1={toX(0)} x2={toX(span)} y1={toY(0)} y2={toY(0)} className="stroke-fd-border" />
      <path
        d={path(linear, unitMs, span, scale)}
        fill="none"
        className="stroke-fd-muted-foreground"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <path
        d={path(curve, unitMs, span, scale)}
        fill="none"
        className="stroke-float"
        strokeWidth={2.5}
      />
      {x !== null && (
        <line x1={x} x2={x} y1={toY(hi)} y2={toY(lo)} className="stroke-float/40" strokeWidth={1} />
      )}
      {bezier && (
        <Handles
          {...bezier}
          scale={scale}
          range={[lo, hi]}
          onDragging={(dragging) => setFrozen(dragging ? [lo, hi] : null)}
        />
      )}
      <text
        x={toX(1)}
        y={Math.min(toY(0) + 14, H - 2)}
        textAnchor="end"
        className="fill-fd-muted-foreground text-[10px]"
      >
        {unitMs} ms
      </text>
    </svg>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-16 text-fd-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="flex-1 accent-(--color-float)"
      />
      <span className="w-16 text-end font-mono tabular-nums">{format(value)}</span>
    </label>
  );
}

function Lane({
  floatyId,
  label,
  side,
}: {
  floatyId: string;
  label: string;
  side: 'start' | 'end';
}) {
  const slot =
    'size-12 shrink-0 rounded-xl border-[1.5px] border-dashed border-anchor bg-anchor-fill';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-1 flex-col justify-between">
        <div className={slot}>
          {side === 'start' && <FloatyAnchor floatyId={floatyId} className="size-full" />}
        </div>
        <div className={slot}>
          {side === 'end' && <FloatyAnchor floatyId={floatyId} className="size-full" />}
        </div>
      </div>
      <span className="text-xs text-fd-muted-foreground">{label}</span>
    </div>
  );
}

type SpringForm = 'visual' | 'physical';

function roundPhysical(p: { stiffness: number; damping: number }, mass: number) {
  return { stiffness: Math.round(p.stiffness), damping: Math.round(p.damping * 2) / 2, mass };
}

function SpringGroup({
  title,
  active,
  onActivate,
  children,
}: {
  title: string;
  active: boolean;
  onActivate: () => void;
  children: ReactNode;
}) {
  return (
    <fieldset
      className={`flex flex-col gap-3 rounded-lg border p-3 transition-opacity ${
        active ? 'border-float/40 bg-fd-background' : 'opacity-60 hover:opacity-100'
      }`}
    >
      <legend className="flex items-center gap-2 px-1 text-xs font-medium">
        {title}
        {active ? (
          <span className="rounded bg-float px-1.5 py-0.5 text-[10px] text-float-foreground">
            in snippet
          </span>
        ) : (
          <button
            type="button"
            onClick={onActivate}
            className="rounded border px-1.5 py-0.5 text-[10px] text-fd-muted-foreground"
          >
            use
          </button>
        )}
      </legend>
      {children}
    </fieldset>
  );
}

/** Interactive graph of an easing or spring transition, raced against linear. */
export function TransitionPlayground() {
  const [mode, setMode] = useState<Mode>('spring');
  const [points, setPoints] = useState<Bezier>(PRESETS['ease-in-out']);
  const [duration, setDuration] = useState(500);
  const [bounce, setBounce] = useState(0.3);
  const [springForm, setSpringForm] = useState<SpringForm>('visual');
  const [physical, setPhysicalState] = useState(() =>
    roundPhysical(toPhysical(visualSpring(500, 0.3), 1), 1),
  );
  const [side, setSide] = useState<'start' | 'end'>('start');
  const [playhead, setPlayhead] = useState<number | null>(null);
  const frame = useRef(0);

  const setVisual = (next: { duration?: number; bounce?: number }) => {
    const d = next.duration ?? duration;
    const b = next.bounce ?? bounce;
    setDuration(d);
    setBounce(b);
    setSpringForm('visual');
    setPhysicalState(roundPhysical(toPhysical(visualSpring(d, b), physical.mass), physical.mass));
  };
  const setPhysical = (next: Partial<typeof physical>) => {
    const p = { ...physical, ...next };
    setPhysicalState(p);
    setSpringForm('physical');
    const v = toVisual(physicalSpring(p.stiffness, p.damping, p.mass));
    setDuration(Math.round(v.duration));
    setBounce(Math.round(v.bounce * 100) / 100);
  };

  const spring =
    springForm === 'visual'
      ? visualSpring(duration, bounce)
      : physicalSpring(physical.stiffness, physical.damping, physical.mass);
  const curve = mode === 'spring' ? springCurve(spring) : easingCurve(points, duration);
  const linear = useMemo(() => easingCurve([0, 0, 1, 1], duration), [duration]);
  const easing = easingString(points);
  const preset = presetOf(points);

  let transition: FloatyTransition = { duration, easing };
  let code = `{ duration: ${duration}, easing: '${easing}' }`;
  if (mode === 'spring' && springForm === 'visual') {
    transition = { type: 'spring', duration, bounce };
    code = `{ type: 'spring', duration: ${duration}, bounce: ${bounce} }`;
  } else if (mode === 'spring') {
    transition = { type: 'spring', ...physical };
    code = `{ type: 'spring', stiffness: ${physical.stiffness}, damping: ${physical.damping}, mass: ${physical.mass} }`;
  }

  const play = () => {
    setSide((s) => (s === 'start' ? 'end' : 'start'));
    cancelAnimationFrame(frame.current);
    const start = performance.now();
    const span = Math.max(curve.duration, linear.duration);
    const tick = (now: number) => {
      const t = now - start;
      setPlayhead(t);
      if (t < span) frame.current = requestAnimationFrame(tick);
      else setPlayhead(null);
    };
    frame.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const tab = 'rounded-md px-3 py-1 font-medium transition-colors';
  return (
    <div className="not-prose my-6 rounded-xl border bg-fd-card p-4 text-sm">
      <Floaty
        floatyId="transition-curve"
        transition={transition}
        className="rounded-xl bg-float shadow-float"
      />
      <Floaty
        floatyId="transition-linear"
        transition={{ duration, easing: 'linear' }}
        className="rounded-xl bg-fd-muted-foreground"
      />

      <code className="mb-4 inline-block rounded-md bg-fd-background px-2 py-1 font-mono text-xs">
        transition={`{${code}}`}
      </code>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col justify-center rounded-lg border bg-fd-background p-2">
          <Graph
            curve={curve}
            linear={linear}
            playhead={playhead}
            bezier={mode === 'easing' ? { points, onChange: setPoints } : undefined}
          />
          <div className="flex gap-4 px-2 pb-1 text-xs text-fd-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-float" />{' '}
              {mode === 'spring' ? 'spring' : (preset ?? 'custom')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-4 border-t-[1.5px] border-dashed border-fd-muted-foreground" />{' '}
              linear
            </span>
          </div>
        </div>

        <div className="flex min-h-72 justify-center gap-6 rounded-lg border bg-fd-background p-4">
          <Lane
            floatyId="transition-curve"
            label={mode === 'spring' ? 'Spring' : 'Easing'}
            side={side}
          />
          <Lane floatyId="transition-linear" label="Linear" side={side} />
        </div>

        <div className="flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="w-16 text-fd-muted-foreground">Type</span>
            <div className="flex rounded-lg border bg-fd-background p-0.5" role="tablist">
              {(['spring', 'easing'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`${tab} ${mode === m ? 'bg-fd-card shadow-sm' : 'text-fd-muted-foreground'}`}
                >
                  {m === 'spring' ? 'Spring' : 'Easing'}
                </button>
              ))}
            </div>
          </div>
          {mode === 'easing' && (
            <label className="flex items-center gap-3">
              <span className="w-16 text-fd-muted-foreground">Easing</span>
              <select
                value={preset ?? 'custom'}
                onChange={(event) => setPoints(PRESETS[event.target.value])}
                className="flex-1 rounded-lg border bg-fd-background px-2 py-1.5"
              >
                {Object.keys(PRESETS).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                {!preset && <option value="custom">custom</option>}
              </select>
            </label>
          )}
          {mode === 'easing' && (
            <Slider
              label="Duration"
              value={duration}
              min={100}
              max={1500}
              step={50}
              format={(v) => `${v} ms`}
              onChange={setDuration}
            />
          )}
          {mode === 'spring' && (
            <div className="grid gap-3 md:grid-cols-2 md:gap-6">
              <SpringGroup
                title="Visual"
                active={springForm === 'visual'}
                onActivate={() => setVisual({})}
              >
                <Slider
                  label="Duration"
                  value={duration}
                  min={100}
                  max={1500}
                  step={10}
                  format={(v) => `${v} ms`}
                  onChange={(v) => setVisual({ duration: v })}
                />
                <Slider
                  label="Bounce"
                  value={bounce}
                  min={-0.9}
                  max={0.9}
                  step={0.05}
                  format={(v) => v.toFixed(2)}
                  onChange={(v) => setVisual({ bounce: v })}
                />
              </SpringGroup>
              <SpringGroup
                title="Physical"
                active={springForm === 'physical'}
                onActivate={() => setPhysical({})}
              >
                <Slider
                  label="Stiffness"
                  value={physical.stiffness}
                  min={10}
                  max={1000}
                  step={1}
                  format={(v) => String(v)}
                  onChange={(v) => setPhysical({ stiffness: v })}
                />
                <Slider
                  label="Damping"
                  value={physical.damping}
                  min={1}
                  max={100}
                  step={0.5}
                  format={(v) => String(v)}
                  onChange={(v) => setPhysical({ damping: v })}
                />
                <Slider
                  label="Mass"
                  value={physical.mass}
                  min={0.1}
                  max={5}
                  step={0.1}
                  format={(v) => v.toFixed(1)}
                  onChange={(v) => setPhysical({ mass: v })}
                />
              </SpringGroup>
            </div>
          )}
          <div className="flex items-start gap-4">
            <p className="flex-1 text-xs text-fd-muted-foreground">
              {mode === 'spring'
                ? 'Both groups describe the same spring: editing one updates the other, and the snippet uses the group you edited last. Duration is the perceived length; bounce 0 settles without overshoot. Stiffness speeds the spring up, mass slows it down, damping takes the bounce out.'
                : 'Drag the two handles on the graph to shape the cubic-bezier. Pull a handle above or below the box to overshoot. Easing always ends exactly at the duration.'}
            </p>
            <button
              type="button"
              onClick={play}
              className="h-9 shrink-0 rounded-lg bg-fd-primary px-4 font-medium text-fd-primary-foreground"
            >
              Play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
