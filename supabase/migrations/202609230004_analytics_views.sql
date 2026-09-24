-- ZIONBURG / ZB Production Database v1
-- Staff-only analytics views used by Admin + XLSX exports.
-- security_invoker ensures underlying RLS is respected.

create or replace view public.analytics_daily_sales
with (security_invoker = true)
as
select
  date_trunc('day', o.created_at)::date as sales_date,
  count(*) filter (where o.payment_status in ('paid','partially_refunded','refunded')) as paid_orders,
  coalesce(sum(o.subtotal_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as gross_product_sales_minor,
  coalesce(sum(o.discount_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as discounts_minor,
  coalesce(sum(o.shipping_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as shipping_minor,
  coalesce(sum(o.tax_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as tax_minor,
  coalesce(sum(o.grand_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as collected_minor,
  coalesce((
    select sum(r.amount_minor)
    from public.refunds r
    join public.orders ro on ro.id = r.order_id
    where r.status = 'succeeded'
      and date_trunc('day', r.processed_at)::date = date_trunc('day', o.created_at)::date
  ),0) as refunds_minor,
  o.currency
from public.orders o
where public.is_staff()
group by date_trunc('day', o.created_at)::date, o.currency;

create or replace view public.analytics_weekly_sales
with (security_invoker = true)
as
select
  date_trunc('week', o.created_at)::date as week_start,
  count(*) filter (where o.payment_status in ('paid','partially_refunded','refunded')) as paid_orders,
  coalesce(sum(o.grand_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as collected_minor,
  coalesce(sum(o.discount_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as discounts_minor,
  coalesce(sum(o.shipping_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as shipping_minor,
  coalesce(sum(o.tax_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as tax_minor,
  o.currency
from public.orders o
where public.is_staff()
group by date_trunc('week', o.created_at)::date, o.currency;

create or replace view public.analytics_monthly_sales
with (security_invoker = true)
as
select
  date_trunc('month', o.created_at)::date as month_start,
  count(*) filter (where o.payment_status in ('paid','partially_refunded','refunded')) as paid_orders,
  coalesce(sum(o.grand_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as collected_minor,
  coalesce(sum(o.discount_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as discounts_minor,
  coalesce(sum(o.shipping_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as shipping_minor,
  coalesce(sum(o.tax_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as tax_minor,
  o.currency
from public.orders o
where public.is_staff()
group by date_trunc('month', o.created_at)::date, o.currency;

create or replace view public.analytics_product_sales
with (security_invoker = true)
as
select
  oi.product_id,
  oi.product_title_snapshot as product_title,
  o.currency,
  sum(oi.quantity) as units_sold,
  sum(oi.line_total_minor) as revenue_minor,
  count(distinct oi.order_id) as order_count
from public.order_items oi
join public.orders o on o.id = oi.order_id
where public.is_staff()
  and o.payment_status in ('paid','partially_refunded','refunded')
group by oi.product_id, oi.product_title_snapshot, o.currency;

create or replace view public.analytics_variant_sales
with (security_invoker = true)
as
select
  oi.variant_id,
  oi.product_title_snapshot as product_title,
  oi.variant_title_snapshot as variant_title,
  oi.sku_snapshot as sku,
  o.currency,
  sum(oi.quantity) as units_sold,
  sum(oi.line_total_minor) as revenue_minor,
  count(distinct oi.order_id) as order_count
from public.order_items oi
join public.orders o on o.id = oi.order_id
where public.is_staff()
  and o.payment_status in ('paid','partially_refunded','refunded')
group by oi.variant_id, oi.product_title_snapshot, oi.variant_title_snapshot, oi.sku_snapshot, o.currency;

create or replace view public.analytics_customer_lifetime_value
with (security_invoker = true)
as
select
  c.id as customer_id,
  c.email,
  c.first_name,
  c.last_name,
  count(o.id) filter (where o.payment_status in ('paid','partially_refunded','refunded')) as paid_orders,
  coalesce(sum(o.grand_total_minor) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0) as lifetime_spend_minor,
  max(o.created_at) filter (where o.payment_status in ('paid','partially_refunded','refunded')) as latest_order_at,
  min(o.created_at) filter (where o.payment_status in ('paid','partially_refunded','refunded')) as first_order_at,
  o.currency
from public.customers c
left join public.orders o on o.customer_id = c.id
where public.is_staff()
group by c.id, c.email, c.first_name, c.last_name, o.currency;

grant select on
  public.analytics_daily_sales,
  public.analytics_weekly_sales,
  public.analytics_monthly_sales,
  public.analytics_product_sales,
  public.analytics_variant_sales,
  public.analytics_customer_lifetime_value
to authenticated;

revoke all on
  public.analytics_daily_sales,
  public.analytics_weekly_sales,
  public.analytics_monthly_sales,
  public.analytics_product_sales,
  public.analytics_variant_sales,
  public.analytics_customer_lifetime_value
from anon;
