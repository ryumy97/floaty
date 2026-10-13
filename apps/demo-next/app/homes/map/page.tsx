import { ListingCard, MapAnchor } from '../HomesShell';
import { LISTINGS } from '../listings';

export default function HomesMapPage() {
  return (
    <div className="map-full">
      <MapAnchor form="full" />
      <ul className="homes-strip">
        {LISTINGS.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} />
          </li>
        ))}
      </ul>
    </div>
  );
}
