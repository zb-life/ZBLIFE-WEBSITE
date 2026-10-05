const ZB_KEY='zb_editorial_v15';
const ZB_CART='zb_cart_v15';
const ZB_ORDERS='zb_orders_v15';
const ZB_SUBS='zb_subscriptions_v15';
const ZB_INVOICES='zb_invoices_v15';
const ZB_CUSTOMERS='zb_customers_v15';
const ZB_SESSION='zb_customer_session_v15';
const ZB_EMAIL_LOG='zb_email_log_v15';
const ZB_LOCALE='zb_locale_v15';
const ZB_MARKET='zb_market_v15';

const defaultVariants=[
  {id:'var-mint',name:'Mint',state:'Energising',price:88,sku:'ZB-RBW-MINT',color:'#a8cdb7',image:'assets/scent-mint.jpg',inventory:100,active:true},
  {id:'var-cucumber',name:'Cucumber',state:'Crisp',price:88,sku:'ZB-RBW-CUC',color:'#c3dbad',image:'assets/scent-cucumber.jpg',inventory:100,active:true},
  {id:'var-lavender',name:'Lavender',state:'Calming',price:88,sku:'ZB-RBW-LAV',color:'#cbb4d9',image:'assets/scent-lavender.jpg',inventory:100,active:true},
  {id:'var-rose',name:'Rose',state:'Romantic',price:88,sku:'ZB-RBW-ROSE',color:'#e0aeb7',image:'assets/scent-rose.jpg',inventory:100,active:true},
  {id:'var-amber',name:'Amber',state:'Warm',price:88,sku:'ZB-RBW-AMBER',color:'#c5966d',image:'assets/scent-amber.jpg',inventory:100,active:true},
  {id:'var-orange',name:'Orange',state:'Uplifting',price:88,sku:'ZB-RBW-ORG',color:'#e9a769',image:'assets/scent-orange.jpg',inventory:100,active:true}
];
const defaultProductMedia=[
  {type:'image',src:'assets/product-editorial.jpg',poster:'',alt:'Refreshing Body Wipes',autoplay:true,loop:true,controls:false},
  {type:'image',src:'assets/scent-mint.jpg',poster:'',alt:'Refreshing Body Wipes detail',autoplay:true,loop:true,controls:false},
  {type:'image',src:'assets/movement.jpg',poster:'',alt:'Refreshing Body Wipes in motion',autoplay:true,loop:true,controls:false}
];
const defaults={
  theme:{
    font:'Instrument Sans',bodySize:18,bg:'#f8f5ef',text:'#171717',surface:'#ffffff',softSurface:'#f0e7db',selectedFill:'#f6e3df',accent:'#d6a39a',button:'#1c1d1b',buttonText:'#ffffff',line:'#ded7ce'
  },
  branding:{logo:'',logoText:'ZIONBURG',mobileLogoText:'ZB',logoAlt:'ZIONBURG',logoWidth:132,mobileLogoWidth:44,favicon:'assets/favicon.svg'},
  shipping:{fee:30,threshold:300},
  nav:[
    {label:'Products',type:'products',visible:true},
    {label:'About',type:'link',href:'index.html#about',visible:true},
    {label:'Stockists',type:'link',href:'stockists.html',visible:true},
    {label:'Community',type:'link',href:'community.html',visible:true}
  ],
  homepage:{eyebrow:'PERFORMANCE MEETS WELLNESS',title:'CLEAN CARE\nFURTHER',subtitle:'Refresh your day. A cleaner tomorrow.'},
  homepageMedia:{
    hero:{type:'image',src:'assets/hero-editorial.jpg',poster:'',alt:'ZIONBURG performance wellness lifestyle',autoplay:true,loop:true,controls:false},
    signature:{type:'image',src:'assets/product-editorial.jpg',poster:'',alt:'ZIONBURG Refreshing Body Wipes',autoplay:true,loop:true,controls:false},
    lifestyle:[
      {type:'image',src:'assets/movement.jpg',poster:'',alt:'For movement',autoplay:true,loop:true,controls:false},
      {type:'image',src:'assets/travel.jpg',poster:'',alt:'For travel',autoplay:true,loop:true,controls:false},
      {type:'image',src:'assets/everyday.jpg',poster:'',alt:'For everyday',autoplay:true,loop:true,controls:false},
      {type:'image',src:'assets/nature.jpg',poster:'',alt:'For a cleaner tomorrow',autoplay:true,loop:true,controls:false}
    ],
    commitment:{type:'image',src:'assets/nature.jpg',poster:'',alt:'A cleaner tomorrow',autoplay:true,loop:true,controls:false}
  },
  benefits:[
    {title:'PLANT-BASED',subtitle:'100% plant fibre',icon:'assets/plant.svg'},
    {title:'ALCOHOL-FREE',subtitle:'Gentle on skin',icon:'assets/alcohol-free.svg'},
    {title:'INFUSED WITH VITAMIN E',subtitle:'Nourish & protect',icon:'assets/vitamin.svg'},
    {title:'INSTANTLY REFRESHING',subtitle:'Cools up to 3°C',icon:'assets/cooling.svg'}
  ],
  catalogProducts:[{
    id:'prod-refreshing-wipes',title:'Refreshing Body Wipes',handle:'refreshing-body-wipes',status:'active',vendor:'ZIONBURG',productType:'Body Care',description:'A portable body refresh designed for the moments between sweat and shower.',showInNav:true,subscriptionEligible:true,collectionIds:['col-body-refresh'],variants:defaultVariants,media:defaultProductMedia
  }],
  collections:[{
    id:'col-body-refresh',title:'Body Refresh',handle:'body-refresh',status:'active',description:'Refreshing essentials designed for movement, travel and everyday resets.',productIds:['prod-refreshing-wipes']
  }],
  subscriptions:{enabled:true,storefrontVisible:true,label:'Subscribe & save',discount:10,plans:[{label:'Every 4 weeks',value:'4-weeks'},{label:'Every 6 weeks',value:'6-weeks'},{label:'Every 8 weeks',value:'8-weeks'}]},
  features:{bundlesStorefrontVisible:false,customerAccounts:true},
  bundles:[
    {id:'bundle-single',name:'Single pack',qty:1,price:null,badge:'',active:true,scopeType:'product',scopeId:'prod-refreshing-wipes'},
    {id:'bundle-three',name:'3-pack',qty:3,price:230,badge:'SAVE 13%',active:true,scopeType:'product',scopeId:'prod-refreshing-wipes'},
    {id:'bundle-six',name:'6-pack',qty:6,price:430,badge:'BEST VALUE',active:true,scopeType:'product',scopeId:'prod-refreshing-wipes'}
  ],
  discounts:[{code:'WELCOME10',type:'percent',value:10,enabled:true}],
  pages:[{title:'Sustainability',slug:'sustainability',body:'Our approach centres on thoughtful materials, lower-impact choices and products designed to fit naturally into active routines.'}],
  stockists:[{name:'JOYPOLIS SPORTS HK',type:'Physical Store',country:'Hong Kong',region:'Kowloon',city:'Kai Tak',address:'Kai Tak, Hong Kong',url:'',active:true},{name:'Selected fitness & wellness partners',type:'Partner',country:'Hong Kong',region:'',city:'',address:'Hong Kong',url:'',active:true}],
  partners:[{name:'Training & wellness spaces',type:'Community partner',note:'Movement-led collaborations across Hong Kong.',image:'',imageFit:'cover',url:''}],
  friends:[{name:'Friends of ZB',type:'Creators & athletes',note:'A growing circle of people who move, recover and reset.',image:'',imageFit:'cover',url:''}],
  footer:{tagline:'PEOPLE. PERFORMANCE. A CLEANER TOMORROW.',links:[],socials:{instagram:'',tiktok:'',youtube:'',facebook:'',linkedin:''}},
  settings:{internalEmail:'',salesEmails:'',adminEmails:'',sendSalesOrder:true,sendSalesReceipt:true,receiptFromName:'ZB',receiptPrefix:'ZB'},
  localization:{
    defaultLocale:'en',
    languages:[
      {code:'en',label:'English',enabled:true},
      {code:'zh-HK',label:'繁體中文',enabled:true},
      {code:'zh-CN',label:'简体中文',enabled:false},
      {code:'ja',label:'日本語',enabled:false},
      {code:'ko',label:'한국어',enabled:false}
    ],
    contentTranslations:{
      'zh-HK':{heroEyebrow:'機能與健康生活',heroTitle:'潔淨護理\n走得更遠',heroSubtitle:'清爽每一天，邁向更潔淨的明天。',footerTagline:'人・表現・更潔淨的明天。'}
    },
    interfaceTranslations:{}
  },
  markets:{
    enabled:true,
    taxEngine:'manual',
    defaultMarketId:'hk',
    taxOnShipping:false,
    items:[
      {id:'hk',name:'Hong Kong',countries:['Hong Kong'],currency:'HKD',symbol:'HK$',fxRate:1,enabled:true,taxRate:0,shippingFee:30,freeShippingThreshold:300,deliveryEstimate:'2–4 business days'},
      {id:'us',name:'United States',countries:['United States'],currency:'USD',symbol:'US$',fxRate:0.128,enabled:false,taxRate:0,shippingFee:180,freeShippingThreshold:1200,deliveryEstimate:'5–12 business days'},
      {id:'sg',name:'Singapore',countries:['Singapore'],currency:'SGD',symbol:'S$',fxRate:0.166,enabled:false,taxRate:0,shippingFee:120,freeShippingThreshold:900,deliveryEstimate:'4–8 business days'},
      {id:'uk',name:'United Kingdom',countries:['United Kingdom'],currency:'GBP',symbol:'£',fxRate:0.096,enabled:false,taxRate:0,shippingFee:180,freeShippingThreshold:1200,deliveryEstimate:'5–12 business days'},
      {id:'au',name:'Australia',countries:['Australia'],currency:'AUD',symbol:'A$',fxRate:0.19,enabled:false,taxRate:0,shippingFee:160,freeShippingThreshold:1100,deliveryEstimate:'5–10 business days'},
      {id:'jp',name:'Japan',countries:['Japan'],currency:'JPY',symbol:'¥',fxRate:19.1,enabled:false,taxRate:0,shippingFee:140,freeShippingThreshold:1000,deliveryEstimate:'4–9 business days'},
      {id:'cn',name:'Mainland China',countries:['China'],currency:'CNY',symbol:'¥',fxRate:0.92,enabled:false,taxRate:0,shippingFee:100,freeShippingThreshold:800,deliveryEstimate:'3–8 business days'},
      {id:'row',name:'Rest of world',countries:['Other'],currency:'USD',symbol:'US$',fxRate:0.128,enabled:false,taxRate:0,shippingFee:220,freeShippingThreshold:1500,deliveryEstimate:'7–14 business days'}
    ]
  }
};

