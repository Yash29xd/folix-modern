/**
 * @file sw.js
 * @description Folix Service Worker: Offline Application Shell & Web Share Target.
 *
 * Responsibilities:
 * 1. Offline Pre-caching:
 *    During `install`, pre-caches all critical application shell assets, fonts, icons,
 *    pages, and bundled PDF engine libraries, enabling full offline functionality.
 *
 * 2. Cache Invalidation & Activation:
 *    During `activate`, removes obsolete cache stores (except the active `CACHE` and
 *    ephemeral `SHARE` cache), then claims control over existing clients immediately via `clients.claim()`.
 *
 * 3. Cache-First with Background Revalidation Fetch Strategy:
 *    Same-origin GET requests serve cached responses instantly while asynchronously
 *    fetching and updating the cache in the background (`e.waitUntil(net)`).
 *    Provides navigation fallback to `index.html` for offline routing.
 *
 * 4. Android Web Share Target Interception:
 *    Handles incoming multipart POST requests sent to `/share-target`. Extracts the uploaded
 *    PDF blob, temporarily stores it in the `folix-share` cache, and redirects the client
 *    to `index.html?shared=1` where `app.js` retrieves and displays the file.
 */

/** Primary cache name containing application assets. Increment hash on file changes. */
/** Ephemeral cache name used to transport shared files from Web Share Target to the client. */
const CACHE='folix-modern-3.3',SHARE='folix-share';

/**
 * Complete manifest of static assets pre-cached for offline availability.
 * All paths are relative to the service worker scope.
 * @type {string[]}
 */
const ASSETS=[
 "./",
 "./about.html",
 "./app.js",
 "./assets/apple-touch-icon.png",
 "./assets/branding.png",
 "./assets/favicon-32.png",
 "./assets/filetype-128.png",
 "./assets/filetype-256.png",
 "./assets/filetype-32.png",
 "./assets/filetype-48.png",
 "./assets/filetype-64.png",
 "./assets/floppersblop-product-dark.png",
 "./assets/floppersblop-product.png",
 "./assets/folix-lockup-dark.png",
 "./assets/folix-lockup.png",
 "./assets/fonts/archivo-black-latin-400-normal.woff2",
 "./assets/fonts/dancing-script-latin-600-normal.woff2",
 "./assets/fonts/space-mono-latin-400-normal.woff2",
 "./assets/fonts/space-mono-latin-700-normal.woff2",
 "./assets/icon-192.png",
 "./assets/icon-512.png",
 "./assets/icon-maskable-512.png",
 "./assets/icon.png",
 "./assets/icons/close.svg",
 "./assets/icons/contrast.svg",
 "./assets/icons/download.svg",
 "./assets/icons/eraser.svg",
 "./assets/icons/fit-height.svg",
 "./assets/icons/fit-width.svg",
 "./assets/icons/fullscreen.svg",
 "./assets/icons/highlight.svg",
 "./assets/icons/image.svg",
 "./assets/icons/marker.svg",
 "./assets/icons/menu.svg",
 "./assets/icons/more.svg",
 "./assets/icons/next.svg",
 "./assets/icons/note.svg",
 "./assets/icons/ocr.svg",
 "./assets/icons/open.svg",
 "./assets/icons/pages-edit.svg",
 "./assets/icons/pen.svg",
 "./assets/icons/pin.svg",
 "./assets/icons/prev.svg",
 "./assets/icons/print.svg",
 "./assets/icons/redo.svg",
 "./assets/icons/rotate.svg",
 "./assets/icons/search.svg",
 "./assets/icons/share.svg",
 "./assets/icons/sidebar.svg",
 "./assets/icons/signature.svg",
 "./assets/icons/speaker.svg",
 "./assets/icons/spotlight.svg",
 "./assets/icons/textbox.svg",
 "./assets/icons/translate.svg",
 "./assets/icons/trim.svg",
 "./assets/icons/two-page.svg",
 "./assets/icons/undo.svg",
 "./assets/icons/zoom-in.svg",
 "./assets/icons/zoom-out.svg",
 "./config.js",
 "./contact.html",
 "./copyright.html",
 "./disclaimer.html",
 "./faq.html",
 "./index.html",
 "./lib/pdf-lib.min.js",
 "./lib/pdf.min.js",
 "./lib/pdf.worker.min.js",
 "./lib/ocr/tesseract.min.js",
 "./lib/ocr/worker-bundle.js",
 "./lib/ocr/lang/ita.js",
 "./lib/ocr/lang/eng.js",
 "./lib/ocr/lang/ita.traineddata",
 "./lib/ocr/lang/eng.traineddata",
 "./privacy.html",
 "./site.webmanifest",
 "./styles.css",
 "./terms.html"
];

/**
 * Service Worker Installation event listener.
 * Pre-caches all manifest assets and activates immediately without waiting for existing clients to close.
 */
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));

/**
 * Service Worker Activation event listener.
 * Purges obsolete cache buckets and takes immediate control of all open client tabs.
 */
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE&&n!==SHARE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));

/**
 * Handles Web Share Target multipart POST requests.
 * Stashes the incoming PDF stream into cache storage and issues a 303 See Other redirect.
 *
 * @param {Request} req - The incoming POST request containing multipart/form-data.
 * @returns {Promise<Response>} Redirect response pointing to `index.html?shared=1`.
 */
async function handleShare(req){
  try{
    const fd=await req.formData(),f=fd.get('pdf');
    if(f&&f.size){const c=await caches.open(SHARE);await c.put('shared-file',new Response(f,{headers:{'content-type':'application/pdf','x-name':encodeURIComponent(f.name||'shared.pdf')}}))}
  }catch(e){}
  return Response.redirect(new URL('index.html?shared=1',self.registration.scope).href,303);
}

/**
 * Service Worker Fetch event listener.
 * Intercepts network requests to serve cached assets offline and handle share target routing.
 */
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method==='POST'&&url.pathname.endsWith('/share-target')){const site=req.headers.get('sec-fetch-site');if(site&&site!=='same-origin'&&site!=='none'){e.respondWith(new Response('Forbidden',{status:403}));return}e.respondWith(handleShare(req));return}
  if(req.method!=='GET'||url.origin!==location.origin)return;
  if(url.search&&url.search.includes('v=')){
    e.respondWith((async()=>{
      const c=await caches.open(CACHE),key=url.origin+url.pathname;
      try{
        const r=await fetch(req);
        if(r&&r.ok&&r.type==='basic'){c.put(key,r.clone());c.put(req.url,r.clone())}
        return r;
      }catch(_){
        return (await c.match(req.url))||(await c.match(key))||Response.error();
      }
    })());
    return;
  }
  e.respondWith((async()=>{
    const c=await caches.open(CACHE),key=url.origin+url.pathname,hit=await c.match(key);
    const net=fetch(req).then(r=>{if(r&&r.ok&&r.type==='basic')c.put(key,r.clone());return r}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    const r=await net;if(r)return r;
    if(req.mode==='navigate'){const i=await c.match(new URL('index.html',self.registration.scope).href);if(i)return i}
    return Response.error();
  })());
});
