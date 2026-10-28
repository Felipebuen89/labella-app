'use strict';
const http = require('node:http');
const webpush = require('web-push');
const PORT = Number(process.env.PORT || 10000);
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const ALLOWED_ORIGIN = 'https://moments-paris-painel-franquia.onrender.com';
if (!SUPABASE_URL || !SUPABASE_KEY || !PUBLIC_KEY || !PRIVATE_KEY) {
 console.error('Missing required backend environment variables.');
 process.exit(1);
}
webpush.setVapidDetails('mailto:felipebuen1989@gmail.com', PUBLIC_KEY, PRIVATE_KEY);

function respond(res, code, data, origin = '') {
 const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff'};
 if(origin === ALLOWED_ORIGIN){
  headers['Access-Control-Allow-Origin'] = origin;
  headers['Vary']='Origin';
 }
 res.writeHead(code, headers);
 res.end(JSON.stringify(data));
}
async function getRemote(path,jwt) {
 const r=await fetch(SUPABASE_URL+path,{headers:{apikey:SUPABASE_KEY,authorization:'Bearer '+jwt,'Accept':'application/json'},signal:AbortSignal.timeout(14000)});
 if(!r.ok)throw Error('Supabase response '+r.status);
 return r.json();
}
const allowedEndpoint = endpoint => {
 try {
  const url = new URL(endpoint);
  const h=url.hostname.toLowerCase();
  return url.protocol==='https:' && (h==='fcm.googleapis.com'||h==='webpush.googleapis.com'
   ||h==='updates.push.services.mozilla.com'||h.endsWith('.push.services.mozilla.com')
   ||h.endsWith('.push.apple.com')||h.endsWith('.notify.windows.com'));
 }catch{return false}
};
const isUUID = x => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(x||''));

async function deliver(announcementId, jwt){
 const profile=await getRemote('/auth/v1/user',jwt);
 if(!profile?.id)throw Object.assign(Error('Invalid user'),{status:401});
 const uid=encodeURIComponent(profile.id);
 const members=await getRemote('/rest/v1/memberships?select=role,active&user_id=eq.'+uid+'&limit=1',jwt);
 if(!Array.isArray(members)||!members.some(m=>m.active&&['franchise_admin','platform_admin'].includes(m.role)))
  throw Object.assign(Error('Administrator required'),{status:403});
 const rows=await getRemote('/rest/v1/moments_announcements?select=id,title,body,kind,audience&id=eq.'+encodeURIComponent(announcementId)+'&limit=1',jwt);
 if(!rows.length||rows[0].audience!=='todos'||!['campanha','notificacao'].includes(rows[0].kind))
  throw Object.assign(Error('Announcement not eligible'),{status:404});
 const announcement=rows[0];
 const subscriptionRows=await getRemote('/rest/v1/moments_push_subscriptions?select=endpoint,keys&limit=1000',jwt);
 const valid=subscriptionRows.filter(s=>allowedEndpoint(s.endpoint)&&s.keys?.p256dh&&s.keys?.auth);
 let delivered=0, failed=0;
 const payload=JSON.stringify({title:announcement.title,body:announcement.body,tag:'moments-'+announcement.id});
 for(let i=0;i<valid.length;i+=12){
  const segment=valid.slice(i,i+12);
  const results=await Promise.allSettled(segment.map(s=>webpush.sendNotification(
   {endpoint:s.endpoint,keys:{p256dh:s.keys.p256dh,auth:s.keys.auth}},payload,{TTL:3600,urgency:'normal'}
  )));
  for(const result of results){if(result.status==='fulfilled')delivered++;else failed++}
 }
 return {success:true,subscribers:valid.length,delivered,failed};
}
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin||'';
 if(req.method==='OPTIONS'){
  if(origin!==ALLOWED_ORIGIN)return respond(res,403,{error:'Invalid origin'},origin);
  res.writeHead(204,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST,OPTIONS',
   'Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Max-Age':'600','Vary':'Origin'});
  return res.end();
 }
 if(req.method==='GET'&&req.url==='/health')return respond(res,200,{status:'ok',application:'moments-paris-push'});
 if(req.method!=='POST'||req.url!=='/broadcast')return respond(res,404,{error:'Not found'},origin);
 if(origin!==ALLOWED_ORIGIN)return respond(res,403,{error:'Invalid origin'},origin);
 const match=/^Bearer (.+)$/i.exec(req.headers.authorization||'');
 if(!match)return respond(res,401,{error:'Login required'},origin);
 try{
  let body='';for await (const chunk of req){body+=chunk.toString('utf8');if(body.length>8192)throw Object.assign(Error('Request too large'),{status:413})}
  const payload=JSON.parse(body);
  if(!isUUID(payload.announcement_id))return respond(res,400,{error:'Invalid announcement'},origin);
  const result=await deliver(payload.announcement_id,match[1]);
  return respond(res,200,result,origin);
 }catch(err){console.error('Push delivery failed:',err?.message);
  return respond(res,err?.status||500,{error:err?.status?'Operation not authorized':'Unable to send push'},origin)}
});
server.listen(PORT,'0.0.0.0',()=>console.log('Moments Paris Push listening'));
