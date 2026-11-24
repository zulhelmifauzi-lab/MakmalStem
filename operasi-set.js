const $ = id => document.getElementById(id);

/* ===== Kawalan ===== */
function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  state.mem = emptyMem();
  NAMES.forEach(s => (p[s] || []).forEach(n => { state.mem[s][n - 1] = true; }));
  state.three = p.three;
  state.preset = name;
  if (!state.three && state.active === 'C') state.active = 'A';
  if (OPS[state.op].sets > nSets()) state.op = 'u';
  afterChange(true);
}

function toggleElement(n) {
  if (n < 1 || n > N || (state.active === 'C' && !state.three)) return;
  state.mem[state.active][n - 1] = !state.mem[state.active][n - 1];
  state.preset = null;
  afterChange();
}

function moveTokenToRegion(n, x, y) {
  if (n < 1 || n > N) return;
  const g = state.geo || geometry();
  NAMES.forEach(s => {
    const C = g.circles[s];
    if (!C) return;
    state.mem[s][n - 1] = Math.hypot(x - C.x, y - C.y) <= C.r;
  });
  state.preset = null;
  afterChange();
}

function clearActive() {
  state.mem[state.active] = Array(N).fill(false);
  state.preset = null;
  afterChange();
}

function setThree(on) {
  state.three = on;
  if (!on && state.active === 'C') state.active = 'A';
  if (!on && OPS[state.op].sets > 2) state.op = 'u';
  state.preset = null;
  fitCanvas();
  afterChange();
}

function setOp(op) {
  if (OPS[op] && OPS[op].sets <= nSets()) {
    state.op = op;
    state.dirty = true;
    syncControls();
  }
}

function setActive(s) {
  if (s === 'C' && !state.three) return;
  state.active = s;
  state.dirty = true;
  syncControls();
}

function resetAll() {
  state.op = 'i';
  state.active = 'A';
  for (const k of Object.keys(state.show)) state.show[k] = true;
  applyPreset('overlap');
}

function afterChange(refit) {
  if (refit) fitCanvas();
  computeLayout();
  syncControls();
  state.dirty = true;
}

function syncControls() {
  document.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === state.preset)));
  document.querySelectorAll('[data-three]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.three === '1') === state.three)));
  document.querySelectorAll('[data-op]').forEach(b => {
    b.hidden = Number(b.dataset.sets) > nSets();
    b.setAttribute('aria-pressed', String(b.dataset.op === state.op));
  });
  document.querySelectorAll('[data-active]').forEach(b => {
    b.hidden = b.dataset.active === 'C' && !state.three;
    const on = b.dataset.active === state.active;
    b.setAttribute('aria-pressed', String(on));
    b.style.background = on ? COL[b.dataset.active] : '';
    b.style.borderColor = on ? COL[b.dataset.active] : '';
  });
  document.querySelectorAll('[data-n]').forEach(b => {
    const n = Number(b.dataset.n);
    b.setAttribute('aria-pressed', String(has(state.active, n)));
    b.setAttribute('data-a', has('A', n) ? '1' : '0');
    b.setAttribute('data-b', has('B', n) ? '1' : '0');
    b.setAttribute('data-c', state.three && has('C', n) ? '1' : '0');
  });
  document.querySelectorAll('[data-show]').forEach(input => {
    input.checked = state.show[input.dataset.show];
  });
  $('leg-c-wrap').hidden = !state.three;
}

