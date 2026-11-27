(() => {
  'use strict';
  if (typeof document === 'undefined') return;

  const UI = {
    ms: {
      docTitle: 'Kemas Kini — Makmal STEM',
      heading: 'Kemas Kini',
      lead: 'Catatan perubahan, ciri baharu dan pembaikan berterusan pada portal Makmal STEM.',
      filtersLabel: 'Tapis kemas kini mengikut kategori',
      filters: {
        all: 'Semua',
        new: 'Baharu',
        improved: 'Diperbaik',
        fixed: 'Dibaiki'
      },
      badges: {
        new: 'Ciri baharu',
        improved: 'Diperbaik',
        fixed: 'Pembaikan'
      },
      sections: {
        new: 'Apa yang baharu',
        improved: 'Penambahbaikan',
        fixed: 'Pembaikan pepijat'
      },
      empty: 'Tiada rekod kemas kini untuk kategori ini buat masa ini.',
      resetFilter: 'Tunjuk semua kemas kini'
    },
    en: {
      docTitle: 'Changelog — Makmal STEM',
      heading: 'Changelog',
      lead: 'Ongoing updates, new features and fixes across the Makmal STEM portal.',
      filtersLabel: 'Filter updates by category',
      filters: {
        all: 'All',
        new: 'New',
        improved: 'Improved',
        fixed: 'Fixed'
      },
      badges: {
        new: 'New feature',
        improved: 'Improved',
        fixed: 'Bug fix'
      },
      sections: {
        new: "What's new",
        improved: 'Improvements',
        fixed: 'Bug fixes'
      },
      empty: 'No changelog entries match this category yet.',
      resetFilter: 'Show all updates'
    }
  };

  const CHEVRON_SVG = '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5"/></svg>';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch]);

  let activeFilter = 'all';
  let entryEls = [];
  let rafId = 0;
  let lastPointer = null;

  function getLang() {
    if (window.STEMLabSettings && typeof window.STEMLabSettings.getLanguage === 'function') {
      return window.STEMLabSettings.getLanguage() === 'en' ? 'en' : 'ms';
    }
    return document.documentElement.lang === 'en' ? 'en' : 'ms';
  }

  function pick(obj, lang) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] ?? obj.ms ?? obj.en ?? '';
  }

  function matchesFilter(entry, filter) {
    if (filter === 'all') return true;
    if (entry.tag === filter) return true;
    return Array.isArray(entry.sections) && entry.sections.some(sec => sec.type === filter);
  }

  function render() {
    const lang = getLang();
    const t = UI[lang];
    const entries = Array.isArray(window.STEMLAB_CHANGELOG) ? window.STEMLAB_CHANGELOG : [];

    document.title = t.docTitle;

    const titleEl = document.getElementById('cl-title');
    if (titleEl) titleEl.textContent = t.heading;

    const leadEl = document.getElementById('cl-lead');
    if (leadEl) leadEl.textContent = t.lead;

    const filterGroup = document.getElementById('cl-filters');
    if (filterGroup) {
      filterGroup.setAttribute('aria-label', t.filtersLabel);
      filterGroup.querySelectorAll('[data-filter]').forEach(btn => {
        const key = btn.dataset.filter;
        btn.textContent = t.filters[key] || key;
        const isActive = key === activeFilter;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    const listEl = document.getElementById('changelog-list');
    if (!listEl) return;

    const visible = entries.filter(entry => matchesFilter(entry, activeFilter));

    if (!visible.length) {
      listEl.innerHTML = `<div class="cl-empty">
        <p>${esc(t.empty)}</p>
        <button type="button" class="cl-empty-btn" data-reset-filter>${esc(t.resetFilter)}</button>
      </div>`;
      const resetBtn = listEl.querySelector('[data-reset-filter]');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          activeFilter = 'all';
          render();
        });
      }
      entryEls = [];
      return;
    }

    listEl.innerHTML = visible.map(entry => {
      const tag = entry.tag === 'improved' || entry.tag === 'fixed' ? entry.tag : 'new';
      const badgeText = t.badges[tag] || t.badges.new;
      const dateText = pick(entry.date, lang);
      const versionHtml = entry.version ? `<span class="cl-version">${esc(entry.version)}</span>` : '';
      const titleText = pick(entry.title, lang);
      const summaryText = pick(entry.summary, lang);

      const sectionsToRender = Array.isArray(entry.sections)
        ? (activeFilter === 'all' ? entry.sections : entry.sections.filter(s => s.type === activeFilter))
        : [];

      const sectionsHtml = sectionsToRender.length
        ? `<div class="cl-sections">${sectionsToRender.map(sec => {
          const items = (sec.items && (sec.items[lang] || sec.items.ms)) || [];
          if (!items.length) return '';
          const subTitle = t.sections[sec.type] || t.sections.new;
          return `<section>
            <h3 class="cl-subhead">${esc(subTitle)}</h3>
            <ul class="cl-list">${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
          </section>`;
        }).join('')}</div>`
        : '';

      const linkHtml = entry.link && entry.link.href
        ? `<a class="cl-link" href="${esc(entry.link.href)}">${esc(pick(entry.link.label, lang))}${CHEVRON_SVG}</a>`
        : '';

      return `<article class="cl-entry" id="${esc(entry.id)}">
        <div class="cl-rail-col">
          <div class="cl-rail-sticky">
            <span class="cl-node" aria-hidden="true"></span>
            <time class="cl-date" datetime="${esc(entry.id)}">${esc(dateText)}</time>
            ${versionHtml}
          </div>
        </div>
        <div class="cl-content">
          <span class="cl-badge cl-badge--${esc(tag)}">${esc(badgeText)}</span>
          <div class="cl-title-wrap">
            <h2 class="cl-title">${esc(titleText)}</h2>
          </div>
          <p class="cl-summary">${esc(summaryText)}</p>
          ${sectionsHtml}
          ${linkHtml}
        </div>
      </article>`;
    }).join('');

    entryEls = Array.from(listEl.querySelectorAll('.cl-entry'));
  }

  function resetProximity() {
    lastPointer = null;
    for (const el of entryEls) {
      el.style.setProperty('--prox', '0');
      el.classList.remove('is-near');
    }
  }

  function updateProximity() {
    rafId = 0;
    if (!lastPointer || !entryEls.length) return;

    const { x, y } = lastPointer;
    const listEl = document.getElementById('changelog-list');
    if (!listEl) return;

    const listRect = listEl.getBoundingClientRect();
    // Emphasize when pointer is in or near the left timeline rail, still gently responsive across the entry row
    const railX = listRect.left + 18;
    const dx = Math.max(0, x - railX);
    const horizontalFactor = Math.exp(-(dx * dx) / (2 * 260 * 260));
    const sigma = 135;

    for (const el of entryEls) {
      const node = el.querySelector('.cl-node');
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      const cy = rect.top + rect.height / 2;
      const dy = y - cy;
      const verticalFactor = Math.exp(-(dy * dy) / (2 * sigma * sigma));
      const prox = Math.max(0, Math.min(1, verticalFactor * (0.35 + 0.65 * horizontalFactor)));

      el.style.setProperty('--prox', prox.toFixed(3));
      el.classList.toggle('is-near', prox > 0.42);
    }
  }

  function bindProximity() {
    const listEl = document.getElementById('changelog-list');
    if (!listEl || typeof window.matchMedia !== 'function') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');

    listEl.addEventListener('pointermove', e => {
      if (reducedMotion.matches || coarsePointer.matches) return;
      lastPointer = { x: e.clientX, y: e.clientY };
      if (!rafId) rafId = window.requestAnimationFrame(updateProximity);
    });

    listEl.addEventListener('pointerleave', () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      resetProximity();
    });
  }

  function init() {
    const filterGroup = document.getElementById('cl-filters');
    if (filterGroup) {
      filterGroup.addEventListener('click', e => {
        const btn = e.target && e.target.closest ? e.target.closest('[data-filter]') : null;
        if (!btn) return;
        const next = btn.dataset.filter || 'all';
        if (next === activeFilter) return;
        activeFilter = next;
        render();
      });
    }

    render();
    bindProximity();

    window.addEventListener('stemlab:settings-change', render);
    if (typeof MutationObserver === 'function') {
      const observer = new MutationObserver(render);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
