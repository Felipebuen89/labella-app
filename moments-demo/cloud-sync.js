/* Moments Paris: transport-only cloud bridge. Preserves existing approved UI and business logic. */
(() => {
 'use strict';
 const base='https://jpnuezounmnnnnztocxn.supabase.co/rest/v1/rpc/';
 const key='sb_publishable_yrujwXvWHWPCFyjqia9kgA_MXcbsH0D';
 const storageKey='moments_paris_device_credential_v1';
 function deviceToken(){return localStorage.getItem(storageKey)||''}
 function newDeviceToken(){
  const bytes=new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 }
 function saveToken(token){localStorage.setItem(storageKey,token)}
 async function rpc(action,args){
  const timeout=AbortSignal.timeout?AbortSignal.timeout(14000):undefined;
  const response=await fetch(base+action,{
   method:'POST',
   headers:{'apikey':key,'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify(args||{}),
   signal:timeout
  });
  if(!response.ok){let message='Falha de comunicação com a franquia ('+response.status+')';
   try{const error=await response.json();if(error?.message)message=error.message}catch(e){}
   throw Error(message);
  }
  return response.json();
 }
 window.MomentsCloud={
  deviceToken,newDeviceToken,saveToken,rpc,
  enroll:(token,name,city,phone)=>rpc('moments_demo_enroll',{p_token:token,p_name:name,p_city:city,p_phone:phone}),
  save:(token,payload)=>rpc('moments_demo_save',{p_token:token,p_payload:payload}),
  submit:(token,order)=>rpc('moments_demo_submit_order',{p_token:token,p_order:order}),
  seller:(token)=>rpc('moments_demo_seller_snapshot',{p_token:token}),
  receive:(token,id)=>rpc('moments_demo_receive',{p_token:token,p_order_id:id}),
  admin:(secret)=>rpc('moments_demo_admin_snapshot',{p_pin:secret}),
  status:(secret,id,status)=>rpc('moments_demo_admin_status',{p_pin:secret,p_order_id:id,p_status:status}),
  publish:(secret,message)=>rpc('moments_demo_admin_publish',{p_pin:secret,p_message:message}),
  settings:(secret,data)=>rpc('moments_demo_admin_settings',{p_pin:secret,p_data:data}),
  pushPublicKey:'BEeHnNRzcI-yqaGMaQ17QI5hkc6vSSQKTyoyp-k2bCsgoXLWA5fGaEmapGTCTXAlfnunXLgm3iwVZsZJ_e3q85I',
  subscribe:(token,subscription)=>rpc('moments_demo_subscribe',{p_token:token,p_subscription:subscription}),
  async broadcast(pin,messageId){
   const r=await fetch('https://moments-paris-original-webpush.onrender.com/broadcast',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({admin_pin:pin,message_id:messageId}),
    signal:AbortSignal.timeout?AbortSignal.timeout(35000):undefined
   });
   if(!r.ok)throw Error('Serviço de push não confirmou o envio ('+r.status+')');
   return r.json();
  }
 };
})();
