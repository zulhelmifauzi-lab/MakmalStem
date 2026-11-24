const $ = id => document.getElementById(id);

function applyPreset(name) {
  Object.assign(state, PRESETS[name], {x0: 0, time: 0, running: true, preset: name});
  syncControls();
  state.dirty = true;
}
function resetMotion() { state.time = 0; state.running = false; state.dirty = true; }
function togglePlay() {
  if (state.running) state.running = false;
  else { if (state.time >= state.T) state.time = 0; state.running = true; }
  state.dirty = true;
}
function moveCarTo(x) {
  const t = state.time, disp = state.u * t + 0.5 * state.a * t * t;
  state.x0 = clamp(Math.round((x - disp) * 10) / 10, L.x0Min, L.x0Max);
  state.dirty = true;
}
function onSlider(key, lo, hi, e) {
  const v = parseFloat(e.target.value);
  if (Number.isNaN(v)) return;
  state[key] = clamp(v, lo, hi);
  if (key === 'T') state.time = Math.min(state.time, state.T);
  state.preset = null; state.dirty = true;
  syncControls();
}
function syncControls() {
  $('slider-u').value = state.u; $('slider-a').value = state.a; $('slider-t').value = state.T;
  $('out-u').textContent = fmt(state.u, 1).replace('.0', '') + ' m/s';
  $('out-a').textContent = fmt(state.a, 1).replace('.0', '') + ' m/s²';
  $('out-t').textContent = fmt(state.T, 1).replace('.0', '') + ' s';
  $('out-x0').textContent = fmt(state.x0, 1).replace('.0', '') + ' m';
  document.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === state.preset)));
  document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(parseFloat(b.dataset.speed) === state.speed)));
}

/* ===== Bahasa ===== */
function setLang(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  document.title = lang === 'ms' ? 'Gerakan Linear (Linear Motion) (BETA) — Makmal STEM Fizik' : 'Linear Motion (Gerakan Linear) (BETA) — Makmal STEM Physics';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (k === 'classOn' && state.classMode) return;
    if (k === 'areaOn' && state.showArea) return;
    if (I18N[lang][k] !== undefined) el.textContent = I18N[lang][k];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', I18N[lang][el.dataset.i18nAria]));
  $('tries').innerHTML = I18N[lang].tries.map(s => `<li>${s}</li>`).join('');
  try { localStorage.setItem('stemlab-lang', lang); } catch (e) {}
  updateButtons();
  state.dirty = true;
}
function updateButtons() {
  $('play-text').textContent = tr(state.running ? 'pause' : 'play');
  $('area-text').textContent = tr(state.showArea ? 'areaOff' : 'areaOn');
  $('btn-area').setAttribute('aria-pressed', String(state.showArea));
}

