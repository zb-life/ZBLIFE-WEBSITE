-- ZIONBURG / ZB Production Database v1
-- Row Level Security + grants

-- ---------- role helper functions ----------

create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = p_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin');
$$;

create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('admin','editor')
  );
$$;

create or replace function public.can_manage_orders()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('admin','sales','fulfilment')
  );
$$;

create or replace function public.can_manage_inventory()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('admin','editor','fulfilment')
  );
$$;

create or replace function public.can_manage_marketing()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('admin','editor','sales')
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('admin','editor','sales','fulfilment')
  );
$$;

-- ---------- enable RLS everywhere ----------

do $$
declare
  t text;
begin
  foreach t in array array[
    'languages','markets','market_countries','market_languages',
    'profiles','user_roles','customers','addresses','media_assets',
    'products','product_variants','inventory','product_media','collections','collection_products','market_prices',
    'subscription_plans','product_subscription_plans','bundles','discounts',
    'shipping_zones','shipping_zone_countries','shipping_rates',
    'pages','page_blocks','benefits','navigation_items','social_links','site_settings',
    'entity_translations','ui_translations','stockists','community_entities',
    'orders','order_items','payments','refunds','fulfilments','fulfilment_items','order_events',
    'discount_redemptions','customer_subscriptions','email_log',
    'custom_invoices','custom_invoice_items','audit_log'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------- public storefront reads ----------

create policy "public read enabled languages"
on public.languages for select
to anon, authenticated
using (enabled = true);

create policy "public read active markets"
on public.markets for select
to anon, authenticated
using (status = 'active');

create policy "public read active market countries"
on public.market_countries for select
to anon, authenticated
using (exists (
  select 1 from public.markets m
  where m.id = market_id and m.status = 'active'
));

create policy "public read active market languages"
on public.market_languages for select
to anon, authenticated
using (
  exists (select 1 from public.markets m where m.id = market_id and m.status = 'active')
  and exists (select 1 from public.languages l where l.code = locale and l.enabled = true)
);

create policy "public read public media metadata"
on public.media_assets for select
to anon, authenticated
using (bucket_id in ('product-media','page-media','community-media','brand-assets'));

create policy "public read published products"
on public.products for select
to anon, authenticated
using (status = 'active' and published_at is not null);

create policy "public read active variants"
on public.product_variants for select
to anon, authenticated
using (
  active = true and exists (
    select 1 from public.products p
    where p.id = product_id
      and p.status = 'active'
      and p.published_at is not null
  )
);

create policy "public read product media"
on public.product_media for select
to anon, authenticated
using (exists (
  select 1 from public.products p
  where p.id = product_id
    and p.status = 'active'
    and p.published_at is not null
));

create policy "public read published collections"
on public.collections for select
to anon, authenticated
using (status = 'active' and published_at is not null);

create policy "public read collection products"
on public.collection_products for select
to anon, authenticated
using (
  exists (
    select 1 from public.collections c
    where c.id = collection_id
      and c.status = 'active'
      and c.published_at is not null
  )
  and exists (
    select 1 from public.products p
    where p.id = product_id
      and p.status = 'active'
      and p.published_at is not null
  )
);

create policy "public read active market prices"
on public.market_prices for select
to anon, authenticated
using (
  active = true
  and exists (select 1 from public.markets m where m.id = market_id and m.status = 'active')
);

create policy "public read visible subscription plans"
on public.subscription_plans for select
to anon, authenticated
using (active = true and storefront_visible = true);

create policy "public read product subscription plans"
on public.product_subscription_plans for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active' and p.published_at is not null
  )
  and exists (
    select 1 from public.subscription_plans sp
    where sp.id = subscription_plan_id and sp.active = true and sp.storefront_visible = true
  )
);

create policy "public read visible bundles"
on public.bundles for select
to anon, authenticated
using (active = true and storefront_visible = true);

create policy "public read active shipping zones"
on public.shipping_zones for select
to anon, authenticated
using (
  active = true
  and (market_id is null or exists (
    select 1 from public.markets m where m.id = market_id and m.status = 'active'
  ))
);

