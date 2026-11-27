const $ = id => document.getElementById(id);
const $$ = s => Array.from(document.querySelectorAll(s));
const lk = k => !!state.locks[k];
const hid = k => !!state.hide[k];

/* ===== Kawalan ===== */
function setLine(index, m, c, op) {
  const line = state.lines[index];
  if (!line) return;
  if (Number.isFinite(m)) line.m = r9(clamp(m, -LIM.m, LIM.m));
  if (Number.isFinite(c)) line.c = r9(clamp(c, -LIM.c, LIM.c));
  if (op && OP_SYM[op]) line.op = op;
  state.dirty = true;
}

function setParam(key, value) {
  if (!Number.isFinite(value) || lk(key)) return;
  const limit = key === 'm' ? LIM.m : LIM.c;
  activeLine()[key] = r9(clamp(value, -limit, limit));
  state.dirty = true;
  syncControls();
}

function setOp(op) {
  if (!OP_SYM[op] || lk('op')) return;
  activeLine().op = op;
  state.dirty = true;
  syncControls();
}

function setMode(mode) {
  if (lk('mode')) return;
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

function applyPreset(p) {
  if (!p || lk('mode') || lk('m') || lk('c') || lk('op')) return;
  state.mode = p.mode;
  state.active = 0;
  state.lines = p.lines.map(l => ({...l}));
  state.point = {...p.point};
  state.dirty = true;
  syncControls();
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

let toastTimer = 0;
function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function hideHint() {
  const h = $('hint');
  if (h) h.classList.add('hide');
}

function renderPresets() {
  const bar = $('presetBar');
  if (!bar) return;
  if (!bar.children.length) {
    PRESETS.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'iq-pre';
      btn.dataset.preset = p.id;
      btn.addEventListener('click', () => { applyPreset(p); hideHint(); });
      bar.appendChild(btn);
    });
  }
  const locked = lk('mode') || lk('m') || lk('c') || lk('op');
  Array.from(bar.children).forEach((btn, idx) => {
    const p = PRESETS[idx];
    if (!p) return;
    btn.textContent = tr(p.labelKey);
    const matchesMode = state.mode === p.mode;
    const count = p.mode === 'system' ? 2 : 1;
    const matchesLines = p.lines.slice(0, count).every((l, i) =>
      Math.abs(state.lines[i].m - l.m) < EPS &&
      Math.abs(state.lines[i].c - l.c) < EPS &&
      state.lines[i].op === l.op
    );
    btn.classList.toggle('on', matchesMode && matchesLines);
    btn.disabled = locked;
  });
}

function renderSummary() {
  const tbody = $('sumRows');
  if (!tbody) return;
  const activeOp = activeLine().op;
  tbody.innerHTML = SUMMARY_ROWS.map(row => {
    const on = row.op === activeOp;
    return `<tr class="${on ? 'on' : ''}"><td>${row.sym}</td><td>${tr(row.boundaryKey)}</td><td>${tr(row.regionKey)}</td><td>${tr(row.onLineKey)}</td><td>${row.eg}</td></tr>`;
  }).join('');
}

function syncControls() {
  const line = activeLine();
  const isSys = state.mode === 'system';
  const modeSingle = $('mode-single');
  const modeSystem = $('mode-system');
  if (modeSingle) {
    modeSingle.setAttribute('aria-pressed', String(!isSys));
    modeSingle.disabled = lk('mode');
  }
  if (modeSystem) {
    modeSystem.setAttribute('aria-pressed', String(isSys));
    modeSystem.disabled = lk('mode');
  }
  const picker = $('line-picker');
  if (picker) picker.hidden = !isSys;
  const pickerGrp = $('linePickerGroup');
  if (pickerGrp) pickerGrp.hidden = !isSys;
  const leg2 = $('leg2-wrap');
  if (leg2) leg2.hidden = !isSys;
  const legR = $('legR-wrap');
  if (legR) legR.hidden = !isSys;
  const p0 = $('pick-0'), p1 = $('pick-1');
  if (p0) p0.setAttribute('aria-pressed', String(state.active === 0));
  if (p1) p1.setAttribute('aria-pressed', String(state.active === 1));

  for (const [id, op] of [['op-gt', '>'], ['op-gte', '>='], ['op-lt', '<'], ['op-lte', '<=']]) {
    const btn = $(id);
    if (!btn) continue;
    btn.setAttribute('aria-pressed', String(line.op === op));
    btn.disabled = lk('op');
  }
  for (const key of ['m', 'c']) {
    const limit = key === 'm' ? LIM.m : LIM.c;
    const slider = $('slider-' + key);
    const out = $('out-' + key);
    const dec = $('decrease-' + key);
    const inc = $('increase-' + key);
    const locked = lk(key);
    if (slider) {
      slider.value = line[key];
      slider.disabled = locked;
      if (slider.style && typeof slider.style.setProperty === 'function') {
        slider.style.setProperty('--p', ((line[key] + limit) / (2 * limit)) * 100 + '%');
      }
    }
    if (out) out.textContent = n2(line[key]);
    if (dec) dec.disabled = locked || line[key] <= -limit;
    if (inc) inc.disabled = locked || line[key] >= limit;
  }
  const rst = $('btn-reset');
  if (rst) rst.disabled = lk('mode') || lk('m') || lk('c') || lk('op');

  document.querySelectorAll('[data-show]').forEach(input => {
    input.checked = state.show[input.dataset.show];
  });
  renderPresets();
  renderSummary();
}

