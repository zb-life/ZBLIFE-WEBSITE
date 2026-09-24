-- ZIONBURG / ZB Production Database v1
-- Supabase Storage buckets + policies
-- Store public ecommerce media in Storage; never store image/video bytes in Postgres.

insert into storage.buckets (id, name, public)
values
  ('product-media', 'product-media', true),
  ('page-media', 'page-media', true),
  ('community-media', 'community-media', true),
  ('brand-assets', 'brand-assets', true)
on conflict (id) do update set public = excluded.public;

-- Public storefront reads.
create policy "public read ZB media"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('product-media','page-media','community-media','brand-assets'));

-- Only authenticated ZB content managers can write media.
create policy "ZB content managers upload media"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('product-media','page-media','community-media','brand-assets')
  and public.can_manage_content()
);

create policy "ZB content managers update media"
on storage.objects for update
to authenticated
using (
  bucket_id in ('product-media','page-media','community-media','brand-assets')
  and public.can_manage_content()
)
with check (
  bucket_id in ('product-media','page-media','community-media','brand-assets')
  and public.can_manage_content()
);

create policy "ZB content managers delete media"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('product-media','page-media','community-media','brand-assets')
  and public.can_manage_content()
);
