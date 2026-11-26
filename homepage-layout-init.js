/* Inlined at the end of the document: establish language and geometry before
   the first paint, independently of deferred interaction scripts or images. */
(() => {
  const root = document.documentElement;
  let language = 'en';
  try { language = localStorage.getItem('academic-language') === 'zh' ? 'zh' : 'en'; } catch {}
  root.lang = language === 'zh' ? 'zh-CN' : 'en';
  if (language === 'zh') {
    document.querySelectorAll('[data-en][data-zh]').forEach(node => { node.innerHTML = node.dataset.zh; });
    document.querySelector('#language').textContent = 'EN';
  }
  window.layoutHomeLandscape = () => {
    const about = document.querySelector('#about');
    const avatar = document.querySelector('.author__avatar');
    const main = document.querySelector('#main');
    const header = document.querySelector('.masthead');
    if (!about || !avatar || !main || !header) return;
    root.style.setProperty('--masthead-height', `${Math.ceil(header.offsetHeight)}px`);
    // Layout offsets exclude entry animations and sticky portrait movement.
    const aboutBottom = about.getBoundingClientRect().bottom + scrollY;
    const mainTop = main.getBoundingClientRect().top + scrollY;
    const companion = document.querySelector('.home-companion');
    // Keep the accepted cloud spacing; enlarging the character must not push News down.
    const cloudSpace = companion ? (innerWidth <= 800 ? 126 : 151) : 100;
    const skyBottom = Math.ceil(Math.max(aboutBottom + cloudSpace, mainTop + avatar.offsetHeight + 58));
    root.style.setProperty('--home-sky-height', `${skyBottom}px`);
    root.style.setProperty('--home-about-gap', `${skyBottom - aboutBottom + 22}px`);
    const newsHeading = document.querySelector('#news > h2');
    if (companion && newsHeading) {
      // offsetTop excludes entry transforms; the feet stay on the actual border.
      let headingTop = 0;
      for (let node = newsHeading; node; node = node.offsetParent) headingTop += node.offsetTop;
      const characterHeight = parseFloat(getComputedStyle(companion).height);
      root.style.setProperty('--home-companion-top', `${headingTop + newsHeading.offsetHeight - 1 - characterHeight}px`);
      root.style.setProperty('--home-companion-right', `${Math.max(20, document.documentElement.clientWidth - newsHeading.getBoundingClientRect().right + 4)}px`);
    }
    root.dataset.landscapeReady = '';
  };
  window.layoutHomeLandscape();
})();
