'use client';

import { Floaty, FloatyAnchor, useFloatyState } from '@ryumy97/floaty-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ExampleHeader } from '../ExampleHeader';
import { PHOTOS, type Photo, type PhotoAnchorState, photoFloatyId } from './photos';

interface GalleryContextValue {
  /** Photo shown by the modal or the photo page, from the URL. */
  openId: string | null;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

function useGallery(): GalleryContextValue {
  const value = useContext(GalleryContext);
  if (!value) throw new Error('useGallery() must be used inside <GalleryShell>.');
  return value;
}

/** Above sibling photo layers (default 1000) while open or flying back to the grid. */
const SELECTED_Z = 1100;
/** Closing photos stay above the grid (but under the newly opened one) until they land. */
const CLOSING_Z = 1090;

export function GalleryShell({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  const pathname = usePathname();
  const openId = /^\/gallery\/(?:photo|view)\/([^/]+)/.exec(pathname)?.[1] ?? null;
  const [modalOpen, setModalOpen] = useState(false);
  // Every photo that is open or still flying back stays raised; next/prev keeps
  // the outgoing card above the grid while the incoming one takes the top slot.
  const [raisedIds, setRaisedIds] = useState<string[]>([]);
  if (openId && !raisedIds.includes(openId)) {
    setRaisedIds((ids) => (ids.includes(openId) ? ids : [...ids, openId]));
  }
  const router = useRouter();

  return (
    <GalleryContext.Provider value={{ openId, modalOpen, setModalOpen }}>
      <div className="ex">
        <ExampleHeader
          logo="Lumen"
          home="/gallery"
          links={[{ href: '/gallery', label: 'Photos' }]}
        />
        {children}
      </div>

      {/*
       * Floaty layers sit above page UI, so this backdrop can't cover the other
       * floating photos: they dim themselves instead (see PhotoCard).
       */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: Escape and the Close button close the modal from the keyboard */}
      <div
        className="gal-backdrop"
        data-open={modalOpen || undefined}
        onClick={modalOpen ? () => router.back() : undefined}
      />
      {modal}

      {PHOTOS.map((photo) => (
        <Floaty
          key={photo.id}
          floatyId={photoFloatyId(photo.id)}
          className="gal-floaty"
          zIndex={
            photo.id === openId ? SELECTED_Z : raisedIds.includes(photo.id) ? CLOSING_Z : undefined
          }
          onTransitionEnd={() => {
            if (photo.id !== openId) {
              setRaisedIds((ids) => ids.filter((id) => id !== photo.id));
            }
          }}
        >
          <PhotoCard photo={photo} />
        </Floaty>
      ))}
    </GalleryContext.Provider>
  );
}

function Art({ photo }: { photo: Photo }) {
  return (
    <div className="gal-art" style={{ '--hue': photo.hue } as CSSProperties}>
      {/* Extra layers only read clearly at modal/page size (see .gal-art-detail). */}
      <div className="gal-art-detail" aria-hidden />
    </div>
  );
}

function PhotoCard({ photo }: { photo: Photo }) {
  const view = useFloatyState<PhotoAnchorState>()?.view ?? 'grid';
  const { modalOpen } = useGallery();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const index = PHOTOS.indexOf(photo);
  const prev = PHOTOS[(index + PHOTOS.length - 1) % PHOTOS.length];
  const next = PHOTOS[(index + 1) % PHOTOS.length];
  const modalHref = `/gallery/photo/${photo.id}`;
  /** Soft-nav detail (no intercept) so the floaty can fly from the modal. */
  const pageHref = `/gallery/view/${photo.id}`;

  return (
    <div className={`gal-card ${view}`} data-testid={`photo-${photo.id}`}>
      <Art photo={photo} />
      {liked && (
        <span className="gal-heart" role="img" aria-label="Liked">
          ♥
        </span>
      )}
      {view === 'grid' && (
        <Link
          href={modalHref}
          scroll={false}
          className="gal-hit"
          aria-label={`Open ${photo.title}`}
        />
      )}
      <div className="gal-dim" data-on={(modalOpen && view === 'grid') || undefined} />

      <div className="gal-caption ex-form" inert={view === 'grid'}>
        <div>
          <strong>{photo.title}</strong>
          <span>
            {photo.author} · {photo.place}
          </span>
        </div>
        <button
          type="button"
          className="gal-button"
          aria-pressed={liked}
          onClick={() => setLiked((l) => !l)}
        >
          {liked ? '♥ Liked' : '♡ Like'}
        </button>
      </div>

      <div className="gal-modal-controls ex-form" inert={view !== 'modal'}>
        <Link
          href={`/gallery/photo/${prev.id}`}
          replace
          scroll={false}
          className="gal-button"
          aria-label="Previous photo"
        >
          ←
        </Link>
        <Link
          href={`/gallery/photo/${next.id}`}
          replace
          scroll={false}
          className="gal-button"
          aria-label="Next photo"
        >
          →
        </Link>
        <Link href={pageHref} scroll={false} className="gal-button">
          Open page
        </Link>
        <button
          type="button"
          className="gal-button"
          aria-label="Close"
          onClick={() => router.back()}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** Rendered by the intercepted route into the `@modal` slot. */
export function PhotoModal({ id }: { id: string }) {
  const { setModalOpen } = useGallery();
  const router = useRouter();

  useEffect(() => {
    setModalOpen(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      setModalOpen(false);
      window.removeEventListener('keydown', onKey);
    };
  }, [router, setModalOpen]);

  return (
    <div className="gal-modal" role="dialog" aria-label="Photo">
      {/* Remount on id change so the previous photo releases the modal and flies
          back to the grid while the next one flies up from its cell. */}
      <FloatyAnchor
        key={id}
        floatyId={photoFloatyId(id)}
        className="gal-modal-anchor"
        priority={1}
        state={{ view: 'modal' } satisfies PhotoAnchorState}
      />
    </div>
  );
}

export function GridCell({ photo }: { photo: Photo }) {
  return (
    <FloatyAnchor
      floatyId={photoFloatyId(photo.id)}
      className="gal-cell"
      state={{ view: 'grid' } satisfies PhotoAnchorState}
    />
  );
}

export function PageAnchor({ photo }: { photo: Photo }) {
  return (
    <FloatyAnchor
      floatyId={photoFloatyId(photo.id)}
      className="gal-page-anchor"
      priority={1}
      state={{ view: 'page' } satisfies PhotoAnchorState}
    />
  );
}
