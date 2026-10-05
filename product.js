document.addEventListener('DOMContentLoaded',()=>{
 const s=ZB.state();
 const qs=new URLSearchParams(location.search);
 let current=s.products.find(p=>p.name.toLowerCase()===(qs.get('scent')||'mint').toLowerCase())||s.products.find(p=>p.name==='Mint')||s.products[0];
 const selectors=document.getElementById('scentSelector');
 const packOptions=document.getElementById('packOptions');
 const bundleModeWrap=document.getElementById('bundleModeWrap');
 const bundleMode=document.getElementById('bundleMode');
 const sameScentSummary=document.getElementById('sameScentSummary');
 const mixBuilder=document.getElementById('mixBuilder');
 const mixScentList=document.getElementById('mixScentList');
 const mixProgress=document.getElementById('mixProgress');
 const addBtn=document.getElementById('pdpAdd');
 const bundleCfg=s.bundles||{};
 const subscriptionCfg=s.subscriptionConfig||{};
 let purchaseType='one_time';
 const activeSubPlans=()=>subscriptionCfg.enabled===false?[]:(subscriptionCfg.plans||[]).filter(x=>x.enabled!==false);
 let selectedPlanId=subscriptionCfg.defaultPlanId||activeSubPlans()[0]?.id||'';
 let mode='same';
 let mixCounts={};

 function availableOptions(){
   const list=(bundleCfg.packOptions||[]).filter(o=>o.enabled!==false&&Number(o.size)>0);
   return list.length?list:[{id:'fallback-single',size:1,price:null,label:'1 Pack',badge:'TRY ONE',enabled:true,mode:'same'}];
 }
 let selectedOptionId=(availableOptions().find(o=>Number(o.size)===1)||availableOptions()[0]).id;
 function selectedOption(){return availableOptions().find(o=>String(o.id)===String(selectedOptionId))||availableOptions()[0]}
 function qty(){return Math.max(1,Number(selectedOption().size||1))}

 selectors.innerHTML=s.products.map(p=>`<button class="scent-dot" title="${ZB.esc(p.name)}" data-scent="${ZB.esc(p.name)}" style="background:${p.color}"></button>`).join('');

 function optionPrice(opt=selectedOption()){
   const q=Math.max(1,Number(opt.size||1));
   if(opt.price!==null&&opt.price!==''&&Number.isFinite(Number(opt.price)))return Number(opt.price);
   return Number(current.price||0)*q;
 }
 function savePct(opt=selectedOption()){
   const q=Math.max(1,Number(opt.size||1));
   if(q===1)return 0;
   const full=Number(current.price||0)*q,price=optionPrice(opt);
   return full>price?Math.round((full-price)/full*100):0;
 }
 function optionBadge(opt){
   const custom=String(opt.badge||'').trim();
   if(custom)return custom;
   const pct=savePct(opt);
   return pct?`SAVE ${pct}%`:Number(opt.size)===1?'TRY ONE':'';
 }
 function totalMixed(){return Object.values(mixCounts).reduce((a,b)=>a+b,0)}
 function optionMode(){const q=qty();if(q===1)return'same';const m=selectedOption().mode||'both';return['same','mix','both'].includes(m)?m:'both'}
 function bundleMeta(){
   const opt=selectedOption(),q=qty();
   if(q===1)return current.state;
   if(mode==='same')return `${ZB.esc(opt.label||q+' Pack')} • ${q} × ${current.name} • ${current.state}`;
   return `${opt.label||q+' Pack'} • `+s.products.filter(p=>mixCounts[p.name]).map(p=>`${p.name} × ${mixCounts[p.name]}`).join(' • ');
 }
 function renderPackOptions(){
   const opts=availableOptions();
   if(!opts.some(o=>String(o.id)===String(selectedOptionId)))selectedOptionId=opts[0].id;
   packOptions.innerHTML=opts.map(o=>{const price=optionPrice(o),badge=optionBadge(o);return `<button type="button" class="pack-card ${String(selectedOptionId)===String(o.id)?'active':''}" data-pack-id="${ZB.esc(o.id)}"><span>${ZB.esc(o.label||Number(o.size)+' Pack')}</span><strong>HK$${price}</strong><small>${badge?ZB.esc(badge):'&nbsp;'}</small></button>`}).join('');
   packOptions.querySelectorAll('[data-pack-id]').forEach(b=>b.onclick=()=>{selectedOptionId=b.dataset.packId;const m=optionMode();mode=m==='mix'?'mix':'same';mixCounts={};renderPurchase()});
 }
 function renderMix(){
   const target=qty(),total=totalMixed();
   mixProgress.textContent=`${total} / ${target} SELECTED`;
   mixScentList.innerHTML=s.products.map(p=>`<div class="mix-scent-row"><div class="mix-scent-name"><i style="background:${p.color}"></i><span>${ZB.esc(p.name)}</span></div><div class="mix-stepper"><button type="button" data-minus="${ZB.esc(p.name)}" ${!mixCounts[p.name]?'disabled':''}>−</button><strong>${mixCounts[p.name]||0}</strong><button type="button" data-plus="${ZB.esc(p.name)}" ${total>=target?'disabled':''}>+</button></div></div>`).join('');
   mixScentList.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{if(totalMixed()>=target)return;mixCounts[b.dataset.plus]=(mixCounts[b.dataset.plus]||0)+1;renderPurchase()});
   mixScentList.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{const k=b.dataset.minus;if(mixCounts[k]>0)mixCounts[k]--;renderPurchase()});
 }
 function subscriptionPrice(base){const pct=Math.max(0,Math.min(100,Number(subscriptionCfg.discountPercent||0)));return Math.max(0,Math.round(Number(base||0)*(1-pct/100)))}
 function selectedSubPlan(){return activeSubPlans().find(x=>String(x.id)===String(selectedPlanId))||activeSubPlans()[0]}
 function renderSubscription(basePrice){
   const wrap=document.getElementById('subscriptionPurchase');
   const plans=activeSubPlans();
   if(!wrap)return;
   if(subscriptionCfg.enabled===false||!plans.length){wrap.hidden=true;purchaseType='one_time';return}
   wrap.hidden=false;
   if(!plans.some(x=>String(x.id)===String(selectedPlanId)))selectedPlanId=plans[0].id;
   const pct=Math.max(0,Math.min(100,Number(subscriptionCfg.discountPercent||0)));
   document.getElementById('oneTimePrice').textContent=`HK$${basePrice}`;
   document.getElementById('subscribePrice').textContent=`HK$${subscriptionPrice(basePrice)}`;
   document.getElementById('subscribeOptionLabel').textContent=String(subscriptionCfg.label||'Subscribe & save').toUpperCase();
   document.getElementById('subscribeDiscountText').textContent=pct?`SAVE ${pct}%`:'RECURRING';
   document.getElementById('subscriptionSavingsLabel').textContent=pct?`SAVE ${pct}% ON RECURRING ORDERS`:'RECURRING DELIVERY';
   document.querySelectorAll('[data-purchase-type]').forEach(b=>b.classList.toggle('active',b.dataset.purchaseType===purchaseType));
   const freq=document.getElementById('subscriptionFrequency');freq.hidden=purchaseType!=='subscription';
   const select=document.getElementById('subscriptionPlan');select.innerHTML=plans.map(x=>`<option value="${ZB.esc(x.id)}" ${String(x.id)===String(selectedPlanId)?'selected':''}>${ZB.esc(x.label)}</option>`).join('');
 }
 function renderPurchase(){
   renderPackOptions();
   const opt=selectedOption(),target=qty(),m=optionMode();
   if(m==='same')mode='same';else if(m==='mix')mode='mix';else if(!['same','mix'].includes(mode))mode='same';
   bundleModeWrap.hidden=target===1||m!=='both';
   bundleMode.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
   sameScentSummary.hidden=target===1||mode!=='same';
   mixBuilder.hidden=target===1||mode!=='mix';
   if(target>1&&mode==='same')sameScentSummary.innerHTML=`<span>${target} × ${ZB.esc(current.name)}</span><strong>HK$${optionPrice(opt)}</strong>`;
   if(target>1&&mode==='mix')renderMix();
   const valid=target===1||mode==='same'||totalMixed()===target;
   addBtn.disabled=!valid;
   const basePrice=optionPrice(opt);
   renderSubscription(basePrice);
   const price=purchaseType==='subscription'?subscriptionPrice(basePrice):basePrice;
   addBtn.textContent=valid?`${purchaseType==='subscription'?'SUBSCRIBE':'ADD TO BAG'} — HK$${price}`:`SELECT ${target-totalMixed()} MORE`;
   document.getElementById('productPrice').textContent=price;
   document.getElementById('bundleHint').textContent=optionBadge(opt)||String(opt.label||'CHOOSE YOUR PACK').toUpperCase();
 }
 function render(){
   document.getElementById('productName').textContent=current.name;
   document.getElementById('productState').textContent=current.state;
   document.getElementById('productMoment').textContent=current.moment+'.';
   document.getElementById('selectedDescriptor').textContent=current.descriptor;
   document.getElementById('resetCopy').textContent='Made for '+current.moment.toLowerCase()+'.';
   document.getElementById('meetName').textContent=current.name.toUpperCase();
   document.getElementById('meetHeadline').innerHTML=`YOUR ${current.descriptor.split(' • ').slice(0,2).join(', ').toUpperCase()}<br>POST-MOVEMENT RESET.`;
   document.getElementById('feelsLike').textContent=current.descriptor.replace(/ • /g,', ')+'.';
   document.getElementById('madeFor').textContent=current.moment+'.';
   document.getElementById('moodCopy').textContent=current.descriptor;
   document.getElementById('stateCopy').textContent=current.state;
   document.getElementById('galleryScent1').textContent=current.name.toUpperCase();
   document.querySelector('.pdp-pouch').style.background=current.color;
   document.querySelector('.mini-pouch').style.background=current.color;
   document.querySelector('.ritual-pouch')?.style.setProperty('background',current.color);
   selectors.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.scent===current.name));
   renderPurchase();
 }
 selectors.querySelectorAll('button').forEach(b=>b.onclick=()=>{current=s.products.find(p=>p.name===b.dataset.scent);if(mode==='mix')mixCounts={};render()});
 bundleMode.querySelectorAll('button').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;mixCounts={};renderPurchase()});
 document.querySelectorAll('[data-purchase-type]').forEach(b=>b.onclick=()=>{purchaseType=b.dataset.purchaseType;renderPurchase()});
 document.getElementById('subscriptionPlan')?.addEventListener('change',e=>{selectedPlanId=e.target.value;renderPurchase()});
 addBtn.onclick=()=>{
   if(addBtn.disabled)return;
   const opt=selectedOption(),target=qty(),basePrice=optionPrice(opt),isBundle=target>1;
   const plan=selectedSubPlan();
   const isSubscription=purchaseType==='subscription'&&plan;
   const price=isSubscription?subscriptionPrice(basePrice):basePrice;
   const name=!isBundle?`${current.name} Refreshing Body Wipes`:mode==='same'?`${opt.label||target+' Pack'} — ${current.name} Refreshing Body Wipes`:`${opt.label||target+' Pack'} — Mix & Match`;
   const meta=[bundleMeta(),isSubscription?`SUBSCRIPTION • ${plan.label}`:''].filter(Boolean).join(' • ');
   ZB.addToCart({name,price,basePrice,color:current.color,meta,bundle:isBundle,packSize:target,bundleId:opt.id,selections:mode==='mix'?mixCounts:null,purchaseType:isSubscription?'subscription':'one_time',subscription:isSubscription?{planId:plan.id,label:plan.label,interval:plan.interval,intervalCount:plan.intervalCount,discountPercent:Number(subscriptionCfg.discountPercent||0),recurringAmount:price}:null});
 };
 render();

 let idx=0;const track=document.getElementById('pdpGalleryTrack'),dots=document.getElementById('galleryDots'),total=3;
 dots.innerHTML=Array.from({length:total},(_,i)=>`<button data-i="${i}" aria-label="Image ${i+1}"></button>`).join('');
 function go(n){idx=(n+total)%total;track.style.transform=`translateX(-${idx*100}%)`;document.getElementById('galleryCurrent').textContent=idx+1;dots.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===idx))}
 document.getElementById('galleryPrev').onclick=()=>go(idx-1);document.getElementById('galleryNext').onclick=()=>go(idx+1);dots.querySelectorAll('button').forEach(b=>b.onclick=()=>go(Number(b.dataset.i)));go(0);
 let x0=null;track.addEventListener('touchstart',e=>x0=e.touches[0].clientX,{passive:true});track.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>45)go(idx+(dx<0?1:-1));x0=null},{passive:true});
 const gm=s.media.gallery||[];document.querySelectorAll('.pdp-slide').forEach((el,i)=>{if(gm[i])el.innerHTML=`<img src="${ZB.esc(gm[i])}" alt="${ZB.esc(current.name)} product image ${i+1}" style="width:100%;height:100%;object-fit:cover">`});
 const ritual=s.ritual||{};const ritualSection=document.getElementById('ritualSection');if(ritualSection)ritualSection.style.display=ritual.visible===false?'none':'';const re=document.getElementById('ritualEyebrowText');if(re)re.textContent=ritual.eyebrow||'';const rh=document.getElementById('ritualHeadlineText');if(rh){rh.textContent=ritual.headline||'';rh.style.whiteSpace='pre-line'}const rb=document.getElementById('ritualBodyText');if(rb)rb.textContent=ritual.body||'';const rc=document.getElementById('ritualCta');if(rc){rc.textContent=ritual.ctaText||'';rc.href=ZB.hrefFor(ritual.ctaTarget||'home-bundles');rc.style.display=ritual.ctaText?'inline-flex':'none'}
 const rm=document.getElementById('ritualMedia');if(s.media.ritualUrl){if(s.media.ritualType==='video'){rm.innerHTML=`<video autoplay muted loop playsinline ${s.media.ritualControls?'controls':''} ${s.media.ritualPoster?`poster="${ZB.esc(s.media.ritualPoster)}"`:''}><source src="${ZB.esc(s.media.ritualUrl)}"></video>`}else rm.innerHTML=`<img src="${ZB.esc(s.media.ritualUrl)}" alt="${ZB.esc(ritual.eyebrow||'Between sweat and shower')}">`}
 const rel=document.getElementById('relatedGrid');rel.innerHTML=s.products.slice(0,3).map(p=>`<article class="product-card"><a href="product.html?scent=${encodeURIComponent(p.name)}"><div class="product-art"><div class="pouch" style="background:${p.color}"><span>ZB</span><small>REFRESHING BODY WIPES</small><b>${ZB.esc(p.name.toUpperCase())}</b></div></div><div class="product-meta"><h3>${ZB.esc(p.name)} — ${ZB.esc(p.state)}</h3><p>${ZB.esc(p.descriptor)}</p></div></a></article>`).join('');
});
