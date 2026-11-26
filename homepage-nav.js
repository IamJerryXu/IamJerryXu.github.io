(() => {
  const header = document.querySelector('.masthead');
  if (!header) return;
  const updateHeaderHeight = () => {
    document.documentElement.style.setProperty('--masthead-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
  };
  updateHeaderHeight();
  if ('ResizeObserver' in window) {
    new ResizeObserver(updateHeaderHeight).observe(header);
  } else {
    window.addEventListener('resize', updateHeaderHeight, { passive: true });
  }
})();

(() => {
  const nav = document.querySelector('.masthead .greedy-nav');
  if (!nav) return;
  const list = nav.querySelector('.visible-links');
  let hovered = null;

  function update() {
    const target = list.querySelector('a:focus-visible') || hovered;
    if (!target) {
      nav.removeAttribute('data-gliding');
      return;
    }

    // Offsets describe the resting layout even during the existing link entrance.
    let x = 0;
    let y = 0;
    for (let element = target; element && element !== nav; element = element.offsetParent) {
      x += element.offsetLeft;
      y += element.offsetTop;
    }
    nav.style.setProperty('--glide-x', (x - 4) + 'px');
    nav.style.setProperty('--glide-y', (y + 3) + 'px');
    nav.style.setProperty('--glide-width', (target.offsetWidth + 8) + 'px');
    nav.style.setProperty('--glide-height', Math.max(0,target.offsetHeight - 6) + 'px');
    if (!nav.hasAttribute('data-gliding')) {
      // Settle at the first link before enabling travel between links.
      getComputedStyle(nav,'::after').transform;
      nav.setAttribute('data-gliding','');
    }
  }

  list.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    hovered = event.target.closest('a');
    update();
  });
  list.addEventListener('pointerleave', () => { hovered = null; update(); });
  list.addEventListener('focusin', update);
  list.addEventListener('focusout', () => requestAnimationFrame(update));
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(list);
  new MutationObserver(update).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
})();
