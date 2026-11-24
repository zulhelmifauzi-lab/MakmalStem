const $ = id => document.getElementById(id);

function setU(v) { if (Number.isNaN(v)) return; state.u = clamp(Math.round(v * 2) / 2, L.uMin, L.uMax); state.preset = null; sync(); }
function setF(v) { if (Number.isNaN(v)) return; state.f = clamp(Math.round(v), L.fMin, L.fMax); state.preset = null; sync(); }
function setH(v) { if (Number.isNaN(v)) return; state.h = clamp(Math.round(v * 2) / 2, L.hMin, L.hMax); sync(); }
function setType(t) { if (t === 'convex' || t === 'concave') { state.type = t; state.preset = null; sync(); } }
function applyPreset(name) { Object.assign(state, PRESETS[name], {h: 4, preset: name, running: false}); sync(); }
function togglePlay() { if (state.running) state.running = false; else { if (state.u <= L.uMin + 1e-9) state.u = L.uMax; state.running = true; } sync(); }
function stepSimulation(dt) {
  if (!state.running) return;
  state.u = Math.max(L.uMin, state.u - 7 * dt); state.preset = null;
  if (state.u <= L.uMin + 1e-9) state.running = false;
  state.dirty = true; syncReadouts();
}
function sync() {
  $('slider-u').value = state.u; $('slider-f').value = state.f; $('slider-h').value = state.h;
  $('out-u').textContent = f1(state.u) + ' cm'; $('out-f').textContent = (state.type === 'convex' ? '+' : MINUS) + state.f + ' cm'; $('out-h').textContent = f1(state.h) + ' cm';
  document.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === state.preset)));
  document.querySelectorAll('[data-type]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === state.type)));
  $('btn-rays').setAttribute('aria-pressed', String(state.rays)); $('btn-screen').setAttribute('aria-pressed', String(state.screen)); $('btn-ext').setAttribute('aria-pressed', String(state.ext));
  $('play-text').textContent = tr(state.running ? 'pause' : 'play');
  state.dirty = true; syncReadouts();
}
function setLang(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  document.title = lang === 'ms' ? 'Kanta Cembung & Cekung (Convex & Concave Lenses) (BETA) — Makmal STEM Fizik' : 'Convex & Concave Lenses (Kanta Cembung & Cekung) (BETA) — Makmal STEM Physics';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (k === 'classOn' && state.classMode) return;
    if (k === 'play') return;
    if (I18N[lang][k] !== undefined) el.textContent = I18N[lang][k];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', I18N[lang][el.dataset.i18nAria]));
  $('tries').innerHTML = I18N[lang].tries.map(s => `<li>${s}</li>`).join('');
  try { localStorage.setItem('stemlab-lang', lang); } catch (e) {}
  sync();
}
function imageText(im = imageOf()) {
  if (im.none) return tr('noImage');
  return `${tr(im.real ? 'real' : 'virtual')}, ${tr(im.upright ? 'upright' : 'inverted')}, ${tr(im.size)} (${tr(im.real ? 'onScreen' : 'noScreen')})`;
}
function syncReadouts() {
  const im = imageOf(), f = fSigned(), u = state.u;
  $('r-u').textContent = f1(u) + ' cm';
  $('r-v').textContent = im.none ? '∞' : f1(im.v) + ' cm';
  $('r-m').textContent = im.none ? '—' : f1(Math.abs(im.m), 2);
  $('r-p').textContent = (f > 0 ? '+' : '') + f1(powerOf(), 1) + ' D';
  $('r-img').textContent = imageText(im);
  $('note').textContent = tr('k_' + caseOf());
  $('eq-lens').textContent = im.none ? `1/v = 1/f ${MINUS} 1/u = 0` : `v = uf / (u ${MINUS} f) = (${f1(u)})(${f1(f)}) / (${f1(u)} ${MINUS} ${f < 0 ? '(' + f1(f) + ')' : f1(f)}) = ${f1(im.v)} cm`;
  $('eq-mag').textContent = im.none ? '—' : `m = v/u = ${f1(Math.abs(im.v))} / ${f1(u)} = ${f1(Math.abs(im.m), 2)}  (h${'ᵢ'} = ${f1(Math.abs(im.hi))} cm)`;
  $('eq-pow').textContent = `P = 1/f = 1/(${f1(f / 100, 2)} m) = ${f > 0 ? '+' : ''}${f1(powerOf(), 1)} D`;
}

