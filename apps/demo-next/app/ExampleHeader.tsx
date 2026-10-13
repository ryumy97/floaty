'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface NavLink {
  href: string;
  label: string;
  /** Also current on nested routes. */
  prefix?: boolean;
}

export function ExampleHeader({
  logo,
  home,
  links,
  children,
}: {
  logo: string;
  home: string;
  links: NavLink[];
  /** Rendered at the end of the header. */
  children?: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <header className="ex-header">
      <Link href={home} className="ex-logo">
        {logo}
      </Link>
      <nav className="ex-nav">
        {links.map(({ href, label, prefix }) => {
          const current = pathname === href || (prefix && pathname.startsWith(`${href}/`));
          return (
            <Link key={href} href={href} aria-current={current ? 'page' : undefined}>
              {label}
            </Link>
          );
        })}
      </nav>
      <Link href="/" className="ex-back">
        All examples
      </Link>
      {children}
    </header>
  );
}
