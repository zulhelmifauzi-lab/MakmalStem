const $ = id => document.getElementById(id);

/* ===== Kawalan ===== */
function setParam(key, value) {
  if (!Number.isFinite(value) || !LIM[key]) return;
  const {min, max} = LIM[key];
  state[key] = r9(clamp(value, min, max));
  state.dirty = true;
  syncControls();
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  state.a = preset.a;
  state.e = preset.e;
  state.dirty = true;
  syncControls();
}

function togglePlay(force) {
  state.playing = typeof force === 'boolean' ? force : !state.playing;
  state.dirty = true;
  syncControls();
}

function setSpeed(spd) {
  if (!Number.isFinite(spd) || spd <= 0) return;
  state.speed = spd;
  state.dirty = true;
  syncControls();
}

function resetAll() {
  state.a = DEFAULT_STATE.a;
  state.e = DEFAULT_STATE.e;
  state.meanAnomaly = DEFAULT_STATE.meanAnomaly;
  state.playing = DEFAULT_STATE.playing;
  state.speed = DEFAULT_STATE.speed;
  for (const k of Object.keys(state.show)) state.show[k] = true;
  state.dirty = true;
  syncControls();
}

function syncControls() {
  for (const key of ['a', 'e']) {
    const slider = $('slider-' + key);
    const {min, max} = LIM[key];
    slider.value = state[key];
    $('out-' + key).textContent = key === 'a'
      ? `${nFmt(state.a, 1)} AU`
      : state.e.toFixed(2);
    $('decrease-' + key).disabled = state[key] <= min + 1e-9;
    $('increase-' + key).disabled = state[key] >= max - 1e-9;
  }

  document.querySelectorAll('[data-preset]').forEach(btn => {
    const p = PRESETS[btn.dataset.preset];
    const match = p && Math.abs(state.a - p.a) < 1e-6 && Math.abs(state.e - p.e) < 1e-6;
    btn.setAttribute('aria-pressed', String(Boolean(match)));
  });

  const playBtn = $('btn-play');
  playBtn.setAttribute('aria-pressed', String(state.playing));
  playBtn.textContent = tr(state.playing ? 'pause' : 'play');

  document.querySelectorAll('[data-speed]').forEach(btn => {
    const val = Number(btn.dataset.speed);
    btn.setAttribute('aria-pressed', String(Math.abs(state.speed - val) < 1e-6));
  });

  document.querySelectorAll('[data-show]').forEach(input => {
    input.checked = state.show[input.dataset.show];
  });
}

function setupTabs() {
  const tabs = [$('kepler-tab-controls'), $('kepler-tab-table')];
  const panes = [$('kepler-pane-controls'), $('kepler-pane-table')];
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
  document.title = lang === 'ms'
    ? 'Hukum Kepler (Kepler\'s Laws) (BETA) — Makmal STEM Fizik'
    : 'Kepler\'s Laws (Hukum Kepler) (BETA) — Makmal STEM Physics';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (I18N[lang][k] !== undefined) el.textContent = I18N[lang][k];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', I18N[lang][el.dataset.i18nAria]);
  });
  $('tries').innerHTML = I18N[lang].tries.map(s => `<li>${s}</li>`).join('');
  try { localStorage.setItem('stemlab-lang', lang); } catch (e) {}
  state.dirty = true;
}

/* ===== Paparan ===== */
function updateReadouts() {
  const pos = planetPos();
  const T = periodYears();
  const days = Math.round(T * 365.25);
  const v = orbitalSpeed(pos.r);
  const area = sectorArea();
  const rp = perihelion();
  const ra = aphelion();
  const vp = orbitalSpeed(rp);
  const va = orbitalSpeed(ra);

  $('f-period').textContent = `${nFmt(T, 2)} ${tr('yrUnit')} (${days.toLocaleString('en-US')} ${tr('daysUnit')})`;
  $('f-ratio').textContent = `${keplerRatio().toFixed(2)} ${tr('ratioUnit')}`;
  $('f-r').textContent = `${nFmt(pos.r, 2)} AU (${tr('periLabel')}: ${nFmt(rp, 2)} · ${tr('apheLabel')}: ${nFmt(ra, 2)})`;
  $('f-speed').textContent = `${nFmt(v, 2)} km s⁻¹`;
  $('f-area').textContent = `ΔA₁ = ΔA₂ = ${nFmt(area, 2)} AU²`;

  const rows = [
    ...SOLAR_PLANETS.map(pl => ({
      name: pl[state.lang],
      a: pl.a,
      T: periodYears(pl.a),
      ratio: keplerRatio(pl.a),
      current: false
    })),
    {
      name: tr('currentOrbit'),
      a: state.a,
      T,
      ratio: keplerRatio(state.a),
      current: true
    }
  ];

  $('kepler-table-body').innerHTML = rows.map(row =>
    `<tr${row.current ? ' class="is-current"' : ''}><th scope="row">${row.name}</th><td>${row.a.toFixed(2)}</td><td>${row.T.toFixed(2)}</td><td>${row.ratio.toFixed(2)}</td></tr>`
  ).join('');

  if (state.e < 1e-6) {
    $('note').textContent = tr('noteCircle').replace('{vp}', nFmt(vp, 1));
  } else {
    $('note').textContent = tr('noteEllipse')
      .replace('{e}', state.e.toFixed(2))
      .replace('{vp}', nFmt(vp, 1))
      .replace('{va}', nFmt(va, 1));
  }
}

