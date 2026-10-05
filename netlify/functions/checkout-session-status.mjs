const json=(statusCode,body)=>({statusCode,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body)});
const clean=v=>String(v||'').trim().replace(/^['"]|['"]$/g,'');
export async function handler(event){
  if(event.httpMethod!=='GET')return json(405,{error:'Method not allowed'});
  const id=String(event.queryStringParameters?.session_id||'');if(!/^cs_/.test(id))return json(400,{error:'Invalid session'});
  const key=clean(process.env.STRIPE_SECRET_KEY);if(!key)return json(503,{error:'Stripe is not configured yet.'});
  const r=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`,{headers:{authorization:`Bearer ${key}`}});
  const data=await r.json().catch(()=>({}));if(!r.ok)return json(r.status,{error:data?.error?.message||'Could not verify payment'});
  return json(200,{id:data.id,payment_status:data.payment_status,status:data.status,customer_email:data.customer_details?.email||data.customer_email||'',amount_total:data.amount_total,currency:data.currency});
}