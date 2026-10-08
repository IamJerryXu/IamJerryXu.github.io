'use strict';
(() => {
  const scene = document.querySelector('.portrait-scene');
  if (!scene) return;
  const toggle = scene.querySelector('.portrait-toggle');
  const universities = scene.querySelector('.portrait-universities');
  const schools = [...universities.querySelectorAll('a')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let pinned = false, preview = false, inView = true;
  const chinese = () => document.documentElement.lang.startsWith('zh');
  function render() {
    toggle.classList.toggle('is-memoji', pinned || preview);
    toggle.setAttribute('aria-pressed', String(pinned));
    toggle.setAttribute('aria-label', chinese()
      ? (pinned ? '收起校徽并切回照片' : '显示卡通头像与校徽')
      : (pinned ? 'Close university emblems and return to photo' : 'Show emoji portrait and university emblems'));
    scene.classList.toggle('is-expanded', pinned);
    universities.inert = !pinned;
    universities.setAttribute('aria-hidden', String(!pinned));
    schools.forEach(school => {
      school.tabIndex = pinned ? 0 : -1;
      school.setAttribute('aria-label', `${school.dataset[chinese() ? 'schoolZh' : 'schoolEn']}${chinese() ? '，打开学校官网（新窗口）' : ', open university website (new tab)'}`);
    });
  }
  toggle.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && matchMedia('(hover:hover)').matches) { preview = true; render(); }
  });
  toggle.addEventListener('pointerleave', () => { preview = false; render(); });
  toggle.addEventListener('focus', () => { if (toggle.matches(':focus-visible')) { preview = true; render(); } });
  toggle.addEventListener('blur', () => { preview = false; render(); });
  toggle.addEventListener('click', () => { pinned = !pinned; preview = false; render(); });
  scene.addEventListener('keydown', event => {
    if (event.key === 'Escape' && pinned) { event.preventDefault(); pinned = false; preview = false; render(); toggle.focus({preventScroll:true}); preview = false; render(); }
  });
  // Short, bounded springs run only while a pointer is interacting with an emblem.
  const springs = schools.map(school => {
    const state = {school,x:0,y:0,vx:0,vy:0,tx:0,ty:0,frame:0,time:0};
    const draw = () => { school.style.setProperty('--badge-x',`${state.x.toFixed(3)}px`); school.style.setProperty('--badge-y',`${state.y.toFixed(3)}px`); };
    const tick = now => {
      state.frame = 0;
      const dt = Math.min((now - (state.time || now - 16.67))/1000,.032); state.time = now;
      for (const [p,v,t] of [['x','vx','tx'],['y','vy','ty']]) { state[v] += ((state[t]-state[p])*220-state[v]*24)*dt; state[p] += state[v]*dt; }
      if (Math.abs(state.tx-state.x)+Math.abs(state.ty-state.y)+Math.abs(state.vx)+Math.abs(state.vy)<.02) {state.x=state.tx;state.y=state.ty;state.vx=state.vy=0;state.time=0;} else state.frame=requestAnimationFrame(tick);
      draw();
    };
    state.reset = () => { cancelAnimationFrame(state.frame);state.frame=0;state.time=0;state.x=state.y=state.vx=state.vy=state.tx=state.ty=0;draw(); };
    const target = (x,y) => { if(reduced.matches||document.hidden||!inView){state.reset();return;}state.tx=x;state.ty=y;if(!state.frame)state.frame=requestAnimationFrame(tick); };
    school.addEventListener('pointermove', e => {if(e.pointerType!=='mouse')return;const r=school.getBoundingClientRect();target((e.clientX-r.x-r.width/2)/r.width*5,(e.clientY-r.y-r.height/2)/r.height*5);});
    school.addEventListener('pointerleave', () => target(0,0));
    return state;
  });
  const pause = () => {scene.classList.toggle('is-paused',!inView||document.hidden);if(!inView||document.hidden){springs.forEach(s=>s.reset());}};
  new IntersectionObserver(entries => {inView=entries[0].isIntersecting;pause();}).observe(scene);
  document.addEventListener('visibilitychange',pause);
  reduced.addEventListener('change',()=>springs.forEach(s=>s.reset()));
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  render();
})();
