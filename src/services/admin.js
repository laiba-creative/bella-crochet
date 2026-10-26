import { supabase } from './supabase';
export async function listAdmin(table) {
  const allowed = [
    'products',
    'categories',
    'orders',
    'support_requests',
    'admin_settings',
    'audit_events',
  ];
  if (!allowed.includes(table)) throw new Error('Unsupported resource.');
  let q = supabase.from(table).select('*');
  q = ['products', 'categories'].includes(table)
    ? q.order('sort_order')
    : table === 'admin_settings'
      ? q
      : q.order('created_at', { ascending: false });
  const { data, error } = await q.limit(500);
  if (error) throw new Error('Unable to load records. Check your session and database setup.');
  return data;
}
export async function saveAdmin(table, record, id) {
  if (!['products', 'categories', 'orders', 'support_requests', 'admin_settings'].includes(table))
    throw new Error('Unsupported resource.');
  const request = id
    ? supabase.from(table).update(record).eq('id', id)
    : supabase.from(table).insert(record);
  const { data, error } = await request.select('id');
  if (error || !data?.length)
    throw new Error(
      'Save was not permitted or a field is invalid. Please check your session, unique ID and required fields.',
    );
  return data;
}
export async function deleteAdmin(table, id) {
  if (!['products', 'categories', 'orders', 'support_requests'].includes(table))
    throw new Error('Unsupported resource.');
  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id');
  if (error || !data?.length)
    throw new Error(
      'Unable to remove this record. Categories with products must be hidden or reassigned first.',
    );
}
export async function uploadProductImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
    throw new Error('Choose a JPG, PNG or WebP image under 5 MB.');
  const bitmap = await createImageBitmap(file);
  if (bitmap.width > 12000 || bitmap.height > 12000 || bitmap.width * bitmap.height > 40000000) {
    bitmap.close();
    throw new Error('That image is too large. Please resize it first.');
  }
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.88));
  if (!blob) throw new Error('Image processing failed.');
  const name = `products/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(name, blob, { contentType: 'image/webp', upsert: false, cacheControl: '3600' });
  if (error) throw new Error('Image upload was not permitted. Check your verified admin session.');
  return supabase.storage.from('product-images').getPublicUrl(name).data.publicUrl;
}
