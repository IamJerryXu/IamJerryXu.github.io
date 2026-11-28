/* Keep the new last sidebar link reachable on short desktop viewports. */
(() => {
  const sidebar = document.querySelector('#main > .sidebar');
  const header = document.querySelector('.masthead');
  if (!sidebar || !header) return;
  let frame = 0;
  function measure() {
    frame = 0;
    const top = Math.min(header.offsetHeight + 10, innerHeight - sidebar.offsetHeight - 20);
    sidebar.style.setProperty('--profile-sticky-top', `${top}px`);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(measure); }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    observer.observe(sidebar); observer.observe(header);
  }
  addEventListener('resize', schedule, {passive:true});
  addEventListener('pageshow', schedule);
  addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; });
  document.fonts?.ready.then(schedule);
  measure();
})();

// JOY promo spring parameters: title 150/10 and 150/8; button 300/10.
(() => {
  const note = document.querySelector('.home-project-promo');
  if (!note) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const jobs = new Set(), timers = new Set();
  let frame = 0, previous = 0, revealed = false;
  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id); return id;
  }
  function tick(time) {
    frame = 0;
    const dt = Math.min((time - (previous || time - 16.67)) / 1000, .032);
    previous = time;
    for (const spring of jobs) {
      let moving = false;
      spring.values.forEach(value => {
        value.v += ((value.to - value.x) * spring.tension - value.v * spring.friction) * dt;
        value.x += value.v * dt;
        if (Math.abs(value.x - value.to) < .0001 && Math.abs(value.v) < .0001) { value.x = value.to; value.v = 0; }
        else moving = true;
      });
      spring.draw(spring.values.map(value => value.x));
      if (!moving) jobs.delete(spring);
    }
    if (jobs.size) frame = requestAnimationFrame(tick); else previous = 0;
  }
  function model(start, draw, tension, friction) {
    const spring = {values:start.map(x => ({x,v:0,to:x})), draw, tension, friction};
    spring.set = (targets, immediate = reduce.matches) => {
      spring.values.forEach((value,i) => { value.to = targets[i]; if (immediate) {value.x = value.to;value.v = 0;} });
      if (immediate) {jobs.delete(spring); draw(targets);}
      else {jobs.add(spring); if (!frame) frame = requestAnimationFrame(tick);}
    };
    draw(start); return spring;
  }
  const words = [...note.querySelectorAll('.astra-word')];
  const letters = words.map((word,i) => model([1,0,0], ([scale,rotate,y]) => {
    word.style.transform = `translateY(${y}px) rotate(${rotate}deg) scale(${scale})`;
  },150,i ? 8 : 10));
  const button = note.querySelector('.astra-promo-link');
  const arrow = button.querySelector('svg');
  const arrowSpring = model([0], ([x]) => {arrow.style.transform = `translateX(${x}px)`;},300,10);
  let boopTimer;
  function boop() {
    if (reduce.matches) return;
    clearTimeout(boopTimer); timers.delete(boopTimer);
    arrowSpring.set([2]); boopTimer = later(() => arrowSpring.set([0]),150);
  }
  function release() {button.dataset.pressed = 'false';}
  button.addEventListener('pointerenter', event => {if (event.pointerType !== 'touch') boop();});
  button.addEventListener('focus', () => {if (button.matches(':focus-visible')) boop();});
  button.addEventListener('pointerdown', event => {if (event.button === 0) button.dataset.pressed = 'true';});
  ['pointerup','pointercancel','pointerleave','blur'].forEach(type => button.addEventListener(type,release));
  button.addEventListener('keydown', event => {if (event.key === 'Enter') button.dataset.pressed = 'true';});
  button.addEventListener('keyup',release);
  function reveal() {
    if (revealed) return;
    revealed = true;
    if (reduce.matches) {note.dataset.reveal = 'visible';return;}
    letters.forEach(letter => letter.set([.85,-8,0],true));
    later(() => {
      note.dataset.reveal = 'visible';
      letters.forEach((letter,index) => later(() => letter.set([1,0,0]),200 + index * 40));
    },500);
  }
  let observer;
  if ('IntersectionObserver' in window && !reduce.matches && document.documentElement.hasAttribute('data-home-entry')) {
    note.dataset.reveal = 'waiting';
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {observer.disconnect();reveal();}
    },{threshold:0,rootMargin:'0px 0px 80px 0px'});
    observer.observe(note);
  } else finish();
  function finish() {
    timers.forEach(clearTimeout);timers.clear();observer?.disconnect();revealed = true;
    note.dataset.reveal = 'settled';letters.forEach(letter => letter.set([1,0,0],true));
    arrowSpring.set([0],true);release();cancelAnimationFrame(frame);frame = 0;previous = 0;
  }
  reduce.addEventListener('change', () => {if (reduce.matches) finish();});
  addEventListener('pagehide',finish);
  note.addEventListener('focusin',finish);
  addEventListener('hashchange',finish,{once:true});
  document.addEventListener('home:entry-skip',finish,{once:true});
})();
