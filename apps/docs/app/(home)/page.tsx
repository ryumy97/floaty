import Link from 'next/link';
import { LayoutDemo } from '@/components/layout-demo';

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-4 text-4xl font-bold">Floaty Component</h1>
      <p className="mb-6 text-lg text-fd-muted-foreground">
        Making easier to manage floating components.
      </p>
      <div className="mb-2 flex flex-wrap gap-3">
        <Link
          href="/docs"
          className="inline-flex h-10 items-center rounded-lg bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
        >
          Get started
        </Link>
        <Link
          href="/examples"
          className="inline-flex h-10 items-center rounded-lg border bg-fd-card px-4 text-sm font-medium transition-colors hover:bg-fd-accent"
        >
          Examples
        </Link>
        <Link
          href="/docs/api/floaty"
          className="inline-flex h-10 items-center rounded-lg border bg-fd-card px-4 text-sm font-medium transition-colors hover:bg-fd-accent"
        >
          API reference
        </Link>
      </div>
      <LayoutDemo />
    </main>
  );
}
