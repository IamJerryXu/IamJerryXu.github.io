'use strict';
// The entire example remains readable when scripting is unavailable.
(() => {
  document.querySelectorAll('.article-example').forEach(example => {
    const controls = example.querySelector('.example-controls');
    const tabs = [...controls.querySelectorAll('button')];
    const panels = [...example.querySelectorAll('.example-panel')];
    if (!tabs.length || tabs.length !== panels.length) return;
    const select = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (focus) tabs[index].focus();
    };
    controls.setAttribute('role', 'tablist');
    tabs.forEach((tab, i) => {
      tab.setAttribute('role', 'tab');
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].tabIndex = 0;
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', event => {
        const key = event.key;
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
        event.preventDefault();
        const next = key === 'Home' ? 0 : key === 'End' ? tabs.length - 1 : (i + (key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        select(next, true);
      });
    });
    const panelGroup = example.querySelector('.example-panels');
    const measure = () => {
      // Reserve the tallest step at the current width, so switching never shifts the article.
      panelGroup.dataset.measuring = '';
      let height = 0;
      panels.forEach(panel => {
        const wasHidden = panel.hidden;
        panel.style.cssText = 'position:absolute;width:100%;visibility:hidden;';
        panel.hidden = false;
        height = Math.max(height, panel.getBoundingClientRect().height);
        panel.hidden = wasHidden;
        panel.removeAttribute('style');
      });
      panelGroup.style.setProperty('--example-panel-height', Math.ceil(height) + 'px');
      delete panelGroup.dataset.measuring;
    };
    let lastWidth = 0;
    const sizeObserver = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      if (width !== lastWidth) { lastWidth = width; measure(); }
    });
    sizeObserver.observe(panelGroup);
    new MutationObserver(measure).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    if (document.fonts) document.fonts.ready.then(measure);
    select(0);
    controls.hidden = false;
    example.classList.add('is-enhanced');
    measure();
  });
})();
