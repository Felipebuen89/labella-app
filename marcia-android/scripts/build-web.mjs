import {readFile,writeFile,mkdir,copyFile} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,"..");
const source=resolve(root,"../marcia-app.html");
let app=await readFile(source,"utf8");
if(!app.toLowerCase().includes("<!doctype html>"))throw Error("marcia-app.html não encontrado ou inválido.");
if(!app.includes("MOVE_NATIVE_CLIENT"))throw Error("Guarda nativa não implementada no marcia-app.html.");

const publicRoot="https://felipebuen89.github.io/labella-app/";
app=app.replaceAll('href="marcia-site.html"','href="'+publicRoot+'marcia-site.html"')
       .replaceAll('href="marcia-privacidade-demo.html"','href="'+publicRoot+'marcia-privacidade-demo.html"');

// O app entregue a clientes NÃO exibe o painel interno e ocupa a tela inteira.
const nativeCSS='<style id="mc-android-shell">html,body{margin:0!important;background:#fbf8f5!important}'+
  '.shell{display:block!important;max-width:none!important;margin:0!important;box-shadow:none!important}'+
  '.phone{max-width:none!important;width:100%!important;min-height:100dvh!important;border-radius:0!important;box-shadow:none!important}'+
  '.side,.owner-layout{display:none!important}'+
  '.dock{position:fixed!important;left:0!important;right:0!important;bottom:0!important;max-width:none!important}'+
  '</style>';
app=app.replace("</head>",nativeCSS+"</head>");
app=app.replace("<script>",'<script>window.MOVE_NATIVE_CLIENT=true;</script><script>');
if(!app.includes('window.MOVE_NATIVE_CLIENT=true;'))throw Error("Falha ao ativar modo cliente.");

await mkdir(resolve(root,"www"),{recursive:true});
await writeFile(resolve(root,"www/index.html"),app,"utf8");
for(const asset of ["marcia-flores.svg","marcia-app-icon.svg","marcia-manifest.webmanifest","marcia-sw.js"]){
  await copyFile(resolve(root,"..",asset),resolve(root,"www",asset));
}
console.log("Florais da identidade MC incluídos no pacote Android para funcionar offline.");
console.log("www/index.html criado em modo cliente Android, a partir de marcia-app.html.");
console.log("Sem login/back-end: build somente para demonstração e teste interno.");
