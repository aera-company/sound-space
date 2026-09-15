// Editorial cue points identified from the supplied film, not CCT measurements.
const cues:[number,string][]=[[0,'neutral'],[9.9,'warm'],[13,'cool'],[17.5,'warm'],[24,'cool'],[29.8,'warm'],[33.3,'cool'],[36.7,'warm'],[40.9,'cool'],[45.2,'warm'],[51,'neutral']];
const video=document.querySelector<HTMLVideoElement>('#lighting-video')!;
const label=document.querySelector<HTMLElement>('#video-light-label')!;
const status=document.querySelector<HTMLElement>('#video-status')!;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let visible=false,userPaused=false,observerPaused=false;
video.muted=true;
function updateLabel(){const current=cues.findLast(c=>video.currentTime>=c[0])![1];label.textContent=current[0].toUpperCase()+current.slice(1)+' light';label.parentElement!.dataset.light=current;}
function pauseOutOfView(){if(!video.paused){observerPaused=true;video.pause();}}
function startWhenVisible(){if(visible&&!document.hidden&&!reduce.matches&&!userPaused)video.play().catch(()=>{status.textContent='Press play on the film to watch the lighting changes. The video is silent.';});}
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)startWhenVisible();else pauseOutOfView();},{threshold:.25}).observe(video);
video.addEventListener('pause',()=>{if(observerPaused)observerPaused=false;else userPaused=true;});
video.addEventListener('play',()=>{userPaused=false;status.textContent='Silent film. Use the video controls to pause or seek.';});
video.addEventListener('error',()=>{status.textContent='The film could not load. Reload the page to try again.';});
for(const event of ['timeupdate','seeked','loadedmetadata'])video.addEventListener(event,updateLabel);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseOutOfView();else startWhenVisible();});
reduce.addEventListener('change',()=>{if(reduce.matches)pauseOutOfView();else startWhenVisible();});
if(reduce.matches)status.textContent='Press play on the film to watch the lighting changes. The video is silent.';
updateLabel();
