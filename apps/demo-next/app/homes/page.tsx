import { ListingCard, MapAnchor } from './HomesShell';
import { LISTINGS } from './listings';

export default function HomesList() {
  return (
    <div className="map-split">
      <div className="homes-results">
        <h1 className="ex-title">{LISTINGS.length} homes for sale</h1>
        <ul className="homes-list">
          {LISTINGS.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      </div>
      <MapAnchor form="split" />
    </div>
  );
}
