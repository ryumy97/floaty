import type { ReactNode } from 'react';
import { SummaryAnchor } from '../../ShopShell';
import { CheckoutSteps } from './CheckoutSteps';

/** Shared by the checkout steps, so the summary stays put between them. */
export default function StepsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ex-page shop-two-columns">
      <div>
        <h1 className="ex-title">Checkout</h1>
        <CheckoutSteps />
        {children}
      </div>
      <SummaryAnchor form="checkout" />
    </div>
  );
}
