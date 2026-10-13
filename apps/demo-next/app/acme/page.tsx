import Link from 'next/link';

const FEATURES = [
  ['Plan', 'Roadmaps that update themselves from the work your team is already doing.'],
  ['Track', 'Every issue, pull request and deploy in one timeline.'],
  ['Ship', 'Release notes written for you, sent to the customers who asked.'],
  ['Learn', 'See which features get used, and which ones nobody found.'],
];

export default function AcmeHome() {
  return (
    <div className="ex-page">
      <section className="acme-hero">
        <h1>Project planning that keeps up with your team</h1>
        <p>Start a conversation with support in the corner: it follows you across the site.</p>
        <Link href="/acme/pricing" className="acme-cta">
          See pricing
        </Link>
      </section>
      <ul className="acme-features">
        {FEATURES.map(([title, text]) => (
          <li key={title}>
            <strong>{title}</strong>
            <p>{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
