'use client';

import { createFloaty } from '@ryumy97/floaty-react';
import { type FormEvent, useState } from 'react';
import { ShowcaseHeader } from './showcase-header';

type Step = 'cart' | 'shipping' | 'pay';
type Form = 'pill' | 'sidebar' | 'receipt';

const summary = createFloaty<{ form: Form }>('showcase-order');

const ITEMS = [
  { id: 'mug', name: 'Ceramic mug', price: 24 },
  { id: 'tote', name: 'Canvas tote', price: 32 },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function OrderSummary() {
  const form = summary.useFloatyState()?.form ?? 'pill';
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState(false);
  const [showItems, setShowItems] = useState(true);

  const subtotal = ITEMS.reduce((sum, item) => sum + item.price, 0);
  const discount = applied ? Math.round(subtotal * 0.2) : 0;
  const total = subtotal - discount;
  const isPill = form === 'pill';
  const isReceipt = form === 'receipt';

  const applyCoupon = (event: FormEvent) => {
    event.preventDefault();
    setApplied(coupon.trim().toUpperCase() === 'FLOATY20');
  };

  return (
    <div className="size-full overflow-hidden rounded-xl bg-fd-card text-fd-card-foreground shadow-float">
      <div
        className="flex size-full items-center gap-2 px-3 text-sm"
        inert={isPill ? undefined : true}
        style={{ display: isPill ? 'flex' : 'none' }}
      >
        <span aria-hidden>🛒</span>
        <span className="tabular-nums">{ITEMS.length}</span>
        <strong className="ml-auto">{money(total)}</strong>
      </div>

      <div
        className="flex size-full min-h-0 flex-col p-4 text-sm"
        inert={isPill ? true : undefined}
        style={{ display: isPill ? 'none' : 'flex' }}
      >
        {isReceipt ? (
          <div className="mb-3">
            <p className="font-semibold">Order #4821 confirmed</p>
            <p className="text-fd-muted-foreground">A receipt is on its way to your inbox.</p>
          </div>
        ) : (
          <div className="mb-3 flex items-center justify-between gap-2">
            <strong>Order summary</strong>
            <button
              type="button"
              className="text-xs text-fd-muted-foreground underline-offset-2 hover:underline"
              onClick={() => setShowItems((v) => !v)}
            >
              {showItems ? 'Hide' : 'Show'} items
            </button>
          </div>
        )}

        {(showItems || isReceipt) && (
          <ul className="mb-3 space-y-1.5 text-fd-muted-foreground">
            {ITEMS.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span>{item.name}</span>
                <span className="tabular-nums text-fd-foreground">{money(item.price)}</span>
              </li>
            ))}
          </ul>
        )}

        {form === 'sidebar' && (
          <form onSubmit={applyCoupon} className="mb-3 flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Coupon (FLOATY20)"
              aria-label="Coupon code"
              className="min-w-0 flex-1 rounded-lg border bg-fd-background px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            />
            <button
              type="submit"
              className="rounded-lg border bg-fd-background px-2.5 py-1.5 text-xs font-medium hover:bg-fd-accent"
            >
              Apply
            </button>
          </form>
        )}

        <dl className="mt-auto space-y-1.5 border-t pt-3">
          <div className="flex justify-between">
            <dt className="text-fd-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{money(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-teal-700 dark:text-teal-400">
              <dt>Discount</dt>
              <dd className="tabular-nums">−{money(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(total)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'cart', label: 'Cart' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'pay', label: 'Pay' },
];

function formFor(step: Step): Form {
  if (step === 'cart') return 'pill';
  if (step === 'shipping') return 'sidebar';
  return 'receipt';
}

/** Full-page checkout: order summary travels cart → shipping → receipt. */
export default function OrderSummaryShowcase() {
  const [step, setStep] = useState<Step>('cart');
  const form = formFor(step);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-fd-background text-fd-foreground">
      <summary.Floaty
        className="size-full"
        transition={{ type: 'spring', duration: 250, bounce: 0.12 }}
      >
        <OrderSummary />
      </summary.Floaty>

      <ShowcaseHeader />

      <div className="flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex gap-1">
          {STEPS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStep(id)}
              aria-current={step === id ? 'step' : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                step === id
                  ? 'bg-fd-primary text-fd-primary-foreground'
                  : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {step === 'cart' && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 flex items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold">Your cart</h1>
              <div className="h-11 w-32">
                <summary.FloatyAnchor className="size-full" state={{ form: 'pill' }} />
              </div>
            </div>
            <ul className="space-y-3">
              {ITEMS.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between rounded-xl border bg-fd-card px-4 py-3"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="tabular-nums text-fd-muted-foreground">{money(item.price)}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setStep('shipping')}
              className="mt-8 inline-flex h-10 items-center rounded-lg bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground"
            >
              Continue to shipping
            </button>
          </div>
        )}

        {step === 'shipping' && (
          <div className="mx-auto flex max-w-4xl flex-col gap-8 lg:flex-row">
            <div className="min-w-0 flex-1">
              <h1 className="mb-4 text-2xl font-semibold">Shipping</h1>
              <div className="space-y-3 rounded-xl border bg-fd-card p-4 text-fd-muted-foreground">
                <p>Alex Mercer</p>
                <p>14 Harbor Lane</p>
                <p>Wellington 6011</p>
              </div>
              <button
                type="button"
                onClick={() => setStep('pay')}
                className="mt-6 inline-flex h-10 items-center rounded-lg bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground"
              >
                Continue to payment
              </button>
            </div>
            <div className="h-72 w-full shrink-0 lg:w-72">
              <summary.FloatyAnchor className="size-full" state={{ form: 'sidebar' }} />
            </div>
          </div>
        )}

        {step === 'pay' && (
          <div className="mx-auto max-w-md py-8">
            <h1 className="mb-6 text-center text-2xl font-semibold">Payment complete</h1>
            <div className="h-64">
              <summary.FloatyAnchor className="size-full" state={{ form }} />
            </div>
            <button
              type="button"
              onClick={() => setStep('cart')}
              className="mx-auto mt-8 flex h-10 items-center rounded-lg border bg-fd-card px-4 text-sm font-medium hover:bg-fd-accent"
            >
              Back to cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
