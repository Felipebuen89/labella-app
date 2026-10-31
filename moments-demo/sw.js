/* White-label demo: app shell e notificação opcional */
const CACHE='franchise-white-label-shell-v1';
const STATIC=['/','/franquia/','/brand-config.js','/white-label.css','/manifest.webmanifest','/icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(async cache=>{
  for(const url of STATIC){try{await cache.add(url)}catch(e){}}
 }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(key=>key.startsWith('franchise-white-label-shell-')&&key!==CACHE).map(key=>caches.delete(key))
 )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
  const target=new URL(event.request.url).pathname.startsWith('/franquia/')?'/franquia/':'/';
  event.respondWith(fetch(event.request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(target,copy)).catch(()=>{})}
   return response;
  }).catch(()=>caches.match(target)));
 }
});
self.addEventListener('push',event=>{
 let data={};try{data=event.data?event.data.json():{}}catch{data={body:event.data?.text()||''}}
 event.waitUntil(self.registration.showNotification(String(data.title||'Sua Franquia'),{
  body:String(data.body||'Novo aviso da franquia'),
  icon:'/icon.svg',
  tag:String(data.tag||'franchise-white-label'),data:{url:'/'}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{
  for(const client of clients)if(client.url.startsWith(self.registration.scope)&&'focus' in client)return client.focus();
  return self.clients.openWindow('/');
 }));
});
