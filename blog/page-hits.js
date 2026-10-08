'use strict';

// Shared page views from the public soxft Busuanzi service (not a local counter).
// Protocol: https://github.com/soxft/busuanzi/wiki/usage
// POST /api increments once and returns {success:true,data:{page_pv:number}}.
// The public /js currently points to https://bsz.iirose.cn/api. We do not load
// remote executable code, store visitor identity, or retry ambiguous requests.
(() => {
  if (location.hostname !== 'jerrysnow.me' || location.protocol !== 'https:') return;
  const slots = [...document.querySelectorAll('.article-hit-slot')];
  const canonical = document.querySelector('link[rel="canonical"]');
  if (!slots.length || !canonical) return;
  let page;
  try {
    page = new URL(canonical.href);
    if (page.origin !== 'https://jerrysnow.me' || !/^\/blog\/[^/]+\/$/.test(page.pathname)) return;
    const actualPath = location.pathname.replace(/\/index\.html$/, '/').replace(/\/?$/, '/');
    if (page.pathname !== actualPath) return;
    page.search = ''; page.hash = '';
  } catch { return; }
  const once = Symbol.for('jerrysnow:article-page-view-requested');
  if (window[once]) return;
  window[once] = true;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  fetch('https://bsz.iirose.cn/api', {
    method:'POST',
    mode:'cors',
    credentials:'omit',
    cache:'no-store',
    referrerPolicy:'no-referrer',
    headers:{'x-bsz-referer':page.href},
    signal:controller.signal
  }).then(response => {
    if (!response.ok) throw new Error('Page view service unavailable');
    return response.json();
  }).then(result => {
    const hits = result?.data?.page_pv;
    if (result?.success !== true || !Number.isSafeInteger(hits) || hits < 0) return;
    slots.forEach(slot => { slot.dataset.hits = String(hits); });
  }).catch(() => {
    // Unknown remains “—”. A failed response does not mean zero visits.
  }).finally(() => clearTimeout(timeout));
})();
