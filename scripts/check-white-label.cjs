'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root='moments-demo/';
for(const file of [root+'index.html',root+'franquia/index.html']){
  const html=fs.readFileSync(file,'utf8');
  assert(!html.includes('data:image/jpeg;base64'),file+': foto anterior incorporada');
  assert(!html.includes('cloud-sync.js'),file+': backend anterior referenciado');
  assert(html.includes('hero-insights'),file+': abertura com indicadores ausente');
  assert(html.includes('/brand-config.js'),file+': configurações não carregadas');
  assert(html.includes('/white-label.css'),file+': design system não carregado');
  assert(html.includes('DEMO_MODE'),file+': demo isolada ausente');
  assert(html.includes('data-act="demo-admin"'),file+': painel de demonstração sem entrada');
  assert(html.includes('franquias_white_label_v1'),file+': armazenamento não isolado');
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert(scripts.length>=2,file+': scripts ausentes');
  let tested=0;
  for(const match of scripts){
    if(!match[1].trim())continue;
    new vm.Script(match[1],{filename:file+'#inline'+(++tested)});
  }
  console.log('OK:',file,'| scripts JS analisados:',tested);
}
for(const file of [root+'brand-config.js',root+'sw.js']){
  new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
  console.log('OK:',file);
}
const conf={window:{}};
vm.runInNewContext(fs.readFileSync(root+'brand-config.js','utf8'),conf);
const brand=conf.window.FRANCHISE_BRAND;
assert(brand.mode==='demo','demo deve ser explícita');
assert(brand.name && brand.catalog.length>=6,'catálogo genérico incompleto');
assert(brand.catalog.every(x=>!x.image || !String(x.image).includes('moments')),'imagem da marca antiga');
const manifest=JSON.parse(fs.readFileSync(root+'manifest.webmanifest','utf8'));
assert(manifest.name.includes('Franquia') && manifest.icons[0].src==='/icon.svg');
assert(fs.existsSync(root+'icon.svg') && fs.existsSync(root+'white-label.css'));
console.log('White-label: sintaxe, branding, segurança demonstrativa e ativos OK.');
