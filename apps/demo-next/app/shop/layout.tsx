import type { ReactNode } from 'react';
import { ShopShell } from './ShopShell';
import '../example.css';
import './shop.css';

export const metadata = { title: 'Shop (Floaty example)' };

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <ShopShell>{children}</ShopShell>;
}