create policy "public read shipping zone countries"
on public.shipping_zone_countries for select
to anon, authenticated
using (exists (
  select 1 from public.shipping_zones z
  where z.id = shipping_zone_id and z.active = true
));

create policy "public read active shipping rates"
on public.shipping_rates for select
to anon, authenticated
using (
  active = true
  and exists (
    select 1 from public.shipping_zones z
    where z.id = shipping_zone_id and z.active = true
  )
);

create policy "public read published pages"
on public.pages for select
to anon, authenticated
using (status = 'published' and published_at is not null);

create policy "public read visible page blocks"
on public.page_blocks for select
to anon, authenticated
using (
  visible = true and exists (
    select 1 from public.pages p
    where p.id = page_id
      and p.status = 'published'
      and p.published_at is not null
  )
);

create policy "public read active benefits"
on public.benefits for select
to anon, authenticated
using (active = true);

create policy "public read visible navigation"
on public.navigation_items for select
to anon, authenticated
using (visible = true);

create policy "public read active social links"
on public.social_links for select
to anon, authenticated
using (active = true);

create policy "public read public site settings"
on public.site_settings for select
to anon, authenticated
using (is_public = true);

create policy "public read published entity translations"
on public.entity_translations for select
to anon, authenticated
using (
  published = true
  and exists (select 1 from public.languages l where l.code = locale and l.enabled = true)
);

create policy "public read published ui translations"
on public.ui_translations for select
to anon, authenticated
using (
  published = true
  and exists (select 1 from public.languages l where l.code = locale and l.enabled = true)
);

create policy "public read active stockists"
on public.stockists for select
to anon, authenticated
using (active = true);

create policy "public read active community"
on public.community_entities for select
to anon, authenticated
using (active = true);

-- ---------- customer self-service ----------

create policy "users read own profile"
on public.profiles for select
to authenticated
using (user_id = auth.uid());

create policy "users insert own profile"
on public.profiles for insert
to authenticated
with check (user_id = auth.uid());

create policy "users update own profile"
on public.profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users read own roles"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

create policy "users read linked customer"
on public.customers for select
to authenticated
using (user_id = auth.uid());

create policy "users read own addresses"
on public.addresses for select
to authenticated
using (user_id = auth.uid());

create policy "users create own addresses"
on public.addresses for insert
to authenticated
with check (user_id = auth.uid());

create policy "users update own addresses"
on public.addresses for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users delete own addresses"
on public.addresses for delete
to authenticated
using (user_id = auth.uid());

create policy "users read own orders"
on public.orders for select
to authenticated
using (
  user_id = auth.uid()
  or customer_id in (
    select c.id from public.customers c where c.user_id = auth.uid()
  )
);

create policy "users read own order items"
on public.order_items for select
to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_id
    and (
      o.user_id = auth.uid()
      or o.customer_id in (select c.id from public.customers c where c.user_id = auth.uid())
    )
));

create policy "users read own refunds"
on public.refunds for select
to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_id
    and (
      o.user_id = auth.uid()
      or o.customer_id in (select c.id from public.customers c where c.user_id = auth.uid())
    )
));

create policy "users read own fulfilments"
on public.fulfilments for select
to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_id
    and (
      o.user_id = auth.uid()
      or o.customer_id in (select c.id from public.customers c where c.user_id = auth.uid())
    )
));

create policy "users read own fulfilment items"
on public.fulfilment_items for select
to authenticated
using (exists (
  select 1
  from public.fulfilments f
  join public.orders o on o.id = f.order_id
  where f.id = fulfilment_id
    and (
      o.user_id = auth.uid()
      or o.customer_id in (select c.id from public.customers c where c.user_id = auth.uid())
    )
));

create policy "users read visible own order events"
on public.order_events for select
to authenticated
using (
  visible_to_customer = true
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and (
        o.user_id = auth.uid()
        or o.customer_id in (select c.id from public.customers c where c.user_id = auth.uid())
      )
  )
);

create policy "users read own subscriptions"
on public.customer_subscriptions for select
to authenticated
using (
  user_id = auth.uid()
  or customer_id in (select c.id from public.customers c where c.user_id = auth.uid())
);

