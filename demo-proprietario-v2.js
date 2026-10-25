/* LA'BELLA • MOVE DIGITAL • Proprietária v2: apresentação isolada */
(function(){
'use strict';
// Todos os dados desta versão são fictícios e permanecem exclusivamente na memória desta página.
const $=id=>document.getElementById(id);
const day0='2026-10-26';
let selectedDay=day0, nextId=100, sales=[];
let clients=[
 {id:1,name:'Mariana Oliveira',service:'Hidratação',visit:'18/10/2026',points:120,visits:8,group:'Clube'},
 {id:2,name:'Beatriz Lima',service:'Escova',visit:'19/10/2026',points:90,visits:6,group:'Clube'},
 {id:3,name:'Camila Santos',service:'Coloração',visit:'17/10/2026',points:210,visits:12,group:'Clube'},
 {id:4,name:'Renata Alves',service:'Corte',visit:'16/10/2026',points:60,visits:4,group:'Regular'},
 {id:5,name:'Juliana Costa',service:'Tratamento',visit:'15/10/2026',points:180,visits:10,group:'Clube'},
 {id:6,name:'Patrícia Rocha',service:'Escova',visit:'11/10/2026',points:30,visits:3,group:'Regular'},
 {id:7,name:'Larissa Fernandes',service:'Coloração',visit:'10/10/2026',points:100,visits:7,group:'Clube'},
 {id:8,name:'Fernanda Ribeiro',service:'Corte',visit:'08/10/2026',points:0,visits:1,group:'Nova'},
 {id:9,name:'Ana Souza',service:'Hidratação',visit:'03/10/2026',points:45,visits:3,group:'Regular'},
 {id:10,name:'Isabela Martins',service:'Escova',visit:'01/10/2026',points:80,visits:5,group:'Clube'},
 {id:11,name:'Cláudia Nunes',service:'Tratamento',visit:'28/09/2026',points:15,visits:2,group:'Regular'},
 {id:12,name:'Débora Pereira',service:'Coloração',visit:'25/09/2026',points:0,visits:1,group:'Nova'}
];
const serviceInfo={Escova:{duration:30,price:60},Hidratação:{duration:60,price:150},Coloração:{duration:90,price:220},Corte:{duration:30,price:75},Tratamento:{duration:60,price:140},Finalização:{duration:30,price:55}};
let bookings=[
 {id:1,date:day0,time:'09:00',clientId:1,service:'Hidratação',status:'Concluído',paid:true,price:150},
 {id:2,date:day0,time:'10:00',clientId:2,service:'Escova',status:'Concluído',paid:true,price:60},
 {id:3,date:day0,time:'11:00',clientId:3,service:'Coloração',status:'Confirmado',paid:false,price:220},
 {id:4,date:day0,time:'13:30',clientId:4,service:'Corte',status:'Confirmado',paid:false,price:75},
 {id:5,date:day0,time:'15:00',clientId:5,service:'Tratamento',status:'Pendente',paid:false,price:140},
 {id:6,date:day0,time:'16:00',clientId:1,service:'Finalização',status:'Confirmado',paid:false,price:55},
 {id:7,date:'2026-10-27',time:'10:00',clientId:6,service:'Escova',status:'Confirmado',paid:false,price:60},
 {id:8,date:'2026-10-28',time:'09:30',clientId:7,service:'Coloração',status:'Confirmado',paid:false,price:220}
];
let expenses=[
 {id:1,date:day0,title:'Produtos para atendimento',amount:95},
 {id:2,date:day0,title:'Material descartável',amount:25},
 {id:3,date:'2026-10-24',title:'Reposição de estoque',amount:190}
];
let reminders=[]; // Cada agendamento terá um exemplo das regras automáticas, sem disparo.
function nameOf(id){return clients.find(c=>c.id===id)?.name||'Cliente fictícia'}
function money(value){return Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function minOf(t){const [h,m]=t.split(':').map(Number);return h*60+m}
function timeOf(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
const startMin=8*60,endMin=20*60;
const allTimes=Array.from({length:(endMin-startMin)/30},(_,i)=>timeOf(startMin+i*30));
const isoDay=s=>{const [y,m,d]=s.split('-');return d+'/'+m+'/'+y};
function offsetDay(iso,days){const base=new Date(iso+'T12:00:00Z');base.setUTCDate(base.getUTCDate()+days);return base.toISOString().slice(0,10)}
function humanDay(iso){return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'},{timeZone:'UTC'}).format(new Date(iso+'T12:00:00Z'))}
function elem(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e}
function toast(message){const t=$('toast');t.textContent='✧ '+message;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,4000)}
function autoReminders(b){
 reminders.push({bookingId:b.id,kind:'auto',label:'24 horas antes',state:'Previsto • simulação'});
 reminders.push({bookingId:b.id,kind:'auto',label:'2 horas antes',state:'Previsto • simulação'});
}
bookings.forEach(autoReminders);
function inDay(){return bookings.filter(b=>b.date===selectedDay).sort((a,b)=>a.time.localeCompare(b.time))}
function occupied(date,at,ignoreId){const minute=minOf(at);return bookings.some(b=>b.date===date&&b.id!==ignoreId&&minOf(b.time)<=minute&&minute<minOf(b.time)+serviceInfo[b.service].duration)}
function freeWindow(date,at,service){const begin=minOf(at),duration=serviceInfo[service]?.duration||30;if(begin<startMin||begin+duration>endMin)return false;for(let t=begin;t<begin+duration;t+=30)if(occupied(date,timeOf(t)))return false;return true}
function setStatus(b){return b.status==='Concluído'?'ok':b.status==='Pendente'?'wait':''}
function updateSummary(){
 $('m-appointments').textContent=inDay().length;
 $('m-clients').textContent=clients.length;
 $('m-concluded').textContent=inDay().filter(b=>b.status==='Concluído').length;
 $('m-campaigns').textContent=sales.length;
 const table=$('overview-bookings');table.replaceChildren();
 inDay().slice(0,5).forEach(b=>{
  const tr=elem('tr');tr.append(elem('td','',b.time),elem('td','',nameOf(b.clientId)),elem('td','',b.service));
  const status=elem('td');status.append(elem('span','chip '+setStatus(b),b.status));tr.append(status);table.append(tr);
 });
 const add=$('v2-summary');if(add){
  const received=bookings.filter(b=>b.paid&&b.date===selectedDay).reduce((s,b)=>s+b.price,0);
  const costs=expenses.filter(e=>e.date===selectedDay).reduce((s,e)=>s+e.amount,0);
  add.textContent='Caixa fictício do dia: '+money(received)+' recebidos • '+money(costs)+' em despesas. Consulte o Financeiro para detalhes.';
 }
}
function fillOptions(select,items,getLabel,getVal){select.replaceChildren();for(const a of items){const option=elem('option','',getLabel(a));option.value=String(getVal(a));select.append(option)}}
function scheduleButton(booking,kind){
 const b=elem('button','v2-action subtle',kind==='complete'?'Concluir':'🔔 Lembrar');
 b.type='button';b.dataset.bookingAction=kind;b.dataset.bookingId=String(booking.id);
 if(kind==='complete'&&booking.status==='Concluído')b.disabled=true;
 return b
}
function renderTimeline(){
 const root=$('v2-timeline');root.replaceChildren();let free=0;
 for(const time of allTimes){
  const minute=minOf(time);
  const booking=inDay().find(b=>minOf(b.time)<=minute&&minOf(b.time)+serviceInfo[b.service].duration>minute);
  const row=elem('div','v2-timecell');
  const tick=elem('span','v2-clock',time);
  const box=elem('div','v2-slot'+(booking?(booking.time===time?' booked':' continuation'):''));
  if(!booking){
   free++;const text=elem('div');text.append(elem('strong','','Horário livre'),elem('small','','Disponível para agendamento'));
   const btn=elem('button','','+ Agendar');btn.type='button';btn.dataset.bookTime=time;box.append(text,btn);
  }else{
   const text=elem('div');const ends=timeOf(minOf(booking.time)+serviceInfo[booking.service].duration);
   text.append(elem('strong','',booking.time===time?nameOf(booking.clientId):'Em atendimento • '+nameOf(booking.clientId)));
   text.append(elem('small','',booking.service+' · '+booking.time+'–'+ends+' · '+booking.status));
   const pill=elem('span','v2-status '+setStatus(booking),booking.time===time?'Agendado':'Ocupado');
   box.append(text,pill);
  }
  row.append(tick,box);root.append(row);
 }
 $('v2-free').textContent=free;
 $('v2-booked').textContent=inDay().length;
 $('v2-reminder-count').textContent=inDay().length*2;
 $('v2-day-title').textContent=humanDay(selectedDay);
 $('v2-day-value').value=selectedDay;
 const select=$('v2-time');const old=select.value;
 fillOptions(select,allTimes,t=>t,t=>t);
 if(allTimes.includes(old))select.value=old;
 else select.value='17:00';
 renderBookedRows();
 renderReminderPanel();
}
function renderBookedRows(){
 const tb=$('all-bookings');tb.replaceChildren();
 if(!inDay().length){const tr=elem('tr');const td=elem('td','v2-muted','Nenhum atendimento fictício neste dia. Todos os horários estão disponíveis.');td.colSpan=5;tr.append(td);tb.append(tr);return}
 inDay().forEach(b=>{
  const tr=elem('tr');tr.append(elem('td','',b.time),elem('td','',nameOf(b.clientId)),elem('td','',b.service));
  const status=elem('td');status.append(elem('span','v2-status '+setStatus(b),b.status));tr.append(status);
  const actions=elem('td'),group=elem('div','v2-actions');
  group.append(scheduleButton(b,'complete'),scheduleButton(b,'manual'));
  actions.append(group);tr.append(actions);tb.append(tr);
 });
}
function renderReminderPanel(){
 const root=$('v2-reminder-list');root.replaceChildren();
 const shown=reminders.filter(r=>bookings.some(b=>b.id===r.bookingId&&b.date===selectedDay));
 $('v2-reminder-total').textContent=shown.length;
 if(!shown.length){root.append(elem('p','v2-muted','Nenhum lembrete previsto para esse dia.'));return}
 shown.slice(-18).reverse().forEach(r=>{
  const b=bookings.find(b=>b.id===r.bookingId);const row=elem('div','v2-logitem');
  row.append(elem('strong','',(r.kind==='manual'?'🔔 Lembrete manual':'◷ Regra automática')+' · '+nameOf(b.clientId)));
  row.append(elem('div','',b.time+' • '+b.service+' • '+r.label));
  row.append(elem('small','',r.state));
  root.append(row);
 });
}
function chooseTime(time){
 $('v2-time').value=time;const y=$('v2-booking-form');
 y.scrollIntoView?.({behavior:'smooth',block:'nearest'});
 $('v2-time').focus();toast(time+' selecionado. Escolha a cliente e confirme (simulação).');
}
function book(clientId,service,time,price){
 if(!clients.some(c=>c.id===Number(clientId)))throw Error('Selecione uma cliente do cadastro fictício.');
 if(!serviceInfo[service])throw Error('Selecione um serviço válido.');
 if(!Number.isFinite(price)||price<0||price>5000)throw Error('Informe um valor ilustrativo válido.');
 if(!freeWindow(selectedDay,time,service))throw Error('Horário ocupado ou insuficiente para a duração do serviço.');
 const b={id:++nextId,date:selectedDay,time,clientId:Number(clientId),service,status:'Confirmado',paid:false,price};
 bookings.push(b);autoReminders(b);refreshAll();
 toast('Agendamento fictício confirmado: lembretes de 24h e 2h previstos, sem envio real.');
 return b;
}
function renderClients(){
 const body=$('all-clients'),term=$('client-search').value.trim().toLocaleLowerCase('pt-BR');body.replaceChildren();
 const filtered=clients.filter(c=>(c.name+' '+c.service).toLocaleLowerCase('pt-BR').includes(term));
 $('v2-total-clients').textContent=clients.length;
 $('v2-club-clients').textContent=clients.filter(c=>c.group==='Clube').length;
 $('v2-new-clients').textContent=clients.filter(c=>c.group==='Nova').length;
 $('v2-visible-clients').textContent=filtered.length+' de '+clients.length+' clientes';
 for(const c of filtered){
  const tr=elem('tr'),name=elem('td','',c.name);
  name.append(elem('small','v2-small','Perfil fictício • '+c.visits+' visitas'));
  tr.append(name,elem('td','',c.visit),elem('td','',c.service),elem('td','',c.points+' pts'));
  const action=elem('td');const button=elem('button','v2-action subtle','Ver ficha');
  button.type='button';button.dataset.clientId=String(c.id);
  action.append(button);tr.append(action);body.append(tr);
 }
 if(!filtered.length){const tr=elem('tr'),empty=elem('td','v2-muted','Nenhuma cliente fictícia encontrada.');empty.colSpan=5;tr.append(empty);body.append(tr)}
 fillClientSelectors();
}
function fillClientSelectors(){
 for(const id of ['v2-client','v2-loyalty-client']){
  const select=$(id),previous=select.value;
  fillOptions(select,clients,c=>c.name,c=>c.id);
  if(clients.some(c=>String(c.id)===previous))select.value=previous;
 }
}
function viewClient(id){
 const c=clients.find(c=>c.id===Number(id));if(!c)return;
 const root=$('v2-client-profile');root.replaceChildren();
 root.append(elem('h4','',c.name),elem('p','v2-muted','Ficha de demonstração • '+c.group));
 const lines=[['Serviço preferido',c.service],['Última visita (fictícia)',c.visit],['Visitas de exemplo',c.visits],['Pontos de demonstração',c.points+' pts'],['Próximo horário fictício',bookings.filter(b=>b.clientId===c.id).map(b=>isoDay(b.date)+' às '+b.time).join(', ')||'Nenhum']];
 for(const [label,value] of lines){const line=elem('div','v2-line');line.append(elem('span','',label),elem('strong','',value));root.append(line)}
}
function renderFinance(){
 const month= $('v2-period').value==='mes';const shown=bookings.filter(b=>month?b.date.startsWith('2026-10'):b.date===selectedDay);
 const fees=expenses.filter(e=>month?e.date.startsWith('2026-10'):e.date===selectedDay);
 const received=shown.filter(b=>b.paid).reduce((s,b)=>s+b.price,0);
 const pending=shown.filter(b=>!b.paid).reduce((s,b)=>s+b.price,0);
 const costs=fees.reduce((s,e)=>s+e.amount,0);
 $('v2-received').textContent=money(received);
 $('v2-pending').textContent=money(pending);
 $('v2-expenses').textContent=money(costs);
 $('v2-result').textContent=money(received-costs);
 $('v2-period-label').textContent=month?'Outubro de 2026 (fictício)':isoDay(selectedDay)+' (fictício)';
 const tbody=$('v2-fin-rows');tbody.replaceChildren();
 shown.forEach(b=>{
  const tr=elem('tr');tr.append(elem('td','',nameOf(b.clientId)),elem('td','',b.service),elem('td','',money(b.price)));
  const cell=elem('td');
  if(b.paid)cell.append(elem('span','v2-status done','Pago (demo)'));
  else{const button=elem('button','v2-action subtle','Marcar pago');button.type='button';button.dataset.payId=String(b.id);cell.append(button)}
  tr.append(cell);tbody.append(tr);
 });
 if(!shown.length){const tr=elem('tr'),cell=elem('td','v2-muted','Nenhum atendimento de exemplo neste período.');cell.colSpan=4;tr.append(cell);tbody.append(tr)}
 const exp=$('v2-expense-list');exp.replaceChildren();
 fees.forEach(e=>{const row=elem('div','v2-line');row.append(elem('span','',e.title),elem('strong','',money(e.amount)));exp.append(row)});
 if(!fees.length)exp.append(elem('p','v2-muted','Sem despesas fictícias neste período.'));
}
function renderOffers(){
 const service=$('v2-offer-service').value.trim(),regular=Number($('v2-regular-price').value),price=Number($('v2-promo-price').value);
 $('v2-preview-service').textContent=service||'Serviço do salão';
 $('v2-price-from').textContent=money(regular);
 $('v2-price-to').textContent=money(price);
 const expiry=$('v2-promo-validity').value;
 $('v2-validity').textContent=expiry?'Válida até '+isoDay(expiry)+' (exemplo)':'Validade a definir';
 $('v2-msg-preview').textContent=$('campaign-message').value.trim()||'Sua campanha aparecerá aqui.';
 $('v2-message-count').textContent=$('campaign-message').value.length+'/160 caracteres';
}
function renderSales(){
 $('v2-sales-total').textContent=sales.length;
 $('v2-sales-active').textContent=sales.length;
 $('v2-sales-audience').textContent=clients.length;
 const root=$('v2-sales-history');root.replaceChildren();
 if(!sales.length){root.append(elem('p','v2-muted','Nenhuma promoção simulada nesta sessão.'));return}
 sales.slice().reverse().forEach(c=>{
  const row=elem('div');
  row.append(elem('strong','',c.service+' • '+money(c.price)));
  row.append(elem('p','v2-muted',c.target+' · Prévia demonstrativa · 0 envios'));
  root.append(row);
 });
}
function syncLoyalty(){
 const selected=Number($('v2-loyalty-client').value),client=clients.find(c=>c.id===selected);
 $('loyalty-balance').textContent=(client?.points??0)+' pontos';
}
function refreshAll(){
 updateSummary();renderTimeline();renderClients();renderFinance();renderSales();
 const chosen=$('v2-loyalty-client').value;fillClientSelectors();$('v2-loyalty-client').value=chosen||String(clients[0].id);syncLoyalty();
}
const agendaMarkup=String.raw`
<div class="eyebrow">CENTRAL DE ATENDIMENTO</div><h1 class="pagetitle">Agenda diária completa</h1>
<p class="lead">Todos os horários do dia, de 08h às 20h: mostre vagas livres, cliente, serviço e o tempo reservado para cada atendimento.</p>
<div class="v2-toolbar"><div class="v2-daynav">
 <button id="v2-prev" type="button" class="v2-action outline" aria-label="Dia anterior">‹</button>
 <div><label for="v2-day-value">Dia da agenda</label><input id="v2-day-value" type="date" value="2026-10-26"></div>
 <button id="v2-next" type="button" class="v2-action outline" aria-label="Dia seguinte">›</button></div>
 <div class="v2-summary"><span class="chip ok"><b id="v2-booked">0</b> atendimentos</span><span class="chip"><b id="v2-free">0</b> faixas livres</span><span class="chip wait"><b id="v2-reminder-count">0</b> lembretes auto</span></div></div>
<div class="v2-grid"><div class="v2-panel">
 <h3 id="v2-day-title">26/10/2026</h3><div class="v2-badges"><span class="free">● Livre</span><span class="busy">● Agendado</span><span class="follow">● Em atendimento</span></div>
 <div id="v2-timeline" class="v2-dayline" role="list" aria-label="Horários da agenda"></div>
 <p class="v2-note">As faixas de 30 minutos ocupadas pelo mesmo procedimento ficam indisponíveis até o final do atendimento. Todos os dados são fictícios.</p>
 </div><div>
 <div class="v2-panel"><h3>Novo agendamento</h3><p>Escolha uma vaga livre e cadastre uma cliente de exemplo.</p>
  <form id="v2-booking-form"><div class="v2-field"><label for="v2-client">Cliente cadastrada (demo)</label><select id="v2-client"></select></div>
   <div class="v2-field"><label for="v2-service">Serviço</label><select id="v2-service"><option>Escova</option><option>Hidratação</option><option>Coloração</option><option>Corte</option><option>Tratamento</option><option>Finalização</option></select></div>
   <div class="v2-dual"><div class="v2-field"><label for="v2-time">Horário</label><select id="v2-time"></select></div>
   <div class="v2-field"><label for="v2-value">Valor ilustrativo (R$)</label><input id="v2-value" type="number" min="0" max="5000" step="1" value="60"></div></div>
   <button class="v2-action v2-full" type="submit">Salvar agendamento fictício</button>
  </form></div>
 <div class="v2-panel"><h3>🔔 Lembretes da agenda</h3>
 <p>Ao marcar um horário, as regras de 24h e 2h antes entram automaticamente na fila ilustrativa.</p>
 <div class="v2-line"><span>Regra padrão</span><strong>24h + 2h antes</strong></div>
 <div class="v2-line"><span>Itens demonstrativos</span><strong id="v2-reminder-total">0</strong></div>
 <div id="v2-reminder-list" class="v2-log"></div>
 <div class="v2-note">O botão <b>🔔 Lembrar</b> na agenda simula um lembrete extra da proprietária. Não envia notificações.</div>
 </div></div></div>
<div class="v2-panel"><div class="v2-toolbar"><h3>Lista de atendimentos do dia</h3>
<button type="button" class="v2-action outline" id="add-appointment">+ Agendamento rápido de exemplo</button></div>
<div class="v2-tablewrap"><table class="v2-table"><thead><tr><th>Horário</th><th>Cliente</th><th>Serviço</th><th>Situação</th><th>Ações</th></tr></thead><tbody id="all-bookings"></tbody></table></div></div>`;
const clientsMarkup=String.raw`
<div class="eyebrow">CADASTRO E RELACIONAMENTO</div><h1 class="pagetitle">Todas as clientes</h1>
<p class="lead">Lista de todas as clientes cadastradas nesta demonstração, com ficha, histórico ilustrativo e pesquisa.</p>
<div class="v2-cards">
<div class="v2-metric"><small>Clientes cadastradas</small><strong id="v2-total-clients">0</strong><em>Perfis 100% fictícios</em></div>
<div class="v2-metric"><small>Participantes do clube</small><strong id="v2-club-clients">0</strong><em>Contas simuladas</em></div>
<div class="v2-metric"><small>Clientes novas</small><strong id="v2-new-clients">0</strong><em>Perfis ilustrativos</em></div>
<div class="v2-metric"><small>Atendimentos da agenda</small><strong id="v2-bookings-total">0</strong><em>Sem dados reais</em></div></div>
<div class="v2-grid"><div class="v2-panel"><h3>Carteira de clientes</h3><p id="v2-visible-clients">Pesquise os perfis cadastrados.</p>
<div class="v2-field"><label for="client-search">Buscar por nome ou serviço</label><input id="client-search" placeholder="Ex.: Mariana ou escova" type="search" autocomplete="off"></div>
<div class="v2-tablewrap"><table class="v2-table"><thead><tr><th>Cliente</th><th>Última visita</th><th>Serviço favorito</th><th>Pontos</th><th>Ficha</th></tr></thead><tbody id="all-clients"></tbody></table></div>
<p class="v2-note">Informações fictícias, sem contatos verdadeiros. Todas as novas inscrições na demonstração desaparecem ao recarregar.</p></div>
<div><div class="v2-panel"><h3>Ficha da cliente</h3><div id="v2-client-profile" class="v2-profile"><p class="v2-muted">Toque em “Ver ficha” para escolher uma cliente.</p></div></div>
<div class="v2-panel"><h3>Nova cliente</h3><p>Simule o cadastro de um novo perfil sem acessar a base real.</p>
<form id="v2-new-client-form"><div class="v2-field"><label for="v2-new-name">Nome de exemplo</label><input id="v2-new-name" required maxlength="65" placeholder="Ex.: Ana Exemplo"></div>
<div class="v2-field"><label for="v2-new-service">Serviço de interesse</label><select id="v2-new-service"><option>Escova</option><option>Hidratação</option><option>Coloração</option><option>Corte</option><option>Tratamento</option></select></div>
<button class="v2-action v2-full" type="submit">Adicionar cliente fictícia</button></form></div></div></div>`;
const campaignsMarkup=String.raw`
<div class="eyebrow">MARKETING E VENDAS</div><h1 class="pagetitle">Campanhas comerciais</h1>
<p class="lead">Aba exclusiva para criar ofertas, divulgar serviços e mostrar promoções. Lembretes de horários ficam na agenda, não aqui.</p>
<div class="v2-cards v2-promo-area">
<div class="v2-metric"><small>Ofertas simuladas</small><strong id="v2-sales-total">0</strong><em>Rascunhos comerciais</em></div>
<div class="v2-metric"><small>Público de exemplo</small><strong id="v2-sales-audience">0</strong><em>Perfis fictícios</em></div>
<div class="v2-metric"><small>Promoções desta sessão</small><strong id="v2-sales-active">0</strong><em>Sem publicação real</em></div>
<div class="v2-metric"><small>Mensagens enviadas</small><strong>0</strong><em>Nenhum disparo de push</em></div></div>
<div class="v2-grid"><div class="v2-panel"><h3>Montar uma promoção</h3>
<div class="v2-field"><label for="v2-campaign-type">Objetivo comercial</label><select id="v2-campaign-type"><option value="Promocional">Promoção de preço</option><option value="Novidade">Divulgar novidade</option><option value="Reativação">Recuperar cliente</option></select></div>
<div class="v2-field"><label for="v2-offer-service">Procedimento ofertado</label><input id="v2-offer-service" maxlength="70" value="Hidratação premium"></div>
<div class="v2-field"><label for="v2-audience">Público da divulgação</label><select id="v2-audience"><option>Todas as clientes fictícias</option><option>Clientes do clube de exemplo</option><option>Clientes sem visita recente</option></select></div>
<div class="v2-dual"><div class="v2-field"><label for="v2-regular-price">Preço normal (R$)</label><input id="v2-regular-price" type="number" min="0" max="5000" value="160"></div>
<div class="v2-field"><label for="v2-promo-price">Preço especial (R$)</label><input id="v2-promo-price" type="number" min="0" max="5000" value="119"></div></div>
<div class="v2-field"><label for="v2-promo-validity">Válida até</label><input type="date" id="v2-promo-validity" value="2026-11-01"></div>
<div class="v2-field"><label for="campaign-message">Texto da promoção</label>
<textarea id="campaign-message" maxlength="160">✨ Semana La’Bella! Hidratação premium com preço especial por tempo limitado. Reserve seu momento de beleza!</textarea>
<span id="v2-message-count" class="v2-stat-caption">0/160 caracteres</span></div>
<button id="simulate-campaign" type="button" class="v2-action v2-full">Simular promoção — sem enviar</button>
<div class="v2-note" id="campaign-result">Nenhuma campanha simulada ainda. 0 mensagens enviadas.</div>
</div><div><div class="v2-panel"><h3>Prévia da oferta</h3><p>Como a promoção poderia aparecer para a cliente.</p>
<div class="v2-offer"><span class="eyebrow">OFERTA FICTÍCIA • LA’BELLA</span>
<h3 id="v2-preview-service">Hidratação premium</h3><del id="v2-price-from">R$ 160,00</del>
<strong class="v2-price" id="v2-price-to">R$ 119,00</strong>
<span id="v2-validity" class="v2-stat-caption">Válida até 01/11/2026</span>
<div class="v2-offer-cta">Conhecer promoção →</div></div>
<div class="v2-push"><strong id="v2-push-label">Prévia da notificação</strong><p id="v2-msg-preview"></p><span class="v2-stat-caption">Apenas prévia visual. Não entregue a nenhum celular.</span></div>
<div class="v2-note">A oferta não será publicada no aplicativo do cliente durante esta demonstração.</div></div>
<div class="v2-panel"><h3>Campanhas simuladas</h3><div id="v2-sales-history" class="v2-history"></div></div></div></div>`;
const financeMarkup=String.raw`
<div class="eyebrow">CONTROLE E RESULTADOS</div><h1 class="pagetitle">Financeiro do salão</h1>
<p class="lead">Visão de recebimentos, serviços pendentes, despesas e saldo. Todos os valores são inventados para o tour de apresentação.</p>
<div class="v2-toolbar"><label for="v2-period">Período</label><select class="select" id="v2-period"><option value="dia">Dia da agenda</option><option value="mes">Outubro de 2026 (demo)</option></select>
<span id="v2-period-label" class="v2-stat-caption">26/10/2026</span></div>
<div class="v2-cards v2-finbody">
<div class="v2-metric"><small>Entradas recebidas</small><strong id="v2-received">R$ 0</strong><em>Pagas (demonstração)</em></div>
<div class="v2-metric"><small>Serviços a receber</small><strong id="v2-pending">R$ 0</strong><em>Atendimentos sem pagamento</em></div>
<div class="v2-metric"><small>Despesas do período</small><strong id="v2-expenses">R$ 0</strong><em>Custos de exemplo</em></div>
<div class="v2-metric"><small>Saldo realizado</small><strong id="v2-result">R$ 0</strong><em>Recebido menos despesas</em></div></div>
<div class="v2-grid"><div class="v2-panel"><h3>Recebimentos por serviço</h3><p>Marque “Pago” para simular a entrada no caixa.</p>
<div class="v2-tablewrap"><table class="v2-table"><thead><tr><th>Cliente</th><th>Procedimento</th><th>Valor</th><th>Pagamento</th></tr></thead><tbody id="v2-fin-rows"></tbody></table></div>
<div class="v2-note">Somente registros fictícios. Não há recebimento real, integração bancária ou cobrança automática.</div></div>
<div class="v2-panel"><h3>Despesas da demonstração</h3><div id="v2-expense-list"></div>
<form id="v2-expense-form"><div class="v2-field"><label for="v2-expense-name">Descrição da despesa</label><input id="v2-expense-name" maxlength="65" required placeholder="Ex.: Produtos para cabelo"></div>
<div class="v2-field"><label for="v2-expense-amount">Valor ilustrativo (R$)</label><input id="v2-expense-amount" type="number" min="0.01" max="100000" step=".01" required></div>
<button type="submit" class="v2-action v2-full">Lançar despesa fictícia</button></form></div></div>`;
// Substitui apenas as telas de apresentação. As rotas reais e a autenticação permanecem em outro arquivo.
$('agenda').innerHTML=agendaMarkup;
$('clientes').innerHTML=clientsMarkup;
$('campanhas').innerHTML=campaignsMarkup;
const financePage=elem('section','page');financePage.id='financeiro';financePage.innerHTML=financeMarkup;
$('fidelidade').insertAdjacentElement('beforebegin',financePage);
const menu=document.querySelector('nav[aria-label="Seções da demonstração"]');
const marketingButton=menu?.querySelector('[data-go="campanhas"]');
if(marketingButton){
 marketingButton.lastChild.textContent=' Promoções';
 const financialButton=elem('button','navbtn');
 financialButton.type='button';financialButton.dataset.go='financeiro';
 const icon=elem('span','icon','▤');financialButton.append(icon,document.createTextNode(' Financeiro'));
 marketingButton.insertAdjacentElement('afterend',financialButton);
 financialButton.addEventListener('click',()=>goV2('financeiro'));
}
const mobileMenu=document.querySelector('.mobile-nav');
const mCamp=mobileMenu?.querySelector('[data-go="campanhas"]');
if(mCamp){
 const mFin=elem('button');mFin.type='button';mFin.dataset.go='financeiro';
 mFin.append(elem('span','','▤'),document.createTextNode('Finanças'));
 mCamp.insertAdjacentElement('afterend',mFin);
 mFin.addEventListener('click',()=>goV2('financeiro'));
}
function goV2(name){
 document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===name));
 document.querySelectorAll('[data-go]').forEach(b=>{
  if(b.classList.contains('navbtn')||b.closest('.mobile-nav')){
   if(b.dataset.go===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  }
 });
 window.scrollTo({top:0,behavior:'auto'});
}
const moneyCard=elem('div','v2-panel');moneyCard.id='v2-summary';moneyCard.setAttribute('role','status');
moneyCard.style.marginTop='15px';
$('resumo').append(moneyCard);
$('v2-prev').onclick=()=>{selectedDay=offsetDay(selectedDay,-1);refreshAll()};
$('v2-next').onclick=()=>{selectedDay=offsetDay(selectedDay,1);refreshAll()};
$('v2-day-value').onchange=e=>{if(e.target.value){selectedDay=e.target.value;refreshAll()}};
$('v2-timeline').onclick=e=>{const btn=e.target.closest('button[data-book-time]');if(btn)chooseTime(btn.dataset.bookTime)};
$('v2-service').onchange=()=>{$('v2-value').value=serviceInfo[$('v2-service').value].price};
$('v2-booking-form').onsubmit=e=>{
 e.preventDefault();
 try{book($('v2-client').value,$('v2-service').value,$('v2-time').value,Number($('v2-value').value))}
 catch(err){toast('⚠️ '+err.message)}
};
$('add-appointment').onclick=()=>{
 const t=allTimes.find(t=>minOf(t)>=17*60&&freeWindow(selectedDay,t,'Escova'));
 if(!t){toast('Sem vagas de exemplo após 17h. Selecione outra data.');return}
 try{book(2,'Escova',t,60)}catch(err){toast(err.message)}
};
$('all-bookings').onclick=e=>{
 const btn=e.target.closest('button[data-booking-action]');if(!btn)return;
 const b=bookings.find(x=>x.id===Number(btn.dataset.bookingId));if(!b)return;
 if(btn.dataset.bookingAction==='manual'){
  reminders.push({bookingId:b.id,kind:'manual',label:'Solicitado agora pela proprietária',state:'Prévia criada • nenhum envio'});
  renderReminderPanel();toast('Lembrete manual simulado para '+nameOf(b.clientId)+'. 0 mensagens enviadas.');
 }else if(b.status!=='Concluído'){
  b.status='Concluído';refreshAll();toast('Atendimento marcado como concluído (simulação).');
 }
};
$('client-search').oninput=renderClients;
$('all-clients').onclick=e=>{const btn=e.target.closest('button[data-client-id]');if(btn)viewClient(btn.dataset.clientId)};
$('v2-new-client-form').onsubmit=e=>{
 e.preventDefault();const n=$('v2-new-name').value.trim();
 if(n.length<2){toast('Informe ao menos dois caracteres.');return}
 clients.push({id:++nextId,name:n.slice(0,65),service:$('v2-new-service').value,visit:'Sem visitas',points:0,visits:0,group:'Nova'});
 $('v2-new-name').value='';refreshAll();viewClient(nextId);
 toast('Cliente de exemplo cadastrada somente na demonstração.');
};
$('v2-period').onchange=renderFinance;
$('v2-fin-rows').onclick=e=>{
 const btn=e.target.closest('button[data-pay-id]');if(!btn)return;
 const b=bookings.find(x=>x.id===Number(btn.dataset.payId));
 if(!b||b.paid)return;b.paid=true;renderFinance();updateSummary();
 toast('Pagamento fictício registrado. Nenhuma cobrança ou transferência realizada.');
};
$('v2-expense-form').onsubmit=e=>{
 e.preventDefault();const title=$('v2-expense-name').value.trim(),amount=Number($('v2-expense-amount').value);
 if(title.length<2||!Number.isFinite(amount)||amount<=0||amount>100000){toast('Confira os dados da despesa fictícia.');return}
 expenses.push({id:++nextId,date:selectedDay,title,amount});
 $('v2-expense-form').reset();renderFinance();updateSummary();toast('Despesa demonstrativa registrada. Nada foi cobrado.');
};
for(const id of ['v2-offer-service','v2-regular-price','v2-promo-price','v2-promo-validity','campaign-message']){
 $(id).addEventListener('input',renderOffers);$(id).addEventListener('change',renderOffers);
}
$('v2-campaign-type').onchange=e=>{
 const t=e.target.value;
 $('campaign-message').value=t==='Novidade'?'✨ Novidade no La’Bella! Conheça nossos serviços e escolha seu cuidado especial.':t==='Reativação'?'💛 Faz tempo que não nos vemos! Volte ao La’Bella e conheça nossas condições especiais.':'✨ Semana La’Bella! Hidratação premium com preço especial por tempo limitado. Reserve seu momento de beleza!';
 renderOffers();
};
$('simulate-campaign').onclick=()=>{
 const title=$('v2-offer-service').value.trim(),msg=$('campaign-message').value.trim(),full=Number($('v2-regular-price').value),price=Number($('v2-promo-price').value);
 if(title.length<3||msg.length<8||!Number.isFinite(price)||price<0||price>5000||!Number.isFinite(full)||full<price){
  $('campaign-result').textContent='⚠️ Confira o nome, o texto e os preços da promoção. O preço especial não pode superar o normal.';
  return;
 }
 sales.push({service:title,price,target:$('v2-audience').value});
 $('campaign-result').textContent='✓ Promoção simulada para "'+$('v2-audience').value+'". 0 mensagens enviadas; 0 clientes reais contatados; nenhum registro salvo.';
 renderSales();updateSummary();toast('Campanha comercial simulada. Nenhuma notificação real enviada.');
};
const loySelect=$('v2-loyalty-client');
loySelect.onchange=syncLoyalty;
$('add-points').onclick=()=>{
 const c=clients.find(x=>x.id===Number(loySelect.value));if(!c)return;
 c.points+=20;syncLoyalty();renderClients();toast('Pontos fictícios adicionados a '+c.name+'.');
};
$('restart-tour').onclick=()=>location.reload();
const initial=$('agenda-day-label');
if(initial)initial.textContent='Área demonstrativa';
$('v2-bookings-total').textContent=bookings.length;
refreshAll();renderOffers();viewClient(1);
const hash=(location.hash||'').slice(1);
if(['agenda','clientes','campanhas','financeiro'].includes(hash))goV2(hash);
})();
