(function momentsPdfModule(){
'use strict';
let ready=null,creating=false,objectURL=null;
const GOLD=[227,200,139], GOLD2=[185,147,85], BG=[5,5,5], PANEL=[18,17,15],WHITE=[247,240,224], MUTED=[182,170,152];
const brl=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const clean=s=>String(s==null?"":s).trim();
const esc=s=>clean(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function info(msg){const e=document.getElementById("pdf-order-status");if(e)e.textContent=msg}
function safeFileName(){return "Pedido_Moments_Paris_"+new Date().toISOString().slice(0,10)+".pdf"}
function newOrderId(){const d=new Date();return "MP"+d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0")+"-"+String(d.getTime()).slice(-6)}
function imageLink(url){
 try{const u=new URL(url,location.href);if(u.hostname==="catalogoson.com.br"&&u.pathname.startsWith("/catalogo/"))return "/api/produto-imagem?url="+encodeURIComponent(u.href);return u.href}catch(e){return ""}
}
async function imageAsData(url,size,background){
 if(!url)return null;
 let blob;
 try{
  const response=await fetch(imageLink(url),{credentials:"omit",signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error("Sem acesso à imagem");
  blob=await response.blob();
  if(blob.size>3000000)throw Error("Imagem muito grande");
 }catch(e){return null}
 const object=URL.createObjectURL(blob);
 try{
  const img=new Image();img.src=object;
  await new Promise((resolve,reject)=>{if(img.complete&&img.naturalWidth>0){resolve();return}img.onload=resolve;img.onerror=reject});
  const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
  canvas.width=size;canvas.height=size;
  ctx.fillStyle=background||"#f7f3e9";ctx.fillRect(0,0,size,size);
  const scale=Math.min((size-14)/img.naturalWidth,(size-14)/img.naturalHeight);
  const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
  ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
  return canvas.toDataURL("image/jpeg",.87);
 }catch(e){return null}
 finally{URL.revokeObjectURL(object)}
}
async function loadProductImages(items,onProgress){
 const pictureMap={};let next=0;
 async function worker(){
  while(next<items.length){
   const i=next++;const p=items[i];
   pictureMap[p.id]=await imageAsData(p.image,350,"#f9f7f2");
   if(onProgress)onProgress(i+1,items.length);
  }
 }
 await Promise.all(Array.from({length:Math.min(4,items.length)},()=>worker()));
 return pictureMap
}
function text(doc,t,x,y,opt){
 doc.text(String(t),x,y,opt||{});
}
function put(doc,t,x,y,max,opts){
 const lines=doc.splitTextToSize(String(t),max).slice(0,(opts&&opts.lines)||2);
 doc.text(lines,x,y);
 return lines.length;
}
function buildPdf(JsPDF,order,pictures,logo){
 const doc=new JsPDF({unit:"mm",format:"a4",orientation:"portrait",compress:true,putOnlyUsedFonts:true});
 doc.setProperties({title:"Pedido Moments Paris "+order.code,subject:"Pedido de fragrâncias Moments Paris",author:"Moments Paris - Catálogo para clientes",creator:"Moments Paris"});
 const rgb=(fn,arr)=>fn.apply(doc,arr);
 const fill=c=>rgb(doc.setFillColor,c), stroke=c=>rgb(doc.setDrawColor,c),ink=c=>rgb(doc.setTextColor,c);
 function shell(isFirst){
  fill(BG);doc.rect(0,0,210,297,"F");
  stroke(GOLD2);doc.setLineWidth(.35);doc.roundedRect(9,8,192,280,4,4,"S");
  if(logo){try{doc.addImage(logo,"JPEG",92,11,26,22,undefined,"FAST")}catch(e){}}
  ink(GOLD);doc.setFont("times","bold");doc.setFontSize(23);text(doc,"MOMENTS PARIS",105,41,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(8.4);ink(WHITE);text(doc,"PEDIDO PERSONALIZADO",105,48,{align:"center"});
  stroke(GOLD2);doc.line(16,53,194,53);
  if(isFirst){
   fill(PANEL);stroke([65,53,37]);doc.roundedRect(16,59,178,33,3,3,"FD");
   doc.setFont("helvetica","bold");doc.setFontSize(8);ink(GOLD);text(doc,"CLIENTE",21,66);
   doc.setFont("helvetica","normal");doc.setFontSize(10);ink(WHITE);put(doc,order.name,21,73,105,{lines:1});
   doc.setFontSize(8);ink(MUTED);text(doc,"Telefone: "+order.phone,21,81);
   text(doc,"Cidade: "+order.city.slice(0,28),112,81);
   text(doc,"Emissão: "+order.date,21,88);text(doc,"Nº "+order.code,188,88,{align:"right"});
   doc.setFont("helvetica","bold");doc.setFontSize(10);ink(GOLD);text(doc,"SELEÇÃO DE PRODUTOS",18,102);
   return 107;
  }
  ink(GOLD);doc.setFont("helvetica","bold");doc.setFontSize(10);text(doc,"PRODUTOS (CONTINUAÇÃO)",18,65);
  return 71;
 }
 let y=shell(true);
 for(const line of order.items){
  if(y+34>272){doc.addPage();y=shell(false)}
  fill(PANEL);stroke([74,61,44]);doc.setLineWidth(.25);doc.roundedRect(16,y,178,31,2.3,2.3,"FD");
  fill([248,246,241]);doc.roundedRect(19,y+3,28,25,1.6,1.6,"F");
  const pic=pictures[line.id];
  if(pic){try{doc.addImage(pic,"JPEG",20,y+4,26,23,undefined,"FAST")}catch(e){}}
  else{
   doc.setFont("times","bold");doc.setFontSize(15);ink(GOLD2);text(doc,"MP",33,y+17,{align:"center"});
   doc.setFont("helvetica","normal");doc.setFontSize(5.3);ink([75,61,43]);text(doc,"MOMENTS",33,y+21,{align:"center"})
  }
  ink(WHITE);doc.setFont("helvetica","bold");doc.setFontSize(10);put(doc,line.name,52,y+9,112,{lines:2});
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);ink(MUTED);text(doc,line.qty+" un. x "+brl(line.price),52,y+24);
  ink(GOLD);doc.setFont("helvetica","bold");doc.setFontSize(10);text(doc,brl(line.qty*line.price),188,y+24,{align:"right"});
  y+=35;
 }
 if(y+47>274){doc.addPage();y=shell(false)}
 fill([32,25,17]);stroke(GOLD2);doc.roundedRect(16,y+1,178,40,3,3,"FD");
 doc.setFont("helvetica","normal");doc.setFontSize(9);ink(MUTED);text(doc,"Subtotal",22,y+10);ink(WHITE);text(doc,brl(order.pricing.subtotal),187,y+10,{align:"right"});
 ink(MUTED);text(doc,order.pricing.percent?"Campanha "+order.pricing.percent+"%":"Desconto",22,y+19);
 ink(WHITE);text(doc,order.pricing.percent?"- "+brl(order.pricing.discount):brl(0),187,y+19,{align:"right"});
 stroke(GOLD2);doc.line(22,y+23,188,y+23);
 ink(GOLD);doc.setFont("helvetica","bold");doc.setFontSize(12);text(doc,"TOTAL DO PEDIDO",22,y+33);text(doc,brl(order.pricing.total),187,y+33,{align:"right"});
 const numPages=doc.internal.getNumberOfPages();
 for(let i=1;i<=numPages;i++){
  doc.setPage(i);doc.setFont("helvetica","normal");doc.setFontSize(7.5);ink(MUTED);
  text(doc,"Pedido sujeito à confirmação de estoque, entrega e pagamento.",105,280,{align:"center"});
  text(doc,"Moments Paris  •  "+order.code,18,285);text(doc,String(i)+" / "+numPages,191,285,{align:"right"});
 }
 return doc.output("blob")
}
function shareSupported(file){return !!(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]})))}
function doDownload(file){
 const url=URL.createObjectURL(file);
 const a=document.createElement("a");a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function openWhatsAppText(order){
 const msg="Olá! Preparei meu pedido Moments Paris ("+order.code+").\nNome: "+order.name+"\nTotal: "+brl(order.pricing.total)+"\nVou anexar o PDF do pedido para confirmar disponibilidade, entrega e pagamento.";
 window.open("https://api.whatsapp.com/send?text="+encodeURIComponent(msg),"_blank","noopener,noreferrer");
}
async function shareReady(){
 if(!ready)return;
 const {file,order}=ready;
 if(!shareSupported(file)){info("Este navegador não permite compartilhar PDF diretamente. Baixe o arquivo e anexe no WhatsApp.");return}
 try{
  await navigator.share({files:[file],title:"Pedido Moments Paris",text:"Olá! Segue meu pedido Moments Paris "+order.code+". Por favor, confirme a disponibilidade, entrega e pagamento."});
  info("Compartilhamento aberto. Confirme o envio do arquivo para o contato desejado.");
 }catch(err){
  if(err&&err.name==="AbortError"){info("Compartilhamento cancelado. Seu PDF continua disponível.");return}
  info("Não foi possível compartilhar diretamente. Baixe o PDF e anexe pelo WhatsApp.");
 }
}
function resultHTML(order){
 return '<div class="pdf-checkout"><div class="pdf-ready-icon">✦</div><h3>Seu pedido premium está pronto!</h3><p>O PDF foi criado com o logo Moments Paris, fotos dos produtos disponíveis, seus dados, quantidades e valor final.</p><div class="pdf-mini-summary"><span>Pedido '+esc(order.code)+'</span><strong>'+esc(brl(order.pricing.total))+'</strong></div>'+
 '<button type="button" class="btn full" data-pdf-share>Compartilhar PDF pelo WhatsApp</button><p id="pdf-order-status" class="pdf-order-status" role="status" aria-live="polite"></p>'+
 '<button type="button" class="btn ghost full" data-pdf-download style="margin-top:9px">Baixar PDF do pedido</button>'+
 '<p class="small" style="margin-top:14px">Ao compartilhar, selecione o WhatsApp e o contato desejado. O arquivo não é enviado sem sua confirmação.</p>'+
 '<button type="button" class="textlink" data-pdf-whatsapp style="margin-top:12px">Abrir WhatsApp para envio manual</button>'+
 '<p class="small">Se usar a opção manual, baixe o PDF e anexe ao conversar com o vendedor.</p></div>';
}
window.momentsPremiumPdfCheckout=async function(ctx){
 if(creating)return;
 if(!window.jspdf||!window.jspdf.jsPDF){ctx.toast("Aguarde o carregamento do gerador de PDF e tente novamente.");return}
 const form=ctx.form,fd=new FormData(form),name=clean(fd.get("name")).replace(/\s+/g," "),phone=clean(fd.get("phone")).replace(/\D/g,""),city=clean(fd.get("city")).replace(/\s+/g," ");
 if(name.length<2||city.length<2||!/^\d{10,13}$/.test(phone)){ctx.toast("Confira nome, telefone com DDD e cidade.");return}
 const lines=Object.entries(ctx.cart).filter(([id,n])=>ctx.byId[id]&&Number(n)>0).map(([id,n])=>({id,name:ctx.byId[id].name,price:Number(ctx.byId[id].price)||0,image:ctx.byId[id].image,qty:Math.min(99,Math.floor(Number(n)||0))}));
 if(!lines.length){ctx.toast("Adicione produtos ao pedido primeiro.");return}
 creating=true;
 const btn=form.querySelector('[type="submit"]');if(btn){btn.disabled=true;btn.textContent="Preparando seu PDF com as fotos..."}
 const code=newOrderId(),date=new Date().toLocaleString("pt-BR");
 const order={code,date,name,phone,city,items:lines,pricing:ctx.pricing};
 try{
  const imageCount=lines.length;
  const pictures=await loadProductImages(lines,(n,total)=>{if(btn)btn.textContent="Preparando fotos do pedido... "+n+"/"+total});
  const logo=await imageAsData("./moments-logo.svg",380,"#000000");
  const blob=buildPdf(window.jspdf.jsPDF,order,pictures,logo);
  const file=new File([blob],safeFileName(),{type:"application/pdf"});
  ready={file,order};
  try{localStorage.setItem("moments_client_customer_v1",JSON.stringify({name,phone,city}))}catch(e){}
  ctx.saveCustomer({name,phone,city});
  const summary="Pedido Moments Paris "+code+" • "+brl(ctx.pricing.total);
  ctx.saveLastMessage(summary);
  let drafts=[];try{drafts=JSON.parse(localStorage.getItem("moments_client_drafts_v1"))||[];if(!Array.isArray(drafts))drafts=[]}catch(e){}
  drafts.unshift({code,date:new Date().toISOString(),items:lines.map(x=>({id:x.id,qty:x.qty,unitPrice:x.price})),subtotal:ctx.pricing.subtotal,discount:ctx.pricing.discount,discountPercent:ctx.pricing.percent,total:ctx.pricing.total,status:"pdf_gerado_aguardando_envio"});
  try{localStorage.setItem("moments_client_drafts_v1",JSON.stringify(drafts.slice(0,15)))}catch(e){}
  ctx.showResult(resultHTML(order));
 }catch(err){console.error("Erro ao montar PDF:",err);ctx.toast("Não foi possível gerar o PDF. Tente novamente.");if(btn){btn.disabled=false;btn.textContent="Gerar PDF premium e compartilhar"}}
 finally{creating=false}
};
document.addEventListener("click",event=>{
 const btn=event.target.closest("button");if(!btn)return;
 if(btn.hasAttribute("data-pdf-share")){shareReady();return}
 if(btn.hasAttribute("data-pdf-download")){if(ready)doDownload(ready.file);return}
 if(btn.hasAttribute("data-pdf-whatsapp")){if(ready){doDownload(ready.file);openWhatsAppText(ready.order);info("O PDF foi baixado. Anexe-o na conversa do WhatsApp.");}return}
});
const css=document.createElement("style");css.textContent=".pdf-checkout{text-align:center;padding:19px 0 15px}.pdf-checkout h3{font:600 29px 'Cormorant Garamond',Georgia,serif;color:#f1d39b;margin:7px 0}.pdf-checkout p{color:#c7bbae;line-height:1.6;font-size:13px}.pdf-ready-icon{font-size:38px;color:#e3c88b}.pdf-mini-summary{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:15px;margin:20px 0 17px;background:#18150f;border:1px solid #6c542d;border-radius:11px;color:#ddc69a}.pdf-mini-summary strong{color:#f9e4b2;font-size:20px}.pdf-checkout .small{font-size:11px;color:#b8afa2}";
css.textContent+='.pdf-order-status{min-height:20px;color:#e3c88b!important;font-size:12px!important;margin:10px 0 0!important}';document.head.appendChild(css);
})();
