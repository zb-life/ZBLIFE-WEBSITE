document.addEventListener('DOMContentLoaded',()=>{
  const site=getSite(),key=new URLSearchParams(location.search).get('collection');
  const c=(site.collections||[]).find(x=>x.id===key||x.handle===key)||site.collections?.[0];
  if(!c)return;
  const ctitle=localize(c,'title'),cdesc=localize(c,'description');document.title=`ZIONBURG — ${ctitle}`;
  document.getElementById('collectionName').textContent=ctitle.toUpperCase();
  document.getElementById('collectionDescription').textContent=cdesc||'';
  const products=(site.catalogProducts||[]).filter(p=>(c.productIds||[]).includes(p.id)&&p.status==='active');
  document.getElementById('collectionGrid').innerHTML=products.map(p=>{const v=getProductVariants(p)[0],m=getProductMedia(p).find(x=>x.type==='image');const img=m?.src||v?.image||'';const price=Math.min(...getProductVariants(p).map(x=>Number(x.price||0)));return `<a class="collection-product-card" href="product.html?product=${encodeURIComponent(p.handle)}"><div class="collection-product-image">${img?`<img src="${img}" alt="${localize(p,'title')}">`:''}</div><div class="collection-product-meta"><div><strong>${localize(p,'title')}</strong><small>${p.productType||''}</small></div><span>${money(price)}</span></div></a>`}).join('')||'<p>No active products in this collection yet.</p>';
});
