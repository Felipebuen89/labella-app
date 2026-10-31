const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM, VirtualConsole} = require('jsdom');
function openApp(){
  const errors=[];
  const vc=new VirtualConsole();
  vc.on('jsdomError',e=>errors.push(String(e)));
  const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{
    url:'https://felipebuen89.github.io/labella-app/',
    runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
    beforeParse(w){w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};}
  });
  return {w:dom.window,d:dom.window.document,errors,close:()=>dom.window.close()};
}
function click(d,selector){let el=d.querySelector(selector);assert.ok(el,'Elemento ausente: '+selector);el.click();}
function change(w,el){el.dispatchEvent(new w.Event('change',{bubbles:true}));}
function data(w){return JSON.parse(w.localStorage.getItem('treinolab-v1'));}
test('Tela inicial e plano inicial de treinos',()=>{
 const a=openApp();
 assert.match(a.d.title,/TreinoLab/);
 assert.match(a.d.querySelector('#main').textContent,/Seu ritmo/);
 assert.equal(data(a.w).days.length,3);
 assert.ok(data(a.w).days[0].ex.length>=3);
 assert.deepEqual(a.errors,[]);
 a.close();
});
test('Gerar plano de 4 dias, objetivo e local casa',()=>{
 const a=openApp();
 click(a.d,'[data-tab="plan"]');
 click(a.d,'[data-action="builder"]');
 assert.ok(a.d.querySelector('#builderForm'));
 a.d.querySelector('#days').value='4';
 a.d.querySelector('#goal').value='Condicionamento';
 a.d.querySelector('#equip').value='casa';
 a.d.querySelector('#builderForm').dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(data(a.w).days.length,4);
 assert.equal(data(a.w).settings.goal,'Condicionamento');
 assert.ok(data(a.w).days.every(day=>day.ex.every(ex=>ex.id>=0)));
 assert.match(a.d.querySelector('#main').textContent,/Meus treinos/);
 assert.deepEqual(a.errors,[]);
 a.close();
});
test('Execução e conclusão salvam sessão real no navegador',()=>{
 const a=openApp();
 click(a.d,'[data-action="start"]');
 const check=a.d.querySelector('[data-done="0"]');
 assert.ok(check);
 check.checked=true;
 change(a.w,check);
 const input=a.d.querySelector('[data-log="weight"][data-entry="0"]');
 input.value='20';change(a.w,input);
 click(a.d,'[data-action="finish"]');
 assert.equal(data(a.w).sessions.length,1);
 assert.equal(data(a.w).sessions[0].done,1);
 assert.equal(data(a.w).active,undefined);
 assert.match(a.d.querySelector('#main').textContent,/Sua evolução/);
 assert.deepEqual(a.errors,[]);
 a.close();
});
test('Buscar exercícios e adicionar ao treino',()=>{
 const a=openApp();
 click(a.d,'[data-tab="library"]');
 const search=a.d.querySelector('#search');
 search.value='agachamento';search.dispatchEvent(new a.w.Event('input',{bubbles:true}));
 assert.match(a.d.querySelector('#libResults').textContent,/Agachamento/);
 const before=data(a.w).days[0].ex.length;
 click(a.d,'[data-action="add"]');
 assert.equal(data(a.w).days[0].ex.length,before+1);
 assert.deepEqual(a.errors,[]);
 a.close();
});