// 캐시 이름 및 리소스 목록
const CACHE_NAME = 'rullet-cache-v1';
const urlsToCache = [
  '.',
  'index.html',
  'icon.png',
  'og_image.png',
  'manifest.json',
  'sw.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js'
];

// 설치 이벤트: 리소스 캐싱
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 활성화 이벤트: 오래된 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 페치 이벤트: 네트워크 우선, 실패 시 캐시 리턴
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 요청한 리소스를 캐시에 추가
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 네트워크 통신 실패 시 캐시에서 제공
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || new Response('오프라인 상태입니다.');
        });
      })
  );
});
