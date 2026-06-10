/**
 * Service Worker for Campus Survival OS
 * Implements offline mode and asset caching (P3 - Future Roadmap)
 */

const CACHE_NAME = 'campusos-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/js/app.js',
    '/js/router.js',
    '/js/store/globalState.js',
    '/js/api/client.js',
    '/js/api/endpoints.js',
    '/js/api/cacheService.js',
    '/js/utils/constants.js',
    '/js/utils/validators.js',
    '/js/utils/formatters.js',
    '/js/utils/gpaCalculator.js',
    '/js/utils/session.js',
    '/js/utils/requestQueue.js',
    '/js/components/Toast.js',
    '/js/components/Header.js',
    '/js/components/Sidebar.js',
    '/js/components/Modal.js',
    '/js/components/LoadingSpinner.js',
    '/manifest.json',
    '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and API calls
    if (event.request.method !== 'GET' || event.request.url.includes('/api/') || event.request.url.includes('script.google.com')) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached response
                return cachedResponse;
            }
            
            // Try network
            return fetch(event.request).then((networkResponse) => {
                // Cache successful responses
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Offline fallback
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                return new Response('Offline - Campus Survival OS', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});
