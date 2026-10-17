import Link from 'next/link';

/** Link back to the examples hub, under the site header on the top right. */
export function ShowcaseHeader() {
  return (
    <div className="flex shrink-0 justify-end px-4 py-3 sm:px-6">
      <Link
        href="/examples"
        className="text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        All examples
      </Link>
    </div>
  );
}
