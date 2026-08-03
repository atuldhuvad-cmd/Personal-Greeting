const CACHE="daily-inspiration-v1-2-event-designs";
const FILES=["./","./index.html","./manifest.webmanifest","./Personal_Greeting_Event_Design_Verification.html","./data/India_Inspiration_Studio_2026_365_Day_Content_v0_6.csv"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
