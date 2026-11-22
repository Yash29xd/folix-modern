/**
 * @file app.js
 * @description Core runtime engine and UI controller for Folix PDF Viewer.
 *
 * Architecture Overview:
 * - Single-Page Zero-Dependency Architecture:
 *   Runs directly in modern browsers without build steps, bundlers, or frameworks.
 *   Uses Mozilla PDF.js for PDF rasterization and pdf-lib for in-browser PDF manipulation.
 * - Progressive Enhancement & Execution Scopes:
 *   Executes on all site pages to populate branding/config tokens and manage site themes.
 *   Exits early on non-viewer pages if `#pages` container is absent.
 * - Subsystems:
 *   1. Theme & DOM Binding Subsystem (light/sepia/dark site-wide theming)
 *   2. PDF Document Lifecycle & Decryption Subsystem (password modal, memory management)
 *   3. Virtual Page Rendering & Memory Eviction Engine (IntersectionObserver, DPR limits, canvas caching)
 *   4. Zoom, Geometry & Layout Calculations (fit-width, fit-height, fit-content, two-page view)
 *   5. Sidebar Navigation (Thumbnails, Outline, Search, Notes, Translate)
 *   6. Annotation Engine (Vector Ink, Highlighting, Notes, Text, Signatures)
 *   7. Document Modification & Export (pdf-lib flattening, form fields, Web Share API)
 *   8. Session State Persistence (IndexedDB & LocalStorage for recent files, annotations, last-read page)
 *   9. Full-Text Search with CSS Custom Highlight API
 *   10. Text-to-Speech (TTS) SpeechSynthesis Engine
 *   11. Multi-Page Manipulation (Page Tools: reorder, rotate, delete, merge, extract)
 *   12. On-Device & Online Translation Engine (Chrome Translator & MyMemory)
 *   13. Responsive Adaptive Toolbar & Autohide Management
 *   14. Touch & Trackpad Gesture Engine (Pinch-to-zoom & Double-tap)
 *   15. PWA OS Integration (File Handling API & Share Target)
 */
(()=>{
// ============================================================================
// SECTION 1: UTILITIES, CONFIGURATION BINDING, AND BRANDING
// ============================================================================

/**
 * Shorthand helper to retrieve an element by its DOM ID.
 * @param {string} id - HTML element identifier.
 * @returns {HTMLElement|null}
 */
const $=id=>document.getElementById(id);
const C=window.FOLIX_CONFIG;
/**
 * Embedded SVG vector icon dictionary (35 icons).
 * Embedding vector assets inline ensures the viewer UI remains fully functional
 * and visually intact even if network requests for external SVG assets fail or are offline.
 * @type {Record<string, string>}
 */
const ICONS={"close":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M18 6L6 18M6 6l12 12\"/></svg>","contrast":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3a9 9 0 0 1 0 18z\" fill=\"#0a0a0a\"/></svg>","download":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3\"/></svg>","eraser":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21M22 21H7M5 11l7 7\"/></svg>","fit-height":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 3h16M4 21h16M12 7v10M9 10l3-3 3 3M9 14l3 3 3-3\"/></svg>","fit-width":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 4v16M21 4v16M7 12h10M10 9l-3 3 3 3M14 9l3 3-3 3\"/></svg>","fullscreen":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3\"/></svg>","highlight":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m4 16 6-12h4l6 12M6.5 11.5h11M3 20h18\"/></svg>","image":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"3\"/><circle cx=\"8.5\" cy=\"8.5\" r=\"1.5\"/><path d=\"m21 15-5-5L5 21\"/></svg>","marker":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m9 11-6 6v3h3l6-6M13.5 6.5l4 4M15 5l2-2a2 2 0 0 1 3 3l-2 2-4-4z\"/></svg>","menu":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 6h16M4 12h16M4 18h16\"/></svg>","more":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"#0a0a0a\" stroke=\"none\"><circle cx=\"5\" cy=\"12\" r=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><circle cx=\"19\" cy=\"12\" r=\"2\"/></svg>","next":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m9 18 6-6-6-6\"/></svg>","note":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6M8 13h8M8 17h5\"/></svg>","ocr":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 7V4h3M17 4h3v3M4 17v3h3M17 20h3v-3M9 16l3-8 3 8M9.8 13.5h4.4\"/></svg>","open":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z\"/></svg>","pages-edit":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"8\" y=\"3\" width=\"13\" height=\"15\" rx=\"2\"/><path d=\"M4 8v11a2 2 0 0 0 2 2h11M12 8h5M12 12h3\"/></svg>","pen":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z\"/><path d=\"m15 5 4 4\"/></svg>","pin":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 17v5M5 17h14l-2-6V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7l-2 6z\"/></svg>","prev":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m15 18-6-6 6-6\"/></svg>","print":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2\"/><rect x=\"6\" y=\"14\" width=\"12\" height=\"8\" rx=\"1\"/></svg>","redo":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 4l5 4-5 4M20 8H9a5 5 0 0 0 0 10h4\"/></svg>","rotate":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 12a9 9 0 1 1-9-9c2.52 0 4.8 1.03 6.45 2.7L21 8M21 3v5h-5\"/></svg>","search":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.35-4.35\"/></svg>","share":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"18\" cy=\"5\" r=\"3\"/><circle cx=\"6\" cy=\"12\" r=\"3\"/><circle cx=\"18\" cy=\"19\" r=\"3\"/><path d=\"m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98\"/></svg>","sidebar":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M9 3v18\"/></svg>","signature":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 17c3.5-7 5.5-8 6.5-4s1 7 3.5 1c1.5-3.5 3-4 4-2s2 4 4 1M3 21h18\"/></svg>","speaker":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14\"/></svg>","spotlight":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\"/></svg>","textbox":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\" stroke-dasharray=\"3 3\"/><path d=\"M8 8h8M12 8v8\"/></svg>","translate":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 8l4 8M9 8L5 16M4 14h6M2 5h10M7 2v3M14 10a7 7 0 0 1 7 7M14 17c3 0 5-2 6-5M12 21l3-6 3 6M13.5 19h3\"/></svg>","trim":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14\"/></svg>","two-page":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\"/></svg>","undo":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 14L4 10l5-4M4 10h11a5 5 0 0 1 0 10h-2\"/></svg>","zoom-in":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.35-4.35M11 8v6M8 11h6\"/></svg>","zoom-out":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0a0a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.35-4.35M8 11h6\"/></svg>"};
/**
 * Resolves an icon name to a data URI or fallback asset path.
 * @param {string} n - Icon identifier (e.g. 'pen', 'zoom-in').
 * @returns {string} Data URI containing URL-encoded SVG string or static path.
 */
const icoSrc=n=>ICONS[n]?'data:image/svg+xml,'+encodeURIComponent(ICONS[n]):'assets/icons/'+n+'.svg';
document.querySelectorAll('img[src*="/icons/"]').forEach(im=>{const n=im.getAttribute('src').split('/').pop().replace('.svg','');im.classList.add('ic');if(ICONS[n])im.src=icoSrc(n)});

document.querySelectorAll('[data-cfg]').forEach(e=>e.textContent=C[e.dataset.cfg]);
document.querySelectorAll('a[data-mail]').forEach(a=>a.href='mailto:'+C.email);
const cp=$('copy');if(cp)cp.onclick=()=>{(navigator.clipboard?navigator.clipboard.writeText(C.email):Promise.reject()).then(()=>{cp.textContent='Copied!'},()=>{cp.textContent=C.email});setTimeout(()=>cp.textContent='Copy email',2000)};
const burger=$('burger'),hdr=document.querySelector('.top');
function closeMobileNav(){
  if(hdr&&hdr.classList.contains('open')){
    hdr.classList.remove('open');
    if(burger){burger.setAttribute('aria-expanded','false');burger.firstElementChild.src=icoSrc('menu')}
  }
}
if(burger)burger.onclick=()=>{const o=hdr.classList.toggle('open');burger.setAttribute('aria-expanded',o);burger.firstElementChild.src=icoSrc(o?'close':'menu')};

document.querySelectorAll('#nav [data-action]').forEach(opt=>{
  opt.addEventListener('click',e=>{
    e.stopPropagation();
    closeMobileNav();
    if(typeof handleMenuAction==='function')handleMenuAction(opt.dataset.action);
  });
});
document.querySelectorAll('#nav a').forEach(a=>{
  a.addEventListener('click',()=>closeMobileNav());
});

// Privacy / Local Storage Consent Banner
const cn=$('cookie-notice'),ca=$('cookie-accept'),cr=$('cookie-reject');
if(cn){
  try{if(!localStorage.getItem('folix.consent'))cn.classList.remove('hide');}catch(e){}
  if(ca)ca.onclick=()=>{try{localStorage.setItem('folix.consent','all')}catch(e){}cn.classList.add('hide')};
  if(cr)cr.onclick=()=>{try{localStorage.setItem('folix.consent','essential')}catch(e){}cn.classList.add('hide')};
}
// ============================================================================
// SECTION 2: SITE-WIDE THEME SUBSYSTEM (LIGHT, SEPIA, DARK, AUTO)
// ============================================================================

/**
 * Supported color schemes and their corresponding browser meta theme-color hex values.
 * Themes restyle both the viewer UI and the rendered PDF pages.
 */
const THEMES=['light','sepia','dark-ui','dark'],TCOL={light:'#e8600a',sepia:'#c46b20','dark-ui':'#e8600a',dark:'#a9500f'};
let themePref='auto',th='light';
try{
  const t=localStorage.getItem('folix.theme');
  if(t==='auto'||t==='sepia'||t==='dark'||t==='light'||t==='dark-ui')themePref=t;
  else if(localStorage.getItem('folix.dark')==='1')themePref='dark-ui';
}catch(e){}

function resolveTheme(pref){
  if(pref==='auto'){
    return(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark-ui':'light';
  }
  return pref;
}
th=resolveTheme(themePref);

if(window.matchMedia){
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',e=>{
    if(themePref==='auto'){
      th=e.matches?'dark-ui':'light';
      applyTheme();
    }
  });
}

const themeHooks=[];
/**
 * Applies the current theme (`th`) to the DOM.
 * Updates `document.documentElement.dataset.theme`, theme-color meta tag,
 * updates theme toggle button labels, and invokes registered theme hooks.
 */
function applyTheme(){
  document.documentElement.dataset.theme=th;
  const mc=document.querySelector('meta[name=theme-color]');if(mc)mc.content=TCOL[th]||TCOL.light;
  let lbl='Light';
  if(themePref==='dark-ui')lbl='Dark UI (Light PDF)';
  else if(themePref==='dark')lbl='Dark (Invert PDF)';
  else if(themePref==='auto')lbl='Auto ('+(th==='dark-ui'?'Dark UI':'Light')+')';
  else if(themePref==='sepia')lbl='Sepia';
  document.querySelectorAll('[data-theme-toggle]').forEach(b=>{
    b.title='Theme: '+lbl+' (click to change)';
    b.setAttribute('aria-label','Theme: '+lbl+'. Click to change');
    if(b.dataset.themeToggle==='text')b.textContent='Theme: '+lbl;
  });
  updateThemeMenuUi();
  themeHooks.forEach(f=>f());
}

function updateThemeMenuUi(){
  document.querySelectorAll('.theme-opt').forEach(opt=>{
    const v=opt.dataset.themeVal;
    const isSel=(v===themePref);
    opt.setAttribute('aria-checked',isSel?'true':'false');
    opt.classList.toggle('active',isSel);
    opt.classList.toggle('on',isSel);
  });
  const pop=$('theme-pop'),btn=$('theme-btn');
  if(btn&&pop){
    btn.setAttribute('aria-expanded',!pop.classList.contains('hide'));
  }
}

function setThemeChoice(pref){
  if(!['light','dark-ui','dark','auto','sepia'].includes(pref))pref='light';
  themePref=pref;
  try{localStorage.setItem('folix.theme',pref)}catch(e){}
  th=resolveTheme(pref);
  applyTheme();
  let lbl='Light';
  if(pref==='dark-ui')lbl='Dark UI (Light PDF)';
  else if(pref==='dark')lbl='Dark (Invert PDF)';
  else if(pref==='auto')lbl='Auto (System)';
  else if(pref==='sepia')lbl='Sepia';
  if(typeof msg==='function')msg('Theme: '+lbl);
}

/**
 * Cycles to the next available theme in circular order: Light -> Dark UI -> Dark -> Auto -> Sepia.
 * Persists the new theme choice in localStorage and displays a temporary status toast.
 */
function nextTheme(){
  const cycle=['light','dark-ui','dark','auto','sepia'];
  const next=cycle[(cycle.indexOf(themePref)+1)%cycle.length];
  setThemeChoice(next);
}
document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.addEventListener('click',nextTheme));

// Dropdown theme menu setup
const themeBtn=$('theme-btn'),themePop=$('theme-pop'),themePopClose=$('theme-pop-close');
if(themeBtn&&themePop){
  themeBtn.onclick=e=>{
    e.stopPropagation();
    const isHidden=themePop.classList.contains('hide');
    if(isHidden){
      if(typeof closePops==='function')closePops();
      themePop.classList.remove('hide');
      themeBtn.setAttribute('aria-expanded','true');
      updateThemeMenuUi();
    }else{
      themePop.classList.add('hide');
      themeBtn.setAttribute('aria-expanded','false');
    }
  };
  if(themePopClose){
    themePopClose.onclick=e=>{
      e.stopPropagation();
      themePop.classList.add('hide');
      themeBtn.setAttribute('aria-expanded','false');
    };
  }
  document.querySelectorAll('.theme-opt').forEach(opt=>{
    opt.onclick=e=>{
      e.stopPropagation();
      setThemeChoice(opt.dataset.themeVal);
      themePop.classList.add('hide');
      themeBtn.setAttribute('aria-expanded','false');
    };
  });
  document.addEventListener('click',e=>{
    if(themePop&&!themePop.classList.contains('hide')&&!themePop.contains(e.target)&&e.target!==themeBtn){
      themePop.classList.add('hide');
      if(themeBtn)themeBtn.setAttribute('aria-expanded','false');
    }
  });
}

applyTheme();
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))addEventListener('load',()=>{navigator.serviceWorker.register('sw.js?v=3.0').then(reg=>{try{reg.update()}catch(e){}}).catch(()=>{})});
// ============================================================================
// SECTION 3: VIEWER RUNTIME INITIALIZATION & STATE
// ============================================================================

// Static informational pages (about.html, faq.html, etc.) do not contain `#pages`.
// Early return allows app.js to safely power branding and themes on all pages.
if(!$('pages'))return; // static pages stop here
const lib=window.pdfjsLib;
// CVE-2024-4367 mitigation: forcibly disable eval-based font glyph compilation (belt-and-suspenders alongside isEvalSupported:false in getDocument calls)
if(lib.FeatureTest)try{Object.defineProperty(lib.FeatureTest,'isEvalSupported',{value:false,writable:false,configurable:false})}catch(e){}
lib.GlobalWorkerOptions.workerSrc=C.workerSrc;
const main=$('main'),pagesEl=$('pages'),empty=$('empty');
let noHide=0,rot=0,fitMode='w';let pdf=null,bytes=null,name='document.pdf',scale=1,base=null,cur=1,io=null,hits=[],hi=-1,query='';
const ctrls=['prev','next','pg','zo','zi','fit','fith','rot','two','spotb','sb','ann','share','tts','png','ptb','trim','sprev','snext','trdocb','q','dl','pr','ocrb'];
/**
 * Displays a non-blocking toast notification at the bottom of the screen.
 * Automatically clears after 2.5 seconds.
 * @param {string} t - Message text to display (or empty string to hide).
 */
const msg=t=>{const m=$('msg');m.textContent=t;m.style.display=t?'block':'none';if(t)setTimeout(()=>m.style.display='none',2500)};

/**
 * Primary document ingestion entry point.
 * Destroys existing PDF resources, clears page containers, prompts for passwords if encrypted,
 * initializes document geometry, enables toolbar buttons, triggers initial page layout,
 * initializes annotations and spotlight mode, restores last-read position, records recent history,
 * and loads cached translations.
 *
 * @param {Uint8Array} data - Binary array buffer of the PDF file.
 * @param {string} [fname='document.pdf'] - Original file name for window title and downloads.
 * @returns {Promise<void>}
 */
async function openData(data,fname){
  try{
    if(pdf){pdf.destroy();pdf=null}
    pagesEl.innerHTML='';resetSide();msg('Loading…');
    bytes=data.slice(0);name=fname||'document.pdf';
    const task=lib.getDocument({data,isEvalSupported:false});
    task.onPassword=(update,reason)=>askPw(update,reason,task);
    pdf=await task.promise;
    const p1=await pdf.getPage(1);base=p1.getViewport({scale:1});
    empty.classList.add('hide');document.body.classList.add('reading');requestAnimationFrame(fitBar);
    ctrls.forEach(c=>$(c).disabled=false);
    $('pg').max=pdf.numPages;$('tot').textContent='/ '+pdf.numPages;
    document.title=name+' – Folix';
    rot=0;fitDefault(true);build();initSide();initAnn();initSpot();msg('');restoreLast();recentAdd();trLoad();
  }catch(e){
    const was=pwCancelled;pwCancelled=false;
    msg(was?'Cancelled':'Could not open this PDF');
    if(!pdf){empty.classList.remove('hide');document.body.classList.remove('reading');requestAnimationFrame(fitBar)}
    if(!was)console.error(e);
  }
}
// ============================================================================
// SECTION 4: VIRTUAL PAGE RENDERING ENGINE & MEMORY MANAGEMENT
// ============================================================================

/**
 * Rendering Queue & Memory Budget State:
 * - `want`: Set of `.page` DOM elements currently within the viewport rootMargin (+/- 700px).
 * - `kept`: Set of rendered `.page` elements holding active canvas bitmaps in memory.
 * - `tlq`: FIFO queue of text layer tasks executed during browser idle intervals.
 * - `rActive`: Number of active concurrent canvas renders (clamped to 1 for silky responsiveness).
 * - `MAX_PX` (9MP): Max canvas resolution ceiling to prevent mobile memory exhaustion.
 * - `KEEP_PX` (70MP) / `KEEP_N` (14): Maximum retained bitmap budget before eviction kicks in.
 */
const want=new Set(),kept=new Set(),tlq=[];
let rActive=0,pumpT=0,tlRun=false;
const MAX_PX=9e6,KEEP_PX=70e6,KEEP_N=14;
const ctxFilter=typeof CanvasRenderingContext2D!=='undefined'&&'filter' in CanvasRenderingContext2D.prototype;
const idle=f=>window.requestIdleCallback?requestIdleCallback(f,{timeout:300}):setTimeout(f,16);
const dist=d=>Math.abs(d.offsetTop+d.offsetHeight/2-(main.scrollTop+main.clientHeight/2));
/**
 * Computes the 2D canvas filter string based on active theme and spotlight state.
 * Baking this filter directly into the 2D canvas bitmap avoids expensive continuous GPU
 * compositing filters during rapid smooth scrolling.
 *
 * @returns {string} CSS filter expression or empty string for default light theme.
 */
function bakeFilter(){
  if(!ctxFilter)return '';
  if(th==='dark')return 'invert(.92) hue-rotate(180deg)';
  if(th==='sepia')return 'sepia(.6) saturate(.85) brightness(.96)';
  if(main.dataset.spot==='1')return 'sepia(.55) brightness(.92)';
  return '';
}
/**
 * Constructs the DOM container elements for all pages in the PDF.
 * Disconnects existing IntersectionObserver, clears rendering sets, creates `.page` divs
 * with appropriate aspect-ratio sizing, and registers each container for intersection tracking.
 */
function build(){
  if(io)io.disconnect();
  want.clear();kept.clear();tlq.length=0;
  pagesEl.innerHTML='';
  io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)want.add(e.target);else{want.delete(e.target);if(e.target._rt&&!e.target._done){try{e.target._rt.cancel()}catch(x){}}}});pump()},{root:main,rootMargin:'700px 0px'});
  for(let i=1;i<=pdf.numPages;i++){
    const d=document.createElement('div');d.className='page';d.dataset.n=i;size(d);pagesEl.appendChild(d);io.observe(d);
  }
  $('zl').textContent=Math.round(scale*100)+'%';
}
/**
 * Scales text and annotation layers to match a newly applied page scale.
 * Used during smooth zooming before high-resolution re-rendering completes.
 *
 * @param {HTMLElement} d - The page container element.
 * @param {HTMLElement} tl - The textLayer or annotationLayer DOM element.
 */
function applyTl(d,tl){const k=d._s/tl._s;tl.style.transformOrigin='0 0';tl.style.transform=Math.abs(k-1)<.001?'':'scale('+k+')'}
/**
 * Reconfigures all page DOM containers when zoom scale or rotation changes.
 *
 * @param {boolean} resize - Whether to recalculate container width and height.
 * @param {boolean} hard - If true, discards existing canvases and annotation layers.
 *                         If false (soft zoom), stretches existing bitmaps to keep text selection active.
 */
function resetPages(resize,hard){
  want.clear();tlq.length=0;if(hard)kept.clear();
  pagesEl.querySelectorAll('.page').forEach(d=>{
    d._tok=(d._tok||0)+1;if(d._rt){try{d._rt.cancel()}catch(e){}d._rt=null}
    d._busy=false;d._done=false;if(resize)size(d);
    if(hard){d.textContent='';d._svg=d._g=d._nl=null;d._noAnn=false}
    else{   // soft: keep the old bitmap (stretched) and the text layer so a selection survives zooming
      const cv=d.querySelector('canvas');if(cv){cv.style.width=d.style.width;cv.style.height=d.style.height}
      d._s=scale;d.querySelectorAll('.textLayer,.annotationLayer').forEach(x=>applyTl(d,x));d.querySelectorAll('.trlayer').forEach(L=>{L.style.transform='scale('+d._s+')'});if(d._g)annDraw(d);
    }
    io.unobserve(d);io.observe(d);
  });
}
/**
 * Schedules rendering of the next visible page.
 * Prioritizes the page closest to the viewport center. Suppresses rendering if the user
 * is actively flicking / scrolling rapidly (`vel > 1800`) to avoid wasting GPU/CPU on skipped pages.
 */
function pump(){
  if(pumpT)return;
  pumpT=setTimeout(()=>{
    pumpT=0;if(rActive>=1||!pdf)return;
    if(vel>1800&&performance.now()-lastT0<120){setTimeout(pump,90);return}
    let best=null,bd=1e12;want.forEach(d=>{if(d._done||d._busy)return;const x=dist(d);if(x<bd){bd=x;best=d}});
    if(best)render(best);
  },0);
}
/**
 * Frees canvas memory and layer DOM nodes for a page that has been evicted from cache.
 *
 * @param {HTMLElement} d - Page container element to clean up.
 */
function freePage(d){d._noAnn=false;kept.delete(d);d._tok=(d._tok||0)+1;d._done=false;d.textContent='';d._svg=d._g=d._nl=null}
/**
 * Enforces memory limits on rendered canvas bitmaps.
 * If total rendered canvas pixels exceed `KEEP_PX` (70MP) or page count exceeds `KEEP_N` (14),
 * evicts the rendered pages furthest from the current scroll position.
 */
