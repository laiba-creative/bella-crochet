import { supabase, configured } from './supabase';
import initialProducts from './products.json';
export const defaultCategories = [
  { id: 'keychains', name: 'Keychains', slug: 'keychains', active: true },
  { id: 'flowers-decor', name: 'Flowers & Decor', slug: 'flowers-decor', active: true },
  { id: 'plushies', name: 'Plushies', slug: 'plushies', active: true },
  { id: 'accessories', name: 'Accessories', slug: 'accessories', active: true },
];
export async function getCatalog() {
  if (!configured) return { products: initialProducts, categories: defaultCategories, local: true };
  const [p, c] = await Promise.all([
    supabase.from('products').select('*').eq('active', true).order('sort_order'),
    supabase.from('categories').select('*').eq('active', true).order('sort_order'),
  ]);
  if (p.error || c.error)
    throw new Error('The collection could not be loaded. Please try again or message us.');
  return {
    products: p.data.filter((p) => c.data.some((c) => c.id === p.category_id)),
    categories: c.data,
    local: false,
  };
}
