'use strict';
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const active = new Set();
  const models = [];
  let frame = 0, previous = 0, uniqueId = 0;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function tick(now) {
    frame = 0;
    const dt = Math.min((now - (previous || now - 16.67)) / 1000, .032);
    previous = now;
    for (const item of active) {
      let moving = false;
      for (const value of Object.values(item.values)) {
        if (now < value.start) { moving = true; continue; }
        if (reduce.matches) { value.x = value.target; value.v = 0; continue; }
        value.v += ((value.target - value.x) * value.k - value.v * value.c) * dt;
        value.x += value.v * dt;
        if (Math.abs(value.x - value.target) < .001 && Math.abs(value.v) < .001) { value.x = value.target; value.v = 0; }
        else moving = true;
      }
      item.draw();
      if (!moving) active.delete(item);
    }
    if (active.size) frame = requestAnimationFrame(tick);
    else previous = 0;
  }
  function spring(draw) {
    const item = {values: {}, draw: () => draw(Object.fromEntries(Object.entries(item.values).map(([key, v]) => [key, v.x])))};
    item.set = (targets, initial = false) => {
      for (const [key, spec] of Object.entries(targets)) {
        const [target, k = 300, c = 20, delay = 0] = Array.isArray(spec) ? spec : [spec];
        const value = item.values[key];
        if (!value || initial || reduce.matches) item.values[key] = {x: target, v: 0, target, k, c, start: 0};
        else if (value.target !== target) Object.assign(value, {target, k, c, start: performance.now() + delay});
      }
      if (initial || reduce.matches) { active.delete(item); item.draw(); }
      else { active.add(item); if (!frame) frame = requestAnimationFrame(tick); }
    };
    return item;
  }
  const svgShell = content => `<svg class="j-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;
  // GitHub and LinkedIn use standard Lucide outline geometry (ISC license).
  const shapes = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    rss: '<path class="rss-inner" d="M4 11a9 9 0 0 1 9 9"/><path class="rss-outer" d="M4 4a16 16 0 0 1 16 16"/><circle class="rss-dot" cx="5" cy="19" r="1" fill="currentColor"/>',
    sound: '<g class="speaker-shift"><path class="speaker-body" d="M12.0133 4.60757C11.9149 4.2957 11.5463 4.19331 11.2861 4.39151L5.93425 8.46914C5.84716 8.5355 5.74071 8.57143 5.63123 8.57143H1.5C1.22386 8.57143 1 8.79529 1 9.07143V14.9286C1 15.2047 1.22386 15.4286 1.5 15.4286H5.63123C5.74071 15.4286 5.84716 15.4645 5.93425 15.5309L11.2861 19.6085C11.5463 19.8067 11.9149 19.7043 12.0133 19.3924C12.3582 18.2999 13 15.7612 13 12C13 8.2388 12.3582 5.70014 12.0133 4.60757Z"/></g><path class="sound-wave-inner" d="M17.54 8.46002C18.4774 9.39766 19.004 10.6692 19.004 11.995C19.004 13.3208 18.4774 14.5924 17.54 15.53"/><path class="sound-wave-outer" d="M20.0703 4.92999C21.945 6.80527 22.9982 9.34835 22.9982 12C22.9982 14.6516 21.945 17.1947 20.0703 19.07"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
    scholar: '<path d="m2 9 10-5 10 5-10 5-10-5Z"/><path d="M6 11v6c3 2 9 2 12 0v-6M22 9v7"/>'
  };
  function searchShape() {
    const id = `blog-search-shine-${++uniqueId}`;
    return `<defs><clipPath id="${id}"><ellipse cx="11" cy="11" rx="5.1" ry="4.59" transform="rotate(-20 11 11)"/></clipPath></defs><g class="search-shine" clip-path="url(#${id})"><ellipse class="search-shine-sweep" cx="11" cy="11" rx="6" ry="5.4" fill="white" stroke="none"/></g>${shapes.search}`;
  }
  function themeShape() {
    const id = `blog-theme-${++uniqueId}`;
    return `<defs><mask id="${id}-cut"><rect width="24" height="24" fill="white" stroke="none"/><circle class="theme-cut" cx="12" cy="-4" r="8" fill="black" stroke="none"/></mask><mask id="${id}-edge"><rect width="24" height="24" fill="black" stroke="none"/><circle class="theme-envelope" cx="12" cy="12" r="7" fill="white" stroke="none"/></mask></defs><g class="theme-dots">${Array.from({length:8},(_,i)=>`<circle data-angle="${i*Math.PI/4}" cx="${12+10*Math.cos(i*Math.PI/4)}" cy="${12+10*Math.sin(i*Math.PI/4)}" r="1.5" fill="currentColor" stroke="none"/>`).join('')}</g><g mask="url(#${id}-cut)"><circle class="theme-center" cx="12" cy="12" r="6"/></g><g mask="url(#${id}-edge)"><circle class="theme-crescent" cx="12" cy="-4" r="8"/></g>`;
  }
  function mount(button, type) {
    if (!button || button.dataset.iconReady) return;
    button.dataset.iconReady = type;
    button.querySelectorAll(':scope > svg').forEach(svg => svg.remove());
    button.insertAdjacentHTML('afterbegin', svgShell(type === 'theme' ? themeShape() : type === 'search' ? searchShape() : shapes[type]));
    const svg = button.querySelector('.j-icon');
    const find = name => svg.querySelector(`.${name}`);
    const model = {button, type, booped: false, timer: 0};
    const animator = spring(v => {
      if (type === 'search') {
        svg.style.transform = `scale(${v.scale}) rotate(${v.rotate}deg)`;
        find('search-shine-sweep').setAttribute('transform', `rotate(-20 11 11) translate(${v.shine} 0)`);
      }
      if (type === 'rss') {
        find('rss-inner').setAttribute('d', `M4 ${20-v.inner}a${v.inner} ${v.inner} 0 0 1 ${v.inner} ${v.inner}`);
        find('rss-outer').setAttribute('d', `M4 ${20-v.outer}a${v.outer} ${v.outer} 0 0 1 ${v.outer} ${v.outer}`);
        find('rss-dot').setAttribute('r', Math.max(.1,v.dot));
      }
      if (type === 'sound') {
        find('speaker-body').style.transform = `rotate(${v.rotate}deg)`;
        find('sound-wave-inner').style.transform = `translateX(${v.inner}px)`;
        find('sound-wave-outer').style.transform = `translateX(${v.outer}px)`;
      }
      if (type === 'theme') {
        svg.style.transform = `rotate(${v.rotate}deg)`;
        find('theme-center').setAttribute('r',Math.max(.1,v.radius));
        find('theme-cut').setAttribute('cy',v.cut);
        find('theme-crescent').setAttribute('cy',v.cut);
        find('theme-envelope').setAttribute('r',v.envelope);
        find('theme-dots').style.opacity = clamp(v.dots,0,1);
        svg.querySelectorAll('[data-angle]').forEach(dot => {
          const a = Number(dot.dataset.angle);
          dot.setAttribute('cx',12+v.orbit*Math.cos(a)); dot.setAttribute('cy',12+v.orbit*Math.sin(a));
        });
      }
    });
    model.update = (initial = false) => {
      const boop = model.booped && !reduce.matches;
      if (type === 'search') animator.set({scale:[boop?1.1:1,300,10],rotate:[boop?8:0,300,10],shine:[boop?-4.8:6,300,12]},initial);
      if (type === 'rss') animator.set({dot:[boop?2:1,300,22],inner:[boop?11:9,300,18,66.4],outer:[boop?18:16,250,12,132.8]},initial);
      if (type === 'sound') {
        const enabled = document.querySelector('#sound-toggle')?.getAttribute('aria-pressed') === 'true';
        if (initial || model.soundEnabled !== enabled) {
          const instant = initial || reduce.matches;
          find('speaker-shift').style.transition = instant ? 'none' : `transform 300ms ${enabled ? 0 : 150}ms`;
          find('speaker-shift').style.transform = `translateX(${enabled ? 0 : 5}px)`;
          find('sound-wave-inner').style.transition = instant ? 'none' : `opacity 200ms ${enabled ? 0 : 150}ms`;
          find('sound-wave-outer').style.transition = instant ? 'none' : `opacity 200ms ${enabled ? 150 : 0}ms`;
          find('sound-wave-inner').style.opacity = enabled ? 1 : 0;
          find('sound-wave-outer').style.opacity = enabled ? 1 : 0;
          model.wiggle?.cancel();
          if (!instant && enabled && model.soundEnabled === false) {
            model.wiggle = find('speaker-body').animate([0,15,-13,12,0].map(angle => ({transform:`rotate(${angle}deg)`})), {duration:350,easing:'ease'});
          }
          model.soundEnabled = enabled;
        }
        animator.set({rotate:[boop&&!enabled?-10:0,300,15],inner:[boop&&enabled?1.5:0,300,15],outer:[boop&&enabled?2:0,300,15,50]},initial);
      }
      if (type === 'theme') {
        const dark = root.dataset.theme === 'dark';
        animator.set({rotate:[dark?(boop?28:40):90,160,30],radius:[dark?9.5:boop?4:6,boop?300:160,boop?20:30],cut:[dark?4:-4,160,30],envelope:[dark?10.5:7,160,30],dots:[dark?0:1,210,20],orbit:[boop?9:10,300,20]},initial);
      }
    };
    const end = () => { clearTimeout(model.timer); model.booped=false; model.update(); };
    const start = () => {
      if (reduce.matches) return;
      clearTimeout(model.timer); model.booped=true; model.update();
      model.timer=setTimeout(end,150);
    };
    button.addEventListener('pointerenter', event => { if(event.pointerType!=='touch') start(); });
    button.addEventListener('pointerleave',end);
    button.addEventListener('focus', () => { if(button.matches(':focus-visible')) start(); });
    button.addEventListener('blur',end);
    model.update(true);
    if (type === 'theme' && root.dataset.theme !== 'dark' && !reduce.matches) {
      const base = button.closest('.header-actions') ? 200 : 0;
      const order = [7,5,3,1,0,2,4,6];
      svg.querySelectorAll('.theme-dots circle').forEach((dot,index) => dot.style.setProperty('--ray-delay', `${base+order[index]*40}ms`));
      svg.classList.add('theme-rays-enter');
    }
    models.push(model);
  }
  const header = {search:document.querySelector('#search-toggle'),sound:document.querySelector('#sound-toggle'),theme:document.querySelector('#theme-toggle')};
  Object.entries(header).forEach(([type,button])=>mount(button,type));
  const labels = {'RSS':'rss','Google Scholar':'scholar','GitHub':'github','LinkedIn':'linkedin'};
  Object.entries(labels).forEach(([label,type])=>document.querySelectorAll(`a[aria-label="${label}"]`).forEach(button=>mount(button,type)));
  document.querySelectorAll('[data-toolbar-action]').forEach(button=>{
    const type=button.dataset.toolbarAction;
    if(!header[type])return;
    mount(button,type);
    button.addEventListener('click',()=>header[type].click());
  });
  function sync() {
    const zh=root.lang.startsWith('zh');
    const searchLabel=zh?'搜索':'Search';
    header.search?.setAttribute('aria-label',searchLabel);
    if(header.search)header.search.title=zh?'搜索 (⌘ K)':'Search (⌘ K)';
    document.querySelectorAll('[data-toolbar-action]').forEach(button=>{
      const source=header[button.dataset.toolbarAction]; if(!source)return;
      ['aria-label','aria-pressed','aria-expanded','title'].forEach(name=>{
        const value=source.getAttribute(name);
        if(value===null)button.removeAttribute(name);else button.setAttribute(name,value);
      });
    });
    models.forEach(model=>model.update());
  }
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-theme','lang']});
  if(header.sound)new MutationObserver(sync).observe(header.sound,{attributes:true,attributeFilter:['aria-pressed','aria-label']});
  if(header.search)new MutationObserver(()=>{
    document.querySelectorAll('[data-toolbar-action="search"]').forEach(button=>button.setAttribute('aria-expanded',header.search.getAttribute('aria-expanded')||'false'));
  }).observe(header.search,{attributes:true,attributeFilter:['aria-expanded']});
  reduce.addEventListener('change',()=>{models.forEach(model=>{clearTimeout(model.timer);model.booped=false;model.wiggle?.cancel();model.update(true);});});
  sync();
})();
