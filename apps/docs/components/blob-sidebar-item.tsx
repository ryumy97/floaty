'use client';

import { cn } from 'cn';
import type * as PageTree from 'fumadocs-core/page-tree';
import { SidebarItem, useFolderDepth, useSidebar } from 'fumadocs-ui/components/sidebar/base';
import { usePathname } from 'next/navigation';
import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { useDisplayed } from '@/lib/use-displayed';
import { BlobAnchor } from './blob';

const normalize = (url: string) => (url.length > 1 && url.endsWith('/') ? url.slice(0, -1) : url);

/** Matches Fumadocs' item indentation per folder depth. */
const offset = (depth: number) => `calc(${2 + 3 * depth} * var(--spacing))`;

/**
 * The sidebar renders twice: the desktop aside (`display: none` on mobile, slid off-screen
 * when collapsed) and the mobile drawer (laid out but `visibility: hidden` while closed).
 * Only the copy the user can see holds the anchor; with neither, the blob hides.
 */
function useSidebarVisible(ref: RefObject<HTMLElement | null>) {
  const displayed = useDisplayed(ref);
  const { open, collapsed } = useSidebar();
  const [inDrawer, setInDrawer] = useState(false);
  useLayoutEffect(() => {
    setInDrawer(!ref.current?.closest('#nd-sidebar'));
  }, [ref]);
  return displayed && (inDrawer ? open : !collapsed);
}

function ActiveAnchor({ depth, children }: { depth: number; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useSidebarVisible(ref);
  return (
    <span ref={ref} className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2">
      {visible && (
        <BlobAnchor
          state={{
            className: 'justify-start rounded-lg text-sm [&_svg]:size-4 [&_svg]:shrink-0',
            children: (
              <span
                className="flex min-w-0 items-center gap-2 pe-2"
                style={{ paddingInlineStart: offset(depth) }}
              >
                {children}
              </span>
            ),
          }}
          className="size-full"
        />
      )}
    </span>
  );
}

/** Sidebar page link; the current page's link is the blob's anchor, so the blob flies to it on navigation. */
export function BlobSidebarItem({ item }: { item: PageTree.Item }) {
  const pathname = usePathname();
  const depth = useFolderDepth();
  const active = normalize(item.url) === normalize(pathname);
  const label = (
    <>
      {item.icon}
      <span className="truncate">{item.name}</span>
    </>
  );

  return (
    <SidebarItem
      href={item.url}
      external={item.external}
      active={active}
      className={cn(
        'relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground transition-colors wrap-anywhere hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 [&_svg]:size-4 [&_svg]:shrink-0',
        {
          'bg-fd-accent/50 text-fd-accent-foreground/80': active,
        },
      )}
      style={{ paddingInlineStart: offset(depth) }}
    >
      {label}
      {active && <ActiveAnchor depth={depth}>{label}</ActiveAnchor>}
    </SidebarItem>
  );
}
