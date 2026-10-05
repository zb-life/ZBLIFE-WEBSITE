function checkoutCountry(){return document.getElementById('country')?.value||''}
function checkoutMarket(){
  const country=checkoutCountry();
  if(!country) return null;
  const site=getSite(),enabled=(site.markets?.items||[]).filter(m=>m.enabled!==false);
  return enabled.find(m=>(m.countries||[]).includes(country))||enabled.find(m=>(m.countries||[]).includes('Other'))||null;
}
function calc(){
  const c=getCart(),sub=cartSubtotal(),disc=0;
  const after=sub,country=checkoutCountry(),market=checkoutMarket(),ship=market?shippingFor(after,country):0,tax=market?taxFor(after,ship,country):0,total=after+ship+tax;
  document.getElementById('checkoutItems').innerHTML=c.length?c.map(i=>`<div class="order-item"><span>${i.name}<br><small>${i.detail||''}</small></span><b>${money(i.price*i.qty,market||currentMarket())}</b></div>`).join(''):`<p>${tr('bagEmpty','Your bag is empty.')}</p>`;
  document.getElementById('coSubtotal').textContent=money(sub,market||currentMarket());document.getElementById('discountRow').style.display=disc?'flex':'none';document.getElementById('coDiscount').textContent='−'+money(disc,market||currentMarket());document.getElementById('coShipping').textContent=market?(ship?money(ship,market):tr('freeDelivery','FREE')):'—';document.getElementById('shipPrice').textContent=market?(ship?money(ship,market):tr('freeDelivery','FREE')):'—';document.getElementById('coTax').textContent=market?(tax?money(tax,market):money(0,market)):'—';document.getElementById('taxRow').style.display=getSite().markets?.taxEngine==='none'?'none':'flex';document.getElementById('coTotal').textContent=market?money(total,market):money(after,currentMarket());
  const estimate=document.getElementById('shipEstimate');if(estimate)estimate.textContent=market?.deliveryEstimate||tr('deliveryTiming','Delivery timing shown at checkout');
  const note=document.getElementById('shippingAvailability');if(note)note.textContent=market?'':'Shipping is not currently configured for this country.';
  return{sub,disc,ship,tax,total,country,market};
}
function renderCheckoutCountries(){
  const site=getSite(),sel=document.getElementById('country');if(!sel)return;
  const enabled=(site.markets?.items||[]).filter(m=>m.enabled!==false),countries=[];
  enabled.forEach(m=>(m.countries||[]).forEach(c=>{if(c&&c!=='Other'&&!countries.includes(c))countries.push(c)}));
  sel.innerHTML='<option value="">Select country / region</option>'+countries.map(c=>`<option value="${c}">${c}</option>`).join('');
  const cm=currentMarket(site),preferred=(cm.countries||[]).find(c=>c!=='Other');if(preferred&&countries.includes(preferred))sel.value=preferred;
  updatePostalRequirement();
}
function updatePostalRequirement(){
  const country=checkoutCountry(),postal=document.getElementById('postal'),wrap=document.getElementById('postalWrap');
  const required=!!country && country!=='Hong Kong';
  postal.required=required;
  if(wrap)wrap.firstChild.nodeValue=required?'Postal code *':'Postal code';
}
function renderCheckoutAccount(){const site=getSite(),host=document.getElementById('checkoutAccountNote');if(!host||site.features?.customerAccounts===false){if(host)host.hidden=true;return}const c=currentCustomer();if(c){host.innerHTML=`${tr('signedInAs','Signed in as')} <strong>${c.name||c.email}</strong> · <a href="account.html">${tr('viewAccount','View account')}</a>`;document.getElementById('email').value=c.email||'';const parts=String(c.name||'').trim().split(/\s+/);if(parts[0])document.getElementById('firstName').value=parts[0];if(parts.length>1)document.getElementById('lastName').value=parts.slice(1).join(' ')}else host.innerHTML=`${tr('alreadyAccount','Already have an account?')} <a href="account.html">${tr('signIn','Sign in')}</a> ${currentLocale()==='zh-HK'?'再結帳。':'before checkout.'}`}
function showCheckoutError(message){const el=document.getElementById('checkoutError');el.textContent=message;el.style.display='block'}
function clearCheckoutError(){const el=document.getElementById('checkoutError');el.textContent='';el.style.display='none'}

document.addEventListener('DOMContentLoaded',()=>{
  renderCheckoutCountries();renderCheckoutAccount();calc();
  document.getElementById('country')?.addEventListener('change',()=>{updatePostalRequirement();const m=checkoutMarket();if(m)setMarket(m.id);calc()});
  document.getElementById('checkoutForm').addEventListener('submit',async e=>{
    e.preventDefault();clearCheckoutError();
    const form=e.currentTarget;if(!form.checkValidity()){form.reportValidity();return}
    const c=getCart();if(!c.length){showCheckoutError(tr('bagEmpty','Your bag is empty.'));return}
    const t=calc();if(!t.market){showCheckoutError('Shipping is not currently available for the selected country.');return}
    const submit=document.getElementById('checkoutSubmit'),old=submit.textContent;submit.disabled=true;submit.textContent='OPENING SECURE PAYMENT…';
    const payload={
      items:c.map(i=>({productId:i.productId,variantId:i.variantId,qty:Number(i.qty||1),bundleQty:Number(i.bundleQty||1),subscription:!!i.subscription,cadence:i.cadence||null})),
      customer:{
        email:document.getElementById('email').value.trim().toLowerCase(),
        firstName:document.getElementById('firstName').value.trim(),
        lastName:document.getElementById('lastName').value.trim(),
        phone:document.getElementById('phone').value.trim(),
        address:document.getElementById('address').value.trim(),
        country:t.country,
        region:document.getElementById('region').value.trim(),
        postal:document.getElementById('postal').value.trim()
      }
    };
    try{
      const res=await fetch('/.netlify/functions/create-checkout-session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!data.url)throw new Error(data.error||'Could not start secure checkout.');
      location.href=data.url;
    }catch(err){
      showCheckoutError(err.message||'Could not start secure checkout.');
      submit.disabled=false;submit.textContent=old;
    }
  })
});