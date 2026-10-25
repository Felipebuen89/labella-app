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
const { randomUUID } = require('crypto');

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

function send(res, code, obj, origin = '') {
  res.writeHead(code,{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Access-Control-Allow-Origin':origin === ORIGIN ? ORIGIN : 'null',
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
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
      const kinds = {'lembrete': 'Lembrete', 'promocao': 'Promoção'};
      let notification;
      if (custom) {
        if (!Object.prototype.hasOwnProperty.call(kinds, parsed.kind)) return send(res,400,{error:'Escolha lembrete ou promoção'},origin);
        if (typeof parsed.message !== 'string') return send(res,400,{error:'Digite uma mensagem'},origin);
        const body = parsed.message.replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
        if (body.length < 8 || body.length > 160) return send(res,400,{error:'A mensagem deve ter entre 8 e 160 caracteres'},origin);
        notification = {
          title: 'La’Bella • ' + kinds[parsed.kind] + ' (teste)',
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
