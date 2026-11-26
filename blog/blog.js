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
const languageControl = window.createLanguageControl(languageButton);
function setLanguage(language) {
  const isChinese = language === 'zh';
  document.documentElement.lang = isChinese ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-en][data-zh]').forEach(el => { el.innerHTML = el.dataset[language]; });
  document.querySelectorAll('[data-alt-en][data-alt-zh]').forEach(el => { el.alt = el.dataset[isChinese ? 'altZh' : 'altEn']; });
  document.querySelectorAll('[data-placeholder-en][data-placeholder-zh]').forEach(el => { el.placeholder = el.dataset[isChinese ? 'placeholderZh' : 'placeholderEn']; });
  languageControl.label.textContent = isChinese ? 'EN' : '中文';
  languageButton.setAttribute('aria-label', isChinese ? 'Switch to English' : '切换到中文');
  updateThemeLabel();
  try { localStorage.setItem('academic-language', language); } catch {}
}
let rememberedLanguage = 'en';
try { rememberedLanguage = localStorage.getItem('academic-language') === 'zh' ? 'zh' : 'en'; } catch {}
setLanguage(rememberedLanguage);
languageButton.addEventListener('click', () => languageControl.change(() => setLanguage(document.documentElement.lang === 'en' ? 'zh' : 'en')));

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
