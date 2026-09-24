-- ZIONBURG / ZB Production Database v1
-- 2026-09-23
-- Core schema only. Security policies are applied in the next migration.

create extension if not exists pgcrypto with schema extensions;

-- ---------- shared helpers ----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create sequence if not exists public.zb_order_number_seq start 1001;
create sequence if not exists public.zb_invoice_number_seq start 1001;

create or replace function public.next_zb_order_number()
returns text
language sql
volatile
as $$
  select 'ZB-' || lpad(nextval('public.zb_order_number_seq')::text, 6, '0');
$$;

create or replace function public.next_zb_invoice_number()
returns text
language sql
volatile
as $$
  select 'INV-' || lpad(nextval('public.zb_invoice_number_seq')::text, 6, '0');
$$;

-- ---------- languages / markets ----------

create table public.languages (
  code text primary key,
  name text not null,
  native_name text not null,
  enabled boolean not null default false,
  is_default boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint languages_code_nonempty check (length(trim(code)) > 0)
);

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  status text not null default 'draft'
    check (status in ('active','draft','disabled')),
  currency text not null default 'HKD'
    check (currency ~ '^[A-Z]{3}$'),
  currency_symbol text not null default 'HK$',
  default_locale text references public.languages(code),
  display_fx_rate numeric(18,8),
  tax_mode text not null default 'none'
    check (tax_mode in ('none','manual','stripe_tax')),
  manual_tax_rate numeric(8,5) not null default 0
    check (manual_tax_rate >= 0),
  tax_shipping boolean not null default false,
  duties_policy text not null default 'customer'
    check (duties_policy in ('customer','merchant','calculated')),
  is_catch_all boolean not null default false,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.market_countries (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  country_name text not null,
  postal_code_required boolean not null default true,
  position integer not null default 0,
  unique (market_id, country_code)
);

create table public.market_languages (
  market_id uuid not null references public.markets(id) on delete cascade,
  locale text not null references public.languages(code) on delete cascade,
  is_default boolean not null default false,
  primary key (market_id, locale)
);

-- ---------- accounts / customers ----------

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  phone text,
  preferred_locale text references public.languages(code),
  preferred_market_id uuid references public.markets(id),
  marketing_opt_in boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('customer','admin','editor','sales','fulfilment')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  locale text references public.languages(code),
  market_id uuid references public.markets(id),
  marketing_opt_in boolean not null default false,
  accepts_sms boolean not null default false,
  notes text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  first_order_at timestamptz,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_email_nonempty check (length(trim(email)) > 3)
);

create unique index customers_email_lower_unique
  on public.customers (lower(email));

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  first_name text not null,
  last_name text not null,
  company text,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  region text,
  postal_code text not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint addresses_phone_required check (length(trim(phone)) > 0),
  constraint addresses_postal_required check (length(trim(postal_code)) > 0)
);

-- ---------- media ----------

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  storage_path text not null,
  file_name text,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  width integer,
  height integer,
  alt_text text,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (bucket_id, storage_path)
);

