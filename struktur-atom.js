const $ = id => document.getElementById(id);

/* ===== Kawalan ===== */
function setElement(Z) {
  Z = clamp(Math.round(Z), 1, 20);
  state.Z = Z;
  state.N = EL[Z - 1][3][0] - Z;
  state.charge = 0;
  state.preset = null;
  sync();
}
function setNeutrons(n) {
  if (Number.isNaN(n)) return;
  state.N = clamp(Math.round(n), 0, maxN(state.Z));
  state.preset = null;
  sync();
}
function setIsotope(A) { setNeutrons(A - state.Z); }
function setCharge(c) {
  c = clamp(c, -3, 3);
  if (state.Z - c < 0) return;
  state.charge = c;
  state.preset = null;
  sync();
}
function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  state.Z = p.Z;
  state.N = p.A - p.Z;
  state.charge = p.charge;
  state.preset = name;
  sync();
}
function setView3d(on) {
  state.view3d = !!on;
  const c = $('atom');
  if (c && c.classList) c.classList.toggle('is-2d', !state.view3d);
  sync();
}
function resetCamera() {
  Object.assign(cam, DEFAULT_CAM);
  state.dirty = true;
}
function resetAll() {
  state.spin = true;
  state.valence = true;
  state.orbits = true;
  state.autoRotate = false;
  state.view3d = true;
  Object.assign(cam, DEFAULT_CAM);
  const c = $('atom');
  if (c && c.classList) c.classList.remove('is-2d');
  applyPreset('na');
}

function sync() {
  const Z = state.Z;
  const maxNeut = maxN(Z);
  $('slider-n').max = maxNeut;
  $('slider-n').value = state.N;
  $('out-n').textContent = state.N;
  $('decrease-n').disabled = state.N <= 0;
  $('increase-n').disabled = state.N >= maxNeut;

  $('out-ch').textContent = state.charge === 0 ? tr('neutral') : chargeStr(state.charge);
  $('btn-gain').disabled = state.charge <= -3;
  $('btn-lose').disabled = state.charge >= 3 || Z - state.charge <= 0;

  $('view-3d').setAttribute('aria-pressed', String(state.view3d));
  $('view-2d').setAttribute('aria-pressed', String(!state.view3d));
  $('atom-cam-bar').hidden = !state.view3d;

  document.querySelectorAll('[data-z]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.z) === Z)));
  document.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === state.preset)));
  document.querySelectorAll('[data-show]').forEach(input => {
    input.checked = state[input.dataset.show];
  });

  $('isos').innerHTML = EL[Z - 1][3].map(A =>
    `<button type="button" data-a="${A}" aria-pressed="${A === massOf()}">${A}</button>`
  ).join('');

  syncReadouts();
  state.dirty = true;
}

function syncReadouts() {
  const Z = state.Z, A = massOf(), e = electronsOf(), arr = arrangement(e), nat = isNatural();
  $('r-nuc').innerHTML = `<span class="ns"><span>${A}</span><span>${Z}</span></span><span class="sym">${EL[Z - 1][0]}</span>${state.charge ? `<span class="ch">${chargeStr(state.charge)}</span>` : ''}`;
  $('r-name').textContent = nameOf();
  $('r-z').textContent = Z;
  $('r-a').textContent = A;
  $('r-n').textContent = `${A} ${MINUS} ${Z} = ${state.N}`;
  $('r-e').textContent = e;
  $('r-ch').textContent = state.charge === 0 ? '0' : chargeStr(state.charge);
  $('r-arr').textContent = arrString(arr, tr('none'));
  $('r-gp').textContent = `${groupOf(Z)} · ${periodOf(Z)}`;
  $('r-val').textContent = valenceOf(arr);

  const parts = [];
  parts.push(`${isoName()} ${tr(nat ? 'nIsoNat' : 'nIsoOther')}.`);
  if (EL[Z - 1][3].length > 1 || !nat) parts.push(tr('nIsoSame'));
  if (state.charge !== 0) {
    parts.push(`${tr('nIon')} (${chargeStr(state.charge)}) ${tr(state.charge > 0 ? 'nLose' : 'nGain')}.`);
    const noble = NOBLE[arr.join('.')];
    if (noble) parts.push(`${tr('nNoble')} ${noble}, ${tr('nStable')}`);
  } else {
    parts.push(tr(NOBLE[arr.join('.')] && Z >= 2 ? 'nNobleAtom' : 'nNeutral'));
  }
  $('note').textContent = parts.join(' ');
}

