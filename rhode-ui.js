/* Shopify-style "added to bag" popup. Wraps the existing addCart(); cart storage is untouched. */
(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  var timer=null;
  function toast(item){
    var el=document.getElementById('zbAddedToast');
    if(!el){el=document.createElement('div');el.id='zbAddedToast';el.className='zb-added';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}
    var thumb=item.image?'<img src="'+esc(item.image)+'" alt="">':'<span style="background:'+esc(item.color||'#ecdccf')+'"></span>';
    var count=0;try{count=getCart().reduce(function(s,i){return s+Number(i.qty||1)},0)}catch(e){}
    el.innerHTML='<button type="button" class="zb-added-x" aria-label="Close">×</button>'+
      '<div class="zb-added-head">✓ added to bag</div>'+
      '<div class="zb-added-row"><div class="zb-added-thumb">'+thumb+'</div><div class="zb-added-copy"><strong>'+esc(item.name)+'</strong><small>'+esc(item.detail||'')+'</small></div></div>'+
      '<div class="zb-added-actions"><button type="button" class="zb-added-view">view bag'+(count?' ('+count+')':'')+'</button><a class="zb-added-checkout" href="checkout.html">checkout</a></div>';
    el.classList.add('show');
    clearTimeout(timer);timer=setTimeout(hide,6000);
    el.querySelector('.zb-added-x').onclick=hide;
    el.querySelector('.zb-added-view').onclick=function(){hide();if(typeof openCart==='function')openCart()};
  }
  function hide(){var el=document.getElementById('zbAddedToast');if(el)el.classList.remove('show')}
  function wrap(){
    if(typeof addCart!=='function'||window.__zbAddWrapped)return false;
    window.__zbAddWrapped=true;
    window.addCart=function(item){
      var c=getCart();
      c.push(Object.assign({},item,{id:(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now()+Math.random())}));
      saveCart(c);
      toast(item);
    };
    return true;
  }
  if(!wrap()){var n=0,t=setInterval(function(){if(wrap()||++n>100)clearInterval(t)},100)}
})();
