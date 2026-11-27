/* Shared with the Blog's link gestures: tension 300 / friction 16.
   Only active springs request frames; the seated character's feet stay anchored. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.character-interactive').forEach(character => {
    const cheese = character.querySelector('.character-cheese');
    if (!cheese) return;
    const pet = character.querySelector('.character-pet');
    const rest = [1, 6, 10, -20, .5, 0, 0, 0];
    const values = rest.map(x => ({x, target:x, v:0}));
    let frame = 0, previous = 0, timer = 0, pressed = false;
    function draw() {
      character.style.scale = values[0].x;
      if (pet) {
        pet.style.setProperty('--pet-y', `${values[6].x}px`);
        pet.style.setProperty('--pet-rotate', `${values[7].x}deg`);
      }
      ['x','y','rotate','scale','opacity'].forEach((key, index) => {
        const value = values[index + 1].x;
        const unit = index < 2 ? 'px' : index === 2 ? 'deg' : '';
        cheese.style.setProperty(`--cheese-${key}`, `${key === 'opacity' ? Math.max(0, Math.min(1, value)) : value}${unit}`);
      });
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
      values.forEach((value, index) => {
        value.target = targets[index];
        if (instant) {value.x = targets[index]; value.v = 0;}
      });
      if (instant) {cancelAnimationFrame(frame); frame = 0; previous = 0; draw();}
      else if (!frame) frame = requestAnimationFrame(tick);
    }
    function reset() {
      clearTimeout(timer); pressed = false;
      character.classList.remove('is-happy');
      set(rest, true);
    }
    function press() {
      if (pressed) return;
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
    function celebrate() {
      clearTimeout(timer);
      character.classList.add('is-happy');
      // Fast taps still show the small compression before the spring releases.
      if (!reduce.matches) values[0].x = Math.min(values[0].x, .975);
      set([1, 0, -6, -8, 1, 1, -7, -9]);
      draw();
      timer = setTimeout(() => {
        character.classList.remove('is-happy');
        set([1, -4, -14, 4, .85, 0, 0, 0]);
      }, 1200);
    }
    character.addEventListener('pointerdown', event => {if (event.button === 0) press();});
    window.addEventListener('pointerup', release);
    character.addEventListener('pointercancel', reset);
    character.addEventListener('keydown', event => {
      if (['Enter',' '].includes(event.key) && !event.repeat) press();
      if (event.key === 'Escape') reset();
    });
    character.addEventListener('keyup', event => {if (['Enter',' '].includes(event.key)) release();});
    character.addEventListener('click', celebrate);
    character.addEventListener('blur', reset);
    // The existing rainbow control still makes the same shared character smile.
    document.querySelector('#rainbow-random')?.addEventListener('click', celebrate);
    reduce.addEventListener('change', reset);
    window.addEventListener('blur', reset);
    window.addEventListener('pagehide', reset);
    document.addEventListener('visibilitychange', () => {if (document.hidden) reset();});
    new IntersectionObserver(entries => {if (!entries[0].isIntersecting) reset();}).observe(character);
    draw();
  });
})();
