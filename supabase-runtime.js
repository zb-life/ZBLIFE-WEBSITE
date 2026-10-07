(function(){
  const CACHE_KEY = 'zb_editorial_v15';
  const HYDRATED_KEY = 'zb_supabase_hydrated_v1';
  let clientPromise = null;

  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + Date.now().toString().padStart(12,'0').slice(-12));
  const isUuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
  const ensureUuid = obj => { if(!isUuid(obj.id)) obj.id = uuid(); return obj.id; };
  const minor = n => Math.max(0, Math.round(Number(n||0) * 100));
  const major = n => Number(n||0) / 100;
  const titleCaseType = v => ({
    physical_store:'Physical Store',online_store:'Online Store',tiktok_shop:'TikTok Shop',
    marketplace:'Marketplace',distributor:'Distributor',popup:'Pop-up',other:'Other'
  }[v] || v || 'Other');
  const dbType = v => ({
    'Physical Store':'physical_store','Online Store':'online_store','TikTok Shop':'tiktok_shop',
    'Marketplace':'marketplace','Distributor':'distributor','Pop-up':'popup','Partner':'other','Other':'other'
  }[v] || 'other');

  const cleanEnvValue = value => String(value||'').trim().replace(/^['"]|['"]$/g,'');
  async function loadSupabaseConfig(){
    const endpoints=['/supabase-config.json','/.netlify/functions/supabase-config'];
    const errors=[];
    for(const endpoint of endpoints){
      try{
        const res=await fetch(endpoint,{cache:'no-store',headers:{accept:'application/json'}});
        if(!res.ok){ errors.push(`${endpoint}: HTTP ${res.status}`); continue; }
        const cfg=await res.json();
        const supabaseUrl=cleanEnvValue(cfg.supabaseUrl||cfg.url);
        const supabasePublishableKey=cleanEnvValue(cfg.supabasePublishableKey||cfg.supabaseAnonKey||cfg.anonKey);
        if(supabaseUrl && supabasePublishableKey) return {supabaseUrl,supabasePublishableKey};
        errors.push(`${endpoint}: configuration values missing`);
      }catch(err){
        errors.push(`${endpoint}: ${err?.message||err}`);
      }
    }
    throw new Error('Supabase configuration could not be loaded. Check the Netlify SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY environment variables. '+errors.join(' | '));
  }

  async function client(){
    if(clientPromise) return clientPromise;
    clientPromise = (async()=>{
      if(!window.supabase?.createClient) throw new Error('Supabase JS library did not load.');
      const cfg=await loadSupabaseConfig();
      return window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      });
    })().catch(err=>{ clientPromise=null; throw err; });
    return clientPromise;
  }

  async function rows(table, select='*', configure){
    const sb = await client();
    let q = sb.from(table).select(select);
    if(configure) q = configure(q);
    const {data,error} = await q;
    if(error){
      console.warn('[ZB Supabase]', table, error.message);
      return [];
    }
    return data || [];
  }

  async function authInfo(){
    const sb = await client();
    const {data:{user},error} = await sb.auth.getUser();
    if(error || !user) return {user:null, roles:[]};
    const {data:roleRows} = await sb.from('user_roles').select('role').eq('user_id', user.id);
    return {user, roles:(roleRows||[]).map(x=>x.role)};
  }

  async function requireRole(roles=['admin']){
    const info = await authInfo();
    return {...info, ok:!!info.user && info.roles.some(r=>roles.includes(r))};
  }

  function groupTranslations(items){
    const by = new Map();
    for(const t of items||[]){
      const key = `${t.entity_type}:${t.entity_id}`;
      if(!by.has(key)) by.set(key,{});
      const langs = by.get(key);
      langs[t.locale] = langs[t.locale] || {};
      langs[t.locale][t.field_name] = t.value;
    }
    return by;
  }

  async function loadLegacySite(){
    const [
      products, variants, inventory, media, collections, cp,
      settings, benefits, nav, socials, languages, markets, marketCountries,
      zones, rates, pages, blocks, stockists, community, entityTranslations,
      uiTranslations, plans, productPlans, bundles, discounts
    ] = await Promise.all([
      rows('products'), rows('product_variants'), rows('inventory'), rows('product_media'),
      rows('collections'), rows('collection_products'), rows('site_settings'), rows('benefits'),
      rows('navigation_items'), rows('social_links'), rows('languages'), rows('markets'),
      rows('market_countries'), rows('shipping_zones'), rows('shipping_rates'),
      rows('pages'), rows('page_blocks'), rows('stockists'), rows('community_entities'),
      rows('entity_translations'), rows('ui_translations'), rows('subscription_plans'),
      rows('product_subscription_plans'), rows('bundles'), rows('discounts')
    ]);

    if(!products.length && !settings.length) return null;

    const invMap = new Map(inventory.map(x=>[x.variant_id,x]));
    const mediaByProduct = new Map();
    media.sort((a,b)=>(a.position||0)-(b.position||0)).forEach(m=>{
      if(!mediaByProduct.has(m.product_id)) mediaByProduct.set(m.product_id,[]);
      mediaByProduct.get(m.product_id).push({
        _dbId:m.id, type:m.media_type, src:m.external_url||'', poster:m.poster_url||'',
        alt:m.alt_text||'', autoplay:m.autoplay!==false, loop:m.loop!==false, controls:!!m.controls
      });
    });
    const cpByProduct = new Map();
    cp.forEach(x=>{
      if(!cpByProduct.has(x.product_id)) cpByProduct.set(x.product_id,[]);
      cpByProduct.get(x.product_id).push(x.collection_id);
    });
    const translations = groupTranslations(entityTranslations);

    const catalogProducts = products
      .sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0))
      .map(p=>({
        id:p.id,title:p.title,handle:p.handle,status:p.status,vendor:p.vendor||'ZIONBURG',
        productType:p.product_type||'',description:p.description||'',showInNav:p.show_in_navigation!==false,
        subscriptionEligible:!!p.subscription_eligible,collectionIds:cpByProduct.get(p.id)||[],
        translations:translations.get(`product:${p.id}`)||{},
        variants:variants.filter(v=>v.product_id===p.id).sort((a,b)=>(a.position||0)-(b.position||0)).map(v=>({
          id:v.id,name:v.title,state:v.state_label||'',editorialDescriptor:v.option_values?.EditorialDescriptor||'',editorialHeadline:v.option_values?.EditorialHeadline||'',editorialFeels:v.option_values?.EditorialFeels||'',editorialMadeFor:v.option_values?.EditorialMadeFor||'',editorialMood:v.option_values?.EditorialMood||'',editorialState:v.option_values?.EditorialState||'',hoverDescription:v.option_values?.HoverDescription||'',price:major(v.price_minor),sku:v.sku||'',
          color:v.color_hex||'#d8d8d8',image:v.option_values?.VariantImage||'',video:v.option_values?.VariantVideo||'',moodCardImage:v.option_values?.MoodCardImage||'',inventory:invMap.get(v.id)?.quantity_on_hand||0,
          active:v.active!==false,translations:translations.get(`variant:${v.id}`)||{}
        })),
        media:mediaByProduct.get(p.id)||[]
      }));

    const colProducts = new Map();
    cp.forEach(x=>{
      if(!colProducts.has(x.collection_id)) colProducts.set(x.collection_id,[]);
      colProducts.get(x.collection_id).push(x.product_id);
    });
    const legacyCollections = collections.sort((a,b)=>(a.position||0)-(b.position||0)).map(c=>({
      id:c.id,title:c.title,handle:c.handle,status:c.status,description:c.description||'',
      productIds:colProducts.get(c.id)||[],translations:translations.get(`collection:${c.id}`)||{}
    }));

    const publicSettings = Object.fromEntries(settings.map(s=>[s.setting_key,s.value]));
    const socialMap = {};
    socials.filter(x=>x.active!==false).forEach(x=>socialMap[x.platform]=x.url);

    const enabledLangs = languages.sort((a,b)=>(a.position||0)-(b.position||0)).map(l=>({
      code:l.code,label:l.native_name||l.name,enabled:l.enabled!==false
    }));
    const defaultLocale = languages.find(l=>l.is_default)?.code || 'en';
    const uiMap = {};
    uiTranslations.forEach(t=>{
      uiMap[t.locale]=uiMap[t.locale]||{};
      uiMap[t.locale][t.translation_key]=t.value;
    });

    const zonesByMarket = new Map();
    zones.forEach(z=>zonesByMarket.set(z.market_id,z));
    const rateByZone = new Map();
    rates.forEach(r=>{ if(r.active || !rateByZone.has(r.shipping_zone_id)) rateByZone.set(r.shipping_zone_id,r); });
    const countriesByMarket = new Map();
    marketCountries.forEach(c=>{
      if(!countriesByMarket.has(c.market_id)) countriesByMarket.set(c.market_id,[]);
      countriesByMarket.get(c.market_id).push(c.country_name);
    });
    const marketItems = markets.sort((a,b)=>(a.position||0)-(b.position||0)).map(m=>{
      const z=zonesByMarket.get(m.id), r=z?rateByZone.get(z.id):null;
      return {
        id:m.code||m.id,_dbId:m.id,name:m.name,countries:countriesByMarket.get(m.id)||[],
        currency:m.currency,symbol:m.currency_symbol,fxRate:Number(m.display_fx_rate||1),
        enabled:m.status==='active',taxRate:Number(m.manual_tax_rate||0)*100,
        shippingFee:r?major(r.price_minor):0,freeShippingThreshold:r?.free_over_minor?major(r.free_over_minor):0,
        deliveryEstimate:r && r.estimated_days_min!=null ? `${r.estimated_days_min}–${r.estimated_days_max||r.estimated_days_min} business days` : ''
      };
    });

    const home = pages.find(p=>p.handle==='home');
    const homeBlocks = blocks.filter(b=>b.page_id===home?.id).sort((a,b)=>(a.position||0)-(b.position||0));
    const hero = homeBlocks.find(b=>b.block_type==='hero')?.settings||{};
    const featuredBlock = homeBlocks.find(b=>b.block_type==='featured_product');
    const featured = featuredBlock?.settings||{};
    const lifestyle = homeBlocks.find(b=>b.block_type==='lifestyle_grid')?.settings||{};
    const commitment = homeBlocks.find(b=>b.block_type==='commitment')?.settings||{};
    const mediaObj = m => m ? {type:m.type||'image',src:String(m.src||'').replace(/^\//,''),poster:m.poster||'',alt:m.alt||'',autoplay:m.autoplay!==false,loop:m.loop!==false,controls:!!m.controls,visible:m.visible!==false} : null;

    const legacyPages = pages.filter(p=>p.handle!=='home').map(p=>{
      const b=blocks.find(x=>x.page_id===p.id && x.block_type==='editorial_text');
      return {_dbId:p.id,title:p.title,slug:p.handle,body:b?.settings?.body||'',status:p.status};
    });

    const benefitList = benefits.sort((a,b)=>(a.position||0)-(b.position||0)).map(b=>({
      _dbId:b.id,title:b.title,subtitle:b.subtitle||'',icon:b.external_icon_url||'',
      translations:translations.get(`benefit:${b.id}`)||{}
    }));

    const navItems = nav.filter(n=>!n.parent_id).sort((a,b)=>(a.position||0)-(b.position||0)).map(n=>({
      _dbId:n.id,label:n.label,type:n.item_type,href:n.href||'',visible:n.visible!==false
    }));

    const stockistList = stockists.sort((a,b)=>(a.position||0)-(b.position||0)).map(s=>({
      _dbId:s.id,name:s.name,type:titleCaseType(s.shop_type),country:s.country_name||s.country_code||'',
      region:s.region||'',city:s.city||'',address:s.address||'',url:s.website_url||s.social_url||'',active:s.active!==false
    }));
    const partnerList = community.filter(x=>x.entity_type==='partner').sort((a,b)=>(a.position||0)-(b.position||0)).map(x=>({
      _dbId:x.id,name:x.name,type:'Community partner',note:x.note||'',image:x.external_image_url||'',
      imageFit:x.image_fit||'cover',url:x.website_url||x.instagram_url||x.tiktok_url||'',
      translations:translations.get(`community:${x.id}`)||{}
    }));
    const friendList = community.filter(x=>x.entity_type==='friend').sort((a,b)=>(a.position||0)-(b.position||0)).map(x=>({
      _dbId:x.id,name:x.name,type:'Creators & athletes',note:x.note||'',image:x.external_image_url||'',
      imageFit:x.image_fit||'cover',url:x.website_url||x.instagram_url||x.tiktok_url||'',
      translations:translations.get(`community:${x.id}`)||{}
    }));

    const enabledPlans = plans.sort((a,b)=>(a.position||0)-(b.position||0));
    const subscriptionProductIds = new Set(productPlans.map(x=>x.product_id));
    const subscriptionVisible = enabledPlans.some(x=>x.storefront_visible);
    const discount = Number(enabledPlans[0]?.discount_percent||0);

    const legacyBundles = bundles.sort((a,b)=>(a.position||0)-(b.position||0)).map(b=>({
      id:b.id,name:b.name,qty:b.quantity,price:b.fixed_price_minor==null?null:major(b.fixed_price_minor),
      badge:b.badge||'',active:b.active!==false,scopeType:b.scope_type,
      scopeId:b.scope_type==='product'?b.product_id:b.scope_type==='collection'?b.collection_id:''
    }));
    const legacyDiscounts = discounts.map(d=>({
      _dbId:d.id,code:d.code,type:d.discount_type,value:Number(d.value||0),enabled:!!d.enabled
    }));

    return {
      theme:publicSettings.theme||undefined,
      branding:publicSettings.branding||undefined,
      footer:{...(publicSettings.footer||{}),socials:socialMap,links:publicSettings.footer?.links||[]},
      features:publicSettings.features||undefined,
      settings:publicSettings.commerce_private||undefined,
      catalogProducts,
      collections:legacyCollections,
      benefits:benefitList,
      nav:navItems,
      homepage:{
        eyebrow:hero.eyebrow||'',
        title:hero.title||'',
        subtitle:hero.subtitle||'',
        moods:Array.isArray(lifestyle.moods)?lifestyle.moods:[],
        moodCta:lifestyle.moodCta||{label:'FIND YOUR MOOD →',link:'product.html',visible:true},
        journal:Array.isArray(lifestyle.journal)?lifestyle.journal:[],
        signature:{
          visible:featuredBlock?.visible!==false,
          eyebrow:featured.eyebrow||'OUR SIGNATURE',
          title:featured.title||'REFRESHING\nBODY WIPES',
          description:featured.description||'A premium, plant-based body wipe designed for modern lifestyles. Gentle, effective, and refreshing — anytime, anywhere.',
          buttonLabel:featured.button_label||'SHOP NOW',
          buttonLink:featured.button_link||'product.html'
        }
      },
      homepageMedia:{
        hero:mediaObj(hero.media),
        signature:mediaObj(featured.media),
        lifestyle:(lifestyle.items||[]).map(mediaObj).filter(Boolean),
        commitment:mediaObj(commitment.media)
      },
      pages:legacyPages,
      stockists:stockistList,
      partners:partnerList,
      friends:friendList,
      subscriptions:{
        enabled:enabledPlans.some(x=>x.active!==false),
        storefrontVisible:subscriptionVisible,
        label:'Subscribe & save',
        discount,
        plans:enabledPlans.map(p=>({id:p.id,label:p.name,value:`${p.interval_count}-${p.interval_unit}`}))
      },
      bundles:legacyBundles,
      discounts:legacyDiscounts,
      localization:{
        defaultLocale,
        languages:enabledLangs,
        contentTranslations:{},
        interfaceTranslations:uiMap
      },
      markets:{
        enabled:true,
        taxEngine:markets.find(x=>x.status==='active')?.tax_mode==='stripe_tax'?'stripe_tax':'manual',
        defaultMarketId:markets.find(x=>x.status==='active')?.code || marketItems[0]?.id || 'hk',
        taxOnShipping:!!markets.find(x=>x.status==='active')?.tax_shipping,
        items:marketItems
      },
      shipping:{
        fee:marketItems.find(x=>x.id==='hk')?.shippingFee||0,
        threshold:marketItems.find(x=>x.id==='hk')?.freeShippingThreshold||0
      },
      _supabaseLoadedAt:new Date().toISOString()
    };
  }

  async function hydrateSiteCache({cacheKey=CACHE_KEY,force=false,reload=false}={}){
    if(!force && sessionStorage.getItem(HYDRATED_KEY)==='1') return false;
    try{
      const site = await loadLegacySite();
      if(!site) return false;
      localStorage.setItem(cacheKey, JSON.stringify(site));
      sessionStorage.setItem(HYDRATED_KEY,'1');
      window.dispatchEvent(new CustomEvent('zb:supabase-ready',{detail:{site}}));
      if(reload){
        sessionStorage.setItem('zb_supabase_reloaded','1');
        location.reload();
      }
      return true;
    }catch(err){
      console.warn('[ZB Supabase] Hydration failed:',err);
      return false;
    }
  }

  async function upsert(table, payload, onConflict){
    if(!payload || (Array.isArray(payload) && !payload.length)) return [];
    const sb=await client();
    const q=sb.from(table).upsert(payload, onConflict?{onConflict}:undefined).select();
    const {data,error}=await q;
    if(error) throw new Error(`${table}: ${error.message}`);
    return data||[];
  }

  async function syncTranslations(site){
    const records=[];
    const add=(entityType,entityId,obj,fieldMap)=>{
      for(const [locale,fields] of Object.entries(obj?.translations||{})){
        for(const [legacyField,dbField] of Object.entries(fieldMap)){
          const value=fields?.[legacyField];
          if(value!=null && String(value).trim()!=='') records.push({
            entity_type:entityType,entity_id:entityId,locale,field_name:dbField,value:String(value),published:true
          });
        }
      }
    };
    for(const p of site.catalogProducts||[]){
      add('product',p.id,p,{title:'title',description:'description'});
      for(const v of p.variants||[]) add('variant',v.id,v,{name:'title',state:'state_label'});
    }
    for(const c of site.collections||[]) add('collection',c.id,c,{title:'title',description:'description'});
    for(const b of site.benefits||[]) if(b._dbId) add('benefit',b._dbId,b,{title:'title',subtitle:'subtitle'});
    for(const x of [...(site.partners||[]),...(site.friends||[])]) if(x._dbId) add('community',x._dbId,x,{name:'name',note:'note'});
    if(records.length) await upsert('entity_translations',records,'entity_type,entity_id,locale,field_name');

    const ui=[];
    for(const [locale,map] of Object.entries(site.localization?.interfaceTranslations||{})){
      for(const [key,value] of Object.entries(map||{})){
        if(String(value||'').trim()) ui.push({translation_key:key,locale,value:String(value),published:true});
      }
    }
    if(ui.length) await upsert('ui_translations',ui,'translation_key,locale');
  }

  async function syncSite(site){
    const access=await requireRole(['admin','editor']);
    if(!access.ok) throw new Error('Please sign in with an Admin or Editor account.');

    // UUID-normalise product, variant and collection IDs so future records fit Postgres UUID columns.
    const idMap=new Map();
    for(const p of site.catalogProducts||[]){
      const old=p.id; ensureUuid(p); if(old!==p.id) idMap.set(old,p.id);
      for(const v of p.variants||[]) ensureUuid(v);
    }
    for(const c of site.collections||[]){
      const old=c.id; ensureUuid(c); if(old!==c.id) idMap.set(old,c.id);
    }
    for(const p of site.catalogProducts||[]){
      p.collectionIds=(p.collectionIds||[]).map(x=>idMap.get(x)||x);
    }
    for(const c of site.collections||[]){
      c.productIds=(c.productIds||[]).map(x=>idMap.get(x)||x);
    }
    for(const b of site.bundles||[]){
      if(idMap.has(b.scopeId)) b.scopeId=idMap.get(b.scopeId);
      if(!isUuid(b.id)) b.id=uuid();
    }

    const products=(site.catalogProducts||[]).map(p=>({
      id:p.id,title:p.title,handle:p.handle||String(p.title||'product').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
      description:p.description||'',vendor:p.vendor||'ZIONBURG',product_type:p.productType||null,
      status:p.status||'draft',show_in_navigation:p.showInNav!==false,featured:false,
      subscription_eligible:!!p.subscriptionEligible,options:['Scent'],
      published_at:p.status==='active'?new Date().toISOString():null,updated_by:access.user.id
    }));
    await upsert('products',products,'id');

    for(const p of site.catalogProducts||[]){
      const variants=(p.variants||[]).map((v,i)=>({
        id:v.id,product_id:p.id,title:v.name||`Variant ${i+1}`,sku:v.sku||null,
        price_minor:minor(v.price),currency:'HKD',state_label:v.state||null,color_hex:v.color||null,
        option_values:{Scent:v.name||'',EditorialDescriptor:v.editorialDescriptor||'',EditorialHeadline:v.editorialHeadline||'',EditorialFeels:v.editorialFeels||'',EditorialMadeFor:v.editorialMadeFor||'',EditorialMood:v.editorialMood||'',EditorialState:v.editorialState||'',HoverDescription:v.hoverDescription||'',VariantImage:v.image||'',VariantVideo:v.video||'',MoodCardImage:v.moodCardImage||''},track_inventory:true,inventory_policy:'deny',requires_shipping:true,
        position:i+1,active:v.active!==false
      }));
      await upsert('product_variants',variants,'id');
      await upsert('inventory',variants.map((v,i)=>({
        variant_id:v.id,quantity_on_hand:Math.max(0,Number(p.variants[i]?.inventory||0)),quantity_reserved:0,reorder_point:0
      })),'variant_id');

      const sb=await client();
      const {error:delMediaErr}=await sb.from('product_media').delete().eq('product_id',p.id);
      if(delMediaErr) throw new Error(`product_media: ${delMediaErr.message}`);
      const media=(p.media||[]).filter(m=>m?.src).map((m,i)=>({
        product_id:p.id,media_type:m.type||'image',external_url:m.src,poster_url:m.poster||null,
        alt_text:m.alt||'',autoplay:m.autoplay!==false,loop:m.loop!==false,controls:!!m.controls,position:i+1
      }));
      if(media.length){
        const {error}=await sb.from('product_media').insert(media);
        if(error) throw new Error(`product_media: ${error.message}`);
      }
    }

    const collections=(site.collections||[]).map((c,i)=>({
      id:c.id,title:c.title,handle:c.handle||String(c.title||'collection').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
      description:c.description||'',status:c.status||'draft',published_at:c.status==='active'?new Date().toISOString():null,position:i+1
    }));
    await upsert('collections',collections,'id');
    const sb=await client();
    for(const c of site.collections||[]){
      const {error:delErr}=await sb.from('collection_products').delete().eq('collection_id',c.id);
      if(delErr) throw new Error(`collection_products: ${delErr.message}`);
      const pids=(c.productIds?.length?c.productIds:(site.catalogProducts||[]).filter(p=>(p.collectionIds||[]).includes(c.id)).map(p=>p.id));
      if(pids.length){
        const {error}=await sb.from('collection_products').insert(pids.map((pid,i)=>({collection_id:c.id,product_id:pid,position:i+1})));
        if(error) throw new Error(`collection_products: ${error.message}`);
      }
    }

    await upsert('site_settings',[
      {setting_key:'theme',value:site.theme||{},is_public:true,updated_by:access.user.id},
      {setting_key:'branding',value:site.branding||{},is_public:true,updated_by:access.user.id},
      {setting_key:'footer',value:{...(site.footer||{}),socials:undefined},is_public:true,updated_by:access.user.id},
      {setting_key:'features',value:site.features||{},is_public:true,updated_by:access.user.id},
      {setting_key:'commerce_private',value:site.settings||{},is_public:false,updated_by:access.user.id}
    ],'setting_key');

    // Languages
    const langs=(site.localization?.languages||[]).map((l,i)=>({
      code:l.code,name:l.code==='en'?'English':l.label,native_name:l.label,enabled:l.enabled!==false,
      is_default:l.code===(site.localization?.defaultLocale||'en'),position:i+1
    }));
    await upsert('languages',langs,'code');

    // Benefits
    const benefitPayload=[];
    for(let i=0;i<(site.benefits||[]).length;i++){
      const b=site.benefits[i]; if(!isUuid(b._dbId)) b._dbId=uuid();
      benefitPayload.push({id:b._dbId,title:b.title,subtitle:b.subtitle||'',external_icon_url:b.icon||null,active:true,position:i+1});
    }
    await upsert('benefits',benefitPayload,'id');

    // Navigation
    const navPayload=[];
    for(let i=0;i<(site.nav||[]).length;i++){
      const n=site.nav[i]; if(!isUuid(n._dbId)) n._dbId=uuid();
      navPayload.push({id:n._dbId,location:'header',label:n.label,item_type:n.type||'link',href:n.href||null,visible:n.visible!==false,position:i+1});
    }
    await upsert('navigation_items',navPayload,'id');

    // Social links: replace current simple list
    const {error:delSocial}=await sb.from('social_links').delete().neq('platform','__never__');
    if(delSocial) console.warn(delSocial.message);
    const socialPayload=Object.entries(site.footer?.socials||{}).filter(([,url])=>String(url||'').trim()).map(([platform,url],i)=>({
      platform,url,active:true,position:i+1
    }));
    if(socialPayload.length){
      const {error}=await sb.from('social_links').insert(socialPayload);
      if(error) throw new Error(`social_links: ${error.message}`);
    }

    // Stockists
    const stockPayload=[];
    for(let i=0;i<(site.stockists||[]).length;i++){
      const s=site.stockists[i]; if(!isUuid(s._dbId)) s._dbId=uuid();
      stockPayload.push({
        id:s._dbId,name:s.name,shop_type:dbType(s.type),country_name:s.country||null,region:s.region||null,
        city:s.city||null,address:s.address||null,website_url:s.url||null,active:s.active!==false,position:i+1
      });
    }
    await upsert('stockists',stockPayload,'id');

    // Community
    const communityPayload=[];
    for(const [type,list] of [['partner',site.partners||[]],['friend',site.friends||[]]]){
      for(let i=0;i<list.length;i++){
        const x=list[i]; if(!isUuid(x._dbId)) x._dbId=uuid();
        communityPayload.push({
          id:x._dbId,entity_type:type,name:x.name,note:x.note||null,external_image_url:x.image||null,
          image_fit:x.imageFit||'cover',website_url:x.url||null,active:true,position:i+1
        });
      }
    }
    await upsert('community_entities',communityPayload,'id');

    // Pages + homepage blocks
    let {data:homeRows}=await sb.from('pages').select('id').eq('handle','home').limit(1);
    let homeId=homeRows?.[0]?.id;
    if(!homeId){
      homeId=uuid();
      await upsert('pages',{id:homeId,title:'Home',handle:'home',status:'published',template:'home',published_at:new Date().toISOString(),updated_by:access.user.id},'id');
    }
    const homeMedia=site.homepageMedia||{};
    const blockDefs=[
      ['hero',1,true,{eyebrow:site.homepage?.eyebrow||'',title:site.homepage?.title||'',subtitle:site.homepage?.subtitle||'',media:homeMedia.hero||{}}],
      ['featured_product',2,site.homepage?.signature?.visible!==false,{product_id:site.catalogProducts?.[0]?.id||null,media:homeMedia.signature||{},eyebrow:site.homepage?.signature?.eyebrow||'OUR SIGNATURE',title:site.homepage?.signature?.title||'REFRESHING\nBODY WIPES',description:site.homepage?.signature?.description||'A premium, plant-based body wipe designed for modern lifestyles. Gentle, effective, and refreshing — anytime, anywhere.',button_label:site.homepage?.signature?.buttonLabel||'SHOP NOW',button_link:site.homepage?.signature?.buttonLink||'product.html'}],
      ['lifestyle_grid',3,true,{items:homeMedia.lifestyle||[],moods:site.homepage?.moods||[],moodCta:site.homepage?.moodCta||{label:'FIND YOUR MOOD →',link:'product.html',visible:true},journal:site.homepage?.journal||[]}],
      ['commitment',4,true,{media:homeMedia.commitment||{}}]
    ];
    const {data:existingBlocks}=await sb.from('page_blocks').select('id,block_type').eq('page_id',homeId);
    for(const [type,position,visible,settings] of blockDefs){
      const existing=existingBlocks?.find(x=>x.block_type===type);
      await upsert('page_blocks',{
        id:existing?.id||uuid(),page_id:homeId,block_type:type,position,visible,settings
      },'id');
    }
    for(let i=0;i<(site.pages||[]).length;i++){
      const p=site.pages[i]; if(!isUuid(p._dbId)) p._dbId=uuid();
      await upsert('pages',{
        id:p._dbId,title:p.title,handle:p.slug||`page-${i+1}`,status:p.status||'published',
        template:'default',published_at:(p.status||'published')==='published'?new Date().toISOString():null,updated_by:access.user.id
      },'id');
      const {data:eb}=await sb.from('page_blocks').select('id').eq('page_id',p._dbId).eq('block_type','editorial_text').limit(1);
      await upsert('page_blocks',{id:eb?.[0]?.id||uuid(),page_id:p._dbId,block_type:'editorial_text',position:1,visible:true,settings:{body:p.body||''}},'id');
    }

    // Subscriptions / bundles / discounts
    const planPayload=[];
    for(let i=0;i<(site.subscriptions?.plans||[]).length;i++){
      const p=site.subscriptions.plans[i]; if(!isUuid(p.id)) p.id=uuid();
      const m=String(p.value||'4-weeks').match(/^(\d+)-(week|weeks|month|months)$/);
      planPayload.push({
        id:p.id,name:p.label,interval_unit:(m?.[2]||'weeks').startsWith('month')?'month':'week',
        interval_count:Number(m?.[1]||4),discount_percent:Number(site.subscriptions?.discount||0),
        active:site.subscriptions?.enabled!==false,storefront_visible:site.subscriptions?.storefrontVisible!==false,position:i+1
      });
    }
    await upsert('subscription_plans',planPayload,'id');

    const bundlePayload=(site.bundles||[]).map((b,i)=>({
      id:b.id,name:b.name,scope_type:b.scopeType||'product',
      product_id:b.scopeType==='product'?b.scopeId:null,
      collection_id:b.scopeType==='collection'?b.scopeId:null,
      quantity:Math.max(1,Number(b.qty||1)),fixed_price_minor:b.price==null?null:minor(b.price),
      currency:'HKD',badge:b.badge||null,active:b.active!==false,
      storefront_visible:site.features?.bundlesStorefrontVisible!==false,position:i+1
    }));
    await upsert('bundles',bundlePayload,'id');

    const discountPayload=[];
    for(const d of site.discounts||[]){
      if(!isUuid(d._dbId)) d._dbId=uuid();
      discountPayload.push({id:d._dbId,code:d.code,discount_type:d.type||'percent',value:Number(d.value||0),enabled:!!d.enabled});
    }
    await upsert('discounts',discountPayload,'id');

    await syncTranslations(site);

    // Keep browser cache aligned with the UUIDs assigned above.
    localStorage.setItem(CACHE_KEY,JSON.stringify(site));
    sessionStorage.removeItem(HYDRATED_KEY);
    await hydrateSiteCache({force:true});
    return true;
  }

  async function loadOrdersForUser(){
    const sb=await client();
    const {data,error}=await sb.from('orders').select('id,order_number,created_at,email,currency,grand_total_minor,fulfilment_status,payment_status,fulfilments(id,carrier,tracking_number,tracking_url,shipped_at,delivered_at)').order('created_at',{ascending:false});
    if(error){ console.warn(error.message); return []; }
    return data||[];
  }

  async function uploadMedia(file,{bucket='product-media',folder='uploads'}={}){
    if(!file) throw new Error('Choose a file to upload.');
    const type=String(file.type||'');
    const isImage=type.startsWith('image/'),isVideo=type.startsWith('video/');
    if(!isImage&&!isVideo) throw new Error('Please upload an image or video file.');
    const maxBytes=(isVideo?60:12)*1024*1024;
    if(file.size>maxBytes) throw new Error(isVideo?'Please use a video smaller than 60 MB.':'Please use an image smaller than 12 MB.');
    const access=await requireRole(['admin','editor']);
    if(!access.ok) throw new Error('Please sign in with an Admin or Editor account.');
    const sb=await client();
    const ext=(String(file.name||'image').split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const base=String(file.name||'image').replace(/\.[^.]+$/,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'image';
    const path=`${folder.replace(/^\/+|\/+$/g,'')}/${Date.now()}-${base}.${ext}`;
    const {error}=await sb.storage.from(bucket).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});
    if(error) throw new Error(error.message);
    const {data}=sb.storage.from(bucket).getPublicUrl(path);
    if(!data?.publicUrl) throw new Error('Upload completed but no public image URL was returned.');
    return data.publicUrl;
  }

  async function loadOrdersForAdmin(){
    const access=await requireRole(['admin','editor','sales','fulfilment']);
    if(!access.ok) throw new Error('Please sign in with an authorised staff account.');
    const sb=await client();
    const {data:orders,error}=await sb.from('orders').select('*').order('created_at',{ascending:false});
    if(error) throw new Error('orders: '+error.message);
    const ids=(orders||[]).map(x=>x.id);
    let items=[],payments=[],fulfilments=[];
    if(ids.length){
      const [ir,pr,fr]=await Promise.all([
        sb.from('order_items').select('*').in('order_id',ids),
        sb.from('payments').select('*').in('order_id',ids),
        sb.from('fulfilments').select('*').in('order_id',ids).order('created_at',{ascending:false})
      ]);
      if(ir.error) throw new Error('order_items: '+ir.error.message);
      if(pr.error) throw new Error('payments: '+pr.error.message);
      if(fr.error) throw new Error('fulfilments: '+fr.error.message);
      items=ir.data||[];payments=pr.data||[];fulfilments=fr.data||[];
    }
    return (orders||[]).map(o=>{
      const f=fulfilments.find(x=>x.order_id===o.id);
      const p=payments.find(x=>x.order_id===o.id);
      const addr=o.shipping_address||{};
      return {
        _dbId:o.id,id:o.order_number||o.id,date:o.created_at,customer:o.metadata?.customer_name||[addr.first_name,addr.last_name].filter(Boolean).join(' ')||'Customer',
        email:o.email,phone:o.phone,total:Number(o.grand_total_minor||0)/100,payment:o.payment_status==='paid'?'Paid':o.payment_status||'Unpaid',
        fulfilment:o.fulfilment_status==='unfulfilled'?'Unfulfilled':o.fulfilment_status,discountCode:'',currency:o.currency||'HKD',
        stripeCheckoutSessionId:o.stripe_checkout_session_id||'',stripePaymentIntentId:o.stripe_payment_intent_id||'',
        trackingCarrier:f?.carrier||'',trackingNumber:f?.tracking_number||'',trackingUrl:f?.tracking_url||'',shippedAt:f?.shipped_at||null,
        address:addr,items:items.filter(x=>x.order_id===o.id).map(x=>({
          productId:x.product_id,variantId:x.variant_id,name:[x.product_title_snapshot,x.variant_title_snapshot].filter(Boolean).join(' — '),
          detail:x.metadata?.bundle_name||'',qty:Number(x.quantity||1),bundleQty:Number(x.metadata?.bundle_qty||1),
          price:Number(x.line_total_minor||0)/Math.max(1,Number(x.quantity||1))/100
        })),
        paymentReference:p?.provider_payment_id||o.stripe_payment_intent_id||''
      };
    });
  }

  async function loadEmailLogForAdmin(){
    const access=await requireRole(['admin','editor','sales','fulfilment']);
    if(!access.ok) throw new Error('Please sign in with an authorised staff account.');
    const sb=await client();
    const {data,error}=await sb.from('email_log').select('*').order('created_at',{ascending:false}).limit(500);
    if(error) throw new Error('email_log: '+error.message);
    return (data||[]).map(x=>({date:x.created_at,type:x.email_type,to:x.recipient,subject:x.subject||'',status:x.status,orderId:x.order_id||'',providerMessageId:x.provider_message_id||''}));
  }

  async function syncHomepageMedia(slot,media,index=0){
    const access=await requireRole(['admin','editor']);
    if(!access.ok) throw new Error('Please sign in with an Admin or Editor account.');
    const sb=await client();
    let {data:homeRows,error:homeErr}=await sb.from('pages').select('id').eq('handle','home').limit(1);
    if(homeErr) throw new Error('pages: '+homeErr.message);
    const homeId=homeRows?.[0]?.id;
    if(!homeId) throw new Error('Homepage record was not found.');
    const blockType=slot==='hero'?'hero':slot==='signature'?'featured_product':slot==='commitment'?'commitment':'lifestyle_grid';
    const {data:rows,error}=await sb.from('page_blocks').select('id,settings').eq('page_id',homeId).eq('block_type',blockType).limit(1);
    if(error) throw new Error('page_blocks: '+error.message);
    const row=rows?.[0];
    if(!row) throw new Error('Homepage '+blockType+' block was not found.');
    const settings={...(row.settings||{})};
    if(slot==='lifestyle'){
      const items=Array.isArray(settings.items)?[...settings.items]:[];
      while(items.length<=index) items.push({});
      items[index]=media||{};
      settings.items=items;
    }else{
      settings.media=media||{};
    }
    const {error:updateError}=await sb.from('page_blocks').update({settings}).eq('id',row.id);
    if(updateError) throw new Error('page_blocks: '+updateError.message);
    sessionStorage.removeItem(HYDRATED_KEY);
    return true;
  }

  window.ZBSupa = {client,authInfo,requireRole,hydrateSiteCache,loadLegacySite,syncSite,loadOrdersForUser,loadOrdersForAdmin,loadEmailLogForAdmin,uploadMedia,syncHomepageMedia};
})();
