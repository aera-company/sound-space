const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const results=[];
 for(const [name,engine,mobile] of [['chromium-desktop',chromium,false],['webkit-mobile',webkit,true]]){
  console.log('Testing '+name);const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1100},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
   const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
   await page.goto('http://127.0.0.1:4322/',{waitUntil:'networkidle'});
   assert.equal(requests.some(r=>r.endsWith('.mp3')),false);
   assert.equal(await page.locator('.cover-image img').evaluate(i=>i.complete&&i.naturalWidth>0),true);
   assert.equal(await page.locator('#tab-frequencies').getAttribute('aria-selected'),'true');
   assert.equal(await page.locator('.experiment-card').count(),4);
   assert.equal(await page.locator('.place-photos').count(),0);
   const response=await page.request.get('http://127.0.0.1:4322/audio/68-x3.mp3',{headers:{Range:'bytes=0-511'}});
   assert.equal(response.status(),206);assert.equal((await response.body()).length,512);
   await page.locator('#master-play').click();
   await page.waitForFunction(()=>document.querySelector('#audio-68').currentTime>.3);
   assert.ok(Math.abs(await page.locator('#audio-68').evaluate(a=>a.duration)-764.76)<.5);
   await page.waitForFunction(()=>document.querySelector('#live-spectrum').dataset.state==='live');
   const a=await page.locator('#live-spectrum').evaluate(c=>c.toDataURL());await page.waitForTimeout(200);assert.notEqual(await page.locator('#live-spectrum').evaluate(c=>c.toDataURL()),a);
   await page.locator('[data-select="118"]').click();await page.waitForFunction(()=>document.querySelector('#audio-118').currentTime>.3);
   assert.equal(await page.locator('#audio-68').evaluate(a=>a.paused),true);
   assert.ok(Math.abs(await page.locator('#audio-118').evaluate(a=>a.duration)-862.44)<.5);
   await page.locator('#master-play').click();await page.waitForFunction(()=>document.querySelector('#audio-118').paused);
   await page.locator('#master-seek').evaluate(el=>{el.value='120';el.dispatchEvent(new Event('input',{bubbles:true}))});
   await page.getByRole('tab',{name:'Waveform',exact:true}).click();assert.match(await page.locator('[data-chart-cursor="118"] text').textContent(),/2:00/);
   await page.getByRole('tab',{name:'Spectrogram',exact:true}).click();assert.match(await page.locator('[data-spectro-cursor="118"]').textContent(),/2:00/);
   const plot=await page.locator('[data-spectro-plot="118"]').boundingBox();await page.mouse.click(plot.x+plot.width*.5,plot.y+40);
   await page.waitForFunction(()=>Math.abs(document.querySelector('#audio-118').currentTime-431.22)<1);
   await page.getByRole('tab',{name:'Loudness',exact:true}).click();assert.match(await page.locator('[data-chart-cursor="118"] text').textContent(),/7:11/);
   await page.locator('[data-select="compare"]').click();await page.getByRole('tab',{name:'Frequencies',exact:true}).click();await page.locator('[data-spectrum-mode="average"]').click();assert.equal(await page.locator('.plot-line').count(),2);
   for(const id of ['B','D','A','C']){
    await page.locator(`[data-condition="${id}"]`).click();
    await page.waitForFunction(id=>{const c=document.querySelector(`[data-condition="${id}"]`),a=document.querySelector('#audio-'+c.dataset.combination);return c.classList.contains('is-previewing')&&!a.paused&&a.currentTime>=30&&a.currentTime<33},id);
    assert.equal(await page.locator('.is-previewing').count(),1);
    assert.equal(await page.locator('audio').evaluateAll(nodes=>nodes.filter(n=>!n.paused).length),1);
   }
   await page.locator('#audio-118').evaluate(a=>a.currentTime=59.9);await page.waitForFunction(()=>document.querySelector('#audio-118').paused);
   assert.equal(await page.locator('.is-previewing').count(),0);assert.match(await page.locator('#matrix-status').textContent(),/complete/);
   await page.locator('[data-condition="B"]').click();await page.waitForFunction(()=>!document.querySelector('#audio-68').paused);await page.locator('#sample-stop').click();await page.waitForFunction(()=>document.querySelector('#audio-68').paused);
   if(!mobile){await page.locator('#experiment').screenshot({path:'/tmp/bruna-experiments-desktop.png'});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/bruna-hero-desktop.png'});}
   await page.locator('#lighting-video').scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>!document.querySelector('#lighting-video').paused&&document.querySelector('#lighting-video').currentTime>.2);
   assert.equal(await page.locator('#lighting-video').evaluate(v=>v.muted&&v.playsInline),true);
   await page.locator('#lighting-video').evaluate(v=>v.pause());
   for(const [time,label] of [[10.5,'Warm light'],[14,'Cool light'],[2,'Neutral light'],[51.5,'Neutral light']]){
    await page.locator('#lighting-video').evaluate((v,t)=>v.currentTime=t,time);await page.waitForFunction(label=>document.querySelector('#video-light-label').textContent===label,label);
   }
   if(!mobile)await page.locator('.place').screenshot({path:'/tmp/bruna-film-desktop.png'});
   for(const width of [320,390,768,1440,1920]){await page.setViewportSize({width,height:900});await page.waitForTimeout(160);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);}
   await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('#lighting-video').scrollIntoViewIfNeeded();await page.waitForTimeout(300);assert.equal(await page.locator('#lighting-video').evaluate(v=>v.paused),true);
   await page.locator('[data-condition="B"]').click();await page.waitForFunction(()=>!document.querySelector('#audio-68').paused&&document.querySelector('#audio-68').currentTime>=30);assert.equal(await page.locator('[data-condition="B"]').getAttribute('aria-pressed'),'true');
   await page.locator('#sample-stop').click();
   if(mobile){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/bruna-hero-mobile.png'});await page.locator('[data-condition="B"]').screenshot({path:'/tmp/bruna-condition-mobile.png'});}
   assert.deepEqual(errors,[]);results.push({browser:name,newAudioPlayback:true,httpRange:true,liveFFT:true,recalculatedTimelines:true,comparison:true,fourPhotoExcerpts:true,sameTempoSwitch:true,excerptStopsAfter30Seconds:true,videoMutedInline:true,videoCueLabels:true,reducedMotion:true,freshPhotoTapPlayback:true,responsive:true,errors});console.log(name+' passed');
  }finally{await browser.close();}
 }
 fs.writeFileSync('docs/media-results.json',JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
