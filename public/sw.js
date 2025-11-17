// Service Worker for PWA - Phase 12 Enhanced
const CACHE_NAME = 'acil-v2.0.0'
const RUNTIME_CACHE = 'acil-runtime-v2'
const IMAGE_CACHE = 'acil-images-v2'
const API_CACHE = 'acil-api-v2'

// Critical resources to cache on install
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard/patients',
  '/manifest.json',
  '/offline.html',
]

// API endpoints that can be cached
const API_CACHE_URLS = [
  '/api/patients',
  '/api/workspaces',
  '/api/notifications',
  '/api/sticky-notes',
]

// Maximum cache age in milliseconds
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000 // 24 hours
const MAX_API_CACHE_AGE = 5 * 60 * 1000 // 5 minutes

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME)
        console.log('[SW] Cache opened, caching resources...')
        await cache.addAll(urlsToCache)
        console.log('[SW] Resources cached successfully')
      } catch (err) {
        console.error('[SW] Failed to cache resources:', err)
      }
    })()
  )
  self.skipWaiting()
})

// Fetch event - Advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // Handle different types of requests with appropriate strategies
  if (request.method !== 'GET') {
    // Don't cache non-GET requests
    return
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Images - Cache first, fallback to network
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE))
    return
  }

  // Static assets - Stale while revalidate
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(staleWhileRevalidateStrategy(request))
    return
  }

  // HTML pages - Network first with offline fallback
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // Default - Network first
  event.respondWith(networkFirstStrategy(request))
})

// Network first strategy - tries network, falls back to cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('[SW] Network failed, serving from cache:', request.url)
      return cachedResponse
    }

    throw error
  }
}

// Cache first strategy - serves from cache, updates cache in background
async function cacheFirstStrategy(request, cacheName = RUNTIME_CACHE) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    // Return cached response immediately
    // Update cache in background
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(cacheName).then((cache) => {
            cache.put(request, networkResponse)
          })
        }
      })
      .catch(() => {
        // Ignore network errors when updating cache
      })

    return cachedResponse
  }

  // Not in cache, fetch from network
  const networkResponse = await fetch(request)

  if (networkResponse && networkResponse.status === 200) {
    const cache = await caches.open(cacheName)
    cache.put(request, networkResponse.clone())
  }

  return networkResponse
}

// Stale while revalidate - returns cache immediately, updates in background
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request)

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      caches.open(RUNTIME_CACHE).then((cache) => {
        cache.put(request, networkResponse.clone())
      })
    }
    return networkResponse
  })

  return cachedResponse || fetchPromise
}

// Network first with offline fallback page
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline fallback page
    const offlinePage = await caches.match('/offline.html')
    if (offlinePage) {
      return offlinePage
    }

    // Last resort - return a basic response
    return new Response('<h1>Offline</h1><p>İnternet bağlantınızı kontrol edin.</p>', {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, API_CACHE]

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )

      // Clean up expired cache entries
      await cleanExpiredCaches()

      console.log('[SW] Service worker activated')
    })()
  )

  // Take control of all clients immediately
  self.clients.claim()
})

// Clean expired cache entries
async function cleanExpiredCaches() {
  const cache = await caches.open(API_CACHE)
  const requests = await cache.keys()

  await Promise.all(
    requests.map(async (request) => {
      const response = await cache.match(request)
      if (response) {
        const dateHeader = response.headers.get('date')
        if (dateHeader) {
          const cacheTime = new Date(dateHeader).getTime()
          const now = Date.now()

          if (now - cacheTime > MAX_API_CACHE_AGE) {
            console.log('[SW] Deleting expired cache entry:', request.url)
            await cache.delete(request)
          }
        }
      }
    })
  )
}

// Background sync for offline actions - Phase 12 Enhanced
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag)

  if (event.tag === 'sync-patients') {
    event.waitUntil(syncPatients())
  } else if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes())
  } else if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions())
  }
})

async function syncPatients() {
  console.log('[SW] Syncing patients data...')
  try {
    // Get pending patient updates from IndexedDB or localStorage
    const pendingUpdates = await getPendingUpdates('patients')

    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/patients', {
          method: update.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data),
        })

        if (response.ok) {
          await removePendingUpdate('patients', update.id)
          console.log('[SW] Patient sync successful:', update.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync patient:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Patient sync failed:', error)
  }
}

async function syncNotes() {
  console.log('[SW] Syncing notes...')
  // Similar implementation for notes
}

async function syncOfflineActions() {
  console.log('[SW] Syncing offline actions...')
  // Sync any offline actions stored locally
}

// Helper functions for background sync (these interact with IndexedDB)
async function getPendingUpdates(type) {
  // TODO: Implement IndexedDB logic
  return []
}

async function removePendingUpdate(type, id) {
  // TODO: Implement IndexedDB logic
}

// Periodic background sync (for supported browsers)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag)

  if (event.tag === 'refresh-data') {
    event.waitUntil(refreshData())
  }
})

async function refreshData() {
  console.log('[SW] Refreshing data in background...')
  // Pre-cache frequently accessed data
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
