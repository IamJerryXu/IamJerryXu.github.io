'use strict';
// Progressive enhancement: every note remains readable without JavaScript.
(() => {
  const form = document.querySelector('#daily-filters');
  if (!form) return;
  const date = form.querySelector('[name="date"]');
  const tag = form.querySelector('[name="tag"]');
  const days = [...document.querySelectorAll('.daily-day')];
  const count = document.querySelector('[data-daily-count]');
  const empty = document.querySelector('#daily-no-results');
  const validValue = (select, value) => [...select.options].some(option => option.value === value) ? value : '';
  function apply() {
    let visible = 0;
    for (const day of days) {
      let dayCount = 0;
      for (const paper of day.querySelectorAll('.daily-paper')) {
        const match = (!date.value || day.dataset.date === date.value) && (!tag.value || paper.dataset.tags.split(' ').includes(tag.value));
        paper.hidden = !match;
        if (match) { dayCount += 1; visible += 1; }
      }
      day.hidden = dayCount === 0;
    }
    count.textContent = String(visible);
    empty.hidden = visible !== 0;
  }
  function restore() {
    const params = new URLSearchParams(location.search);
    date.value = validValue(date, params.get('date') || '');
    tag.value = validValue(tag, params.get('tag') || '');
    apply();
  }
  function save() {
    const url = new URL(location.href);
    for (const control of [date, tag]) {
      if (control.value) url.searchParams.set(control.name, control.value);
      else url.searchParams.delete(control.name);
    }
    // A real history entry lets Back/Forward restore a previous filter choice.
    if (url.href !== location.href) history.pushState(null, '', url);
    apply();
  }
  form.hidden = false;
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('change', save);
  form.addEventListener('reset', event => {
    event.preventDefault();
    date.value = ''; tag.value = ''; save();
  });
  window.addEventListener('popstate', restore);
  window.addEventListener('pageshow', restore);
  // Language changes rewrite option labels only; preserve the selected values.
  restore();
})();
