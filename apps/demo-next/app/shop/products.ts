export interface Product {
  id: string;
  name: string;
  price: number;
  hue: number;
}

export const PRODUCTS: Product[] = [
  { id: 'mug', name: 'Stoneware mug', price: 24, hue: 25 },
  { id: 'lamp', name: 'Desk lamp', price: 89, hue: 45 },
  { id: 'throw', name: 'Wool throw', price: 120, hue: 350 },
  { id: 'vase', name: 'Glass vase', price: 38, hue: 190 },
  { id: 'planter', name: 'Terracotta planter', price: 32, hue: 15 },
  { id: 'clock', name: 'Wall clock', price: 65, hue: 220 },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

export const COUPONS: Record<string, number> = { WELCOME10: 0.1, FLOATY20: 0.2 };

export const SHIPPING = 8;
export const FREE_SHIPPING_FROM = 150;

export function money(value: number): string {
  return `$${value.toFixed(2)}`;
}
