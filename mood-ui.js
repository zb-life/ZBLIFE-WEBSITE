(()=>{
  const moodToScent={post:'Mint',beach:'Cucumber',travel:'Amber',slow:'Lavender',night:'Rose',outdoors:'Orange'};
  const variantMood={
    'var-mint':{label:'Post-workout',img:'assets/movement.jpg'},
    'var-cucumber':{label:'Beach',img:'assets/hero-editorial.jpg'},
    'var-amber':{label:'Travel',img:'assets/travel.jpg'},
    'var-lavender':{label:'Slow morning',img:'assets/everyday.jpg'},
    'var-rose':{label:'Night out',img:'assets/product-editorial.jpg'},
    'var-orange':{label:'Outdoors',img:'assets/nature.jpg'}
  };
  const q=new URLSearchParams(location.search),m=q.get('mood');
  if(m&&moodToScent[m]&&!q.get('scent')){q.set('scent',moodToScent[m]);history.replaceState(null,'',location.pathname+'?'+q.toString()+location.hash)}
  function decorate(){
    const title=document.querySelector('.pj-mood-selector .selector-title span:first-child'); if(title)title.textContent='CHOOSE YOUR MOOD';
    const count=document.getElementById('variantCountLabel'); if(count)count.textContent='6 MOMENTS';
    document.querySelectorAll('#scentOptions [data-variant]').forEach(btn=>{
      const meta=variantMood[btn.dataset.variant]; if(!meta||btn.dataset.moodDecorated)return;
      const strong=btn.querySelector('strong'),small=btn.querySelector('small');
      const scent=strong?.textContent||'';
      if(strong)strong.textContent=meta.label;
      if(small)small.textContent=scent;
      const img=document.createElement('img');img.className='pj-mood-thumb';img.src=meta.img;img.alt=meta.label;btn.prepend(img);btn.dataset.moodDecorated='1';
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{
    decorate();
    const host=document.getElementById('scentOptions');
    if(host)new MutationObserver(()=>requestAnimationFrame(decorate)).observe(host,{childList:true,subtree:true});
  });
})();