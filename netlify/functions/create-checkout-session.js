const json=(status,body)=>({statusCode:status,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body)});
const env=name=>String(process.env[name]||'').trim();

function sbHeaders(){
  const key=env('SUPABASE_SERVICE_ROLE_KEY');
  return {'apikey':key,'authorization':'Bearer '+key,'content-type':'application/json','prefer':'return=representation'};
}
async function sb(path,options={}){
  const url=env('SUPABASE_URL').replace(/\/$/,'')+'/rest/v1/'+path;
  const res=await fetch(url,{...options,headers:{...sbHeaders(),...(options.headers||{})}});
  const text=await res.text();
  const data=text?JSON.parse(text):null;
  if(!res.ok) throw new Error('Supabase '+res.status+': '+(data?.message||text));
  return data;
}
const eq=v=>'eq.'+encodeURIComponent(String(v));
const inList=arr=>'in.('+arr.map(x=>String(x).replace(/[^a-f0-9-]/gi,'')).join(',')+')';

function append(params,key,value){
  if(value===undefined||value===null||value==='')return;
  params.append(key,String(value));
}
async function createStripeSession(params){
  const body=new URLSearchParams();
  append(body,'mode','payment');
  append(body,'success_url',params.successUrl);
  append(body,'cancel_url',params.cancelUrl);
  append(body,'customer_email',params.email);
  append(body,'client_reference_id',params.intentId);
  append(body,'metadata[checkout_intent_id]',params.intentId);
  append(body,'payment_intent_data[metadata][checkout_intent_id]',params.intentId);
  append(body,'payment_intent_data[receipt_email]',params.email);
  append(body,'phone_number_collection[enabled]','true');
  append(body,'billing_address_collection','auto');
  params.lines.forEach((line,i)=>{
    append(body,`line_items[${i}][quantity]`,line.quantity);
    append(body,`line_items[${i}][price_data][currency]`,params.currency.toLowerCase());
    append(body,`line_items[${i}][price_data][unit_amount]`,line.unitAmount);
    append(body,`line_items[${i}][price_data][product_data][name]`,line.name);
    if(line.description)append(body,`line_items[${i}][price_data][product_data][description]`,line.description);
  });
  const res=await fetch('https://api.stripe.com/v1/checkout/sessions',{
    method:'POST',
    headers:{authorization:'Bearer '+env('STRIPE_SECRET_KEY'),'content-type':'application/x-www-form-urlencoded'},
    body
  });
  const data=await res.json();
  if(!res.ok)throw new Error(data?.error?.message||'Stripe Checkout could not be created.');
  return data;
}

