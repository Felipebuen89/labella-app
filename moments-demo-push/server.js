'use strict';
const http=require('node:http');
const webpush=require('web-push');
const PORT=Number(process.env.PORT||10000);
const BASE=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const API_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||'';
const VAPID_PUBLIC=process.env.VAPID_PUBLIC_KEY||'';
const VAPID_PRIVATE=process.env.VAPID_PRIVATE_KEY||'';
const allowedOrigins=new Set(['https://moments-paris-demo-revendedores.onrender.com']);
if(!BASE||!API_KEY||!VAPID_PUBLIC||!VAPID_PRIVATE){
 console.error('Missing required environment configuration');process.exit(1);
}
webpush.setVapidDetails('mailto:felipebuen1989@gmail.com',VAPID_PUBLIC,VAPID_PRIVATE);
const recent=new Map();
function result(res,status,payload,origin=''){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
 if(allowedOrigins.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers.Vary='Origin'}
 res.writeHead(status,headers);res.end(JSON.stringify(payload));
}
function providerAllowed(endpoint){
 try{
  const u=new URL(endpoint),h=u.hostname.toLowerCase();
  return u.protocol==='https:' && u.username==='' && u.password==='' &&
   (h==='fcm.googleapis.com'||h==='webpush.googleapis.com'||
   h==='updates.push.services.mozilla.com'||h.endsWith('.push.services.mozilla.com')||
   h==='push.apple.com'||h.endsWith('.push.apple.com')||h.endsWith('.notify.windows.com'));
 }catch{return false}
}
async function getPayload(pin,messageId){
 const response=await fetch(BASE+'/rest/v1/rpc/moments_demo_push_targets',{
  method:'POST',headers:{apikey:API_KEY,'Content-Type':'application/json','Accept':'application/json'},
  body:JSON.stringify({p_pin:pin,p_message_id:messageId}),signal:AbortSignal.timeout(15000)
 });
 if(!response.ok)throw Object.assign(new Error('Administrator authorization or message lookup failed'),{status:403});
 return response.json();
}
async function send(messageId,pin){
 const data=await getPayload(pin,messageId);
 const subscribers=(data.subscriptions||[]).filter(s=>providerAllowed(s.endpoint) &&
  typeof s.keys?.p256dh==='string'&&typeof s.keys?.auth==='string').slice(0,4000);
 const payload=JSON.stringify({title:data.message?.title,body:data.message?.body,tag:'moments-paris-'+messageId});
 let delivered=0,failed=0;
 for(let i=0;i<subscribers.length;i+=12){
  const batch=subscribers.slice(i,i+12);
  const statuses=await Promise.allSettled(batch.map(s=>webpush.sendNotification(
   {endpoint:s.endpoint,keys:{p256dh:s.keys.p256dh,auth:s.keys.auth}},
   payload,{TTL:3600,urgency:'normal'}
  )));
  for(const st of statuses){if(st.status==='fulfilled')delivered++;else failed++}
 }
 return {ok:true,registered:subscribers.length,delivered,failed};
}
http.createServer(async(req,res)=>{
 const origin=req.headers.origin||'';
 if(req.method==='GET'&&req.url==='/health')return result(res,200,{ok:true,service:'moments-paris-original-push'});
 if(req.method==='OPTIONS'){
  if(!allowedOrigins.has(origin))return result(res,403,{error:'Invalid origin'});
  res.writeHead(204,{'Access-Control-Allow-Origin':origin,'Vary':'Origin',
   'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'content-type',
   'Access-Control-Max-Age':'600'});return res.end();
 }
 if(req.method!=='POST'||req.url!=='/broadcast')return result(res,404,{error:'Not found'},origin);
 if(!allowedOrigins.has(origin))return result(res,403,{error:'Invalid origin'});
 try{
  let body='';for await(const chunk of req){body+=String(chunk);if(body.length>5000)throw Object.assign(new Error('Too large'),{status:413})}
  const input=JSON.parse(body);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(input.messageId||''))||
  typeof input.pin!=='string'||input.pin.length<20||input.pin.length>80)
    return result(res,400,{error:'Invalid broadcast request'},origin);
  const id=input.messageId;
  for(const [k,ts] of recent){if(Date.now()-ts>60000)recent.delete(k)}
  if(recent.has(id))return result(res,429,{error:'Message already broadcast recently'},origin);
  const output=await send(id,input.pin);
  recent.set(id,Date.now());
  return result(res,200,output,origin);
 }catch(err){console.error('Moments push broadcast failed:',err?.message);
  return result(res,err?.status||500,{error:err?.status===403?'Access denied':'Broadcast unavailable'},origin)}
}).listen(PORT,'0.0.0.0',()=>console.log('Moments original push service ready'));
