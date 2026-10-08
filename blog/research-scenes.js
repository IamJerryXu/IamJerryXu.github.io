'use strict';
(() => {
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');
 document.querySelectorAll('.research-scene').forEach(scene=>{
  const faces=[...scene.querySelectorAll('.snow-character')];
  scene.addEventListener('pointermove',e=>{
   if(e.pointerType!=='mouse'||reduce.matches)return;
   faces.forEach(face=>{const r=face.getBoundingClientRect();const dx=e.clientX-r.x-r.width/2,dy=e.clientY-r.y-r.height/2;const near=Math.hypot(dx,dy)<260;face.style.setProperty('--look-x',(near?Math.max(-2,Math.min(2,dx/70)):0)+'px');face.style.setProperty('--look-y',(near?Math.max(-1.5,Math.min(1.5,dy/90)):0)+'px');});
  });
  scene.addEventListener('pointerleave',()=>faces.forEach(face=>{face.style.setProperty('--look-x','0px');face.style.setProperty('--look-y','0px');}));
 });
})();
