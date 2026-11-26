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
