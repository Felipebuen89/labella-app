// Parâmetros públicos do site (sem chave privada).
window.LABELLA_CONFIG = { supabaseUrl: "", supabaseAnonKey: "" };

// O registro começa na página inicial: Chrome/Android pode instalar como PWA
// e o mesmo service worker processa os Web Push no Android e iOS.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js',{scope:'./'})
      .catch(err => console.warn('LaBella PWA service worker:',err.message));
  });
}
let labellaInstallPrompt = null;
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  labellaInstallPrompt = event;
  const btn = document.getElementById('labella-install-app');
  if (btn) { btn.hidden=false;btn.textContent='📲 Instalar La’Bella como aplicativo'; }
});
window.addEventListener('appinstalled',()=>{
 labellaInstallPrompt=null;
 const btn=document.getElementById('labella-install-app');
 if(btn) btn.hidden=true;
});

document.addEventListener('DOMContentLoaded',()=>{
 const home=document.querySelector('#home .approved-content');
 if(!home)return;
 const isAndroid=/Android/i.test(navigator.userAgent);
 const standalone=window.matchMedia('(display-mode:standalone)').matches || navigator.standalone===true;
 if(isAndroid&&!standalone&&!document.getElementById('labella-install-app')){
  const btn=document.createElement('button');
  btn.id='labella-install-app';
  btn.type='button';
  btn.textContent='📲 Instalar La’Bella como aplicativo';
  btn.style.cssText='display:block;width:100%;text-align:center;margin:12px 0;padding:14px 10px;border:1px solid #ddb77b;border-radius:14px;background:#e2b681;color:#21150e;font-size:14px;font-weight:700;';
  btn.onclick=async()=>{
   if(labellaInstallPrompt){
    const prompt=labellaInstallPrompt;
    labellaInstallPrompt=null;
    btn.disabled=true;
    try{await prompt.prompt();await prompt.userChoice;}catch(err){console.warn(err);}
    finally{btn.disabled=false;}
   }else{
    let note=document.getElementById('labella-install-help');
    if(!note){note=document.createElement('p');note.id='labella-install-help';note.style.cssText='color:#f3d1a7;font-size:13px;line-height:1.5;margin:8px';btn.insertAdjacentElement('afterend',note);}
    note.textContent='Para abrir sem o navegador: no Google Chrome, toque em ⋮ → Instalar app. Se aparecer somente “Adicionar à tela inicial”, pode ser um atalho do navegador Samsung. Abra este endereço no Chrome e tente novamente.';
   }
  };
  const anchor=home.querySelector('.approved-book');
  if(anchor)anchor.insertAdjacentElement('afterend',btn);else home.prepend(btn);
 }
 if(!document.getElementById('notification-demo-link')){
  const link=document.createElement('a');
  link.id='notification-demo-link';
  link.href='./notificacoes.html?v=android3';
  link.textContent='🔔 Ativar notificações e promoções no meu celular';
  link.style.cssText='display:block;text-align:center;margin:15px 0 3px;padding:12px 10px;border:1px solid #9a6d50;border-radius:14px;background:#261c19;color:#f0d0ae;text-decoration:none;font-size:13px;font-weight:700;';
  const install=document.getElementById('labella-install-app');
  const anchor=install||home.querySelector('.approved-book');
  if(anchor)anchor.insertAdjacentElement('afterend',link);else home.prepend(link);
 }
});
