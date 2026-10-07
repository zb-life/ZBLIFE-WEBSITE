document.addEventListener('DOMContentLoaded',()=>{
  const site=getSite();
  const product=getPrimaryCatalogProduct(site);
  const variants=getProductVariants(product);
  const hm=site.homepageMedia||defaults.homepageMedia;
  const grid=document.getElementById('moodboardGrid');
  if(!grid||!product)return;

  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const media=(item,cls='portrait')=>{
    if(!item?.src)return '';
    if(item.type==='video')return `<div class="mood-pin-media"><video src="${esc(item.src)}" poster="${esc(item.poster||'')}" muted playsinline loop autoplay preload="metadata"></video></div>`;
    return `<div class="mood-pin-media"><img src="${esc(item.src)}" alt="${esc(item.alt||'')}"></div>`;
  };

  const pins=[];

  pins.push(`<article class="mood-pin tall" data-board-kind="movement">
    ${media(hm.hero)}
    <span class="mood-pin-label">MOVE / RESET</span>
    <div class="mood-pin-copy"><small>VISUAL 01</small><h3>Clean care for the in-between moments.</h3><p>From movement to meetings, keep the reset within reach.</p></div>
  </article>`);

  pins.push(`<article class="mood-pin text-pin warm" data-board-kind="ritual">
    <span class="eyebrow">ZB NOTE</span>
    <h3>THE BEST RITUALS FIT INTO REAL LIFE.</h3>
    <p>Performance care, but softer. Editorial, useful and made to move with you.</p>
  </article>`);

  variants.forEach((v,i)=>{
    const name=localize(v,'name')||v.name;
    const state=localize(v,'state')||v.state||'';
    pins.push(`<article class="mood-pin scent-pin ${i%3===0?'portrait':'square'}" data-board-kind="scent" style="--pin-color:${v.color||'#ddd'}">
      <a href="product.html?product=${encodeURIComponent(product.handle)}&scent=${encodeURIComponent(v.name)}">
        <div class="mood-pin-media"><img src="${esc(v.image||'')}" alt="${esc(name)}"></div>
      </a>
      <span class="mood-pin-label">${esc(v.editorialDescriptor||state||'SCENT')}</span>
      <div class="mood-pin-copy">
        <small>SCENT ${String(i+1).padStart(2,'0')}</small>
        <h3>${esc(name)}</h3>
        <p>${esc(v.hoverDescription||state||'A scent for your everyday reset.')}</p>
        <div class="mood-pin-meta"><span>${esc(state)}</span><b>${money(Number(v.price||0))}</b></div>
      </div>
      <button type="button" class="mood-pin-action" data-mood-add="${esc(v.id)}" aria-label="Add ${esc(name)} to bag">＋</button>
    </article>`);

    if(v.video){
      pins.push(`<article class="mood-pin mood-pin-video portrait" data-board-kind="movement">
        <div class="mood-pin-media"><video src="${esc(v.video)}" poster="${esc(v.image||'')}" muted playsinline loop autoplay preload="metadata"></video></div>
        <div class="mood-pin-video-overlay"><small>IN MOTION</small><strong>${esc(name)}</strong></div>
      </article>`);
    }
  });

  const life=hm.lifestyle||[];
  const lifeLabels=[
    ['movement','POST-MOVEMENT','A fresh reset after training.'],
    ['ritual','TRAVEL LIGHT','Your clean companion, wherever you go.'],
    ['ritual','EVERYDAY RESET','Small rituals, repeated often.'],
    ['movement','A CLEANER TOMORROW','Better choices, beautifully lived.']
  ];
  life.forEach((m,i)=>{
    if(m?.visible===false)return;
    const [kind,title,copy]=lifeLabels[i]||['movement','ZB LIFE',''];
    pins.splice(Math.min(2+i*3,pins.length),0,`<article class="mood-pin ${i%2?'landscape':'tall'}" data-board-kind="${kind}">
      ${media(m)}
      <span class="mood-pin-label">${title}</span>
      <div class="mood-pin-copy"><p>${copy}</p></div>
    </article>`);
  });

  pins.splice(5,0,`<article class="mood-pin text-pin alt" data-board-kind="product">
    <span class="eyebrow">OUR SIGNATURE</span>
    <h3>REFRESHING<br>BODY WIPES</h3>
    <p>${esc(site.homepage?.signature?.description||defaults.homepage.signature.description)}</p>
    <a class="moodboard-pill" href="${esc(site.homepage?.signature?.buttonLink||'product.html')}">${esc(site.homepage?.signature?.buttonLabel||'SHOP NOW')} ↗</a>
  </article>`);

  pins.splice(7,0,`<article class="mood-pin product tall" data-board-kind="product">
    ${media(hm.signature)}
    <span class="mood-pin-label">THE SIGNATURE</span>
    <div class="mood-pin-copy"><small>PRODUCT STUDY</small><h3>${esc(localize(product,'title')||product.title)}</h3><p>Plant-based. Alcohol-free. Designed for modern movement.</p></div>
  </article>`);

  if(hm.commitment?.src){
    pins.push(`<article class="mood-pin landscape" data-board-kind="ritual">
      ${media(hm.commitment)}
      <div class="mood-pin-copy"><small>OUR COMMITMENT</small><h3>CLEANER BODIES. BRIGHTER DAYS.</h3></div>
    </article>`);
  }

  grid.innerHTML=pins.join('');

  document.querySelectorAll('[data-board-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-board-filter]').forEach(x=>x.classList.toggle('active',x===btn));
    const filter=btn.dataset.boardFilter;
    document.querySelectorAll('.mood-pin').forEach(pin=>pin.classList.toggle('is-hidden',filter!=='all'&&pin.dataset.boardKind!==filter));
  }));

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-mood-add]');
    if(!btn)return;
    e.preventDefault();
    const variant=variants.find(v=>v.id===btn.dataset.moodAdd);
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