'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const client=fs.readFileSync(path.join(root,'index.html'),'utf8');
const owner=fs.readFileSync(path.join(root,'proprietario.html'),'utf8');
const liveAgenda=fs.readFileSync(path.join(root,'backend.js'),'utf8');

test('Perfil cliente não contém formulário de administração de horários',()=>{
 const dom=new JSDOM(client,{url:'https://felipebuen89.github.io/labella-app/'});
 const d=dom.window.document;
 assert.equal(d.getElementById('agenda-tab-admin'),null);
 assert.equal(d.getElementById('agenda-admin'),null);
 assert.ok(d.getElementById('agenda-client'));
 assert.ok(d.querySelector('a[href="./proprietario.html"]'));
 assert.match(d.title,/Cliente/);
 dom.window.close();
});

test('Perfil proprietário tem acesso distinto do administrador técnico',()=>{
 const dom=new JSDOM(owner,{url:'https://felipebuen89.github.io/labella-app/proprietario.html'});
 const d=dom.window.document;
 assert.match(d.title,/Proprietária/);
 assert.ok(d.getElementById('login-section'));
 assert.ok(d.getElementById('password'));
 assert.ok(d.getElementById('dashboard').hasAttribute('hidden'));
 assert.ok(d.getElementById('device-list'));
 assert.ok(d.getElementById('send'));
 assert.match(owner,/\/proprietario\/login/);
 assert.doesNotMatch(owner,/\/admin\/login/);
 assert.doesNotMatch(owner,/move_demo_token/);
 dom.window.close();
});

test('Adaptador opcional da agenda cliente não recria aba administrativa',()=>{
 assert.doesNotMatch(liveAgenda,/agenda-tab-admin/);
 assert.doesNotMatch(liveAgenda,/agenda-admin/);
 assert.doesNotMatch(liveAgenda,/signInWithOtp/);
});