function setupTabs() {
  const tabs = [$('set-tab-controls'), $('set-tab-elements')];
  const panes = [$('set-pane-controls'), $('set-pane-elements')];
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
    ? 'Operasi Set (Set Operations) (BETA) — Makmal STEM Matematik'
    : 'Set Operations (Operasi Set) (BETA) — Makmal STEM Mathematics';
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

/* ===== Susun atur token dalam kawasan Venn ===== */
const aspect = W => (state.three ? (W < 460 ? 1.0 : 0.82) : (W < 460 ? 0.72 : 0.6));
function geometry() {
  const c = $('venn'), W = c._w || 400, three = state.three, H = Math.round(W * aspect(W)), m = 6;
  const rect = {x: m, y: m, w: W - 2 * m, h: H - 2 * m}, cx = W / 2, cy = H / 2 + 4;
  let circles;
  if (!three) {
    const R = Math.min(W * 0.26, H * 0.36), d = R * 0.52;
    circles = {A: {x: cx - d, y: cy, r: R}, B: {x: cx + d, y: cy, r: R}};
  } else {
    const R = Math.min(W * 0.29, H * 0.3), d = R * 0.58;
    circles = {
      A: {x: cx - d, y: cy - R * 0.5, r: R},
      B: {x: cx + d, y: cy - R * 0.5, r: R},
      C: {x: cx, y: cy + R * 0.45, r: R}
    };
  }
  return {W, H, rect, circles};
}

const regionKey = m => (m.a ? 1 : 0) | (m.b ? 2 : 0) | (m.c ? 4 : 0);
function labelPos(g, s) {
  const C = g.circles[s];
  const lx = C.x + (s === 'A' ? -C.r * 0.62 : s === 'B' ? C.r * 0.62 : 0);
  const ly = s === 'C' ? C.y + C.r + 14 : C.y - C.r * 0.88 - 2;
  return [lx, Math.min(g.H - 8, ly) - 7];
}

function computeLayout() {
  const g = geometry();
  state.geo = g;
  const cand = {}, margin = TR + 3, step = 5;
  for (let y = g.rect.y + margin; y <= g.rect.y + g.rect.h - margin; y += step) {
    for (let x = g.rect.x + margin; x <= g.rect.x + g.rect.w - margin; x += step) {
      if (x < 54 && y < 36) continue;
      if (NAMES.some(s => g.circles[s] && Math.hypot(x - labelPos(g, s)[0], y - labelPos(g, s)[1]) < 24)) continue;
      let key = 0, ok = true;
      NAMES.forEach((s, i) => {
        const C = g.circles[s];
        if (!C) return;
        const d = Math.hypot(x - C.x, y - C.y);
        if (d <= C.r - margin) key |= 1 << i;
        else if (d < C.r + margin) ok = false;
      });
      if (ok) (cand[key] = cand[key] || []).push([x, y]);
    }
  }
  const centroids = {};
  Object.keys(cand).forEach(k => {
    const pts = cand[k];
    const t = Number(k) === 0
      ? [g.rect.x + g.rect.w - 46, g.rect.y + g.rect.h - 36]
      : [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
    centroids[k] = t;
    pts.sort((p, q) => Math.hypot(p[0] - t[0], p[1] - t[1]) - Math.hypot(q[0] - t[0], q[1] - t[1]));
  });
  g.centroids = centroids;

  const groups = {};
  range(1, N).forEach(n => {
    const k = regionKey(membership(n));
    (groups[k] = groups[k] || []).push(n);
  });
  const target = Array(N);
  Object.keys(groups).forEach(k => {
    const pts = cand[k] || [[g.W / 2, g.H / 2]], placed = [];
    groups[k].forEach(n => {
      let pick = null;
      for (const f of [2 * TR + 3, 2 * TR - 2]) {
        pick = pts.find(p => placed.every(q => Math.hypot(p[0] - q[0], p[1] - q[1]) >= f));
        if (pick) break;
      }
      if (!pick) {
        let best = -1;
        pts.forEach(p => {
          const d = placed.length ? Math.min(...placed.map(q => Math.hypot(p[0] - q[0], p[1] - q[1]))) : 99;
          if (d > best) { best = d; pick = p; }
        });
      }
      placed.push(pick);
      target[n - 1] = pick;
    });
  });
  range(1, N).forEach(n => {
    const t = target[n - 1], tk = state.tok[n - 1];
    state.tok[n - 1] = tk ? Object.assign(tk, {tx: t[0], ty: t[1]}) : {x: t[0], y: t[1], tx: t[0], ty: t[1]};
  });
}

function animate() {
  let moving = false;
  state.tok.forEach((t, idx) => {
    if (drag && drag.moved && drag.n === idx + 1) return;
    const dx = t.tx - t.x, dy = t.ty - t.y;
    if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) {
      t.x += dx * 0.28;
      t.y += dy * 0.28;
      moving = true;
    } else {
      t.x = t.tx;
      t.y = t.ty;
    }
  });
  if (moving) state.dirty = true;
}

/* ===== Paparan ===== */
function updateReadouts() {
  const A = membersOf('A'), B = membersOf('B'), C = state.three ? membersOf('C') : [];
  const res = resultOf(), op = OPS[state.op];
  $('res-expr').textContent = op.label;
  $('res-set').textContent = setStr(res);
  $('res-n').textContent = `n(${op.label}) = ${res.length}`;
  $('set-a').textContent = `${setStr(A)} · n(A) = ${A.length}`;
  $('set-b').textContent = `${setStr(B)} · n(B) = ${B.length}`;
  $('set-c').textContent = `${setStr(C)} · n(C) = ${C.length}`;
  $('row-c').hidden = !state.three;

  const inter = (x, y) => x.filter(n => y.includes(n));
  let law = '';
  if (!state.three) {
    const u = resultOf('u').length, i = inter(A, B).length;
    law = `n(A ∪ B) = n(A) + n(B) − n(A ∩ B) → ${u} = ${A.length} + ${B.length} − ${i}`;
  } else {
    const u = resultOf('u3').length, ab = inter(A, B).length, ac = inter(A, C).length, bc = inter(B, C).length, abc = resultOf('i3').length;
    law = `n(A ∪ B ∪ C) = ${A.length} + ${B.length} + ${C.length} − ${ab} − ${ac} − ${bc} + ${abc} = ${u}`;
  }
  $('law').textContent = law;
  $('row-law').hidden = false;

  let rel = '';
  if (!A.length || !B.length) rel = tr('relEmpty');
  else if (A.length === B.length && isSubset(A, B)) rel = tr('relEq');
  else if (isSubset(A, B)) rel = tr('relAB');
  else if (isSubset(B, A)) rel = tr('relBA');
  else if (!inter(A, B).length) rel = tr('relDisj');
  else rel = tr('relOver');
  $('note').textContent = (state.preset ? tr('pd_' + state.preset) + ' ' : '') + rel;
}

const DPR = () => (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
function fitCanvas() {
  const c = $('venn'), w = Math.max(c.getBoundingClientRect().width, 240);
  c._w = w;
  c._dpr = DPR();
  const h = Math.round(w * aspect(w));
  c._h = h;
  c.style.height = h + 'px';
  c.width = Math.round(w * DPR());
  c.height = Math.round(h * DPR());
  if (state.tok.length) computeLayout();
  state.dirty = true;
}

function text(ctx, s, x, y, o = {}) {
  ctx.font = `${o.w || 700} ${o.size || 13}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = o.color || '#131b2e';
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  ctx.fillText(s, x, y);
}

function clipRegion(ctx, g, key) {
  ctx.beginPath();
  ctx.rect(g.rect.x, g.rect.y, g.rect.w, g.rect.h);
  ctx.clip();
  NAMES.forEach((s, i) => {
    const C = g.circles[s];
    if (!C) return;
    ctx.beginPath();
    if (key & (1 << i)) {
      ctx.arc(C.x, C.y, C.r, 0, 6.2832);
    } else {
      ctx.rect(0, 0, g.W, g.H);
      ctx.arc(C.x, C.y, C.r, 0, 6.2832);
    }
    ctx.clip(key & (1 << i) ? 'nonzero' : 'evenodd');
  });
}

function render() {
  updateReadouts();
  syncControls();
  const c = $('venn'), g = state.geo || geometry(), ctx = c.getContext('2d');
  const op = OPS[state.op], res = resultOf();
  ctx.setTransform(c._dpr || 1, 0, 0, c._dpr || 1, 0, 0);
  ctx.clearRect(0, 0, g.W, g.H);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, g.W, g.H);

  // Sempadan set semesta ξ
  ctx.strokeStyle = '#464555';
  ctx.lineWidth = 2;
  ctx.strokeRect(g.rect.x, g.rect.y, g.rect.w, g.rect.h);
  text(ctx, 'ξ', g.rect.x + 10, g.rect.y + 22, {size: 18, color: '#464555'});

  if (state.show.counts) {
    text(ctx, `n(${op.label}) = ${res.length}`, g.rect.x + g.rect.w - 10, g.rect.y + 20, {
      size: 12, color: '#855300', align: 'right', w: 750
    });
  }

  const active = NAMES.filter(s => g.circles[s]);
  active.forEach(s => {
    const C = g.circles[s];
    ctx.fillStyle = COL[s] + '14';
    ctx.beginPath();
    ctx.arc(C.x, C.y, C.r, 0, 6.2832);
    ctx.fill();
  });

  // Lorekan kawasan hasil operasi
  if (state.show.shade) {
    for (let key = 0; key < (state.three ? 8 : 4); key++) {
      if (!op.test({a: !!(key & 1), b: !!(key & 2), c: !!(key & 4)})) continue;
      ctx.save();
      clipRegion(ctx, g, key);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.30)';
      ctx.fillRect(g.rect.x, g.rect.y, g.rect.w, g.rect.h);
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.24)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let d = -g.H; d < g.W + g.H; d += 12) {
        ctx.moveTo(d, g.rect.y);
        ctx.lineTo(d - g.H, g.rect.y + g.H);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // Bulatan dan label set
  active.forEach(s => {
    const C = g.circles[s];
    ctx.strokeStyle = COL[s];
    ctx.lineWidth = s === state.active ? 3.8 : 2.4;
    ctx.beginPath();
    ctx.arc(C.x, C.y, C.r, 0, 6.2832);
    ctx.stroke();

    if (state.show.labels) {
      const [lx, ly] = labelPos(g, s);
      const countTxt = state.show.counts ? `${s} (${membersOf(s).length})` : s;
      text(ctx, countTxt, lx, ly + 7, {size: 16, color: COL[s], align: 'center', w: 800});
    }
  });

  // Papar bilangan unsur per rantau apabila token disembunyikan
  if (!state.show.tokens && state.show.counts && g.centroids) {
    const counts = {};
    range(1, N).forEach(n => {
      const k = regionKey(membership(n));
      counts[k] = (counts[k] || 0) + 1;
    });
    for (let key = 0; key < (state.three ? 8 : 4); key++) {
      const pt = g.centroids[key];
      if (!pt) continue;
      const cnt = counts[key] || 0;
      text(ctx, String(cnt), pt[0], pt[1] + 5, {
        size: 15, color: '#252137', align: 'center', w: 800
      });
    }
  }

  // Token nombor 1..20
  if (state.show.tokens) {
    state.tok.forEach((t, i) => {
      const n = i + 1;
      const hit = res.includes(n);
      const isDragged = drag && drag.moved && drag.n === n;
      ctx.fillStyle = isDragged ? '#fde68a' : hit ? '#f59e0b' : '#ffffff';
      ctx.strokeStyle = isDragged ? '#362951' : hit ? '#b45309' : '#777587';
      ctx.lineWidth = isDragged || hit ? 2.4 : 1.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, TR, 0, 6.2832);
      ctx.fill();
      ctx.stroke();
      text(ctx, String(n), t.x, t.y + 4, {size: 11, align: 'center', color: '#131b2e'});
    });
  }
}

function frame() {
  animate();
  if (state.dirty) {
    state.dirty = false;
    render();
  }
  requestAnimationFrame(frame);
}

function tokenAt(x, y) {
  let best = null, bd = TR + 8;
  state.tok.forEach((t, i) => {
    const d = Math.hypot(t.x - x, t.y - y);
    if (d <= bd) { bd = d; best = i + 1; }
  });
  return best;
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  document.querySelectorAll('[data-three]').forEach(b => b.addEventListener('click', () => setThree(b.dataset.three === '1')));
  document.querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => setOp(b.dataset.op)));
  document.querySelectorAll('[data-active]').forEach(b => b.addEventListener('click', () => setActive(b.dataset.active)));
  document.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => toggleElement(Number(b.dataset.n))));
  document.querySelectorAll('[data-show]').forEach(input => input.addEventListener('change', () => {
    state.show[input.dataset.show] = input.checked;
    state.dirty = true;
  }));

  $('btn-clear').addEventListener('click', clearActive);
  $('btn-reset').addEventListener('click', resetAll);
  $('btn-lang').addEventListener('click', () => setLang(state.lang === 'ms' ? 'en' : 'ms'));

  setupTabs();
  if (typeof setupLessonVideos === 'function') setupLessonVideos({id: 'set', videos: []});

  const v = $('venn');
  const toCanvas = e => {
    const b = v.getBoundingClientRect();
    const g = state.geo || geometry();
    return {
      x: (e.clientX - b.left) * ((v._w || g.W) / b.width),
      y: (e.clientY - b.top) * ((v._h || g.H) / b.height)
    };
  };

  v.addEventListener('pointerdown', e => {
    if (!state.show.tokens) return;
    const p = toCanvas(e);
    const n = tokenAt(p.x, p.y);
    if (!n) return;
    drag = {n, startX: p.x, startY: p.y, x: p.x, y: p.y, moved: false};
    try { v.setPointerCapture(e.pointerId); } catch (err) {}
  });
  v.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = toCanvas(e);
    drag.x = p.x;
    drag.y = p.y;
    if (Math.hypot(p.x - drag.startX, p.y - drag.startY) > 4) {
      drag.moved = true;
      v.classList.add('dragging');
      const tk = state.tok[drag.n - 1];
      if (tk) { tk.x = p.x; tk.y = p.y; }
      state.dirty = true;
    }
  });
  const endDrag = () => {
    if (!drag) return;
    const cur = drag;
    drag = null;
    v.classList.remove('dragging');
    if (cur.moved) moveTokenToRegion(cur.n, cur.x, cur.y);
    else toggleElement(cur.n);
  };
  v.addEventListener('pointerup', endDrag);
  v.addEventListener('pointercancel', endDrag);

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
    observer.observe(v);
  }

  let saved = null;
  try { saved = localStorage.getItem('stemlab-lang'); } catch (e) {}
  fitCanvas();
  setLang(saved === 'en' ? 'en' : 'ms');
  applyPreset('overlap');
  requestAnimationFrame(frame);
});
