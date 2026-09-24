const ae=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
let sb=null;

function setAccountMode(mode='login',updateUrl=true){
  mode=['login','signup','reset'].includes(mode)?mode:'login';
  document.querySelectorAll('[data-account-form]').forEach(form=>{
    const active=form.dataset.accountForm===mode; form.hidden=!active; form.classList.toggle('active',active)
  });
  document.querySelectorAll('.account-mode-tabs [data-account-mode]').forEach(btn=>{
    const active=btn.dataset.accountMode===(mode==='reset'?'login':mode);
    btn.classList.toggle('active',active); btn.setAttribute('aria-selected',String(active))
  });
  if(updateUrl){
    const u=new URL(location.href);
    if(mode==='signup')u.searchParams.set('mode','signup');
    else if(mode==='reset')u.searchParams.set('mode','reset');
    else u.searchParams.delete('mode');
    history.replaceState({},'',u)
  }
}

async function renderAccount(){
  const site=getSite();
  if(site.features?.customerAccounts===false){
    document.querySelector('.account-shell').innerHTML=`<section class="account-disabled"><span class="eyebrow">CUSTOMER ACCOUNTS</span><h1>${tr('accountsHidden','ACCOUNTS ARE CURRENTLY HIDDEN.')}</h1><p>${tr('guestContinue','You can continue shopping and checking out as a guest.')}</p><a class="btn btn-dark" href="index.html">${tr('backToStore','BACK TO STORE')}</a></section>`;
    return
  }
  const {data:{user}}=await sb.auth.getUser();
  const auth=document.getElementById('accountAuth'),dash=document.getElementById('accountDashboard');
  if(!user){
    auth.hidden=false; dash.hidden=true;
    const params=new URLSearchParams(location.search);
    setAccountMode(['signup','reset'].includes(params.get('mode'))?params.get('mode'):'login',false);
    return
  }
  auth.hidden=true; dash.hidden=false;
  const {data:profile}=await sb.from('profiles').select('*').eq('user_id',user.id).maybeSingle();
  const {data:roles}=await sb.from('user_roles').select('role').eq('user_id',user.id);
  const fullName=[profile?.first_name,profile?.last_name].filter(Boolean).join(' ') || user.user_metadata?.name || user.email;
  document.getElementById('accountGreeting').textContent=`HI, ${(fullName||'THERE').split(' ')[0].toUpperCase()}`;
  document.getElementById('accountEmail').textContent=user.email||'';
  document.getElementById('profileName').textContent=fullName||'Customer';
  document.getElementById('profileEmail').textContent=user.email||'';
  const adminTools=document.getElementById('accountAdminTools');
  if(adminTools)adminTools.hidden=!(roles||[]).some(r=>['admin','editor','sales','fulfilment'].includes(r.role));

  const orders=await ZBSupa.loadOrdersForUser();
  document.getElementById('accountOrders').innerHTML=orders.length?orders.map(o=>{
    const f=o.fulfilments?.[0],tracking=f?.tracking_number?`<small>Tracking: ${ae(f.carrier||'')} ${ae(f.tracking_number)}</small>`:'';
    const displayId=o.order_number||o.id;
    return `<a class="account-order-row" href="invoice.html?order=${encodeURIComponent(o.id)}"><span><strong>${ae(displayId)}</strong><small>${new Date(o.created_at).toLocaleDateString()}</small>${tracking}</span><span><strong>${money(Number(o.grand_total_minor||0)/100)}</strong><small>${ae(o.fulfilment_status||'')}</small></span></a>`;
  }).join(''):`<p class="account-empty">${tr('noOrders','No orders yet. Orders placed with this account will appear here.')}</p>`;
}

document.addEventListener('DOMContentLoaded',async()=>{
  try{
    sb=await ZBSupa.client();
    await ZBSupa.hydrateSiteCache({force:true});
  }catch(err){
    console.error(err);
    document.querySelector('.account-shell').insertAdjacentHTML('afterbegin',`<div class="success-banner show">Supabase connection error: ${ae(err.message)}</div>`);
    return;
  }
  await renderAccount();

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-account-mode]');
    if(btn&&!document.getElementById('accountAuth')?.hidden)setAccountMode(btn.dataset.accountMode)
  });

  document.getElementById('loginForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const email=document.getElementById('loginEmail').value.trim().toLowerCase();
    const password=document.getElementById('loginPassword').value;
    const m=document.getElementById('loginMessage');
    m.textContent='Signing in…'; m.className='account-message';
    const {error}=await sb.auth.signInWithPassword({email,password});
    if(error){m.textContent=error.message;m.className='account-message error';return}
    const params=new URLSearchParams(location.search),ret=params.get('return')||'';
    const safeReturn=ret.startsWith('/')&&!ret.startsWith('//')?ret:'';
    location.href=safeReturn||'account.html'
  });

  document.getElementById('resetForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const email=document.getElementById('resetEmail').value.trim().toLowerCase(),m=document.getElementById('resetMessage');
    const redirectTo=new URL('account.html',location.href).href;
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});
    if(error){m.textContent=error.message;m.className='account-message error';return}
    m.textContent='Password reset email sent. Please check your inbox.';
    m.className='account-message success'
  });

  document.getElementById('signupForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const name=document.getElementById('signupName').value.trim(),
      email=document.getElementById('signupEmail').value.trim().toLowerCase(),
      password=document.getElementById('signupPassword').value,
      confirm=document.getElementById('signupPasswordConfirm').value,
      m=document.getElementById('signupMessage');
    if(password!==confirm){m.textContent=tr('passwordMismatch','The passwords do not match.');m.className='account-message error';return}
    const parts=name.split(/\s+/), first_name=parts.shift()||'', last_name=parts.join(' ');
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{name,first_name,last_name}}});
    if(error){m.textContent=error.message;m.className='account-message error';return}
    if(!data.session){
      m.textContent='Account created. Please check your email to confirm your account before signing in.';
      m.className='account-message success'; return
    }
    location.href='account.html'
  });

  document.getElementById('logoutBtn')?.addEventListener('click',async()=>{
    await sb.auth.signOut(); location.href='account.html'
  });
});