-- ---------- catalog ----------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  handle text not null unique,
  description text,
  vendor text not null default 'ZIONBURG',
  product_type text,
  status text not null default 'draft'
    check (status in ('active','draft','archived')),
  show_in_navigation boolean not null default true,
  featured boolean not null default false,
  subscription_eligible boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  metafields jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_title_nonempty check (length(trim(title)) > 0),
  constraint products_handle_format check (handle ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  sku text unique,
  barcode text,
  price_minor bigint not null default 0 check (price_minor >= 0),
  compare_at_price_minor bigint check (compare_at_price_minor is null or compare_at_price_minor >= 0),
  currency text not null default 'HKD' check (currency ~ '^[A-Z]{3}$'),
  state_label text,
  color_hex text,
  option_values jsonb not null default '{}'::jsonb,
  track_inventory boolean not null default true,
  inventory_policy text not null default 'deny'
    check (inventory_policy in ('deny','continue')),
  requires_shipping boolean not null default true,
  weight numeric(12,3),
  weight_unit text not null default 'g' check (weight_unit in ('g','kg','oz','lb')),
  length numeric(12,3),
  width numeric(12,3),
  height numeric(12,3),
  dimension_unit text not null default 'cm' check (dimension_unit in ('cm','in')),
  position integer not null default 0,
  active boolean not null default true,
  metafields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null unique references public.product_variants(id) on delete cascade,
  quantity_on_hand integer not null default 0,
  quantity_reserved integer not null default 0,
  reorder_point integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint inventory_on_hand_nonnegative check (quantity_on_hand >= 0),
  constraint inventory_reserved_nonnegative check (quantity_reserved >= 0)
);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  media_type text not null default 'image'
    check (media_type in ('image','video','youtube')),
  media_asset_id uuid references public.media_assets(id) on delete set null,
  external_url text,
  poster_media_asset_id uuid references public.media_assets(id) on delete set null,
  poster_url text,
  alt_text text,
  autoplay boolean not null default true,
  loop boolean not null default true,
  controls boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_media_source_required
    check (media_asset_id is not null or length(trim(coalesce(external_url,''))) > 0)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  handle text not null unique,
  description text,
  status text not null default 'draft'
    check (status in ('active','draft','archived')),
  seo_title text,
  seo_description text,
  published_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_handle_format check (handle ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 0,
  primary key (collection_id, product_id)
);

create table public.market_prices (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  price_minor bigint not null check (price_minor >= 0),
  compare_at_price_minor bigint check (compare_at_price_minor is null or compare_at_price_minor >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, variant_id)
);

-- ---------- subscriptions / packs / discounts ----------

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  interval_unit text not null check (interval_unit in ('week','month')),
  interval_count integer not null check (interval_count > 0),
  discount_percent numeric(6,3) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  stripe_price_id text,
  active boolean not null default true,
  storefront_visible boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_subscription_plans (
  product_id uuid not null references public.products(id) on delete cascade,
  subscription_plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  primary key (product_id, subscription_plan_id)
);

create table public.bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope_type text not null default 'product'
    check (scope_type in ('all','product','collection')),
  product_id uuid references public.products(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  fixed_price_minor bigint check (fixed_price_minor is null or fixed_price_minor >= 0),
  currency text not null default 'HKD' check (currency ~ '^[A-Z]{3}$'),
  badge text,
  active boolean not null default true,
  storefront_visible boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bundles_scope_target check (
    (scope_type = 'all' and product_id is null and collection_id is null) or
    (scope_type = 'product' and product_id is not null and collection_id is null) or
    (scope_type = 'collection' and collection_id is not null and product_id is null)
  )
);

