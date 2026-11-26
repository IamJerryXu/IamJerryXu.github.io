(() => {
  // Each small moving part belongs to the object: a signal, page, medal, tassel or handle.
  const drawings = {
    news: `<path class="section-tint" d="m6.8 20 3.5-9h3.4l3.5 9z"/>
      <path d="m8.4 16.4 7.2 0"/><circle class="section-dot" cx="12" cy="9" r="1.5"/>
      <g class="section-detail"><path d="M8.3 5.8a4.9 4.9 0 0 0 0 6.3m7.4-6.3a4.9 4.9 0 0 1 0 6.3M5.7 3.6a8.3 8.3 0 0 0 0 10.7m12.6-10.7a8.3 8.3 0 0 1 0 10.7"/></g>`,
    publications: `<path class="section-tint" d="M5.2 5.9h11.5a1.6 1.6 0 0 1 1.6 1.6v12.2H6.8a1.6 1.6 0 0 1-1.6-1.6z"/>
      <g class="section-detail"><path class="section-page" d="M8 3.1h7.2l4 4v9.8H8z"/><path d="M15.1 3.7v3.7h3.6M10.6 10.4h5.8m-5.8 2.8h4"/></g>`,
    honors: `<path class="section-tint" d="m8.5 12.4-2 8 4-1.9 1.6 2.8 1.4-6.6m2.2-2.3 2.1 7.9-3.8-1.8"/>
      <g class="section-detail"><circle class="section-page" cx="12" cy="9.2" r="6"/><path class="section-dot" d="m12 6.5.8 1.6 1.8.3-1.3 1.3.3 1.8-1.6-.8-1.6.8.3-1.8-1.3-1.3 1.8-.3z"/></g>`,
    education: `<path class="section-tint" d="M5.5 11.4v5.1c3.8 3.1 9.2 3.1 13 0v-5.1"/><path class="section-page" d="m2.5 9.5 9.5-5.1 9.5 5.1-9.5 5.1z"/>
      <g class="section-detail"><path d="M21.5 9.6v5"/><circle class="section-dot" cx="21.5" cy="16.3" r=".8"/></g>`,
    internships: `<g class="section-detail"><path d="M8.5 8.4V5.8c0-1 .8-1.7 1.7-1.7h3.6c.9 0 1.7.7 1.7 1.7v2.6"/></g>
      <rect class="section-tint" x="3" y="7.7" width="18" height="12.2" rx="2.5"/><path d="M3.3 11.4c5.5 2.7 11.9 2.7 17.4 0"/><path class="section-page" d="M10.5 12.2h3v2.6h-3z"/>`
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const observer = !reduced.matches && 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          entry.target.classList.add('section-glyph-arrives');
        }
      }, {threshold: .55})
    : null;

  for (const [id, drawing] of Object.entries(drawings)) {
    const heading = document.querySelector(`.page__content #${id} > h2`);
    if (!heading || heading.querySelector('.section-glyph')) continue;
    heading.classList.add('section-with-glyph');
    heading.insertAdjacentHTML('afterbegin', `<svg class="section-glyph" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${drawing}</svg>`);
    observer?.observe(heading.firstElementChild);
  }
  if (observer) reduced.addEventListener('change', event => {
    if (event.matches) observer.disconnect();
  });
})();
