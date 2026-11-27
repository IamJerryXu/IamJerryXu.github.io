/* Publication controls share the Blog's 300 / 16 spring gestures.
   Link navigation and citation copying remain native, immediate actions. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Set(), resets = [], disclosures = [];
  let frame = 0, previous = 0;
  function tick(now) {
    frame = 0;
    const dt = Math.min((now - (previous || now - 16.67)) / 1000, .032);
    previous = now;
    for (const model of active) {
      let moving = false;
      model.values.forEach(v => {
        v.v += ((v.target - v.x) * 300 - v.v * 16) * dt;
        v.x += v.v * dt;
        if (Math.abs(v.x - v.target) < .001 && Math.abs(v.v) < .001) {
          v.x = v.target; v.v = 0;
        } else moving = true;
      });
      model.draw();
      if (!moving) active.delete(model);
    }
    if (active.size) frame = requestAnimationFrame(tick);
    else previous = 0;
  }
  document.querySelectorAll('.paper-control').forEach(control => {
    const rest = [-2, 1, 0, 0, 0];
    const names = ['face-y', 'face-scale', 'icon-x', 'icon-y', 'icon-rotate'];
    const units = ['px', '', 'px', 'px', 'deg'];
    const model = {
      values: rest.map(x => ({x, target:x, v:0})),
      draw() { this.values.forEach((v, i) => control.style.setProperty(`--paper-${names[i]}`, v.x + units[i])); }
    };
    function set(target, instant = reduce.matches) {
      if (reduce.matches) target = rest;
      model.values.forEach((v, i) => {
        v.target = target[i];
        if (instant) { v.x = target[i]; v.v = 0; }
      });
      if (instant) { active.delete(model); model.draw(); }
      else { active.add(model); if (!frame) frame = requestAnimationFrame(tick); }
    }
    let hoverTimer = 0, releaseTimer = 0, pressed = false, began = 0;
    function reset() {
      clearTimeout(hoverTimer); clearTimeout(releaseTimer);
      pressed = false; control.removeAttribute('data-paper-pressed'); set(rest, true);
    }
    function boop() {
      if (reduce.matches || pressed) return;
      clearTimeout(hoverTimer);
      set(control.matches('a') ? [-4, 1, 1.8, -1.8, 0] : [-4, 1, 0, 0, -9]);
      hoverTimer = setTimeout(() => { if (!pressed) set(rest); }, 160);
    }
    function press() {
      if (pressed) return;
      clearTimeout(hoverTimer); clearTimeout(releaseTimer);
      pressed = true; began = performance.now(); control.dataset.paperPressed = 'true';
      set([0, .97, 0, 0, 0], true);
    }
    function release() {
      if (!pressed) return;
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => {
        pressed = false; control.removeAttribute('data-paper-pressed'); set(rest);
      }, Math.max(0, 100 - (performance.now() - began)));
    }
    control.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') boop(); });
    control.addEventListener('pointerleave', reset);
    control.addEventListener('pointerdown', e => { if (e.button === 0 && e.isPrimary !== false) press(); });
    control.addEventListener('pointercancel', reset);
    window.addEventListener('pointerup', release);
    control.addEventListener('keydown', e => {
      if (!e.repeat && (e.key === 'Enter' || (e.key === ' ' && !control.matches('a')))) press();
    });
    control.addEventListener('keyup', release);
    control.addEventListener('click', () => { if (!pressed) press(); release(); });
    control.addEventListener('focus', () => { if (control.matches(':focus-visible')) boop(); });
    control.addEventListener('blur', reset);
    resets.push(reset); model.draw();
  });

  document.querySelectorAll('.paper .citation').forEach(details => {
    const summary = details.querySelector('summary');
    const panel = details.querySelector('.citation-content');
    let desired = details.open, animation = null;
    function settle() {
      animation?.cancel(); animation = null;
      details.open = desired;
    }
    summary.addEventListener('click', event => {
      event.preventDefault(); desired = !desired;
      const currentOpacity = details.open ? getComputedStyle(panel).opacity : '0';
      animation?.cancel(); animation = null;
      if (reduce.matches || !panel.animate) { settle(); return; }
      details.open = true;
      const opening = desired;
      animation = panel.animate([
        {opacity: currentOpacity, transform: opening ? 'translateY(-5px)' : 'none'},
        {opacity: opening ? 1 : 0, transform: opening ? 'none' : 'translateY(-4px)'}
      ], {duration: opening ? 230 : 130, easing:'cubic-bezier(.17,.67,.2,1)'});
      animation.onfinish = settle;
    });
    disclosures.push(settle);
  });
  function clear() {
    resets.forEach(reset => reset()); disclosures.forEach(settle => settle());
    cancelAnimationFrame(frame); frame = 0; previous = 0;
  }
  window.addEventListener('blur', clear);
  window.addEventListener('pagehide', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') clear(); });
  reduce.addEventListener('change', clear);
})();
