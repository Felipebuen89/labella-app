'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const page=fs.readFileSync(path.resolve(__dirname,'../painel.html'),'utf8');
const ID='2ab8cbeb-4967-46cd-9809-1499cae87331';
const JOB='ef42938c-7b51-49e0-a385-01124569c053';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function eventually(check){
 for(let i=0;i<150;i++){
   if(check())return;
   await sleep(10);
 }
 throw Error('Timeout esperando mudança do painel');
}
function setUp({installed=true,existingDevices=[],userAgent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'}={}){
 const calls=[];
 const devices=[...existingDevices];
 const subscription={endpoint:'https://web.push.apple.com/browser-mock',
  keys:{p256dh:'mock-key',auth:'mock-auth'},
  toJSON(){return {endpoint:this.endpoint,keys:this.keys}}};
 const pushManager={
  getSubscription:async()=>subscription,
  subscribe:async()=>subscription
 };
 const registration={pushManager};
 const dom=new JSDOM(page,{
  url:'https://felipebuen89.github.io/labella-app/painel.html',
  runScripts:'dangerously',pretendToBeVisual:true,
  beforeParse(window){
   Object.defineProperty(window.navigator,'userAgent',{configurable:true,value:userAgent});
   window.matchMedia=()=>({matches:installed});
   window.navigator.standalone=installed;
   window.Notification={permission:'granted',requestPermission:async()=> 'granted'};
   Object.defineProperty(window.navigator,'serviceWorker',{configurable:true,value:{
      register:async()=>registration,ready:Promise.resolve(registration)
   }});
   window.confirm=()=>true;
   window.fetch=async(input,options)=>{
     const endpoint=new URL(String(input)).pathname;
     calls.push(endpoint);
     let payload={ok:true};
     if(endpoint==='/admin/login')payload={ok:true,token:'fake-session',expiresIn:7200};
     else if(endpoint==='/admin/devices')payload={ok:true,devices:[...devices],persistent:true};
     else if(endpoint==='/public-config')payload={vapidPublicKey:'AQIDBAU'};
     else if(endpoint==='/admin/register'){
       const obj=JSON.parse(options.body);
       devices.push({id:ID,label:obj.label});
       payload={ok:true,id:ID,label:obj.label};
     }
     else if(endpoint==='/admin/send'){
       const obj=JSON.parse(options.body);
       if(obj.deviceIds.length!==1)throw Error('Expected exactly one device');
       payload={ok:true,scheduled:true,persistent:true,jobId:JOB,recipients:1,delaySeconds:30};
     }
     else if(endpoint==='/admin/send-status')payload={ok:true,status:'agendado',details:'Aguardando disparo'};
     return {ok:true,status:200,async json(){return payload}};
   };
  }
 });
 const w=dom.window;
 async function login(){
  const form=w.document.getElementById('login-form');
  w.document.getElementById('password').value='senha-apenas-no-mock';
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await eventually(()=>!w.document.getElementById('dashboard').hidden);
  await eventually(()=>calls.includes('/admin/devices'));
 }
 return {dom,w,calls,devices,login};
}
test('Clique no painel sem dispositivos cadastra o iPhone e agenda a campanha', {timeout:20000},async()=>{
 const a=setUp();
 try{
  await a.login();
  assert.match(a.w.document.getElementById('device-hint').textContent,/Nenhum celular cadastrado/);
  a.w.document.getElementById('send').click();
  await eventually(()=>a.calls.includes('/admin/send'));
  await eventually(()=>a.w.document.getElementById('send-state').textContent.includes('MENSAGEM PROGRAMADA NO SUPABASE'));
  assert.equal(a.devices.length,1);
  assert.deepEqual(a.calls.filter(x=>['/admin/register','/admin/send'].includes(x)),['/admin/register','/admin/send']);
  assert.match(a.w.document.getElementById('send-state').textContent,/30 segundos/);
 }finally{a.dom.window.close()}
});
test('Com aparelho cadastrado, botão envia sem registrar de novo', {timeout:20000},async()=>{
 const a=setUp({existingDevices:[{id:ID,label:'iPhone cadastrado'}]});
 try{
  await a.login();
  a.w.document.getElementById('send').click();
  await eventually(()=>a.calls.includes('/admin/send'));
  assert.equal(a.calls.filter(x=>x==='/admin/register').length,0);
  assert.equal(a.calls.filter(x=>x==='/admin/send').length,1);
 }finally{a.dom.window.close()}
});
test('Sem modo aplicativo instalado, bloqueia cadastro e mostra motivo legível', {timeout:20000},async()=>{
 const a=setUp({installed:false});
 try{
  await a.login();
  a.w.document.getElementById('send').click();
  await eventually(()=>a.w.document.getElementById('send-state').textContent.includes('ÍCON E') || a.w.document.getElementById('send-state').textContent.includes('ÍCONE'));
  assert.equal(a.calls.filter(x=>x==='/admin/register').length,0);
  assert.equal(a.calls.filter(x=>x==='/admin/send').length,0);
 }finally{a.dom.window.close()}
});

test('Android Chrome sem instalar PWA cadastra aparelho, agenda e exibe nome correto', {timeout:20000},async()=>{
 const a=setUp({installed:false,userAgent:'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'});
 try{
  await a.login();
  assert.equal(a.w.document.getElementById('device-label').value,'Meu Android — teste');
  assert.match(a.w.document.getElementById('device-instructions').textContent,/Chrome/);
  a.w.document.getElementById('send').click();
  await eventually(()=>a.calls.includes('/admin/send'));
  assert.equal(a.calls.filter(x=>x==='/admin/register').length,1);
  await eventually(()=>a.w.document.getElementById('send-state').textContent.includes('MENSAGEM PROGRAMADA NO SUPABASE'));
  assert.equal(a.devices[0].label,'Meu Android — teste');
 }finally{a.dom.window.close()}
});
