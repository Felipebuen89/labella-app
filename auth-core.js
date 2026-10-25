/* La'Bella — autenticação compartilhada, sessão Supabase Auth e papéis imutáveis pelo navegador. */
(function(){
'use strict';
let sdkPromise,client;
const cfg=window.LABELLA_AUTH_CONFIG;
function getClient(){
 if(client)return Promise.resolve(client);
 if(sdkPromise)return sdkPromise;
 sdkPromise=new Promise((resolve,reject)=>{
  if(!cfg?.url||!cfg?.publishableKey)return reject(Error('Login ainda não configurado.'));
  function setup(){
   try{client=window.supabase.createClient(cfg.url,cfg.publishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}
   });resolve(client)}catch(err){reject(err)}
  }
  if(window.supabase?.createClient){setup();return}
  const el=document.createElement('script');
  el.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  el.crossOrigin='anonymous';el.onload=setup;
  el.onerror=()=>reject(Error('Não foi possível carregar o login seguro. Verifique sua conexão.'));
  document.head.appendChild(el);
 });
 return sdkPromise;
}
async function profileFor(user){
 const db=await getClient();
 const {data,error}=await db.from('lb_profiles').select('id,full_name,role').eq('id',user.id).single();
 if(error)throw Error('Não conseguimos confirmar o perfil desta conta. Tente novamente.');
 return data;
}
function destination(role){
 return role==='proprietario'?'./proprietario.html':'./minha-conta.html';
}
async function currentAccount(){
 const db=await getClient();
 const {data,error}=await db.auth.getUser();
 if(error||!data?.user)return null;
 const profile=await profileFor(data.user);
 return {db,user:data.user,profile};
}
async function requestOwnerAccess(userId,businessName){
 const db=await getClient();
 const {error}=await db.from('lb_owner_requests').insert({
  user_id:userId,business_name:businessName.trim()
 });
 if(error){
  if(error.code==='23505')return {pending:true,exists:true};
  throw Error('Não foi possível registrar sua solicitação. '+error.message);
 }
 return {pending:true,exists:false};
}
async function beginGoogle(role){
 if(!cfg.googleEnabled)throw Error('A entrada com Google aguarda ativação no Google Cloud e no Supabase. Por enquanto, use e-mail e senha.');
 const db=await getClient();
 sessionStorage.setItem('labella_auth_role',role);
 const returnTo=new URL('./acesso.html',location.href);
 returnTo.searchParams.set('perfil',role);
 const {data,error}=await db.auth.signInWithOAuth({provider:'google',options:{
  redirectTo:returnTo.toString(),queryParams:{access_type:'online',prompt:'select_account'}
 }});
 if(error)throw error;
 return data;
}
async function signOut(){
 const db=await getClient();return db.auth.signOut();
}
window.LaBellaAuth={getClient,currentAccount,profileFor,requestOwnerAccess,beginGoogle,signOut,destination};
})();