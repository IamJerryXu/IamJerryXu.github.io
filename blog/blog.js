'use strict';
const themeButton = document.querySelector('#theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let themePreference = null;
try {
  const stored = localStorage.getItem('academic-theme');
  if (stored === 'dark' || stored === 'light') themePreference = stored;
} catch {}
function updateThemeLabel() {
  const dark = document.documentElement.dataset.theme === 'dark';
  const chinese = document.documentElement.lang.startsWith('zh');
  const label = chinese ? (dark ? '切换到浅色模式' : '切换到深色模式') : (dark ? 'Switch to light mode' : 'Switch to dark mode');
  themeButton.setAttribute('aria-label', label);
  themeButton.title = label;
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#161b38' : (document.body.classList.contains('blog-home') ? '#a0d4ee' : '#ffffff');
  updateThemeLabel();
}
applyTheme(themePreference || (systemTheme.matches ? 'dark' : 'light'));
themeButton.addEventListener('click', () => {
  themePreference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(themePreference);
  try { localStorage.setItem('academic-theme', themePreference); } catch {}
});
systemTheme.addEventListener('change', event => {
  if (!themePreference) applyTheme(event.matches ? 'dark' : 'light');
});
const languageButton = document.querySelector('#language');
function setLanguage(language) {
  const isChinese = language === 'zh';
  document.documentElement.lang = isChinese ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-en][data-zh]').forEach(el => { el.innerHTML = el.dataset[language]; });
  languageButton.textContent = isChinese ? 'EN' : '中文';
  languageButton.setAttribute('aria-label', isChinese ? 'Switch to English' : '切换到中文');
  updateThemeLabel();
  try { localStorage.setItem('academic-language', language); } catch {}
}
let rememberedLanguage = 'en';
try { rememberedLanguage = localStorage.getItem('academic-language') === 'zh' ? 'zh' : 'en'; } catch {}
setLanguage(rememberedLanguage);
languageButton.addEventListener('click', () => setLanguage(document.documentElement.lang === 'en' ? 'zh' : 'en'));

// Keep the compact navigation usable on touch and with the keyboard.
(() => {
  const button = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-menu');
  if (!button || !menu) return;
  function setOpen(open, restoreFocus = false) {
    button.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    if (restoreFocus) button.focus();
  }
  setOpen(false);
  button.addEventListener('click', () => setOpen(menu.hidden));
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('click', event => {
    if (!menu.hidden && !menu.contains(event.target) && !button.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) setOpen(false, true);
  });
  const desktop = matchMedia('(min-width: 768px)');
  desktop.addEventListener('change', () => { if (desktop.matches) setOpen(false); });
})();

