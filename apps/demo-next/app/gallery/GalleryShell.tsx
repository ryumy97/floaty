'use client';

import { Floaty, FloatyAnchor, useFloatyState } from '@floaty/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { ExampleHeader } from '../ExampleHeader';
import { PHOTOS, photoFloatyId, type Photo, type PhotoAnchorState } from './photos';

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

export function GalleryShell({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  const pathname = usePathname();
  const openId = /^\/gallery\/photo\/([^/]+)/.exec(pathname)?.[1] ?? null;
  const [modalOpen, setModalOpen] = useState(false);
  // Stays raised above the other photos until it has landed back in the grid.
  const [raisedId, setRaisedId] = useState<string | null>(null);
  if (openId && openId !== raisedId) setRaisedId(openId);
  const router = useRouter();

  return (
    <GalleryContext.Provider value={{ openId, modalOpen, setModalOpen }}>
      <div className="ex">
        <ExampleHeader logo="Lumen" home="/gallery" links={[{ href: '/gallery', label: 'Photos' }]} />
        {children}
      </div>

      {/*
       * The overlay layer sits above every page element, so this backdrop can't cover the
       * other floating photos: they dim themselves instead (see PhotoCard).
       */}
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
          className={`gal-floaty${photo.id === raisedId ? ' raised' : ''}`}
          onTransitionEnd={() => {
            if (photo.id !== openId) setRaisedId((id) => (id === photo.id ? null : id));
          }}
        >
          <PhotoCard photo={photo} />
        </Floaty>
      ))}
    </GalleryContext.Provider>
  );
}

function Art({ photo }: { photo: Photo }) {
  return <div className="gal-art" style={{ '--hue': photo.hue } as CSSProperties} />;
}

function PhotoCard({ photo }: { photo: Photo }) {
  const view = useFloatyState<PhotoAnchorState>()?.view ?? 'grid';
  const { modalOpen } = useGallery();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const index = PHOTOS.indexOf(photo);
  const prev = PHOTOS[(index + PHOTOS.length - 1) % PHOTOS.length];
  const next = PHOTOS[(index + 1) % PHOTOS.length];
  const href = `/gallery/photo/${photo.id}`;

  return (
    <div className={`gal-card ${view}`} data-testid={`photo-${photo.id}`}>
      <Art photo={photo} />
      {liked && <span className="gal-heart" aria-label="Liked">♥</span>}
      {view === 'grid' && (
        <Link href={href} scroll={false} className="gal-hit" aria-label={`Open ${photo.title}`} />
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
        <Link href={`/gallery/photo/${prev.id}`} replace scroll={false} className="gal-button" aria-label="Previous photo">
          ←
        </Link>
        <Link href={`/gallery/photo/${next.id}`} replace scroll={false} className="gal-button" aria-label="Next photo">
          →
        </Link>
        {/* A full load skips the interception and renders the photo page. */}
        <a href={href} className="gal-button">
          Open page
        </a>
        <button type="button" className="gal-button" aria-label="Close" onClick={() => router.back()}>
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
      <FloatyAnchor
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
