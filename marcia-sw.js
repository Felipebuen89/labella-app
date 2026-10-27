/* Service worker exclusivo das prévias de notificações MC.
   Sem envio remoto ativo: precisa de servidor Web Push e consentimento autenticado. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  let payload={};try{payload=event.data?.json()||{}}catch(e){payload={body:event.data?.text()||''}}
  const title=String(payload.title||'Márcia Calixto').slice(0,90);
  const body=String(payload.body||'Você tem uma novidade.').slice(0,240);
  event.waitUntil(self.registration.showNotification(title,{
    body,tag:'mc-campaign-'+String(payload.tag||Date.now()).slice(0,30),
    icon:'marcia-app-icon.svg',badge:'marcia-app-icon.svg',
    data:{url:'marcia-app.html'},renotify:false
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL('marcia-app.html',self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async all=>{
    const same=all.find(c=>c.url&&c.url.startsWith(self.registration.scope));
    if(same){await same.focus();return}
    await self.clients.openWindow(target);
  }));
});
