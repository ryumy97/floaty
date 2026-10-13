export interface Listing {
  id: string;
  address: string;
  neighborhood: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  /** Position on the 1000 × 1000 map. */
  x: number;
  y: number;
  hue: number;
}

export const LISTINGS: Listing[] = [
  { id: 'elm-12', address: '12 Elm Street', neighborhood: 'Old Town', price: 1_250_000, beds: 3, baths: 2, sqft: 1840, x: 310, y: 280, hue: 24 },
  { id: 'harbor-4', address: '4 Harbor View', neighborhood: 'Waterfront', price: 2_100_000, beds: 4, baths: 3, sqft: 2600, x: 640, y: 210, hue: 200 },
  { id: 'maple-88', address: '88 Maple Avenue', neighborhood: 'Northside', price: 845_000, beds: 2, baths: 1, sqft: 1120, x: 450, y: 160, hue: 130 },
  { id: 'park-301', address: '301 Park Lane', neighborhood: 'Greenfield', price: 1_480_000, beds: 3, baths: 2, sqft: 2010, x: 250, y: 560, hue: 95 },
  { id: 'mill-7', address: '7 Mill Road', neighborhood: 'Riverside', price: 990_000, beds: 2, baths: 2, sqft: 1380, x: 560, y: 470, hue: 180 },
  { id: 'cedar-19', address: '19 Cedar Court', neighborhood: 'Hillcrest', price: 1_720_000, beds: 4, baths: 3, sqft: 2420, x: 760, y: 640, hue: 340 },
  { id: 'bay-55', address: '55 Bay Terrace', neighborhood: 'Waterfront', price: 3_050_000, beds: 5, baths: 4, sqft: 3400, x: 820, y: 330, hue: 220 },
  { id: 'oak-140', address: '140 Oak Drive', neighborhood: 'Southgate', price: 720_000, beds: 2, baths: 1, sqft: 980, x: 420, y: 760, hue: 40 },
  { id: 'lark-3', address: '3 Lark Rise', neighborhood: 'Greenfield', price: 1_130_000, beds: 3, baths: 2, sqft: 1650, x: 160, y: 380, hue: 70 },
  { id: 'quay-21', address: '21 Old Quay', neighborhood: 'Riverside', price: 1_390_000, beds: 3, baths: 2, sqft: 1760, x: 650, y: 820, hue: 260 },
];

export function getListing(id: string): Listing | undefined {
  return LISTINGS.find((listing) => listing.id === id);
}

export function formatPrice(price: number, short = false): string {
  if (short) {
    return price >= 1_000_000
      ? `$${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 2).replace(/0$/, '')}M`
      : `$${Math.round(price / 1000)}K`;
  }
  return `$${price.toLocaleString('en-US')}`;
}
