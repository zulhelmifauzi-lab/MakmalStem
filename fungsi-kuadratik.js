const $ = id => document.getElementById(id);

/* ===== Kawalan ===== */

function setCoeffs(a, b, c) { state.a = a; state.b = r9(b); state.c = r9(c); state.dirty = true; }

function setCoefficient(key, value) {

  if (!Number.isFinite(value)) return;

  const limit = key === 'a' ? LIM.a : LIM.bc;

  value = clamp(value, -limit, limit);

  if (key === 'a' && value === 0) value = state.a > 0 ? -0.5 : 0.5;

  const coefficients = {...state, [key]: value};

  setCoeffs(coefficients.a, coefficients.b, coefficients.c);

  syncControls();

}

/* Gerakkan verteks ke (h, k): a kekal, b dan c berubah. Ditolak jika b atau c melebihi had gelangsar. */

function moveVertex(h, k) {

  h = clamp(Math.round(h * 2) / 2, -LIM.hk, LIM.hk); k = clamp(Math.round(k * 2) / 2, -LIM.hk, LIM.hk);

  const b = -2 * state.a * h, c = k + state.a * h * h;

  if (Math.abs(b) > LIM.bc || Math.abs(c) > LIM.bc) return false;

  setCoeffs(state.a, b, c); syncControls(); return true;

}

function syncControls() {

  for (const key of ['a', 'b', 'c']) {

    const slider = $('slider-' + key);

    const limit = key === 'a' ? LIM.a : LIM.bc;

    slider.value = state[key];

    $('out-' + key).textContent = n2(state[key]);

    $('decrease-' + key).disabled = state[key] <= -limit;

    $('increase-' + key).disabled = state[key] >= limit;

  }

  document.querySelectorAll('[data-show]').forEach(input => { input.checked = state.show[input.dataset.show]; });

}



function setupTabs() {

  const tabs = [$('quad-tab-controls'), $('quad-tab-table')];

  const panes = [$('quad-pane-controls'), $('quad-pane-table')];

  function selectTab(index) {

    tabs.forEach((tab, i) => {

      const active = i === index;

      tab.setAttribute('aria-selected', String(active));

      tab.tabIndex = active ? 0 : -1;

      panes[i].inert = !active;

    });

  }

  tabs.forEach((tab, index) => {

    tab.addEventListener('click', () => selectTab(index));

    tab.addEventListener('keydown', event => {

      const next = {ArrowLeft: 1 - index, ArrowRight: 1 - index, Home: 0, End: 1}[event.key];

      if (next === undefined) return;

      event.preventDefault();

      selectTab(next);

      tabs[next].focus();

    });

  });

}

function setLang(lang) {

  state.lang = lang;

  document.documentElement.lang = lang;

  document.title = lang === 'ms' ? 'Fungsi Kuadratik (Quadratic Functions) (BETA) — Makmal STEM Matematik' : 'Quadratic Functions (Fungsi Kuadratik) (BETA) — Makmal STEM Mathematics';

  document.querySelectorAll('[data-i18n]').forEach(el => {

    const k = el.dataset.i18n;

    if (I18N[lang][k] !== undefined) el.textContent = I18N[lang][k];

  });

  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', I18N[lang][el.dataset.i18nAria]));

  $('tries').innerHTML = I18N[lang].tries.map(s => `<li>${s}</li>`).join('');

  try { localStorage.setItem('stemlab-lang', lang); } catch (e) {}

  state.dirty = true;

}



/* ===== Paparan ===== */

function updateReadouts() {

  const {h, k} = vertexOf(), D = discriminant(), r = rootsOf();

  const equation = polyStr();

  $('f-equation').textContent = equation;

  $('f-vertex').textContent = `(${n2(h)}, ${n2(k)}) · ${state.a > 0 ? 'Min' : 'Max'}`;

  $('f-axis').textContent = `x = ${n2(h)}`;

  $('f-yint').textContent = `(0, ${n2(state.c)})`;

  $('f-roots').textContent = r.length ? r.map((x, i) => `x${r.length === 2 ? (i === 0 ? '₁' : '₂') : ''} = ${n2(x)}`).join(', ') : tr('noRoots');

  $('quad-coordinates').innerHTML = COORDINATE_X

    .map(x => `<tr><th scope="row">${n2(x)}</th><td>${n2(yAt(x))}</td></tr>`).join('');

  $('note').textContent = tr(state.a > 0 ? 'notePos' : 'noteNeg') + ' ' + tr(D > 0 ? 'noteD2' : D === 0 ? 'noteD1' : 'noteD0');

}

