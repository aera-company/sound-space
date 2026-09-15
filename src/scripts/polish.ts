const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
root.dataset.input='pointer';
document.addEventListener('pointerdown',()=>{root.dataset.input='pointer';},{passive:true});
document.addEventListener('keydown',()=>{root.dataset.input='keyboard';});
// Only image and contextual copy reveal; numerical plots stay stable.
const reveals=document.querySelectorAll<HTMLElement>('.explore-heading,.light-study-heading,.gallery-heading');
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
 if(!entry.isIntersecting)return;
 revealObserver.unobserve(entry.target);
 if(!reduced.matches)entry.target.animate([{opacity:.3,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing:'cubic-bezier(0.23,1,0.32,1)'});
}),{threshold:.18});
reveals.forEach(el=>revealObserver.observe(el));
// Location feedback without intercepting scrolling or moving keyboard focus.
const links=Array.from(document.querySelectorAll<HTMLAnchorElement>('.masthead nav a'));
const sections=links.map(link=>document.querySelector<HTMLElement>(link.hash)!).filter(Boolean);
let queued=false;
function updateLocation(){
 queued=false;let current='';
 for(const section of sections)if(section.getBoundingClientRect().top<=innerHeight*.3)current=section.id;
 for(const link of links){if(link.hash==='#'+current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}
}
document.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateLocation);}},{passive:true});
window.addEventListener('resize',updateLocation);
updateLocation();
// Native details remain functional without JavaScript; only pointer opens fade in.
document.querySelectorAll<HTMLDetailsElement>('details').forEach(details=>details.addEventListener('toggle',()=>{
 if(details.open&&!reduced.matches&&root.dataset.input==='pointer')for(const child of Array.from(details.children).slice(1))child.animate([{opacity:.3},{opacity:1}],{duration:180,easing:'cubic-bezier(0.23,1,0.32,1)'});
}));
