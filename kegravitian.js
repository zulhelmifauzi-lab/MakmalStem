const $ = id => document.getElementById(id);

/* ===== Kawalan ===== */
function setParam(key, value) {
  if (!Number.isFinite(value) || !LIM[key]) return;
  const {min, max} = LIM[key];
  state[key] = r9(clamp(value, min, max));
  state.dirty = true;
  syncControls();
}

function setPreset(rRatio) {
  setParam('r', rRatio);
}

function moveRadius(rRatio) {
  if (!Number.isFinite(rRatio)) return;
  const snapped = Math.round(rRatio / LIM.r.step) * LIM.r.step;
  setParam('r', snapped);
}

function resetAll() {
  state.M = DEFAULT_STATE.M;
  state.m = DEFAULT_STATE.m;
  state.r = DEFAULT_STATE.r;
  for (const k of Object.keys(state.show)) state.show[k] = true;
  state.dirty = true;
  syncControls();
}

function syncControls() {
  for (const key of ['M', 'm', 'r']) {
    const slider = $('slider-' + key);
    const {min, max} = LIM[key];
    slider.value = state[key];
    $('out-' + key).textContent = key === 'M'
      ? `${nFmt(state.M, 1)}×`
      : key === 'm'
        ? `${state.m} kg`
        : `${nFmt(state.r, 1)}R`;
    $('decrease-' + key).disabled = state[key] <= min + 1e-9;
    $('increase-' + key).disabled = state[key] >= max - 1e-9;
  }

  document.querySelectorAll('[data-preset]').forEach(btn => {
    const val = Number(btn.dataset.preset);
    btn.setAttribute('aria-pressed', String(Math.abs(state.r - val) < 1e-6));
  });

  document.querySelectorAll('[data-show]').forEach(input => {
    input.checked = state.show[input.dataset.show];
  });
}

