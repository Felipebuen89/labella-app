const { chromium } = require('playwright');
const { resolve } = require('path');
const { mkdirSync } = require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const screenshots=resolve('mc-browser-qa');mkdirSync(screenshots,{recursive:true});
 for(const width of [390,320]){
  const context=await browser.newContext({viewport:{width,height:740},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  let errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+resolve('marcia-app.html'),{waitUntil:'domcontentloaded'});
  await page.locator('button[data-action="page"][data-id="services"]').last().click();
  await page.locator('button[data-action="detail"][data-id="crio"]').click();
  if(await page.locator('#portal .overlay').count())throw new Error('Procedure details still modal');
  if(!(await page.locator('#mc-treatment-page').count()))throw new Error('Procedure page missing');
  await page.screenshot({path:`${screenshots}/details-${width}.png`,fullPage:true});
  await page.locator('button[data-action="showBenefits"]').click();
  if(!(await page.getByText('Acúmulo localizado nos flancos').count()))throw new Error('Benefits absent');
  if(await page.locator('#portal .overlay').count())throw new Error('Benefits are still a modal');
  const before=await page.evaluate(()=>scrollY);
  await page.evaluate(()=>window.scrollTo(0,1500));
  await page.waitForTimeout(200);
  const after=await page.evaluate(()=>scrollY);
  if(after<before+80)throw new Error(`Touch page not scrollable at ${width}: ${before} -> ${after}`);
  await page.screenshot({path:`${screenshots}/benefits-scrolled-${width}.png`,fullPage:false});
  await page.locator('button[data-action="treatmentBack"]').first().click();
  if(!(await page.getByRole('button',{name:/Conhecer os benefícios/}).count()))throw new Error('Back to details did not work');
  await page.locator('button[data-action="treatmentExit"]').first().click();
  if(await page.locator('#mc-treatment-page').count())throw new Error('Exit did not work');
  if(!(await page.getByText('Seu cuidado, no seu ritmo.').count()))throw new Error('Treatment list did not reappear');
  if(errors.length)throw new Error('Browser errors: '+errors.join('; '));
  console.log(`PASS ${width}px: details, benefits, real scroll, back, exit, no overlay or JS error`);
  await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
