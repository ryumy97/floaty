import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { MapAnchor } from '../HomesShell';
import { formatPrice, getListing } from '../listings';

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  return (
    <div className="ex-page homes-detail">
      <div>
        <Link href="/homes" className="homes-back">
          ← Back to results
        </Link>
        <div className="homes-hero" style={{ '--hue': listing.hue } as CSSProperties} />
        <h1 className="ex-title homes-price">{formatPrice(listing.price)}</h1>
        <p>
          {listing.address}, {listing.neighborhood}
        </p>
        <p className="ex-meta">
          {listing.beds} bedrooms · {listing.baths} bathrooms ·{' '}
          {listing.sqft.toLocaleString('en-US')} sqft
        </p>
        <p>
          Bright and quiet, a short walk from the river path. Recently renovated kitchen, south
          facing garden and off-street parking. Open house this Saturday from 10am.
        </p>
      </div>
      <aside className="homes-side">
        <h2 className="ex-subtitle">Location</h2>
        <MapAnchor form="preview" focus={listing.id} />
        <button type="button" className="ex-primary homes-contact">
          Contact agent
        </button>
      </aside>
    </div>
  );
}
