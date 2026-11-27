(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cats = [];

  document.querySelectorAll('.home-cat-button').forEach((button) => {
    const head = button.querySelector('.home-cat-head');
    if (!head || button.dataset.catReady === 'true') return;
    button.dataset.catReady = 'true';
    button.dataset.catState = 'normal';
    button.setAttribute('type', 'button');
    if (!button.hasAttribute('aria-label') && !button.textContent.trim()) {
      button.setAttribute('aria-label', document.documentElement.lang.startsWith('zh')
        ? '摸摸小猫' : 'Pet the cat');
    }
    let count = 0;
    let angle = 0;
    let velocity = 0;
    let target = 0;
    let tension = 170;
    let friction = 25;
    let frame = 0;
    let previousTime = 0;
    let resetTimer = 0;

    function tick(time) {
      const elapsed = Math.min((time - previousTime) / 1000, 0.032);
      previousTime = time;
      // Small integration steps keep the spring steady on slow displays.
      const steps = Math.max(1, Math.ceil(elapsed / 0.004));
      const dt = elapsed / steps;
      for (let step = 0; step < steps; step += 1) {
        velocity += (-tension * (angle - target) - friction * velocity) * dt;
        angle += velocity * dt;
      }
      if (Math.abs(velocity) < 0.005 && Math.abs(angle - target) < 0.005) {
        angle = target;
        velocity = 0;
        frame = 0;
      } else {
        frame = requestAnimationFrame(tick);
      }
      head.style.transform = `rotate(${angle}deg)`;
    }

    function animate(nextTarget, nextTension, nextFriction) {
      target = nextTarget;
      tension = nextTension;
      friction = nextFriction;
      if (reducedMotion.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        angle = velocity = 0;
        head.style.transform = 'rotate(0deg)';
        return;
      }
      if (!frame) {
        previousTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    function reset() {
      clearTimeout(resetTimer);
      resetTimer = 0;
      button.dataset.catState = 'normal';
      animate(0, 170, 25);
    }

    function pet() {
      if (button.dataset.catState !== 'normal') return;
      count += 1;
      const playful = count % 8 === 0;
      button.dataset.catState = playful ? 'playful' : 'happy';
      animate(playful ? -5 : 6, playful ? 350 : 170, 10);
      resetTimer = window.setTimeout(reset, playful ? 450 : 220);
    }

    function stop() {
      clearTimeout(resetTimer);
      cancelAnimationFrame(frame);
      resetTimer = frame = 0;
      angle = velocity = target = 0;
      button.dataset.catState = 'normal';
      head.style.transform = 'rotate(0deg)';
    }

    button.addEventListener('click', pet);
    cats.push({ stop });
  });

  function stopAll() { cats.forEach((cat) => cat.stop()); }
  window.addEventListener('pagehide', stopAll);
  reducedMotion.addEventListener('change', stopAll);
})();
