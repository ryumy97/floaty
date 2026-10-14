'use client';

import { createFloaty } from '@floaty/react';
import type { SortedResult } from 'fumadocs-core/search';
import { useFetchSearch, useHighlightQuery } from 'fumadocs-core/search/client';
import { type SharedProps, useSearchContext } from 'fumadocs-ui/contexts/search';
import type {
  FullSearchTriggerProps,
  SearchTriggerProps,
} from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import { FileText, Hash, Search, Text } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

type Form = 'bar' | 'icon' | 'dialog';

/** One search box for the whole site: it rests on the layout's search trigger and flies up to become the dialog. */
const search = createFloaty<{ form: Form; round?: boolean }>('docs-search');

const HEADER = 48;
const MAX_LIST = 400;

/**
 * Layouts render both triggers and hide one with CSS per breakpoint, so the displayed one
 * takes priority over the hidden one.
 */
function useDisplayed(ref: RefObject<HTMLElement | null>) {
  const [displayed, setDisplayed] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current!;
    const update = () => setDisplayed(el.getClientRects().length > 0);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return displayed;
}

function TriggerAnchor({ form, className }: { form: Form; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const displayed = useDisplayed(ref);
  return (
    <search.FloatyAnchor
      ref={ref}
      priority={displayed ? 1 : 0}
      state={{ form, round: className?.includes('rounded-full') }}
      className={cn(
        'shrink-0 rounded-lg bg-fd-secondary/40',
        form === 'bar' ? 'h-9 w-full' : 'size-9',
        className,
      )}
    />
  );
}

export function SearchBarSlot({ className }: FullSearchTriggerProps) {
  return <TriggerAnchor form="bar" className={className} />;
}

export function SearchIconSlot({ className }: SearchTriggerProps) {
  return <TriggerAnchor form="icon" className={cn(className, 'p-0')} />;
}

function flatten(items: NonNullable<ReturnType<typeof useFetchSearch>['data']>['items']) {
  return items.flatMap((item): SortedResult[] => ('rows' in item ? item.rows : [item]));
}

const ICONS = { page: FileText, heading: Hash, text: Text };

/** Result `content` is Markdown (emphasis, code, table rows); results show it as plain text. */
function plain(content: string) {
  return content
    .split('\n')
    .filter((line) => !/^[\s|:-]+$/.test(line))
    .join(' ')
    .replace(/\*\*|`/g, '')
    .replace(/\s*\|\s*/g, '  ')
    .trim();
}

/** Passed to `RootProvider` as the search dialog, so ⌘K and the open state stay Fumadocs'. */
export function FloatySearchDialog({ open, onOpenChange }: SharedProps) {
  const router = useRouter();
  const { search: query, onSearchChange, data } = useFetchSearch({ api: '/api/search' });
  const results = useMemo(() => (query && data ? flatten(data.items) : []), [query, data]);
  const [listHeight, setListHeight] = useState(0);
  const [layer, setLayer] = useState<Element | null>(null);

  // The backdrop goes in the overlay layer, under the search box, to cover other floaties.
  useEffect(() => setLayer(document.querySelector('[data-floaty-layer]')), []);

  useEffect(() => {
    // Fumadocs' own triggers (`data-search`, e.g. in the collapsed sidebar's toolbar) open a
    // Base UI dialog handle this dialog doesn't use.
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-search]')) {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  const select = (url: string) => {
    onOpenChange(false);
    onSearchChange('');
    router.push(url);
  };

  const dialogHeight =
    HEADER + (query && data ? Math.min(Math.max(listHeight, 56), MAX_LIST) + 1 : 0);

  return (
    <>
      <search.Floaty transition={{ type: 'spring', duration: 500, bounce: 0.18 }}>
        <SearchBox
          open={open}
          onOpenChange={onOpenChange}
          query={query}
          onQueryChange={onSearchChange}
          results={results}
          searched={!!(query && data)}
          onSelect={select}
          onListResize={setListHeight}
        />
      </search.Floaty>
      {layer &&
        createPortal(
          <div
            aria-hidden
            data-open={open}
            onClick={() => onOpenChange(false)}
            className="pointer-events-none fixed inset-0 z-1 bg-black/40 opacity-0 backdrop-blur-md transition-opacity duration-300 data-[open=true]:pointer-events-auto data-[open=true]:opacity-100 dark:bg-black/60"
          />,
          layer,
        )}
      {layer &&
        open &&
        createPortal(
          <search.FloatyAnchor
            priority={2}
            state={{ form: 'dialog' }}
            className="pointer-events-none fixed top-[12vh] left-1/2 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2"
            style={{ height: dialogHeight }}
          />,
          document.body,
        )}
    </>
  );
}

interface SearchBoxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  results: SortedResult[];
  searched: boolean;
  onSelect: (url: string) => void;
  onListResize: (height: number) => void;
}

function SearchBox({
  open,
  onOpenChange,
  query,
  onQueryChange,
  results,
  searched,
  onSelect,
  onListResize,
}: SearchBoxProps) {
  const { state } = search.useFloatyTransition();
  const { hotKey } = useSearchContext();
  const form = open ? 'dialog' : (state?.form ?? 'bar');
  const dialog = form === 'dialog';
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [active, setActive] = useState(0);
  const highlight = useHighlightQuery(query);

  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
    else if (inputRef.current === document.activeElement)
      triggerRef.current?.focus({ preventScroll: true });
  }, [open]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: highlights are lost when the results' text changes
  useEffect(() => highlight(listRef.current!), [highlight, results]);

  useLayoutEffect(() => {
    const list = listRef.current!;
    const observer = new ResizeObserver(() => onListResize(list.offsetHeight));
    observer.observe(list);
    return () => observer.disconnect();
  }, [onListResize]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onOpenChange(false);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + results.length) % Math.max(results.length, 1));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      onSelect(results[active].url);
    }
  };

  return (
    <div
      {...(dialog
        ? { role: 'dialog', 'aria-modal': true, 'aria-label': 'Search the docs' }
        : { role: 'search', 'aria-label': 'Search the docs' })}
      data-form={form}
      className={cn(
        'relative flex size-full flex-col overflow-hidden border text-sm text-fd-muted-foreground transition-[border-radius,background-color,box-shadow] duration-300',
        dialog
          ? 'rounded-2xl bg-fd-popover shadow-float-lifted'
          : cn('bg-fd-secondary', state?.round ? 'rounded-[18px]' : 'rounded-lg'),
      )}
    >
      <div className="flex h-12 max-h-full shrink-0 items-center gap-2 px-2.5">
        <Search className="size-4 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          inert={!dialog}
          placeholder="Search"
          aria-label="Search the docs"
          role="combobox"
          aria-expanded={dialog && searched}
          aria-controls={listId}
          aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
          className={cn(
            'min-w-0 flex-1 bg-transparent outline-none placeholder:text-fd-muted-foreground',
            dialog && 'text-fd-foreground',
          )}
        />
        <div
          className={cn(
            'inline-flex shrink-0 gap-0.5 transition-opacity duration-200',
            form !== 'bar' && 'opacity-0',
          )}
        >
          {hotKey.map((key, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the hotkey list is static
            <kbd key={i} className="rounded-md border bg-fd-background px-1.5 text-xs leading-5">
              {key.display}
            </kbd>
          ))}
        </div>
        <button
          type="button"
          inert={!dialog}
          onClick={() => onOpenChange(false)}
          className={cn(
            'absolute right-2.5 rounded-md border bg-fd-background px-1.5 text-xs leading-5 transition-opacity duration-200',
            !dialog && 'pointer-events-none opacity-0',
          )}
        >
          Esc
        </button>
      </div>

      <div
        inert={!dialog}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto border-t transition-opacity duration-200',
          !(dialog && searched) && 'opacity-0',
        )}
      >
        {searched && results.length === 0 && (
          <p className="px-3 py-4 text-center">No results found</p>
        )}
        <div ref={listRef} id={listId} role="listbox" aria-label="Results" className="p-1.5">
          {results.map((result, i) => {
            const Icon = ICONS[result.type];
            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: the input handles the keyboard (aria-activedescendant)
              <div
                key={result.id}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                tabIndex={-1}
                aria-selected={i === active}
                onPointerMove={() => setActive(i)}
                onClick={() => onSelect(result.url)}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2',
                  result.type === 'text' && 'ps-8',
                  i === active && 'bg-fd-accent text-fd-accent-foreground',
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  {result.type === 'page' &&
                    result.breadcrumbs &&
                    result.breadcrumbs.length > 0 && (
                      <p className="truncate text-xs" data-highlight-ignore>
                        {result.breadcrumbs.join(' › ')}
                      </p>
                    )}
                  <p
                    className={cn(
                      'line-clamp-2',
                      result.type !== 'text' && 'font-medium text-fd-foreground',
                    )}
                  >
                    {plain(result.content)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!dialog && (
        <button
          ref={triggerRef}
          type="button"
          aria-label="Search"
          aria-keyshortcuts="Meta+K Control+K"
          onClick={() => onOpenChange(true)}
          className="absolute inset-0 rounded-[inherit] transition-colors hover:bg-fd-accent/50 focus-visible:outline-2 focus-visible:outline-fd-ring"
        />
      )}
    </div>
  );
}
