import { CartItems, SummaryAnchor } from '../ShopShell';

export default function Cart() {
  return (
    <div className="ex-page shop-two-columns">
      <div>
        <h1 className="ex-title">Your cart</h1>
        <CartItems />
      </div>
      <SummaryAnchor form="cart" />
    </div>
  );
}
