import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,"..");
const source=resolve(root,"../marcia-app.html");
let app=await readFile(source,"utf8");
if(!app.toLowerCase().includes("<!doctype html>"))throw Error("marcia-app.html não encontrado ou inválido.");
const absolute="https://felipebuen89.github.io/labella-app/";
app=app.replaceAll('href="marcia-site.html"','href="'+absolute+'marcia-site.html"')
       .replaceAll('href="marcia-privacidade-demo.html"','href="'+absolute+'marcia-privacidade-demo.html"');
await mkdir(resolve(root,"www"),{recursive:true});
await writeFile(resolve(root,"www/index.html"),app,"utf8");
console.log("www/index.html atualizado usando a versão atual de marcia-app.html");
console.log("Atenção: esta é uma prévia, não publicar na Play Store.");
