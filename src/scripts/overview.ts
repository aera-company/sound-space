const video=document.querySelector<HTMLVideoElement>('#overview-video')!;
const stage=document.querySelector<HTMLElement>('.overview-stage')!;
const toggle=document.querySelector<HTMLButtonElement>('#overview-toggle')!;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let visible=false,attempted=false,userPaused=false,autoPausing=false,completed=false;
toggle.hidden=false;
function showPoster(){stage.classList.remove('is-running');}
function refresh(){
 const playing=!video.paused;
 toggle.querySelector('span')!.textContent=playing?'Pause overview':completed?'Replay overview':video.currentTime>0?'Resume overview':'Play overview';
 toggle.querySelector('path')!.setAttribute('d',playing?'M5 4h3v12H5zm7 0h3v12h-3Z':'M5 4v12l10-6Z');
}
async function play(){
 if(!video.src)video.src=video.dataset.src!;
 if(completed){video.currentTime=0;completed=false;}
 video.muted=true;
 try{await video.play();}catch{showPoster();refresh();}
}
function pauseAutomatically(){if(!video.paused){autoPausing=true;video.pause();}}
toggle.addEventListener('click',()=>{attempted=true;if(video.paused){userPaused=false;play();}else{userPaused=true;video.pause();}});
video.addEventListener('playing',()=>{stage.classList.add('is-running');refresh();});
video.addEventListener('pause',()=>{if(autoPausing)autoPausing=false;else if(!completed)userPaused=true;refresh();});
video.addEventListener('ended',()=>{completed=true;showPoster();refresh();});
video.addEventListener('error',()=>{showPoster();toggle.querySelector('span')!.textContent='Retry overview';});
function maybePlay(){if(visible&&!document.hidden&&!reduce.matches&&!completed&&!userPaused){attempted=true;play();}}
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.55;if(visible)maybePlay();else pauseAutomatically();},{threshold:.55}).observe(stage);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAutomatically();else if(attempted)maybePlay();});
reduce.addEventListener('change',()=>{if(reduce.matches){pauseAutomatically();showPoster();}else maybePlay();});
// Keyboard users can read the data without an automatically running animation.
const figure=document.querySelector<HTMLElement>('.experiment-overview')!;
figure.addEventListener('focusin',()=>{if(document.documentElement.dataset.input==='keyboard'){userPaused=true;pauseAutomatically();}});
refresh();
