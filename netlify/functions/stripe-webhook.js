const crypto=require('crypto');
const env=name=>String(process.env[name]||'').trim();
const ok=()=>({statusCode:200,headers:{'content-type':'application/json'},body:'{"received":true}'});
const fail=(status,msg)=>({statusCode:status,headers:{'content-type':'application/json'},body:JSON.stringify({error:msg})});
function sbHeaders(){const key=env('SUPABASE_SERVICE_ROLE_KEY');return {'apikey':key,'authorization':'Bearer '+key,'content-type':'application/json','prefer':'return=representation'};}
async function sb(path,options={}){const res=await fetch(env('SUPABASE_URL').replace(/\/$/,'')+'/rest/v1/'+path,{...options,headers:{...sbHeaders(),...(options.headers||{})}});const text=await res.text();const data=text?JSON.parse(text):null;if(!res.ok)throw new Error('Supabase '+res.status+': '+(data?.message||text));return data;}
const eq=v=>'eq.'+encodeURIComponent(String(v));
function verify(raw,header){
  const parts=String(header||'').split(',').map(x=>x.split('='));
  const t=parts.find(x=>x[0]==='t')?.[1], sigs=parts.filter(x=>x[0]==='v1').map(x=>x[1]);
  if(!t||!sigs.length)return false;
  if(Math.abs(Date.now()/1000-Number(t))>300)return false;
  const expected=crypto.createHmac('sha256',env('STRIPE_WEBHOOK_SECRET')).update(t+'.'+raw,'utf8').digest('hex');
  return sigs.some(s=>{try{return crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(s,'hex'))}catch{return false}});
}
async function sendEmail({to,subject,html,orderId,type}){
  const recipients=Array.isArray(to)?to:[to];
  const clean=recipients.map(x=>String(x||'').trim()).filter(Boolean);
  if(!clean.length)return;
  let status='failed',providerId=null,errorMessage='';
  if(env('RESEND_API_KEY')){
    try{
      const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:'Bearer '+env('RESEND_API_KEY'),'content-type':'application/json'},body:JSON.stringify({from:env('ZB_EMAIL_FROM')||'ZIONBURG <orders@zb.life>',to:clean,subject,html})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data?.message||'Email provider error');
      status='sent';providerId=data.id||null;
    }catch(err){errorMessage=err.message||String(err);}
  }else errorMessage='RESEND_API_KEY is not configured';
  await Promise.all(clean.map(recipient=>sb('email_log',{method:'POST',body:JSON.stringify({order_id:orderId||null,email_type:type,recipient,subject,status,provider_message_id:providerId,metadata:errorMessage?{error:errorMessage}:{}})}).catch(()=>null)));
}
async function salesEmails(){
  if(env('ZB_SALES_EMAILS'))return env('ZB_SALES_EMAILS').split(/[;,\n]+/).map(x=>x.trim()).filter(Boolean);
  try{
    const rows=await sb('site_settings?select=value&setting_key=eq.commerce_private&limit=1');
    const v=rows?.[0]?.value||{};
    return String(v.salesEmails||v.internalEmail||'').split(/[;,\n]+/).map(x=>x.trim()).filter(Boolean);
  }catch{return []}
}
function money(minor,currency){return new Intl.NumberFormat('en-HK',{style:'currency',currency}).format(Number(minor||0)/100);}
async function fulfill(session){
  const sessionId=session.id;
  const existing=await sb('orders?select=id,order_number&stripe_checkout_session_id='+eq(sessionId)+'&limit=1');
  if(existing?.[0])return existing[0];
  const intentId=session.metadata?.checkout_intent_id||session.client_reference_id;
  const intents=await sb('checkout_intents?select=*&id='+eq(intentId)+'&limit=1');
  const intent=intents?.[0];
  if(!intent)throw new Error('Checkout intent not found.');
  if(session.payment_status!=='paid') {
    await sb('checkout_intents?id='+eq(intent.id),{method:'PATCH',body:JSON.stringify({status:'pending',updated_at:new Date().toISOString()})});
    return null;
  }
  const c=intent.customer||{};
  const name=[c.first_name,c.last_name].filter(Boolean).join(' ').trim()||'Customer';
  const ship={first_name:c.first_name||'',last_name:c.last_name||'',phone:c.phone||'',address_line_1:c.address_line_1||'',address_line_2:c.address_line_2||'',city:c.city||c.country||'',region:c.region||'',postal_code:c.postal_code||'N/A',country:c.country||'',country_code:c.country_code||''};
  const orders=await sb('orders',{method:'POST',body:JSON.stringify({
    market_id:intent.market_id||null,email:intent.email,phone:c.phone||'N/A',currency:intent.currency,
    subtotal_minor:intent.subtotal_minor,discount_total_minor:0,shipping_total_minor:intent.shipping_minor,tax_total_minor:intent.tax_minor,grand_total_minor:intent.total_minor,
    order_status:'open',payment_status:'paid',fulfilment_status:'unfulfilled',shipping_address:ship,billing_address:null,
    stripe_checkout_session_id:sessionId,stripe_payment_intent_id:session.payment_intent||null,paid_at:new Date().toISOString(),
    metadata:{customer_name:name,checkout_intent_id:intent.id}
  })});
  const order=orders?.[0];
  if(!order?.id)throw new Error('Order could not be created.');
  const items=(intent.items||[]).map(x=>{
    const base=Number(x.baseUnitPriceMinor||0),qty=Number(x.totalQty||x.qty||1),gross=base*qty,line=Number(x.lineTotalMinor||0);
    return {order_id:order.id,product_id:x.productId||null,variant_id:x.variantId||null,product_title_snapshot:x.productTitle||'Product',variant_title_snapshot:x.variantTitle||null,sku_snapshot:x.sku||null,quantity:qty,unit_price_minor:base,discount_minor:Math.max(0,gross-line),line_total_minor:line,metadata:{bundle_qty:x.bundleQty||1,bundle_name:x.bundleName||''}};
  });
  if(items.length)await sb('order_items',{method:'POST',body:JSON.stringify(items)});
  await sb('payments',{method:'POST',body:JSON.stringify({order_id:order.id,provider:'stripe',provider_payment_id:session.payment_intent||sessionId,amount_minor:intent.total_minor,currency:intent.currency,status:'succeeded',payment_method_type:null,processed_at:new Date().toISOString(),raw_reference:{checkout_session_id:sessionId}})});
  for(const x of intent.items||[]){
    const rows=await sb('inventory?select=id,quantity_on_hand&variant_id='+eq(x.variantId)+'&limit=1');
    if(rows?.[0])await sb('inventory?id='+eq(rows[0].id),{method:'PATCH',body:JSON.stringify({quantity_on_hand:Math.max(0,Number(rows[0].quantity_on_hand||0)-Number(x.totalQty||x.qty||1)),updated_at:new Date().toISOString()})});
  }
  await sb('checkout_intents?id='+eq(intent.id),{method:'PATCH',body:JSON.stringify({status:'paid',updated_at:new Date().toISOString()})});
  const itemHtml=(intent.items||[]).map(x=>`<tr><td style="padding:8px 0">${x.productTitle} — ${x.variantTitle}${x.bundleQty>1?' ('+x.bundleQty+' pack)':''}</td><td style="padding:8px 0;text-align:right">× ${x.qty}</td><td style="padding:8px 0;text-align:right">${money(x.lineTotalMinor,intent.currency)}</td></tr>`).join('');
  const baseHtml=`<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#171717"><h1 style="font-weight:400;letter-spacing:.08em">ZIONBURG</h1><p>Order <strong>${order.order_number}</strong></p><table style="width:100%;border-collapse:collapse">${itemHtml}</table><hr style="border:0;border-top:1px solid #ddd"><p style="text-align:right"><strong>Total ${money(intent.total_minor,intent.currency)}</strong></p><p>Deliver to:<br>${name}<br>${ship.address_line_1}<br>${[ship.city,ship.region,ship.postal_code].filter(Boolean).join(', ')}<br>${ship.country}</p></div>`;
  const sales=await salesEmails();
  if(sales.length)await sendEmail({to:sales,subject:`New ZIONBURG order ${order.order_number} — ${money(intent.total_minor,intent.currency)}`,html:baseHtml,orderId:order.id,type:'sales_order_notification'});
  await sendEmail({to:intent.email,subject:`Your ZIONBURG order ${order.order_number}`,html:`<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#171717"><h1 style="font-weight:400;letter-spacing:.08em">ZIONBURG</h1><h2 style="font-weight:400">ORDER CONFIRMED</h2><p>Thank you, ${name}. We’ve received your order and will let you know when it’s on the way.</p>${baseHtml}</div>`,orderId:order.id,type:'customer_order_confirmation'});
  return order;
}

