document.addEventListener('DOMContentLoaded',()=>{
  const s=getSite(),product=getPrimaryCatalogProduct(s),variants=getProductVariants(product);
  const locale=currentLocale(),ct=s.localization?.contentTranslations?.[locale]||{};
  document.getElementById('heroEyebrow').textContent=ct.heroEyebrow||s.homepage.eyebrow;
  document.getElementById('heroTitle').innerHTML=(ct.heroTitle||s.homepage.title).replace(/\n/g,'<br>');
  document.getElementById('heroSubtitle').textContent=ct.heroSubtitle||s.homepage.subtitle;
  const hm=s.homepageMedia||defaults.homepageMedia;
  const heroHost=document.getElementById('homeHeroMedia');
  if(heroHost)heroHost.dataset.heroLabel=String(hm.hero?.alt||'').trim();
  renderMediaInto(heroHost,hm.hero);
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
  const commitment=s.homepage?.commitment||{visible:true,eyebrow:'OUR COMMITMENT',title:'CLEANER BODIES.\nBRIGHTER DAYS.',copy:'High-performance, low-impact personal care for a cleaner, healthier and more active world.'};
  const commitmentSection=document.getElementById('about');
  if(commitmentSection)commitmentSection.hidden=commitment.visible===false;
  const commitmentEyebrow=commitmentSection?.querySelector('.commitment-content .eyebrow');
  const commitmentTitle=commitmentSection?.querySelector('.commitment-content h2');
  const commitmentCopy=commitmentSection?.querySelector(':scope > p');
  if(commitmentEyebrow)commitmentEyebrow.textContent=commitment.eyebrow||'OUR COMMITMENT';
  if(commitmentTitle)commitmentTitle.innerHTML=String(commitment.title||'CLEANER BODIES.\nBRIGHTER DAYS.').replace(/\n/g,'<br>');
  if(commitmentCopy)commitmentCopy.textContent=commitment.copy||'';
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


// v17.1 editable homepage mood cards
document.addEventListener('DOMContentLoaded',()=>{
  const site=getSite();
  const defaultsMood=[
    {key:'post',title:'Post-workout',subtitle:'Cool down. Clean up. Keep moving.',scent:'Mint',image:'assets/movement.jpg',visible:true},
    {key:'beach',title:'Beach',subtitle:'Salt, sun and somewhere to be next.',scent:'Cucumber',image:'assets/hero-editorial.jpg',visible:true},
    {key:'travel',title:'Travel',subtitle:'A carry-on reset between places.',scent:'Amber',image:'assets/travel.jpg',visible:true},
    {key:'slow',title:'Slow morning',subtitle:'Soft routines and nowhere to rush.',scent:'Lavender',image:'assets/everyday.jpg',visible:true},
    {key:'night',title:'Night out',subtitle:'Refresh before the next plan.',scent:'Rose',image:'assets/product-editorial.jpg',visible:true},
    {key:'outdoors',title:'Outdoors',subtitle:'Fresh air, long days, easy resets.',scent:'Orange',image:'assets/nature.jpg',visible:true}
  ];
  const source=Array.isArray(site.homepage?.moods)?site.homepage.moods:[];
  const moods=defaultsMood.map((d,i)=>({...d,...(source.find(x=>x.key===d.key)||source[i]||{})}));
  document.querySelectorAll('.pj-mood-card').forEach((card,i)=>{
    const m=moods[i];if(!m)return;
    card.style.display=m.visible===false?'none':'';
    const a=card.querySelector('.pj-mood-media'),img=a?.querySelector('img'),title=card.querySelector('h3'),sub=card.querySelector('p');
    const href=`product.html?mood=${encodeURIComponent(m.key)}&scent=${encodeURIComponent(m.scent||'')}`;
    if(a)a.href=href;if(img&&m.image){img.src=m.image;img.alt=m.title||''}if(title)title.textContent=m.title||'';if(sub)sub.textContent=m.subtitle||'';
  });
  const cta=site.homepage?.moodCta||{label:'FIND YOUR MOOD →',link:'product.html',visible:true};
  const ctaEl=document.getElementById('moodGridCta');
  if(ctaEl){ctaEl.textContent=cta.label||'FIND YOUR MOOD →';ctaEl.href=cta.link||'product.html';ctaEl.closest('.pj-mood-cta-wrap').style.display=cta.visible===false?'none':''}
});


// v17.2 dedicated editable Visual Journal
document.addEventListener('DOMContentLoaded',()=>{
  const site=getSite(),host=document.getElementById('visualJournalGrid');if(!host)return;
  const eyebrow=document.getElementById('journalEyebrow'),title=document.getElementById('journalTitle');
  if(eyebrow)eyebrow.textContent=site.homepage?.journalEyebrow||'ZB / VISUAL JOURNAL';
  if(title)title.textContent=site.homepage?.journalTitle||'Save the feeling.';
  const life=site.homepageMedia?.lifestyle||[];
  const stored=Array.isArray(site.homepage?.journal)?site.homepage.journal:[];
  const journal=(stored.length?stored:life.slice(0,4).map((m,i)=>({image:m?.src||'',alt:m?.alt||'',size:i===0||i===2?'tall':'standard',visible:m?.visible!==false}))).filter(x=>x?.visible!==false);
  const quoteTitle=site.homepage?.journalQuoteTitle||'FOR THE IN-BETWEEN';
  const quoteText=site.homepage?.journalQuoteText||'Between shower and everywhere else.';
  const escHtml=s=>String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const cards=[];
  journal.forEach((j,i)=>{
    cards.push(`<article class="pj-pin ${j.size==='tall'?'pj-pin-tall':''}"><img class="pj-journal-image" src="${escHtml(j.image)}" alt="${escHtml(j.alt||'Visual journal image')}" loading="lazy"></article>`);
    if(i===1)cards.push(`<article class="pj-pin pj-quote"><div class="life-card-copy"><h3>${escHtml(quoteTitle)}</h3><p>${escHtml(quoteText)}</p></div></article>`);
  });
  if(journal.length<2)cards.push(`<article class="pj-pin pj-quote"><div class="life-card-copy"><h3>${escHtml(quoteTitle)}</h3><p>${escHtml(quoteText)}</p></div></article>`);
  host.innerHTML=cards.join('');
});
