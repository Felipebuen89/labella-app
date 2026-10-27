import {readFile,access} from "node:fs/promises";
import {resolve} from "node:path";
let failed=0;
async function checkFile(p,description){try{await access(resolve(p));console.log("OK",description)}catch{console.error("PENDENTE",description);failed++}}
await checkFile("www/index.html","Build web empacotado");
await checkFile("android/app/build.gradle","Projeto Android inicializado");
try{
const vars=await readFile("android/variables.gradle","utf8");
const m=vars.match(/targetSdkVersion\s*=\s*(\d+)/);
if(!m){console.error("Verifique manualmente o targetSdkVersion do Android");failed++}
else if(Number(m[1])<36){console.error("Atualize targetSdkVersion para API 36 ou superior");failed++}
else console.log("OK Android target API",m[1]);
}catch{console.error("Ainda falta gerar projeto Android com npx cap add android");failed++}
console.log(failed?"Pré-requisitos técnicos pendentes: "+failed:"Checagem de base Android concluída. Ainda requer testes, autorização, assinatura e Play Console.");
if(failed)process.exitCode=1;
