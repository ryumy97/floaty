'use client';

import { createFloaty } from '@floaty/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import { ExampleHeader } from '../ExampleHeader';
import {
  COUPONS,
  FREE_SHIPPING_FROM,
  SHIPPING,
  getProduct,
  money,
  type Product,
} from './products';

interface SummaryAnchorState {
  form: 'pill' | 'cart' | 'checkout' | 'receipt';
}

/** The order summary: the same component in the header, the cart and every checkout step. */
export const summary = createFloaty<SummaryAnchorState>('order-summary');

interface Line {
  product: Product;
  qty: number;
}

interface Totals {
  lines: Line[];
  count: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

interface Order extends Totals {
  number: number;
}

interface ShopContextValue {
  cart: Record<string, number>;
  setQty: (id: string, qty: number) => void;
  coupon: string | null;
  applyCoupon: (code: string) => boolean;
  totals: Totals;
  shipping: { name: string; address: string };
  setShipping: (shipping: { name: string; address: string }) => void;
  order: Order | null;
  placeOrder: () => void;
  finish: () => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function useShop(): ShopContextValue {
  const value = useContext(ShopContext);
  if (!value) throw new Error('useShop() must be used inside <ShopShell>.');
  return value;
}

function computeTotals(cart: Record<string, number>, coupon: string | null): Totals {
  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ product: getProduct(id)!, qty }))
    .filter((line) => line.product && line.qty > 0);
  const count = lines.reduce((n, line) => n + line.qty, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const discount = coupon ? subtotal * COUPONS[coupon] : 0;
  const shipping = count === 0 || subtotal - discount >= FREE_SHIPPING_FROM ? 0 : SHIPPING;
  return { lines, count, subtotal, discount, shipping, total: subtotal - discount + shipping };
}

export function ShopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({ lamp: 1 });
  const [coupon, setCoupon] = useState<string | null>(null);
  const [shipping, setShipping] = useState({ name: '', address: '' });
  const [order, setOrder] = useState<Order | null>(null);
  const totals = computeTotals(cart, coupon);
  // The cart and checkout pages have their own slot for the summary.
  const inFlow = /^\/shop\/(cart|checkout)/.test(pathname);

  const value: ShopContextValue = {
    cart,
    setQty: (id, qty) => setCart((c) => ({ ...c, [id]: Math.max(0, qty) })),
    coupon,
    applyCoupon: (code) => {
      const normalized = code.trim().toUpperCase();
      if (!(normalized in COUPONS)) return false;
      setCoupon(normalized);
      return true;
    },
    totals,
    shipping,
    setShipping,
    order,
    placeOrder: () => {
      setOrder({ ...totals, number: 10_000 + Math.floor(Math.random() * 90_000) });
      router.push('/shop/checkout/done');
    },
    finish: () => {
      setCart({});
      setCoupon(null);
      setOrder(null);
      router.push('/shop');
    },
  };

  return (
    <ShopContext.Provider value={value}>
      <div className="ex">
        <ExampleHeader logo="Hearth" home="/shop" links={[{ href: '/shop', label: 'Shop' }]}>
          {!inFlow && (
            <summary.FloatyAnchor className="shop-pill-anchor" state={{ form: 'pill' }} />
          )}
        </ExampleHeader>
        {children}
      </div>
      <summary.Floaty transition={{ type: 'spring', duration: 550, bounce: 0.1 }}>
        <OrderSummary />
      </summary.Floaty>
    </ShopContext.Provider>
  );
}

export function SummaryAnchor({ form }: { form: SummaryAnchorState['form'] }) {
  return <summary.FloatyAnchor className={`shop-summary-anchor ${form}`} state={{ form }} />;
}

