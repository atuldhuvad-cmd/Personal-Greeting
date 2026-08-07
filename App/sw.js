const CACHE="daily-inspiration-v2-3-2-phase1";
const FILES=["./","./index.html","./manifest.webmanifest","./data/content.js","./assets/icon-192.png","./assets/icon-512.png","./assets/apple-touch-icon.png","./assets/favicon.ico","./artwork/BuiltIn/executive-blue.jpg","./artwork/BuiltIn/nature-green.jpg","./artwork/BuiltIn/classic-gold.jpg","./artwork/BuiltIn/premium-gift.jpg","./artwork/BuiltIn/black-and-gold-luxury.jpg","./artwork/BuiltIn/navy-ribbon-premium.jpg","./artwork/BuiltIn/white-marble.jpg","./artwork/BuiltIn/marble-with-cake.jpg","./artwork/BuiltIn/burgundy-luxury.jpg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
