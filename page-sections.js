/* ZB page sections — renders custom pages built from sections.
   Used by page.html for visitors, and by page-editor.js (edit mode) for click-to-edit.
   A section is a plain object: { type, ...fields }. Stored in Supabase as
   page_blocks rows with block_type = 'section' and the object in settings. */
(function(){
  'use strict';

  // ---------- safety helpers ----------
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function safeUrl(u){
    const s = String(u || '').trim();
    if(!s) return '';
    if(/^(https?:|mailto:|tel:)/i.test(s)) return s;
    if(/^[a-z][a-z0-9+.-]*:/i.test(s)) return ''; // javascript:, data:, etc.
    return s; // relative link like product.html or #section
  }

  const ALLOWED = new Set(['P','BR','STRONG','EM','U','A','UL','OL','LI','H2','H3','H4','BLOCKQUOTE']);
  const RENAME = {B:'STRONG', I:'EM', DIV:'P'};

  // Keeps only simple formatting (paragraphs, bold, italic, links, lists, headings).
  function sanitizeHTML(html){
    const doc = new DOMParser().parseFromString(`<div>${String(html || '')}</div>`, 'text/html');
    const root = doc.body.firstChild;
    const walk = (node, out) => {
      node.childNodes.forEach(n => {
        if(n.nodeType === 3){ out.appendChild(doc.createTextNode(n.nodeValue)); return; }
        if(n.nodeType !== 1) return;
        const tag = RENAME[n.tagName] || n.tagName;
        if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','TEMPLATE','SVG','MATH'].includes(n.tagName)) return;
        if(!ALLOWED.has(tag)){ walk(n, out); return; }
        const el = doc.createElement(tag);
        if(tag === 'A'){
          const href = safeUrl(n.getAttribute('href'));
          if(href){
            el.setAttribute('href', href);
            if(/^https?:/i.test(href) && !/^https?:\/\/(www\.)?zb\.life/i.test(href)){
              el.setAttribute('target','_blank'); el.setAttribute('rel','noopener');
            }
          }
        }
        walk(n, el);
        // drop empty wrappers except line breaks
        if(tag !== 'BR' && !el.textContent.trim() && !el.querySelector('br')) return;
        out.appendChild(el);
      });
    };
    const out = doc.createElement('div');
    walk(root, out);
    // wrap stray top-level text into paragraphs
    const wrapped = doc.createElement('div'); let para = null;
    [...out.childNodes].forEach(n => {
      const inline = n.nodeType === 3 || ['STRONG','EM','U','A','BR'].includes(n.nodeName);
      if(inline){
        if(n.nodeType === 3 && !n.nodeValue.trim() && !para) return;
        if(!para){ para = doc.createElement('p'); wrapped.appendChild(para); }
        para.appendChild(n);
      } else { para = null; wrapped.appendChild(n); }
    });
    return wrapped.innerHTML;
  }

  const plainToHTML = t => String(t || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');

  const textOf = html => {
    const d = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html');
    d.querySelectorAll('p,li,h2,h3,h4,br').forEach(n => n.append(' '));
    return d.body.textContent.replace(/\s+/g, ' ').trim();
  };

  // ---------- section catalogue ----------
  const TYPES = {
    text:       { label:'text',            hint:'Heading and paragraphs' },
    image:      { label:'image',           hint:'One large photo' },
    image_text: { label:'image + text',    hint:'Photo beside a heading and text' },
    banner:     { label:'banner',          hint:'Big photo with words on top' },
    gallery:    { label:'gallery',         hint:'A grid of photos' },
    faq:        { label:'faq',             hint:'Questions that open and close' },
    button:     { label:'button',          hint:'A single call-to-action button' }
  };

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
  }));

  function blankSection(type){
    const base = { _id: uid(), type };
    switch(type){
      case 'text':       return { ...base, heading:'', body:'', align:'left', bg:'none' };
      case 'image':      return { ...base, src:'', alt:'', caption:'', width:'contained' };
      case 'image_text': return { ...base, src:'', alt:'', heading:'', body:'', side:'left', bg:'none', button:{label:'', link:''} };
      case 'banner':     return { ...base, src:'', alt:'', eyebrow:'', heading:'', subheading:'', tone:'dark', height:'tall', button:{label:'', link:''} };
      case 'gallery':    return { ...base, heading:'', columns:3, images:[{src:'',alt:''},{src:'',alt:''},{src:'',alt:''}] };
      case 'faq':        return { ...base, heading:'', bg:'none', items:[{q:'',a:''},{q:'',a:''}] };
      case 'button':     return { ...base, button:{label:'', link:''}, style:'solid', align:'center' };
    }
    return base;
  }

  const S = (type, fields) => ({ ...blankSection(type), ...fields });
  const TEMPLATES = {
    policy: {
      label:'policy', hint:'Returns, shipping, privacy, terms — headings and text',
      sections: () => [
        S('text', { heading:'', body:'<p>Start with a short summary of this policy.</p>' }),
        S('text', { heading:'section heading', body:'<p>Explain the details here.</p>' }),
        S('text', { heading:'questions?', body:'<p>Tell customers how to reach you.</p>' })
      ]
    },
    about: {
      label:'about / story', hint:'Your brand story with big photos',
      sections: () => [
        S('banner', { eyebrow:'our story', heading:'your headline here', subheading:'One line about who you are.' }),
        S('image_text', { heading:'where it started', body:'<p>Tell the story of how ZB began.</p>', side:'left' }),
        S('image_text', { heading:'what we believe', body:'<p>Share what matters to you.</p>', side:'right', bg:'blush' }),
        S('gallery', { heading:'', columns:3 }),
        S('button', { button:{ label:'shop now', link:'product.html' } })
      ]
    },
    campaign: {
      label:'campaign / lookbook', hint:'Banner, photo gallery and shop buttons',
      sections: () => [
        S('banner', { eyebrow:'new', heading:'campaign title', subheading:'A short line to set the mood.', button:{ label:'shop now', link:'product.html' } }),
        S('text', { heading:'', body:'<p>Introduce the campaign in a sentence or two.</p>', align:'center' }),
        S('gallery', { columns:3, images:[{src:'',alt:''},{src:'',alt:''},{src:'',alt:''},{src:'',alt:''},{src:'',alt:''},{src:'',alt:''}] }),
        S('image_text', { heading:'the details', body:'<p>Describe the hero product or moment.</p>', side:'right', button:{ label:'shop the look', link:'product.html' } })
      ]
    },
    faq: {
      label:'faq', hint:'Questions and answers that open and close',
      sections: () => [
        S('text', { heading:'', body:'<p>Answers to the questions we hear most.</p>', align:'center' }),
        S('faq', { heading:'', items:[
          {q:'Question one?', a:'<p>Write the answer here.</p>'},
          {q:'Question two?', a:'<p>Write the answer here.</p>'},
          {q:'Question three?', a:'<p>Write the answer here.</p>'}
        ]})
      ]
    },
    blank: {
      label:'blank', hint:'Start from one empty text section',
      sections: () => [ S('text', {}) ]
    }
  };

  // ---------- rendering ----------
  // opts.edit = true adds the hooks page-editor.js uses (data-f, data-img, data-btn, placeholders).
  function renderSections(sections, opts = {}){
    const edit = !!opts.edit;
    return (sections || []).map((s, i) => renderOne(s, i, edit)).join('');
  }

  function field(tag, s, path, value, edit, { cls = '', placeholder = '', rich = false } = {}){
    const v = value ?? '';
    const isEmpty = rich ? !textOf(v) : !String(v).trim();
    if(!edit && isEmpty) return '';
    const content = rich ? sanitizeHTML(v) : esc(v);
    const attrs = edit ? ` data-f="${esc(path)}"${rich ? ' data-rich' : ''} data-placeholder="${esc(placeholder)}" contenteditable="true" spellcheck="true"` : '';
    return `<${tag} class="${cls}${isEmpty && edit ? ' zbs-empty' : ''}"${attrs}>${content}</${tag}>`;
  }

  function img(s, path, src, alt, edit, cls = ''){
    const u = safeUrl(src);
    if(!u && !edit) return '';
    const hook = edit ? ` data-img="${esc(path)}" role="button" tabindex="0" title="Click to change photo"` : '';
    if(!u) return `<div class="zbs-img zbs-img-empty ${cls}"${hook}><span>+ add photo</span></div>`;
    return `<div class="zbs-img ${cls}"${hook}><img src="${esc(u)}" alt="${esc(alt || '')}" loading="lazy"></div>`;
  }

  function btn(s, path, b, edit, style = 'solid'){
    const label = b?.label || '', link = safeUrl(b?.link) || '#';
    if(!label && !edit) return '';
    const hook = edit ? ` data-btn="${esc(path)}" title="Click to edit button"` : '';
    const cls = style === 'outline' ? 'pj-text-link' : 'btn';
    if(!label) return `<a class="${cls} zbs-btn zbs-btn-empty" href="#"${hook}>+ add button</a>`;
    return `<a class="${cls} zbs-btn" href="${esc(link)}"${hook}>${esc(label)}</a>`;
  }

  function wrap(s, i, edit, cls, inner, extra = ''){
    const editAttrs = edit ? ` data-section="${i}" data-type="${esc(s.type)}"` : '';
    return `<section class="zbs ${cls}"${editAttrs}${extra}>${inner}</section>`;
  }

  const bgCls = s => s.bg && s.bg !== 'none' ? ` zbs-bg-${esc(s.bg)}` : '';

  function renderOne(s, i, edit){
    switch(s.type){
      case 'text':
        return wrap(s, i, edit, `zbs-text zbs-align-${s.align === 'center' ? 'center' : 'left'}${bgCls(s)}`,
          `<div class="zbs-inner zbs-narrow">${field('h2', s, 'heading', s.heading, edit, { cls:'zbs-heading', placeholder:'add a heading (optional)' })}${field('div', s, 'body', s.body, edit, { cls:'zbs-rich', placeholder:'Start typing…', rich:true })}</div>`);

      case 'image':
        return wrap(s, i, edit, `zbs-image zbs-w-${s.width === 'full' ? 'full' : 'contained'}`,
          `<figure class="zbs-inner">${img(s, 'src', s.src, s.alt, edit, 'zbs-img-wide')}${field('figcaption', s, 'caption', s.caption, edit, { cls:'zbs-caption', placeholder:'add a caption (optional)' })}</figure>`);

      case 'image_text':
        return wrap(s, i, edit, `zbs-image-text zbs-side-${s.side === 'right' ? 'right' : 'left'}${bgCls(s)}`,
          `<div class="zbs-inner zbs-split">${img(s, 'src', s.src, s.alt, edit, 'zbs-img-split')}<div class="zbs-copy">${field('h2', s, 'heading', s.heading, edit, { cls:'zbs-heading', placeholder:'add a heading' })}${field('div', s, 'body', s.body, edit, { cls:'zbs-rich', placeholder:'Write something…', rich:true })}${btn(s, 'button', s.button, edit, 'outline')}</div></div>`);

      case 'banner': {
        const u = safeUrl(s.src);
        const bgImg = u ? `<img class="zbs-banner-bg" src="${esc(u)}" alt="${esc(s.alt || '')}">` : '';
        const imgHook = edit ? `<button type="button" class="zbs-banner-photo" data-img="src">${u ? 'change photo' : '+ add photo'}</button>` : '';
        return wrap(s, i, edit, `zbs-banner zbs-tone-${s.tone === 'light' ? 'light' : 'dark'} zbs-h-${s.height === 'short' ? 'short' : 'tall'}${u ? ' has-img' : ''}`,
          `<div class="zbs-inner zbs-banner-box">${bgImg}${imgHook}<div class="zbs-banner-copy">${field('span', s, 'eyebrow', s.eyebrow, edit, { cls:'eyebrow zbs-eyebrow', placeholder:'small label' })}${field('h1', s, 'heading', s.heading, edit, { cls:'zbs-banner-heading', placeholder:'big headline' })}${field('p', s, 'subheading', s.subheading, edit, { cls:'zbs-banner-sub', placeholder:'supporting line (optional)' })}${btn(s, 'button', s.button, edit)}</div></div>`);
      }

      case 'gallery': {
        const cols = [2,3,4].includes(+s.columns) ? +s.columns : 3;
        const items = (s.images || []).map((m, j) => {
          const cell = img(s, `images.${j}.src`, m.src, m.alt, edit, 'zbs-img-tile');
          if(!cell) return '';
          const rm = edit ? `<button type="button" class="zbs-mini-x" data-remove-item="images.${j}" title="Remove photo">×</button>` : '';
          return `<div class="zbs-tile">${cell}${rm}</div>`;
        }).join('');
        const add = edit ? `<button type="button" class="zbs-add-item zbs-tile" data-add-item="images">+ add photo slot</button>` : '';
        return wrap(s, i, edit, 'zbs-gallery',
          `<div class="zbs-inner">${field('h2', s, 'heading', s.heading, edit, { cls:'zbs-heading', placeholder:'add a heading (optional)' })}<div class="zbs-grid zbs-cols-${cols}">${items}${add}</div></div>`);
      }

      case 'faq': {
        const items = (s.items || []).map((it, j) => {
          if(edit){
            return `<div class="zbs-faq-item zbs-faq-edit"><div class="zbs-faq-q-row">${field('div', s, `items.${j}.q`, it.q, edit, { cls:'zbs-faq-q', placeholder:'type the question' })}<button type="button" class="zbs-mini-x" data-remove-item="items.${j}" title="Remove question">×</button></div>${field('div', s, `items.${j}.a`, it.a, edit, { cls:'zbs-rich zbs-faq-a', placeholder:'type the answer', rich:true })}</div>`;
          }
          if(!String(it.q || '').trim()) return '';
          return `<details class="zbs-faq-item"><summary class="zbs-faq-q">${esc(it.q)}<span class="zbs-faq-icon" aria-hidden="true"></span></summary><div class="zbs-rich zbs-faq-a">${sanitizeHTML(it.a)}</div></details>`;
        }).join('');
        const add = edit ? `<button type="button" class="zbs-add-item zbs-add-line" data-add-item="items">+ add question</button>` : '';
        return wrap(s, i, edit, `zbs-faq${bgCls(s)}`,
          `<div class="zbs-inner zbs-narrow">${field('h2', s, 'heading', s.heading, edit, { cls:'zbs-heading', placeholder:'add a heading (optional)' })}<div class="zbs-faq-list">${items}</div>${add}</div>`);
      }

      case 'button': {
        const b = btn(s, 'button', s.button, edit, s.style);
        if(!b) return '';
        return wrap(s, i, edit, `zbs-button zbs-align-${s.align === 'left' ? 'left' : 'center'}`, `<div class="zbs-inner zbs-narrow">${b}</div>`);
      }
    }
    return '';
  }

  // Plain-text version of a page — used for the SEO description and the
  // admin "content" fallback.
  function pageText(sections){
    return (sections || []).map(s => [s.eyebrow, s.heading, s.subheading, textOf(s.body), s.caption,
      ...(s.items || []).map(it => `${it.q || ''} ${textOf(it.a)}`)].filter(Boolean).join(' ')).join(' ').replace(/\s+/g, ' ').trim();
  }

  window.ZBPageSections = { TYPES, TEMPLATES, blankSection, renderSections, sanitizeHTML, plainToHTML, textOf, pageText, safeUrl, esc, uid };
})();