create policy "users read own invoices"
on public.custom_invoices for select
to authenticated
using (
  user_id = auth.uid()
  or customer_id in (select c.id from public.customers c where c.user_id = auth.uid())
);

create policy "users read own invoice items"
on public.custom_invoice_items for select
to authenticated
using (exists (
  select 1 from public.custom_invoices i
  where i.id = invoice_id
    and (
      i.user_id = auth.uid()
      or i.customer_id in (select c.id from public.customers c where c.user_id = auth.uid())
    )
));

-- ---------- admin / staff management ----------

-- Full Admin-only settings/security tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'languages','markets','market_countries','market_languages','market_prices',
    'shipping_zones','shipping_zone_countries','shipping_rates',
    'site_settings'
  ]
  loop
    execute format(
      'create policy "admin full access" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end $$;

create policy "admin manage roles"
on public.user_roles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin read all profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

create policy "admin update all profiles"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Content team.
do $$
declare
  t text;
begin
  foreach t in array array[
    'media_assets','products','product_variants','product_media',
    'collections','collection_products','pages','page_blocks','benefits',
    'navigation_items','social_links','entity_translations','ui_translations',
    'stockists','community_entities'
  ]
  loop
    execute format(
      'create policy "content managers full access" on public.%I for all to authenticated using (public.can_manage_content()) with check (public.can_manage_content())',
      t
    );
  end loop;
end $$;

create policy "content managers manage public settings"
on public.site_settings for all
to authenticated
using (is_public = true and public.can_manage_content())
with check (is_public = true and public.can_manage_content());

create policy "inventory managers full access"
on public.inventory for all
to authenticated
using (public.can_manage_inventory())
with check (public.can_manage_inventory());

-- Marketing team.
do $$
declare
  t text;
begin
  foreach t in array array[
    'subscription_plans','product_subscription_plans','bundles','discounts'
  ]
  loop
    execute format(
      'create policy "marketing managers full access" on public.%I for all to authenticated using (public.can_manage_marketing()) with check (public.can_manage_marketing())',
      t
    );
  end loop;
end $$;

-- Orders/sales/fulfilment team.
do $$
declare
  t text;
begin
  foreach t in array array[
    'customers','orders','order_items','payments','refunds','fulfilments',
    'fulfilment_items','order_events','discount_redemptions',
    'customer_subscriptions','email_log','custom_invoices','custom_invoice_items'
  ]
  loop
    execute format(
      'create policy "order managers full access" on public.%I for all to authenticated using (public.can_manage_orders()) with check (public.can_manage_orders())',
      t
    );
  end loop;
end $$;

-- Audit log: staff can write; admins can read.
create policy "staff insert audit"
on public.audit_log for insert
to authenticated
with check (public.is_staff());

create policy "admins read audit"
on public.audit_log for select
to authenticated
using (public.is_admin());

-- ---------- grants ----------
-- Table grants are deliberately broad for signed-in users; RLS is the actual gate.
-- Anonymous users get read-only access only to storefront-safe objects.

grant usage on schema public to anon, authenticated, service_role;

grant select on
  public.languages,
  public.markets,
  public.market_countries,
  public.market_languages,
  public.media_assets,
  public.products,
  public.product_variants,
  public.product_media,
  public.collections,
  public.collection_products,
  public.market_prices,
  public.subscription_plans,
  public.product_subscription_plans,
  public.bundles,
  public.shipping_zones,
  public.shipping_zone_countries,
  public.shipping_rates,
  public.pages,
  public.page_blocks,
  public.benefits,
  public.navigation_items,
  public.social_links,
  public.site_settings,
  public.entity_translations,
  public.ui_translations,
  public.stockists,
  public.community_entities
to anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

revoke all on function public.next_zb_order_number() from public, anon;
revoke all on function public.next_zb_invoice_number() from public, anon;

grant execute on function public.has_role(text) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_manage_content() to authenticated;
grant execute on function public.can_manage_orders() to authenticated;
grant execute on function public.can_manage_inventory() to authenticated;
grant execute on function public.can_manage_marketing() to authenticated;
grant execute on function public.is_staff() to authenticated;