function setupTabs() {
  const tabs = [$('grav-tab-controls'), $('grav-tab-table')];
  const panes = [$('grav-pane-controls'), $('grav-pane-table')];
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
    ? 'Kegravitian Semesta (Universal Gravitation) (BETA) — Makmal STEM Fizik'
    : 'Universal Gravitation (Kegravitian Semesta) (BETA) — Makmal STEM Physics';
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
  const g0 = surfaceG();
  const g = accelG();
  const f = forceN();
  const alt = altitudeKm();
  const rKm = Math.round(distMeters() / 1000);
  const ratio = g / g0;

  $('f-force').textContent = fmtForce(f);
  $('f-g').textContent = `${nFmt(g, 2)} m s⁻² (${nFmt(ratio, 2)} g₀)`;
  $('f-r').textContent = `${nFmt(state.r, 1)}R (${fmtInt(rKm)} km)`;

  if (Math.abs(state.r - 1) < 1e-6) {
    $('f-alt').textContent = tr('altSurface');
  } else if (state.r > 1) {
    $('f-alt').textContent = tr('altAbove').replace('{km}', fmtInt(alt));
  } else {
    $('f-alt').textContent = tr('altInside').replace('{km}', fmtInt(Math.abs(alt)));
  }

  $('f-law').textContent = tr(state.r < 1 ? 'lawInside' : 'lawOutside');

  $('grav-table-body').innerHTML = COORDINATE_R.map(rVal => {
    const gVal = accelG(rVal);
    const fVal = forceN(rVal);
    const active = Math.abs(rVal - state.r) < 1e-6 ? ' class="is-current"' : '';
    return `<tr${active}><th scope="row">${nFmt(rVal, 1)}R</th><td>${nFmt(gVal, 2)}</td><td>${fmtInt(fVal)}</td></tr>`;
  }).join('');

  if (state.r < 1 - 1e-6) {
    $('note').textContent = tr('noteInside');
  } else if (Math.abs(state.r - 1) < 1e-6) {
    $('note').textContent = tr('noteSurface');
  } else {
    const invSq = state.r * state.r;
    const fracStr = Math.abs(invSq - Math.round(invSq)) < 1e-6
      ? `1/${Math.round(invSq)}`
      : `${nFmt(1 / invSq * 100, 1)}%`;
    $('note').textContent = tr('noteOutside')
      .replace('{r}', nFmt(state.r, 1))
      .replace('{frac}', fracStr);
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

function geom() {
  const c = $('plot'), W = c._w || 420;
  const x0 = Math.max(54, W * 0.17);
  const xMax = W - Math.max(20, W * 0.05);
  const Rpx = (xMax - x0) / 5;
  const splitY = state.show.graph ? Math.round(W * 0.46) : W;
  const gTop = splitY + 34;
  const gBot = W - 34;
  return {
    W, x0, xMax, Rpx, splitY, gTop, gBot,
    X: rVal => x0 + clamp(rVal, 0, 5.2) * Rpx,
    Y: gVal => gBot - (clamp(gVal, 0, G_MAX_AXIS) / G_MAX_AXIS) * (gBot - gTop)
  };
}

function text(ctx, s, x, y, o = {}) {
  ctx.font = `${o.w || 600} ${o.size || 12}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = o.color || '#1b1b21';
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  ctx.fillText(s, x, y);
}

function drawArrow(ctx, x1, y1, x2, y2, color) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const ux = dx / len, uy = dy / len;
  const head = Math.min(8, len * 0.45);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
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
  const c = $('plot'), ctx = c.getContext('2d'), G_MET = geom();
  const {W, x0, xMax, Rpx, splitY, gTop, gBot, X, Y} = G_MET;
  ctx.setTransform(c._dpr || 1, 0, 0, c._dpr || 1, 0, 0);
  ctx.clearRect(0, 0, W, W);

  /* === Bahagian Atas: Angkasa, Planet & Daya Graviti === */
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, splitY);
  ctx.clip();

  const spaceGrad = ctx.createLinearGradient(0, 0, W, splitY);
  spaceGrad.addColorStop(0, '#0b1120');
  spaceGrad.addColorStop(1, '#172542');
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, W, splitY);

  const cy = Math.round(splitY * 0.52);

  // Bintang halus
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  for (const [sx, sy, sr] of [[0.28,0.18,1.2],[0.52,0.14,1.5],[0.71,0.22,1.1],[0.88,0.16,1.4],[0.41,0.82,1.2],[0.79,0.78,1.5],[0.93,0.65,1.1]]) {
    ctx.beginPath(); ctx.arc(W * sx, splitY * sy, sr, 0, 6.2832); ctx.fill();
  }

  // Garis medan graviti (jika diaktifkan)
  if (state.show.field) {
    ctx.save();
    for (let ring = 1.5; ring <= 5; ring += 1) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x0, cy, ring * Rpx, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.lineWidth = 1;
    for (const deg of [-35, -18, 0, 18, 35]) {
      const ang = deg * Math.PI / 180;
      const rIn = Rpx * 1.04, rOut = Rpx * 5.2;
      ctx.beginPath();
      ctx.moveTo(x0 + Math.cos(ang) * rIn, cy + Math.sin(ang) * rIn);
      ctx.lineTo(x0 + Math.cos(ang) * rOut, cy + Math.sin(ang) * rOut);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Garis pandu menegak ke graf bawah
  const objX = X(state.r);
  if (state.show.graph) {
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(objX, cy);
    ctx.lineTo(objX, splitY);
    ctx.stroke();
    ctx.restore();
  }

  // Planet M1 (jejari tetap Rpx, kepekatan warna meningkat ikut M)
  const planetAlpha = 0.72 + (state.M / 3) * 0.28;
  const pGrad = ctx.createRadialGradient(x0 - Rpx * 0.25, cy - Rpx * 0.25, Rpx * 0.1, x0, cy, Rpx);
  pGrad.addColorStop(0, `rgba(56, 189, 248, ${planetAlpha})`);
  pGrad.addColorStop(0.65, `rgba(2, 132, 199, ${planetAlpha})`);
  pGrad.addColorStop(1, 'rgba(12, 74, 110, 0.96)');
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.arc(x0, cy, Rpx, 0, 6.2832);
  ctx.fill();

  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x0, cy, Rpx, 0, 6.2832);
  ctx.stroke();

  // Pusat planet O
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.arc(x0, cy, 3.5, 0, 6.2832);
  ctx.fill();
  text(ctx, 'M₁', x0 - 4, cy - Rpx * 0.42, {color: '#f8fafc', align: 'center', w: 800, size: 13});
  text(ctx, `${nFmt(state.M, 1)}M₀`, x0 - 4, cy - Rpx * 0.42 + 15, {color: '#bae6fd', align: 'center', w: 600, size: 10});

  // Pembaris jarak r dan R
  if (state.show.distance) {
    const ry = cy + Rpx + 18;
    const clampedRy = Math.min(ry, splitY - 16);
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x0, clampedRy - 4); ctx.lineTo(x0, clampedRy + 4);
    ctx.moveTo(x0, clampedRy); ctx.lineTo(objX, clampedRy);
    ctx.moveTo(objX, clampedRy - 4); ctx.lineTo(objX, clampedRy + 4);
    ctx.stroke();

    // Tanda jejari R
    const surfX = X(1);
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(surfX, cy + Rpx - 5); ctx.lineTo(surfX, clampedRy + 4);
    ctx.stroke();

    text(ctx, 'R', (x0 + surfX) / 2, clampedRy - 5, {color: '#7dd3fc', align: 'center', size: 10, w: 700});
    text(ctx, `r = ${nFmt(state.r, 1)}R`, Math.max((x0 + objX) / 2, x0 + 28), clampedRy + 12, {color: '#e2e8f0', align: 'center', size: 11, w: 700});
    ctx.restore();
  }

  // Objek / Satelit m2
  const objRadius = 6 + (state.m / 2000) * 6.5;
  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#fffbeb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(objX, cy, objRadius, 0, 6.2832);
  ctx.fill();
  ctx.stroke();
  text(ctx, `m₂ (${state.m} kg)`, objX, cy - objRadius - 10, {color: '#fde68a', align: objX > W - 55 ? 'right' : 'center', size: 11, w: 700});

  // Vektor daya graviti (sama magnitud dan bertentangan arah)
  if (state.show.vectors) {
    const f = forceN();
    const arrowLen = clamp(Math.pow(f / 4900, 0.32) * 34, 15, 62);
    const sep = objX - x0;
    const offset = sep < arrowLen * 2 + 12 ? 9 : 0;
    // Daya ke atas m2 (tarikan ke kiri menuju pusat M1)
    drawArrow(ctx, objX - objRadius - 2, cy - offset, objX - objRadius - 2 - arrowLen, cy - offset, '#fb7185');
    // Daya ke atas M1 (tarikan ke kanan menuju m2)
    drawArrow(ctx, x0 + 4, cy + offset, x0 + 4 + arrowLen, cy + offset, '#fb7185');
    text(ctx, 'F', objX - objRadius - arrowLen * 0.5, cy - offset - 8, {color: '#fda4af', align: 'center', size: 11, w: 800});
    text(ctx, 'F', x0 + 4 + arrowLen * 0.5, cy + offset + 14, {color: '#fda4af', align: 'center', size: 11, w: 800});
  }

  text(ctx, tr('canvasTitleTop'), 14, 20, {color: '#cbd5e1', size: 11, w: 700});
  ctx.restore();

  /* === Bahagian Bawah: Graf Pecutan Graviti g melawan r === */
  if (!state.show.graph) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, splitY, W, W - splitY);
  ctx.strokeStyle = '#dcd5e8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, splitY);
  ctx.lineTo(W, splitY);
  ctx.stroke();

  text(ctx, tr('canvasTitleGraph'), x0, splitY + 19, {color: '#362951', size: 11, w: 700});

  // Grid graf
  ctx.strokeStyle = '#efeaf8';
  ctx.lineWidth = 1;
  for (let rTick = 0; rTick <= 5; rTick++) {
    ctx.beginPath();
    ctx.moveTo(X(rTick), gTop);
    ctx.lineTo(X(rTick), gBot);
    ctx.stroke();
  }
  for (let gTick = 0; gTick <= 30; gTick += 10) {
    ctx.beginPath();
    ctx.moveTo(x0, Y(gTick));
    ctx.lineTo(xMax, Y(gTick));
    ctx.stroke();
  }

  // Garis sempadan permukaan r = R
  ctx.save();
  ctx.strokeStyle = '#0284c7';
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X(1), gTop);
  ctx.lineTo(X(1), gBot);
  ctx.stroke();
  ctx.restore();
  text(ctx, tr('canvasSurface'), X(1) + 5, gTop + 11, {color: '#0369a1', size: 10, w: 700});

  // Paksi graf
  ctx.strokeStyle = '#252137';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x0, gTop);
  ctx.lineTo(x0, gBot);
  ctx.lineTo(xMax, gBot);
  ctx.stroke();

  for (let rTick = 1; rTick <= 5; rTick++) {
    text(ctx, `${rTick}R`, X(rTick), gBot + 14, {align: 'center', size: 10, color: '#534434'});
  }
  text(ctx, '0', x0, gBot + 14, {align: 'center', size: 10, color: '#534434'});
  for (let gTick = 10; gTick <= 30; gTick += 10) {
    text(ctx, String(gTick), x0 - 7, Y(gTick) + 4, {align: 'right', size: 10, color: '#534434'});
  }
  text(ctx, 'g', x0 - 10, gTop + 8, {align: 'right', size: 11, w: 800, color: '#362951'});
  text(ctx, 'r', xMax + 8, gBot + 4, {align: 'left', size: 11, w: 800, color: '#362951'});

  // Kawasan lorekan lembut di bawah lengkung g(r)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(X(0), Y(0));
  ctx.lineTo(X(1), Y(surfaceG()));
  for (let i = 1; i <= 160; i++) {
    const rSample = 1 + (4 * i) / 160;
    ctx.lineTo(X(rSample), Y(accelG(rSample)));
  }
  ctx.lineTo(X(5), Y(0));
  ctx.closePath();
  ctx.fillStyle = 'rgba(159, 65, 34, 0.1)';
  ctx.fill();

  // Lengkung g(r): linear untuk r < 1, 1/r^2 untuk r >= 1
  ctx.strokeStyle = '#9f4122';
  ctx.lineWidth = 2.8;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(X(0), Y(0));
  ctx.lineTo(X(1), Y(surfaceG()));
  for (let i = 1; i <= 160; i++) {
    const rSample = 1 + (4 * i) / 160;
    ctx.lineTo(X(rSample), Y(accelG(rSample)));
  }
  ctx.stroke();
  ctx.restore();

  // Garis panduan menegak & mendatar ke titik aktif (state.r, accelG())
  const gCur = accelG();
  const px = X(state.r), py = Y(gCur);
  ctx.save();
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(px, splitY);
  ctx.lineTo(px, gBot);
  ctx.moveTo(x0, py);
  ctx.lineTo(px, py);
  ctx.stroke();
  ctx.restore();

  // Titik aktif di atas lengkung
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(px, py, 6.5, 0, 6.2832);
  ctx.fill();
  ctx.stroke();

  const tagText = `(${nFmt(state.r, 1)}R, ${nFmt(gCur, 2)})`;
  const tagAlign = state.r > 3.6 ? 'right' : 'left';
  const tagX = px + (tagAlign === 'right' ? -10 : 10);
  const tagY = clamp(py - 10, gTop + 14, gBot - 10);
  text(ctx, tagText, tagX, tagY, {color: '#9f4122', align: tagAlign, size: 11, w: 800});
}

function frame() {
  if (state.dirty) { state.dirty = false; render(); }
  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', () => {
  for (const key of ['M', 'm', 'r']) {
    const slider = $('slider-' + key);
    const {step} = LIM[key];
    slider.addEventListener('input', () => setParam(key, Number(slider.value)));
    $('decrease-' + key).addEventListener('click', () => setParam(key, state[key] - step));
    $('increase-' + key).addEventListener('click', () => setParam(key, state[key] + step));
  }

  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => setPreset(Number(btn.dataset.preset)));
  });

  $('btn-reset').addEventListener('click', resetAll);
  setupTabs();
  if (typeof setupLessonVideos === 'function') setupLessonVideos({id: 'kegravitian', videos: []});
  $('btn-lang').addEventListener('click', () => setLang(state.lang === 'ms' ? 'en' : 'ms'));

  document.querySelectorAll('[data-show]').forEach(input => input.addEventListener('change', () => {
    state.show[input.dataset.show] = input.checked;
    state.dirty = true;
  }));

  // Seret objek atau klik pada kanvas untuk ubah jarak r
  const pl = $('plot');
  const toRadius = e => {
    const b = pl.getBoundingClientRect();
    const {W, x0, Rpx} = geom();
    const px = (e.clientX - b.left) * (W / b.width);
    return (px - x0) / Rpx;
  };
  pl.addEventListener('pointerdown', e => {
    moveRadius(toRadius(e));
    state.dragging = true;
    pl.classList.add('dragging');
    try { pl.setPointerCapture(e.pointerId); } catch (err) {}
  });
  pl.addEventListener('pointermove', e => {
    if (state.dragging) moveRadius(toRadius(e));
  });
  const endDrag = () => { state.dragging = false; pl.classList.remove('dragging'); };
  pl.addEventListener('pointerup', endDrag);
  pl.addEventListener('pointercancel', endDrag);

  pl.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setParam('r', state.r - LIM.r.step); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setParam('r', state.r + LIM.r.step); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setParam('M', state.M + LIM.M.step); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setParam('M', state.M - LIM.M.step); }
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
