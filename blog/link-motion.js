'use strict';
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Set(), controls = [];
  let frame = 0, previous = 0;
  // Reference gestures use tension 300 / friction 16, not a sustained hover transform.
  function tick(now) {
    frame = 0;
    const dt = Math.min((now - (previous || now - 16.67)) / 1000, .032);
    previous = now;
    for (const model of active) {
      let moving = false;
      model.values.forEach(value => {
        const before = value.target - value.x;
        value.v += (before * 300 - value.v * 16) * dt;
        value.x += value.v * dt;
        if ((model.clamp && before * (value.target - value.x) <= 0) ||
            (Math.abs(value.target - value.x) < .001 && Math.abs(value.v) < .001)) {
          value.x = value.target; value.v = 0;
        } else moving = true;
      });
      model.draw(model.values.map(value => value.x));
      if (!moving) active.delete(model);
    }
    if (active.size) frame = requestAnimationFrame(tick);
    else previous = 0;
  }
  function spring(initial, draw) {
    const model = {values: initial.map(x => ({x, target: x, v: 0})), draw, clamp: false};
    model.set = (targets, clamp = false, instant = reduce.matches) => {
      model.clamp = clamp;
      model.values.forEach((value, index) => {
        value.target = targets[index];
        if (instant) { value.x = value.target; value.v = 0; }
      });
      if (instant) { active.delete(model); draw(targets); }
      else { active.add(model); if (!frame) frame = requestAnimationFrame(tick); }
    };
    draw(initial);
    return model;
  }
  const shell = content => `<svg class="link-motion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;
  function mountClose(button) {
    button.innerHTML = shell('<line/><line/>');
    button.classList.add('has-close-motion');
    const lines = [...button.querySelectorAll('line')];
    const rest = [5, 5, 19, 19, 5, 19, 19, 5];
    const boop = [5, 7, 19, 17, 5, 17, 19, 7];
    const press = [3, 12, 21, 12, 3, 12, 21, 12];
    const model = spring(rest, values => lines.forEach((line, index) => {
      ['x1','y1','x2','y2'].forEach((name, offset) => line.setAttribute(name, values[index * 4 + offset]));
    }));
    let booped = false, pressed = false, began = 0, boopTimer = 0, pressTimer = 0;
    const update = () => model.set(reduce.matches ? rest : pressed ? press : booped ? boop : rest, pressed);
    const reset = (instant = false) => {
      clearTimeout(boopTimer); clearTimeout(pressTimer);
      booped = false; pressed = false; model.set(rest, false, instant || reduce.matches);
    };
    const startBoop = () => {
      if (reduce.matches) return;
      clearTimeout(boopTimer); booped = true; update();
      boopTimer = setTimeout(() => { booped = false; update(); }, 150);
    };
    const startPress = () => {
      clearTimeout(pressTimer); pressed = true; began = performance.now(); update();
    };
    const endPress = () => {
      if (!pressed) return;
      clearTimeout(pressTimer);
      // Preserve the existing click/dismiss handlers. Only the drawing has a minimum press time.
      const remaining = button.id === 'search-close' ? Math.max(0, 175 - (performance.now() - began)) : 0;
      pressTimer = setTimeout(() => { pressed = false; update(); }, remaining);
    };
    button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') startBoop(); });
    button.addEventListener('pointerdown', event => { if (event.button === 0) startPress(); });
    button.addEventListener('pointerleave', () => reset());
    button.addEventListener('pointercancel', () => reset());
    button.addEventListener('pointerup', endPress);
    button.addEventListener('click', endPress);
    button.addEventListener('focus', () => { if (button.matches(':focus-visible')) startBoop(); });
    button.addEventListener('blur', () => reset());
    button.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key) && !event.repeat) startPress(); });
    button.addEventListener('keyup', event => { if (['Enter', ' '].includes(event.key)) endPress(); });
    controls.push(reset);
  }
  function mountArrow(link) {
    const holder = link.querySelector(':scope > span:first-child');
    if (!holder || holder.getAttribute('aria-hidden') !== 'true') return;
    holder.classList.add('has-arrow-motion');
    holder.innerHTML = shell('<line x1="2" y1="12" x2="18" y2="12"/><polyline points="12 5 19 12 12 19"/>');
    const line = holder.querySelector('line'), head = holder.querySelector('polyline');
    const rest = [18, 12, 5, 19, 12, 12, 19];
    const model = spring(rest, values => {
      line.setAttribute('x2', values[0]);
      head.setAttribute('points', `${values[1]} ${values[2]} ${values[3]} ${values[4]} ${values[5]} ${values[6]}`);
    });
    let timer = 0;
    const reset = (instant = false) => { clearTimeout(timer); model.set(rest, false, instant || reduce.matches); };
    const start = () => {
      if (reduce.matches) return;
      clearTimeout(timer); model.set([23, 17, 6, 24, 12, 17, 18]);
      timer = setTimeout(() => reset(), 150);
    };
    link.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') start(); });
    link.addEventListener('pointerleave', () => reset());
    link.addEventListener('focus', () => { if (link.matches(':focus-visible')) start(); });
    link.addEventListener('blur', () => reset());
    controls.push(reset);
  }
  function mountTrash(button) {
    const lid = button.querySelector('.search-trash-lid');
    if (!lid) return;
    lid.style.transformBox = 'view-box';
    lid.style.transformOrigin = '50% 25%';
    const model = spring([0, 0], ([y, angle]) => {
      lid.style.transform = `translateY(${y}%) rotate(${angle}deg)`;
    });
    let timer = 0;
    const reset = (instant = false) => {
      clearTimeout(timer); model.set([0, 0], true, instant || reduce.matches);
    };
    const boop = () => {
      if (reduce.matches) return;
      clearTimeout(timer); model.set([-20, 12]);
      timer = setTimeout(() => reset(), 200);
    };
    button.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') boop(); });
    button.addEventListener('focus', () => { if (button.matches(':focus-visible')) boop(); });
    button.addEventListener('click', boop);
    button.addEventListener('blur', () => reset());
    new MutationObserver(() => { if (button.hidden) reset(true); }).observe(button, {attributes: true, attributeFilter: ['hidden']});
    controls.push(reset);
  }
  document.querySelectorAll('#search-clear').forEach(mountTrash);
  document.querySelectorAll('#search-close, #rainbow-close').forEach(mountClose);
  document.querySelectorAll('.elsewhere a').forEach(mountArrow);
  reduce.addEventListener('change', () => controls.forEach(reset => reset(true)));
  window.addEventListener('pagehide', () => {
    controls.forEach(reset => reset(true));
    cancelAnimationFrame(frame); frame = 0; previous = 0;
  });
})();
