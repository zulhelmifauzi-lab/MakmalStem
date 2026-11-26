(() => {
  'use strict';
  if (typeof document === 'undefined') return;

  const scriptSrc = (document.currentScript && document.currentScript.src) || (typeof location !== 'undefined' ? location.href : '');
  const base = scriptSrc ? new URL('.', scriptSrc) : null;
  const url = rel => (base ? new URL(rel, base).href : rel);

  const MENU_ICON = '<span class="lab-burger" aria-hidden="true"><span></span><span></span><span></span></span>';
  const SEARCH_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/></svg>';
  const SETTINGS_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>';
  const VOL_ON_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  const VOL_LOW_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
  const VOL_MUTE_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

  const VOL_KEY = 'stemlab-volume';
  const MUTE_KEY = 'stemlab-muted';
  const LANG_KEY = 'stemlab-lang';
  const PRESENT_KEY = 'stemlab-present';

  const COPY = {
    ms: {
      title: 'Tetapan',
      openLabel: 'Buka tetapan',
      language: 'Bahasa',
      volume: 'Kelantangan',
      muted: 'Senyap',
      muteLabel: 'Senyapkan audio',
      unmuteLabel: 'Bunyikan audio',
      sliderLabel: 'Kelantangan audio',
      presentMode: 'Mod pembentangan',
      fullscreen: 'Skrin penuh',
      fullscreenActive: 'Aktif · Tekan Esc untuk keluar',
      fullscreenUnsupported: 'Tidak disokong pelayar ini',
      searchLabel: 'Cari simulasi',
      searchPlaceholder: 'Cari simulasi…',
      openMenu: 'Buka menu navigasi',
      closeMenu: 'Tutup menu navigasi',
      drawerNav: 'Navigasi portal',
      catLabel: 'Katalog',
      allSims: 'Semua simulasi',
      subLabel: 'Subjek',
      math: 'Matematik',
      physics: 'Fizik',
      chem: 'Kimia',
      infoLabel: 'Maklumat',
      preview: 'Pratonton',
      about: 'Tentang portal',
      devPhase: 'Fasa Pembangunan',
      presentResumeText: 'Mod pembentangan aktif',
      presentResumeBtn: 'Sambung skrin penuh',
      presentExitLabel: 'Tamatkan mod pembentangan'
    },
    en: {
      title: 'Settings',
      openLabel: 'Open settings',
      language: 'Language',
      volume: 'Volume',
      muted: 'Muted',
      muteLabel: 'Mute audio',
      unmuteLabel: 'Unmute audio',
      sliderLabel: 'Audio volume',
      presentMode: 'Present mode',
      fullscreen: 'Fullscreen',
      fullscreenActive: 'Active · Press Esc to exit',
      fullscreenUnsupported: 'Not supported by this browser',
      searchLabel: 'Search simulations',
      searchPlaceholder: 'Search simulations…',
      openMenu: 'Open navigation menu',
      closeMenu: 'Close navigation menu',
      drawerNav: 'Portal navigation',
      catLabel: 'Catalogue',
      allSims: 'All simulations',
      subLabel: 'Subjects',
      math: 'Mathematics',
      physics: 'Physics',
      chem: 'Chemistry',
      infoLabel: 'Information',
      preview: 'Preview',
      about: 'About portal',
      devPhase: 'Development Phase',
      presentResumeText: 'Present mode active',
      presentResumeBtn: 'Resume fullscreen',
      presentExitLabel: 'Exit present mode'
    }
  };

  function readStorage(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val === null ? fallback : val;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, val) {
    try { localStorage.setItem(key, String(val)); } catch {}
  }

  function readSession(key, fallback) {
    try {
      const val = sessionStorage.getItem(key);
      return val === null ? fallback : val;
    } catch {
      return fallback;
    }
  }

  function writeSession(key, val) {
    try { sessionStorage.setItem(key, String(val)); } catch {}
  }

  function removeSession(key) {
    try { sessionStorage.removeItem(key); } catch {}
  }

  function clampVol(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 80;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  let volume = clampVol(readStorage(VOL_KEY, '80'));
  let lastNonZeroVolume = volume > 0 ? volume : 80;
  let muted = readStorage(MUTE_KEY, 'false') === 'true';
  let popoverCounter = 0;

  const masterGains = new Set();
  const contextGains = typeof WeakMap === 'function' ? new WeakMap() : null;

  function getEffectiveVolume() {
    return muted ? 0 : volume / 100;
  }

  function applyAudioVolume() {
    const level = getEffectiveVolume();
    masterGains.forEach(gainNode => {
      try {
        if (gainNode.context && gainNode.gain) {
          gainNode.gain.value = level;
        }
      } catch {}
    });
    document.querySelectorAll('audio, video').forEach(media => {
      try {
        media.volume = volume / 100;
        media.muted = muted || volume === 0;
      } catch {}
    });
  }

  function installAudioHook() {
    if (typeof window === 'undefined' || !window.AudioNode || window.__stemlabAudioHooked) return;
    window.__stemlabAudioHooked = true;
    const origConnect = window.AudioNode.prototype.connect;
    window.AudioNode.prototype.connect = function patchedConnect(dest, ...rest) {
      try {
        const ctx = this && this.context;
        if (ctx && dest && dest === ctx.destination && this.__stemlabMaster !== true && contextGains) {
          let master = contextGains.get(ctx);
          if (!master && typeof ctx.createGain === 'function') {
            master = ctx.createGain();
            master.__stemlabMaster = true;
            master.gain.value = getEffectiveVolume();
            origConnect.call(master, ctx.destination);
            contextGains.set(ctx, master);
            masterGains.add(master);
          }
          if (master) {
            return origConnect.call(this, master, ...rest);
          }
        }
      } catch {}
      return origConnect.call(this, dest, ...rest);
    };
  }

  function getLanguage() {
    return document.documentElement.lang === 'en' ? 'en' : 'ms';
  }

  function isFullscreenSupported() {
    const root = document.documentElement;
    return Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled || root.requestFullscreen || root.webkitRequestFullscreen);
  }

  function isFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  }

  let isNavigating = false;
  let navResetTimer = null;

  function markNavigating() {
    isNavigating = true;
    clearTimeout(navResetTimer);
    navResetTimer = setTimeout(() => { isNavigating = false; }, 1500);
  }

  function removePresentBanner() {
    const banner = document.getElementById('lab-present-resume');
    if (banner) banner.remove();
  }

  async function enterFullscreen() {
    const root = document.documentElement;
    if (isFullscreen()) return true;
    try {
      if (root.requestFullscreen) await root.requestFullscreen();
      else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
      return isFullscreen();
    } catch {
      return false;
    }
  }

  async function toggleFullscreen() {
    try {
      if (isFullscreen() || readSession(PRESENT_KEY, 'false') === 'true') {
        removeSession(PRESENT_KEY);
        removePresentBanner();
        document.documentElement.classList.remove('is-present-mode');
        if (isFullscreen()) {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
      } else {
        writeSession(PRESENT_KEY, 'true');
        await enterFullscreen();
      }
    } catch {}
    syncAllPopovers();
  }

  function initPresentResume() {
    if (!document.body || readSession(PRESENT_KEY, 'false') !== 'true' || isFullscreen() || !isFullscreenSupported()) return;
    document.documentElement.classList.add('is-present-mode');
    if (document.getElementById('lab-present-resume')) return;

    const t = COPY[getLanguage()];
    const banner = document.createElement('div');
    banner.id = 'lab-present-resume';
    banner.className = 'lab-present-resume';
    banner.setAttribute('role', 'status');
    banner.innerHTML = `<span class="lab-present-resume-dot" aria-hidden="true"></span><span class="lab-present-resume-text" data-present-resume-text>${esc(t.presentResumeText)}</span><button type="button" class="lab-present-resume-btn" data-present-resume-btn>${esc(t.presentResumeBtn)}</button><button type="button" class="lab-present-resume-dismiss" data-present-resume-dismiss aria-label="${esc(t.presentExitLabel)}" title="${esc(t.presentExitLabel)}">✕</button>`;
    document.body.appendChild(banner);

    const cleanup = () => {
      document.removeEventListener('click', onGestureClick, true);
      document.removeEventListener('keydown', onGestureKey, true);
    };

    const exitPresent = () => {
      removeSession(PRESENT_KEY);
      document.documentElement.classList.remove('is-present-mode');
      removePresentBanner();
      cleanup();
      syncAllPopovers();
    };

    const onGestureClick = e => {
      const target = e && e.target;
      if (target && target.closest && target.closest('[data-present-resume-dismiss]')) {
        e.preventDefault();
        e.stopPropagation();
        exitPresent();
        return;
      }
      if (target && target.closest && target.closest('[data-present-resume-btn]')) {
        e.preventDefault();
        e.stopPropagation();
      }
      enterFullscreen().then(ok => {
        if (ok) {
          removePresentBanner();
          cleanup();
          syncAllPopovers();
        }
      });
    };

    const onGestureKey = e => {
      if (e.key === 'Escape') {
        exitPresent();
        return;
      }
      enterFullscreen().then(ok => {
        if (ok) {
          removePresentBanner();
          cleanup();
          syncAllPopovers();
        }
      });
    };

    document.addEventListener('click', onGestureClick, true);
    document.addEventListener('keydown', onGestureKey, true);
  }

  function emitSettingsChange() {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    try {
      window.dispatchEvent(new CustomEvent('stemlab:settings-change', {
        detail: {
          volume,
          muted,
          effectiveVolume: getEffectiveVolume(),
          fullscreen: isFullscreen(),
          lang: getLanguage()
        }
      }));
    } catch {}
  }

  function setVolume(nextVol) {
    volume = clampVol(nextVol);
    if (volume > 0) {
      lastNonZeroVolume = volume;
      if (muted) muted = false;
    }
    writeStorage(VOL_KEY, volume);
    writeStorage(MUTE_KEY, muted);
    applyAudioVolume();
    syncAllPopovers();
    emitSettingsChange();
  }

  function toggleMute() {
    if (muted || volume === 0) {
      muted = false;
      if (volume === 0) {
        volume = lastNonZeroVolume || 80;
        writeStorage(VOL_KEY, volume);
      }
    } else {
      muted = true;
    }
    writeStorage(MUTE_KEY, muted);
    applyAudioVolume();
    syncAllPopovers();
    emitSettingsChange();
  }

  function switchLanguage(targetLang, wrap) {
    const current = getLanguage();
    if (targetLang === current) return;
    const proxy = wrap.querySelector('.lab-language');
    if (proxy) {
      proxy.click();
      // For pages without a dedicated language listener (e.g. index.html)
      if (getLanguage() === current) {
        document.documentElement.lang = targetLang;
        writeStorage(LANG_KEY, targetLang);
      }
    } else {
      document.documentElement.lang = targetLang;
      writeStorage(LANG_KEY, targetLang);
    }
    syncAllPopovers();
    emitSettingsChange();
  }

  function createSettingsMarkup(langBtnHtml) {
    popoverCounter += 1;
    const popoverId = `lab-settings-popover-${popoverCounter}`;
    return `<div class="lab-settings-wrap">${langBtnHtml || ''}<button type="button" class="lab-settings-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="${popoverId}" aria-label="Buka tetapan" title="Tetapan">${SETTINGS_ICON}</button><div class="lab-settings-popover" id="${popoverId}" role="dialog" aria-label="Tetapan" hidden><div class="lab-settings-head"><span class="lab-settings-title" data-settings-text="title">Tetapan</span></div><div class="lab-settings-row"><div class="lab-settings-row-info"><span class="lab-settings-label" data-settings-text="language">Bahasa</span></div><div class="lab-settings-lang-group" role="group" aria-label="Bahasa"><button type="button" class="lab-settings-lang-opt" data-lang-opt="ms" aria-pressed="true">BM</button><button type="button" class="lab-settings-lang-opt" data-lang-opt="en" aria-pressed="false">EN</button></div></div><div class="lab-settings-row lab-settings-row-stack"><div class="lab-settings-row-top"><span class="lab-settings-label" data-settings-text="volume">Kelantangan</span><span class="lab-settings-value" data-settings-vol-label>80%</span></div><div class="lab-settings-volume"><button type="button" class="lab-settings-mute-btn" data-settings-mute aria-pressed="false" aria-label="Senyapkan audio" title="Senyapkan audio">${VOL_ON_ICON}</button><input type="range" class="lab-settings-slider" min="0" max="100" step="1" value="80" data-settings-slider aria-label="Kelantangan audio"></div></div><div class="lab-settings-row"><div class="lab-settings-row-info"><span class="lab-settings-label" data-settings-text="presentMode">Mod pembentangan</span><span class="lab-settings-sub" data-settings-present-sub>Skrin penuh</span></div><button type="button" class="lab-settings-switch" role="switch" aria-checked="false" data-settings-present aria-label="Mod pembentangan"><span class="lab-settings-switch-thumb" aria-hidden="true"></span></button></div></div></div>`;
  }

  function syncPopover(wrap) {
    const lang = getLanguage();
    const t = COPY[lang];
    const fs = isFullscreen() || readSession(PRESENT_KEY, 'false') === 'true';
    const fsSupported = isFullscreenSupported();
    const effectiveMuted = muted || volume === 0;

    const btn = wrap.querySelector('.lab-settings-btn');
    const popover = wrap.querySelector('.lab-settings-popover');
    if (btn) {
      btn.setAttribute('aria-label', t.openLabel);
      btn.setAttribute('title', t.title);
    }
    if (popover) {
      popover.setAttribute('aria-label', t.title);
    }

    const titleEl = wrap.querySelector('[data-settings-text="title"]');
    if (titleEl) titleEl.textContent = t.title;
    const langLabel = wrap.querySelector('[data-settings-text="language"]');
    if (langLabel) langLabel.textContent = t.language;
    const volTitle = wrap.querySelector('[data-settings-text="volume"]');
    if (volTitle) volTitle.textContent = t.volume;
    const presentTitle = wrap.querySelector('[data-settings-text="presentMode"]');
    if (presentTitle) presentTitle.textContent = t.presentMode;

    const langGroup = wrap.querySelector('.lab-settings-lang-group');
    if (langGroup) langGroup.setAttribute('aria-label', t.language);
    wrap.querySelectorAll('[data-lang-opt]').forEach(opt => {
      opt.setAttribute('aria-pressed', opt.dataset.langOpt === lang ? 'true' : 'false');
    });

    const volLabel = wrap.querySelector('[data-settings-vol-label]');
    if (volLabel) volLabel.textContent = effectiveMuted ? t.muted : `${volume}%`;

    const muteBtn = wrap.querySelector('[data-settings-mute]');
    if (muteBtn) {
      muteBtn.setAttribute('aria-pressed', effectiveMuted ? 'true' : 'false');
      muteBtn.setAttribute('aria-label', effectiveMuted ? t.unmuteLabel : t.muteLabel);
      muteBtn.setAttribute('title', effectiveMuted ? t.unmuteLabel : t.muteLabel);
      muteBtn.innerHTML = effectiveMuted ? VOL_MUTE_ICON : (volume <= 45 ? VOL_LOW_ICON : VOL_ON_ICON);
    }

    const slider = wrap.querySelector('[data-settings-slider]');
    if (slider) {
      const pct = muted ? 0 : volume;
      slider.value = String(pct);
      slider.style.background = `linear-gradient(to right, #634395 ${pct}%, #ded4ef ${pct}%)`;
      slider.setAttribute('aria-label', t.sliderLabel);
    }

    const presentSwitch = wrap.querySelector('[data-settings-present]');
    if (presentSwitch) {
      presentSwitch.setAttribute('aria-checked', fs ? 'true' : 'false');
      presentSwitch.setAttribute('aria-label', t.presentMode);
      presentSwitch.disabled = !fsSupported;
    }

    const presentSub = wrap.querySelector('[data-settings-present-sub]');
    if (presentSub) {
      presentSub.textContent = !fsSupported ? t.fullscreenUnsupported : (fs ? t.fullscreenActive : t.fullscreen);
    }
  }

  function syncAllPopovers() {
    document.querySelectorAll('.lab-settings-wrap').forEach(syncPopover);
    const t = COPY[getLanguage()];
    document.querySelectorAll('[data-lab-search-form]').forEach(form => {
      const btn = form.querySelector('.lab-header-search-btn');
      const input = form.querySelector('.lab-header-search-input');
      if (btn) btn.setAttribute('aria-label', t.searchLabel);
      if (input) {
        input.setAttribute('placeholder', t.searchPlaceholder);
        input.setAttribute('aria-label', t.searchLabel);
      }
    });
    const drawer = document.getElementById('lab-drawer');
    const drawerOpen = Boolean(drawer && drawer.classList.contains('is-open'));
    document.querySelectorAll('[data-drawer-toggle]').forEach(btn => {
      const label = drawerOpen ? t.closeMenu : t.openMenu;
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    });
    document.querySelectorAll('[data-drawer-i18n]').forEach(el => {
      const key = el.dataset.drawerI18n;
      if (key && t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-status-pill-text]').forEach(el => {
      el.textContent = t.devPhase;
    });
    const resumeText = document.querySelector('[data-present-resume-text]');
    if (resumeText) resumeText.textContent = t.presentResumeText;
    const resumeBtn = document.querySelector('[data-present-resume-btn]');
    if (resumeBtn) resumeBtn.textContent = t.presentResumeBtn;
    const resumeDismiss = document.querySelector('[data-present-resume-dismiss]');
    if (resumeDismiss) {
      resumeDismiss.setAttribute('aria-label', t.presentExitLabel);
      resumeDismiss.setAttribute('title', t.presentExitLabel);
    }
  }

  function closeAllPopovers(returnFocusFrom) {
    document.querySelectorAll('.lab-settings-wrap').forEach(wrap => {
      const btn = wrap.querySelector('.lab-settings-btn');
      const pop = wrap.querySelector('.lab-settings-popover');
      if (btn && pop && !pop.hidden) {
        pop.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        if (returnFocusFrom && wrap.contains(returnFocusFrom)) {
          btn.focus();
        }
      }
    });
  }

  function bindSettingsWrap(wrap) {
    if (!wrap || wrap.dataset.settingsBound === 'true') return;
    wrap.dataset.settingsBound = 'true';

    const btn = wrap.querySelector('.lab-settings-btn');
    const pop = wrap.querySelector('.lab-settings-popover');

    if (btn && pop) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const willOpen = pop.hidden;
        closeAllPopovers();
        if (willOpen) {
          syncPopover(wrap);
          pop.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    }

    wrap.querySelectorAll('[data-lang-opt]').forEach(opt => {
      opt.addEventListener('click', () => {
        switchLanguage(opt.dataset.langOpt, wrap);
      });
    });

    const muteBtn = wrap.querySelector('[data-settings-mute]');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => toggleMute());
    }

    const slider = wrap.querySelector('[data-settings-slider]');
    if (slider) {
      slider.addEventListener('input', () => setVolume(slider.value));
    }

    const presentSwitch = wrap.querySelector('[data-settings-present]');
    if (presentSwitch) {
      presentSwitch.addEventListener('click', () => toggleFullscreen());
    }

    syncPopover(wrap);
  }

  function createHeaderSearchMarkup() {
    const t = COPY[getLanguage()];
    return `<form class="lab-header-search" role="search" data-lab-search-form><button type="submit" class="lab-header-search-btn" aria-label="${esc(t.searchLabel)}">${SEARCH_ICON}</button><input type="search" class="lab-header-search-input" name="q" placeholder="${esc(t.searchPlaceholder)}" autocomplete="off" aria-label="${esc(t.searchLabel)}"></form>`;
  }

  function createStatusPillMarkup() {
    return `<span class="lab-status-pill"><span class="lab-status-dot" aria-hidden="true"></span><span data-status-pill-text>${esc(COPY[getLanguage()].devPhase)}</span></span>`;
  }

  function bindHeaderSearch(form) {
    if (!form || form.dataset.searchBound === 'true') return;
    form.dataset.searchBound = 'true';
    const header = form.closest('header');
    const input = form.querySelector('.lab-header-search-input, input');
    const expandIfCompact = () => {
      if (!header || header.clientWidth > 450 || header.classList.contains('is-search-expanded')) return false;
      header.classList.add('is-search-expanded');
      if (input) input.focus();
      return true;
    };
    form.addEventListener('click', e => {
      if (expandIfCompact()) e.preventDefault();
    });
    if (input) {
      input.addEventListener('focus', () => {
        if (header && header.clientWidth <= 450) header.classList.add('is-search-expanded');
      });
      input.addEventListener('blur', () => {
        if (header && !input.value.trim()) header.classList.remove('is-search-expanded');
      });
    }
    if (form.tagName === 'FORM') {
      form.addEventListener('submit', e => {
        e.preventDefault();
        if (expandIfCompact()) return;
        const q = input ? input.value.trim() : '';
        const target = q ? `${url('index.html')}?q=${encodeURIComponent(q)}#simulasi` : `${url('index.html')}#simulasi`;
        markNavigating();
        location.href = target;
      });
    }
  }

  function mountHeaders() {
    document.querySelectorAll('[data-lab-header]').forEach(header => {
      const isSiteHeader = header.classList.contains('site-header');
      const wrapCls = header.dataset.headerWrap || (isSiteHeader ? 'header-inner' : 'lab-wrap');
      const actionsCls = isSiteHeader ? 'header-actions' : 'lab-header-actions';
      const langId = header.dataset.langId !== undefined ? header.dataset.langId : 'btn-lang';
      const langToggle = header.dataset.langToggle || '';
      const badge = header.dataset.subjectBadge || '';
      const hasReset = header.dataset.hasReset === 'true';
      const crumb = header.dataset.crumb || '';

      const brandHtml = isSiteHeader
        ? `<a class="brand" href="${url('index.html')}" aria-label="Makmal STEM, laman utama"><img class="brandmark" src="${url('icon.svg')}" width="36" height="36" alt=""><span class="brandtext"><strong>Makmal STEM</strong><small>KSSM MALAYSIA</small></span></a>`
        : `<a class="brand" href="${url('index.html')}" aria-label="Makmal STEM, laman utama"><img class="logo" src="${url('icon.svg')}" width="36" height="36" alt=""><span><b>Makmal STEM</b><small>KSSM MALAYSIA</small></span></a>`;

      const crumbHtml = crumb
        ? `<div class="hidden md:flex items-center gap-1.5 text-xs text-on-surface-variant" style="margin-inline-start:10px"><span>/</span><span class="font-medium text-secondary" data-i18n="crumb">${esc(crumb)}</span></div>`
        : '';

      const resetHtml = hasReset
        ? '<button id="btn-global-reset" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-all" title="Set Semula Semua"><span class="material-symbols-outlined text-base">restart_alt</span><span class="hidden sm:inline" data-i18n="reset">Set Semula</span></button>'
        : '';

      const badgeHtml = badge ? `<span class="badge subject-badge">${esc(badge)}</span>` : '';
      const langIdAttr = langId ? ` id="${esc(langId)}"` : '';
      const langToggleAttr = langToggle ? ` data-language-toggle="${esc(langToggle)}"` : '';
      const langBtnHtml = `<button type="button"${langIdAttr}${langToggleAttr} class="lab-language" data-i18n-aria="langAria" aria-label="Tukar bahasa / Switch language" hidden>BM | EN</button>`;
      const settingsHtml = createSettingsMarkup(langBtnHtml);
      const statusHtml = createStatusPillMarkup();
      const searchHtml = createHeaderSearchMarkup();
      const drawerBtnHtml = `<button type="button" class="lab-drawer-btn" data-drawer-toggle aria-label="${esc(COPY[getLanguage()].openMenu)}" title="${esc(COPY[getLanguage()].openMenu)}" aria-expanded="false" aria-controls="lab-drawer">${MENU_ICON}</button>`;

      header.innerHTML = `<div class="${esc(wrapCls)}"><div class="lab-brand-group">${drawerBtnHtml}${brandHtml}${crumbHtml}</div>${searchHtml}<div class="${esc(actionsCls)}">${badgeHtml}${resetHtml}${statusHtml}${settingsHtml}</div></div>`;
      bindSettingsWrap(header.querySelector('.lab-settings-wrap'));
      bindHeaderSearch(header.querySelector('[data-lab-search-form]'));
    });
  }

  function mountStaticHeaders() {
    document.querySelectorAll('.lab-header-actions').forEach(actions => {
      if (actions.closest('[data-lab-header]') || actions.querySelector('.lab-settings-wrap')) return;
      const existingLang = actions.querySelector('.lab-language');
      const existingHome = actions.querySelector('.lab-home-btn');
      if (existingHome) existingHome.remove();
      if (!actions.querySelector('.lab-status-pill')) {
        const statusHolder = document.createElement('div');
        statusHolder.innerHTML = createStatusPillMarkup();
        actions.appendChild(statusHolder.firstElementChild);
      }
      const holder = document.createElement('div');
      holder.innerHTML = createSettingsMarkup('');
      const wrap = holder.firstElementChild;
      if (existingLang) {
        existingLang.hidden = true;
        wrap.insertBefore(existingLang, wrap.firstChild);
      }
      actions.appendChild(wrap);
      bindSettingsWrap(wrap);

      const headerWrap = actions.parentElement;
      if (headerWrap) {
        const brand = headerWrap.querySelector('.brand');
        if (brand && !headerWrap.querySelector('[data-drawer-toggle]')) {
          const group = document.createElement('div');
          group.className = 'lab-brand-group';
          const btnHolder = document.createElement('div');
          const t = COPY[getLanguage()];
          btnHolder.innerHTML = `<button type="button" class="lab-drawer-btn" data-drawer-toggle aria-label="${esc(t.openMenu)}" title="${esc(t.openMenu)}" aria-expanded="false" aria-controls="lab-drawer">${MENU_ICON}</button>`;
          const btn = btnHolder.firstElementChild;
          headerWrap.insertBefore(group, brand);
          group.appendChild(btn);
          group.appendChild(brand);
        }
        if (!headerWrap.querySelector('.lab-header-search, .portal-search')) {
          const searchHolder = document.createElement('div');
          searchHolder.innerHTML = createHeaderSearchMarkup();
          const searchForm = searchHolder.firstElementChild;
          headerWrap.insertBefore(searchForm, actions);
          bindHeaderSearch(searchForm);
        }
      }
    });

    document.querySelectorAll('.dashboard-header-inner').forEach(inner => {
      const portalSearch = inner.querySelector('.portal-search');
      if (portalSearch) bindHeaderSearch(portalSearch);
      if (inner.querySelector('.lab-settings-wrap')) return;
      let actions = inner.querySelector('.lab-header-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'lab-header-actions';
        const pill = inner.querySelector('.lab-status-pill, .pill');
        if (pill) actions.appendChild(pill);
        inner.appendChild(actions);
      }
      const holder = document.createElement('div');
      holder.innerHTML = createSettingsMarkup('<button type="button" class="lab-language" data-language-toggle="portal" aria-label="Tukar bahasa / Switch language" hidden>BM | EN</button>');
      const wrap = holder.firstElementChild;
      actions.appendChild(wrap);
      bindSettingsWrap(wrap);
    });
  }

  let drawerCloseTimer = null;

  function setDrawerOpen(open, returnFocus) {
    const drawer = document.getElementById('lab-drawer');
    const backdrop = document.getElementById('lab-drawer-backdrop');
    if (!drawer || !backdrop) return;
    const t = COPY[getLanguage()];
    clearTimeout(drawerCloseTimer);

    if (open) {
      closeAllPopovers();
      backdrop.hidden = false;
      requestAnimationFrame(() => {
        backdrop.classList.add('is-open');
        drawer.classList.add('is-open');
      });
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lab-drawer-open');
      document.querySelectorAll('[data-drawer-toggle]').forEach(btn => {
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-label', t.closeMenu);
        btn.setAttribute('title', t.closeMenu);
      });
    } else {
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lab-drawer-open');
      document.querySelectorAll('[data-drawer-toggle]').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', t.openMenu);
        btn.setAttribute('title', t.openMenu);
      });
      const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        backdrop.hidden = true;
      } else {
        drawerCloseTimer = setTimeout(() => {
          if (!drawer.classList.contains('is-open')) backdrop.hidden = true;
        }, 240);
      }
      if (returnFocus) {
        const trigger = document.querySelector('[data-drawer-toggle]');
        if (trigger) trigger.focus();
      }
    }
  }

  function mountDrawer() {
    if (!document.body || !document.querySelector('[data-drawer-toggle]')) return;

    let backdrop = document.getElementById('lab-drawer-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'lab-drawer-backdrop';
      backdrop.className = 'lab-drawer-backdrop';
      backdrop.hidden = true;
      document.body.appendChild(backdrop);
    }

    let drawer = document.getElementById('lab-drawer');
    if (!drawer) {
      const t = COPY[getLanguage()];
      drawer = document.createElement('aside');
      drawer.id = 'lab-drawer';
      drawer.className = 'lab-drawer';
      drawer.setAttribute('aria-hidden', 'true');
      drawer.innerHTML = `<nav class="sidebar-inner" aria-label="${esc(t.drawerNav)}">
  <span class="sidebar-label" data-drawer-i18n="catLabel">${esc(t.catLabel)}</span>
  <a class="sidebar-item" href="${url('index.html#simulasi')}"><span class="sidebar-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span><span class="sidebar-text" data-drawer-i18n="allSims">${esc(t.allSims)}</span></a>
  <span class="sidebar-label" data-drawer-i18n="subLabel">${esc(t.subLabel)}</span>
  <a class="sidebar-item math" href="${url('index.html?subjek=Matematik#simulasi')}"><span class="sidebar-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h15l-7 6 7 6H4"/></svg></span><span class="sidebar-text" data-drawer-i18n="math">${esc(t.math)}</span></a>
  <a class="sidebar-item physics" href="${url('index.html?subjek=Fizik#simulasi')}"><span class="sidebar-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 10-12h-8l1-8Z"/></svg></span><span class="sidebar-text" data-drawer-i18n="physics">${esc(t.physics)}</span></a>
  <a class="sidebar-item chem" href="${url('index.html?subjek=Kimia#simulasi')}"><span class="sidebar-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6m-5 0v6l-5.5 8.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3.5L14 9V3M8 15h8"/></svg></span><span class="sidebar-text" data-drawer-i18n="chem">${esc(t.chem)}</span></a>
  <span class="sidebar-label" data-drawer-i18n="infoLabel">${esc(t.infoLabel)}</span>
  <a class="sidebar-item sidebar-extra" href="${url('index.html#pratonton')}"><span class="sidebar-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 4 3-4 3Z"/></svg></span><span class="sidebar-text" data-drawer-i18n="preview">${esc(t.preview)}</span></a>
  <a class="sidebar-item sidebar-extra" href="${url('index.html#tentang')}"><span class="sidebar-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg></span><span class="sidebar-text" data-drawer-i18n="about">${esc(t.about)}</span></a>
</nav>`;
      document.body.appendChild(drawer);
    }

    if (drawer.dataset.drawerBound === 'true') return;
    drawer.dataset.drawerBound = 'true';

    document.querySelectorAll('[data-drawer-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        setDrawerOpen(!drawer.classList.contains('is-open'), false);
      });
    });

    backdrop.addEventListener('click', () => setDrawerOpen(false, false));

    drawer.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', () => setDrawerOpen(false, false));
    });
  }

  function installGlobalListeners() {
    if (window.__stemlabSettingsListenersInstalled) return;
    window.__stemlabSettingsListenersInstalled = true;

    document.addEventListener('click', e => {
      if (!e.target || !e.target.closest || !e.target.closest('.lab-settings-wrap')) {
        closeAllPopovers();
      }
      if (!e.target || !e.target.closest || !e.target.closest('.lab-header-search, .portal-search')) {
        document.querySelectorAll('header.is-search-expanded').forEach(h => {
          const inp = h.querySelector('.lab-header-search-input, .portal-search input');
          if (!inp || !inp.value.trim()) h.classList.remove('is-search-expanded');
        });
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const drawer = document.getElementById('lab-drawer');
        if (drawer && drawer.classList.contains('is-open')) {
          setDrawerOpen(false, true);
        }
        document.querySelectorAll('header.is-search-expanded').forEach(h => {
          h.classList.remove('is-search-expanded');
          const inp = h.querySelector('.lab-header-search-input, .portal-search input');
          if (inp) inp.blur();
        });
        closeAllPopovers(document.activeElement);
      }
    });

    const onFullscreenChange = () => {
      const active = isFullscreen();
      if (active) {
        removePresentBanner();
        document.documentElement.classList.add('is-present-mode');
      } else if (!isNavigating) {
        removeSession(PRESENT_KEY);
        removePresentBanner();
        document.documentElement.classList.remove('is-present-mode');
      }
      syncAllPopovers();
      emitSettingsChange();
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    document.addEventListener('click', e => {
      const link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      markNavigating();
    }, true);

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', markNavigating);
      window.addEventListener('pagehide', markNavigating);
    }

    document.addEventListener('play', e => {
      const target = e && e.target;
      if (target && (target.tagName === 'AUDIO' || target.tagName === 'VIDEO')) {
        try {
          target.volume = volume / 100;
          target.muted = muted || volume === 0;
        } catch {}
      }
    }, true);

    if (typeof MutationObserver === 'function') {
      const langObserver = new MutationObserver(() => {
        syncAllPopovers();
      });
      langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
  }

  function mountTails() {
    document.querySelectorAll('[data-lab-tail]').forEach(tail => {
      tail.classList.add('lab-tail', 'has-companion');
      tail.innerHTML = `<section class="lab-paper lab-notes" id="notes-panel" aria-labelledby="try-h">
  <h2 id="try-h" data-i18n="triesH" data-en="Learning notes">Nota pembelajaran</h2>
  <ol id="tries" hidden></ol>
</section>
<section class="lab-paper lab-video" id="learning-video" aria-labelledby="learning-video-title" hidden>
  <h2 id="learning-video-title" data-i18n="videoTitle" data-en="Learning videos">Video pembelajaran</h2>
</section>`;
    });
    if (typeof applyLearningPanelsPlaceholder === 'function') applyLearningPanelsPlaceholder();
  }

  installAudioHook();
  applyAudioVolume();
  mountHeaders();
  mountStaticHeaders();
  mountDrawer();
  initPresentResume();
  installGlobalListeners();
  mountTails();

  if (typeof window !== 'undefined') {
    window.STEMLabSettings = {
      getVolume: () => volume,
      isMuted: () => muted,
      getEffectiveVolume,
      setVolume,
      toggleMute,
      isFullscreen,
      toggleFullscreen,
      getLanguage
    };
  }
})();
