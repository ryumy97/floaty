export interface Photo {
  id: string;
  title: string;
  author: string;
  place: string;
  hue: number;
}

export const PHOTOS: Photo[] = [
  { id: 'dunes', title: 'Morning dunes', author: 'Lea Moreau', place: 'Erg Chebbi', hue: 28 },
  { id: 'fjord', title: 'Still fjord', author: 'Jonas Berg', place: 'Geiranger', hue: 200 },
  { id: 'lantern', title: 'Lantern street', author: 'Aiko Sato', place: 'Kyoto', hue: 352 },
  { id: 'moss', title: 'Moss and fog', author: 'Ruth Evans', place: 'Hoh Rainforest', hue: 120 },
  { id: 'salt', title: 'Salt flats at dusk', author: 'Diego Rojas', place: 'Uyuni', hue: 290 },
  { id: 'harbor', title: 'Harbor lights', author: 'Nora Lind', place: 'Bergen', hue: 220 },
  { id: 'canyon', title: 'Slot canyon', author: 'Sam Carter', place: 'Antelope Canyon', hue: 14 },
  { id: 'glacier', title: 'Blue ice', author: 'Freya Olsen', place: 'Vatnajökull', hue: 190 },
  { id: 'tea', title: 'Tea terraces', author: 'Minh Tran', place: 'Mộc Châu', hue: 95 },
  { id: 'aurora', title: 'Green sky', author: 'Ivar Holm', place: 'Tromsø', hue: 150 },
  { id: 'market', title: 'Spice market', author: 'Amira Haddad', place: 'Marrakesh', hue: 40 },
  { id: 'reef', title: 'Shallow reef', author: 'Kai Mahoe', place: 'Moorea', hue: 175 },
];

export function getPhoto(id: string): Photo | undefined {
  return PHOTOS.find((photo) => photo.id === id);
}

/** One floaty per photo: dynamic ids are dropped from the store once nothing uses them. */
export function photoFloatyId(id: string): string {
  return `photo-${id}`;
}

export interface PhotoAnchorState {
  view: 'grid' | 'modal' | 'page';
}
