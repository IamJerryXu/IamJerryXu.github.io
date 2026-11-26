(() => {
  'use strict';
  const root = document.documentElement;
  const about = document.querySelector('#about');
  const avatar = document.querySelector('.author__avatar');
  const main = document.querySelector('#main');
  const header = document.querySelector('.masthead');
  if (!about || !avatar || !main || !header) return;
  let frame = 0;
  function measure() {
    frame = 0;
    window.layoutHomeLandscape?.();
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(measure);
  }
  const updateHeader = () => header.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', updateHeader, {passive: true});
  addEventListener('resize', schedule, {passive: true});
  addEventListener('pageshow', schedule);
  new ResizeObserver(schedule).observe(about);
  new ResizeObserver(schedule).observe(avatar);
  new MutationObserver(schedule).observe(root, {attributes: true, attributeFilter: ['lang']});
  document.fonts?.ready.then(schedule);
  measure();
  updateHeader();
})();

// Use the same independent day/night and expression layers as the Blog.
(() => {
  const holder = document.querySelector('.home-companion');
  const character = holder?.querySelector('.home-character');
  if (!character) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let timer, gesture, entrance;
  let active = true;
  function reset() {
    clearTimeout(timer);
    character.classList.remove('is-happy');
    gesture?.cancel();
    entrance?.cancel();
  }
  character.addEventListener('click', () => {
    clearTimeout(timer);
    gesture?.cancel();
    character.classList.add('is-happy');
    if (!motion.matches) gesture = character.animate([
      {transform: 'translateY(0) rotate(0deg)'},
      {transform: 'translateY(2px) rotate(-3deg)', offset: .18},
      {transform: 'translateY(-7px) rotate(3deg)', offset: .5},
      {transform: 'translateY(0) rotate(0deg)'}
    ], {duration: 560, easing: 'cubic-bezier(.2,.7,.3,1)'});
    timer = setTimeout(() => character.classList.remove('is-happy'), 1200);
  });
  if (!motion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(async entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const mode = document.documentElement.dataset.theme === 'dark' ? 'night' : 'day';
      await character.querySelector(`.character-layer--${mode} .character-base`).decode().catch(() => {});
      if (active && !document.hidden && !motion.matches && document.activeElement !== character) entrance = holder.animate([
        {opacity: 0, transform: 'translateY(22px)'},
        {opacity: 1, transform: 'translateY(-3px)', offset: .8},
        {opacity: 1, transform: 'translateY(0)'}
      ], {duration: 700, easing: 'cubic-bezier(.17,.67,.2,1)'});
    }, {threshold: .2});
    observer.observe(holder);
    addEventListener('pagehide', () => observer.disconnect(), {once:true});
  }
  character.addEventListener('blur', reset);
  motion.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => {if (document.hidden) reset();});
  addEventListener('pagehide', () => {active = false; reset();});
  addEventListener('pageshow', () => {active = true;});
})();
