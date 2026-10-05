const json=(statusCode,body)=>({statusCode,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body)});
const clean=v=>String(v||'').trim().replace(/^['"]|['"]$/g,'');
const stripeKey=()=>clean(process.env.STRIPE_SECRET_KEY);
const supabaseUrl=()=>clean(process.env.SUPABASE_URL).replace(/\/$/,'');
const supabaseKey=()=>clean(process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY);
const supaHeaders=()=>({apikey:supabaseKey(),authorization:`Bearer ${supabaseKey()}`,accept:'application/json'});

async function supa(path){
  const r=await fetch(`${supabaseUrl()}/rest/v1/${path}`,{headers:supaHeaders()});
  if(!r.ok)throw new Error(`Supabase lookup failed (${r.status})`);
  return r.json();
}
async function stripeForm(path,params){
  const body=new URLSearchParams();
  Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')body.append(k,String(v))});
  const r=await fetch(`https://api.stripe.com${path}`,{method:'POST',headers:{authorization:`Bearer ${stripeKey()}`,'content-type':'application/x-www-form-urlencoded'},body});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data?.error?.message||'Stripe request failed');
  return data;
}
const safeText=(v,max=200)=>String(v||'').trim().slice(0,max);

export async function handler(event){
  if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
  if(!stripeKey())return json(503,{error:'Stripe is not configured yet.'});
  if(!supabaseUrl()||!supabaseKey())return json(503,{error:'Store catalog connection is not configured.'});
  let body;try{body=JSON.parse(event.body||'{}')}catch{return json(400,{error:'Invalid request'})}
  const items=Array.isArray(body.items)?body.items:[],customer=body.customer||{};
  if(!items.length)return json(400,{error:'Your bag is empty.'});
  for(const key of ['email','firstName','lastName','phone','address','country','region'])if(!safeText(customer[key]))return json(400,{error:'Please complete all required checkout fields.'});
  if(customer.country!=='Hong Kong'&&!safeText(customer.postal))return json(400,{error:'Postal code is required for the selected country.'});
  if(items.some(i=>i.subscription))return json(400,{error:'Subscribe & Save is not live yet. Please choose One-time purchase for this order.'});

  const [products,variants,countries,zones,rates]=await Promise.all([
    supa('products?select=id,title,handle,status,published_at&status=eq.active'),
    supa('product_variants?select=id,product_id,title,price_minor,currency,active&active=eq.true'),
    supa(`market_countries?select=market_id,country_code,country_name,postal_code_required&country_name=eq.${encodeURIComponent(customer.country)}`),
    supa('shipping_zones?select=id,market_id,name,active&active=eq.true'),
    supa('shipping_rates?select=id,shipping_zone_id,name,currency,price_minor,free_over_minor,estimated_days_min,estimated_days_max,active&active=eq.true')
  ]);
  const countryRow=countries[0];if(!countryRow)return json(400,{error:'Shipping is not currently available for the selected country.'});
  const zone=zones.find(z=>z.market_id===countryRow.market_id);const rate=zone&&rates.find(r=>r.shipping_zone_id===zone.id);
  if(!rate)return json(400,{error:'No shipping method is configured for the selected country.'});

  const productMap=new Map(products.map(p=>[p.id,p])),variantMap=new Map(variants.map(v=>[v.id,v]));
  const lineItems=[];let subtotal=0;const metadataVariants=[];
  for(let idx=0;idx<items.length;idx++){
    const item=items[idx],qty=Math.max(1,Math.min(50,Number(item.qty||1))),bundleQty=Math.max(1,Math.min(50,Number(item.bundleQty||1)));
    const v=variantMap.get(String(item.variantId||''));const p=v&&productMap.get(v.product_id);
    if(!v||!p||String(item.productId||'')!==p.id)return json(400,{error:`Item ${idx+1} is no longer available.`});
    const packs=qty*bundleQty,unit=Number(v.price_minor||0);subtotal+=unit*packs;metadataVariants.push(`${v.id}:${packs}`);
    lineItems.push({name:`${p.title} — ${v.title}`,description:'1 pack = 6 wipes',unit_amount:unit,currency:String(v.currency||'HKD').toLowerCase(),quantity:packs});
  }
  const shipAmount=rate.free_over_minor!=null&&subtotal>=Number(rate.free_over_minor)?0:Number(rate.price_minor||0);
  const params={
    mode:'payment',
    ui_mode:'hosted_page',
    success_url:'https://zb.life/checkout-success.html?session_id={CHECKOUT_SESSION_ID}',
    cancel_url:'https://zb.life/checkout.html?cancelled=1',
    customer_email:safeText(customer.email,320),
    client_reference_id:`zb_${Date.now()}`,
    'metadata[first_name]':safeText(customer.firstName,100),
    'metadata[last_name]':safeText(customer.lastName,100),
    'metadata[phone]':safeText(customer.phone,80),
    'metadata[address]':safeText(customer.address,300),
    'metadata[country]':safeText(customer.country,100),
    'metadata[region]':safeText(customer.region,100),
    'metadata[postal]':safeText(customer.postal,40),
    'metadata[variants]':metadataVariants.join(',').slice(0,500),
    'metadata[shipping_minor]':shipAmount,
    billing_address_collection:'auto',
    submit_type:'pay'
  };
  lineItems.forEach((li,i)=>{
    params[`line_items[${i}][price_data][currency]`]=li.currency;
    params[`line_items[${i}][price_data][unit_amount]`]=li.unit_amount;
    params[`line_items[${i}][price_data][product_data][name]`]=li.name;
    params[`line_items[${i}][price_data][product_data][description]`]=li.description;
    params[`line_items[${i}][quantity]`]=li.quantity;
  });
  if(shipAmount>0){
    const i=lineItems.length;
    params[`line_items[${i}][price_data][currency]`]=String(rate.currency||'HKD').toLowerCase();
    params[`line_items[${i}][price_data][unit_amount]`]=shipAmount;
    params[`line_items[${i}][price_data][product_data][name]`]=rate.name||'Standard Delivery';
    params[`line_items[${i}][quantity]`]=1;
  }
  try{
    const session=await stripeForm('/v1/checkout/sessions',params);
    return json(200,{url:session.url,id:session.id});
  }catch(err){
    return json(502,{error:String(err.message||err).slice(0,500)});
  }
}