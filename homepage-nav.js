(() => {
  const nav = document.querySelector('.masthead .greedy-nav');
  if (!nav) return;
  const header = nav.closest('.masthead');
  const list = nav.querySelector('.visible-links');
  const links = [...list.querySelectorAll('a')];
  const sections = links.filter(link => link.hash).map(link => ({
    link,
    section: document.getElementById(link.hash.slice(1))
  })).filter(item => item.section);
  const compact = matchMedia('(max-width: 924px)');
  const brand = links[0].cloneNode(true);
  brand.classList.add('nav-brand');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-toggle';
  toggle.append(document.createElement('span'), document.createElement('span'));
  list.id = 'home-nav-sections';
  toggle.setAttribute('aria-controls', list.id);
  const glide = document.createElement('span');
  glide.className = 'nav-glide';
  glide.setAttribute('aria-hidden', 'true');
  nav.prepend(glide, brand, toggle);
  nav.setAttribute('data-compact-menu', '');

  let opened = false;
  let current = null;
  let pointed = null;
  let frame = 0;
  let headerHeight = 0;

  function setOpen(value) {
    opened = value;
    toggle.setAttribute('aria-expanded', String(value));
    const chinese = document.documentElement.lang.startsWith('zh');
    toggle.setAttribute('aria-label', chinese ? (value ? '关闭导航' : '打开导航') : (value ? 'Close navigation' : 'Open navigation'));
  }

  function placeGlide() {
    if (compact.matches) return;
    const focused = document.activeElement;
    const target = focused?.matches(':focus-visible') && list.contains(focused) ? focused : pointed || current;
    if (!target) return;
    // The Blog's entrance animates each list item. Layout offsets stay stable
    // while those items translate in, including when the menu wraps to two rows.
    let x = 0;
    let y = 0;
    for (let element = target; element && element !== nav; element = element.offsetParent) {
      x += element.offsetLeft;
      y += element.offsetTop;
    }
    glide.style.setProperty('--nav-x', (x - 5) + 'px');
    glide.style.setProperty('--nav-y', (y + 4) + 'px');
    glide.style.setProperty('--nav-w', (target.offsetWidth + 10) + 'px');
    glide.style.setProperty('--nav-h', Math.max(0, target.offsetHeight - 8) + 'px');
    if (!glide.classList.contains('is-visible')) {
      glide.classList.add('is-visible');
      requestAnimationFrame(() => glide.classList.add('can-travel'));
    }
  }

  function readLocation() {
    frame = 0;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    if (!sections.length) return;
    let visible = sections[0];
    if (window.scrollY > 1) {
      for (const item of sections) {
        if (item.section.getBoundingClientRect().top > headerHeight + 24) break;
        visible = item;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        const requested = sections.find(item => item.link.hash === location.hash);
        visible = requested && requested.section.getBoundingClientRect().bottom > headerHeight
          ? requested : sections[sections.length - 1];
      }
    }
    if (current !== visible.link) {
      current?.removeAttribute('aria-current');
      current = visible.link;
      current.setAttribute('aria-current', 'location');
      if (current === links[0]) brand.setAttribute('aria-current', 'location');
      else brand.removeAttribute('aria-current');
      placeGlide();
    }
  }
  function scheduleLocation() {
    if (!frame) frame = requestAnimationFrame(readLocation);
  }
  function resize() {
    headerHeight = Math.ceil(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--masthead-height', headerHeight + 'px');
    scheduleLocation();
    placeGlide();
  }

  toggle.addEventListener('click', () => setOpen(!opened));
  list.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    pointed = event.target.closest('a');
    placeGlide();
  });
  list.addEventListener('pointerleave', () => { pointed = null; placeGlide(); });
  list.addEventListener('focusin', placeGlide);
  list.addEventListener('focusout', () => requestAnimationFrame(placeGlide));
  list.addEventListener('click', event => {
    const anchor = event.target.closest('a');
    if (!opened || !anchor) return;
    setOpen(false);
    toggle.focus({preventScroll:true});
  });
  document.addEventListener('keydown', event => {
    if (opened && event.key === 'Escape') {
      setOpen(false);
      toggle.focus();
    }
  });
  function closeOutside(event) {
    if (opened && !nav.contains(event.target)) setOpen(false);
  }
  document.addEventListener('pointerdown', closeOutside);
  document.addEventListener('focusin', closeOutside);
  compact.addEventListener('change', () => {
    if (compact.matches && list.contains(document.activeElement)) toggle.focus({preventScroll:true});
    setOpen(false);
    pointed = null;
    resize();
  });
  new MutationObserver(() => {
    setOpen(opened);
    resize();
  }).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
  window.addEventListener('hashchange', scheduleLocation);
  window.addEventListener('scroll', scheduleLocation, {passive:true});
  window.addEventListener('resize', resize, {passive:true});
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(header);
  document.fonts?.ready.then(resize);
  setOpen(false);
  resize();
})();
