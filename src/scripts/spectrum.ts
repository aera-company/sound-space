// Responsive Web Audio spectrum. The analyser is upstream of playback gain.
let node:AnalyserNode|undefined;
let canvas:HTMLCanvasElement|null=null;
let values=new Float32Array(0);
let peaks=new Float32Array(0);
let frozen=false;
let hold=true;
let label='68 BPM';
let lastTime=0;
let fftSize=4096;
let response=.08;
let lastPoints:number[]=[];
let hoverX:number|null=null;
let lastStatus='';
const FLOOR=-120;
export const liveSpectrum={
 connect(analyser:AnalyserNode){node=analyser;node.fftSize=fftSize;node.smoothingTimeConstant=response;values=new Float32Array(node.frequencyBinCount).fill(FLOOR);peaks=new Float32Array(values.length).fill(FLOOR);},
 mount(target:HTMLElement){
  target.innerHTML='<div class="live-spectrum"><canvas id="live-spectrum" role="img" aria-label="Live frequency spectrum of the selected recording, 20 Hz to 20 kHz, in dBFS"></canvas><div class="spectrum-readout"><span id="spectrum-state">Press play to analyse the recording</span><span id="spectrum-value"></span></div></div>';
  canvas=target.querySelector('canvas');lastTime=0;
  canvas!.addEventListener('pointermove',event=>{hoverX=event.clientX-canvas!.getBoundingClientRect().left;draw(lastStatus);});
  canvas!.addEventListener('pointerleave',()=>{hoverX=null;draw(lastStatus);});
  draw('Press play to analyse the recording');
 },
 setTrack(bpm:number){label=`${bpm} BPM`;this.clear();},
 clear(){values.fill(FLOOR);peaks.fill(FLOOR);lastPoints=[];lastTime=0;lastStatus='Press play to analyse the recording';},
 reset(){peaks.fill(FLOOR);},
 freeze(value:boolean){frozen=value;},
 peaks(value:boolean){hold=value;draw(lastStatus);},
 resolution(value:number){fftSize=value;if(node)this.connect(node);lastPoints=[];},
 response(value:number){response=value;if(node)node.smoothingTimeConstant=value;},
 update(playing:boolean,seeking:boolean,now=performance.now()){
  if(!canvas?.isConnected)return;
  if(!playing||seeking||!node||frozen){draw(frozen?`Frozen · ${label}`:seeking?'Seeking…':!node?'Press play to analyse the recording':`Paused · ${label}`);return;}
  const dt=lastTime?Math.min(.1,(now-lastTime)/1000):1/30;lastTime=now;
  node.getFloatFrequencyData(values);
  for(let i=0;i<values.length;i++){values[i]=Number.isFinite(values[i])?Math.max(FLOOR,values[i]):FLOOR;peaks[i]=Math.max(values[i],peaks[i]-dt*8);}
  draw(`Live · ${label}`);
 }
};
function draw(state:string){
 if(!canvas?.isConnected)return;
 lastStatus=state;
 const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);
 if(width===0||height===0)return;
 if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
 const ctx=canvas.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
 const style=getComputedStyle(canvas),accent=style.getPropertyValue('--accent').trim()||'#86d4fb',rule=style.getPropertyValue('--rule').trim()||'#655079',muted=style.getPropertyValue('--muted').trim()||'#d7bdfa',secondary=style.getPropertyValue('--spectral-secondary').trim()||'#ebdefc';
 const left=43,right=width-13,top=12,bottom=height-28,maxHz=Math.min(20000,(node?.context.sampleRate||48000)/2);
 const px=(f:number)=>left+Math.log(f/20)/Math.log(maxHz/20)*(right-left);
 const y=(db:number)=>top+(-Math.max(FLOOR,Math.min(0,db))/120)*(bottom-top);
 ctx.font='10px Helvetica,Arial,sans-serif';ctx.lineWidth=.5;
 for(const db of [-120,-100,-80,-60,-40,-20,0]){const pos=y(db);ctx.strokeStyle=rule;ctx.beginPath();ctx.moveTo(left,pos);ctx.lineTo(right,pos);ctx.stroke();ctx.fillStyle=muted;ctx.textAlign='right';ctx.fillText(String(db),left-9,pos+3);}
 const ticks=width<600?[20,100,1000,10000,20000]:[20,50,100,200,500,1000,2000,5000,10000,20000];
 for(const hz of ticks){if(hz>maxHz)continue;const pos=px(hz);ctx.strokeStyle=rule;ctx.beginPath();ctx.moveTo(pos,top);ctx.lineTo(pos,bottom);ctx.stroke();ctx.fillStyle=muted;ctx.textAlign=hz===20?'left':hz===maxHz?'right':'center';ctx.fillText(hz>=1000?hz/1000+'k':String(hz),pos,height-8);}
 if(values.length&&node){
  const binHz=node.context.sampleRate/node.fftSize;
  const count=Math.min(620,Math.floor(right-left));
  const aggregate=(data:Float32Array)=>Array.from({length:count},(_,i)=>{
   const a=20*(maxHz/20)**(i/count)/binHz,b=20*(maxHz/20)**((i+1)/count)/binHz;
   const from=Math.ceil(a),to=Math.min(data.length-1,Math.floor(b));
   if(from>to){const lo=Math.min(data.length-1,Math.floor(a)),hi=Math.min(data.length-1,lo+1);return data[lo]+(data[hi]-data[lo])*(a-lo);}
   let max=FLOOR;for(let bin=from;bin<=to;bin++)max=Math.max(max,data[bin]);return max;
  });
  const points=aggregate(values);lastPoints=points;
  ctx.beginPath();ctx.moveTo(left,bottom);points.forEach((db,i)=>ctx.lineTo(left+i/(count-1)*(right-left),y(db)));ctx.lineTo(right,bottom);ctx.closePath();ctx.globalAlpha=.13;ctx.fillStyle=accent;ctx.fill();ctx.globalAlpha=1;
  const stroke=(data:number[],colour:string,dash:number[])=>{ctx.beginPath();data.forEach((db,i)=>{const x=left+i/(count-1)*(right-left);i?ctx.lineTo(x,y(db)):ctx.moveTo(x,y(db));});ctx.strokeStyle=colour;ctx.lineWidth=1.2;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);};
  stroke(points,accent,[]);
  if(hold){ctx.globalAlpha=.45;stroke(aggregate(peaks),secondary,[3,3]);ctx.globalAlpha=1;}
 }
 const output=document.querySelector('#spectrum-value');
 if(hoverX!==null&&hoverX>=left&&hoverX<=right&&lastPoints.length){
  const ratio=(hoverX-left)/(right-left),hz=20*(maxHz/20)**ratio,db=lastPoints[Math.min(lastPoints.length-1,Math.floor(ratio*lastPoints.length))];
  ctx.strokeStyle=secondary;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(hoverX,top);ctx.lineTo(hoverX,bottom);ctx.stroke();ctx.setLineDash([]);
  if(output)output.textContent=`${Math.round(hz).toLocaleString('en')} Hz · ${db.toFixed(1)} dBFS`;
 }else if(output)output.textContent='20 Hz–20 kHz · dBFS';
 const stateOutput=document.querySelector('#spectrum-state');if(stateOutput)stateOutput.textContent=state;
 canvas.dataset.state=state.startsWith('Live')?'live':state.startsWith('Frozen')?'frozen':'paused';
}