const DPR = () => (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
function fitCanvas() {
  const c = $('plot'), w = Math.max(c.getBoundingClientRect().width, 220);
  c.style.height = w + 'px';
  c.width = Math.round(w * DPR());
  c.height = Math.round(w * DPR());
  c._w = w;
  c._dpr = DPR();
  state.dirty = true;
}

function text(ctx, s, x, y, o = {}) {
  ctx.font = `${o.w || 600} ${o.size || 12}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = o.color || '#f8fafc';
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  ctx.fillText(s, x, y);
}

function drawArrow(ctx, x1, y1, x2, y2, color) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const ux = dx / len, uy = dy / len;
  const head = Math.min(8, len * 0.42);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * head - uy * head * 0.55, y2 - uy * head + ux * head * 0.55);
  ctx.lineTo(x2 - ux * head + uy * head * 0.55, y2 - uy * head - ux * head * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSector(ctx, X, Y, mStart, mEnd, fillColor, strokeColor, label) {
  const steps = 24;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(X(0), Y(0));
  for (let i = 0; i <= steps; i++) {
    const m = mStart + ((mEnd - mStart) * i) / steps;
    const pt = planetPos(m);
    ctx.lineTo(X(pt.x), Y(pt.y));
  }
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const midPt = planetPos((mStart + mEnd) / 2);
  const lx = X(midPt.x * 0.58);
  const ly = Y(midPt.y * 0.58) + 4;
  text(ctx, label, lx, ly, {color: strokeColor, align: 'center', size: 11, w: 800});
  ctx.restore();
}

function render() {
  updateReadouts();
  syncControls();
  const c = $('plot'), ctx = c.getContext('2d');
  const W = c._w || 420;
  ctx.setTransform(c._dpr || 1, 0, 0, c._dpr || 1, 0, 0);
  ctx.clearRect(0, 0, W, W);

  // Latar angkasa
  const spaceGrad = ctx.createLinearGradient(0, 0, W, W);
  spaceGrad.addColorStop(0, '#0b1120');
  spaceGrad.addColorStop(1, '#172542');
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, W, W);

  // Bintang latar
  ctx.fillStyle = 'rgba(255,255,255,0.26)';
  for (const [sx, sy, sr] of [[0.12,0.14,1.2],[0.27,0.09,1.4],[0.76,0.12,1.3],[0.88,0.25,1.1],[0.15,0.82,1.3],[0.84,0.85,1.5],[0.62,0.88,1.1],[0.42,0.11,1.0]]) {
    ctx.beginPath(); ctx.arc(W * sx, W * sy, sr, 0, TAU); ctx.fill();
  }

  const pad = Math.max(36, W * 0.095);
  const scale = (W / 2 - pad) / Math.max(state.a, 0.5);
  const cx = W / 2, cy = W / 2;
  const X = x => cx + (x + focalDist()) * scale;
  const Y = y => cy - y * scale;

  const b = semiMinor();
  const aPx = state.a * scale;
  const bPx = b * scale;

  // Bulatan rujukan 1 AU (Bumi) untuk kesedaran skala saiz orbit
  const oneAuPx = scale;
  if (oneAuPx < W * 0.46) {
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(X(0), Y(0), oneAuPx, 0, TAU);
    ctx.stroke();
    text(ctx, tr('earthRef'), X(0), Y(0) - oneAuPx - 5, {color: '#94a3b8', align: 'center', size: 10, w: 600});
    ctx.restore();
  }

  // Sektor luas sama (Hukum Kepler II)
  if (state.show.areas) {
    drawSector(ctx, X, Y, -0.05 * TAU, 0.05 * TAU, 'rgba(245, 158, 11, 0.28)', '#fbbf24', 'ΔA₁');
    drawSector(ctx, X, Y, 0.45 * TAU, 0.55 * TAU, 'rgba(56, 189, 248, 0.24)', '#38bdf8', 'ΔA₂');
  }

  // Paksi utama & kedua-dua fokus (Hukum Kepler I)
  if (state.show.axes) {
    ctx.save();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.3)';
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - aPx, cy); ctx.lineTo(cx + aPx, cy);
    ctx.moveTo(cx, cy - bPx); ctx.lineTo(cx, cy + bPx);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fokus kosong F2
    const f2X = X(-2 * focalDist());
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(f2X, cy, 4, 0, TAU);
    ctx.stroke();
    if (state.e >= 0.1) {
      text(ctx, tr('focusLabel'), f2X, cy + 16, {color: '#cbd5e1', align: 'center', size: 10, w: 700});
    }

    // Label paksi semi-major a
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 2); ctx.lineTo(cx + aPx, cy - 2);
    ctx.stroke();
    text(ctx, `a = ${nFmt(state.a, 1)} AU`, cx + aPx * 0.5, cy - 8, {color: '#fdba74', align: 'center', size: 10, w: 700});
    ctx.restore();
  }

  // Laluan orbit elips
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.78)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, aPx, bPx, 0, 0, TAU);
  ctx.stroke();

  // Matahari di fokus F1 = (0, 0)
  const sunX = X(0), sunY = Y(0);
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 3, sunX, sunY, 20);
  sunGlow.addColorStop(0, '#fef08a');
  sunGlow.addColorStop(0.45, '#f59e0b');
  sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath(); ctx.arc(sunX, sunY, 20, 0, TAU); ctx.fill();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath(); ctx.arc(sunX, sunY, 8.5, 0, TAU); ctx.fill();
  text(ctx, tr('sunLabel'), sunX, sunY + 20, {color: '#fde68a', align: 'center', size: 10, w: 700});

  // Kedudukan planet semasa
  const pos = planetPos();
  const px = X(pos.x), py = Y(pos.y);

  // Garis jejari r dari Matahari ke planet
  if (state.show.radius) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(px, py);
    ctx.stroke();

    const midX = (sunX + px) / 2, midY = (sunY + py) / 2;
    text(ctx, `r = ${nFmt(pos.r, 2)}`, midX, midY - 6, {color: '#7dd3fc', align: 'center', size: 10, w: 700});
    ctx.restore();
  }

  // Vektor laju tangen v
  if (state.show.velocity) {
    const tx = -state.a * Math.sin(pos.E);
    const ty = -b * Math.cos(pos.E);
    const tMag = Math.hypot(tx, ty) || 1;
    const v = orbitalSpeed(pos.r);
    const arrowLen = clamp(v * 1.15, 16, 62);
    const vx = px + (tx / tMag) * arrowLen;
    const vy = py + (ty / tMag) * arrowLen;
    drawArrow(ctx, px, py, vx, vy, '#34d399');
    text(ctx, 'v', vx + (tx / tMag) * 8, vy + (ty / tMag) * 8 + 4, {color: '#6ee7b7', align: 'center', size: 11, w: 800});
  }

  // Planet
  ctx.fillStyle = '#38bdf8';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(px, py, 7, 0, TAU);
  ctx.fill();
  ctx.stroke();

  text(ctx, tr('canvasTitle'), 14, 22, {color: '#cbd5e1', size: 11, w: 700});
}

let lastTime = 0;
function frame(ts) {
  if (lastTime && state.playing) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    stepOrbit(dt);
  }
  lastTime = ts;
  if (state.dirty) {
    state.dirty = false;
    render();
  }
  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', () => {
  for (const key of ['a', 'e']) {
    const slider = $('slider-' + key);
    const {step} = LIM[key];
    slider.addEventListener('input', () => setParam(key, Number(slider.value)));
    $('decrease-' + key).addEventListener('click', () => setParam(key, state[key] - step));
    $('increase-' + key).addEventListener('click', () => setParam(key, state[key] + step));
  }

  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });

  $('btn-play').addEventListener('click', () => togglePlay());
  document.querySelectorAll('[data-speed]').forEach(btn => {
    btn.addEventListener('click', () => setSpeed(Number(btn.dataset.speed)));
  });

  $('btn-reset').addEventListener('click', resetAll);
  setupTabs();
  if (typeof setupLessonVideos === 'function') setupLessonVideos({id: 'hukum-kepler', videos: []});
  $('btn-lang').addEventListener('click', () => setLang(state.lang === 'ms' ? 'en' : 'ms'));

  document.querySelectorAll('[data-show]').forEach(input => input.addEventListener('change', () => {
    state.show[input.dataset.show] = input.checked;
    state.dirty = true;
  }));

  const pl = $('plot');
  pl.addEventListener('click', () => togglePlay());
  pl.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      state.playing = false;
      state.meanAnomaly = (state.meanAnomaly + 0.15) % TAU;
      state.dirty = true;
      syncControls();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      state.playing = false;
      state.meanAnomaly = ((state.meanAnomaly - 0.15) % TAU + TAU) % TAU;
      state.dirty = true;
      syncControls();
    }
  });

  window.addEventListener('resize', fitCanvas);
  if (typeof ResizeObserver === 'function') {
    const widths = new WeakMap();
    const observer = new ResizeObserver(entries => {
      let changed = false;
      for (const {target, contentRect} of entries) {
        if (widths.get(target) === contentRect.width) continue;
        widths.set(target, contentRect.width);
        changed = true;
      }
      if (changed) fitCanvas();
    });
    observer.observe(pl);
  }

  let saved = null;
  try { saved = localStorage.getItem('stemlab-lang'); } catch (e) {}
  fitCanvas();
  setLang(saved === 'en' ? 'en' : 'ms');
  syncControls();
  requestAnimationFrame(frame);
});
