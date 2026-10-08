'use strict';
(() => {
  document.querySelectorAll('.header-actions > *').forEach((item,index) => item.style.setProperty('--tool-order',index+1));
  const header=document.querySelector('.blog-article .site-header');
  if(header){
    const update=()=>header.classList.toggle('is-scrolled',scrollY>8);
    addEventListener('scroll',update,{passive:true});update();
  }
  document.querySelectorAll('.heading-anchor').forEach(link=>{
    let timer;
    const boop=()=>{clearTimeout(timer);link.classList.add('is-booped');timer=setTimeout(()=>link.classList.remove('is-booped'),150);};
    link.addEventListener('pointerenter',boop);link.addEventListener('focus',boop);
  });
})();
(() => {
  const scene=document.querySelector('.scene'),gear=document.querySelector('.rainbow-settings'),wrap=document.querySelector('.rainbow-tools');
  if(!scene||!gear||!wrap)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let shown=false,showTimer,hideTimer,pressed=false,frame=0,last=0;
  const angle={x:0,target:0,v:0},scale={x:1,target:1,v:0};let stiffness=300,damping=30;
  const reveal=()=>{shown=true;wrap.classList.add('is-revealed');};
  const hide=()=>{if(gear.getAttribute('aria-expanded')!=='true'&&!wrap.matches(':focus-within'))wrap.classList.remove('is-revealed');};
  scene.addEventListener('pointerenter',()=>{clearTimeout(hideTimer);clearTimeout(showTimer);showTimer=setTimeout(reveal,shown?0:2000);});
  scene.addEventListener('pointerleave',()=>{clearTimeout(showTimer);hideTimer=setTimeout(hide,1000);});
  gear.addEventListener('pointerenter',()=>clearTimeout(hideTimer));
  gear.addEventListener('focus',reveal);
  new MutationObserver(()=>{if(gear.getAttribute('aria-expanded')==='true'){clearTimeout(hideTimer);reveal();}else if(!scene.matches(':hover')){hideTimer=setTimeout(hide,1000);}}).observe(gear,{attributes:true,attributeFilter:['aria-expanded']});
  function draw(){gear.querySelector('svg').style.transform=`rotate(${angle.x}deg) scale(${scale.x})`;}
  function tick(now){frame=0;const dt=Math.min((now-(last||now-16.7))/1000,.032);last=now;let moving=false;
    for(const val of [angle,scale]){val.v+=((val.target-val.x)*stiffness-val.v*damping)*dt;val.x+=val.v*dt;if(Math.abs(val.target-val.x)>.001||Math.abs(val.v)>.001)moving=true;else{val.x=val.target;val.v=0;}}
    draw();if(moving)frame=requestAnimationFrame(tick);else last=0;
  }
  function wake(){if(reduced.matches){for(const val of [angle,scale]){val.x=val.target;val.v=0;}draw();}else if(!frame)frame=requestAnimationFrame(tick);}
  function down(){if(pressed)return;pressed=true;angle.target-=20;scale.target=.875;stiffness=600;damping=10;wake();}
  function up(){if(!pressed)return;pressed=false;angle.target+=160;scale.target=1;stiffness=300;damping=30;wake();}
  gear.addEventListener('pointerdown',e=>{if(e.button===0)down();});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  gear.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&!e.repeat)down();});gear.addEventListener('keyup',e=>{if(['Enter',' '].includes(e.key))up();});gear.addEventListener('blur',up);
  const checkPosition=()=>wrap.classList.toggle('is-obscured',gear.getBoundingClientRect().top<120);
  addEventListener('scroll',checkPosition,{passive:true});addEventListener('resize',checkPosition);checkPosition();
})();
// Keep tab navigation within the open console, while click-away remains available.
(() => {
  const panel=document.querySelector('#rainbow-controls');
  panel?.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const all=[...panel.querySelectorAll('button,input,select,[tabindex]')].filter(e=>!e.disabled&&e.tabIndex>=0&&e.getClientRects().length&&(!e.matches('input[type=radio]')||e.checked));
    const first=all[0],last=all[all.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });
})();
// Goodies opens the live rainbow controls without leaving the Blog landing page.
(() => {
  function openRainbow(){
    const gear=document.querySelector('.rainbow-settings');if(!gear)return false;
    document.querySelector('.scene').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});
    if(gear.getAttribute('aria-expanded')!=='true')gear.click();return true;
  }
  document.querySelectorAll('[data-open-rainbow]').forEach(link=>link.addEventListener('click',event=>{if(document.querySelector('.rainbow-settings')){event.preventDefault();setTimeout(openRainbow,0);}}));
  if(location.hash==='#rainbow')openRainbow();
})();