function setupTabGroup(tabIds, paneIds) {
  const tabs = tabIds.map(id => $(id)).filter(Boolean);
  const panes = paneIds.map(id => $(id)).filter(Boolean);
  if (!tabs.length || tabs.length !== panes.length) return () => {};
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
      const next = {
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectTab(next);
      tabs[next].focus();
    });
  });
  return selectTab;
}

function setLang(lang) {
  state.lang = lang === 'en' ? 'en' : 'ms';
  if (document.documentElement) document.documentElement.lang = state.lang;
  if (typeof document.title === 'string') {
    document.title = state.lang === 'ms'
      ? 'Ketaksamaan Linear (Linear Inequalities) — Makmal STEM Matematik'
      : 'Linear Inequalities (Ketaksamaan Linear) — Makmal STEM Mathematics';
  }
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (I18N[state.lang][k] !== undefined) el.textContent = I18N[state.lang][k];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const k = el.dataset.i18nAria;
    if (I18N[state.lang][k] !== undefined) el.setAttribute('aria-label', I18N[state.lang][k]);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const k = el.dataset.i18nTitle;
    if (I18N[state.lang][k] !== undefined) el.setAttribute('title', I18N[state.lang][k]);
  });
  if ($('mList') && $('mList').setAttribute) $('mList').setAttribute('title', tr('mListBtn').replace(/^☰\s*/, ''));
  if ($('mCollapse') && $('mCollapse').setAttribute) $('mCollapse').setAttribute('title', tr('mCollapse'));
  const mInput = $('mInput');
  if (mInput && mInput.setAttribute) mInput.setAttribute('placeholder', tr('mInputPlaceholder'));
  const mHint = $('mHint');
  if (mHint && mHint.setAttribute) {
    mHint.setAttribute('title', tr('mHintTitle'));
    mHint.setAttribute('aria-label', tr('mHintTitle'));
  }

  const triesEl = $('tries');
  if (triesEl) {
    triesEl.innerHTML = '';
    triesEl.hidden = true;
    triesEl.style.display = 'none';
  }
  if (typeof applyLearningPanelsPlaceholder === 'function') applyLearningPanelsPlaceholder();
  try { localStorage.setItem('stemlab-lang', state.lang); } catch (e) {}
  state.dirty = true;
  renderPresets();
  renderSummary();
  renderRecordTable();
  if (typeof renderBanner === 'function') renderBanner();
}

/* ===== Rekod Titik Ujian ===== */
function recordPoint() {
  const p = state.point;
  const ineq = activeLines().map(ineqStr).join(' ; ');
  const ok = satisfiesAll(p.x, p.y);
  const sig = `${n2(p.x)}|${n2(p.y)}|${ineq}`;
  if (state.rec.some(r => r.sig === sig)) {
    showToast(tr('toastDup'));
    return false;
  }
  state.rec.push({sig, x: p.x, y: p.y, ineq, ok});
  renderRecordTable();
  showToast(tr('toastRec'));
  return true;
}

function clearRecords() {
  state.rec = [];
  renderRecordTable();
}

function renderRecordTable() {
  const tbody = $('tRows');
  const badge = $('tab-record-count');
  if (badge) {
    badge.textContent = String(state.rec.length);
    badge.hidden = state.rec.length === 0;
  }
  if (!tbody) return;
  if (!state.rec.length) {
    tbody.innerHTML = `<tr class="empty"><td colspan="4">${tr('logEmpty')}</td></tr>`;
    return;
  }
  tbody.innerHTML = state.rec.map((r, i) => `<tr><td>${i + 1}</td><td>(${n2(r.x)}, ${n2(r.y)})</td><td>${r.ineq}</td><td class="${r.ok ? 'ineq-status-ok' : 'ineq-status-no'}">${r.ok ? '✓' : '✗'}</td></tr>`).join('');
}

