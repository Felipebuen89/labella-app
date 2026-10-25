/* La'Bella — service worker de notificacoes (prova de conceito). Sem cache de dados. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = {body: event.data ? event.data.text() : ''}; }
  event.waitUntil(self.registration.showNotification(String(data.title || 'La’Bella • Demonstração'), {
    body: String(data.body || 'Você tem uma novidade no aplicativo.'),
    icon: './icon-192.png', badge: './icon-192.png',
    tag: String(data.tag || 'labella-notificacao'), 
    data: {url: './'}
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async list => {
    for (const client of list) { if (client.url.includes('/labella-app/') && 'focus' in client) return client.focus(); }
    if (clients.openWindow) return clients.openWindow('./');
  }));
});