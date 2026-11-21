/* ==========================================================================
   TweackTech LMS Service Worker
   - App-shell and static asset caching (offline support)
   - Network-first API caching with offline fallback
   - Offline fallback page for navigations
   ========================================================================== */

const VERSION = 'v20';
const STATIC_CACHE = `tweacktech-static-${VERSION}`;
const RUNTIME_CACHE = `tweacktech-runtime-${VERSION}`;
const API_CACHE = `tweacktech-api-${VERSION}`;
const IMAGE_CACHE = `tweacktech-images-${VERSION}`;

const PRECACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

const API_CACHE_PATTERNS = [/\/api\/courses/, /\/api\/blog/, /\/api\/jobs/];

// The Cache API stores decoded bodies, but keeps the original headers. A
// cached response that still says `content-encoding: br` or `gzip` fails to
// decode when it is served again (e.g. as an offline navigation), so strip
// the transport headers and rebuild the response.
const cleanResponse = (response) => {
  if (!response || !response.body) return response;
  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const putInCache = (cacheName, request, response) =>
  caches
    .open(cacheName)
    .then((cache) => cache.put(request, cleanResponse(response)))
    .catch(() => undefined);

const isCacheable = (response) => response && response.status === 200;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE.map(async (url) => {
            try {
              const response = await fetch(url, { cache: 'reload' });
              if (isCacheable(response)) {
                await cache.put(url, cleanResponse(response.clone()));
              }
            } catch {
              // Ignore individual precache failures; the app still works online.
            }
          })
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                ![STATIC_CACHE, RUNTIME_CACHE, API_CACHE, IMAGE_CACHE].includes(key)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const isStaticAsset = (request, url) =>
  ['script', 'style', 'font', 'manifest'].includes(request.destination) ||
  /\.(?:js|css|woff2?|ttf|eot|svg|png|jpe?g|webp|gif|ico|json)$/i.test(
    url.pathname
  );

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  // Never cache auth or private endpoints.
  if (
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/users') ||
    url.pathname.startsWith('/api/enrollments') ||
    url.pathname.startsWith('/api/assignments') ||
    url.pathname.startsWith('/api/certificates')
  ) {
    return;
  }

  // API: network first, cache last successful response for offline reading.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE, 8000));
    return;
  }

  // Images: cache first, then network.
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Compiled JS/CSS/fonts: cache first (hashed by CRA, safe to keep).
  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML navigations: network first, fall back to cached shell/offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheable(response)) putInCache(RUNTIME_CACHE, request, response.clone());
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreVary: true });
          if (cached) return cached;
          // Rebuild the shell as a fresh response: a raw cached response can
          // carry encoding/Vary metadata that makes it unusable offline.
          const shell = await caches.match('/', { ignoreVary: true });
          if (shell) {
            return new Response(await shell.text(), {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          }
          const offline = await caches.match('/offline.html', { ignoreVary: true });
          if (offline) {
            return new Response(await offline.text(), {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          }
          return Response.error();
        })
    );
    return;
  }

  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (isCacheable(response)) await putInCache(cacheName, request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

async function networkFirst(request, cacheName, timeoutMs = 0) {
  try {
    const fetchPromise = fetch(request).then((response) => {
      if (isCacheable(response)) {
        const url = new URL(request.url);
        if (
          url.pathname.startsWith('/api/') &&
          !API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))
        ) {
          return response;
        }
        putInCache(cacheName, request, response.clone());
      }
      return response;
    });

    if (!timeoutMs) return await fetchPromise;

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    );
    return await Promise.race([fetchPromise, timeout]);
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ success: false, message: 'You are offline.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Background sync placeholder: replayed when connectivity returns.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(Promise.resolve());
  }
});

// Push notifications (opt-in; no-op until a push service is configured).
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'TweackTech', body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'TweackTech', {
      body: payload.body || 'You have a new update.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: payload.data || { url: '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
