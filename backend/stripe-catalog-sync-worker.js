/**
 * ZB Stripe catalog sync endpoint (Cloudflare Worker-style example).
 * Required secret: STRIPE_SECRET_KEY
 * IMPORTANT: Protect /api/stripe/sync-catalog with your admin auth/role check.
 * The CMS is the source of truth. This endpoint creates Stripe Product/Price objects
 * for new configurations and returns their IDs for persistence in your database.
 */
const API='https://api.stripe.com/v1';
const form=(obj,prefix='')=>{const out=new URLSearchParams();const walk=(v,k)=>{if(v===undefined||v===null)return;if(Array.isArray(v))return v.forEach((x,i)=>walk(x,`${k}[${i}]`));if(typeof v==='object')return Object.entries(v).forEach(([a,b])=>walk(b,k?`${k}[${a}]`:a));out.append(k,String(v))};Object.entries(obj).forEach(([k,v])=>walk(v,k));return out};
async function stripe(env,path,body){const r=await fetch(API+path,{method:'POST',headers:{authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'content-type':'application/x-www-form-urlencoded'},body:form(body)});const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||`Stripe ${r.status}`);return j}
function amountHKD(n){return Math.max(0,Math.round(Number(n||0)*100))}
function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
async function ensureProduct(env,payload){if(payload.existing?.productId)return {id:payload.existing.productId};return stripe(env,'/products',{name:payload.productName||'Refreshing Body Wipes',metadata:{zb_catalog_key:payload.catalogKey||'refreshing-wipes'}})}
async function createPrice(env,{product,currency,amount,nickname,recurring,metadata}){const body={product,currency,unit_amount:amountHKD(amount),nickname,metadata};if(recurring)body.recurring={interval:recurring.interval,interval_count:recurring.intervalCount};return stripe(env,'/prices',body)}
async function syncCatalog(env,payload){const product=await ensureProduct(env,payload);const currency=(payload.currency||'hkd').toLowerCase();const prices={oneTime:{},bundles:{},subscriptions:{}};
  // Single-pack scent prices. Scent is also copied to Checkout metadata for ZB inventory/reporting.
  for(const scent of payload.products||[]){const key=`single-${slug(scent.name)}`;const p=await createPrice(env,{product:product.id,currency,amount:scent.price,nickname:`${scent.name} — 1 Pack`,metadata:{zb_key:key,kind:'single',scent:scent.name}});prices.oneTime[key]=p.id}
  // Fixed-price bundle options can share one Stripe Price regardless of scent mix.
  for(const opt of (payload.bundles?.packOptions||[]).filter(x=>x.enabled!==false&&Number(x.size)>1)){if(opt.price===null||opt.price==='')continue;const key=`bundle-${slug(opt.id||opt.label)}-${Number(opt.size)}`;const p=await createPrice(env,{product:product.id,currency,amount:Number(opt.price),nickname:opt.label||`${opt.size} Pack`,metadata:{zb_key:key,kind:'bundle',bundle_id:opt.id||'',pack_size:String(opt.size)}});prices.bundles[key]=p.id}
  // Recurring prices: one per fixed pack price × cadence. Existing subscribers stay on the old Price ID when pricing changes.
  const pct=Math.max(0,Math.min(100,Number(payload.subscriptionConfig?.discountPercent||0)));
  for(const opt of (payload.bundles?.packOptions||[]).filter(x=>x.enabled!==false&&Number(x.size)>0)){
    const base=opt.price===null||opt.price===''?null:Number(opt.price);if(base===null&&Number(opt.size)>1)continue;
    for(const plan of (payload.subscriptionConfig?.plans||[]).filter(x=>x.enabled!==false)){
      const amount=base===null?null:Math.round(base*(1-pct/100));if(amount===null)continue;
      const key=`sub-${slug(opt.id||opt.label)}-${plan.intervalCount}-${plan.interval}-${amount}`;
      const p=await createPrice(env,{product:product.id,currency,amount,nickname:`${opt.label||opt.size+' Pack'} · ${plan.label}`,recurring:{interval:plan.interval,intervalCount:Number(plan.intervalCount||1)},metadata:{zb_key:key,kind:'subscription',bundle_id:opt.id||'',plan_id:plan.id||''}});prices.subscriptions[key]=p.id
    }
  }
  return {productId:product.id,prices,lastSyncedAt:new Date().toISOString()}
}
export default {async fetch(request,env){const url=new URL(request.url);if(request.method==='OPTIONS')return new Response(null,{headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'POST,OPTIONS'}});if(request.method!=='POST'||url.pathname!=='/api/stripe/sync-catalog')return new Response('Not found',{status:404});try{if(!env.STRIPE_SECRET_KEY)throw new Error('STRIPE_SECRET_KEY is not configured');/* TODO: verify logged-in admin/editor role here. */const payload=await request.json();const catalog=await syncCatalog(env,payload);return Response.json({catalog})}catch(e){return Response.json({error:e.message},{status:400})}}};
