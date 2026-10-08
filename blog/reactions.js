'use strict';

// Source-informed standalone interaction. No network requests, aggregate counts,
// visitor tracking, or copied audio: a reader's 0–16 cheers live in this browser.
(() => {
  const containers = [...document.querySelectorAll('.article-reactions')];
  if (!containers.length) return;
  const MAX = 16;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const heartPath = 'M13.2537 .0255029C23.4033 .0255029 25.0273 10.5191 25.0273 10.5191S26.6512 -.60088 37.6129 .0255029C44.3441 .410148 48.7484 6.32169 48.9804 12.1981C49.7924 32.7656 28.7678 41.5 25.0273 41.5S-.549833 32.3459 1.07416 12.1981C1.54782 6.32169 6.29929 .0255029 13.2537 .0255029Z';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const chinese = () => document.documentElement.lang.startsWith('zh');
  let audio;
  const sounding = new Set();
  const enabled = () => document.querySelector('#sound-toggle')?.getAttribute('aria-pressed') === 'true';

  // A short, independently synthesized liquid pluck with rising pitch as it fills.
  async function playGlug(count, celebrate) {
    if (!enabled() || document.hidden) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') await audio.resume();
      if (!enabled() || document.hidden) return;
      for (const source of sounding) { try { source.stop(); } catch {} }
      sounding.clear();
      const rate = .9 + (count - 1) / (MAX - 1);
      const makeNote = (offset, high, volume) => {
        const time = audio.currentTime + offset;
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const filter = audio.createBiquadFilter();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(high * rate, time);
        oscillator.frequency.exponentialRampToValueAtTime(high * .37 * rate, time + .115);
        filter.type = 'lowpass'; filter.frequency.value = 2200;
        gain.gain.setValueAtTime(.001, time);
        gain.gain.exponentialRampToValueAtTime(volume, time + .009);
        gain.gain.exponentialRampToValueAtTime(.001, time + .14);
        oscillator.connect(filter).connect(gain).connect(audio.destination);
        sounding.add(oscillator);
        oscillator.onended = () => { sounding.delete(oscillator); oscillator.disconnect(); gain.disconnect(); filter.disconnect(); };
        oscillator.start(time); oscillator.stop(time + .15);
      };
      makeNote(0, 590, .09);
      if (celebrate) makeNote(.06, 1070, .1);
    } catch { /* Audio support must never prevent a cheer. */ }
  }
  const stopSound = () => { if (!enabled() || document.hidden) for (const source of sounding) { try { source.stop(); } catch {} } };
  const soundButton = document.querySelector('#sound-toggle');
  if (soundButton) new MutationObserver(stopSound).observe(soundButton, {attributes:true, attributeFilter:['aria-pressed']});
  document.addEventListener('visibilitychange', stopSound);

  containers.forEach((root, index) => {
    const key = `blog-cheers-v1:${root.dataset.reactionKey || location.pathname}`;
    const id = `cheers-${index}`;
    const read = () => { try { const n = Number(localStorage.getItem(key)); return Number.isFinite(n) ? clamp(Math.floor(n),0,MAX) : 0; } catch { return 0; } };
    let count = read();
    root.innerHTML = `<div class="reaction-shape"><div class="reaction-particles" aria-hidden="true"></div><button type="button" class="reaction-button" aria-describedby="${id}-note"><span class="reaction-bounce"><svg class="reaction-heart" viewBox="0 0 50 42" width="48" height="40.32" fill="none" aria-hidden="true"><defs><linearGradient id="${id}-active" x1="25" y1="42" x2="26.3796" y2=".0453673" gradientUnits="userSpaceOnUse"><stop stop-color="hsl(353 100% 52%)"/><stop offset="1" stop-color="hsl(313 100% 52%)"/></linearGradient><linearGradient id="${id}-empty" x1="15" y1="41" x2="42" y2="-1.5" gradientUnits="userSpaceOnUse"><stop stop-color="var(--heart-empty-lower)" stop-opacity=".8"/><stop offset="1" stop-color="var(--heart-empty-upper)" stop-opacity=".8"/></linearGradient><clipPath id="${id}-silhouette"><path d="${heartPath}"/></clipPath><clipPath id="${id}-fill"><rect class="reaction-fill" x="0" y="42" width="50" height="42"/></clipPath><clipPath id="${id}-mouth"><path d="M28.3333 27H21.6666S20.0001 27 20 29 22.3875 33 25 33 30 31 30 29 28.3333 27 28.3333 27Z"/></clipPath></defs><g clip-path="url(#${id}-silhouette)"><path d="${heartPath}" fill="url(#${id}-empty)"/><path d="${heartPath}" fill="url(#${id}-active)" clip-path="url(#${id}-fill)"/><g class="reaction-eyes" fill="var(--heart-face)"><circle cx="15" cy="22" r="2"/><circle cx="35" cy="22" r="2"/></g><g class="reaction-eyes-happy" stroke="var(--heart-face)" stroke-width="2" stroke-linecap="round"><path d="M13 23Q15 19 17 23"/><path d="M33 23Q35 19 37 23"/></g><path class="reaction-mouth-line" d="M20 30Q25 33.6 30 30" stroke="var(--heart-face)" stroke-linecap="round"/><g class="reaction-mouth-open" clip-path="url(#${id}-mouth)"><path d="M20 27h10v6H20Z" fill="var(--heart-mouth)"/><circle cx="25" cy="35" r="5" fill="var(--heart-tongue)"/></g><path d="M53.5 18.5 47 5S53.5 31.9722 24.5 36 1 1.5 1 1.5L-6.5 25 8 44.5 15.5 52 39 49Z" fill="black" fill-opacity=".1"/><path d="M6.14471 8.44525C6.64924 7.12038 7.41962 5.99208 8.36394 5.15003 9.30652 4.30953 10.3901 3.78182 11.5089 3.58622M31.7084 5.95975C32.7822 4.70067 34.1021 3.81419 35.484 3.37609" stroke="white" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/></g></svg></span></button></div><div class="reaction-reading"><span class="reaction-number"><span class="reaction-count"></span><span class="reaction-delta" aria-hidden="true"></span></span><span class="reaction-note" id="${id}-note"></span></div><span class="reaction-sr-only" role="status" aria-live="polite"></span>`;
    const $ = (selector) => root.querySelector(selector);
    const button = $('.reaction-button');
    const svg = $('.reaction-heart');
    const fill = $('.reaction-fill');
    const eyes = $('.reaction-eyes');
    const mouth = $('.reaction-mouth-line');
    const bounce = $('.reaction-bounce');
    let near = false;
    let sadTimer;
    let animationFrame = 0;
    let lastFrame;
    let statusTimer;
    let deltaAnimation;
    // Integrate the source springs in small substeps so the high-friction fill
    // stays stable on slower screens; idle components do not schedule frames.
    const state = {
      fill:{x:42 - 42 * Math.sqrt(count / MAX),v:0,to:0,k:1270,c:200},
      angle:{x:0,v:0,to:0,k:170,c:26},
      eyeX:{x:0,v:0,to:0,k:170,c:26},
      eyeY:{x:0,v:0,to:0,k:170,c:26},
      mouth:{x:33.6,v:0,to:33.6,k:1270,c:200}
    };
    state.fill.to = state.fill.x;
    function draw() {
      fill.setAttribute('y', state.fill.x.toFixed(3));
      svg.style.transform = `rotate(${state.angle.x.toFixed(3)}deg)`;
      eyes.setAttribute('transform', `translate(${state.eyeX.x.toFixed(3)} ${state.eyeY.x.toFixed(3)})`);
      mouth.setAttribute('d', `M20 30Q25 ${state.mouth.x.toFixed(3)} 30 30`);
    }
    function frame(time) {
      const dt = Math.min((time - (lastFrame ?? time - 16)) / 1000, .05);
      lastFrame = time;
      let moving = false;
      for (const spring of Object.values(state)) {
        if (reduced.matches) { spring.x = spring.to; spring.v = 0; continue; }
        const steps = Math.max(1, Math.ceil(dt * 240));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) { spring.v += (spring.k * (spring.to - spring.x) - spring.c * spring.v) * h; spring.x += spring.v * h; }
        if (Math.abs(spring.to - spring.x) > .001 || Math.abs(spring.v) > .001) moving = true;
        else { spring.x = spring.to; spring.v = 0; }
      }
      draw();
      animationFrame = moving ? requestAnimationFrame(frame) : 0;
      if (!moving) lastFrame = undefined;
    }
    function wake() { if (!animationFrame) animationFrame = requestAnimationFrame(frame); }
    function labels() {
      $('.reaction-count').textContent = count.toLocaleString(chinese() ? 'zh-CN' : 'en-US');
      $('.reaction-note').textContent = chinese() ? '你的鼓励' : 'Your cheers';
      button.setAttribute('aria-label', chinese() ? `鼓励这篇文章，已送出 ${count} 次，最多 ${MAX} 次` : `Cheer this article: ${count} of ${MAX} cheers`);
      button.title = chinese() ? '点击鼓励；右键或按 ↓ 撤回一次。仅保存在此浏览器。' : 'Click to cheer; right-click or press ↓ to undo. Saved in this browser.';
      root.dataset.hasCheers = String(count > 0);
      root.dataset.max = String(count === MAX);
      root.dataset.count = count;
    }
    function confetti() {
      if (reduced.matches) return;
      const colors = ['#ff00b8','#ff1652','#ffc800','#754dff'];
      for (let i = 1; i < 9; i++) {
        const angle = (i + Math.random()) / 9 * Math.PI * 2;
        let distance = 24 + Math.random() * 48;
        if (angle > Math.PI / 4 && angle < Math.PI * 3 / 4) distance *= .5;
        const x = Math.cos(angle) * distance, y = Math.sin(angle) * distance;
        const item = document.createElement('span');
        item.className = 'reaction-particle';
        const color = colors[i % colors.length];
        item.innerHTML = `<svg viewBox="0 0 50 42" aria-hidden="true"><path d="${heartPath}" fill="${color}"/></svg>`;
        $('.reaction-particles').append(item);
        const rotation = Math.random() * 180;
        const animation = item.animate([
          {transform:`translate(calc(-50% + ${x * .75}px), calc(-50% + ${y * .75}px)) rotate(0deg)`,opacity:1},
          {transform:`translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotation}deg)`,opacity:1,offset:.21},
          {transform:`translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotation}deg)`,opacity:0}
        ], {duration:950,easing:'cubic-bezier(.2,.65,.3,1)',fill:'both'});
        animation.finished.then(() => item.remove(), () => item.remove());
      }
    }
    function update(amount) {
      const next = clamp(count + amount,0,MAX);
      const change = next - count;
      if (!change && count !== MAX) return;
      count = next;
      clearTimeout(sadTimer);
      state.mouth.to = amount < 0 ? 25.2 : 33.6;
      state.fill.to = 42 - 42 * Math.sqrt(count / MAX);
      if (change) {
        try { localStorage.setItem(key,String(count)); } catch {}
        document.dispatchEvent(new CustomEvent('blog:cheers', {detail:{key,count,source:root}}));
      }
      labels(); wake();
      deltaAnimation?.cancel();
      $('.reaction-delta').textContent = count === MAX ? 'MAX' : change > 0 ? '+1' : '−1';
      if (!reduced.matches) deltaAnimation = $('.reaction-delta').animate([
        {transform:count === MAX ? 'translateY(0) scale(.65)' : change > 0 ? 'translateY(0)' : 'translateY(-6px)',opacity:1},
        {transform:count === MAX ? 'translateY(-5px) scale(1.25)' : change > 0 ? 'translateY(-12px)' : 'translateY(6px)',opacity:0}
      ], {duration:1100,easing:'cubic-bezier(.17,.67,.2,1)',fill:'both'});
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => { $('.reaction-sr-only').textContent = chinese() ? `已送出 ${count} 次鼓励${count === MAX ? '，已满' : ''}` : `${count} cheers${count === MAX ? ' — maximum reached' : ''}`; },180);
      if (change) playGlug(count, count === MAX);
      bounce.classList.remove('is-bouncing');
      if (change > 0 && count === MAX) { void bounce.offsetWidth; bounce.classList.add('is-bouncing'); confetti(); }
    }
    button.addEventListener('click', () => update(1));
    button.addEventListener('contextmenu', event => { event.preventDefault(); update(-1); });
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); update(-1); }
      if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) button.classList.add('is-pressed');
      if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
    });
    button.addEventListener('keyup', () => button.classList.remove('is-pressed'));
    button.addEventListener('blur', () => button.classList.remove('is-pressed'));
    function resetPointer() {
      state.angle.to = state.eyeX.to = state.eyeY.to = 0;
      if (near && count === 0) {
        state.mouth.to = 25.2;
        clearTimeout(sadTimer);
        sadTimer = setTimeout(() => { state.mouth.to = 33.6; wake(); },3000);
      }
      near = false; wake();
    }
    window.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reduced.matches) return;
      const box = svg.getBoundingClientRect();
      const x = event.clientX - (box.left + box.width / 2);
      const y = event.clientY - (box.top + box.height / 2);
      if (Math.hypot(x,y) > 96 || !box.width) { if (near) resetPointer(); return; }
      near = true;
      let degrees = 180 + Math.atan2(-y,-x) * 180 / Math.PI;
      state.angle.to = degrees < 180 ? 10 - degrees / 9 : degrees / 9 - 30;
      state.eyeX.to = clamp(x / 40, -1.2, 1.2);
      state.eyeY.to = clamp(y / 40, -1.2, 1.2);
      wake();
    }, {passive:true});
    document.documentElement.addEventListener('pointerleave', () => { if (near) resetPointer(); });
    window.addEventListener('blur', () => { if (near) resetPointer(); });
    document.addEventListener('blog:cheers', event => {
      if (event.detail.key !== key || event.detail.source === root) return;
      count = event.detail.count;
      state.fill.to = 42 - 42 * Math.sqrt(count / MAX);
      state.mouth.to = 33.6;
      labels(); wake();
    });
    window.addEventListener('storage', event => {
      if (event.key !== key && event.key !== null) return;
      count = read(); state.fill.to = 42 - 42 * Math.sqrt(count / MAX); labels(); wake();
    });
    reduced.addEventListener('change', () => { state.angle.to = state.eyeX.to = state.eyeY.to = 0; wake(); });
    new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    labels(); draw();
  });
})();