function mediaBool(v,fallback=false){return v===undefined?fallback:!!v}
function youtubeId(url=''){const s=String(url);const m=s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);return m?m[1]:''}
function mediaHTML(item,opts={}){
  const m=item||{},src=String(m.src||''),poster=String(m.poster||''),alt=String(m.alt||'');
  const escAttr=v=>String(v||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  if(!src)return `<div class="media-empty">MEDIA NOT SET</div>`;
  if(m.type==='youtube'){
    const id=youtubeId(src);if(!id)return `<div class="media-empty">INVALID YOUTUBE LINK</div>`;
    const autoplay=mediaBool(m.autoplay,true)?1:0,controls=mediaBool(m.controls,false)?1:0,loop=mediaBool(m.loop,true)?1:0;
    const params=`autoplay=${autoplay}&mute=1&controls=${controls}&playsinline=1&rel=0${loop?`&loop=1&playlist=${id}`:''}`;
    return `<iframe class="managed-media managed-youtube" src="https://www.youtube.com/embed/${id}?${params}" title="${escAttr(alt||'ZIONBURG video')}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  }
  if(m.type==='video'){
    const autoplay=mediaBool(m.autoplay,true),loop=mediaBool(m.loop,true),controls=mediaBool(m.controls,false);
    return `<video class="managed-media" src="${escAttr(src)}" ${poster?`poster="${escAttr(poster)}"`:''} ${autoplay?'autoplay':''} ${loop?'loop':''} ${controls?'controls':''} muted playsinline preload="metadata" aria-label="${escAttr(alt)}"></video>`;
  }
  return `<img class="managed-media" src="${escAttr(src)}" alt="${escAttr(alt)}">`;
}
function renderMediaInto(host,item){if(host)host.innerHTML=mediaHTML(item)}

function seedStarterContentTranslations(raw){
  const locale='zh-HK',ensure=(obj,field,value)=>{if(!obj)return;obj.translations=obj.translations||{};obj.translations[locale]=obj.translations[locale]||{};if(!String(obj.translations[locale][field]||'').trim())obj.translations[locale][field]=value};
  const p=(raw.catalogProducts||[]).find(x=>x.id==='prod-refreshing-wipes'||x.handle==='refreshing-body-wipes');
  if(p&&p.title==='Refreshing Body Wipes'){
    ensure(p,'title','清爽身體濕巾');ensure(p,'description','為運動出汗與下一個行程之間而設的便攜式身體清爽護理。');
    const vm={
      'var-mint':['薄荷','醒神'],'var-cucumber':['青瓜','清新'],'var-lavender':['薰衣草','舒緩'],
      'var-rose':['玫瑰','浪漫'],'var-amber':['琥珀','溫暖'],'var-orange':['橙香','提振']
    };
    (p.variants||[]).forEach(v=>{const t=vm[v.id];if(t){ensure(v,'name',t[0]);ensure(v,'state',t[1])}});
  }
  const c=(raw.collections||[]).find(x=>x.id==='col-body-refresh'||x.handle==='body-refresh');
  if(c&&c.title==='Body Refresh'){ensure(c,'title','身體清爽');ensure(c,'description','為運動、旅行及日常重整而設的清爽護理系列。')}
  const navMap={Products:'產品',About:'關於我們',Stockists:'零售點',Community:'社群'};
  (raw.nav||[]).forEach(x=>{if(navMap[x.label])ensure(x,'label',navMap[x.label])});
  const benefitMap={
    'PLANT-BASED':['植物纖維','100% 植物纖維'],
    'ALCOHOL-FREE':['不含酒精','溫和親膚'],
    'INFUSED WITH VITAMIN E':['蘊含維他命 E','滋養並呵護肌膚'],
    'INSTANTLY REFRESHING':['即時清爽','清涼感可降溫達 3°C']
  };
  (raw.benefits||[]).forEach(x=>{const t=benefitMap[x.title];if(t){ensure(x,'title',t[0]);ensure(x,'subtitle',t[1])}});
  (raw.pages||[]).forEach(x=>{if(x.slug==='sustainability'&&x.title==='Sustainability'){ensure(x,'title','可持續理念');ensure(x,'body','我們著重更周全的物料選擇、較低環境負擔，以及能自然融入活躍生活的產品設計。')}});
  (raw.partners||[]).forEach(x=>{if(x.name==='Training & wellness spaces'){ensure(x,'name','運動及健康生活空間');ensure(x,'note','與香港不同運動及健康生活空間展開合作。')}});
  (raw.friends||[]).forEach(x=>{if(x.name==='Friends of ZB'){ensure(x,'name','ZB 朋友');ensure(x,'note','由熱愛運動、恢復與日常重整的人組成，持續成長的 ZB 社群。')}});
  return raw;
}
function clone(v){return JSON.parse(JSON.stringify(v))}
function deepMerge(base,extra){if(Array.isArray(base))return Array.isArray(extra)?extra:clone(base);if(base&&typeof base==='object'){const out={...base};Object.keys(extra||{}).forEach(k=>out[k]=k in base?deepMerge(base[k],extra[k]):extra[k]);return out}return extra===undefined?base:extra}
function migrateRaw(raw){raw=raw&&typeof raw==='object'?raw:{};
  if(!Array.isArray(raw.catalogProducts)){
    const variants=Array.isArray(raw.products)&&raw.products.length?raw.products:clone(defaultVariants);
    const media=Array.isArray(raw.productMedia)&&raw.productMedia.length?raw.productMedia:clone(defaultProductMedia);
    raw.catalogProducts=[{...clone(defaults.catalogProducts[0]),variants,media}];
  }
  if(!Array.isArray(raw.collections))raw.collections=clone(defaults.collections);
  if(Array.isArray(raw.bundles))raw.bundles=raw.bundles.map((b,i)=>({id:b.id||`bundle-${i}-${Date.now()}`,active:b.active!==false,scopeType:b.scopeType||'product',scopeId:b.scopeId||raw.catalogProducts[0]?.id||'prod-refreshing-wipes',...b}));
  if(raw.subscriptions){raw.subscriptions.enabled=true;if(raw.subscriptions.storefrontVisible===undefined)raw.subscriptions.storefrontVisible=true;}
  if(!raw.features)raw.features={bundlesStorefrontVisible:false,customerAccounts:true};
  if(!raw._v156Migrated&&Array.isArray(raw.nav)){raw.nav=raw.nav.filter(n=>!(String(n.label||'').toLowerCase()==='bundles'&&String(n.href||'').includes('#bundles')));raw._v156Migrated=true;}
  if(Array.isArray(raw.stockists))raw.stockists=raw.stockists.map(x=>({country:x.country||((x.address||'').toLowerCase().includes('hong kong')?'Hong Kong':''),region:x.region||'',city:x.city||'',active:x.active!==false,...x}));
  if(!raw.footer)raw.footer=clone(defaults.footer);
  if(!raw.localization)raw.localization=clone(defaults.localization);
  if(!raw.markets)raw.markets=clone(defaults.markets);
  if(!raw._v1512TypeMigrated){raw.theme=raw.theme||{};if(Number(raw.theme.bodySize||0)<18)raw.theme.bodySize=18;raw._v1512TypeMigrated=true;}
  if(raw.settings&&!raw.settings.salesEmails&&raw.settings.internalEmail)raw.settings.salesEmails=raw.settings.internalEmail;
  seedStarterContentTranslations(raw);
  return raw
}
function getSite(){try{const raw=migrateRaw(JSON.parse(localStorage.getItem(ZB_KEY)||'{}'));const out=deepMerge(defaults,raw);const primary=getPrimaryCatalogProduct(out);out.products=primary?primary.variants:clone(defaultVariants);out.productMedia=primary?primary.media:clone(defaultProductMedia);return out}catch{return clone(defaults)}}
function saveSite(v){localStorage.setItem(ZB_KEY,JSON.stringify(v));window.dispatchEvent(new Event('zb:site-updated'));if(window.ZBSupa&&storefrontTranslationEditActive?.()){ZBSupa.syncSite(v).catch(e=>console.warn('Supabase publish skipped:',e.message))}}
function currentLocale(){const site=getSite(),enabled=(site.localization?.languages||[]).filter(x=>x.enabled!==false);const saved=localStorage.getItem(ZB_LOCALE);return enabled.some(x=>x.code===saved)?saved:(site.localization?.defaultLocale||enabled[0]?.code||'en')}
function setLocale(code){localStorage.setItem(ZB_LOCALE,code)}
function currentMarket(site=getSite()){const enabled=(site.markets?.items||[]).filter(x=>x.enabled!==false);const saved=localStorage.getItem(ZB_MARKET);return enabled.find(x=>x.id===saved)||enabled.find(x=>x.id===site.markets?.defaultMarketId)||enabled[0]||{id:'hk',name:'Hong Kong',countries:['Hong Kong'],currency:'HKD',symbol:'HK$',fxRate:1,shippingFee:site.shipping?.fee||30,freeShippingThreshold:site.shipping?.threshold||300,taxRate:0}}
function setMarket(id){localStorage.setItem(ZB_MARKET,id)}
function marketForCountry(country,site=getSite()){const enabled=(site.markets?.items||[]).filter(x=>x.enabled!==false);return enabled.find(m=>(m.countries||[]).includes(country))||enabled.find(m=>(m.countries||[]).includes('Other'))||currentMarket(site)}
function localize(obj,field){const locale=currentLocale();return obj?.translations?.[locale]?.[field]||obj?.[field]||''}
const uiPhraseCatalog=[{"group":"Navigation","key":"products","en":"Products"},{"group":"Navigation","key":"about","en":"About"},{"group":"Navigation","key":"stockists","en":"Stockists"},{"group":"Navigation","key":"community","en":"Community"},{"group":"Navigation","key":"account","en":"Account"},{"group":"Navigation","key":"bag","en":"Bag"},{"group":"Navigation","key":"menu","en":"Menu"},{"group":"Navigation","key":"close","en":"Close"},{"group":"Navigation","key":"checkout","en":"Checkout"},{"group":"Navigation","key":"language","en":"Language"},{"group":"Navigation","key":"market","en":"Market"},{"group":"Navigation","key":"viewAll","en":"View all"},{"group":"Navigation","key":"learnMore","en":"Learn more"},{"group":"Navigation","key":"shopNow","en":"Shop now"},{"group":"Navigation","key":"exploreProducts","en":"Explore products"},{"group":"Navigation","key":"visit","en":"Visit"},{"group":"Navigation","key":"visitStore","en":"Visit store"},{"group":"Navigation","key":"backToStore","en":"Back to store"},{"group":"Cart & checkout","key":"yourBag","en":"Your bag"},{"group":"Cart & checkout","key":"subtotal","en":"Subtotal"},{"group":"Cart & checkout","key":"shipping","en":"Shipping"},{"group":"Cart & checkout","key":"tax","en":"Tax"},{"group":"Cart & checkout","key":"total","en":"Total"},{"group":"Cart & checkout","key":"freeDelivery","en":"Free delivery"},{"group":"Cart & checkout","key":"shippingCalculated","en":"Shipping calculated at checkout."},{"group":"Cart & checkout","key":"secureCheckout","en":"Secure checkout"},{"group":"Cart & checkout","key":"yourDetails","en":"Your details"},{"group":"Cart & checkout","key":"contactInformation","en":"Contact information"},{"group":"Cart & checkout","key":"shippingAddress","en":"Shipping address"},{"group":"Cart & checkout","key":"shippingMethod","en":"Shipping method"},{"group":"Cart & checkout","key":"standardDelivery","en":"Standard Delivery"},{"group":"Cart & checkout","key":"businessDays24","en":"2–4 business days"},{"group":"Cart & checkout","key":"securePayment","en":"Secure payment"},{"group":"Cart & checkout","key":"stripePaymentArea","en":"Stripe payment area"},{"group":"Cart & checkout","key":"prototypePayment","en":"Prototype payment only. The live integration can mount Stripe Checkout / Payment Element here."},{"group":"Cart & checkout","key":"placeTestOrder","en":"Place test order"},{"group":"Cart & checkout","key":"orderSummary","en":"Order summary"},{"group":"Cart & checkout","key":"discount","en":"Discount"},{"group":"Cart & checkout","key":"discountCode","en":"Discount code"},{"group":"Cart & checkout","key":"apply","en":"Apply"},{"group":"Cart & checkout","key":"codeNotFound","en":"Code not found."},{"group":"Cart & checkout","key":"bagEmpty","en":"Your bag is empty."},{"group":"Cart & checkout","key":"deliveryTiming","en":"Delivery timing shown at checkout"},{"group":"Cart & checkout","key":"signedInAs","en":"Signed in as"},{"group":"Cart & checkout","key":"viewAccount","en":"View account"},{"group":"Cart & checkout","key":"alreadyAccount","en":"Already have an account?"},{"group":"Cart & checkout","key":"signInBeforeCheckout","en":"Sign in before checkout."},{"group":"Home","key":"performanceWellness","en":"Performance meets wellness"},{"group":"Home","key":"cleanCareFurther","en":"Clean care further"},{"group":"Home","key":"refreshDayTomorrow","en":"Refresh your day. A cleaner tomorrow."},{"group":"Home","key":"plantBased","en":"Plant-based"},{"group":"Home","key":"plantFibre100","en":"100% plant fibre"},{"group":"Home","key":"alcoholFree","en":"Alcohol-free"},{"group":"Home","key":"gentleSkin","en":"Gentle on skin"},{"group":"Home","key":"vitaminEInfused","en":"Infused with Vitamin E"},{"group":"Home","key":"nourishProtect","en":"Nourish & protect"},{"group":"Home","key":"instantlyRefreshing","en":"Instantly refreshing"},{"group":"Home","key":"cools3","en":"Cools up to 3°C"},{"group":"Home","key":"ourSignature","en":"Our signature"},{"group":"Home","key":"refreshingBodyWipes","en":"Refreshing Body Wipes"},{"group":"Home","key":"premiumWipeDesc","en":"A premium, plant-based body wipe designed for modern lifestyles. Gentle, effective, and refreshing — anytime, anywhere."},{"group":"Home","key":"purify","en":"Purify"},{"group":"Home","key":"cleanseNoIrritation","en":"Effectively cleanses without irritation"},{"group":"Home","key":"refresh","en":"Refresh"},{"group":"Home","key":"cooling3","en":"Cooling sensation up to 3°C"},{"group":"Home","key":"nourish","en":"Nourish"},{"group":"Home","key":"withVitaminE","en":"With Vitamin E"},{"group":"Home","key":"betterTomorrow","en":"For a better tomorrow"},{"group":"Home","key":"forMovement","en":"For movement"},{"group":"Home","key":"stayFreshWorkout","en":"Stay fresh through every workout and beyond."},{"group":"Home","key":"forTravel","en":"For travel"},{"group":"Home","key":"cleanCompanion","en":"A clean companion, wherever you go."},{"group":"Home","key":"forEveryday","en":"For everyday"},{"group":"Home","key":"refreshResetRepeat","en":"Refresh, reset, repeat."},{"group":"Home","key":"cleanerTomorrow","en":"For a cleaner tomorrow"},{"group":"Home","key":"smallChoices","en":"Small choices make a bigger impact."},{"group":"Home","key":"ourSustainability","en":"Our sustainability"},{"group":"Home","key":"scentForEveryYou","en":"A scent for every you"},{"group":"Home","key":"discoverScents","en":"Discover our scents"},{"group":"Home","key":"elevateEveryday","en":"Elevate your everyday with refreshing scents inspired by nature."},{"group":"Home","key":"exploreAllScents","en":"Explore all scents"},{"group":"Home","key":"ourCommitment","en":"Our commitment"},{"group":"Home","key":"cleanerBodies","en":"Cleaner bodies."},{"group":"Home","key":"brighterDays","en":"Brighter days."},{"group":"Home","key":"commitmentBody","en":"We create high-performance, low-impact personal care products for a cleaner, healthier and more active world."},{"group":"Product","key":"zbSignature","en":"ZB Signature"},{"group":"Product","key":"chooseScent","en":"Choose your scent"},{"group":"Product","key":"sixScents","en":"6 scents"},{"group":"Product","key":"choosePack","en":"Choose your pack"},{"group":"Product","key":"bundleSave","en":"Bundle & save"},{"group":"Product","key":"purchaseOption","en":"Purchase option"},{"group":"Product","key":"deliver","en":"Deliver"},{"group":"Product","key":"addToBag","en":"Add to bag"},{"group":"Product","key":"plantBasedFibre","en":"Plant-based fibre"},{"group":"Product","key":"theReset","en":"The reset"},{"group":"Product","key":"resetCopy","en":"Made for post-workout, running, hot-weather refresh moments and everyday movement."},{"group":"Product","key":"howToUse","en":"How to use"},{"group":"Product","key":"howToUseCopy","en":"Unfold, refresh where needed, and dispose after use. Ideal when a shower is not immediately available."},{"group":"Product","key":"productDetails","en":"Product details"},{"group":"Product","key":"productDetailsCopy","en":"32 × 28 cm body wipes made with 100% plant fibre, alcohol-free and enriched with Vitamin E."},{"group":"Product","key":"feelsLike","en":"Feels like"},{"group":"Product","key":"madeFor","en":"Made for"},{"group":"Product","key":"mood","en":"Mood"},{"group":"Product","key":"state","en":"State"},{"group":"Product","key":"betweenSweat","en":"Between sweat + shower"},{"group":"Product","key":"everydayReset","en":"The everyday reset"},{"group":"Product","key":"inBetweenRitual","en":"The in-between is the ritual."},{"group":"Product","key":"ritualBody","en":"Not every reset needs a full routine. ZB is designed for the gap between movement and your next plan — a small, easy refresh that keeps pace with the day."},{"group":"Product","key":"exploreZB","en":"Explore ZB"},{"group":"Product","key":"yourNextState","en":"Your next state"},{"group":"Product","key":"findScent","en":"Find your scent"},{"group":"Product","key":"single","en":"Single"},{"group":"Product","key":"singlePack","en":"Single pack"},{"group":"Product","key":"subscribeSave","en":"Subscribe & save"},{"group":"Product","key":"oneTime","en":"One-time"},{"group":"Product","key":"oneTimePurchase","en":"One-time purchase"},{"group":"Product","key":"option","en":"Option"},{"group":"Product","key":"every4Weeks","en":"Every 4 weeks"},{"group":"Product","key":"every6Weeks","en":"Every 6 weeks"},{"group":"Product","key":"every8Weeks","en":"Every 8 weeks"},{"group":"Account","key":"yourZB","en":"Your ZB"},{"group":"Account","key":"signIn","en":"Sign in"},{"group":"Account","key":"createAccount","en":"Create account"},{"group":"Account","key":"accountIntro","en":"Sign in to see your orders and saved details, or create an account when you are ready."},{"group":"Account","key":"welcomeBack","en":"Welcome back"},{"group":"Account","key":"loginHelp","en":"Use the email and password linked to your ZB account."},{"group":"Account","key":"email","en":"Email"},{"group":"Account","key":"password","en":"Password"},{"group":"Account","key":"forgotPassword","en":"Forgot password?"},{"group":"Account","key":"newToZB","en":"New to ZB?"},{"group":"Account","key":"passwordHelp","en":"Password help"},{"group":"Account","key":"resetPassword","en":"Reset your password"},{"group":"Account","key":"resetInstructions","en":"Enter the email linked to your ZB account. In the live store, we’ll email you a secure password-reset link."},{"group":"Account","key":"sendReset","en":"Send reset link"},{"group":"Account","key":"backSignIn","en":"Back to sign in"},{"group":"Account","key":"joinZB","en":"Join ZB"},{"group":"Account","key":"createAccountHelp","en":"Create an account with the same email you use at checkout so your orders can appear here automatically."},{"group":"Account","key":"name","en":"Name"},{"group":"Account","key":"confirmPassword","en":"Confirm password"},{"group":"Account","key":"alreadyHave","en":"Already have an account?"},{"group":"Account","key":"prototypeAccountNote","en":"Prototype note: account data is stored only in this browser. The production store should use secure server-side authentication and password recovery."},{"group":"Account","key":"logout","en":"Log out"},{"group":"Account","key":"profile","en":"Profile"},{"group":"Account","key":"orderHistory","en":"Order history"},{"group":"Account","key":"noOrders","en":"No orders yet. Orders placed with this email will appear here."},{"group":"Account","key":"accountsHidden","en":"Accounts are currently hidden."},{"group":"Account","key":"guestContinue","en":"You can continue shopping and checking out as a guest."},{"group":"Account","key":"emailPasswordError","en":"Email or password not recognised."},{"group":"Account","key":"passwordMismatch","en":"The passwords do not match."},{"group":"Account","key":"accountExists","en":"An account already exists for this email. Sign in instead."},{"group":"Stockists","key":"findZB","en":"Find ZB"},{"group":"Stockists","key":"stockistsIntro","en":"Discover ZIONBURG through selected retail, movement and wellness partners."},{"group":"Stockists","key":"countryMarket","en":"Country / market"},{"group":"Stockists","key":"allCountries","en":"All countries"},{"group":"Stockists","key":"storeType","en":"Store type"},{"group":"Stockists","key":"allTypes","en":"All types"},{"group":"Stockists","key":"noStockists","en":"No stockists match these filters."},{"group":"Stockists","key":"physicalStore","en":"Physical Store"},{"group":"Stockists","key":"onlineStore","en":"Online Store"},{"group":"Stockists","key":"tiktokShop","en":"TikTok Shop"},{"group":"Stockists","key":"marketplace","en":"Marketplace"},{"group":"Stockists","key":"distributor","en":"Distributor"},{"group":"Stockists","key":"popup","en":"Pop-up"},{"group":"Stockists","key":"partner","en":"Partner"},{"group":"Community","key":"moveTogether","en":"Move together"},{"group":"Community","key":"communityIntro","en":"Spaces, people and partnerships that make active everyday life feel more connected."},{"group":"Community","key":"communityPartners","en":"Community partners"},{"group":"Community","key":"friendsZB","en":"Friends of ZB"},{"group":"Community","key":"communityPartner","en":"Community partner"},{"group":"Community","key":"creatorsAthletes","en":"Creators & athletes"},{"group":"Collection","key":"collection","en":"Collection"},{"group":"Collection","key":"bodyRefresh","en":"Body Refresh"},{"group":"Collection","key":"noProducts","en":"No active products in this collection yet."},{"group":"Generic","key":"page","en":"Page"},{"group":"Generic","key":"pageNotFound","en":"Page not found"},{"group":"Generic","key":"pageNotCreated","en":"This page has not been created in the admin panel yet."},{"group":"Generic","key":"hongKong","en":"Hong Kong"},{"group":"Generic","key":"customer","en":"Customer"},{"group":"Generic","key":"remove","en":"Remove"},{"group":"Generic","key":"active","en":"Active"},{"group":"Product","key":"mint","en":"Mint"},{"group":"Product","key":"cucumber","en":"Cucumber"},{"group":"Product","key":"lavender","en":"Lavender"},{"group":"Product","key":"rose","en":"Rose"},{"group":"Product","key":"amber","en":"Amber"},{"group":"Product","key":"orange","en":"Orange"},{"group":"Product","key":"energising","en":"Energising"},{"group":"Product","key":"crisp","en":"Crisp"},{"group":"Product","key":"calming","en":"Calming"},{"group":"Product","key":"romantic","en":"Romantic"},{"group":"Product","key":"warm","en":"Warm"},{"group":"Product","key":"uplifting","en":"Uplifting"},{"group":"Product","key":"coolCrisp","en":"Cool + crisp"},{"group":"Product","key":"freshClean","en":"Fresh + clean"},{"group":"Product","key":"softCalm","en":"Soft + calm"},{"group":"Product","key":"softFloral","en":"Soft + floral"},{"group":"Product","key":"warmGrounded","en":"Warm + grounded"},{"group":"Product","key":"brightZesty","en":"Bright + zesty"},{"group":"Product","key":"postMovementReset","en":"Your cool, crisp post-movement reset."},{"group":"Product","key":"freshEverydayReset","en":"Your fresh, clean everyday reset."},{"group":"Product","key":"calmWindDownReset","en":"Your soft, calm wind-down reset."},{"group":"Product","key":"floralOnTheGoReset","en":"Your soft, floral on-the-go reset."},{"group":"Product","key":"warmRecoveryReset","en":"Your warm, grounded recovery reset."},{"group":"Product","key":"brightEnergyReset","en":"Your bright, zesty energy reset."},{"group":"Product","key":"coolingReset","en":"A clean, cooling reset after movement."},{"group":"Product","key":"trainingDays","en":"Training days, warm commutes and whatever comes next."},{"group":"Product","key":"coolCrispRevived","en":"Cool • Crisp • Revived"},{"group":"Product","key":"reset","en":"Reset"},{"group":"Product","key":"lightCrisp","en":"Light, crisp and clean without feeling heavy."},{"group":"Product","key":"warmDays","en":"Warm days, commutes, travel and daily refreshes."},{"group":"Product","key":"freshCleanEasy","en":"Fresh • Clean • Easy"},{"group":"Product","key":"unwind","en":"Unwind"},{"group":"Product","key":"glow","en":"Glow"},{"group":"Product","key":"recover","en":"Recover"},{"group":"Product","key":"energise","en":"Energise"},{"group":"Navigation","key":"connect","en":"Connect"},{"group":"Cart & checkout","key":"emailAddress","en":"Email address"},{"group":"Cart & checkout","key":"firstName","en":"First name"},{"group":"Cart & checkout","key":"lastName","en":"Last name"},{"group":"Cart & checkout","key":"phoneOptional","en":"Phone number"},{"group":"Cart & checkout","key":"address","en":"Address"},{"group":"Cart & checkout","key":"apartmentOptional","en":"Apartment, suite, etc. (optional)"},{"group":"Cart & checkout","key":"postalOptional","en":"Postal code"},{"group":"Cart & checkout","key":"totalPaid","en":"Total paid"},{"group":"Cart & checkout","key":"orderReceipt","en":"Order receipt"},{"group":"Cart & checkout","key":"orderNotFound","en":"Order not found"},{"group":"Cart & checkout","key":"invoiceNotFound","en":"Invoice not found"},{"group":"Cart & checkout","key":"customInvoice","en":"Custom invoice"},{"group":"Cart & checkout","key":"prototypeReceipt","en":"Prototype receipt — no live payment was processed."},{"group":"Cart & checkout","key":"prototypePaymentLink","en":"Prototype payment link. A live build would redirect to or embed Stripe here."},{"group":"Cart & checkout","key":"paymentRecorded","en":"Payment recorded in this prototype."},{"group":"Cart & checkout","key":"pay","en":"Pay"},{"group":"Generic","key":"fulfilled","en":"Fulfilled"},{"group":"Generic","key":"unfulfilled","en":"Unfulfilled"},{"group":"Generic","key":"paidTest","en":"Paid (test)"},{"group":"Generic","key":"other","en":"Other"},{"group":"Generic","key":"noCountries","en":"No countries"},{"group":"Generic","key":"newMarket","en":"New market"},{"group":"Home","key":"refreshingWord","en":"Refreshing"},{"group":"Home","key":"bodyWipes","en":"Body wipes"},{"group":"Home","key":"discover","en":"Discover"},{"group":"Home","key":"ourScents","en":"Our scents"},{"group":"Product","key":"meet","en":"Meet"},{"group":"Product","key":"inBetween","en":"The in-between"},{"group":"Product","key":"isRitual","en":"Is the ritual."}];
const defaultUiTranslations={"zh-HK":{"products":"產品","about":"關於我們","stockists":"零售點","community":"社群","account":"帳戶","bag":"購物袋","menu":"選單","close":"關閉","checkout":"結帳","language":"語言","market":"地區","viewAll":"查看全部","learnMore":"了解更多","shopNow":"立即選購","exploreProducts":"探索產品","visit":"前往","visitStore":"前往商店","backToStore":"返回商店","yourBag":"你的購物袋","subtotal":"小計","shipping":"運費","tax":"稅項","total":"總計","freeDelivery":"免運費","shippingCalculated":"運費將於結帳時計算。","secureCheckout":"安全結帳","yourDetails":"你的資料","contactInformation":"聯絡資料","shippingAddress":"送貨地址","shippingMethod":"送貨方式","standardDelivery":"標準配送","businessDays24":"2–4 個工作天","securePayment":"安全付款","stripePaymentArea":"Stripe 付款區域","prototypePayment":"此為原型付款流程。正式網站可在此整合 Stripe Checkout／Payment Element。","placeTestOrder":"提交測試訂單","orderSummary":"訂單摘要","discount":"折扣","discountCode":"折扣碼","apply":"套用","codeNotFound":"找不到此折扣碼。","bagEmpty":"你的購物袋是空的。","deliveryTiming":"配送時間將於結帳時顯示","signedInAs":"已登入","viewAccount":"查看帳戶","alreadyAccount":"已經有帳戶？","signInBeforeCheckout":"結帳前先登入。","performanceWellness":"機能與健康生活","cleanCareFurther":"潔淨護理・走得更遠","refreshDayTomorrow":"清爽每一天，邁向更潔淨的明天。","plantBased":"植物纖維","plantFibre100":"100% 植物纖維","alcoholFree":"不含酒精","gentleSkin":"溫和親膚","vitaminEInfused":"蘊含維他命 E","nourishProtect":"滋養並呵護肌膚","instantlyRefreshing":"即時清爽","cools3":"清涼感可降溫達 3°C","ourSignature":"招牌產品","refreshingBodyWipes":"清爽身體濕巾","premiumWipeDesc":"為現代生活而設的高質植物纖維身體濕巾。溫和、有效、隨時隨地保持清爽。","purify":"潔淨","cleanseNoIrritation":"有效潔淨，同時保持溫和","refresh":"清爽","cooling3":"清涼感可降溫達 3°C","nourish":"滋養","withVitaminE":"蘊含維他命 E","betterTomorrow":"為更好的明天","forMovement":"為運動而設","stayFreshWorkout":"從運動到下一個行程，都保持清爽。","forTravel":"旅行隨行","cleanCompanion":"無論去哪裡，都是你的清爽伙伴。","forEveryday":"日常使用","refreshResetRepeat":"清爽、重整、再出發。","cleanerTomorrow":"為更潔淨的明天","smallChoices":"小小選擇，也能帶來更大改變。","ourSustainability":"可持續理念","scentForEveryYou":"每個你，都有適合的香氣","discoverScents":"探索香氣","elevateEveryday":"以源自自然的清新香氣，提升每一天。","exploreAllScents":"探索所有香氣","ourCommitment":"我們的承諾","cleanerBodies":"潔淨身體。","brighterDays":"明亮每一天。","commitmentBody":"我們以高效、低負擔的個人護理產品，支持更潔淨、更健康、更活躍的生活。","zbSignature":"ZB 招牌系列","chooseScent":"選擇香味","sixScents":"6 款香味","choosePack":"選擇組合","bundleSave":"組合更優惠","purchaseOption":"購買方式","deliver":"配送","addToBag":"加入購物袋","plantBasedFibre":"植物纖維","theReset":"清爽重整","resetCopy":"適合運動後、跑步後、炎熱天氣，以及日常活動後快速清爽。","howToUse":"使用方法","howToUseCopy":"展開濕巾，擦拭需要清爽的部位，使用後棄置。適合無法立即洗澡的時刻。","productDetails":"產品詳情","productDetailsCopy":"32 × 28 厘米身體濕巾，採用 100% 植物纖維，不含酒精，並添加維他命 E。","feelsLike":"感覺","madeFor":"適合","mood":"氛圍","state":"狀態","betweenSweat":"運動出汗與洗澡之間","everydayReset":"每日清爽重整","inBetweenRitual":"空檔時刻，也是一種日常儀式。","ritualBody":"不是每次重整都需要完整程序。ZB 專為運動與下一個行程之間的空檔而設，簡單快速地跟上你的生活節奏。","exploreZB":"探索 ZB","yourNextState":"下一個狀態","findScent":"找到你的香氣","single":"單件","singlePack":"單件裝","subscribeSave":"訂閱優惠","oneTime":"單次購買","oneTimePurchase":"單次購買","option":"選項","every4Weeks":"每 4 星期","every6Weeks":"每 6 星期","every8Weeks":"每 8 星期","yourZB":"你的 ZB","signIn":"登入","createAccount":"建立帳戶","accountIntro":"登入後可查看訂單與已儲存資料，亦可隨時建立新帳戶。","welcomeBack":"歡迎回來","loginHelp":"使用與 ZB 帳戶連結的電郵地址及密碼登入。","email":"電郵","password":"密碼","forgotPassword":"忘記密碼？","newToZB":"第一次使用 ZB？","passwordHelp":"密碼協助","resetPassword":"重設密碼","resetInstructions":"輸入與 ZB 帳戶連結的電郵地址。正式網站會向你發送安全的密碼重設連結。","sendReset":"發送重設連結","backSignIn":"返回登入","joinZB":"加入 ZB","createAccountHelp":"使用結帳時相同的電郵建立帳戶，你的訂單便可自動顯示在這裡。","name":"姓名","confirmPassword":"確認密碼","alreadyHave":"已經有帳戶？","prototypeAccountNote":"原型提示：帳戶資料目前只儲存在此瀏覽器。正式網站應使用安全的伺服器端驗證及密碼復原。","logout":"登出","profile":"個人資料","orderHistory":"訂單紀錄","noOrders":"暫時未有訂單。使用此電郵下單後，訂單會顯示在這裡。","accountsHidden":"帳戶功能目前已隱藏。","guestContinue":"你仍可訪客身份繼續購物及結帳。","emailPasswordError":"電郵或密碼不正確。","passwordMismatch":"兩次輸入的密碼不一致。","accountExists":"此電郵已建立帳戶，請直接登入。","findZB":"尋找 ZB","stockistsIntro":"於精選零售、運動及健康生活伙伴找到 ZIONBURG。","countryMarket":"國家／市場","allCountries":"所有地區","storeType":"商店類型","allTypes":"所有類型","noStockists":"沒有符合篩選條件的零售點。","physicalStore":"實體店","onlineStore":"網上商店","tiktokShop":"TikTok 商店","marketplace":"網上平台","distributor":"分銷商","popup":"期間限定店","partner":"合作伙伴","moveTogether":"一起行動","communityIntro":"連結空間、人與合作伙伴，讓活躍日常更有連繫。","communityPartners":"社群伙伴","friendsZB":"ZB 朋友","communityPartner":"社群伙伴","creatorsAthletes":"創作者與運動人士","collection":"系列","bodyRefresh":"身體清爽","noProducts":"此系列暫時未有上架產品。","page":"頁面","pageNotFound":"找不到頁面","pageNotCreated":"此頁面尚未在管理後台建立。","hongKong":"香港","customer":"顧客","remove":"移除","active":"啟用","mint":"薄荷","cucumber":"青瓜","lavender":"薰衣草","rose":"玫瑰","amber":"琥珀","orange":"橙香","energising":"醒神","crisp":"清新","calming":"舒緩","romantic":"浪漫","warm":"溫暖","uplifting":"提振","coolCrisp":"清涼・爽脆","freshClean":"清新・潔淨","softCalm":"柔和・平靜","softFloral":"柔和・花香","warmGrounded":"溫暖・沉穩","brightZesty":"明亮・活力","postMovementReset":"運動後清涼爽脆的重整時刻。","freshEverydayReset":"每日清新潔淨的重整時刻。","calmWindDownReset":"柔和舒緩的放鬆重整。","floralOnTheGoReset":"外出時柔和花香的清爽重整。","warmRecoveryReset":"溫暖沉穩的恢復重整。","brightEnergyReset":"明亮有活力的醒神重整。","coolingReset":"運動後潔淨清涼的快速重整。","trainingDays":"適合訓練日、炎熱通勤，以及接下來的每個行程。","coolCrispRevived":"清涼 • 爽脆 • 重拾精神","reset":"重整","lightCrisp":"輕盈、清新、潔淨，不感厚重。","warmDays":"適合炎熱日子、通勤、旅行及日常清爽。","freshCleanEasy":"清新 • 潔淨 • 輕鬆","unwind":"放鬆","glow":"煥亮","recover":"恢復","energise":"醒神","connect":"聯絡我們","emailAddress":"電郵地址","firstName":"名字","lastName":"姓氏","phoneOptional":"電話號碼","address":"地址","apartmentOptional":"單位、樓層等（選填）","postalOptional":"郵遞區號","totalPaid":"已付款總額","orderReceipt":"訂單收據","orderNotFound":"找不到訂單","invoiceNotFound":"找不到發票","customInvoice":"自訂發票","prototypeReceipt":"原型收據 — 未有進行真實付款。","prototypePaymentLink":"原型付款連結。正式網站會在此導向或嵌入 Stripe。","paymentRecorded":"此原型已記錄付款。","pay":"付款","fulfilled":"已完成配送","unfulfilled":"待配送","paidTest":"已付款（測試）","other":"其他","noCountries":"沒有地區","newMarket":"新市場","refreshingWord":"清爽","bodyWipes":"身體濕巾","discover":"探索","ourScents":"香氣系列","meet":"認識","inBetween":"空檔時刻","isRitual":"也是日常儀式。"},"zh-CN":{"products":"产品","about":"关于我们","stockists":"零售点","community":"社群","account":"账户","bag":"购物袋","menu":"菜单","close":"关闭","checkout":"结账","subtotal":"小计","shipping":"运费","tax":"税费","total":"总计","chooseScent":"选择香味","addToBag":"加入购物袋","language":"语言","market":"地区","freeDelivery":"免运费","signIn":"登录","createAccount":"创建账户"},"ja":{"products":"商品","about":"ブランド","stockists":"取扱店","community":"コミュニティ","account":"アカウント","bag":"バッグ","menu":"メニュー","close":"閉じる","checkout":"チェックアウト","subtotal":"小計","shipping":"送料","tax":"税","total":"合計","chooseScent":"香りを選ぶ","addToBag":"バッグに追加","language":"言語","market":"地域","freeDelivery":"送料無料","signIn":"サインイン","createAccount":"アカウント作成"},"ko":{"products":"제품","about":"브랜드","stockists":"판매처","community":"커뮤니티","account":"계정","bag":"장바구니","menu":"메뉴","close":"닫기","checkout":"결제","subtotal":"소계","shipping":"배송","tax":"세금","total":"합계","chooseScent":"향 선택","addToBag":"장바구니 담기","language":"언어","market":"지역","freeDelivery":"무료 배송","signIn":"로그인","createAccount":"계정 만들기"}};
function tr(key,fallback){
  const site=getSite(),locale=currentLocale(),custom=site.localization?.interfaceTranslations?.[locale]?.[key];
  if(custom!==undefined&&String(custom).trim()!=='')return custom;
  return defaultUiTranslations[locale]?.[key]||fallback||uiPhraseCatalog.find(x=>x.key===key)?.en||key;
}
const uiPhraseByEnglish=(()=>{const m={};uiPhraseCatalog.forEach(x=>{const n=String(x.en||'').trim().replace(/\s+/g,' ').toLowerCase();if(n&&!m[n])m[n]=x.key});return m})();
function translateExactUiText(value){
  const raw=String(value??''),trim=raw.trim();if(!trim||currentLocale()==='en')return raw;
  const key=uiPhraseByEnglish[trim.replace(/\s+/g,' ').toLowerCase()];if(!key)return raw;
  const translated=tr(key,trim);if(translated===trim)return raw;
  const lead=raw.match(/^\s*/)?.[0]||'',trail=raw.match(/\s*$/)?.[0]||'';
  return lead+translated+trail;
}
function translateStaticElement(el){
  if(!el||el.nodeType!==1||document.body?.classList.contains('admin-page')||['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName))return;
  ['placeholder','aria-label','title'].forEach(attr=>{if(el.hasAttribute?.(attr)){const v=el.getAttribute(attr),n=translateExactUiText(v);if(n!==v)el.setAttribute(attr,n)}});
  [...(el.childNodes||[])].forEach(n=>{if(n.nodeType===3){const v=n.nodeValue,nv=translateExactUiText(v);if(nv!==v)n.nodeValue=nv}else if(n.nodeType===1)translateStaticElement(n)});
}
let i18nObserver;
function applyStorefrontTranslations(root=document.body){
  if(!root||document.body?.classList.contains('admin-page'))return;
  const locale=currentLocale();document.documentElement.lang=locale==='zh-HK'?'zh-Hant-HK':locale;
  document.documentElement.style.setProperty('--hero-side-copy',locale==='zh-HK'?'"高效身體護理\\A為更活躍的世界而設。"':'"HIGH-PERFORMANCE BODY CARE\\AFOR A MORE ACTIVE WORLD."');
  translateStaticElement(root);
  if(!i18nObserver&&document.body){
    i18nObserver=new MutationObserver(muts=>{muts.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===3){const v=n.nodeValue,nv=translateExactUiText(v);if(nv!==v)n.nodeValue=nv}else if(n.nodeType===1)translateStaticElement(n)}))});
    i18nObserver.observe(document.body,{childList:true,subtree:true});
  }
}
function money(n,marketOverride){if(document.body?.classList.contains('admin-page'))return `HK$${Number(n||0).toLocaleString('en-HK',{maximumFractionDigits:0})}`;const m=marketOverride||currentMarket(),rate=Number(m.fxRate||1),value=Number(n||0)*rate,zero=['JPY','KRW'].includes(m.currency);try{return new Intl.NumberFormat(currentLocale()==='en'?'en-HK':currentLocale(),{style:'currency',currency:m.currency||'HKD',maximumFractionDigits:zero?0:2}).format(value)}catch{return `${m.symbol||m.currency||'HK$'}${value.toLocaleString(undefined,{maximumFractionDigits:zero?0:2})}`}}
function baseMoney(n){return `HK$${Number(n||0).toLocaleString('en-HK',{maximumFractionDigits:0})}`}
function getActiveProducts(site=getSite()){return (site.catalogProducts||[]).filter(p=>p.status!=='archived')}
function getPrimaryCatalogProduct(site=getSite()){return getActiveProducts(site)[0]||site.catalogProducts?.[0]||null}
function findCatalogProduct(site,handleOrId){const list=site.catalogProducts||[];return list.find(p=>p.id===handleOrId||p.handle===handleOrId)||getPrimaryCatalogProduct(site)}
function getProductVariants(product){return (product?.variants||[]).filter(v=>v.active!==false)}
function getProductMedia(product){return (product?.media||[]).filter(m=>m&&m.src)}
function productInCollection(site,product,collectionId){const col=(site.collections||[]).find(c=>c.id===collectionId);return !!col&&(col.productIds||[]).includes(product.id)}
function getBundlesForProduct(site,product){if(site.features?.bundlesStorefrontVisible===false)return [{id:'auto-single',name:'Single',qty:1,price:null,badge:'',active:true,scopeType:'product',scopeId:product.id}];const all=(site.bundles||[]).filter(b=>b.active!==false);const matched=all.filter(b=>b.scopeType==='all'||(b.scopeType==='product'&&b.scopeId===product.id)||(b.scopeType==='collection'&&productInCollection(site,product,b.scopeId)));return matched.length?matched:[{id:'auto-single',name:'Single',qty:1,price:null,badge:'',active:true,scopeType:'product',scopeId:product.id}]}

function getCustomers(){try{return JSON.parse(localStorage.getItem(ZB_CUSTOMERS)||'[]')}catch{return[]}}
function saveCustomers(v){localStorage.setItem(ZB_CUSTOMERS,JSON.stringify(v||[]))}
function currentCustomer(){try{const sess=JSON.parse(localStorage.getItem(ZB_SESSION)||'null');if(!sess?.email)return null;return getCustomers().find(c=>String(c.email).toLowerCase()===String(sess.email).toLowerCase())||null}catch{return null}}
function setCustomerSession(customer){if(customer)localStorage.setItem(ZB_SESSION,JSON.stringify({email:customer.email,id:customer.id||''}));else localStorage.removeItem(ZB_SESSION)}
function emailLog(){try{return JSON.parse(localStorage.getItem(ZB_EMAIL_LOG)||'[]')}catch{return[]}}
function logEmailEvent(evt){const arr=emailLog();arr.unshift({id:`MAIL-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,date:new Date().toISOString(),status:'Queued (prototype)',...evt});localStorage.setItem(ZB_EMAIL_LOG,JSON.stringify(arr.slice(0,250)))}
function salesEmailList(site=getSite()){const raw=site.settings?.salesEmails||site.settings?.internalEmail||'';return String(raw).split(/[;,\n]+/).map(x=>x.trim()).filter(Boolean)}
function adminEmailList(site=getSite()){const raw=site.settings?.adminEmails||'';return String(raw).split(/[;,\n]+/).map(x=>x.trim().toLowerCase()).filter(Boolean)}
function isAdminEmail(email,site=getSite()){const list=adminEmailList(site);return !!email&&list.includes(String(email).trim().toLowerCase())}
function currentCustomerIsAdmin(site=getSite()){const c=currentCustomer();return !!c&&isAdminEmail(c.email,site)}
function getCart(){try{return JSON.parse(localStorage.getItem(ZB_CART)||'[]')}catch{return[]}}
function saveCart(c){localStorage.setItem(ZB_CART,JSON.stringify(c));renderCartUI()}
function addCart(item){const c=getCart();c.push({...item,id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random())});saveCart(c);openCart()}
function cartSubtotal(){return getCart().reduce((s,i)=>s+Number(i.price||0)*Number(i.qty||1),0)}
function shippingFor(subtotal,country){const site=getSite(),m=country?marketForCountry(country,site):currentMarket(site);const threshold=Number(m.freeShippingThreshold??site.shipping?.threshold??0),fee=Number(m.shippingFee??site.shipping?.fee??0);return threshold===0||subtotal>=threshold?0:fee}
function taxFor(subtotal,shipping=0,country){const site=getSite();if(site.markets?.taxEngine==='none')return 0;const m=country?marketForCountry(country,site):currentMarket(site),rate=Number(m.taxRate||0)/100,base=Number(subtotal||0)+(site.markets?.taxOnShipping?Number(shipping||0):0);return Math.max(0,Math.round(base*rate*100)/100)}
function applyTheme(){const t=getSite().theme||defaults.theme;const r=document.documentElement;r.style.setProperty('--font',`\"${t.font||defaults.theme.font}\", Arial, sans-serif`);r.style.setProperty('--paper',t.bg||defaults.theme.bg);r.style.setProperty('--paper2',t.surface||defaults.theme.surface);r.style.setProperty('--ink',t.text||defaults.theme.text);r.style.setProperty('--surface',t.surface||defaults.theme.surface);r.style.setProperty('--soft-surface',t.softSurface||defaults.theme.softSurface);r.style.setProperty('--selected-fill',t.selectedFill||defaults.theme.selectedFill);r.style.setProperty('--accent',t.accent||defaults.theme.accent);r.style.setProperty('--button',t.button||defaults.theme.button);r.style.setProperty('--button-text',t.buttonText||defaults.theme.buttonText);r.style.setProperty('--line-solid',t.line||defaults.theme.line);r.style.setProperty('--line',t.line||defaults.theme.line);r.style.setProperty('--body-size',`${Number(t.bodySize||defaults.theme.bodySize||18)}px`)}
function applyBranding(){
  const site=getSite(),b=site.branding||defaults.branding;
  let fav=document.querySelector('link[data-zb-favicon]');if(!fav){fav=document.createElement('link');fav.rel='icon';fav.setAttribute('data-zb-favicon','');document.head.appendChild(fav)}fav.href=b.favicon||'assets/favicon.svg';
  const renderHeaderBrand=(a)=>{if(!a)return;a.style.setProperty('--logo-width',`${Number(b.logoWidth||132)}px`);a.style.setProperty('--logo-mobile-width',`${Number(b.mobileLogoWidth||44)}px`);if(b.logo){a.classList.add('has-image');a.innerHTML=`<img src="${b.logo}" alt="${b.logoAlt||b.logoText||'ZIONBURG'}">`}else{a.classList.remove('has-image');a.innerHTML=`<span class="brand-desktop">${b.logoText||'ZIONBURG'}</span><span class="brand-mobile">${b.mobileLogoText||'ZB'}</span>`}};
  document.querySelectorAll('.site-header a.brand').forEach(renderHeaderBrand);const mobileBrand=document.querySelector('.mobile-nav a.brand');if(mobileBrand){if(b.logo){mobileBrand.classList.add('has-image');mobileBrand.style.setProperty('--logo-mobile-width',`${Number(b.mobileLogoWidth||44)}px`);mobileBrand.innerHTML=`<img src="${b.logo}" alt="${b.logoAlt||b.logoText||'ZIONBURG'}">`}else{mobileBrand.classList.remove('has-image');mobileBrand.textContent=b.mobileLogoText||'ZB'}}
}
function renderBenefits(){const site=getSite();document.querySelectorAll('.benefit-strip .benefit').forEach((el,i)=>{const item=(site.benefits||[])[i];if(!item)return;const img=el.querySelector('img'),strong=el.querySelector('strong'),small=el.querySelector('small');if(img){img.src=item.icon||defaults.benefits[i]?.icon||'';img.alt=item.title||''}if(strong)strong.textContent=localize(item,'title')||item.title||'';if(small)small.textContent=localize(item,'subtitle')||item.subtitle||''})}
function renderShipping(){
  const site=getSite(),m=currentMarket(site),threshold=Number(m.freeShippingThreshold??site.shipping?.threshold??0),zh=currentLocale()==='zh-HK';
  const tail=site.features?.bundlesStorefrontVisible!==false?(zh?'組合更優惠':'SHOP BUNDLES & SAVE'):(zh?'日常潔淨護理':'CLEAN CARE FOR EVERYDAY MOVEMENT');
  document.querySelectorAll('[data-shipping-announcement]').forEach(el=>{
    if(zh){
      const marketName=m.name==='Hong Kong'?'香港':m.name;
      el.innerHTML=threshold>0?`${marketName}訂單滿 ${money(threshold,m)} 免運費 <span>•</span> ${tail}`:`${marketName} ${tr('freeDelivery','FREE DELIVERY')} <span>•</span> ${tail}`;
    }else{
      el.innerHTML=threshold>0?`FREE ${m.name.toUpperCase()} DELIVERY OVER ${money(threshold,m)} <span>•</span> ${tail}`:`${tr('freeDelivery','FREE DELIVERY').toUpperCase()} — ${m.name.toUpperCase()} <span>•</span> ${tail}`;
    }
  });
  document.querySelectorAll('[data-shipping-note]').forEach(el=>el.textContent=zh?(threshold>0?`訂單滿 ${money(threshold,m)} 免運費。`:'所有訂單免運費。'):(threshold>0?`Free delivery over ${money(threshold,m)}.`:'Free delivery on every order.'));
}
function productNavLinks(site){return getActiveProducts(site).filter(p=>p.status==='active'&&p.showInNav!==false).map(p=>({label:localize(p,'title'),href:`product.html?product=${encodeURIComponent(p.handle)}`}))}
function renderFooter(){
  const site=getSite(),f=site.footer||defaults.footer,b=site.branding||defaults.branding;
  const socials=Object.entries(f.socials||{}).filter(([,url])=>String(url||'').trim());const locale=currentLocale(),ct=site.localization?.contentTranslations?.[locale]||{};
  const socialLabel={instagram:'Instagram',tiktok:'TikTok',youtube:'YouTube',facebook:'Facebook',linkedin:'LinkedIn'};
  document.querySelectorAll('footer').forEach(footer=>{footer.className='site-footer';footer.innerHTML=`<div class="footer-main"><div class="footer-brand-block"><a class="footer-brand" href="index.html">${b.logo?`<img src="${b.logo}" alt="${b.logoAlt||b.logoText||'ZIONBURG'}">`:b.logoText||'ZIONBURG'}</a><p>${ct.footerTagline||f.tagline||''}</p></div><div class="footer-connect"><span>${tr('connect','CONNECT')}</span><div class="footer-socials">${socials.map(([k,url])=>`<a href="${url}" target="_blank" rel="noopener">${socialLabel[k]||k}</a>`).join('')||`<span class="footer-muted">${currentLocale()==='zh-HK'?'社交媒體連結即將推出。':'Social links coming soon.'}</span>`}</div></div></div><div class="footer-bottom"><div class="footer-custom-links">${(f.links||[]).filter(x=>x.visible!==false&&x.label&&x.href).map(x=>`<a href="${x.href}">${localize(x,'label')}</a>`).join('')}</div><span>© ${new Date().getFullYear()} ZIONBURG</span></div>`})
}
function storePreferenceHTML(site){const langs=(site.localization?.languages||[]).filter(x=>x.enabled!==false),markets=(site.markets?.items||[]).filter(x=>x.enabled!==false),loc=currentLocale(),mk=currentMarket(site);if(langs.length<2&&markets.length<2)return '';return `<div class="store-preferences">${langs.length>1?`<label><span class="sr-only">${tr('language','Language')}</span><select data-store-locale>${langs.map(x=>`<option value="${x.code}" ${x.code===loc?'selected':''}>${x.label}</option>`).join('')}</select></label>`:''}${markets.length>1?`<label><span class="sr-only">${tr('market','Market')}</span><select data-store-market>${markets.map(x=>`<option value="${x.id}" ${x.id===mk.id?'selected':''}>${x.name} · ${x.currency}</option>`).join('')}</select></label>`:''}</div>`}
function bindStorePreferences(){document.addEventListener('change',e=>{if(e.target.matches('[data-store-locale]')){setLocale(e.target.value);location.reload()}if(e.target.matches('[data-store-market]')){setMarket(e.target.value);location.reload()}})}
function renderNav(){const site=getSite();const links=(site.nav||[]).filter(n=>n.visible!==false),catalog=productNavLinks(site);document.querySelectorAll('[data-site-nav]').forEach(nav=>{nav.className='desktop-nav';nav.innerHTML=links.map(n=>n.type==='products'?`<div class="nav-dropdown"><button type="button">${localize(n,'label')}</button><div class="dropdown-menu">${catalog.map(c=>`<a href="${c.href}">${c.label}</a>`).join('')}</div></div>`:`<a href="${n.href}">${localize(n,'label')}</a>`).join('')});
  document.querySelectorAll('.site-header').forEach(h=>{const actions=h.querySelector('.header-actions');if(actions&&!actions.querySelector('.store-preferences'))actions.insertAdjacentHTML('afterbegin',storePreferenceHTML(site));if(actions&&site.features?.customerAccounts!==false&&!actions.querySelector('.account-link')){const c=currentCustomer();const a=document.createElement('a');a.className='icon-btn account-link';a.href='account.html';a.textContent=c?(c.name||c.email||'ACCOUNT').split(' ')[0].toUpperCase():tr('account','ACCOUNT');actions.insertBefore(a,actions.querySelector('.store-preferences')?.nextSibling||actions.firstChild)}});
  const old=document.querySelector('.mobile-nav');if(old)old.remove();const m=document.createElement('div');m.className='mobile-nav';const accountLink=site.features?.customerAccounts!==false?`<a href="account.html">${currentCustomer()?'MY ACCOUNT':tr('account','ACCOUNT')}</a>`:'';m.innerHTML=`<div class="mobile-nav-top"><button class="mobile-nav-close">${tr('close','CLOSE')}</button><a class="brand" href="index.html">ZB</a><span></span></div><div class="mobile-preferences">${storePreferenceHTML(site)}</div><div class="mobile-nav-links">${links.map(n=>n.type==='products'?`<button class="mobile-products-toggle">${localize(n,'label')}<span>+</span></button><div class="mobile-products-list">${catalog.map(c=>`<a href="${c.href}">${c.label}</a>`).join('')}</div>`:`<a href="${n.href}">${localize(n,'label')}</a>`).join('')}${accountLink}</div><div class="mobile-nav-foot">${currentLocale()==='zh-HK'?'潔淨身體。明亮每一天。':'CLEANER BODIES. BRIGHTER DAYS.'}</div>`;document.body.appendChild(m);
  document.querySelectorAll('.site-header').forEach(h=>{if(!h.querySelector('.menu-toggle')&&h.querySelector('[data-site-nav]')){const b=document.createElement('button');b.className='menu-toggle';b.textContent=tr('menu','MENU');h.insertBefore(b,h.firstChild)}});renderFooter()
}
function bindNav(){document.addEventListener('click',e=>{if(e.target.closest('.menu-toggle')){document.querySelector('.mobile-nav')?.classList.add('open');document.body.classList.add('menu-open')}if(e.target.closest('.mobile-nav-close')){document.querySelector('.mobile-nav')?.classList.remove('open');document.body.classList.remove('menu-open')}const t=e.target.closest('.mobile-products-toggle');if(t){t.nextElementSibling.classList.toggle('open');t.querySelector('span').textContent=t.nextElementSibling.classList.contains('open')?'−':'+'}})}
function ensureCartDrawer(){
  if(!document.getElementById('cartDrawer')){
    const d=document.createElement('aside');d.className='drawer';d.id='cartDrawer';
    d.innerHTML=`<div class="drawer-head"><h3>${tr('yourBag','YOUR BAG')}</h3><button id="closeCart" class="icon-btn">${tr('close','CLOSE')}</button></div><div id="cartItems" class="cart-items"></div><div class="cart-footer"><div class="summary-row"><span>${tr('subtotal','Subtotal')}</span><strong id="subtotal">HK$0</strong></div><p class="cart-note" data-shipping-note>${tr('shippingCalculated','Shipping calculated at checkout.')}</p><a href="checkout.html" class="btn btn-dark full">${tr('checkout','CHECKOUT')} →</a></div>`;
    document.body.appendChild(d)
  }
  if(!document.getElementById('scrim')){const s=document.createElement('div');s.id='scrim';s.className='scrim';document.body.appendChild(s)}
}
function renderCartUI(){
  ensureCartDrawer();const c=getCart();document.querySelectorAll('#cartCount').forEach(el=>el.textContent=c.reduce((s,i)=>s+Number(i.qty||1),0));
  const items=document.getElementById('cartItems');
  if(items)items.innerHTML=c.length?c.map(i=>`<div class="cart-item"><div class="cart-swatch" style="background:${i.color||'#eee'}"></div><div><strong>${i.name}</strong><small>${i.detail||''}</small><small>${currentLocale()==='zh-HK'?'數量':'Qty'} ${i.qty||1}</small></div><div><strong>${money(Number(i.price||0)*Number(i.qty||1))}</strong><button class="cart-remove" data-remove-cart="${i.id}">${tr('remove','Remove')}</button></div></div>`).join(''):`<p style="font-size:12px;color:#777;padding:20px 0">${tr('bagEmpty','Your bag is empty.')}</p>`;
  const st=document.getElementById('subtotal');if(st)st.textContent=money(cartSubtotal());renderShipping();requestAnimationFrame(()=>applyStorefrontTranslations());
}
function openCart(){ensureCartDrawer();document.getElementById('cartDrawer').classList.add('open');document.getElementById('scrim').classList.add('open');document.body.classList.add('drawer-open')}
function closeCart(){document.getElementById('cartDrawer')?.classList.remove('open');document.getElementById('scrim')?.classList.remove('open');document.body.classList.remove('drawer-open')}
function bindCart(){document.addEventListener('click',e=>{if(e.target.closest('#cartBtn'))openCart();if(e.target.closest('#closeCart')||e.target.id==='scrim')closeCart();const r=e.target.closest('[data-remove-cart]');if(r)saveCart(getCart().filter(i=>i.id!==r.dataset.removeCart))})}