const DPR = () => (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

function fitCanvas() {

  const c = $('plot'), w = Math.max(c.getBoundingClientRect().width, 220);

  c.style.height = w + 'px'; c.width = Math.round(w * DPR()); c.height = Math.round(w * DPR()); c._w = w; c._dpr = DPR();

  state.dirty = true;

}

function text(ctx, s, x, y, o = {}) {

  ctx.font = `${o.w || 600} ${o.size || 12}px "Plus Jakarta Sans", sans-serif`;

  ctx.fillStyle = o.color || '#1b1b21'; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';

  ctx.fillText(s, x, y);

}

function geom() { const c = $('plot'), W = c._w || 400, m = 30; return {W, m, X: x => m + (x + LIM.view) / (2 * LIM.view) * (W - 2 * m), Y: y => W - m - (y + LIM.view) / (2 * LIM.view) * (W - 2 * m)}; }

function dot(ctx, x, y, col, r = 6) { ctx.fillStyle = col; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); ctx.stroke(); }

function tag(ctx, s, x, y, col, align) {

  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';

  const w = ctx.measureText(s).width + 10, x0 = align === 'right' ? x - w + 5 : align === 'center' ? x - w / 2 : x - 5;

  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(x0, y - 13, w, 18);

  text(ctx, s, x, y, {color: col, w: 700, align});

}

function render() {

  updateReadouts(); syncControls();

  const c = $('plot'), ctx = c.getContext('2d'), {W, m, X, Y} = geom(), V = LIM.view;

  ctx.setTransform(c._dpr || 1, 0, 0, c._dpr || 1, 0, 0); ctx.clearRect(0, 0, W, W);

  // grid

  for (let i = -V; i <= V; i++) {

    ctx.strokeStyle = i % 5 === 0 ? '#d8c3ad' : '#eae7ef'; ctx.lineWidth = 1;

    ctx.beginPath(); ctx.moveTo(X(i), Y(-V)); ctx.lineTo(X(i), Y(V)); ctx.moveTo(X(-V), Y(i)); ctx.lineTo(X(V), Y(i)); ctx.stroke();

  }

  ctx.strokeStyle = '#1b1b21'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(-V), Y(0)); ctx.lineTo(X(V), Y(0)); ctx.moveTo(X(0), Y(-V)); ctx.lineTo(X(0), Y(V)); ctx.stroke();

  for (let i = -V; i <= V; i += 2) if (i) {

    text(ctx, n2(i), X(i), Y(0) + 15, {align: 'center', size: 10, color: '#534434'});

    text(ctx, n2(i), X(0) - 6, Y(i) + 4, {align: 'right', size: 10, color: '#534434'});

  }

  text(ctx, 'x', X(V) - 2, Y(0) - 8, {align: 'right', w: 800}); text(ctx, 'y', X(0) + 8, Y(V) + 12, {w: 800});

  const {h, k} = vertexOf(), r = rootsOf();

  // paksi simetri

  if (state.show.axis) {

    ctx.setLineDash([6, 5]); ctx.strokeStyle = '#9f4122'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(h), Y(-V)); ctx.lineTo(X(h), Y(V)); ctx.stroke(); ctx.setLineDash([]);

    if (Math.abs(h) <= V) tag(ctx, `x = ${n2(h)}`, X(h) + 6, Y(V) + 14, '#9f4122');

  }

  // parabola (dipotong pada kawasan plot)

  ctx.save(); ctx.beginPath(); ctx.rect(X(-V), Y(V), X(V) - X(-V), Y(-V) - Y(V)); ctx.clip();

  ctx.strokeStyle = '#855300'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.beginPath();

  for (let i = 0; i <= 400; i++) { const x = -V + 2 * V * i / 400, y = yAt(x); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); }

  ctx.stroke(); ctx.restore();

  // titik penting

  if (state.show.roots) r.forEach((x, i) => { if (Math.abs(x) <= V) { dot(ctx, X(x), Y(0), '#e11d48'); tag(ctx, r.length === 2 ? `x${i + 1} = ${n2(x)}` : `x = ${n2(x)}`, X(x), Y(0) + 30 - (i ? 0 : 0), '#e11d48', 'center'); } });

  if (state.show.yint && Math.abs(state.c) <= V) { dot(ctx, X(0), Y(state.c), '#006c49'); tag(ctx, `(0, ${n2(state.c)})`, X(0) + 10, Y(state.c) - 8, '#006c49'); }

  if (state.show.vertex) {

    if (Math.abs(h) <= V && Math.abs(k) <= V) { dot(ctx, X(h), Y(k), '#9f4122', 8); tag(ctx, `${tr('vtx')} (${n2(h)}, ${n2(k)})`, X(h) + 12, Y(k) + (state.a > 0 ? 24 : -12), '#9f4122'); }

    else text(ctx, tr('offscreen'), W - m, W - m - 8, {align: 'right', color: '#9f4122', w: 700});

  }

}

