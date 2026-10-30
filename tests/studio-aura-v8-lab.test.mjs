import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

const dirnameHere=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(resolve(dirnameHere,'../studio-aura-v8-lab.html'),'utf8');
const source=html.match(/<script>([\\s\\S]*?)<\\/script>/)?.[1];
const key='move_digital_premium_demo_v8_lab';

function boot(search='',store={}){
  const root={innerHTML:''}, toast={textContent:'',classList:{add(){},remove(){}}};
  const handlers={};
  const input={'campaign-title':{value:'Campanha fictícia'},'campaign-text':{value:'Nenhum envio real será realizado.'}};
  const document={
    getElementById(id){return id==='root'?root:id==='toast'?toast:input[id]??null},
    addEventListener(name,handler){handlers[name]=handler}
  };
  const localStorage={getItem(k){return store[k]??null},setItem(k,v){store[k]=v}};
  const location={search,href:''};
  runInNewContext(source,{
    document,localStorage,location,URLSearchParams,Date,Intl,window:{scrollTo(){}},
    setTimeout(){return 1},clearTimeout(){},confirm(){return true}
  },{timeout:1500});
  function click(action,value,extra={}){
    const button={getAttribute(name){return name==='data-a'?action:name==='data-v'?value:extra[name]??null}};
    handlers.click({target:{closest(){return button}}});
  }
  return {root,store,click,location};
}

test('HTML contém aviso de protótipo e bloqueio de indexação',()=>{
  assert.ok(source,'script principal ausente');
  assert.match(html,/noindex,nofollow/);
  assert.match(html,/MODO DEMONSTRAÇÃO/);
  assert.match(html,/prefers-reduced-motion/);
  assert.match(html,/focus-visible/);
});
test('V8 não compartilha armazenamento e links com V7',()=>{
  assert.match(html,/move_digital_premium_demo_v8_lab/);
  assert.doesNotMatch(html,/studio-aura-v7\\.html/);
  assert.doesNotMatch(source,/fetch\\s*\\(/);
});
test('cliente abre telas de agendamento e clube',()=>{
  const app=boot();
  assert.match(app.root.innerHTML,/Studio Aura/);
  app.click('go','agendar');
  assert.match(app.root.innerHTML,/Agendamento|agendar|horário/i);
  app.click('go','clube');
  assert.match(app.root.innerHTML,/pontos|benefícios/i);
});
test('painel abre e navega para campanhas sem sair da V8',()=>{
  const app=boot('?painel=1');
  assert.match(app.root.innerHTML,/PAINEL DO PROPRIETÁRIO/);
  assert.match(app.root.innerHTML,/studio-aura-v8-lab\\.html/);
  app.click('admin-go','campanhas');
  assert.match(app.root.innerHTML,/Campanhas/);
});
test('campanha de demonstração salva e publica apenas localmente',()=>{
  const store={};
  const app=boot('?painel=1',store);
  app.click('admin-go','campanhas');
  app.click('save-campaign');
  assert.equal(JSON.parse(store[key]).campaigns.length,1);
  app.click('publish-campaign','0');
  assert.equal(JSON.parse(store[key]).published.title,'Campanha fictícia');
});
