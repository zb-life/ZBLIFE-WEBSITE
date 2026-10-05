document.addEventListener('DOMContentLoaded',()=>{
 const s=ZB.state(),c=ZB.cart();
 const recurringItems=c.filter(i=>i.purchaseType==='subscription'&&i.subscription);
 const items=document.getElementById('checkoutItems');
 const subtotal=c.reduce((a,i)=>a+Number(i.price||0)*(i.qty||1),0);
 const shippingFee=Math.max(0,Number(s.settings.shippingFee||0));
 const freeThreshold=Math.max(0,Number(s.settings.freeShippingThreshold||0));
 const freeEligible=freeThreshold===0 || subtotal>=freeThreshold;
 let selectedShipping=freeEligible?'free':'standard';
 let appliedDiscount=null;

 items.innerHTML=c.length?c.map(i=>`<div class="checkout-item"><div class="checkout-thumb" style="--accent:${i.color||'#ccc'}"></div><div><strong>${ZB.esc(i.name)}</strong>${i.purchaseType==='subscription'?`<span class="subscription-line">Recurring · ${ZB.esc(i.subscription?.label||'Subscription')}</span>`:''}<small style="display:block">${ZB.esc(i.meta||'')}</small></div><b>HK$${Number(i.price)*(i.qty||1)}</b></div>`).join(''):'<p>Your bag is empty. Add products before checkout.</p>';

 if(recurringItems.length){const note=document.getElementById('subscriptionCheckoutNote');const copy=document.getElementById('subscriptionCheckoutCopy');note.hidden=false;const cadence=[...new Set(recurringItems.map(i=>i.subscription?.label).filter(Boolean))].join(', ');copy.textContent=`${recurringItems.length} recurring item${recurringItems.length===1?'':'s'} · ${cadence}. One-time items can stay in the same Stripe checkout; recurring billing continues on the selected schedule.`;document.getElementById('placeOrderBtn').textContent='PLACE TEST SUBSCRIPTION ORDER →'}

 const standardRadio=document.querySelector('input[name="ship"][value="standard"]');
 const freeRadio=document.querySelector('input[name="ship"][value="free"]');
 const standardCard=document.getElementById('standardShippingCard');
 const freeCard=document.getElementById('freeShippingCard');
 const standardPrice=document.getElementById('standardShipPrice');
 const freeCopy=document.getElementById('freeShipCopy');

 function shippingAmount(){return selectedShipping==='free' && freeEligible?0:shippingFee}
 function renderShipping(){
   standardPrice.textContent=shippingFee?`HK$${shippingFee}`:'Free';
   freeRadio.disabled=!freeEligible;
   if(freeEligible){
     freeCopy.textContent=freeThreshold===0?'Free delivery on every order':`Unlocked — orders over HK$${freeThreshold}`;
     if(selectedShipping!=='standard')selectedShipping='free';
   }else{
     const more=Math.max(0,freeThreshold-subtotal);
     freeCopy.textContent=`Spend HK$${more} more to unlock • HK$${freeThreshold} threshold`;
     selectedShipping='standard';
   }
   standardRadio.checked=selectedShipping==='standard';
   freeRadio.checked=selectedShipping==='free';
   standardCard.classList.toggle('is-selected',standardRadio.checked);
   freeCard.classList.toggle('is-selected',freeRadio.checked);
   freeCard.classList.toggle('is-disabled',!freeEligible);
 }
 document.querySelectorAll('input[name="ship"]').forEach(r=>r.addEventListener('change',()=>{
   if(r.value==='free'&&!freeEligible)return;
   selectedShipping=r.value;
   renderShipping();renderTotals();
 }));
 renderShipping();

 function redemptionCount(code){return ZB.orders().filter(o=>o.discount?.code===code && ['paid','refunded'].includes(o.paymentStatus)).length}
 function discountAmount(d){if(!d)return 0;const raw=d.type==='fixed'?Number(d.value||0):subtotal*Number(d.value||0)/100;return Math.min(subtotal,Math.max(0,Math.round(raw)))}
 function renderTotals(){const amount=discountAmount(appliedDiscount);const shipping=shippingAmount();const total=Math.max(0,subtotal-amount+shipping);document.getElementById('coSubtotal').textContent='HK$'+subtotal;document.getElementById('coShipping').textContent=shipping?'HK$'+shipping:'Free';document.getElementById('coTotal').textContent='HK$'+total;const row=document.getElementById('coDiscountRow');row.hidden=!appliedDiscount;if(appliedDiscount){document.getElementById('coDiscountCode').textContent='('+appliedDiscount.code+')';document.getElementById('coDiscount').textContent='−HK$'+amount}}
 function message(text,ok=false){const el=document.getElementById('discountMessage');el.textContent=text;el.className='discount-message '+(ok?'success':'error')}
 function applyCode(){const code=document.getElementById('discountCode').value.trim().toUpperCase();if(!code){appliedDiscount=null;message('Enter a discount code.');renderTotals();return}const d=(s.discounts||[]).find(x=>x.active && String(x.code).toUpperCase()===code);if(!d){appliedDiscount=null;message('This discount code is not valid.');renderTotals();return}if(subtotal<Number(d.minSpend||0)){appliedDiscount=null;message(`Minimum spend is HK$${Number(d.minSpend||0)}.`);renderTotals();return}if(d.maxUses!==null && redemptionCount(d.code)>=Number(d.maxUses)){appliedDiscount=null;message('This discount code has reached its usage limit.');renderTotals();return}appliedDiscount=d;const amount=discountAmount(d);message(`${d.code} applied — you save HK$${amount}.`,true);renderTotals()}
 document.getElementById('applyDiscount').addEventListener('click',applyCode);
 document.getElementById('discountCode').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyCode()}});
 renderTotals();

 function nextBillingDate(plan,from=new Date()){const d=new Date(from);const n=Math.max(1,Number(plan?.intervalCount||1));if(plan?.interval==='day')d.setDate(d.getDate()+n);else if(plan?.interval==='week')d.setDate(d.getDate()+7*n);else if(plan?.interval==='year')d.setFullYear(d.getFullYear()+n);else d.setMonth(d.getMonth()+n);return d.toISOString()}
 const form=document.getElementById('checkoutForm');form.addEventListener('submit',async e=>{
  e.preventDefault();if(!c.length){alert('Your bag is empty.');return}
  const inputs=form.querySelectorAll('input:not([name="ship"])');const email=inputs[0].value,firstName=inputs[1].value,lastName=inputs[2].value,phone=inputs[3].value,address=inputs[4].value,apt=inputs[5].value,country=form.querySelector('select').value;
  const amount=discountAmount(appliedDiscount);const shipping=shippingAmount();const total=Math.max(0,subtotal-amount+shipping);
  const demoMode=new URLSearchParams(location.search).get('demo')==='1';
  if(demoMode){
    const now=new Date().toISOString();const list=ZB.orders();const num=(list.length+1001);const invoice=`${s.settings.receiptPrefix||'ZB'}-${new Date().getFullYear()}-${String(num).padStart(5,'0')}`;
    const checkoutMode=recurringItems.length?'subscription':'payment';const order={id:'DEMO-ORD-'+Date.now(),orderNumber:'#'+num,invoiceNumber:invoice,createdAt:now,customer:{email,firstName,lastName,phone},shippingAddress:{address,apt,country},items:c,subtotal,discount:appliedDiscount?{...appliedDiscount,amount}:null,discountAmount:amount,shipping,total,currency:s.settings.currency||'HKD',paymentStatus:'paid',fulfillmentStatus:'unfulfilled',paymentMethod:'Demo mode',checkoutMode};list.unshift(order);ZB.saveOrders(list);ZB.upsertCustomerFromOrder(order);ZB.saveCart([]);document.getElementById('successDialog').showModal();document.getElementById('viewReceipt').href='invoice.html?id='+encodeURIComponent(order.id);return;
  }
  const btn=document.getElementById('placeOrderBtn');const old=btn.textContent;btn.disabled=true;btn.textContent='OPENING SECURE CHECKOUT…';
  const base=(s.settings.apiBaseUrl||'').replace(/\/$/,'');
  try{
    const res=await fetch(base+'/api/stripe/create-checkout-session',{method:'POST',headers:{'content-type':'application/json'},credentials:'include',body:JSON.stringify({cart:c,customer:{email,firstName,lastName,phone},shippingAddress:{address,apt,country},shippingMethod:selectedShipping,discountCode:appliedDiscount?.code||null,returnUrl:location.origin+location.pathname.replace(/checkout\.html$/,'index.html')})});
    const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||('HTTP '+res.status));if(!data.url)throw new Error('Checkout URL was not returned.');location.href=data.url;
  }catch(err){alert('Secure checkout is not connected yet: '+err.message+'\n\nConfigure the production backend and Stripe secret key before taking live orders.');btn.disabled=false;btn.textContent=old;}
 })
});
