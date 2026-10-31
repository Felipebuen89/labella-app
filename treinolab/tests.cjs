const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
function open(){
 const errors=[],alerts=[],vc=new VirtualConsole();
 vc.on('jsdomError',e=>errors.push(String(e)));
 const w=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://felipebuen89.github.io/labella-app/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.confirm=()=>true;w.alert=(m)=>alerts.push(String(m));w.scrollTo=()=>{};}});
 return {w:w.window,d:w.window.document,errors,alerts,close:()=>w.window.close()};
}
function click(d,s){let e=d.querySelector(s);assert.ok(e,'Elemento não encontrado: '+s);e.click();}
function input(w,d,id,value){const e=d.getElementById(id);assert.ok(e,id);e.value=String(value);e.dispatchEvent(new w.Event('change',{bubbles:true}));}
function state(a,id='p1'){return JSON.parse(a.w.localStorage.getItem('treinolab-v1-'+id));}
function form(a,settings={}){
 click(a.d,'[data-action="builder"]');
 let defaults={personName:'Pessoa de teste',age:33,weight:76,height:170,sex:'Feminino',goal:'Condicionamento',level:'Iniciante',days:3,minutes:30,equip:'academia',start:'2026-11-02',weeks:6,lipedema:'false',pain:0,cleared:'sim',redFlags:'nao'};
 for(const [id,value] of Object.entries({...defaults,...settings}))input(a.w,a.d,id,value);
 a.d.getElementById('builderForm').dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
}
test('Primeiro uso pede avaliação; não inventa carga ou plano',()=>{
 const a=open();assert.match(a.d.title,/TreinoLab/);
 assert.match(a.d.getElementById('main').textContent,/avaliação/i);
 assert.equal(state(a).days.length,0);
 assert.deepEqual(a.errors,[]);a.close();
});
test('Plano personalizado respeita dias, tempo, objetivo e calendário',()=>{
 const a=open();form(a,{days:4,minutes:40,goal:'Hipertrofia',start:'2026-11-05',weeks:4});
 const s=state(a);assert.equal(s.days.length,4);assert.equal(s.settings.minutes,40);
 assert.equal(s.settings.start,'2026-11-05');assert.equal(s.settings.weeks,4);
 assert.ok(s.days.every(d=>d.minutes===40));
 assert.match(a.d.getElementById('main').textContent,/05\/11\/2026/);
 assert.match(a.d.getElementById('main').textContent,/02\/12\/2026/);
 assert.deepEqual(a.errors,[]);a.close();
});
test('Lipedema: plano de baixo impacto e limite de duração',()=>{
 const a=open();form(a,{lipedema:'true',pain:3,days:3,minutes:30,goal:'Condicionamento'});
 const s=state(a);
 assert.equal(s.settings.lipedema,true);
 assert.equal(s.days.length,3);
 assert.ok(s.days.every(d=>d.minutes===30 && d.ex.some(e=>[40,41,42,43].includes(e.id)||e.reps.includes('min'))));
 assert.ok(!s.days.flatMap(d=>d.ex).some(e=>[14,35].includes(e.id)),'evitar impacto');
 assert.deepEqual(a.errors,[]);a.close();
});
test('Dor elevada e sinais de alerta bloqueiam geração',()=>{
 const a=open();
 click(a.d,'[data-action="builder"]');
 input(a.w,a.d,'redFlags','sim');
 a.d.getElementById('builderForm').dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(state(a).days.length,0);assert.ok(a.alerts.some(m=>m.includes('alerta')));
 a.close();
});
test('Registrar treino salva cargas e percepção de esforço',()=>{
 const a=open();form(a);
 click(a.d,'[data-action="start"]');
 const chk=a.d.querySelector('[data-done="0"]');assert.ok(chk);chk.checked=true;chk.dispatchEvent(new a.w.Event('change',{bubbles:true}));
 const weight=a.d.querySelector('[data-log="weight"][data-entry="0"]');
 assert.ok(weight);weight.value='12';weight.dispatchEvent(new a.w.Event('change',{bubbles:true}));
 const reps=a.d.querySelector('[data-log="actualReps"][data-entry="0"]');reps.value='12';reps.dispatchEvent(new a.w.Event('change',{bubbles:true}));
 const rir=a.d.querySelector('[data-log="actualRir"][data-entry="0"]');rir.value='3';rir.dispatchEvent(new a.w.Event('change',{bubbles:true}));
 input(a.w,a.d,'sessionPain','0');
 click(a.d,'[data-action="finish"]');
 const s=state(a);assert.equal(s.sessions.length,1);assert.equal(s.sessions[0].done,1);
 assert.equal(s.sessions[0].exercises[0].weight,12);
 assert.equal(s.sessions[0].exercises[0].actualRir,'3');
 assert.deepEqual(a.errors,[]);a.close();
});
test('Perfis independentes não misturam treinos',()=>{
 const a=open();form(a,{personName:'Pessoa 1'});
 click(a.d,'[data-action="profiles"]');
 input(a.w,a.d,'newPersonName','Pessoa 2');
 a.d.getElementById('newProfileForm').dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
 const reg=JSON.parse(a.w.localStorage.getItem('treinolab-profiles-v2'));
 assert.equal(reg.list.length,2);assert.notEqual(reg.active,'p1');
 assert.equal(state(a,reg.active).days.length,0);
 click(a.d,'[data-action="close"]');click(a.d,'[data-action="profiles"]');
 click(a.d,'[data-action="switchProfile"][data-profile="p1"]');
 assert.equal(state(a).settings.name,'Pessoa 1');
 assert.equal(state(a).days.length,3);
 assert.deepEqual(a.errors,[]);a.close();
});
test('Demonstração visual ACE e pesquisa de vídeos acessíveis',()=>{
 const a=open();form(a);
 click(a.d,'[data-action="start"]');
 assert.ok(a.d.querySelector('a[href*="youtube.com/results"]'));
 assert.ok(a.d.querySelector('a[href*="acefitness.org/resources"]'));
 assert.deepEqual(a.errors,[]);a.close();
});

