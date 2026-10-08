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
  document.querySelectorAll('[data-alt-en][data-alt-zh]').forEach(el => { el.alt = el.dataset[isChinese ? 'altZh' : 'altEn']; });
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
  let menuCloseTimer;
  function setOpen(open, restoreFocus = false) {
    clearTimeout(menuCloseTimer);
    menu.classList.remove('is-closing');
    button.setAttribute('aria-expanded', String(open));
    if(open) menu.hidden=false;
    else if(!menu.hidden&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
      menu.classList.add('is-closing');
      menuCloseTimer=setTimeout(()=>{menu.hidden=true;menu.classList.remove('is-closing');},300);
    }else menu.hidden=true;
    if (restoreFocus) button.focus();
  }
  setOpen(false);
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
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
  const reset = document.querySelector('#rainbow-reset');
  const width = 1000, height = 520;
  const pointer = {x: 500, y: 260, active: false};
  const smooth = {x: 500, y: 260, vx: 0, vy: 0};
  const marks = [];
  let colors = [], frame = 0, last = 0, introStart = null, introFinished = motion.matches;
  // Public reference behavior was audited read-only. Preferences belong only to this browser.
  const storageKey = 'blog-rainbow-console-v1';
  const defaults = Object.freeze({density: 55, rows: 10, length: .25, width: 0, shape: 'line', linecap: 'round'});
  const bounds = {density: [0, 100], rows: [3, 10], length: [-1, 1], width: [-1, 1]};
  const inputs = {density: document.querySelector('#rainbow-density'), rows: document.querySelector('#rainbow-rows')};
  const pad = document.querySelector('#rainbow-segment-pad');
  const handle = document.querySelector('#rainbow-segment-handle');
  let config = {...defaults}, blend = 0, blendVelocity = 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function sanitize(key, value) {
    if (key === 'shape') return ['line', 'circle'].includes(value) ? value : defaults.shape;
    if (key === 'linecap') return ['round', 'square'].includes(value) ? value : defaults.linecap;
    if ((typeof value !== 'number' && typeof value !== 'string') || value === '' || !Number.isFinite(Number(value))) return defaults[key];
    const number = clamp(Number(value), ...bounds[key]);
    return key === 'density' || key === 'rows' ? Math.round(number) : number;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const key of Object.keys(defaults)) config[key] = sanitize(key, saved[key] ?? defaults[key]);
    }
  } catch {}
  function syncControls() {
    for (const [key, input] of Object.entries(inputs)) {
      if (input) input.value = String(config[key]);
    }
    for (const key of ['shape', 'linecap']) {
      document.querySelectorAll(`input[name="rainbow-${key}"]`).forEach(input => { input.checked = input.value === config[key]; });
    }
    if (handle) {
      handle.style.left = `${(config.length + 1) * 50}%`;
      handle.style.top = `${(config.width + 1) * 50}%`;
      const chinese = document.documentElement.lang.startsWith('zh');
      const length = (22 + 18 * config.length).toFixed(1);
      const thickness = (config.shape === 'line' ? 10 - 8 * config.width : 13.5 - 11.5 * config.width).toFixed(1);
      handle.setAttribute('aria-label', chinese ? `线段长度 ${length}，粗细 ${thickness}。使用方向键调整。` : `Segment length ${length}, width ${thickness}. Use arrow keys to adjust.`);
    }
  }
  function saveConfig() {
    try { localStorage.setItem(storageKey, JSON.stringify(config)); } catch {}
  }
  function buildMarks() {
    marks.length = 0;
    const densityStep = 450 - config.density * 3.35;
    const centerY = height * (1.2 + (config.rows - 3) / 7 * .125);
    for (let row = 0; row < config.rows; row++) {
      const radius = width * .4 + row * 15.75;
      const angleStep = densityStep / (2 * Math.PI * radius);
      for (let arc = Math.PI; arc < Math.PI * 2; arc += angleStep) {
        marks.push({x: width / 2 + Math.cos(arc) * radius, y: centerY + Math.sin(arc) * radius,
          base: arc + Math.PI / 2, progress: (arc - Math.PI) / Math.PI, row});
      }
    }
  }
  function updateConfig(changes) {
    for (const [key, value] of Object.entries(changes)) config[key] = sanitize(key, value);
    syncControls(); saveConfig(); buildMarks(); renderColors();
  }
  syncControls();
  buildMarks();
  let closeTimer;
  function setControls(open, restoreFocus = false, animateClose = false) {
    if (!settings || !controls) return;
    clearTimeout(closeTimer);
    controls.classList.remove('is-closing');
    if(!open && animateClose && !motion.matches){
      controls.classList.add('is-closing');
      closeTimer=setTimeout(()=>{controls.hidden=true;controls.classList.remove('is-closing');},300);
    } else controls.hidden = !open;
    settings.setAttribute('aria-expanded', String(open));
    pointer.active = false;
    if (open) {
      syncControls();
      document.querySelector('#rainbow-close')?.focus({preventScroll: true});
    }
    if (restoreFocus) settings.focus({preventScroll: true});
    wake();
  }
  if (settings && controls) {
    setControls(false);
    settings.addEventListener('click', () => setControls(settings.getAttribute('aria-expanded') !== 'true'));
    document.querySelector('#rainbow-close')?.addEventListener('click', () => setControls(false, true, true));
    document.addEventListener('click', event => {
      if (!controls.hidden && !controls.contains(event.target) && !settings.contains(event.target)) setControls(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !controls.hidden) setControls(false, true);
    });
  }
  for (const [key, input] of Object.entries(inputs)) input?.addEventListener('input', () => updateConfig({[key]: input.value}));
  for (const key of ['shape', 'linecap']) {
    document.querySelectorAll(`input[name="rainbow-${key}"]`).forEach(input => {
      input.addEventListener('change', () => { if (input.checked) updateConfig({[key]: input.value}); });
    });
  }
  function updatePad(event) {
    const box = pad.getBoundingClientRect();
    updateConfig({length: (event.clientX - box.left) / box.width * 2 - 1, width: (event.clientY - box.top) / box.height * 2 - 1});
  }
  if (pad && handle) {
    let dragPointer = null;
    pad.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      dragPointer = event.pointerId;
      pad.setPointerCapture(event.pointerId);
      pad.dataset.dragging = 'true';
      handle.focus({preventScroll: true});
      updatePad(event);
    });
    pad.addEventListener('pointermove', event => { if (event.pointerId === dragPointer) updatePad(event); });
    const stopDragging = () => { dragPointer = null; delete pad.dataset.dragging; };
    pad.addEventListener('pointerup', stopDragging);
    pad.addEventListener('pointercancel', stopDragging);
    pad.addEventListener('lostpointercapture', stopDragging);
    handle.addEventListener('keydown', event => {
      const directions = {ArrowLeft: ['length', -.05], ArrowRight: ['length', .05], ArrowUp: ['width', -.05], ArrowDown: ['width', .05]};
      const delta = directions[event.key];
      if (!delta) return;
      event.preventDefault();
      updateConfig({[delta[0]]: Math.round((config[delta[0]] + delta[1]) * 100) / 100});
    });
  }
  reset?.addEventListener('click', () => updateConfig(defaults));
  document.querySelector('#rainbow-random')?.addEventListener('click', () => {
    updateConfig({density: (1 + Math.floor(Math.random() * 10)) * 10, rows: 3 + Math.floor(Math.random() * 8),
      length: Math.random() * 2 - 1, width: Math.random() * 2 - 1,
      shape: Math.random() < .5 ? 'line' : 'circle', linecap: Math.random() < .5 ? 'round' : 'square'});
  });
  function renderColors() {
    const styles = getComputedStyle(document.documentElement);
    const palette = Array.from({length: 10}, (_, i) => styles.getPropertyValue(`--rainbow-${i + 1}`).trim());
    colors = Array.from({length: config.rows}, (_, row) => {
      const index = row / (config.rows - 1) * (palette.length - 1);
      const lo = Math.floor(index), hi = Math.ceil(index), fraction = index - lo;
      // CSS palettes use hex colours; interpolate rather than repeating rows.
      const parse = hex => hex.match(/^#[0-9a-f]{6}$/i) ? [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16)) : null;
      const a = parse(palette[lo]), b = parse(palette[hi]);
      return a && b ? `rgb(${a.map((channel, i) => Math.round(channel + (b[i] - channel) * fraction)).join(',')})` : palette[Math.round(index)];
    });
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
    const targetBlend = pointer.active && !motion.matches ? 1 : 0;
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
    ctx.lineCap = config.linecap;
    ctx.lineWidth = config.shape === 'line' ? 10 - 8 * config.width : 13.5 - 11.5 * config.width;
    const segmentLength = 22 + 18 * config.length;
    for (const mark of marks) {
      if (!introFinished && mark.progress > progress) continue;
      let delta = Math.atan2(smooth.y - mark.y, smooth.x - mark.x) - mark.base;
      // A straight mark has no arrowhead, so take the nearest equivalent angle.
      delta = (((delta + Math.PI / 2) % Math.PI + Math.PI) % Math.PI) - Math.PI / 2;
      let angle = mark.base + delta * blend;
      let halfLength = segmentLength / 2;
      if (config.shape === 'circle') {
        // Classic art uses near-zero strokes (dots) away from the pointer,
        // stretching radially inside a 300px neighbourhood.
        const editing = controls && !controls.hidden && !motion.matches;
        const px = editing ? width * .2 : smooth.x;
        const py = editing ? height * .5 : smooth.y;
        const distance = Math.hypot(mark.x - px, mark.y - py);
        const influence = (editing ? 1 : blend) * clamp(1 - distance / 300, 0, 1);
        angle = Math.atan2(mark.y - py, mark.x - px);
        halfLength = .01 + halfLength * influence;
      }
      const dx = Math.cos(angle) * halfLength, dy = Math.sin(angle) * halfLength;
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
    if (event.pointerType === 'touch' || motion.matches || !desktop.matches || (controls && !controls.hidden)) return;
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
  new MutationObserver(syncControls).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  renderColors();
  resize();
})();
