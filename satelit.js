const $ = id => document.getElementById(id);

/* ===== Kawalan ===== */
function setParam(key, value) {
  if (!Number.isFinite(value) || !LIM[key]) return;
  const {min, max} = LIM[key];
  state[key] = r9(clamp(value, min, max));
  initSatellite();
  syncControls();
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  state.h = preset.h;
  state.ratio = preset.ratio;
  state.playing = true;
  initSatellite();
  syncControls();
}

function togglePlay(force) {
  state.playing = typeof force === 'boolean' ? force : !state.playing;
  state.dirty = true;
  syncControls();
}

function resetAll() {
  state.h = DEFAULT_STATE.h;
  state.ratio = DEFAULT_STATE.ratio;
  state.playing = DEFAULT_STATE.playing;
  for (const k of Object.keys(state.show)) state.show[k] = true;
  initSatellite();
  syncControls();
}

function syncControls() {
  $('slider-h').value = state.h;
  $('out-h').textContent = `${state.h.toLocaleString('en-US')} km`;
  $('decrease-h').disabled = state.h <= LIM.h.min + 1e-9;
  $('increase-h').disabled = state.h >= LIM.h.max - 1e-9;

  $('slider-ratio').value = state.ratio;
  $('out-ratio').textContent = `${state.ratio.toFixed(2)}×`;
  $('decrease-ratio').disabled = state.ratio <= LIM.ratio.min + 1e-9;
  $('increase-ratio').disabled = state.ratio >= LIM.ratio.max - 1e-9;

  document.querySelectorAll('[data-preset]').forEach(btn => {
    const p = PRESETS[btn.dataset.preset];
    const match = p && Math.abs(state.h - p.h) < 1e-6 && Math.abs(state.ratio - p.ratio) < 1e-6;
    btn.setAttribute('aria-pressed', String(Boolean(match)));
  });

  const playBtn = $('btn-play');
  playBtn.setAttribute('aria-pressed', String(state.playing));
  playBtn.textContent = tr(state.playing ? 'pause' : 'play');

  document.querySelectorAll('[data-show]').forEach(input => {
    input.checked = state.show[input.dataset.show];
  });
}