test('Sem JavaScript a tela nunca fica completamente preta',()=>{
 const {JSDOM}=require('jsdom');
 const html=fs.readFileSync('index.html','utf8');
 const dom=new JSDOM(html,{url:'https://felipebuen89.github.io/labella-app/',runScripts:'outside-only'});
 const body=dom.window.document.querySelector('#main');
 assert.ok(body,'Área principal presente');
 assert.match(body.textContent,/Seu plano começa aqui/i);
 assert.ok(body.querySelector('a[href*="atualizar="]'));
 dom.window.close();
});
test('O renderizador inclui proteção contra falha e não apaga dados armazenados',()=>{
 const source=fs.readFileSync('index.html','utf8');
 assert.match(source,/TreinoLab: erro ao montar a tela/);
 assert.match(source,/Seus treinos permanecem salvos/);
 assert.match(source,/try \{\s*document\.getElementById\('main'\)\.innerHTML/);
});

test('Sinais de alerta têm resposta explícita, sem checkbox confuso',()=>{
 const a=open();
 click(a.d,'[data-action="builder"]');
 const flag=a.d.getElementById('redFlags');
 assert.equal(flag.tagName,'SELECT');
 assert.equal(flag.value,'');
 assert.equal(flag.required,true);
 assert.match(flag.textContent,/NÃO — nenhum desses sinais de alerta/);
 assert.match(flag.textContent,/SIM — tenho pelo menos um desses sintomas/);
 a.d.getElementById('builderForm').dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(state(a).days.length,0);
 assert.ok(a.alerts.some(m=>m.includes('Responda')));
 a.close();
});
test('Juliana com lipedema, dor leve e SEM sinais de alerta pode gerar um plano',()=>{
 const a=open();
 form(a,{personName:'Juliana',sex:'Feminino',age:36,weight:52,height:153,goal:'Hipertrofia',lipedema:'true',pain:2,cleared:'sim',days:4,minutes:45,redFlags:'nao'});
 const s=state(a);
 assert.equal(s.settings.name,'Juliana');
 assert.equal(s.settings.redFlags,false);
 assert.equal(s.settings.lipedema,true);
 assert.equal(s.days.length,4);
 assert.equal(a.alerts.filter(m=>m.includes('alerta')).length,0);
 assert.deepEqual(a.errors,[]);
 a.close();
});


function manual(a,opts={}){
 click(a.d,'[data-action="manualWizard"]');
 let v={manName:'Paula',manDays:4,manMinutes:45,manStart:'2026-11-01',manWeeks:6,manLipedema:'false',manCleared:'sim',manAlert:'nao',...opts};
 for(const [k,value] of Object.entries(v))input(a.w,a.d,k,value);
 a.d.getElementById('manAcknowledge').checked=true;
 a.d.getElementById('manualForm').dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
}
test('Catálogo supera 400 variações e cobre todos os membros',()=>{
 const a=open();
 click(a.d,'[data-tab="library"]');
 const txt=a.d.getElementById('libResults').textContent;
 assert.match(txt,/414/);
 const groups=['Quadríceps','Posterior de coxa','Adutores','Abdutores','Panturrilhas','Tibial anterior','Antebraços','Peito','Costas','Ombros','Core','Mobilidade'];
 const opts=Array.from(a.d.getElementById('muscleFilter').options).map(e=>e.value);
 for(const g of groups)assert.ok(opts.includes(g),'faltou '+g);
 assert.ok(a.d.querySelector('[data-action="showMore"]'));
 assert.deepEqual(a.errors,[]);
 a.close();
});
test('Treino livre cria dias vazios, e permite escolher exercícios por grupo',()=>{
 const a=open();
 manual(a,{manName:'Maria',manDays:3,manMinutes:30});
 let p=state(a);
 assert.equal(p.settings.mode,'manual');assert.equal(p.days.length,3);assert.ok(p.days.every(d=>d.ex.length===0));
 assert.match(a.d.getElementById('main').textContent,/Biblioteca completa/);
 input(a.w,a.d,'muscleFilter','Quadríceps');
 assert.match(a.d.getElementById('libResults').textContent,/agachamento/i);
 const btn=a.d.querySelector('#libResults [data-action="add"]:not([disabled])');
 assert.ok(btn);btn.click();
 p=state(a);assert.equal(p.days[0].ex.length,1);
 assert.equal(p.days[0].minutes,30);
 assert.deepEqual(a.errors,[]);
 a.close();
});
test('Montagem própria permite reorganizar, renomear, editar e salvar treino',()=>{
 const a=open();manual(a);
 const first=a.d.querySelector('#libResults [data-action="add"]:not([disabled])');first.click();
 const next=a.d.querySelector('#libResults [data-action="add"]:not([disabled])');next.click();
 const start=state(a).days[0].ex.map(x=>x.id);assert.equal(start.length,2);
 click(a.d,'[data-tab="plan"]');
 click(a.d,'[data-action="expand"][data-idx="0"]');
 click(a.d,'[data-action="moveExercise"][data-dir="1"][data-idx="0"][data-ex="0"]');
 assert.deepEqual(state(a).days[0].ex.map(x=>x.id),start.slice().reverse());
 const inputName=a.d.querySelector('[data-day-name="0"]');inputName.value='Treino costas e braços';inputName.dispatchEvent(new a.w.Event('change',{bubbles:true}));
 const inputSets=a.d.querySelector('[data-edit="sets"][data-idx="0"][data-ex="0"]');inputSets.value='4';inputSets.dispatchEvent(new a.w.Event('change',{bubbles:true}));
 assert.equal(state(a).days[0].name,'Treino costas e braços');
 assert.equal(state(a).days[0].ex[0].sets,4);
 assert.deepEqual(a.errors,[]);
 a.close();
});
test('É possível registrar exercício pessoal e escolher no treino',()=>{
 const a=open();manual(a);
 click(a.d,'[data-action="customExercise"]');
 input(a.w,a.d,'customName','Remada especial personalizada');
 input(a.w,a.d,'customGroup','Costas');
 input(a.w,a.d,'customEnvironment','casa');
 input(a.w,a.d,'customMaterial','Elástico');
 a.d.getElementById('customExerciseForm').dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(state(a).customExercises.length,1);
 assert.match(a.d.getElementById('libResults').textContent,/Remada especial personalizada/);
 click(a.d,'#libResults [data-action="add"]:not([disabled])');
 assert.equal(state(a).days[0].ex[0].id,state(a).customExercises[0].id);
 assert.deepEqual(a.errors,[]);
 a.close();
});
test('Sinais de alerta bloqueiam também montagem manual',()=>{
 const a=open();click(a.d,'[data-action="manualWizard"]');
 input(a.w,a.d,'manName','Maria');
 input(a.w,a.d,'manAlert','sim');
 a.d.getElementById('manAcknowledge').checked=true;
 a.d.getElementById('manualForm').dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(state(a).days.length,0);
 assert.ok(a.alerts.some(m=>/alerta/i.test(m)));
 a.close();
});
test('Sem exercício, iniciar treino não inicia sessão',()=>{
 const a=open();manual(a);
 click(a.d,'[data-tab="plan"]');
 assert.ok(a.d.querySelector('[data-action="start"][disabled]'));
 assert.equal(state(a).active,undefined);
 a.close();
});
