document.addEventListener('DOMContentLoaded',()=>{
 const s=ZB.state();
 document.getElementById('heroEyebrow').textContent=s.hero.eyebrow;document.getElementById('heroTitle').innerHTML=ZB.esc(s.hero.title).replace(/\n/g,'<br>');document.getElementById('heroSubtitle').textContent=s.hero.subtitle;
 if(s.hero.video){const v=document.getElementById('heroVideo');v.src=s.hero.video;v.style.display='block'}else document.getElementById('heroVideo').style.display='none';
 const grid=document.getElementById('productGrid');grid.innerHTML=s.products.map(p=>`<article class="product-card"><a href="product.html?scent=${encodeURIComponent(p.name)}"><div class="product-art"><div class="pouch" style="--accent:${p.color};background:${p.color}"><span>ZB</span><small>REFRESHING<br>BODY WIPES</small><b>${p.name.toUpperCase()}</b></div></div></a><div class="product-meta"><h3>${p.name} — ${p.state}</h3><p>${p.descriptor}</p><div class="product-meta-row"><span>HK$${p.price}</span><button class="add-btn" data-add="${p.name}">ADD</button></div></div></article>`).join('');
 grid.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const p=s.products.find(x=>x.name===b.dataset.add);ZB.addToCart({name:`${p.name} Refreshing Body Wipes`,price:p.price,color:p.color,meta:p.state})});
 document.getElementById('bundleBtn').onclick=()=>{location.href='product.html?scent=Mint#inlineBundle'};
});
