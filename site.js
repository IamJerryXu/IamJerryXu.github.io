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
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#1c1d20' : '#ffffff';
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
// Separate inner layers keep the press spring independent of header entrance.
languageButton.innerHTML = '<span class="language-motion"><span class="language-label"></span></span>';
const languageLabel = languageButton.querySelector('.language-label');
const languageFeedback = (() => {
  const surface = languageButton.querySelector('.language-motion');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, previous = 0, hoverTimer = 0, labelAnimation;
  let pressed = false;
  const scale = {x: 1, v: 0, target: 1};
  const angle = {x: 0, v: 0, target: 0};
  function draw() { surface.style.transform = `scale(${scale.x}) rotate(${angle.x}deg)`; }
  function tick(now) {
    frame = 0;
    const dt = Math.min((now - (previous || now - 16.67)) / 1000, .032);
    previous = now;
    let moving = false;
    for (const value of [scale, angle]) {
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
  function aim(size, rotation) {
    scale.target = size; angle.target = rotation;
    if (reduce.matches) { reset(); return; }
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function reset() {
    pressed = false; clearTimeout(hoverTimer); cancelAnimationFrame(frame);
    frame = 0; previous = 0; labelAnimation?.cancel();
    Object.assign(scale, {x: 1, v: 0, target: 1});
    Object.assign(angle, {x: 0, v: 0, target: 0}); draw();
  }
  function down() {
    if (pressed) return;
    pressed = true; clearTimeout(hoverTimer); aim(.86, -6);
  }
  function up() { if (pressed) { pressed = false; aim(1, 0); } }
  function hover() {
    if (pressed || reduce.matches) return;
    clearTimeout(hoverTimer); aim(1.06, -8);
    hoverTimer = setTimeout(() => aim(1, 0), 150);
  }
  languageButton.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') hover(); });
  languageButton.addEventListener('pointerdown', event => { if (event.button === 0) down(); });
  languageButton.addEventListener('pointerleave', reset);
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
  return () => {
    reset();
    if (reduce.matches) return;
    // An instant click still begins visibly compressed; the action never waits.
    scale.x = .86; angle.x = -6; draw(); aim(1, 0);
    labelAnimation = languageLabel.animate([
      {opacity: .3, transform: 'translateY(4px)'},
      {opacity: 1, transform: 'translateY(0)'}
    ], {duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)'});
  };
})();
function setLanguage(language) {
  const isChinese = language === 'zh';
  document.documentElement.lang = isChinese ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-en][data-zh]').forEach(el => { el.innerHTML = el.dataset[language]; });
  languageLabel.textContent = isChinese ? 'EN' : '中文';
  languageButton.setAttribute('aria-label', isChinese ? 'Switch to English' : '切换到中文');
  updateThemeLabel();
  try { localStorage.setItem('academic-language', language); } catch {}
}
let rememberedLanguage = 'en';
try { rememberedLanguage = localStorage.getItem('academic-language') === 'zh' ? 'zh' : 'en'; } catch {}
setLanguage(rememberedLanguage);
languageButton.addEventListener('click', () => {
  setLanguage(document.documentElement.lang === 'en' ? 'zh' : 'en');
  languageFeedback();
});
const dialog = document.querySelector('#figure-dialog');
let fullFigure = document.querySelector('#figure-full');
let lastFigureButton = null;
let figureRequest = 0;
const figureStatus = document.querySelector('#figure-status');
const originalLink = document.querySelector('#figure-original');
document.querySelectorAll('[data-figure]').forEach(button => button.addEventListener('click', () => {
  const request = ++figureRequest;
  lastFigureButton = button;
  const thumbnail = button.querySelector('img');
  // A fresh image node prevents the browser from painting the previous figure
  // while the newly selected image is still loading.
  const preview = new Image();
  preview.id = 'figure-full';
  preview.alt = button.dataset.caption;
  preview.src = thumbnail.currentSrc || thumbnail.src;
  fullFigure.replaceWith(preview);
  fullFigure = preview;
  document.querySelector('#figure-caption').textContent = button.dataset.caption;
  originalLink.href = button.dataset.figure;
  figureStatus.textContent = '';
  dialog.showModal();
  if (new URL(button.dataset.figure, document.baseURI).href === preview.src) return;
  figureStatus.textContent = document.documentElement.lang === 'en' ? 'Loading full-size image…' : '正在加载高清图…';
  const highResolution = new Image();
  highResolution.fetchPriority = 'high';
  highResolution.src = button.dataset.figure;
  highResolution.decode().then(() => {
    if (request !== figureRequest || !dialog.open || fullFigure !== preview) return;
    highResolution.id = 'figure-full';
    highResolution.alt = preview.alt;
    preview.replaceWith(highResolution);
    fullFigure = highResolution;
    figureStatus.textContent = '';
  }).catch(() => {
    if (request !== figureRequest || !dialog.open) return;
    figureStatus.textContent = document.documentElement.lang === 'en' ? 'Full-size image could not load. Preview shown.' : '高清图暂时无法加载，当前显示预览图。';
  });
}));
function closeFigure() {
  ++figureRequest;
  dialog.close();
}
document.querySelector('.close-figure').addEventListener('click', closeFigure);
dialog.addEventListener('click', event => {
  const r = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) closeFigure();
});
dialog.addEventListener('cancel', () => { ++figureRequest; });
dialog.addEventListener('close', () => {
  if (dialog.open) return;
  ++figureRequest;
  figureStatus.textContent = '';
  lastFigureButton?.focus({preventScroll:true});
});
document.querySelectorAll('.copy-bib').forEach(button => button.addEventListener('click', async () => {
  const block = button.closest('.citation-content');
  try {
    await navigator.clipboard.writeText(block.querySelector('pre').textContent);
    block.querySelector('.copy-status').textContent = document.documentElement.lang === 'en' ? 'Copied.' : '已复制。';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(block.querySelector('pre'));
    selection.removeAllRanges(); selection.addRange(range);
    block.querySelector('.copy-status').textContent = document.documentElement.lang === 'en' ? 'Citation selected. Press Ctrl+C or ⌘C to copy.' : '引用已选中，请按 Ctrl+C 或 ⌘C 复制。';
  }
}));
const navLinks = [...document.querySelectorAll('nav a')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      navLinks.forEach(link => {
        const active = link.hash === '#' + entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }
  }, {rootMargin:'-10% 0px -65% 0px',threshold:0});
  document.querySelectorAll('.page__content > section[id]').forEach(section => observer.observe(section));
}

const wechatDialog = document.querySelector('#wechat-dialog');
const wechatButton = document.querySelector('#wechat-open');
wechatButton.addEventListener('click', () => wechatDialog.showModal());
document.querySelector('#wechat-close').addEventListener('click', () => wechatDialog.close());
wechatDialog.addEventListener('click', event => {
  const r = wechatDialog.getBoundingClientRect();
  if (event.target === wechatDialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) wechatDialog.close();
});
wechatDialog.addEventListener('close', () => wechatButton.focus({preventScroll:true}));
