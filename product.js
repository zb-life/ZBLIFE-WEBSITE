let selectedVariantId=null,selectedBundleId=null,purchaseType='one_time',activeMediaIndex=0,currentCatalogProduct=null;

const variantEditorial={
  Mint:{descriptor:'COOL + CRISP',headline:'YOUR COOL, CRISP\nPOST-MOVEMENT RESET.',feels:'A clean, cooling reset after movement.',made:'Training days, warm commutes and whatever comes next.',mood:'Cool • Crisp • Revived',state:'RESET'},
  Cucumber:{descriptor:'FRESH + CLEAN',headline:'YOUR FRESH, CLEAN\nEVERYDAY RESET.',feels:'Light, crisp and clean without feeling heavy.',made:'Warm days, commutes, travel and daily refreshes.',mood:'Fresh • Clean • Easy',state:'REFRESH'},
  Lavender:{descriptor:'SOFT + CALM',headline:'YOUR SOFT, CALM\nWIND-DOWN RESET.',feels:'A softer reset when the day needs to slow down.',made:'Evening routines, travel days and post-class recovery.',mood:'Soft • Calm • Grounded',state:'UNWIND'},
  Rose:{descriptor:'SOFT + FLORAL',headline:'YOUR SOFT, FLORAL\nON-THE-GO RESET.',feels:'A fresh reset with a soft floral finish.',made:'Everyday carry, social plans and after-work refreshes.',mood:'Soft • Floral • Polished',state:'GLOW'},
  Amber:{descriptor:'WARM + GROUNDED',headline:'YOUR WARM, GROUNDED\nRECOVERY RESET.',feels:'A warm, grounded clean after a long day.',made:'Recovery, travel and cooler-weather routines.',mood:'Warm • Grounded • Restored',state:'RECOVER'},
  Orange:{descriptor:'BRIGHT + ZESTY',headline:'YOUR BRIGHT, ZESTY\nENERGY RESET.',feels:'An uplifting refresh that feels bright and awake.',made:'Morning movement, outdoor days and midday resets.',mood:'Bright • Zesty • Awake',state:'ENERGISE'}
};

const variantEditorialZh={
  Mint:{descriptor:'清涼・爽脆',headline:'運動後\n清涼爽脆的重整。',feels:'運動後潔淨清涼的快速重整。',made:'適合訓練日、炎熱通勤，以及接下來的每個行程。',mood:'清涼 • 爽脆 • 重拾精神',state:'重整'},
  Cucumber:{descriptor:'清新・潔淨',headline:'每日\n清新潔淨的重整。',feels:'輕盈、清新、潔淨，不感厚重。',made:'適合炎熱日子、通勤、旅行及日常清爽。',mood:'清新 • 潔淨 • 輕鬆',state:'清爽'},
  Lavender:{descriptor:'柔和・平靜',headline:'柔和舒緩的\n放鬆重整。',feels:'當一天需要慢下來時，帶來更柔和的重整。',made:'適合晚間 routine、旅行日及課堂後恢復。',mood:'柔和 • 平靜 • 沉穩',state:'放鬆'},
  Rose:{descriptor:'柔和・花香',headline:'外出時\n柔和花香的清爽重整。',feels:'清新重整，留下柔和花香。',made:'適合日常隨身、社交行程及下班後清爽。',mood:'柔和 • 花香 • 精緻',state:'煥亮'},
  Amber:{descriptor:'溫暖・沉穩',headline:'溫暖沉穩的\n恢復重整。',feels:'漫長一天後，帶來溫暖沉穩的潔淨感。',made:'適合恢復、旅行及較涼天氣的日常。',mood:'溫暖 • 沉穩 • 恢復',state:'恢復'},
  Orange:{descriptor:'明亮・活力',headline:'明亮有活力的\n醒神重整。',feels:'清爽提振，感覺明亮有精神。',made:'適合晨間運動、戶外日及午後重整。',mood:'明亮 • 活力 • 醒神',state:'醒神'}
};

