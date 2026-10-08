'use strict';
(() => {
 document.querySelectorAll('.track-scene').forEach(scene=>{
  const buttons=[...scene.querySelectorAll('.track-question')], notes=[...scene.querySelectorAll('[data-turn-note]')];
  const character=scene.querySelector('.track-character'), label=scene.querySelector('.track-request-label'), value=scene.querySelector('.track-request-value');
  const reduce=matchMedia('(prefers-reduced-motion:reduce)');let turn=0,raf=0,last=0,y=0,vy=0,windowX=0,windowV=0,moodTimer=0;
  const draw=()=>{character.style.setProperty('--hop',y+'px');character.style.setProperty('--nod',Math.max(-5,Math.min(5,vy*.015))+'deg');const squash=Math.max(-.035,Math.min(.035,vy*.0002));character.style.setProperty('--squash-x',1+squash);character.style.setProperty('--squash-y',1-squash);character.style.setProperty('--shadow-scale',1-Math.min(.18,Math.abs(y)*.015));scene.style.setProperty('--window-scale',Math.max(0,windowX));scene.style.setProperty('--window-opacity',Math.max(0,Math.min(1,windowX*2)));};
  const tick=now=>{const dt=Math.min((now-(last||now-16.67))/1000,.032);last=now;y+=(vy+=(-200*y-17*vy)/1.25*dt)*dt;windowX+=(windowV+=((turn-windowX)*200-23*windowV)*dt)*dt;draw();if(Math.abs(y)+Math.abs(vy)+Math.abs(turn-windowX)+Math.abs(windowV)>.02)raf=requestAnimationFrame(tick);else{raf=0;last=0;y=vy=windowV=0;windowX=turn;draw();}};
  const renderText=()=>{const zh=document.documentElement.lang.startsWith('zh');label.textContent=turn?(zh?'请求的视频片段':'Requested video interval'):(zh?'事件时刻':'Event time');value.textContent=turn?'0.5–1.2 s':'0.8 s';};
  const select=index=>{turn=index;scene.dataset.turn=String(turn);buttons.forEach((b,i)=>{b.classList.toggle('is-selected',i===turn);b.setAttribute('aria-pressed',String(i===turn));notes[i].hidden=i!==turn;});renderText();clearTimeout(moodTimer);character.dataset.mood=turn?'happy':'curious';moodTimer=setTimeout(()=>character.dataset.mood='neutral',900);if(reduce.matches){y=vy=windowV=0;windowX=turn;draw();return;}vy-=100;if(!raf)raf=requestAnimationFrame(tick);};
  buttons.forEach((b,i)=>{b.disabled=false;b.addEventListener('click',()=>select(i));});
  const settle=()=>{cancelAnimationFrame(raf);raf=0;last=0;y=vy=windowV=0;windowX=turn;draw();};
  new MutationObserver(renderText).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});new IntersectionObserver(e=>{if(!e[0].isIntersecting)settle();}).observe(scene);reduce.addEventListener('change',settle);window.addEventListener('pagehide',()=>{settle();clearTimeout(moodTimer);});
  scene.dataset.turn='0';renderText();draw();
 });
})();
