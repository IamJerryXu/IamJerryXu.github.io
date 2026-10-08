'use strict';
// Keep the reading position reflected in the table of contents.
(() => {
  const headings = [...document.querySelectorAll('.article-body h2[id]')];
  const links = [...document.querySelectorAll('.article-toc a')];
  if (!headings.length) return;
  let pending = false;
  function update() {
    pending = false;
    let active = headings[0];
    for (const heading of headings) if (heading.getBoundingClientRect().top <= 180) active = heading;
    for (const link of links) {
      if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  addEventListener('scroll', () => { if (!pending) {pending = true; requestAnimationFrame(update);} }, {passive:true});
  document.querySelectorAll('.mobile-toc a').forEach(link => link.addEventListener('click', () => {
    document.querySelector('.mobile-toc').open = false;
  }));
  update();
})();
// The footer character peeks out in stages and retreats when scrolling away.
(() => {
  const footer = document.querySelector('.site-footer');
  const character = document.querySelector('.footer-peek');
  if (!footer || !character) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const visibleSize = matchMedia('(min-width: 564px)');
  let offset = -226, target = -226, velocity = 0, last = 0, frame = 0, ratio = 0;
  function paint(){character.style.setProperty('--peek-offset', `${offset.toFixed(2)}px`);}
  function tick(now) {
    frame = 0;
    const dt = Math.min((now - (last || now - 16.7))/1000, .032);last=now;
    velocity += ((target-offset)*160 - velocity*25)*dt;offset += velocity*dt;
    paint();
    if(Math.abs(target-offset)>.08 || Math.abs(velocity)>.08) frame=requestAnimationFrame(tick);
    else {offset=target;last=0;paint();}
  }
  function update() {
    target = ratio < .2 ? -226 : ratio < .5 ? -150 : -82;
    if (reduced.matches || !visibleSize.matches || document.hidden) {
      cancelAnimationFrame(frame);frame=0;last=0;velocity=0;
      offset = reduced.matches ? -82 : target;paint();return;
    }
    if (!frame) frame=requestAnimationFrame(tick);
  }
  new IntersectionObserver(entries => {ratio=entries[0].intersectionRatio;update();},{threshold:[0,.2,.5,1]}).observe(footer);
  reduced.addEventListener('change',update);visibleSize.addEventListener('change',update);document.addEventListener('visibilitychange',update);paint();
})();
