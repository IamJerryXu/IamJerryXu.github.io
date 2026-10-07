'use strict';
const languageButton = document.querySelector('#language');
function setLanguage(language) {
  const isChinese = language === 'zh';
  document.documentElement.lang = isChinese ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-en][data-zh]').forEach(el => { el.innerHTML = el.dataset[language]; });
  languageButton.textContent = isChinese ? 'EN' : '中文';
  languageButton.setAttribute('aria-label', isChinese ? 'Switch to English' : '切换到中文');
  try { localStorage.setItem('academic-language', language); } catch {}
}
let rememberedLanguage = 'en';
try { rememberedLanguage = localStorage.getItem('academic-language') === 'zh' ? 'zh' : 'en'; } catch {}
setLanguage(rememberedLanguage);
languageButton.addEventListener('click', () => setLanguage(document.documentElement.lang === 'en' ? 'zh' : 'en'));
const dialog = document.querySelector('#figure-dialog');
const fullFigure = document.querySelector('#figure-full');
let lastFigureButton = null;
document.querySelectorAll('[data-figure]').forEach(button => button.addEventListener('click', () => {
  lastFigureButton = button;
  fullFigure.src = button.dataset.figure;
  fullFigure.alt = button.dataset.caption;
  document.querySelector('#figure-caption').textContent = button.dataset.caption;
  dialog.showModal();
}));
document.querySelector('.close-figure').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const r = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
});
dialog.addEventListener('close', () => lastFigureButton?.focus({preventScroll:true}));
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