function OrderSummary() {
  const form = summary.useFloatyState()?.form ?? 'pill';
  const { totals: cartTotals, coupon, applyCoupon, order, finish } = useShop();
  const totals = form === 'receipt' && order ? order : cartTotals;
  const [code, setCode] = useState('');
  const [couponError, setCouponError] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const isPill = form === 'pill';

  const submitCoupon = (event: FormEvent) => {
    event.preventDefault();
    setCouponError(!applyCoupon(code));
  };

  return (
    <div className={`shop-summary ${form}`} data-testid="order-summary">
      <Link href="/shop/cart" className="shop-pill ex-form" inert={!isPill}>
        <span aria-hidden>🛒</span>
        <span data-testid="pill-count">{cartTotals.count}</span>
        <strong>{money(cartTotals.total)}</strong>
      </Link>

      <div className="shop-full ex-form" inert={isPill}>
        {form === 'receipt' && order ? (
          <div className="shop-receipt-head">
            <span className="shop-check">✓</span>
            <strong>Order #{order.number} confirmed</strong>
            <span>A receipt is on its way to your inbox.</span>
          </div>
        ) : (
          <div className="shop-summary-head">
            <strong>Order summary</strong>
            <button type="button" className="shop-link" onClick={() => setShowItems((s) => !s)}>
              {showItems ? 'Hide' : 'Show'} items ({totals.count})
            </button>
          </div>
        )}

        {(showItems || form === 'receipt') && (
          <ul className="shop-lines">
            {totals.lines.map(({ product, qty }) => (
              <li key={product.id}>
                <span>
                  {product.name} × {qty}
                </span>
                <span>{money(product.price * qty)}</span>
              </li>
            ))}
            {totals.lines.length === 0 && <li className="ex-meta">Your cart is empty.</li>}
          </ul>
        )}

        {form === 'cart' && (
          <form className="shop-coupon" onSubmit={submitCoupon}>
            <input
              aria-label="Coupon code"
              placeholder="Coupon (try FLOATY20)"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCouponError(false);
              }}
            />
            <button type="submit">Apply</button>
          </form>
        )}
        {couponError && form === 'cart' && <p className="shop-error">That code isn't valid.</p>}

        <dl className="shop-totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{money(totals.subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="shop-discount">
              <dt>Discount{coupon && form !== 'receipt' ? ` (${coupon})` : ''}</dt>
              <dd>−{money(totals.discount)}</dd>
            </div>
          )}
          <div>
            <dt>Shipping</dt>
            <dd>{totals.shipping === 0 ? 'Free' : money(totals.shipping)}</dd>
          </div>
          <div className="shop-total">
            <dt>Total</dt>
            <dd data-testid="summary-total">{money(totals.total)}</dd>
          </div>
        </dl>

        {form === 'cart' && (
          <Link
            href="/shop/checkout/shipping"
            className="shop-cta"
            aria-disabled={totals.count === 0}
            onClick={(e) => totals.count === 0 && e.preventDefault()}
          >
            Checkout
          </Link>
        )}
        {form === 'checkout' && (
          <Link href="/shop/cart" className="shop-link">
            Edit cart
          </Link>
        )}
        {form === 'receipt' && (
          <button type="button" className="shop-cta" onClick={finish}>
            Continue shopping
          </button>
        )}
      </div>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { cart, setQty } = useShop();
  const qty = cart[product.id] ?? 0;
  return (
    <div className="shop-product">
      <div className="shop-art" style={{ '--hue': product.hue } as CSSProperties} />
      <strong>{product.name}</strong>
      <span className="ex-meta">{money(product.price)}</span>
      <button type="button" onClick={() => setQty(product.id, qty + 1)}>
        {qty > 0 ? `Add another (${qty} in cart)` : 'Add to cart'}
      </button>
    </div>
  );
}

export function CartItems() {
  const { totals, setQty } = useShop();
  if (totals.lines.length === 0) {
    return (
      <p className="ex-meta">
        Your cart is empty. <Link href="/shop">Browse the shop</Link>.
      </p>
    );
  }
  return (
    <ul className="shop-cart-items">
      {totals.lines.map(({ product, qty }) => (
        <li key={product.id}>
          <div className="shop-art small" style={{ '--hue': product.hue } as CSSProperties} />
          <div>
            <strong>{product.name}</strong>
            <span className="ex-meta">{money(product.price)}</span>
          </div>
          <div className="shop-qty">
            <button type="button" aria-label={`Fewer ${product.name}`} onClick={() => setQty(product.id, qty - 1)}>
              −
            </button>
            <span>{qty}</span>
            <button type="button" aria-label={`More ${product.name}`} onClick={() => setQty(product.id, qty + 1)}>
              +
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ShippingForm() {
  const { shipping, setShipping } = useShop();
  const router = useRouter();
  return (
    <form
      className="shop-form"
      onSubmit={(e) => {
        e.preventDefault();
        router.push('/shop/checkout/payment');
      }}
    >
      <label>
        Full name
        <input
          required
          value={shipping.name}
          onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
        />
      </label>
      <label>
        Address
        <input
          required
          value={shipping.address}
          onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
        />
      </label>
      <button type="submit" className="ex-primary">
        Continue to payment
      </button>
    </form>
  );
}

export function PaymentForm() {
  const { shipping, placeOrder, totals } = useShop();
  return (
    <form
      className="shop-form"
      onSubmit={(e) => {
        e.preventDefault();
        placeOrder();
      }}
    >
      <p className="ex-meta">
        Shipping to {shipping.name || 'you'}
        {shipping.address ? `, ${shipping.address}` : ''}.{' '}
        <Link href="/shop/checkout/shipping">Change</Link>
      </p>
      <label>
        Card number
        <input required inputMode="numeric" placeholder="4242 4242 4242 4242" />
      </label>
      <button type="submit" className="ex-primary" disabled={totals.count === 0}>
        Pay {money(totals.total)}
      </button>
    </form>
  );
}
