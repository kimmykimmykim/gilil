// 길일 앱 서비스워커 v1.0
const CACHE_NAME = 'gilil-v1';
const ASSETS = [
  '/gilil/',
  '/gilil/index.html',
  '/gilil/privacy.html',
  '/gilil/manifest.json',
  'https://cdn.jsdelivr.net/npm/solarlunar@2.0.7/lib/solarlunar.min.js',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Serif+KR:wght@400;600;900&family=Noto+Sans+KR:wght@300;400;500&display=swap'
];

// 설치 — 핵심 파일 캐시
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.log('캐시 일부 실패 (무시 가능):', err);
      });
    })
  );
  self.skipWaiting();
});

// 활성화 — 오래된 캐시 삭제
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 — 캐시 우선, 실패 시 네트워크
self.addEventListener('fetch', function(e) {
  // POST 요청은 캐시 안 함
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        // 유효한 응답만 캐시
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      }).catch(function() {
        // 오프라인 — 메인 페이지 반환
        return caches.match('/gilil/');
      });
    })
  );
});
