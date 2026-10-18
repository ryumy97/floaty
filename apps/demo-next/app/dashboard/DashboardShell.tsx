'use client';

import { Floaty, FloatyAnchor, useFloatyState } from '@ryumy97/floaty-react';
import Link from 'next/link';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { ExampleHeader } from '../ExampleHeader';
import { WIDGETS, type WidgetAnchorState, type WidgetDef, widgetFloatyId } from './widgets';

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="ex">
        <ExampleHeader
          logo="Pulse"
          home="/dashboard"
          links={[{ href: '/dashboard', label: 'Overview', prefix: true }]}
        />
        {children}
      </div>
      {WIDGETS.map((widget) => (
        <Floaty
          key={widget.id}
          floatyId={widgetFloatyId(widget.id)}
          transition={{ type: 'spring', duration: 550, bounce: 0.1 }}
        >
          <Widget def={widget} />
        </Floaty>
      ))}
    </>
  );
}

export function WidgetAnchor({ id, form }: { id: string; form: WidgetAnchorState['form'] }) {
  return (
    <FloatyAnchor
      floatyId={widgetFloatyId(id)}
      className={`dash-anchor ${form}`}
      state={{ form } satisfies WidgetAnchorState}
    />
  );
}

const HISTORY = 300;

function nextValue(previous: number, def: WidgetDef): number {
  const drift = (def.start - previous) * 0.02;
  return Math.max(def.min, previous + drift + (Math.random() - 0.5) * 2 * def.volatility);
}

/** Collects data for as long as the dashboard is open, whichever page shows it. */
function useSeries(def: WidgetDef): number[] {
  const [series, setSeries] = useState(() => {
    const values = [def.start];
    for (let i = 1; i < 60; i++) values.push(nextValue(values[i - 1], def));
    return values;
  });
  useEffect(() => {
    const timer = setInterval(
      () => setSeries((s) => [...s.slice(-(HISTORY - 1)), nextValue(s[s.length - 1], def)]),
      1000,
    );
    return () => clearInterval(timer);
  }, [def]);
  return series;
}

function Widget({ def }: { def: WidgetDef }) {
  const form = useFloatyState<WidgetAnchorState>()?.form ?? 'card';
  const series = useSeries(def);
  const [range, setRange] = useState<60 | 300>(60);
  const [hover, setHover] = useState<number | null>(null);
  const shown = series.slice(form === 'large' ? -range : -60);
  const current = series[series.length - 1];
  const change = current - series[Math.max(0, series.length - 61)];
  const good = change === 0 || change > 0 === def.higherIsBetter;
  const hovered = hover === null ? null : shown[Math.round(hover * (shown.length - 1))];
  const href = `/dashboard/${def.id}`;

  return (
    <div
      className={`dash-widget ${form}`}
      style={{ '--hue': def.hue } as CSSProperties}
      data-testid={`widget-${def.id}`}
    >
      <div className="dash-main ex-form" inert={form === 'rail'}>
        <div className="dash-head">
          <div>
            <span className="dash-label">{def.label}</span>
            <strong className="dash-value" data-testid="widget-value">
              {def.format(hovered ?? current)}
            </strong>
            <span className={`dash-change${good ? ' good' : ' bad'}`}>
              {change >= 0 ? '▲' : '▼'} {def.format(Math.abs(change))} in the last minute
            </span>
          </div>
          <div className="dash-ranges ex-form" inert={form !== 'large'}>
            {([60, 300] as const).map((r) => (
              <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>
                {r === 60 ? '1 min' : '5 min'}
              </button>
            ))}
          </div>
        </div>
        <Chart
          values={shown}
          hover={form === 'large' ? hover : null}
          onHover={form === 'large' ? setHover : undefined}
        />
        {form === 'card' && (
          <Link href={href} className="dash-hit" aria-label={`Open ${def.label}`} />
        )}
      </div>

      <Link
        href={href}
        className="dash-rail ex-form"
        inert={form !== 'rail'}
        aria-label={def.label}
      >
        <span>
          <span className="dash-label">{def.label}</span>
          <strong>{def.format(current)}</strong>
        </span>
        <Chart values={series.slice(-60)} />
      </Link>
    </div>
  );
}

/** Stretches with the box (non-scaling strokes), so it stays crisp while flying. */
function Chart({
  values,
  hover,
  onHover,
}: {
  values: number[];
  hover?: number | null;
  onHover?: (x: number | null) => void;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${38 - ((v - min) / span) * 34}`)
    .join(' ');
  return (
    <svg
      aria-hidden
      className="dash-chart"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      onPointerMove={
        onHover &&
        ((e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          onHover(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
        })
      }
      onPointerLeave={onHover && (() => onHover(null))}
    >
      <polygon points={`0,40 ${points} 100,40`} className="dash-area" />
      <polyline points={points} className="dash-line" vectorEffect="non-scaling-stroke" />
      {hover != null && (
        <line
          x1={hover * 100}
          x2={hover * 100}
          y1="0"
          y2="40"
          className="dash-cursor"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
