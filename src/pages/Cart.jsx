import { Link } from 'react-router-dom';
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';

import WhatsAppOrderAction from '../components/WhatsAppOrderAction';
import { useShop } from '../context/ShopContext';
import { safeImage } from '../services/supabase';
import {
  money,
  whatsappMessage,
  sizePrice,
  sizeOptions,
} from '../utils/shop';

export default function Cart() {
  const {
    cart,
    products,
    loading,
    error,
    update,
    updateNote,
    remove,
    clear,
  } = useShop();

  const resolved = cart.map((item, index) => {
    const product = products.find(
      (product) => product.id === item.productId,
    );

    return {
      item,
      index,
      product,
      unitPrice: sizePrice(product, item.size),
    };
  });

  const totalCents = resolved.reduce(
    (sum, { item, unitPrice }) =>
      sum +
      Math.round((unitPrice ?? 0) * 100) *
        item.quantity,
    0,
  );

  const invalid = resolved.some(
    ({ item, product, unitPrice }) =>
      !product ||
      !sizeOptions(product).includes(item.size) ||
      unitPrice === null ||
      !product.colours.includes(item.colour) ||
      (
        item.colour === 'Custom colour' &&
        !item.note?.trim()
      ) ||
      (
        product.stock_mode === 'ready_stock' &&
        item.quantity > product.stock_quantity
      ),
  );

  const customColour = cart.some(
    (item) => item.colour === 'Custom colour',
  );

  const message = whatsappMessage(cart, products);

  return (
    <div className="container cart-page">
      <span className="eyebrow">
        Your little collection
      </span>

      <h1>
        Good things,
        <br />
        <em>all together.</em>
      </h1>

      {loading ? (
        <p role="status">Checking your pieces…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : cart.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={40} />

          <h2>Your bag is waiting for a little joy.</h2>

          <p>
            Find a handmade piece you love and add it here.
          </p>

          <Link to="/products" className="button">
            Explore Collection
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            <div className="cart-top">
              <p>
                {cart.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                )}{' '}
                items selected
              </p>

              <button
                className="text-link"
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Clear all selected pieces?',
                    )
                  ) {
                    clear();
                  }
                }}
              >
                Clear bag
              </button>
            </div>

            {resolved.map(
              ({
                item,
                product,
                index,
                unitPrice,
              }) => (
                <article
                  className="cart-item"
                  key={index}
                >
                  <img
                    src={safeImage(product?.images?.[0])}
                    alt={
                      product?.name ||
                      'Unavailable piece'
                    }
                  />

                  <div>
                    <Link
                      to={
                        product
                          ? `/products/${product.slug}`
                          : '/products'
                      }
                    >
                      <h3>
                        {product?.name ||
                          'This piece is no longer listed'}
                      </h3>
                    </Link>

                    <p>
                      {item.colour}
                      {item.size !== 'Standard' &&
                        ` / ${item.size}`}
                    </p>

                    <label className="cart-note-editor">
                      Your note
                      <input
                        maxLength={500}
                        value={item.note || ''}
                        onChange={(event) =>
                          updateNote(
                            index,
                            event.target.value,
                          )
                        }
                        placeholder="A little request (optional)"
                      />
                    </label>

                    <strong>
                      {unitPrice === null
                        ? 'Price unavailable'
                        : `${money(unitPrice)} each`}
                    </strong>

                    {unitPrice !== null && (
                      <p>
                        Subtotal:{' '}
                        {money(
                          (
                            Math.round(unitPrice * 100) *
                            item.quantity
                          ) / 100,
                        )}
                      </p>
                    )}

                    <div className="quantity-control">
                      <button
                        type="button"
                        aria-label={`Decrease ${
                          product?.name || 'item'
                        }`}
                        disabled={item.quantity === 1}
                        onClick={() =>
                          update(index, item.quantity - 1)
                        }
                      >
                        −
                      </button>

                      <input
                        aria-label={`Quantity for ${
                          product?.name || 'item'
                        }`}
                        type="number"
                        min="1"
                        max="99"
                        value={item.quantity}
                        onChange={(event) =>
                          update(
                            index,
                            event.target.value,
                          )
                        }
                      />

                      <button
                        type="button"
                        aria-label={`Increase ${
                          product?.name || 'item'
                        }`}
                        disabled={item.quantity >= 99}
                        onClick={() =>
                          update(index, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    className="icon-button remove-item"
                    type="button"
                    aria-label={`Remove ${
                      product?.name || 'item'
                    }`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              ),
            )}

            <Link
              to="/products"
              className="text-link"
            >
              A little more browsing
              <ArrowRight size={16} />
            </Link>
          </div>

          <aside className="cart-summary">
            <h2>Your request</h2>

            <div className="total">
              <span>
                {invalid
                  ? 'Available items subtotal'
                  : 'Items subtotal'}
              </span>

              <strong>
                {money(totalCents / 100)}
              </strong>
            </div>

            <p>
              Delivery charges are confirmed on WhatsApp.
            </p>

            {customColour && (
              <p>
                Custom colour requests may affect the
                final quote.
              </p>
            )}

            <p className="subtle-note">
              No payment is collected on this website.
              Your order is confirmed in chat.
            </p>

            {invalid ? (
              <p
                className="form-error"
                role="alert"
              >
                Check your selections before sending.
                Custom colours need a note. Remove any
                unavailable selection or add it again
                using the current size options.
              </p>
            ) : (
              <WhatsAppOrderAction message={message} />
            )}

            <small>
              Review the message in WhatsApp, then press
              Send. Your bag stays here until you clear it.
            </small>

            <p className="subtle-note">
              Notes stay in this tab’s memory and reset
              on refresh. Product choices are saved on
              this device. Avoid adding addresses or
              payment information.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}