'use strict';
(() => {
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');
 // The scene changes immediately; a short retained press makes even a quick tap legible.
 const selector='.research-scene .scene-press, .research-scene .pos-verify, .research-scene .track-question';
 const releases=new Map(), recent=new WeakMap();
 let held=null;
 const sound=kind=>document.dispatchEvent(new CustomEvent('blog:scene-sound',{detail:{kind}}));
 const controlFor=target=>target instanceof Element?target.closest(selector):null;
 const clearPress=control=>{clearTimeout(releases.get(control));releases.delete(control);control.removeAttribute('data-scene-pressed');};
 const cancel=()=>{
  if(held)clearPress(held.control);
  held=null;
  for(const control of releases.keys())clearPress(control);
  sound('stop');
 };
 const press=(control,source,id)=>{
  if(!control||control.disabled||control.getAttribute('aria-disabled')==='true')return;
  cancel();
  held={control,source,id,started:performance.now()};
  recent.set(control,performance.now());
  control.dataset.scenePressed='true';
  sound('press');
 };
 const release=()=>{
  if(!held)return;
  const {control,started}=held;
  held=null;recent.set(control,performance.now());
  releases.set(control,setTimeout(()=>{
   clearPress(control);
   sound('release');
  },Math.max(0,100-(performance.now()-started))));
 };
 document.addEventListener('pointerdown',event=>{
  if(event.button===0&&event.isPrimary!==false)press(controlFor(event.target),'pointer',event.pointerId);
 },true);
 window.addEventListener('pointerup',event=>{
  if(held?.source!=='pointer'||held.id!==event.pointerId)return;
  const under=document.elementFromPoint(event.clientX,event.clientY);
  if(under&&held.control.contains(under))release();else cancel();
 },true);
 window.addEventListener('pointercancel',event=>{if(held?.id===event.pointerId)cancel();},true);
 document.addEventListener('keydown',event=>{
  if(!event.repeat&&[' ','Enter'].includes(event.key))press(controlFor(event.target),'key',event.key);
 },true);
 document.addEventListener('keyup',event=>{
  if(held?.source==='key'&&held.id===event.key)release();
 },true);
 document.addEventListener('click',event=>{
  // Keyboard clicks already have their down/up pair; support assistive activation too.
  const control=controlFor(event.target);
  if(!control||event.detail!==0||held?.control===control||performance.now()-(recent.get(control)??-Infinity)<500)return;
  press(control,'assistive',null);release();
 },true);
 document.addEventListener('focusout',event=>{if(held?.source==='key'&&event.target===held.control)cancel();});
 window.addEventListener('blur',cancel);
 window.addEventListener('pagehide',cancel);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});

 document.querySelectorAll('.research-scene').forEach(scene=>{
  const faces=[...scene.querySelectorAll('.snow-character')];
  scene.addEventListener('pointermove',e=>{
   if(e.pointerType!=='mouse'||reduce.matches)return;
   faces.forEach(face=>{const r=face.getBoundingClientRect();const dx=e.clientX-r.x-r.width/2,dy=e.clientY-r.y-r.height/2;const near=Math.hypot(dx,dy)<260;face.style.setProperty('--look-x',(near?Math.max(-2,Math.min(2,dx/70)):0)+'px');face.style.setProperty('--look-y',(near?Math.max(-1.5,Math.min(1.5,dy/90)):0)+'px');});
  });
  scene.addEventListener('pointerleave',()=>faces.forEach(face=>{face.style.setProperty('--look-x','0px');face.style.setProperty('--look-y','0px');}));
 });
})();
