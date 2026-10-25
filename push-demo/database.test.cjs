'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
process.env.PUSH_DB_URL='https://mock-supabase.invalid';
process.env.PUSH_DB_PUBLISHABLE_KEY='sb_publishable_mock_test_only';
process.env.PUSH_DB_SECRET='fake-secret-for-tests-only';
const db=require('./database');
const requests=[];
const original=global.fetch;
function respond(result,status=200){
  return new Response(JSON.stringify(result),{status,headers:{'content-type':'application/json'}});
}
const a='11111111-1111-4111-8111-111111111111';
const b='22222222-2222-4222-8222-222222222222';

test('Persistência Supabase: RPCs só enviam segredo pelo servidor e parâmetros esperados',async()=>{
 assert.equal(db.enabled,true);
 global.fetch=async(url,opts)=>{
   const method=String(url).split('/').at(-1);
   const payload=JSON.parse(opts.body);
   requests.push({method,payload,headers:opts.headers});
   assert.equal(opts.headers.apikey,'sb_publishable_mock_test_only');
   assert.equal(payload.p_secret,'fake-secret-for-tests-only');
   if(method==='lb_push_admin_devices')return respond([{id:a,label:'Meu iPhone'}]);
   if(method==='lb_push_admin_register')return respond({id:a,label:'Meu iPhone'});
   if(method==='lb_push_admin_remove')return respond(true);
   if(method==='lb_push_admin_schedule')return respond({id:b,recipients:1,status:'agendado'});
   if(method==='lb_push_admin_campaign')return respond({id:b,status:'agendado',recipients:1});
   return respond({error:'função inesperada'},404);
 };
 try{
  const list=await db.devices();
  assert.equal(list[0].label,'Meu iPhone');
  const reg=await db.register('Meu iPhone',{endpoint:'https://web.push.apple.com/audit',keys:{auth:'X',p256dh:'Y'}});
  assert.equal(reg.id,a);
  const scheduled=await db.schedule('promocao','Promoção especial de teste',[a],30000);
  assert.equal(scheduled.id,b);
  const detail=await db.campaign(b);
  assert.equal(detail.status,'agendado');
  assert.equal(await db.remove(a),true);
  assert.deepEqual(requests.map(x=>x.method),[
   'lb_push_admin_devices','lb_push_admin_register','lb_push_admin_schedule',
   'lb_push_admin_campaign','lb_push_admin_remove'
  ]);
  const payload=requests.find(x=>x.method==='lb_push_admin_schedule').payload;
  assert.ok(new Date(payload.p_scheduled_at).valueOf()>Date.now());
 }finally{global.fetch=original;requests.length=0;}
});

test('Worker só marca aceito quando o provedor de notificações aceita a campanha',async()=>{
 let completions=[];
 let outgoing=[];
 global.fetch=async(url,opts)=>{
  const method=String(url).split('/').at(-1);
  const payload=JSON.parse(opts.body);
  if(method==='lb_push_admin_claim')return respond([{
   id:b,kind:'promocao',message:'Promoção fictícia de auditoria',
   targets:[{subscription:{endpoint:'https://example.invalid/no-real-send',keys:{auth:'X',p256dh:'Y'}}}]
  }]);
  if(method==='lb_push_admin_complete'){
   completions.push(payload);
   return respond(true);
  }
  return respond([],200);
 };
 try{
  await db.processDue({async sendNotification(subscription,json){
   outgoing.push(JSON.parse(json));
   return {statusCode:201};
  }});
  assert.equal(outgoing.length,1);
  assert.equal(outgoing[0].title,'Promoção da semana');
  assert.equal(completions.length,1);
  assert.equal(completions[0].p_accepted,1);
  assert.equal(completions[0].p_failed,0);
 }finally{global.fetch=original}
});

test('Falhas do provedor são registradas em vez de marcadas como sucesso',async()=>{
 let result;
 global.fetch=async(url,opts)=>{
  const method=String(url).split('/').at(-1);
  if(method==='lb_push_admin_claim')return respond([{
   id:b,kind:'lembrete',message:'Lembrete falso usado na auditoria',
   targets:[{subscription:{endpoint:'https://example.invalid/no-real-send',keys:{auth:'X',p256dh:'Y'}}}]
  }]);
  if(method==='lb_push_admin_complete'){result=JSON.parse(opts.body);return respond(true);}
  return respond([],200);
 };
 try{
  await db.processDue({async sendNotification(){throw Object.assign(Error('Falha simulada'),{statusCode:410});}});
  assert.equal(result.p_accepted,0);
  assert.equal(result.p_failed,1);
 }finally{global.fetch=original}
});
