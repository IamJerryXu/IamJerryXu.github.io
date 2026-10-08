'use strict';
// Decorative opening shutters, kept separate from the working form controls.
(() => {
  const panel = document.querySelector('#rainbow-controls');
  if (!panel) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let cleanupTimer;
  function clear() {
    clearTimeout(cleanupTimer);
    panel.querySelectorAll('.panel-motion-layer').forEach(layer => layer.remove());
  }
  function element(className) {
    const node = document.createElement('div');
    node.className = className;
    return node;
  }
  function layerFor(host, className) {
    host.classList.add('panel-motion-host');
    const layer = element(`panel-motion-layer ${className}`);
    layer.setAttribute('aria-hidden', 'true');
    host.append(layer);
    return layer;
  }
  function shutters(host, stage) {
    if (!host) return;
    const layer = layerFor(host, 'panel-motion-shutters');
    layer.style.setProperty('--panel-stage-delay', `${250 + (stage - 1) * 100}ms`);
    layer.append(element('panel-motion-shadow'), element('panel-motion-cover panel-motion-cover--top'), element('panel-motion-cover panel-motion-cover--bottom'));
  }
  function doors(host) {
    if (!host) return;
    const layer = layerFor(host, 'panel-motion-doors');
    layer.append(element('panel-motion-shadow'));
    for (const side of ['left', 'right']) {
      const wrapper = element(`panel-motion-door-wrapper panel-motion-door-wrapper--${side}`);
      wrapper.append(element('panel-motion-door panel-motion-door--inner'), element('panel-motion-door panel-motion-door--outer'));
      layer.append(wrapper);
    }
  }
  function open() {
    clear();
    if (panel.hidden || reduced.matches) return;
    shutters(panel.querySelector('.console-density .console-rail'), 1);
    shutters(panel.querySelector('.console-rows .console-rail'), 2);
    panel.querySelectorAll('.console-toggle').forEach(host => shutters(host, 3));
    doors(panel.querySelector('#rainbow-segment-pad'));
    // Last visual is the XY-pad shadow: 700ms delay + 1200ms fade.
    cleanupTimer = setTimeout(clear, 1950);
  }
  new MutationObserver(records => {
    if (records.some(record => record.attributeName === 'hidden')) open();
  }).observe(panel, {attributes: true, attributeFilter: ['hidden']});
  reduced.addEventListener('change', () => { if (reduced.matches) clear(); });
  open();
})();
