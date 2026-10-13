import { GridCell } from './GalleryShell';
import { PHOTOS } from './photos';

export default function Gallery() {
  return (
    <div className="ex-page">
      <h1 className="ex-title">Popular this week</h1>
      <ul className="gal-grid">
        {PHOTOS.map((photo) => (
          <li key={photo.id}>
            <GridCell photo={photo} />
          </li>
        ))}
      </ul>
    </div>
  );
}
