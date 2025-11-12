// Service Worker for PWA
const CACHE_NAME = 'acil-v1'
const urlsToCache = ['/', '/patients', '/manifest.json']

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache')
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('Failed to cache some resources:', err)
      })
    })
  )
  self.skipWaiting()
})

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }

      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  // Implement background sync logic here
  console.log('Syncing data in background')
}

// Push notification - Phase 6 Enhanced
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)

  if (!event.data) {
    console.log('[SW] Push event but no data')
    return
  }

  let notificationData
  try {
    notificationData = event.data.json()
  } catch (error) {
    console.error('[SW] Failed to parse push data:', error)
    notificationData = {
      title: 'ACIL Bildirimi',
      body: event.data.text(),
    }
  }

  const { title, body, icon, badge, image, data, tag, requireInteraction, severity, actions } =
    notificationData

  const options = {
    body: body || 'Yeni bildirim',
    icon: icon || '/icon-192.png',
    badge: badge || '/icon-192.png',
    image: image,
    data: {
      dateOfArrival: Date.now(),
      ...data,
    },
    tag: tag || 'acil-notification',
    requireInteraction: severity === 'critical' || requireInteraction || false,
    vibrate: severity === 'critical' ? [200, 100, 200, 100, 200] : [200, 100, 200],
    actions: actions || [
      {
        action: 'view',
        title: 'Görüntüle',
      },
      {
        action: 'dismiss',
        title: 'Kapat',
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(title || 'ACIL', options))
})

// Notification click - Phase 6 Enhanced
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event)

  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  // Get the action URL from notification data
  const actionUrl = event.notification.data?.action_url || '/dashboard'
  const fullUrl = new URL(actionUrl, self.location.origin).href

  // Open or focus the client
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === fullUrl && 'focus' in client) {
            return client.focus()
          }
        }

        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(fullUrl)
        }
      })
      .catch((error) => {
        console.error('[SW] Error handling notification click:', error)
      })
  )
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event)
})

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