const pad2=n=>String(n).padStart(2,'0');
const qs=()=>new URLSearchParams(location.search);
function getCatalogProduct(site){
  const key=qs().get('product');
  return findCatalogProduct(site,key||'');
}
function variantsFor(product){const vs=getProductVariants(product);return vs.length?vs:[{id:'default',name:localize(product,'title'),state:'',price:0,color:'#ddd',image:'',inventory:0,active:true}]}
function variantName(v){return localize(v,'name')||v.name||''}
function variantState(v){return localize(v,'state')||v.state||''}
function selectedVariant(product){const vs=variantsFor(product);return vs.find(v=>v.id===selectedVariantId)||vs[0]}
function bundlesFor(site,product){const bs=getBundlesForProduct(site,product);return bs.length?bs:[{id:'single',name:'Single',qty:1,price:null,badge:'',active:true}]}
function selectedBundle(site,product){const bs=bundlesFor(site,product);return bs.find(b=>b.id===selectedBundleId)||bs[0]}
function bundlePrice(variant,bundle){return bundle?.price==null?Number(variant.price||0):Number(bundle.price||0)}

function renderProductGallery(product){
  const items=getProductMedia(product),main=document.getElementById('productGalleryMain'),thumbs=document.getElementById('productGalleryThumbs');
  if(!main||!thumbs)return;
  if(!items.length){main.innerHTML='<div class="media-empty">NO PRODUCT MEDIA</div>';thumbs.innerHTML='';return}
  if(activeMediaIndex>=items.length)activeMediaIndex=0;
  renderMediaInto(main,items[activeMediaIndex]);
  const cur=document.getElementById('galleryCurrent'),total=document.getElementById('galleryTotal');if(cur)cur.textContent=pad2(activeMediaIndex+1);if(total)total.textContent=pad2(items.length);
  thumbs.innerHTML=items.map((m,i)=>`<button type="button" class="gallery-thumb ${i===activeMediaIndex?'active':''}" data-gallery-index="${i}" aria-label="Open gallery item ${i+1}">${m.type==='video'||m.type==='youtube'?`<span class="video-badge">PLAY</span>${m.poster?`<img src="${m.poster}" alt="">`:'<span class="thumb-video-icon">▶</span>'}`:`<img src="${m.src}" alt="">`}</button>`).join('');
}
function moveGallery(delta){const items=getProductMedia(currentCatalogProduct);if(!items.length)return;activeMediaIndex=(activeMediaIndex+delta+items.length)%items.length;renderProductGallery(currentCatalogProduct)}

function renderEditorial(variant,product){
  const ptitle=localize(product,'title'),pdesc=localize(product,'description'),vname=variantName(variant),vstate=variantState(variant),editorials=currentLocale()==='zh-HK'?variantEditorialZh:variantEditorial;const x=editorials[variant.name]||{descriptor:(vstate||product.productType||'').toUpperCase(),headline:`MEET YOUR\n${ptitle.toUpperCase()}.`,feels:pdesc||'Designed for easy, everyday use.',made:'Movement, travel and everyday routines.',mood:vstate||'Everyday',state:vstate||'RESET'};
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.innerHTML=String(val||'').replace(/\n/g,'<br>')};
  set('productScentTitle',vname||ptitle);set('productState',String(vstate||x.state).toUpperCase());set('productDescriptor',x.descriptor);set('meetName',(vname||ptitle).toUpperCase());set('meetHeadline',x.headline);set('feelsLike',x.feels);set('madeFor',x.made);set('moodCopy',x.mood);set('stateCopy',x.state);
  const kicker=document.getElementById('productKicker');if(kicker)kicker.textContent=ptitle.toUpperCase();
  const lede=document.querySelector('.pdp-lede');if(lede)lede.textContent=pdesc||'Designed to fit naturally into an active routine.';
}
function renderRelated(product){
  const grid=document.getElementById('relatedGrid');if(!grid)return;
  const vs=variantsFor(product);
  grid.innerHTML=vs.map(v=>{const vn=variantName(v),vsn=variantState(v);return `<a class="related-scent-card" href="product.html?product=${encodeURIComponent(product.handle)}&scent=${encodeURIComponent(v.name)}"><div class="related-img">${v.image?`<img src="${v.image}" alt="${vn}">`:'<div class="related-placeholder"></div>'}<span class="scent-dot" style="background:${v.color||'#ddd'}"></span></div><div class="related-meta"><div><strong>${vn}</strong><small>${vsn||product.productType||''}</small></div><span class="round-arrow">↗</span></div></a>`}).join('');
}
function renderRitual(product){const host=document.getElementById('ritualMedia');if(host){const items=getProductMedia(product);renderMediaInto(host,items[2]||items[0])}}

