const $ = id => document.getElementById(id);

function setting(fn) { fn(); enforceLimits(); state.preset = null; resetTitration(); syncControls(); }
function setAcid(a) { if (ACIDS[a]) setting(() => { state.acid = a; }); }
function setIndicator(i) { if (INDS[i]) setting(() => { state.ind = i; }); }
function setMa(v) { if (!state.mystery && !Number.isNaN(v)) setting(() => { state.ma = r2(clamp(v, 0.05, 0.2)); }); }
function setMb(v) { if (!Number.isNaN(v)) setting(() => { state.mb = r2(clamp(v, 0.05, 0.2)); }); }
function setVa(v) { if (!Number.isNaN(v)) setting(() => { state.va = clamp(Math.round(v / 5) * 5, 10, 50); }); }
function applyPreset(name) {
  const p = PRESETS[name]; Object.assign(state, p, {ma: 0.1, mb: 0.1, va: 25, mystery: false, capped: false, preset: name});
  resetTitration(); syncControls();
}
function setMystery(on) {
  state.mystery = on;
  if (on) state.ma = [0.06, 0.08, 0.12, 0.14, 0.16, 0.18][Math.floor(Math.random() * 6)];
  state.preset = null; enforceLimits(); resetTitration(); syncControls();
}
function showResult() {
  state.result = computeResult(); state.dirty = true;
}
function syncControls() {
  $('slider-ma').value = state.ma; $('slider-mb').value = state.mb; $('slider-va').value = state.va; $('slider-ma').disabled = state.mystery;
  $('out-ma').textContent = state.mystery ? '?' : f2(state.ma) + ' mol/dm³'; $('out-mb').textContent = f2(state.mb) + ' mol/dm³'; $('out-va').textContent = state.va + ' mL';
  document.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === state.preset)));
  document.querySelectorAll('[data-acid]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.acid === state.acid)));
  document.querySelectorAll('[data-ind]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ind === state.ind)));
  $('btn-mystery').setAttribute('aria-pressed', String(state.mystery)); $('btn-calc').hidden = !state.mystery;
  $('mystery-text').textContent = tr(state.mystery ? 'mysteryOff' : 'mysteryOn');
  $('tap-text').textContent = tr(state.tapOpen ? 'tapClose' : 'tapOpen'); $('btn-tap').setAttribute('aria-pressed', String(state.tapOpen));
  state.dirty = true;
}
function setLang(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  document.title = lang === 'ms' ? 'Titrasi Asid & Bes (Acid-Base Titration) (BETA) — Makmal STEM Kimia' : 'Acid-Base Titration (Titrasi Asid & Bes) (BETA) — Makmal STEM Chemistry';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (k === 'classOn' && state.classMode) return;
    if (['tapOpen', 'mysteryOn'].includes(k)) return;
    if (I18N[lang][k] !== undefined) el.textContent = I18N[lang][k];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', I18N[lang][el.dataset.i18nAria]));
  $('tries').innerHTML = I18N[lang].tries.map(s => `<li>${s}</li>`).join('');
  try { localStorage.setItem('stemlab-lang', lang); } catch (e) {}
  syncControls();
}

/* ===== Paparan ===== */
function updateReadouts() {
  const V = state.v, pH = pHAt(V), eq = vEq(), pHeq = pHAt(eq), hid = state.mystery && !state.result;
  $('r-v').textContent = f2(V) + ' mL'; $('r-ph').textContent = f2(pH);
  $('r-col').textContent = colorName(pH); $('r-col').style.borderLeft = `12px solid ${colorAt(pH)}`; $('r-col').style.paddingLeft = '8px';
  $('r-eq').textContent = hid ? tr('hidden') : f2(eq) + ' mL';
  let note;
  if (V === 0 && state.vTarget === 0) note = tr('n0');
  else if (hid) note = state.endpointV === null ? tr('nNeedEnd') : `${tr('nEndHidden')} ${f2(state.endpointV)} mL. ${tr('nPressCalc')}`;
  else {
    note = V < eq - 0.05 ? tr('nAcid') : V > eq + 0.05 ? tr('nBase') : `${tr('nEq')} ${f2(pHeq)}.`;
    if (state.endpointV !== null) note += ` ${tr('nEnd')} ${f2(state.endpointV)} mL. ${tr('nDiff')} ${f2(Math.abs(state.endpointV - eq))} mL.`;
  }
  if (state.capped) note += ' ' + tr('capped');
  $('note').textContent = note;
  const res = state.result;
  $('result').hidden = !res;
  if (res) $('result-text').textContent = `${tr('resCalc')} = (${f2(state.mb)} × ${f2(state.endpointV)}) ÷ ${state.va} = ${f2(res.maCalc, 3)} mol/dm³\n${tr('resTrue')}: ${f2(res.ma)} mol/dm³ · ${tr('resErr')}: ${f2(res.err, 1)}%\n${tr('resNote')}`;
  $('result-text').style.whiteSpace = 'pre-line';
  $('eq-react').textContent = ACIDS[state.acid].react;
  $('eq-formula').textContent = `Mₐ·Vₐ = Mb·Vb  →  (${hid ? '?' : f2(state.ma)})(${state.va}) = (${f2(state.mb)})(${state.endpointV === null ? 'V(akhir)' : f2(state.endpointV)})`;
}
const DPR = () => (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
const VH = 460;
function fitCanvas() {
  ['rig', 'curve'].forEach(id => {
    const c = $(id), w = Math.max(c.getBoundingClientRect().width, 220);
    c._w = w; c._dpr = DPR(); c.style.height = VH + 'px'; c.width = Math.round(w * DPR()); c.height = Math.round(VH * DPR());
  });
  state.dirty = true;
}
function prep(c) {
  const ctx = c.getContext('2d');
  ctx.setTransform(c._dpr, 0, 0, c._dpr, 0, 0); ctx.clearRect(0, 0, c._w, VH); return ctx;
}
function text(ctx, s, x, y, o = {}) {
  ctx.font = `${o.w || 600} ${o.size || 11}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = o.color || '#131b2e'; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y);
}
function drawRig() {
  const c = $('rig'), ctx = prep(c), W = c._w, cx = W / 2, V = state.v, pH = pHAt(V), liquid = colorAt(pH);
  const bTop = 24, bH = 230, bBot = bTop + bH, sc = bH / VMAX;
  // buret
  ctx.fillStyle = 'rgba(191,219,254,.55)'; ctx.fillRect(cx - 14, bTop + V * sc, 28, bBot - bTop - V * sc);
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.strokeRect(cx - 14, bTop, 28, bH);
  ctx.lineWidth = 1;
  for (let m = 0; m <= VMAX; m += 1) {
    const y = bTop + m * sc, big = m % 10 === 0, mid = m % 5 === 0;
    if (!big && !mid && sc < 3.5) continue;
    ctx.beginPath(); ctx.moveTo(cx - 14, y); ctx.lineTo(cx - 14 + (big ? 12 : mid ? 8 : 4), y); ctx.stroke();
    if (big) text(ctx, String(m), cx - 20, y + 4, {align: 'right', size: 10, color: '#464555'});
  }
  ctx.fillStyle = '#e2e8f0'; ctx.fillRect(cx - 4, bBot, 8, 12); // tap body
  ctx.strokeStyle = state.tapOpen ? '#ea580c' : '#475569'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); if (state.tapOpen) { ctx.moveTo(cx - 4, bBot + 6); ctx.lineTo(cx - 4, bBot - 12); } else { ctx.moveTo(cx - 4, bBot + 6); ctx.lineTo(cx - 28, bBot + 6); } ctx.stroke();
  ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(cx - 4, bBot + 12); ctx.lineTo(cx + 4, bBot + 12); ctx.lineTo(cx + 1, bBot + 32); ctx.lineTo(cx - 1, bBot + 32); ctx.fill();
  text(ctx, 'NaOH ' + f2(state.mb) + ' M', cx + 20, bTop + 14, {size: 11, color: '#0891b2', w: 700});
  // kelalang kon
  const fTop = 340, fNeck = 374, fBase = 428, nw = 18, bw = 78, hw = y => y <= fNeck ? nw : nw + (y - fNeck) / (fBase - fNeck) * (bw - nw);
  const level = fBase - clamp(18 + (state.va + V) / 100 * 50, 18, 80), lw = hw(level);
  ctx.fillStyle = liquid; ctx.globalAlpha = 0.82;
  ctx.beginPath(); ctx.moveTo(cx - lw, level); ctx.lineTo(cx + lw, level); ctx.lineTo(cx + bw - 6, fBase - 2); ctx.quadraticCurveTo(cx + bw - 4, fBase, cx + bw - 12, fBase); ctx.lineTo(cx - bw + 12, fBase); ctx.quadraticCurveTo(cx - bw + 4, fBase, cx - bw + 6, fBase - 2); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(cx - nw - 5, fTop); ctx.lineTo(cx - nw, fTop); ctx.lineTo(cx - nw, fNeck); ctx.lineTo(cx - bw, fBase - 2); ctx.quadraticCurveTo(cx - bw - 2, fBase + 2, cx - bw + 12, fBase + 2); ctx.lineTo(cx + bw - 12, fBase + 2); ctx.quadraticCurveTo(cx + bw + 2, fBase + 2, cx + bw, fBase - 2); ctx.lineTo(cx + nw, fNeck); ctx.lineTo(cx + nw, fTop); ctx.lineTo(cx + nw + 5, fTop); ctx.stroke();
  // titisan
  if (state.v < state.vTarget - 1e-9) { const y = bBot + 34 + state.phase * (level - bBot - 40); ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.arc(cx, y, 4, 0, 6.2832); ctx.fill(); }
  text(ctx, state.acid === 'hcl' ? 'HCl + ' + tr('i_' + state.ind).split(' (')[0] : 'CH₃COOH + ' + tr('i_' + state.ind).split(' (')[0], cx, fBase + 24, {align: 'center', size: 10, color: '#464555'});
  text(ctx, `${f2(V, 2)} mL`, W - 8, 16, {align: 'right', size: 12, w: 800, color: '#4f46e5'});
}
function drawCurve() {
  const c = $('curve'), ctx = prep(c), W = c._w, ml = 42, mr = 12, mt = 24, mb = 38, hid = state.mystery && !state.result;
  const xMax = hid ? VMAX : Math.min(VMAX, Math.max(10, Math.ceil(vEq() * 1.7 / 5) * 5));
  const X = v => ml + v / xMax * (W - ml - mr), Y = p => mt + (14 - p) / 14 * (VH - mt - mb);
  const ind = INDS[state.ind];
  const g = ctx.createLinearGradient(0, Y(ind.hi), 0, Y(ind.lo)); ind.stops.slice().reverse().forEach((s, i, a) => g.addColorStop(i / (a.length - 1), s));
  ctx.globalAlpha = 0.4; ctx.fillStyle = g; ctx.fillRect(ml, Y(ind.hi), W - ml - mr, Y(ind.lo) - Y(ind.hi)); ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  for (let p = 0; p <= 14; p += 2) { ctx.strokeStyle = '#e4e7f1'; ctx.beginPath(); ctx.moveTo(ml, Y(p)); ctx.lineTo(W - mr, Y(p)); ctx.stroke(); text(ctx, String(p), ml - 6, Y(p) + 4, {align: 'right', size: 10, color: '#464555'}); }
  const step = xMax <= 20 ? 2 : 10;
  for (let v = 0; v <= xMax + 1e-9; v += step) { ctx.strokeStyle = '#e4e7f1'; ctx.beginPath(); ctx.moveTo(X(v), mt); ctx.lineTo(X(v), VH - mb); ctx.stroke(); text(ctx, String(v), X(v), VH - mb + 14, {align: 'center', size: 10, color: '#464555'}); }
  ctx.strokeStyle = '#131b2e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ml, mt); ctx.lineTo(ml, VH - mb); ctx.lineTo(W - mr, VH - mb); ctx.stroke();
  text(ctx, tr('pHx'), 6, 14, {color: '#777587', size: 10}); text(ctx, 'V(NaOH) / mL', W - mr, VH - 6, {align: 'right', color: '#777587', size: 10});
  const path = vmax => { ctx.beginPath(); const n = 160; for (let i = 0; i <= n; i++) { const v = vmax * i / n; i ? ctx.lineTo(X(v), Y(pHAt(v))) : ctx.moveTo(X(v), Y(pHAt(v))); } };
  if (!hid) {
    const eq = vEq(); ctx.setLineDash([5, 4]); ctx.strokeStyle = '#4f46e5'; ctx.lineWidth = 2; ctx.globalAlpha = .35; path(Math.min(xMax, VMAX)); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(eq), mt); ctx.lineTo(X(eq), VH - mb); ctx.stroke(); ctx.setLineDash([]);
    text(ctx, `${tr('eqLbl')} ${f2(eq, 1)} mL`, Math.min(X(eq) + 5, W - 96), mt + 10, {color: '#ea580c', w: 700});
  }
  if (state.v > 0) { ctx.strokeStyle = '#4f46e5'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; path(state.v); ctx.stroke(); }
  if (state.endpointV !== null) { ctx.strokeStyle = '#be185d'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(X(state.endpointV), mt); ctx.lineTo(X(state.endpointV), VH - mb); ctx.stroke(); ctx.setLineDash([]); text(ctx, `${tr('endLbl')} ${f2(state.endpointV, 1)}`, Math.min(X(state.endpointV) + 5, W - 96), mt + 24, {color: '#be185d', w: 700}); }
  ctx.fillStyle = colorAt(pHAt(state.v)); ctx.strokeStyle = '#131b2e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(state.v), Y(pHAt(state.v)), 6, 0, 6.2832); ctx.fill(); ctx.stroke();
}
function render() { updateReadouts(); drawRig(); drawCurve(); }
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
  $('slider-ma').addEventListener('input', e => setMa(parseFloat(e.target.value)));
  $('slider-mb').addEventListener('input', e => setMb(parseFloat(e.target.value)));
  $('slider-va').addEventListener('input', e => setVa(parseFloat(e.target.value)));
  $('btn-drop').addEventListener('click', () => addVolume(0.1));
  $('btn-one').addEventListener('click', () => addVolume(1));
  $('btn-tap').addEventListener('click', () => { toggleTap(); syncControls(); });
  $('btn-reset').addEventListener('click', () => { resetTitration(); syncControls(); });
  $('btn-mystery').addEventListener('click', () => setMystery(!state.mystery));
  $('btn-calc').addEventListener('click', showResult);
  $('btn-lang').addEventListener('click', () => setLang(state.lang === 'ms' ? 'en' : 'ms'));
  document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  document.querySelectorAll('[data-acid]').forEach(b => b.addEventListener('click', () => setAcid(b.dataset.acid)));
  document.querySelectorAll('[data-ind]').forEach(b => b.addEventListener('click', () => setIndicator(b.dataset.ind)));
  window.addEventListener('resize', fitCanvas);
  let saved = null; try { saved = localStorage.getItem('stemlab-lang'); } catch (e) {}
  fitCanvas(); setLang(saved === 'en' ? 'en' : 'ms');
  requestAnimationFrame(frame);
});
