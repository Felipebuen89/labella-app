'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'demo-proprietario.html'),'utf8');
const upgrade=fs.readFileSync(path.join(root,'demo-proprietario-v2.js'),'utf8');
const stylesheet=fs.readFileSync(path.join(root,'demo-proprietario-v2.css'),'utf8');
function start(){
 const errors=[],network=[];
 const dom=new JSDOM(html,{url:'https://felipebuen89.github.io/labella-app/demo-proprietario.html',
  runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
   w.scrollTo=()=>{};w.fetch=(...args)=>{network.push(args);throw Error('Rede proibida no demo')};
   w.WebSocket=function(){throw Error('WebSocket proibido')};
   w.addEventListener('error',e=>errors.push(e.message));
  }});
 dom.window.eval(upgrade);
 return {dom,d:dom.window.document,errors,network};
}
const change=(w,e,type='change')=>e.dispatchEvent(new w.Event(type,{bubbles:true}));
test('Painel profissional tem CSS, JS e isolamento da rede e das credenciais',()=>{
 assert.match(html,/demo-proprietario-v2\.js/);
 assert.match(html,/demo-proprietario-v2\.css/);
 assert.match(stylesheet,/daily-timeline|v2-dayline/);
 assert.match(html,/connect-src 'none'/);
 assert.doesNotMatch(upgrade,/\bfetch\s*\(|WebSocket\s*\(|XMLHttpRequest|localStorage|sessionStorage|PushManager|sendNotification|supabase\.|service_role/);
 const x=start();try{assert.deepEqual(x.errors,[]);assert.equal(x.network.length,0);assert.equal(x.d.querySelector('input[type=password]'),null)}
 finally{x.dom.window.close()}
});
test('Agenda apresenta 24 faixas 08h-20h com cliente, serviço e horários livres',()=>{
 const x=start();try{
  assert.deepEqual(x.errors,[]);
  const rows=[...x.d.querySelectorAll('#v2-timeline .v2-timecell')];
  assert.equal(rows.length,24);
  assert.equal(rows[0].querySelector('.v2-clock').textContent,'08:00');
  assert.equal(rows.at(-1).querySelector('.v2-clock').textContent,'19:30');
  assert.equal(x.d.getElementById('v2-booked').textContent,'6');
  assert.equal(x.d.getElementById('v2-free').textContent,'14');
  assert.equal(x.d.querySelectorAll('#all-bookings tr').length,6);
  assert.match(rows[2].textContent,/Mariana Oliveira/);
  assert.match(rows[2].textContent,/Hidratação/);
  assert.match(rows[0].textContent,/Horário livre/);
  assert.equal(x.d.getElementById('v2-reminder-total').textContent,'12');
  assert.equal(x.network.length,0);
 }finally{x.dom.window.close()}
});
test('Agenda muda o dia sem manter agendamentos do anterior',()=>{
 const x=start();try{
  x.d.getElementById('v2-next').click();
  assert.equal(x.d.getElementById('v2-day-value').value,'2026-10-27');
  assert.equal(x.d.getElementById('v2-booked').textContent,'1');
  assert.equal(x.d.querySelectorAll('#all-bookings tr').length,1);
  x.d.getElementById('v2-prev').click();
  assert.equal(x.d.getElementById('v2-booked').textContent,'6');
 }finally{x.dom.window.close()}
});
test('Agendamento cria novos horários e lembretes automáticos simulados e rejeita colisões',()=>{
 const x=start();try{
  const d=x.d,form=d.getElementById('v2-booking-form');
  d.getElementById('v2-client').value='2';
  d.getElementById('v2-service').value='Escova';
  d.getElementById('v2-time').value='08:00';
  d.getElementById('v2-value').value='60';
  change(x.dom.window,form,'submit');
  assert.equal(d.getElementById('v2-booked').textContent,'7');
  assert.equal(d.getElementById('v2-reminder-total').textContent,'14');
  const again=d.querySelectorAll('#all-bookings tr').length;
  d.getElementById('v2-time').value='09:00';
  change(x.dom.window,form,'submit');
  assert.equal(d.querySelectorAll('#all-bookings tr').length,again);
  assert.match(d.getElementById('toast').textContent,/ocupado|insuficiente/);
  assert.equal(x.network.length,0);
 }finally{x.dom.window.close()}
});
test('Botão de lembrete manual registra prévia sem disparar mensagem',()=>{
 const x=start();try{
  const d=x.d;
  d.querySelector('button[data-booking-action="manual"]').click();
  assert.equal(d.getElementById('v2-reminder-total').textContent,'13');
  assert.match(d.getElementById('v2-reminder-list').textContent,/Lembrete manual/);
  assert.match(d.getElementById('toast').textContent,/0 mensagens enviadas/);
  assert.equal(x.network.length,0);
 }finally{x.dom.window.close()}
});
test('Financeiro calcula recebidos, a receber, despesas, saldo e baixa fictícia',()=>{
 const x=start();try{
  const d=x.d;
  assert.match(d.getElementById('v2-received').textContent,/210/);
  assert.match(d.getElementById('v2-pending').textContent,/490/);
  assert.match(d.getElementById('v2-expenses').textContent,/120/);
  assert.match(d.getElementById('v2-result').textContent,/90/);
  d.querySelector('button[data-pay-id="3"]').click();
  assert.match(d.getElementById('v2-received').textContent,/430/);
  assert.match(d.getElementById('v2-pending').textContent,/270/);
  d.getElementById('v2-expense-name').value='Nova despesa demonstrativa';
  d.getElementById('v2-expense-amount').value='30';
  change(x.dom.window,d.getElementById('v2-expense-form'),'submit');
  assert.match(d.getElementById('v2-expenses').textContent,/150/);
  assert.equal(x.network.length,0);
 }finally{x.dom.window.close()}
});
test('Clientes mostra todas as cadastradas e permite cadastrar uma ficha fictícia',()=>{
 const x=start();try{
  const d=x.d;
  assert.equal(d.getElementById('v2-total-clients').textContent,'12');
  assert.equal(d.querySelectorAll('#all-clients tr').length,12);
  d.getElementById('v2-new-name').value='Ana Exemplo';
  d.getElementById('v2-new-service').value='Corte';
  change(x.dom.window,d.getElementById('v2-new-client-form'),'submit');
  assert.equal(d.getElementById('v2-total-clients').textContent,'13');
  d.getElementById('client-search').value='Ana';
  change(x.dom.window,d.getElementById('client-search'),'input');
  assert.match(d.getElementById('all-clients').textContent,/Ana Exemplo/);
  assert.match(d.getElementById('v2-client-profile').textContent,/Ana Exemplo/);
  assert.equal(x.network.length,0);
 }finally{x.dom.window.close()}
});
test('Campanhas de vendas e lembretes separados e simulação jamais envia mensagens reais',()=>{
 const x=start();try{
  const d=x.d;
  assert.match(d.querySelector('#campanhas .lead').textContent,/Lembretes de horários ficam na agenda/);
  assert.match(d.getElementById('v2-price-to').textContent,/119/);
  d.getElementById('campaign-message').value='Oferta <img src=x onerror=alert(1)>';
  change(x.dom.window,d.getElementById('campaign-message'),'input');
  assert.equal(d.getElementById('v2-msg-preview').querySelector('img'),null);
  d.getElementById('simulate-campaign').click();
  assert.equal(d.getElementById('v2-sales-total').textContent,'1');
  assert.match(d.getElementById('campaign-result').textContent,/0 mensagens enviadas/);
  assert.equal(x.network.length,0);
 }finally{x.dom.window.close()}
});