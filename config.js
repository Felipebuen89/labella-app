// La'Bella: experiência web segura. Não instalamos APKs nem solicitamos biometria.
window.LABELLA_CONFIG = {supabaseUrl:"",supabaseAnonKey:""};

// O service worker possibilita a assinatura Web Push em navegadores compatíveis.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js',{scope:'./'})
      .catch(err=>console.warn('LaBella Web Push:',err.message));
  });
}
document.addEventListener('DOMContentLoaded',()=>{
  const home=document.querySelector('#home .approved-content');
  if(!home)return;
  const android=/Android/i.test(navigator.userAgent);
  const installed=window.matchMedia('(display-mode:standalone)').matches||navigator.standalone===true;

  // Não invocamos prompt de instalação. Um possível alerta de risco do Android
  // não deve ser requisito para usar os serviços ou consentir com Web Push.
  if(android&&!installed&&!document.getElementById('labella-android-browser-mode')){
    const note=document.createElement('section');
    note.id='labella-android-browser-mode';
    note.setAttribute('aria-label','Acesso seguro ao LaBella pelo navegador');
    note.style.cssText='padding:13px 14px;margin:13px 0;border:1px solid #926947;border-radius:13px;background:#191311;color:#f4dac0;text-align:left;line-height:1.55;font-size:13px;';
    const headline=document.createElement('strong');
    headline.textContent='✓ Use o La’Bella sem instalar nada';
    headline.style.cssText='display:block;color:#f0c898;font-size:14px;margin-bottom:3px;';
    const body=document.createElement('span');
    body.textContent='Serviços, agenda demonstrativa e ativação de notificações estão disponíveis aqui. Não é necessário instalar arquivos, permitir apps de fontes desconhecidas ou confirmar o rosto.';
    note.append(headline,body);
    const book=home.querySelector('.approved-book');
    if(book)book.insertAdjacentElement('afterend',note);
    else home.prepend(note);
  }

  if(!document.getElementById('labella-account-link')){
    const account=document.createElement('a');
    account.id='labella-account-link';
    account.href='./acesso.html?perfil=cliente';
    account.textContent='♡  Minha conta • Entrar ou cadastrar';
    account.style.cssText='display:block;text-align:center;padding:13px 10px;margin:15px 0 4px;border-radius:14px;background:linear-gradient(100deg,#ead1b0,#cca17f);color:#22140f;text-decoration:none;font-size:14px;font-weight:800;';
    const anchor=home.querySelector('.approved-book');
    if(anchor)anchor.insertAdjacentElement('afterend',account);
    else home.prepend(account);
  }
  if(!document.getElementById('notification-demo-link')){
    const link=document.createElement('a');
    link.id='notification-demo-link';
    link.href='./notificacoes.html?v=seguro1';
    link.textContent='🔔 Ativar notificações e promoções no celular';
    link.style.cssText='display:block;text-align:center;margin:13px 0 5px;padding:13px 10px;border:1px solid #9a6d50;border-radius:14px;background:#261c19;color:#f0d0ae;text-decoration:none;font-size:13px;font-weight:700;';
    const note=document.getElementById('labella-android-browser-mode');
    const anchor=note||home.querySelector('.approved-book');
    if(anchor)anchor.insertAdjacentElement('afterend',link);
    else home.prepend(link);
  }
});
