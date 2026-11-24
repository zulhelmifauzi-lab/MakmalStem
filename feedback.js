(() => {
  const section = document.querySelector('[data-simulation-feedback]');
  if (!section) return;
  const simulation = section.dataset.simulationFeedback || new URLSearchParams(location.search).get('id');
  const heading = document.querySelector('main h1');
  if (!simulation || !heading) {
    section.remove();
    return;
  }

  const compact = section.hasAttribute('data-review-panel');
  section.classList.toggle('review-panel',compact);
  const api = new URL('api/simulations/' + encodeURIComponent(simulation), document.currentScript.src);
  if (!section.hasAttribute('data-no-shortcut')) {
    const shortcut = document.createElement('a');
    shortcut.className = 'feedback-shortcut';
    shortcut.href = '#penilaian';
    shortcut.textContent = 'Beri penilaian';
    heading.after(shortcut);
  }
  const starInputs = [1,2,3,4,5].map(value => `<label class="feedback-star"><input type="radio" name="stars" value="${value}"${compact ? '' : ' required'} aria-label="${value} bintang"><span aria-hidden="true">★</span></label>`).join('');
  const privateFeedback = `<details class="feedback-card feedback-private">
    <summary>Hantar maklum balas peribadi</summary>
    <p>Mesej ini hanya boleh dibaca oleh pentadbir.</p>
    <form data-action="feedback">
      <p><strong>Simulasi</strong> <span id="feedback-simulation"></span></p>
      <label>Kategori
        <select name="category" required>
          <option value="">Pilih kategori</option>
          <option>Lapor masalah</option>
          <option>Cadang penambahbaikan</option>
          <option>Lain-lain</option>
        </select>
      </label>
      <label>Mesej <textarea name="message" rows="4" maxlength="500" required></textarea></label>
      <button class="feedback-button" type="submit">Hantar mesej</button>
      <p class="feedback-status" role="status"></p>
    </form>
  </details>`;
  const reviewHeader = `
    <div class="review-header">
      <div class="review-heading">
        <span class="review-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 4h18v13H8l-5 4V4Z"/><path d="m12 6 1.1 2.5 2.7.2-2 1.8.6 2.7-2.4-1.4-2.4 1.4.6-2.7-2-1.8 2.7-.2L12 6Z" fill="currentColor" stroke="none"/></svg>
        </span>
        <h2>Penilaian Modul</h2>
      </div>
      <div class="review-overview">
        <div class="review-summary"><span aria-hidden="true">★</span><p id="review-summary" role="status">Memuatkan penilaian…</p></div>
        <div class="review-filters" role="group" aria-label="Tapis ulasan" hidden>
          <button type="button" data-review-filter="all" aria-pressed="true">Semua</button>
          <button type="button" data-review-filter="Guru" aria-pressed="false">Guru</button>
          <button type="button" data-review-filter="Murid" aria-pressed="false">Murid</button>
          <button type="button" data-review-filter="five" aria-pressed="false" aria-label="Ulasan lima bintang">★ 5</button>
        </div>
      </div>
    </div>
    <div class="review-body" hidden>
      <form class="feedback-card review-form" data-action="review">
        <fieldset class="feedback-stars"><legend>Beri skor <span class="review-optional">(pilihan)</span></legend><div class="feedback-star-row">${starInputs}</div></fieldset>
        <label>Ulasan <span class="review-optional">(pilihan)</span><textarea name="message" rows="1" maxlength="500" placeholder="Tulis pendapat anda"></textarea></label>
        <button class="feedback-button" type="submit">Hantar</button>
        <details class="review-options">
          <summary>Nama samaran dan peranan</summary>
          <div class="review-option-fields">
            <label>Nama samaran <input name="alias" maxlength="32" autocomplete="off"></label>
            <label>Peranan <select name="role"><option value="">Pilih peranan</option><option>Guru</option><option>Murid</option></select></label>
          </div>
        </details>
        <p class="feedback-status" role="status"></p>
      </form>
      <div id="public-comments" class="feedback-comments review-cards"></div>
      ${privateFeedback}
    </div>`;
  section.innerHTML = compact ? reviewHeader : `
    <div class="feedback-heading">
      <h2>Penilaian dan komen</h2>
      <p id="review-summary" role="status">Memuatkan penilaian…</p>
    </div>
    <div class="feedback-grid" hidden>
      <div class="feedback-stack">
        <form data-action="rating" class="feedback-card">
          <fieldset class="feedback-stars">
            <legend>Penilaian anda</legend>
            <div class="feedback-star-row">
              ${starInputs}
            </div>
          </fieldset>
          <button class="feedback-button" type="submit">Hantar penilaian</button>
          <p class="feedback-status" role="status"></p>
        </form>
        ${privateFeedback}
      </div>
      <div class="feedback-card">
        <h3>Komen umum</h3>
        <p>Komen dipaparkan selepas disemak oleh pentadbir.</p>
        <form data-action="comments">
          <label><span>Nama samaran <small>(pilihan)</small></span><input name="alias" maxlength="32" autocomplete="off"></label>
          <label>Komen <textarea name="message" rows="3" maxlength="500" required></textarea></label>
          <button class="feedback-button" type="submit">Hantar komen</button>
          <p class="feedback-status" role="status"></p>
        </form>
        <div id="public-comments" class="feedback-comments"></div>
      </div>
    </div>`;

  const summary = section.querySelector('#review-summary');
  const stars = [...section.querySelectorAll('input[name=stars]')];
  const comments = section.querySelector('#public-comments');
  const filters = [...section.querySelectorAll('[data-review-filter]')];
  let activeFilter = 'all';
  let publishedComments = [];
  const messages = {
    rating:'Penilaian disimpan.',
    comments:'Komen dihantar untuk semakan.',
    feedback:'Maklum balas dihantar kepada pentadbir.'
  };

  function renderRating(data) {
    summary.textContent = data.count ? `${data.average.toLocaleString('ms-MY',{ maximumFractionDigits:1 })}/5 daripada ${data.count} penilaian` : 'Belum ada penilaian.';
    if (!compact) {
      for (const star of stars) star.checked = Number(star.value) === data.rating;
      paintStars(data.rating);
    }
  }

  function paintStars(selected) {
    for (const star of stars) star.closest('label').classList.toggle('is-filled',Number(star.value)<=selected);
  }

  function renderComments(items) {
    comments.replaceChildren();
    if (!items.length) {
      comments.textContent = activeFilter === 'all' ? 'Belum ada komen umum.' : 'Tiada ulasan untuk tapisan ini.';
      return;
    }
    for (const item of items) {
      const article = document.createElement('article');
      const header = document.createElement('strong');
      const message = document.createElement('p');
      header.textContent = item.alias || 'Pengguna tanpa nama';
      message.textContent = item.message;
      if (compact) {
        const row = document.createElement('div');
        row.className = 'review-card-head';
        const initials = document.createElement('span');
        initials.className = 'review-avatar';
        initials.setAttribute('aria-hidden','true');
        initials.textContent = item.alias ? item.alias.trim().split(/\s+/).slice(0,2).map(word=>Array.from(word)[0]).join('').toUpperCase() : '–';
        row.append(initials,header);
        if (item.stars) {
          const score = document.createElement('span');
          score.className = 'review-card-score';
          score.textContent = '★ '+item.stars.toFixed(1);
          score.setAttribute('aria-label',item.stars+' daripada 5 bintang');
          row.append(score);
        }
        article.append(row,message);
        if (item.role) {
          const role = document.createElement('span');
          role.className = 'review-role';
          role.textContent = item.role;
          article.append(role);
        }
      } else {
        article.append(header,message);
      }
      comments.append(article);
    }
  }

  function filterComments(next) {
    activeFilter = next;
    for (const button of filters) button.setAttribute('aria-pressed',String(button.dataset.reviewFilter===next));
    renderComments(publishedComments.filter(item=>next==='all' ||
      (next==='five' ? item.stars===5 : item.role===next)));
  }

  function updateComments(items) {
    publishedComments = items;
    filterComments('all');
    if (!compact) return;
    section.querySelector('.review-filters').hidden = !items.length;
    for (const role of ['Guru','Murid']) {
      const count = items.filter(item=>item.role===role).length;
      section.querySelector('[data-review-filter="'+role+'"]').textContent = role+' ('+count+')';
    }
  }

  for (const filter of filters) filter.addEventListener('click',()=>filterComments(filter.dataset.reviewFilter));

  async function request(url, options) {
    const reply = await fetch(url,options);
    const data = await reply.json();
    if (!reply.ok) throw new Error(data.error || 'Hantaran gagal.');
    return data;
  }

  (async () => {
    try {
      if (location.protocol === 'file:') {
        summary.textContent = 'Buka melalui pelayan Makmal STEM untuk menghantar penilaian atau komen.';
        if (compact) {
          section.classList.add('review-offline');
          summary.textContent = 'Hantaran tersedia melalui pelayan Makmal STEM.';
          const link = document.createElement('a');
          link.href = 'http://127.0.0.1:4173/makmal.html?id='+encodeURIComponent(simulation)+'#penilaian';
          link.textContent = 'Buka borang penilaian';
          summary.append(' ',link);
        }
        return;
      }
      const data = await request(api);
      renderRating(data);
      updateComments(data.comments);
      section.querySelector('#feedback-simulation').textContent = data.title;
      section.querySelector(compact ? '.review-body' : '.feedback-grid').hidden = false;
    } catch {
      summary.textContent = 'Penilaian dan komen belum dapat dimuatkan. Muat semula halaman untuk cuba lagi.';
    }
  })();

  for (const star of stars) star.addEventListener('change',()=>paintStars(Number(star.value)));

  for (const form of section.querySelectorAll('form[data-action]')) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button');
      const status = form.querySelector('.feedback-status');
      let action = form.dataset.action;
      const isReview = action === 'review';
      const body = Object.fromEntries(new FormData(form));
      if (isReview) {
        action = body.message.trim() ? 'comments' : 'rating';
        if (action === 'rating' && body.stars === undefined) {
          status.textContent = 'Tulis komen atau pilih bintang sebelum menghantar.';
          return;
        }
      }
      if (body.stars !== undefined) body.stars = Number(body.stars);
      button.disabled = true;
      status.textContent = 'Sedang dihantar…';
      try {
        const data = await request(api.href + '/' + action, {
          method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
        });
        if (isReview || action !== 'rating') form.reset();
        if (isReview) paintStars(0);
        if (data.rating !== undefined) renderRating(data);
        if (Array.isArray(data.comments)) {
          updateComments(data.comments);
          status.textContent = data.rating === undefined ? 'Komen diterbitkan.' : 'Komen dan penilaian diterbitkan.';
        } else {
          status.textContent = messages[action];
        }
      } catch (error) {
        status.textContent = error instanceof TypeError || error instanceof SyntaxError
          ? 'Sambungan terputus. Cuba hantar sekali lagi.' : error.message;
      } finally {
        button.disabled = false;
      }
    });
  }
})();