function setupTabs() {
  const tabs = [$('sat-tab-controls'), $('sat-tab-table')];
  const panes = [$('sat-pane-controls'), $('sat-pane-table')];
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
    ? 'Satelit Buatan Manusia (Man-Made Satellites) (BETA) — Makmal STEM Fizik'
    : 'Man-Made Satellites (Satelit Buatan Manusia) (BETA) — Makmal STEM Physics';
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
  const vo = orbitalSpeedKms();
  const ve = escapeSpeedKms();
  const vl = launchSpeedKms();
  const T = periodHours();
  const regime = classifyOrbit();

  $('f-vorb').textContent = `${nFmt(vo, 2)} km s⁻¹`;
  $('f-vesc').textContent = `${nFmt(ve, 2)} km s⁻¹`;
  $('f-vlaunch').textContent = `${nFmt(vl, 2)} km s⁻¹ (${state.ratio.toFixed(2)}× v)`;
  $('f-period').textContent = regime === 'escape'
    ? '∞'
    : `${nFmt(T, 2)} ${tr('hrUnit')}`;

  const statusKey = {
    geo: 'stGeo',
    circle: 'stCircle',
    ellipseHigh: 'stEllipseHigh',
    ellipseLow: 'stEllipseLow',
    crash: 'stCrash',
    escape: 'stEscaped'
  }[regime];
  $('f-status').textContent = tr(statusKey);

  const rows = [
    ...REF_SATELLITES.map(s => ({
      name: s[state.lang],
      h: s.h,
      vo: orbitalSpeedKms(s.h),
      ve: escapeSpeedKms(s.h),
      T: periodHours(s.h),
      current: false
    })),
    {
      name: tr('currentSat'),
      h: state.h,
      vo,
      ve,
      T,
      current: true
    }
  ];

  $('sat-table-body').innerHTML = rows.map(row =>
    `<tr${row.current ? ' class="is-current"' : ''}><th scope="row">${row.name}</th><td>${row.h.toLocaleString('en-US')}</td><td>${row.vo.toFixed(2)}</td><td>${row.ve.toFixed(2)}</td><td>${row.T.toFixed(2)}</td></tr>`
  ).join('');

  const noteKey = {
    geo: 'noteGeo',
    circle: 'noteCircle',
    ellipseHigh: 'noteEllipseHigh',
    ellipseLow: 'noteEllipseLow',
    crash: 'noteCrash',
    escape: 'noteEscape'
  }[regime];
  $('note').textContent = tr(noteKey)
    .replace('{vo}', nFmt(vo, 2))
    .replace('{ve}', nFmt(ve, 2))
    .replace('{vl}', nFmt(vl, 2))
    .replace('{T}', nFmt(T, 2));
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
  ctx.lineWidth = 2.3;
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

  ctx.fillStyle = 'rgba(255,255,255,0.26)';
  for (const [sx, sy, sr] of [[0.14,0.16,1.2],[0.31,0.09,1.4],[0.78,0.14,1.3],[0.89,0.28,1.1],[0.13,0.81,1.3],[0.83,0.84,1.5],[0.60,0.89,1.1],[0.45,0.12,1.0]]) {
    ctx.beginPath(); ctx.arc(W * sx, W * sy, sr, 0, TAU); ctx.fill();
  }

  const r0 = orbitRadiusNorm();
  const extent = state.ratio > 1.02 ? Math.max(r0 * 1.45, 2.2) : Math.max(r0 * 1.15, 1.45);
  const scale = (W * 0.42) / extent;
  const cx = W / 2, cy = W / 2;
  const X = x => cx + x * scale;
  const Y = y => cy - y * scale;
  const earthR = Math.max(18, scale);

  // Orbit bulatan rujukan pada altitud pelancaran
  if (state.show.refOrbit) {
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.34)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(cx, cy, r0 * scale, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  // Jejak trajektori satelit
  if (state.show.trail && sat.trail.length > 1) {
    ctx.save();
    ctx.strokeStyle = sat.crashed ? '#fb7185' : sat.escaped ? '#34d399' : '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    sat.trail.forEach((pt, idx) => idx ? ctx.lineTo(X(pt.x), Y(pt.y)) : ctx.moveTo(X(pt.x), Y(pt.y)));
    ctx.stroke();
    ctx.restore();
  }

  // Bumi di pusat (0, 0) dengan penanda putaran
  const eGrad = ctx.createRadialGradient(cx - earthR * 0.25, cy - earthR * 0.25, earthR * 0.1, cx, cy, earthR);
  eGrad.addColorStop(0, '#38bdf8');
  eGrad.addColorStop(0.65, '#0284c7');
  eGrad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = eGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, earthR, 0, TAU);
  ctx.fill();

  // Garis meridian berputar untuk menampakkan putaran Bumi
  ctx.save();
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
  ctx.lineWidth = 1.2;
  for (const offset of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const ang = sat.earthAngle + offset;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * earthR * 0.35, cy - Math.sin(ang) * earthR * 0.35);
    ctx.lineTo(cx + Math.cos(ang) * earthR * 0.96, cy - Math.sin(ang) * earthR * 0.96);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, earthR, 0, TAU);
  ctx.stroke();

  const sx = X(sat.x), sy = Y(sat.y);

  // Stesen Bumi dan garis penglihatan ke satelit
  if (state.show.station) {
    const stX = cx + Math.cos(sat.earthAngle) * earthR;
    const stY = cy - Math.sin(sat.earthAngle) * earthR;

    ctx.save();
    ctx.strokeStyle = isGeostationary() ? 'rgba(52, 211, 153, 0.55)' : 'rgba(52, 211, 153, 0.24)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(stX, stY);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#34d399';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(stX, stY, 4.5, 0, TAU);
    ctx.fill();
    ctx.stroke();

    text(ctx, tr('stationLabel'), stX + Math.cos(sat.earthAngle) * 12, stY - Math.sin(sat.earthAngle) * 12 + 4, {
      color: '#6ee7b7', align: 'center', size: 10, w: 700
    });
  }

  // Vektor halaju v dan tarikan graviti Fg
  if (state.show.velocity && !sat.crashed) {
    const vMag = Math.hypot(sat.vx, sat.vy);
    if (vMag > 1e-6) {
      const vLen = clamp(vMag * 36, 18, 56);
      const vxEnd = sx + (sat.vx / vMag) * vLen;
      const vyEnd = sy - (sat.vy / vMag) * vLen;
      drawArrow(ctx, sx, sy, vxEnd, vyEnd, '#fb7185');
      text(ctx, 'v', vxEnd + (sat.vx / vMag) * 8, vyEnd - (sat.vy / vMag) * 8 + 4, {
        color: '#fda4af', align: 'center', size: 11, w: 800
      });
    }

    const rNow = Math.hypot(sat.x, sat.y);
    if (rNow > 1e-6) {
      const gLen = 22;
      const gxEnd = sx - (sat.x / rNow) * gLen;
      const gyEnd = sy + (sat.y / rNow) * gLen;
      drawArrow(ctx, sx, sy, gxEnd, gyEnd, '#38bdf8');
    }
  }

  // Satelit
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = sat.crashed ? '#fb7185' : '#fbbf24';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (!sat.crashed) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-11, -2.2, 4.5, 4.4);
    ctx.fillRect(6.5, -2.2, 4.5, 4.4);
  }
  ctx.restore();

  text(ctx, tr('canvasTitle'), 14, 22, {color: '#cbd5e1', size: 11, w: 700});
  if (sat.crashed) {
    text(ctx, tr('stCrashedNow'), W / 2, W - 18, {color: '#fda4af', align: 'center', size: 12, w: 800});
  } else if (sat.escaped) {
    text(ctx, tr('stEscapedNow'), W / 2, W - 18, {color: '#6ee7b7', align: 'center', size: 12, w: 800});
  }
}

let lastTime = 0;
function frame(ts) {
  if (lastTime && state.playing) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    stepPhysics(dt);
  }
  lastTime = ts;
  if (state.dirty) {
    state.dirty = false;
    render();
  }
  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', () => {
  for (const key of ['h', 'ratio']) {
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
  $('btn-relaunch').addEventListener('click', () => {
    state.playing = true;
    initSatellite();
    syncControls();
  });
  $('btn-reset').addEventListener('click', resetAll);

  setupTabs();
  if (typeof setupLessonVideos === 'function') setupLessonVideos({id: 'satelit', videos: []});
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
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      state.playing = true;
      initSatellite();
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
  initSatellite();
  fitCanvas();
  setLang(saved === 'en' ? 'en' : 'ms');
  syncControls();
  requestAnimationFrame(frame);
});
