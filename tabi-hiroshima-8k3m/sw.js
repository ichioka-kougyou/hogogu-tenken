const CACHE = 'shiori-2026-08-30-1';
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

  /* しおり本体は、ネットがあれば必ず最新を取る。圏外のときだけキャッシュから出す。 */
  var isPage = e.request.mode === 'navigate' || e.request.destination === 'document';
  if (isPage) {
    e.respondWith(
      fetch(e.request).then(function(res){
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
        }
        return res;
      }).catch(function(){
        return caches.match('./index.html').then(function(hit){ return hit || caches.match('./'); });
      })
    );
    return;
  }

  /* アイコンや書体はキャッシュ優先（そのほうが速い） */
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if (hit) return hit;
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