function evict(){
  let sum=0;kept.forEach(d=>sum+=d._px||0);
  if(kept.size<=KEEP_N&&sum<=KEEP_PX)return;
  [...kept].filter(d=>!want.has(d)).sort((a,b)=>dist(b)-dist(a)).forEach(d=>{
    if(kept.size<=KEEP_N&&sum<=KEEP_PX)return;sum-=d._px||0;freePage(d);
  });
}
const bw=()=>rot%180?base.height:base.width,bh=()=>rot%180?base.width:base.height;
/**
 * Calculates and sets page container inline styles (width and height)
 * based on base page dimensions, scale factor, and rotation angle.
 *
 * @param {HTMLElement} d - Page container element.
 */
function size(d){d.style.width=bw()*scale+'px';d.style.height=bh()*scale+'px'}
/**
 * Asynchronously renders a single PDF page onto an HTML5 canvas.
 * Manages device pixel ratio (clamped to C.maxDpr or scaled down to fit MAX_PX),
 * bakes color filters (sepia, dark mode) in 600px vertical stripes to prevent UI freezing,
 * attaches annotation layers, and queues text layer generation.
 *
 * @param {HTMLElement} d - Page container element to render.
 * @returns {Promise<void>}
 */
async function render(d){
  if(d._busy||d._done)return;
  d._busy=true;rActive++;const my=pdf,tok=d._tok=(d._tok||0)+1;
  try{
    const page=await my.getPage(+d.dataset.n);
    if(my!==pdf||d._tok!==tok||!want.has(d))return;
    const v1=page.getViewport({scale:1});d._W=v1.width;d._H=v1.height;
    const vp=page.getViewport({scale,rotation:(page.rotate+rot)%360});
    let dpr=Math.min(window.devicePixelRatio||1,C.maxDpr);
    if(vp.width*vp.height*dpr*dpr>MAX_PX)dpr=Math.max(.5,Math.sqrt(MAX_PX/(vp.width*vp.height)));
    d.style.width=vp.width+'px';d.style.height=vp.height+'px';
    const cv=document.createElement('canvas');
    cv.width=Math.floor(vp.width*dpr);cv.height=Math.floor(vp.height*dpr);
    cv.style.width=vp.width+'px';cv.style.height=vp.height+'px';
    const ctx=cv.getContext('2d',{alpha:false});
    const task=page.render({canvasContext:ctx,viewport:vp,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null});
    d._rt=task;await task.promise;d._rt=null;
    if(my!==pdf||d._tok!==tok)return;
    const f=bakeFilter();    // dark / sepia look is baked into the bitmap once, so scrolling stays cheap
    if(f){
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.filter=f;const H=cv.height,S=600;
      for(let y=0;y<H;y+=S){
        const h=Math.min(S,H-y);ctx.drawImage(cv,0,y,cv.width,h,0,y,cv.width,h);
        if(y+S<H){await new Promise(z=>setTimeout(z,0));if(d._tok!==tok||my!==pdf){ctx.restore();return}}
      }
      ctx.restore();cv.className='baked';
    }
    const old=d.querySelector('canvas');if(old)old.replaceWith(cv);else d.insertBefore(cv,d.firstChild);
    annAttach(d,vp);d._done=true;d._px=cv.width*cv.height;kept.add(d);evict();trOverlay(d);
    const etl=d.querySelector('.textLayer'),eal=d.querySelector('.annotationLayer');
    if(etl)applyTl(d,etl);if(eal)applyTl(d,eal);
    if(!etl||(!eal&&!d._noAnn)){tlq.push({d,page,vp,tok});if(!tlRun)runText()}
  }catch(e){if(e&&e.name!=='RenderingCancelledException')console.error(e)}
  finally{d._busy=false;d._rt=null;rActive--;pump()}
}
/**
 * Background worker loop for generating text selection and link/form annotation layers.
 * Uses requestIdleCallback to stream text content without blocking scrolling or user gestures.
 * Renders text spans in 100-item chunks.
 */
function runText(){
  tlRun=true;
  const live=j=>pdf&&j.d._done&&j.d._tok===j.tok;
  const step=async()=>{
    tlq.sort((a,b)=>dist(a.d)-dist(b.d));
    const j=tlq.shift();if(!j){tlRun=false;return}
    if(live(j)&&!j.d.querySelector('.textLayer')){
      try{
        const tl=document.createElement('div');tl.className='textLayer';tl._s=j.vp.scale;tl._divs=[];tl.style.setProperty('--scale-factor',scale);
        const tc=await j.page.getTextContent();
        if(live(j)){
          j.d.insertBefore(tl,j.d._svg||null);
          const its=tc.items;
          const ocrdEl=$('ocrd');
          if(!its.length && ocrdEl && ocrdEl._lastResults && ocrdEl._lastResults[j.d._n]){
            const ocrP = ocrdEl._lastResults[j.d._n];
            const words = ocrP.words || [];
            const s = (j.vp.scale || scale || 1) / 2.0;
            for(const w of words){
              if(!w.text || !w.bbox) continue;
              const span = document.createElement('span');
              span.textContent = w.text + ' ';
              span.style.left = (w.bbox.x0 * s) + 'px';
              span.style.top = (w.bbox.y0 * s) + 'px';
              span.style.fontSize = Math.max(8, (w.bbox.y1 - w.bbox.y0) * s) + 'px';
              tl.appendChild(span);
            }
          } else {
            for(let i=0;i<its.length;i+=100){
              if(!live(j))break;
              await lib.renderTextLayer({textContentSource:{items:its.slice(i,i+100),styles:tc.styles},container:tl,viewport:j.vp,textDivs:tl._divs}).promise;
              if(i+100<its.length)await new Promise(z=>idle(z));
            }
          }
          tl._done=true;mark(j.d);
        }
      }catch(e){}
    }
    if(live(j)&&!j.d.querySelector('.annotationLayer')&&!j.d._noAnn){
      try{
        const use=(await j.page.getAnnotations({intent:'display'})).filter(a=>a.subtype==='Link'||a.subtype==='Widget');
        if(!live(j)){}
        else if(!use.length)j.d._noAnn=true;
        else{
          const al=document.createElement('div');al.className='annotationLayer';al._s=j.vp.scale;al.style.setProperty('--scale-factor',j.vp.scale);
          j.d.insertBefore(al,j.d._svg||null);
          await new lib.AnnotationLayer({div:al,page:j.page,viewport:j.vp.clone({dontFlip:true})}).render({annotations:use,imageResourcesPath:'',renderForms:true,linkService:LS,downloadManager:null,annotationStorage:pdf.annotationStorage,enableScripting:false,hasJSActions:false});
        }
      }catch(e){console.warn('annotation layer',e)}
    }
    idle(step);
  };
  idle(step);
}
/**
 * Applies search hit highlighting to text spans in a page container.
 * Uses CSS Custom Highlight API when available, falling back to `.hit` DOM class toggling.
 *
 * @param {HTMLElement} d - Page container element.
 */
function mark(d){if(window.CSS&&CSS.highlights){hlSoon();return}const q=sQ;d.querySelectorAll('.textLayer span').forEach(s=>s.classList.toggle('hit',!!q&&s.textContent.toLowerCase().includes(q)))}
// ============================================================================
// SECTION 5: ZOOM, SCALE, AND LAYOUT CALCULATIONS
// ============================================================================

/**
 * Updates the document zoom scale, clamped between minScale and maxScale.
 * Maintains current page anchor position and triggers soft or hard page re-rendering.
 *
 * @param {number} s - Desired zoom scale (e.g. 1.0 = 100%).
 * @param {boolean} [km=false] - Whether to keep the current fit mode.
 * @param {boolean} [hard=false] - Whether to perform a hard reset.
 */
function setScale(s,km,hard){
  if(!pdf)return;if(!km)fitMode=null;
  const mid=cur;scale=Math.min(C.maxScale,Math.max(C.minScale,s));
  resetPages(true,hard);
  $('zl').textContent=Math.round(scale*100)+'%';
  go(mid);saveLast();
}
/**
 * Fits the page width exactly to the viewport width (accounting for two-page mode).
 * @param {boolean} [silent=false] - If true, updates scale without immediately re-rendering.
 */
function fitWidth(silent){scale=Math.max(.25,Math.min(5,(main.clientWidth-24-(two?24:0))/(pp()*bw())));fitMode='w';if(!silent)setScale(scale,true)}
/**
 * Calculates a comfortable default reading scale based on screen width.
 * @param {boolean} [silent=false] - If true, updates scale without immediately re-rendering.
 */
function fitDefault(silent){
  if(two)return fitWidth(silent);
  const vw=main.clientWidth,t=Math.min(vw-24,Math.max(640,Math.min(1500,vw*.7)));
  scale=Math.max(C.minScale,Math.min(C.maxScale,t/bw()));fitMode='d';if(!silent)setScale(scale,true);
}
/**
 * Re-applies the active fit mode (fit-width, fit-height, fit-content, default) after window resizing.
 */
function refit(){if(!pdf)return;if(fitMode==='d')fitDefault();else if(fitMode==='w')fitWidth();else if(fitMode==='h')fitHeight();else if(fitMode==='c')fitContent()}
let rzT;addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(refit,220)});
/**
 * Scales pages to fit their entire height within the visible window.
 */
function fitHeight(){setScale((main.clientHeight-56)/bh(),true);fitMode='h'}
/**
 * Smoothly navigates the viewport to the specified page number.
 * Updates the page input field, active thumbnail, and suppresses autohide briefly.
 *
 * @param {number} n - Target 1-based page number.
 */
function go(n){
  n=Math.min(pdf.numPages,Math.max(1,n|0));
  noHide=Date.now()+700;const d=pagesEl.children[n-1];if(d)main.scrollTop=d.offsetTop-8;
  cur=n;$('pg').value=n;markCur();
}
let tick=false,lastY0=0,lastT0=0,vel=0;
main.addEventListener('scroll',()=>{
  {const now=performance.now(),y=main.scrollTop,dt=Math.max(1,now-lastT0);vel=vel*.6+Math.abs(y-lastY0)/dt*1000*.4;lastY0=y;lastT0=now}
  if(!pdf||tick)return;tick=true;
  requestAnimationFrame(()=>{
    tick=false;const mid=main.scrollTop+main.clientHeight/3;
    const ch=pagesEl.children;let lo=0,hi2=ch.length-1;
    while(lo<hi2){const m=(lo+hi2+1)>>1;ch[m].offsetTop<=mid?lo=m:hi2=m-1}
    while(lo>0&&ch[lo-1].offsetTop===ch[lo].offsetTop)lo--;cur=lo+1;if(document.activeElement!==$('pg'))$('pg').value=cur;markCur();saveLast();
  });
},{passive:true});

// search

// ============================================================================
// SECTION 6: PRINTING & ORIGINAL FILE DOWNLOAD
// ============================================================================

/**
 * Downloads the currently opened PDF bytes directly using an object URL.
 */
function download(){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
/**
 * Initiates browser printing of the PDF document via a hidden iframe.
 * Falls back to opening the blob URL in a new window if iframe printing fails.
 */
function print(){
  const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  const f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0';f.src=url;
  f.onload=()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch{window.open(url)}setTimeout(()=>{f.remove();URL.revokeObjectURL(url)},60000)};
  document.body.appendChild(f);
}

// ============================================================================
// SECTION 7: PASSWORD DIALOG & DECRYPTION HANDLING
// ============================================================================

/**
 * Displays the password modal when PDF.js encounters an encrypted document.
 * The password is fed directly to the PDF.js decryption task and is never persisted.
 *
 * @param {Function} update - Callback to supply the entered password string.
 * @param {number} reason - PDF.js PasswordResponses status code.
 * @param {Object} task - PDF.js document loading task.
 */
const dlg=$('pw');let pwS=null,pwCancelled=false;
function askPw(update,reason,task){
  pwS={update,task};
  $('pwmsg').textContent=reason===lib.PasswordResponses.INCORRECT_PASSWORD?'Wrong password. Try again.':'This PDF is locked. Enter its password.';
  $('pwi').value='';if(!dlg.open)modal(dlg);setTimeout(()=>$('pwi').focus(),30);
}
$('pwf').onsubmit=e=>{e.preventDefault();const s=pwS;if(!s)return;pwS=null;const pw=$('pwi').value;$('pwi').value='';dlg.close();s.update(pw)};
$('pwx').onclick=()=>dlg.close();
dlg.addEventListener('close',()=>{if(pwS){const s=pwS;pwS=null;pwCancelled=true;s.task.destroy()}});
// ============================================================================
// SECTION 8: SIDEBAR SUBSYSTEM (THUMBNAILS, OUTLINE, FIND, NOTES, TRANSLATE)
// ============================================================================

/**
 * Controls the visibility of the sidebar and triggers responsive layout refitting.
 * @param {boolean} o - Desired open state.
 * @param {boolean} [save=false] - Whether to persist the preference in localStorage.
 */
const work=$('work'),side=$('side'),thumbs=$('thumbs'),outl=$('outline'),TW=150;
let tio=null,thumbsFor=null,curTh=null,thumbsReady=false;
const hasSb=()=>work.classList.contains('sb');
function setSidebar(o,save){
  work.classList.toggle('sb',o);if(save&&pdf)requestAnimationFrame(refit);$('sb').classList.toggle('on',o);$('sb').setAttribute('aria-pressed',o);
  if(save)try{localStorage.setItem('folix.side',o?'1':'0')}catch(e){}
  if(o){buildThumbs();markCur()}
}
/**
 * Activates a specific sidebar tab ('pages', 'outline', 'search', 'notes', 'trans').
 * @param {string} t - Tab key.
 */
function setTab(t){side.dataset.tab=t;[['tabp','pages'],['tabo','outline'],['tabq','search'],['tabn','notes'],['tabt','trans']].forEach(([i,n])=>$(i).classList.toggle('on',t===n));if(t==='notes')renderNotes()}
$('sb').onclick=()=>setSidebar(!hasSb(),true);
$('tabp').onclick=()=>setTab('pages');$('tabo').onclick=()=>setTab('outline');$('tabq').onclick=()=>setTab('search');$('tabn').onclick=()=>setTab('notes');$('tabt').onclick=()=>setTab('trans');
function resetSide(){fp=null;TX.clear();sReset();ttsStop();trReset();if(tio)tio.disconnect();thumbs.textContent='';outl.textContent='';thumbsFor=null;thumbsReady=false;curTh=null}
/**
 * Initializes the thumbnail grid in the Pages tab.
 * Creates placeholder buttons observed by an IntersectionObserver for lazy thumbnail rendering.
 */
function buildThumbs(){
  if(!pdf||thumbsFor===pdf)return;thumbsFor=pdf;thumbs.textContent='';
  tio=new IntersectionObserver(es=>es.forEach(e=>{e.target._vis=e.isIntersecting;e.isIntersecting?thRender(e.target):thDrop(e.target)}),{root:thumbs,rootMargin:'300px 0px'});
  const hgt=Math.round(base.height/base.width*TW);
  for(let i=1;i<=pdf.numPages;i++){
    const b=document.createElement('button');b.className='th';b.dataset.n=i;b.setAttribute('aria-label','Page '+i);
    b.innerHTML='<div class="box"></div><span>'+i+'</span>';
    b.firstChild.style.width=TW+'px';b.firstChild.style.height=hgt+'px';
    b.onclick=()=>{go(i);if(innerWidth<=720)setSidebar(false,false)};
    thumbs.appendChild(b);tio.observe(b);
  }
  thumbsReady=true;
}
const thq=[];let thBusy=false;
function thRender(el){if(!pdf||el._d||el._b||el._q)return;el._q=true;thq.push(el);thPump()}
function thPump(){
  if(thBusy)return;const el=thq.shift();if(!el)return;el._q=false;
  if(el._d||!pdf||!el._vis)return thPump();
  thBusy=true;el._b=true;el._x=false;const my=pdf;
  my.getPage(+el.dataset.n).then(async pg=>{
    if(my!==pdf)return;
    const vp=pg.getViewport({scale:TW/pg.getViewport({scale:1}).width}),dpr=Math.min(devicePixelRatio||1,2);
    const cv=document.createElement('canvas');cv.width=vp.width*dpr|0;cv.height=vp.height*dpr|0;
    cv.style.width=vp.width+'px';cv.style.height=vp.height+'px';
    await pg.render({canvasContext:cv.getContext('2d'),viewport:vp,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null}).promise;
    el.firstChild.textContent='';el.firstChild.appendChild(cv);el._d=true;
  }).catch(()=>{}).finally(()=>{el._b=false;thBusy=false;if(el._x)thDrop(el);setTimeout(thPump,rActive?150:40)});
}
function thDrop(el){if(el._b){el._x=true;return}el._d=false;el.firstChild.textContent=''}
/**
 * Synchronizes the visual active state of thumbnails with the current page `cur`.
 * Scrolls the thumbnail panel to keep the current page thumbnail in view.
 */
function markCur(){
  if(!thumbsReady)return;const el=thumbs.children[cur-1];if(!el||el===curTh)return;
  if(curTh)curTh.classList.remove('cur');curTh=el;el.classList.add('cur');
  if(hasSb()&&side.dataset.tab==='pages'){const t=el.offsetTop,b=t+el.offsetHeight,v=thumbs.scrollTop,h=thumbs.clientHeight;if(t<v+8)thumbs.scrollTop=t-12;else if(b>v+h-8)thumbs.scrollTop=b-h+12}
}
/**
 * Recursively builds the hierarchical table of contents tree from PDF outline items.
 *
 * @param {Array<Object>} items - Array of PDF outline entries.
 * @param {HTMLUListElement} ul - Target unordered list container.
 */
function buildOutline(items,ul){
  items.forEach(it=>{
    const li=document.createElement('li'),row=document.createElement('div');row.className='orow';
    const has=it.items&&it.items.length;let kids=null;
    if(has){const t=document.createElement('button');t.className='tg';t.textContent='+';t.setAttribute('aria-expanded','false');t.setAttribute('aria-label','Expand section');
      t.onclick=()=>{const o=!kids.classList.toggle('hide');t.textContent=o?'–':'+';t.setAttribute('aria-expanded',o)};row.appendChild(t)}
    const b=document.createElement('button');b.className='ol';b.textContent=it.title||'(untitled)';b.onclick=()=>jump(it);row.appendChild(b);li.appendChild(row);
    if(has){kids=document.createElement('ul');kids.className='hide';buildOutline(it.items,kids);li.appendChild(kids)}
    ul.appendChild(li);
  });
}
/**
 * Navigates to the destination referenced by an outline item or external link.
 * @param {Object} it - Outline node descriptor.
 */
async function jump(it){
  try{
    if(!it.dest&&it.url&&/^https?:/i.test(it.url)){window.open(it.url,'_blank','noopener');return}
    let d=it.dest;if(typeof d==='string')d=await pdf.getDestination(d);
    if(!Array.isArray(d))return;
    const i=typeof d[0]==='object'?await pdf.getPageIndex(d[0]):d[0];
    go(i+1);if(innerWidth<=720)setSidebar(false,false);
  }catch(e){msg('Could not jump to that section')}
}
function initSide(){
  setTab('pages');const my=pdf;
  my.getOutline().then(o=>{
    if(my!==pdf)return;
    if(o&&o.length){outl.textContent='';const ul=document.createElement('ul');buildOutline(o,ul);outl.appendChild(ul)}
    else outl.innerHTML='<p class="none">NO OUTLINE IN THIS PDF</p>';
  }).catch(()=>{});
  let sv=null;try{sv=localStorage.getItem('folix.side')}catch(e){}
  setSidebar(sv==='1'&&innerWidth>720,false);
}
// ============================================================================
// SECTION 9: VECTOR ANNOTATIONS ENGINE (INK, HIGHLIGHT, TEXT, NOTE, SIGNATURE)
// ============================================================================

/**
 * Helper to construct an SVG element with given namespace and attributes.
 * @param {string} n - SVG element tag name.
 * @param {Record<string, string|number>} a - Attribute dictionary.
 * @returns {SVGElement}
 */
const NS=(n,a)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',n);for(const k in a)e.setAttribute(k,a[k]);return e};
let ann={},fp=null,tool=null,col='#ff3b30',wid=4,picked=false,toasted=false;
const hist=[],redoS=[],defC={pen:'#ff3b30',mk:'#ffd60a',hl:'#ffd60a',note:'#ffd60a',tx:'#0a0a0a'};
function modal(d){d.showModal()}
const MAT=['',' ','',' '];
/**
 * Coordinate Transformations:
 * Maps coordinates between unrotated PDF space and screen/viewport space based on rotation angle (0, 90, 180, 270 deg).
 * - `fwd`: Transforms unrotated coordinates [x, y] to rotated screen coordinates [u, v].
 * - `inv`: Transforms rotated screen coordinates [u, v] back to unrotated PDF coordinates [x, y].
 * - `rotM`: Computes SVG matrix transform string for the page container.
 */
const fwd=(d,x,y)=>rot===90?[d._H-y,x]:rot===180?[d._W-x,d._H-y]:rot===270?[y,d._W-x]:[x,y];
const inv=(d,u,v)=>rot===90?[v,d._H-u]:rot===180?[d._W-u,d._H-v]:rot===270?[d._W-v,u]:[u,v];
const rotM=d=>rot===90?'matrix(0 1 -1 0 '+d._H+' 0)':rot===180?'matrix(-1 0 0 -1 '+d._W+' '+d._H+')':rot===270?'matrix(0 -1 1 0 0 '+d._W+')':'';
const f1=q=>q[0].toFixed(1)+' '+q[1].toFixed(1);
/**
 * Converts an array of coordinate points into a smoothed SVG path string
 * using quadratic Bezier curves with midpoint averaging.
 *
 * @param {Array<[number, number]>} p - Array of [x, y] coordinate pairs.
 * @returns {string} SVG path 'd' attribute string.
 */
function pathD(p){
  if(p.length<3)return 'M'+p.map(f1).join('L');
  let s='M'+f1(p[0]);
  for(let i=1;i<p.length-1;i++)s+='Q'+f1(p[i])+' '+f1([(p[i][0]+p[i+1][0])/2,(p[i][1]+p[i+1][1])/2]);
  return s+'L'+f1(p[p.length-1]);
}
/**
 * Attaches the SVG annotation canvas overlay to a page container.
 * Binds pointerdown listeners for drawing and erasing annotations.
 *
 * @param {HTMLElement} d - Page container element.
 * @param {Object} vp - Page viewport specification.
 */
function annAttach(d,vp){
  d.querySelectorAll('.ann,.nl').forEach(e=>e.remove());
  d._s=vp.scale;const w=rot%180?d._H:d._W,h=rot%180?d._W:d._H;
  const svg=NS('svg',{class:'ann',viewBox:'0 0 '+w+' '+h,width:vp.width,height:vp.height});
  const g=NS('g',{transform:rotM(d)});svg.appendChild(g);d.appendChild(svg);d._svg=svg;d._g=g;
  const nl=document.createElement('div');nl.className='nl';d.appendChild(nl);d._nl=nl;
  svg.addEventListener('pointerdown',e=>{
    const pi=+d.dataset.n-1;
    if(tool==='er'){const t=e.target.closest&&e.target.closest('[data-i]');if(t){e.preventDefault();delAnn(pi,(ann[pi]||[])[+t.dataset.i])}return}
    drawStart(e,d);
  });
  annDraw(d);
}
/**
 * Renders all stored annotations for a page into its SVG and DOM overlay layers.
 * Supports ink strokes, transparent text highlights, text boxes, signatures, and sticky notes.
 *
 * @param {HTMLElement} d - Page container element.
 */