function setupTabs() {
  const tabs = [$('atom-tab-controls'), $('atom-tab-elements')];
  const panes = [$('atom-pane-controls'), $('atom-pane-elements')];
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
      if (typeof tabs[next].focus === 'function') tabs[next].focus();
    });
  });
}

function setLang(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  document.title = lang === 'ms'
    ? 'Struktur Atom 3D (3D Atomic Structure) (BETA) — Makmal STEM Kimia'
    : '3D Atomic Structure (Struktur Atom 3D) (BETA) — Makmal STEM Chemistry';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (I18N[lang][k] !== undefined) el.textContent = I18N[lang][k];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', I18N[lang][el.dataset.i18nAria]);
  });
  $('tries').innerHTML = I18N[lang].tries.map(s => `<li>${s}</li>`).join('');
  try { localStorage.setItem('stemlab-lang', lang); } catch (e) {}
  sync();
}

/* ===== Enjin 3D & Paparan ===== */
const DPR = () => (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
const VW = 340;

function fitCanvas() {
  const c = $('atom'), w = Math.max(c.getBoundingClientRect().width, 240);
  c._w = w;
  c._dpr = DPR();
  c.style.height = w + 'px';
  c.width = Math.round(w * DPR());
  c.height = Math.round(w * DPR());
  state.dirty = true;
}

function text(ctx, s, x, y, o = {}) {
  ctx.font = `${o.w || 700} ${o.size || 11}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = o.color || '#131b2e';
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  ctx.fillText(s, x, y);
}

/* Susun atur 2D untuk keserasian ujian & paparan Bohr */
function nucleusTokens(Z, N) {
  const n = Z + N, out = [];
  for (let i = 0; i < n; i++) {
    const r = 5.7 * Math.sqrt(i + 0.5), th = i * 2.39996323;
    out.push({x: r * Math.cos(th), y: r * Math.sin(th), proton: Math.floor((i + 1) * Z / n) > Math.floor(i * Z / n)});
  }
  return out;
}
const nucleusRadius = (Z, N) => 5.7 * Math.sqrt(Z + N) + 6;
function shellRadii(Z, N, count) {
  const R0 = Math.max(36, nucleusRadius(Z, N) + 16), step = (150 - R0) / 3;
  return Array.from({length: count}, (_, k) => R0 + k * step);
}

/* Susun atur kluster sfera 3D untuk nukleus */
function nucleusTokens3D(Z, N) {
  const n = Z + N, out = [];
  if (n <= 0) return out;
  if (n === 1) return [{x: 0, y: 0, z: 0, proton: Z === 1}];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const yU = 1 - (2 * (i + 0.5)) / n;
    const rad = Math.sqrt(Math.max(0, 1 - yU * yU));
    const th = i * ga;
    const r = 5.1 * Math.cbrt(i + 0.7);
    out.push({
      x: r * Math.cos(th) * rad,
      y: r * yU,
      z: r * Math.sin(th) * rad,
      proton: Math.floor((i + 1) * Z / n) > Math.floor(i * Z / n)
    });
  }
  return out;
}

function project3D(x, y, z, cx = VW / 2, cy = VW / 2) {
  const cyw = Math.cos(cam.yaw), syw = Math.sin(cam.yaw);
  const x1 = x * cyw - z * syw;
  const z1 = x * syw + z * cyw;

  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const y2 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;

  const denom = Math.max(40, cam.dist - z2);
  const scale = (cam.fov * cam.zoom) / denom;
  return {sx: cx + x1 * scale, sy: cy + y2 * scale, depth: z2, scale};
}

function shellPoint3D(radius, theta, k) {
  const x0 = radius * Math.cos(theta);
  const z0 = radius * Math.sin(theta);
  const [tx, tz] = SHELL_TILTS[k % SHELL_TILTS.length];
  const ctx = Math.cos(tx), stx = Math.sin(tx);
  const y1 = -z0 * stx;
  const z1 = z0 * ctx;
  const ctz = Math.cos(tz), stz = Math.sin(tz);
  return {
    x: x0 * ctz - y1 * stz,
    y: x0 * stz + y1 * ctz,
    z: z1
  };
}

function drawSphere3D(ctx, sx, sy, r, cHi, cMid, cDark, glow) {
  if (glow) {
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 2.1, 0, TAU);
    ctx.fill();
  }
  const g = ctx.createRadialGradient(sx - r * 0.34, sy - r * 0.34, Math.max(0.5, r * 0.12), sx, sy, r);
  g.addColorStop(0, cHi);
  g.addColorStop(0.55, cMid);
  g.addColorStop(1, cDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, TAU);
  ctx.fill();
}

function drawOrbitHalf(ctx, radius, k, front) {
  const segs = 72;
  ctx.save();
  ctx.strokeStyle = front ? 'rgba(148, 163, 184, 0.45)' : 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = front ? 1.5 : 1.0;
  for (let i = 0; i < segs; i++) {
    const t0 = (i / segs) * TAU;
    const t1 = ((i + 1) / segs) * TAU;
    const p0 = project3D(...Object.values(shellPoint3D(radius, t0, k)));
    const p1 = project3D(...Object.values(shellPoint3D(radius, t1, k)));
    const midDepth = (p0.depth + p1.depth) * 0.5;
    if ((front && midDepth >= 0) || (!front && midDepth < 0)) {
      ctx.beginPath();
      ctx.moveTo(p0.sx, p0.sy);
      ctx.lineTo(p1.sx, p1.sy);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function render3D(ctx) {
  const Z = state.Z, N = state.N, e = electronsOf(), arr = arrangement(e);
  const cx = VW / 2, cy = VW / 2;
  const radii = shellRadii(Z, N, Math.max(arr.length, 1));

  // Latar gelap 3D + cahaya ambien pusat
  ctx.fillStyle = '#0c1324';
  ctx.fillRect(0, 0, VW, VW);
  const bgGlow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 165);
  bgGlow.addColorStop(0, 'rgba(30, 58, 138, 0.34)');
  bgGlow.addColorStop(0.55, 'rgba(15, 23, 42, 0.15)');
  bgGlow.addColorStop(1, 'rgba(12, 19, 36, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, VW, VW);

  // Separuh belakang cincin orbit
  if (state.orbits) {
    arr.forEach((_, k) => drawOrbitHalf(ctx, radii[k], k, false));
  }

  // Kumpul semua zarah 3D (nukleon + elektron) dan susun ikut kedalaman
  const items = [];
  nucleusTokens3D(Z, N).forEach(t => {
    const p = project3D(t.x, t.y, t.z);
    items.push({kind: t.proton ? 'p' : 'n', ...p});
  });

  arr.forEach((cnt, k) => {
    const outer = k === arr.length - 1;
    const dir = k % 2 ? -1 : 1;
    const base = state.angle * dir * (1 / (k + 1)) + k * 0.55;
    for (let i = 0; i < cnt; i++) {
      const th = base + (i * TAU) / cnt;
      const pt3 = shellPoint3D(radii[k], th, k);
      const p = project3D(pt3.x, pt3.y, pt3.z);
      items.push({kind: outer && state.valence ? 'v' : 'e', ...p});
    }
  });

  items.sort((a, b) => a.depth - b.depth);

  for (const it of items) {
    if (it.kind === 'p') {
      drawSphere3D(ctx, it.sx, it.sy, 4.7 * it.scale, '#fca5a5', '#ef4444', '#991b1b');
    } else if (it.kind === 'n') {
      drawSphere3D(ctx, it.sx, it.sy, 4.7 * it.scale, '#e2e8f0', '#94a3b8', '#475569');
    } else if (it.kind === 'v') {
      drawSphere3D(ctx, it.sx, it.sy, 6.2 * it.scale, '#fef08a', '#f59e0b', '#b45309', 'rgba(245, 158, 11, 0.25)');
      text(ctx, MINUS, it.sx, it.sy + 3.2 * it.scale, {size: 9.5 * it.scale, align: 'center', color: '#fff'});
    } else {
      drawSphere3D(ctx, it.sx, it.sy, 5.7 * it.scale, '#bae6fd', '#38bdf8', '#0369a1', 'rgba(56, 189, 248, 0.22)');
      text(ctx, MINUS, it.sx, it.sy + 3.0 * it.scale, {size: 9.0 * it.scale, align: 'center', color: '#fff'});
    }
  }

  // Separuh hadapan cincin orbit & label petala
  if (state.orbits) {
    arr.forEach((_, k) => {
      drawOrbitHalf(ctx, radii[k], k, true);
      const lpt = project3D(...Object.values(shellPoint3D(radii[k], -0.4, k)));
      text(ctx, SHELL[k], lpt.sx + 4, lpt.sy - 4, {size: 9, color: '#94a3b8'});
    });
  }

  // Petunjuk ringkas di penjuru kiri atas
  const legend = [['#ef4444', `${Z} ${tr('lgProton')}`], ['#94a3b8', `${N} ${tr('lgNeutron')}`], ['#38bdf8', `${e} ${tr('lgElectron')}`]];
  if (state.valence && arr.length) legend.push(['#f59e0b', `${valenceOf(arr)} ${tr('lgValence')}`]);
  legend.forEach(([col, lab], i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(12, 14 + i * 15, 4.2, 0, TAU);
    ctx.fill();
    text(ctx, lab, 21, 18 + i * 15, {size: 10.5, color: '#cbd5e1', w: 600});
  });
  if (state.charge) {
    text(ctx, chargeStr(state.charge), VW - 12, 24, {
      align: 'right', size: 22, color: state.charge > 0 ? '#fda4af' : '#7dd3fc', w: 800
    });
  }
}

function render2D(ctx) {
  const Z = state.Z, N = state.N, e = electronsOf(), arr = arrangement(e);
  const cx = VW / 2, cy = VW / 2, radii = shellRadii(Z, N, Math.max(arr.length, 1));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, VW, VW);

  if (state.orbits) {
    arr.forEach((cnt, k) => {
      ctx.strokeStyle = '#c7c4d8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, radii[k], 0, TAU);
      ctx.stroke();
      text(ctx, SHELL[k], cx + radii[k] * 0.7071 + 3, cy - radii[k] * 0.7071 - 3, {size: 9, color: '#94a3b8'});
    });
  }

  const nr = nucleusRadius(Z, N);
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, nr);
  g.addColorStop(0, '#fff7ed');
  g.addColorStop(1, '#fed7aa');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, nr, 0, TAU);
  ctx.fill();

  nucleusTokens(Z, N).forEach(t => {
    ctx.fillStyle = t.proton ? '#ef4444' : '#94a3b8';
    ctx.strokeStyle = t.proton ? '#b91c1c' : '#64748b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx + t.x, cy + t.y, 4.4, 0, TAU);
    ctx.fill();
    ctx.stroke();
  });

  arr.forEach((cnt, k) => {
    const outer = k === arr.length - 1, dir = k % 2 ? -1 : 1, base = state.angle * dir * (1 / (k + 1)) + k * 0.5;
    for (let i = 0; i < cnt; i++) {
      const a = base + (i * TAU) / cnt;
      const x = cx + radii[k] * Math.cos(a), y = cy + radii[k] * Math.sin(a);
      const hi = outer && state.valence;
      ctx.fillStyle = hi ? '#f59e0b' : '#2563eb';
      ctx.strokeStyle = hi ? '#b45309' : '#1e3a8a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, TAU);
      ctx.fill();
      ctx.stroke();
      text(ctx, MINUS, x, y + 3.5, {size: 10, align: 'center', color: '#fff'});
    }
  });

  const legend = [['#ef4444', `${Z} ${tr('lgProton')}`], ['#94a3b8', `${N} ${tr('lgNeutron')}`], ['#2563eb', `${e} ${tr('lgElectron')}`]];
  if (state.valence && arr.length) legend.push(['#f59e0b', `${valenceOf(arr)} ${tr('lgValence')}`]);
  legend.forEach(([col, lab], i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(12, 14 + i * 16, 5, 0, TAU);
    ctx.fill();
    text(ctx, lab, 22, 18 + i * 16, {size: 11, color: '#464555', w: 600});
  });
  if (state.charge) {
    text(ctx, chargeStr(state.charge), VW - 12, 24, {
      align: 'right', size: 22, color: state.charge > 0 ? '#dc2626' : '#2563eb', w: 800
    });
  }
}

function render() {
  const c = $('atom'), ctx = c.getContext('2d'), s = (c._w || VW) / VW;
  ctx.setTransform((c._dpr || 1) * s, 0, 0, (c._dpr || 1) * s, 0, 0);
  ctx.clearRect(0, 0, VW, VW);
  if (state.view3d) render3D(ctx);
  else render2D(ctx);
}

function frame(now) {
  const dt = state.last ? Math.min(0.1, (now - state.last) / 1000) : 0;
  state.last = now;
  if (state.spin) {
    state.angle += dt * 1.1;
    state.dirty = true;
  }
  if (state.view3d && state.autoRotate) {
    cam.yaw += dt * 0.35;
    state.dirty = true;
  }
  if (state.dirty) {
    state.dirty = false;
    render();
  }
  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-z]').forEach(b => b.addEventListener('click', () => setElement(Number(b.dataset.z))));
  document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  document.querySelectorAll('[data-show]').forEach(input => input.addEventListener('change', () => {
    state[input.dataset.show] = input.checked;
    state.dirty = true;
  }));

  $('view-3d').addEventListener('click', () => setView3d(true));
  $('view-2d').addEventListener('click', () => setView3d(false));
  $('cam-zoom-in').addEventListener('click', () => { cam.zoom = clamp(cam.zoom + 0.15, 0.65, 1.85); state.dirty = true; });
  $('cam-zoom-out').addEventListener('click', () => { cam.zoom = clamp(cam.zoom - 0.15, 0.65, 1.85); state.dirty = true; });
  $('cam-reset').addEventListener('click', resetCamera);

  $('slider-n').addEventListener('input', e => setNeutrons(parseFloat(e?.target ? e.target.value : $('slider-n').value)));
  $('decrease-n').addEventListener('click', () => setNeutrons(state.N - 1));
  $('increase-n').addEventListener('click', () => setNeutrons(state.N + 1));

  $('isos').addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-a]') : null;
    if (b) setIsotope(Number(b.dataset.a));
  });
  $('btn-gain').addEventListener('click', () => setCharge(state.charge - 1));
  $('btn-lose').addEventListener('click', () => setCharge(state.charge + 1));
  $('btn-reset').addEventListener('click', resetAll);
  $('btn-lang').addEventListener('click', () => setLang(state.lang === 'ms' ? 'en' : 'ms'));

  setupTabs();
  if (typeof setupLessonVideos === 'function') setupLessonVideos({id: 'atom', videos: []});

  // Kawalan putaran kamera 3D dengan tetikus/sentuhan, zum roda dan papan kekunci
  const canvas = $('atom');
  let dragCam = null;
  canvas.addEventListener('pointerdown', e => {
    if (!state.view3d) return;
    dragCam = {x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch};
    canvas.classList.add('dragging');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragCam) return;
    cam.yaw = dragCam.yaw + (e.clientX - dragCam.x) * 0.01;
    cam.pitch = clamp(dragCam.pitch + (e.clientY - dragCam.y) * 0.01, -1.45, 1.45);
    state.dirty = true;
  });
  const endCamDrag = () => {
    dragCam = null;
    canvas.classList.remove('dragging');
  };
  canvas.addEventListener('pointerup', endCamDrag);
  canvas.addEventListener('pointercancel', endCamDrag);
  canvas.addEventListener('wheel', e => {
    if (!state.view3d) return;
    e.preventDefault();
    cam.zoom = clamp(cam.zoom + (e.deltaY < 0 ? 0.1 : -0.1), 0.65, 1.85);
    state.dirty = true;
  }, {passive: false});
  canvas.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      state.spin = !state.spin;
      sync();
    } else if (state.view3d && e.key === 'ArrowLeft') {
      e.preventDefault(); cam.yaw -= 0.15; state.dirty = true;
    } else if (state.view3d && e.key === 'ArrowRight') {
      e.preventDefault(); cam.yaw += 0.15; state.dirty = true;
    } else if (state.view3d && e.key === 'ArrowUp') {
      e.preventDefault(); cam.pitch = clamp(cam.pitch - 0.12, -1.45, 1.45); state.dirty = true;
    } else if (state.view3d && e.key === 'ArrowDown') {
      e.preventDefault(); cam.pitch = clamp(cam.pitch + 0.12, -1.45, 1.45); state.dirty = true;
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
    observer.observe(canvas);
  }

  let saved = null;
  try { saved = localStorage.getItem('stemlab-lang'); } catch (e) {}
  fitCanvas();
  setLang(saved === 'en' ? 'en' : 'ms');
  requestAnimationFrame(frame);
});
