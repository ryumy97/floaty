import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ListingDetail, MapAnchor } from '../HomesShell';
import { getListing, parseResultsFrom, resultsPath } from '../listings';

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const resultsFrom = parseResultsFrom(from);
  const listing = getListing(id);
  if (!listing) notFound();

  return (
    <div className="ex-page homes-detail">
      <div>
        <Link href={resultsPath(from)} className="homes-back">
          ← Back to results
        </Link>
        <ListingDetail listing={listing} />
      </div>
      <aside className="homes-side">
        <h2 className="ex-subtitle">Location</h2>
        <MapAnchor form="preview" focus={listing.id} resultsFrom={resultsFrom} />
        <button type="button" className="ex-primary homes-contact">
          Contact agent
        </button>
      </aside>
    </div>
  );
}
