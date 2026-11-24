const $ = id => document.getElementById(id);

/* ===== Kawalan ===== */
function setLine(index, m, c, op) {
  const line = state.lines[index];
  if (Number.isFinite(m)) line.m = r9(clamp(m, -LIM.m, LIM.m));
  if (Number.isFinite(c)) line.c = r9(clamp(c, -LIM.c, LIM.c));
  if (op && OP_SYM[op]) line.op = op;
  state.dirty = true;
}

function setParam(key, value) {
  if (!Number.isFinite(value)) return;
  const limit = key === 'm' ? LIM.m : LIM.c;
  activeLine()[key] = r9(clamp(value, -limit, limit));
  state.dirty = true;
  syncControls();
}

function setOp(op) {
  if (!OP_SYM[op]) return;
  activeLine().op = op;
  state.dirty = true;
  syncControls();
}

function setMode(mode) {
  state.mode = mode === 'system' ? 'system' : 'single';
  if (state.mode === 'single') state.active = 0;
  state.dirty = true;
  syncControls();
}

function setActive(index) {
  state.active = index === 1 && state.mode === 'system' ? 1 : 0;
  state.dirty = true;
  syncControls();
}

function movePoint(x, y) {
  state.point.x = r9(clamp(Math.round(x * 2) / 2, -LIM.view, LIM.view));
  state.point.y = r9(clamp(Math.round(y * 2) / 2, -LIM.view, LIM.view));
  state.dirty = true;
}

function resetAll() {
  state.mode = 'single';
  state.active = 0;
  state.lines = DEFAULT_LINES.map(l => ({...l}));
  state.point = {...DEFAULT_POINT};
  for (const k of Object.keys(state.show)) state.show[k] = true;
  state.dirty = true;
  syncControls();
}

function syncControls() {
  const line = activeLine();
  const isSys = state.mode === 'system';
  $('mode-single').setAttribute('aria-pressed', String(!isSys));
  $('mode-system').setAttribute('aria-pressed', String(isSys));
  $('line-picker').hidden = !isSys;
  $('leg2-wrap').hidden = !isSys;
  $('legR-wrap').hidden = !isSys;
  $('pick-0').setAttribute('aria-pressed', String(state.active === 0));
  $('pick-1').setAttribute('aria-pressed', String(state.active === 1));

  for (const [id, op] of [['op-gt', '>'], ['op-gte', '>='], ['op-lt', '<'], ['op-lte', '<=']]) {
    $(id).setAttribute('aria-pressed', String(line.op === op));
  }
  for (const key of ['m', 'c']) {
    const limit = key === 'm' ? LIM.m : LIM.c;
    const slider = $('slider-' + key);
    slider.value = line[key];
    $('out-' + key).textContent = n2(line[key]);
    $('decrease-' + key).disabled = line[key] <= -limit;
    $('increase-' + key).disabled = line[key] >= limit;
  }
  document.querySelectorAll('[data-show]').forEach(input => {
    input.checked = state.show[input.dataset.show];
  });
}

