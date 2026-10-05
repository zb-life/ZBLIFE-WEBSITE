document.addEventListener('DOMContentLoaded',()=>{
  const s=getSite(),product=getPrimaryCatalogProduct(s),variants=getProductVariants(product);
  const locale=currentLocale(),ct=s.localization?.contentTranslations?.[locale]||{};
  document.getElementById('heroEyebrow').textContent=ct.heroEyebrow||s.homepage.eyebrow;
  document.getElementById('heroTitle').innerHTML=(ct.heroTitle||s.homepage.title).replace(/\n/g,'<br>');
  document.getElementById('heroSubtitle').textContent=ct.heroSubtitle||s.homepage.subtitle;
  const hm=s.homepageMedia||defaults.homepageMedia;
  renderMediaInto(document.getElementById('homeHeroMedia'),hm.hero);
  renderMediaInto(document.getElementById('homeSignatureMedia'),hm.signature);
  document.querySelectorAll('[data-home-life-media]').forEach((el,i)=>renderMediaInto(el,(hm.lifestyle||[])[i]));
  renderMediaInto(document.getElementById('homeCommitmentMedia'),hm.commitment);
  document.getElementById('scentGrid').innerHTML=variants.map(v=>{const vn=localize(v,'name')||v.name,vs=localize(v,'state')||v.state||'';return `<a class="scent-card" href="product.html?product=${encodeURIComponent(product.handle)}&scent=${encodeURIComponent(v.name)}"><img src="${v.image||''}" alt="${vn}"><strong>${vn.toUpperCase()}</strong><small>${vs}</small></a>`}).join('');
});
