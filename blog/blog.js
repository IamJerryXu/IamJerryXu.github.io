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
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#142033' : (document.body.classList.contains('blog-home') ? '#c9e2f3' : '#ffffff');
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

// A self-contained rainbow: pointer movement turns the marks, then lets them settle.
(() => {
  const canvas = document.querySelector('#rainbow-scene');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const art = canvas.parentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const play = document.querySelector('.rainbow-play');
  let width = 0, height = 0, marks = [], colors = [], frame = 0, last = 0;
  let pointer = {x: 0, y: 0, active: false};
  let simulatedUntil = 0;
  const tau = Math.PI * 2;
  function renderColors() {
    const styles = getComputedStyle(document.documentElement);
    colors = Array.from({length: 7}, (_, i) => styles.getPropertyValue(`--rainbow-${i + 1}`).trim());
    wake();
  }
  function resize() {
    width = art.clientWidth; height = art.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const scale = width / 720;
    const cx = width * .51, cy = height * .88;
    marks = [];
    for (let row = 0; row < 7; row++) {
      const radius = (170 + row * 17) * scale;
      const count = Math.round(29 + row * 3);
      for (let i = 0; i < count; i++) {
        const angle = Math.PI + .10 + i / (count - 1) * (Math.PI - .20);
        const base = angle + Math.PI / 2;
        marks.push({x:cx + Math.cos(angle)*radius,y:cy + Math.sin(angle)*radius,base,angle:base,velocity:0,row,length:12*scale,thickness:5*scale});
      }
    }
    wake();
  }
  function draw(now) {
    frame = 0;
    const dt = Math.min((now - (last || now - 16.67)) / 1000, .032);
    last = now;
    if (simulatedUntil && now > simulatedUntil) {simulatedUntil = 0; pointer.active = false;}
    if (simulatedUntil) {
      pointer.x = width * (.5 + .20 * Math.sin(now / 480));
      pointer.y = height * .40;
    }
    let moving = false;
    ctx.clearRect(0,0,width,height);
    ctx.lineCap = 'round';
    for (const mark of marks) {
      let target = mark.base;
      if (pointer.active && !motion.matches) {
        let delta = Math.atan2(pointer.y - mark.y, pointer.x - mark.x) - mark.base;
        delta = ((delta + Math.PI * 3) % tau) - Math.PI;
        // A line is symmetric; take the shorter turn to keep the movement gentle.
        if (delta > Math.PI / 2) delta -= Math.PI;
        if (delta < -Math.PI / 2) delta += Math.PI;
        const influence = Math.max(0, 1 - Math.hypot(pointer.x-mark.x,pointer.y-mark.y)/(width*.7));
        target += delta * influence;
      }
      if (motion.matches) {mark.angle=mark.base;mark.velocity=0;}
      else {mark.velocity += ((target-mark.angle)*125 - mark.velocity*18)*dt;mark.angle += mark.velocity*dt;}
      if (Math.abs(mark.velocity) > .002 || Math.abs(target-mark.angle) > .002) moving=true;
      const dx=Math.cos(mark.angle)*mark.length/2,dy=Math.sin(mark.angle)*mark.length/2;
      ctx.strokeStyle=colors[mark.row] || '#8892d1';ctx.lineWidth=mark.thickness;
      ctx.beginPath();ctx.moveTo(mark.x-dx,mark.y-dy);ctx.lineTo(mark.x+dx,mark.y+dy);ctx.stroke();
    }
    if ((moving || simulatedUntil) && !document.hidden) frame=requestAnimationFrame(draw);
    else last=0;
  }
  function wake() {if (!frame && !document.hidden) frame=requestAnimationFrame(draw);}
  art.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || motion.matches) return;
    const r=canvas.getBoundingClientRect();pointer={x:event.clientX-r.left,y:event.clientY-r.top,active:true};simulatedUntil=0;wake();
  });
  art.addEventListener('pointerleave', () => {pointer.active=false;wake();});
  play.addEventListener('click', () => {if(motion.matches)return;pointer.active=true;simulatedUntil=performance.now()+1300;wake();});
  motion.addEventListener('change', () => {pointer.active=false;simulatedUntil=0;wake();});
  document.addEventListener('visibilitychange', () => {if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else wake();});
  new ResizeObserver(resize).observe(art);
  new MutationObserver(renderColors).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  renderColors();resize();
})();
