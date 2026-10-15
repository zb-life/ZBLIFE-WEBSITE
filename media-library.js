/* ZB admin: Media library (Shopify-style "Files").
   Self-contained: lists, uploads, copies links for and deletes files in the Supabase Storage buckets.
   Uses only the existing ZBSupa.client() / ZBSupa.uploadMedia() and the storage rules already in your database.
   Does not change any existing admin behaviour. */
(function(){
  'use strict';
  var BUCKETS=[
    ['product-media','Product photos & videos'],
    ['page-media','Homepage & pages'],
    ['community-media','Community & partners'],
    ['brand-assets','Brand assets']
  ];
  var state={bucket:BUCKETS[0][0],files:[],search:'',kind:'all',busy:false};
  var $=function(id){return document.getElementById(id)};

  function toast(msg){
    var t=document.querySelector('.admin-toast');
    if(!t){t=document.createElement('div');t.className='admin-toast';document.body.appendChild(t)}
    t.textContent=msg;t.classList.add('show');
    clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show')},2200);
  }
  function status(msg){var s=$('mlStatus');if(s)s.textContent=msg||''}
  function fmtSize(n){
    n=Number(n);if(!n)return '';
    if(n<1024)return n+' B';
    if(n<1048576)return Math.round(n/1024)+' KB';
    return (n/1048576).toFixed(1)+' MB';
  }
  function fmtDate(s){
    var d=new Date(s);if(isNaN(d))return '';
    return d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
  }
  function isVideo(f){return /^video\//.test(f.type)||/\.(mp4|webm|mov)$/i.test(f.name)}
  function isImage(f){return /^image\//.test(f.type)||/\.(jpe?g|png|gif|webp|avif|svg)$/i.test(f.name)}
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}

  function siteText(){
    try{return JSON.stringify(typeof getSite==='function'?getSite():{})}catch(e){return ''}
  }

  async function listBucket(bucket){
    var c=await ZBSupa.client(),out=[];
    async function walk(prefix,depth){
      var offset=0;
      for(;;){
        var res=await c.storage.from(bucket).list(prefix,{limit:100,offset:offset,sortBy:{column:'created_at',order:'desc'}});
        if(res.error)throw new Error(res.error.message);
        var data=res.data||[];
        if(!data.length)break;
        for(var i=0;i<data.length;i++){
          var it=data[i];
          if(it.name==='.emptyFolderPlaceholder')continue;
          var path=prefix?prefix+'/'+it.name:it.name;
          if(!it.id){ if(depth<5)await walk(path,depth+1); continue; }
          var pub=c.storage.from(bucket).getPublicUrl(path);
          out.push({
            bucket:bucket,path:path,name:it.name,
            size:it.metadata&&it.metadata.size,
            type:(it.metadata&&it.metadata.mimetype)||'',
            created:it.created_at||it.updated_at||'',
            url:pub&&pub.data?pub.data.publicUrl:''
          });
        }
        if(data.length<100)break;
        offset+=100;
      }
    }
    await walk('',0);
    out.sort(function(a,b){return String(b.created).localeCompare(String(a.created))});
    return out;
  }

  async function load(){
    if(state.busy)return;
    state.busy=true;status('Loading files…');
    try{
      state.files=await listBucket(state.bucket);
      render();
    }catch(err){
      state.files=[];render();
      status('Could not load files: '+err.message);
    }finally{state.busy=false}
  }

  function visible(){
    var q=state.search.trim().toLowerCase();
    return state.files.filter(function(f){
      if(q&&f.name.toLowerCase().indexOf(q)<0)return false;
      if(state.kind==='image'&&!isImage(f))return false;
      if(state.kind==='video'&&!isVideo(f))return false;
      return true;
    });
  }

  function render(){
    var grid=$('mlGrid');if(!grid)return;
    grid.textContent='';
    var items=visible(),used=siteText();
    if(!items.length){
      grid.appendChild(el('p','admin-field-note',state.files.length?'No files match your search.':'No files here yet. Use "Upload files" to add photos or videos.'));
      status(state.files.length?items.length+' of '+state.files.length+' files':'');
      return;
    }
    status(items.length+(items.length===state.files.length?'':' of '+state.files.length)+' file'+(items.length===1?'':'s'));
    items.forEach(function(f){
      var card=el('div','ml-card');
      var thumb=el('div','ml-thumb');
      if(isVideo(f)){
        var v=document.createElement('video');v.src=f.url;v.muted=true;v.preload='metadata';v.setAttribute('playsinline','');
        thumb.appendChild(v);
      }else{
        var im=document.createElement('img');im.src=f.url;im.alt=f.name;im.loading='lazy';
        thumb.appendChild(im);
      }
      var inUse=used&&(used.indexOf(f.path)>=0||used.indexOf(f.url)>=0);
      if(inUse)thumb.appendChild(el('span','ml-badge','In use'));
      card.appendChild(thumb);
      var meta=el('div','ml-meta');
      meta.appendChild(el('strong','ml-name',f.name));
      meta.appendChild(el('span','ml-sub',[fmtSize(f.size),fmtDate(f.created)].filter(Boolean).join(' · ')));
      card.appendChild(meta);
      var row=el('div','ml-row');
      var copy=el('button','admin-secondary compact','Copy link');copy.type='button';
      copy.addEventListener('click',function(){
        var done=function(){toast('Link copied')};
        if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(f.url).then(done,function(){window.prompt('Copy this link:',f.url)})}
        else window.prompt('Copy this link:',f.url);
      });
      var open=el('a','admin-secondary compact ml-open','Open');open.href=f.url;open.target='_blank';open.rel='noopener';
      var del=el('button','admin-secondary compact danger-text','Delete');del.type='button';
      del.addEventListener('click',function(){remove(f,inUse)});
      row.appendChild(copy);row.appendChild(open);row.appendChild(del);
      card.appendChild(row);
      grid.appendChild(card);
    });
  }

  async function remove(f,inUse){
    var msg='Delete "'+f.name+'" permanently?'+(inUse?'\n\nThis file is used in your store content. Pages that use it will show a blank image until you pick a new one.':'')+'\n\nThis cannot be undone.';
    if(!window.confirm(msg))return;
    try{
      var c=await ZBSupa.client();
      var res=await c.storage.from(f.bucket).remove([f.path]);
      if(res.error)throw new Error(res.error.message);
      if(!res.data||!res.data.length)throw new Error('The file was not deleted. Your account may not have permission to delete media.');
      toast('File deleted');
      state.files=state.files.filter(function(x){return x.path!==f.path});
      render();
    }catch(err){
      toast('Could not delete');status('Could not delete "'+f.name+'": '+err.message);
    }
  }

  async function upload(fileList){
    var files=Array.prototype.slice.call(fileList||[]);
    if(!files.length)return;
    var ok=0,errors=[];
    for(var i=0;i<files.length;i++){
      status('Uploading '+(i+1)+' of '+files.length+'…');
      try{await ZBSupa.uploadMedia(files[i],{bucket:state.bucket,folder:'library'});ok++}
      catch(err){errors.push(files[i].name+': '+err.message)}
    }
    if(ok)toast(ok+' file'+(ok===1?'':'s')+' uploaded');
    await load();
    if(errors.length)status('Some files were not uploaded. '+errors.join(' | '));
  }

  /* ---------- picker: "Choose from library" beside every photo / video field ---------- */
  var PICK=[
    ['input[data-media-k="src"]','media'],
    ['input[data-media-k="poster"]','image'],
    ['input[data-mood-k="image"]','image'],
    ['input[data-journal-k="image"]','image'],
    ['input[data-vk="image"]','image'],
    ['input[data-variant-mood-url]','image'],
    ['input[data-k="image"]','image'],
    ['input[data-k="icon"]','image'],
    ['#navLogoUrl','image'],['#faviconUrl','image'],['#seoSocialImage','image']
  ];
  var PICK_SEL=PICK.map(function(p){return p[0]}).join(',');
  var pk=null; // active picker session

  function pickKind(input){
    for(var i=0;i<PICK.length;i++){if(input.matches(PICK[i][0]))return PICK[i][1]}
    return 'image';
  }
  function pickBucket(input){
    if(input.matches('#navLogoUrl,#faviconUrl,#seoSocialImage,[data-k="icon"]'))return 'brand-assets';
    if(input.matches('[data-mood-k],[data-journal-k]'))return 'page-media';
    var ed=input.closest('.media-editor');
    if(ed)return ed.getAttribute('data-media-scope')==='product'?'product-media':'page-media';
    if(input.matches('[data-k="image"]'))return 'community-media';
    return 'product-media';
  }

  function decorate(){
    var inputs=document.querySelectorAll(PICK_SEL);
    for(var i=0;i<inputs.length;i++){
      var inp=inputs[i];
      if(inp.getAttribute('data-ml-pick'))continue;
      inp.setAttribute('data-ml-pick','1');
      var b=el('button','admin-secondary compact ml-pick','Choose from library');
      b.type='button';
      b.addEventListener('click',(function(target){return function(e){e.preventDefault();e.stopPropagation();openPicker(target)}})(inp));
      inp.insertAdjacentElement('afterend',b);
    }
  }

  function applyPick(input,f){
    input.value=f.url;
    if(input.matches('[data-media-k="src"]')){
      var ed=input.closest('.media-editor'),ty=ed&&ed.querySelector('[data-media-k="type"]');
      if(ty){ty.value=isVideo(f)?'video':'image';ty.dispatchEvent(new Event('change',{bubbles:true}))}
    }
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    // refresh the small preview shown above the fields, if this editor has one
    var card=input.closest('.media-editor,.stack-editor,.editor-card'),pv=card&&card.querySelector('.asset-preview');
    if(pv&&!input.matches('[data-media-k="poster"]')){
      pv.textContent='';
      if(isVideo(f)){var v=document.createElement('video');v.src=f.url;v.muted=true;v.controls=true;v.preload='metadata';pv.appendChild(v)}
      else{var im=document.createElement('img');im.src=f.url;im.alt=f.name;pv.appendChild(im)}
    }
    toast('Selected '+f.name+'. Remember to Save & publish.');
  }

  function openPicker(input){
    closePicker();
    var kind=pickKind(input),bucket=pickBucket(input);
    pk={input:input,bucket:bucket,files:[],search:'',kind:kind==='image'?'image':'all',selected:null,opener:document.activeElement};
    var ov=el('div','ml-modal');ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Choose from library');
    var box=el('div','ml-modal-box');
    var head=el('div','ml-modal-head');
    head.appendChild(el('h2',null,'Choose from library'));
    var x=el('button','admin-secondary compact','Close');x.type='button';x.addEventListener('click',closePicker);head.appendChild(x);
    box.appendChild(head);

    var tb=el('div','ml-toolbar');
    var l1=el('label',null,'Folder'),s1=document.createElement('select');
    BUCKETS.forEach(function(b){var o=document.createElement('option');o.value=b[0];o.textContent=b[1];if(b[0]===bucket)o.selected=true;s1.appendChild(o)});
    l1.appendChild(s1);tb.appendChild(l1);
    var l2=el('label',null,'Search'),s2=document.createElement('input');s2.type='search';s2.placeholder='Search by file name';l2.appendChild(s2);tb.appendChild(l2);
    var l3=el('label',null,'Type'),s3=document.createElement('select');
    [['all','All files'],['image','Images'],['video','Videos']].forEach(function(o){var op=document.createElement('option');op.value=o[0];op.textContent=o[1];if(o[0]===pk.kind)op.selected=true;s3.appendChild(op)});
    l3.appendChild(s3);tb.appendChild(l3);
    var up=el('button','admin-secondary','Upload new');up.type='button';
    var fi=document.createElement('input');fi.type='file';fi.accept='image/*,video/*';fi.multiple=true;fi.hidden=true;
    up.addEventListener('click',function(){fi.click()});
    tb.appendChild(up);tb.appendChild(fi);
    box.appendChild(tb);

    var st=el('div','admin-field-note');st.id='mlPickStatus';st.setAttribute('role','status');st.setAttribute('aria-live','polite');box.appendChild(st);
    var grid=el('div','ml-grid ml-pick-grid');grid.id='mlPickGrid';box.appendChild(grid);

    var foot=el('div','ml-modal-foot');
    var cancel=el('button','admin-secondary','Cancel');cancel.type='button';cancel.addEventListener('click',closePicker);
    var ok=el('button','admin-primary','Use selected file');ok.type='button';ok.id='mlPickOk';ok.disabled=true;
    ok.addEventListener('click',function(){confirmPick()});
    foot.appendChild(cancel);foot.appendChild(ok);box.appendChild(foot);
    ov.appendChild(box);document.body.appendChild(ov);
    pk.ov=ov;

    s1.addEventListener('change',function(){pk.bucket=s1.value;pk.selected=null;pickLoad()});
    s2.addEventListener('input',function(){pk.search=s2.value;pickRender()});
    s3.addEventListener('change',function(){pk.kind=s3.value;pickRender()});
    fi.addEventListener('change',function(){pickUpload(fi.files).then(function(){fi.value=''})});
    ov.addEventListener('mousedown',function(e){if(e.target===ov)closePicker()});
    ov.addEventListener('keydown',function(e){
      if(e.key==='Escape'){e.stopPropagation();closePicker()}
      if(e.key==='Tab'){ // keep focus inside the dialog
        var f=ov.querySelectorAll('button:not([disabled]),input:not([hidden]),select,[tabindex="0"]');
        if(!f.length)return;var first=f[0],last=f[f.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    });
    x.focus();
    pickLoad();
  }

  function closePicker(){
    if(!pk)return;
    var o=pk.opener;
    if(pk.ov&&pk.ov.parentNode)pk.ov.parentNode.removeChild(pk.ov);
    pk=null;
    if(o&&o.focus){try{o.focus()}catch(e){}}
  }
  function pickStatus(m){var s=$('mlPickStatus');if(s)s.textContent=m||''}
  async function pickLoad(){
    if(!pk)return;
    var sess=pk;pickStatus('Loading files…');
    try{
      var files=await listBucket(sess.bucket);
      if(pk!==sess)return;
      sess.files=files;pickRender();
    }catch(err){if(pk===sess){sess.files=[];pickRender();pickStatus('Could not load files: '+err.message)}}
  }
  function pickVisible(){
    var q=pk.search.trim().toLowerCase();
    return pk.files.filter(function(f){
      if(q&&f.name.toLowerCase().indexOf(q)<0)return false;
      if(pk.kind==='image'&&!isImage(f))return false;
      if(pk.kind==='video'&&!isVideo(f))return false;
      return true;
    });
  }
  function pickRender(){
    var grid=$('mlPickGrid');if(!grid||!pk)return;
    grid.textContent='';
    var items=pickVisible();
    $('mlPickOk').disabled=!pk.selected;
    if(!items.length){
      grid.appendChild(el('p','admin-field-note',pk.files.length?'No files match.':'No files in this folder yet. Use "Upload new".'));
      pickStatus('');return;
    }
    pickStatus(items.length+' file'+(items.length===1?'':'s'));
    items.forEach(function(f){
      var card=el('button','ml-card ml-pickable');card.type='button';
      card.setAttribute('aria-pressed',pk.selected&&pk.selected.path===f.path&&pk.selected.bucket===f.bucket?'true':'false');
      var thumb=el('div','ml-thumb');
      if(isVideo(f)){var v=document.createElement('video');v.src=f.url;v.muted=true;v.preload='metadata';v.setAttribute('playsinline','');thumb.appendChild(v)}
      else{var im=document.createElement('img');im.src=f.url;im.alt='';im.loading='lazy';thumb.appendChild(im)}
      card.appendChild(thumb);
      var meta=el('div','ml-meta');
      meta.appendChild(el('strong','ml-name',f.name));
      meta.appendChild(el('span','ml-sub',[fmtSize(f.size),fmtDate(f.created)].filter(Boolean).join(' · ')));
      card.appendChild(meta);
      card.addEventListener('click',function(){pk.selected=f;pickRender()});
      card.addEventListener('dblclick',function(){pk.selected=f;confirmPick()});
      grid.appendChild(card);
    });
  }
  function confirmPick(){
    if(!pk||!pk.selected)return;
    var inp=pk.input,f=pk.selected;
    closePicker();
    applyPick(inp,f);
  }
  async function pickUpload(fileList){
    var files=Array.prototype.slice.call(fileList||[]);
    if(!files.length||!pk)return;
    var sess=pk,errors=[],lastUrl='';
    for(var i=0;i<files.length;i++){
      pickStatus('Uploading '+(i+1)+' of '+files.length+'…');
      try{lastUrl=await ZBSupa.uploadMedia(files[i],{bucket:sess.bucket,folder:'library'})}
      catch(err){errors.push(files[i].name+': '+err.message)}
    }
    if(pk!==sess)return;
    try{
      sess.files=await listBucket(sess.bucket);
      var match=lastUrl&&sess.files.filter(function(f){return f.url===lastUrl})[0];
      if(match)sess.selected=match;
    }catch(e){}
    pickRender();
    if(errors.length)pickStatus('Some files were not uploaded. '+errors.join(' | '));
  }

  var decorateQueued=false;
  function queueDecorate(){
    if(decorateQueued)return;decorateQueued=true;
    (window.requestAnimationFrame||setTimeout)(function(){decorateQueued=false;decorate()});
  }
  function initPicker(){
    decorate();
    new MutationObserver(queueDecorate).observe(document.body,{childList:true,subtree:true});
  }

  function init(){
    initPicker();
    var sel=$('mlBucket');if(!sel)return;
    BUCKETS.forEach(function(b){var o=document.createElement('option');o.value=b[0];o.textContent=b[1];sel.appendChild(o)});
    sel.addEventListener('change',function(){state.bucket=sel.value;load()});
    $('mlSearch').addEventListener('input',function(e){state.search=e.target.value;render()});
    $('mlKind').addEventListener('change',function(e){state.kind=e.target.value;render()});
    $('mlRefresh').addEventListener('click',load);
    var input=$('mlFile');
    $('mlUpload').addEventListener('click',function(){input.click()});
    input.addEventListener('change',function(){var fl=input.files;upload(fl).then(function(){input.value=''})});
    var grid=$('mlGrid');
    ['dragenter','dragover'].forEach(function(ev){grid.addEventListener(ev,function(e){e.preventDefault();grid.classList.add('ml-drop')})});
    ['dragleave','drop'].forEach(function(ev){grid.addEventListener(ev,function(e){e.preventDefault();grid.classList.remove('ml-drop')})});
    grid.addEventListener('drop',function(e){upload(e.dataTransfer&&e.dataTransfer.files)});
    var nav=document.querySelector('[data-panel="media"]');
    if(nav)nav.addEventListener('click',function(){load()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
