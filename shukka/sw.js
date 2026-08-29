// 圏外でもアプリが開けるようにする係。
// 電波があるときは常に最新版を取りに行き、なければ手元の控えで立ち上げる。
const CACHE = 'shukka-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './shukka-icon-180.png',
  './shukka-icon-192.png',
  './shukka-icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 記録のやり取り（Supabaseなど外部）は素通し。控えない
  if (url.origin !== location.origin) return;

  // 画面本体：まずネットの最新版。だめなら手元の控え
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // アイコンなど：手元の控え優先（無ければ取りに行って控える）
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});