function annDraw(d){
  if(!d._g)return;const g=d._g,pi=+d.dataset.n-1,list=ann[pi]||[];g.textContent='';d._nl.textContent='';
  list.forEach((a,i)=>{
    if(a.t==='hl'){
      const q=NS('g',{class:'hl','data-i':i});
      a.r.forEach(r=>q.appendChild(NS('rect',{x:r[0],y:r[1],width:r[2],height:r[3],fill:a.c,'fill-opacity':.4,style:'mix-blend-mode:multiply'})));
      g.appendChild(q);
    }else if(a.t==='ink'){
      const dd=pathD(a.p);
      g.appendChild(NS('path',{d:dd,fill:'none',stroke:a.c,'stroke-width':a.w,'stroke-opacity':a.a,'stroke-linecap':'round','stroke-linejoin':'round'}));
      g.appendChild(NS('path',{class:'hit','data-i':i,d:dd,fill:'none',stroke:'transparent','stroke-width':Math.max(a.w,14),'stroke-linecap':'round','stroke-linejoin':'round'}));
    }else if(a.t==='text'){
      const p=fwd(d,a.x,a.y),el=document.createElement('div');el.className='tx';el.textContent=a.s;
      el.style.cssText='left:'+p[0]*d._s+'px;top:'+p[1]*d._s+'px;font-size:'+a.z*d._s+'px;color:'+a.c;
      el.addEventListener('pointerdown',e=>{if(tool==='er'){e.preventDefault();delAnn(pi,a)}});
      el.addEventListener('click',()=>{if(tool==='tx')editText(el,pi,a)});
      d._nl.appendChild(el);
    }else if(a.t==='sig'){
      const p=fwd(d,a.x,a.y),s=d._s,im=document.createElement('img');im.className='sg';im.src=a.img;im.alt='Signature';im.draggable=false;
      im.style.cssText='left:'+p[0]*s+'px;top:'+p[1]*s+'px;width:'+a.w*s+'px;height:'+a.h*s+'px';
      im.addEventListener('pointerdown',e=>{if(tool==='er'){e.preventDefault();delAnn(pi,a);return}sgDrag(e,im,d,pi,a)});
      d._nl.appendChild(im);
    }else if(a.t==='note'){
      const p=fwd(d,a.x,a.y),b=document.createElement('button');b.className='nt';
      b.style.left=p[0]*d._s+'px';b.style.top=p[1]*d._s+'px';b.style.background=a.c;b.setAttribute('aria-label','Note');
      b.innerHTML='<img class="ic" src="'+icoSrc('note')+'" alt="">';
      const tx=document.createElement('span');tx.className='ntx';tx.textContent=a.s;b.appendChild(tx);
      b.onclick=e=>{e.stopPropagation();if(tool==='er')delAnn(pi,a);else b.classList.toggle('open')};
      d._nl.appendChild(b);
    }
  });
}
/**
 * Initiates freehand ink drawing or annotation creation on pointerdown.
 * Uses PointerCapture to follow stroke movement across element boundaries.
 *
 * @param {PointerEvent} e - Incoming pointerdown event.
 * @param {HTMLElement} d - Target page container element.
 */
function drawStart(e,d){
  if(!['pen','mk','note','tx','sig'].includes(tool))return;
  if((tool==='tx'||tool==='sig')&&rot!==0){e.preventDefault();return msg('Rotate the page back to 0° first')}
  e.preventDefault();const svg=d._svg;
  const pt=ev=>{const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;return inv(d,(ev.clientX-r.left)*vb.width/r.width,(ev.clientY-r.top)*vb.height/r.height)};
  const pi=+d.dataset.n-1;
  if(tool==='tx'){e.preventDefault();const p=pt(e);setTimeout(()=>startText(d,pi,p),0);return}
  if(tool==='sig'){e.preventDefault();if(!sigImg)return;const p=pt(e),w=({2:110,4:160,8:240})[wid]||160,h=w*sigImg.h/sigImg.w;addAnn(pi,{t:'sig',x:p[0]-w/2,y:p[1]-h/2,w,h,img:sigImg.url});setTool('sig');return}
  if(tool==='note'){const p=pt(e);setTimeout(()=>openNote(pi,p),0);return}
  const w=tool==='mk'?wid*3.5:wid,al=tool==='mk'?.35:1,c=col,pts=[pt(e)];
  const path=NS('path',{fill:'none',stroke:c,'stroke-width':w,'stroke-opacity':al,'stroke-linecap':'round','stroke-linejoin':'round'});
  d._g.appendChild(path);path.setAttribute('d',pathD(pts.length<2?[pts[0],[pts[0][0]+.01,pts[0][1]]]:pts));
  svg.setPointerCapture(e.pointerId);
  const mv=ev=>{const p=pt(ev),l=pts[pts.length-1];if(Math.hypot(p[0]-l[0],p[1]-l[1])>.6){pts.push(p);path.setAttribute('d',pathD(pts))}};
  const up=()=>{svg.removeEventListener('pointermove',mv);svg.removeEventListener('pointerup',up);svg.removeEventListener('pointercancel',up);path.remove();
    if(pts.length===1)pts.push([pts[0][0]+.01,pts[0][1]]);addAnn(pi,{t:'ink',c,w,a:al,p:pts})};
  svg.addEventListener('pointermove',mv);svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
}
let noteAt=null;
function openNote(pi,p){noteAt={pi,p};$('nti').value='';modal($('ntd'));setTimeout(()=>$('nti').focus(),30)}
$('ntf').onsubmit=e=>{e.preventDefault();const s=$('nti').value.trim();$('ntd').close();if(s&&noteAt)addAnn(noteAt.pi,{t:'note',c:col,x:noteAt.p[0],y:noteAt.p[1],s});noteAt=null};
$('ntc').onclick=()=>$('ntd').close();
function addAnn(pi,a){(ann[pi]=ann[pi]||[]).push(a);hist.push({k:'add',pi,a});redoS.length=0;changed(pi)}
function delAnn(pi,a){const l=ann[pi]||[],i=l.indexOf(a);if(i<0)return;l.splice(i,1);hist.push({k:'del',pi,a,i});redoS.length=0;changed(pi)}
/**
 * Reverts the most recent annotation transaction from the undo history stack.
 */
function undo(){const o=hist.pop();if(!o)return;const l=ann[o.pi]=ann[o.pi]||[];if(o.k==='mod')Object.assign(o.a,o.old);else if(o.k==='add')l.splice(l.indexOf(o.a),1);else l.splice(o.i,0,o.a);redoS.push(o);changed(o.pi)}
/**
 * Re-applies the most recently reverted annotation transaction.
 */
function redo(){const o=redoS.pop();if(!o)return;const l=ann[o.pi]=ann[o.pi]||[];if(o.k==='mod')Object.assign(o.a,o.nw);else if(o.k==='add')l.push(o.a);else l.splice(l.indexOf(o.a),1);hist.push(o);changed(o.pi)}
function modAnn(pi,a,patch){const old={};for(const k in patch)old[k]=a[k];Object.assign(a,patch);hist.push({k:'mod',pi,a,old,nw:patch});redoS.length=0;changed(pi)}
let sv;
/**
 * Commits an annotation modification. Updates visual overlays, refreshes Notes sidebar tab,
 * toggles Undo/Redo button availability, and debounces persistence to localStorage.
 *
 * @param {number} pi - 0-based page index.
 */
function changed(pi){
  const d=pagesEl.children[pi];if(d&&d._done)annDraw(d);renderNotes();
  $('undo').disabled=!hist.length;$('redo').disabled=!redoS.length;
  if(!toasted){toasted=true;msg('Annotations are saved in this browser')}
  clearTimeout(sv);sv=setTimeout(()=>{if(!fp)return;try{Object.values(ann).some(l=>l&&l.length)?localStorage.setItem('folix.ann.'+fp,JSON.stringify(ann)):localStorage.removeItem('folix.ann.'+fp)}catch(e){msg('Could not save: browser storage is full')}},300);
}
function initAnn(){
  fp=(pdf.fingerprints&&pdf.fingerprints[0])||null;ann={};hist.length=0;redoS.length=0;
  if(fp)try{ann=JSON.parse(localStorage.getItem('folix.ann.'+fp)||'{}')}catch(e){ann={}}
  $('undo').disabled=true;$('redo').disabled=true;renderNotes();
}
function syncUI(){
  document.querySelectorAll('.abar [data-tool]').forEach(b=>{const o=b.dataset.tool===tool;b.classList.toggle('on',o);b.setAttribute('aria-pressed',o)});
  document.querySelectorAll('.sw').forEach(b=>b.classList.toggle('on',b.dataset.c===col));
  document.querySelectorAll('#wds button').forEach(b=>b.classList.toggle('on',+b.dataset.w===wid));
}
/**
 * Selects the active annotation tool ('pen', 'mk', 'hl', 'tx', 'note', 'sig', 'er').
 * Toggles tool if already active, syncs toolbar button state, and handles mobile scrolling hints.
 *
 * @param {string} t - Tool identifier.
 */
function setTool(t){
  tool=tool===t?null:t;main.dataset.tl=tool||'';
  if(tool&&!picked&&defC[tool])col=defC[tool];
  syncUI();
  if(tool==='sig'){openSig();return}
  if(tool&&matchMedia('(pointer:coarse)').matches&&tool!=='hl')msg('Tap the tool again to scroll');
}
document.querySelectorAll('.abar [data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
document.querySelectorAll('.sw').forEach(b=>b.onclick=()=>{col=b.dataset.c;picked=true;syncUI()});
document.querySelectorAll('#wds button').forEach(b=>b.onclick=()=>{wid=+b.dataset.w;syncUI()});
$('ann').onclick=()=>{const o=$('abar').classList.toggle('hide')===false;$('ann').classList.toggle('on',o);$('ann').setAttribute('aria-pressed',o);if(!o&&tool)setTool(tool);else syncUI()};
$('undo').onclick=undo;$('redo').onclick=redo;
/**
 * Converts active DOM text selection bounding client rects into persistent page-relative highlight annotations.
 */
function applyHl(){
  const sel=getSelection();if(!sel||sel.isCollapsed||!sel.rangeCount)return;
  const rs=[...sel.getRangeAt(0).getClientRects()].filter(r=>r.width>1&&r.height>1),by={},seen=new Set();
  [...pagesEl.children].forEach(d=>{
    if(!d._done||!d._svg)return;const pr=d.getBoundingClientRect(),s=d._s;
    rs.forEach(r=>{
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      if(cx<pr.left||cx>pr.right||cy<pr.top||cy>pr.bottom||r.height>pr.height*.15)return;
      const k=d.dataset.n+':'+Math.round(r.left/2)+':'+Math.round(r.top/2)+':'+Math.round(r.width/2);if(seen.has(k))return;seen.add(k);
      const a=inv(d,(r.left-pr.left)/s,(r.top-pr.top)/s),b=inv(d,(r.right-pr.left)/s,(r.bottom-pr.top)/s);
      (by[d.dataset.n-1]=by[d.dataset.n-1]||[]).push([Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1])]);
    });
  });
  const ks=Object.keys(by);if(!ks.length)return;
  const stxt=sel.toString().replace(/\s+/g,' ').trim().slice(0,90);ks.forEach(k=>addAnn(+k,{t:'hl',c:col,r:by[k],txt:stxt}));sel.removeAllRanges();
}
let lastPT='mouse',hlT;
main.addEventListener('pointerdown',e=>{lastPT=e.pointerType},{passive:true});
main.addEventListener('pointerup',e=>{if(tool==='hl'&&e.pointerType!=='touch')setTimeout(applyHl,30)});
document.addEventListener('selectionchange',()=>{if(tool==='hl'&&lastPT==='touch'){clearTimeout(hlT);hlT=setTimeout(applyHl,700)}});
document.addEventListener('keydown',e=>{
  if(!pdf)return;
  if(e.key==='Escape'&&tool&&!document.querySelector('dialog[open]'))return setTool(tool);
  if((e.ctrlKey||e.metaKey)&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){
    const k=e.key.toLowerCase();
    if(k==='z'&&!e.shiftKey){e.preventDefault();undo()}else if(k==='y'||(k==='z'&&e.shiftKey)){e.preventDefault();redo()}
  }
});
// ============================================================================
// SECTION 10: PDF FLATTENING & MODIFICATION VIA PDF-LIB
// ============================================================================

/**
 * Converts a hex color string ('#rrggbb') into a normalized RGB triplet array ([r, g, b]).
 * @param {string} h - Hex color string.
 * @returns {[number, number, number]} Normalized RGB float values (0 to 1).
 */
const hexRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
function wrapText(t,font,sz,mw){const out=[];t.split('\n').forEach(par=>{let line='';par.split(' ').forEach(w=>{const tt=line?line+' '+w:w;if(font.widthOfTextAtSize(tt,sz)>mw&&line){out.push(line);line=w}else line=tt});out.push(line)});return out}
const hasAnn=()=>Object.values(ann).some(l=>l&&l.length);
/**
 * Dynamically loads the pdf-lib library bundle on demand.
 * Keeps initial application bundle lightweight until document export or modification is requested.
 * @returns {Promise<void>}
 */
async function ensurePdfLib(){if(!window.PDFLib)await new Promise((ok,no)=>{const s=document.createElement('script');s.src=C.pdfLibSrc;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
const formDirty=()=>!!(pdf&&pdf.annotationStorage&&pdf.annotationStorage.size>0);
async function formBytes(){if(formDirty()){try{return await pdf.saveDocument()}catch(e){console.error(e)}}return bytes}
async function outputBytes(){
  let data=await formBytes(),edited=data!==bytes;
  if(hasAnn()){const out=await buildAnnotated(data);if(!out)return null;data=out;edited=true}
  return {data,edited};
}
/**
 * Uses pdf-lib to bake all annotations (ink paths, highlights, text, signatures, and sticky notes)
 * directly into the PDF document's native content stream.
 * Converts viewport coordinates into native PDF point coordinates via `convertToPdfPoint`.
 *
 * @param {Uint8Array} base - Base PDF binary bytes.
 * @returns {Promise<Uint8Array|null>} Flattened PDF binary bytes or null on failure.
 */
async function buildAnnotated(base){
  try{
    await ensurePdfLib();
    const {PDFDocument,rgb,StandardFonts,LineCapStyle}=window.PDFLib;
    let doc;try{doc=await PDFDocument.load(base||bytes)}catch(e){msg('Locked PDFs cannot include annotations');return null}
    const font=await doc.embedFont(StandardFonts.Helvetica),pgs=doc.getPages();
    for(const k of Object.keys(ann)){
      const list=ann[k];if(!list||!list.length||!pgs[+k])continue;
      const pj=await pdf.getPage(+k+1),vp=pj.getViewport({scale:1}),P=(x,y)=>vp.convertToPdfPoint(x,y),pg=pgs[+k];
      for(const a of list){
        const c=rgb(...hexRgb(a.c||'#000000'));
        if(a.t==='ink'){const q=a.p.map(t=>P(t[0],t[1]));pg.drawSvgPath('M'+q.map(t=>t[0].toFixed(2)+' '+(-t[1]).toFixed(2)).join('L'),{x:0,y:0,borderColor:c,borderWidth:a.w,borderOpacity:a.a,borderLineCap:LineCapStyle.Round})}
        else if(a.t==='hl'){a.r.forEach(r=>{const p1=P(r[0],r[1]),p2=P(r[0]+r[2],r[1]+r[3]);pg.drawRectangle({x:Math.min(p1[0],p2[0]),y:Math.min(p1[1],p2[1]),width:Math.abs(p1[0]-p2[0]),height:Math.abs(p1[1]-p2[1]),color:c,opacity:.4,borderWidth:0})})}
        else if(a.t==='text'){const p=P(a.x,a.y),sz=a.z;a.s.replace(/[^\x20-\x7E\n]/g,'?').split('\n').forEach((ln,i)=>pg.drawText(ln,{x:p[0],y:p[1]-sz*.85-i*sz*1.2,size:sz,font,color:c}))}
        else if(a.t==='sig'){const im=await doc.embedPng(a.img),p1=P(a.x,a.y),p2=P(a.x+a.w,a.y+a.h);pg.drawImage(im,{x:Math.min(p1[0],p2[0]),y:Math.min(p1[1],p2[1]),width:Math.abs(p1[0]-p2[0]),height:Math.abs(p1[1]-p2[1])})}
        else if(a.t==='note'){
          const p=P(a.x,a.y),lines=wrapText(a.s.replace(/[^\x20-\x7E\n]/g,'?'),font,9,150),bh=lines.length*11+8;
          pg.drawRectangle({x:p[0],y:p[1]-14,width:14,height:14,color:c,borderColor:rgb(.04,.04,.04),borderWidth:1.5});
          pg.drawRectangle({x:p[0]+18,y:p[1]-bh+2,width:166,height:bh,color:rgb(1,1,1),borderColor:rgb(.04,.04,.04),borderWidth:1.5});
          lines.forEach((ln,i)=>pg.drawText(ln,{x:p[0]+24,y:p[1]-9-i*11,size:9,font,color:rgb(.04,.04,.04)}));
        }
      }
    }
    return await doc.save();
  }catch(e){console.error(e);msg('Could not build the annotated PDF');return null}
}
function downloadBytes(data,fname){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/pdf'}));a.download=fname;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
const baseName=()=>name.replace(/\.pdf$/i,'');
$('asave').onclick=async()=>{
  if(!pdf)return;
  if(!hasAnn()&&!formDirty())return msg('Nothing to save yet. Add an annotation or fill a form field first');
  msg('Preparing PDF…');const o=await outputBytes();
  if(o){downloadBytes(o.data,baseName()+'-edited.pdf');msg('Saved a copy with your changes')}
};
// share the PDF through the system share sheet (with your annotations and form entries if any)
$('share').onclick=async()=>{
  if(!pdf)return;
  let data=bytes,fname=baseName()+'.pdf';
  if(hasAnn()||formDirty()){msg('Preparing PDF with your changes…');const o=await outputBytes();if(o&&o.edited){data=o.data;fname=baseName()+'-edited.pdf'}}
  const file=new File([data],fname,{type:'application/pdf'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:fname})}catch(e){if(e&&e.name!=='AbortError')msg('Could not share this file')}
  }else{downloadBytes(data,fname);msg('Sharing is not available in this browser, so the PDF was downloaded')}
};
// ============================================================================
// SECTION 11: READING SESSION PERSISTENCE (LAST PAGE & ZOOM)
// ============================================================================

/**
 * Saves and restores the last viewed page and zoom settings per document fingerprint.
 */
let lastT;
let keepZoom=true;try{keepZoom=localStorage.getItem('folix.keepzoom')!=='0'}catch(e){}
const kzLabel=()=>{$('kz').textContent='Reopen at last zoom: '+(keepZoom?'ON':'OFF')};
$('kz').onclick=()=>{keepZoom=!keepZoom;try{localStorage.setItem('folix.keepzoom',keepZoom?'1':'0')}catch(e){}kzLabel()};kzLabel();
function saveLast(){if(!fp)return;clearTimeout(lastT);lastT=setTimeout(()=>{try{localStorage.setItem('folix.last.'+fp,JSON.stringify({p:cur,m:fitMode,s:+scale.toFixed(3)}))}catch(e){}},400)}
function restoreLast(){
  if(!fp)return;let o=null;
  try{const v=localStorage.getItem('folix.last.'+fp);o=v?(v[0]==='{'?JSON.parse(v):{p:+v}):null}catch(e){}
  if(!o)return;
  if(keepZoom){if(o.m==='h')fitHeight();else if(o.m==='c')fitContent();else if(o.m===null&&o.s)setScale(o.s)}
  if(o.p>1&&o.p<=pdf.numPages){go(o.p);msg('Resumed on page '+o.p)}
}
// ============================================================================
// SECTION 12: MOBILE TOUCH & DOUBLE-TAP ZOOM
// ============================================================================

/**
 * Handles double-tap gestures on mobile devices to toggle between fit-width and 2.5x zoom.
 */
let tapT=0,tapX=0,tapY=0,tmoved=false;
main.addEventListener('touchstart',()=>{tmoved=false},{passive:true});
main.addEventListener('touchmove',()=>{tmoved=true},{passive:true});
main.addEventListener('touchend',e=>{
  if(!pdf||tool||tmoved||e.touches.length||e.changedTouches.length!==1)return;
  const t=e.changedTouches[0],now=Date.now();
  if(now-tapT<320&&Math.hypot(t.clientX-tapX,t.clientY-tapY)<40){tapT=0;e.preventDefault();dtZoom(t.clientX,t.clientY)}
  else{tapT=now;tapX=t.clientX;tapY=t.clientY}
},{passive:false});
function dtZoom(cx,cy){
  const r=main.getBoundingClientRect(),x=cx-r.left,y=cy-r.top,a=anchorAt(x,y);
  const fw=(main.clientWidth-24-(two?24:0))/(pp()*bw());
  setScale(scale<fw*1.4?Math.min(fw*2.5,C.maxScale):fw);scrollToAnchor(a,x,y);
}
// ============================================================================
// SECTION 13: TEXT BOXES & DIGITAL SIGNATURES
// ============================================================================

/**
 * Trims transparent pixels around drawn signature canvas to produce tight image bounds.
 * @param {HTMLCanvasElement} src - Canvas containing user drawing.
 * @returns {{url: string, w: number, h: number}|null} Trimmed PNG data URL and dimensions.
 */
const txSize=()=>wid===2?12:wid===4?16:24;
function startText(d,pi,p){
  const q=fwd(d,p[0],p[1]),z=txSize(),el=document.createElement('div'),c=col;
  el.className='tx edit';el.contentEditable='true';el.spellcheck=false;
  el.style.cssText='left:'+q[0]*d._s+'px;top:'+q[1]*d._s+'px;font-size:'+z*d._s+'px;color:'+c;
  d._nl.appendChild(el);el.focus();let done=false;
  el.addEventListener('blur',()=>{if(done)return;done=true;const s=el.innerText.replace(/\s+$/,'');el.remove();if(s)addAnn(pi,{t:'text',c,x:p[0],y:p[1],s,z})});
  el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();el.blur()}e.stopPropagation()});
}
function editText(el,pi,a){
  if(el.isContentEditable)return;el.contentEditable='true';el.classList.add('edit');el.focus();{const rg=document.createRange();rg.selectNodeContents(el);rg.collapse(false);const sl=getSelection();sl.removeAllRanges();sl.addRange(rg)}
  el.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();el.blur()}e.stopPropagation()};
  el.onblur=()=>{const s=el.innerText.replace(/\s+$/,'');if(!s)delAnn(pi,a);else if(s!==a.s)modAnn(pi,a,{s});else{el.contentEditable='false';el.classList.remove('edit')}};
}
function sgDrag(e,im,d,pi,a){
  e.preventDefault();im.setPointerCapture(e.pointerId);
  const sx=e.clientX,sy=e.clientY,l0=parseFloat(im.style.left),t0=parseFloat(im.style.top);
  const mv=ev=>{im.style.left=l0+ev.clientX-sx+'px';im.style.top=t0+ev.clientY-sy+'px'};
  const up=ev=>{
    im.removeEventListener('pointermove',mv);im.removeEventListener('pointerup',up);im.removeEventListener('pointercancel',up);
    const dx=(ev.clientX-sx)/d._s,dy=(ev.clientY-sy)/d._s;if(Math.abs(dx)+Math.abs(dy)<.5)return;
    const f=fwd(d,a.x,a.y),p=inv(d,f[0]+dx,f[1]+dy);modAnn(pi,a,{x:p[0],y:p[1]});
  };
  im.addEventListener('pointermove',mv);im.addEventListener('pointerup',up);im.addEventListener('pointercancel',up);
}
let sigImg=null,savedSig=null,sgMode='draw',sgDown=false,sgInk=false;
const sgd=$('sgd'),sgc=$('sgc'),sgx=sgc.getContext('2d');
sgx.lineWidth=4;sgx.lineCap='round';sgx.lineJoin='round';sgx.strokeStyle='#0a0a0a';
function trimCanvas(src){
  const w=src.width,h=src.height,px=src.getContext('2d').getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(px[(y*w+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0)return null;const pad=8,cw=x1-x0+1,ch=y1-y0+1,o=document.createElement('canvas');o.width=cw+pad*2;o.height=ch+pad*2;
  o.getContext('2d').drawImage(src,x0,y0,cw,ch,pad,pad,cw,ch);return {url:o.toDataURL('image/png'),w:o.width,h:o.height};
}
/**
 * Renders user's typed name in cursive script font ("Dancing Script") onto an offscreen canvas.
 * @returns {Promise<{url: string, w: number, h: number}|null>}
 */
async function typedSig(){
  const t=$('sgi').value.trim();if(!t)return null;
  try{await document.fonts.load('600 90px "Dancing Script"')}catch(e){}
  const c=document.createElement('canvas');c.width=900;c.height=220;const x=c.getContext('2d');
  x.font='600 90px "Dancing Script",cursive';x.fillStyle='#0a0a0a';x.fillText(t,20,150);return trimCanvas(c);
}
function sgTab(m){sgMode=m;$('sgtd').classList.toggle('on',m==='draw');$('sgtt').classList.toggle('on',m==='type');$('sgdraw').classList.toggle('hide',m!=='draw');$('sgtype').classList.toggle('hide',m!=='type');$('sgerr').textContent=''}
function openSig(){
  savedSig=null;try{savedSig=JSON.parse(sessionStorage.getItem('folix.sig')||'null')}catch(e){}
  $('sgsaved').classList.toggle('hide',!savedSig);if(savedSig)$('sgimg').src=savedSig.url;
  sgx.clearRect(0,0,sgc.width,sgc.height);sgInk=false;$('sgi').value='';$('sgprev').textContent='';sgTab('draw');modal(sgd);
}
const sgPt=e=>{const r=sgc.getBoundingClientRect();return [(e.clientX-r.left)*sgc.width/r.width,(e.clientY-r.top)*sgc.height/r.height]};
sgc.addEventListener('pointerdown',e=>{e.preventDefault();sgc.setPointerCapture(e.pointerId);sgDown=true;sgInk=true;const p=sgPt(e);sgx.beginPath();sgx.moveTo(p[0],p[1]);sgx.lineTo(p[0]+.1,p[1]);sgx.stroke()});
sgc.addEventListener('pointermove',e=>{if(!sgDown)return;const p=sgPt(e);sgx.lineTo(p[0],p[1]);sgx.stroke();sgx.beginPath();sgx.moveTo(p[0],p[1])});
['pointerup','pointercancel'].forEach(t=>sgc.addEventListener(t,()=>{sgDown=false}));
$('sgclr').onclick=()=>{sgx.clearRect(0,0,sgc.width,sgc.height);sgInk=false};
$('sgtd').onclick=()=>sgTab('draw');$('sgtt').onclick=()=>{sgTab('type');$('sgi').focus()};
$('sgi').oninput=async()=>{const r=await typedSig();$('sgprev').innerHTML='';if(r){const im=new Image();im.src=r.url;$('sgprev').appendChild(im)}};
$('sguse').onclick=()=>{if(savedSig){sigImg=savedSig;sgd.close();msg('Click the page where the signature goes')}};
$('sgx').onclick=()=>sgd.close();
$('sgf').onsubmit=async e=>{
  e.preventDefault();const r=sgMode==='draw'?(sgInk?trimCanvas(sgc):null):await typedSig();
  if(!r){$('sgerr').textContent=sgMode==='draw'?'Draw your signature first.':'Type your name first.';return}
  sigImg=r;try{sessionStorage.setItem('folix.sig',JSON.stringify(r))}catch(x){}sgd.close();msg('Click the page where the signature goes');
};
sgd.addEventListener('close',()=>{if(tool==='sig'&&!sigImg)setTool('sig')});
// ============================================================================
// SECTION 14: KEYBOARD SHORTCUTS DISPATCHER
// ============================================================================

/**
 * Global keyboard shortcuts handler.
 * Dispatches single-key commands when focus is outside form inputs and dialogs.
 */
const hk=$('hk');
[$('hkb'),$('hkb2')].forEach(b=>b&&(b.onclick=()=>{closePops();hk.showModal()}));$('hkx').onclick=()=>hk.close();
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const t=document.activeElement,typing=t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable);
  if(typing||document.querySelector('dialog[open]'))return;
  if(e.key==='?'){e.preventDefault();hk.showModal();return}
  if(!pdf)return;
  const f=({w:()=>fitWidth(),h:fitHeight,r:()=>$('rot').click(),t:nextTheme,'2':()=>$('two').click(),s:()=>$('sb').click(),a:()=>$('ann').click(),g:gotoPage,v:()=>$('tts').click(),c:()=>$('trim').click(),e:()=>$('ptb').click(),x:()=>$('trdocb').click(),o:()=>$('ocrb').click(),l:()=>$('spotb').click(),'[':()=>spOn&&spSize(spR-30),']':()=>spOn&&spSize(spR+30)})[e.key.toLowerCase()];
  if(f){e.preventDefault();f()}
});
// ============================================================================
// SECTION 15: SPOTLIGHT NIGHT READING MODE
// ============================================================================