const ZB_EDIT_QUERY=(()=>{try{return new URLSearchParams(location.search)}catch{return new URLSearchParams()}})();
if(ZB_EDIT_QUERY.get('edit')==='translate'&&ZB_EDIT_QUERY.get('locale')){const requested=ZB_EDIT_QUERY.get('locale');const site=getSite();if((site.localization?.languages||[]).some(x=>x.enabled!==false&&x.code===requested))localStorage.setItem(ZB_LOCALE,requested)}
function storefrontTranslationEditActive(){return ZB_EDIT_QUERY.get('edit')==='translate'}
function inlineEditLocale(){const requested=ZB_EDIT_QUERY.get('locale');return requested&&requested!=='en'?requested:((getSite().localization?.languages||[]).find(x=>x.enabled!==false&&x.code!=='en')?.code||'zh-HK')}
function reverseUiKey(value,locale=inlineEditLocale()){
  const normalize=v=>String(v||'').trim().replace(/[→↗+]+$/,'').replace(/\s+/g,' ').toLowerCase();const n=normalize(value);if(!n)return null;
  const direct=uiPhraseCatalog.find(x=>normalize(x.en)===n);if(direct)return direct.key;
  const site=getSite(),custom=site.localization?.interfaceTranslations?.[locale]||{},built=defaultUiTranslations[locale]||{};
  const keys=new Set([...Object.keys(built),...Object.keys(custom)]);for(const key of keys){const v=custom[key]!==undefined&&String(custom[key]).trim()!==''?custom[key]:built[key];if(normalize(v)===n)return key}return null
}
function inlineEditTarget(el){
  let node=el?.closest?.('[data-zb-edit-kind]');if(node)return {el:node,kind:node.dataset.zbEditKind,id:node.dataset.zbEditId||'',field:node.dataset.zbEditField||'',index:node.dataset.zbEditIndex||'',key:node.dataset.zbEditKey||''};
  let cur=el;for(let depth=0;cur&&depth<4&&cur!==document.body;cur=cur.parentElement,depth++){
    const texts=[...cur.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue.trim()).filter(Boolean);for(const text of texts){const key=reverseUiKey(text);if(key)return {el:cur,kind:'ui',key}}
    if(cur.children.length===0){const key=reverseUiKey(cur.textContent);if(key)return {el:cur,kind:'ui',key}}
  }return null
}
function markInlineContentTargets(){
  const mark=(el,kind,field,id='',index='')=>{if(!el)return;el.dataset.zbEditKind=kind;el.dataset.zbEditField=field;if(id)el.dataset.zbEditId=id;if(index!==''&&index!==null)el.dataset.zbEditIndex=String(index)};
  const site=getSite(),path=location.pathname.split('/').pop()||'index.html';
  if(path==='index.html'||path===''){
    mark(document.getElementById('heroEyebrow'),'global','heroEyebrow');mark(document.getElementById('heroTitle'),'global','heroTitle');mark(document.getElementById('heroSubtitle'),'global','heroSubtitle');
    document.querySelectorAll('.benefit-strip .benefit').forEach((b,i)=>{mark(b.querySelector('strong'),'benefit','title','',i);mark(b.querySelector('small'),'benefit','subtitle','',i)});
  }
  if(path==='product.html'){
    const key=new URLSearchParams(location.search).get('product')||'',product=findCatalogProduct(site,key),scent=new URLSearchParams(location.search).get('scent')||'',variant=(product?.variants||[]).find(v=>String(v.name).toLowerCase()===String(scent).toLowerCase())||(product?.variants||[])[0];
    if(product){mark(document.getElementById('productKicker'),'product','title',product.id);mark(document.querySelector('.pdp-lede'),'product','description',product.id)}
    if(product&&variant){mark(document.getElementById('productScentTitle'),'variant','name',`${product.id}|${variant.id}`);mark(document.getElementById('productState'),'variant','state',`${product.id}|${variant.id}`)}
  }
  if(path==='collection.html'){
    const key=new URLSearchParams(location.search).get('collection')||'',c=(site.collections||[]).find(x=>x.id===key||x.handle===key)||site.collections?.[0];if(c){mark(document.getElementById('collectionName'),'collection','title',c.id);mark(document.getElementById('collectionDescription'),'collection','description',c.id)}
  }
  if(path==='community.html'){
    document.querySelectorAll('#partnerGrid .community-card').forEach((card,i)=>{mark(card.querySelector('h3'),'partner','name','',i);mark(card.querySelector('p'),'partner','note','',i)});document.querySelectorAll('#friendGrid .community-card').forEach((card,i)=>{mark(card.querySelector('h3'),'friend','name','',i);mark(card.querySelector('p'),'friend','note','',i)})
  }
}
function inlineTranslationRecord(target,locale){
  const site=getSite(),source=(target.el?.textContent||'').trim();let current='',label='Storefront text';
  if(target.kind==='ui'){const item=uiPhraseCatalog.find(x=>x.key===target.key);label=item?.group||'Interface';current=site.localization?.interfaceTranslations?.[locale]?.[target.key]??defaultUiTranslations[locale]?.[target.key]??'';return {site,source:item?.en||source,current,label,key:target.key}}
  if(target.kind==='global'){label='Homepage';source=site.homepage?.[target.field]||source;current=site.localization?.contentTranslations?.[locale]?.[target.field]||'';return {site,source,current,label}}
  if(target.kind==='benefit'){const obj=site.benefits?.[+target.index];label='Homepage benefit';source=obj?.[target.field]||source;current=obj?.translations?.[locale]?.[target.field]||'';return {site,source,current,label,obj}}
  if(target.kind==='product'){const obj=(site.catalogProducts||[]).find(x=>x.id===target.id);label='Product';source=obj?.[target.field]||source;current=obj?.translations?.[locale]?.[target.field]||'';return {site,source,current,label,obj}}
  if(target.kind==='variant'){const [pid,vid]=String(target.id).split('|'),p=(site.catalogProducts||[]).find(x=>x.id===pid),obj=p?.variants?.find(x=>x.id===vid);label='Product variant';source=obj?.[target.field]||source;current=obj?.translations?.[locale]?.[target.field]||'';return {site,source,current,label,obj}}
  if(target.kind==='collection'){const obj=(site.collections||[]).find(x=>x.id===target.id);label='Collection';source=obj?.[target.field]||source;current=obj?.translations?.[locale]?.[target.field]||'';return {site,source,current,label,obj}}
  if(target.kind==='partner'||target.kind==='friend'){const arr=target.kind==='partner'?site.partners:site.friends,obj=arr?.[+target.index];label=target.kind==='partner'?'Community partner':'Friend of ZB';source=obj?.[target.field]||source;current=obj?.translations?.[locale]?.[target.field]||'';return {site,source,current,label,obj}}
  return {site,source,current,label}
}
function saveInlineTranslation(target,locale,value){
  const rec=inlineTranslationRecord(target,locale),site=rec.site;if(target.kind==='ui'){site.localization=site.localization||{};site.localization.interfaceTranslations=site.localization.interfaceTranslations||{};site.localization.interfaceTranslations[locale]=site.localization.interfaceTranslations[locale]||{};site.localization.interfaceTranslations[locale][target.key]=value}
  else if(target.kind==='global'){site.localization=site.localization||{};site.localization.contentTranslations=site.localization.contentTranslations||{};site.localization.contentTranslations[locale]=site.localization.contentTranslations[locale]||{};site.localization.contentTranslations[locale][target.field]=value}
  else if(rec.obj){rec.obj.translations=rec.obj.translations||{};rec.obj.translations[locale]=rec.obj.translations[locale]||{};rec.obj.translations[locale][target.field]=value}
  saveSite(site)
}
function openInlineTranslationEditor(target){
  const locale=inlineEditLocale(),rec=inlineTranslationRecord(target,locale),panel=document.getElementById('zbInlineEditPanel');if(!panel)return;panel.dataset.kind=target.kind;panel._target=target;panel.querySelector('[data-inline-kind]').textContent=rec.label;panel.querySelector('[data-inline-source]').textContent=rec.source||'—';panel.querySelector('[data-inline-value]').value=rec.current||'';panel.classList.add('open');target.el?.classList.add('zb-edit-selected');panel.querySelector('[data-inline-value]').focus()
}
function closeInlineTranslationEditor(){const panel=document.getElementById('zbInlineEditPanel');document.querySelectorAll('.zb-edit-selected').forEach(x=>x.classList.remove('zb-edit-selected'));panel?.classList.remove('open')}
function initStorefrontTranslationEdit(){
  if(!storefrontTranslationEditActive()||document.body.classList.contains('admin-page'))return;const site=getSite(),admins=adminEmailList(site);if(admins.length&&!currentCustomerIsAdmin(site)){const back=encodeURIComponent(location.pathname+location.search);location.replace(`account.html?admin=1&return=${back}`);return}
  document.body.classList.add('storefront-edit-mode');const locale=inlineEditLocale(),langs=(site.localization?.languages||[]).filter(x=>x.enabled!==false&&x.code!=='en');
  const toolbar=document.createElement('div');toolbar.className='zb-edit-toolbar';toolbar.innerHTML=`<div class="zb-edit-toolbar-brand"><b>ZB</b><span>Translation edit mode</span></div><label>Language<select id="zbEditLocale">${langs.map(x=>`<option value="${x.code}" ${x.code===locale?'selected':''}>${x.label}</option>`).join('')}</select></label><button type="button" id="zbEditToggle" class="active">EDITING</button><a href="admin.html#markets">ADMIN</a><a href="${location.pathname}${location.search.replace(/([?&])edit=translate&?/, '$1').replace(/([?&])locale=[^&]*&?/, '$1').replace(/[?&]$/,'')||''}" id="zbEditExit">EXIT</a>`;document.body.appendChild(toolbar);
  const panel=document.createElement('aside');panel.id='zbInlineEditPanel';panel.className='zb-inline-edit-panel';panel.innerHTML=`<div class="zb-inline-edit-head"><div><span data-inline-kind>Translation</span><strong>Edit text</strong></div><button type="button" data-inline-close>×</button></div><div class="zb-inline-edit-body"><label>Source (English)<div class="zb-inline-source" data-inline-source></div></label><label>Translation<textarea rows="5" data-inline-value></textarea></label><p>Blank fields fall back to the default translation.</p><button type="button" class="btn btn-dark full" data-inline-save>SAVE TRANSLATION</button></div>`;document.body.appendChild(panel);
  let editing=true;document.getElementById('zbEditToggle').onclick=()=>{editing=!editing;document.getElementById('zbEditToggle').classList.toggle('active',editing);document.getElementById('zbEditToggle').textContent=editing?'EDITING':'BROWSE';document.body.classList.toggle('zb-edit-paused',!editing);closeInlineTranslationEditor()};document.getElementById('zbEditLocale').onchange=e=>{const u=new URL(location.href);u.searchParams.set('locale',e.target.value);localStorage.setItem(ZB_LOCALE,e.target.value);location.href=u.toString()};panel.querySelector('[data-inline-close]').onclick=closeInlineTranslationEditor;panel.querySelector('[data-inline-save]').onclick=()=>{if(!panel._target)return;saveInlineTranslation(panel._target,inlineEditLocale(),panel.querySelector('[data-inline-value]').value);location.reload()};
  document.addEventListener('click',e=>{if(!editing||e.target.closest('.zb-edit-toolbar,.zb-inline-edit-panel,.mobile-nav,.drawer'))return;const target=inlineEditTarget(e.target);if(!target)return;e.preventDefault();e.stopPropagation();closeInlineTranslationEditor();openInlineTranslationEditor(target)},true);
  setTimeout(markInlineContentTargets,60);setTimeout(markInlineContentTargets,300);new MutationObserver(()=>markInlineContentTargets()).observe(document.body,{childList:true,subtree:true})
}

document.addEventListener('DOMContentLoaded',()=>{applyTheme();renderNav();applyBranding();renderBenefits();bindNav();bindStorePreferences();ensureCartDrawer();renderCartUI();bindCart();renderShipping();requestAnimationFrame(()=>applyStorefrontTranslations())});
document.addEventListener('DOMContentLoaded',()=>setTimeout(initStorefrontTranslationEdit,0));
