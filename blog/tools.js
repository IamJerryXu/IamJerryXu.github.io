'use strict';

(() => {
  const searchButton = document.querySelector('#search-toggle');
  const dialog = document.querySelector('#site-search');
  const input = document.querySelector('#site-search-input');
  const closeButton = document.querySelector('#search-close');
  const results = document.querySelector('#search-results');
  const empty = document.querySelector('#search-empty');
  const soundButton = document.querySelector('#sound-toggle');
  const chinese = () => document.documentElement.lang.startsWith('zh');
  let soundEnabled = false;
  let audioContext = null;
  let indexPromise = null;
  let searchIndex = [];
  let loaded = false;
  let loadFailed = false;
  let previousFocus = null;

  function updateSoundLabel() {
    if (!soundButton) return;
    const label = chinese() ? (soundEnabled ? '关闭音效' : '开启音效') : (soundEnabled ? 'Turn sound off' : 'Turn sound on');
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.setAttribute('aria-label', label);
    soundButton.title = label;
  }
  async function playTone(kind = 'tap') {
    if (!soundEnabled || document.hidden) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') await audioContext.resume();
      if (!soundEnabled || document.hidden || audioContext.state !== 'running') return;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      const frequency = kind === 'open' ? 560 : kind === 'enable' ? 660 : 430;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.25, now + .08);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(.035, now + .008);
      gain.gain.exponentialRampToValueAtTime(.001, now + .12);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.addEventListener('ended', () => { oscillator.disconnect(); gain.disconnect(); }, {once: true});
      oscillator.start(now);
      oscillator.stop(now + .13);
    } catch {
      // Audio is optional; an unavailable device must not affect navigation.
    }
  }
  soundButton?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    updateSoundLabel();
    if (soundEnabled) playTone('enable');
    else if (audioContext?.state === 'running') audioContext.suspend().catch(() => {});
  });
  updateSoundLabel();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && audioContext?.state === 'running') audioContext.suspend().catch(() => {});
  });
  document.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('#theme-toggle, .rainbow-settings, .identity')) playTone();
  });

  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, location.origin);
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.origin === location.origin)) return null;
      return url.href;
    } catch { return null; }
  }
  function renderSearch() {
    if (!results || !empty || !input) return;
    results.replaceChildren();
    const query = input.value.trim().toLocaleLowerCase();
    const words = query.split(/\s+/).filter(Boolean);
    const matches = searchIndex.filter(entry => {
      const text = [entry.title_en, entry.title_zh, entry.summary_en, entry.summary_zh].filter(value => typeof value === 'string').join(' ').toLocaleLowerCase();
      return words.every(word => text.includes(word));
    });
    const language = chinese() ? 'zh' : 'en';
    for (const entry of matches.slice(0, 20)) {
      const url = safeUrl(entry.url);
      if (!url) continue;
      const link = document.createElement('a');
      link.className = 'search-result';
      link.href = url;
      const title = document.createElement('strong');
      title.textContent = String(entry[`title_${language}`] || entry.title_en || entry.title_zh || '');
      const summary = document.createElement('span');
      summary.textContent = String(entry[`summary_${language}`] || entry.summary_en || entry.summary_zh || '');
      link.append(title, summary);
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
    indexPromise = fetch('/blog/search-index.json', {credentials: 'same-origin'})
      .then(response => { if (!response.ok) throw new Error('Search index unavailable'); return response.json(); })
      .then(data => { searchIndex = Array.isArray(data) ? data.filter(entry => entry && typeof entry === 'object' && !Array.isArray(entry) && safeUrl(entry.url)) : []; })
      .catch(() => { loadFailed = true; indexPromise = null; })
      .finally(() => { loaded = true; renderSearch(); });
    return indexPromise;
  }
  function openSearch() {
    if (!dialog || !input || dialog.open) return;
    previousFocus = document.activeElement;
    dialog.showModal();
    searchButton?.setAttribute('aria-expanded', 'true');
    input.focus();
    input.select();
    renderSearch();
    loadIndex();
    playTone('open');
  }
  if (searchButton && dialog && input && results && empty) {
    searchButton.setAttribute('aria-expanded', 'false');
    searchButton.addEventListener('click', openSearch);
    closeButton?.addEventListener('click', () => dialog.close());
    input.addEventListener('input', renderSearch);
    dialog.addEventListener('close', () => {
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
      if (backdropPress && outsideDialog(event)) dialog.close();
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
