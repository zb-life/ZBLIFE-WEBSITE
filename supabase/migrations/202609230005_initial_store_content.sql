-- ZIONBURG / ZB Production Database v1
-- Initial non-sensitive store content migrated from the v15.14 prototype.
-- This is a production data migration: no customer/order/test personal data is inserted.

-- Stable IDs make translation and relationship records deterministic.
-- Languages
insert into public.languages (code, name, native_name, enabled, is_default, position)
values
  ('en','English','English',true,true,1),
  ('zh-HK','Traditional Chinese','繁體中文',true,false,2),
  ('zh-CN','Simplified Chinese','简体中文',false,false,3),
  ('ja','Japanese','日本語',false,false,4),
  ('ko','Korean','한국어',false,false,5)
on conflict (code) do update set
  name = excluded.name,
  native_name = excluded.native_name,
  enabled = excluded.enabled,
  is_default = excluded.is_default,
  position = excluded.position;

-- Markets
insert into public.markets
  (id, code, name, status, currency, currency_symbol, default_locale, display_fx_rate, tax_mode, manual_tax_rate, tax_shipping, duties_policy, is_catch_all, position)
values
  ('30000000-0000-0000-0000-000000000001','hk','Hong Kong','active','HKD','HK$','en',1,'none',0,false,'customer',false,1),
  ('30000000-0000-0000-0000-000000000002','us','United States','draft','USD','US$','en',0.128,'none',0,false,'customer',false,2),
  ('30000000-0000-0000-0000-000000000003','sg','Singapore','draft','SGD','S$','en',0.166,'none',0,false,'customer',false,3),
  ('30000000-0000-0000-0000-000000000004','uk','United Kingdom','draft','GBP','£','en',0.096,'none',0,false,'customer',false,4),
  ('30000000-0000-0000-0000-000000000005','au','Australia','draft','AUD','A$','en',0.19,'none',0,false,'customer',false,5),
  ('30000000-0000-0000-0000-000000000006','jp','Japan','draft','JPY','¥','en',19.1,'none',0,false,'customer',false,6),
  ('30000000-0000-0000-0000-000000000007','cn','Mainland China','draft','CNY','¥','en',0.92,'none',0,false,'customer',false,7),
  ('30000000-0000-0000-0000-000000000008','row','Rest of world','draft','USD','US$','en',0.128,'none',0,false,'customer',true,99)
on conflict (id) do nothing;

insert into public.market_countries (market_id,country_code,country_name,postal_code_required,position)
values
  ('30000000-0000-0000-0000-000000000001','HK','Hong Kong',true,1),
  ('30000000-0000-0000-0000-000000000002','US','United States',true,1),
  ('30000000-0000-0000-0000-000000000003','SG','Singapore',true,1),
  ('30000000-0000-0000-0000-000000000004','GB','United Kingdom',true,1),
  ('30000000-0000-0000-0000-000000000005','AU','Australia',true,1),
  ('30000000-0000-0000-0000-000000000006','JP','Japan',true,1),
  ('30000000-0000-0000-0000-000000000007','CN','China',true,1)
on conflict (market_id,country_code) do nothing;

insert into public.market_languages (market_id, locale, is_default)
values
  ('30000000-0000-0000-0000-000000000001','en',true),
  ('30000000-0000-0000-0000-000000000001','zh-HK',false),
  ('30000000-0000-0000-0000-000000000002','en',true),
  ('30000000-0000-0000-0000-000000000003','en',true),
  ('30000000-0000-0000-0000-000000000004','en',true),
  ('30000000-0000-0000-0000-000000000005','en',true),
  ('30000000-0000-0000-0000-000000000006','en',true),
  ('30000000-0000-0000-0000-000000000007','en',true),
  ('30000000-0000-0000-0000-000000000008','en',true)
on conflict (market_id, locale) do nothing;

-- Product
insert into public.products
  (id,title,handle,description,vendor,product_type,status,show_in_navigation,featured,subscription_eligible,options,published_at)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Refreshing Body Wipes',
    'refreshing-body-wipes',
    'A portable body refresh designed for the moments between sweat and shower.',
    'ZIONBURG',
    'Body Care',
    'active',
    true,
    true,
    true,
    '["Scent"]'::jsonb,
    now()
  )
