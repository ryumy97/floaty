import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageAnchor } from '../../GalleryShell';
import { getPhoto } from '../../photos';

/** Shown on a full page load of a photo URL; client navigation opens the modal instead. */
export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = getPhoto(id);
  if (!photo) notFound();

  return (
    <div className="ex-page gal-page">
      <Link href="/gallery" className="gal-back">
        ← Back to gallery
      </Link>
      <PageAnchor photo={photo} />
      <div className="gal-page-details">
        <h1 className="ex-title">{photo.title}</h1>
        <p className="ex-meta">
          Taken by {photo.author} in {photo.place}. Open any photo from the gallery to see it in
          a modal instead: this page only renders on a full page load of its URL.
        </p>
      </div>
    </div>
  );
}