exports.handler=async(event)=>{
  if(event.httpMethod!=='POST')return fail(405,'Method not allowed');
  if(!env('STRIPE_WEBHOOK_SECRET')||!env('SUPABASE_URL')||!env('SUPABASE_SERVICE_ROLE_KEY'))return fail(500,'Webhook server is not configured.');
  const raw=event.isBase64Encoded?Buffer.from(event.body||'','base64').toString('utf8'):String(event.body||'');
  if(!verify(raw,event.headers['stripe-signature']||event.headers['Stripe-Signature']))return fail(400,'Invalid signature');
  try{
    const evt=JSON.parse(raw);
    const session=evt.data?.object||{};
    if(evt.type==='checkout.session.completed'){
      if(session.payment_status==='paid')await fulfill(session);
      else if(session.metadata?.checkout_intent_id)await sb('checkout_intents?id='+eq(session.metadata.checkout_intent_id),{method:'PATCH',body:JSON.stringify({status:'pending',updated_at:new Date().toISOString()})});
    }else if(evt.type==='checkout.session.async_payment_succeeded'){
      await fulfill({...session,payment_status:'paid'});
    }else if(evt.type==='checkout.session.async_payment_failed'){
      const id=session.metadata?.checkout_intent_id||session.client_reference_id;if(id)await sb('checkout_intents?id='+eq(id),{method:'PATCH',body:JSON.stringify({status:'failed',updated_at:new Date().toISOString()})});
    }else if(evt.type==='checkout.session.expired'){
      const id=session.metadata?.checkout_intent_id||session.client_reference_id;if(id)await sb('checkout_intents?id='+eq(id),{method:'PATCH',body:JSON.stringify({status:'expired',updated_at:new Date().toISOString()})});
    }
    return ok();
  }catch(err){
    console.error('[stripe-webhook]',err);
    return fail(500,err.message||'Webhook processing failed');
  }
};