on conflict (id) do nothing;

-- Variants
insert into public.product_variants
  (id,product_id,title,sku,price_minor,currency,state_label,color_hex,option_values,track_inventory,inventory_policy,requires_shipping,weight,weight_unit,position,active)
values
  ('11000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Mint','ZB-RBW-MINT',8800,'HKD','Energising','#a8cdb7','{"Scent":"Mint"}',true,'deny',true,null,'g',1,true),
  ('11000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Cucumber','ZB-RBW-CUC',8800,'HKD','Crisp','#c3dbad','{"Scent":"Cucumber"}',true,'deny',true,null,'g',2,true),
  ('11000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Lavender','ZB-RBW-LAV',8800,'HKD','Calming','#cbb4d9','{"Scent":"Lavender"}',true,'deny',true,null,'g',3,true),
  ('11000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','Rose','ZB-RBW-ROSE',8800,'HKD','Romantic','#e0aeb7','{"Scent":"Rose"}',true,'deny',true,null,'g',4,true),
  ('11000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','Amber','ZB-RBW-AMBER',8800,'HKD','Warm','#c5966d','{"Scent":"Amber"}',true,'deny',true,null,'g',5,true),
  ('11000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001','Orange','ZB-RBW-ORG',8800,'HKD','Uplifting','#e9a769','{"Scent":"Orange"}',true,'deny',true,null,'g',6,true)
on conflict (id) do nothing;

insert into public.inventory (variant_id,quantity_on_hand,quantity_reserved,reorder_point)
values
  ('11000000-0000-0000-0000-000000000001',100,0,10),
  ('11000000-0000-0000-0000-000000000002',100,0,10),
  ('11000000-0000-0000-0000-000000000003',100,0,10),
  ('11000000-0000-0000-0000-000000000004',100,0,10),
  ('11000000-0000-0000-0000-000000000005',100,0,10),
  ('11000000-0000-0000-0000-000000000006',100,0,10)
on conflict (variant_id) do nothing;

-- Current static prototype media. Admin uploads can later move these into Supabase Storage.
insert into public.product_media
  (id,product_id,media_type,external_url,alt_text,autoplay,loop,controls,position)
values
  ('12000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','image','/assets/product-editorial.jpg','Refreshing Body Wipes',true,true,false,1),
  ('12000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','image','/assets/scent-mint.jpg','Refreshing Body Wipes detail',true,true,false,2),
  ('12000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','image','/assets/movement.jpg','Refreshing Body Wipes in motion',true,true,false,3)
on conflict (id) do nothing;

-- Collection
insert into public.collections
  (id,title,handle,description,status,published_at,position)
values
  ('20000000-0000-0000-0000-000000000001','Body Refresh','body-refresh','Refreshing essentials designed for movement, travel and everyday resets.','active',now(),1)
on conflict (id) do nothing;

insert into public.collection_products (collection_id,product_id,position)
values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',1)
on conflict (collection_id,product_id) do nothing;

-- Subscription plans: configured but hidden from storefront by default.
insert into public.subscription_plans
  (id,name,interval_unit,interval_count,discount_percent,active,storefront_visible,position)
values
  ('40000000-0000-0000-0000-000000000001','Every 4 weeks','week',4,10,true,false,1),
  ('40000000-0000-0000-0000-000000000002','Every 6 weeks','week',6,10,true,false,2),
  ('40000000-0000-0000-0000-000000000003','Every 8 weeks','week',8,10,true,false,3)
on conflict (id) do nothing;

insert into public.product_subscription_plans (product_id,subscription_plan_id)
values
  ('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000003')
on conflict do nothing;

-- Pack rules: retained in Admin but hidden on storefront by default.
insert into public.bundles
  (id,name,scope_type,product_id,quantity,fixed_price_minor,currency,badge,active,storefront_visible,position)
values
  ('41000000-0000-0000-0000-000000000001','Single pack','product','10000000-0000-0000-0000-000000000001',1,null,'HKD','',true,false,1),
  ('41000000-0000-0000-0000-000000000002','3-pack','product','10000000-0000-0000-0000-000000000001',3,23000,'HKD','SAVE 13%',true,false,2),
  ('41000000-0000-0000-0000-000000000003','6-pack','product','10000000-0000-0000-0000-000000000001',6,43000,'HKD','BEST VALUE',true,false,3)