create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type text not null check (discount_type in ('percent','fixed')),
  value numeric(12,3) not null check (value >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  min_purchase_minor bigint check (min_purchase_minor is null or min_purchase_minor >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index discounts_code_upper_unique
  on public.discounts (upper(code));

-- ---------- shipping ----------

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references public.markets(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipping_zone_countries (
  shipping_zone_id uuid not null references public.shipping_zones(id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  primary key (shipping_zone_id, country_code)
);

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  shipping_zone_id uuid not null references public.shipping_zones(id) on delete cascade,
  name text not null,
  rate_type text not null default 'flat'
    check (rate_type in ('flat','weight','price')),
  currency text not null default 'HKD' check (currency ~ '^[A-Z]{3}$'),
  price_minor bigint not null default 0 check (price_minor >= 0),
  free_over_minor bigint check (free_over_minor is null or free_over_minor >= 0),
  min_order_minor bigint check (min_order_minor is null or min_order_minor >= 0),
  max_order_minor bigint check (max_order_minor is null or max_order_minor >= 0),
  min_weight numeric(12,3),
  max_weight numeric(12,3),
  estimated_days_min integer check (estimated_days_min is null or estimated_days_min >= 0),
  estimated_days_max integer check (estimated_days_max is null or estimated_days_max >= 0),
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- content / CMS ----------

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  handle text not null unique,
  status text not null default 'draft'
    check (status in ('published','draft','archived')),
  seo_title text,
  seo_description text,
  template text not null default 'default',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_handle_format check (handle ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  block_type text not null,
  position integer not null default 0,
  visible boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.benefits (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  icon_media_asset_id uuid references public.media_assets(id) on delete set null,
  external_icon_url text,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  location text not null default 'header'
    check (location in ('header','footer')),
  parent_id uuid references public.navigation_items(id) on delete cascade,
  label text not null,
  item_type text not null default 'link'
    check (item_type in ('link','products','collection','page')),
  href text,
  product_id uuid references public.products(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  page_id uuid references public.pages(id) on delete set null,
  visible boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  setting_key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.entity_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  locale text not null references public.languages(code) on delete cascade,
  field_name text not null,
  value text not null,
  published boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, locale, field_name)
);

create table public.ui_translations (
  id uuid primary key default gen_random_uuid(),
  translation_key text not null,
  locale text not null references public.languages(code) on delete cascade,
  value text not null,
  published boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (translation_key, locale)
);

create table public.stockists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shop_type text not null default 'physical_store'
    check (shop_type in ('physical_store','online_store','tiktok_shop','marketplace','distributor','popup','other')),
  country_code text,
  country_name text,
  region text,
  city text,
  address text,
  website_url text,
  social_url text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  image_media_asset_id uuid references public.media_assets(id) on delete set null,
  active boolean not null default true,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('partner','friend')),
  name text not null,
  note text,
  image_media_asset_id uuid references public.media_assets(id) on delete set null,
  external_image_url text,
  image_fit text not null default 'cover' check (image_fit in ('cover','contain')),
  website_url text,
  instagram_url text,
  tiktok_url text,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- orders / payments / fulfilment ----------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default public.next_zb_order_number(),
  user_id uuid references auth.users(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  market_id uuid references public.markets(id) on delete set null,
  email text not null,
  phone text not null,
  currency text not null default 'HKD' check (currency ~ '^[A-Z]{3}$'),
  subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  discount_total_minor bigint not null default 0 check (discount_total_minor >= 0),
  shipping_total_minor bigint not null default 0 check (shipping_total_minor >= 0),
  tax_total_minor bigint not null default 0 check (tax_total_minor >= 0),
  grand_total_minor bigint not null default 0 check (grand_total_minor >= 0),
  order_status text not null default 'open'
    check (order_status in ('open','completed','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending','paid','partially_refunded','refunded','failed','cancelled')),
  fulfilment_status text not null default 'unfulfilled'
    check (fulfilment_status in ('unfulfilled','partially_fulfilled','shipped','delivered','cancelled')),
  shipping_address jsonb not null,
  billing_address jsonb,
  customer_note text,
  internal_note text,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_phone_required check (length(trim(phone)) > 0),
  constraint orders_shipping_phone_required
    check (length(trim(coalesce(shipping_address->>'phone',''))) > 0),
  constraint orders_shipping_postal_required
    check (length(trim(coalesce(shipping_address->>'postal_code',''))) > 0)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_title_snapshot text not null,
  variant_title_snapshot text,
  sku_snapshot text,
  quantity integer not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  line_total_minor bigint not null check (line_total_minor >= 0),
  metadata jsonb not null default '{}'::jsonb
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'stripe',
  provider_payment_id text,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null check (status in ('pending','succeeded','failed','cancelled','refunded','partially_refunded')),
  payment_method_type text,
  processed_at timestamptz,
  raw_reference jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index payments_provider_id_unique
  on public.payments(provider, provider_payment_id)
  where provider_payment_id is not null;

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  provider_refund_id text,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  reason text,
  status text not null default 'pending'
    check (status in ('pending','succeeded','failed','cancelled')),
  processed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.fulfilments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','shipped','delivered','cancelled')),
  carrier text,
  tracking_number text,
  tracking_url text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  customer_notified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fulfilment_items (
  fulfilment_id uuid not null references public.fulfilments(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  primary key (fulfilment_id, order_item_id)
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  message text,
  visible_to_customer boolean not null default false,
  actor_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references public.discounts(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  amount_minor bigint not null default 0 check (amount_minor >= 0),
  created_at timestamptz not null default now(),
  unique (discount_id, order_id)
);

create table public.customer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  subscription_plan_id uuid references public.subscription_plans(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'incomplete'
    check (status in ('incomplete','trialing','active','past_due','paused','cancelled','unpaid')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  email_type text not null,
  recipient text not null,
  subject text,
  status text not null default 'queued'
    check (status in ('queued','sent','delivered','bounced','failed')),
  provider_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- custom invoices ----------

create table public.custom_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default public.next_zb_invoice_number(),
  public_token uuid not null unique default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  currency text not null default 'HKD' check (currency ~ '^[A-Z]{3}$'),
  subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  total_minor bigint not null default 0 check (total_minor >= 0),
  due_date date,
  purchase_order_ref text,
  notes text,
  status text not null default 'draft'
    check (status in ('draft','sent','paid','void','expired')),
  stripe_checkout_session_id text,
  paid_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.custom_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.custom_invoices(id) on delete cascade,
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_minor bigint not null default 0 check (unit_price_minor >= 0),
  line_total_minor bigint not null default 0 check (line_total_minor >= 0),
  position integer not null default 0
);

-- ---------- audit ----------

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- indexes ----------

create index product_variants_product_idx on public.product_variants(product_id);
create index product_media_product_idx on public.product_media(product_id, position);
create index collection_products_product_idx on public.collection_products(product_id);
create index market_prices_market_idx on public.market_prices(market_id);
create index market_prices_variant_idx on public.market_prices(variant_id);
create index addresses_user_idx on public.addresses(user_id);
create index customers_user_idx on public.customers(user_id);
create index customers_created_idx on public.customers(created_at desc);
create index orders_user_idx on public.orders(user_id, created_at desc);
create index orders_customer_idx on public.orders(customer_id, created_at desc);
create index orders_email_lower_idx on public.orders(lower(email), created_at desc);
create index orders_created_idx on public.orders(created_at desc);
create index orders_payment_idx on public.orders(payment_status, created_at desc);
create index orders_fulfilment_idx on public.orders(fulfilment_status, created_at desc);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);
create index order_items_variant_idx on public.order_items(variant_id);
create index fulfilments_order_idx on public.fulfilments(order_id);
create index order_events_order_idx on public.order_events(order_id, created_at);
create index translations_entity_idx on public.entity_translations(entity_type, entity_id, locale);
create index pages_status_idx on public.pages(status);
create index stockists_active_idx on public.stockists(active, country_code, shop_type);
create index community_active_idx on public.community_entities(active, entity_type);
create index shipping_rates_zone_idx on public.shipping_rates(shipping_zone_id, active);

-- ---------- updated_at triggers ----------

do $$
declare
  t text;
begin
  foreach t in array array[
    'languages','markets','profiles','customers','addresses',
    'products','product_variants','inventory','collections','market_prices',
    'subscription_plans','bundles','discounts','shipping_zones','shipping_rates',
    'pages','page_blocks','benefits','navigation_items','social_links',
    'stockists','community_entities','orders','fulfilments','customer_subscriptions',
    'email_log','custom_invoices'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      'set_' || t || '_updated_at',
      t
    );
  end loop;
end $$;

-- ---------- auth profile trigger ----------

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    user_id,
    email,
    first_name,
    last_name
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'given_name'),
    coalesce(new.raw_user_meta_data->>'last_name', new.raw_user_meta_data->>'family_name')
  )
  on conflict (user_id) do update
  set email = excluded.email,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_profile on auth.users;
create trigger on_auth_user_profile
after insert or update of email on auth.users
for each row execute function public.handle_auth_user_profile();