/**
 * Spotlight reading mode: darkens entire viewport, rendering a soft radial illuminated circle
 * following the user's cursor or touch point to minimize eye strain in dark environments.
 */
const spot=$('spot'),sdot=spot.firstElementChild,spctl=$('spctl');
let spOn=false,spR=170,spx=0,spy=0,spRaf=0;
try{spR=Math.min(420,Math.max(80,+localStorage.getItem('folix.spotr')||170))}catch(e){}
function spDraw(){spRaf=0;sdot.style.transform='translate3d('+(spx-spR)+'px,'+(spy-spR)+'px,0)'}
function spSize(n){spR=Math.min(420,Math.max(80,n));spot.style.setProperty('--sr',spR+'px');try{localStorage.setItem('folix.spotr',spR)}catch(e){}spDraw()}
function spMove(cx,cy){const r=spot.getBoundingClientRect();spx=cx-r.left;spy=cy-r.top;if(!spRaf)spRaf=requestAnimationFrame(spDraw)}
function setSpot(o,save){
  spOn=o;main.dataset.spot=o?'1':'';document.body.dataset.spot=o?'1':'';if(th==='light'&&ctxFilter&&pdf&&io)resetPages(false,true);spot.classList.toggle('hide',!o);spctl.classList.toggle('hide',!o);
  $('spotb').classList.toggle('on',o);$('spotb').setAttribute('aria-pressed',o);
  if(save)try{localStorage.setItem('folix.spot',o?'1':'0')}catch(e){}
  if(o){const r=spot.getBoundingClientRect();if(!spx&&!spy){spx=r.width/2;spy=r.height/3}spot.style.setProperty('--sr',spR+'px');spDraw();if(save)msg('Spotlight on. Move your mouse or finger to read')}
}
function initSpot(){let v=false;try{v=localStorage.getItem('folix.spot')==='1'}catch(e){}setSpot(v,false)}
let awT;[$('chrome'),$('side')].forEach(el=>el.addEventListener('pointerdown',()=>{if(!spOn)return;el.classList.add('awake');clearTimeout(awT);awT=setTimeout(()=>el.classList.remove('awake'),3000)}));
$('spotb').onclick=()=>setSpot(!spOn,true);$('spx').onclick=()=>setSpot(false,true);
$('spm').onclick=()=>spSize(spR-30);$('spp').onclick=()=>spSize(spR+30);
addEventListener('pointermove',e=>{if(spOn&&e.pointerType!=='touch')spMove(e.clientX,e.clientY)},{passive:true});
['touchstart','touchmove'].forEach(t=>addEventListener(t,e=>{if(spOn&&e.touches[0])spMove(e.touches[0].clientX,e.touches[0].clientY)},{passive:true}));
// ============================================================================
// SECTION 16: FULL-TEXT INDEXING & SEARCH HIGHLIGHTS
// ============================================================================

/**
 * Extracts and caches normalized text streams and character offset mappings for a page.
 * Applies NFKD normalization and diacritic removal to enable accent-insensitive search.
 *
 * @param {number} n - 1-based page number.
 * @returns {Promise<Object|null>} Normalized text records and offset arrays.
 */
const TX=new Map();
async function pageText(n){
  if(TX.has(n)){const v=TX.get(n);TX.delete(n);TX.set(n,v);return v}
  const my=pdf;if(!my)return null;
  const pg=await my.getPage(n),tc=await pg.getTextContent();
  if(my!==pdf)return null;
  const strs=[],its=[];tc.items.forEach(it=>{if(it.str!==undefined){strs.push(it.str);its.push(it)}});
  let norm='',disp='',last=' ';const io=[],oo=[];
  const emit=(lo,orig,i,k)=>{norm+=lo;disp+=orig;io.push(i);oo.push(k);last=lo};
  for(let i=0;i<strs.length;i++){
    const s=strs[i],it=its[i];
    if(i>0&&last!==' '){
      const p=its[i-1],f=Math.abs(it.transform[3])||it.height||10;
      if(p.hasEOL||Math.abs(it.transform[5]-p.transform[5])>f*.5||it.transform[4]-(p.transform[4]+p.width)>f*.12)emit(' ',' ',i,-1);
    }
    for(let k=0;k<s.length;k++){
      const c=s[k];
      if(/\s/.test(c)){if(last!==' ')emit(' ',' ',i,k)}
      else{const lo=fold(c);if(lo.length===1)emit(lo,c,i,k);else if(lo.length>1)for(const ch of lo)emit(ch,ch,i,k)}
    }
  }
  const v={norm,disp,itemOf:Int32Array.from(io),offOf:Int32Array.from(oo),strs};
  TX.set(n,v);if(TX.size>80)TX.delete(TX.keys().next().value);return v;
}
function rangesFor(tl,v,s,e){
  const out=[],divs=tl._divs||[];let i0=-1,a=0,b=0;
  const flush=()=>{if(i0<0)return;const nd=divs[i0]&&divs[i0].firstChild;if(nd&&nd.nodeType===3){try{const r=document.createRange();r.setStart(nd,Math.min(a,nd.length));r.setEnd(nd,Math.min(b,nd.length));out.push(r)}catch(x){}}i0=-1};
  for(let k=s;k<e&&k<v.norm.length;k++){const i=v.itemOf[k],o=v.offOf[k];if(o<0)continue;if(i!==i0){flush();i0=i;a=o;b=o+1}else b=o+1}
  flush();return out;
}
const tlOf=n=>{const d=pagesEl.children[n-1],tl=d&&d._done&&d.querySelector('.textLayer');return tl&&tl._done?tl:null};
async function waitTl(n,ms){const t0=performance.now();while(performance.now()-t0<(ms||4000)){const tl=tlOf(n);if(tl)return tl;await new Promise(z=>setTimeout(z,60))}return null}
// ---------- search: results list, exact highlights, next / previous ----------
let sQ='',sRaw='',sRes=[],sCur=-1,sRun=0,sBy=new Map(),hlTm=0;
function updCnt(){$('cnt').textContent=sRes.length?(sCur+1)+'/'+sRes.length:'';$('sprev').disabled=$('snext').disabled=!sRes.length}
function sReset(){sQ='';sRes=[];sCur=-1;sRun++;sBy=new Map();updCnt();if(window.CSS&&CSS.highlights){CSS.highlights.delete('fx-hit');CSS.highlights.delete('fx-cur')}$('results').textContent='';$('q').value=''}
/**
 * Performs full-text search across all document pages.
 * Accumulates match records with context snippets into `sRes` and updates the Find results tab.
 */
async function search(){
  const raw=fold($('q').value.trim()).replace(/\s+/g,' '),run=++sRun;
  sQ=raw;sRaw=$('q').value.trim();sRes=[];sCur=-1;sBy=new Map();renderResults();hlSoon();updCnt();
  if(!raw||!pdf)return;
  const my=pdf;$('cnt').textContent='…';
  for(let n=1;n<=my.numPages;n++){
    const v=await pageText(n);if(!v||run!==sRun||my!==pdf)return;
    let k=v.norm.indexOf(raw);
    while(k>-1&&sRes.length<3000){
      const r={p:n,s:k,e:k+raw.length,a:v.disp.slice(Math.max(0,k-32),k),an:v.norm.slice(Math.max(0,k-32),k),m:v.disp.slice(k,k+raw.length),z:v.disp.slice(k+raw.length,k+raw.length+44),zn:v.norm.slice(k+raw.length,k+raw.length+44)};
      sRes.push(r);(sBy.get(n)||sBy.set(n,[]).get(n)).push(r);k=v.norm.indexOf(raw,k+raw.length);
    }
    if(n%6===0){$('cnt').textContent=sRes.length+'…';await new Promise(z=>setTimeout(z,0))}
  }
  if(run!==sRun)return;
  renderResults();
  if(!sRes.length){$('cnt').textContent='0 found';return}
  const i=sRes.findIndex(r=>r.p>=cur);stepTo(i<0?0:i);hlSoon();
}
function renderResults(){
  const box=$('results');box.textContent='';
  const note=t=>{const p=document.createElement('p');p.className='none';p.textContent=t;box.appendChild(p)};
  if(!sQ)return note('TYPE IN THE SEARCH BOX');
  if(!sRes.length)return note('NO MATCHES');
  const hd=document.createElement('p');hd.className='srh';hd.append(document.createTextNode(sRes.length+' match'+(sRes.length>1?'es':'')+' for '));const hs=document.createElement('span');hs.textContent=sRaw;hd.appendChild(hs);box.appendChild(hd);
  const put=(b,disp,norm)=>{let i=0,k=norm.indexOf(sQ);while(k>-1&&sQ){if(k>i)b.append(document.createTextNode(disp.slice(i,k)));const m=document.createElement('mark');m.textContent=disp.slice(k,k+sQ.length);b.appendChild(m);i=k+sQ.length;k=norm.indexOf(sQ,i)}if(i<disp.length)b.append(document.createTextNode(disp.slice(i)))};
  sRes.slice(0,400).forEach((r,i)=>{
    const b=document.createElement('button');b.className='sr'+(i===sCur?' on':'');b.dataset.i=i;
    const pn=document.createElement('b');pn.textContent='p.'+r.p;b.appendChild(pn);
    b.append(document.createTextNode('…'));put(b,r.a,r.an);const m=document.createElement('mark');m.textContent=r.m;b.appendChild(m);put(b,r.z,r.zn);b.append(document.createTextNode('…'));
    b.onclick=()=>stepTo(i);box.appendChild(b);
  });
}
/**
 * Navigates to a specific search match index.
 * Scrolls match into view and applies highlights using CSS Custom Highlight API.
 *
 * @param {number} i - 0-based match index in `sRes`.
 */
async function stepTo(i){
  if(!sRes.length)return;i=(i+sRes.length)%sRes.length;sCur=i;const r=sRes[i];updCnt();
  const rb0=$('results');rb0.querySelectorAll('.sr').forEach(b=>b.classList.toggle('on',+b.dataset.i===i));
  const onb=rb0.querySelector('.sr.on');if(onb&&hasSb()&&side.dataset.tab==='search'){const t=onb.offsetTop,h=rb0.clientHeight;if(t<rb0.scrollTop||t>rb0.scrollTop+h-40)rb0.scrollTop=t-40}
  if(r.p!==cur)go(r.p);
  const tl=await waitTl(r.p);if(!tl||sCur!==i)return;
  const v=await pageText(r.p);if(!v||sCur!==i)return;
  const rs=rangesFor(tl,v,r.s,r.e);if(!rs.length)return;
  if(window.CSS&&CSS.highlights)CSS.highlights.set('fx-cur',new Highlight(...rs));
  const rb=rs[0].getBoundingClientRect(),mb=main.getBoundingClientRect();
  if(rb.top<mb.top+60||rb.bottom>mb.bottom-60||rb.left<mb.left||rb.right>mb.right)main.scrollTo({top:main.scrollTop+rb.top-mb.top-main.clientHeight/3,left:Math.max(0,main.scrollLeft+rb.left-mb.left-main.clientWidth/3)});
}
function hlSoon(){clearTimeout(hlTm);hlTm=setTimeout(hlRefresh,100)}
async function hlRefresh(){
  if(!(window.CSS&&CSS.highlights)){pagesEl.querySelectorAll('.page').forEach(d=>d._done&&mark(d));return}
  const all=[];
  for(const d of pagesEl.children){
    if(!d._done)continue;const n=+d.dataset.n,rs=sBy.get(n);if(!rs||!rs.length)continue;
    const tl=d.querySelector('.textLayer');if(!tl||!tl._done)continue;
    const v=await pageText(n);if(!v)continue;rs.forEach(r=>rangesFor(tl,v,r.s,r.e).forEach(x=>all.push(x)));
  }
  if(all.length)CSS.highlights.set('fx-hit',new Highlight(...all));else CSS.highlights.delete('fx-hit');
}
$('sprev').onclick=()=>stepTo(sCur-1);$('snext').onclick=()=>stepTo(sCur+1);
$('cnt').onclick=()=>{setSidebar(true,true);setTab('search')};
// ============================================================================
// SECTION 17: NOTES SIDEBAR PANEL & JUMP TO ANNOTATION
// ============================================================================

/**
 * Renders the chronological list of all document annotations into the Notes tab.
 */
const annLabel=a=>a.t==='ink'?(a.a<1?'Marker':'Drawing'):a.t==='hl'?'Highlight':a.t==='text'?'Text':a.t==='note'?'Note':'Signature';
const annPreview=a=>a.t==='hl'?(a.txt||''):(a.t==='text'||a.t==='note')?(a.s||''):'';
const annPoint=a=>a.t==='ink'?a.p[0]:a.t==='hl'?[a.r[0][0],a.r[0][1]]:[a.x,a.y];
function renderNotes(){
  const box=$('notes');box.textContent='';
  const pages=Object.keys(ann).filter(k=>ann[k]&&ann[k].length).map(Number).sort((a,b)=>a-b);
  if(!pages.length){const p=document.createElement('p');p.className='none';p.textContent='NO ANNOTATIONS YET';box.appendChild(p);return}
  pages.forEach(pi=>ann[pi].forEach(a=>{
    const row=document.createElement('div');row.className='nl2';
    const j2=document.createElement('button');j2.className='nj';const b=document.createElement('b');b.textContent='p.'+(pi+1)+' '+annLabel(a);j2.appendChild(b);j2.append(document.createTextNode(annPreview(a).slice(0,80)));
    j2.onclick=()=>jumpAnn(pi,a);
    const x=document.createElement('button');x.className='nd';x.textContent='×';x.setAttribute('aria-label','Delete annotation');x.onclick=()=>delAnn(pi,a);
    row.append(j2,x);box.appendChild(row);
  }));
}
function jumpAnn(pi,a){
  go(pi+1);
  setTimeout(()=>{try{const d=pagesEl.children[pi],p=fwd(d,...annPoint(a));main.scrollTop=d.offsetTop+p[1]*scale-main.clientHeight/3}catch(e){}},120);
}
// ============================================================================
// SECTION 18: PDF INTERNAL LINKS & FORM WIDGET LINK SERVICE
// ============================================================================

/**
 * Mock PDF.js LinkService interface implementation to handle internal named actions,
 * page destination jumps, and external link URL opening.
 */
async function goDest(dest){try{let d=dest;if(typeof d==='string')d=await pdf.getDestination(d);if(!Array.isArray(d))return;const i=typeof d[0]==='object'?await pdf.getPageIndex(d[0]):d[0];go(i+1)}catch(e){}}
const LS={externalLinkEnabled:true,externalLinkTarget:2,externalLinkRel:'noopener noreferrer',isInPresentationMode:false,eventBus:null,
  getDestinationHash:()=>'#',getAnchorUrl:()=>'#',setHash(){},
  executeNamedAction(a){if(a==='NextPage')go(cur+1);else if(a==='PrevPage')go(cur-1);else if(a==='FirstPage')go(1);else if(a==='LastPage')go(pdf.numPages)},
  navigateTo(d){goDest(d)},goToDestination(d){goDest(d)},goToPage(n){go(n)},
  addLinkAttributes(link,url){if(/^(https?:|mailto:|tel:)/i.test(url)){link.href=url;link.target='_blank';link.rel='noopener noreferrer'}else{link.href='#';link.onclick=e=>e.preventDefault()}}};
// ============================================================================
// SECTION 19: RECENT FILES STORAGE (INDEXEDDB)
// ============================================================================

/**
 * IndexedDB helper for managing recent documents (`recent` store) and translations (`trans` store).
 * Caps recent files to 12 documents or 200MB total storage to keep browser database tidy.
 */
let recentOn=true;try{recentOn=localStorage.getItem('folix.recent')!=='0'}catch(e){}
function idb(){if(idb.p)return idb.p;idb.p=new Promise((ok,no)=>{if(!window.indexedDB)return no(new Error('no indexedDB'));const r=indexedDB.open('folix',2);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('recent'))d.createObjectStore('recent',{keyPath:'fp'});if(!d.objectStoreNames.contains('trans'))d.createObjectStore('trans',{keyPath:'k'})};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});return idb.p}
const idbReq=(mode,fn,store)=>idb().then(db=>new Promise((ok,no)=>{const st=store||'recent',t=db.transaction(st,mode),r=fn(t.objectStore(st));t.oncomplete=()=>ok(r&&r.result);t.onerror=()=>no(t.error);t.onabort=()=>no(t.error)}));
async function recentAdd(){
  if(!recentOn||!fp||!pdf||bytes.length>60e6)return;
  try{
    const pg=await pdf.getPage(1),v1=pg.getViewport({scale:1}),vp=pg.getViewport({scale:240/v1.width}),cv=document.createElement('canvas');
    cv.width=vp.width|0;cv.height=vp.height|0;
    await pg.render({canvasContext:cv.getContext('2d',{alpha:false}),viewport:vp}).promise;
    const rec={fp,name,size:bytes.length,t:Date.now(),pages:pdf.numPages,thumb:cv.toDataURL('image/jpeg',.72),blob:new Blob([bytes],{type:'application/pdf'})};
    await idbReq('readwrite',s=>s.put(rec));
    const all=await idbReq('readonly',s=>s.getAll());all.sort((a,b)=>b.t-a.t);let sum=0;const drop=[];
    all.forEach((x,i)=>{sum+=x.size;if(i>=12||sum>200e6)drop.push(x.fp)});
    if(drop.length)await idbReq('readwrite',s=>{drop.forEach(k=>s.delete(k))});
    renderRecent();
  }catch(e){console.warn('Recent files are unavailable',e)}
}
async function renderRecent(){
  const sec=$('recent');if(!sec)return;
  let list=[];try{if(recentOn)list=(await idbReq('readonly',s=>s.getAll()))||[]}catch(e){}
  list.sort((a,b)=>b.t-a.t);sec.classList.toggle('hide',!list.length);const g=$('rgrid');g.textContent='';
  list.forEach(r=>{
    const b=document.createElement('button');b.className='rc';b.type='button';
    const im=new Image();im.src=r.thumb;im.alt='';b.appendChild(im);
    const t=document.createElement('span');t.className='rt';t.textContent=r.name;b.appendChild(t);
    let lp=0;try{const v=localStorage.getItem('folix.last.'+r.fp),o=v&&(v[0]==='{'?JSON.parse(v):{p:+v});lp=(o&&o.p)||0}catch(e){}
    const m=document.createElement('span');m.className='rm';m.textContent=r.pages+' pages · '+new Date(r.t).toLocaleDateString(undefined,{day:'numeric',month:'short'})+(lp>1?' · p.'+lp:'');b.appendChild(m);
    const x=document.createElement('span');x.className='rx btn';x.setAttribute('role','button');x.setAttribute('aria-label','Remove from recent files');x.textContent='×';
    x.onclick=async e=>{e.stopPropagation();await idbReq('readwrite',s=>s.delete(r.fp));renderRecent()};b.appendChild(x);
    b.onclick=async()=>{const rec=await idbReq('readonly',s=>s.get(r.fp));if(rec)openData(new Uint8Array(await rec.blob.arrayBuffer()),rec.name)};
    g.appendChild(b);
  });
}
$('rclr').onclick=async()=>{try{await idbReq('readwrite',s=>s.clear())}catch(e){}renderRecent()};
const recLabel=()=>{$('rec').textContent='Recent files: '+(recentOn?'ON':'OFF')};
$('rec').onclick=async()=>{recentOn=!recentOn;try{localStorage.setItem('folix.recent',recentOn?'1':'0')}catch(e){}if(!recentOn){try{await idbReq('readwrite',s=>s.clear())}catch(e){}}recLabel();renderRecent()};recLabel();renderRecent();
// ============================================================================
// SECTION 20: TEXT-TO-SPEECH (TTS) READ ALOUD ENGINE
// ============================================================================