on conflict (id) do nothing;

-- Existing prototype coupon retained as disabled until intentionally activated.
insert into public.discounts (id,code,discount_type,value,enabled)
values ('42000000-0000-0000-0000-000000000001','WELCOME10','percent',10,false)
on conflict (id) do nothing;

-- Shipping zones/rates
insert into public.shipping_zones (id,market_id,name,active,position)
values
  ('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Hong Kong',true,1),
  ('50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','United States',false,2),
  ('50000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000003','Singapore',false,3),
  ('50000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000004','United Kingdom',false,4),
  ('50000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000005','Australia',false,5),
  ('50000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000006','Japan',false,6),
  ('50000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000007','Mainland China',false,7),
  ('50000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000008','Rest of world',false,99)
on conflict (id) do nothing;

insert into public.shipping_zone_countries (shipping_zone_id,country_code)
values
  ('50000000-0000-0000-0000-000000000001','HK'),
  ('50000000-0000-0000-0000-000000000002','US'),
  ('50000000-0000-0000-0000-000000000003','SG'),
  ('50000000-0000-0000-0000-000000000004','GB'),
  ('50000000-0000-0000-0000-000000000005','AU'),
  ('50000000-0000-0000-0000-000000000006','JP'),
  ('50000000-0000-0000-0000-000000000007','CN')
on conflict do nothing;

insert into public.shipping_rates
  (id,shipping_zone_id,name,rate_type,currency,price_minor,free_over_minor,estimated_days_min,estimated_days_max,active,position)
values
  ('51000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','Standard Shipping','flat','HKD',3000,30000,2,4,true,1),
  ('51000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002','Standard Shipping','flat','HKD',18000,120000,5,12,false,1),
  ('51000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000003','Standard Shipping','flat','HKD',12000,90000,4,8,false,1),
  ('51000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000004','Standard Shipping','flat','HKD',18000,120000,5,12,false,1),
  ('51000000-0000-0000-0000-000000000005','50000000-0000-0000-0000-000000000005','Standard Shipping','flat','HKD',16000,110000,5,10,false,1),
  ('51000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000006','Standard Shipping','flat','HKD',14000,100000,4,9,false,1),
  ('51000000-0000-0000-0000-000000000007','50000000-0000-0000-0000-000000000007','Standard Shipping','flat','HKD',10000,80000,3,8,false,1),
  ('51000000-0000-0000-0000-000000000008','50000000-0000-0000-0000-000000000008','Standard Shipping','flat','HKD',22000,150000,7,14,false,1)
on conflict (id) do nothing;

-- Pages / homepage block content
insert into public.pages (id,title,handle,status,seo_title,seo_description,template,published_at)
values
  ('60000000-0000-0000-0000-000000000001','Home','home','published','ZIONBURG','Performance wellness and refreshing body care.','home',now()),
  ('60000000-0000-0000-0000-000000000002','Sustainability','sustainability','published','Sustainability | ZIONBURG','Thoughtful materials and lower-impact choices.','default',now())
on conflict (id) do nothing;

