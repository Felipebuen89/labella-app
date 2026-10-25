'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const pwd = 'Test-Strong-Password-Audit-2026';
const ORIGIN = 'https://felipebuen89.github.io';
const baseDir = __dirname;
let child;
let stdout = '';

async function unusedPort(){
  const s = net.createServer();
  await new Promise((resolve,reject)=>s.once('error',reject).listen(0,'127.0.0.1',resolve));
  const p=s.address().port;
  await new Promise(r=>s.close(r));
  return p;
}

async function fetchJSON(base, endpoint, {method='GET',json,origin=ORIGIN,token}={}){
  const headers={Origin:origin};
  if(json!==undefined) headers['Content-Type']='application/json';
  if(token) headers.Authorization='Bearer '+token;
  const r=await fetch(base+endpoint,{method,headers,body:json!==undefined?JSON.stringify(json):undefined,signal:AbortSignal.timeout(10000)});
  let body={};try{body=await r.json()}catch(e){}
  return {status:r.status,headers:r.headers,body};
}
async function waitForServer(base){
  for(let i=0;i<120;i++){
    if(child.exitCode!==null)throw Error('Servidor parou antes da verificação: '+stdout.slice(-2000));
    try{
      const r=await fetchJSON(base,'/health');
      if(r.status===200)return;
    }catch(_){}
    await new Promise(r=>setTimeout(r,50));
  }
  throw Error('Servidor não iniciou em 6 segundos. '+stdout.slice(-1000));
}
test('Auditoria isolada: painel, autenticação, dispositivo, envio e diagnósticos', {timeout:20000},async t=>{
 const port=await unusedPort();
 const base='http://127.0.0.1:'+port;
 child=spawn(process.execPath,['server.js'],{
   cwd:baseDir,
   env:{
    ...process.env, NODE_ENV:'test', PORT:String(port),
    NODE_OPTIONS:'--require '+path.join(baseDir,'audit-mock-push.cjs'),
    VAPID_PUBLIC:'audit-only-public-key',VAPID_PRIVATE:'audit-only-private-key',
    ADMIN_PASSWORD_SHA256:crypto.createHash('sha256').update(pwd).digest('hex')
   },stdio:['ignore','pipe','pipe']
 });
 child.stdout.on('data',x=>stdout+=String(x));
 child.stderr.on('data',x=>stdout+=String(x));
 try{
  await waitForServer(base);
  await t.test('Servidor responde no endpoint de saúde',async()=>{
    const r=await fetchJSON(base,'/health');
    assert.equal(r.status,200);
    assert.equal(r.body.ok,true);
  });
  await t.test('Preflight permite Authorization e Content-Type',async()=>{
    const r=await fetch(base+'/admin/login',{method:'OPTIONS',headers:{
     Origin:ORIGIN,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'Authorization, Content-Type'
    }});
    assert.equal(r.status,204);
    assert.equal(r.headers.get('access-control-allow-origin'),ORIGIN);
    assert.match(r.headers.get('access-control-allow-headers'),/Authorization/);
  });
  await t.test('Recusa requisições sem login e de origem não autorizada',async()=>{
    const unauth=await fetchJSON(base,'/admin/devices');
    assert.equal(unauth.status,401);
    const origin=await fetchJSON(base,'/admin/devices',{origin:'https://outro-dominio.example'});
    assert.equal(origin.status,403);
  });
  await t.test('Login inválido falha',async()=>{
    const wrong=await fetchJSON(base,'/admin/login',{method:'POST',json:{password:'SenhaErrada-auditoria'}});
    assert.equal(wrong.status,401);
  });
  let token='';
  await t.test('Login correto fornece sessão temporária',async()=>{
    const r=await fetchJSON(base,'/admin/login',{method:'POST',json:{password:pwd}});
    assert.equal(r.status,200);
    assert.ok(r.body.token && r.body.token.length>30);
    token=r.body.token;
  });
  await t.test('Cadastro só aceita endpoints Web Push válidos',async()=>{
    const bad=await fetchJSON(base,'/admin/register',{method:'POST',token,json:{
      label:'Aparelho falso',subscription:{endpoint:'https://atacante.example/push',keys:{p256dh:'fake',auth:'fake'}}
    }});
    assert.equal(bad.status,400);
    const empty=await fetchJSON(base,'/admin/devices',{token});
    assert.equal(empty.status,200);
    assert.equal(empty.body.devices.length,0);
  });
  let id='';
  await t.test('Cadastro e listagem de um aparelho de homologação',async()=>{
    const r=await fetchJSON(base,'/admin/register',{method:'POST',token,json:{
      label:'iPhone de homologação (fictício)',
      subscription:{
       endpoint:'https://web.push.apple.com/test-audit-only',
       keys:{p256dh:'chave-do-testador',auth:'assinatura-teste'}
      }
    }});
    assert.equal(r.status,201);
    id=r.body.id;
    const devices=await fetchJSON(base,'/admin/devices',{token});
    assert.equal(devices.status,200);
    assert.equal(devices.body.devices.length,1);
    assert.equal(devices.body.devices[0].id,id);
  });
  await t.test('Rejeita campanha sem dispositivo autorizado',async()=>{
    const r=await fetchJSON(base,'/admin/send',{method:'POST',token,json:{
      kind:'promocao',message:'Esta é uma promoção de homologação!',deviceIds:['nao-existe']
    }});
    assert.equal(r.status,400);
  });
  let jobId='';
  await t.test('Agenda campanha, encaminha ao mock sem enviar nada à Apple, e registra diagnóstico',async()=>{
    const r=await fetchJSON(base,'/admin/send',{method:'POST',token,json:{
      kind:'promocao',message:'Esta é uma promoção de homologação!',deviceIds:[id]
    }});
    assert.equal(r.status,202);
    assert.equal(r.body.recipients,1);
    assert.ok(r.body.jobId);
    jobId=r.body.jobId;
    let status;
    for(let i=0;i<40;i++){
      const q=await fetchJSON(base,'/admin/send-status?id='+jobId,{token});
      assert.equal(q.status,200);
      status=q.body.status;
      if(status==='aceito_pelo_provedor')break;
      await new Promise(r=>setTimeout(r,30));
    }
    assert.equal(status,'aceito_pelo_provedor','Mock recebeu a campanha, status aceito');
    assert.match(stdout,/Painel: Web Push aceito pelo provedor/);
  });
  await t.test('Exclui aparelho e impede envio posterior sem recadastro',async()=>{
    const removed=await fetchJSON(base,'/admin/remove-device',{method:'POST',token,json:{id}});
    assert.equal(removed.status,200);
    assert.equal(removed.body.removed,true);
    const send=await fetchJSON(base,'/admin/send',{method:'POST',token,json:{
      kind:'lembrete',message:'Novo lembrete de homologação!',deviceIds:[id]
    }});
    assert.equal(send.status,400);
  });
  await t.test('Logout invalida a sessão',async()=>{
    const x=await fetchJSON(base,'/admin/logout',{method:'POST',token,json:{}});
    assert.equal(x.status,200);
    assert.equal((await fetchJSON(base,'/admin/me',{token})).status,401);
  });
  await t.test('JavaScript inline do painel e da página de teste compila',async()=>{
    for(const page of ['../painel.html','../notificacoes.html']){
      const html=fs.readFileSync(path.join(baseDir,page),'utf8');
      const js=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
      assert.ok(js.length, 'Deve ter script inline em '+page);
      for(const source of js)assert.doesNotThrow(()=>new Function(source));
    }
  });
 }finally{
   child?.kill('SIGTERM');
 }
});
