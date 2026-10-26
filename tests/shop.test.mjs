import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  whatsappMessage,
  whatsappURL,
  publicCart,
  lineKey,
  quantity,
  cleanNote,
} from '../src/utils/shop.js';
const p = [{ id: 'star', slug: 'star', name: 'Star Keychain', price: 400 }];
test('WhatsApp message includes variant, quantity and note with a safely encoded business link', () => {
  const text = whatsappMessage(
    [
      {
        productId: 'star',
        quantity: 2,
        colour: 'Pink',
        size: 'Custom size',
        note: 'Please make it 12 cm & add a bow.',
      },
    ],
    p,
  );
  assert(text.includes('Quantity: 2'));
  assert(text.includes('Colour: Pink'));
  assert(text.includes('Size: Custom size'));
  assert(text.includes('12 cm & add a bow.'));
  assert(text.includes('800'));
  assert(text.includes('Please quote'));
  const url = new URL(whatsappURL(text));
  assert.equal(url.host, 'wa.me');
  assert.equal(url.pathname, '/923314544497');
  assert.equal(url.searchParams.get('text'), text);
});
test('custom notes are not written to persistent cart storage', () => {
  const saved = publicCart([
    { productId: 'star', colour: 'Pink', size: 'Standard', quantity: 1, note: 'Private request' },
  ]);
  assert(!JSON.stringify(saved).includes('Private request'));
  assert.equal(saved.length, 1);
});
test('different colours, sizes and notes remain separate cart lines', () => {
  const base = { productId: 'star', colour: 'Pink', size: 'Standard', note: '' };
  assert.notEqual(lineKey(base), lineKey({ ...base, colour: 'Blue' }));
  assert.notEqual(lineKey(base), lineKey({ ...base, size: 'Small' }));
  assert.notEqual(lineKey(base), lineKey({ ...base, note: 'A bow' }));
});
test('quantities and note length are bounded', () => {
  assert.equal(quantity(-50), 1);
  assert.equal(quantity(1e9), 99);
  assert.equal(quantity(5, 3), 3);
  assert.equal(cleanNote('a'.repeat(900)).length, 500);
  assert.equal(cleanNote('a\u0000b'), 'ab');
});