insert into public.page_blocks (id,page_id,block_type,position,visible,settings)
values
  (
    '61000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    'hero',
    1,
    true,
    jsonb_build_object(
      'eyebrow','PERFORMANCE MEETS WELLNESS',
      'title','CLEAN CARE' || chr(10) || 'FURTHER',
      'subtitle','Refresh your day. A cleaner tomorrow.',
      'media',jsonb_build_object('type','image','src','/assets/hero-editorial.jpg','alt','ZIONBURG performance wellness lifestyle')
    )
  ),
  (
    '61000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000001',
    'featured_product',
    2,
    true,
    jsonb_build_object(
      'product_id','10000000-0000-0000-0000-000000000001',
      'media',jsonb_build_object('type','image','src','/assets/product-editorial.jpg')
    )
  ),
  (
    '61000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000001',
    'lifestyle_grid',
    3,
    true,
    jsonb_build_object(
      'items',jsonb_build_array(
        jsonb_build_object('src','/assets/movement.jpg','alt','For movement'),
        jsonb_build_object('src','/assets/travel.jpg','alt','For travel'),
        jsonb_build_object('src','/assets/everyday.jpg','alt','For everyday'),
        jsonb_build_object('src','/assets/nature.jpg','alt','For a cleaner tomorrow')
      )
    )
  ),
  (
    '61000000-0000-0000-0000-000000000004',
    '60000000-0000-0000-0000-000000000001',
    'commitment',
    4,
    true,
    jsonb_build_object('media',jsonb_build_object('type','image','src','/assets/nature.jpg'))
  ),
  (
    '61000000-0000-0000-0000-000000000005',
    '60000000-0000-0000-0000-000000000002',
    'editorial_text',
    1,
    true,
    jsonb_build_object(
      'body','Our approach centres on thoughtful materials, lower-impact choices and products designed to fit naturally into active routines.'
    )
  )
on conflict (id) do nothing;

-- Benefit cards / SVG references
insert into public.benefits (id,title,subtitle,external_icon_url,active,position)
values
  ('62000000-0000-0000-0000-000000000001','PLANT-BASED','100% plant fibre','/assets/plant.svg',true,1),
  ('62000000-0000-0000-0000-000000000002','ALCOHOL-FREE','Gentle on skin','/assets/alcohol-free.svg',true,2),
  ('62000000-0000-0000-0000-000000000003','INFUSED WITH VITAMIN E','Nourish & protect','/assets/vitamin.svg',true,3),
  ('62000000-0000-0000-0000-000000000004','INSTANTLY REFRESHING','Cools up to 3°C','/assets/cooling.svg',true,4)
on conflict (id) do nothing;

-- Header navigation
insert into public.navigation_items
  (id,location,label,item_type,href,visible,position)
values
  ('63000000-0000-0000-0000-000000000001','header','Products','products',null,true,1),
  ('63000000-0000-0000-0000-000000000002','header','About','link','/#about',true,2),
  ('63000000-0000-0000-0000-000000000003','header','Stockists','link','/stockists.html',true,3),
  ('63000000-0000-0000-0000-000000000004','header','Community','link','/community.html',true,4)
on conflict (id) do nothing;

-- Public storefront settings
insert into public.site_settings (setting_key,value,is_public)
values
  ('theme', '{"font":"Instrument Sans","bodySize":18,"bg":"#f8f5ef","text":"#171717","surface":"#ffffff","softSurface":"#f0e7db","selectedFill":"#f6e3df","accent":"#d6a39a","button":"#1c1d1b","buttonText":"#ffffff","line":"#ded7ce"}'::jsonb, true),
  ('branding', '{"logo":"","logoText":"ZIONBURG","mobileLogoText":"ZB","logoAlt":"ZIONBURG","logoWidth":132,"mobileLogoWidth":44,"favicon":"/assets/favicon.svg"}'::jsonb, true),
  ('footer', '{"tagline":"PEOPLE. PERFORMANCE. A CLEANER TOMORROW.","showFooterNavigation":false}'::jsonb, true),
  ('features', '{"bundlesStorefrontVisible":false,"customerAccounts":true,"subscriptionsStorefrontVisible":false}'::jsonb, true),
  ('commerce_private', '{"salesEmails":[],"sendSalesOrder":true,"sendSalesReceipt":true,"receiptFromName":"ZB","receiptPrefix":"ZB"}'::jsonb, false)
on conflict (setting_key) do nothing;

-- Stockists
insert into public.stockists
  (id,name,shop_type,country_code,country_name,region,city,address,active,position)
values
  ('70000000-0000-0000-0000-000000000001','JOYPOLIS SPORTS HK','physical_store','HK','Hong Kong','Kowloon','Kai Tak','Kai Tak, Hong Kong',true,1),
  ('70000000-0000-0000-0000-000000000002','Selected fitness & wellness partners','other','HK','Hong Kong',null,null,'Hong Kong',true,2)
on conflict (id) do nothing;

-- Community
insert into public.community_entities
  (id,entity_type,name,note,image_fit,active,position)
