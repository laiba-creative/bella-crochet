import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle } from 'lucide-react';

import { useShop } from '../context/ShopContext';
import { safeImage } from '../services/supabase';
import {
  money,
  quantity,
  whatsappMessage,
  whatsappURL,
  cleanNote,
  sizeOptions,
  sizePrice,
} from '../utils/shop';
import ProductCard from '../components/ProductCard';

export default function ProductDetails() {
  const { slug } = useParams();

  const {
    products,
    categories,
    loading,
    error,
    add,
  } = useShop();

  const product = products.find(
    (product) => product.slug === slug,
  );

  const [colour, setColour] = useState('Original');
  const [size, setSize] = useState('Standard');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [custom, setCustom] = useState('');
  const [image, setImage] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setColour(product?.colours?.[0] || 'Original');
    setSize(sizeOptions(product)[0] || 'Standard');
    setQty(1);
    setNote('');
    setCustom('');
    setImage(0);
    setMessage('');
  }, [slug, product?.id]);

  if (loading) {
    return (
      <div className="container empty-state" role="status">
        Loading this little piece…
      </div>
    );
  }

  if (error) {
    return (
      <div className="container empty-state">
        {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container empty-state">
        <h1>We couldn’t find that piece.</h1>
        <Link to="/products">Explore the collection</Link>
      </div>
    );
  }

  const colours = product.colours.filter(
    (colour) =>
      product.custom_colour || colour !== 'Custom colour',
  );

  const sizes = sizeOptions(product);

  const fixedPrice =
    sizes.length === 1 && sizes[0] === 'Standard';

  const selectedSize = sizes.includes(size)
    ? size
    : sizes[0];

  const selectedPrice = sizePrice(product, selectedSize);

  const max =
    product.stock_mode === 'ready_stock'
      ? Math.min(99, product.stock_quantity)
      : 99;

  const unavailable = max === 0;

  function selectedItem() {
    return {
      productId: product.id,
      colour,
      size: selectedSize,
      quantity: quantity(qty, max || 1),
      note: cleanNote(
        [custom, note].filter(Boolean).join('\n'),
      ),
    };
  }

  function validate() {
    if (unavailable) {
      setMessage(
        'This piece is currently unavailable. Please contact us.',
      );
      return false;
    }

    if (selectedPrice === null) {
      setMessage(
        'A price is not available for this selection. Please contact us.',
      );
      return false;
    }

    if (colour === 'Custom colour' && !custom.trim()) {
      setMessage('Please describe your custom colour.');
      return false;
    }

    setMessage('');
    return true;
  }

  function addCart() {
    if (!validate()) return;

    try {
      add(selectedItem());
    } catch (error) {
      setMessage(error.message);
    }
  }

  const direct = whatsappURL(
    whatsappMessage([selectedItem()], products),
  );

  return (
    <>
      <div className="container product-detail">
        <nav
          className="breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">All Products</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="detail-layout">
          <div>
            <div className="detail-image">
              <img
                src={safeImage(product.images[image])}
                alt={product.name}
              />
            </div>

            {product.images.length > 1 && (
              <div className="thumbnails">
                {product.images.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    aria-label={`Show photograph ${index + 1}`}
                    aria-pressed={image === index}
                    onClick={() => setImage(index)}
                  >
                    <img src={safeImage(src)} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-content">
            <span className="eyebrow">
              {categories.find(
                (category) =>
                  category.id === product.category_id,
              )?.name || 'Handmade with love'}
            </span>

            <h1>{product.name}</h1>

            <p className="detail-description">
              {product.description}
            </p>

            <p
              className="price"
              aria-live="polite"
              aria-atomic="true"
            >
              {selectedPrice === null
                ? 'Price unavailable'
                : money(selectedPrice)}

              <small>
                {fixedPrice
                  ? ' each'
                  : ` each · ${selectedSize}`}
              </small>
            </p>

            <p className="stock-note">
              {unavailable
                ? 'Currently unavailable'
                : product.stock_mode === 'ready_stock'
                  ? `${product.stock_quantity} ready to find a home`
                  : 'Made to order, just for you'}
            </p>

            <fieldset>
              <legend>
                Colour <small>{colour}</small>
              </legend>

              <div className="colour-options">
                {colours.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={colour === option}
                    className={
                      colour === option
                        ? 'option selected'
                        : 'option'
                    }
                    onClick={() => setColour(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>

            {!fixedPrice && (
              <fieldset>
                <legend>
                  Size <small>{selectedSize}</small>
                </legend>

                <div className="colour-options">
                  {sizes.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={
                        selectedSize === option
                      }
                      className={
                        selectedSize === option
                          ? 'option selected'
                          : 'option'
                      }
                      onClick={() => {
                        setSize(option);
                        setMessage('');
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {colour === 'Custom colour' && (
              <label>
                Your custom colour request
                <input
                  maxLength={160}
                  value={custom}
                  onChange={(event) =>
                    setCustom(event.target.value)
                  }
                  placeholder="e.g. a particular shade of lavender"
                  required
                />
              </label>
            )}

            <div className="quantity-label">
              <span>Quantity</span>

              <div className="quantity-control">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() =>
                    setQty((value) =>
                      quantity(value - 1, max || 1),
                    )
                  }
                  disabled={qty === 1}
                >
                  −
                </button>

                <input
                  aria-label="Quantity"
                  type="number"
                  min="1"
                  max={max || 1}
                  value={qty}
                  onChange={(event) =>
                    setQty(
                      quantity(
                        event.target.value,
                        max || 1,
                      ),
                    )
                  }
                />

                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={qty >= max}
                  onClick={() =>
                    setQty((value) =>
                      quantity(value + 1, max || 1),
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>

            <label>
              A little note
              <small>
                optional · sent with your WhatsApp request
              </small>

              <textarea
                maxLength={500}
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                placeholder="Tell us your preferences. Please leave out payment details and your address."
                rows={3}
              />

              <small>{note.length}/500</small>
            </label>

            {colour === 'Custom colour' && (
              <p className="subtle-note">
                Custom colour requests may affect the final
                quote. We’ll confirm in chat.
              </p>
            )}

            {message && (
              <p className="form-error" role="alert">
                {message}
              </p>
            )}

            <div className="product-actions">
              <button
                className="button secondary"
                type="button"
                onClick={addCart}
                disabled={unavailable}
              >
                <ShoppingBag size={18} />
                Add to Cart
              </button>

              <a
                className={`button ${
                  unavailable ? 'disabled' : ''
                }`}
                href={unavailable ? undefined : direct}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={unavailable}
                onClick={(event) => {
                  if (!validate()) event.preventDefault();
                }}
              >
                <MessageCircle size={18} />
                Order via WhatsApp
              </a>
            </div>

            <small className="muted">
              You send the message in WhatsApp. Availability,
              delivery and payment are confirmed there.
            </small>
          </div>
        </div>

        <div className="product-accordions">
          {[
            ['Product details', product.details],
            ['Making time', product.making_time],
            ['Care', product.care],
            [
              'How to order',
              'Choose your quantity, colour and available size, then add this piece to your cart or order directly through WhatsApp. We will confirm availability, making time and delivery details before you pay.',
            ],
          ].map(([title, body]) => (
            <details key={title}>
              <summary>{title}</summary>
              <p>{body}</p>
            </details>
          ))}
        </div>
      </div>

      <section className="related">
        <div className="container">
          <h2>A few more you might love</h2>

          <div className="product-grid">
            {products
              .filter(
                (otherProduct) =>
                  otherProduct.id !== product.id,
              )
              .sort(
                (a, b) =>
                  Number(
                    b.category_id === product.category_id,
                  ) -
                  Number(
                    a.category_id === product.category_id,
                  ),
              )
              .slice(0, 3)
              .map((otherProduct, index) => (
                <ProductCard
                  key={otherProduct.id}
                  product={otherProduct}
                  index={index}
                />
              ))}
          </div>
        </div>
      </section>
    </>
  );
}