const {chromium}=require('playwright');
const {resolve}=require('path');
const {mkdirSync}=require('fs');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
const out=resolve('mc-final-qa');mkdirSync(out,{recursive:true});
function assert(ok,message){if(!ok)throw Error(message)}
for(const width of [390,320]){
 const context=await browser.newContext({viewport:{width,height:780},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+resolve('marcia-cliente.html'),{waitUntil:'load'});
 assert(await page.locator('.mc-quick button').count()===4,'Four client shortcuts missing');
 await page.locator('.dock button[data-id="agenda"]').click();
 assert(await page.locator('.mc-voucher-trigger.has-coupons').count()===1,'Coupon discount CTA missing');
 const color=await page.locator('.mc-voucher-trigger.has-coupons .mc-voucher-copy strong').evaluate(el=>getComputedStyle(el).color);
 assert(color==='rgb(255, 250, 244)','Coupon text not white: '+color);
 await page.locator('.mc-voucher-trigger.has-coupons').click();
 assert(await page.locator('.mc-coupon-option').count()>=2,'Expanded coupon choices absent');
 await page.screenshot({path:out+'/cupom-legivel-'+width+'.png',fullPage:false});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert(overflow<5,'Client horizontal overflow: '+overflow+'px at '+width);
 await page.goto('file://'+resolve('marcia-proprietaria.html'),{waitUntil:'load'});
 assert(await page.locator('.owner-tabs button').count()===8,'Owner navigation missing');
 await page.locator('button[data-action="ownerPage"][data-id="coupons"]').first().click();
 assert(await page.locator('#couponTitle').count()===1,'Owner coupon form missing');
 await page.screenshot({path:out+'/painel-cupons-'+width+'.png',fullPage:false});
 const ownerOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert(ownerOverflow<6,'Owner horizontal overflow: '+ownerOverflow+'px at '+width);
 await page.goto('file://'+resolve('marcia-site.html'),{waitUntil:'load'});
 assert(await page.locator('.site-app-bridge').count()===1,'Premium site coupons/campaign section missing');
 await page.locator('button[data-filter="Facial"]').click();
 assert(await page.locator('#serviceGrid article').count()===1,'Site filter failed');
 await page.locator('button[data-view="ultra"]').click();
 assert(await page.locator('#modal').evaluate(el=>el.classList.contains('active')),'Site benefit modal missing');
 assert((await page.locator('#modalBenefits').innerText()).includes('colágeno'),'Site benefits lack details');
 assert((await page.locator('#modalAppLink').getAttribute('href')).includes('service=ultra'),'Site-to-app service deep link broken');
 await page.locator('#closeModal').click();
 await page.screenshot({path:out+'/site-premium-'+width+'.png',fullPage:false});
 const siteOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert(siteOverflow<6,'Site horizontal overflow: '+siteOverflow+'px at '+width);
 assert(errors.length===0,'Browser JavaScript errors: '+errors.join('; '));
 console.log('PASS '+width+'px: coupon contrast, owner controls, website benefits, deep links, no horizontal overflow');
 await context.close();
}
await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});