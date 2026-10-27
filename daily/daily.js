'use strict';
// A disclosure of ordinary date links. Without JS they jump to each edition.
(() => {
  const filter = document.querySelector('#daily-filters');
  if (!filter) return;
  const button = document.querySelector('#daily-date-toggle');
  const panel = document.querySelector('#daily-date-panel');
  const label = document.querySelector('#daily-date-value');
  const links = [...panel.querySelectorAll('a[data-date]')];
  const days = [...document.querySelectorAll('.daily-day')];
  const count = document.querySelector('[data-daily-count]');
  const empty = document.querySelector('#daily-no-results');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = '', closingTimer = 0;
  const isOpen = () => button.getAttribute('aria-expanded') === 'true';
  function close(restoreFocus = false) {
    clearTimeout(closingTimer);
    button.setAttribute('aria-expanded', 'false');
    panel.inert = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.add('is-closing');
    if (restoreFocus) button.focus({preventScroll: true});
    if (reduced.matches) panel.hidden = true;
    else closingTimer = setTimeout(() => { panel.hidden = true; }, 180);
  }
  function open(focus = false) {
    clearTimeout(closingTimer);
    panel.hidden = false;
    panel.inert = false;
    panel.removeAttribute('aria-hidden');
    panel.classList.remove('is-closing');
    const bounds = button.getBoundingClientRect();
    const below = innerHeight - bounds.bottom - 24, above = bounds.top - 24;
    const upward = below < 160 && above > below;
    panel.dataset.placement = upward ? 'above' : 'below';
    panel.style.maxHeight = `${Math.max(88, Math.min(320, upward ? above : below))}px`;
    button.setAttribute('aria-expanded', 'true');
    if (focus) (links.find(link => link.dataset.date === selected) || links[0]).focus();
  }
  function apply() {
    let visible = 0;
    for (const day of days) {
      const papers = [...day.querySelectorAll('.daily-paper')];
      const match = !selected || day.dataset.date === selected;
      for (const paper of papers) paper.hidden = !match;
      day.hidden = !match || papers.length === 0;
      if (match) visible += papers.length;
    }
    count.textContent = String(visible);
    empty.hidden = visible !== 0;
    for (const link of links) {
      if (link.dataset.date === selected) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    const choice = links.find(link => link.dataset.date === selected).querySelector('[data-en]');
    label.dataset.en = choice.dataset.en;
    label.dataset.zh = choice.dataset.zh;
    label.textContent = document.documentElement.lang.startsWith('zh') ? choice.dataset.zh : choice.dataset.en;
  }
  function restore() {
    const value = new URLSearchParams(location.search).get('date') || '';
    selected = links.some(link => link.dataset.date === value) ? value : '';
    if (isOpen()) close(panel.contains(document.activeElement));
    apply();
  }
  function select(value) {
    selected = value;
    const url = new URL(location.href);
    if (selected) url.searchParams.set('date', selected);
    else url.searchParams.delete('date');
    url.searchParams.delete('tag');
    if (url.href !== location.href) history.pushState(null, '', url);
    apply();
    close(true);
  }
  button.hidden = false;
  panel.hidden = true;
  panel.inert = true;
  filter.classList.add('is-enhanced');
  button.addEventListener('click', () => isOpen() ? close() : open());
  button.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); open(true); }
  });
  for (const link of links) link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); select(link.dataset.date);
  });
  filter.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (!panel.contains(event.target)) return;
    const index = links.indexOf(document.activeElement);
    const next = {ArrowDown: (index + 1) % links.length, ArrowUp: (index - 1 + links.length) % links.length, Home: 0, End: links.length - 1}[event.key];
    if (next !== undefined) { event.preventDefault(); links[next].focus(); }
  });
  document.addEventListener('pointerdown', event => {
    if (isOpen() && !filter.contains(event.target)) close(panel.contains(document.activeElement));
  });
  document.addEventListener('focusin', event => {
    if (isOpen() && !filter.contains(event.target)) close();
  });
  reduced.addEventListener('change', () => { if (reduced.matches && !isOpen()) { clearTimeout(closingTimer); panel.hidden = true; } });
  window.addEventListener('popstate', restore);
  window.addEventListener('pageshow', restore);
  restore();
})();
