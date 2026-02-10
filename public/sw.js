// Minimal service worker for PWA install reliability
// NO caching of API requests or auth routes

self.addEventListener("install", (event) => {
    console.log("Service Worker: Installing...");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("Service Worker: Activating...");
    event.waitUntil(self.clients.claim());
});

// Fetch handler - pass through all requests (no caching)
self.addEventListener("fetch", (event) => {
    // Let all requests go through to the network
    // This ensures auth, sessions, and API calls work normally
    event.respondWith(fetch(event.request));
});
