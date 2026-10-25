'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const project=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(project,p),'utf8');
const demo=read('demo-proprietario.html');
const entry=read('acesso.html');
const owner=read('proprietario.html');

function start(){
 const errs=[],calls=[];
 const dom=new JSDOM(demo,{
  url:'https://felipebuen89.github.io/labella-app/demo-proprietario.html',
  runScripts:'dangerously',pretendToBeVisual:true,
  beforeParse(w){
   w.scrollTo=()=>{};
   w.fetch=(...args)=>{calls.push(args);throw Error('Demo tentou acessar a internet')};
   w.WebSocket=function(){throw Error('WebSocket não autorizado')};
   w.addEventListener('error',e=>errs.push(e.message));
  }
 });
 return {dom,d:dom.window.document,errs,calls};
}
test('Apresentação 100% fictícia e sem SDK/chave/acesso a envio de push',()=>{
 assert.match(demo,/connect-src 'none'/);
 assert.match(demo,/Dados 100% fictícios/);
 assert.doesNotMatch(demo,/\bfetch\s*\(/);
 assert.doesNotMatch(demo,/\/(?:admin|proprietario|public-subscribe|public-unsubscribe|rest\/v1)\//);
 assert.doesNotMatch(demo,/https:\/\/labella-webpush-teste\.onrender\.com/);
 assert.doesNotMatch(demo,/sb_publishable_|service_role|VAPID_PRIVATE/);
 assert.doesNotMatch(demo,/auth-config\.js|auth-core\.js|backend\.js/);
});
test('Entrada da proprietária oferece demonstração sem senha, painel real exige autenticação',()=>{
 assert.match(entry,/id="demo-entry"/);
 assert.match(entry,/href="\.\/demo-proprietario\.html"/);
 assert.match(entry,/classList\.toggle\('hidden',!owner\)/);
 assert.match(owner,/href="\.\/demo-proprietario\.html"/);
 assert.match(owner,/id="dashboard" hidden/);
 assert.match(owner,/\/proprietario\/me/);
});
test('Tour inicializa módulos e não exige senha nem faz rede',()=>{
 const x=start();
 try{
  assert.deepEqual(x.errs,[]);
  for(const id of ['resumo','agenda','clientes','campanhas','fidelidade','configuracoes']){
   assert.ok(x.d.getElementById(id),'Falta página '+id);
  }
  assert.ok(x.d.getElementById('resumo').classList.contains('active'));
  assert.equal(x.d.querySelectorAll('#all-bookings tr').length,6);
  assert.equal(x.d.querySelectorAll('#all-clients tr').length,5);
  assert.equal(x.calls.length,0);
  assert.equal(x.d.querySelectorAll('input[type=password]').length,0);
 }finally{x.dom.window.close()}
});
test('Agenda pode simular um horário e concluir sem nenhuma chamada de rede',()=>{
 const x=start();
 try{
  x.d.querySelector('[data-go="agenda"]').click();
  assert.ok(x.d.getElementById('agenda').classList.contains('active'));
  x.d.getElementById('add-appointment').click();
  assert.equal(x.d.getElementById('m-appointments').textContent,'7');
  assert.equal(x.d.querySelectorAll('#all-bookings tr').length,7);
  const before=Number(x.d.getElementById('m-concluded').textContent);
  const actions=[...x.d.querySelectorAll('#all-bookings button')].filter(b=>!b.disabled);
  actions[0].click();
  assert.equal(Number(x.d.getElementById('m-concluded').textContent),before+1);
  assert.equal(x.calls.length,0);
 }finally{x.dom.window.close()}
});
test('Campanhas fazem SOMENTE simulação local, até com texto fornecido',()=>{
 const x=start();
 try{
  const input=x.d.getElementById('campaign-message');
  input.value='<img src=x onerror=alert(1)> Teste de campanha';
  input.dispatchEvent(new x.dom.window.Event('input'));
  assert.ok(x.d.getElementById('preview-message').textContent.startsWith('<img'));
  assert.equal(x.d.getElementById('preview-message').querySelector('img'),null);
  x.d.getElementById('simulate-campaign').click();
  assert.equal(x.d.getElementById('m-campaigns').textContent,'1');
  assert.match(x.d.getElementById('campaign-result').textContent,/0 mensagens enviadas/);
  assert.equal(x.calls.length,0);
 }finally{x.dom.window.close()}
});
test('Fidelidade e busca de clientes atuam apenas em personagens fictícios',()=>{
 const x=start();
 try{
  assert.equal(x.d.getElementById('loyalty-balance').textContent,'120 pontos');
  x.d.getElementById('add-points').click();
  assert.equal(x.d.getElementById('loyalty-balance').textContent,'140 pontos');
  const search=x.d.getElementById('client-search');
  search.value='Camila';search.dispatchEvent(new x.dom.window.Event('input'));
  assert.equal(x.d.querySelectorAll('#all-clients tr').length,1);
  assert.match(x.d.querySelector('#all-clients tr').textContent,/Camila/);
  assert.equal(x.calls.length,0);
 }finally{x.dom.window.close()}
});
