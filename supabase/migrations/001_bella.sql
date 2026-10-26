-- Run as the Supabase project owner in SQL Editor, once, on a fresh project.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.admin_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table private.admin_members enable row level security;
revoke all on private.admin_members from public, anon, authenticated;

create function public.is_admin_member() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from private.admin_members a where a.user_id=auth.uid() and a.active)
$$;
revoke all on function public.is_admin_member() from public, anon;
grant execute on function public.is_admin_member() to authenticated;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select coalesce(auth.jwt()->>'aal','aal1')='aal2'
 and exists(select 1 from private.admin_members a where a.user_id=auth.uid() and a.active)
 and exists(select 1 from auth.mfa_factors f where f.user_id=auth.uid() and f.status='verified' and f.factor_type='totp')
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.categories (
 id text primary key check(id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
 name text not null check(length(name) between 1 and 80),
 slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
 active boolean not null default true, sort_order integer not null default 0
);
create table public.products (
 id text primary key check(id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
 slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
 name text not null check(length(name) between 1 and 120),
 category_id text not null references public.categories(id),
 price numeric(10,2) not null check(price between 0 and 1000000),
 description text not null check(length(description) between 1 and 3000),
 images text[] not null check(cardinality(images) between 1 and 8),
 colours text[] not null default '{Original}' check(cardinality(colours) between 1 and 30),
 sizes text[] not null default '{Standard}' check(cardinality(sizes) between 1 and 20),
 custom_colour boolean not null default true, custom_size boolean not null default true,
 stock_mode text not null default 'made_to_order' check(stock_mode in ('made_to_order','ready_stock')),
 stock_quantity integer not null default 0 check(stock_quantity between 0 and 100000),
 active boolean not null default true, featured boolean not null default false,
 sort_order integer not null default 0,
 making_time text not null default '' check(length(making_time)<=300),
 care text not null default '' check(length(care)<=1000),
 details text not null default '' check(length(details)<=1500),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.orders (
 id uuid primary key default gen_random_uuid(),
 reference text not null check(length(reference) between 1 and 80),
 customer_name text not null check(length(customer_name) between 1 and 120),
 customer_phone text not null default '' check(customer_phone='' or customer_phone ~ '^\+?[0-9 ()-]{7,25}$'),
 items jsonb not null check(jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 100 and octet_length(items::text)<=50000),
 total numeric(10,2) not null default 0 check(total between 0 and 10000000),
 status text not null default 'confirmed' check(status in ('confirmed','making','ready','dispatched','completed','cancelled')),
 notes text not null default '' check(length(notes)<=2000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.support_requests (
 id uuid primary key default gen_random_uuid(),
 subject text not null check(length(subject) between 1 and 160),
 contact text not null default '' check(length(contact)<=160),
 notes text not null default '' check(length(notes)<=3000),
 status text not null default 'open' check(status in ('open','waiting','closed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.admin_settings (
 id integer primary key default 1 check(id=1),
 business_name text not null default 'Bella Crochet' check(length(business_name) between 1 and 100),
 order_prefix text not null default 'BC' check(order_prefix ~ '^[A-Z0-9-]{1,12}$'),
 fulfilment_note text not null default 'Confirm delivery and payment with the customer in WhatsApp.' check(length(fulfilment_note)<=500)
);
insert into public.admin_settings(id) values (1);
create table public.audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid, event text not null, resource text not null, record_id text,
 created_at timestamptz not null default now()
);

create function private.check_product() returns trigger language plpgsql set search_path='' as $$
declare value text;
begin
 foreach value in array new.images loop
  if value is null or (value !~ '^/images/products/[a-z0-9_-]+\.(webp|png|jpg|jpeg)$'
   and value !~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/product-images/products/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg)$')
  then raise exception 'Invalid product image location'; end if;
 end loop;
 foreach value in array new.colours || new.sizes loop
  if value is null or length(value) not between 1 and 80 then raise exception 'Invalid option'; end if;
 end loop;
 return new;
end $$;
create trigger check_product before insert or update on public.products for each row execute function private.check_product();
create function private.check_order_items() returns trigger language plpgsql set search_path='' as $$
declare item jsonb;
begin
 for item in select * from jsonb_array_elements(new.items) loop
  if jsonb_typeof(item) <> 'object' or item->>'name' is null or length(item->>'name') not between 1 and 120
   or jsonb_typeof(item->'quantity') is distinct from 'number'
   or (item->>'quantity')::numeric not between 1 and 999 or (item->>'quantity')::numeric <> trunc((item->>'quantity')::numeric)
   or jsonb_typeof(item->'unit_price') is distinct from 'number'
   or (item->>'unit_price')::numeric not between 0 and 1000000
   or length(coalesce(item->>'selection','')) > 500
  then raise exception 'Invalid order item'; end if;
 end loop;
 return new;
end $$;
create trigger check_order_items before insert or update on public.orders for each row execute function private.check_order_items();
create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_events(actor_id,event,resource,record_id)
 values(auth.uid(),tg_op,tg_table_name,coalesce(new.id::text,old.id::text));
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
do $$declare t text; begin
 foreach t in array array['products','orders','support_requests'] loop
  execute format('create trigger touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()',t);
 end loop;
 foreach t in array array['products','categories','orders','support_requests','admin_settings'] loop
  execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function private.audit_change()',t);
 end loop;
end $$;

-- Explicit privileges: never rely on dashboard defaults.
revoke all on public.categories,public.products,public.orders,public.support_requests,public.admin_settings,public.audit_events from public,anon,authenticated;
grant select on public.categories,public.products to anon,authenticated;
grant insert,update,delete on public.categories,public.products to authenticated;
grant select,insert,update,delete on public.orders,public.support_requests to authenticated;
grant select,update on public.admin_settings to authenticated;
grant select on public.audit_events to authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.support_requests enable row level security;
alter table public.admin_settings enable row level security;
alter table public.audit_events enable row level security;
create policy categories_public on public.categories for select to anon,authenticated using(active or (select public.is_admin()));
create policy products_public on public.products for select to anon,authenticated using((active and exists(select 1 from public.categories c where c.id=category_id and c.active)) or (select public.is_admin()));
create policy categories_admin on public.categories for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy products_admin on public.products for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy orders_admin on public.orders for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy support_admin on public.support_requests for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy settings_admin on public.admin_settings for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy audit_admin on public.audit_events for select to authenticated using((select public.is_admin()));

-- Public storage is ONLY for product photographs, never private customer files.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy product_images_admin_insert on storage.objects for insert to authenticated
 with check(bucket_id='product-images' and name ~ '^products/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg)$' and (select public.is_admin()));
create policy product_images_admin_select on storage.objects for select to authenticated
 using(bucket_id='product-images' and (select public.is_admin()));
create policy product_images_admin_update on storage.objects for update to authenticated
 using(bucket_id='product-images' and (select public.is_admin()))
 with check(bucket_id='product-images' and name ~ '^products/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg)$' and (select public.is_admin()));
create policy product_images_admin_delete on storage.objects for delete to authenticated
 using(bucket_id='product-images' and (select public.is_admin()));

-- Trigger functions are not callable API endpoints.
revoke all on all functions in schema private from public,anon,authenticated;
commit;
