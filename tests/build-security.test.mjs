import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfigFromFile } from 'vite';
import { fileURLToPath } from 'node:url';
const config = fileURLToPath(new URL('../vite.config.js', import.meta.url));
async function rejectedKey(key) {
  const old = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = key;
  try {
    await assert.rejects(
      loadConfigFromFile({ command: 'build', mode: 'production' }, config),
      /private Supabase key/,
    );
  } finally {
    if (old === undefined) delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    else process.env.VITE_SUPABASE_PUBLISHABLE_KEY = old;
  }
}
test('build rejects a secret-format key assigned to the public variable', () =>
  rejectedKey('sb_secret_SYNTHETIC_NEGATIVE_TEST'));
test('build rejects a legacy service-role JWT assigned to the public variable', () =>
  rejectedKey(
    `synthetic.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.synthetic`,
  ));
