'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

const code=fs.readFileSync(path.resolve(__dirname,'../config.js'),'utf8');
function openPage({android=true,standalone=false}={}){
 const html='<!doctype html><html><body><div id="home"><div class="approved-content"><a class="approved-book" href="#">Ver agenda</a></div></div></body></html>';
 const dom=new JSDOM(html,{url:'https://felipebuen89.github.io/labella-app/',runScripts:'outside-only',beforeParse(win){
   Object.defineProperty(win.navigator,'userAgent',{configurable:true,value:android?'Mozilla/5.0 (Linux; Android 15; Galaxy) Chrome/130 Mobile':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'});
   Object.defineProperty(win,'isSecureContext',{configurable:true,value:true});
   win.matchMedia=()=>({matches:standalone});
   Object.defineProperty(win.navigator,'serviceWorker',{configurable:true,value:{register:async()=>({})}});
 }});
 dom.window.eval(code);
 dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
 return dom;
}
test('Android acessa sem instalar e sem prompt de pacote Android',()=>{
 const dom=openPage();
 try{
  const d=dom.window.document;
  assert.equal(d.getElementById('labella-install-app'),null);
  assert.match(d.getElementById('labella-android-browser-mode').textContent,/sem instalar nada/);
  assert.match(d.getElementById('labella-android-browser-mode').textContent,/Não é necessário instalar arquivos/);
  assert.equal(d.getElementById('notification-demo-link').getAttribute('href'),'./notificacoes.html?v=seguro1');
  assert.equal(code.includes('.prompt('),false);
  assert.equal(code.includes('getUserMedia'),false);
 }finally{dom.window.close()}
});
test('Na PWA já instalada, não aparece aviso de navegador',()=>{
 const dom=openPage({standalone:true});
 try{
  assert.equal(dom.window.document.getElementById('labella-android-browser-mode'),null);
  assert.ok(dom.window.document.getElementById('notification-demo-link'));
 }finally{dom.window.close()}
});
test('iPhone mantém acesso ao teste de notificações',()=>{
 const dom=openPage({android:false});
 try{
  assert.equal(dom.window.document.getElementById('labella-android-browser-mode'),null);
  assert.ok(dom.window.document.getElementById('notification-demo-link'));
 }finally{dom.window.close()}
});
