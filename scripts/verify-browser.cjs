// Historical UI regression suite. For the current player, run verify-unified.cjs.
// Run with NODE_PATH pointing to a runtime containing playwright.
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async()=>{
 const reports=[];
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  console.log('Starting '+name);
  const browser=await engine.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4321',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#chart-cursor'));
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.mp3')).length),0);
  await page.getByRole('button',{name:'Play 68 BPM',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#audio-68').currentTime>0.5);
  await page.getByRole('button',{name:'Play 118 BPM',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#audio-118').currentTime>0.5);
  assert.equal(await page.locator('#audio-68').evaluate(a=>a.paused),true);
  await page.getByRole('button',{name:'Pause 118 BPM',exact:true}).click();
  assert.equal(await page.locator('#audio-118').evaluate(a=>a.paused),true);
  await page.locator('#seek-118').evaluate(el=>{el.value='120';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForFunction(()=>Math.abs(document.querySelector('#audio-118').currentTime-120)<1);
  await page.locator('#volume').evaluate(el=>{el.value='.3';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.locator('#audio-68').evaluate(a=>a.volume),.3);
  await page.getByLabel('Repeat',{exact:true}).check();
  assert.equal(await page.locator('#audio-118').evaluate(a=>a.loop),true);
  await page.getByRole('button',{name:'Compare',exact:true}).click();
  for(const tab of ['Waveform','Spectrogram','Frequencies','Loudness']){
   await page.getByRole('tab',{name:tab,exact:true}).click();
   assert.equal(await page.getByRole('tab',{name:tab,exact:true}).getAttribute('aria-selected'),'true');
   if(tab==='Spectrogram'){
    await page.waitForFunction(()=>[...document.querySelectorAll('#chart img')].every(i=>i.complete&&i.naturalWidth>0));
    assert.equal(await page.locator('#chart img').count(),2);
    if(name==='chromium')await page.locator('#analysis').screenshot({path:'/tmp/bruna-analysis.png'});
   }else assert.equal(await page.locator('#chart svg path').count(),tab==='Frequencies'?4:2);
  }
  await page.getByRole('tab',{name:'Loudness',exact:true}).focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.getByRole('tab',{name:'Frequencies',exact:true}).getAttribute('aria-selected'),'true');
  await page.locator('[data-combination="68"][data-light="cool"]').click();
  assert.equal(await page.locator('body').getAttribute('data-light'),'cool');
  assert.equal(await page.locator('[data-select="68"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#audio-68').evaluate(a=>a.paused),true);
  const layouts=[];
  for(const width of [320,360,390,768,1440,1920]){
   await page.setViewportSize({width,height:900});
   await page.waitForTimeout(180);
   const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);
   assert.ok(scroll<=width,`${name}: overflow at ${width}: ${scroll}`);
   layouts.push(width);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
  await page.locator('summary').filter({hasText:'Research & credits'}).click();
  assert.ok(await page.getByText('Dr Francesco Aletta',{exact:false}).isVisible());
  if(name==='chromium'){
   await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{document.activeElement.blur();scrollTo(0,0);});
   await page.screenshot({path:'/tmp/bruna-mobile-final.png',fullPage:true});
   await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{delete document.body.dataset.light;scrollTo(0,0);});
   await page.getByRole('tab',{name:'Waveform',exact:true}).click();await page.evaluate(()=>{document.activeElement.blur();scrollTo(0,0);});
   await page.screenshot({path:'/tmp/bruna-desktop-final.png'});
  }
  assert.deepEqual(errors,[]);
  reports.push({engine:name,playback:true,exclusivePlayback:true,seek:true,volume:true,repeat:true,charts:4,comparison:true,keyboardTabs:true,lightingMatrix:true,reducedMotion:true,widths:layouts,errors});
  console.log(name+' passed');
  await browser.close();
 }
 fs.writeFileSync('docs/browser-results.json',JSON.stringify(reports,null,2));
 console.log(JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