/* ===== Paparan ===== */
const DPR = () => (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
const VH = 380, XR = 66, YR = 12.5;
function fitCanvas() {
  const c = $('bench'), w = Math.max(c.getBoundingClientRect().width, 260);
  c._w = w; c._dpr = DPR(); c.style.height = VH + 'px'; c.width = Math.round(w * DPR()); c.height = Math.round(VH * DPR()); state.dirty = true;
}
function text(ctx, s, x, y, o = {}) {
  ctx.font = `${o.w || 700} ${o.size || 11}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = o.color || '#131b2e'; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y);
}
function geom() { const W = $('bench')._w || 600, ax = (VH - 28) / 2, sx = W / (2 * XR), sy = (ax - 8) / YR; return {W, ax, sx, sy, X: x => W / 2 + x * sx, Y: y => ax - y * sy}; }
function arrow(ctx, x, y0, y1, color, dashed, w = 3.5) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.setLineDash(dashed ? [6, 4] : []); ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); ctx.setLineDash([]);
  const d = Math.sign(y1 - y0) || -1; if (Math.abs(y1 - y0) < 4) return;
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - 6, y1 - d * 10); ctx.lineTo(x + 6, y1 - d * 10); ctx.closePath(); ctx.fill();
}
function render() {
  const c = $('bench'), ctx = c.getContext('2d'), {W, ax, sx, sy, X, Y} = geom(), fs = fSigned(), f = state.f, u = state.u, h = state.h, im = imageOf();
  ctx.setTransform(c._dpr || 1, 0, 0, c._dpr || 1, 0, 0); ctx.clearRect(0, 0, W, VH);
  // pembaris (skala x tepat dalam cm)
  ctx.strokeStyle = '#c7c4d8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, VH - 22); ctx.lineTo(W, VH - 22); ctx.stroke();
  for (let x = -60; x <= 60; x += 10) { ctx.beginPath(); ctx.moveTo(X(x), VH - 22); ctx.lineTo(X(x), VH - 17); ctx.stroke(); text(ctx, String(Math.abs(x)), X(x), VH - 6, {size: 10, color: '#777587', w: 600}); }
  text(ctx, 'cm', W - 14, VH - 6, {size: 10, color: '#777587', align: 'right', w: 600});
  // paksi utama
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, ax); ctx.lineTo(W, ax); ctx.stroke();
  text(ctx, tr('axis'), 8, ax + 15, {size: 10, color: '#777587', align: 'left', w: 600});
  // F dan 2F
  [[-2 * f, '2F'], [-f, 'F'], [f, 'F′'], [2 * f, '2F′']].forEach(([x, lab]) => { ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(X(x), ax, 3.5, 0, 6.2832); ctx.fill(); text(ctx, lab, X(x), ax + 17, {size: 11, color: '#475569'}); });
  // kanta
  const top = 12, bot = VH - 30, mid = ax;
  ctx.fillStyle = 'rgba(103,232,249,.35)'; ctx.strokeStyle = '#0e7490'; ctx.lineWidth = 2.5; ctx.beginPath();
  if (state.type === 'convex') { ctx.moveTo(X(0), top); ctx.quadraticCurveTo(X(0) + 20, mid, X(0), bot); ctx.quadraticCurveTo(X(0) - 20, mid, X(0), top); }
  else { ctx.moveTo(X(0) - 13, top); ctx.quadraticCurveTo(X(0) + 1, mid, X(0) - 13, bot); ctx.lineTo(X(0) + 13, bot); ctx.quadraticCurveTo(X(0) - 1, mid, X(0) + 13, top); ctx.closePath(); }
  ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, VH - 24); ctx.clip();
  // skrin
  if (state.screen && !im.none && im.real && im.v < XR - 2) { ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.fillRect(X(im.v) - 3, Y(11), 6, Y(-11) - Y(11)); ctx.strokeRect(X(im.v) - 3, Y(11), 6, Y(-11) - Y(11)); text(ctx, tr('screenLbl'), X(im.v), Y(11) - 4, {size: 10, color: '#64748b'}); }
  // sinar
  if (state.rays) raysOf().forEach(r => {
    ctx.strokeStyle = r.color; ctx.lineWidth = 2; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(X(-u), Y(h)); ctx.lineTo(X(0), Y(r.yl)); ctx.lineTo(X(XR), Y(r.yl + r.slope * XR)); ctx.stroke();
    if (state.ext && !im.none && !im.real) { ctx.setLineDash([5, 4]); ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(X(0), Y(r.yl)); ctx.lineTo(X(im.v), Y(im.hi)); ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]); }
  });
  // objek
  arrow(ctx, X(-u), Y(0), Y(h), '#4f46e5', false, 4.5); text(ctx, tr('objLbl'), X(-u), Y(0) + 15, {size: 10, color: '#4f46e5'});
  // imej
  if (!im.none) {
    if (Math.abs(im.v) <= XR - 1) { arrow(ctx, X(im.v), Y(0), Y(clamp(im.hi, -YR, YR)), '#ea580c', !im.real, 4.5); text(ctx, tr('imgLbl'), X(im.v), im.hi >= 0 ? Y(0) + 15 : Y(0) - 8, {size: 10, color: '#ea580c'}); }
    else text(ctx, `${tr('offscreen')} (v = ${f1(im.v)} cm)`, W - 10, 28, {size: 11, color: '#ea580c', align: 'right'});
  }
  ctx.restore();
}
function frame(now) {
  const dt = state.last ? Math.min(0.1, (now - state.last) / 1000) : 0; state.last = now;
  stepSimulation(dt);
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
  $('btn-class').textContent = tr(on ? 'classOff' : 'classOn'); $('btn-class').setAttribute('aria-pressed', String(on)); fitCanvas();
}

window.addEventListener('DOMContentLoaded', () => {
  $('slider-u').addEventListener('input', e => { state.running = false; setU(parseFloat(e.target.value)); });
  $('slider-f').addEventListener('input', e => setF(parseFloat(e.target.value)));
  $('slider-h').addEventListener('input', e => setH(parseFloat(e.target.value)));
  $('btn-play').addEventListener('click', togglePlay);
  $('btn-rays').addEventListener('click', () => { state.rays = !state.rays; sync(); });
  $('btn-screen').addEventListener('click', () => { state.screen = !state.screen; sync(); });
  $('btn-ext').addEventListener('click', () => { state.ext = !state.ext; sync(); });
  $('btn-lang').addEventListener('click', () => setLang(state.lang === 'ms' ? 'en' : 'ms'));
  document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  document.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => setType(b.dataset.type)));
  const bn = $('bench'), xOf = e => { const b = bn.getBoundingClientRect(); return ((e.clientX - b.left) * (bn._w / b.width) - bn._w / 2) / (bn._w / (2 * XR)); };
  bn.addEventListener('pointerdown', e => { state.dragging = true; state.running = false; try { bn.setPointerCapture(e.pointerId); } catch (err) {} const x = xOf(e); if (x < 0) setU(-x); });
  bn.addEventListener('pointermove', e => { if (state.dragging) { const x = xOf(e); if (x < 0) setU(-x); } });
  const end = () => { state.dragging = false; }; bn.addEventListener('pointerup', end); bn.addEventListener('pointercancel', end);
  bn.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); state.running = false; setU(state.u + (e.key === 'ArrowLeft' ? 1 : -1)); } });
  window.addEventListener('resize', fitCanvas);
  let saved = null; try { saved = localStorage.getItem('stemlab-lang'); } catch (e) {}
  fitCanvas(); setLang(saved === 'en' ? 'en' : 'ms');
  requestAnimationFrame(frame);
});
