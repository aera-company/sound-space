const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const reports=[];
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  console.log('Testing '+name);
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1440,height:1100}});
   await page.addInitScript(()=>{
    const p=AudioContext.prototype,analyser=p.createAnalyser,gain=p.createGain;
    p.createAnalyser=function(){return window.testAnalyser=analyser.call(this)};
    p.createGain=function(){return window.testGain=gain.call(this)};
   });
   const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
   await page.goto('http://127.0.0.1:4322',{waitUntil:'networkidle'});
   assert.match(await page.title(),/BENV0008 25\/26/);
   assert.equal(await page.locator('.master-player').count(),1);
   assert.equal(requests.some(url=>url.endsWith('.mp3')),false,'no audio preload');
   await page.locator('#master-play').click();
   await page.waitForFunction(()=>document.querySelector('#audio-68').currentTime>.5);
   const seek=async(sec)=>{await page.locator('#master-seek').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},sec);await page.waitForFunction(sec=>Math.abs(document.querySelector('#audio-68').currentTime-sec)<1,sec);};
   await seek(120);
   await page.getByRole('tab',{name:'Frequencies',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.state==='live');
   assert.deepEqual(await page.evaluate(()=>[testAnalyser.fftSize,testAnalyser.smoothingTimeConstant]),[4096,.08]);
   const capture=()=>page.locator('canvas').evaluate(c=>c.toDataURL());
   const first=await capture();await page.waitForTimeout(180);assert.notEqual(await capture(),first,'live spectrum changes within 180ms');
   await page.locator('#spectrum-freeze').click();
   const frozen=await capture(),time=await page.locator('#audio-68').evaluate(a=>a.currentTime);
   await page.waitForTimeout(250);assert.equal(await capture(),frozen,'frozen spectrum remains stable');assert.ok(await page.locator('#audio-68').evaluate(a=>a.currentTime)>time,'freeze does not pause audio');
   await page.locator('#spectrum-freeze').click();await page.waitForTimeout(150);assert.notEqual(await capture(),frozen);
   await page.locator('#spectrum-response').selectOption('0.35');assert.equal(await page.evaluate(()=>testAnalyser.smoothingTimeConstant),.35);
   await page.locator('#spectrum-resolution').selectOption('8192');assert.equal(await page.evaluate(()=>testAnalyser.fftSize),8192);
   await page.locator('#spectrum-response').selectOption('0.08');
   await page.locator('#spectrum-peaks').uncheck();await page.locator('#spectrum-peaks').check();await page.locator('#spectrum-reset').click();
   await page.locator('#volume').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}))});
   await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>testGain.gain.value),0);
   assert.equal(await page.locator('#audio-68').evaluate(a=>a.volume),1);
   assert.ok(await page.evaluate(()=>{const a=new Float32Array(testAnalyser.frequencyBinCount);testAnalyser.getFloatFrequencyData(a);return Math.max(...a)>-100}),'spectrum still measures signal at zero playback volume');
   await page.locator('#volume').evaluate(el=>{el.value='.7';el.dispatchEvent(new Event('input',{bubbles:true}))});
   await page.locator('[data-select="118"]').click();
   await page.waitForFunction(()=>document.querySelector('#audio-118').currentTime>.5);
   assert.equal(await page.locator('#audio-68').evaluate(a=>a.paused),true);
   assert.match(await page.locator('#spectrum-state').textContent(),/118 BPM/);
   await page.locator('[data-select="compare"]').click();
   assert.equal(await page.locator('[data-select="compare"]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-spectrum-mode="average"]').click();assert.equal(await page.locator('#chart .plot-line').count(),2);
   await page.locator('[data-spectrum-mode="live"]').click();assert.equal(await page.locator('#live-spectrum').count(),1);
   await page.locator('#master-play').click();
   assert.equal(await page.locator('#audio-118').evaluate(a=>a.paused),true);
   const paused=await capture();await page.waitForTimeout(120);assert.equal(await capture(),paused);
   await page.locator('[data-select="68"]').click();await seek(1162);
   await page.getByRole('tab',{name:'Waveform',exact:true}).click();
   assert.equal(await page.locator('[data-chart-cursor]').count(),2);assert.match(await page.locator('[data-chart-cursor="68"] text').textContent(),/19:22/);
   await page.getByRole('tab',{name:'Spectrogram',exact:true}).click();
   assert.equal(await page.locator('[data-spectro-cursor]').count(),2);assert.match(await page.locator('[data-spectro-cursor="68"]').textContent(),/19:22/);
   const plot=await page.locator('[data-spectro-plot="68"]').boundingBox();
   await page.mouse.click(plot.x+plot.width*.5,plot.y+40);await page.waitForFunction(()=>Math.abs(document.querySelector('#audio-68').currentTime-2629.068)<2);
   await page.mouse.move(plot.x+plot.width*.5,plot.y+40);await page.mouse.down();await page.mouse.move(plot.x+plot.width*.6,plot.y+40,{steps:5});await page.mouse.up();
   await page.waitForFunction(()=>Math.abs(document.querySelector('#audio-68').currentTime-3154.8816)<3);
   await page.getByRole('tab',{name:'Loudness',exact:true}).click();assert.match(await page.locator('[data-chart-cursor="68"] text').textContent(),/52:3/);
   const before=await page.locator('#audio-68').evaluate(a=>a.currentTime);await page.locator('#master-seek').focus();await page.keyboard.press('ArrowRight');assert.ok(await page.locator('#audio-68').evaluate(a=>a.currentTime)>before);
   await page.locator('#loop').check();assert.equal(await page.locator('#audio-118').evaluate(a=>a.loop),true);
   await page.getByRole('tab',{name:'Loudness',exact:true}).focus();await page.keyboard.press('Home');assert.equal(await page.locator('#tab-frequencies').getAttribute('aria-selected'),'true');
   await page.locator('[data-select="compare"]').click();
   await page.getByRole('tab',{name:'Frequencies',exact:true}).click();
   for(const width of [320,390,768,1440,1920]){await page.setViewportSize({width,height:1100});await page.waitForTimeout(180);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' overflow '+width);}
   if(name==='chromium'){
    await page.setViewportSize({width:1440,height:1200});await page.locator('#master-play').click();await page.waitForTimeout(300);await page.locator('#analysis').screenshot({path:'/tmp/bruna-unified-desktop.png'});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.locator('#analysis').screenshot({path:'/tmp/bruna-unified-mobile.png'});
    await page.locator('#master-play').click();
   }
   assert.equal(requests.some(url=>url.includes('-segments.json')),false);
   assert.deepEqual(errors,[]);
   reports.push({browser:name,singleTransport:true,noAudioPreload:true,realLiveFFT:true,subSecondUpdates:true,freezeWithoutPausing:true,fftControls:true,preVolumeAnalysis:true,exclusiveTrackSwitch:true,fileAverageComparison:true,seekAndPlayheads:true,keyboardControls:true,repeat:true,responsive:true,errors});console.log(name+' passed');
  }finally{await browser.close();}
 }
 fs.writeFileSync('docs/unified-results.json',JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
