const CACHE_NAME = "phr-cache-v2";
const NAVIGATION_FALLBACKS = ["/ko", "/"];
const STATIC_ASSETS = [
  "/",
  "/ko",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/og-image.png",
];
const NAVIGATION_TIMEOUT_MS = 4000;

function isLocalAsset(url) {
  if (url.origin !== self.location.origin) {
    return false;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    return true;
  }

  if (url.pathname.startsWith("/cards/") || url.pathname.startsWith("/chips/")) {
    return true;
  }

  return /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname);
}

async function putInCache(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") {
    return;
  }
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);

        if (cached) {
          event.waitUntil(
            fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS)
              .then((response) => putInCache(request, response))
              .catch(() => undefined),
          );
          return cached;
        }

        try {
          const fresh = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
          event.waitUntil(putInCache(request, fresh));
          return fresh;
        } catch {
          for (const fallbackPath of NAVIGATION_FALLBACKS) {
            const fallback = await cache.match(fallbackPath);
            if (fallback) {
              return fallback;
            }
          }
          return Response.redirect("/ko", 302);
        }
      })(),
    );
    return;
  }

  if (isLocalAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);

        if (cached) {
          event.waitUntil(
            fetch(request)
              .then((response) => putInCache(request, response))
              .catch(() => undefined),
          );
          return cached;
        }

        try {
          const fresh = await fetch(request);
          event.waitUntil(putInCache(request, fresh));
          return fresh;
        } catch {
          return Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
