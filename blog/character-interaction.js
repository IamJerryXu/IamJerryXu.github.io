/* Shared with the Blog's link gestures: tension 300 / friction 16.
   Only active springs request frames; the seated character's feet stay anchored. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.character-interactive').forEach(character => {
    const pet = character.querySelector('.character-pet');
    const rest = [1, 0, 0];
    const values = rest.map(x => ({x, target:x, v:0}));
    const timers = new Set();
    let frame = 0, previous = 0, pressed = false, playing = false, sequence = 0;
    // Decode both lighting variants before showing a new pose, including when
    // the user switches themes during the bite. Failed assets keep the rest pose.
    const framesReady = Promise.all([...character.querySelectorAll('.character-pet-art')].map(image =>
      image.decode().then(() => image.naturalWidth > 0, () => false)
    )).then(results => results.length > 0 && results.every(Boolean));
    function later(delay, callback) {
      const timer = setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
      return timer;
    }
    function draw() {
      character.style.scale = values[0].x;
      if (pet) {
        pet.style.setProperty('--pet-y', `${values[1].x}px`);
        pet.style.setProperty('--pet-rotate', `${values[2].x}deg`);
      }

    }
    function tick(now) {
      frame = 0;
      const dt = Math.min((now - (previous || now - 16.67)) / 1000, .032);
      previous = now;
      let moving = false;
      for (const value of values) {
        value.v += ((value.target - value.x) * 300 - value.v * 16) * dt;
        value.x += value.v * dt;
        if (Math.abs(value.target - value.x) < .001 && Math.abs(value.v) < .001) {
          value.x = value.target; value.v = 0;
        } else moving = true;
      }
      draw();
      if (moving) frame = requestAnimationFrame(tick);
      else previous = 0;
    }
    function set(targets, instant = reduce.matches) {
      // Reduced motion keeps the same readable story without scaling or bouncing.
      if (reduce.matches) targets = rest;
      values.forEach((value, index) => {
        value.target = targets[index];
        if (instant) {value.x = targets[index]; value.v = 0;}
      });
      if (instant) {cancelAnimationFrame(frame); frame = 0; previous = 0; draw();}
      else if (!frame) frame = requestAnimationFrame(tick);
    }
    function reset() {
      sequence++;
      timers.forEach(clearTimeout);
      timers.clear();
      pressed = false; playing = false;
      character.classList.remove('is-happy', 'is-greeting', 'is-discovering', 'is-biting');
      character.dataset.petPose = 'rest';
      set(rest, true);
    }
    function press() {
      if (pressed || playing) return;
      pressed = true;
      if (!reduce.matches) {
        values[0].x = .975;
        const targets = values.map(value => value.target); targets[0] = .965;
        set(targets); draw();
      }
    }
    function release() {
      if (!pressed) return;
      pressed = false;
      const targets = values.map(value => value.target); targets[0] = 1;
      set(targets);
    }
    function pose(name) {
      character.dataset.petPose = name;
      character.classList.toggle('is-biting', name === 'bite' || name === 'chew');
      // The new pictures carry the whole gesture. Keep the body planted instead
      // of competing with their arm/mouth changes using a second bounce.
      set(rest);
    }
    async function celebrate() {
      // Taps during a bite coalesce: never flash back to rest or queue a replay.
      if (playing) return;
      reset();
      playing = true;
      const current = sequence;
      const began = performance.now();
      character.classList.add('is-happy', 'is-greeting', 'is-discovering');
      if (!reduce.matches) values[0].x = .975;
      set(rest);
      draw();
      // A stalled download must not leave a greeting permanently onscreen.
      const loadingTimeout = later(6000, reset);
      const ready = await framesReady;
      if (current !== sequence) return;
      clearTimeout(loadingTimeout); timers.delete(loadingTimeout);
      if (!ready) { later(1500, reset); return; }
      const delay = Math.max(0, (reduce.matches ? 500 : 150) - (performance.now() - began));
      if (reduce.matches) {
        later(delay, () => {
          pose('chew');
          character.classList.remove('is-discovering');
        });
        later(delay + 1600, reset);
        return;
      }
      // One readable bite: take the same piece, lift it, bite, savour, lower.
      // Slow decoding retains these intervals instead of skipping poses.
      [
        [0, 'reach'],
        [420, 'lift'],
        [800, 'bite'],
        [1150, 'chew'],
        [1950, 'reach'],
      ].forEach(([offset, name]) => later(delay + offset, () => pose(name)));
      later(delay + 850, () => character.classList.remove('is-discovering'));
      later(delay + 2400, reset);
    }
    character.addEventListener('pointerdown', event => {if (event.button === 0) press();});
    window.addEventListener('pointerup', release);
    character.addEventListener('pointercancel', reset);
    character.addEventListener('keydown', event => {
      if (['Enter',' '].includes(event.key) && !event.repeat) press();
    });
    character.addEventListener('keyup', event => {if (['Enter',' '].includes(event.key)) release();});
    character.addEventListener('click', celebrate);
    character.addEventListener('blur', reset);
    // The existing rainbow control still makes the same shared character smile.
    document.querySelector('#rainbow-random')?.addEventListener('click', celebrate);
    reduce.addEventListener('change', reset);
    window.addEventListener('blur', reset);
    document.addEventListener('keydown', event => {if (event.key === 'Escape') reset();});
    window.addEventListener('pagehide', reset);
    document.addEventListener('visibilitychange', () => {if (document.hidden) reset();});
    new IntersectionObserver(entries => {if (!entries[0].isIntersecting) reset();}).observe(character);
    character.dataset.petPose = 'rest';
    draw();
  });
})();
