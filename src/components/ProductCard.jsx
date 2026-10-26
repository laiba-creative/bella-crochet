import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { safeImage } from '../services/supabase';
import { money } from '../utils/shop';
export default function ProductCard({ product, index = 0 }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className={`product-card ${index % 2 ? 'pink-edge' : 'blue-edge'}`}
    >
      <div className="product-photo">
        <img src={safeImage(product.images?.[0])} alt={product.name} loading="lazy" />
        {product.stock_mode === 'ready_stock' && product.stock_quantity === 0 && (
          <span className="stock-label">Currently unavailable</span>
        )}
      </div>
      <div className="product-card-info">
        <div>
          <h3>{product.name}</h3>
<p>
  {!product.sizes.includes('Standard') && 'From '}
  {money(product.price)}
</p>        </div>
        <span className="circle-arrow" aria-hidden="true">
          <ArrowUpRight size={22} />
        </span>
      </div>
    </Link>
  );
}
