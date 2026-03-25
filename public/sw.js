const CACHE_NAME = "reportflow-v2-dynamic";

const STATIC_ASSETS = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

const isStaticAssetRequest = (request) => {
  const url = new URL(request.url);
  return (
    request.method === "GET" &&
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_expo/") ||
      url.pathname.startsWith("/assets/") ||
      request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "image" ||
      request.destination === "font")
  );
};

const shouldCacheResponse = (request, response) => {
  if (!response || response.status !== 200 || response.type !== "basic") {
    return false;
  }

  const contentType = response.headers.get("content-type") || "";
  if (request.mode === "navigate") {
    return contentType.includes("text/html");
  }

  if (isStaticAssetRequest(request)) {
    return !contentType.includes("text/html");
  }

  return false;
};

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.hostname.includes("supabase.co") || url.hostname.includes("googleapis.com")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (shouldCacheResponse(request, networkResponse)) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || caches.match("/index.html");
        })
    );
    return;
  }

  if (isStaticAssetRequest(request)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (shouldCacheResponse(request, networkResponse)) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
