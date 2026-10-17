'use client';

import { createFloaty, Floaty, FloatyAnchor, useFloatyState } from '@floaty/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ExampleHeader } from '../ExampleHeader';
import {
  formatPrice,
  getListing,
  LISTINGS,
  type Listing,
  type ListingItemState,
  listingFloatyId,
  listingPath,
  type ResultsFrom,
} from './listings';

interface MapAnchorState {
  form: 'split' | 'full' | 'preview';
  /** Listing to center on; the map goes back to the user's view when it's cleared. */
  focus?: string;
  /** Preserved on the detail preview so marker clicks keep the back target. */
  resultsFrom?: ResultsFrom;
}

/** The one map of the app: its pan and zoom survive every page. */
export const homesMap = createFloaty<MapAnchorState>('homes-map');

const HoverContext = createContext<{
  hovered: string | null;
  setHovered: (id: string | null) => void;
} | null>(null);

function useHover() {
  const value = useContext(HoverContext);
  if (!value) throw new Error('useHover() must be used inside <HomesShell>.');
  return value;
}

const LISTING_Z = 10;
const HOVER_Z = 20;
/** Above the map (default 1000) while flying to/from the detail page. */
const SELECTED_Z = 1100;
/** Keep in sync with `--flight` on `.homes-item` (inner CSS morph). */
const FLIGHT_MS = 450;

export function HomesShell({ children }: { children: ReactNode }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const pathname = usePathname();
  const openId = /^\/homes\/(?!map$)([^/]+)$/.exec(pathname)?.[1] ?? null;
  // Stays raised until the card has landed back in the list/strip.
  const [raisedId, setRaisedId] = useState<string | null>(null);
  if (openId && openId !== raisedId) setRaisedId(openId);
  // A card unmounted by navigation never fires mouseleave.
  const [hoverPath, setHoverPath] = useState(pathname);
  if (hoverPath !== pathname) {
    setHoverPath(pathname);
    setHovered(null);
  }
  return (
    <HoverContext.Provider value={{ hovered, setHovered }}>
      <div className="ex homes">
        <ExampleHeader
          logo="Nestly"
          home="/homes"
          links={[
            { href: '/homes', label: 'List' },
            { href: '/homes/map', label: 'Map' },
          ]}
        />
        {children}
      </div>
      <homesMap.Floaty transition={{ type: 'spring', duration: 500, bounce: 0.1 }}>
        <HomesMap />
      </homesMap.Floaty>
      {LISTINGS.map((listing) => {
        const selected = listing.id === raisedId;
        const zIndex = selected ? SELECTED_Z : listing.id === hovered ? HOVER_Z : LISTING_Z;
        return (
          <Floaty
            key={listing.id}
            floatyId={listingFloatyId(listing.id)}
            className="homes-floaty"
            zIndex={zIndex}
            // Don't leave hidden cards at their last list Y — that extends the
            // document scroll area (top items leave ghosts below; bottom items don't).
            keepMounted={false}
            // Let wheel events pass through to the list/strip under the cards.
            style={{ pointerEvents: 'none' }}
            transition={{ type: 'spring', duration: FLIGHT_MS, bounce: 0.12 }}
            onTransitionEnd={() => {
              if (listing.id !== openId) setRaisedId((id) => (id === listing.id ? null : id));
            }}
          >
            <ListingItem listing={listing} />
          </Floaty>
        );
      })}
    </HoverContext.Provider>
  );
}

function ListingItem({ listing }: { listing: Listing }) {
  // Switch at take-off; CSS transitions morph photo/copy during the flight.
  const form = useFloatyState<ListingItemState>()?.form ?? 'card';
  return <ListingItemView listing={listing} form={form} testId={`homes-listing-${listing.id}`} />;
}

