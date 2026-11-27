/* Keep the new last sidebar link reachable on short desktop viewports. */
(() => {
  const sidebar = document.querySelector('#main > .sidebar');
  const header = document.querySelector('.masthead');
  if (!sidebar || !header) return;
  let frame = 0;
  function measure() {
    frame = 0;
    const top = Math.min(header.offsetHeight + 10, innerHeight - sidebar.offsetHeight - 20);
    sidebar.style.setProperty('--profile-sticky-top', `${top}px`);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(measure); }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    observer.observe(sidebar); observer.observe(header);
  }
  addEventListener('resize', schedule, {passive:true});
  addEventListener('pageshow', schedule);
  addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; });
  document.fonts?.ready.then(schedule);
  measure();
})();
