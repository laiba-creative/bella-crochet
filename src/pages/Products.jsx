import { useSearchParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import { WhatsAppLink } from '../components/Layout';
export default function Products() {
  const { products, categories, loading, error, refresh } = useShop();
  const [search, setSearch] = useSearchParams();
  const category = search.get('category') || 'all';
  const filtered =
    category === 'all' ? products : products.filter((p) => p.category_id === category);
  return (
    <>
      <section className="catalog-intro container">
        <div>
          <span className="eyebrow">The collection</span>
          <h1>
            Your next
            <br />
            <em>little favourite.</em>
          </h1>
          <p>Explore our crochet flowers, keepsakes and everyday accessories.</p>
        </div>
        <img src="/images/products/sunflower-keychain.webp" alt="Handmade sunflower keychain" />
      </section>
      <section className="catalog">
        <div className="container">
          <div className="catalog-heading">
            <h2>All Products</h2>
            <span>{filtered.length} pieces</span>
          </div>
          <div className="filters" aria-label="Product categories">
            {[{ id: 'all', name: 'All' }, ...categories].map((c) => (
              <button
                key={c.id}
                className={category === c.id ? 'selected' : ''}
                aria-pressed={category === c.id}
                onClick={() => setSearch(c.id === 'all' ? {} : { category: c.id })}
              >
                {c.name}
              </button>
            ))}
          </div>
          {loading ? (
            <p role="status">Gathering your favourites…</p>
          ) : error ? (
            <div className="error-box">
              {error}
              <button onClick={refresh}>Try again</button>
            </div>
          ) : filtered.length ? (
            <div className="product-grid">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No matching pieces yet.</h3>
              <p>Try another category or explore the full collection.</p>
              <button onClick={() => setSearch({})}>Clear filters</button>
            </div>
          )}
        </div>
      </section>
      <section className="custom-strip">
        <h2>Custom colours? Let’s talk.</h2>
        <p>Tell us what you have in mind. We’ll confirm the available options before you order.</p>
        <WhatsAppLink>Chat with us on WhatsApp</WhatsAppLink>
      </section>
    </>
  );
}
