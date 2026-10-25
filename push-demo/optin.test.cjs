'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

const html=fs.readFileSync(path.resolve(__dirname,'../notificacoes.html'),'utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n');
async function waitFor(fn){for(let i=0;i<150;i++){if(fn())return;await new Promise(r=>setTimeout(r,10))}throw Error('Timeout UI');}
function setup({platform='android',installed=false,permission='default'}={}){
 const calls=[];
 const sub={endpoint:'https://fcm.googleapis.com/fcm/send/testing',keys:{p256dh:'key',auth:'auth'},toJSON(){return {endpoint:this.endpoint,keys:this.keys}}};
 const registration={pushManager:{async getSubscription(){return null},async subscribe(){calls.push('subscribe');return sub}},async showNotification(){calls.push('showNotification')}};
 const dom=new JSDOM(html,{url:'https://felipebuen89.github.io/labella-app/notificacoes.html',runScripts:'outside-only',pretendToBeVisual:true,
 beforeParse(win){
  Object.defineProperty(win,'isSecureContext',{configurable:true,value:true});
  win.matchMedia=()=>({matches:installed});
  Object.defineProperty(win.navigator,'userAgent',{configurable:true,value:platform==='android'?'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15'});
  Object.defineProperty(win.navigator,'serviceWorker',{configurable:true,value:{register:async()=>registration,ready:Promise.resolve(registration)}});
  win.Notification={permission,async requestPermission(){calls.push('permission');win.Notification.permission='granted';return 'granted'}};
  win.fetch=async(url,opt)=>{
   const route=new URL(String(url)).pathname;
   calls.push(route);
   if(route==='/public-config')return {ok:true,status:200,json:async()=>({vapidPublicKey:'AQIDBAU'})};
   if(route==='/public-subscribe')return {ok:true,status:201,json:async()=>({ok:true,persistent:true,deviceId:'uuid'}),body:opt.body};
   if(route==='/public-unsubscribe')return {ok:true,status:200,json:async()=>({ok:true,removed:true})};
   throw Error('Rota não esperada: '+route);
  };
 }
 });
 dom.window.eval(script);
 return {dom,document:dom.window.document,calls};
}
test('Chrome Android pode autorizar e registrar dispositivo sem instalar PWA e sem senha',async()=>{
 const c=setup();
 try{
  const {document,calls}=c;
  const status=()=>document.getElementById('subscribe-status').textContent;
  document.getElementById('consent').checked=true;
  document.getElementById('subscribe-device').click();
  await waitFor(()=>status().includes('cadastrado no Supabase'));
  assert.ok(calls.includes('permission'));
  assert.ok(calls.includes('subscribe'));
  assert.ok(calls.includes('/public-subscribe'));
  assert.equal(calls.includes('/admin/login'),false);
 }finally{c.dom.window.close()}
});
test('Consentimento desmarcado impede qualquer cadastro ou permissão',async()=>{
 const c=setup();
 try{
  c.document.getElementById('subscribe-device').click();
  await waitFor(()=>c.document.getElementById('subscribe-status').textContent.includes('Marque primeiro'));
  assert.equal(c.calls.filter(x=>x==='permission'||x==='/public-subscribe').length,0);
 }finally{c.dom.window.close()}
});
test('iPhone fora do aplicativo não inicia inscrição',async()=>{
 const c=setup({platform:'ios',installed:false});
 try{
  c.document.getElementById('consent').checked=true;
  c.document.getElementById('subscribe-device').click();
  await waitFor(()=>c.document.getElementById('subscribe-status').textContent.includes('Tela de Início'));
  assert.equal(c.calls.filter(x=>x==='/public-subscribe').length,0);
 }finally{c.dom.window.close()}
});
