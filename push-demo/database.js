'use strict';
/*
 * Acesso servidor->Supabase via PostgREST RPC.
 * O segredo da integração existe só no Render (PUSH_DB_SECRET).
 * Tabelas têm RLS ativo e nenhuma permissão de leitura anon.
 */
const URL_BASE = (process.env.PUSH_DB_URL || '').replace(/\/+$/, '');
const ANON_KEY = process.env.PUSH_DB_PUBLISHABLE_KEY || '';
const SECRET = process.env.PUSH_DB_SECRET || '';
const enabled = Boolean(URL_BASE && ANON_KEY && SECRET);
let processing = false;
async function rpc(method, data = {}) {
  if (!enabled) throw Error('Banco de dados ainda não configurado');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const result = await fetch(URL_BASE+'/rest/v1/rpc/'+method,{
      method:'POST',
      headers:{
        'apikey': ANON_KEY,
        'Content-Type':'application/json',
        'Accept':'application/json'
      },
      body: JSON.stringify({...data,p_secret:SECRET}),
      signal: ctrl.signal
    });
    let json;
    try {json = await result.json()} catch(_) {throw Error('Resposta inválida do Supabase (HTTP '+result.status+')')}
    if (!result.ok) {
      console.error('Erro PostgREST RPC:',method,result.status,String(json.code||''),String(json.message||'').slice(0,130));
      throw Error('Banco Supabase indisponível para esta operação (HTTP '+result.status+')');
    }
    return json;
  } finally {clearTimeout(timer)}
}
const devices = () => rpc('lb_push_admin_devices');
const register = (label,subscription) => rpc('lb_push_admin_register',{p_label:label,p_subscription:subscription});
const remove = id => rpc('lb_push_admin_remove',{p_id:id});
const schedule = (kind,message,ids,delayMS) => rpc('lb_push_admin_schedule',{
  p_kind:kind,p_message:message,p_ids:ids,
  p_scheduled_at:new Date(Date.now()+delayMS).toISOString()
});
const campaign = id => rpc('lb_push_admin_campaign',{p_id:id});
const claim = () => rpc('lb_push_admin_claim',{p_limit:5});
const complete = (id,accepted,failed) => rpc('lb_push_admin_complete',{p_id:id,p_accepted:accepted,p_failed:failed});

async function processDue(webpush) {
  if (!enabled || processing) return;
  processing = true;
  try {
    const due = await claim();
    for (const item of (Array.isArray(due)?due:[])) {
      const title = item.kind==='promocao'?'Promoção da semana':'Lembrete de agendamento';
      let accepted = 0, failed = 0;
      for (const target of item.targets||[]) {
        try {
          await webpush.sendNotification(target.subscription,
            JSON.stringify({title,body:item.message,tag:'labella-persistente-'+item.id}),
            {TTL:300,urgency:'high'});
          accepted++;
          console.log('Supabase: Web Push aceito pelo provedor; campanha:',item.id);
        } catch(err) {
          failed++;
          console.error('Supabase: falha Web Push; campanha:',item.id,err.statusCode||'',String(err.message||'').slice(0,85));
        }
      }
      await complete(item.id,accepted,failed);
      console.log('Supabase: campanha finalizada:',item.id,'aceitos:',accepted,'falhas:',failed);
    }
  } catch(err) {
    console.error('Supabase: worker aguardará próximo ciclo:',String(err.message||err).slice(0,150));
  } finally { processing=false; }
}
module.exports={enabled,devices,register,remove,schedule,campaign,processDue};
