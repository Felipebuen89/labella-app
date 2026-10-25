'use strict';
/*
 * La'Bella - Prova de conceito de Web Push de segundo plano.
 * Nenhuma agenda real / campanha é enviada.
 * A inscrição fica SOMENTE em memória até o disparo temporizado.
 * Chaves privadas são variáveis de ambiente, nunca incluídas no site.
 */
const http = require('http');
const webpush = require('web-push');
const { URL } = require('url');
const { randomUUID, randomBytes, createHash, timingSafeEqual } = require('crypto');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const ORIGIN = 'https://felipebuen89.github.io';
const PORT = Number(process.env.PORT) || 10000;
const DELAY_MS = 65000;
if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error('VAPID_PUBLIC e VAPID_PRIVATE devem estar nas variáveis de ambiente');
  process.exit(1);
}
webpush.setVapidDetails('https://felipebuen89.github.io', VAPID_PUBLIC, VAPID_PRIVATE);
const tries = new Map();
const pending = new Map();
const MAX_REQUEST_BYTES = 8192;


/* Painel de homologação Move Digital: acesso protegido e inscrições opt-in.
 * Usuários/celulares em memória (desaparecem no reinício do Render Free).
 * Nenhum usuário real deve ser cadastrado nesta versão.
 */
const ADMIN_PASSWORD_SHA256 = process.env.ADMIN_PASSWORD_SHA256 || '';
const adminSessions = new Map();
const loginAttempts = new Map();
const registeredDevices = new Map();
const adminSendTimes = [];
const campaignJobs = new Map(); // Só diagnóstico temporário; não guarda dados pessoais.
// Somente no runner automatizado reduzimos a espera; produção mantém 30s.
const CAMPAIGN_DELAY_MS = process.env.NODE_ENV === 'test' ? 75 : 30000;
const ADMIN_SESSION_MS = 2 * 60 * 60 * 1000;
const MAX_DEMO_DEVICES = 5;
function hash(value) { return createHash('sha256').update(String(value)).digest('hex'); }
function equalsHex(left,right) {
  if (left.length !== 64 || right.length !== 64) return false;
  return timingSafeEqual(Buffer.from(left,'hex'),Buffer.from(right,'hex'));
}
function getIP(req) {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().slice(0,100);
}
function isAdmin(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return false;
  const key = hash(auth.slice(7));
  const until = adminSessions.get(key) || 0;
  if (until < Date.now()) {adminSessions.delete(key);return false;}
  return true;
}
async function requestJSON(req) {
  let body='', size=0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size>MAX_REQUEST_BYTES) throw Error('Corpo maior que o permitido');
    body += chunk.toString('utf8');
  }
  try {return JSON.parse(body)}catch(_) {throw Error('JSON inválido')}
}
function messageValue(data) {
  if (typeof data.message !== 'string') return null;
  let body = data.message.replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
  if (body.length<8||body.length>160) return null;
  return body;
}
function notificationFor(kind,body) {
  const titles = {lembrete:'Lembrete de agendamento',promocao:'Promoção da semana'};
  if (!Object.prototype.hasOwnProperty.call(titles,kind)) return null;
  return {title:titles[kind],body,tag:'labella-admin-'+randomUUID()};
}
function adminError(res,code,reason,origin){return send(res,code,{ok:false,error:reason},origin)}