/* ===== Paparan ===== */
function updateReadouts() {
  const lines = activeLines();
  const isSys = state.mode === 'system';
  const cur = activeLine();

  const fIneq = $('f-ineq');
  if (fIneq) fIneq.textContent = lines.map(ineqStr).join(' ; ');

  const fBoundary = $('f-boundary');
  const fRegion = $('f-region');
  const fExtraLabel = $('f-extra-label');
  const fExtra = $('f-extra');

  if (!isSys) {
    const bTitle = tr(isSolid(cur.op) ? 'solidTitle' : 'dashedTitle');
    const bSub = tr(isSolid(cur.op) ? 'solidSub' : 'dashedSub');
    const rText = tr(isAbove(cur.op) ? 'above' : 'below');
    if (fBoundary) fBoundary.innerHTML = `${bTitle}<small>${bSub}</small>`;
    if (fRegion) fRegion.textContent = rText;
    if (fExtraLabel) fExtraLabel.textContent = tr('f_intercepts');
    if (fExtra) {
      if (hid('extra')) {
        fExtra.textContent = '?';
      } else {
        const xi = xIntercept(cur);
        const yText = `(0, ${n2(cur.c)})`;
        const xText = xi === null ? tr('noXInt') : `(${n2(xi)}, 0)`;
        fExtra.innerHTML = `x: ${xText}<br>y: ${yText}`;
      }
    }
  } else {
    const b1 = tr(isSolid(lines[0].op) ? 'solidShort' : 'dashedShort');
    const b2 = tr(isSolid(lines[1].op) ? 'solidShort' : 'dashedShort');
    if (fBoundary) fBoundary.innerHTML = `1: ${b1}<br>2: ${b2}`;
    const common = regionPolygon(lines);
    const hasCommon = common.length >= 3 && polygonArea(common) > 1e-4;
    const rText = tr(hasCommon ? 'commonRegion' : 'noCommonRegion');
    if (fRegion) fRegion.textContent = rText;
    if (fExtraLabel) fExtraLabel.textContent = tr('f_intersection');
    if (fExtra) {
      if (hid('extra')) {
        fExtra.textContent = '?';
      } else {
        const inter = intersectionOf(lines[0], lines[1]);
        fExtra.textContent = inter === 'coincident'
          ? tr('coincident')
          : inter === null
            ? tr('parallel')
            : `(${n2(inter.x)}, ${n2(inter.y)})`;
      }
    }
  }

  const p = state.point;
  const ok = satisfiesAll(p.x, p.y);
  let statusText = tr(ok ? 'satisfied' : 'notSatisfied');
  const onB = lines.some(l => onBoundary(p.x, p.y, l));
  if (!isSys && onBoundary(p.x, p.y, cur)) {
    statusText = tr(isSolid(cur.op) ? 'onBoundarySolid' : 'onBoundaryDashed');
  }
  const sub = !isSys ? ` (${n2(p.y)} ${OP_SYM[cur.op]} ${n2(yAt(p.x, cur))})` : '';
  const fPoint = $('f-point');
  if (fPoint) {
    fPoint.innerHTML = `(${n2(p.x)}, ${n2(p.y)})<small class="${ok ? 'ineq-status-ok' : 'ineq-status-no'}">${ok ? '✓' : '✕'} ${statusText}${sub}</small>`;
  }

  const tagsEl = $('ciriTags');
  if (tagsEl) {
    const tags = [
      {cls: ok ? 'ok' : 'bad', text: `${ok ? '✓' : '✕'} ${tr(ok ? 'tagInRegion' : 'tagOutRegion')}`},
      {cls: isSolid(cur.op) ? 'warn' : 'virt', text: tr(isSolid(cur.op) ? 'solidShort' : 'dashedShort')}
    ];
    if (onB) tags.push({cls: isSolid(cur.op) ? 'ok' : 'bad', text: tr('tagBoundaryOn')});
    tagsEl.innerHTML = tags.map(t => `<span class="iq-tag ${t.cls}">${t.text}</span>`).join('');
  }

  const formulaBox = $('formulaBox');
  if (formulaBox) {
    formulaBox.innerHTML = lines.map((l, idx) => {
      const prefix = isSys ? `<b>${idx + 1}:</b> ` : '';
      return `<div>${prefix}${ineqStr(l)} → ${subStepStr(p.x, p.y, l)}</div>`;
    }).join('');
  }

  const coords = $('ineq-coordinates');
  if (coords) {
    coords.innerHTML = COORDINATE_X
      .map(x => `<tr><th scope="row">${n2(x)}</th><td>${n2(yAt(x, cur))}</td></tr>`).join('');
  }

  const captionEl = $('table-caption');
  if (captionEl) {
    captionEl.textContent = isSys
      ? `${tr(state.active === 0 ? 'line1' : 'line2')} (${ineqStr(cur)})`
      : tr('coordinateCaption');
  }

  const noteEl = $('note');
  if (noteEl) {
    if (!isSys) {
      noteEl.textContent = tr(isSolid(cur.op) ? 'noteSolid' : 'noteDashed') + ' ' + tr(isAbove(cur.op) ? 'noteAbove' : 'noteBelow');
    } else {
      const common = regionPolygon(lines);
      const hasCommon = common.length >= 3 && polygonArea(common) > 1e-4;
      noteEl.textContent = tr(hasCommon ? 'noteSystem' : 'noteSystemEmpty');
    }
  }
}