/* ===== Paparan ===== */
function updateReadouts() {
  const t = state.time, s = posAt(t) - state.x0, v = velAt(t), d = distanceAt(t);
  $('r-time').textContent = fmt(t) + ' s';
  $('r-dist').textContent = fmt(d) + ' m';
  const rs = $('r-disp'); rs.textContent = fmt(s) + ' m'; rs.classList.toggle('neg', s < -0.05);
  $('r-speed').textContent = fmt(Math.abs(v)) + ' m/s';
  const rv = $('r-vel'); rv.textContent = fmt(v) + ' m/s'; rv.classList.toggle('neg', v < -0.05);
  $('r-dir').textContent = Math.abs(v) < 0.05 ? tr('dirStop') : v > 0 ? tr('dirRight') : tr('dirLeft');
  $('note').textContent = d - Math.abs(s) > 0.05 ? tr('noteTurn') : t === 0 && !state.running ? tr('noteIdle') : tr('noteRun');
  $('area-note').textContent = tr(state.showArea ? 'areaNote' : 'areaPlain');
  const u = state.u, a = state.a;
  $('eq1').textContent = `v = u + at = ${fmt(u)} + (${fmt(a)})(${fmt(t)}) = ${fmt(v)} m/s`;
  $('eq2').textContent = `s = ut + ½at² = (${fmt(u)})(${fmt(t)}) + ½(${fmt(a)})(${fmt(t)})² = ${fmt(s)} m`;
  $('eq3').textContent = `v² = u² + 2as = (${fmt(u)})² + 2(${fmt(a)})(${fmt(s)}) = ${fmt(u * u + 2 * a * s)} m²/s²`;
}
const DPR = () => (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
const VH = {track: 250, g: 190};
function fitCanvas(c, vh) {
  const k = state.classMode ? 1.3 : 1, w = Math.max(c.getBoundingClientRect().width, 200), h = vh * k;
  c.style.height = h + 'px';
  c.width = Math.round(w * DPR()); c.height = Math.round(h * DPR());
  c._k = k; c._w = w / k; c._h = vh; c._dpr = DPR();
}
function prep(c) {
  const ctx = c.getContext('2d');
  ctx.setTransform(c._dpr * c._k, 0, 0, c._dpr * c._k, 0, 0);
  ctx.clearRect(0, 0, c._w, c._h);
  return ctx;
}
function text(ctx, s, x, y, o = {}) {
  ctx.font = `${o.w || 600} ${o.size || 11}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = o.color || C.ink; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
  ctx.fillText(s, x, y);
}
function tag(ctx, s, x, y, o) {
  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  const w = ctx.measureText(s).width + 10, x0 = o.align === 'right' ? x - w + 5 : x - 5;
  ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fillRect(x0, y - 12, w, 17);
  text(ctx, s, x, y, o);
}
function arrow(ctx, x1, y, x2, color) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
  if (Math.abs(x2 - x1) < 6) { ctx.beginPath(); ctx.arc(x1, y, 3.5, 0, 6.2832); ctx.fill(); return; }
  const dir = Math.sign(x2 - x1);
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2 - dir * 4, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - dir * 11, y - 6); ctx.lineTo(x2 - dir * 11, y + 6); ctx.closePath(); ctx.fill();
}
function drawTrack() {
  const c = $('track'), ctx = prep(c), W = c._w, r = state.dragRange || trackRange(), ml = 36, mr = 36;
  const X = x => ml + (x - r.min) / (r.max - r.min) * (W - ml - mr);
  c._X = X; c._range = r;
  const gy = 142, t = state.time, x = posAt(t), v = velAt(t), s = x - state.x0, cx = X(x);
  if (Math.abs(v) > 0.05) state.face = v > 0 ? 1 : -1;
  // jalan dan pembaris
  ctx.fillStyle = '#dae2fd'; ctx.fillRect(ml - 24, gy, W - ml - mr + 48, 10);
  const everyPx = (W - ml - mr) / ((r.max - r.min) / r.step), skip = Math.max(1, Math.ceil(34 / everyPx));
  for (let i = 0, k = Math.round(r.min / r.step); ; i++, k++) {
    const val = k * r.step; if (val > r.max + 1e-9) break;
    ctx.strokeStyle = C.mute; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(val), gy); ctx.lineTo(X(val), gy + 16); ctx.stroke();
    if (i % skip === 0) text(ctx, String(Math.round(val * 100) / 100).replace('-', '−'), X(val), gy + 31, {align: 'center', color: '#464555'});
  }
  text(ctx, 'x / m', W - 6, gy + 49, {align: 'right', color: C.mute});
  // penanda mula
  ctx.setLineDash([4, 4]); ctx.strokeStyle = C.mute; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(X(state.x0), 58); ctx.lineTo(X(state.x0), gy); ctx.stroke(); ctx.setLineDash([]);
  text(ctx, `x₀ (${tr('start')})`, X(state.x0), 36, {align: 'center', color: C.mute});
  // jejak setiap 1 s
  for (let k = 1; k <= Math.min(t, state.T) + 1e-9; k++) { ctx.fillStyle = C.v; ctx.beginPath(); ctx.arc(X(posAt(k)), 49, 3, 0, 6.2832); ctx.fill(); }
  // petunjuk
  ctx.fillStyle = C.v; ctx.fillRect(10, 8, 12, 4); text(ctx, `v = ${fmt(v)} m/s`, 28, 14, {color: C.v, w: 700});
  ctx.fillStyle = C.a; ctx.fillRect(130, 8, 12, 4); text(ctx, `a = ${fmt(state.a)} m/s²`, 148, 14, {color: C.a, w: 700});
  if (W > 420) text(ctx, '● ' + tr('trace'), W - 10, 14, {align: 'right', color: C.v});
  else text(ctx, '● 1 s', W - 10, 28, {align: 'right', color: C.v});
  // kereta
  const f = state.face;
  ctx.fillStyle = '#3525cd'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - 15 + f * 3, 98, 30, 15, 5) : ctx.rect(cx - 15 + f * 3, 98, 30, 15); ctx.fill();
  ctx.fillStyle = '#c7d2fe'; ctx.fillRect(cx - 10 + f * 3, 101, 9, 8); ctx.fillRect(cx + 1 + f * 3, 101, 9, 8);
  ctx.fillStyle = '#4f46e5'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - 27, 111, 54, 20, 6) : ctx.rect(cx - 27, 111, 54, 20); ctx.fill();
  ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(cx + f * 24, 120, 3, 0, 6.2832); ctx.fill();
  [-15, 15].forEach(dx => { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx + dx, 133, 8, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(cx + dx, 133, 3, 0, 6.2832); ctx.fill(); });
  // anak panah
  arrow(ctx, cx, 66, cx + clamp(state.a * 14, -70, 70), C.a);
  arrow(ctx, cx, 84, cx + clamp(v * 5, -120, 120), C.v);
  // sesaran
  const col = s < -0.05 ? C.neg : C.s;
  arrow(ctx, X(state.x0), gy + 78, cx, col);
  text(ctx, `s = ${fmt(s)} m`, (X(state.x0) + cx) / 2, gy + 70, {align: 'center', color: col, w: 700, size: 12});
}
function drawGraph(id, fn, vals, minSpan, color, ylabel, mode) {
  const c = $(id), ctx = prep(c), W = c._w, H = c._h, ml = 46, mr = 14, mt = 26, mb = 30, T = state.T, t = state.time;
  const r = graphRange(vals, minSpan);
  const X = tt => ml + tt / T * (W - ml - mr), Y = y => mt + (r.max - y) / (r.max - r.min) * (H - mt - mb);
  ctx.lineWidth = 1; ctx.strokeStyle = C.grid;
  for (let k = Math.round(r.min / r.step); k * r.step <= r.max + 1e-9; k++) {
    const y = k * r.step; ctx.beginPath(); ctx.moveTo(ml, Y(y)); ctx.lineTo(W - mr, Y(y)); ctx.stroke();
    text(ctx, String(Math.round(y * 100) / 100).replace('-', '−'), ml - 6, Y(y) + 4, {align: 'right', color: '#464555', size: 10});
  }
  const ts = niceStep(T);
  for (let tt = 0; tt <= T + 1e-9; tt += ts) {
    ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(X(tt), mt); ctx.lineTo(X(tt), H - mb); ctx.stroke();
    text(ctx, String(Math.round(tt * 100) / 100), X(tt), H - mb + 14, {align: 'center', color: '#464555', size: 10});
  }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ml, Y(0)); ctx.lineTo(W - mr, Y(0)); ctx.moveTo(ml, mt); ctx.lineTo(ml, H - mb); ctx.stroke();
  text(ctx, 't / s', W - mr, H - 4, {align: 'right', color: C.mute, size: 10});
  text(ctx, ylabel, 4, 11, {color: C.mute, size: 10});
  const path = (t1, n) => { ctx.beginPath(); for (let i = 0; i <= n; i++) { const tt = t1 * i / n; i ? ctx.lineTo(X(tt), Y(fn(tt))) : ctx.moveTo(X(tt), Y(fn(tt))); } };
  if (mode === 'v' && state.showArea && t > 0) {
    const fillSide = (pos) => {
      ctx.save(); ctx.beginPath(); ctx.rect(ml, pos ? mt : Y(0), W - ml - mr, pos ? Y(0) - mt : H - mb - Y(0)); ctx.clip();
      path(t, 60); ctx.lineTo(X(t), Y(0)); ctx.lineTo(X(0), Y(0)); ctx.closePath();
      ctx.fillStyle = pos ? 'rgba(8,145,178,.28)' : 'rgba(225,29,72,.28)'; ctx.fill(); ctx.restore();
    };
    fillSide(true); fillSide(false);
    tag(ctx, `${tr('area')} = s = ${fmt(posAt(t) - state.x0)} m`, W - mr - 4, mt + 12, {align: 'right', color: C.v, w: 700, size: 11});
    // segi tiga cerun
    ctx.setLineDash([4, 3]); ctx.strokeStyle = C.a; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(X(0), Y(fn(0))); ctx.lineTo(X(t), Y(fn(0))); ctx.lineTo(X(t), Y(fn(t))); ctx.stroke(); ctx.setLineDash([]);
    tag(ctx, `${tr('slope')} = a = ${fmt(state.a)}`, ml + 8, H - mb - 8, {color: C.a, w: 700, size: 11});
  }
  ctx.setLineDash([5, 4]); ctx.strokeStyle = color; ctx.globalAlpha = 0.35; ctx.lineWidth = 2; path(T, 80); ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]);
  if (t > 0) { ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineJoin = 'round'; path(t, Math.max(2, Math.ceil(80 * t / T))); ctx.stroke(); }
  if (mode === 's' && state.showArea) {
    const sl = velAt(t), d = Math.min(1.5, T / 4), t1 = Math.max(0, t - d), t2 = Math.min(T, t + d);
    ctx.strokeStyle = C.v; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(t1), Y(fn(t) + sl * (t1 - t))); ctx.lineTo(X(t2), Y(fn(t) + sl * (t2 - t))); ctx.stroke();
    tag(ctx, `${tr('slope')} = v = ${fmt(sl)}`, ml + 8, mt + 12, {color: C.v, w: 700, size: 11});
  }
  ctx.setLineDash([3, 3]); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(t), Y(0)); ctx.lineTo(X(t), Y(fn(t))); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(t), Y(fn(t)), 5, 0, 6.2832); ctx.fill(); ctx.stroke();
}
function render() {
  updateReadouts(); updateButtons(); syncControls();
  drawTrack();
  const T = state.T, ts = turnTime(), sv = [0, posAt(T) - state.x0], vv = [velAt(0), velAt(T)];
  if (ts !== null) sv.push(posAt(ts) - state.x0);
  drawGraph('g-s', t => posAt(t) - state.x0, sv, 10, C.s, 's / m', 's');
  drawGraph('g-v', t => velAt(t), vv, 4, C.v, 'v / m s⁻¹', 'v');
  drawGraph('g-a', () => state.a, [state.a], 4, C.a, 'a / m s⁻²', 'a');
}
function fitAll() { fitCanvas($('track'), VH.track); ['g-s', 'g-v', 'g-a'].forEach(id => fitCanvas($(id), VH.g)); state.dirty = true; }
function frame(now) {
  const dt = state.last ? Math.min(0.1, (now - state.last) / 1000) : 0;
  state.last = now;
  if (state.running) stepSimulation(dt * state.speed);
  if (state.dirty) { state.dirty = false; render(); }
  requestAnimationFrame(frame);
}
function setClassMode(on) {
  state.classMode = on;
  document.body.classList.toggle('class-mode', on);
  try {
    if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  } catch (e) {}
  updateButtons(); fitAll();
}

/* ===== Mula ===== */
window.addEventListener('DOMContentLoaded', () => {
  $('slider-u').addEventListener('input', e => onSlider('u', L.uMin, L.uMax, e));
  $('slider-a').addEventListener('input', e => onSlider('a', L.aMin, L.aMax, e));
  $('slider-t').addEventListener('input', e => onSlider('T', L.tMin, L.tMax, e));
  $('btn-play').addEventListener('click', togglePlay);
  $('btn-reset').addEventListener('click', resetMotion);
  $('btn-lang').addEventListener('click', () => setLang(state.lang === 'ms' ? 'en' : 'ms'));
  $('btn-area').addEventListener('click', () => { state.showArea = !state.showArea; updateButtons(); state.dirty = true; });
  document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => { state.speed = parseFloat(b.dataset.speed); syncControls(); }));
  // seret kereta
  const tk = $('track'), px = e => { const b = tk.getBoundingClientRect(); return (e.clientX - b.left) / tk._k; };
  const xOf = e => { const r = state.dragRange || trackRange(), ml = 36, mr = 36; return r.min + (px(e) - ml) / (tk._w - ml - mr) * (r.max - r.min); };
  tk.addEventListener('pointerdown', e => {
    state.dragRange = trackRange(); tk.classList.add('dragging');
    try { tk.setPointerCapture(e.pointerId); } catch (err) {}
    moveCarTo(xOf(e));
  });
  tk.addEventListener('pointermove', e => { if (state.dragRange) moveCarTo(xOf(e)); });
  const endDrag = () => { state.dragRange = null; tk.classList.remove('dragging'); state.dirty = true; };
  tk.addEventListener('pointerup', endDrag); tk.addEventListener('pointercancel', endDrag);
  tk.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); moveCarTo(posAt(state.time) + (e.key === 'ArrowRight' ? 1 : -1)); }
  });
  window.addEventListener('resize', fitAll);
  let saved = null; try { saved = localStorage.getItem('stemlab-lang'); } catch (e) {}
  fitAll();
  setLang(saved === 'en' ? 'en' : 'ms');
  syncControls();
  requestAnimationFrame(frame);
});
