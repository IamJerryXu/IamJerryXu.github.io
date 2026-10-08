'use strict';

(() => {
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
  let soundEnabled = false;
  try { soundEnabled = localStorage.getItem(soundStorageKey) === 'true'; } catch {}
  let audioContext = null;
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
  // Original synthesized sounds: short material clicks and elastic pops, not tones.
  // Reference interaction timing is documented in output/josh-reference/audio-reference.md.
  const soundBuffers = new Map();
  const activeSounds = new Map();
  const soundTokens = new Map();
  let soundRevision = 0;
  function stopSound(group) {
    if (group) soundTokens.set(group, (soundTokens.get(group) || 0) + 1);
    else for (const key of soundTokens.keys()) soundTokens.set(key, soundTokens.get(key) + 1);
    for (const [source, label] of activeSounds) {
      if (!group || group === label) {
        try { source.stop(); } catch {}
        activeSounds.delete(source);
      }
    }
  }
  function makeSound(kind) {
    if (soundBuffers.has(kind)) return soundBuffers.get(kind);
    const rate = audioContext.sampleRate;
    const duration = {enable: .29, disable: .36, light: .072, dark: .096,
      down: .105, on: .105, off: .156, open: .24, close: .245,
      press: .13, release: .15, rising: .385}[kind] || .105;
    const buffer = audioContext.createBuffer(1, Math.ceil(rate * duration), rate);
    const data = buffer.getChannelData(0);
    let seed = 5381;
    for (const character of kind) seed = (seed * 33) ^ character.charCodeAt(0);
    const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 2147483648 - 1; };
    // Each voice combines a transient with a rapidly damped, pitch-bent resonance.
    function pop(at, frequency, length, level, rising = false) {
      let phase = 0, smooth = 0;
      for (let i = 0; i < length * rate; i++) {
        const index = Math.round(at * rate) + i;
        if (index >= data.length) break;
        const t = i / rate, progress = t / length;
        const pitch = frequency * (rising ? .65 + .65 * progress : 1.5 - .95 * progress);
        phase += 2 * Math.PI * pitch / rate;
        smooth = smooth * .6 + noise() * .4;
        const envelope = Math.min(1, t / .0015) * Math.exp(-progress * 6) * (1 - progress);
        data[index] += level * envelope * (Math.sin(phase) * .72 + Math.sin(phase * 2.13) * .12 + smooth * .35);
      }
    }
    function click(at, length, level, pitch) {
      let low = 0, phase = 0;
      for (let i = 0; i < length * rate; i++) {
        const index = Math.round(at * rate) + i;
        if (index >= data.length) break;
        const t = i / rate, progress = t / length;
        const raw = noise(); low = low * .8 + raw * .2;
        phase += 2 * Math.PI * pitch / rate;
        const envelope = Math.min(1, t / .0006) * Math.exp(-progress * 9) * (1 - progress);
        data[index] += level * envelope * ((raw - low) * .7 + Math.sin(phase) * .25);
      }
    }
    function air(reverse) {
      let low = 0;
      for (let i = 0; i < data.length; i++) {
        const p = i / data.length;
        low = .82 * low + .18 * noise();
        const envelope = Math.pow(Math.sin(Math.PI * p), 2) * (reverse ? 1 - p : p);
        data[i] += low * envelope * .085;
      }
    }
    if (kind === 'rising') {
      [410, 550, 730].forEach((frequency, i) => pop(i * .125, frequency, .11, .115));
    } else if (kind === 'enable' || kind === 'disable') {
      const frequencies = kind === 'enable' ? [400, 620, 860] : [700, 500, 320];
      frequencies.forEach((frequency, i) => pop(i * .075, frequency, .12, .12, kind === 'enable'));
    } else if (kind === 'light' || kind === 'dark') {
      click(0, .042, .15, kind === 'light' ? 2100 : 1400);
      click(kind === 'light' ? .014 : .024, .04, .075, kind === 'light' ? 2900 : 1800);
      pop(.003, kind === 'light' ? 390 : 270, .06, .045);
    } else if (kind === 'open' || kind === 'close') {
      air(kind === 'close');
      pop(kind === 'open' ? .055 : .012, kind === 'open' ? 400 : 280, .13, .07, kind === 'open');
    } else if (kind === 'press' || kind === 'release') {
      click(0, .04, .15, kind === 'press' ? 1600 : 2300);
      pop(.003, kind === 'press' ? 190 : 260, .085, .065);
      click(.014, .04, .035, 3200);
    } else {
      pop(0, kind === 'down' ? 245 : kind === 'off' ? 300 : 470, duration, .14, kind === 'on');
      click(0, .018, .022, 1600);
    }
    soundBuffers.set(kind, buffer);
    return buffer;
  }
  async function playSound(kind, {force = false, group = kind} = {}) {
    if ((!soundEnabled && !force) || document.hidden) return;
    stopSound(group);
    const token = soundTokens.get(group);
    const revision = soundRevision;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') await audioContext.resume();
      if (token !== soundTokens.get(group) || revision !== soundRevision || (!soundEnabled && !force) || document.hidden || audioContext.state !== 'running') return;
      if (activeSounds.size > 10) stopSound();
      const source = audioContext.createBufferSource();
      source.buffer = makeSound(kind);
      source.connect(audioContext.destination);
      source.addEventListener('ended', () => { activeSounds.delete(source); source.disconnect(); }, {once: true});
      activeSounds.set(source, group);
      source.start();
    } catch {
      // An unavailable audio device must never affect navigation or controls.
    }
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
  soundButton?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundRevision++;
    stopSound();
    try { localStorage.setItem(soundStorageKey, String(soundEnabled)); } catch {}
    updateSoundLabel();
    playSound(soundEnabled ? 'enable' : 'disable', {force: true, group: 'preference'});
  });
  updateSoundLabel();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    soundRevision++;
    stopSound();
    if (audioContext?.state === 'running') audioContext.suspend().catch(() => {});
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
    dialog.classList.add('is-closing');
    const revision = searchCloseRevision;
    searchCloseTimer = window.setTimeout(() => {
      if (revision === searchCloseRevision && dialog.open) dialog.close();
    }, 750);
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
      target.focus();
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
