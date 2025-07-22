const CACHE_NAME = 'fieldx-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/firebase-config.js',
  '/img/logo-fieldx.png',
  '/img/offline.jpg'
];

// 1. Instalação - Cache dos arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 2. Intercepta todas as requisições
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// 3. Sincronização quando a conexão volta (separado do fetch)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('Sincronizando dados offline...');
    event.waitUntil(syncOfflineData());
  }
});

// 4. Função para sincronizar dados offline
async function syncOfflineData() {
  // Aqui você implementaria a lógica para:
  // 1. Verificar se há dados salvos localmente
  // 2. Enviar esses dados para o servidor
  // 3. Limpar os dados locais após sucesso
  
  console.log('Dados offline sincronizados com sucesso!');
  
  // Exemplo básico (você precisará adaptar):
  const cache = await caches.open('offline-data');
  const keys = await cache.keys();
  
  for (const request of keys) {
    try {
      const response = await cache.match(request);
      const data = await response.json();
      
      // Envia para o servidor (substitua pela sua API)
      await fetch('https://sua-api.com/sync', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      // Remove do cache se enviado com sucesso
      await cache.delete(request);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    }
  }
}