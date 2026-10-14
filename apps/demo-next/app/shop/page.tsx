import { PRODUCTS } from './products';
import { ProductCard } from './ShopShell';

export default function Shop() {
  return (
    <div className="ex-page">
      <h1 className="ex-title">New in: home goods</h1>
      <div className="shop-grid">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
