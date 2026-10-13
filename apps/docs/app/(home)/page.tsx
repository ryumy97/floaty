import Link from 'next/link';
import { LayoutDemo } from '@/components/layout-demo';

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-4 text-4xl font-bold">Floaty</h1>
      <p className="mb-6 text-lg text-fd-muted-foreground">
        Content that keeps its state while your layout changes around it. Render it once, on
        top of the page, and let it follow placeholders from grid to list, page to sidebar,
        or full player to mini player.
      </p>
      <div className="mb-2 flex gap-3">
        <Link
          href="/docs"
          className="rounded-md bg-fd-primary px-4 py-2 font-medium text-fd-primary-foreground"
        >
          Get started
        </Link>
        <Link href="/docs/api/floaty" className="rounded-md border px-4 py-2 font-medium">
          API reference
        </Link>
      </div>
      <LayoutDemo />
    </main>
  );
}