values
  ('71000000-0000-0000-0000-000000000001','partner','Training & wellness spaces','Movement-led collaborations across Hong Kong.','cover',true,1),
  ('71000000-0000-0000-0000-000000000002','friend','Friends of ZB','A growing circle of people who move, recover and reset.','cover',true,1)
on conflict (id) do nothing;

-- Traditional Chinese starter translations
insert into public.entity_translations
  (entity_type,entity_id,locale,field_name,value,published)
values
  ('product','10000000-0000-0000-0000-000000000001','zh-HK','title','清爽身體濕巾',true),
  ('product','10000000-0000-0000-0000-000000000001','zh-HK','description','為運動出汗與下一個行程之間而設的便攜式身體清爽護理。',true),
  ('variant','11000000-0000-0000-0000-000000000001','zh-HK','title','薄荷',true),
  ('variant','11000000-0000-0000-0000-000000000001','zh-HK','state_label','醒神',true),
  ('variant','11000000-0000-0000-0000-000000000002','zh-HK','title','青瓜',true),
  ('variant','11000000-0000-0000-0000-000000000002','zh-HK','state_label','清新',true),
  ('variant','11000000-0000-0000-0000-000000000003','zh-HK','title','薰衣草',true),
  ('variant','11000000-0000-0000-0000-000000000003','zh-HK','state_label','舒緩',true),
  ('variant','11000000-0000-0000-0000-000000000004','zh-HK','title','玫瑰',true),
  ('variant','11000000-0000-0000-0000-000000000004','zh-HK','state_label','浪漫',true),
  ('variant','11000000-0000-0000-0000-000000000005','zh-HK','title','琥珀',true),
  ('variant','11000000-0000-0000-0000-000000000005','zh-HK','state_label','溫暖',true),
  ('variant','11000000-0000-0000-0000-000000000006','zh-HK','title','橙香',true),
  ('variant','11000000-0000-0000-0000-000000000006','zh-HK','state_label','提振',true),
  ('collection','20000000-0000-0000-0000-000000000001','zh-HK','title','身體清爽',true),
  ('collection','20000000-0000-0000-0000-000000000001','zh-HK','description','為運動、旅行及日常重整而設的清爽護理系列。',true),
  ('benefit','62000000-0000-0000-0000-000000000001','zh-HK','title','植物纖維',true),
  ('benefit','62000000-0000-0000-0000-000000000001','zh-HK','subtitle','100% 植物纖維',true),
  ('benefit','62000000-0000-0000-0000-000000000002','zh-HK','title','不含酒精',true),
  ('benefit','62000000-0000-0000-0000-000000000002','zh-HK','subtitle','溫和親膚',true),
  ('benefit','62000000-0000-0000-0000-000000000003','zh-HK','title','蘊含維他命 E',true),
  ('benefit','62000000-0000-0000-0000-000000000003','zh-HK','subtitle','滋養並呵護肌膚',true),
  ('benefit','62000000-0000-0000-0000-000000000004','zh-HK','title','即時清爽',true),
  ('benefit','62000000-0000-0000-0000-000000000004','zh-HK','subtitle','清涼感可降溫達 3°C',true),
  ('community','71000000-0000-0000-0000-000000000001','zh-HK','name','運動及健康生活空間',true),
  ('community','71000000-0000-0000-0000-000000000001','zh-HK','note','與香港不同運動及健康生活空間展開合作。',true)
on conflict (entity_type,entity_id,locale,field_name) do nothing;

insert into public.ui_translations (translation_key,locale,value,published)
values
  ('nav.products','zh-HK','產品',true),
  ('nav.about','zh-HK','關於我們',true),
  ('nav.stockists','zh-HK','零售點',true),
  ('nav.community','zh-HK','社群',true),
  ('account.sign_in','zh-HK','登入',true),
  ('account.create_account','zh-HK','建立帳戶',true),
  ('account.forgot_password','zh-HK','忘記密碼？',true),
  ('cart.add_to_bag','zh-HK','加入購物袋',true),
  ('checkout.checkout','zh-HK','結帳',true),
  ('checkout.shipping','zh-HK','配送',true)
on conflict (translation_key,locale) do nothing;
