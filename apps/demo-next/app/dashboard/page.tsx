import { WidgetAnchor } from './DashboardShell';
import { WIDGETS } from './widgets';

export default function Overview() {
  return (
    <div className="ex-page">
      <h1 className="ex-title">Overview</h1>
      <div className="dash-grid">
        {WIDGETS.map((widget) => (
          <WidgetAnchor key={widget.id} id={widget.id} form="card" />
        ))}
      </div>
    </div>
  );
}
