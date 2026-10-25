'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');const base=path.resolve(__dirname,'..');
const load=n=>fs.readFileSync(path.join(base,n),'utf8');
const auth=load('acesso.html'),owner=load('proprietario.html'),client=load('index.html'),account=load('minha-conta.html'),core=load('auth-core.js');

test('Entrada profissional tem papéis, cadastro e login com Google sinalizado corretamente',()=>{
 const dom=new JSDOM(auth,{url:'https://felipebuen89.github.io/labella-app/acesso.html',runScripts:'outside-only'});
 try{
  const d=dom.window.document;
  for(const id of ['role-cliente','role-proprietario','tab-login','tab-register','google','auth-form','full-name','business','email','password','approval','request-owner'])assert.ok(d.getElementById(id),id);
  assert.ok(d.getElementById('auth-form').querySelector('input[type=password]'));
  assert.match(d.querySelector('#google-pending').textContent,/configuração/);
  assert.match(d.title,/Bem-vinda/);
  assert.match(auth,/signInWithPassword/);
  assert.match(auth,/signUp/);
  assert.match(auth,/resetPasswordForEmail/);
  assert.match(auth,/requestOwnerAccess/);
 }finally{dom.window.close()}
});
test('Interface proprietária mantém os controles atrás do login',()=>{
 const dom=new JSDOM(owner);
 try{
  assert.equal(dom.window.document.getElementById('dashboard').hidden,true);
  assert.ok(dom.window.document.querySelector('a[href="./acesso.html?perfil=proprietario"]'));
  assert.ok(dom.window.document.getElementById('login-form'));
  assert.match(owner,/usingSupabaseJWT/);
  assert.match(owner,/\/proprietario\/me/);
 }finally{dom.window.close()}
});
test('Papel proprietário jamais vem do cadastro nem dos metadados do usuário',()=>{
 assert.match(core,/profileFor\(user\)/);
 assert.match(core,/\.from\('lb_profiles'\)/);
 assert.doesNotMatch(core,/user_metadata\.role/);
 assert.doesNotMatch(auth,/data:\s*\{[^}]*role:/);
 assert.match(core,/googleEnabled/);
 assert.match(load('manifest.webmanifest'),/acesso\.html/);
});
test('Cliente preserva visual público e possui minha conta protegida',()=>{
 assert.match(client,/acesso\.html\?perfil=cliente/);
 assert.doesNotMatch(client,/agenda-tab-admin/);
 assert.match(account,/window\.LaBellaAuth\.currentAccount/);
 assert.match(account,/location\.replace\('\.\/acesso\.html\?perfil=cliente'\)/);
});
test('Layout desktop e mobile da entrada',()=>{
 assert.match(auth,/@media\(max-width:800px\)/);
 assert.match(auth,/class="shell"/);
 assert.match(auth,/class="brand-side"/);
 assert.match(auth,/class="login-side"/);
});