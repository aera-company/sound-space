// Historical UI regression suite. For the current player, run verify-unified.cjs.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const reports=[];
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  console.log('Testing '+name);
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1440,height:1000}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4322',{waitUntil:'networkidle'});
   assert.match(await page.title(),/BENV0008 25\/26/);
   await page.getByRole('button',{name:'Play 68 BPM in analysis',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#audio-68').currentTime>.5);
   await page.getByRole('button',{name:'Pause 68 BPM in analysis',exact:true}).click();
   const seek=async(sec)=>{await page.locator('#analysis-seek-68').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},sec);await page.waitForFunction(sec=>Math.abs(document.querySelector('#audio-68').currentTime-sec)<.5,sec);};
   await seek(1162);
   assert.match(await page.locator('[data-chart-cursor="68"] text').textContent(),/19:22/);
   await page.getByRole('tab',{name:'Spectrogram',exact:true}).click();
   assert.match(await page.locator('[data-spectro-cursor="68"]').textContent(),/19:22/);
   const plot=await page.locator('[data-spectro-plot="68"]').boundingBox();
   await page.mouse.click(plot.x+plot.width*.5,plot.y+60);
   await page.waitForFunction(()=>Math.abs(document.querySelector('#audio-68').currentTime-2629.068)<2);
   await page.mouse.move(plot.x+plot.width*.5,plot.y+60);await page.mouse.down();await page.mouse.move(plot.x+plot.width*.6,plot.y+60,{steps:5});await page.mouse.up();
   await page.waitForFunction(()=>Math.abs(document.querySelector('#audio-68').currentTime-3154.8816)<3);
   await page.getByRole('tab',{name:'Loudness',exact:true}).click();
   assert.match(await page.locator('[data-chart-cursor="68"] text').textContent(),/52:3/);
   await page.getByRole('tab',{name:'Frequencies',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('[data-segment-path="68"]').getAttribute('d').length>10);
   const previous=await page.locator('[data-segment-path="68"]').getAttribute('d');await seek(120);
   await page.waitForFunction(()=>document.querySelector('[data-segment-path="68"]').dataset.segment==='24');
   assert.notEqual(await page.locator('[data-segment-path="68"]').getAttribute('d'),previous);
   assert.match(await page.locator('#frequency-window').textContent(),/2:00–2:05/);
   await page.getByRole('button',{name:'Compare',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('[data-segment-path="118"]').getAttribute('d').length>10);
   assert.equal(await page.locator('#chart svg path').count(),4);
   await page.getByRole('button',{name:'Play 118 BPM in analysis',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#audio-118').currentTime>.5);
   assert.equal(await page.locator('[data-select="compare"]').getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#audio-68').evaluate(a=>a.paused),true);
   await page.getByRole('button',{name:'Pause 118 BPM in analysis',exact:true}).click();
   await page.getByRole('tab',{name:'Spectrogram',exact:true}).click();
   assert.equal(await page.locator('[data-spectro-cursor]').count(),2);
   if(name==='chromium')await page.locator('#analysis').screenshot({path:'/tmp/bruna-new-spectrogram.png'});
   await page.getByRole('tab',{name:'Waveform',exact:true}).click();
   assert.equal(await page.locator('[data-chart-cursor]').count(),2);
   await page.locator('#analysis-seek-68').focus();await page.keyboard.press('ArrowRight');
   assert.ok(await page.locator('#audio-68').evaluate(a=>a.currentTime)>120);
   for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});await page.waitForTimeout(180);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' overflow '+width);}
   if(name==='chromium'){await page.setViewportSize({width:390,height:844});await page.getByRole('tab',{name:'Frequencies',exact:true}).click();await page.locator('#analysis').screenshot({path:'/tmp/bruna-new-frequency-mobile.png'});}
   assert.deepEqual(errors,[]);
   reports.push({browser:name,playPause:true,timeLabels:true,spectrogramClickAndDrag:true,loudnessCursor:true,segmentSpectrumChangesOnSeek:true,comparePlaybackPreserved:true,keyboardSeek:true,responsive:true,errors});
   console.log(name+' passed');
  }finally{await browser.close();}
 }
 fs.writeFileSync('docs/playhead-results.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
