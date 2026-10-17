import Link from 'next/link';
import { EXAMPLES } from '@/lib/examples';

export const metadata = { title: 'Examples' };

export default function ExamplesPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16">
      <h1 className="mb-4 text-4xl font-bold">Examples</h1>
      <p className="mb-10 text-lg text-fd-muted-foreground">
        Full-page patterns: one floating component moves between places and keeps its state.
      </p>

      <ul className="grid gap-4">
        {EXAMPLES.map(({ id, title, text }) => (
          <li key={id}>
            <Link
              href={`/examples/${id}`}
              className="block rounded-xl border bg-fd-card p-5 transition-colors hover:bg-fd-accent"
            >
              <strong className="mb-1.5 block text-base font-semibold">{title}</strong>
              <p className="text-sm text-fd-muted-foreground">{text}</p>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/docs"
        className="mt-14 inline-flex h-10 w-fit items-center rounded-lg border bg-fd-card px-4 text-sm font-medium transition-colors hover:bg-fd-accent"
      >
        Documentation
      </Link>
    </main>
  );
}