exports.handler=async(event)=>{
  if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
  if(!env('STRIPE_SECRET_KEY')||!env('SUPABASE_URL')||!env('SUPABASE_SERVICE_ROLE_KEY'))return json(500,{error:'Checkout server is not fully configured.'});
  try{
    const input=JSON.parse(event.body||'{}');
    const customer=input.customer||{};
    const email=String(customer.email||'').trim().toLowerCase();
    const phone=String(customer.phone||'').trim();
    const country=String(customer.country||'').trim();
    const address=String(customer.address||'').trim();
    if(!email||!email.includes('@')||!phone||!country||!address) return json(400,{error:'Please complete your contact and delivery details.'});
    const rawItems=Array.isArray(input.items)?input.items:[];
    if(!rawItems.length)return json(400,{error:'Your bag is empty.'});
    if(rawItems.length>30)return json(400,{error:'Too many line items.'});
    if(rawItems.some(x=>x.subscription))return json(400,{error:'Subscription checkout is not live yet. Please choose one-time purchase for now.'});

    const countryRows=await sb('market_countries?select=market_id,country_code,postal_code_required&country_name='+eq(country));
    let marketId=countryRows?.[0]?.market_id;
    if(!marketId){
      const catchAll=await sb('markets?select=id&status=eq.active&is_catch_all=eq.true&limit=1');
      marketId=catchAll?.[0]?.id;
    }
    if(!marketId)return json(400,{error:'Shipping is not currently available for this country.'});
    const markets=await sb('markets?select=id,name,currency,tax_mode,manual_tax_rate,tax_shipping,status&id='+eq(marketId)+'&limit=1');
    const market=markets?.[0];
    if(!market||market.status!=='active')return json(400,{error:'This market is not currently available.'});

    const variantIds=[...new Set(rawItems.map(x=>String(x.variantId||'')).filter(Boolean))];
    const variants=await sb('product_variants?select=id,product_id,title,sku,price_minor,currency,active,track_inventory,inventory_policy&id='+inList(variantIds));
    const variantMap=new Map((variants||[]).map(v=>[v.id,v]));
    const productIds=[...new Set((variants||[]).map(v=>v.product_id))];
    const products=await sb('products?select=id,title,status&id='+inList(productIds));
    const productMap=new Map((products||[]).map(p=>[p.id,p]));
    const inventory=await sb('inventory?select=variant_id,quantity_on_hand,quantity_reserved&variant_id='+inList(variantIds));
    const invMap=new Map((inventory||[]).map(i=>[i.variant_id,i]));

    const bundleRows=await sb('bundles?select=id,name,scope_type,product_id,quantity,fixed_price_minor,currency,active,storefront_visible&active=eq.true&storefront_visible=eq.true');
    const items=[];
    let subtotal=0;
    for(const raw of rawItems){
      const variant=variantMap.get(String(raw.variantId||''));
      if(!variant||variant.active===false)throw new Error('One of the selected product options is no longer available.');
      const product=productMap.get(variant.product_id);
      if(!product||product.status!=='active')throw new Error('One of the selected products is not available.');
      if(String(variant.currency||'HKD').toUpperCase()!==String(market.currency||'HKD').toUpperCase())throw new Error('This product is not priced for the selected market yet.');
      const qty=Math.max(1,Math.min(20,Number(raw.qty||1)|0));
      const bundleQty=Math.max(1,Math.min(50,Number(raw.bundleQty||1)|0));
      const totalQty=qty*bundleQty;
      const inv=invMap.get(variant.id);
      const available=Number(inv?.quantity_on_hand||0)-Number(inv?.quantity_reserved||0);
      if(variant.track_inventory!==false&&variant.inventory_policy==='deny'&&available<totalQty)throw new Error(`Not enough stock for ${product.title} — ${variant.title}.`);

      const bundle=(bundleRows||[]).find(b=>b.product_id===variant.product_id&&Number(b.quantity||1)===bundleQty);
      const unitLineMinor=bundle?.fixed_price_minor!=null?Number(bundle.fixed_price_minor):Number(variant.price_minor||0)*bundleQty;
      const lineTotalMinor=unitLineMinor*qty;
      subtotal+=lineTotalMinor;
      items.push({
        productId:variant.product_id,variantId:variant.id,productTitle:product.title,variantTitle:variant.title,
        sku:variant.sku||'',qty,bundleQty,totalQty,baseUnitPriceMinor:Number(variant.price_minor||0),
        checkoutUnitMinor:unitLineMinor,lineTotalMinor,bundleName:bundle?.name||''
      });
    }

    const zones=await sb('shipping_zones?select=id&market_id='+eq(market.id)+'&active=eq.true&order=position.asc&limit=1');
    let shipping=0;
    if(zones?.[0]){
      const rates=await sb('shipping_rates?select=price_minor,free_over_minor,min_order_minor,max_order_minor,active&shipping_zone_id='+eq(zones[0].id)+'&active=eq.true&order=position.asc');
      const rate=(rates||[]).find(r=>(r.min_order_minor==null||subtotal>=Number(r.min_order_minor))&&(r.max_order_minor==null||subtotal<=Number(r.max_order_minor)))||rates?.[0];
      if(rate)shipping=(rate.free_over_minor!=null&&subtotal>=Number(rate.free_over_minor))?0:Number(rate.price_minor||0);
    }
    const taxable=subtotal+(market.tax_shipping?shipping:0);
    const tax=market.tax_mode==='manual'?Math.max(0,Math.round(taxable*Number(market.manual_tax_rate||0)/100)):0;
    const total=subtotal+shipping+tax;
    const postal=String(customer.postal||'').trim()||'N/A';
    const customerSnapshot={
      email,first_name:String(customer.firstName||'').trim(),last_name:String(customer.lastName||'').trim(),phone,
      address_line_1:address,address_line_2:'',city:String(customer.city||'').trim()||country,
      region:String(customer.region||'').trim(),postal_code:postal,country,country_code:countryRows?.[0]?.country_code||''
    };

    const intents=await sb('checkout_intents',{
      method:'POST',
      body:JSON.stringify({market_id:market.id,email,customer:customerSnapshot,items,currency:market.currency,subtotal_minor:subtotal,shipping_minor:shipping,tax_minor:tax,total_minor:total,status:'pending'})
    });
    const intent=intents?.[0];
    if(!intent?.id)throw new Error('Could not create checkout record.');

    const lines=items.map(x=>({quantity:x.qty,unitAmount:x.checkoutUnitMinor,name:`${x.productTitle} — ${x.variantTitle}`,description:x.bundleQty>1?`${x.bundleName||x.bundleQty+' pack'}`:''}));
    if(shipping>0)lines.push({quantity:1,unitAmount:shipping,name:'Shipping'});
    if(tax>0)lines.push({quantity:1,unitAmount:tax,name:'Tax'});
    const base=env('URL')||env('DEPLOY_PRIME_URL')||'https://zb.life';
    let session;
    try{
      session=await createStripeSession({intentId:intent.id,email,currency:market.currency,lines,successUrl:base+'/order-success.html?session_id={CHECKOUT_SESSION_ID}',cancelUrl:base+'/checkout.html?cancelled=1'});
    }catch(err){
      await sb('checkout_intents?id='+eq(intent.id),{method:'PATCH',body:JSON.stringify({status:'failed',updated_at:new Date().toISOString()})});
      throw err;
    }
    await sb('checkout_intents?id='+eq(intent.id),{method:'PATCH',body:JSON.stringify({stripe_checkout_session_id:session.id,updated_at:new Date().toISOString()})});
    return json(200,{url:session.url,sessionId:session.id});
  }catch(err){
    console.error('[create-checkout-session]',err);
    return json(400,{error:err.message||'Could not start checkout.'});
  }
};