const CACHE = 'shiori-2026-08-29-3';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS).catch(function(){}); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if (hit) {
        fetch(e.request).then(function(res){
          if (res && res.status === 200) caches.open(CACHE).then(function(c){ c.put(e.request, res.clone()); });
        }).catch(function(){});
        return hit;
      }
      return fetch(e.request).then(function(res){
        if (res && res.status === 200 && (e.request.url.indexOf('fonts.g') > -1 || e.request.url.indexOf(self.registration.scope) === 0)) {
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){ return caches.match('./index.html'); });
    })
  );
});
