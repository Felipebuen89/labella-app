import {TENANTS, BRAND_DEFAULTS, loadTenantState, saveTenantState} from "./data.js";

const icons={
 home:'<path d="m3 10 9-7 9 7v11H3z"/><path d="M9 21v-7h6v7"/>',
 bag:'<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
 stock:'<path d="M12 3 3 7l9 4 9-4-9-4ZM3 7v10l9 4 9-4V7M12 11v10"/>',
 chart:'<path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-8"/>',
 gift:'<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M12 9S6 8 6 5a3 3 0 0 1 6 0v4Zm0 0s6-1 6-4a3 3 0 0 0-6 0v4Z"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 5a3 3 0 0 1 0 6M19 21v-3a5 5 0 0 0-2-4"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M10 2h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3l-2-2 2-4 3 1 3-1Z"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
 check:'<path d="m4 12 5 5 11-11"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 19v2h16v-2"/>',
 edit:'<path d="m5 18-1 3 3-1L20 7l-3-3L5 18ZM14 7l3 3"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>',
 swap:'<path d="M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4"/>',
 receipt:'<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM8 8h8M8 12h8"/>'
};
const ico=(name)=>'<svg class="svg" viewBox="0 0 24 24" aria-hidden="true">'+(icons[name]||icons.home)+'</svg>';
const h=(value)=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const money=(n)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
const fmt=(d)=>new Date(d).toLocaleDateString("pt-BR");
const id=()=>Math.random().toString(36).slice(2,9).toUpperCase();
const today=()=>new Date().toLocaleDateString("en-CA",{timeZone:"America/Sao_Paulo"});
const sellerNav=[["home","Início","home"],["catalog","Pedidos","bag"],["stock","Estoque","stock"],["finance","Financeiro","chart"],["benefits","Benefícios","gift"]];
const adminNav=[["admin-home","Visão geral","home"],["admin-orders","Pedidos","bag"],["admin-sellers","Revendedores","users"],["admin-campaigns","Campanhas","gift"],["admin-catalog","Catálogo","stock"],["admin-brand","Configurações","settings"]];
const params=new URLSearchParams(location.search);
let tenantId=Object.hasOwn(TENANTS,params.get("rede"))?params.get("rede"):"aurora";
let state=loadTenantState(tenantId);
let mode="seller",page="home",category="Todos",search="",financePeriod="mes",overlay="",noticeUnread=true;
const $=(selector)=>document.querySelector(selector);
function save(){try{saveTenantState(tenantId,state)}catch(_){notify("Armazenamento local indisponível. Os dados podem não ser mantidos.")}}
function notify(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove("show"),2800)}
function tenant(){return TENANTS[tenantId]}
function brand(){return state.brand}
function products(){return state.catalog}
function product(productId){return products().find(p=>p.id===productId)}
function currentName(){return String(brand().displayName||tenant().name)}
function brandShort(){return (currentName().split(/\s+/).map(v=>v[0]).slice(0,2).join("")||"RF").toUpperCase()}
function safeLogo(){const s=String(brand().logoUrl||"");return /^https:\/\/[^\s"'<>]+$/i.test(s)?s:""}
function logo(){return '<div class="brand-badge">'+(safeLogo()?'<img src="'+h(safeLogo())+'" alt="Logo da rede">':h(brandShort()))+'</div>'}
function brandBar(){return '<div class="brand-lockup">'+logo()+'<div class="brand-copy"><div class="brand-name">'+h(currentName())+'</div><div class="brand-kicker">'+h(brand().subtitle||BRAND_DEFAULTS.subtitle)+'</div></div></div>'}
function modeSwitch(){return '<button class="btn small ghost" data-action="toggle-mode" title="Alternar visão demonstrativa">'+ico("swap")+(mode==="seller"?"Ver franquia":"Ver revendedor")+'</button>'}
function menu(){const nav=mode==="seller"?sellerNav:adminNav;return nav.map(([key,label,icon])=>'<button type="button" class="menu-btn '+(page===key?"active":"")+'" data-page="'+key+'">'+ico(icon)+h(label)+'</button>').join("")}
function mobileMenu(){const nav=mode==="seller"?sellerNav:adminNav.filter(item=>item[0]!=="admin-catalog");return nav.map(([key,label,icon])=>'<button type="button" class="'+(page===key?"active":"")+'" data-page="'+key+'" aria-label="'+h(label)+'">'+ico(icon)+'<span>'+h(label)+'</span></button>').join("")}
function header(title,sub,action=""){return '<div class="view-header"><div><p class="eyebrow">'+(mode==="seller"?"ESPAÇO DO REVENDEDOR":"GESTÃO DA REDE")+'</p><h1>'+h(title)+'</h1><p class="sub">'+h(sub)+'</p></div><div class="actions">'+action+'</div></div>'}
function button(label,action,cls=""){return '<button type="button" class="btn '+cls+'" data-action="'+action+'">'+h(label)+'</button>'}
function cardTitle(title,action=""){return '<div class="panel-head"><h3>'+h(title)+'</h3>'+action+'</div>'}
function empty(title,body){return '<div class="panel-empty"><div class="empty-icon">◇</div><strong>'+h(title)+'</strong><p class="sub">'+h(body)+'</p></div>'}
function metric(title,value,detail,icon){return '<div class="metric"><div class="metric-top"><span>'+h(title)+'</span><span class="metric-icon">'+ico(icon)+'</span></div><strong class="metric-val num">'+value+'</strong><span class="metric-foot">'+h(detail)+'</span></div>'}
function totals(){
 const stockQty=Object.values(state.stock).reduce((a,b)=>a+(Number(b.qty)||0),0);
 const invested=Object.values(state.stock).reduce((a,b)=>a+(Number(b.qty)||0)*(Number(b.unitCost)||0),0);
 const revenue=state.sales.reduce((a,s)=>a+s.total,0);
 const profit=state.sales.reduce((a,s)=>a+s.profit,0);
 return {stockQty,invested,revenue,profit,pending:state.orders.filter(o=>o.status==="Pendente").length};
}
function row(title,sub,side,icon="bag"){return '<div class="row-item"><div class="row-icon">'+ico(icon)+'</div><div class="row-main"><strong>'+h(title)+'</strong><small>'+h(sub)+'</small></div>'+side+'</div>'}
function activeCampaign(){return state.campaigns.filter(c=>c.active!==false).at(-1)||null}
function hero(){
 return '<section class="hero"><div class="hero-left"><p class="eyebrow">INTELIGÊNCIA PARA SUA REDE</p><h2>Mais controle.<br><em>Mais crescimento.</em></h2><p>Pedidos, estoque, resultados e oportunidades em uma experiência simples, feita para evoluir com seu negócio.</p><button type="button" class="btn primary" data-page="catalog">Explorar catálogo '+ico("arrow")+'</button></div><div class="hero-right" aria-hidden="true"><div class="hero-visual">'+h(brandShort())+'</div><div class="hero-mini">● &nbsp;Sua operação em um só lugar</div></div></section>';
}
function sellerHome(){
 const t=totals(), c=activeCampaign();
 const pending=state.orders.slice(-3).reverse();
 const alerts=products().filter(p=>(state.stock[p.id]?.qty||0)<=2);
 return header("Olá, "+(brand().resellerName||"consultor")+"!","Acompanhe a operação da sua revenda com informações claras e ações rápidas.",
 '<button class="btn ghost" data-page="catalog">'+ico("plus")+' Novo pedido</button>')+
 hero()+'<div class="stats">'+metric("Estoque investido",money(t.invested),"Valor dos produtos disponíveis","stock")+metric("Vendas registradas",money(t.revenue),"Acumulado do seu histórico","bag")+metric("Lucro bruto",money(t.profit),"Vendas menos custo dos itens","chart")+metric("Unidades disponíveis",t.stockQty,"Em seu estoque","stock")+'</div>'+
 '<div class="cols"><section class="panel">'+cardTitle("Pedidos recentes",'<button class="btn small ghost" data-page="catalog">Ver catálogo '+ico("arrow")+'</button>')+
 (pending.length?pending.map(o=>row("Pedido #"+o.id,fmt(o.createdAt)+" · "+o.items.length+" produto(s)",'<span class="tag '+(o.status==="Recebido"?"ok":"wait")+'">'+h(o.status)+'</span>')).join(""):empty("Seu primeiro pedido começa aqui","Adicione produtos do catálogo para enviar uma solicitação à franquia."))+
 '</section><section class="panel">'+cardTitle("Oportunidades da sua rede")+(c?'<div class="aside-callout"><span class="eyebrow">CAMPANHA ATIVA</span><h3>'+h(c.title)+'</h3><p>'+h(c.body)+'</p><span class="tag">'+h(c.coupon)+' · '+Number(c.percent)+'% OFF</span></div>':empty("Sem campanha ativa","A franquia poderá divulgar novas oportunidades."))+
 '<div class="row-item"><div class="row-main"><strong>Reposição recomendada</strong><small>'+alerts.length+' produto(s) com até 2 unidades</small></div><button class="btn small ghost" data-page="stock">Consultar</button></div></section></div>';
}
function productCard(p){
 const qty=Number(state.cart[p.id]||0);
 return '<article class="product"><div class="product-img" aria-hidden="true">'+h(p.emoji)+'</div><div class="product-body"><small>'+h(p.category)+'</small><h3>'+h(p.name)+'</h3><div class="product-prices"><strong>'+money(p.cost)+'</strong><span>Venda sugerida<br>'+money(p.suggested)+'</span></div><div class="qty-tools">'+(qty?
 '<div class="stepper"><button aria-label="Remover '+h(p.name)+'" data-qty="-1" data-id="'+h(p.id)+'">−</button><span>'+qty+'</span><button aria-label="Adicionar '+h(p.name)+'" data-qty="1" data-id="'+h(p.id)+'">+</button></div>':
 '<button class="btn primary block small" data-qty="1" data-id="'+h(p.id)+'">'+ico("plus")+' Adicionar</button>')+'</div></div></article>';
}
function filteredProducts(){
 return products().filter(p=>(category==="Todos"||p.category===category)&&p.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
}
function catalogView(){
 const cats=["Todos",...new Set(products().map(p=>p.category))],ct=Object.entries(state.cart).filter(([pid,q])=>product(pid)&&q>0);
 const sub=ct.reduce((a,[pid,q])=>a+product(pid).cost*q,0);
 const camp=activeCampaign();
 return header("Catálogo & pedidos","Selecione produtos, revise quantidades e envie pedidos à sua franquia.")+
 '<div class="product-toolbar"><div class="search-box">'+ico("search")+'<input class="field" id="product-search" type="search" placeholder="Buscar produtos..." value="'+h(search)+'" aria-label="Buscar produtos"></div><span class="pill">'+products().length+' produtos</span></div>'+
 '<div class="chips" style="margin-bottom:19px">'+cats.map(c=>'<button class="chip '+(category===c?"active":"")+'" data-category="'+h(c)+'">'+h(c)+'</button>').join("")+'</div>'+
 '<div id="product-grid" class="products">'+(filteredProducts().map(productCard).join("")||empty("Nenhum resultado","Tente outra busca ou categoria."))+'</div>'+
 '<div class="panel cart-drawer"><div class="panel-head"><h3>Resumo do pedido</h3><span class="tag">'+ct.reduce((a,[,q])=>a+q,0)+' unidades</span></div>'+
 (ct.length?ct.map(([pid,q])=>row(product(pid).name,q+" unidade(s)",'<strong>'+money(product(pid).cost*q)+'</strong>')).join(""):empty("Carrinho vazio","Adicione produtos para criar uma solicitação."))+
 (camp?'<p class="sub" style="font-size:12px">Cupom disponível: <strong>'+h(camp.coupon)+'</strong> ('+Number(camp.percent)+'%)</p>':"")+
 '<div class="summary"><span>Total de compra</span><strong>'+money(sub)+'</strong></div><div class="actions" style="justify-content:flex-end;margin-top:18px"><button class="btn primary" data-action="checkout" '+(!ct.length?"disabled":"")+'>'+ico("bag")+' Revisar pedido</button></div></div>';
}
function stockView(){
 const rows=products().map(p=>{
 const entry=state.stock[p.id]||{}, qty=Number(entry.qty)||0;
 return '<tr><td><strong>'+h(p.name)+'</strong><br><small>'+h(p.category)+'</small></td><td class="num">'+qty+'</td><td class="num">'+money(entry.unitCost??p.cost)+'</td><td><span class="tag '+(qty>2?"ok":"wait")+'">'+(qty>2?"Disponível":"Repor")+'</span></td><td><button class="btn small '+(qty?"primary":"ghost")+'" data-sell="'+h(p.id)+'" '+(!qty?"disabled":"")+'>Registrar venda</button></td></tr>'
 }).join("");
 return header("Meu estoque","Acompanhe suas unidades e registre cada venda no momento em que acontecer.")+
 '<div class="stats">'+metric("Unidades",totals().stockQty,"Disponíveis","stock")+metric("Capital em estoque",money(totals().invested),"Custo registrado","chart")+metric("Produtos zerados",products().filter(p=>!state.stock[p.id]?.qty).length,"Precisam de reposição","clock")+metric("Vendas",state.sales.length,"Lançamentos feitos","bag")+'</div>'+
 '<section class="panel">'+cardTitle("Controle de produtos")+'<div class="table-scroll"><table class="table"><thead><tr><th>Produto</th><th>Quantidade</th><th>Custo médio</th><th>Status</th><th>Ação</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="sub">O estoque aumenta quando um pedido fica pronto para retirada e você confirma seu recebimento.</p></section>';
}
function selectPeriod(){
 return '<div class="chips">'+[["dia","Hoje"],["semana","Semana"],["mes","Mês"],["ano","Ano"],["todos","Tudo"]].map(([v,t])=>'<button class="chip '+(financePeriod===v?"active":"")+'" data-period="'+v+'">'+t+'</button>').join("")+'</div>';
}
function periodSales(){
 const now=new Date();return state.sales.filter(s=>{const d=new Date(s.date);if(financePeriod==="todos")return true;if(financePeriod==="dia")return d.toDateString()===now.toDateString();if(financePeriod==="semana")return (now-d)<7*86400000;if(financePeriod==="mes")return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();return d.getFullYear()===now.getFullYear()});
}
function financeView(){
 const filtered=periodSales(),rev=filtered.reduce((a,s)=>a+s.total,0),cost=filtered.reduce((a,s)=>a+s.costTotal,0),profit=filtered.reduce((a,s)=>a+s.profit,0);
 const byProduct=Object.values(filtered.reduce((a,s)=>{if(!a[s.productId])a[s.productId]={name:s.name,total:0};a[s.productId].total+=s.total;return a},{})).sort((a,b)=>b.total-a.total);
 return header("Financeiro","Entenda o resultado da sua revenda, por período.",'<button class="btn ghost" data-action="export-csv">'+ico("download")+' Exportar CSV</button>')+
 '<div style="margin-bottom:19px">'+selectPeriod()+'</div><div class="stats">'+metric("Faturamento",money(rev),"Valor das vendas registradas","chart")+metric("Custo vendido",money(cost),"Custo dos itens vendidos","stock")+metric("Lucro bruto",money(profit),"Antes de taxas e despesas","chart")+metric("Lançamentos",filtered.length,"Vendas no período","receipt")+'</div>'+
 '<div class="cols"><section class="panel">'+cardTitle("Principais produtos por receita")+(byProduct.length?'<div class="barlist">'+byProduct.slice(0,6).map(x=>'<div class="bar-row"><span>'+h(x.name)+'</span><div class="progress"><div class="progress-fill" style="width:'+Math.max(2,Math.round(x.total/byProduct[0].total*100))+'%"></div></div><span>'+money(x.total)+'</span></div>').join("")+'</div>':empty("Sem vendas neste período","Registre uma venda em Estoque para visualizar os resultados."))+'</section>'+
 '<section class="panel">'+cardTitle("Últimos lançamentos")+(filtered.length?filtered.slice(-5).reverse().map(s=>row(s.name,fmt(s.date)+" · "+s.qty+" unidade(s)",'<strong>'+money(s.total)+'</strong>')).join(""):empty("Nenhum lançamento","As vendas aparecerão nesta lista."))+'</section></div>';
}
function benefitsView(){
 const salesTotal=state.sales.reduce((a,s)=>a+s.total,0),points=Math.floor(salesTotal/20),campaigns=state.campaigns.filter(c=>c.active!==false);
 return header("Benefícios da rede","Campanhas, treinamentos e reconhecimento para apoiar suas vendas.")+
 '<div class="stats">'+metric("Pontos demonstrativos",points,"1 ponto por R$ 20 em vendas","gift")+metric("Campanhas ativas",campaigns.length,"Divulgadas pela rede","bell")+metric("Treinamentos",state.training.length,"Materiais disponíveis","users")+metric("Vendas realizadas",state.sales.length,"Eventos registrados","chart")+'</div>'+
 '<div class="cols"><section class="panel">'+cardTitle("Ofertas e campanhas")+(campaigns.length?campaigns.map(c=>'<div class="aside-callout" style="margin-bottom:12px"><p class="eyebrow">EXCLUSIVO DA REDE</p><h3>'+h(c.title)+'</h3><p>'+h(c.body)+'</p><span class="tag">'+h(c.coupon)+' · '+Number(c.percent)+'%</span></div>').join(""):empty("Nada publicado","A franquia pode criar campanhas pelo painel."))+'</section>'+
 '<section class="panel">'+cardTitle("Academia de vendas")+state.training.map(t=>row(t.title,t.description,'', "check")).join("")+'</section></div><p class="note" style="margin-top:16px">Pontos ilustrativos: regras de resgate, campanhas e sorteios deverão ser configuradas para cada rede antes do uso real.</p>';
}
function adminHome(){
 const t=totals();
 const orders=state.orders.slice(-4).reverse();
 return header("Visão geral da rede","Acompanhe pedidos, equipe e campanhas em uma única operação.",'<button class="btn primary" data-page="admin-campaigns">'+ico("plus")+' Nova campanha</button>')+
 '<div class="stats">'+metric("Revendedores",state.sellers.length,"Contas ilustrativas","users")+metric("Pedidos recebidos",state.orders.length,t.pending+" aguardando aprovação","bag")+metric("Vendas registradas",money(t.revenue),"Dados locais de demonstração","chart")+metric("Campanhas ativas",state.campaigns.filter(x=>x.active!==false).length,"Conteúdo publicado","gift")+'</div>'+
 '<div class="cols"><section class="panel">'+cardTitle("Pedidos recentes",'<button class="btn small ghost" data-page="admin-orders">Gerenciar</button>')+
 (orders.length?orders.map(o=>row("#"+o.id,o.reseller+" · "+fmt(o.createdAt),'<span class="tag '+(o.status==="Recebido"?"ok":"wait")+'">'+h(o.status)+'</span>')).join(""):empty("Sem pedidos","Entre na visão de revendedor e crie um pedido demonstrativo."))+
 '</section><section class="panel">'+cardTitle("Seu espaço de marca")+'<div class="aside-callout"><span class="eyebrow">WHITE-LABEL</span><h3>'+h(currentName())+'</h3><p>Identidade configurável, catálogo por rede e dados demonstrativos independentes.</p><button class="btn small primary" data-page="admin-brand">Personalizar marca '+ico("arrow")+'</button></div><div class="row-item"><div class="row-main"><strong>Catálogo da rede</strong><small>'+products().length+' produtos desta demonstração</small></div><button class="btn small ghost" data-page="admin-catalog">Consultar</button></div></section></div>';
}
function statusTag(o){return '<span class="tag '+(o.status==="Recebido"?"ok":"wait")+'">'+h(o.status)+'</span>'}
function adminOrders(){
 return header("Gestão de pedidos","Aprove pedidos, libere retirada e acompanhe a confirmação do revendedor.")+
 '<section class="panel">'+cardTitle("Pedidos recebidos")+(state.orders.length?state.orders.slice().reverse().map(o=>
 '<div class="row-item" style="align-items:flex-start;flex-wrap:wrap"><div class="row-icon">'+ico("bag")+'</div><div class="row-main"><strong>Pedido #'+h(o.id)+' — '+money(o.total)+'</strong><small>'+h(o.reseller)+' · '+fmt(o.createdAt)+' · '+o.items.reduce((a,i)=>a+i.qty,0)+' unidade(s)</small><p class="sub" style="font-size:12px">'+o.items.map(i=>h(i.name)+' ×'+i.qty).join(" · ")+'</p></div><div class="actions">'+statusTag(o)+(o.status==="Pendente"?'<button class="btn small primary" data-order-action="approve" data-id="'+h(o.id)+'">Aprovar</button>':"")+(o.status==="Aprovado"?'<button class="btn small primary" data-order-action="ready" data-id="'+h(o.id)+'">Pronto para retirada</button>':"")+(o.status==="Pronto para retirada"?'<span class="muted">Aguardando revendedor</span>':"")+'<button class="btn small ghost" data-receipt="'+h(o.id)+'">Ver pedido / PDF</button></div></div>').join(""):empty("Nenhum pedido","Crie um pedido na área de revendedor para testar o fluxo."))+'</section>';
}
function adminSellers(){
 return header("Revendedores","Cadastros e desempenho exibidos apenas para esta demonstração.")+
 '<section class="panel">'+cardTitle("Equipe cadastrada")+'<div class="table-scroll"><table class="table"><thead><tr><th>Nome</th><th>Cidade</th><th>Contato</th><th>Status</th></tr></thead><tbody>'+state.sellers.map(s=>'<tr><td><strong>'+h(s.name)+'</strong></td><td>'+h(s.city)+'</td><td>'+h(s.phone)+'</td><td><span class="tag ok">'+h(s.status)+'</span></td></tr>').join("")+'</tbody></table></div></section>'+
 '<div class="panel" style="margin-top:17px">'+cardTitle("Visão futura")+'<p class="sub">Na versão comercial, cada revendedor terá autenticação individual, vínculo com sua franquia e registros centralizados no servidor. Estes dados são apenas fictícios.</p></div>';
}
function adminCampaigns(){
 return header("Campanhas & comunicação","Publique ações demonstrativas que aparecem na tela de benefícios do revendedor.")+
 '<div class="cols"><section class="panel">'+cardTitle("Criar campanha")+
 '<form id="campaign-form" class="list-form"><div class="form-field"><label for="camp-title">Título</label><input class="field" name="title" id="camp-title" required maxlength="80" placeholder="Ex.: Semana da Rede"></div>'+
 '<div class="form-field"><label for="camp-body">Mensagem</label><textarea class="field" name="body" id="camp-body" rows="3" required maxlength="240" placeholder="Descreva a oportunidade."></textarea></div>'+
 '<div class="form-grid"><div class="form-field"><label for="camp-code">Cupom</label><input class="field" id="camp-code" name="coupon" maxlength="18" placeholder="REDE10"></div><div class="form-field"><label for="camp-percent">Desconto (%)</label><input class="field" id="camp-percent" type="number" name="percent" min="0" max="80" step="1" value="10"></div></div><button class="btn primary" type="submit">'+ico("plus")+' Publicar na demo</button></form></section>'+
 '<section class="panel">'+cardTitle("Campanhas publicadas")+(state.campaigns.length?state.campaigns.slice().reverse().map(c=>
 '<div class="row-item"><div class="row-main"><strong>'+h(c.title)+'</strong><small>'+h(c.body)+'</small><small>'+h(c.coupon||"Sem cupom")+' · '+Number(c.percent||0)+'% de desconto</small></div><button class="btn small '+(c.active!==false?"ghost":"primary")+'" data-campaign="'+h(c.id)+'">'+(c.active!==false?"Desativar":"Ativar")+'</button></div>').join(""):empty("Nenhuma campanha","Publique sua primeira campanha."))+'</section></div>';
}
function adminCatalog(){
 return header("Catálogo da rede","Cadastre produtos e preços desta franquia, sem afetar os outros modelos.",'<button class="btn primary" data-action="add-product">'+ico("plus")+' Adicionar produto</button>')+
 '<section class="panel">'+cardTitle("Produtos disponíveis")+'<div class="table-scroll"><table class="table"><thead><tr><th>Produto</th><th>Categoria</th><th>Custo</th><th>Venda sugerida</th><th>Ações</th></tr></thead><tbody>'+
 (products().map(p=>'<tr><td>'+h(p.emoji)+' &nbsp;'+h(p.name)+'</td><td>'+h(p.category)+'</td><td>'+money(p.cost)+'</td><td>'+money(p.suggested)+'</td><td><div class="actions"><button class="btn small ghost" data-editproduct="'+h(p.id)+'">Editar</button><button class="btn small danger" data-removeproduct="'+h(p.id)+'">Excluir</button></div></td></tr>').join("")||'<tr><td colspan="5">Catálogo vazio: adicione um produto.</td></tr>')+
 '</tbody></table></div><p class="sub">Os dados editados ficam apenas neste navegador. Na versão comercial o catálogo será sincronizado com sua franquia.</p></section>';
}
function brandSettings(){
 return header("Marca & configurações","Personalize a experiência sem alterar o código do aplicativo.")+
 '<div class="cols"><section class="panel">'+cardTitle("Identidade visual")+
 '<form id="brand-form" class="list-form"><div class="form-field"><label>Nome da franquia</label><input class="field" name="displayName" required minlength="2" maxlength="48" value="'+h(currentName())+'"></div>'+
 '<div class="form-field"><label>Subtítulo</label><input class="field" name="subtitle" maxlength="65" value="'+h(brand().subtitle)+'"></div>'+
 '<div class="form-field"><label>URL HTTPS do logo (opcional)</label><input class="field" type="url" name="logoUrl" placeholder="https://.../logo.png" value="'+h(brand().logoUrl||"")+'"></div>'+
 '<div class="form-field"><label>Nome do revendedor demo</label><input class="field" name="resellerName" required maxlength="55" value="'+h(brand().resellerName||"")+'"></div>'+
 '<button class="btn primary" type="submit">'+ico("check")+' Salvar identidade</button></form></section>'+
 '<section class="panel">'+cardTitle("Modelos de franquia")+'<p class="sub">Alterne entre dois exemplos fictícios. Os dados locais ficam separados por rede.</p>'+
 '<div class="form-field" style="margin-top:18px"><label for="tenant-select">Selecionar segmento de demonstração</label><select class="field" id="tenant-select">'+Object.values(TENANTS).map(t=>'<option value="'+h(t.id)+'" '+(tenantId===t.id?"selected":"")+'>'+h(t.name)+' · '+h(t.category)+'</option>').join("")+'</select></div>'+
 '<div class="aside-callout" style="margin-top:18px"><p class="eyebrow">PRETO & CHAMPAGNE</p><h3>Design premium consistente</h3><p>Paleta preservada em todas as franquias. Nome, marca e catálogo são independentes.</p></div>'+
 '<button class="btn ghost" style="margin-top:18px" data-action="reset-tenant">Restaurar esta demonstração</button>'+
 '<p class="note" style="margin-top:15px">Atenção: restaurar apaga apenas os pedidos, vendas e personalizações de demonstração desta rede neste navegador.</p></section></div>';
}
function pageContent(){
 if(mode==="seller")return ({home:sellerHome,catalog:catalogView,stock:stockView,finance:financeView,benefits:benefitsView})[page]?.()||sellerHome();
 return ({"admin-home":adminHome,"admin-orders":adminOrders,"admin-sellers":adminSellers,"admin-campaigns":adminCampaigns,"admin-brand":brandSettings,"admin-catalog":adminCatalog})[page]?.()||adminHome();
}
function render(keepScroll=false){
 const y=window.scrollY;
 document.documentElement.style.setProperty("--gold",String(brand().gold||"#c8a76e"));
 $("#app").innerHTML='<header class="mobile-header">'+brandBar()+'<div class="actions"><button class="icon-btn" data-action="toggle-mode" title="Alternar visão" aria-label="Alternar entre revendedor e franquia">'+ico("swap")+'</button><button class="icon-btn" data-action="notifications" title="Avisos" aria-label="Ver avisos">'+ico("bell")+(noticeUnread?'<span class="unread"></span>':"")+'</button></div></header>'+
 '<div class="shell"><aside class="sidebar"><div class="brand-wrap">'+brandBar()+'</div><span class="sidebar-label">'+(mode==="seller"?"Meu negócio":"Operação da franquia")+'</span><nav class="menu" aria-label="Menu principal">'+menu()+'</nav><div class="side-foot"><strong>RedeOS · Demonstração</strong>Aplicativo white-label para franquias. Nenhum dado é compartilhado com um servidor.</div></aside>'+
 '<div class="workspace"><div class="topbar"><div><span class="top-kicker">'+h(currentName())+' / '+(mode==="seller"?"Revendedor":"Franquia")+'</span><div class="top-title">Painel de gestão</div></div><div class="top-actions"><span class="pill mode-pill">Ambiente demonstrativo</span>'+modeSwitch()+'<button class="icon-btn" data-action="notifications" aria-label="Notificações">'+ico("bell")+(noticeUnread?'<span class="unread"></span>':"")+'</button></div></div>'+
 '<div class="demo-strip">DEMONSTRAÇÃO LOCAL · Dados fictícios · Sem autenticação, pagamentos ou sincronização com a franquia real.</div>'+
 '<main id="view">'+pageContent()+'</main><div class="footer-note">RedeOS · Plataforma demonstrativa para franquias · Versão white-label 1.0</div></div></div>'+
 '<nav class="bottom-nav" aria-label="Navegação móvel">'+mobileMenu()+'</nav>'+overlay;
 if(keepScroll)window.scrollTo(0,y);else window.scrollTo(0,0);
}
function modal(title,body){
 overlay='<div class="modal-wrap" data-overlay="1"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><p class="eyebrow">REDEOS</p><h2 id="modal-title">'+h(title)+'</h2></div><button type="button" class="close" data-action="close-modal" aria-label="Fechar">×</button></div>'+body+'</section></div>';
 render(true);
}
function closeModal(){overlay="";render(true)}
function checkout(){
 const arr=Object.entries(state.cart).filter(([pid,q])=>product(pid)&&q>0);
 if(!arr.length)return notify("Adicione produtos ao carrinho.");
 const base=arr.reduce((a,[pid,q])=>a+product(pid).cost*q,0);
 const c=activeCampaign();
 modal("Revisar pedido",'<p class="sub">Confira os produtos antes de enviar para aprovação da rede.</p>'+
 arr.map(([pid,q])=>row(product(pid).name,q+" unidade(s)",'<strong>'+money(product(pid).cost*q)+'</strong>')).join("")+
 '<form id="checkout-form"><div class="form-field"><label for="coupon">Cupom (opcional)</label><input id="coupon" name="coupon" class="field" placeholder="Ex.: '+h(c?.coupon||"REDE10")+'" maxlength="18"></div>'+
 '<div class="form-field"><label for="pickup">Data pretendida para retirada</label><input class="field" id="pickup" name="pickup" type="date" required min="'+today()+'" value="'+today()+'"></div>'+
 '<div class="summary"><span>Subtotal</span><strong>'+money(base)+'</strong></div><button class="btn primary block" type="submit" style="margin-top:20px">'+ico("check")+' Enviar pedido</button></form>');
}
function createOrder(form){
 const arr=Object.entries(state.cart).filter(([pid,q])=>product(pid)&&q>0);
 if(!arr.length)return notify("O carrinho está vazio.");
 const camp=activeCampaign(),code=String(form.get("coupon")||"").trim().toUpperCase();
 if(code&&(!camp||code!==String(camp.coupon||"").toUpperCase()))return notify("Cupom inválido ou inativo.");
 const subtotal=arr.reduce((a,[pid,q])=>a+product(pid).cost*q,0);
 const discount=code?Math.round(subtotal*(Number(camp.percent||0)/100)*100)/100:0;
 const order={id:id(),createdAt:new Date().toISOString(),reseller:brand().resellerName||"Consultor Demo",
   items:arr.map(([pid,q])=>({productId:pid,name:product(pid).name,qty:Number(q),unitCost:product(pid).cost})),
   subtotal,discount,total:Math.max(0,subtotal-discount),pickup:String(form.get("pickup")||""),status:"Pendente"};
 state.orders.push(order);state.cart={};save();overlay="";page="catalog";render();
 notify("Pedido #"+order.id+" enviado para aprovação na demonstração.");
}
function updateOrder(orderId,next){
 const o=state.orders.find(x=>x.id===orderId);if(!o)return;
 const allowed=(o.status==="Pendente"&&next==="Aprovado")||(o.status==="Aprovado"&&next==="Pronto para retirada")||(o.status==="Pronto para retirada"&&next==="Recebido");
 if(!allowed)return notify("Essa transição não é permitida.");
 if(next==="Recebido"){
   o.items.forEach(i=>{const previous=state.stock[i.productId]||{qty:0,unitCost:i.unitCost};
     const qty=Number(previous.qty)||0,unitCost=Number(previous.unitCost)||0;
     const newQty=qty+i.qty;const receivedCost=i.unitCost*(1-(o.subtotal?o.discount/o.subtotal:0));
     state.stock[i.productId]={qty:newQty,unitCost:newQty?(qty*unitCost+i.qty*receivedCost)/newQty:receivedCost};
   });
 }
 o.status=next;save();render(true);notify("Pedido #"+o.id+" → "+next);
}
function sellerOrderStatus(){
 const ready=state.orders.filter(o=>o.status==="Pronto para retirada");
 if(!ready.length)return "";
 return '<section class="panel" style="margin-top:18px">'+cardTitle("Pedidos prontos para retirada")+
 ready.map(o=>row("Pedido #"+o.id,fmt(o.createdAt)+" · "+money(o.total),'<button class="btn primary small" data-order-action="receive" data-id="'+h(o.id)+'">Confirmar recebimento</button>')).join("")+'</section>';
}
function sellModal(pid){
 const p=product(pid),available=Number(state.stock[pid]?.qty)||0;if(!p||available<1)return;
 modal("Registrar venda",'<p class="sub">'+h(p.name)+' · '+available+' unidade(s) em estoque</p>'+
 '<form id="sell-form"><input type="hidden" name="productId" value="'+h(pid)+'"><div class="form-field"><label>Quantidade</label><input class="field" name="qty" type="number" min="1" max="'+available+'" value="1" step="1" required></div>'+
 '<div class="form-field"><label>Preço de venda por unidade (R$)</label><input class="field" name="price" type="number" min="0" step="0.01" value="'+p.suggested.toFixed(2)+'" required></div>'+
 '<p class="note">O lucro bruto considera o custo médio do estoque, incluindo descontos do pedido recebido.</p><button class="btn primary block" type="submit">'+ico("check")+' Concluir venda</button></form>');
}
function sell(form){
 const pid=String(form.get("productId")),p=product(pid),qty=Number(form.get("qty")),price=Number(form.get("price"));
 const entry=state.stock[pid];
 if(!p||!entry||!Number.isInteger(qty)||qty<1||qty>entry.qty||!Number.isFinite(price)||price<0)return notify("Revise a quantidade e o preço.");
 const total=qty*price,costTotal=qty*entry.unitCost;
 entry.qty-=qty;state.sales.push({id:id(),productId:pid,name:p.name,qty,unitPrice:price,total,costTotal,profit:total-costTotal,date:new Date().toISOString()});
 save();overlay="";render(true);notify("Venda registrada · Lucro bruto "+money(total-costTotal));
}
function productModal(pid){
 const p=pid?product(pid):null;
 modal(p?"Editar produto":"Novo produto",
 '<form id="product-form"><input type="hidden" name="productId" value="'+h(p?.id||"")+'">'+
 '<div class="form-field"><label>Nome do produto</label><input class="field" name="name" required minlength="2" maxlength="90" value="'+h(p?.name||"")+'"></div>'+
 '<div class="form-field"><label>Categoria</label><input class="field" name="category" required minlength="2" maxlength="55" value="'+h(p?.category||"")+'" placeholder="Ex.: Skincare, acessórios, kits"></div>'+
 '<div class="form-grid"><div class="form-field"><label>Custo de compra (R$)</label><input class="field" name="cost" type="number" min="0" step="0.01" required value="'+h(p?.cost??"")+'"></div>'+
 '<div class="form-field"><label>Preço sugerido (R$)</label><input class="field" name="suggested" type="number" min="0" step="0.01" required value="'+h(p?.suggested??"")+'"></div></div>'+
 '<div class="form-field"><label>Ícone/emoji do catálogo</label><input class="field" name="emoji" maxlength="8" value="'+h(p?.emoji||"📦")+'"></div>'+
 '<button class="btn primary block" type="submit">'+ico("check")+' Salvar produto</button></form>');
}
function removeProduct(pid){
 const p=product(pid);if(!p)return;
 const inUse=(state.stock[pid]?.qty||0)>0||state.orders.some(o=>o.items.some(i=>i.productId===pid))||state.sales.some(s=>s.productId===pid);
 if(inUse)return notify("Produto com movimentações: exclusão bloqueada para preservar o histórico.");
 if(!confirm("Excluir "+p.name+" do catálogo desta demonstração?"))return;
 state.catalog=state.catalog.filter(p=>p.id!==pid);delete state.cart[pid];save();render(true);notify("Produto excluído do catálogo.");
}
function notices(){
 noticeUnread=false;
 modal("Central de avisos",'<div class="notice-list"><div class="notice-card"><h3>Bem-vindo à '+h(currentName())+'</h3><p>Use a visão de revendedor para fazer pedidos. Na visão da franquia, aprove a solicitação.</p></div>'+
 state.orders.slice(-5).reverse().map(o=>'<div class="notice-card"><h3>Pedido #'+h(o.id)+'</h3><p>Status atual: '+h(o.status)+'</p></div>').join("")+
 '</div>');
}
function receipt(o){
 const content='<h1>Pedido #'+h(o.id)+'</h1><p><strong>Franquia:</strong> '+h(currentName())+'</p><p><strong>Revendedor:</strong> '+h(o.reseller)+'</p><p><strong>Data:</strong> '+fmt(o.createdAt)+' · <strong>Retirada:</strong> '+h(o.pickup||"A combinar")+'</p><table><thead><tr><th>Produto</th><th>Qtd.</th><th>Valor</th></tr></thead><tbody>'+
 o.items.map(i=>'<tr><td>'+h(i.name)+'</td><td>'+i.qty+'</td><td>'+money(i.qty*i.unitCost)+'</td></tr>').join("")+
 '</tbody></table><p>Subtotal: '+money(o.subtotal)+'</p><p>Desconto: '+money(o.discount)+'</p><h2>Total: '+money(o.total)+'</h2><p>Status: '+h(o.status)+'</p><small>Comprovante demonstrativo, sem validade fiscal.</small>';
 const win=window.open("","_blank");
 if(!win)return notify("O navegador bloqueou a janela. Autorize pop-ups para imprimir.");
 win.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pedido #'+h(o.id)+'</title><style>body{font-family:Arial,sans-serif;color:#222;max-width:730px;margin:32px auto;padding:20px}h1{color:#34312b}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;border-bottom:1px solid #ddd;padding:12px}small{color:#777}</style></head><body>'+content+'<script>window.onload=()=>window.print()<\/script></body></html>');
 win.document.close();
}
function exportCSV(){
 const rows=[["Data","Produto","Quantidade","Preco unitario","Faturamento","Custo","Lucro"],...state.sales.map(s=>[s.date,s.name,s.qty,s.unitPrice,s.total,s.costTotal,s.profit])];
 const csv="\uFEFF"+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(";")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="redeos-vendas-"+tenantId+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
 notify("Relatório CSV gerado.");
}
function switchTenant(next){
 if(!Object.hasOwn(TENANTS,next))return;
 tenantId=next;state=loadTenantState(next);mode="admin";page="admin-brand";overlay="";category="Todos";search="";
 const url=new URL(location.href);url.searchParams.set("rede",next);history.replaceState(null,"",url.toString());render();notify("Modelo alterado: "+tenant().name);
}
document.addEventListener("click",e=>{
 if(e.target.matches("[data-overlay]")){closeModal();return}
 const btn=e.target.closest("[data-page],[data-action],[data-category],[data-qty],[data-order-action],[data-sell],[data-period],[data-campaign],[data-receipt],[data-editproduct],[data-removeproduct]");
 if(!btn)return;
 if(btn.dataset.page){page=btn.dataset.page;category="Todos";search="";render();return}
 if(btn.dataset.category!==undefined){category=btn.dataset.category;render(true);return}
 if(btn.dataset.qty){const pid=btn.dataset.id,n=Number(btn.dataset.qty);if(!product(pid))return;state.cart[pid]=Math.max(0,Math.min(500,(Number(state.cart[pid])||0)+n));if(!state.cart[pid])delete state.cart[pid];save();render(true);return}
 if(btn.dataset.period){financePeriod=btn.dataset.period;render(true);return}
 if(btn.dataset.sell){sellModal(btn.dataset.sell);return}
 if(btn.dataset.editproduct!==undefined){productModal(btn.dataset.editproduct);return}
 if(btn.dataset.removeproduct!==undefined){removeProduct(btn.dataset.removeproduct);return}
 if(btn.dataset.campaign){const c=state.campaigns.find(x=>x.id===btn.dataset.campaign);if(c){c.active=c.active===false;save();render(true)}return}
 if(btn.dataset.orderAction){updateOrder(btn.dataset.id,btn.dataset.orderAction==="approve"?"Aprovado":btn.dataset.orderAction==="ready"?"Pronto para retirada":"Recebido");return}
 if(btn.dataset.receipt){const o=state.orders.find(x=>x.id===btn.dataset.receipt);if(o)receipt(o);return}
 switch(btn.dataset.action){
 case "checkout":checkout();break;
 case "add-product":productModal(null);break;
 case "toggle-mode":mode=mode==="seller"?"admin":"seller";page=mode==="seller"?"home":"admin-home";overlay="";render();break;
 case "notifications":notices();break;
 case "close-modal":closeModal();break;
 case "export-csv":exportCSV();break;
 case "reset-tenant":if(confirm("Restaurar os dados fictícios desta rede neste navegador?")){
  localStorage.removeItem("redeos-demo-v1:"+tenantId);state=loadTenantState(tenantId);render();notify("Demonstração restaurada.");
 }break;
 }
});
document.addEventListener("input",e=>{
 if(e.target.id==="product-search"){search=e.target.value;const grid=$("#product-grid");if(grid)grid.innerHTML=filteredProducts().map(productCard).join("")||empty("Sem resultados","Busque por outro produto.");}
});
document.addEventListener("change",e=>{if(e.target.id==="tenant-select")switchTenant(e.target.value)});
document.addEventListener("submit",e=>{
 const form=e.target;if(!["checkout-form","sell-form","campaign-form","brand-form","product-form"].includes(form.id))return;e.preventDefault();
 const fd=new FormData(form);
 if(form.id==="checkout-form")createOrder(fd);
 if(form.id==="sell-form")sell(fd);
 if(form.id==="campaign-form"){
   const title=String(fd.get("title")||"").trim(),body=String(fd.get("body")||"").trim(),coupon=String(fd.get("coupon")||"").trim().toUpperCase(),percent=Number(fd.get("percent")||0);
   if(title.length<3||body.length<5||!Number.isFinite(percent)||percent<0||percent>80)return notify("Confira os dados da campanha.");
   state.campaigns.push({id:id(),title,body,coupon,percent,active:true});save();render(true);notify("Campanha publicada na demonstração.");
 }
 if(form.id==="product-form"){
   const pid=String(fd.get("productId")||""),name=String(fd.get("name")||"").trim(),cat=String(fd.get("category")||"").trim(),emoji=String(fd.get("emoji")||"📦").trim()||"📦",cost=Number(fd.get("cost")),suggested=Number(fd.get("suggested"));
   if(name.length<2||cat.length<2||![cost,suggested].every(n=>Number.isFinite(n)&&n>=0))return notify("Confira nome, categoria e preços.");
   if(pid&&product(pid)){Object.assign(product(pid),{name,category:cat,emoji,cost,suggested});}
   else state.catalog.push({id:"p-"+id().toLowerCase(),name,category:cat,emoji,cost,suggested});
   save();overlay="";page="admin-catalog";render(true);notify("Catálogo atualizado.");
 }
 if(form.id==="brand-form"){
   const displayName=String(fd.get("displayName")||"").trim(),subtitle=String(fd.get("subtitle")||"").trim(),logoUrl=String(fd.get("logoUrl")||"").trim(),resellerName=String(fd.get("resellerName")||"").trim();
   if(displayName.length<2||!resellerName)return notify("Confira nome da franquia e revendedor.");
   if(logoUrl&&!/^https:\/\/[^\s"'<>]+$/i.test(logoUrl))return notify("Use uma URL HTTPS válida para o logo.");
   Object.assign(state.brand,{displayName,subtitle,logoUrl,resellerName});save();render(true);notify("Identidade atualizada.");
 }
});
const originalCatalogView=catalogView;
catalogView=function(){
 const out=originalCatalogView();
 const ready=sellerOrderStatus();
 const statuses=state.orders.length?'<section class="panel" style="margin-top:18px">'+cardTitle("Meus pedidos")+
 state.orders.slice().reverse().map(o=>row("Pedido #"+o.id,fmt(o.createdAt)+" · "+money(o.total),statusTag(o)+' <button class="btn small ghost" data-receipt="'+h(o.id)+'">PDF</button>')).join("")+'</section>':"";
 return out+ready+statuses;
};
render();
