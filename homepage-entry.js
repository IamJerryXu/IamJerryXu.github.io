(() => {
  'use strict';
  const root = document.documentElement;
  const finish = () => root.removeAttribute('data-home-entry');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // The reference timing extends to 2100ms for eight links. Remove its styles afterward,
  // including transform: translateY(0), so nothing persists into interactions.
  const cleanup = setTimeout(finish, 2180);
  const showImmediately = () => { clearTimeout(cleanup); finish(); };
  window.addEventListener('pagehide', showImmediately);
  window.addEventListener('pageshow', event => {
    if (event.persisted) showImmediately();
  });
  // Keyboard users and direct anchor navigation never wait for decoration.
  document.addEventListener('focusin', showImmediately, {once: true});
  window.addEventListener('hashchange', showImmediately, {once: true});
  if (motion.matches) showImmediately();
  motion.addEventListener('change', event => {
    if (event.matches) showImmediately();
  });
})();

// Animate only once a heading or paper actually enters the reading area.
// Nothing is pre-hidden, so anchors, find-in-page and restored scroll work immediately.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !('IntersectionObserver' in window) || !Element.prototype.animate ||
      !document.documentElement.hasAttribute('data-home-entry')) return;
  const animations = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      const animation = entry.target.animate([
        { opacity: .45, transform: 'translateY(9px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 360, easing: 'cubic-bezier(.17,.67,.2,1)' });
      animations.add(animation);
      animation.onfinish = () => animations.delete(animation);
    }
  });
  document.querySelectorAll('.page__content section:not(#about) > h2, .paper').forEach(item => observer.observe(item));
  const stop = () => {
    observer.disconnect();
    animations.forEach(animation => animation.cancel());
    animations.clear();
  };
  reduce.addEventListener('change', stop, { once: true });
  document.addEventListener('focusin', stop, { once: true });
  window.addEventListener('hashchange', stop, { once: true });
  window.addEventListener('pagehide', stop, { once: true });
})();
