import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
// Read-only integration smoke test. Only use synthetic test accounts in staging.
// This script deliberately never prints credentials, tokens or returned records.
const url = process.env.TEST_SUPABASE_URL;
const key = process.env.TEST_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Set TEST_SUPABASE_URL and TEST_SUPABASE_PUBLISHABLE_KEY for a STAGING project.');
  process.exit(1);
}
const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
let passed = 0;
async function hidden(table) {
  const { data, error } = await client.from(table).select('*').limit(1);
  assert(error || data?.length === 0, `Private resource exposed: ${table}`);
  passed++;
}
try {
  const { error } = await client.from('products').select('id').limit(1);
  assert(!error, 'Public catalogue request failed');
  passed++;
  for (const table of ['orders', 'support_requests', 'admin_settings', 'audit_events'])
    await hidden(table);
  // A malformed bearer token must never produce administrative access.
  const forged = await fetch(`${url}/rest/v1/orders?select=id&limit=1`, {
    headers: { apikey: key, Authorization: 'Bearer invalid-token-for-negative-test' },
  });
  assert([401, 403].includes(forged.status), 'Invalid bearer token was not rejected');
  passed++;
  const {
    TEST_ADMIN_EMAIL: email,
    TEST_ADMIN_PASSWORD: password,
    TEST_ADMIN_TOTP_CODE: code,
  } = process.env;
  if (email && password && code) {
    const login = await client.auth.signInWithPassword({ email, password });
    assert(!login.error, 'Staging admin login failed');
    assert.equal(
      (await client.rpc('is_admin_member')).data,
      true,
      'Test account must be explicitly approved',
    );
    assert.equal(
      (await client.rpc('is_admin')).data,
      false,
      'Password-only session must not be an authorised administrator',
    );
    passed++;
    for (const table of ['orders', 'support_requests', 'admin_settings']) await hidden(table);
    const { data: factors, error: fe } = await client.auth.mfa.listFactors();
    assert(!fe, 'Unable to inspect test factors');
    const factor = factors.all.find((f) => f.factor_type === 'totp' && f.status === 'verified');
    assert(factor, 'Enrol a TOTP authenticator first');
    const verify = await client.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    assert(!verify.error, 'Staging MFA challenge failed');
    assert.equal((await client.rpc('is_admin')).data, true, 'Verified session was not authorised');
    passed++;
    const settings = await client.from('admin_settings').select('id').eq('id', 1);
    assert(!settings.error && settings.data.length === 1, 'Admin access to settings failed');
    passed++;
    console.log(
      `PASS: ${passed} hosted read-only checks including password-only denial and MFA access.`,
    );
  } else
    console.log(
      `PASS: ${passed} public/invalid-token checks. Admin login and MFA checks NOT RUN: supply synthetic staging admin credentials and current TOTP code through environment variables.`,
    );
} catch {
  console.error(
    'FAIL: hosted security smoke test. Check staging project policies and test-account setup. No private response data has been printed.',
  );
  process.exitCode = 1;
} finally {
  await client.auth.signOut().catch(() => {});
}
