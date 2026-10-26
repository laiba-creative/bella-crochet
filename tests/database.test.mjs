import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
let db;
const admin = '11111111-1111-4111-8111-111111111111',
  customer = '22222222-2222-4222-8222-222222222222',
  other = '33333333-3333-4333-8333-333333333333';
before(async () => {
  db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key);
 create table auth.mfa_factors(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),status text,factor_type text);
 create function auth.uid() returns uuid language sql stable as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
 grant usage on schema auth,public,storage to anon,authenticated; grant execute on all functions in schema auth to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
 alter table storage.objects enable row level security; grant select,insert,update,delete on storage.objects to authenticated;
 insert into auth.users(id) values('${admin}'),('${customer}'),('${other}');`);
  await db.exec(
    await readFile(new URL('../supabase/migrations/001_bella.sql', import.meta.url), 'utf8'),
  );
  await db.exec(
    `insert into private.admin_members(user_id) values('${admin}');insert into auth.mfa_factors(user_id,status,factor_type) values('${admin}','verified','totp'),('${customer}','verified','totp'),('${other}','verified','totp');`,
  );
  await db.exec(await readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
  await db.exec(`insert into public.orders(reference,customer_name,customer_phone,items,total) values('SYNTHETIC-TEST','Synthetic customer','+920000000000','[{"name":"Star","quantity":1,"unit_price":400,"selection":"Original"}]',400);
 insert into public.support_requests(subject,contact,notes) values('Synthetic support','synthetic@example.invalid','Synthetic test fixture only');
 update public.products set active=false where id='bear';
 insert into public.categories(id,name,slug,active) values('hidden','Hidden','hidden',false);
 insert into public.products(id,slug,name,category_id,price,description,images) values('hidden-item','hidden-item','Hidden item','hidden',10,'Hidden fixture',array['/images/products/star.webp']);`);
});
after(async () => {
  await db?.close();
});
async function as(role, claims, fn) {
  await db.exec('begin');
  try {
    await db.exec(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify(claims)]);
    await fn();
  } finally {
    await db.exec('rollback');
  }
}
const claims = (sub, aal = 'aal1', extra = {}) => ({ sub, aal, role: 'authenticated', ...extra });
async function denied(sql, params = []) {
  await db.exec('savepoint denial');
  try {
    await assert.rejects(db.query(sql, params));
  } finally {
    await db.exec('rollback to savepoint denial');
  }
}
const orderInsert =
  'insert into public.orders(reference,customer_name,items) values(\'TEST\',\'Synthetic\',\'[{"name":"Star","quantity":1,"unit_price":400}]\')';
test('anonymous visitors see only active pieces in active categories', async () =>
  as('anon', {}, async () => {
    const { rows } = await db.query('select id from public.products');
    assert.equal(rows.length, 9);
    assert(!rows.some((r) => ['bear', 'hidden-item'].includes(r.id)));
    assert.equal((await db.query('select * from public.categories')).rows.length, 4);
  }));
test('anonymous callers cannot read orders, support, settings, audit or admin membership', async () =>
  as('anon', {}, async () => {
    for (const t of [
      'public.orders',
      'public.support_requests',
      'public.admin_settings',
      'public.audit_events',
      'private.admin_members',
    ])
      await denied(`select * from ${t}`);
  }));
test('anonymous callers cannot write product data or private orders', async () =>
  as('anon', {}, async () => {
    await denied("update public.products set price=1 where id='star'");
    await denied(orderInsert);
  }));
test('ordinary authenticated customers cannot read any customer or administrative records', async () =>
  as('authenticated', claims(customer), async () => {
    for (const t of ['orders', 'support_requests', 'admin_settings', 'audit_events'])
      assert.equal((await db.query(`select * from public.${t}`)).rows.length, 0);
    await denied('select * from private.admin_members');
  }));
test('a second customer cannot read another customer records either', async () =>
  as('authenticated', claims(other, 'aal2'), async () => {
    assert.equal((await db.query('select * from public.orders')).rows.length, 0);
    assert.equal((await db.query('select * from public.support_requests')).rows.length, 0);
  }));
test('user metadata claiming an admin role cannot grant admin status', async () =>
  as(
    'authenticated',
    claims(customer, 'aal2', {
      user_metadata: { role: 'admin', is_admin: true },
      app_metadata: { role: 'admin' },
    }),
    async () => {
      assert.equal((await db.query('select public.is_admin() as allowed')).rows[0].allowed, false);
      await denied(orderInsert);
      assert.equal(
        (await db.query("update public.products set price=1 where id='star' returning id")).rows
          .length,
        0,
      );
    },
  ));
test('authenticated users cannot promote themselves through membership writes or RPC', async () =>
  as('authenticated', claims(customer, 'aal2'), async () => {
    await denied(`insert into private.admin_members(user_id) values('${customer}')`);
    await denied("select public.is_admin_member('admin')");
  }));
test('approved admin at password-only AAL1 has no private access', async () =>
  as('authenticated', claims(admin), async () => {
    assert.equal(
      (await db.query('select public.is_admin_member() as member')).rows[0].member,
      true,
    );
    assert.equal((await db.query('select public.is_admin() as allowed')).rows[0].allowed, false);
    assert.equal((await db.query('select * from public.orders')).rows.length, 0);
    await denied(orderInsert);
  }));
test('verified admin with AAL2 can read and manage private orders', async () =>
  as('authenticated', claims(admin, 'aal2'), async () => {
    assert.equal((await db.query('select public.is_admin() as allowed')).rows[0].allowed, true);
    assert.equal((await db.query('select * from public.orders')).rows.length, 1);
    await db.query(orderInsert);
    assert.equal((await db.query('select * from public.orders')).rows.length, 2);
    assert.equal(
      (await db.query("update public.orders set status='making' returning id")).rows.length,
      2,
    );
  }));
test('verified admin can manage products/categories and see hidden items', async () =>
  as('authenticated', claims(admin, 'aal2'), async () => {
    assert.equal((await db.query('select * from public.products')).rows.length, 11);
    await db.query("update public.products set price=450 where id='star'");
    await db.query("insert into public.categories(id,name,slug) values('test','Test','test')");
    assert.equal(
      (await db.query("select price from public.products where id='star'")).rows[0].price,
      '450.00',
    );
  }));
test('revoked membership blocks an existing AAL2 session immediately', async () => {
  await db.exec('begin');
  try {
    await db.query(`update private.admin_members set active=false where user_id='${admin}'`);
    await db.exec('set local role authenticated');
    await db.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify(claims(admin, 'aal2')),
    ]);
    assert.equal((await db.query('select * from public.orders')).rows.length, 0);
    await denied(orderInsert);
  } finally {
    await db.exec('rollback');
  }
});
test('removing a verified factor blocks even a stale AAL2 claim', async () => {
  await db.exec('begin');
  try {
    await db.query(`delete from auth.mfa_factors where user_id='${admin}'`);
    await db.exec('set local role authenticated');
    await db.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify(claims(admin, 'aal2')),
    ]);
    assert.equal((await db.query('select public.is_admin() as allowed')).rows[0].allowed, false);
    assert.equal((await db.query('select * from public.orders')).rows.length, 0);
  } finally {
    await db.exec('rollback');
  }
});
test('negative prices, invalid stock and unsafe image locations are rejected by the database', async () =>
  as('authenticated', claims(admin, 'aal2'), async () => {
    await denied("update public.products set price=-1 where id='star'");
    await denied("update public.products set stock_quantity=-1 where id='star'");
    await denied("update public.products set images=array['javascript:alert(1)'] where id='star'");
    await denied(
      "update public.products set images=array['https://evil.invalid/picture.jpg'] where id='star'",
    );
    await denied(
      "update public.products set images=array['/images/products/payload.svg'] where id='star'",
    );
  }));
test('storage denies customer and AAL1 admin uploads', async () => {
  for (const c of [claims(customer, 'aal2'), claims(admin)])
    await as('authenticated', c, async () => {
      await denied(
        "insert into storage.objects(bucket_id,name) values('product-images','products/test.webp')",
      );
    });
});
test('storage permits verified admin product photos but rejects private paths and SVG', async () =>
  as('authenticated', claims(admin, 'aal2'), async () => {
    await db.query(
      "insert into storage.objects(bucket_id,name) values('product-images','products/test.webp')",
    );
    await denied(
      "insert into storage.objects(bucket_id,name) values('product-images','customers/receipt.webp')",
    );
    await denied(
      "insert into storage.objects(bucket_id,name) values('product-images','products/payload.svg')",
    );
  }));
test('audit events are recorded without customer content and cannot be forged by admins', async () =>
  as('authenticated', claims(admin, 'aal2'), async () => {
    await db.query(
      "update public.orders set notes='Synthetic secret note' where reference='SYNTHETIC-TEST'",
    );
    const row = (
      await db.query(
        "select * from public.audit_events where resource='orders' order by id desc limit 1",
      )
    ).rows[0];
    assert.equal(row.actor_id, admin);
    assert(!JSON.stringify(row).includes('Synthetic secret note'));
    await denied("insert into public.audit_events(event,resource) values('FAKE','orders')");
  }));
test('private settings reject ordinary updates and allow verified admin updates', async () => {
  await as('authenticated', claims(customer, 'aal2'), async () =>
    assert.equal(
      (await db.query("update public.admin_settings set business_name='Hacked' returning id")).rows
        .length,
      0,
    ),
  );
  await as('authenticated', claims(admin, 'aal2'), async () =>
    assert.equal(
      (await db.query("update public.admin_settings set order_prefix='TEST' returning id")).rows
        .length,
      1,
    ),
  );
});
test('row level security is enabled on every application and storage table', async () => {
  const { rows } = await db.query(
    "select n.nspname,c.relname,c.relrowsecurity from pg_class c join pg_namespace n on c.relnamespace=n.oid where n.nspname in ('public','private','storage') and c.relkind='r' and c.relname<>'buckets'",
  );
  assert(rows.length >= 8);
  assert(rows.every((r) => r.relrowsecurity));
});