/**
 * Text-to-Speech Controller:
 * Streams text to browser Web Speech API `SpeechSynthesis`, highlights currently spoken sentences,
 * detects document language, and automatically turns pages.
 */
const tts={on:false,paused:false,tok:0,page:0,sents:[],i:0,rate:1,voice:'',noHl:false,v:null,lang:'',byLang:{}},RATES=[.8,1,1.25,1.5,2];
try{tts.rate=+localStorage.getItem('folix.ttsr')||1;tts.voice=localStorage.getItem('folix.ttsv')||'';tts.byLang=JSON.parse(localStorage.getItem('folix.ttsl')||'{}')}catch(e){}
$('ttsrate').textContent=tts.rate+'×';
function ttsVoices(){
  if(!window.speechSynthesis)return;const sel=$('ttsv'),vs=speechSynthesis.getVoices(),lg=(navigator.language||'en').slice(0,2);
  const sorted=[...vs].sort((a,b)=>(b.lang.slice(0,2)===lg)-(a.lang.slice(0,2)===lg));sel.textContent='';
  sorted.forEach(v=>{const o=document.createElement('option');o.value=v.voiceURI;o.textContent=v.name+(v.lang?' ('+v.lang+')':'');sel.appendChild(o)});
  if(tts.voice&&vs.some(v=>v.voiceURI===tts.voice))sel.value=tts.voice;else if(sorted[0])tts.voice=sorted[0].voiceURI;
}
if(window.speechSynthesis){ttsVoices();if(speechSynthesis.addEventListener)speechSynthesis.addEventListener('voiceschanged',ttsVoices)}else $('tts').classList.add('hide');
function ttsSplit(text){
  const out=[];let m;const re=/[^.!?]+[.!?]*\s*/g;
  while((m=re.exec(text))){
    let raw=m[0],s=m.index;
    while(raw.trim().length>240){let cut=raw.lastIndexOf(' ',220);if(cut<60)cut=220;out.push({s,e:s+cut,txt:raw.slice(0,cut).trim()});raw=raw.slice(cut);s+=cut}
    const t=raw.trim();if(t.length>1)out.push({s,e:s+raw.trimEnd().length,txt:t});
  }
  return out;
}
const showTts=on=>{$('ttsbar').classList.toggle('hide',!on);$('tts').classList.toggle('on',on);$('tts').setAttribute('aria-pressed',on)};
function ttsStop(){tts.tok++;tts.on=false;tts.paused=false;if(window.speechSynthesis)speechSynthesis.cancel();showTts(false);if(window.CSS&&CSS.highlights)CSS.highlights.delete('fx-say')}
async function ttsStart(){
  if(!window.speechSynthesis)return msg('Read aloud is not supported in this browser');
  const sel=getSelection().toString().replace(/\s+/g,' ').trim(),selL=sel?await selLang(getSelection()):'';
  tts.tok++;speechSynthesis.cancel();tts.on=true;tts.paused=false;showTts(true);$('ttsplay').textContent='Pause';
  if(sel){tts.lang=selL;tts.noHl=true;tts.page=0;tts.sents=ttsSplit(sel);tts.i=0;ttsNext();return}
  tts.noHl=false;ttsPage(cur);
}
async function ttsPage(n){
  const my=tts.tok;if(n>pdf.numPages){ttsStop();msg('Finished reading');return}
  const v=await pageText(n);if(my!==tts.tok)return;
  tts.page=n;tts.v=v;tts.sents=v?ttsSplit(v.disp):[];tts.i=0;tts.lang=(v&&guessLang(v.disp))||tts.lang;
  if(n!==cur)go(n);
  if(!tts.sents.length)return ttsPage(n+1);
  ttsNext();
}
function ttsNext(){
  const my=tts.tok,s=tts.sents[tts.i];
  if(!s){if(tts.noHl)ttsStop();else ttsPage(tts.page+1);return}
  const u=new SpeechSynthesisUtterance(s.txt);u.rate=tts.rate;
  const vo=voiceFor(tts.lang);if(vo){u.voice=vo;u.lang=vo.lang}else if(tts.lang)u.lang=tts.lang;
  u.onstart=()=>{if(my===tts.tok&&!tts.noHl)ttsHl(s,tts.page,my)};
  u.onend=()=>{if(my!==tts.tok)return;tts.i++;ttsNext()};
  u.onerror=e=>{if(my!==tts.tok||e.error==='interrupted'||e.error==='canceled')return;tts.i++;ttsNext()};
  speechSynthesis.speak(u);
}
async function ttsHl(s,n,my){
  if(!(window.CSS&&CSS.highlights))return;const tl=await waitTl(n,2500);if(!tl||my!==tts.tok)return;
  const rs=rangesFor(tl,tts.v,s.s,s.e);if(!rs.length)return;CSS.highlights.set('fx-say',new Highlight(...rs));
  const rb=rs[0].getBoundingClientRect(),mb=main.getBoundingClientRect();
  if(rb.bottom>mb.bottom-90||rb.top<mb.top+40)main.scrollTo({top:main.scrollTop+rb.top-mb.top-main.clientHeight/3,behavior:'smooth'});
}
function ttsJump(d){if(!tts.on)return;tts.i=Math.max(0,tts.i+d);tts.tok++;speechSynthesis.cancel();tts.paused=false;$('ttsplay').textContent='Pause';setTimeout(ttsNext,60)}
$('tts').onclick=()=>tts.on?ttsStop():ttsStart();
$('ttsstop').onclick=ttsStop;$('ttsprev').onclick=()=>ttsJump(-1);$('ttsnext').onclick=()=>ttsJump(1);
$('ttsplay').onclick=()=>{if(!tts.on)return;if(tts.paused){speechSynthesis.resume();tts.paused=false;$('ttsplay').textContent='Pause'}else{speechSynthesis.pause();tts.paused=true;$('ttsplay').textContent='Play'}};
$('ttsrate').onclick=()=>{tts.rate=RATES[(RATES.indexOf(tts.rate)+1)%RATES.length];$('ttsrate').textContent=tts.rate+'×';try{localStorage.setItem('folix.ttsr',tts.rate)}catch(e){}ttsJump(0)};
$('ttsv').onchange=e=>{tts.voice=e.target.value;const vo=speechSynthesis.getVoices().find(x=>x.voiceURI===tts.voice);if(vo)tts.byLang[vo.lang.slice(0,2).toLowerCase()]=vo.voiceURI;try{localStorage.setItem('folix.ttsv',tts.voice);localStorage.setItem('folix.ttsl',JSON.stringify(tts.byLang))}catch(x){}ttsJump(0)};
// ============================================================================
// SECTION 21: PAGE EXPORT AS IMAGE & CONTENT TRIM MARGINS
// ============================================================================

/**
 * Exports the currently viewed page as a high-resolution PNG image file.
 */
async function pngPage(){
  if(!pdf)return;const pg=await pdf.getPage(cur),v1=pg.getViewport({scale:1}),s=Math.min(3,Math.sqrt(16e6/(v1.width*v1.height)));
  const vp=pg.getViewport({scale:s,rotation:(pg.rotate+rot)%360}),cv=document.createElement('canvas');cv.width=vp.width|0;cv.height=vp.height|0;
  await pg.render({canvasContext:cv.getContext('2d',{alpha:false}),viewport:vp}).promise;
  cv.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=baseName()+'-p'+cur+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);msg('Saved page '+cur+' as an image')},'image/png');
}
$('png').onclick=pngPage;
let trimBox=null;
/**
 * Analyzes page margins by sampling page pixel data to calculate content bounding box.
 * @returns {Promise<Object>} Trim box margins.
 */
async function measureTrim(){
  if(trimBox&&trimBox.fp===fp&&fp)return trimBox;
  const my=pdf;let l=1,r=1,n=0;
  for(let i=1;i<=Math.min(my.numPages,8);i++){
    const pg=await my.getPage(i),v1=pg.getViewport({scale:1}),vp=pg.getViewport({scale:420/v1.width}),cv=document.createElement('canvas');
    cv.width=vp.width|0;cv.height=vp.height|0;const ctx=cv.getContext('2d',{alpha:false,willReadFrequently:true});
    await pg.render({canvasContext:ctx,viewport:vp}).promise;if(my!==pdf)return null;
    const W=cv.width,H=cv.height,px=ctx.getImageData(0,0,W,H).data;let x0=W,x1=-1;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=(y*W+x)*4;if(px[k]+px[k+1]+px[k+2]<690){if(x<x0)x0=x;if(x>x1)x1=x}}
    if(x1<0)continue;l=Math.min(l,x0/W);r=Math.min(r,(W-1-x1)/W);n++;
  }
  trimBox={fp,l:n?Math.max(0,l-.01):0,r:n?Math.max(0,r-.01):0};return trimBox;
}
async function fitContent(){
  if(two)return fitWidth();
  const tb=await measureTrim();if(!tb)return;const cw=(1-tb.l-tb.r)*bw();
  const fw=(main.clientWidth-16)/bw();setScale(Math.max(C.minScale,Math.min(C.maxScale,fw*1.6,(main.clientWidth-16)/cw)),true);fitMode='c';
  requestAnimationFrame(()=>{main.scrollLeft=Math.max(0,tb.l*bw()*scale-8)});
}
$('trim').onclick=()=>fitContent();
function gotoPage(){const el=$('pg');if(el.closest('#more'))$('moreb').click();setTimeout(()=>{el.focus();el.select()},40)}
// ============================================================================
// SECTION 22: TEXT SELECTION CONTEXTUAL POPUP MENU
// ============================================================================

/**
 * Displays floating action menu (Copy, Read, Dictionary, Translate) upon text selection.
 */
const sp=document.createElement('div');sp.id='selpop';sp.className='hide';
sp.innerHTML='<button data-a="copy">Copy</button><button data-a="say">Read</button><button data-a="def">Dictionary</button><button data-a="tr">Translate</button>';document.body.appendChild(sp);
let selTxt='',selRect=null;
function spShow(){
  const s=getSelection();if(!pdf||tool||!s||s.isCollapsed||!s.rangeCount){sp.classList.add('hide');return}
  const n=s.anchorNode&&(s.anchorNode.nodeType===3?s.anchorNode.parentElement:s.anchorNode);
  if(!n||!n.closest||!n.closest('.textLayer')){sp.classList.add('hide');return}
  selTxt=s.toString().replace(/\s+/g,' ').trim();if(!selTxt||selTxt.length>500){sp.classList.add('hide');return}
  const r=s.getRangeAt(0).getBoundingClientRect();selRect=r;sp.querySelector('[data-a=def]').classList.toggle('hide',selTxt.split(' ').length>3);
  sp.classList.remove('hide');const w=sp.offsetWidth;
  sp.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+'px';sp.style.top=Math.min(innerHeight-50,r.bottom+8)+'px';
}
main.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')setTimeout(spShow,30)});
document.addEventListener('selectionchange',()=>{const s=getSelection();if(!s||s.isCollapsed)sp.classList.add('hide')});
sp.addEventListener('pointerdown',e=>e.preventDefault());
sp.addEventListener('click',e=>{
  const a=e.target.dataset&&e.target.dataset.a;if(!a)return;
  if(a==='copy'){if(navigator.clipboard)navigator.clipboard.writeText(selTxt).then(()=>msg('Copied'))}
  else if(a==='say')ttsStart();
  else if(a==='def')dictLookup(selTxt);
  else if(a==='tr')trSelection(selTxt);
  sp.classList.add('hide');
});
// ============================================================================
// SECTION 23: PAGE TOOLS (REORDER, ROTATE, DELETE, EXTRACT, MERGE)
// ============================================================================

/**
 * Multi-page manipulation modal:
 * Renders thumbnail grid enabling drag-and-drop page reordering, individual page rotation,
 * deletion, page extraction, and merging pages from external PDF files using pdf-lib.
 */
let ptCards=[],ptDocs=[],ptDrag=-1,ptQ=Promise.resolve();const ptd=$('ptd');
const ptRot=c=>c.rot?'rotate('+c.rot+'deg)'+(c.rot%180?' scale(.72)':''):'';
function ptThumb(c){
  ptQ=ptQ.then(async()=>{
    try{
      const pg=await ptDocs[c.d].p.getPage(c.i+1),v1=pg.getViewport({scale:1}),vp=pg.getViewport({scale:130/v1.width}),cv=document.createElement('canvas');
      cv.width=vp.width|0;cv.height=vp.height|0;await pg.render({canvasContext:cv.getContext('2d',{alpha:false}),viewport:vp}).promise;
      c.cv=cv;cv.style.transform=ptRot(c);const pv=c.el&&c.el.querySelector('.pv');if(pv&&!pv.firstChild)pv.appendChild(cv);
    }catch(e){}
  });
}
function ptOpen(){
  if(!pdf)return;ptDocs=[{p:pdf,bytes:null}];ptCards=[];
  for(let i=0;i<pdf.numPages;i++)ptCards.push({d:0,i,rot:0,del:false,sel:false});
  $('pterr').textContent='';ptRender();modal(ptd);
}
function ptRender(){
  const g=$('ptg');g.textContent='';
  ptCards.forEach((c,k)=>{
    const el=document.createElement('div');el.className='pc'+(c.sel?' sel':'')+(c.del?' del':'');el.draggable=true;c.el=el;
    const pv=document.createElement('div');pv.className='pv';if(c.cv){pv.appendChild(c.cv);c.cv.style.transform=ptRot(c)}else if(!c.q){c.q=true;ptThumb(c)}
    const pn=document.createElement('span');pn.className='pn';pn.textContent=(k+1)+(c.d?' (added)':'');
    const pb=document.createElement('div');pb.className='pb';
    const mk=(t,l,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.setAttribute('aria-label',l);b.title=l;b.onclick=e=>{e.stopPropagation();fn()};pb.appendChild(b)};
    mk('←','Move earlier',()=>{if(k>0){[ptCards[k-1],ptCards[k]]=[ptCards[k],ptCards[k-1]];ptRender()}});
    mk('→','Move later',()=>{if(k<ptCards.length-1){[ptCards[k+1],ptCards[k]]=[ptCards[k],ptCards[k+1]];ptRender()}});
    mk('Rot','Rotate 90 degrees',()=>{c.rot=(c.rot+90)%360;ptRender()});
    mk(c.del?'Undo':'Del',c.del?'Restore page':'Delete page',()=>{c.del=!c.del;ptRender()});
    el.append(pv,pn,pb);el.onclick=()=>{c.sel=!c.sel;ptRender()};
    el.addEventListener('dragstart',e=>{ptDrag=k;e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',String(k))}catch(x){}});
    el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('over')});
    el.addEventListener('dragleave',()=>el.classList.remove('over'));
    el.addEventListener('drop',e=>{e.preventDefault();if(ptDrag<0||ptDrag===k)return;const m=ptCards.splice(ptDrag,1)[0];ptCards.splice(k,0,m);ptDrag=-1;ptRender()});
    g.appendChild(el);
  });
}
async function ptBase(){const o=await outputBytes();if(!o)throw new Error('Could not prepare the current document');return o.data}
async function ptBuild(list){
  await ensurePdfLib();const {PDFDocument,degrees}=window.PDFLib,out=await PDFDocument.create(),src=[];
  for(const c of list){
    if(!src[c.d]){
      const b=c.d===0?await ptBase():ptDocs[c.d].bytes;
      try{src[c.d]=await PDFDocument.load(b)}catch(e){throw new Error(c.d?'Could not read an added PDF. Locked PDFs are not supported':'Locked PDFs cannot be edited')}
    }
    const pg=(await out.copyPages(src[c.d],[c.i]))[0];if(c.rot)pg.setRotation(degrees(((pg.getRotation().angle||0)+c.rot)%360));out.addPage(pg);
  }
  return await out.save();
}
const ptRun=async fn=>{$('pterr').textContent='';const bs=ptd.querySelectorAll('.ptrow button');bs.forEach(b=>b.disabled=true);try{await fn()}catch(e){$('pterr').textContent=e.message||'Something went wrong'}bs.forEach(b=>b.disabled=false)};
$('ptapply').onclick=()=>ptRun(async()=>{const list=ptCards.filter(c=>!c.del);if(!list.length)throw new Error('Keep at least one page');const out=await ptBuild(list);ptd.close();await openData(new Uint8Array(out),baseName()+'-edited.pdf');msg('Changes applied. Use Download to save the new file')});
$('ptsave').onclick=()=>ptRun(async()=>{const list=ptCards.filter(c=>!c.del);if(!list.length)throw new Error('Keep at least one page');downloadBytes(await ptBuild(list),baseName()+'-pages.pdf')});
$('ptext').onclick=()=>ptRun(async()=>{const list=ptCards.filter(c=>c.sel&&!c.del);if(!list.length)throw new Error('Select the pages to extract first');downloadBytes(await ptBuild(list),baseName()+'-extract.pdf')});
$('ptx').onclick=()=>ptd.close();$('ptall').onclick=()=>{ptCards.forEach(c=>c.sel=true);ptRender()};$('ptnone').onclick=()=>{ptCards.forEach(c=>c.sel=false);ptRender()};
$('ptadd').onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const b=new Uint8Array(await f.arrayBuffer()),p=await lib.getDocument({data:b.slice(0),isEvalSupported:false}).promise;ptDocs.push({p,bytes:b});const d=ptDocs.length-1;for(let i=0;i<p.numPages;i++)ptCards.push({d,i,rot:0,del:false,sel:false});ptRender()}
  catch(x){$('pterr').textContent='Could not read that PDF. Locked PDFs are not supported'}
};
ptd.addEventListener('close',()=>{ptDocs.slice(1).forEach(x=>{try{x.p.destroy()}catch(e){}})});
$('ptb').onclick=ptOpen;
// ============================================================================
// SECTION 24: NATURAL LANGUAGE PROCESSING & DICTIONARY HELPERS
// ============================================================================

/**
 * Multilingual NLP Utilities:
 * Detects language using stop-word statistical frequency analysis with specialized support
 * for Italian apostrophe elisions (e.g. l', dell', nell').
 */
