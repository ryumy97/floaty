'use client';

import { usePathname } from 'next/navigation';

const STEPS = [
  { path: '/shop/cart', label: 'Cart' },
  { path: '/shop/checkout/shipping', label: 'Shipping' },
  { path: '/shop/checkout/payment', label: 'Payment' },
];

export function CheckoutSteps() {
  const pathname = usePathname();
  const current = STEPS.findIndex((step) => step.path === pathname);
  return (
    <ol className="shop-steps">
      {STEPS.map((step, i) => (
        <li key={step.path} data-state={i < current ? 'done' : i === current ? 'current' : 'todo'}>
          {step.label}
        </li>
      ))}
    </ol>
  );
}
