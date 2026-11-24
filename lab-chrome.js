(() => {
  'use strict';
  if (typeof document === 'undefined') return;

  const scriptSrc = (document.currentScript && document.currentScript.src) || (typeof location !== 'undefined' ? location.href : '');
  const base = scriptSrc ? new URL('.', scriptSrc) : null;
  const url = rel => (base ? new URL(rel, base).href : rel);

  const HOME_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5"/><path d="M5.5 9.5V20h4.5v-6h4v6h4.5V9.5"/></svg>';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

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
      const langBtnHtml = `<button type="button"${langIdAttr}${langToggleAttr} class="lab-language" data-i18n-aria="langAria" aria-label="Tukar bahasa / Switch language">BM | EN</button>`;
      const homeHtml = `<a class="lab-home-btn" href="${url('index.html')}" aria-label="Laman utama" title="Kembali ke laman utama">${HOME_ICON}</a>`;

      header.innerHTML = `<div class="${esc(wrapCls)}"><div style="display:flex;align-items:center;min-width:0">${brandHtml}${crumbHtml}</div><div class="${esc(actionsCls)}">${badgeHtml}${resetHtml}${langBtnHtml}${homeHtml}</div></div>`;
    });
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

  mountHeaders();
  mountTails();
})();
