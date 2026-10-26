import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const configured = Boolean(url && key);
export const supabase = configured
  ? createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false },
      global: { headers: { 'X-Client-Info': 'bella-crochet-web/1.0' } },
    })
  : null;
export function safeImage(src) {
  if (typeof src !== 'string') return '/images/products/star.webp';
  if (/^\/images\/products\/[a-z0-9_-]+\.(webp|png|jpg|jpeg)$/.test(src)) return src;
  if (configured) {
    try {
      const u = new URL(src);
      if (
        u.origin === new URL(url).origin &&
        /^\/storage\/v1\/object\/public\/product-images\/[a-zA-Z0-9/_\-.]+$/.test(u.pathname)
      )
        return u.href;
    } catch {
      /* reject invalid URL */
    }
  }
  return '/images/products/star.webp';
}
