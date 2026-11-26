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
  const layoutObserver = new ResizeObserver(schedule);
  [about, avatar, main, header, document.querySelector('#news > h2')]
    .filter(Boolean).forEach(node => layoutObserver.observe(node));
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
      {transform: 'scale(.97)'},
      {transform: 'scale(1.015)', offset: .42},
      {transform: 'scale(.997)', offset: .72},
      {transform: 'scale(1)'}
    ], {duration: 460, easing: 'cubic-bezier(.2,.7,.3,1)'});
    timer = setTimeout(() => character.classList.remove('is-happy'), 800);
  });
  if (!motion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(async entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const mode = document.documentElement.dataset.theme === 'dark' ? 'night' : 'day';
      await character.querySelector(`.character-layer--${mode} .character-base`).decode().catch(() => {});
      if (active && !document.hidden && !motion.matches && document.activeElement !== character) entrance = holder.animate([
        {opacity: 0},
        {opacity: 1}
      ], {duration: 600, delay: 200, easing: 'ease', fill: 'backwards'});
    }, {threshold: .2});
    observer.observe(holder);
    addEventListener('pagehide', () => observer.disconnect(), {once:true});
  }
  character.addEventListener('focus', () => entrance?.cancel());
  character.addEventListener('blur', reset);
  motion.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => {if (document.hidden) reset();});
  addEventListener('pagehide', () => {active = false; reset();});
  addEventListener('pageshow', () => {active = true;});
})();
