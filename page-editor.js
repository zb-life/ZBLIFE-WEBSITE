/* ZB click-to-edit page editor.
   Loaded by page.html when ?edit=page is in the address, or when a staff
   member is signed in (then it only shows an "edit page" button).
   Only Admin / Editor accounts can use it — Supabase rules enforce that too. */
(async function(){
  'use strict';
  if(window.__zbPageEditor) return; window.__zbPageEditor = true;
  const P = window.ZBPageSections;
  if(!P || !window.ZBSupa) return;

  const params = new URLSearchParams(location.search);
  const wantEdit = params.get('edit') === 'page';
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = P.esc;
  const isUuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
  const slugify = v => String(v || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const clone = o => JSON.parse(JSON.stringify(o));
  const pageLink = h => `page.html?slug=${h}`;
  const matchHref = (href, h) => {
    if(!h) return false;
    try{ const u = new URL(String(href || ''), location.origin + '/'); return /\/page\.html$/.test(u.pathname) && u.searchParams.get('slug') === h; }catch{ return false; }
  };

  // ---------- small UI helpers ----------
  function el(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  let toastTimer;
  function toast(msg, { error = false, action = null, ms = 4200 } = {}){
    document.querySelectorAll('.zbe-toast').forEach(t => t.remove());
    const t = el(`<div class="zbe-toast${error ? ' err' : ''}" data-zb-editor-ui role="status">${esc(msg)}${action ? ` <button class="zbe-pill" style="height:30px;margin-left:10px;border-color:rgba(246,240,233,.5)">${esc(action.label)}</button>` : ''}</div>`);
    if(action) t.querySelector('button').onclick = () => { t.remove(); action.fn(); };
    document.body.appendChild(t);
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), ms);
  }

  function closeFloating(){ document.querySelectorAll('.zbe-pop,.zbe-scrim,.zbe-drawer,.zbe-modal').forEach(n => n.remove()); }

  function openPop(anchor, html, mount){
    closeFloating();
    const pop = el(`<div class="zbe-pop" data-zb-editor-ui>${html}</div>`);
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    const left = Math.max(12, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 12));
    let top = window.scrollY + r.bottom + 8;
    if(r.bottom + pop.offsetHeight + 16 > window.innerHeight && r.top > pop.offsetHeight + 80) top = window.scrollY + r.top - pop.offsetHeight - 8;
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
    mount && mount(pop);
    setTimeout(() => {
      const off = e => { if(!pop.contains(e.target) && !anchor.contains(e.target)){ pop.remove(); document.removeEventListener('pointerdown', off, true); } };
      document.addEventListener('pointerdown', off, true);
    });
    return pop;
  }

  function openLayer(kind, html, mount, { dismissable = true } = {}){
    closeFloating();
    const scrim = el(`<div class="zbe-scrim" data-zb-editor-ui></div>`);
    const box = el(`<div class="zbe-${kind}" data-zb-editor-ui role="dialog" aria-modal="true">${html}</div>`);
    document.body.append(scrim, box);
    if(dismissable) scrim.onclick = () => { scrim.remove(); box.remove(); };
    mount && mount(box, () => { scrim.remove(); box.remove(); });
    box.querySelector('input,textarea,button')?.focus();
    return box;
  }

  // ---------- who is signed in ----------
  let access;
  try{ access = await ZBSupa.requireRole(['admin','editor']); }catch(e){ access = { ok:false }; }

  if(!access.ok){
    if(wantEdit){
      openLayer('modal', `<h3>sign in to edit pages</h3><p>Open the admin panel and sign in with an Admin or Editor account, then come back to this page.</p><div class="zbe-row"><a class="zbe-btn primary" href="admin.html">go to admin</a></div>`);
    }
    return;
  }

  if(!wantEdit){
    if(!params.get('slug')) return;
    const b = el(`<button class="zbe-edit-pill" data-zb-editor-ui>edit page</button>`);
    b.onclick = () => { const u = new URL(location.href); u.searchParams.set('edit', 'page'); location.href = u.toString(); };
    document.body.appendChild(b);
    return;
  }

  // ---------- editor state ----------
  const sb = await ZBSupa.client();
  const state = { page:null, sections:[], menu:{ header:false, footer:false }, isNew:false, origHandle:null, dirty:false, sel:-1, saving:false, allPages:[] };
  const hero = $('#pageHero'), heroTitle = $('#pageTitle'), host = $('#pageSections'), legacy = $('#pageLegacy');
  if(!host) return;

  function setDirty(v = true){ state.dirty = v; updateBar(); }

  function getPath(obj, path){ return path.split('.').reduce((o, k) => o == null ? o : o[k], obj); }
  function setPath(obj, path, value){
    const keys = path.split('.'); let o = obj;
    keys.slice(0, -1).forEach((k, i) => { if(o[k] == null) o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {}; o = o[k]; });
    o[keys[keys.length - 1]] = value;
  }

  // ---------- top bar ----------
  document.body.classList.add('zbe-on');
  const bar = el(`<div class="zbe-bar" data-zb-editor-ui>
    <select class="zbe-hide-sm" data-switch aria-label="Switch page"></select>
    <div class="zbe-title"><span data-bar-title></span><small data-bar-link></small></div>
    <span class="zbe-dirty zbe-hide-sm" data-dirty></span>
    <button class="zbe-pill zbe-status" data-status title="Draft pages are only visible to staff"><span class="zbe-dot"></span><span data-status-label></span></button>
    <button class="zbe-pill" data-settings>settings</button>
    <button class="zbe-pill primary" data-save>save</button>
    <button class="zbe-pill" data-exit>exit</button>
  </div>`);
  document.body.prepend(bar);
  legacy && (legacy.hidden = true);

  function updateBar(){
    if(!state.page) return;
    $('[data-bar-title]', bar).textContent = state.page.title || 'untitled page';
    $('[data-bar-link]', bar).textContent = `zb.life/${pageLink(slugify(state.page.handle) || '…')}`;
    const live = state.page.status === 'published';
    $('[data-status]', bar).classList.toggle('live', live);
    $('[data-status-label]', bar).textContent = live ? 'live' : 'draft';
    $('[data-dirty]', bar).textContent = state.saving ? 'saving…' : state.dirty ? 'unsaved changes' : 'all changes saved';
    $('[data-save]', bar).disabled = state.saving || !state.dirty;
    const sw = $('[data-switch]', bar);
    sw.innerHTML = state.allPages.map(p => `<option value="${esc(p.handle)}" ${p.id === state.page.id ? 'selected' : ''}>${esc(p.title)}</option>`).join('')
      + (state.isNew ? `<option selected>${esc(state.page.title || 'new page')} (new)</option>` : '')
      + `<option value="__new">+ new page</option>`;
  }

  $('[data-status]', bar).onclick = () => { state.page.status = state.page.status === 'published' ? 'draft' : 'published'; setDirty(); toast(state.page.status === 'published' ? 'This page will go live when you save.' : 'This page will be hidden from visitors when you save.'); };
  $('[data-settings]', bar).onclick = openSettings;
  $('[data-save]', bar).onclick = save;
  $('[data-exit]', bar).onclick = exitEditor;
  $('[data-switch]', bar).onchange = e => {
    const v = e.target.value;
    if(state.dirty && !confirm('You have unsaved changes. Leave without saving?')){ updateBar(); return; }
    state.dirty = false;
    location.href = v === '__new' ? 'page.html?edit=page&new=1' : `${pageLink(v)}&edit=page`;
  };
  window.addEventListener('beforeunload', e => { if(state.dirty){ e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('keydown', e => {
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's'){ e.preventDefault(); save(); }
    if(e.key === 'Escape') closeFloating();
  });

  // ---------- canvas ----------
  const TOOLS_OPTS = { text:1, image:1, image_text:1, banner:1, gallery:1, faq:1, button:1 };

  function renderCanvas(){
    const firstBanner = state.sections[0]?.type === 'banner';
    hero.hidden = firstBanner;
    heroTitle.textContent = state.page.title || '';
    heroTitle.setAttribute('contenteditable', 'true');
    heroTitle.dataset.placeholder = 'page title';
    heroTitle.classList.toggle('zbs-empty', !String(state.page.title || '').trim());

    host.innerHTML = P.renderSections(state.sections, { edit:true });
    const secs = [...host.querySelectorAll(':scope > [data-section]')];
    secs.forEach((sec, i) => {
      const s = state.sections[i];
      host.insertBefore(el(`<div class="zbe-add" data-zb-editor-ui><button type="button" data-add-at="${i}">+ add section</button></div>`), sec);
      sec.appendChild(el(`<div class="zbe-tools" data-zb-editor-ui contenteditable="false">
        <span>${esc(P.TYPES[s.type]?.label || s.type)}</span>
        <button type="button" data-act="up" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" data-act="down" title="Move down" ${i === secs.length - 1 ? 'disabled' : ''}>↓</button>
        ${TOOLS_OPTS[s.type] ? '<button type="button" data-act="opts" title="Layout & style">⚙</button>' : ''}
        <button type="button" data-act="dup" title="Duplicate">⧉</button>
        <button type="button" data-act="del" title="Delete section">✕</button>
      </div>`));
      if(i === state.sel) sec.classList.add('zbe-sel');
    });
    host.appendChild(el(`<div class="zbe-add zbe-last" data-zb-editor-ui><button type="button" data-add-at="${state.sections.length}">+ add section</button></div>`));
    updateBar();
  }

  function secIndex(node){ const s = node.closest('[data-section]'); return s ? +s.dataset.section : -1; }
  function select(i){
    state.sel = i;
    host.querySelectorAll('[data-section]').forEach(s => s.classList.toggle('zbe-sel', +s.dataset.section === i));
  }

  // title in the hero
  heroTitle.addEventListener('input', () => {
    state.page.title = heroTitle.textContent.replace(/\s+/g, ' ').trim();
    heroTitle.classList.toggle('zbs-empty', !state.page.title);
    setDirty();
  });
  heroTitle.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); heroTitle.blur(); } });
  heroTitle.addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').replace(/\s+/g, ' ')); });

  // typing into sections
  host.addEventListener('input', e => {
    const f = e.target.closest('[data-f]'); if(!f) return;
    const i = secIndex(f); if(i < 0) return;
    const rich = f.hasAttribute('data-rich');
    const value = rich ? P.sanitizeHTML(f.innerHTML) : f.textContent.replace(/ /g, ' ');
    setPath(state.sections[i], f.dataset.f, value);
    f.classList.toggle('zbs-empty', rich ? !P.textOf(value) : !value.trim());
    setDirty();
  });
  host.addEventListener('keydown', e => {
    const f = e.target.closest('[data-f]');
    if(f && !f.hasAttribute('data-rich') && e.key === 'Enter'){ e.preventDefault(); }
  });
  host.addEventListener('paste', e => {
    const f = e.target.closest('[data-f]'); if(!f) return;
    e.preventDefault();
    const cd = e.clipboardData;
    if(f.hasAttribute('data-rich')){
      const html = cd.getData('text/html');
      document.execCommand('insertHTML', false, html ? P.sanitizeHTML(html) : P.plainToHTML(cd.getData('text/plain')));
    }else{
      document.execCommand('insertText', false, (cd.getData('text/plain') || '').replace(/\s*\n\s*/g, ' '));
    }
  });
  host.addEventListener('focusin', e => { const i = secIndex(e.target); if(i >= 0) select(i); });

  host.addEventListener('click', e => {
    const t = e.target;
    const add = t.closest('[data-add-at]');
    if(add){ openSectionPicker(+add.dataset.addAt); return; }

    const i = secIndex(t);
    if(i >= 0 && state.sel !== i) select(i);

    const tool = t.closest('[data-act]');
    if(tool){ e.preventDefault(); sectionAction(i, tool.dataset.act, tool); return; }

    const im = t.closest('[data-img]');
    if(im && i >= 0){ e.preventDefault(); chooseImage(i, im.dataset.img, im); return; }

    const b = t.closest('[data-btn]');
    if(b && i >= 0){ e.preventDefault(); editButton(i, b.dataset.btn, b); return; }

    const addItem = t.closest('[data-add-item]');
    if(addItem && i >= 0){
      const key = addItem.dataset.addItem, list = state.sections[i][key] = state.sections[i][key] || [];
      list.push(key === 'images' ? { src:'', alt:'' } : { q:'', a:'' });
      setDirty(); renderCanvas();
      if(key === 'items') host.querySelector(`[data-section="${i}"] [data-f="items.${list.length - 1}.q"]`)?.focus();
      return;
    }
    const rm = t.closest('[data-remove-item]');
    if(rm && i >= 0){
      const [key, j] = rm.dataset.removeItem.split('.');
      state.sections[i][key].splice(+j, 1);
      setDirty(); renderCanvas(); return;
    }
    // never follow links while editing
    if(t.closest('a')) e.preventDefault();
  });
  host.addEventListener('keydown', e => {
    if((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-img][role="button"]')){ e.preventDefault(); e.target.click(); }
  });
  document.addEventListener('pointerdown', e => {
    if(!e.target.closest('#pageSections,[data-zb-editor-ui]')) select(-1);
  });

  // ---------- section actions ----------
  function sectionAction(i, act, anchor){
    const list = state.sections;
    if(act === 'up' && i > 0){ [list[i - 1], list[i]] = [list[i], list[i - 1]]; state.sel = i - 1; }
    else if(act === 'down' && i < list.length - 1){ [list[i + 1], list[i]] = [list[i], list[i + 1]]; state.sel = i + 1; }
    else if(act === 'dup'){ const c = clone(list[i]); c._id = P.uid(); list.splice(i + 1, 0, c); state.sel = i + 1; }
    else if(act === 'del'){
      const [gone] = list.splice(i, 1); state.sel = -1;
      setDirty(); renderCanvas();
      toast(`${P.TYPES[gone.type]?.label || 'section'} deleted`, { action:{ label:'undo', fn:() => { list.splice(i, 0, gone); setDirty(); renderCanvas(); } } });
      return;
    }
    else if(act === 'opts'){ openSectionOptions(i, anchor); return; }
    else return;
    setDirty(); renderCanvas();
    host.querySelector(`[data-section="${state.sel}"]`)?.scrollIntoView({ block:'nearest', behavior:'smooth' });
  }

  const BG = [['none','#ffffff','none'],['blush','var(--zb-blush,#ecdccf)','blush'],['sage','var(--zb-sage,#dbe7dc)','sage'],['cream','var(--zb-butter,#efe3cf)','cream'],['lilac','var(--zb-lilac,#e9dfe2)','lilac']];
  const seg = (key, opts, cur) => `<div class="zbe-seg" data-seg="${key}">${opts.map(([v, l]) => `<button type="button" data-v="${esc(v)}" class="${String(cur) === String(v) ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
  const bgSeg = cur => `<div class="zbe-field"><span>background</span><div class="zbe-seg" data-seg="bg">${BG.map(([v, c, l]) => `<button type="button" class="zbe-swatch ${(cur || 'none') === v ? 'on' : ''}" data-v="${v}" title="${l}" style="background:${c};${(cur || 'none') === v ? 'box-shadow:0 0 0 2px #fffaf5,0 0 0 4px #3b2f2a' : ''}"></button>`).join('')}</div></div>`;
  const altField = s => `<label class="zbe-field"><span>photo description (for screen readers & google)</span><input data-alt value="${esc(s.alt || '')}" placeholder="e.g. woman stretching after a run"></label>`;

  function openSectionOptions(i, anchor){
    const s = state.sections[i];
    let body = '';
    if(s.type === 'text') body = `<div class="zbe-field"><span>text alignment</span>${seg('align', [['left','left'],['center','centre']], s.align || 'left')}</div>${bgSeg(s.bg)}`;
    if(s.type === 'image') body = `<div class="zbe-field"><span>width</span>${seg('width', [['contained','contained'],['full','edge to edge']], s.width || 'contained')}</div>${altField(s)}`;
    if(s.type === 'image_text') body = `<div class="zbe-field"><span>photo position</span>${seg('side', [['left','photo left'],['right','photo right']], s.side || 'left')}</div>${bgSeg(s.bg)}${altField(s)}`;
    if(s.type === 'banner') body = `<div class="zbe-field"><span>text colour</span>${seg('tone', [['dark','white text'],['light','dark text']], s.tone || 'dark')}</div><div class="zbe-field"><span>height</span>${seg('height', [['tall','tall'],['short','short']], s.height || 'tall')}</div>${altField(s)}`;
    if(s.type === 'gallery') body = `<div class="zbe-field"><span>photos per row</span>${seg('columns', [[2,'2'],[3,'3'],[4,'4']], s.columns || 3)}</div>`;
    if(s.type === 'faq') body = bgSeg(s.bg);
    if(s.type === 'button') body = `<div class="zbe-field"><span>style</span>${seg('style', [['solid','filled'],['outline','outline']], s.style || 'solid')}</div><div class="zbe-field"><span>position</span>${seg('align', [['center','centre'],['left','left']], s.align || 'center')}</div>`;
    openPop(anchor, `<h4>${esc(P.TYPES[s.type]?.label || s.type)} options</h4>${body}`, pop => {
      pop.addEventListener('click', e => {
        const b = e.target.closest('[data-seg] [data-v]'); if(!b) return;
        const key = b.closest('[data-seg]').dataset.seg;
        s[key] = key === 'columns' ? +b.dataset.v : b.dataset.v;
        setDirty(); renderCanvas(); openSectionOptions(i, host.querySelector(`[data-section="${i}"] [data-act="opts"]`) || anchor);
      });
      const alt = pop.querySelector('[data-alt]');
      if(alt) alt.oninput = () => { s.alt = alt.value; setDirty(); };
    });
  }

  function openSectionPicker(at){
    const icons = { text:'Aa', image:'▭', image_text:'▭ ≡', banner:'▀▀', gallery:'▦', faq:'＋ ＋', button:'( → )' };
    openLayer('modal', `<h3>add a section</h3><div class="zbe-cards">${Object.entries(P.TYPES).map(([k, t]) =>
      `<button type="button" class="zbe-card" data-type="${k}"><i style="display:flex;align-items:center;justify-content:center;font-size:18px">${icons[k] || ''}</i><strong>${esc(t.label)}</strong><small>${esc(t.hint)}</small></button>`).join('')}</div><div class="zbe-row"><button class="zbe-btn" data-close>cancel</button></div>`,
      (box, close) => {
        box.querySelector('[data-close]').onclick = close;
        box.querySelectorAll('[data-type]').forEach(c => c.onclick = () => {
          state.sections.splice(at, 0, P.blankSection(c.dataset.type));
          state.sel = at; close(); setDirty(); renderCanvas();
          const sec = host.querySelector(`[data-section="${at}"]`);
          sec?.scrollIntoView({ block:'center', behavior:'smooth' });
          (sec?.querySelector(c.dataset.type === 'faq' ? '[data-f$=".q"]' : '[data-f]') || sec?.querySelector('[data-f]'))?.focus();
        });
      });
  }

  // ---------- photos ----------
  const picker = el(`<input type="file" accept="image/*" hidden data-zb-editor-ui>`);
  document.body.appendChild(picker);
  function chooseImage(i, path, node){
    picker.value = '';
    picker.onchange = async () => {
      const file = picker.files?.[0]; if(!file) return;
      const box = node.classList.contains('zbs-img') ? node : node.closest('.zbs-banner-box') || node;
      box.classList.add('zbe-uploading');
      try{
        const url = await ZBSupa.uploadMedia(file, { bucket:'page-media', folder:`pages/${state.page.id}` });
        setPath(state.sections[i], path, url);
        setDirty(); renderCanvas();
      }catch(err){
        console.error(err); box.classList.remove('zbe-uploading');
        toast('Could not upload the photo: ' + err.message, { error:true, ms:7000 });
      }
    };
    picker.click();
  }

  // ---------- buttons ----------
  function linkOptions(){
    const base = [['index.html','home'],['product.html','product page'],['stockists.html','stockists'],['community.html','community']];
    const pages = state.allPages.map(p => [pageLink(p.handle), p.title]);
    return [...base, ...pages].map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  }
  function editButton(i, path, anchor){
    const cur = getPath(state.sections[i], path) || { label:'', link:'' };
    openPop(anchor, `<h4>button</h4>
      <label class="zbe-field"><span>button text</span><input data-l value="${esc(cur.label || '')}" placeholder="e.g. shop now"></label>
      <label class="zbe-field"><span>goes to</span><input data-k list="zbeLinks" value="${esc(cur.link || '')}" placeholder="pick a page or paste a link"><datalist id="zbeLinks">${linkOptions()}</datalist></label>
      <div class="zbe-row">${cur.label ? '<button class="zbe-btn danger" data-rm>remove</button>' : ''}<button class="zbe-btn primary" data-ok>done</button></div>`, pop => {
      const l = pop.querySelector('[data-l]'), k = pop.querySelector('[data-k]');
      l.focus();
      const apply = () => { setPath(state.sections[i], path, { label:l.value.trim(), link:k.value.trim() }); setDirty(); pop.remove(); renderCanvas(); };
      pop.querySelector('[data-ok]').onclick = apply;
      [l, k].forEach(inp => inp.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); apply(); } });
      const rm = pop.querySelector('[data-rm]');
      if(rm) rm.onclick = () => { setPath(state.sections[i], path, { label:'', link:'' }); setDirty(); pop.remove(); renderCanvas(); };
    });
  }

  // ---------- text formatting bar ----------
  const fmt = el(`<div class="zbe-format" data-zb-editor-ui hidden>
    <button type="button" data-cmd="bold" title="Bold"><b>B</b></button>
    <button type="button" data-cmd="italic" title="Italic"><i>I</i></button>
    <button type="button" data-cmd="h3" title="Subheading">H</button>
    <button type="button" data-cmd="list" title="Bullet list">•</button>
    <button type="button" data-cmd="link" title="Link">link</button>
  </div>`);
  document.body.appendChild(fmt);
  fmt.addEventListener('pointerdown', e => e.preventDefault()); // keep the text selection
  fmt.addEventListener('click', e => {
    const b = e.target.closest('[data-cmd]'); if(!b) return;
    const cmd = b.dataset.cmd;
    if(cmd === 'bold' || cmd === 'italic') document.execCommand(cmd);
    if(cmd === 'list') document.execCommand('insertUnorderedList');
    if(cmd === 'h3'){
      const blk = document.getSelection().anchorNode?.parentElement?.closest('h3,p,li,div');
      document.execCommand('formatBlock', false, blk?.tagName === 'H3' ? 'p' : 'h3');
    }
    if(cmd === 'link'){
      const url = prompt('Link to (a page like product.html, or a full web address):', 'https://');
      if(url === null) return;
      if(!url.trim() || url.trim() === 'https://') document.execCommand('unlink');
      else if(P.safeUrl(url)) document.execCommand('createLink', false, url.trim());
    }
  });
  document.addEventListener('selectionchange', () => {
    const sel = document.getSelection();
    const node = sel?.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
    const rich = node?.closest?.('[data-rich]');
    if(!rich || sel.isCollapsed){ fmt.hidden = true; return; }
    const r = sel.getRangeAt(0).getBoundingClientRect();
    fmt.hidden = false;
    fmt.style.left = Math.max(8, Math.min(window.scrollX + r.left + r.width / 2 - fmt.offsetWidth / 2, window.scrollX + document.documentElement.clientWidth - fmt.offsetWidth - 8)) + 'px';
    fmt.style.top = (window.scrollY + r.top - fmt.offsetHeight - 10) + 'px';
  });

  // ---------- page settings ----------
  function openSettings(){
    const pg = state.page, h = slugify(pg.handle);
    openLayer('drawer', `<h3>page settings</h3>
      <label class="zbe-field"><span>page title</span><input data-title value="${esc(pg.title || '')}"></label>
      <label class="zbe-field"><span>page address</span><input data-handle value="${esc(pg.handle || '')}" placeholder="e.g. returns"></label>
      <div class="zbe-link" style="margin:-4px 0 14px"><span data-full>https://zb.life/${esc(pageLink(h || '…'))}</span><button class="zbe-btn" style="padding:6px 12px;font-size:12px" data-copy>copy</button></div>
      <label class="zbe-toggle"><span>published<small>When off, only staff can see this page.</small></span><input type="checkbox" data-pub ${pg.status === 'published' ? 'checked' : ''}></label>
      <label class="zbe-toggle"><span>show in main menu<small>Adds a link to the top navigation.</small></span><input type="checkbox" data-header ${state.menu.header ? 'checked' : ''}></label>
      <label class="zbe-toggle"><span>show in footer<small>Adds a link at the bottom of every page.</small></span><input type="checkbox" data-footer ${state.menu.footer ? 'checked' : ''}></label>
      <label class="zbe-field" style="margin-top:14px"><span>google description (optional)</span><textarea data-seo maxlength="300" placeholder="Leave empty to use the start of the page text.">${esc(pg.seo_description || '')}</textarea></label>
      <div class="zbe-row" style="justify-content:space-between;margin-top:18px">${state.isNew ? '<span></span>' : '<button class="zbe-btn danger" data-delete>delete page</button>'}<button class="zbe-btn primary" data-done>done</button></div>
      <p style="opacity:.6;font-size:12px;margin-top:18px">Changes here are saved when you press save in the top bar.</p>`,
      (box, close) => {
        const q = s => box.querySelector(s);
        q('[data-title]').oninput = e => { pg.title = e.target.value; heroTitle.textContent = pg.title; setDirty(); };
        q('[data-handle]').oninput = e => { pg.handle = e.target.value; q('[data-full]').textContent = `https://zb.life/${pageLink(slugify(pg.handle) || '…')}`; setDirty(); };
        q('[data-handle]').onblur = e => { pg.handle = slugify(e.target.value) || slugify(pg.title); e.target.value = pg.handle; q('[data-full]').textContent = `https://zb.life/${pageLink(pg.handle)}`; updateBar(); };
        q('[data-copy]').onclick = async () => { try{ await navigator.clipboard.writeText(`https://zb.life/${pageLink(slugify(pg.handle))}`); toast('Link copied'); }catch{ toast('Copy failed — select the link and copy it'); } };
        q('[data-pub]').onchange = e => { pg.status = e.target.checked ? 'published' : 'draft'; setDirty(); };
        q('[data-header]').onchange = e => { state.menu.header = e.target.checked; setDirty(); };
        q('[data-footer]').onchange = e => { state.menu.footer = e.target.checked; setDirty(); };
        q('[data-seo]').oninput = e => { pg.seo_description = e.target.value; setDirty(); };
        q('[data-done]').onclick = close;
        const del = q('[data-delete]'); if(del) del.onclick = deletePage;
      });
  }

  // ---------- templates / new page ----------
  function openTemplatePicker({ title = '', handle = '' } = {}){
    const T = P.TEMPLATES; let chosen = 'policy';
    const thumbs = {
      policy:'<i style="background:linear-gradient(#e3cdbd 0 0) 14px 12px/60% 6px no-repeat,repeating-linear-gradient(#f6f0e9 0 4px,#ecdccf 4px 8px) 14px 26px/80% 20px no-repeat,#f6f0e9"></i>',
      about:'<i style="background:linear-gradient(#e3cdbd 0 0) 8px 8px/40% 38px no-repeat,repeating-linear-gradient(#f6f0e9 0 4px,#ecdccf 4px 8px) 54% 14px/40% 24px no-repeat,#f6f0e9"></i>',
      campaign:'<i style="background:linear-gradient(#e3cdbd 0 0) 8px 6px/calc(100% - 16px) 22px no-repeat,linear-gradient(90deg,#dbe7dc 0 30%,transparent 0 35%,#e9dfe2 0 65%,transparent 0 70%,#efe3cf 0) 8px 32px/calc(100% - 16px) 16px no-repeat,#f6f0e9"></i>',
      faq:'<i style="background:repeating-linear-gradient(#f6f0e9 0 9px,#d9c9bd 9px 10px) 14px 8px/80% 40px no-repeat,#f6f0e9"></i>',
      blank:'<i style="background:#f6f0e9;border:1.5px dashed #d9c9bd"></i>'
    };
    openLayer('modal', `<h3>create a page</h3>
      <label class="zbe-field"><span>page title</span><input data-title value="${esc(title)}" placeholder="e.g. returns & refunds"></label>
      <label class="zbe-field"><span>page address</span><input data-handle value="${esc(handle)}" placeholder="filled in from the title"></label>
      <div class="zbe-field"><span>start from a template</span></div>
      <div class="zbe-cards">${Object.entries(T).map(([k, t]) => `<button type="button" class="zbe-card ${k === chosen ? 'on' : ''}" data-tpl="${k}">${thumbs[k] || '<i></i>'}<strong>${esc(t.label)}</strong><small>${esc(t.hint)}</small></button>`).join('')}</div>
      <div class="zbe-row"><button class="zbe-btn" data-cancel>cancel</button><button class="zbe-btn primary" data-create>create page</button></div>`,
      (box, close) => {
        const ti = box.querySelector('[data-title]'), hi = box.querySelector('[data-handle]');
        let handleTouched = !!handle;
        ti.oninput = () => { if(!handleTouched) hi.value = slugify(ti.value); };
        hi.oninput = () => { handleTouched = true; };
        box.querySelectorAll('[data-tpl]').forEach(c => c.onclick = () => { chosen = c.dataset.tpl; box.querySelectorAll('[data-tpl]').forEach(x => x.classList.toggle('on', x === c)); });
        box.querySelector('[data-cancel]').onclick = () => { close(); if(!state.page) location.href = 'admin.html'; };
        box.querySelector('[data-create]').onclick = async () => {
          const t = ti.value.trim(), h = slugify(hi.value || t);
          if(!t){ ti.focus(); toast('Give the page a title first', { error:true }); return; }
          if(!h){ hi.focus(); toast('The page address needs at least one letter or number', { error:true }); return; }
          const { data:taken } = await sb.from('pages').select('id').eq('handle', h).maybeSingle();
          if(taken){ hi.focus(); toast(`zb.life/${pageLink(h)} already exists — pick another address`, { error:true }); return; }
          state.page = { id:P.uid(), title:t, handle:h, status:'draft', template:chosen, seo_description:'', published_at:null };
          state.sections = T[chosen].sections();
          state.menu = { header:false, footer:chosen === 'policy' };
          state.isNew = true; state.origHandle = null; state.sel = -1;
          close();
          history.replaceState({}, '', `${pageLink(h)}&edit=page`);
          renderCanvas(); setDirty();
          toast('Page created as a draft. Click any text or photo to edit, then press save.', { ms:6500 });
        };
      }, { dismissable:false });
  }

  // ---------- loading ----------
  async function loadMenus(handle){
    const [{ data:nav }, { data:footerRow }] = await Promise.all([
      sb.from('navigation_items').select('id,href,location').eq('location', 'header'),
      sb.from('site_settings').select('value').eq('setting_key', 'footer').maybeSingle()
    ]);
    return {
      header:(nav || []).some(n => matchHref(n.href, handle)),
      footer:((footerRow?.value?.links) || []).some(l => matchHref(l.href, handle))
    };
  }

  async function loadAllPages(){
    const { data } = await sb.from('pages').select('id,title,handle,status').neq('handle', 'home').order('title');
    state.allPages = data || [];
  }

  async function load(){
    await loadAllPages();
    const slug = params.get('slug');
    if(params.get('new') === '1' || !slug){ openTemplatePicker(); return; }
    const { data:page, error } = await sb.from('pages').select('*').eq('handle', slug).maybeSingle();
    if(error){ toast('Could not load the page: ' + error.message, { error:true, ms:8000 }); return; }
    if(!page){ openTemplatePicker({ title:slug.replace(/-/g, ' '), handle:slug }); return; }
    const { data:blocks } = await sb.from('page_blocks').select('*').eq('page_id', page.id).order('position');
    let sections = (blocks || []).filter(b => b.block_type === 'section').map(b => ({ ...(b.settings || {}), _id:b.id }));
    if(!sections.length){
      const body = (blocks || []).find(b => b.block_type === 'editorial_text')?.settings?.body || '';
      sections = [{ ...P.blankSection('text'), body:P.plainToHTML(body) }];
    }
    state.page = { id:page.id, title:page.title, handle:page.handle, status:page.status === 'published' ? 'published' : 'draft', template:page.template || 'default', seo_description:page.seo_description || '', published_at:page.published_at };
    state.sections = sections;
    state.origHandle = page.handle;
    state.menu = await loadMenus(page.handle);
    renderCanvas(); setDirty(false);
  }

  // ---------- saving ----------
  async function syncMenus(handle, oldHandle, title){
    const link = pageLink(handle);
    const mine = href => matchHref(href, handle) || (oldHandle && matchHref(href, oldHandle));

    const { data:nav, error:navErr } = await sb.from('navigation_items').select('id,href,position').eq('location', 'header');
    if(navErr) throw new Error('menu: ' + navErr.message);
    const hits = (nav || []).filter(n => mine(n.href));
    if(state.menu.header){
      if(hits.length){
        for(const n of hits) if(n.href !== link){ const { error } = await sb.from('navigation_items').update({ href:link }).eq('id', n.id); if(error) throw new Error('menu: ' + error.message); }
      }else{
        const pos = Math.max(0, ...(nav || []).map(n => n.position || 0)) + 1;
        const { error } = await sb.from('navigation_items').insert({ location:'header', label:title, item_type:'link', href:link, visible:true, position:pos });
        if(error) throw new Error('menu: ' + error.message);
      }
    }else if(hits.length){
      const { error } = await sb.from('navigation_items').delete().in('id', hits.map(n => n.id));
      if(error) throw new Error('menu: ' + error.message);
    }

    const { data:row, error:fErr } = await sb.from('site_settings').select('value').eq('setting_key', 'footer').maybeSingle();
    if(fErr) throw new Error('footer: ' + fErr.message);
    const value = { ...(row?.value || {}) }; const links = Array.isArray(value.links) ? [...value.links] : [];
    const idx = links.findIndex(l => mine(l.href));
    let changed = false;
    if(state.menu.footer){
      if(idx >= 0){ if(links[idx].href !== link){ links[idx] = { ...links[idx], href:link }; changed = true; } }
      else { links.push({ label:title, href:link, visible:true }); changed = true; }
    }else if(idx >= 0){ links.splice(idx, 1); changed = true; }
    if(changed){
      value.links = links;
      const { error } = await sb.from('site_settings').upsert({ setting_key:'footer', value, is_public:true, updated_by:access.user.id }, { onConflict:'setting_key' });
      if(error) throw new Error('footer: ' + error.message);
    }
  }

  async function save(){
    if(state.saving || !state.page) return;
    const pg = state.page;
    pg.title = String(pg.title || '').trim();
    if(!pg.title){ toast('Give the page a title before saving', { error:true }); openSettings(); return; }
    const handle = slugify(pg.handle) || slugify(pg.title);
    if(!handle){ toast('The page address needs at least one letter or number', { error:true }); openSettings(); return; }
    state.saving = true; updateBar();
    try{
      const { data:taken } = await sb.from('pages').select('id').eq('handle', handle).neq('id', pg.id).maybeSingle();
      if(taken) throw new Error(`zb.life/${pageLink(handle)} is already used by another page — change the address in settings`);

      const published = pg.status === 'published';
      const row = { id:pg.id, title:pg.title, handle, status:published ? 'published' : 'draft', template:pg.template || 'default',
        seo_description:String(pg.seo_description || '').trim() || null,
        published_at:published ? (pg.published_at || new Date().toISOString()) : null, updated_by:access.user.id };
      if(state.isNew) row.created_by = access.user.id;
      let res = await sb.from('pages').upsert(row, { onConflict:'id' });
      if(res.error) throw new Error('page: ' + res.error.message);

      const { data:existing, error:exErr } = await sb.from('page_blocks').select('id,block_type').eq('page_id', pg.id);
      if(exErr) throw new Error('sections: ' + exErr.message);
      const payload = state.sections.map((s, i) => {
        if(!isUuid(s._id)) s._id = P.uid();
        const { _id, ...settings } = s;
        return { id:_id, page_id:pg.id, block_type:'section', position:i + 1, visible:true, settings };
      });
      if(payload.length){
        res = await sb.from('page_blocks').upsert(payload, { onConflict:'id' });
        if(res.error) throw new Error('sections: ' + res.error.message);
      }
      const removed = (existing || []).filter(b => b.block_type === 'section' && !payload.some(p => p.id === b.id)).map(b => b.id);
      if(removed.length){
        res = await sb.from('page_blocks').delete().in('id', removed);
        if(res.error) throw new Error('sections: ' + res.error.message);
      }
      // plain-text copy for the admin list and older parts of the site
      const textBlock = (existing || []).find(b => b.block_type === 'editorial_text');
      const body = P.pageText(state.sections).slice(0, 5000);
      res = textBlock
        ? await sb.from('page_blocks').update({ settings:{ body } }).eq('id', textBlock.id)
        : await sb.from('page_blocks').insert({ page_id:pg.id, block_type:'editorial_text', position:0, visible:true, settings:{ body } });
      if(res.error) throw new Error('page text: ' + res.error.message);

      await syncMenus(handle, state.origHandle, pg.title);

      pg.handle = handle; pg.published_at = row.published_at;
      state.isNew = false; state.origHandle = handle;
      history.replaceState({}, '', `${pageLink(handle)}&edit=page`);
      state.saving = false; setDirty(false);
      loadAllPages().then(updateBar);
      try{ await ZBSupa.hydrateSiteCache({ force:true }); }catch(e){ console.warn('Cache refresh skipped:', e.message); }
      toast(published ? 'Saved — the page is live.' : 'Saved as a draft — only staff can see it. Switch it to live when ready.', { ms:5500 });
    }catch(err){
      console.error(err);
      state.saving = false; updateBar();
      toast('Could not save: ' + err.message, { error:true, ms:9000 });
    }
  }

  async function deletePage(){
    if(!confirm(`Delete "${state.page.title}"? This removes the page and its menu/footer links. It can't be undone.`)) return;
    try{
      state.menu = { header:false, footer:false };
      await syncMenus(state.origHandle, null, state.page.title);
      const { error } = await sb.from('pages').delete().eq('id', state.page.id);
      if(error) throw new Error(error.message);
      state.dirty = false;
      try{ await ZBSupa.hydrateSiteCache({ force:true }); }catch{}
      location.href = 'admin.html';
    }catch(err){ toast('Could not delete: ' + err.message, { error:true, ms:8000 }); }
  }

  function exitEditor(){
    if(state.dirty && !confirm('You have unsaved changes. Leave without saving?')) return;
    state.dirty = false;
    location.href = state.isNew || !state.origHandle ? 'admin.html' : pageLink(state.origHandle);
  }

  try{ await load(); }
  catch(err){ console.error(err); toast('The editor could not start: ' + err.message, { error:true, ms:9000 }); }
})();
