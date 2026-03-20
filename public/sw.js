// public/sw.js
const CACHE_NAME = 'reportflow-v1-dynamic';

// Archivos críticos que SIEMPRE deben estar (App Shell)
// Nota: En Vite los nombres de JS cambian (hashing), así que confiamos 
// en el caching dinámico (abajo) para guardarlos conforme se usan.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// 1. INSTALACIÓN: Pre-carga lo básico
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando y cacheando app shell...');
  self.skipWaiting(); // Fuerza la activación inmediata
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 2. ACTIVACIÓN: Limpia cachés viejos si cambias la versión
self.addEventListener('activate', (event) => {
  console.log('[SW] Activado. Limpiando cachés antiguos...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Borrando caché viejo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Controla la página inmediatamente
});

// 3. INTERCEPTOR DE RED (El cerebro offline)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. IGNORAR SUPABASE Y APIS EXTERNAS
  // Dejamos que tu código de React + Dexie maneje los datos.
  // El SW solo se encarga de que la "cáscara" de la app cargue.
  if (url.hostname.includes('supabase.co') || url.hostname.includes('googleapis.com')) {
    return; // Pasa directo a la red (o falla si no hay, y tu código React lo maneja)
  }

  // B. ESTRATEGIA: "Stale-While-Revalidate" para archivos estáticos (JS, CSS, Imágenes)
  // 1. Intenta servir desde caché rápido.
  // 2. En segundo plano, va a la red a buscar una versión nueva para la próxima vez.
  // 3. Si no hay red, se queda con lo del caché.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Si la respuesta es válida, actualizamos el caché
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si falla la red, no hacemos nada extra aquí porque ya intentamos
          // devolver el cachedResponse abajo.
        });

      // Devuelve lo que haya en caché, o espera a la red si no hay nada
      return cachedResponse || fetchPromise;
    })
  );
});