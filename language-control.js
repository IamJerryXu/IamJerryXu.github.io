'use strict';
window.createLanguageControl = function(languageButton) {
// Separate inner layers keep the press spring independent of header entrance.
languageButton.innerHTML = '<span class="language-motion"><span class="language-label"></span></span>';
const languageLabel = languageButton.querySelector('.language-label');
const outgoing = document.createElement('span');
outgoing.className = 'language-outgoing';
outgoing.setAttribute('aria-hidden', 'true');
languageButton.querySelector('.language-motion').append(outgoing);
const languageFeedback = (() => {
  const surface = languageButton.querySelector('.language-motion');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, previous = 0, hoverTimer = 0, releaseTimer = 0, labelAnimation, outgoingAnimation;
  let contentAnimations = [];
  let pressed = false;
  const scale = {x: 1, v: 0, target: 1};
  const lift = {x: 0, v: 0, target: 0};
  function draw() { surface.style.transform = `scale(${scale.x}) translateY(${lift.x}px)`; }
  function tick(now) {
    frame = 0;
    const dt = Math.min((now - (previous || now - 16.67)) / 1000, .032);
    previous = now;
    let moving = false;
    for (const value of [scale, lift]) {
      value.v += ((value.target - value.x) * 300 - value.v * 18) * dt;
      value.x += value.v * dt;
      if (Math.abs(value.x - value.target) < .001 && Math.abs(value.v) < .001) {
        value.x = value.target; value.v = 0;
      } else moving = true;
    }
    draw();
    if (moving) frame = requestAnimationFrame(tick);
    else previous = 0;
  }
  function aim(size, offset) {
    scale.target = size; lift.target = offset;
    if (reduce.matches) { reset(); return; }
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function reset() {
    pressed = false; clearTimeout(hoverTimer); clearTimeout(releaseTimer); cancelAnimationFrame(frame);
    frame = 0; previous = 0; releaseTimer = 0; labelAnimation?.cancel(); outgoingAnimation?.cancel(); outgoing.textContent = '';
    contentAnimations.forEach(animation => animation.cancel()); contentAnimations = [];
    Object.assign(scale, {x: 1, v: 0, target: 1});
    Object.assign(lift, {x: 0, v: 0, target: 0}); draw();
  }
  function down() {
    if (pressed) return;
    pressed = true; clearTimeout(hoverTimer); clearTimeout(releaseTimer); aim(.82, 2);
  }
  function up() { if (pressed) { pressed = false; aim(1, 0); } }
  function hover() {
    if (pressed || reduce.matches) return;
    clearTimeout(hoverTimer); aim(1.08, -2);
    hoverTimer = setTimeout(() => aim(1, 0), 150);
  }
  languageButton.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') hover(); });
  languageButton.addEventListener('pointerdown', event => { if (event.button === 0) down(); });
  languageButton.addEventListener('pointerleave', () => {
    clearTimeout(hoverTimer);
    if (pressed) { pressed = false; aim(1, 0); }
    else if (!releaseTimer) aim(1, 0);
  });
  languageButton.addEventListener('pointercancel', reset);
  window.addEventListener('pointerup', up);
  languageButton.addEventListener('keydown', event => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) down();
  });
  languageButton.addEventListener('keyup', event => { if (event.key === ' ' || event.key === 'Enter') up(); });
  languageButton.addEventListener('focus', () => { if (languageButton.matches(':focus-visible')) hover(); });
  languageButton.addEventListener('blur', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  reduce.addEventListener('change', reset);
  return (previousLabel) => {
    reset();
    if (reduce.matches) return;
    // Keep a fast tap pressed briefly while the language changes immediately.
    scale.x = .82; lift.x = 2; scale.target = .82; lift.target = 2; draw();
    releaseTimer = setTimeout(() => { releaseTimer = 0; aim(1, 0); }, 90);
    const direction = languageLabel.textContent === 'EN' ? 1 : -1;
    outgoing.textContent = previousLabel;
    outgoingAnimation = outgoing.animate([
      {opacity: 1, transform: 'translateX(0)'},
      {opacity: 0, transform: `translateX(${-direction * 18}px)`}
    ], {duration: 260, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards'});
    outgoingAnimation.onfinish = () => { outgoing.textContent = ''; };
    labelAnimation = languageLabel.animate([
      {opacity: 0, transform: `translateX(${direction * 18}px)`},
      {opacity: 1, transform: 'translateX(0)'}
    ], {duration: 420, easing: 'cubic-bezier(.16,1,.3,1)'});
    // Fade translated text, leaving photos, backgrounds and interactive scenes stable.
    document.querySelectorAll('[data-en][data-zh]').forEach(element => {
      if (element.parentElement.closest('[data-en][data-zh]') || !element.getClientRects().length) return;
      contentAnimations.push(element.animate([{opacity: .12}, {opacity: 1}], {
        duration: 420, easing: 'cubic-bezier(.2,.65,.3,1)'
      }));
    });
  };
})();
return {label: languageLabel, change(update) {
 const previousLabel = languageLabel.textContent;
 update();
 languageFeedback(previousLabel);
}};
};
