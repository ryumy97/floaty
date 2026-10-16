import Link from 'next/link';
import './example.css';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="ex">
      <header className="ex-header">
        <Link href="/" className="ex-logo">
          Floaty examples
        </Link>
      </header>
      <div className="ex-page" style={{ paddingTop: 64, maxWidth: 560 }}>
        <p className="ex-meta" style={{ marginBottom: 8 }}>
          404
        </p>
        <h1 className="ex-title">Page not found</h1>
        <p className="ex-meta" style={{ marginBottom: 24 }}>
          That path is not one of the examples. Head back to the list.
        </p>
        <Link
          href="/"
          className="ex-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 40,
            padding: '0 16px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          All examples
        </Link>
      </div>
    </div>
  );
}