// Each mark keeps its position; only its direction responds to the pointer.
(() => {
  const canvas = document.querySelector('#rainbow-scene');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const art = canvas.parentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 768px)');
  const settings = document.querySelector('.rainbow-settings');
  const controls = document.querySelector('#rainbow-controls');
  const intensity = document.querySelector('#rainbow-motion');
  const reset = document.querySelector('#rainbow-reset');
  const width = 1000, height = 520;
  const pointer = {x: 500, y: 260, active: false};
  const smooth = {x: 500, y: 260, vx: 0, vy: 0};
  const marks = [];
  let colors = [], frame = 0, last = 0, introStart = null, introFinished = motion.matches;
  let strength = .65, blend = 0, blendVelocity = 0;
  try {
    const stored = localStorage.getItem('blog-rainbow-motion');
    if (stored !== null && Number.isFinite(Number(stored))) strength = Math.max(0, Math.min(1, Number(stored) / 100));
  } catch {}
  if (intensity) intensity.value = String(Math.round(strength * 100));

  for (let row = 0; row < 10; row++) {
    const radius = 400 + row * 15.75;
    const count = Math.round(Math.PI * radius / 65);
    for (let i = 0; i <= count; i++) {
      const arc = Math.PI + i / count * Math.PI;
      marks.push({
        x: width / 2 + Math.cos(arc) * radius,
        y: height * 1.325 + Math.sin(arc) * radius,
        base: arc + Math.PI / 2,
        progress: i / count,
        row
      });
    }
  }
  function setControls(open, restoreFocus = false) {
    if (!settings || !controls) return;
    controls.hidden = !open;
    settings.setAttribute('aria-expanded', String(open));
    if (restoreFocus) settings.focus();
  }
  if (settings && controls) {
    setControls(false);
    settings.addEventListener('click', () => setControls(controls.hidden));
    document.addEventListener('click', event => {
      if (!controls.hidden && !controls.contains(event.target) && !settings.contains(event.target)) setControls(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !controls.hidden) setControls(false, true);
    });
  }
  function updateStrength(value) {
    strength = Math.max(0, Math.min(1, Number(value) / 100));
    if (intensity) intensity.value = String(Math.round(strength * 100));
    try { localStorage.setItem('blog-rainbow-motion', String(Math.round(strength * 100))); } catch {}
    wake();
  }
  intensity?.addEventListener('input', () => updateStrength(intensity.value));
  reset?.addEventListener('click', () => updateStrength(65));
  function renderColors() {
    const styles = getComputedStyle(document.documentElement);
    colors = Array.from({length: 10}, (_, i) => styles.getPropertyValue(`--rainbow-${i + 1}`).trim());
    wake();
  }
  function resize() {
    if (!desktop.matches) {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      pointer.active = false; blend = 0; blendVelocity = 0;
      setControls(false);
      return;
    }
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    wake();
  }
  function draw(now) {
    frame = 0;
    if (!desktop.matches || document.hidden) { last = 0; return; }
    const dt = Math.min((now - (last || now - 16.67)) / 1000, .032);
    last = now;
    if (introStart === null) introStart = now;
    const progress = introFinished ? 1 : Math.min(1, (now - introStart) / 2000);
    if (progress === 1) introFinished = true;
    const targetBlend = pointer.active && !motion.matches ? strength : 0;
    if (motion.matches) {
      blend = 0; blendVelocity = 0; introFinished = true;
    } else {
      smooth.vx += ((pointer.x - smooth.x) * 300 - smooth.vx * 21.5) * dt;
      smooth.vy += ((pointer.y - smooth.y) * 300 - smooth.vy * 21.5) * dt;
      smooth.x += smooth.vx * dt; smooth.y += smooth.vy * dt;
      blendVelocity += ((targetBlend - blend) * 300 - blendVelocity * 26) * dt;
      blend += blendVelocity * dt;
    }
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'square';
    ctx.lineWidth = 10;
    for (const mark of marks) {
      if (!introFinished && mark.progress > progress) continue;
      let delta = Math.atan2(smooth.y - mark.y, smooth.x - mark.x) - mark.base;
      // A straight mark has no arrowhead, so take the nearest equivalent angle.
      delta = (((delta + Math.PI / 2) % Math.PI + Math.PI) % Math.PI) - Math.PI / 2;
      const angle = mark.base + delta * blend;
      const dx = Math.cos(angle) * 13.25, dy = Math.sin(angle) * 13.25;
      ctx.strokeStyle = colors[mark.row] || '#686dc3';
      ctx.beginPath();
      ctx.moveTo(mark.x - dx, mark.y - dy);
      ctx.lineTo(mark.x + dx, mark.y + dy);
      ctx.stroke();
    }
    const moving = Math.abs(blend - targetBlend) > .0002 || Math.abs(blendVelocity) > .001 ||
      (pointer.active && (Math.abs(pointer.x - smooth.x) > .02 || Math.abs(pointer.y - smooth.y) > .02 ||
      Math.abs(smooth.vx) > .02 || Math.abs(smooth.vy) > .02));
    if (!introFinished || (!motion.matches && moving)) frame = requestAnimationFrame(draw);
    else last = 0;
  }
  function wake() {
    if (!frame && desktop.matches && !document.hidden) frame = requestAnimationFrame(draw);
  }
  art.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || motion.matches || !desktop.matches) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) * width / rect.width;
    pointer.y = (event.clientY - rect.top) * height / rect.height;
    if (!pointer.active) {
      smooth.x = pointer.x; smooth.y = pointer.y;
      smooth.vx = 0; smooth.vy = 0;
    }
    pointer.active = true;
    wake();
  });
  art.addEventListener('pointerleave', () => { pointer.active = false; wake(); });
  motion.addEventListener('change', () => {
    pointer.active = false;
    if (motion.matches) introFinished = true;
    wake();
  });
  desktop.addEventListener('change', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; }
    else wake();
  });
  new ResizeObserver(resize).observe(art);
  new MutationObserver(renderColors).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  renderColors();
  resize();
})();
