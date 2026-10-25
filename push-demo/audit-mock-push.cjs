'use strict';
// Impede qualquer notificação real durante a auditoria automatizada.
const Module=require('node:module');
const orig=Module._load;
Module._load=function(id,parent,isMain){
 if(id==='web-push')return {
   setVapidDetails(){},
   async sendNotification(subscription,payload){
     if(!subscription||!JSON.parse(payload).body)throw Error('Invalid test push payload');
     return {statusCode:201};
   }
 };
 return orig.apply(this,arguments);
};
