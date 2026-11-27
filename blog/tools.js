'use strict';

(() => {
  const homepageSounds = ['homepage', 'theme'].includes(document.currentScript?.dataset.soundScope);
  const audioBase = new URL('../assets/sounds/josh/', document.currentScript.src);
  const searchButton = document.querySelector('#search-toggle');
  const dialog = document.querySelector('#site-search');
  const input = document.querySelector('#site-search-input');
  const clearButton = document.querySelector('#search-clear');
  let clearTimer = 0, clearing = false;
  const closeButton = document.querySelector('#search-close');
  const results = document.querySelector('#search-results');
  const empty = document.querySelector('#search-empty');
  const soundButton = document.querySelector('#sound-toggle');
  const chinese = () => document.documentElement.lang.startsWith('zh');
  const soundStorageKey = 'blog-sound-enabled';
  const storedSoundEnabled = value => value === 'true';
  let soundEnabled = false;
  try { soundEnabled = storedSoundEnabled(localStorage.getItem(soundStorageKey)); } catch {}
  let indexPromise = null;
  let searchIndex = [];
  let loaded = false;
  let loadFailed = false;
  let previousFocus = null;
  let searchCloseTimer = null;
  let searchCloseRevision = 0;

  function updateSoundLabel() {
    if (!soundButton) return;
    const label = chinese() ? (soundEnabled ? '关闭音效' : '开启音效') : (soundEnabled ? 'Turn sound off' : 'Turn sound on');
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.setAttribute('aria-label', label);
    soundButton.title = label;
  }
  // Original reference recordings and volumes, verified against Josh's public
  // IconSpeaker / IconColorMode / HitCounter / navigation source maps.
  const voices = {
    enable: ['enable-sound', .4], disable: ['disable-sound', .25],
    light: ['switch-on', 1], dark: ['switch-off', 1],
    down: ['pop-down', .25], press: ['pop-down', .25],
    on: ['pop-up-on', .25], release: ['pop-up-on', .25], off: ['pop-up-off', .25],
    open: ['menu-open-softer', .6], close: ['menu-close', .6],
    rising: ['rising-pops', .25], hover: ['plunger-immediate', .15],
    // Character-specific mixes of the reference's pop and bubbling recordings.
    greet: ['pop', .2], glug: ['glug-b', .2], bite: ['glug-b', .16], chew: ['pop', .13]
  };
  const recordings = new Map();
  const activeSounds = new Map(), soundTokens = new Map();
  let soundRevision = 0;
  function stopSound(group) {
    if (group) soundTokens.set(group, (soundTokens.get(group) || 0) + 1);
    else for (const key of soundTokens.keys()) soundTokens.set(key, soundTokens.get(key) + 1);
    for (const [id, voice] of activeSounds) {
      if (!group || group === voice.group) {
        voice.sound.stop(id);
        activeSounds.delete(id);
      }
    }
  }
  function recording(kind) {
    if (!window.Howl) return null;
    const [file, volume] = voices[kind];
    if (!recordings.has(kind)) {
      const sound = new window.Howl({
        src: [new URL(file + '.mp3', audioBase).href],
        volume,
        preload: true,
        onend: id => activeSounds.delete(id),
        onstop: id => activeSounds.delete(id),
        onplayerror: id => {
          // Never retry on a later unlock: that would replay an old gesture.
          sound.stop(id);
          activeSounds.delete(id);
        }
      });
      recordings.set(kind, sound);
    }
    return recordings.get(kind);
  }
  function preloadSounds() {
    // As in use-sound, preload even while muted so enabling is immediately audible.
    Object.keys(voices).forEach(recording);
  }
  async function playSound(kind, {force = false, group = kind, rate = 1} = {}) {
    if (!voices[kind] || (!soundEnabled && !force) || document.hidden) return;
    stopSound(group);
    const token = soundTokens.get(group);
    const revision = soundRevision;
    const requestedAt = performance.now();
    try {
      const sound = recording(kind);
      // use-sound likewise ignores playback until its Howl has loaded.
      // Do not queue unloaded hover/press sounds for a later interaction.
      if (!sound || sound.state() !== 'loaded') return;
      const context = window.Howler?.ctx;
      if (window.Howler?.usingWebAudio && context?.state !== 'running') {
        // Hover cannot unlock audio. A trusted activation may resume the shared
        // Howler context; its token still has to belong to the current gesture.
        if (!navigator.userActivation?.isActive || context?.state === 'closed') return;
        await context.resume();
      } else if (!window.Howler?.usingWebAudio && !navigator.userActivation?.hasBeenActive) {
        return;
      }
      if (token !== soundTokens.get(group) || revision !== soundRevision ||
          (!soundEnabled && !force) || document.hidden ||
          performance.now() - requestedAt > 400 ||
          (window.Howler?.usingWebAudio && context?.state !== 'running')) return;
      if (activeSounds.size > 10) stopSound();
      const id = sound.play();
      if (id !== null) {
        sound.rate(Number.isFinite(rate) ? Math.max(.85, Math.min(1.25, rate)) : 1, id);
        activeSounds.set(id, {sound, group});
      }
    } catch {
      // An unavailable audio device must never affect navigation or controls.
    }
  }
  document.addEventListener('site:character-sound', event => {
    const {kind, rate} = event.detail || {};
    if (kind === 'stop') stopSound('character');
    else if (['greet', 'hover', 'rising', 'glug', 'on', 'bite', 'chew'].includes(kind)) {
      playSound(kind, {group: 'character', rate});
    }
  });
  function suspendSounds() {
    soundRevision++;
    stopSound();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspendSounds();
  });
  window.addEventListener('pagehide', suspendSounds);
  window.addEventListener('blur', suspendSounds);
  window.addEventListener('pageshow', () => {
    try { soundEnabled = storedSoundEnabled(localStorage.getItem(soundStorageKey)); } catch {}
    updateSoundLabel();
  });
  window.addEventListener('storage', event => {
    if (event.key !== soundStorageKey && event.key !== null) return;
    soundEnabled = storedSoundEnabled(event.newValue);
    soundRevision++;
    stopSound();
    updateSoundLabel();
  });
  soundButton?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundRevision++;
    stopSound();
    try { localStorage.setItem(soundStorageKey, String(soundEnabled)); } catch {}
    updateSoundLabel();
    preloadSounds();
    playSound(soundEnabled ? 'enable' : 'disable', {force: true, group: 'preference'});
  });
  updateSoundLabel();
  preloadSounds();
  if (homepageSounds) {
    new MutationObserver(updateSoundLabel).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
    document.addEventListener('site:interaction-sound', event => {
      const {kind, group = 'control'} = event.detail || {};
      if (kind === 'stop') stopSound('home-' + group);
      else if (voices[kind]) playSound(kind, {group: 'home-' + group});
    });
    // Share the Blog's exact light/dark voices, without mounting its search,
    // menu, rainbow or article interactions on the academic homepage.
    document.addEventListener('click', event => {
      if (!(event.target instanceof Element) || !event.target.closest('#theme-toggle')) return;
      playSound(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', {group: 'theme'});
    }, true);
    return;
  }
  // The article counter shares the existing sound preference and playback lifecycle.
  document.addEventListener('blog:counter-sound', event => {
    const kind = event.detail?.kind;
    if (kind === 'stop') stopSound('counter');
    else if (['down', 'on', 'off'].includes(kind)) playSound(kind, {group: 'counter'});
  });
  // Research controls use the same preference and one shared, interruptible voice.
  document.addEventListener('blog:scene-sound', event => {
    const kind = event.detail?.kind;
    if (kind === 'stop') stopSound('research-scene');
    else if (kind === 'press' || kind === 'release') playSound(kind, {group: 'research-scene'});
  });
  // Capture the old state, before the control's own handler changes it.
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('#theme-toggle')) {
      playSound(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', {group: 'theme'});
    } else if (event.target.closest('.menu-toggle')) {
      playSound(event.target.closest('.menu-toggle').getAttribute('aria-expanded') === 'true' ? 'close' : 'open', {group: 'menu'});
    } else if (event.target.closest('#rainbow-close')) {
      playSound('off', {group: 'control'});
    }
  }, true);
  const pressableSelector = '.rainbow-settings, #rainbow-reset, #rainbow-random';
  let heldControl = null;
  let lastRelease = -Infinity;
  function pressControl(control) {
    heldControl = {control, gear: control.matches('.rainbow-settings'), open: control.getAttribute('aria-expanded') === 'true'};
    playSound(heldControl.gear ? 'down' : 'press', {group: 'control'});
  }
  function releaseControl() {
    if (!heldControl) return;
    playSound(heldControl.gear ? (heldControl.open ? 'off' : 'on') : 'release', {group: 'control'});
    heldControl = null;
    lastRelease = performance.now();
  }
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    const control = event.target.closest(pressableSelector);
    if (control) pressControl(control);
  }, true);
  window.addEventListener('pointerup', releaseControl, true);
  window.addEventListener('pointercancel', () => { heldControl = null; stopSound('control'); });
  document.addEventListener('keydown', event => {
    if (event.repeat || ![' ', 'Enter'].includes(event.key) || !(event.target instanceof Element)) return;
    const control = event.target.closest(pressableSelector);
    if (control) pressControl(control);
  }, true);
  document.addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) releaseControl(); }, true);
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element) || event.detail !== 0 || heldControl || performance.now() - lastRelease < 100) return;
    const control = event.target.closest(pressableSelector);
    if (control) { pressControl(control); releaseControl(); }
  }, true);
  document.querySelectorAll('.read-link').forEach(link => {
    let over = false;
    const start = () => { if (!over) { over = true; playSound('rising', {group: 'read-more'}); } };
    const stop = () => { over = false; stopSound('read-more'); };
    link.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') start(); });
    link.addEventListener('pointerleave', stop);
    link.addEventListener('focus', () => { if (link.matches(':focus-visible')) start(); });
    link.addEventListener('blur', stop);
  });

  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, location.origin);
      if (url.origin !== location.origin || !/^\/blog\/[a-z0-9-]+\/$/.test(url.pathname)) return null;
      return url.href;
    } catch { return null; }
  }
  function highlight(element,text,words) {
    const pattern = words.map(word=>word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!pattern) { element.textContent=text; return; }
    let expression;
    try { expression=new RegExp(pattern,'gi'); } catch {element.textContent=text;return;}
    let cursor=0;
    for (const match of text.matchAll(expression)) {
      if (!match[0]) continue;
      element.append(document.createTextNode(text.slice(cursor,match.index)));
      const mark=document.createElement('mark');mark.textContent=match[0];element.append(mark);
      cursor=match.index+match[0].length;
    }
    element.append(document.createTextNode(text.slice(cursor)));
  }
  function clearSearch(animate=false) {
    clearTimeout(clearTimer);
    const restore = document.activeElement === clearButton;
    clearing = animate && !matchMedia('(prefers-reduced-motion:reduce)').matches;
    input.disabled = clearing;
    const finish = () => {
      input.value='';input.disabled=false;clearing=false;clearButton.classList.remove('is-clearing');
      renderSearch(); if (restore || document.activeElement===clearButton) input.focus();
    };
    if (!clearing) {finish();return;}
    clearButton.classList.add('is-clearing');renderSearch();
    const erase = () => {
      const length=Array.from(input.value).length;
      if (!length) {finish();return;}
      const delay=length<=1?133.33:length<=2?66.67:length<=5?50:length<=10?16.67:8.33;
      clearTimer=setTimeout(()=>{input.value=Array.from(input.value).slice(0,-1).join('');erase();},delay);
    };
    erase();
  }
  function renderSearch() {
    if (!results || !empty || !input) return;
    results.replaceChildren();
    clearButton.hidden = !input.value;
    clearButton.setAttribute('aria-label',chinese()?'清空搜索':'Clear search');
    const query = clearing ? '' : input.value.trim().toLocaleLowerCase();
    const idle = query.length < 2 && !/[\u3400-\u9fff]/.test(query);
    dialog.dataset.searchState = idle ? 'idle' : 'results';
    if (idle) {
      empty.hidden = false;
      empty.textContent = chinese() ? '搜索本博客里的文章与正文。' : 'Search through the articles in this Blog.';
      return;
    }
    const words = query.split(/\s+/).filter(Boolean);
    const language = chinese() ? 'zh' : 'en';
    const normalized = value => String(value || '').toLocaleLowerCase();
    const contains = (text, word) => /^[a-z0-9-]+$/i.test(word) ? new RegExp('(^|[^a-z0-9])'+word,'i').test(text) : text.includes(word);
    const matches = searchIndex.map(entry => {
      const title = normalized(entry.title_en+' '+entry.title_zh);
      const summary = normalized(entry.summary_en+' '+entry.summary_zh);
      const sections = Array.isArray(entry.sections) ? entry.sections : [];
      const content = sections.map(section => normalized([section.title_en,section.title_zh,section.text_en,section.text_zh].join(' ')));
      if (!words.every(word => contains(title+' '+summary+' '+content.join(' '),word))) return null;
      const titleMatch = words.every(word=>contains(title,word));
      const summaryMatch = words.every(word=>contains(summary,word));
      const sectionIndex = content.findIndex(text=>words.every(word=>contains(text,word)));
      return {entry,score:titleMatch?3:summaryMatch?2:1,section:words.length&&!titleMatch&&!summaryMatch&&sectionIndex>=0?sections[sectionIndex]:null};
    }).filter(Boolean).sort((a,b)=>b.score-a.score);
    for (const {entry,section} of matches.slice(0, 20)) {
      const url = safeUrl(entry.url);
      if (!url) continue;
      const link = document.createElement('a');
      link.className = 'search-result';
      link.href = url + (section && /^[a-z0-9-]+$/.test(section.id) ? '#'+section.id : '');
      const title = document.createElement('strong');
      const titleText = String(entry[`title_${language}`] || entry.title_en || entry.title_zh || '');
      highlight(title,titleText,words);
      const summary = document.createElement('span');
      summary.className = 'search-result-summary';
      if (section) {
        const text = String(section[`text_${language}`] || '');
        const at = words.map(word=>normalized(text).indexOf(word)).filter(index=>index>=0).sort((a,b)=>a-b)[0] || 0;
        let start = Math.max(0,at-45);
        if (!chinese() && start>0) start=text.lastIndexOf(' ',start)+1;
        const snippet=text.slice(start,start+180);
        summary.textContent = (start?'…':'')+snippet+(start+180<text.length?'…':'');
      } else summary.textContent = String(entry[`summary_${language}`] || entry.summary_en || entry.summary_zh || '');
      const summaryText = summary.textContent;
      summary.replaceChildren(); highlight(summary,summaryText,words);
      const category = document.createElement('small');
      category.className = 'search-result-category';
      category.textContent = String(entry[`category_${language}`] || (chinese()?'文章':'Article'));
      link.append(category, title, summary);
      results.append(link);
    }
    empty.hidden = results.childElementCount > 0;
    empty.textContent = !loaded ? (chinese() ? '正在加载…' : 'Loading…') : loadFailed ?
      (chinese() ? '搜索暂时不可用，请稍后重试。' : 'Search is unavailable. Please try again.') :
      (chinese() ? '没有找到相关文章。' : 'No matching articles.');
  }
  function loadIndex() {
    if (indexPromise) return indexPromise;
    loaded = false;
    loadFailed = false;
    indexPromise = fetch('/blog/search-index.json', {credentials: 'same-origin',cache:'no-cache'})
      .then(response => { if (!response.ok) throw new Error('Search index unavailable'); return response.json(); })
      .then(data => { searchIndex = Array.isArray(data) ? data.filter(entry => entry && typeof entry === 'object' && !Array.isArray(entry) && safeUrl(entry.url)) : []; })
      .catch(() => { loadFailed = true; indexPromise = null; })
      .finally(() => { loaded = true; renderSearch(); });
    return indexPromise;
  }
  function cancelSearchClose() {
    searchCloseRevision++;
    if (searchCloseTimer !== null) window.clearTimeout(searchCloseTimer);
    searchCloseTimer = null;
    dialog?.classList.remove('is-closing');
  }
  function closeSearch() {
    if (!dialog?.open || dialog.classList.contains('is-closing')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dialog.close();
      return;
    }
    cancelSearchClose();
    // Start from the current entrance frame, including the protruding cloud edge.
    const shellStyle = getComputedStyle(dialog);
    const cloud = dialog.querySelector('.search-cloud > svg');
    const shellBounds = dialog.getBoundingClientRect();
    const cloudBottom = cloud?.getBoundingClientRect().bottom ?? shellBounds.bottom;
    dialog.style.setProperty('--search-exit-start', shellStyle.transform === 'none' ? 'translateY(0)' : shellStyle.transform);
    dialog.style.setProperty('--search-exit-opacity', shellStyle.opacity);
    dialog.style.setProperty('--search-exit-overhang', `${Math.max(0, cloudBottom - shellBounds.bottom) + 2}px`);
    if (cloud) dialog.style.setProperty('--search-cloud-exit-transform', getComputedStyle(cloud).transform);
    dialog.classList.add('is-closing');
    const revision = searchCloseRevision;
    searchCloseTimer = window.setTimeout(() => {
      if (revision === searchCloseRevision && dialog.open) dialog.close();
    }, 600); // Fallback if the browser does not dispatch animationend.
  }
  function openSearch() {
    if (!dialog || !input) return;
    if (dialog.open) {
      if (dialog.classList.contains('is-closing')) {
        cancelSearchClose();
        input.focus();
      }
      return;
    }
    cancelSearchClose();
    previousFocus = document.activeElement;
    dialog.showModal();
    searchButton?.setAttribute('aria-expanded', 'true');
    input.focus();
    input.select();
    renderSearch();
    loadIndex();
  }
  if (searchButton && dialog && input && results && empty) {
    searchButton.setAttribute('aria-expanded', 'false');
    searchButton.addEventListener('click', openSearch);
    closeButton?.addEventListener('click', closeSearch);
    dialog.addEventListener('animationend', event => {
      if (event.target === dialog && event.animationName === 'search-shell-depart' && dialog.classList.contains('is-closing')) dialog.close();
    });
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      if (input.value || clearing) clearSearch(false); else closeSearch();
    });
    clearButton?.addEventListener('click',()=>clearSearch(true));
    input.addEventListener('input', renderSearch);
    results.addEventListener('click', event => {
      if (event.target.closest('a.search-result')) { cancelSearchClose(); dialog.close(); }
    });
    dialog.addEventListener('keydown', event => {
      if (event.isComposing || !['ArrowDown','ArrowUp'].includes(event.key)) return;
      const links = [...results.querySelectorAll('a')];
      if (!links.length || (event.target !== input && !links.includes(event.target))) return;
      event.preventDefault();
      const current = links.indexOf(document.activeElement);
      if (event.key === 'ArrowUp' && current <= 0) input.focus();
      else links[event.key === 'ArrowDown' ? Math.min(current+1,links.length-1) : current-1]?.focus();
    });
    dialog.addEventListener('close', () => {
      if (dialog.open) return;
      cancelSearchClose();
      if (clearing) clearSearch(false);
      searchButton.setAttribute('aria-expanded', 'false');
      const target = previousFocus?.isConnected && typeof previousFocus.focus === 'function' ? previousFocus : searchButton;
      target.focus({preventScroll: true});
    });
    // Only a press and release on the backdrop dismisses the dialog.
    let backdropPress = false;
    const outsideDialog = event => {
      const rect = dialog.getBoundingClientRect();
      return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    };
    dialog.addEventListener('pointerdown', event => { backdropPress = outsideDialog(event); });
    dialog.addEventListener('click', event => {
      if (backdropPress && outsideDialog(event)) closeSearch();
      backdropPress = false;
    });
    document.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey || event.shiftKey || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') && target !== input) return;
      event.preventDefault();
      openSearch();
    });
  }
  new MutationObserver(() => { updateSoundLabel(); renderSearch(); }).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
})();
