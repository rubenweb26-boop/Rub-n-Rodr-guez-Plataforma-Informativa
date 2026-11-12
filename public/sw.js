const CACHE = 'ruben-public-shell-v2';
const SHELL = ['/offline.html', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', event => { 
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))); 
  self.skipWaiting(); 
});

self.addEventListener('activate', event => { 
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))); 
  self.clients.claim(); 
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful navigation responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match('/offline.html'))
    );
  } else if (SHELL.includes(new URL(request.url).pathname)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});

// Background Sync for offline complaints
self.addEventListener('sync', event => {
  if (event.tag === 'complaint-sync') {
    event.waitUntil(syncComplaints());
  }
});

// Periodic sync for complaint submissions
async function syncComplaints() {
  try {
    // Get pending complaints from IndexedDB via postMessage to main thread
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_COMPLAINTS',
        timestamp: Date.now(),
      });
    }
    
    console.log('[SW] Triggered complaint sync via postMessage to clients');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', event => {
  if (event.data?.type === 'SYNC_COMPLETE') {
    console.log('[SW] Sync completed:', event.data);
  }
});

// Push notification support (future enhancement)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: [
        { action: 'view', title: 'Ver' },
        { action: 'dismiss', title: 'Descartar' },
      ],
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          if (client.url.includes('/mi-cuenta') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/mi-cuenta');
        }
      })
    );
  }
});