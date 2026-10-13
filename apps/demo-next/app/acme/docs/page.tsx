const SECTIONS = [
  'Getting started',
  'Projects and roadmaps',
  'Connecting your repositories',
  'Automations',
  'Release notes',
  'Permissions',
  'API reference',
];

export default function Docs() {
  return (
    <div className="ex-page acme-docs">
      <h1 className="ex-title">Documentation</h1>
      {SECTIONS.map((title) => (
        <section key={title}>
          <h2 className="ex-subtitle">{title}</h2>
          <p>
            Acme connects to the tools your team already uses. Each project gets a roadmap that
            fills itself from issues and pull requests, so the plan always reflects the work.
            Scroll as far as you like: the support chat stays docked in the corner, with your
            conversation where you left it.
          </p>
        </section>
      ))}
    </div>
  );
}