function setupTabs() {
  const tabs = [$('ineq-tab-controls'), $('ineq-tab-table')];
  const panes = [$('ineq-pane-controls'), $('ineq-pane-table')];
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
    ? 'Ketaksamaan Linear (Linear Inequalities) (BETA) — Makmal STEM Matematik'
    : 'Linear Inequalities (Ketaksamaan Linear) (BETA) — Makmal STEM Mathematics';
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
  const lines = activeLines();
  const isSys = state.mode === 'system';
  const cur = activeLine();

  $('f-ineq').textContent = lines.map(ineqStr).join(' ; ');

  if (!isSys) {
    $('f-boundary').textContent = tr(isSolid(cur.op) ? 'solid' : 'dashed');
    $('f-region').textContent = tr(isAbove(cur.op) ? 'above' : 'below');
    $('f-extra-label').textContent = tr('f_intercepts');
    const xi = xIntercept(cur);
    const yText = `(0, ${n2(cur.c)})`;
    const xText = xi === null ? tr('noXInt') : `(${n2(xi)}, 0)`;
    $('f-extra').textContent = `x: ${xText} · y: ${yText}`;
  } else {
    $('f-boundary').textContent = `1: ${tr(isSolid(lines[0].op) ? 'solidShort' : 'dashedShort')} · 2: ${tr(isSolid(lines[1].op) ? 'solidShort' : 'dashedShort')}`;
    const common = regionPolygon(lines);
    const hasCommon = common.length >= 3 && polygonArea(common) > 1e-4;
    $('f-region').textContent = tr(hasCommon ? 'commonRegion' : 'noCommonRegion');
    $('f-extra-label').textContent = tr('f_intersection');
    const inter = intersectionOf(lines[0], lines[1]);
    $('f-extra').textContent = inter === 'coincident'
      ? tr('coincident')
      : inter === null
        ? tr('parallel')
        : `(${n2(inter.x)}, ${n2(inter.y)})`;
  }

  const p = state.point;
  const ok = satisfiesAll(p.x, p.y);
  let statusText = tr(ok ? 'satisfied' : 'notSatisfied');
  if (!isSys && onBoundary(p.x, p.y, cur)) {
    statusText = tr(isSolid(cur.op) ? 'onBoundarySolid' : 'onBoundaryDashed');
  }
  const sub = !isSys ? ` (${n2(p.y)} ${OP_SYM[cur.op]} ${n2(yAt(p.x, cur))})` : '';
  $('f-point').innerHTML = `(${n2(p.x)}, ${n2(p.y)})<br><span class="${ok ? 'ineq-status-ok' : 'ineq-status-no'}">${ok ? '✓' : '✗'} ${statusText}${sub}</span>`;

  $('ineq-coordinates').innerHTML = COORDINATE_X
    .map(x => `<tr><th scope="row">${n2(x)}</th><td>${n2(yAt(x, cur))}</td></tr>`).join('');

  if (!isSys) {
    $('note').textContent = tr(isSolid(cur.op) ? 'noteSolid' : 'noteDashed') + ' ' + tr(isAbove(cur.op) ? 'noteAbove' : 'noteBelow');
  } else {
    const common = regionPolygon(lines);
    const hasCommon = common.length >= 3 && polygonArea(common) > 1e-4;
    $('note').textContent = tr(hasCommon ? 'noteSystem' : 'noteSystemEmpty');
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
  ctx.fillStyle = o.color || '#1b1b21';
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  ctx.fillText(s, x, y);
}

function geom() {
  const c = $('plot'), W = c._w || 400, m = 30;
  return {
    W, m,
    X: x => m + (x + LIM.view) / (2 * LIM.view) * (W - 2 * m),
    Y: y => W - m - (y + LIM.view) / (2 * LIM.view) * (W - 2 * m)
  };
}

function dot(ctx, x, y, col, r = 6) {
  ctx.fillStyle = col;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 6.2832);
  ctx.fill();
  ctx.stroke();
}

function tag(ctx, s, x, y, col, align) {
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  const w = ctx.measureText(s).width + 10;
  const x0 = align === 'right' ? x - w + 5 : align === 'center' ? x - w / 2 : x - 5;
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.fillRect(x0, y - 13, w, 18);
  text(ctx, s, x, y, {color: col, w: 700, align});
}

function tracePoly(ctx, poly, X, Y) {
  ctx.beginPath();
  poly.forEach((p, i) => i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)));
  ctx.closePath();
}

