(()=>{
  const defaultMoodToScent={post:'Mint',beach:'Cucumber',travel:'Amber',slow:'Lavender',night:'Rose',outdoors:'Orange'};
  const defaultMoodMeta={
    post:{label:'Post-workout',img:'assets/movement.jpg'},
    beach:{label:'Beach',img:'assets/hero-editorial.jpg'},
    travel:{label:'Travel',img:'assets/travel.jpg'},
    slow:{label:'Slow morning',img:'assets/everyday.jpg'},
    night:{label:'Night out',img:'assets/product-editorial.jpg'},
    outdoors:{label:'Outdoors',img:'assets/nature.jpg'}
  };
  const q=new URLSearchParams(location.search),m=q.get('mood');
  if(m&&defaultMoodToScent[m]&&!q.get('scent')){q.set('scent',defaultMoodToScent[m]);history.replaceState(null,'',location.pathname+'?'+q.toString()+location.hash)}

  function decorate(){
    const site=typeof getSite==='function'?getSite():{};
    const moods=Array.isArray(site.homepage?.moods)?site.homepage.moods:[];
    const byScent={};
    moods.forEach(x=>{if(x?.scent)byScent[String(x.scent).toLowerCase()]={label:x.title||defaultMoodMeta[x.key]?.label||x.scent,img:x.image||defaultMoodMeta[x.key]?.img||''}});
    const params=new URLSearchParams(location.search);
    const product=(site.catalogProducts||[]).find(p=>p.handle===params.get('product'))||(site.catalogProducts||[]).find(p=>p.status==='active')||site.catalogProducts?.[0];
    const variants=product?.variants||[];

    document.querySelectorAll('#scentOptions [data-variant]').forEach(btn=>{
      const variant=variants.find(v=>String(v.id)===String(btn.dataset.variant));
      const strong=btn.querySelector('strong'),small=btn.querySelector('small');
      const scent=(variant?.name||strong?.textContent||small?.textContent||'').trim();
      const meta=byScent[scent.toLowerCase()];
      const label=meta?.label||scent||'Your mood';
      const imgSrc=meta?.img||variant?.image||'';
      if(strong)strong.textContent=label;
      if(small)small.textContent=scent;
      let img=btn.querySelector('img.pj-mood-thumb');
      if(imgSrc){
        if(!img){img=document.createElement('img');img.className='pj-mood-thumb';btn.prepend(img)}
        img.src=imgSrc;img.alt=label;img.hidden=false;
      }else if(img){img.remove()}
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{
    decorate();
    const host=document.getElementById('scentOptions');
    if(host)new MutationObserver(()=>requestAnimationFrame(decorate)).observe(host,{childList:true,subtree:true});
  });
})();