const LANGS={en:'English',it:'Italiano',hi:'Hindi',es:'Español',fr:'Français',de:'Deutsch',pt:'Português',ru:'Русский',zh:'中文',ja:'日本語',ar:'العربية'};
const TLN=c=>LANGS[c]||c;
const fold=s=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
const STOP=Object.fromEntries(Object.entries({
  it:'il lo la le gli un una uno di del della dei delle che per con non sono è e in da al alla nel nella più come anche questo questa questi se ma ci si lui lei loro essere hanno stato tra fra dello degli nei sul sulla ai alle dal dalla quando perché cui',
  en:'the of and to in is that for with as on are this by be from or an at not it was which have has were been their they will can more other than also its these into such',
  es:'el la de que y en los las un una por con para es se del al como más pero su sus este esta son fue ha han sin sobre entre también',
  fr:'le la les de des du et en un une que est pour dans qui pas sur au aux avec ce cette sont par plus ou mais comme ses leur été être',
  de:'der die das und ist nicht ein eine zu den dem mit von für auf sich auch im des werden wird sind oder aber wie nach bei'
}).map(([k,v])=>[k,new Set(v.split(' '))]));
function guessLang(text){
  const words=(String(text).toLowerCase().match(/\p{L}+(?:['’]\p{L}+)?/gu)||[]).slice(0,500);if(words.length<4)return null;
  const sc={};for(const l in STOP){let n=0;for(const w of words){const b=w.replace(/^.*['’]/,'');if(STOP[l].has(w)||STOP[l].has(b))n++}sc[l]=n/words.length}
  sc.it+=((String(text).match(/\b(?:l|dell|nell|all|dall|sull|quell|un|c|d)['’]\p{L}/giu)||[]).length/words.length)*1.2;
  let best=null,bv=.07;for(const l in sc)if(sc[l]>bv){bv=sc[l];best=l}return best;
}
async function selLang(s){
  const sel=s||getSelection(),a=sel&&sel.anchorNode,n=a&&(a.nodeType===3?a.parentElement:a),d=n&&n.closest&&n.closest('.page'),txt=sel?sel.toString():'';
  const g=guessLang(txt);if(g)return g;
  if(d){try{const rec=await pageBlocks(+d.dataset.n);if(rec&&rec.lang)return rec.lang}catch(e){}}
  return TL.lastSrc||'it';
}
function voiceFor(lang){
  if(!window.speechSynthesis)return null;const vs=speechSynthesis.getVoices();
  if(lang){const sv=vs.find(x=>x.voiceURI===tts.byLang[lang]);if(sv)return sv;const lv=vs.find(x=>x.lang&&x.lang.toLowerCase().startsWith(lang));if(lv)return lv}
  return vs.find(x=>x.voiceURI===tts.voice)||null;
}
function speakPlain(text,lang){
  if(!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text),vo=voiceFor(lang);
  if(vo){u.voice=vo;u.lang=vo.lang}else if(lang)u.lang=lang;u.rate=tts.rate;speechSynthesis.speak(u);
}
function cleanWord(w){return w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu,'').replace(/^(?:l|d|un|dell|nell|all|dall|sull|quell|quest|c|s|m|t|v|n)['’]/iu,'').toLowerCase()}
async function dictLookup(t){
  const lang=await selLang(),words=t.trim().split(/\s+/),q=words.length===1?cleanWord(t):t.trim();
  if(lang==='it')window.open('https://www.wordreference.com/iten/'+encodeURIComponent(q),'_blank','noopener');
  else window.open('https://www.google.com/search?q='+encodeURIComponent('define '+q),'_blank','noopener');
}
// ============================================================================
// SECTION 25: DOCUMENT TRANSLATION ENGINE (ON-DEVICE & ONLINE)
// ============================================================================

/**
 * Document & Selection Translation System:
 * - On-Device: Uses Chrome / Edge built-in AI `window.Translator` API when available.
 * - Online Fallback: Uses MyMemory API with rate-limit batching when permitted by user consent.
 * - Page Overlay: Positions translated text directly above original PDF content.
 * - Persistence: Stores translation results in IndexedDB `trans` store.
 */
const TL={src:'auto',tgt:'en',ov:false,onlineOk:false,run:0,busy:false,pages:{},dev:new Map(),lastSrc:''};
try{TL.tgt=localStorage.getItem('folix.tgt')||'en';TL.src=localStorage.getItem('folix.src')||'auto';TL.ov=localStorage.getItem('folix.trov')==='1';TL.onlineOk=localStorage.getItem('folix.onlineok')==='1'}catch(e){}
const decEnt=s=>{const t=document.createElement('textarea');t.innerHTML=s;return t.value};
async function pageBlocks(n){
  if(TL.pages[n] && TL.pages[n].blocks && TL.pages[n].blocks.length) return TL.pages[n];
  const my=pdf;if(!my)return null;
  const pg=await my.getPage(n),tc=await pg.getTextContent();if(my!==pdf)return null;
  const vp=pg.getViewport({scale:1}),its=[];
  for(const it of tc.items){if(it.str===undefined||!it.str.trim())continue;const t=it.transform;its.push({x:t[4],y:t[5],w:it.width,fh:Math.hypot(t[2],t[3])||it.height||10,s:it.str})}
  its.sort((a,b)=>(b.y-a.y)||(a.x-b.x));
  const segs=[];
  for(const it of its){
    let g=null;for(let k=segs.length-1;k>=0&&k>segs.length-40;k--){const s=segs[k];if(Math.abs(s.y-it.y)<s.fh*.45&&it.x-s.x1>-s.fh*.5&&it.x-s.x1<s.fh*2.2){g=s;break}}
    if(g){g.txt+=(it.x-g.x1>g.fh*.12&&!g.txt.endsWith(' ')&&!it.s.startsWith(' ')?' ':'')+it.s;g.x1=Math.max(g.x1,it.x+it.w);g.fh=Math.max(g.fh,it.fh)}
    else segs.push({x0:it.x,x1:it.x+it.w,y:it.y,fh:it.fh,txt:it.s});
  }
  segs.sort((a,b)=>(b.y-a.y)||(a.x0-b.x0));
  const paras=[];
  for(const s of segs){
    let p=null;
    for(let k=paras.length-1;k>=0&&k>paras.length-30;k--){
      const q=paras[k],l=q.lines[q.lines.length-1],ov=Math.min(l.x1,s.x1)-Math.max(l.x0,s.x0),mw=Math.min(l.x1-l.x0,s.x1-s.x0),mf=Math.max(l.fh,s.fh);
      if(ov>mw*.4&&l.y-s.y>0&&l.y-s.y<mf*1.75&&Math.abs(l.fh-s.fh)<mf*.22&&Math.abs(l.x0-s.x0)<s.fh*3){p=q;break}
    }
    if(p)p.lines.push(s);else paras.push({lines:[s]});
  }
  const blocks=[];
  for(const p of paras){
    let txt='';for(const l of p.lines){const t=l.txt.trim();if(!txt)txt=t;else if(/[-‐]$/.test(txt)&&/^\p{Ll}/u.test(t))txt=txt.slice(0,-1)+t;else txt+=' '+t}
    txt=txt.replace(/\s+/g,' ').trim();if(!/\p{L}{2}/u.test(txt))continue;
    const x0=Math.min(...p.lines.map(l=>l.x0)),x1=Math.max(...p.lines.map(l=>l.x1)),f=p.lines[0],la=p.lines[p.lines.length-1];
    const rc=vp.convertToViewportRectangle([x0,la.y-la.fh*.28,x1,f.y+f.fh*.86]);
    blocks.push({x:Math.min(rc[0],rc[2]),y:Math.min(rc[1],rc[3]),w:Math.abs(rc[2]-rc[0]),h:Math.abs(rc[3]-rc[1]),fs:Math.max(5,f.fh*.88),src:txt});
  }
  blocks.sort((a,b)=>(a.y-b.y)||(a.x-b.x));
  const ocrdEl=$('ocrd');
  const ocrRes=(window._folixOcrResults)||(ocrdEl&&ocrdEl._lastResults);
  if(!blocks.length && ocrRes && ocrRes[n]){
    const ocrP = ocrRes[n];
    const s = 0.5;
    if(ocrP.lines && ocrP.lines.length){
      for(const l of ocrP.lines){
        const str = (l.text || '').replace(/\s+/g, ' ').trim();
        if(!str || !/\p{L}/u.test(str)) continue;
        const b = l.bbox || { x0: 0, y0: 0, x1: 100, y1: 20 };
        blocks.push({
          x: b.x0 * s,
          y: b.y0 * s,
          w: Math.max(20, (b.x1 - b.x0) * s),
          h: Math.max(10, (b.y1 - b.y0) * s),
          fs: Math.max(8, (b.y1 - b.y0) * s * 0.8),
          src: str
        });
      }
    } else if(ocrP.words && ocrP.words.length){
      const wList = [...ocrP.words].filter(w => w.text && w.text.trim());
      wList.sort((a,b)=>(a.bbox.y0-b.bbox.y0)||(a.bbox.x0-b.bbox.x0));
      const wLines = [];
      for(const w of wList){
        let l = wLines[wLines.length - 1];
        if(!l || Math.abs(w.bbox.y0 - l.y0) > (w.bbox.y1 - w.bbox.y0) * 0.6){
          wLines.push({y0: w.bbox.y0, y1: w.bbox.y1, x0: w.bbox.x0, x1: w.bbox.x1, words: [w]});
        } else {
          l.words.push(w);
          l.x1 = Math.max(l.x1, w.bbox.x1);
          l.y1 = Math.max(l.y1, w.bbox.y1);
        }
      }
      for(const wl of wLines){
        const str = wl.words.map(w => w.text).join(' ').trim();
        if(!str || !/\p{L}/u.test(str)) continue;
        blocks.push({
          x: wl.x0 * s,
          y: wl.y0 * s,
          w: (wl.x1 - wl.x0) * s,
          h: (wl.y1 - wl.y0) * s,
          fs: Math.max(8, (wl.y1 - wl.y0) * s * 0.8),
          src: str
        });
      }
    }
    blocks.sort((a,b)=>(a.y-b.y)||(a.x-b.x));
  }
  const rec=TL.pages[n]||(TL.pages[n]={});rec.blocks=blocks;rec.lang=guessLang(blocks.map(b=>b.src).join(' '));return rec;
}
// engines: on-device (Chrome / Edge desktop) first, then online with your permission
async function devTr(src,tgt,onprog){
  if(!('Translator' in self))return null;const key=src+'>'+tgt;if(TL.dev.has(key))return TL.dev.get(key);
  const opt={sourceLanguage:src,targetLanguage:tgt};let av;try{av=await Promise.race([Translator.availability(opt),new Promise(z=>setTimeout(()=>z('unavailable'),4000))])}catch(e){return null}
  if(av==='unavailable')return null;
  if(av!=='available'&&!(navigator.userActivation&&navigator.userActivation.isActive)){const e=new Error('The language pack for '+TLN(src)+' to '+TLN(tgt)+' needs a one-time download. Press the button below to start it.');e.code='gesture';throw e}
  const t=await Translator.create({...opt,monitor(m){m.addEventListener('downloadprogress',ev=>onprog&&onprog(ev.loaded))}});TL.dev.set(key,t);return t;
}
async function onlineTr(text,src,tgt){
  const parts=[];let cur2='';(text.match(/[^.!?;:]+[.!?;:]*\s*|\S+$/g)||[text]).forEach(c=>{if((cur2+c).length>420){if(cur2)parts.push(cur2);cur2=c}else cur2+=c});if(cur2)parts.push(cur2);
  const fin=[];parts.forEach(p=>{while(p.length>450){let cut=p.lastIndexOf(' ',420);if(cut<100)cut=420;fin.push(p.slice(0,cut));p=p.slice(cut)}fin.push(p)});
  const out=[];
  for(const p of fin){
    if(!p.trim())continue;
    const r=await fetch('https://api.mymemory.translated.net/get',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'q='+encodeURIComponent(p.trim())+'&langpair='+encodeURIComponent(src+'|'+tgt)});
    if(!r.ok)throw new Error('The online translator returned an error ('+r.status+')');
    const j=await r.json(),t=j&&j.responseData&&j.responseData.translatedText;
    if(!t||/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(t)||(j.responseStatus&&+j.responseStatus!==200)){
      const e=new Error(/MYMEMORY WARNING/i.test(t||'')?'The free online translation limit for today is used up. Try again tomorrow, or use Chrome on a computer for unlimited on-device translation.':'The online translator could not translate this text');e.code='quota';throw e;
    }
    out.push(decEnt(t));
  }
  return out.join(' ');
}
async function trEngine(src,tgt,onprog){
  const d=await devTr(src,tgt,onprog);
  if(d)return {name:'on-device',fn:t=>d.translate(t),conc:1};
  if(!TL.onlineOk){const e=new Error('consent');e.code='consent';throw e}
  return {name:'online (MyMemory)',fn:t=>onlineTr(t,src,tgt),conc:3};
}
const trStatus=(t,acts)=>{$('trstat').textContent=t;const a=$('tract');a.textContent='';a.classList.toggle('hide',!acts||!acts.length);(acts||[]).forEach(x=>{const b=document.createElement('button');b.type='button';b.textContent=x.label;b.className='pri';b.onclick=x.fn;a.appendChild(b)})};
const trUi=()=>{$('trstop').classList.toggle('hide',!TL.busy);$('trdoc').disabled=$('trpage').disabled=TL.busy};
function trProgress(d,t){$('trprog').classList.toggle('hide',!t);$('trbar').style.width=(t?Math.round(d/t*100):0)+'%'}
function setOnline(v){TL.onlineOk=v;try{localStorage.setItem('folix.onlineok',v?'1':'0')}catch(e){}$('trono').checked=v}
function trReset(){TL.run++;TL.busy=false;TL.pages={};if($('trout')){$('trout').textContent='';trProgress(0,0);trUi();trStatus('Translate the whole PDF, page by page. On Chrome for desktop it runs on your device.')}}
async function trRun(all){
  if(!pdf)return;const run=++TL.run,tgt=TL.tgt;TL.busy=true;trUi();trStatus('Preparing…');
  try{
    const order=[];for(let k=0;k<pdf.numPages;k++)order.push(((cur-1+k)%pdf.numPages)+1);
    const pages=all?order:[cur];let src=TL.src;
    if(src==='auto'){for(const n of order.slice(0,8)){const rec=await pageBlocks(n);if(run!==TL.run)return;if(rec&&rec.lang){src=rec.lang;break}}if(src==='auto')src=TL.lastSrc||'it'}
    TL.lastSrc=src;
    if(src===tgt){trStatus('This document looks like '+TLN(tgt)+' already. Choose another language in "To".');return}
    const eng=await trEngine(src,tgt,p=>trStatus('Downloading the '+TLN(src)+' to '+TLN(tgt)+' language pack… '+Math.round(p*100)+'%'));
    if(run!==TL.run)return;
    let done=0;trProgress(0,pages.length);trStatus('Translating from '+TLN(src)+' to '+TLN(tgt)+' ('+eng.name+')…');
    for(const n of pages){
      if(run!==TL.run)return;
      const rec=await pageBlocks(n);if(!rec||run!==TL.run)return;
      const arr=(rec.t||(rec.t={}))[tgt]||(rec.t[tgt]=[]);
      for(let i=0;i<rec.blocks.length;i+=eng.conc){
        if(run!==TL.run)return;
        await Promise.all(rec.blocks.slice(i,i+eng.conc).map(async(b,k)=>{if(arr[i+k])return;try{arr[i+k]=await eng.fn(b.src)}catch(e){if(e.code==='quota')throw e;arr[i+k]=b.src}}));
      }
      trSave(n,rec);done++;trProgress(done,pages.length);renderTrCard(n);trOverlayPage(n);
    }
    trStatus('Done. Translated '+pages.length+' page'+(pages.length>1?'s':'')+' from '+TLN(src)+' to '+TLN(tgt)+' ('+eng.name+').');
  }catch(e){
    if(e.code==='consent')trStatus('No on-device translator is available in this browser (it needs Chrome or Edge on a computer). You can allow online translation instead. The text of the pages is then sent to MyMemory, a free translation service, and only after you allow it.',[{label:'Allow online translation',fn:()=>{setOnline(true);trRun(all)}}]);
    else if(e.code==='gesture')trStatus(e.message,[{label:'Download language pack',fn:()=>trRun(all)}]);
    else trStatus(e.message||'Translation failed');
  }finally{if(run===TL.run){TL.busy=false;trUi()}}
}
function renderTrCard(n){
  const rec=TL.pages[n],arr=rec&&rec.t&&rec.t[TL.tgt];if(!rec||!arr)return;const box=$('trout');
  let card=box.querySelector('[data-p="'+n+'"]');
  if(!card){card=document.createElement('div');card.className='trcard';card.dataset.p=n;const nx=[...box.children].find(c=>+c.dataset.p>n);box.insertBefore(card,nx||null)}
  card.textContent='';const h=document.createElement('button');h.type='button';h.className='trp';h.textContent='Page '+n+(rec.lang?' · '+TLN(rec.lang):'');h.onclick=()=>go(n);card.appendChild(h);
  if(!rec.blocks.length){const p=document.createElement('p');p.textContent='No text on this page. If it is a scanned image, OCR is not supported yet.';card.appendChild(p);return}
  arr.forEach(t=>{if(!t)return;const p=document.createElement('p');p.textContent=t;card.appendChild(p)});
  const dt=document.createElement('details'),sm=document.createElement('summary');sm.textContent='Original';dt.appendChild(sm);
  rec.blocks.forEach(b=>{const p=document.createElement('p');p.textContent=b.src;dt.appendChild(p)});card.appendChild(dt);
}
function trOverlay(d){
  d.querySelectorAll('.trlayer').forEach(e=>e.remove());
  if(!TL.ov||rot!==0||!d._done)return;
  const n=+d.dataset.n,rec=TL.pages[n],arr=rec&&rec.t&&rec.t[TL.tgt];if(!arr||!arr.length)return;
  const L=document.createElement('div');L.className='trlayer';L.style.width=d._W+'px';L.style.height=d._H+'px';L.style.transform='scale('+d._s+')';
  rec.blocks.forEach((b,i)=>{
    const t=arr[i];if(!t)return;const e=document.createElement('div');e.className='tb';e.textContent=t;
    e.style.cssText='left:'+(b.x-1)+'px;top:'+(b.y-1)+'px;width:'+(b.w+2)+'px;height:'+(b.h+2)+'px;font-size:'+b.fs+'px';L.appendChild(e);
  });
  d.insertBefore(L,d._svg||null);
  L.querySelectorAll('.tb').forEach(e=>{let fs=parseFloat(e.style.fontSize),k=0;while(e.scrollHeight>e.clientHeight+1&&fs>4&&k++<12){fs*=.92;e.style.fontSize=fs+'px'}});
}
function trOverlayPage(n){const d=pagesEl.children[n-1];if(d&&d._done)trOverlay(d)}
function trSave(n,rec){if(!fp)return;idbReq('readwrite',s=>s.put({k:fp+'|'+TL.tgt+'|'+n,n,lang:rec.lang,blocks:rec.blocks.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h,fs:b.fs,src:b.src})),t:rec.t[TL.tgt]}),'trans').catch(()=>{})}
async function trLoad(){
  if(!fp||!window.indexedDB)return;const my=pdf,pre=fp+'|'+TL.tgt+'|';
  try{
    const rows=await idbReq('readonly',s=>s.getAll(IDBKeyRange.bound(pre,pre+'\uffff')),'trans');if(my!==pdf||!rows||!rows.length)return;
    rows.forEach(r=>{const rec=TL.pages[r.n]||(TL.pages[r.n]={});rec.blocks=r.blocks;rec.lang=r.lang;(rec.t||(rec.t={}))[TL.tgt]=r.t});
    rows.sort((a,b)=>a.n-b.n).forEach(r=>renderTrCard(r.n));
    trStatus('Saved translation found for '+rows.length+' page'+(rows.length>1?'s':'')+' ('+TLN(TL.tgt)+'). Translate the whole document to fill in the rest.');
    pagesEl.querySelectorAll('.page').forEach(d=>{if(d._done)trOverlay(d)});
  }catch(e){}
}
const trAllText=()=>Object.keys(TL.pages).map(Number).sort((a,b)=>a-b).map(n=>{const a=TL.pages[n].t&&TL.pages[n].t[TL.tgt];return a&&a.length?'=== Page '+n+' ===\n\n'+a.filter(Boolean).join('\n\n'):''}).filter(Boolean).join('\n\n');
$('trsrc').value=TL.src;$('trtgt').value=TL.tgt;$('trov').checked=TL.ov;$('trono').checked=TL.onlineOk;
$('trsrc').onchange=()=>{TL.src=$('trsrc').value;try{localStorage.setItem('folix.src',TL.src)}catch(e){}};
$('trtgt').onchange=()=>{TL.tgt=$('trtgt').value;try{localStorage.setItem('folix.tgt',TL.tgt)}catch(e){}const keep=TL.pages;trReset();Object.keys(keep).forEach(n=>{TL.pages[n]={blocks:keep[n].blocks,lang:keep[n].lang}});pagesEl.querySelectorAll('.page').forEach(d=>d._done&&trOverlay(d));trLoad()};
$('trov').onchange=()=>{TL.ov=$('trov').checked;try{localStorage.setItem('folix.trov',TL.ov?'1':'0')}catch(e){}pagesEl.querySelectorAll('.page').forEach(d=>d._done&&trOverlay(d));if(TL.ov&&rot!==0)msg('The translation overlay needs the pages at 0° rotation')};
$('trono').onchange=()=>setOnline($('trono').checked);
$('trdoc').onclick=()=>trRun(true);$('trpage').onclick=()=>trRun(false);
$('trstop').onclick=()=>{TL.run++;TL.busy=false;trUi();trStatus('Stopped. Translated pages are kept.')};
$('trtxt').onclick=()=>{const t=trAllText();if(!t)return msg('Translate something first');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/plain;charset=utf-8'}));a.download=baseName()+'-'+TL.tgt+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)};
$('trcopy').onclick=()=>{const t=trAllText();if(!t)return msg('Translate something first');if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>msg('Copied the translation'))};
$('trdocb').onclick=()=>{setSidebar(true,true);setTab('trans');const have=Object.values(TL.pages).some(r=>r.t&&r.t[TL.tgt]&&r.t[TL.tgt].length);if(!have&&!TL.busy)trRun(true)};
// ============================================================================
// SECTION 26: TRANSLATION EXPORT (PDF, PNG, ZIP ARCHIVE)
// ============================================================================

/**
 * Generates formatted multi-page documents containing translated text with Folix watermark.
 * Bundles multi-page PNG exports into a standard ZIP archive via pure JS PKZIP/CRC32 implementation.
 */
const EX={W:1240,H:1754,M:116,FONT:'"Segoe UI",Arial,"Noto Sans","Helvetica Neue",sans-serif'};
const loadImg=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src});
const blobBytes=async(cv,type,q)=>new Promise((ok,no)=>{try{cv.toBlob(b=>{if(b)b.arrayBuffer().then(buf=>ok(new Uint8Array(buf))).catch(no);else{try{const d=cv.toDataURL(type||'image/png',q),bin=atob(d.split(',')[1]),arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);ok(arr)}catch(e){no(e)}}},type,q)}catch(err){try{const d=cv.toDataURL(type||'image/png',q),bin=atob(d.split(',')[1]),arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);ok(arr)}catch(e){no(err)}}});
function downloadAny(data,fname,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=fname;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
const crcT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=crcT[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
function makeZip(files){
  const enc=new TextEncoder(),parts=[],cd=[];let off=0;
  const d=new Date(),dt=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate(),tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);
  for(const f of files){
    const nm=enc.encode(f.name),crc=crc32(f.data),h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);
    h.setUint32(14,crc,true);h.setUint32(18,f.data.length,true);h.setUint32(22,f.data.length,true);h.setUint16(26,nm.length,true);h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer),nm,f.data);
    const c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,tm,true);c.setUint16(14,dt,true);
    c.setUint32(16,crc,true);c.setUint32(20,f.data.length,true);c.setUint32(24,f.data.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cd.push(new Uint8Array(c.buffer),nm);off+=30+nm.length+f.data.length;
  }
  const cdLen=cd.reduce((s,x)=>s+x.length,0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cdLen,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cd,new Uint8Array(e.buffer)],{type:'application/zip'});
}
async function trCanvases(forPdf=false){
  const pages=Object.keys(TL.pages).map(Number).sort((a,b)=>a-b).filter(n=>{const a=TL.pages[n].t&&TL.pages[n].t[TL.tgt];return a&&a.some(Boolean)});
  if(!pages.length)return null;
  const out=[],W=EX.W,H=EX.H,M=EX.M,LH=32,BW=W-2*M;
  let cv,ctx,y;
  let folixLogoImg=null;
  if(!forPdf){
    try{
      const brandImg=document.querySelector('.brand img')||document.querySelector('#mbtn img');
      if(brandImg&&brandImg.complete&&brandImg.naturalWidth)folixLogoImg=brandImg;
      else folixLogoImg=await loadImg('assets/icon-192.png');
    }catch(e){}
  }
  const mark=c=>{
    if(forPdf)return; // Handled natively in PDF with high-resolution original PNG
    c.save();c.textBaseline='middle';c.textAlign='right';c.font='700 36px '+EX.FONT;c.fillStyle='#ff6a00';
    c.fillText('Folix',W-M,58);const w=c.measureText('Folix').width;
    const is=44,ix=W-M-w-54,iy=36;
    if(folixLogoImg){
      try{c.drawImage(folixLogoImg,ix,iy,is,is)}catch(_){}
    }
    c.restore();
  };
  const fresh=()=>{cv=document.createElement('canvas');cv.width=W;cv.height=H;ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);mark(ctx);y=M+10;out.push(cv)};
  const need=n=>{if(!cv||y+n>H-M)fresh()};
  fresh();
  ctx.fillStyle='#111';ctx.font='700 34px '+EX.FONT;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('Translation',M,y+34);y+=48;
  const wrapText=(text,maxW)=>{
    const rtl=/[\u0590-\u08FF]/.test(text);
    const subLines=String(text||'').split(/\r?\n/);
    const lines=[];
    const w=s=>ctx.measureText(s).width;
    for(const sub of subLines){
      if(!sub.trim()){lines.push('');continue}
      const toks=sub.split(/(\s+)/);
      let cur='';
      for(const tk of toks){
        if(!tk)continue;
        if(w(cur+tk)<=maxW){cur+=tk;continue}
        if(cur.trim())lines.push(cur.trim());
        cur='';
        if(w(tk)>maxW&&!/^\s+$/.test(tk)){
          let part='';
          for(const ch of tk){
            if(w(part+ch)>maxW){lines.push(part);part=ch}
            else part+=ch;
          }
          cur=part;
        }else if(!/^\s+$/.test(tk))cur=tk;
      }
      if(cur.trim())lines.push(cur.trim());
    }
    return {lines,rtl};
  };
  ctx.font='18px '+EX.FONT;ctx.fillStyle='#666';
  const subMeta=baseName()+'  ·  '+TLN(TL.lastSrc||'it')+' → '+TLN(TL.tgt);
  const {lines:subLines}=wrapText(subMeta,BW);
  for(const sl of subLines){
    need(28);ctx.font='18px '+EX.FONT;ctx.fillStyle='#666';ctx.fillText(sl,M,y+18);y+=26;
  }
  y+=20;
  for(const n of pages){
    const arr=TL.pages[n].t[TL.tgt].filter(Boolean);
    need(80);ctx.font='700 18px '+EX.FONT;ctx.fillStyle='#ff6a00';ctx.textAlign='left';ctx.direction='ltr';ctx.fillText('PAGE '+n,M,y+18);
    ctx.fillStyle='#e2e8f0';ctx.fillRect(M,y+28,BW,1.5);y+=46;
    for(const para of arr){
      ctx.font='21px '+EX.FONT;const {lines,rtl}=wrapText(para,BW);
      for(let i=0;i<lines.length;i++){
        const line=lines[i];
        if(!line){y+=14;continue}
        need(LH+4);ctx.font='21px '+EX.FONT;ctx.fillStyle='#111';ctx.direction=rtl?'rtl':'ltr';ctx.textAlign=rtl?'right':'left';
        ctx.fillText(line,rtl?W-M:M,y+22);y+=LH;
      }
      ctx.direction='ltr';ctx.textAlign='left';y+=14;
    }
    y+=24;
  }
  out.forEach((c,i)=>{const x=c.getContext('2d');x.fillStyle='#94a3b8';x.font='16px '+EX.FONT;x.textAlign='center';x.textBaseline='alphabetic';x.fillText((i+1)+' / '+out.length,W/2,H-50)});
  return out;
}
async function trExport(kind){
  if(!pdf)return;msg('Preparing the '+kind.toUpperCase()+'…');
  try{
    const forPdf=kind==='pdf';
    const cvs=await trCanvases(forPdf);if(!cvs)return msg('Translate something first');
    const nm=baseName()+'-'+TL.tgt;
    if(forPdf){
      await ensurePdfLib();const {PDFDocument,StandardFonts,rgb}=window.PDFLib,doc=await PDFDocument.create();
      doc.setTitle(baseName()+' ('+TLN(TL.tgt)+' translation)');doc.setCreator('Folix');doc.setProducer('Folix');
      let logoImg=null;
      try{
        const r=await fetch('assets/icon-192.png');
        if(r.ok){const b=await r.arrayBuffer();logoImg=await doc.embedPng(new Uint8Array(b))}
      }catch(e){console.warn('Logo embed',e)}
      const boldFont=await doc.embedFont(StandardFonts.HelveticaBold);
      const logoSize=22,textStr='Folix',textWidth=boldFont.widthOfTextAtSize(textStr,18),totalW=logoSize+6+textWidth;
      const rightMargin=55.68,startX=595.28-rightMargin-totalW,topY=841.89-42;

      for(const c of cvs){
        const b=await blobBytes(c,'image/png');
        const img=b[0]===0x89?await doc.embedPng(b):await doc.embedJpg(b);
        const pg=doc.addPage([595.28,841.89]);
        pg.drawImage(img,{x:0,y:0,width:595.28,height:841.89});
        if(logoImg){
          pg.drawImage(logoImg,{x:startX,y:topY-3,width:logoSize,height:logoSize});
        }
        pg.drawText(textStr,{x:startX+logoSize+6,y:topY,size:18,font:boldFont,color:rgb(1,0.416,0)});
      }
      downloadAny(await doc.save(),nm+'.pdf','application/pdf');msg('Saved '+cvs.length+' page'+(cvs.length>1?'s':'')+' as PDF');
    }else if(cvs.length===1){
      downloadAny(await blobBytes(cvs[0],'image/png'),nm+'.png','image/png');msg('Saved the translation as a PNG');
    }else{
      const files=[];for(let i=0;i<cvs.length;i++)files.push({name:nm+'-p'+String(i+1).padStart(3,'0')+'.png',data:await blobBytes(cvs[i],'image/png')});
      downloadAny(makeZip(files),nm+'-png.zip','application/zip');msg('Saved '+cvs.length+' PNG pages in a zip file');
    }
  }catch(e){console.error('Translation export error:',e);msg('Could not create the file: '+(e&&e.message?e.message:'unknown error'))}
}
$('trpdf').onclick=()=>trExport('pdf');$('trpng').onclick=()=>trExport('png');
// translate the selected text in place
const selres=document.createElement('div');selres.id='selres';selres.className='hide';document.body.appendChild(selres);
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#selres,#selpop'))selres.classList.add('hide')});
function showSelRes(text,src,tgt,eng){
  selres.textContent='';selres.classList.remove('hide');
  const h=document.createElement('div');h.className='sh';h.textContent=TLN(src)+' → '+TLN(tgt)+(eng?' · '+eng:'');
  const t=document.createElement('div');t.className='st';t.textContent=text;
  const b=document.createElement('div');b.className='sb';
  const mk=(l,fn)=>{const x=document.createElement('button');x.type='button';x.textContent=l;x.onclick=fn;b.appendChild(x)};
  mk('Copy',()=>{if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>msg('Copied'))});mk('Read',()=>speakPlain(text,tgt));
  mk('Google',()=>window.open('https://translate.google.com/?sl='+encodeURIComponent(src)+'&tl='+encodeURIComponent(tgt)+'&text='+encodeURIComponent(selTxt)+'&op=translate','_blank','noopener'));mk('Close',()=>selres.classList.add('hide'));
  selres.append(h,t,b);const r=selRect||{left:20,bottom:80},w=selres.offsetWidth;
  selres.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+'px';selres.style.top=Math.min(innerHeight-selres.offsetHeight-8,r.bottom+10)+'px';
}
async function trSelection(t){
  let src=TL.src!=='auto'?TL.src:(await selLang()),tgt=TL.tgt;if(src===tgt)tgt=src==='it'?'en':'it';
  const g=()=>window.open('https://translate.google.com/?sl='+encodeURIComponent(src)+'&tl='+encodeURIComponent(tgt)+'&text='+encodeURIComponent(t)+'&op=translate','_blank','noopener');
  showSelRes('Translating…',src,tgt,'');
  try{const eng=await trEngine(src,tgt);const out=await eng.fn(t);showSelRes(out,src,tgt,eng.name)}
  catch(e){selres.classList.add('hide');if(e.code==='quota'||e.code==='gesture'||e.code==='consent'||!e.code){g();if(e.code==='consent')msg('Opened Google Translate. Allow online translation in the Translate tab to see results here')}}
}
// ============================================================================
// SECTION 27: RESPONSIVE ADAPTIVE TOOLBAR & AUTOHIDE HEADER
// ============================================================================

/**
 * Adaptive Toolbar Controller:
 * Measures scrollWidth vs clientWidth to dynamically migrate overflowing tool groups
 * into the `#more` dropdown popup sheet via DOM comment placeholders.
 */
const bar=document.querySelector('.bar'),moreB=$('moreb'),moreP=$('more'),mnav=$('mnav'),mbtn=$('mbtn');
const ORDER=['pin','share','g-view','g-search','ann','g-zoom','sb','g-nav'];
let moved=[];
const overflows=()=>bar.scrollWidth>bar.clientWidth+1;
function closePops(){
  [moreP,mnav].forEach(p=>p&&p.classList.remove('open'));
  if(moreB)moreB.setAttribute('aria-expanded','false');
  if(mbtn)mbtn.setAttribute('aria-expanded','false');
  if($('theme-pop'))$('theme-pop').classList.add('hide');
  if($('theme-btn'))$('theme-btn').setAttribute('aria-expanded','false');
}
function closeAllMenus(){
  document.querySelectorAll('#top-menus .menu-item.open').forEach(m=>m.classList.remove('open'));
  document.querySelectorAll('#top-menus .menu-btn[aria-expanded=true]').forEach(b=>b.setAttribute('aria-expanded','false'));
}
function popAt(p,anchor,right){
  const open=!p.classList.contains('open');closePops();if(!open)return;
  const r=anchor.getBoundingClientRect(),vw=document.documentElement.clientWidth;
  p.style.top=(r.bottom+6)+'px';p.style.left='8px';p.style.right='auto';
  p.classList.add('open');anchor.setAttribute('aria-expanded','true');
  if((vw<=720||vw<=document.body.clientWidth)&&p===moreP){p.style.left='8px';p.style.right='8px';p.style.width='auto'}      // phones: full-width sheet under the bar
  else{const w=p.offsetWidth;p.style.left=Math.max(8,Math.min(right?r.right-w:r.left,vw-w-8))+'px'}
}
function fitBar(){
  moved.forEach(m=>{m.ph.parentNode.insertBefore(m.el,m.ph);m.ph.remove()});moved=[];
  moreB.classList.add('hide');closePops();
  if(!overflows())return;
  moreB.classList.remove('hide');
  for(const id of ORDER){
    if(!overflows())break;
    const el=$(id);if(!el)continue;
    const ph=document.createComment('');el.parentNode.insertBefore(ph,el);moreP.appendChild(el);moved.push({el,ph});
  }
  if(!moved.length)moreB.classList.add('hide');
}
moreP.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&['ann','sb','dl','pr','pin','fs'].includes(b.id))closePops()});
moreB.onclick=e=>{e.stopPropagation();popAt(moreP,moreB,true)};
mbtn.onclick=e=>{e.stopPropagation();popAt(mnav,mbtn,false)};
document.addEventListener('click',e=>{
  if(!e.target.closest('.pop,#moreb,#mbtn'))closePops();
  if(!e.target.closest('#top-menus'))closeAllMenus();
  if(hdr&&hdr.classList.contains('open')&&!e.target.closest('.top'))closeMobileNav();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePops();closeAllMenus();closeMobileNav()}});
