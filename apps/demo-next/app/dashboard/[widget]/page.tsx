import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WidgetAnchor } from '../DashboardShell';
import { getWidget, WIDGETS } from '../widgets';

export default async function WidgetPage({ params }: { params: Promise<{ widget: string }> }) {
  const { widget: id } = await params;
  const widget = getWidget(id);
  if (!widget) notFound();

  return (
    <div className="ex-page dash-detail">
      <div>
        <Link href="/dashboard" className="dash-back">
          ← Overview
        </Link>
        <WidgetAnchor id={widget.id} form="large" />
        <h1 className="ex-subtitle dash-detail-title">{widget.label}</h1>
        <p className="ex-meta">{widget.description}</p>
        <p className="ex-meta">
          Hover the chart to read past values. The history keeps growing while you move between
          pages, because the widget never remounts.
        </p>
      </div>
      <div className="dash-rail-list">
        <h2 className="ex-subtitle">Other metrics</h2>
        {WIDGETS.filter((w) => w.id !== widget.id).map((w) => (
          <WidgetAnchor key={w.id} id={w.id} form="rail" />
        ))}
      </div>
    </div>
  );
}
