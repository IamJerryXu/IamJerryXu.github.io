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
