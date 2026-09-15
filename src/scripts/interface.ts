const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const room=document.querySelector<HTMLElement>('.explore-stage');
const roomLabel=document.querySelector<HTMLElement>('[data-room-label]');
document.querySelectorAll<HTMLButtonElement>('.room-condition').forEach(button=>button.addEventListener('click',()=>{
  const light=button.dataset.light ?? 'warm';
  if(room) room.dataset.roomLight=light;
  if(roomLabel) roomLabel.textContent=`${light[0].toUpperCase()}${light.slice(1)} light`;
}));
const listening=document.querySelector<HTMLElement>('.listening');
document.querySelectorAll<HTMLButtonElement>('[data-listening-theme]').forEach(button=>button.addEventListener('click',()=>{
  const theme=button.dataset.listeningTheme ?? 'purple';
  if(listening) listening.dataset.theme=theme;
  document.querySelectorAll<HTMLButtonElement>('[data-listening-theme]').forEach(option=>option.setAttribute('aria-pressed',String(option===button)));
}));
const gallery=document.querySelector<HTMLElement>('[data-gallery]');
if(gallery){
  const slides=Array.from(gallery.querySelectorAll<HTMLElement>('[data-gallery-slide]'));
  const dots=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-gallery-dot]'));
  const previous=document.querySelector<HTMLButtonElement>('[data-gallery-prev]')!;
  const next=document.querySelector<HTMLButtonElement>('[data-gallery-next]')!;
  const currentLabel=document.querySelector<HTMLElement>('[data-gallery-current]')!;
  let current=0,frame=0;
  const update=(index:number)=>{current=Math.max(0,Math.min(slides.length-1,index));dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===current)));previous.disabled=current===0;next.disabled=current===slides.length-1;currentLabel.textContent=String(current+1);};
  const go=(index:number)=>{update(index);slides[current].scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth',block:'nearest',inline:'center'});};
  previous.addEventListener('click',()=>go(current-1));next.addEventListener('click',()=>go(current+1));dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
  gallery.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();go(current-1);}else if(event.key==='ArrowRight'){event.preventDefault();go(current+1);}else if(event.key==='Home'){event.preventDefault();go(0);}else if(event.key==='End'){event.preventDefault();go(slides.length-1);}});
  gallery.addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const centre=gallery.scrollLeft+gallery.clientWidth/2;let closest=0,distance=Infinity;slides.forEach((slide,i)=>{const delta=Math.abs(slide.offsetLeft+slide.clientWidth/2-centre);if(delta<distance){distance=delta;closest=i;}});update(closest);});},{passive:true});
  update(0);
}
