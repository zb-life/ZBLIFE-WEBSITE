document.addEventListener('DOMContentLoaded',()=>{
  const s=getSite(),product=getPrimaryCatalogProduct(s),variants=getProductVariants(product);
  const locale=currentLocale(),ct=s.localization?.contentTranslations?.[locale]||{};
  document.getElementById('heroEyebrow').textContent=ct.heroEyebrow||s.homepage.eyebrow;
  document.getElementById('heroTitle').innerHTML=(ct.heroTitle||s.homepage.title).replace(/\n/g,'<br>');
  document.getElementById('heroSubtitle').textContent=ct.heroSubtitle||s.homepage.subtitle;
  const sig=s.homepage?.signature||defaults.homepage.signature;
  document.getElementById('signatureEyebrow').textContent=sig.eyebrow||defaults.homepage.signature.eyebrow;
  document.getElementById('signatureTitle').innerHTML=String(sig.title||defaults.homepage.signature.title).replace(/\n/g,'<br>');
  document.getElementById('signatureDescription').textContent=sig.description||defaults.homepage.signature.description;
  const signatureButton=document.getElementById('signatureButton');signatureButton.textContent=`${sig.buttonLabel||'SHOP NOW'} →`;signatureButton.href=sig.buttonLink||'product.html';
  const hm=s.homepageMedia||defaults.homepageMedia;
  const heroHost=document.getElementById('homeHeroMedia');
  if(heroHost)heroHost.dataset.heroLabel=String(hm.hero?.alt||'').trim();
  renderMediaInto(heroHost,hm.hero);
  renderMediaInto(document.getElementById('homeSignatureMedia'),hm.signature);
  const lifeItems=hm.lifestyle||[];
  const lifeCards=[...document.querySelectorAll('.lifestyle-editorial .life-card')];
  document.querySelectorAll('[data-home-life-media]').forEach((el,i)=>{
    const item=lifeItems[i];
    renderMediaInto(el,item);
    if(lifeCards[i])lifeCards[i].style.display=item?.visible===false?'none':'';
  });
  const visibleLifeCount=lifeCards.filter((card,i)=>lifeItems[i]?.visible!==false).length;
  const lifeGrid=document.querySelector('.lifestyle-editorial');
  if(lifeGrid)lifeGrid.style.setProperty('--life-columns',String(Math.max(1,visibleLifeCount)));
  renderMediaInto(document.getElementById('homeCommitmentMedia'),hm.commitment);

  const videoSection=document.getElementById('shopVideos'),videoTrack=document.getElementById('shoppableVideoTrack');
  const videoVariants=variants.filter(v=>v.video);
  if(videoSection&&videoTrack){
    if(videoVariants.length){
      videoSection.hidden=false;
      videoTrack.innerHTML=videoVariants.map(v=>{
        const vn=localize(v,'name')||v.name,vs=localize(v,'state')||v.state||'';
        return `<article class="shoppable-video-card" style="--scent-color:${v.color||'#ddd'}">
          <div class="shoppable-video-media">
            <video src="${v.video}" poster="${v.image||''}" muted playsinline loop autoplay preload="metadata"></video>
            <div class="shoppable-video-badge">${String(v.editorialDescriptor||vs||'REFRESH').toUpperCase()}</div>
          </div>
          <div class="shoppable-video-product">
            <div><small>${localize(product,'title')}</small><strong>${vn.toUpperCase()}</strong><span>${vs}</span></div>
            <div class="shoppable-video-buy">
              <b>${money(Number(v.price||0))}</b>
              <button type="button" data-shoppable-add="${v.id}">ADD TO BAG</button>
            </div>
          </div>
        </article>`;
      }).join('');
    }else{
      videoSection.hidden=true;
      videoTrack.innerHTML='';
    }
  }

  document.getElementById('scentGrid').innerHTML=variants.map(v=>{const vn=localize(v,'name')||v.name,vs=localize(v,'state')||v.state||'',descriptor=v.editorialDescriptor||'',hover=v.hoverDescription||`${descriptor ? descriptor+'. ' : ''}${vs ? 'A '+vs.toLowerCase()+' scent for an easy everyday reset.' : 'A refreshing scent for your everyday reset.'}`;return `<a class="scent-card" href="product.html?product=${encodeURIComponent(product.handle)}&scent=${encodeURIComponent(v.name)}" style="--scent-color:${v.color||'#ddd'}"><span class="scent-card-media"><img src="${v.image||''}" alt="${vn}"><span class="scent-hover-card"><span class="scent-hover-top"><i class="scent-hover-dot"></i><b>${descriptor||vs||'YOUR RESET'}</b></span><span class="scent-hover-copy">${hover}</span><span class="scent-hover-cta">MEET ${vn.toUpperCase()} <span>↗</span></span></span></span><strong>${vn.toUpperCase()}</strong><small>${vs}</small></a>`}).join('');

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-shoppable-add]');
    if(!btn)return;
    e.preventDefault();
    const variant=variants.find(v=>v.id===btn.dataset.shoppableAdd);
    if(!variant)return;
    addCart({
      name:`${localize(product,'title')} — ${localize(variant,'name')||variant.name}`,
      detail:tr('single','Single'),
      price:Number(variant.price||0),
      qty:1,
      bundleQty:1,
      color:variant.color,
      productId:product.id,
      variantId:variant.id,
      subscription:false,
      cadence:null
    });
  });
});
