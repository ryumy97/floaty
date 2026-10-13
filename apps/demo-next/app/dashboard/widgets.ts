export interface WidgetDef {
  id: string;
  label: string;
  description: string;
  start: number;
  volatility: number;
  min: number;
  hue: number;
  format: (value: number) => string;
  /** Rising is good for this metric. */
  higherIsBetter: boolean;
}

export const WIDGETS: WidgetDef[] = [
  {
    id: 'revenue',
    label: 'Revenue today',
    description: 'Sum of paid orders since midnight, refreshed every second.',
    start: 12_400,
    volatility: 160,
    min: 0,
    hue: 160,
    format: (v) => `$${(v / 1000).toFixed(1)}k`,
    higherIsBetter: true,
  },
  {
    id: 'users',
    label: 'Active users',
    description: 'Users with a session active in the last five minutes.',
    start: 1284,
    volatility: 24,
    min: 0,
    hue: 230,
    format: (v) => Math.round(v).toLocaleString('en-US'),
    higherIsBetter: true,
  },
  {
    id: 'latency',
    label: 'API latency (p95)',
    description: '95th percentile response time across all public endpoints.',
    start: 182,
    volatility: 9,
    min: 40,
    hue: 30,
    format: (v) => `${Math.round(v)} ms`,
    higherIsBetter: false,
  },
  {
    id: 'errors',
    label: 'Error rate',
    description: 'Share of requests answered with a 5xx status.',
    start: 0.42,
    volatility: 0.04,
    min: 0,
    hue: 350,
    format: (v) => `${v.toFixed(2)}%`,
    higherIsBetter: false,
  },
];

export function getWidget(id: string): WidgetDef | undefined {
  return WIDGETS.find((widget) => widget.id === id);
}

export function widgetFloatyId(id: string): string {
  return `widget-${id}`;
}

export interface WidgetAnchorState {
  form: 'card' | 'large' | 'rail';
}
