import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
import * as DATA from "../data.js";

function harness() {
 const storage=new Map(), localStorage={
  getItem:k=>storage.get(k)??null,
  setItem:(k,v)=>storage.set(k,v),
  removeItem:k=>storage.delete(k)
 };
 let appHTML="";
 const appNode={set innerHTML(v){appHTML=v},get innerHTML(){return appHTML}};
 const toastNode={textContent:"",classList:{add(){},remove(){}}};
 const document={
  documentElement:{style:{setProperty(){}}},
  querySelector:s=>s==="#app"?appNode:s==="#toast"?toastNode:null,
  addEventListener(){}
 };
 const window={scrollY:0,scrollTo(){},open(){return null}};
 const location={search:"",href:"https://demo.test/"},history={replaceState(){}};
 const dir=dirname(fileURLToPath(import.meta.url));
 const source=readFileSync(resolve(dir,"../app.js"),"utf8")
   .replace(/^import \{TENANTS.*?;\s*/,"");
 const script=new Function("DATA","window","document","localStorage","location","history","confirm","setTimeout","clearTimeout","URL","URLSearchParams",
  "const {TENANTS,BRAND_DEFAULTS,loadTenantState,saveTenantState}=DATA;\n"+source+
  "\nreturn {getState:()=>state,tenantId:()=>tenantId,render,catalogView,financeView,createOrder,updateOrder,sell,switchTenant};");
 const app=script(DATA,window,document,localStorage,location,history,()=>true,()=>1,()=>{},URL,URLSearchParams);
 return {app,html:()=>appHTML,storage};
}
test("renderiza uma identidade neutra sem fotos ou marca anterior",()=>{
 const {app,html}=harness();
 assert.ok(html().includes("Mais crescimento"));
 assert.ok(!html().includes("Moments Paris"));
 assert.ok(!html().includes("Fotografia fornecida"));
 assert.ok(app.catalogView().includes("Sérum Facial Premium"));
});
test("ciclo de pedido -> aprovação -> recebimento -> venda funciona",()=>{
 const {app}=harness(),state=app.getState();
 state.cart.a1=2;state.cart.a2=1;
 app.createOrder({get:k=>k==="pickup"?"2026-11-03":""});
 assert.equal(state.orders.length,1);
 assert.equal(state.orders[0].status,"Pendente");
 const id=state.orders[0].id;
 app.updateOrder(id,"Aprovado");
 app.updateOrder(id,"Pronto para retirada");
 assert.equal(state.stock.a1,undefined);
 app.updateOrder(id,"Recebido");
 assert.equal(state.stock.a1.qty,2);
 app.sell({get:k=>k==="productId"?"a1":k==="qty"?"1":"89.90"});
 assert.equal(state.stock.a1.qty,1);
 assert.equal(state.sales.length,1);
 assert.ok(state.sales[0].profit>0);
 assert.ok(app.financeView().includes("Faturamento"));
});
test("navegação entre redes não mistura dados locais",()=>{
 const {app}=harness();
 app.getState().cart.a1=1;
 app.createOrder({get:()=>""});
 app.switchTenant("viva");
 assert.equal(app.tenantId(),"viva");
 assert.equal(app.getState().orders.length,0);
 app.switchTenant("aurora");
 assert.equal(app.getState().orders.length,1);
});
test("a aprovação não permite transições inválidas nem estoque duplicado",()=>{
 const {app}=harness();const state=app.getState();
 state.cart.a1=1;app.createOrder({get:()=>""});
 const order=state.orders[0];
 app.updateOrder(order.id,"Recebido");
 assert.equal(order.status,"Pendente");
 app.updateOrder(order.id,"Aprovado");
 app.updateOrder(order.id,"Pronto para retirada");
 app.updateOrder(order.id,"Recebido");
 app.updateOrder(order.id,"Recebido");
 assert.equal(state.stock.a1.qty,1);
});