(() => {
  if (typeof document === 'undefined' || !document.body || document.querySelector('.site-footer')) return;
  const src = (document.currentScript && document.currentScript.src) || (typeof location !== 'undefined' ? location.href : '');
  const base = src ? new URL('.', src) : null;
  const url = rel => (base ? new URL(rel, base).href : rel);
  document.querySelectorAll('footer:not(.site-footer)').forEach(el => el.remove());
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.setAttribute('aria-label', 'Pengaki laman');
  const hasFeedback = !!document.querySelector('#penilaian');
  footer.innerHTML = `<div class="site-footer-inner">
    <div class="site-footer-grid">
      <div class="site-footer-col">
        <a class="site-footer-brand" href="${url('index.html')}" aria-label="Makmal STEM, laman utama">
          <img src="${url('icon.svg')}" width="36" height="36" alt="">
          <span><strong>Makmal STEM</strong><small>KSSM MALAYSIA</small></span>
        </a>
        <p class="site-footer-desc">Portal simulasi interaktif Matematik, Fizik dan Kimia KSSM Tingkatan 4 &amp; 5. Dihasilkan daripada guru STEM untuk sesi PdP yang lebih visual.</p>
        <div class="site-footer-pills" aria-label="Kelebihan portal">
          <span class="site-footer-pill"><span class="site-footer-pill-dot" aria-hidden="true"></span> Percuma · Tanpa Login</span>
          <span class="site-footer-pill">BBM Interaktif PdP</span>
        </div>
      </div>
      <div class="site-footer-col">
        <h3>Subjek &amp; Katalog</h3>
        <ul class="site-footer-links">
          <li><a href="${url('index.html#simulasi')}">Semua Simulasi</a></li>
          <li><a href="${url('index.html?subjek=Fizik#simulasi')}">Fizik Tingkatan 4 &amp; 5</a></li>
          <li><a href="${url('index.html?subjek=Matematik#simulasi')}">Matematik Tingkatan 4 &amp; 5</a></li>
          <li><a href="${url('index.html?subjek=Kimia#simulasi')}">Kimia Tingkatan 4 &amp; 5</a></li>
          <li><a href="${url('index.html?tingkatan=4#simulasi')}">Katalog Tingkatan 4</a></li>
          <li><a href="${url('index.html?tingkatan=5#simulasi')}">Katalog Tingkatan 5</a></li>
        </ul>
      </div>
      <div class="site-footer-col">
        <h3>Simulasi Popular</h3>
        <ul class="site-footer-links">
          <li><a href="${url('jatuh-bebas.html')}">Jatuh Bebas</a></li>
          <li><a href="${url('gerakan-linear.html')}">Gerakan Linear</a></li>
          <li><a href="${url('daya-paduan.html')}">Daya Paduan</a></li>
          <li><a href="${url('graf-trigonometri.html')}">Graf Fungsi Trigonometri</a></li>
          <li><a href="${url('transformasi/index.html')}">Transformasi Geometri</a></li>
          <li><a href="${url('struktur-atom.html')}">Struktur Atom</a></li>
          <li><a href="${url('ikatan-kimia.html')}">Ikatan Kimia</a></li>
        </ul>
      </div>
      <div class="site-footer-col">
        <h3>Portal &amp; Sumber</h3>
        <ul class="site-footer-links">
          <li><a href="${url('index.html')}">Laman Utama</a></li>
          <li><a href="${url('index.html#pratonton')}">Pratonton Simulasi</a></li>
          <li><a href="${url('index.html#tentang')}">Tentang Makmal STEM</a></li>
          ${hasFeedback ? '<li><a href="#penilaian">Beri Maklum Balas</a></li>' : ''}
          <li><a href="#top" data-scroll-top>Kembali ke atas ↑</a></li>
        </ul>
      </div>
    </div>
    <div class="site-footer-bottom">
      <p>© 2026 Makmal STEM Malaysia · Portal BBM Interaktif KSSM (BETA)</p>
      <p>Dari guru STEM untuk murid &amp; guru Malaysia 🇲🇾</p>
    </div>
  </div>`;
  const topLink = footer.querySelector('[data-scroll-top]');
  if (topLink) topLink.addEventListener('click', e => { e.preventDefault(); if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' }); });
  document.body.appendChild(footer);
})();
