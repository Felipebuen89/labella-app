/* Moments Paris Clientes: vitrine independente, sem código de custo, autenticação ou financeiro. */
(function(){
'use strict';
var products=Array.isArray(window.MOMENTS_CLIENT_PRODUCTS)?window.MOMENTS_CLIENT_PRODUCTS:[];
var byId=Object.fromEntries(products.map(function(p){return [p.id,p]}));
var categories=['Todos','15 ml','Perfumes Femininos 15 ml','Perfumes Masculinos 15 ml','Exclusivos Moments'].concat(Array.from(new Set(products.map(function(p){return p.category}))).filter(function(c){return c!=='Perfumes Femininos 15 ml'&&c!=='Perfumes Masculinos 15 ml'}));
/* Ordem editorial de exibição: não representa classificação de vendas reais. */
var femaleOrder=["15ml-best-girl","15ml-best-girl-velvet","15ml-dualite","15ml-la-yali","15ml-mily","15ml-412-rose","15ml-412-sexy-woman","15ml-412-vip-woman","15ml-la-bella","15ml-coco-paris","15ml-livre","15ml-olimpica","15ml-khloe","15ml-celina","15ml-blue-girl","15ml-love-red","15ml-luxuosa","15ml-glamourosa","15ml-lady-fabulosa","15ml-divine","15ml-cherry-woman","15ml-fantastico","15ml-adorado","15ml-glamour","15ml-venerata"];
var maleOrder=["15ml-412-top-men","15ml-creedence","15ml-rebel-boy","15ml-comander","15ml-comander-victory","15ml-milionere","15ml-acqua-boy","15ml-412-elite-black","15ml-412-homem","15ml-blue-home","15ml-titan-black","15ml-be-myself","15ml-ynot","15ml-aysad","15ml-zaki-gold","15ml-sheikh-s-secret","15ml-amber-monarch","15ml-aquatic-blue","15ml-aquatic-green","15ml-good-black","15ml-rustic-home","15ml-du-chef","15ml-x-plore","15ml-robot-man","15ml-canibal","15ml-black-cat","15ml-silvestre","15ml-leather","15ml-alina-royal","15ml-baraccat","15ml-selvagem","15ml-verus"];
var highlights=femaleOrder.slice(0,8).concat(maleOrder.slice(0,8));
var allPerfumeIds=femaleOrder.concat(maleOrder);
var perfumeRank=new Map(allPerfumeIds.map(function(id,i){return [id,i]}));
function is15(p){return /^Perfumes (Masculinos|Femininos) 15 ml$/.test(p.category)}
function sortProducts(a){return a.slice().sort(function(x,y){
 var a15=is15(x),b15=is15(y);if(a15!==b15)return a15?-1:1;
 if(a15&&b15)return (perfumeRank.get(x.id)??999)-(perfumeRank.get(y.id)??999);
 return products.indexOf(x)-products.indexOf(y);
 })}
function isHighlight(p){return highlights.indexOf(p.id)!==-1}
function fallbackImage(p,label){return '<div class="image-fallback" role="img" aria-label="Foto indisponível"><span>✦</span><strong>'+esc(label)+'</strong><small>Imagem temporariamente indisponível</small></div>'}
var storageCart='moments_client_cart_v1';
var storageCustomer='moments_client_customer_v1';
var storageOrders='moments_client_drafts_v1';
function read(key,fallback){try{var v=JSON.parse(localStorage.getItem(key));return v&&typeof v==='object'?v:fallback}catch(e){return fallback}}
var cart=read(storageCart,{});
var customer=read(storageCustomer,null);
var activeTab='home',category='Todos',search='',lastMessage='';
var overlay=document.getElementById('overlay'),sheet=document.getElementById('sheet'),toasts=document.getElementById('toast-area');
var fmt=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
function money(v){return fmt.format(Number(v)||0)}
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]})}
function saveCart(){try{localStorage.setItem(storageCart,JSON.stringify(cart))}catch(e){};updateBadge()}
function qty(id){return Math.max(0,Math.floor(Number(cart[id])||0))}
function count(){return Object.keys(cart).reduce(function(sum,id){return sum+qty(id)},0)}
function total(){return Object.keys(cart).reduce(function(sum,id){return sum+(byId[id]?byId[id].price*qty(id):0)},0)}
function updateBadge(){var e=document.getElementById('cartCount');if(e)e.textContent=count()}
function toast(message){var d=document.createElement('div');d.className='toast';d.textContent=message;toasts.innerHTML='';toasts.appendChild(d);setTimeout(function(){if(d.isConnected)d.remove()},5000)}
function setTab(name){if(['home','products','campaigns'].indexOf(name)<0)return;activeTab=name;document.querySelectorAll('.page').forEach(function(e){e.classList.toggle('active',e.id==='page-'+name)});document.querySelectorAll('[data-tab]').forEach(function(e){e.classList.toggle('active',e.dataset.tab===name)});window.scrollTo({top:0,behavior:'auto'});if(name==='products')renderProducts()}
function changeCategory(name){category=categories.includes(name)?name:'Todos';document.getElementById('categorySelect').value=category;setTab('products')}
function add(id){if(!byId[id])return;cart[id]=Math.min(99,qty(id)+1);saveCart();toast('Adicionado ao pedido: '+byId[id].name);if(overlay.classList.contains('open')&&sheet.dataset.mode==='cart')showCart()}
function changeQty(id,delta){if(!byId[id])return;var n=Math.max(0,Math.min(99,qty(id)+delta));if(n)cart[id]=n;else delete cart[id];saveCart();showCart()}
/* Se um fornecedor bloquear a foto, testar imagem reserva antes de exibir o aviso. */
window.momentsReferenceFallback=function(img){
 var backup=img.getAttribute('data-backup');
 if(backup&&img.getAttribute('data-backup-tried')!=='1'){
   img.setAttribute('data-backup-tried','1');
   img.src=backup;
   return;
 }
 img.hidden=true;
 var next=img.nextElementSibling;
 if(next)next.hidden=false;
};
function art(p){
 var mainFallback=fallbackImage(p,'Moments Paris');
 var img=p.image?'<img loading="lazy" src="'+esc(p.image)+'" alt="Perfume Moments Paris '+esc(p.name)+'" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="main-fallback" hidden>'+mainFallback+'</div>':mainFallback;
 if(p.reference&&p.referenceImage){
   var reference='<img loading="lazy" src="'+esc(p.referenceImage)+'" data-backup="'+esc(p.referenceImageBackup||'')+'" alt="Frasco original '+esc(p.reference)+' de '+esc(p.referenceBrand)+'" onerror="window.momentsReferenceFallback(this)"><div class="reference-fallback" hidden><span>✦</span><strong>'+esc(p.reference)+'</strong><small>Foto de referência indisponível</small></div>';
   return '<div class="art art--duo"><div class="moments-stage"><span class="stage-eyebrow">MOMENTS PARIS</span>'+img+'</div><div class="reference-stage"><span class="ref-heading">INSPIRAÇÃO OLFATIVA</span>'+reference+'<span class="ref-name">'+esc(p.reference)+'</span><small>'+esc(p.referenceBrand)+'</small></div></div>';
 }
 return '<div class="art'+(p.autoral?' art--exclusive':'')+'">'+img+'</div>';
}
function productBadge(p){if(p.autoral)return '<span class="product-flag product-flag-exclusive">Exclusivo Moments Paris</span>';return isHighlight(p)?'<span class="product-flag">Destaque</span>':''}
function card(p){return '<article class="product'+(p.referenceImage?' product-duo':'')+(p.autoral?' product-exclusive':'')+'">'+art(p)+'<div class="cardbody">'+productBadge(p)+'<div class="category">'+esc(p.category)+'</div><h3>'+esc(p.name)+'</h3><div class="price">'+money(p.price)+'</div><div class="card-actions"><button data-add="'+esc(p.id)+'">+ Adicionar</button><button class="more" data-detail="'+esc(p.id)+'" aria-label="Ver detalhes de '+esc(p.name)+'">Ver</button></div></div></article>'}
function renderFeatured(){
 var ids=femaleOrder.slice(0,4).concat(maleOrder.slice(0,4));
 var chosen=ids.map(function(id){return byId[id]}).filter(Boolean);
 document.getElementById('featured').innerHTML=chosen.map(card).join('');
}
function filtered(){
 var q=search.trim().toLocaleLowerCase('pt-BR');
 return sortProducts(products.filter(function(p){
   var inCat=category==='Todos'||(category==='15 ml'&&is15(p))||category===p.category||(category==='Exclusivos Moments'&&p.autoral);
   var inText=!q||[p.name,p.category,p.reference||'',p.referenceBrand||'',(p.referenceBrand||'')+' '+(p.reference||'')].join(' ').toLocaleLowerCase('pt-BR').includes(q);
   return inCat&&inText;
 }));
}
function groupHtml(title,kicker,description,items){
 if(!items.length)return '';
 return '<section class="catalog-group"><div class="catalog-group-head"><div><span class="eyebrow">'+esc(kicker)+'</span><h3>'+esc(title)+'</h3><p>'+esc(description)+'</p></div><span class="group-count">'+items.length+' produtos</span></div><div class="product-grid group-products">'+items.map(card).join('')+'</div></section>';
}
function renderProducts(){
 document.querySelectorAll('#chips button').forEach(function(btn){btn.classList.toggle('active',btn.dataset.filter===category)});
 document.getElementById('categorySelect').value=category;
 var a=filtered(), grouped=category==='15 ml'&&!search.trim();
 document.getElementById('catalogCount').textContent=a.length+' produto'+(a.length===1?'':'s')+' encontrado'+(a.length===1?'':'s');
 var grid=document.getElementById('productsGrid');
 grid.classList.toggle('grouped-catalog',grouped);
 if(grouped){
   var top=highlights.map(function(id){return byId[id]}).filter(Boolean);
   var featuredSet=new Set(highlights);
   var women=femaleOrder.map(function(id){return byId[id]}).filter(function(p){return p&&!p.autoral&&!featuredSet.has(p.id)});
   var men=maleOrder.map(function(id){return byId[id]}).filter(function(p){return p&&!p.autoral&&!featuredSet.has(p.id)});
   var authorial=[byId['15ml-verus'],byId['15ml-venerata']].filter(Boolean);
   grid.innerHTML=groupHtml('Destaques 15 ml','Seleção Moments','Fragrâncias selecionadas para começar sua descoberta',top)
      +groupHtml('Perfumes femininos','Coleção 15 ml','Explore as demais fragrâncias femininas',women)
      +groupHtml('Perfumes masculinos','Coleção 15 ml','Explore as demais fragrâncias masculinas',men)
      +groupHtml('Exclusivos Moments Paris','Criações próprias','Fragrâncias autorais, sem referência a outros perfumes',authorial);
 }else{
   grid.innerHTML=a.length?a.map(card).join(''):'<div class="empty">Nenhum produto corresponde à busca. Tente outra categoria ou nome.</div>';
 }
}
function fillFilters(){document.getElementById('categorySelect').innerHTML=categories.map(function(c){return '<option value="'+esc(c)+'">'+esc(c)+'</option>'}).join('');document.getElementById('chips').innerHTML=categories.map(function(c){return '<button data-filter="'+esc(c)+'">'+esc(c)+'</button>'}).join('');renderProducts()}
function openSheet(mode,html){sheet.dataset.mode=mode;sheet.innerHTML=html;overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';var close=sheet.querySelector('[data-close]');if(close)close.focus()}
function closeSheet(){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.body.style.overflow='';sheet.innerHTML=''}
function header(title){return '<div class="sheet-head"><div><div class="eyebrow">Moments Paris</div><h2>'+esc(title)+'</h2></div><button type="button" class="x" data-close aria-label="Fechar">×</button></div>'}
function detail(id){
 var p=byId[id];if(!p)return;
 var ref=p.reference?'<div class="detail-ref"><strong>Inspiração olfativa: '+esc(p.reference)+'</strong><span>'+esc(p.referenceBrand)+'</span><p class="small">A inspiração indica um perfil aromático semelhante. O produto vendido é Moments Paris, não o perfume da marca citada.</p>'+(p.referenceImage?'<img class="reference-detail-img" loading="lazy" src="'+esc(p.referenceImage)+'" data-backup="'+esc(p.referenceImageBackup||'')+'" alt="Imagem da inspiração olfativa '+esc(p.reference)+'" onerror="window.momentsReferenceFallback(this)"><p class="small" hidden>Imagem da referência indisponível. Consulte a descrição acima.</p>':'')+'</div>':'';
 var exclusive=p.autoral?'<div class="detail-ref"><strong>Exclusivo Moments Paris</strong><p class="small">Fragrância própria da Moments Paris, apresentada sem comparação com perfume de outra marca.</p></div>':'';
 var main=p.image?'<img class="detail-img" src="'+esc(p.image)+'" alt="'+esc(p.name)+'" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div hidden class="detail-image-fallback">'+fallbackImage(p,'Moments Paris')+'</div>':'<div class="detail-image-fallback">'+fallbackImage(p,'Moments Paris')+'</div>';
 openSheet('detail',header(p.name)+main+'<p class="category" style="margin-top:16px">'+esc(p.category)+'</p><div class="price">'+money(p.price)+'</div>'+ref+exclusive+'<button class="btn full" data-add="'+esc(id)+'">Adicionar ao pedido</button><p class="small">Preço final ao consumidor. Disponibilidade e entrega são confirmadas pelo vendedor.</p>');
}
function showCart(){var keys=Object.keys(cart).filter(function(id){return byId[id]&&qty(id)>0});var items=keys.map(function(id){var p=byId[id];return '<div class="cart-line"><div class="grow"><b>'+esc(p.name)+'</b><small>'+money(p.price)+' por unidade • '+money(qty(id)*p.price)+'</small></div><div class="qty"><button data-qty="'+esc(id)+'" data-delta="-1" aria-label="Remover uma unidade">−</button><strong>'+qty(id)+'</strong><button data-qty="'+esc(id)+'" data-delta="1" aria-label="Adicionar uma unidade">+</button></div></div>'}).join('');
var c=customer&&customer.name&&customer.phone&&customer.city;
var saved=c?'<div class="contact-summary"><strong>Seus dados neste aparelho</strong><div>'+esc(customer.name)+' • '+esc(customer.phone)+' • '+esc(customer.city)+'</div><button type="button" data-edit-customer>Alterar dados</button></div>':'';
var form='<form id="checkoutForm"><h3 style="font-size:15px;margin:22px 0 8px">Seus dados para o pedido</h3>'+saved+'<div id="customerFields" '+(c?'style="display:none"':'')+'><div class="form-group"><label for="customerName">Nome completo</label><input class="field" id="customerName" name="name" autocomplete="name" required minlength="2" maxlength="90" placeholder="Seu nome" value="'+esc(c?customer.name:'')+'"></div><div class="form-group"><label for="customerPhone">Número com DDD</label><input class="field" id="customerPhone" name="phone" autocomplete="tel" type="tel" required inputmode="tel" maxlength="24" placeholder="(19) 99999-9999" value="'+esc(c?customer.phone:'')+'"></div><div class="form-group"><label for="customerCity">Cidade</label><input class="field" id="customerCity" name="city" autocomplete="address-level2" required maxlength="70" placeholder="Sua cidade" value="'+esc(c?customer.city:'')+'"></div></div><p class="small">Sem senha ou login. Seus dados ficam salvos apenas neste aparelho para facilitar o próximo pedido e serão incluídos na mensagem compartilhada.</p><button class="btn full" type="submit">Preparar pedido no WhatsApp</button></form>';
openSheet('cart',header('Meu pedido')+(keys.length?items+'<div class="total"><span>Total do pedido</span><strong>'+money(total())+'</strong></div>'+form:'<div class="empty"><h3>Seu pedido está vazio</h3><p>Escolha seus perfumes e produtos favoritos para continuar.</p><button class="btn" data-tab="products">Ver produtos</button></div>')+(lastMessage?'<button class="btn ghost full" style="margin-top:14px" data-copy>Copiar último pedido</button><button class="textlink" style="margin-top:15px" data-clear-cart>Novo pedido (limpar carrinho)</button>':'')+'<p class="small" style="margin-top:16px">O pedido só chega ao vendedor quando você escolher um contato e enviar a mensagem. Este catálogo não realiza pagamento nem registra pedidos em um servidor.</p>')}
function cleanPhone(v){return String(v||'').replace(/\D/g,'')}
function prepareOrder(form){if(!count())return toast('Adicione produtos antes de finalizar.');var fd=new FormData(form);var name=String(fd.get('name')||'').trim().replace(/\s+/g,' ');var phone=cleanPhone(fd.get('phone'));var city=String(fd.get('city')||'').trim().replace(/\s+/g,' ');if(name.length<2||city.length<2||!/^\d{10,13}$/.test(phone)){toast('Confira nome, DDD e número de celular e cidade.');return}
customer={name:name,phone:phone,city:city};try{localStorage.setItem(storageCustomer,JSON.stringify(customer))}catch(e){}
var lines=Object.keys(cart).filter(function(id){return byId[id]&&qty(id)>0}).map(function(id){var p=byId[id];return qty(id)+'x '+p.name+' — '+money(p.price*qty(id))});
lastMessage='Olá! Quero solicitar estes produtos da Moments Paris:\n\n'+lines.join('\n')+'\n\nTOTAL: '+money(total())+'\n\nNome: '+name+'\nTelefone: '+phone+'\nCidade: '+city+'\n\nPor favor, confirme disponibilidade, entrega e pagamento.';
var drafts=read(storageOrders,[]);if(!Array.isArray(drafts))drafts=[];drafts.unshift({date:new Date().toISOString(),items:Object.keys(cart).filter(function(id){return byId[id]&&qty(id)>0}).map(function(id){return {id:id,qty:qty(id),unitPrice:byId[id].price}}),total:total(),status:'aguardando_envio_manual'});try{localStorage.setItem(storageOrders,JSON.stringify(drafts.slice(0,15)))}catch(e){}
var url='https://api.whatsapp.com/send?text='+encodeURIComponent(lastMessage);
var w=window.open(url,'_blank','noopener,noreferrer');if(!w){window.location.href=url}toast('Pedido preparado! Selecione o vendedor no WhatsApp e toque em Enviar.');showCart()}
function copyLast(){if(!lastMessage)return;var done=function(){toast('Resumo copiado. Envie ao seu vendedor pelo WhatsApp.')};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(lastMessage).then(done,function(){toast('Não foi possível copiar neste navegador.')})}else{toast('Não foi possível copiar automaticamente neste navegador.')}}
document.addEventListener('click',function(event){var el=event.target.closest('button');if(!el)return;
if(el.hasAttribute('data-close')){closeSheet();return}
if(el.hasAttribute('data-open-cart')){showCart();return}
if(el.dataset.tab){closeSheet();setTab(el.dataset.tab);return}
if(el.dataset.collection){changeCategory(el.dataset.collection);return}
if(el.dataset.filter){changeCategory(el.dataset.filter);return}
if(el.hasAttribute('data-campaign-perfumes')){changeCategory('15 ml');return}
if(el.dataset.add){add(el.dataset.add);return}
if(el.dataset.detail){detail(el.dataset.detail);return}
if(el.dataset.qty){changeQty(el.dataset.qty,Number(el.dataset.delta)||0);return}
if(el.hasAttribute('data-edit-customer')){var fields=document.getElementById('customerFields');if(fields){fields.style.display='block';fields.querySelector('input').focus()}el.style.display='none';return}
if(el.hasAttribute('data-copy')){copyLast();return}
if(el.hasAttribute('data-clear-cart')){if(window.confirm('Deseja limpar o carrinho para montar um novo pedido?')){cart={};lastMessage='';saveCart();showCart()}return}
});
document.addEventListener('submit',function(e){if(e.target.id!=='checkoutForm')return;e.preventDefault();prepareOrder(e.target)});
document.getElementById('search').addEventListener('input',function(e){search=e.target.value||'';renderProducts()});
document.getElementById('categorySelect').addEventListener('change',function(e){changeCategory(e.target.value)});
overlay.addEventListener('click',function(e){if(e.target===overlay)closeSheet()});
window.addEventListener('keydown',function(e){if(e.key==='Escape'&&overlay.classList.contains('open'))closeSheet()});
if(!products.length){document.getElementById('featured').innerHTML='<div class="empty">Catálogo indisponível. Recarregue a página.</div>';document.getElementById('productsGrid').innerHTML='<div class="empty">Catálogo indisponível.</div>'}else{fillFilters();renderFeatured()}
updateBadge();
})();