/* Moments Paris - Service Worker (instalacao, cache de app e recebimento web push) */
const CACHE='moments-paris-shell-v1';
const SHELL=['./','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('moments-paris-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./',copy)).catch(()=>{})}return response}).catch(()=>caches.match('./')));
 }
});
self.addEventListener('push',event=>{
 let payload={};try{payload=event.data?event.data.json():{}}catch(e){payload={body:event.data?event.data.text():''}};
 const title=String(payload.title||'Moments Paris');
 const body=String(payload.body||'Você tem um novo comunicado da franquia.');
 event.waitUntil(self.registration.showNotification(title,{body,icon:'./icon.svg',badge:'./icon.svg',tag:payload.tag||'moments-paris-aviso',renotify:true,data:{url:'./'}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
  const url=new URL('./',self.registration.scope).href;
  for(const client of clients){if(client.url.startsWith(self.registration.scope)&&'focus' in client)return client.focus()}
  return self.clients.openWindow(url);
 }));
});
