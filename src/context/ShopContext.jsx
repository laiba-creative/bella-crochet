import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCatalog, defaultCategories } from '../services/catalog';
import { lineKey, quantity, publicCart, cleanNote } from '../utils/shop';
const ShopContext = createContext(null);
function initialCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('bella-cart-v1') || '[]');
    return Array.isArray(saved)
      ? publicCart(
          saved.filter(
            (i) =>
              typeof i.productId === 'string' &&
              typeof i.colour === 'string' &&
              typeof i.size === 'string',
          ),
        ).map((i) => ({ ...i, note: '' }))
      : [];
  } catch {
    return [];
  }
}
export function ShopProvider({ children }) {
  const [products, setProducts] = useState([]),
    [categories, setCategories] = useState(defaultCategories),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [local, setLocal] = useState(false),
    [cart, setCart] = useState(initialCart),
    [notice, setNotice] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await getCatalog();
      setProducts(d.products);
      setCategories(d.categories);
      setLocal(d.local);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    try {
      localStorage.setItem('bella-cart-v1', JSON.stringify(publicCart(cart)));
    } catch {
      /* cart still works in memory */
    }
  }, [cart]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(id);
  }, [notice]);
  function add(item) {
    const p = products.find((p) => p.id === item.productId);
    if (!p || !p.active) throw new Error('This piece is not currently available.');
    const key = lineKey(item);
    const existing = cart.find((i) => lineKey(i) === key);
    const max = p.stock_mode === 'ready_stock' ? Math.min(99, p.stock_quantity) : 99;
    if (max < 1) throw new Error('This piece is currently out of stock.');
    if ((existing?.quantity || 0) + item.quantity > max)
      throw new Error(`You can request up to ${max} of this piece.`);
    if (!existing && cart.length >= 30)
      throw new Error(
        'Your cart can hold 30 different selections. Please send this request first.',
      );
    setCart((c) =>
      existing
        ? c.map((i) => (lineKey(i) === key ? { ...i, quantity: i.quantity + item.quantity } : i))
        : [...c, { ...item, quantity: quantity(item.quantity) }],
    );
    setNotice('Added to your little collection.');
  }
  function update(index, value) {
    setCart((c) => c.map((i, n) => (n === index ? { ...i, quantity: quantity(value) } : i)));
  }
  function remove(index) {
    setCart((c) => c.filter((_, i) => i !== index));
  }
  function updateNote(index, note) {
    setCart((c) => c.map((i, n) => (n === index ? { ...i, note: cleanNote(note) } : i)));
  }
  return (
    <ShopContext.Provider
      value={{
        products,
        categories,
        loading,
        error,
        local,
        refresh,
        cart,
        add,
        update,
        updateNote,
        remove,
        clear: () => setCart([]),
        count: cart.reduce((s, i) => s + i.quantity, 0),
        notice,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}
export const useShop = () => useContext(ShopContext);
