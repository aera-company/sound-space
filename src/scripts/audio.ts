import { scaleLinear, scaleLog } from 'd3-scale';
import { line, area } from 'd3-shape';
import { liveSpectrum } from './spectrum';
type Track={bpm:number;duration:number;step:number;waveform:number[];rms:number[];loudness:(number|null)[];frequencies:number[];spectrum:number[];integrated:number;lra:number;truePeak:number};
const tracks:Track[]=JSON.parse(document.querySelector('#track-data')!.textContent!);
const $=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const byBpm=(bpm:number)=>tracks.find(t=>t.bpm===bpm)!;
const audios=new Map(tracks.map(t=>[t.bpm,$<HTMLAudioElement>(`#audio-${t.bpm}`)]));
let activeBpm=68;
let selected:number|'compare'=68;
let view='frequencies';
let spectrumMode='live';
let context:AudioContext|undefined,analyser:AnalyserNode|undefined,gain:GainNode|undefined;
const sources=new Map<number,MediaElementAudioSourceNode>();
let request=0,frame=0,volume=.7;
let frozen=false;
let preview:{button:HTMLElement;bpm:number;start:number;end:number}|undefined;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const duration=Math.max(...tracks.map(t=>t.duration));
const formatTime=(n:number)=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
const status=(s:string)=>{$('#playback-status').textContent=s;};
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function stopAnimation(){cancelAnimationFrame(frame);frame=0;}
function animate(){
 stopAnimation();if(document.hidden)return;
 let previous=0;
 const tick=(now:number)=>{
  if(audios.get(activeBpm)!.paused)return;
  if(now-previous>(reduced.matches?120:30)){updateChartCursor(now);previous=now;}
  frame=requestAnimationFrame(tick);
 };frame=requestAnimationFrame(tick);
}
async function connectAudio(bpm:number){
 const AC=window.AudioContext||(window as any).webkitAudioContext;
 if(!AC)return false;
 try{
  context??=new AC();
  if(!analyser){
   analyser=context!.createAnalyser();gain=context!.createGain();gain.gain.value=volume;
   analyser.connect(gain);gain.connect(context!.destination);liveSpectrum.connect(analyser);
  }
  if(!sources.has(bpm)){const source=context!.createMediaElementSource(audios.get(bpm)!);source.connect(analyser);sources.set(bpm,source);}
  audios.get(bpm)!.volume=1;
  await context!.resume();return true;
 }catch{status('Live spectrum is unavailable in this browser. File analysis remains available.');return false;}
}
function syncPlayer(){
 const audio=audios.get(activeBpm)!;
 const playing=!audio.paused;
 $('.master-player').classList.toggle('is-playing',playing);
 $('#master-play').setAttribute('aria-label',`${playing?'Pause':'Play'} ${activeBpm} BPM`);
 $('#master-label').textContent=`${playing?'Playing':'Listen to'} ${activeBpm} BPM`;
 $('#master-time').textContent=formatTime(audio.currentTime);
 $('#master-duration').textContent=formatTime(byBpm(activeBpm).duration);
 const seek=$<HTMLInputElement>('#master-seek');seek.max=String(byBpm(activeBpm).duration);seek.value=String(audio.currentTime);
 seek.setAttribute('aria-valuetext',`${activeBpm} BPM, ${Math.floor(audio.currentTime/60)} minutes, ${Math.floor(audio.currentTime%60)} seconds`);
 document.querySelectorAll<HTMLElement>('.recording-choice').forEach(b=>{const active=Number(b.dataset.select)===activeBpm;b.setAttribute('aria-pressed',String(active));b.querySelector('.choice-state')!.textContent=active?'Selected':'Select';});
 $('[data-select="compare"]').setAttribute('aria-pressed',String(selected==='compare'));
}
async function play(bpm:number){
 const token=++request,audio=audios.get(bpm)!;
 for(const other of audios.values())if(other!==audio)other.pause();
 status(`Loading ${bpm} BPM…`);
// Start both inside the tap handler so mobile browsers retain user activation.
 const connection=connectAudio(bpm);
 try{const playback=audio.play();await Promise.all([connection,playback]);if(token!==request||bpm!==activeBpm){if(bpm!==activeBpm)audio.pause();return;}}catch{if(token===request){status('Audio could not start. Check your connection and press play to retry.');if(preview){stopPreview();$('#matrix-status').textContent='The excerpt could not start. Select the condition to try again.';}}}
 syncPlayer();
}
function toggle(){
 stopPreview();
 const audio=audios.get(activeBpm)!;
 if(!audio.paused){++request;audio.pause();status(`${activeBpm} BPM paused at ${formatTime(audio.currentTime)}.`);}
 else play(activeBpm);
}
function chooseTrack(bpm:number,resume=true,redraw=true){
 stopPreview();
 const wasPlaying=!audios.get(activeBpm)!.paused;
 if(activeBpm!==bpm){++request;for(const a of audios.values())a.pause();activeBpm=bpm;liveSpectrum.setTrack(bpm);}
 if(selected!=='compare')selected=bpm;
 syncPlayer();if(redraw)render();else updateChartCursor();
 if(wasPlaying&&resume)play(bpm);
 else status(`${bpm} BPM selected. Press play to listen.`);
}
$('#master-play').addEventListener('click',toggle);
$('#master-seek').addEventListener('input',e=>{stopPreview();seekTo(activeBpm,Number((e.target as HTMLInputElement).value));});
for(const [bpm,audio] of audios){
 audio.volume=volume;
 audio.addEventListener('play',()=>{$('.master-player').classList.remove('is-inviting');playHintObserver.disconnect();for(const other of audios.values())if(other!==audio)other.pause();syncPlayer();animate();});
 audio.addEventListener('pause',()=>{if(preview?.bpm===bpm&&audio.paused)stopPreview();syncPlayer();if(bpm===activeBpm){stopAnimation();updateChartCursor();}});
 audio.addEventListener('timeupdate',()=>{if(bpm===activeBpm)updateChartCursor();});
 audio.addEventListener('seeked',updateChartCursor);
 audio.addEventListener('loadedmetadata',updateChartCursor);
 audio.addEventListener('seeking',()=>{if(bpm===activeBpm)liveSpectrum.clear();});
 audio.addEventListener('playing',()=>status(`Listening to ${bpm} BPM. Switch visualisations while you listen.`));
 audio.addEventListener('waiting',()=>{if(!audio.paused)status(`Buffering ${bpm} BPM…`);});
 audio.addEventListener('ended',()=>{stopAnimation();syncPlayer();updateChartCursor();status(`${bpm} BPM recording complete. Press play to listen again.`);});
 audio.addEventListener('error',()=>status(`${bpm} BPM could not load. Check your connection and press play to retry.`));
}
const pendingSeek=new Map<number,number>();
function seekTo(bpm:number,time:number){
 const audio=audios.get(bpm)!;
 const target=Math.max(0,Math.min(time,byBpm(bpm).duration-.1));
 if(audio.readyState===0){
  const alreadyPending=pendingSeek.has(bpm);pendingSeek.set(bpm,target);
  if(!alreadyPending){audio.addEventListener('loadedmetadata',()=>{const latest=pendingSeek.get(bpm);pendingSeek.delete(bpm);if(latest!==undefined){audio.currentTime=latest;updateChartCursor();}},{once:true});audio.load();}
 }else{audio.currentTime=target;updateChartCursor();}
}
$('#volume').addEventListener('input',e=>{
 volume=Number((e.target as HTMLInputElement).value);
 if(gain)gain.gain.setValueAtTime(volume,context!.currentTime);
 for(const [bpm,audio] of audios)audio.volume=sources.has(bpm)?1:volume;
});
$('#loop').addEventListener('change',e=>{for(const audio of audios.values())audio.loop=(e.target as HTMLInputElement).checked;});
document.querySelectorAll<HTMLElement>('[data-select]').forEach(b=>b.addEventListener('click',()=>{
 if(b.dataset.select==='compare'){selected=selected==='compare'?activeBpm:'compare';syncPlayer();render();}
 else chooseTrack(Number(b.dataset.select));
}));
function stopPreview(pause=false){
 const current=preview;if(!current)return;preview=undefined;
 current.button.classList.remove('is-previewing');current.button.setAttribute('aria-pressed','false');
 current.button.setAttribute('aria-label',`Play 30-second excerpt: ${current.button.dataset.light} light + ${current.bpm} BPM`);
 current.button.style.removeProperty('--sample-progress');current.button.querySelector('.sample-text')!.textContent='Listen · 30 sec';
 $('#sample-stop').hidden=true;$('#matrix-status').textContent='Excerpt stopped. Choose a condition to listen again.';
 if(pause){++request;audios.get(current.bpm)!.pause();}
}
function updatePreview(){
 if(!preview)return;
 const {button,bpm,start,end}=preview,audio=audios.get(bpm)!;
 if(audio.currentTime>=end){stopPreview(true);$('#matrix-status').textContent='Excerpt complete. Choose another condition or continue in the listening room.';return;}
 button.style.setProperty('--sample-progress',String(Math.max(0,Math.min(1,(audio.currentTime-start)/(end-start)))));
 button.querySelector('.sample-text')!.textContent=`${formatTime(Math.max(0,audio.currentTime-start))} / 0:30 · Stop`;
}
$('#sample-stop').addEventListener('click',()=>{const button=preview?.button;stopPreview(true);button?.focus({preventScroll:true});});
document.querySelectorAll<HTMLElement>('[data-combination]').forEach(button=>button.addEventListener('click',()=>{
 if(preview?.button===button){stopPreview(true);return;}
 stopPreview(true);
 const bpm=Number(button.dataset.combination);
 chooseTrack(bpm,false);
 for(const a of audios.values())a.pause();
 document.body.dataset.light=button.dataset.light;
 preview={button,bpm,start:30,end:60};
 button.classList.add('is-previewing');button.setAttribute('aria-pressed','true');
 button.setAttribute('aria-label',`Stop excerpt: ${button.dataset.light} light + ${bpm} BPM`);
 button.style.setProperty('--sample-progress','0');
 $('#sample-stop').hidden=false;
 $('#matrix-status').textContent=`${button.dataset.light==='warm'?'Warm':'Cool'} light + ${bpm} BPM · playing a 30-second excerpt.`;
 seekTo(bpm,30);play(bpm);
}));
const tabs=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-view]'));
function setView(tab:HTMLButtonElement,motion=true){view=tab.dataset.view!;tabs.forEach(b=>{b.setAttribute('aria-selected',String(b===tab));b.tabIndex=b===tab?0:-1;});$('#chart-panel').setAttribute('aria-labelledby',tab.id);render();if(motion&&!reduced.matches)$('#chart-panel').animate([{opacity:.55},{opacity:1}],{duration:180,easing:'cubic-bezier(0.23,1,0.32,1)'});}
tabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>setView(tab));
 tab.addEventListener('keydown',e=>{let next=index;if(e.key==='ArrowRight')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();tabs[next].focus();setView(tabs[next],false);});
});
document.querySelectorAll<HTMLElement>('[data-spectrum-mode]').forEach(b=>b.addEventListener('click',()=>{spectrumMode=b.dataset.spectrumMode!;document.querySelectorAll<HTMLElement>('[data-spectrum-mode]').forEach(other=>other.setAttribute('aria-pressed',String(other===b)));render();}));
$('#spectrum-resolution').addEventListener('change',e=>liveSpectrum.resolution(Number((e.target as HTMLSelectElement).value)));
$('#spectrum-response').addEventListener('change',e=>liveSpectrum.response(Number((e.target as HTMLSelectElement).value)));
$('#spectrum-peaks').addEventListener('change',e=>liveSpectrum.peaks((e.target as HTMLInputElement).checked));
$('#spectrum-freeze').addEventListener('click',()=>{frozen=!frozen;liveSpectrum.freeze(frozen);$('#spectrum-freeze').setAttribute('aria-pressed',String(frozen));$('#spectrum-freeze').textContent=frozen?'Unfreeze':'Freeze';updateChartCursor();});
$('#spectrum-reset').addEventListener('click',()=>{liveSpectrum.reset();updateChartCursor();});
function updateMetrics(ts:Track[]){
 const set=(id:string,key:keyof Track,unit:string)=>{$(id).innerHTML=`${ts.map(t=>t[key]).join(' / ')} <small>${unit}</small>`;};
 set('#metric-bpm','bpm','BPM');set('#metric-loudness','integrated','LUFS');set('#metric-range','lra','LU');set('#metric-peak','truePeak','dBTP');
}
function displayedTracks(){return selected==='compare'?tracks:[byBpm(selected)];}
function updateChartCursor(now?:number){
 syncPlayer();updatePreview();
 for(const t of tracks){
  const audio=audios.get(t.bpm)!;
  const time=audio.currentTime;
  const cursor=document.querySelector<SVGGElement>(`[data-chart-cursor="${t.bpm}"]`);
  if(cursor){
   const width=Number(cursor.dataset.width),x=45+time/duration*(width-60);
   const line=cursor.querySelector('line')!;line.setAttribute('x1',String(x));line.setAttribute('x2',String(x));
   const label=cursor.querySelector<SVGGElement>('[data-cursor-label]')!;
   label.setAttribute('transform',`translate(${Math.max(45,Math.min(width-112,x+7))},${cursor.dataset.labelY})`);
   label.querySelector('text')!.textContent=`${t.bpm} · ${formatTime(time)}`;
  }
  const spectro=document.querySelector<HTMLElement>(`[data-spectro-cursor="${t.bpm}"]`);
  if(spectro){
   spectro.style.left=`${time/duration*100}%`;
   spectro.querySelector('span')!.textContent=`${t.bpm} · ${formatTime(time)}`;
   spectro.classList.toggle('near-end',time/duration>.8);
  }
 }
 if(view==='frequencies'&&spectrumMode==='live'){const audio=audios.get(activeBpm)!;liveSpectrum.update(!audio.paused,audio.seeking,typeof now==='number'?now:undefined);}
}
function bindTimeline(element:HTMLElement|SVGSVGElement, getTime:(e:PointerEvent)=>number, ts:Track[]){
 let dragging=false;
 const seek=(event:PointerEvent)=>{stopPreview();const bpm=ts.length===1?ts[0].bpm:activeBpm;if(bpm!==activeBpm)chooseTrack(bpm,false,false);seekTo(bpm,getTime(event));};
 element.addEventListener('pointerdown',(event:PointerEvent)=>{
  if(event.button!==0)return;
  dragging=true;element.setPointerCapture(event.pointerId);seek(event);
 });
 element.addEventListener('pointermove',(event:PointerEvent)=>{if(dragging)seek(event);});
 element.addEventListener('pointerup',(event:PointerEvent)=>{if(dragging)seek(event);dragging=false;if(element.hasPointerCapture(event.pointerId))element.releasePointerCapture(event.pointerId);});
 element.addEventListener('pointercancel',()=>{dragging=false;});
}
function render(){
 const ts=displayedTracks();
 updateMetrics(ts);
 syncPlayer();
 $('#spectrum-controls').hidden=view!=='frequencies';
 $('.live-options').hidden=spectrumMode!=='live';
 $('#chart-legend').textContent=ts.map((t,i)=>`${i?'┄':'—'} ${t.bpm} BPM`).join('     ');
 const descriptions:Record<string,string>={waveform:'RMS amplitude in 5-second windows. Click or drag to seek. The playhead follows the recording.',spectrogram:'Click or drag to seek. Frequency: 30 Hz–12 kHz (logarithmic). Shared colour scale: −90 to −15 dBFS.',frequencies:spectrumMode==='live'?'Live FFT of the playing recording, before volume. Solid: current spectrum. Dotted: decaying peak hold.':'Mean spectral power across each complete recording. Shared scales for comparison; measured from 30 Hz to 12 kHz.',loudness:'Short-term loudness (3 s), averaged in 5-second windows. Click or drag to seek.'};
 $('#chart-description').textContent=descriptions[view];
 $('#chart-unit').textContent=({waveform:'Amplitude / time',spectrogram:'Frequency / time / intensity',frequencies:spectrumMode==='live'?'Live · dBFS / Hz':'File average · dBFS / Hz',loudness:'LUFS / time'} as Record<string,string>)[view];
 const container=$('#chart');
 container.className='chart';
 if(view==='frequencies'&&spectrumMode==='live'){container.classList.add('is-live-spectrum');liveSpectrum.mount(container);$('#chart-legend').textContent=`${activeBpm} BPM live${selected==='compare'?' · File average compares both':''}`;updateChartCursor();return;}
 if(view==='spectrogram'){
  container.classList.add(selected==='compare'?'is-comparison-spectrogram':'is-spectrogram');
  container.innerHTML=ts.map(t=>`<div class="spectrogram-row"><div class="spectro-axis"><span>12k Hz</span><span>600 Hz</span><span>30 Hz</span></div><div class="spectrogram-plot" data-spectro-plot="${t.bpm}"><img src="/analysis/${t.bpm}-spectrogram.webp" alt="Full recording spectrogram for ${t.bpm} BPM, from 30 Hz to 12 kHz" width="${t.waveform.length}" height="192" style="width:${t.duration/duration*100}%" draggable="false"><div class="spectrogram-playhead" data-spectro-cursor="${t.bpm}"><span>${t.bpm} · 0:00</span></div></div><div class="spectrogram-time"><span>0:00</span><span>${formatTime(duration/2)}</span><span>${formatTime(duration)}</span></div></div>`).join('')+'<div class="spectrogram-scale" aria-label="Spectrogram colour scale from minus 90 to minus 15 dBFS"><span>−90</span><i></i><span>−15 dBFS</span></div>';
  container.querySelectorAll<HTMLElement>('[data-spectro-plot]').forEach(plot=>bindTimeline(plot,e=>{const r=plot.getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*duration;},[byBpm(Number(plot.dataset.spectroPlot))]));
  updateChartCursor();
  return;
 }
 const width=Math.max(280,container.clientWidth),height=210;
 const x=view==='frequencies'?scaleLog().domain([30,12000]).range([45,width-15]):scaleLinear().domain([0,duration]).range([45,width-15]);
 const y=scaleLinear().domain(view==='waveform'?[-1,1]:view==='frequencies'?[-100,0]:[-60,0]).range([height-30,12]);
 const ticks=view==='waveform'?[-1,0,1]:view==='frequencies'?[-100,-80,-60,-40,-20,0]:[-60,-45,-30,-15,0];
 const xTicks=view==='frequencies'?[30,100,1000,12000]:(width<550?[0,.5,1]:[0,.25,.5,.75,1]).map(f=>f*duration);
 let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(view)} comparison: ${ts.map(t=>t.bpm+' BPM').join(' and ')}"><title>${escape(descriptions[view])}</title>`;
 svg+=ticks.map(t=>`<line class="grid-line" x1="45" y1="${y(t)}" x2="${width-15}" y2="${y(t)}"/><text x="33" y="${y(t)+3}" text-anchor="end">${t}</text>`).join('');
 svg+=xTicks.map(t=>`<text x="${x(t)}" y="${height-8}" text-anchor="${t===xTicks[0]?'start':t===xTicks.at(-1)?'end':'middle'}">${view==='frequencies'?(t>=1000?t/1000+'k':t):formatTime(t)}</text>`).join('');
 ts.forEach((t,i)=>{
  const values=view==='waveform'?t.rms.map(v=>Math.pow(10,v/20)):view==='frequencies'?t.spectrum:t.loudness;
  const points=values.map((v,j)=>[view==='frequencies'?t.frequencies[j]:Math.min(j*t.step+t.step/2,t.duration),v]);
  if(view==='waveform'){
   const path=area().x((d:any)=>x(d[0])).y0((d:any)=>y(-d[1])).y1((d:any)=>y(d[1]))(points as any);
   svg+=`<path d="${path}" fill="${i?'var(--paper)':'var(--accent)'}" fill-opacity="${i?'.10':'.22'}" stroke="${i?'var(--paper)':'var(--accent)'}" stroke-width=".6" ${i?'stroke-dasharray="3 2"':''}/>`;
  }else{
   const path=line().defined((d:any)=>d[1]!==null).x((d:any)=>x(d[0])).y((d:any)=>y(Math.max(y.domain()[0],Math.min(y.domain()[1],d[1]))))(points as any);
   svg+=`<path class="plot-line ${i?'secondary':''} " d="${path||''}"/>`;
  }

 });
 if(view!=='frequencies')svg+=ts.map((t,i)=>`<g data-chart-cursor="${t.bpm}" data-width="${width}" data-label-y="${12+i*23}" class="chart-playhead"><line id="${i?'chart-cursor-'+t.bpm:'chart-cursor'}" y1="12" y2="${height-30}" stroke="${i?'var(--paper)':'var(--accent)'}" stroke-width="1.4"/><g data-cursor-label><rect width="94" height="20" rx="2"/><text x="6" y="14">${t.bpm} · 0:00</text></g></g>`).join('');
 svg+=`<line id="hover-line" y1="12" y2="${height-30}" stroke="var(--muted)" stroke-dasharray="2 3" opacity="0"/></svg><output id="chart-tooltip" class="chart-tooltip" hidden></output>`;

 container.innerHTML=svg;
 const chart=container.querySelector('svg')!;
 const position=(event:PointerEvent)=>{const rect=chart.getBoundingClientRect();return Math.max(45,Math.min(width-15,(event.clientX-rect.left)/rect.width*width));};
 chart.addEventListener('pointermove',event=>{
  const px=position(event),value=x.invert(px);
  const hover=$<any>('#hover-line');hover.setAttribute('x1',String(px));hover.setAttribute('x2',String(px));hover.setAttribute('opacity','.7');
  const tooltip=$<HTMLOutputElement>('#chart-tooltip');tooltip.hidden=false;
  tooltip.textContent=(view==='frequencies'?`${Math.round(value)} Hz`:formatTime(value))+' · '+ts.map(t=>{
   const idx=view==='frequencies'?t.frequencies.reduce((best,f,j)=>Math.abs(f-value)<Math.abs(t.frequencies[best]-value)?j:best,0):Math.floor(value/t.step);

   const arr=view==='frequencies'?t.spectrum:view==='waveform'?t.rms.map(v=>Math.pow(10,v/20)):t.loudness;
   const v=arr[idx];return `${t.bpm}: ${v==null?'—':v.toFixed(view==='waveform'?2:1)}${view==='frequencies'?' dBFS':view==='loudness'?' LUFS':''}`;
  }).join(' / ');
 });
 chart.addEventListener('pointerleave',()=>{$('#chart-tooltip').hidden=true;$('#hover-line').setAttribute('opacity','0');});
 if(view!=='frequencies')bindTimeline(chart,e=>x.invert(position(e)),ts);

 updateChartCursor();
}

// A brief invitation when the transport first comes into view; never loops indefinitely.
const playHintObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){$('.master-player').classList.add('is-inviting');playHintObserver.disconnect();}},{threshold:.6});
playHintObserver.observe($('#master-play'));

let resizeTimer:ReturnType<typeof setTimeout>;
let previousWidth=0;
new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width===previousWidth)return;previousWidth=width;clearTimeout(resizeTimer);resizeTimer=setTimeout(render,120);}).observe($('#chart'));
document.addEventListener('visibilitychange',()=>{stopAnimation();if(!document.hidden)animate();});
reduced.addEventListener('change',()=>{stopAnimation();animate();});
window.addEventListener('pagehide',()=>{for(const audio of audios.values())audio.pause();stopAnimation();});
render();