function render() {
  updateReadouts();
  syncControls();
  const c = $('plot'), ctx = c.getContext('2d'), {W, m, X, Y} = geom(), V = LIM.view;
  ctx.setTransform(c._dpr || 1, 0, 0, c._dpr || 1, 0, 0);
  ctx.clearRect(0, 0, W, W);

  // Grid
  for (let i = -V; i <= V; i++) {
    ctx.strokeStyle = i % 5 === 0 ? '#d8c3ad' : '#eae7ef';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X(i), Y(-V)); ctx.lineTo(X(i), Y(V));
    ctx.moveTo(X(-V), Y(i)); ctx.lineTo(X(V), Y(i));
    ctx.stroke();
  }

  const lines = activeLines();
  const isSys = state.mode === 'system';
  const lineColors = ['#b45309', '#634395'];
  const shadeColors = ['rgba(180,83,9,0.16)', 'rgba(99,67,149,0.16)'];

  // Clip plot area for shaded regions and boundary lines
  ctx.save();
  ctx.beginPath();
  ctx.rect(X(-V), Y(V), X(V) - X(-V), Y(-V) - Y(V));
  ctx.clip();

  if (state.show.shade) {
    lines.forEach((line, idx) => {
      const poly = regionPolygon([line], V);
      if (poly.length < 3) return;
      tracePoly(ctx, poly, X, Y);
      ctx.fillStyle = shadeColors[idx];
      ctx.fill();
    });

    if (isSys) {
      const common = regionPolygon(lines, V);
      if (common.length >= 3 && polygonArea(common) > 1e-4) {
        ctx.save();
        tracePoly(ctx, common, X, Y);
        ctx.fillStyle = 'rgba(0,108,73,0.22)';
        ctx.fill();
        ctx.clip();
        ctx.strokeStyle = 'rgba(0,108,73,0.32)';
        ctx.lineWidth = 1.5;
        for (let d = -W; d < W * 2; d += 14) {
          ctx.beginPath();
          ctx.moveTo(d, 0);
          ctx.lineTo(d - W, W);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  // Axes (drawn above light shading for clarity)
  ctx.strokeStyle = '#1b1b21';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(-V), Y(0)); ctx.lineTo(X(V), Y(0));
  ctx.moveTo(X(0), Y(-V)); ctx.lineTo(X(0), Y(V));
  ctx.stroke();

  // Boundary lines
  lines.forEach((line, idx) => {
    ctx.save();
    ctx.strokeStyle = lineColors[idx];
    ctx.lineWidth = 3.2;
    if (!isSolid(line.op)) ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(X(-V), Y(yAt(-V, line)));
    ctx.lineTo(X(V), Y(yAt(V, line)));
    ctx.stroke();
    ctx.restore();
  });

  // Region label
  if (state.show.labels && state.show.shade) {
    const targetPoly = regionPolygon(lines, V);
    if (targetPoly.length >= 3 && polygonArea(targetPoly) > 2) {
      const cen = polygonCentroid(targetPoly);
      const cx = clamp(X(cen.x), m + 24, W - m - 24);
      const cy = clamp(Y(cen.y), m + 24, W - m - 24);
      const label = isSys ? 'R' : ineqStr(lines[0]);
      tag(ctx, label, cx, cy, isSys ? '#006c49' : '#855300', 'center');
    }
  }
  ctx.restore();

  // Axis ticks & labels
  for (let i = -V; i <= V; i += 2) if (i) {
    text(ctx, n2(i), X(i), Y(0) + 15, {align: 'center', size: 10, color: '#534434'});
    text(ctx, n2(i), X(0) - 6, Y(i) + 4, {align: 'right', size: 10, color: '#534434'});
  }
  text(ctx, 'x', X(V) - 2, Y(0) - 8, {align: 'right', w: 800});
  text(ctx, 'y', X(0) + 8, Y(V) + 12, {w: 800});

  // Intercepts or intersection
  if (state.show.intercepts) {
    if (!isSys) {
      const l = lines[0];
      if (Math.abs(l.c) <= V) {
        dot(ctx, X(0), Y(l.c), '#006c49', 5.5);
        tag(ctx, `(0, ${n2(l.c)})`, X(0) + 10, Y(l.c) - 8, '#006c49');
      }
      const xi = xIntercept(l);
      if (xi !== null && Math.abs(xi) <= V && Math.abs(xi) > EPS) {
        dot(ctx, X(xi), Y(0), '#b45309', 5.5);
        tag(ctx, `(${n2(xi)}, 0)`, X(xi), Y(0) + 28, '#b45309', 'center');
      }
    } else {
      const inter = intersectionOf(lines[0], lines[1]);
      if (inter && inter !== 'coincident' && Math.abs(inter.x) <= V && Math.abs(inter.y) <= V) {
        dot(ctx, X(inter.x), Y(inter.y), '#362951', 6.5);
        tag(ctx, `(${n2(inter.x)}, ${n2(inter.y)})`, X(inter.x) + 10, Y(inter.y) - 10, '#362951');
      }
    }
  }

  // Test point P
  if (state.show.point) {
    const p = state.point;
    const ok = satisfiesAll(p.x, p.y);
    const col = ok ? '#006c49' : '#ba1a1a';
    dot(ctx, X(p.x), Y(p.y), col, 8);
    const px = X(p.x), py = Y(p.y);
    const align = p.x > 5 ? 'right' : 'left';
    const dx = align === 'right' ? -12 : 12;
    const dy = p.y > 7 ? 20 : -10;
    tag(ctx, `P(${n2(p.x)}, ${n2(p.y)}) ${ok ? '✓' : '✗'}`, px + dx, py + dy, col, align);
  }
}

function frame() {
  if (state.dirty) { state.dirty = false; render(); }
  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', () => {
  $('mode-single').addEventListener('click', () => setMode('single'));
  $('mode-system').addEventListener('click', () => setMode('system'));
  $('pick-0').addEventListener('click', () => setActive(0));
  $('pick-1').addEventListener('click', () => setActive(1));

  for (const [id, op] of [['op-gt', '>'], ['op-gte', '>='], ['op-lt', '<'], ['op-lte', '<=']]) {
    $(id).addEventListener('click', () => setOp(op));
  }

  for (const key of ['m', 'c']) {
    const slider = $('slider-' + key);
    slider.addEventListener('input', () => setParam(key, Number(slider.value)));
    $('decrease-' + key).addEventListener('click', () => setParam(key, activeLine()[key] - Number(slider.step)));
    $('increase-' + key).addEventListener('click', () => setParam(key, activeLine()[key] + Number(slider.step)));
  }

  $('btn-reset').addEventListener('click', resetAll);
  setupTabs();
  if (typeof setupLessonVideos === 'function') setupLessonVideos({id: 'ketaksamaan-linear', videos: []});
  $('btn-lang').addEventListener('click', () => setLang(state.lang === 'ms' ? 'en' : 'ms'));

  document.querySelectorAll('[data-show]').forEach(input => input.addEventListener('change', () => {
    state.show[input.dataset.show] = input.checked;
    state.dirty = true;
  }));

  // Drag test point P (or click anywhere to move P)
  const pl = $('plot');
  const toMath = e => {
    const b = pl.getBoundingClientRect(), {W, m} = geom();
    const px = (e.clientX - b.left) * (W / b.width);
    const py = (e.clientY - b.top) * (W / b.height);
    return {
      x: (px - m) / (W - 2 * m) * 2 * LIM.view - LIM.view,
      y: LIM.view - (py - m) / (W - 2 * m) * 2 * LIM.view
    };
  };
  pl.addEventListener('pointerdown', e => {
    if (!state.show.point) return;
    const p = toMath(e);
    movePoint(p.x, p.y);
    state.dragging = true;
    pl.classList.add('dragging');
    try { pl.setPointerCapture(e.pointerId); } catch (err) {}
  });
  pl.addEventListener('pointermove', e => {
    if (state.dragging) { const p = toMath(e); movePoint(p.x, p.y); }
  });
  const end = () => { state.dragging = false; pl.classList.remove('dragging'); };
  pl.addEventListener('pointerup', end);
  pl.addEventListener('pointercancel', end);
  pl.addEventListener('keydown', e => {
    const d = {ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, 0.5], ArrowDown: [0, -0.5]}[e.key];
    if (d) { e.preventDefault(); movePoint(state.point.x + d[0], state.point.y + d[1]); }
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