let fbT;
addEventListener('resize',()=>{clearTimeout(fbT);fbT=setTimeout(fitBar,80)});
addEventListener('orientationchange',()=>{clearTimeout(fbT);fbT=setTimeout(fitBar,100)});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitBar);
fitBar();
setTimeout(fitBar,50);
setTimeout(fitBar,250);
// top bar: pinned (always visible) or auto-hide (hides scrolling down, returns scrolling up)
const chrome=$('chrome');let mode='pin',lastY=0;
try{mode=localStorage.getItem('folix.bar')==='auto'?'auto':'pin'}catch(e){}
function showBar(){
  chrome.style.marginTop='0';
  chrome.inert=false;
  $('reveal').classList.add('hide');
}
function hideBar(){
  closePops();
  chrome.style.marginTop=-chrome.offsetHeight+'px';
  chrome.inert=true;
  $('reveal').classList.remove('hide');
}
function toggleBars(force){
  const isHidden=chrome.style.marginTop&&chrome.style.marginTop!=='0px';
  const shouldShow=typeof force==='boolean'?force:isHidden;
  if(shouldShow)showBar();else hideBar();
}
function applyMode(){$('pin').classList.toggle('on',mode==='pin');$('pin').setAttribute('aria-pressed',mode==='pin');$('pinl').textContent=mode==='pin'?'PINNED':'AUTO-HIDE';if(mode==='pin')showBar()}
$('pin').onclick=()=>{mode=mode==='pin'?'auto':'pin';try{localStorage.setItem('folix.bar',mode)}catch(e){}applyMode();msg(mode==='pin'?'Top bar stays visible':'Top bar hides while you scroll')};
$('reveal').onclick=showBar;
main.addEventListener('scroll',()=>{
  const y=main.scrollTop,d=y-lastY;
  if(Math.abs(d)<10)return;lastY=y;
  if(mode!=='auto'||!pdf||Date.now()<noHide)return;
  if(d>0&&y>80)hideBar();else if(d<0)showBar();
},{passive:true});
applyMode();requestAnimationFrame(fitBar);
// events
const readFile=f=>{if(!f)return;if(f.type&&f.type!=='application/pdf'&&!/\.pdf$/i.test(f.name))return msg('Please choose a PDF');f.arrayBuffer().then(b=>openData(new Uint8Array(b),f.name))};
$('file').onchange=e=>{readFile(e.target.files[0]);e.target.value=''};
$('openl').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('file').click()}};
$('prev').onclick=()=>go(cur-1);$('next').onclick=()=>go(cur+1);
$('pg').onchange=e=>go(+e.target.value);
$('zi').onclick=()=>setScale(scale*1.2);$('zo').onclick=()=>setScale(scale/1.2);
$('fit').onclick=()=>fitWidth();
$('fith').onclick=fitHeight;
$('rot').onclick=()=>{rot=(rot+90)%360;setScale(scale,true,true)};
// dark reading mode (inverts page colours), remembered
themeHooks.push(()=>{$('dark').classList.toggle('on',th!=='light');const lbl=th==='dark-ui'?'dark UI':th;$('dark').setAttribute('aria-label','Theme: '+lbl+' (click to change)');$('dark').title='Theme: '+lbl});
$('dark').onclick=nextTheme;themeHooks.push(()=>{if(pdf&&io&&ctxFilter)resetPages(false,true)});applyTheme();
// two-page view
let two=false;try{two=localStorage.getItem('folix.two')==='1'}catch(e){}
const pp=()=>two?2:1;
function applyTwo(){pagesEl.classList.toggle('two',two);$('two').classList.toggle('on',two);$('two').setAttribute('aria-pressed',two)}
$('two').onclick=()=>{two=!two;try{localStorage.setItem('folix.two',two?'1':'0')}catch(e){}applyTwo();fitWidth()};applyTwo();
// fullscreen
const de=document.documentElement;
if(!de.requestFullscreen)$('fs').classList.add('hide');
$('fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():de.requestFullscreen();
document.querySelectorAll('button[aria-label]').forEach(b=>b.title=b.getAttribute('aria-label'));
let st;$('q').oninput=()=>{clearTimeout(st);st=setTimeout(search,300)};
$('q').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();stepTo(sCur+(e.shiftKey?-1:1))}};
$('dl').onclick=download;$('pr').onclick=print;
['dragover','dragenter'].forEach(t=>document.addEventListener(t,e=>{e.preventDefault();empty.classList.add('drag')}));
['dragleave','drop'].forEach(t=>document.addEventListener(t,e=>{e.preventDefault();empty.classList.remove('drag')}));
document.addEventListener('drop',e=>readFile(e.dataTransfer.files[0]));
document.addEventListener('keydown',e=>{
  if(!pdf)return;
  const typing=/INPUT/.test(document.activeElement.tagName);
  if((e.ctrlKey||e.metaKey)&&e.key==='f'){e.preventDefault();showBar();$('q').focus();$('q').select()}
  else if((e.ctrlKey||e.metaKey)&&(e.key==='='||e.key==='+')){e.preventDefault();setScale(scale*1.2)}
  else if((e.ctrlKey||e.metaKey)&&e.key==='-'){e.preventDefault();setScale(scale/1.2)}
  else if(!typing&&e.key==='ArrowRight')go(cur+1);
  else if(!typing&&e.key==='ArrowLeft')go(cur-1);
  else if(!typing&&e.key==='Home')go(1);
  else if(!typing&&e.key==='End')go(pdf.numPages);
});
// ============================================================================
// SECTION 28: TOUCH PINCH-TO-ZOOM & TRACKPAD ZOOM GESTURES
// ============================================================================

/**
 * Tracks multi-touch pinch gestures and trackpad wheel events, applying immediate CSS transforms
 * for silky 60fps zooming, followed by high-resolution re-rendering upon gesture end.
 */
function anchorAt(cx,cy){
  const px=main.scrollLeft+cx,py=main.scrollTop+cy,ch=pagesEl.children;let best=0,bd=1e9;
  for(let i=0;i<ch.length;i++){const e=ch[i],dy=py<e.offsetTop?e.offsetTop-py:py>e.offsetTop+e.offsetHeight?py-e.offsetTop-e.offsetHeight:0;if(dy<bd){bd=dy;best=i;if(!dy)break}}
  const e=ch[best];return e?{i:best,rx:(px-e.offsetLeft)/e.offsetWidth,ry:(py-e.offsetTop)/e.offsetHeight}:null;
}
function scrollToAnchor(a,cx,cy){
  const e=a&&pagesEl.children[a.i];if(!e)return;
  main.scrollLeft=e.offsetLeft+a.rx*e.offsetWidth-cx;main.scrollTop=e.offsetTop+a.ry*e.offsetHeight-cy;
}
let pz=null;
const tdist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
const tmid=(t,r)=>[(t[0].clientX+t[1].clientX)/2-r.left,(t[0].clientY+t[1].clientY)/2-r.top];
main.addEventListener('touchstart',e=>{
  if(!pdf||e.touches.length!==2)return;
  const r=main.getBoundingClientRect(),pr=pagesEl.getBoundingClientRect(),c=tmid(e.touches,r);
  pz={d0:tdist(e.touches),s0:scale,k:1,cx:c[0],cy:c[1],a:anchorAt(c[0],c[1])};
  pagesEl.style.transformOrigin=(c[0]+r.left-pr.left)+'px '+(c[1]+r.top-pr.top)+'px';
},{passive:true});
main.addEventListener('touchmove',e=>{
  if(!pz||e.touches.length!==2)return;
  const r=main.getBoundingClientRect(),c=tmid(e.touches,r);
  pz.k=Math.min(C.maxScale/pz.s0,Math.max(C.minScale/pz.s0,tdist(e.touches)/pz.d0));pz.cx=c[0];pz.cy=c[1];
  pagesEl.style.transform='scale('+pz.k+')';
},{passive:true});
const pzEnd=e=>{
  if(!pz||e.touches.length>=2)return;const z=pz;pz=null;
  pagesEl.style.transform='';pagesEl.style.transformOrigin='';
  const ns=Math.min(C.maxScale,Math.max(C.minScale,z.s0*z.k));if(Math.abs(ns-z.s0)<.005)return;
  setScale(ns);scrollToAnchor(z.a,z.cx,z.cy);
};
main.addEventListener('touchend',pzEnd,{passive:true});main.addEventListener('touchcancel',pzEnd,{passive:true});
// trackpad pinch / Ctrl + wheel on desktop
let wz=1,wRaf=0,wA=null,wC=[0,0];
main.addEventListener('wheel',e=>{
  if(!e.ctrlKey||!pdf)return;e.preventDefault();
  const r=main.getBoundingClientRect();wC=[e.clientX-r.left,e.clientY-r.top];if(!wA)wA=anchorAt(wC[0],wC[1]);
  const dy=e.deltaMode===1?e.deltaY*33:e.deltaY;wz*=Math.abs(dy)>=40?(dy<0?1.1:1/1.1):Math.exp(-dy*.008);
  if(!wRaf)wRaf=requestAnimationFrame(()=>{wRaf=0;const ns=Math.min(C.maxScale,Math.max(C.minScale,scale*Math.min(1.5,Math.max(.67,wz))));wz=1;const a=wA;wA=null;if(Math.abs(ns-scale)>.002){setScale(ns);scrollToAnchor(a,wC[0],wC[1])}});
},{passive:false});
// ============================================================================
// SECTION 29: PROGRESSIVE WEB APP (PWA) & OS INTEGRATION
// ============================================================================

/**
 * Integrates with OS capabilities:
 * - Web App File Handling API (`launchQueue`) to open PDFs directly from desktop file managers.
 * - Android Web Share Target ingestion from CacheStorage.
 * - PWA installation prompt lifecycle management.
 * - Deep-linking via `?file=<url>` query parameters.
 */
if('launchQueue' in window)launchQueue.setConsumer(async p=>{if(!p.files||!p.files.length)return;try{readFile(await p.files[0].getFile())}catch(e){msg('Could not open that file')}});
if(/[?&]shared=1/.test(location.search)&&window.caches)caches.open('folix-share').then(async c=>{
  const r=await c.match('shared-file');if(!r)return;const buf=await r.arrayBuffer(),nm=decodeURIComponent(r.headers.get('x-name')||'shared.pdf');
  await c.delete('shared-file');history.replaceState(null,'',location.pathname);openData(new Uint8Array(buf),nm);
}).catch(()=>{});
let dip=null;const inst=$('install');
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;inst.classList.remove('hide')});
addEventListener('appinstalled',()=>{dip=null;inst.classList.add('hide');msg('Folix installed')});
inst.onclick=async()=>{if(!dip)return;dip.prompt();try{await dip.userChoice}catch(e){}dip=null;inst.classList.add('hide')};
const u=new URLSearchParams(location.search).get('file');
if(u){try{const pu=new URL(u,location.href);if(pu.protocol!=='https:'&&pu.protocol!=='http:'){msg('Only HTTP/HTTPS URLs are supported')}else if(pu.origin===location.origin){fetch(u).then(r=>r.arrayBuffer()).then(b=>openData(new Uint8Array(b),u.split('/').pop())).catch(()=>msg('Could not load that URL'))}else if(confirm('Load external PDF from '+pu.hostname+'?')){fetch(u).then(r=>r.arrayBuffer()).then(b=>openData(new Uint8Array(b),u.split('/').pop())).catch(()=>msg('Could not load that URL'))}}catch(e){msg('Invalid file URL')}}

// ============================================================================
// SECTION 30: OPTICAL CHARACTER RECOGNITION (TESSERACT OCR)
// ============================================================================

/**
 * Client-side Tesseract.js OCR integration:
 * - Recognizes text from scanned pages or image-heavy PDFs
 * - Supports page scope (current page or whole document)
 * - Enables text copying, downloading as .txt, TTS read aloud, and
 *   direct injection into the page textLayer for interactive search (Ctrl+F)
 */
let ocrWorker=null,ocrAbort=false;

function getOcrWorkerBlobUrl(){
  if(window.FOLIX_OCR_WORKER_BLOB_URL)return window.FOLIX_OCR_WORKER_BLOB_URL;
  if(window.__folix_ocr_worker_fn__){
    try{
      const src='('+window.__folix_ocr_worker_fn__.toString()+')();';
      const blob=new Blob([src],{type:'application/javascript'});
      return (window.FOLIX_OCR_WORKER_BLOB_URL=URL.createObjectURL(blob));
    }catch(e){}
  }
  return 'lib/ocr/worker-bundle.js';
}

function writeKeyval(key, val) {
  return new Promise(resolve => {
    let done = false;
    const finish = res => { if (!done) { done = true; resolve(res); } };
    const timer = setTimeout(() => finish(false), 2000);
    try {
      const req = indexedDB.open('keyval-store');
      req.onupgradeneeded = () => {
        try {
          if (!req.result.objectStoreNames.contains('keyval')) {
            req.result.createObjectStore('keyval');
          }
        } catch(e) {}
      };
      req.onblocked = () => { clearTimeout(timer); finish(false); };
      req.onerror = () => { clearTimeout(timer); finish(false); };
      req.onsuccess = () => {
        const db = req.result;
        try {
          if (!db.objectStoreNames.contains('keyval')) {
            db.close();
            clearTimeout(timer);
            finish(false);
            return;
          }
          const tx = db.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(val, key);
          tx.oncomplete = () => { try { db.close(); } catch(_) {} clearTimeout(timer); finish(true); };
          tx.onerror = () => { try { db.close(); } catch(_) {} clearTimeout(timer); finish(false); };
          tx.onabort = () => { try { db.close(); } catch(_) {} clearTimeout(timer); finish(false); };
        } catch(err) {
          try { db.close(); } catch(_) {}
          clearTimeout(timer);
          finish(false);
        }
      };
    } catch(e) {
      clearTimeout(timer);
      finish(false);
    }
  });
}

