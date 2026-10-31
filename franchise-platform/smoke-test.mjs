import assert from "node:assert/strict";
import {TENANTS, loadTenantState} from "./data.js";

const storage=new Map();
globalThis.localStorage={
  getItem:key=>storage.has(key)?storage.get(key):null,
  setItem:(key,value)=>storage.set(key,String(value)),
  removeItem:key=>storage.delete(key)
};
const listeners={};
const app={innerHTML:""};
const toast={textContent:"",classList:{add(){},remove(){}}};
globalThis.document={
  querySelector:selector=>selector==="#app"?app:selector==="#toast"?toast:null,
  documentElement:{style:{setProperty(){}}},
  addEventListener:(event,handler)=>{listeners[event]=handler}
};
globalThis.window={scrollY:0,scrollTo(){},open(){}};
globalThis.location={search:"?rede=aurora",href:"https://demo.example/franchise-platform/?rede=aurora"};
globalThis.history={replaceState(){}};
globalThis.confirm=()=>true;
globalThis.FormData=class{
  constructor(form){this.values=form.values||{}}
  get(key){return this.values[key]??null}
};
function click(dataset){
  const button={dataset,matches:()=>false,closest(){return button}};
  assert.equal(typeof listeners.click,"function");
  listeners.click({target:button});
}
function submit(id,values){
  assert.equal(typeof listeners.submit,"function");
  listeners.submit({target:{id,values},preventDefault(){}});
}
const saved=key=>JSON.parse(storage.get("redeos-demo-v1:"+key));
function verify(label,check){
  assert.ok(check,label);
  console.log("PASS:",label);
}
await import("./app.js");
verify("Home fictícia aparece",app.innerHTML.includes("Aurora Cosméticos"));
verify("Foto de proprietários não faz parte da home",!app.innerHTML.includes("hero-photo"));
verify("Marcas demonstrativas diferentes",TENANTS.aurora.name!==TENANTS.viva.name);
click({page:"catalog"});
verify("Catálogo abre",app.innerHTML.includes("Catálogo & pedidos"));
click({qty:"1",id:"a1"});
verify("Item colocado no carrinho",saved("aurora").cart.a1===1);
click({action:"checkout"});
verify("Modal de pedido abre",app.innerHTML.includes("Revisar pedido"));
submit("checkout-form",{coupon:"",pickup:new Date().toISOString().slice(0,10)});
verify("Pedido criado",saved("aurora").orders.length===1);
const orderId=saved("aurora").orders[0].id;
click({action:"toggle-mode"});
click({page:"admin-orders"});
verify("Pedido aparece na franquia",app.innerHTML.includes(orderId));
click({orderAction:"approve",id:orderId});
verify("Aprovação funciona",saved("aurora").orders[0].status==="Aprovado");
click({orderAction:"ready",id:orderId});
verify("Pronto para retirada funciona",saved("aurora").orders[0].status==="Pronto para retirada");
click({action:"toggle-mode"});
click({page:"catalog"});
verify("Revendedor vê retirada",app.innerHTML.includes("Confirmar recebimento"));
click({orderAction:"receive",id:orderId});
verify("Recebimento atualiza estoque",saved("aurora").stock.a1.qty===1);
click({page:"stock"});
click({sell:"a1"});
verify("Formulário de venda abre",app.innerHTML.includes("Registrar venda"));
submit("sell-form",{productId:"a1",qty:"1",price:"89.90"});
verify("Venda baixa estoque",saved("aurora").stock.a1.qty===0);
verify("Financeiro registra venda e lucro",saved("aurora").sales.length===1&&Number.isFinite(saved("aurora").sales[0].profit));
click({action:"toggle-mode"});
click({page:"admin-campaigns"});
submit("campaign-form",{title:"Campanha de Teste",body:"Promoção criada no ambiente demonstrativo.",coupon:"NOVO12",percent:"12"});
verify("Campanha publicada",saved("aurora").campaigns.at(-1).title==="Campanha de Teste");
click({action:"toggle-mode"});
click({page:"benefits"});
verify("Campanha exibida na área do revendedor",app.innerHTML.includes("Campanha de Teste"));
click({action:"toggle-mode"});
click({page:"admin-brand"});
submit("brand-form",{displayName:"Rede Personalizada",subtitle:"Minha franquia",logoUrl:"",resellerName:"Consultor Exemplo"});
verify("Personalização da marca salva",saved("aurora").brand.displayName==="Rede Personalizada");
click({page:"admin-catalog"});
click({action:"add-product"});
submit("product-form",{productId:"",name:"Produto Novo",category:"Diversos",cost:"12.50",suggested:"32.90",emoji:"📦"});
verify("Catálogo é editável por franquia",saved("aurora").catalog.some(p=>p.name==="Produto Novo"));
listeners.change({target:{id:"tenant-select",value:"viva"}});
verify("Troca de franquia",app.innerHTML.includes("Viva Pet"));
verify("Separação por tenant no armazenamento",!loadTenantState("viva").orders.length&&loadTenantState("aurora").orders.length===1);
click({action:"reset-tenant"});
verify("Reset da demo isolado",!saved("viva")&&loadTenantState("aurora").orders.length===1);
console.log("RESULTADO: smoke test de fluxos e isolamento da demo concluído.");
