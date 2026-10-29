export const WHATSAPP = '923314544497';

export const money = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export const COLOURS = [
  'Original',
  'Pink',
  'Sky blue',
  'Cream',
  'White',
  'Black',
  'Yellow',
  'Peach',
  'Red',
  'Green',
  'Lavender',
  'Brown',
  'Custom colour',
];

export const SIZES = [
  'Standard',
  'Small',
  'Medium',
  'Large',
];

export function sizeOptions(product) {
  const sizes = Array.isArray(product?.sizes)
    ? product.sizes
        .filter(
          (size) =>
            typeof size === 'string' && size.trim().length,
        )
        .map((size) => size.trim())
    : [];

  if (!sizes.length) {
    return product?.custom_size === true || product?.custom_size === undefined
      ? ['Standard', 'Custom size']
      : ['Standard'];
  }

  return [...new Set(sizes)];
}

export function sizePrice(product, size) {
  if (!product || !sizeOptions(product).includes(size)) {
    return null;
  }

  const customSizeAllowed =
    product.custom_size !== false ||
    (Array.isArray(product.sizes) &&
      product.sizes.includes('Custom size'));

  const value =
    size === 'Standard'
      ? product.price
      : size === 'Custom size'
        ? customSizeAllowed
          ? product.size_prices?.['Custom size'] ?? product.price
          : null
        : product.size_prices?.[size];

  if (
    value === null ||
    value === undefined ||
    value === '' ||
    !['number', 'string'].includes(typeof value)
  ) {
    return null;
  }

  const amount = Number(value);

  return Number.isFinite(amount) &&
    amount >= 0 &&
    amount <= 1000000
    ? amount
    : null;
}

export function cleanNote(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .slice(0, 500);
}

export function quantity(value, max = 99) {
  return Math.max(
    1,
    Math.min(max, Math.trunc(Number(value) || 1)),
  );
}

export function lineKey(item) {
  return JSON.stringify([
    item.productId,
    item.colour,
    item.size,
    cleanNote(item.note),
  ]);
}

export function whatsappMessage(items, products) {
  const lines = [
    'Hi Bella Crochet! I would like to enquire about:',
    '',
  ];

  let total = 0;
  let incomplete = false;
  let customColour = false;
  let customSize = false;
  let count = 0;

  for (const item of items) {
    const product = products.find(
      (product) => product.id === item.productId,
    );

    if (!product) {
      incomplete = true;
      continue;
    }

    const qty = quantity(item.quantity);
    const unitPrice = sizePrice(product, item.size);

    if (unitPrice === null) {
      incomplete = true;
    } else {
      total += Math.round(unitPrice * 100) * qty;
    }

    customColour ||= item.colour === 'Custom colour';
    customSize ||= item.size === 'Custom size';

    lines.push(
      `${++count}. ${product.name}`,
      `Quantity: ${qty}`,
      `Colour: ${cleanNote(item.colour)}`,
    );

    if (item.size !== 'Standard') {
      lines.push(`Size: ${cleanNote(item.size)}`);
    }

    lines.push(
      unitPrice === null
        ? 'Price: please confirm in chat'
        : `Listed unit price: ${money(unitPrice)} each`,
    );

    if (unitPrice !== null) {
      const lineTotal =
        (Math.round(unitPrice * 100) * qty) / 100;

      lines.push(`Line subtotal: ${money(lineTotal)}`);
    }

    if (item.note) {
      lines.push(`My note: ${cleanNote(item.note)}`);
    }

    if (typeof window !== 'undefined') {
      lines.push(
        `Product: ${window.location.origin}/products/${encodeURIComponent(product.slug)}`,
      );
    }

    lines.push('');
  }

  lines.push(
    `${
      incomplete
        ? 'Priced items subtotal (incomplete)'
        : 'Listed items subtotal'
    }: ${money(total / 100)}`,
  );

  if (incomplete) {
    lines.push(
      'Please confirm the missing or unavailable selections before agreeing a total.',
    );
  }

  if (customColour || customSize) {
    lines.push(
      'Please quote any custom size or colour changes.',
    );
  }

  lines.push(
    'Please confirm availability, making time, delivery charges and payment details.',
  );

  return lines.join('\n');
}

export function whatsappURL(message) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function publicCart(items) {
  return items.slice(0, 30).map(
    ({
      productId,
      colour,
      size,
      quantity: itemQuantity,
    }) => ({
      productId,
      colour,
      size,
      quantity: quantity(itemQuantity),
    }),
  );
}