const DPR = () => (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
function fitCanvas(immediate = true) {
  const c = $('plot');
  if (!c) return;
  const wrap = $('stageWrap');
  const rect = wrap && wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : c.getBoundingClientRect();
  const w = Math.max(rect.width || 400, 220);
  const h = Math.max(rect.height || w, 220);
  const dpr = DPR();
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (c.width === pw && c.height === ph && c._w === w && c._h === h && c._dpr === dpr) return;
  c.width = pw;
  c.height = ph;
  c._w = w;
  c._h = h;
  c._dpr = dpr;
  if (immediate) {
    state.dirty = false;
    render();
  } else {
    state.dirty = true;
  }
}

function text(ctx, s, x, y, o = {}) {
  ctx.font = `${o.w || 600} ${o.size || 12}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = o.color || '#252137';
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  ctx.fillText(s, x, y);
}

function geom() {
  const c = $('plot');
  const W = (c && c._w) || 400;
  const H = (c && c._h) || W;
  const unit = Math.max(8, Math.min(W, H) / (2 * LIM.view + 1.4));
  const cx = W / 2;
  const cy = H / 2;
  const vx = cx / unit;
  const vy = cy / unit;
  return {
    W, H, unit, cx, cy, vx, vy,
    X: x => cx + x * unit,
    Y: y => cy - y * unit
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
  const c = $('plot');
  if (!c) return;
  const ctx = c.getContext('2d');
  const {W, H, vx, vy, X, Y} = geom();
  const gxMin = Math.floor(-vx), gxMax = Math.ceil(vx);
  const gyMin = Math.floor(-vy), gyMax = Math.ceil(vy);
  const rx = vx + 0.5, ry = vy + 0.5;
  ctx.setTransform(c._dpr || 1, 0, 0, c._dpr || 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // Full-bleed Cartesian grid
  for (let i = gxMin; i <= gxMax; i++) {
    ctx.strokeStyle = i % 5 === 0 ? '#d8c3ad' : '#ede8f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X(i), 0); ctx.lineTo(X(i), H);
    ctx.stroke();
  }
  for (let i = gyMin; i <= gyMax; i++) {
    ctx.strokeStyle = i % 5 === 0 ? '#d8c3ad' : '#ede8f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, Y(i)); ctx.lineTo(W, Y(i));
    ctx.stroke();
  }

  const lines = activeLines();
  const isSys = state.mode === 'system';
  const lineColors = ['#b45309', '#634395'];
  const shadeColors = ['rgba(180,83,9,0.16)', 'rgba(99,67,149,0.16)'];

  // Clip full canvas area for shaded regions and boundary lines
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();

  if (state.show.shade) {
    lines.forEach((line, idx) => {
      const poly = regionPolygon([line], rx, ry);
      if (poly.length < 3) return;
      tracePoly(ctx, poly, X, Y);
      ctx.fillStyle = shadeColors[idx];
      ctx.fill();
    });

    if (isSys) {
      const common = regionPolygon(lines, rx, ry);
      if (common.length >= 3 && polygonArea(common) > 1e-4) {
        ctx.save();
        tracePoly(ctx, common, X, Y);
        ctx.fillStyle = 'rgba(4,120,87,0.22)';
        ctx.fill();
        ctx.clip();
        ctx.strokeStyle = 'rgba(4,120,87,0.34)';
        ctx.lineWidth = 1.5;
        for (let d = -H; d < W + H; d += 14) {
          ctx.beginPath();
          ctx.moveTo(d, 0);
          ctx.lineTo(d - H, H);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  // Axes edge-to-edge
  ctx.strokeStyle = '#252137';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0));
  ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H);
  ctx.stroke();

  // Boundary lines edge-to-edge
  lines.forEach((line, idx) => {
    ctx.save();
    ctx.strokeStyle = lineColors[idx];
    ctx.lineWidth = 3.2;
    if (!isSolid(line.op)) ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(X(-rx), Y(yAt(-rx, line)));
    ctx.lineTo(X(rx), Y(yAt(rx, line)));
    ctx.stroke();
    ctx.restore();
  });

  // Region label
  if (state.show.labels && state.show.shade) {
    const targetPoly = regionPolygon(lines, rx, ry);
    if (targetPoly.length >= 3 && polygonArea(targetPoly) > 2) {
      const cen = polygonCentroid(targetPoly);
      const cx = clamp(X(cen.x), 38, W - 38);
      const cy = clamp(Y(cen.y), 26, H - 26);
      const label = isSys ? 'R' : ineqStr(lines[0]);
      tag(ctx, label, cx, cy, isSys ? '#047857' : '#855300', 'center');
    }
  }
  ctx.restore();

  // Axis ticks & labels
  for (let i = Math.ceil(gxMin / 2) * 2; i <= Math.floor(gxMax / 2) * 2; i += 2) {
    if (!i) continue;
    const tx = X(i);
    if (tx > 18 && tx < W - 18) {
      text(ctx, n2(i), tx, Y(0) + 15, {align: 'center', size: 10, color: '#5c5670'});
    }
  }
  for (let i = Math.ceil(gyMin / 2) * 2; i <= Math.floor(gyMax / 2) * 2; i += 2) {
    if (!i) continue;
    const ty = Y(i);
    if (ty > 16 && ty < H - 14) {
      text(ctx, n2(i), X(0) - 6, ty + 4, {align: 'right', size: 10, color: '#5c5670'});
    }
  }
  text(ctx, 'x', W - 10, Y(0) - 8, {align: 'right', w: 800});
  text(ctx, 'y', X(0) + 10, 16, {w: 800});

  // Intercepts or intersection (hidden during numeric mystery missions)
  if (state.show.intercepts && !hid('extra')) {
    if (!isSys) {
      const l = lines[0];
      if (Math.abs(l.c) <= vy) {
        dot(ctx, X(0), Y(l.c), '#047857', 5.5);
        tag(ctx, `(0, ${n2(l.c)})`, X(0) + 10, Y(l.c) - 8, '#047857');
      }
      const xi = xIntercept(l);
      if (xi !== null && Math.abs(xi) <= vx && Math.abs(xi) > EPS) {
        dot(ctx, X(xi), Y(0), '#b45309', 5.5);
        tag(ctx, `(${n2(xi)}, 0)`, X(xi), Y(0) + 28, '#b45309', 'center');
      }
    } else {
      const inter = intersectionOf(lines[0], lines[1]);
      if (inter && inter !== 'coincident' && Math.abs(inter.x) <= vx && Math.abs(inter.y) <= vy) {
        dot(ctx, X(inter.x), Y(inter.y), '#362951', 6.5);
        tag(ctx, `(${n2(inter.x)}, ${n2(inter.y)})`, X(inter.x) + 10, Y(inter.y) - 10, '#362951');
      }
    }
  }

  // Hover coordinate preview
  if (state.show.coords && state.hoverCoord && !state.dragging) {
    const h = state.hoverCoord;
    const hx = X(h.x), hy = Y(h.y);
    ctx.save();
    ctx.strokeStyle = 'rgba(37,33,55,0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(hx, hy); ctx.lineTo(hx, Y(0));
    ctx.moveTo(hx, hy); ctx.lineTo(X(0), hy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#252137';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, hy, 4.5, 0, 6.2832);
    ctx.fill();
    ctx.stroke();

    const lbl = `(${n2(h.x)}, ${n2(h.y)})`;
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    const tw = ctx.measureText(lbl).width + 14;
    const th = 22;
    const bx = clamp(hx + (hx > W - tw - 18 ? -tw - 10 : 10), 8, W - tw - 8);
    const by = clamp(hy + (hy < th + 14 ? 10 : -th - 8), 8, H - th - 8);
    ctx.fillStyle = 'rgba(37,33,55,0.92)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(bx, by, tw, th, 6);
    else ctx.rect(bx, by, tw, th);
    ctx.fill();
    text(ctx, lbl, bx + tw / 2, by + 15, {color: '#fbbf24', w: 700, size: 11, align: 'center'});
    ctx.restore();
  }

  // Test point P with subtle coordinate guide lines when dragging
  if (state.show.point) {
    const p = state.point;
    const ok = satisfiesAll(p.x, p.y);
    const col = ok ? '#047857' : '#ba1a1a';
    const px = X(p.x), py = Y(p.y);
    if (state.dragging) {
      ctx.save();
      ctx.strokeStyle = ok ? 'rgba(4,120,87,0.35)' : 'rgba(186,26,26,0.35)';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, py); ctx.lineTo(px, Y(0));
      ctx.moveTo(px, py); ctx.lineTo(X(0), py);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, 6.2832);
      ctx.fillStyle = ok ? 'rgba(4,120,87,0.14)' : 'rgba(186,26,26,0.14)';
      ctx.fill();
      ctx.restore();
    }
    dot(ctx, px, py, col, 8);
    const align = p.x > 5 ? 'right' : 'left';
    const dx = align === 'right' ? -12 : 12;
    const dy = p.y > 7 ? 20 : -10;
    tag(ctx, `P(${n2(p.x)}, ${n2(p.y)}) ${ok ? '✓' : '✗'}`, px + dx, py + dy, col, align);
  }
}

/* ===== Enjin Misi Cabaran ===== */
const PROG_KEY = 'stemlab-ineq-prog';
function loadProg() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROG_KEY) || '{}');
    return {xp: Number(raw.xp) || 0, stars: raw.stars || {}};
  } catch (e) {
    return {xp: 0, stars: {}};
  }
}
const prog = loadProg();
function saveProg() {
  try { localStorage.setItem(PROG_KEY, JSON.stringify(prog)); } catch (e) {}
}

const api = {
  setMode,
  setActive,
  setLine,
  movePoint,
  getLine: i => state.lines[i],
  getPoint: () => state.point
};
let MIS = [];
try { MIS = createMissions(api); } catch (e) {}

const starsHtml = n => Array.from({length: 3}, (_, i) => `<i class="${i < n ? 'on' : ''}">★</i>`).join('');

function rankInfo() {
  const list = RANKS[state.lang] || RANKS.ms;
  let r = 0;
  list.forEach((q, i) => { if (prog.xp >= q[0]) r = i; });
  const lo = list[r][0], hi = list[r + 1] ? list[r + 1][0] : null;
  return {name: list[r][1], hi, pct: hi ? ((prog.xp - lo) / (hi - lo)) * 100 : 100};
}

function missionFb(msg, kind) {
  const fb = $('mFb');
  if (!fb) return;
  fb.innerHTML = msg || '';
  fb.className = 'mfb' + (kind ? ' ' + kind : '');
}

function clampBubblePos() {
  const bar = $('missionBar');
  if (!bar || bar.hidden || !bar.classList.contains('is-moved')) return;
  const r = bar.getBoundingClientRect();
  const vw = window.innerWidth || 1200, vh = window.innerHeight || 800;
  const left = clamp(r.left, 10, Math.max(10, vw - r.width - 10));
  const top = clamp(r.top, 10, Math.max(10, vh - r.height - 10));
  bar.style.left = left + 'px';
  bar.style.top = top + 'px';
  bar.style.right = 'auto';
  bar.style.bottom = 'auto';
}

function setBubbleCollapsed(collapsed) {
  state.bubbleCollapsed = !!collapsed;
  const card = $('mCard'), pill = $('mPill');
  if (card) card.hidden = state.bubbleCollapsed;
  if (pill) pill.hidden = !state.bubbleCollapsed;
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(clampBubblePos);
  }
}

function setupBubbleDrag() {
  const bar = $('missionBar'), handle = $('mDragHandle'), pill = $('mPill');
  if (!bar) return;
  const attach = (el, onClickOnly) => {
    if (!el) return;
    let startX = 0, startY = 0, origL = 0, origT = 0, active = false, moved = false;
    el.addEventListener('pointerdown', e => {
      if (e.target && e.target.closest && e.target.closest('button') && el !== pill) return;
      const r = bar.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      origL = r.left;
      origT = r.top;
      active = true;
      moved = false;
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    });
    el.addEventListener('pointermove', e => {
      if (!active) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 6) {
        moved = true;
        bar.classList.add('is-moved');
        el.classList.add('dragging');
      }
      if (!moved) return;
      const r = bar.getBoundingClientRect();
      const vw = window.innerWidth || 1200, vh = window.innerHeight || 800;
      const left = clamp(origL + dx, 10, Math.max(10, vw - r.width - 10));
      const top = clamp(origT + dy, 10, Math.max(10, vh - r.height - 10));
      bar.style.left = left + 'px';
      bar.style.top = top + 'px';
      bar.style.right = 'auto';
      bar.style.bottom = 'auto';
    });
    const finish = () => {
      if (!active) return;
      active = false;
      el.classList.remove('dragging');
      if (!moved && onClickOnly) onClickOnly();
    };
    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', finish);
  };
  attach(handle, null);
  attach(pill, () => setBubbleCollapsed(false));
}

function renderBanner() {
  const chalBadge = $('chalBadge');
  if (chalBadge) {
    const earned = Object.values(prog.stars || {}).reduce((s, v) => s + (Number(v) || 0), 0);
    chalBadge.textContent = earned > 0 ? `★ ${earned}/${MIS.length * 3}` : tr('chalBadge');
  }
  const bar = $('missionBar');
  if (!bar) return;
  const q = state.mission;
  bar.hidden = state.simMode !== 'chal' || !q;
  if (bar.hidden) return;

  const m = MIS[q.i];
  const title = state.lang === 'en' ? m.tEn : m.t;
  const sub = state.lang === 'en' ? m.sEn : m.s;
  if ($('mNum')) $('mNum').textContent = String(q.i + 1);
  if ($('mTitle')) $('mTitle').textContent = title;
  if ($('mStars')) $('mStars').innerHTML = starsHtml(prog.stars[q.i] || 0);
  if ($('mText')) $('mText').innerHTML = q.d.text();
  if ($('mAns')) $('mAns').hidden = q.d.kind !== 'num';
  if ($('mProg')) $('mProg').hidden = q.d.kind !== 'state';
  if ($('mUnit')) $('mUnit').textContent = q.d.unit || '';
  if (q.d.kind === 'state' && $('mProgBar')) {
    $('mProgBar').style.width = clamp(q.hold / 1.0 * 100, 0, 100) + '%';
  }
  if ($('mPillNum')) $('mPillNum').textContent = String(q.i + 1);
  if ($('mPillTitle')) $('mPillTitle').textContent = title;
  if ($('mPillSub')) $('mPillSub').textContent = sub;
  if ($('mPillProg')) $('mPillProg').hidden = q.d.kind !== 'state';
  if (q.d.kind === 'state' && $('mPillProgBar')) {
    $('mPillProgBar').style.width = clamp(q.hold / 1.0 * 100, 0, 100) + '%';
  }
  if ($('mCard')) $('mCard').hidden = state.bubbleCollapsed;
  if ($('mPill')) $('mPill').hidden = !state.bubbleCollapsed;
}

function setSimMode(m) {
  state.simMode = m === 'chal' ? 'chal' : 'lab';
  $$('#modeTabs button').forEach(b => {
    const on = b.dataset.m === state.simMode;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  if (state.simMode === 'lab') {
    state.mission = null;
    state.locks = {};
    state.hide = {};
    syncControls();
    updateReadouts();
    state.dirty = true;
  } else {
    openList();
  }
  renderBanner();
}

function startMission(i) {
  const m = MIS[i];
  if (!m) return;
  const d = m.gen();
  state.simMode = 'chal';
  $$('#modeTabs button').forEach(b => {
    const on = b.dataset.m === 'chal';
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  state.locks = {};
  state.hide = {};
  d.setup();
  state.locks = d.lock || {};
  state.hide = d.hide || {};
  state.mission = {i, d, tries: 0, hint: false, ok: false, hold: 0};
  closeSheets();
  setBubbleCollapsed(false);
  const inp = $('mInput');
  if (inp) inp.value = '';
  missionFb('');
  syncControls();
  updateReadouts();
  renderBanner();
  state.dirty = true;
}

function submitAnswer() {
  const q = state.mission;
  if (!q || q.ok || q.d.kind !== 'num') return;
  const inp = $('mInput');
  const val = parseNum(inp ? inp.value : '');
  if (!Number.isFinite(val)) {
    if (inp) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); }
    return missionFb(tr('errNum'), 'err');
  }
  const ans = q.d.ans();
  if (Math.abs(val - ans) <= q.d.tol(ans)) {
    winMission();
  } else {
    q.tries++;
    if (inp) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); }
    missionFb(
      tr('errTryAgain').replace('{n}', q.tries) + (q.tries >= 2 && !q.hint ? tr('errHintTip') : ''),
      'err'
    );
  }
}

function confetti() {
  const cv = $('ghost');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const dpr = DPR();
  const W = window.innerWidth || 800, H = window.innerHeight || 600;
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = ['#f59e0b', '#047857', '#634395', '#b45309', '#38bdf8'];
  const pts = Array.from({length: 55}, () => ({
    x: W * (0.2 + Math.random() * 0.6), y: H * 0.35,
    vx: (Math.random() - 0.5) * 8, vy: -4 - Math.random() * 7,
    r: 4 + Math.random() * 4, col: pick(cols), a: 1
  }));
  let t = 0;
  (function step() {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.a -= 0.015;
      if (p.a > 0) {
        alive = true;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.col;
        ctx.fillRect(p.x, p.y, p.r, p.r * 1.4);
      }
    });
    ctx.globalAlpha = 1;
    if (alive && t++ < 90) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, W, H);
  })();
}

function winMission() {
  const q = state.mission;
  if (!q || q.ok) return;
  q.ok = true;
  let stars = q.tries === 0 ? 3 : q.tries === 1 ? 2 : 1;
  if (q.hint) stars = Math.max(1, stars - 1);
  const prev = prog.stars[q.i] || 0, gain = Math.max(0, stars - prev) * 100;
  if (stars > prev) prog.stars[q.i] = stars;
  prog.xp += gain;
  saveProg();
  confetti();
  if ($('winStars')) $('winStars').innerHTML = starsHtml(stars);
  if ($('winTitle')) $('winTitle').textContent = stars === 3 ? tr('winPerfect') : tr('winGood');
  if ($('winXp')) $('winXp').textContent = gain ? `+${gain} XP` : tr('winRepeat');
  if ($('winExpl')) $('winExpl').innerHTML = `<b>${tr('winSolution')}</b><br>${q.d.expl()}`;
  if ($('winNext')) $('winNext').style.display = q.i < MIS.length - 1 ? '' : 'none';
  if ($('winSheet')) $('winSheet').classList.add('show');
  renderBanner();
}

function openList() {
  const g = $('mGrid');
  if (g) {
    g.innerHTML = '';
    MIS.forEach((m, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mcard';
      const title = state.lang === 'en' ? m.tEn : m.t;
      const sub = state.lang === 'en' ? m.sEn : m.s;
      b.innerHTML = `<em>${m.ic}</em><span><b>${i + 1}. ${title}</b><small>${sub}</small><div class="stars" style="font-size:13px">${starsHtml(prog.stars[i] || 0)}</div></span>`;
      b.addEventListener('click', () => startMission(i));
      g.appendChild(b);
    });
  }
  const r = rankInfo();
  if ($('rankName')) $('rankName').textContent = r.name;
  if ($('rankXp')) $('rankXp').textContent = `${prog.xp} XP · ` + (r.hi ? `${r.hi - prog.xp} ${tr('rankNext')}` : tr('rankMax'));
  if ($('xpFill')) $('xpFill').style.width = r.pct + '%';
  if ($('listSheet')) $('listSheet').classList.add('show');
}

function closeSheets() {
  if ($('listSheet')) $('listSheet').classList.remove('show');
  if ($('winSheet')) $('winSheet').classList.remove('show');
  if (state.simMode === 'chal' && !state.mission) {
    setSimMode('lab');
  }
}

function missionTick(dt) {
  const q = state.mission;
  if (!q || q.ok || q.d.kind !== 'state') return;
  let ok = false;
  try { ok = q.d.check(); } catch (e) {}
  q.hold = ok ? q.hold + dt : Math.max(0, q.hold - dt * 2);
  const pct = clamp(q.hold / 1.0 * 100, 0, 100) + '%';
  const bar = $('mProgBar');
  if (bar) bar.style.width = pct;
  const pbar = $('mPillProgBar');
  if (pbar) pbar.style.width = pct;
  if (q.hold >= 1.0) winMission();
}

let lastFrame = typeof performance !== 'undefined' ? performance.now() : 0;
function frame(now) {
  const curNow = typeof now === 'number' ? now : lastFrame;
  const dt = Math.min(0.05, Math.max(0, (curNow - lastFrame) / 1000));
  lastFrame = curNow;
  if (state.dirty) { state.dirty = false; render(); }
  missionTick(dt);
  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', () => {
  if ($('mode-single')) $('mode-single').addEventListener('click', () => setMode('single'));
  if ($('mode-system')) $('mode-system').addEventListener('click', () => setMode('system'));
  if ($('pick-0')) $('pick-0').addEventListener('click', () => setActive(0));
  if ($('pick-1')) $('pick-1').addEventListener('click', () => setActive(1));

  for (const [id, op] of [['op-gt', '>'], ['op-gte', '>='], ['op-lt', '<'], ['op-lte', '<=']]) {
    const btn = $(id);
    if (btn) btn.addEventListener('click', () => setOp(op));
  }

  for (const key of ['m', 'c']) {
    const slider = $('slider-' + key);
    if (slider) slider.addEventListener('input', () => setParam(key, Number(slider.value)));
    const dec = $('decrease-' + key);
    if (dec) dec.addEventListener('click', () => setParam(key, activeLine()[key] - Number(slider ? slider.step : 0.5)));
    const inc = $('increase-' + key);
    if (inc) inc.addEventListener('click', () => setParam(key, activeLine()[key] + Number(slider ? slider.step : 0.5)));
  }

  if ($('btn-test-origin')) $('btn-test-origin').addEventListener('click', () => {
    state.show.point = true;
    movePoint(0, 0);
    hideHint();
    showToast(tr('toastOrigin'));
    syncControls();
  });
  if ($('recBtn')) $('recBtn').addEventListener('click', recordPoint);
  if ($('recBtn2')) $('recBtn2').addEventListener('click', recordPoint);
  if ($('clearRec')) $('clearRec').addEventListener('click', clearRecords);

  if ($('btn-reset')) $('btn-reset').addEventListener('click', () => {
    resetAll();
    showToast(tr('toastReset'));
  });

  setupTabGroup(['ineq-tab-table', 'tab-log'], ['ineq-pane-table', 'pane-log']);
  setupTabGroup(['ineq-tab-controls', 'tab-view'], ['ineq-pane-controls', 'pane-view']);

  if ($('jumpTableBtn')) $('jumpTableBtn').addEventListener('click', () => {
    const card = $('analysisCard');
    if (card && card.scrollIntoView) card.scrollIntoView({behavior: 'smooth', block: 'start'});
  });

  if (typeof setupLessonVideos === 'function') setupLessonVideos({id: 'ketaksamaan-linear', videos: []});
  const btnLang = $('btn-lang');
  if (btnLang) btnLang.addEventListener('click', () => setLang(state.lang === 'ms' ? 'en' : 'ms'));

  document.querySelectorAll('[data-show]').forEach(input => input.addEventListener('change', () => {
    state.show[input.dataset.show] = input.checked;
    if (input.dataset.show === 'coords' && !input.checked) state.hoverCoord = null;
    state.dirty = true;
  }));

  // Drag test point P (or click anywhere to move P)
  const pl = $('plot');
  if (pl) {
    const toMath = e => {
      const b = pl.getBoundingClientRect(), {W, H, unit, cx, cy} = geom();
      const px = (e.clientX - b.left) * (W / (b.width || W));
      const py = (e.clientY - b.top) * (H / (b.height || H));
      return {
        x: (px - cx) / unit,
        y: (cy - py) / unit
      };
    };
    pl.addEventListener('pointerdown', e => {
      if (!state.show.point) return;
      const p = toMath(e);
      movePoint(p.x, p.y);
      state.dragging = true;
      state.hoverCoord = null;
      hideHint();
      pl.classList.add('dragging');
      try { pl.setPointerCapture(e.pointerId); } catch (err) {}
    });
    pl.addEventListener('pointermove', e => {
      const p = toMath(e);
      if (state.dragging) {
        movePoint(p.x, p.y);
        return;
      }
      if (!state.show.coords) {
        if (state.hoverCoord) { state.hoverCoord = null; state.dirty = true; }
        return;
      }
      const sx = r9(clamp(Math.round(p.x * 2) / 2, -LIM.view, LIM.view));
      const sy = r9(clamp(Math.round(p.y * 2) / 2, -LIM.view, LIM.view));
      if (!state.hoverCoord || state.hoverCoord.x !== sx || state.hoverCoord.y !== sy) {
        state.hoverCoord = {x: sx, y: sy};
        state.dirty = true;
      }
    });
    pl.addEventListener('pointerleave', () => {
      if (state.hoverCoord !== null) {
        state.hoverCoord = null;
        state.dirty = true;
      }
    });
    const end = () => {
      if (state.dragging) { state.dragging = false; state.dirty = true; }
      pl.classList.remove('dragging');
    };
    pl.addEventListener('pointerup', end);
    pl.addEventListener('pointercancel', end);
    pl.addEventListener('keydown', e => {
      if (!state.show.point) return;
      const d = {ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, 0.5], ArrowDown: [0, -0.5]}[e.key];
      if (d) { e.preventDefault(); hideHint(); movePoint(state.point.x + d[0], state.point.y + d[1]); }
    });
  }

  // Cabaran bindings
  $$('#modeTabs button').forEach(b => b.addEventListener('click', () => setSimMode(b.dataset.m)));
  if ($('mList')) $('mList').addEventListener('click', openList);
  if ($('mCollapse')) $('mCollapse').addEventListener('click', () => setBubbleCollapsed(true));
  setupBubbleDrag();
  if ($('listClose')) $('listClose').addEventListener('click', closeSheets);
  if ($('winList')) $('winList').addEventListener('click', () => { closeSheets(); openList(); });
  if ($('winRetry')) $('winRetry').addEventListener('click', () => state.mission && startMission(state.mission.i));
  if ($('winNext')) $('winNext').addEventListener('click', () => state.mission && startMission(Math.min(MIS.length - 1, state.mission.i + 1)));
  if ($('mCheck')) $('mCheck').addEventListener('click', submitAnswer);
  if ($('mInput')) $('mInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); });
  if ($('mHint')) $('mHint').addEventListener('click', () => {
    const q = state.mission;
    if (!q) return;
    q.hint = true;
    missionFb('💡 ' + q.d.hint(), 'info');
  });
  $$('.sheet').forEach(s => s.addEventListener('click', e => { if (e.target === s) closeSheets(); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheets(); });

  window.addEventListener('resize', () => { fitCanvas(true); clampBubblePos(); });
  if (typeof ResizeObserver === 'function' && $('stageWrap')) {
    const sizes = new WeakMap();
    let resizeRaf = 0;
    const observer = new ResizeObserver(entries => {
      let changed = false;
      for (const {target, contentRect} of entries) {
        const key = `${Math.round(contentRect.width)}x${Math.round(contentRect.height)}`;
        if (sizes.get(target) === key) continue;
        sizes.set(target, key);
        changed = true;
      }
      if (changed && !resizeRaf) {
        resizeRaf = requestAnimationFrame(() => {
          resizeRaf = 0;
          fitCanvas(true);
        });
      }
    });
    observer.observe($('stageWrap'));
  }

  let saved = null;
  try { saved = localStorage.getItem('stemlab-lang'); } catch (e) {}
  fitCanvas(false);
  setLang(saved === 'en' ? 'en' : 'ms');
  syncControls();
  renderRecordTable();
  requestAnimationFrame(frame);
});
