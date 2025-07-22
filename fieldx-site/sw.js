const CACHE_NAME = 'fieldx-cache-v2'; // Atualize a versão quando fizer mudanças
const OFFLINE_CACHE = 'fieldx-offline-data';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/firebase-config.js',
  '/img/logo-fieldx.png',
  '/img/offline.jpg',
  '/manifest.json'
];

// Instalação - Cache dos arquivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Ativação - Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME && name !== OFFLINE_CACHE)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Estratégia: Cache-first para arquivos estáticos
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') return;
  
  // Para URLs da API, usa network-first
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Para arquivos estáticos, usa cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Sincronização offline (Background Sync)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Função para sincronizar dados offline
async function syncOfflineData() {
  const cache = await caches.open(OFFLINE_CACHE);
  const keys = await cache.keys();
  
  for (const request of keys) {
    try {
      const response = await cache.match(request);
      const data = await response.json();
      
      // Envia para a API (substitua pela sua URL)
      const apiResponse = await fetch('https://sua-api.com/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(data)
      });
      
      if (apiResponse.ok) {
        await cache.delete(request);
      }
    } catch (error) {
      console.error('Falha na sincronização:', error);
    }
  }
}