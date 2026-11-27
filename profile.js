'use strict';
(() => {
  const scene = document.querySelector('.portrait-scene');
  if (!scene) return;
  const toggle = scene.querySelector('.portrait-toggle');
  const memoji = toggle.querySelector('.portrait--memoji');
  let pinned = false, preview = false;
  const chinese = () => document.documentElement.lang.startsWith('zh');
  function render() {
    toggle.classList.toggle('is-memoji', (pinned || preview) && memoji.naturalWidth > 0);
    toggle.classList.toggle('is-previewing', preview);
    toggle.setAttribute('aria-pressed', String(pinned));
    toggle.setAttribute('aria-label', chinese()
      ? (pinned ? '切回真人照片' : '显示卡通头像')
      : (pinned ? 'Show photo portrait' : 'Show cartoon portrait'));
    scene.classList.toggle('is-expanded', pinned);
  }
  memoji.addEventListener('load', render);
  toggle.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && matchMedia('(hover:hover)').matches) { preview = true; render(); }
  });
  toggle.addEventListener('pointerleave', () => { preview = false; render(); });
  toggle.addEventListener('focus', () => { if (toggle.matches(':focus-visible')) { preview = true; render(); } });
  toggle.addEventListener('blur', () => { preview = false; render(); });
  toggle.addEventListener('click', () => {
    pinned = !pinned;
    // An explicit return to the photo wins over the current hover/focus preview.
    // Preview is available again after the next pointer entry or keyboard focus.
    if (!pinned) preview = false;
    render();
  });
  scene.addEventListener('keydown', event => {
    if (event.key === 'Escape' && pinned) { event.preventDefault(); pinned = false; preview = false; render(); toggle.focus({preventScroll:true}); preview = false; render(); }
  });
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  render();
})();
