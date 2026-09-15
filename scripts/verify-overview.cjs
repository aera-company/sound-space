const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const results=[]; const base=process.env.SITE_URL||'http://127.0.0.1:4322';
 for(const [name,engine,mobile] of [['chromium-desktop',chromium,false],['webkit-mobile',webkit,true]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1100},isMobile:mobile,hasTouch:mobile});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base,{waitUntil:'networkidle'});
   await page.locator('.overview-stage').scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('#overview-video').currentTime>.15);
   assert.deepEqual(await page.locator('#overview-video').evaluate(v=>[v.videoWidth,v.videoHeight,v.duration,v.muted,v.loop]),[1920,1680,8,true,false]);
   await page.locator('#overview-toggle').click();
   assert.equal(await page.locator('#overview-video').evaluate(v=>v.paused),true);
   await page.locator('#overview-toggle').click();
   await page.waitForFunction(()=>!document.querySelector('#overview-video').paused);
   await page.locator('#overview-video').evaluate(v=>v.currentTime=7.7);
   await page.waitForFunction(()=>document.querySelector('#overview-video').ended);
   assert.equal(await page.locator('.overview-stage').evaluate(el=>el.classList.contains('is-running')),false);
   assert.equal(await page.locator('#overview-toggle span').textContent(),'Replay overview');
   await page.locator('#overview-toggle').click();
   await page.waitForFunction(()=>{const v=document.querySelector('#overview-video');return !v.paused&&v.currentTime<2});
   await page.evaluate(()=>scrollTo(0,0));
   await page.waitForFunction(()=>document.querySelector('#overview-video').paused);
   await page.locator('.overview-stage').scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>!document.querySelector('#overview-video').paused);
   await page.keyboard.press('Tab');
   await page.locator('#overview-toggle').focus();
   assert.equal(await page.locator('#overview-video').evaluate(v=>v.paused),true);
   await page.locator('.overview-data summary').click();
   assert.deepEqual(await page.locator('.overview-data tbody tr td:last-child').allTextContents(),['25','37','30','36']);
   await page.locator('.experiment-overview').screenshot({path:`/tmp/bruna-overview-${name}.png`});
   for(const width of [320,390,768,1440,1920]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);
   }
   await page.setViewportSize({width:390,height:844});
   await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
   await page.locator('.overview-stage').scrollIntoViewIfNeeded();await page.waitForTimeout(250);
   assert.equal(await page.locator('#overview-video').evaluate(v=>v.paused&&!v.getAttribute('src')),true);
   await page.locator('#overview-toggle').click();await page.waitForFunction(()=>document.querySelector('#overview-video').currentTime>.1);
   await page.locator('[data-condition="B"]').click();
   await page.waitForFunction(()=>document.querySelector('#audio-68').currentTime>30.2&&!document.querySelector('#audio-68').paused);
   assert.equal(await page.locator('[data-condition="B"] .sample-icon svg').count(),2);
   assert.ok(Number(await page.locator('[data-condition="B"]').evaluate(el=>el.style.getPropertyValue('--sample-progress')))>0);
   await page.locator('#sample-stop').click();
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.condition),'B');
   assert.equal(await page.locator('[data-condition="B"]').evaluate(el=>el.style.getPropertyValue('--sample-progress')),'');
   assert.deepEqual(errors,[]);
   results.push({browser:name,base,renderedVideo:true,pauseReplay:true,offscreenPause:true,keyboardPause:true,vectorPoster:true,accessibleData:true,reducedMotion:true,photoProgress:true,focusReturn:true,responsive:true,errors});
   console.log(name+' overview passed');
  }finally{await browser.close();}
 }
 fs.writeFileSync('docs/overview-results.json',JSON.stringify(results,null,2)+'\n');
})().catch(e=>{console.error(e);process.exit(1)});
