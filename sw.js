const CACHE_NAME = "hub-infodose-cache-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./apps/apps.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];

self.addEventListener("install", (e)=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (e)=>{
  e.waitUntil(
    Promise.all([
      caches.keys().then(keys=>
        Promise.all(keys.map(k=>k!==CACHE_NAME && caches.delete(k)))
      ),
      clients.claim()
    ])
  );
});

self.addEventListener("fetch", (e)=>{
  const req = e.request;
  // network-first for html, cache-first for others
  if(req.mode === "navigate" || (req.destination === "document")){
    e.respondWith(
      fetch(req).then(resp=>{
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c=>c.put(req, copy));
        return resp;
      }).catch(()=>caches.match(req))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(resp => resp || fetch(req))
  );
});
