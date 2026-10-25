// Preencher apenas após criar o projeto Supabase e aplicar supabase/schema.sql.
// A chave publicável/anon pode aparecer no navegador. NUNCA inserir service_role ou segredo.
window.LABELLA_CONFIG = { supabaseUrl: "", supabaseAnonKey: "" };

/* Link discreto para teste de notificacoes a partir do PWA instalado.
   Recurso demonstrativo, sem agendamento real nem disparo remoto. */
document.addEventListener('DOMContentLoaded', function () {
  const home = document.querySelector('#home .approved-content');
  if (!home || document.getElementById('notification-demo-link')) return;
  const link = document.createElement('a');
  link.id = 'notification-demo-link';
  link.href = './notificacoes.html';
  link.textContent = '🔔 Testar notificação no meu celular';
  link.style.cssText = 'display:block;text-align:center;margin:15px 0 3px;padding:12px 10px;border:1px solid #9a6d50;border-radius:14px;background:#261c19;color:#f0d0ae;text-decoration:none;font-size:13px;font-weight:700;';
  const bookingButton = home.querySelector('.approved-book');
  if (bookingButton) bookingButton.insertAdjacentElement('afterend',link);
  else home.prepend(link);
});