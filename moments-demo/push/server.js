'use strict';
const http=require('node:http');
const webpush=require('web-push');
const PORT=Number(process.env.PORT||10000);
const BASE=process.env.SUPABASE_URL||'';
const KEY=process.env.SUPABASE_PUBLISHABLE_KEY||'';
const VAPID_PUBLIC=process.env.VAPID_PUBLIC_KEY||'';
const VAPID_PRIVATE=process.env.VAPID_PRIVATE_KEY||'';
const ORIGIN='https://moments-paris-demo-revendedores.onrender.com';
if(!BASE||!KEY||!VAPID_PUBLIC||!VAPID_PRIVATE){
 console.error('Missing required backend settings');process.exit(1);
}
webpush.setVapidDetails('mailto:felipebuen1989@gmail.com',VAPID_PUBLIC,VAPID_PRIVATE);
function send(res,status,data,origin){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(origin===ORIGIN){headers['Access-Control-Allow-Origin']=origin;headers['Vary']='Origin'}
 res.writeHead(status,headers);res.end(JSON.stringify(data));
}
async function authorizedDelivery(pin,id){
 const r=await fetch(BASE+'/rest/v1/rpc/moments_demo_admin_delivery',{
  method:'POST',headers:{apikey:KEY,'Content-Type':'application/json','Accept':'application/json'},
  body:JSON.stringify({p_pin:pin,p_message_id:id}),signal:AbortSignal.timeout(18000)
 });
 if(!r.ok)throw Object.assign(Error('Rejected admin authorization or message'),{status:r.status===400?403:r.status});
 return r.json();
}
const uuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v||'');
const safeEndpoint=value=>{
 try{const u=new URL(value);const h=u.hostname.toLowerCase();return u.protocol==='https:'&&(
 h==='fcm.googleapis.com'||h==='webpush.googleapis.com'||h==='updates.push.services.mozilla.com'
 ||h.endsWith('.push.apple.com')||h.endsWith('.notify.windows.com'))}
 catch{return false}
};
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin||'';
 if(req.method==='GET'&&req.url==='/health')return send(res,200,{status:'ok',service:'moments-paris-original-push'},origin);
 if(req.method==='OPTIONS'&&req.url==='/broadcast'){
  if(origin!==ORIGIN)return send(res,403,{error:'Origin rejected'},origin);
  res.writeHead(204,{'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'content-type','Access-Control-Max-Age':'600'});return res.end();
 }
 if(req.method!=='POST'||req.url!=='/broadcast')return send(res,404,{error:'Not found'},origin);
 if(origin!==ORIGIN)return send(res,403,{error:'Origin rejected'},origin);
 try{
  let raw='';for await(const part of req){raw+=part.toString();if(raw.length>4096)throw Object.assign(Error('Too large'),{status:413})}
  const {admin_pin,message_id}=JSON.parse(raw);
  if(typeof admin_pin!=='string'||admin_pin.length<20||admin_pin.length>80||!uuid(message_id))return send(res,400,{error:'Invalid request'},origin);
  const data=await authorizedDelivery(admin_pin,message_id);
  const recipients=(data.subscribers||[]).filter(x=>safeEndpoint(x.endpoint)&&x.keys?.auth&&x.keys?.p256dh);
  const payload=JSON.stringify({title:data.title,body:data.body,tag:'moments-'+message_id});
  let accepted=0,failed=0;
  for(let i=0;i<recipients.length;i+=10){
   const part=recipients.slice(i,i+10);
   const completed=await Promise.allSettled(part.map(x=>webpush.sendNotification({
    endpoint:x.endpoint,keys:{p256dh:x.keys.p256dh,auth:x.keys.auth}
   },payload,{TTL:21600,urgency:'normal'})));
   for(const x of completed){if(x.status==='fulfilled')accepted++;else failed++}
  }
  return send(res,200,{published:true,subscribers:recipients.length,accepted,failed},origin);
 }catch(err){console.error('Web Push send failed:',err.message);
  return send(res,err.status===403?403:500,{error:err.status===403?'Access denied':'Push delivery error'},origin)}
});
server.listen(PORT,'0.0.0.0',()=>console.log('Moments Paris approved push service listening'));