function renderPDP(){
  const site=getSite();currentCatalogProduct=getCatalogProduct(site);if(!currentCatalogProduct)return;
  const vs=variantsFor(currentCatalogProduct);
  if(!selectedVariantId){const q=qs().get('scent')||qs().get('variant');selectedVariantId=(vs.find(v=>v.name.toLowerCase()===(q||'').toLowerCase())||vs[0]).id}
  if(!vs.some(v=>v.id===selectedVariantId))selectedVariantId=vs[0].id;
  const variant=selectedVariant(currentCatalogProduct),bundles=bundlesFor(site,currentCatalogProduct);
  if(!selectedBundleId||!bundles.some(b=>b.id===selectedBundleId))selectedBundleId=bundles[0].id;
  const bundle=selectedBundle(site,currentCatalogProduct);

  document.title=`ZIONBURG — ${localize(currentCatalogProduct,'title')}`;
  const countLabel=document.getElementById('variantCountLabel');if(countLabel)countLabel.textContent=currentLocale()==='zh-HK'?`${vs.length} 款選項`:`${vs.length} ${vs.length===1?'OPTION':'OPTIONS'}`;
  const scentTitle=document.querySelector('.selector-title span:first-child');if(scentTitle)scentTitle.textContent=vs.length>1?tr('chooseScent','CHOOSE YOUR SCENT'):tr('chooseOption','CHOOSE YOUR OPTION');
  document.getElementById('scentOptions').innerHTML=vs.map(v=>`<button type="button" class="option scent-chip ${v.id===variant.id?'active':''}" data-variant="${v.id}" aria-pressed="${v.id===variant.id}"><span class="scent-chip-dot" style="background:${v.color||'#ddd'}"></span><span class="scent-chip-copy"><strong>${variantName(v)}</strong><small>${variantState(v)||tr('option','Option')}</small></span><span class="chip-check">✓</span></button>`).join('');
  const bundleSelector=document.getElementById('bundleSelector'),showBundles=site.features?.bundlesStorefrontVisible===true;if(bundleSelector)bundleSelector.style.display=showBundles?'block':'none';document.getElementById('bundleOptions').innerHTML=showBundles?bundles.map(b=>`<button type="button" class="option pack-chip ${b.id===bundle.id?'active':''}" data-bundle-id="${b.id}" aria-pressed="${b.id===bundle.id}"><span><strong>${b.name}</strong><small>${b.qty||1} ${currentLocale()==='zh-HK'?'件':(Number(b.qty||1)===1?'PACK':'PACKS')}</small></span><span class="pack-price">${b.price!=null?money(b.price):money(variant.price)}</span>${b.badge?`<em>${b.badge}</em>`:''}</button>`).join(''):'';

  const sub=site.subscriptions||{},canShow=!!(sub.enabled!==false&&sub.storefrontVisible!==false&&currentCatalogProduct.subscriptionEligible!==false);
  const purchase=document.getElementById('purchaseSelector');purchase.style.display=canShow?'block':'none';if(!canShow)purchaseType='one_time';
  if(canShow){
    document.getElementById('subscriptionSavings').textContent=`SAVE ${Number(sub.discount||0)}%`;
    const base=bundlePrice(variant,bundle),sp=Math.round(base*(1-Number(sub.discount||0)/100));
    document.getElementById('purchaseOptions').innerHTML=`<button type="button" class="option purchase-chip ${purchaseType==='one_time'?'active':''}" data-purchase="one_time"><span class="fake-radio"></span><span><strong>${tr('oneTime','One-time')}</strong><small>${currentLocale()==='zh-HK'?'需要時購買':'Buy it when you need it'}</small></span><b>${money(base)}</b></button><button type="button" class="option purchase-chip ${purchaseType==='subscription'?'active':''}" data-purchase="subscription"><span class="fake-radio"></span><span><strong>${currentLocale()==='zh-HK'&&(!sub.label||sub.label==='Subscribe & save')?tr('subscribeSave','Subscribe & save'):(sub.label||'Subscribe & save')}</strong><small>${currentLocale()==='zh-HK'?'彈性定期配送':'Flexible recurring delivery'}</small></span><b>${money(sp)}</b></button>`;
    const plan=document.getElementById('subscriptionPlan'),previous=plan.value;plan.innerHTML=(sub.plans||[]).map(p=>`<option value="${p.value}">${p.label}</option>`).join('');if([...plan.options].some(o=>o.value===previous))plan.value=previous;
    document.getElementById('frequencyWrap').style.display=purchaseType==='subscription'?'block':'none';
  }
  renderEditorial(variant,currentCatalogProduct);renderRelated(currentCatalogProduct);renderRitual(currentCatalogProduct);renderProductGallery(currentCatalogProduct);updatePrice();
}
function updatePrice(){
  const site=getSite(),variant=selectedVariant(currentCatalogProduct),bundle=selectedBundle(site,currentCatalogProduct),sub=site.subscriptions||{};let price=bundlePrice(variant,bundle);
  if(purchaseType==='subscription'&&sub.enabled!==false&&sub.storefrontVisible!==false&&currentCatalogProduct.subscriptionEligible!==false)price=Math.round(price*(1-Number(sub.discount||0)/100));
  document.getElementById('pdpPrice').textContent=money(price);const btn=document.getElementById('addToBag');if(btn)btn.innerHTML=`<span>${tr('addToBag','ADD TO BAG')}</span><b>${money(price)}</b>`;
}

