import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageAnchor } from '../../GalleryShell';
import { getPhoto } from '../../photos';

/**
 * Soft-nav detail page (no intercepting modal). "Open page" in the modal links
 * here so the same Floaty can fly from the modal anchor to this page anchor.
 */
export default async function PhotoViewPage({ params }: { params: Promise<{ id: string }> }) {
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
          Taken by {photo.author} in {photo.place}. The photo flies here from the modal without a
          remount, so likes and other card state survive.
        </p>
      </div>
    </div>
  );
}