function ListingItemView({
  listing,
  form,
  testId,
}: {
  listing: Listing;
  form: ListingItemState['form'];
  testId?: string;
}) {
  const compact = form !== 'detail';
  const sqft = listing.sqft.toLocaleString('en-US');
  return (
    <div
      className={`homes-item ${form}`}
      style={{ '--hue': listing.hue, '--flight': `${FLIGHT_MS}ms` } as CSSProperties}
      data-testid={testId}
    >
      <div className="homes-photo" />
      <div className="homes-item-body">
        <strong className="homes-price">{formatPrice(listing.price)}</strong>
        {/* Both copies stay mounted and cross-fade; the hidden one is inert. */}
        <div className="homes-copy homes-copy-compact" inert={!compact}>
          <span className="ex-meta">
            {listing.beds} bd · {listing.baths} ba · {sqft} sqft
          </span>
          <span>{listing.address}</span>
          <span className="ex-meta">{listing.neighborhood}</span>
        </div>
        <div className="homes-copy homes-copy-detail" inert={compact}>
          <p>
            {listing.address}, {listing.neighborhood}
          </p>
          <p className="ex-meta">
            {listing.beds} bedrooms · {listing.baths} bathrooms · {sqft} sqft
          </p>
          <p className="homes-blurb">
            Bright and quiet, a short walk from the river path. Recently renovated kitchen, south
            facing garden and off-street parking. Open house this Saturday from 10am.
          </p>
        </div>
      </div>
    </div>
  );
}

interface View {
  x: number;
  y: number;
  zoom: number;
}

const HOME_VIEW: View = { x: 500, y: 500, zoom: 1 };
const clampZoom = (zoom: number) => Math.min(3, Math.max(0.6, zoom));