document.addEventListener('DOMContentLoaded',()=>{
  renderPDP();
  document.addEventListener('click',e=>{
    const gi=e.target.closest('[data-gallery-index]');if(gi){activeMediaIndex=Number(gi.dataset.galleryIndex);renderProductGallery(currentCatalogProduct);return}
    if(e.target.closest('#galleryPrev')){moveGallery(-1);return}if(e.target.closest('#galleryNext')){moveGallery(1);return}
    const v=e.target.closest('[data-variant]');if(v){selectedVariantId=v.dataset.variant;const variant=selectedVariant(currentCatalogProduct),url=new URL(location.href);url.searchParams.set('product',currentCatalogProduct.handle);url.searchParams.set('scent',variant.name);history.replaceState({},'',url);renderPDP();return}
    const b=e.target.closest('[data-bundle-id]');if(b){selectedBundleId=b.dataset.bundleId;renderPDP();return}
    const p=e.target.closest('[data-purchase]');if(p){purchaseType=p.dataset.purchase;renderPDP();return}
    if(e.target.closest('#addToBag')){
      const site=getSite(),variant=selectedVariant(currentCatalogProduct),bundle=selectedBundle(site,currentCatalogProduct),sub=site.subscriptions||{};let price=bundlePrice(variant,bundle);const subscribed=purchaseType==='subscription'&&sub.enabled!==false&&sub.storefrontVisible!==false&&currentCatalogProduct.subscriptionEligible!==false;if(subscribed)price=Math.round(price*(1-Number(sub.discount||0)/100));const plan=document.getElementById('subscriptionPlan');
      addCart({name:variantsFor(currentCatalogProduct).length>1?`${localize(currentCatalogProduct,'title')} — ${variantName(variant)}`:localize(currentCatalogProduct,'title'),detail:`${site.features?.bundlesStorefrontVisible===true?localize(bundle,'name')||bundle.name:tr('single','Single')}${subscribed&&plan?.selectedOptions?.[0]?' • '+plan.selectedOptions[0].text:''}`,price,qty:1,bundleQty:site.features?.bundlesStorefrontVisible===true?Number(bundle.qty||1):1,color:variant.color,productId:currentCatalogProduct.id,variantId:variant.id,subscription:subscribed,cadence:subscribed?plan?.value:null});
    }
  });
});
