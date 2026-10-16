import { HomeLayout } from 'fumadocs-ui/layouts/home';
import Link from 'next/link';
import { baseOptions } from '@/lib/layout.shared';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-24">
        <p className="mb-2 font-mono text-sm text-fd-muted-foreground">404</p>
        <h1 className="mb-3 text-4xl font-bold">Page not found</h1>
        <p className="mb-8 text-lg text-fd-muted-foreground">
          That URL is not in these docs. Try the guides, or start from the introduction.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="inline-flex h-10 items-center rounded-lg bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            Documentation
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border bg-fd-card px-4 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            Home
          </Link>
        </div>
      </main>
    </HomeLayout>
  );
}
