import Link from 'next/link';

export const metadata = { title: 'Page not found' };

export default function DocsNotFound() {
  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-16">
      <p className="mb-2 font-mono text-sm text-fd-muted-foreground">404</p>
      <h1 className="mb-3 text-3xl font-bold">Page not found</h1>
      <p className="mb-8 max-w-md text-fd-muted-foreground">
        There is no guide or API page at this path. Pick something from the sidebar, or go back to
        the introduction.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/docs"
          className="inline-flex h-10 items-center rounded-lg bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
        >
          Introduction
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg border bg-fd-card px-4 text-sm font-medium transition-colors hover:bg-fd-accent"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
