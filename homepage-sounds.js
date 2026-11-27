/* Homepage gestures use the same recordings, preference and player as Blog. */
(() => {
  const sound = (kind, group = 'control') => document.dispatchEvent(
    new CustomEvent('site:interaction-sound', {detail: {kind, group}})
  );
  const selector = 'a[href], button, summary, [role="button"]';
  const separate = '#sound-toggle, #theme-toggle, [data-figure], #wechat-open, .close-figure, #wechat-close, summary';
  const controlFor = target => {
    if (!(target instanceof Element)) return null;
    const control = target.closest(selector);
    return control && !control.matches(':disabled, [aria-disabled="true"]') && !control.closest('[inert]') ? control : null;
  };
  let held = null, lastRelease = null;
  function cancel() {
    held = null;
    sound('stop');
  }
  function press(control, input, key) {
    if (!control || control.matches(separate)) return;
    cancel();
    held = {control, input, key, voice: control.getAttribute('aria-pressed') === 'true' ? 'off' : 'on'};
    sound('down');
  }
  function release(control) {
    if (!held) return;
    if (control !== held.control || !held.control.isConnected) { cancel(); return; }
    const {voice} = held;
    held = null;
    lastRelease = {control, time: performance.now()};
    sound(voice);
  }
  document.addEventListener('pointerdown', event => {
    if (event.button === 0 && event.isPrimary !== false) {
      stopHover();
      press(controlFor(event.target), 'pointer', event.pointerId);
    }
  }, true);
  window.addEventListener('pointerup', event => {
    if (held?.input === 'pointer' && held.key === event.pointerId) release(controlFor(event.target));
  }, true);
  window.addEventListener('pointercancel', cancel);
  document.addEventListener('keydown', event => {
    if (event.repeat || !['Enter', ' '].includes(event.key)) return;
    const control = controlFor(event.target);
    // Space scrolls when a native link has focus; it does not activate the link.
    if (event.key === ' ' && control?.matches('a[href]')) return;
    stopHover();
    press(control, 'keyboard', event.key);
  }, true);
  document.addEventListener('keyup', event => {
    if (held?.input === 'keyboard' && held.key === event.key) release(controlFor(event.target));
  }, true);
  document.addEventListener('focusout', event => {
    if (held?.control === controlFor(event.target)) cancel();
  });
  document.addEventListener('click', event => {
    const control = controlFor(event.target);
    if (!control || control.matches(separate)) return;
    // Enter activates native buttons before keyup. Assistive click activation
    // also works, without replaying the pointerup / keyup sound.
    if (held?.control === control) release(control);
    else if (event.detail === 0 && !(lastRelease?.control === control && performance.now() - lastRelease.time < 300)) {
      sound(control.getAttribute('aria-pressed') === 'true' ? 'off' : 'on');
    }
  }, true);

  // Open/close follows the actual state, including Escape and backdrop closes.
  // Opening an image and its dialog therefore produce one sound, not two.
  document.querySelectorAll('dialog, details').forEach(element => {
    let open = element.open;
    new MutationObserver(() => {
      if (open === element.open) return;
      open = element.open;
      sound(open ? 'open' : 'close', 'panel');
    }).observe(element, {attributes: true, attributeFilter: ['open']});
  });

  let hovered = null;
  const hoverSelector = '.masthead .visible-links a, .author__urls a, .author__urls button, .astra-promo-link, .astra-sticker, .section-with-glyph';
  const stopHover = () => { if (hovered) { sound('stop', 'hover'); hovered = null; } };
  function enterHover(control) {
    if (!control || control === hovered) return;
    stopHover();
    hovered = control;
    sound(control.matches('.astra-promo-link') ? 'rising' : 'hover', 'hover');
  }
  document.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch' || !(event.target instanceof Element)) return;
    enterHover(event.target.closest(hoverSelector));
  });
  document.addEventListener('pointerout', event => {
    if (hovered && (!(event.relatedTarget instanceof Node) || !hovered.contains(event.relatedTarget))) stopHover();
  });
  document.addEventListener('focusin', event => {
    if (event.target instanceof Element && event.target.matches(':focus-visible')) enterHover(event.target.closest(hoverSelector));
  });
  document.addEventListener('focusout', stopHover);
  const stopAll = () => { cancel(); stopHover(); };
  window.addEventListener('blur', stopAll);
  window.addEventListener('pagehide', stopAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
})();