function send(res, code, obj, origin = '') {
  res.writeHead(code,{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Access-Control-Allow-Origin':origin === ORIGIN ? ORIGIN : 'null',
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type, Authorization',
    'Vary':'Origin'
  });
  res.end(JSON.stringify(obj));
}
function allowedPushEndpoint(str) {
  try {
    const u = new URL(str);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return false;
    // Apple Web Push (iPhone), Firebase and Mozilla web push for browser QA.
    return u.hostname === 'web.push.apple.com' ||
      u.hostname.endsWith('.push.apple.com') ||
      u.hostname === 'fcm.googleapis.com' ||
      u.hostname === 'fcm-xm.googleapis.com' ||
      u.hostname === 'updates.push.services.mozilla.com';
  } catch (_) { return false; }
}
function isSubValid(s) {
  return s && typeof s === 'object' &&
    typeof s.endpoint === 'string' && s.endpoint.length < 2500 &&
    allowedPushEndpoint(s.endpoint) &&
    s.keys && typeof s.keys.p256dh === 'string' && s.keys.p256dh.length < 300 &&
    typeof s.keys.auth === 'string' && s.keys.auth.length < 300;
}
const app = http.createServer(async(req,res)=>{
  const origin = req.headers.origin || '';
  if (req.method === 'OPTIONS') {
    return send(res, origin===ORIGIN?204:403, {ok:origin===ORIGIN}, origin);
  }


  if (req.url?.startsWith('/admin/')) {
    if (origin !== ORIGIN) return adminError(res,403,'Origem não autorizada',origin);
    if (!ADMIN_PASSWORD_SHA256) return adminError(res,503,'Login ainda não configurado',origin);
    const ip = getIP(req);
    const now = Date.now();
    if (req.method==='POST' && req.url==='/admin/login') {
      const tries=(loginAttempts.get(ip)||[]).filter(t=>now-t<15*60*1000);
      if (tries.length>=6) return adminError(res,429,'Aguarde 15 minutos para tentar novamente',origin);
      let data;
      try {data=await requestJSON(req)}catch(err){return adminError(res,400,err.message,origin)}
      const given = data && typeof data.password==='string' ? data.password : '';
      const good = given.length>=16 && given.length<=200 && equalsHex(hash(given),ADMIN_PASSWORD_SHA256);
      if (!good) {tries.push(now);loginAttempts.set(ip,tries);return adminError(res,401,'Senha incorreta',origin)}
      loginAttempts.delete(ip);
      const token = randomBytes(32).toString('base64url');
      adminSessions.set(hash(token),now+ADMIN_SESSION_MS);
      return send(res,200,{ok:true,token,expiresIn:ADMIN_SESSION_MS/1000},origin);
    }
    if (!isAdmin(req)) return adminError(res,401,'Faça login para continuar',origin);
    if (req.method==='GET' && req.url==='/admin/me') return send(res,200,{ok:true,mode:'homologacao',maxDevices:MAX_DEMO_DEVICES},origin);
    if (req.method==='POST' && req.url==='/admin/logout') {
      adminSessions.delete(hash((req.headers.authorization||'').slice(7)));
      return send(res,200,{ok:true},origin);
    }
    if (req.method==='GET' && req.url==='/admin/devices') {
      const devices=[...registeredDevices.entries()].map(([id,x])=>({id,label:x.label,createdAt:x.createdAt}));
      return send(res,200,{ok:true,devices,maxDevices:MAX_DEMO_DEVICES,persistent:false},origin);
    }
    if (req.method==='POST' && req.url==='/admin/register') {
      let data;
      try {data=await requestJSON(req)}catch(err){return adminError(res,400,err.message,origin)}
      const label = typeof data.label==='string'?data.label.trim().slice(0,45):'';
      if (label.length<2||label.length>45 || !isSubValid(data.subscription)) return adminError(res,400,'Nome ou assinatura de aparelho inválido',origin);
      const id=hash(data.subscription.endpoint).slice(0,24);
      if (!registeredDevices.has(id) && registeredDevices.size>=MAX_DEMO_DEVICES) return adminError(res,409,'Limite de aparelhos demonstrativos atingido',origin);
      registeredDevices.set(id,{label,subscription:data.subscription,createdAt:new Date().toISOString()});
      return send(res,201,{ok:true,id,label},origin);
    }
    if (req.method==='POST' && req.url==='/admin/remove-device') {
      let data;
      try {data=await requestJSON(req)}catch(err){return adminError(res,400,err.message,origin)}
      if (!data || typeof data.id!=='string') return adminError(res,400,'Identificador inválido',origin);
      return send(res,200,{ok:true,removed:registeredDevices.delete(data.id)},origin);
    }
    if (req.method==='GET' && req.url.startsWith('/admin/send-status?')) {
      let id;
      try { id = new URL(req.url,'http://localhost').searchParams.get('id') } catch (_) {}
      if (!id || !/^[0-9a-f-]{36}$/.test(id)) return adminError(res,400,'Identificador inválido',origin);
      const job=campaignJobs.get(id);
      if (!job) return adminError(res,404,'O envio não existe mais. O servidor gratuito pode ter reiniciado.',origin);
      return send(res,200,{ok:true,status:job.status,details:job.details,recipients:job.recipients,updatedAt:job.updatedAt},origin);
    }
    if (req.method==='POST' && req.url==='/admin/send') {
      let data;
      try {data=await requestJSON(req)}catch(err){return adminError(res,400,err.message,origin)}
      const body=messageValue(data);
      const notice=body&&notificationFor(data.kind,body);
      if (!notice) return adminError(res,400,'Selecione o tipo e digite de 8 a 160 caracteres',origin);
      if (!Array.isArray(data.deviceIds) || !data.deviceIds.length || data.deviceIds.length>MAX_DEMO_DEVICES) return adminError(res,400,'Escolha os aparelhos de teste',origin);
      const ids=[...new Set(data.deviceIds)];
      if (ids.length!==data.deviceIds.length || ids.some(id=>typeof id!=='string'||!registeredDevices.has(id)))
        return adminError(res,400,'Existe aparelho não autorizado na seleção',origin);
      const recent=adminSendTimes.filter(t=>now-t<60*60*1000);
      adminSendTimes.length=0;adminSendTimes.push(...recent);
      if (adminSendTimes.length>=8) return adminError(res,429,'Limite de oito campanhas por hora nesta demonstração',origin);
      adminSendTimes.push(now);
      const targets=ids.map(id=>({id,...registeredDevices.get(id)}));
      const sendId=randomUUID();
      const job={status:'agendado',details:'Aguardando o momento do disparo',recipients:targets.length,updatedAt:new Date().toISOString()};
      campaignJobs.set(sendId,job);
      // Limita a memória usada pelo histórico de testes.
      if (campaignJobs.size>25) campaignJobs.delete(campaignJobs.keys().next().value);
      console.log('Painel: teste agendado',sendId,'para',targets.length,'dispositivo(s)');
      const task=setTimeout(async()=>{
        job.status='enviando';job.details='Enviando ao serviço de push da Apple ou do navegador';
        job.updatedAt=new Date().toISOString();
        let accepted=0, failed=0;
        for (const target of targets) {
          try {
            await webpush.sendNotification(target.subscription,JSON.stringify(notice),{TTL:300,urgency:'high'});
            accepted++;
            console.log('Painel: Web Push aceito pelo provedor',sendId);
          } catch(err) {
            failed++;
            const code=err.statusCode || 'sem código';
            console.error('Painel: falha no envio',sendId,code,String(err.message).slice(0,90));
            if (err.statusCode===404||err.statusCode===410) registeredDevices.delete(target.id);
          }
        }
        job.status=failed ? (accepted?'parcial':'falha') : 'aceito_pelo_provedor';
        job.details=accepted+' aceito(s) pelo serviço de push; '+failed+' falha(s). A exibição final no celular depende do iOS.';
        job.updatedAt=new Date().toISOString();
      },CAMPAIGN_DELAY_MS);
      task.unref();
      return send(res,202,{ok:true,scheduled:true,jobId:sendId,delaySeconds:CAMPAIGN_DELAY_MS/1000,recipients:targets.length},origin);
    }
    return adminError(res,404,'Rota administrativa não encontrada',origin);
  }

  if (req.method === 'GET' && req.url === '/health') return send(res,200,{ok:true,kind:'web-push-demo',delaySeconds:DELAY_MS/1000},origin);
  if (req.method === 'GET' && req.url === '/public-config') {
    if (origin!==ORIGIN) return send(res,403,{error:'Origem não autorizada'},origin);
    return send(res,200,{vapidPublicKey:VAPID_PUBLIC,delaySeconds:DELAY_MS/1000},origin);
  }
  if (req.method === 'POST' && (req.url === '/test-push' || req.url === '/custom-test-push')) {
    if (origin!==ORIGIN) return send(res,403,{error:'Origem não autorizada'},origin);
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const now = Date.now();
    const recent = (tries.get(ip)||[]).filter(t=>now-t<60*60*1000);
    if (recent.length>=5) return send(res,429,{error:'Limite de cinco testes por hora. Tente mais tarde.'},origin);
    let size=0, body='';
    try {
      for await (const part of req) {
        size+=part.length;
        if(size>MAX_REQUEST_BYTES) return send(res,413,{error:'Solicitação muito grande'},origin);
        body+=part.toString('utf8');
      }
      const parsed=JSON.parse(body);
      if (!isSubValid(parsed.subscription)) return send(res,400,{error:'Assinatura de notificação inválida'},origin);
      // Mensagem livre apenas para teste no próprio aparelho inscrito. Não armazena destinatários.
      const custom = req.url === '/custom-test-push';
      const titles = {'lembrete': 'Lembrete de agendamento', 'promocao': 'Promoção da semana'};
      let notification;
      if (custom) {
        if (!Object.prototype.hasOwnProperty.call(titles, parsed.kind)) return send(res,400,{error:'Escolha lembrete ou promoção'},origin);
        if (typeof parsed.message !== 'string') return send(res,400,{error:'Digite uma mensagem'},origin);
        let body = parsed.message.replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
        let actualKind = parsed.kind;
        // Se o usuário colar o título no campo de mensagem, eliminamos a repetição
        // e harmonizamos o tipo de notificação com o título explícito.
        const prefix = body.match(/^La[’']Bella\s*[•:—-]\s*(Lembrete|Promo(?:ç|c)[aã]o)\s*(?:\(\s*teste\s*\))?\s*[:•—-]?\s*/i)
          || body.match(/^(Lembrete|Promo(?:ç|c)[aã]o)\s*\(\s*teste\s*\)\s*[:•—-]?\s*/i);
        if (prefix) {
          actualKind = /^lembrete/i.test(prefix[1]) ? 'lembrete' : 'promocao';
          body = body.slice(prefix[0].length).trim();
        }
        if (body.length < 8 || body.length > 160) return send(res,400,{error:'A mensagem deve ter entre 8 e 160 caracteres'},origin);
        notification = {
          title: titles[actualKind],
          body,
          tag: 'labella-custom-' + randomUUID()
        };
      } else {
        notification = {
          title: 'La’Bella • teste com aplicativo fechado',
          body: '🔔 Funcionou! Esta notificação chegou por Web Push, mesmo com o aplicativo fechado.',
          tag: 'labella-push-segundo-plano'
        };
      }
      recent.push(now); tries.set(ip,recent);
      const jobId=randomUUID();
      const subscription=parsed.subscription;
      pending.set(jobId,true);
      const timer=setTimeout(async()=>{
        if(!pending.delete(jobId)) return;
        try {
          await webpush.sendNotification(subscription,JSON.stringify(notification),{TTL:300,urgency:'high'});
          console.log('Notificação de demonstração enviada ao serviço push. ID:',jobId);
        } catch(err) {
          console.error('Falha no envio push:',jobId,err?.statusCode||'sem código',String(err?.message||err).slice(0,200));
        }
      },DELAY_MS);
      timer.unref(); // aguarde requisições mas mantém o processo livre para spin down.
      return send(res,202,{ok:true,delaySeconds:DELAY_MS/1000,info:custom?'Mensagem personalizada de demonstração agendada para este aparelho.':'Enviaremos uma notificação de teste para este aparelho.'},origin);
    } catch(err){return send(res,400,{error:'JSON inválido'},origin);}
  }
  return send(res,404,{error:'Rota não encontrada'},origin);
});
app.listen(PORT,'0.0.0.0',()=>console.log('LaBella Web Push demo ouvindo porta',PORT));
