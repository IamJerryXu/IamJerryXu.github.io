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