function HomesMap() {
  const state = homesMap.useFloatyState();
  const form = state?.form ?? 'split';
  const focus = state?.focus;
  const resultsFrom: ResultsFrom = state?.resultsFrom ?? (form === 'full' ? 'map' : 'list');
  const { hovered } = useHover();
  const [view, setView] = useState<View>(HOME_VIEW);
  const [dragging, setDragging] = useState(false);
  const viewRef = useRef(view);
  viewRef.current = view;
  const savedView = useRef<View | null>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const element = useRef<HTMLDivElement>(null);
  const interactive = form !== 'preview';

  // Same component, different behavior per page: the preview centers on its listing,
  // and leaving it restores the view the user had panned to.
  useEffect(() => {
    const listing = focus ? getListing(focus) : undefined;
    if (listing) {
      savedView.current ??= viewRef.current;
      setView({ x: listing.x, y: listing.y, zoom: 1.8 });
    } else if (savedView.current) {
      setView(savedView.current);
      savedView.current = null;
    }
  }, [focus]);

  useEffect(() => {
    const el = element.current;
    if (!el || !interactive) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setView((v) => ({ ...v, zoom: clampZoom(v.zoom * Math.exp(-event.deltaY * 0.002)) }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [interactive]);

  const onPointerDown = (event: ReactPointerEvent) => {
    if (!interactive || event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, moved: false };
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
      element.current?.setPointerCapture(event.pointerId);
    }
    d.x = event.clientX;
    d.y = event.clientY;
    setView((v) => ({ ...v, x: v.x - dx / v.zoom, y: v.y - dy / v.zoom }));
  };
  const onPointerUp = () => {
    setDragging(false);
    // Let the click that ends a drag see `moved` before clearing it.
    setTimeout(() => (drag.current = null));
  };

  return (
    <div
      ref={element}
      className={`map-view ${form}${dragging ? ' dragging' : ''}`}
      data-testid="homes-map"
      data-zoom={view.zoom.toFixed(2)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={(event) => {
        if (drag.current?.moved) event.preventDefault();
      }}
    >
      <div
        className="map-world"
        style={
          {
            transform: `scale(${view.zoom}) translate(${-view.x}px, ${-view.y}px)`,
            '--inv-zoom': 1 / view.zoom,
          } as CSSProperties
        }
      >
        <MapArt />
        {LISTINGS.map((listing) => (
          <Marker
            key={listing.id}
            listing={listing}
            from={resultsFrom}
            active={listing.id === hovered || listing.id === focus}
          />
        ))}
      </div>

      <div className="map-controls ex-form" inert={!interactive}>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => setView((v) => ({ ...v, zoom: clampZoom(v.zoom * 1.4) }))}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => setView((v) => ({ ...v, zoom: clampZoom(v.zoom / 1.4) }))}
        >
          −
        </button>
        <button type="button" onClick={() => setView(HOME_VIEW)}>
          Reset
        </button>
      </div>
      <Link href="/homes/map" className="map-open ex-form" inert={interactive}>
        View on map
      </Link>
    </div>
  );
}

function Marker({
  listing,
  from,
  active,
}: {
  listing: Listing;
  from: ResultsFrom;
  active: boolean;
}) {
  return (
    <Link
      href={listingPath(listing.id, from)}
      className={`map-marker${active ? ' active' : ''}`}
      style={{ left: listing.x, top: listing.y }}
      draggable={false}
    >
      {formatPrice(listing.price, true)}
    </Link>
  );
}

/** A made-up town: listings sit in 1000 × 1000, and the streets carry on around it. */
function MapArt() {
  const streets = Array.from({ length: 25 }, (_, i) => -1320 + i * 120);
  return (
    <svg
      className="map-art"
      viewBox="0 0 1000 1000"
      width={1000}
      height={1000}
      overflow="visible"
      aria-hidden
    >
      <path
        d="M 1600 -600 C 1200 -200 860 160 700 400 S 600 640 520 1000 S 300 1500 200 1800"
        fill="none"
        stroke="#b9d7f0"
        strokeWidth="70"
      />
      <rect x="180" y="440" width="160" height="200" rx="24" fill="#cfe6c4" />
      <rect x="520" y="560" width="120" height="110" rx="20" fill="#cfe6c4" />
      <rect x="-420" y="120" width="240" height="160" rx="24" fill="#cfe6c4" />
      <rect x="1180" y="700" width="200" height="220" rx="24" fill="#cfe6c4" />
      <circle cx="380" cy="320" r="60" fill="#cfe6c4" />
      {streets.map((p) => (
        <g key={p} stroke="#ffffff" strokeWidth="10">
          <line x1={p} y1="-1500" x2={p} y2="2500" />
          <line x1="-1500" y1={p} x2="2500" y2={p} />
        </g>
      ))}
      <line x1="-800" y1="1800" x2="1800" y2="-800" stroke="#fff4c7" strokeWidth="16" />
    </svg>
  );
}

export function MapAnchor({ form, focus, resultsFrom }: MapAnchorState) {
  return (
    <homesMap.FloatyAnchor className={`map-anchor ${form}`} state={{ form, focus, resultsFrom }} />
  );
}

export function ListingCard({
  listing,
  form = 'card',
}: {
  listing: Listing;
  form?: 'card' | 'strip';
}) {
  const { setHovered } = useHover();
  // Link wraps the anchor (under the floaty). Cards use pointer-events: none so
  // wheel events reach the list; clicks still hit this link underneath.
  return (
    <Link
      href={listingPath(listing.id, form === 'strip' ? 'map' : 'list')}
      className="homes-card-link"
      aria-label={listing.address}
      onMouseEnter={() => setHovered(listing.id)}
      onMouseLeave={() => setHovered(null)}
    >
      <FloatyAnchor
        floatyId={listingFloatyId(listing.id)}
        className={`homes-slot ${form}`}
        state={{ form } satisfies ListingItemState}
      />
    </Link>
  );
}

export function ListingDetail({ listing }: { listing: Listing }) {
  return (
    <FloatyAnchor
      floatyId={listingFloatyId(listing.id)}
      className="homes-slot detail"
      priority={1}
      state={{ form: 'detail' } satisfies ListingItemState}
    >
      {/* Invisible copy so the empty slot sizes to the detail content. */}
      <div className="homes-sizer" aria-hidden>
        <ListingItemView listing={listing} form="detail" />
      </div>
    </FloatyAnchor>
  );
}