function frame() { if (state.dirty) { state.dirty = false; render(); } requestAnimationFrame(frame); }



window.addEventListener('DOMContentLoaded', () => {

  if (typeof parabolaArt !== 'undefined') $('quad-icon').innerHTML = parabolaArt;

  $('btn-reset').addEventListener('click', () => {

    for (const key of Object.keys(state.show)) state.show[key] = true;

    const {a, b, c} = DEFAULT_COEFFICIENTS;

    setCoeffs(a, b, c);

    syncControls();

  });

  for (const key of ['a', 'b', 'c']) {

    const slider = $('slider-' + key);

    slider.addEventListener('input', () => setCoefficient(key, Number(slider.value)));

    $('decrease-' + key).addEventListener('click', () => setCoefficient(key, state[key] - Number(slider.step)));

    $('increase-' + key).addEventListener('click', () => setCoefficient(key, state[key] + Number(slider.step)));

  }

  setupTabs();

  if (typeof setupLessonVideos === 'function') setupLessonVideos(quadraticLessonVideos);

  $('btn-lang').addEventListener('click', () => setLang(state.lang === 'ms' ? 'en' : 'ms'));

  document.querySelectorAll('[data-show]').forEach(input => input.addEventListener('change', () => {

    state.show[input.dataset.show] = input.checked;

    state.dirty = true;

  }));

  // seret verteks

  const pl = $('plot');

  const toMath = e => { const b = pl.getBoundingClientRect(), {W, m} = geom(); const px = (e.clientX - b.left) * (W / b.width), py = (e.clientY - b.top) * (W / b.height); return {x: (px - m) / (W - 2 * m) * 2 * LIM.view - LIM.view, y: LIM.view - (py - m) / (W - 2 * m) * 2 * LIM.view}; };

  pl.addEventListener('pointerdown', e => {

    const p = toMath(e), {h, k} = vertexOf(), {W, m} = geom(), s = (W - 2 * m) / (2 * LIM.view);

    if (Math.hypot((p.x - h) * s, (p.y - k) * s) > 30) return;

    state.dragging = true; pl.classList.add('dragging');

    try { pl.setPointerCapture(e.pointerId); } catch (err) {}

  });

  pl.addEventListener('pointermove', e => { if (state.dragging) { const p = toMath(e); moveVertex(p.x, p.y); } });

  const end = () => { state.dragging = false; pl.classList.remove('dragging'); };

  pl.addEventListener('pointerup', end); pl.addEventListener('pointercancel', end);

  pl.addEventListener('keydown', e => {

    const d = {ArrowLeft: [-.5, 0], ArrowRight: [.5, 0], ArrowUp: [0, .5], ArrowDown: [0, -.5]}[e.key];

    if (d) { e.preventDefault(); const {h, k} = vertexOf(); moveVertex(h + d[0], k + d[1]); }

  });

  window.addEventListener('resize', fitCanvas);

  if (typeof ResizeObserver === 'function') {

    const widths = new WeakMap();

    const observer = new ResizeObserver(entries => {

      let widthChanged = false;

      for (const {target, contentRect} of entries) {

        if (widths.get(target) === contentRect.width) continue;

        widths.set(target, contentRect.width);

        widthChanged = true;

      }

      if (widthChanged) fitCanvas();

    });

    ['plot'].forEach(id => observer.observe($(id)));

  }

  let saved = null; try { saved = localStorage.getItem('stemlab-lang'); } catch (e) {}

  fitCanvas(); setLang(saved === 'en' ? 'en' : 'ms'); syncControls();

  requestAnimationFrame(frame);

});