function readKeyval(key) {
  return new Promise(resolve => {
    let done = false;
    const finish = res => { if (!done) { done = true; resolve(res); } };
    const timer = setTimeout(() => finish(null), 1500);
    try {
      const req = indexedDB.open('keyval-store');
      req.onupgradeneeded = () => {
        try {
          if (!req.result.objectStoreNames.contains('keyval')) {
            req.result.createObjectStore('keyval');
          }
        } catch(e) {}
      };
      req.onblocked = () => { clearTimeout(timer); finish(null); };
      req.onerror = () => { clearTimeout(timer); finish(null); };
      req.onsuccess = () => {
        const db = req.result;
        try {
          if (!db.objectStoreNames.contains('keyval')) {
            db.close();
            clearTimeout(timer);
            finish(null);
            return;
          }
          const tx = db.transaction('keyval', 'readonly');
          const getReq = tx.objectStore('keyval').get(key);
          getReq.onsuccess = () => {
            const res = getReq.result;
            try { db.close(); } catch(_) {}
            clearTimeout(timer);
            finish(res || null);
          };
          getReq.onerror = () => { try { db.close(); } catch(_) {} clearTimeout(timer); finish(null); };
          tx.onerror = () => { try { db.close(); } catch(_) {} clearTimeout(timer); finish(null); };
          tx.onabort = () => { try { db.close(); } catch(_) {} clearTimeout(timer); finish(null); };
        } catch(err) {
          try { db.close(); } catch(_) {}
          clearTimeout(timer);
          finish(null);
        }
      };
    } catch(e) {
      clearTimeout(timer);
      finish(null);
    }
  });
}

async function ensureTessdataCachedSingle(l){
  const primaryKey = './' + l + '.traineddata';
  try{
    const cached = await readKeyval(primaryKey);
    if(cached) return true;

    let u8 = null;
    if(window.FOLIX_LANG_DATA && window.FOLIX_LANG_DATA[l]){
      try{
        const b64 = window.FOLIX_LANG_DATA[l];
        const bin = atob(b64);
        u8 = new Uint8Array(bin.length);
        for(let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      }catch(e){
        console.warn('Error decoding embedded lang data for', l, e);
      }
    }
    if(!u8){
      try{
        const res = await fetch('lib/ocr/lang/' + l + '.traineddata');
        if(res.ok) u8 = new Uint8Array(await res.arrayBuffer());
      }catch(e){
        console.warn('Error fetching traineddata for', l, e);
      }
    }

    if(u8){
      await writeKeyval(primaryKey, u8);
      await writeKeyval(l + '.traineddata', u8);
      return true;
    }
  }catch(err){
    console.warn('ensureTessdataCachedSingle error:', err);
  }
  return false;
}

async function ensureTessdataCached(langs){
  const list = langs.split('+').map(s => s.trim()).filter(Boolean);
  for(const l of list){
    await ensureTessdataCachedSingle(l);
  }
}

async function ensureTesseract(){
  if(window.Tesseract)return;
  msg('Loading Tesseract OCR engine…');
  await new Promise((ok,no)=>{
    const s=document.createElement('script');
    s.src=(window.FOLIX_CONFIG&&window.FOLIX_CONFIG.tesseractSrc)||'lib/ocr/tesseract.min.js';
    s.onload=ok;s.onerror=()=>no(new Error('Failed to load Tesseract.js'));
    document.head.appendChild(s);
  });
}

async function getOcrWorker(lang){
  if(ocrWorker && ocrWorker._lang === lang) return ocrWorker;
  if(ocrWorker){
    try { await ocrWorker.terminate(); } catch(e) {}
    ocrWorker = null;
  }
  if(ocrAbort) return null;

  if($('ocrstat')) $('ocrstat').textContent = 'Preparing language models…';
  try {
    await Promise.race([
      ensureTessdataCached(lang),
      new Promise(r => setTimeout(r, 4000))
    ]);
  } catch(e) {
    console.warn('Non-fatal error in ensureTessdataCached:', e);
  }
  if(ocrAbort) return null;

  if($('ocrstat')) $('ocrstat').textContent = 'Starting OCR engine…';

  const isHttp = window.location.protocol.startsWith('http');
  const langPath = isHttp ? new URL('lib/ocr/lang', window.location.href).href : 'lib/ocr/lang';
  const corePath = isHttp ? new URL('lib/ocr', window.location.href).href : 'lib/ocr';
  const workerPath = isHttp ? 'lib/ocr/worker-bundle.js' : getOcrWorkerBlobUrl();

  const workerPromise = Tesseract.createWorker(lang, 1, {
    corePath: corePath,
    langPath: langPath,
    workerPath: workerPath,
    workerBlobURL: false,
    cachePath: '.',
    cacheMethod: 'write',
    gzip: false,
    logger: m => {
      if(m.status === 'recognizing text' && m.progress != null){
        const pct = Math.round(m.progress * 100);
        const pb = $('ocrbar'), pt = $('ocrpct');
        if(pb) pb.style.width = pct + '%';
        if(pt) pt.textContent = pct + '%';
      } else if(m.status){
        const st = $('ocrstat');
        if(st) st.textContent = m.status.charAt(0).toUpperCase() + m.status.slice(1) + '…';
      }
    }
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('OCR engine initialization timed out. Please retry.')), 30000);
  });

  const w = await Promise.race([workerPromise, timeoutPromise]);
  if(ocrAbort){
    try { await w.terminate(); } catch(e) {}
    return null;
  }
  w._lang = lang;
  ocrWorker = w;
  return w;
}

async function renderPageForOcr(pNum){
  const page=await pdf.getPage(pNum),vp=page.getViewport({scale:2});
  const cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;
  const ctx=cv.getContext('2d');
  await page.render({canvasContext:ctx,viewport:vp}).promise;
  return {canvas:cv,viewport:vp};
}

async function runOcr(){
  if(!pdf)return;ocrAbort=false;
  const lang=($('ocrlang')&&$('ocrlang').value)||'eng';
  const scope=($('ocrscope')&&$('ocrscope').value)||'cur';
  const pageNums=scope==='all'?Array.from({length:pdf.numPages},(_,i)=>i+1):[cur];
  
  if($('ocrrun'))$('ocrrun').classList.add('hide');
  if($('ocrstop'))$('ocrstop').classList.remove('hide');
  if($('ocrprog'))$('ocrprog').classList.remove('hide');
  if($('ocrres'))$('ocrres').classList.add('hide');
  if($('ocrbar'))$('ocrbar').style.width='0%';
  if($('ocrpct'))$('ocrpct').textContent='0%';
  if($('ocrstat'))$('ocrstat').textContent='Initializing engine…';

  try{
    await ensureTesseract();
    if(ocrAbort)return;
    const worker=await getOcrWorker(lang);
    if(!worker||ocrAbort)return;
    let fullText='';const resultsPerPage={};

    for(let i=0;i<pageNums.length;i++){
      if(ocrAbort)break;
      const pNum=pageNums[i];
      if($('ocrstat'))$('ocrstat').textContent='Page '+pNum+' of '+pdf.numPages+': Rendering…';
      if($('ocrpct'))$('ocrpct').textContent=Math.round((i/pageNums.length)*100)+'%';
      if($('ocrbar'))$('ocrbar').style.width=Math.round((i/pageNums.length)*100)+'%';

      const {canvas,viewport}=await renderPageForOcr(pNum);
      if(ocrAbort)break;

      if($('ocrstat'))$('ocrstat').textContent='Page '+pNum+': Recognizing text…';
      const res=await worker.recognize(canvas);
      if(ocrAbort)break;

      const txt=(res.data&&res.data.text||'').trim();
      resultsPerPage[pNum]={text:txt,words:res.data&&res.data.words||[],lines:res.data&&res.data.lines||[],viewport};

      if(pageNums.length>1){
        fullText+='--- PAGE '+pNum+' ---\n'+txt+'\n\n';
      }else{
        fullText=txt;
      }
    }

    if(!ocrAbort){
      if($('ocrstat'))$('ocrstat').textContent='Complete!';
      if($('ocrpct'))$('ocrpct').textContent='100%';
      if($('ocrbar'))$('ocrbar').style.width='100%';

      if($('ocrtxt'))$('ocrtxt').value=fullText;
      const wc=fullText.trim()?fullText.trim().split(/\s+/).length:0;
      if($('ocrwords'))$('ocrwords').textContent=wc+' words detected';
      if($('ocrres'))$('ocrres').classList.remove('hide');

      const ocrd=$('ocrd');if(ocrd)ocrd._lastResults=resultsPerPage;
      window._folixOcrResults=resultsPerPage;
      for(const pNum in resultsPerPage){
        if(TL.pages[pNum]) delete TL.pages[pNum].blocks;
      }
      injectOcrText(resultsPerPage);
      msg('OCR completed');
    }
  }catch(e){
    console.error('OCR error:',e);
    const errText=(e&&e.message)||String(e);
    if($('ocrstat'))$('ocrstat').textContent='Error: '+errText;
    msg('OCR failed: '+errText);
  }finally{
    if($('ocrrun'))$('ocrrun').classList.remove('hide');
    if($('ocrstop'))$('ocrstop').classList.add('hide');
  }
}

function injectOcrText(res){
  if(!res)res=ocrd&&ocrd._lastResults;if(!res)return 0;
  let count=0;
  for(const pNum in res){
    const d=$('p'+pNum);if(!d)continue;
    let tl=d.querySelector('.textLayer');
    if(!tl){
      tl=document.createElement('div');tl.className='textLayer';
      d.insertBefore(tl,d._svg||null);
    }
    const {words}=res[pNum];
    if(words&&words.length){
      tl.innerHTML='';
      const pageScale=d._s||scale||1,s=pageScale/2.0;
      tl._s=pageScale;tl.style.transform='';
      for(const w of words){
        if(!w.text||!w.bbox)continue;
        const span=document.createElement('span');
        span.textContent=w.text+' ';
        span.style.left=(w.bbox.x0*s)+'px';
        span.style.top=(w.bbox.y0*s)+'px';
        span.style.fontSize=Math.max(8,(w.bbox.y1-w.bbox.y0)*s)+'px';
        tl.appendChild(span);
      }
      tl._done=true;count++;
    }
  }
  return count;
}

async function downloadSearchablePdf(){
  const res=window._folixOcrResults||(ocrd&&ocrd._lastResults);
  if(!res||!Object.keys(res).length)return msg('Run OCR on at least one page first');
  msg('Building searchable PDF…');
  try{
    await ensurePdfLib();
    const {PDFDocument,StandardFonts}=window.PDFLib;
    const base=await outputBytes();
    const inputBytes=(base&&base.data)||bytes;
    if(!inputBytes)return msg('Document not available');
    let doc;
    try{doc=await PDFDocument.load(inputBytes)}catch(err){console.error(err);return msg('Could not load PDF for embedding')}
    const font=await doc.embedFont(StandardFonts.Helvetica);
    const pgs=doc.getPages();
    let embeddedCount=0;
    for(const pNum in res){
      const pageIdx=Number(pNum)-1;
      if(pageIdx<0||pageIdx>=pgs.length)continue;
      const page=pgs[pageIdx];
      const {width:pW,height:pH}=page.getSize();
      const {words,viewport}=res[pNum];
      if(!words||!words.length)continue;
      const vpW=(viewport&&viewport.width)||(pW*2);
      const vpH=(viewport&&viewport.height)||(pH*2);
      const scaleX=pW/vpW,scaleY=pH/vpH;
      for(const w of words){
        if(!w.text||!w.bbox)continue;
        let txt=w.text.replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/[\u2013\u2014]/g,'-').replace(/[\u2026]/g,'...').replace(/[^\x20-\x7E\xA0-\xFF]/g,' ').trim();
        if(!txt)continue;
        try{font.encodeText(txt)}catch(e){txt=txt.replace(/[^\x20-\x7E]/g,' ').trim();if(!txt)continue}
        const wX=w.bbox.x0*scaleX;
        const wH=Math.max(4,(w.bbox.y1-w.bbox.y0)*scaleY);
        const wY=Math.max(0,pH-(w.bbox.y1*scaleY));
        try{
          page.drawText(txt,{
            x:Math.max(0,Math.min(pW-10,wX)),
            y:Math.max(0,Math.min(pH-10,wY)),
            size:Math.min(72,wH),
            font:font,
            opacity:0
          });
        }catch(drawErr){}
      }
      embeddedCount++;
    }
    const outBytes=await doc.save();
    downloadAny(outBytes,baseName()+'-searchable.pdf','application/pdf');
    msg('Downloaded searchable PDF with embedded text layer ('+embeddedCount+' page'+(embeddedCount>1?'s':'')+')');
  }catch(e){
    console.error('Failed to create searchable PDF:',e);
    msg('Failed to create searchable PDF: '+(e.message||e));
  }
}

const ocrd=$('ocrd');
if($('ocrb'))$('ocrb').onclick=()=>{if(!pdf)return;if(ocrd)ocrd.showModal()};
if($('ocrx'))$('ocrx').onclick=()=>{
  ocrAbort=true;
  if(ocrWorker){try{ocrWorker.terminate()}catch(e){}ocrWorker=null}
  if($('ocrrun'))$('ocrrun').classList.remove('hide');
  if($('ocrstop'))$('ocrstop').classList.add('hide');
  if(ocrd)ocrd.close();
};
if($('ocrrun'))$('ocrrun').onclick=runOcr;
if($('ocrstop'))$('ocrstop').onclick=()=>{
  ocrAbort=true;
  if(ocrWorker){try{ocrWorker.terminate()}catch(e){}ocrWorker=null}
  if($('ocrstat'))$('ocrstat').textContent='Stopped';
  if($('ocrrun'))$('ocrrun').classList.remove('hide');
  if($('ocrstop'))$('ocrstop').classList.add('hide');
};
if($('ocrpdf'))$('ocrpdf').onclick=downloadSearchablePdf;
if($('ocrtrans'))$('ocrtrans').onclick=async()=>{
  const res=window._folixOcrResults||(ocrd&&ocrd._lastResults);
  const pNum=cur;
  const pData=res&&res[pNum];
  const txt=(pData&&pData.text)||($('ocrtxt')&&$('ocrtxt').value)||'';
  if(!txt.trim())return msg('No OCR text found. Run OCR first.');
  if(ocrd)ocrd.close();
  setSidebar(true,true);
  setTab('trans');
  if(TL.pages[pNum]) delete TL.pages[pNum].blocks;
  await pageBlocks(pNum);
  trRun(false);
  msg('Translating OCR text for page '+pNum+'…');
};
if($('ocrcopy'))$('ocrcopy').onclick=()=>{
  const t=$('ocrtxt')&&$('ocrtxt').value;if(!t)return;
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>msg('Copied text to clipboard'));
};
if($('ocrdown'))$('ocrdown').onclick=()=>{
  const t=$('ocrtxt')&&$('ocrtxt').value;if(!t)return;
  downloadAny(t,baseName()+'-ocr.txt','text/plain');msg('Downloaded OCR text file');
};
if($('ocrspeak'))$('ocrspeak').onclick=()=>{
  const t=$('ocrtxt')&&$('ocrtxt').value;if(!t)return;
  speakPlain(t,$('ocrlang')&&$('ocrlang').value||'en');
  if(ocrd)ocrd.close();
};
if($('ocrinject'))$('ocrinject').onclick=()=>{
  const count=injectOcrText();
  if(count)msg('Injected OCR text into '+count+' page'+(count>1?'s':'')+'. Now searchable with Ctrl+F!');
  else msg('No OCR results available to inject');
};

// ============================================================================
// SECTION 31: TOP MENUS, RESIZABLE SIDEBAR, FLOATING BAR & DIALOG DISMISSAL
// ============================================================================

function closeDoc(){
  if(!pdf)return;
  if(pdf)try{pdf.destroy()}catch(e){}
  pdf=null;bytes=null;name='';
  pagesEl.innerHTML='';
  empty.classList.remove('hide');
  document.body.classList.remove('reading');
  document.title='Folix — Private, Fast, In-Browser PDF Reader';
  history.replaceState(null,'',location.pathname);
  resetSide();
  requestAnimationFrame(fitBar);
}

function handleMenuAction(action){
  switch(action){
    case 'open': if($('file'))$('file').click(); break;
    case 'dl': if(typeof download==='function')download(); else if($('dl'))$('dl').click(); break;
    case 'asave': if($('asave'))$('asave').click(); break;
    case 'png': if($('png'))$('png').click(); break;
    case 'pr': if(typeof print==='function')print(); else if($('pr'))$('pr').click(); break;
    case 'close': closeDoc(); break;
    case 'ann': if($('ann'))$('ann').click(); break;
    case 'sig': if($('sig'))$('sig').click(); break;
    case 'ptb': if($('ptb'))$('ptb').click(); break;
    case 'undo': if($('undo'))$('undo').click(); break;
    case 'redo': if($('redo'))$('redo').click(); break;
    case 'sb': if($('sb'))$('sb').click(); break;
    case 'zi': if($('zi'))$('zi').click(); break;
    case 'zo': if($('zo'))$('zo').click(); break;
    case 'fit': if(typeof fitWidth==='function')fitWidth(); else if($('fit'))$('fit').click(); break;
    case 'fith': if(typeof fitHeight==='function')fitHeight(); else if($('fith'))$('fith').click(); break;
    case 'trim': if($('trim'))$('trim').click(); break;
    case 'two': if($('two'))$('two').click(); break;
    case 'spotb': if($('spotb'))$('spotb').click(); break;
    case 'dark': if($('theme-btn'))$('theme-btn').click(); else if(typeof nextTheme==='function')nextTheme(); break;
    case 'fs': if($('fs'))$('fs').click(); break;
    case 'ocrb': if($('ocrb'))$('ocrb').click(); break;
    case 'ocrpdf': if($('ocrpdf'))$('ocrpdf').click(); else downloadSearchablePdf(); break;
    case 'tts': if($('tts'))$('tts').click(); break;
    case 'share': if($('share'))$('share').click(); break;
    case 'rclr': if($('rclr'))$('rclr').click(); break;
    case 'trdoc': setSidebar(true,true); setTab('trans'); if($('trdoc'))$('trdoc').click(); else trRun(true); break;
    case 'trpage': setSidebar(true,true); setTab('trans'); if($('trpage'))$('trpage').click(); else trRun(false); break;
    case 'trov': if($('trov'))$('trov').click(); break;
    case 'trcopy': if($('trcopy'))$('trcopy').click(); break;
    case 'trtxt': if($('trtxt'))$('trtxt').click(); break;
    case 'trpdf': if($('trpdf'))$('trpdf').click(); break;
    case 'trpng': if($('trpng'))$('trpng').click(); break;
    case 'hk': const hk=$('hk');if(hk){closePops();hk.showModal()} break;
    case 'about': location.href='about.html'; break;
    case 'faq': location.href='faq.html'; break;
    case 'contact': location.href='contact.html'; break;
  }
}

function initTopMenus(){
  const topMenus=$('top-menus');
  if(!topMenus)return;
  const menuItems=topMenus.querySelectorAll('.menu-item');

  function anyOpen(){
    return Array.from(menuItems).some(item=>item.classList.contains('open'));
  }

  menuItems.forEach(item=>{
    const btn=item.querySelector('.menu-btn');
    if(!btn)return;

    btn.addEventListener('click',e=>{
      e.stopPropagation();
      e.preventDefault();
      const wasOpen=item.classList.contains('open');
      closeAllMenus();
      closePops();
      if(!wasOpen){
        item.classList.add('open');
        btn.setAttribute('aria-expanded','true');
      }
    });

    item.addEventListener('mouseenter',()=>{
      if(anyOpen()&&!item.classList.contains('open')){
        closeAllMenus();
        item.classList.add('open');
        btn.setAttribute('aria-expanded','true');
      }
    });
  });

  topMenus.querySelectorAll('[data-action]').forEach(opt=>{
    opt.addEventListener('click',e=>{
      e.stopPropagation();
      closeAllMenus();
      handleMenuAction(opt.dataset.action);
    });
  });
}

function initSidebarResize(){
  const splitter=$('side-splitter');
  const side=$('side');
  if(!splitter||!side)return;

  try{
    const saved=localStorage.getItem('folix.sidew');
    if(saved){
      const w=parseInt(saved,10);
      if(w>=160&&w<=700)side.style.width=w+'px';
    }
  }catch(e){}

  let isDragging=false,startX=0,startW=0;
  splitter.addEventListener('pointerdown',e=>{
    e.preventDefault();
    splitter.setPointerCapture(e.pointerId);
    isDragging=true;
    startX=e.clientX;
    startW=side.getBoundingClientRect().width;
    document.body.classList.add('is-resizing');
    splitter.classList.add('active');
  });

  splitter.addEventListener('pointermove',e=>{
    if(!isDragging)return;
    const dx=e.clientX-startX;
    const maxW=Math.min(600,window.innerWidth-180);
    const newW=Math.max(160,Math.min(maxW,startW+dx));
    side.style.width=newW+'px';
  });

  const stopResize=()=>{
    if(!isDragging)return;
    isDragging=false;
    document.body.classList.remove('is-resizing');
    splitter.classList.remove('active');
    const curW=parseInt(side.style.width,10);
    if(curW){try{localStorage.setItem('folix.sidew',curW)}catch(err){}}
  };

  splitter.addEventListener('pointerup',stopResize);
  splitter.addEventListener('pointercancel',stopResize);
}

function initScreenTapToggle(){
  const m=$('main');
  if(!m)return;
  let startX=0,startY=0,startTime=0;
  m.addEventListener('pointerdown',e=>{
    startX=e.clientX;
    startY=e.clientY;
    startTime=Date.now();
  },{passive:true});

  m.addEventListener('pointerup',e=>{
    if(!pdf||mode!=='auto')return; // Tap-to-toggle ONLY functions when in auto-hide mode
    if(typeof tool!=='undefined'&&tool!=='sel'&&tool!=='pan'&&tool!==null)return;
    const dur=Date.now()-startTime;
    const dist=Math.hypot(e.clientX-startX,e.clientY-startY);
    if(dur>320||dist>12)return;
    const t=e.target;
    if(t.closest('button, a, input, select, textarea, dialog, .note-pin, .ab-tool, #spot, #spctl'))return;
    const sel=window.getSelection();
    if(sel&&sel.toString().trim().length>0)return;
    toggleBars();
  });
}

function initDialogBackdropDismiss(){
  document.querySelectorAll('dialog').forEach(dlg=>{
    dlg.addEventListener('click',e=>{
      if(e.target===dlg){
        const r=dlg.getBoundingClientRect();
        const inside=r.top<=e.clientY&&e.clientY<=r.bottom&&r.left<=e.clientX&&e.clientX<=r.right;
        if(!inside){
          if(dlg.id==='ocrd'){
            ocrAbort=true;
            if(ocrWorker){try{ocrWorker.terminate()}catch(err){}ocrWorker=null}
            if($('ocrrun'))$('ocrrun').classList.remove('hide');
            if($('ocrstop'))$('ocrstop').classList.add('hide');
          }
          dlg.close();
        }
      }
    });
  });
}

initTopMenus();
initSidebarResize();
initScreenTapToggle();
initDialogBackdropDismiss();

})();
