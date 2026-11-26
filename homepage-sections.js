(() => {
  // Each small moving part belongs to the object: a signal, page, medal, tassel or handle.
  const drawings = {
    news: `<path class="section-tint" d="m6.8 20 3.5-9h3.4l3.5 9z"/>
      <path d="m8.4 16.4 7.2 0"/><circle class="section-dot" cx="12" cy="9" r="1.5"/>
      <g class="section-detail"><path class="signal-inner" d="M8.3 5.8a4.9 4.9 0 0 0 0 6.3m7.4-6.3a4.9 4.9 0 0 1 0 6.3"/><path class="signal-outer" d="M5.7 3.6a8.3 8.3 0 0 0 0 10.7m12.6-10.7a8.3 8.3 0 0 1 0 10.7"/></g>`,
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
  const models = [];
  const motions = {
    publications: ['none', 'translate(2px,-3px) rotate(12deg)', 'translate(-.5px,.5px) rotate(-4deg)', 'none'],
    honors: ['none', 'rotate(-20deg)', 'rotate(12deg)', 'rotate(-5deg)', 'none'],
    education: ['none', 'rotate(-32deg)', 'rotate(20deg)', 'rotate(-9deg)', 'none'],
    internships: ['none', 'translateY(-3px) scaleX(1.12)', 'translateY(.7px)', 'none']
  };
  function animate(model, element, frames, options) {
    const animation = element.animate(frames, options);
    model.animations.add(animation);
    animation.onfinish = () => model.animations.delete(animation);
  }
  function stop(model) {
    clearTimeout(model.timer);
    model.animations.forEach(animation => animation.cancel());
    model.animations.clear();
  }
  function schedule(model) {
    clearTimeout(model.timer);
    if (model.visible && !reduced.matches && !document.hidden)
      model.timer = setTimeout(() => play(model, false), 5800 + model.index * 370);
  }
  function play(model, arrival = false) {
    const startTransform = getComputedStyle(model.svg).transform;
    stop(model);
    if (reduced.matches || document.hidden || !model.visible) return;
    const easing = 'cubic-bezier(.22,.7,.25,1)';
    // The heading stays still; its drawing has an independent spring envelope.
    animate(model, model.svg, [
      {transform: arrival ? 'translateY(5px) scale(.78) rotate(-12deg)' : startTransform},
      {transform: 'translateY(-2px) scale(1.13) rotate(-5deg)', offset: .32},
      {transform: 'translateY(.7px) scale(.98) rotate(2deg)', offset: .65},
      {transform: 'none'}
    ], {duration: 760, easing});
    if (model.id === 'news') {
      for (const [index, wave] of [...model.svg.querySelectorAll('.signal-inner,.signal-outer')].entries()) {
        animate(model, wave, [
          {transform:'scale(.86)',opacity:.45},
          {transform:'scale(1.16)',opacity:1,offset:.38},
          {transform:'scale(1.28)',opacity:.15,offset:.72},
          {transform:'scale(1)',opacity:1}
        ], {duration:1000,delay:index*150,easing});
      }
    } else {
      animate(model, model.svg.querySelector('.section-detail'),
        motions[model.id].map(transform => ({transform})), {duration:1050,easing});
    }
    schedule(model);
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      const model = models.find(item => item.svg === entry.target);
      if (!model) continue;
      model.visible = entry.isIntersecting;
      if (model.visible) { play(model, !model.seen); model.seen = true; }
      else stop(model);
    }
  }, {threshold:.3}) : null;
  for (const [index, [id, drawing]] of Object.entries(drawings).entries()) {
    const heading = document.querySelector(`.page__content #${id} > h2`);
    if (!heading || heading.querySelector('.section-glyph')) continue;
    heading.classList.add('section-with-glyph');
    heading.insertAdjacentHTML('afterbegin', `<svg class="section-glyph" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${drawing}</svg>`);
    const model = {id, index, svg:heading.firstElementChild, visible:false, seen:false, timer:0, animations:new Set()};
    models.push(model);
    if (!Element.prototype.animate) continue;
    observer?.observe(model.svg);
    heading.addEventListener('pointerenter', event => { if(event.pointerType !== 'touch') play(model); });
    heading.addEventListener('pointerdown', event => { if(event.pointerType === 'touch') play(model); });
  }
  reduced.addEventListener('change', () => models.forEach(model => {
    stop(model);
    if (!reduced.matches) schedule(model);
  }));
  document.addEventListener('visibilitychange', () => models.forEach(model => {
    stop(model);
    if (!document.hidden) schedule(model);
  }));
  addEventListener('pagehide', () => models.forEach(stop));
  addEventListener('pageshow', event => { if(event.persisted) models.forEach(schedule); });
})();
