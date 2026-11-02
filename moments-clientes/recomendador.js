(function momentsFinder(){
  'use strict';
  const raw=window.MOMENTS_CLIENT_PRODUCTS;
  const products=Array.isArray(raw)?raw:[];
  if(!products.length||document.getElementById("page-finder"))return;
  // Classificação editorial baseada nas referências divulgadas no catálogo; não é pirâmide oficial da marca.
  const rows=`
15ml-alina-royal|frutado,amadeirado,oriental|forte|noite,especial
15ml-zaki-gold|oriental,amadeirado,especiado|forte|noite,especial
15ml-aysad|oriental,especiado,amadeirado|forte|noite,especial
15ml-creedence|frutado,amadeirado,fresco|forte|dia,trabalho,especial
15ml-be-myself|amadeirado,floral,fresco|medio|dia,trabalho
15ml-ynot|aromatico,amadeirado,fresco|forte|dia,noite
15ml-412-elite-black|aromatico,oriental,especiado|forte|noite,encontro
15ml-titan-black|oriental,especiado,amadeirado|forte|noite,especial
15ml-aquatic-green|aromatico,amadeirado,fresco|medio|dia,trabalho
15ml-amber-monarch|oriental,doce,amadeirado|forte|noite,especial
15ml-sheikh-s-secret|doce,oriental,especiado|forte|noite,especial
15ml-blue-home|citrico,amadeirado,aromatico|medio|dia,trabalho,encontro
15ml-leather|aromatico,amadeirado,especiado|forte|noite,especial
15ml-good-black|amadeirado,especiado,aromatico|medio|trabalho,noite
15ml-rustic-home|aromatico,especiado,amadeirado|forte|dia,trabalho
15ml-du-chef|frutado,amadeirado,especiado|medio|trabalho,encontro
15ml-412-top-men|amadeirado,especiado,oriental|forte|noite,encontro
15ml-rebel-boy|oriental,especiado,amadeirado|forte|noite,encontro
15ml-comander-victory|oriental,doce,especiado|forte|noite,especial
15ml-baraccat|oriental,amadeirado,doce|forte|especial,noite
15ml-silvestre|oriental,amadeirado,especiado|forte|noite,encontro
15ml-acqua-boy|aquatico,citrico,fresco|suave|dia,trabalho
15ml-selvagem|aromatico,citrico,especiado|forte|dia,noite
15ml-aquatic-blue|aquatico,aromatico,fresco|suave|dia,trabalho
15ml-black-cat|frutado,amadeirado,especiado|medio|dia,noite
15ml-x-plore|aromatico,amadeirado,fresco|medio|dia,trabalho
15ml-milionere|doce,especiado,amadeirado|forte|noite,encontro
15ml-canibal|doce,oriental,especiado|forte|noite,especial
15ml-comander|aquatico,fresco,amadeirado|medio|dia,trabalho
15ml-412-homem|citrico,aromatico,amadeirado|medio|dia,trabalho
15ml-robot-man|aromatico,doce,amadeirado|medio|dia,noite
15ml-la-yali|floral,frutado,doce|medio|dia,encontro
15ml-dualite|floral,oriental,doce|medio|dia,encontro
15ml-adorado|doce,floral,citrico|forte|encontro,especial
15ml-love-red|frutado,floral,doce|medio|dia,encontro
15ml-glamour|floral,doce,oriental|medio|encontro,noite
15ml-412-vip-woman|frutado,doce,oriental|forte|noite,especial
15ml-divine|frutado,doce,oriental|forte|encontro,especial
15ml-cherry-woman|frutado,doce,oriental|forte|noite,encontro
15ml-la-bella|doce,floral,frutado|forte|encontro,especial
15ml-best-girl|doce,floral,oriental|forte|noite,encontro
15ml-coco-paris|citrico,floral,amadeirado|medio|dia,trabalho,encontro
15ml-luxuosa|doce,frutado,oriental|forte|noite,encontro
15ml-blue-girl|citrico,fresco,frutado|suave|dia,trabalho
15ml-412-rose|floral,frutado,fresco|medio|dia,encontro
15ml-412-sexy-woman|floral,oriental,doce|medio|noite,encontro
15ml-glamourosa|doce,floral,oriental|forte|noite,encontro
15ml-lady-fabulosa|floral,oriental,doce|forte|noite,especial
15ml-best-girl-velvet|frutado,floral,doce|forte|encontro,noite
15ml-mily|floral,amadeirado,doce|medio|dia,especial
15ml-khloe|floral,fresco|suave|dia,trabalho
15ml-olimpica|oriental,doce,floral|forte|noite,encontro
15ml-celina|floral,frutado,doce|medio|dia,encontro
15ml-livre|floral,aromatico,oriental|forte|trabalho,noite
15ml-fantastico|doce,frutado,floral|medio|dia,encontro
`.trim().split("\n");
  const profiles=Object.fromEntries(rows.map(row=>{const [id,fs,s,occ]=row.split("|");return [id,{families:fs.split(","),strength:s,occasions:occ.split(",")}] }));
  const labels=Object.fromEntries([["citrico","Cítrico"],["doce","Doce / gourmand"],["amadeirado","Amadeirado"],["oriental","Oriental / âmbar"],["floral","Floral"],["frutado","Frutado"],["aquatico","Aquático"],["fresco","Fresco"],["aromatico","Aromático"],["especiado","Especiado"]]);
  const money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s*•\s*\d+\s*ml.*/i,"").replace(/[^a-z0-9]/g,"");
  const listed15=Object.fromEntries(products.filter(x=>x.id.startsWith("15ml-")).map(x=>[x.id,x]));
  const byName=new Map();
  for(const [id,profile] of Object.entries(profiles)){const p=listed15[id];if(p)byName.set(normalize(p.name),{profile,gender:p.category.includes("Femininos")?"feminino":"masculino"});}
  const candidates=products.filter(p=>/Perfumes (Masculinos|Femininos) 15 ml|Perfumes (100|75) ml/.test(p.category)).map(p=>{const similar=byName.get(normalize(p.name));return {...p,profile:profiles[p.id]||(similar&&similar.profile),gender:similar?.gender}}).filter(p=>p.profile&&p.gender);
  const css=`
  .finder-nav{border:1px solid rgba(227,200,139,.5)!important;border-radius:12px!important;color:#e3c88b!important;padding:10px 12px!important;background:transparent!important}
  .finder-nav.active{background:#e3c88b!important;color:#0b0b0b!important}
  .finder{padding:24px 0 60px;max-width:1100px;margin:0 auto}
  .finder-head{padding:36px 22px;text-align:center;border:1px solid #493d26;border-radius:22px;background:linear-gradient(145deg,#221c13,#080808)}
  .finder-eyebrow{letter-spacing:.2em;text-transform:uppercase;color:#d6b778;font-size:11px}
  .finder h1{font:600 clamp(36px,5vw,54px)/1.05 'Cormorant Garamond',Georgia,serif;margin:12px 0;color:#f6e9c8}
  .finder p{color:#bdb4a3}
  .finder-form{display:grid;gap:16px;margin:24px 0}
  .finder-question{background:#14130f;border:1px solid #423b2d;padding:20px;border-radius:16px}
  .finder-question h2{font:600 25px 'Cormorant Garamond',serif;margin:0 0 6px;color:#f8f0dd}
  .finder-question p{font-size:12px;margin:0 0 15px}
  .finder-options{display:flex;flex-wrap:wrap;gap:9px}
  .finder-choice{border:1px solid #635135;background:#17150f;color:#e6dfd4;padding:10px 14px;border-radius:100px;font-size:13px;cursor:pointer;min-height:42px}
  .finder-choice[aria-pressed=true]{color:#15110b;background:#e3c88b;border-color:#e3c88b;font-weight:800}
  .finder-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .finder-search{flex:1;min-width:210px;border:1px solid #e3c88b;border-radius:12px;background:linear-gradient(120deg,#d4b16c,#eed8aa);color:#17140e;font-weight:800;padding:16px;font-size:15px;cursor:pointer}
  .finder-reset{border:1px solid #58492f;background:transparent;color:#e3c88b;border-radius:12px;padding:15px 18px}
  .finder-results{margin-top:28px;scroll-margin-top:95px}
  .finder-results h2{font:600 31px 'Cormorant Garamond',serif;color:#f1ddb4}
  .finder-results-copy{margin:0 0 20px;color:#d0c5b0}
  .finder-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:16px}
  .finder-card{border:1px solid #453d31;background:#141310;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
  .finder-card-image{height:235px;background:#0b0a08;display:flex;align-items:center;justify-content:center}
  .finder-card-image img{width:100%;height:100%;object-fit:contain;padding:12px}
  .finder-card-body{padding:15px;display:flex;flex:1;flex-direction:column;gap:9px}
  .finder-card h3{font-size:16px;color:#f7f1df;margin:0}
  .finder-card-price{font-size:19px;color:#e2c281;font-weight:800}
  .finder-card-notes{font-size:12px;color:#bdb5a8}
  .finder-card button{background:#dfc487;color:#0b0b0b;border:0;border-radius:9px;padding:12px;font-weight:800;margin-top:auto}
  .finder-card button.finder-detail{background:transparent;color:#e3c88b;border:1px solid #5c4c35;margin-top:2px}
  .finder-no-results{border:1px solid #65553d;background:#191611;border-radius:12px;padding:22px;color:#eee0c4}
  .finder-disclaimer{font-size:12px;margin-top:26px}
  @media(max-width:700px){.bottom-nav{grid-template-columns:repeat(4,minmax(0,1fr))}.finder{padding:14px 4px 65px}.finder-head{padding:24px 13px}.finder-question{padding:16px}.bottom-nav .finder-nav{font-size:10px;padding:8px 5px!important;min-width:0}.bottom-nav{gap:3px!important}.finder-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.finder-card-image{height:155px}.finder-card-body{padding:11px}.finder-card h3{font-size:14px}}
  @media(max-width:370px){.finder-grid{grid-template-columns:1fr}.finder-card-image{height:200px}}
  `;
  const style=document.createElement("style");style.textContent=css;style.id="moments-finder-styles";document.head.appendChild(style);
  const section=document.createElement("section");section.className="page";section.id="page-finder";section.setAttribute("aria-label","Encontre seu perfume");
  const option=(group,v,label,on)=>`<button type="button" class="finder-choice" data-finder-${group}="${esc(v)}" aria-pressed="${on?"true":"false"}">${esc(label)}</button>`;
  const familyHTML=Object.entries(labels).map(([k,v])=>option("family",k,v,false)).join("");
  section.innerHTML=`<div class="finder">
  <div class="finder-head"><div class="finder-eyebrow">MOMENTS PARIS · EXPERIÊNCIA PERSONALIZADA</div><h1>Seu perfume, seu momento.</h1><p>Responda algumas perguntas e descubra quais fragrâncias do catálogo combinam com o seu estilo.</p></div>
  <div class="finder-form">
  <div class="finder-question"><h2>01. Quais aromas você mais gosta?</h2><p>Você pode escolher mais de um aroma. Os resultados precisam atender a todos os escolhidos.</p><div class="finder-options">${familyHTML}</div></div>
  <div class="finder-question"><h2>02. Qual intensidade prefere?</h2><p>Como você quer que seu perfume seja percebido?</p><div class="finder-options">${option("strength","suave","Suave e discreto")}${option("strength","medio","Equilibrado")}${option("strength","forte","Forte e marcante")}</div></div>
  <div class="finder-question"><h2>03. Em qual ocasião pretende usar?</h2><p>Opcional — sem seleção, consideramos todas as ocasiões.</p><div class="finder-options">${option("occasion","dia","Dia a dia")}${option("occasion","trabalho","Trabalho")}${option("occasion","encontro","Encontros")}${option("occasion","noite","Noite e festas")}${option("occasion","especial","Ocasiões especiais")}</div></div>
  <div class="finder-question"><h2>04. Qual coleção você deseja?</h2><div class="finder-options">${option("gender","todos","Todas",true)}${option("gender","feminino","Feminina")}${option("gender","masculino","Masculina")}</div></div>
  <div class="finder-question"><h2>05. Qual tamanho prefere?</h2><div class="finder-options">${option("size","todos","Todos",true)}${option("size","15","15 ml")}${option("size","100","100 ml")}${option("size","75","75 ml")}</div></div>
  <div class="finder-actions"><button class="finder-search" type="button" id="finder-submit">Descobrir meus perfumes</button><button class="finder-reset" type="button" id="finder-reset">Limpar escolhas</button></div>
  </div><div class="finder-results" id="finder-results" aria-live="polite"></div>
  <p class="finder-disclaimer">Recomendações editoriais preliminares baseadas nas referências olfativas do catálogo, não em análise laboratorial ou classificação oficial da Moments Paris. Fragrâncias exclusivas sem perfil confirmado ficam fora desta seleção.</p></div>`;
  const main=document.querySelector("main.wrap");if(!main)return;main.appendChild(section);
  document.querySelectorAll(".menu,.bottom-nav").forEach(nav=>{const b=document.createElement("button");b.type="button";b.className="finder-nav";b.dataset.finderOpen="1";b.textContent="Seu perfume";nav.appendChild(b)});
  const selected={families:new Set(),strength:"",occasion:"",gender:"todos",size:"todos"};
  function onSelected(button,kind,multi){
    const value=button.getAttribute("data-finder-"+kind);
    if(multi){selected.families.has(value)?selected.families.delete(value):selected.families.add(value);button.setAttribute("aria-pressed",selected.families.has(value)?"true":"false");return}
    const prev=selected[kind];selected[kind]=(prev===value&&kind!=="gender"&&kind!=="size")?"":value;
    section.querySelectorAll("[data-finder-"+kind+"]").forEach(b=>b.setAttribute("aria-pressed",b.getAttribute("data-finder-"+kind)===selected[kind]?"true":"false"));
  }
  function openFinder(){document.querySelectorAll(".page").forEach(el=>el.classList.toggle("active",el===section));document.querySelectorAll("[data-tab]").forEach(b=>b.classList.remove("active"));document.querySelectorAll("[data-finder-open]").forEach(b=>b.classList.add("active"));window.scrollTo(0,0)}
  function reset(){selected.families.clear();selected.strength="";selected.occasion="";selected.gender="todos";selected.size="todos";section.querySelectorAll(".finder-choice").forEach(b=>b.setAttribute("aria-pressed",b.getAttribute("data-finder-gender")==="todos"||b.getAttribute("data-finder-size")==="todos"?"true":"false"));document.getElementById("finder-results").innerHTML=""}
  function recommend(){
    const out=document.getElementById("finder-results");
    if(!selected.families.size||!selected.strength){out.innerHTML='<div class="finder-no-results">Escolha pelo menos um aroma e uma intensidade para pesquisar.</div>';out.scrollIntoView({behavior:"smooth",block:"start"});return}
    const hits=candidates.filter(p=>{
      const a=p.profile;
      if(![...selected.families].every(x=>a.families.includes(x)))return false;
      if(a.strength!==selected.strength)return false;
      if(selected.occasion&&!a.occasions.includes(selected.occasion))return false;
      if(selected.gender!=="todos"&&p.gender!==selected.gender)return false;
      if(selected.size!=="todos"&&!p.name.includes("• "+selected.size+" ml"))return false;
      return true;
    }).sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
    if(!hits.length){out.innerHTML='<div class="finder-no-results"><strong>Nenhum perfume corresponde exatamente a essas escolhas.</strong><p>Altere um aroma, a intensidade ou a ocasião para encontrar outras opções. Não indicamos perfumes que contrariem os critérios selecionados.</p></div>';out.scrollIntoView({behavior:"smooth",block:"start"});return}
    out.innerHTML='<h2>Encontramos fragrâncias para você</h2><p class="finder-results-copy">'+hits.length+' opção(ões) compatíveis com suas escolhas.</p><div class="finder-grid">'+hits.map(p=>`<article class="finder-card"><div class="finder-card-image"><img src="${esc(p.image||"")}" alt="${esc(p.name)}" loading="lazy"></div><div class="finder-card-body"><div class="finder-card-notes">${p.profile.families.filter(x=>selected.families.has(x)).map(x=>esc(labels[x]||x)).join(" · ")}</div><h3>${esc(p.name)}</h3><div class="finder-card-price">${money(p.price)}</div><div class="finder-card-notes">${esc(p.category)}</div><button type="button" data-add="${esc(p.id)}">+ Adicionar ao pedido</button><button class="finder-detail" type="button" data-detail="${esc(p.id)}">Ver detalhes</button></div></article>`).join("")+'</div>';
    out.scrollIntoView({behavior:"smooth",block:"start"});
  }
  document.addEventListener("click",event=>{
    const b=event.target.closest("button");if(!b)return;
    if(b.dataset.finderOpen){event.preventDefault();openFinder();return}
    if(b.dataset.tab){document.querySelectorAll("[data-finder-open]").forEach(x=>x.classList.remove("active"));return}
    if(b.hasAttribute("data-finder-family")){onSelected(b,"family",true);return}
    for(const g of ["strength","occasion","gender","size"]){if(b.hasAttribute("data-finder-"+g)){onSelected(b,g,false);return}}
    if(b.id==="finder-submit"){recommend();return}
    if(b.id==="finder-reset"){reset();return}
  },true);
})();
