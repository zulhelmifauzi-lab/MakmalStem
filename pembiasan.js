(function () {
  'use strict';
  const MD = window.RefraksiModel;
  const { clamp, rad, deg, fx, sg, parseNum, niceMax, C, MKEYS, MEDIA, WAVES, nAt, speedOf, trace, critOverall, fitSlope, depthApp, RANKS, I18N, createMissions } = MD;
  const T = I18N.ms;
  const byId = id => document.getElementById(id);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const SUB = ['₁', '₂', '₃'];
  const PRESETS_I = [0, 15, 30, 45, 60, 75, 90];
  const PRESETS_A = [2, 10, 20, 30, 45];

  /* ================= STATE ================= */
  const S = {
    view: 'refr', count: 2, med: ['udara', 'perspek', 'crown'], layer: 1,
    iT: 30, iD: 30, wave: 1, dMed: 'perspek', d: 10, ang: 3,
    rec: [], drec: [], opt: { normal: true, prot: true, refl: true, pulse: true },
    mode: 'lab', mission: null, locks: {}, hide: {}, phase: 0, tir: false, drag: false, dirty: true
  };
  const lam = () => WAVES[S.wave].nm;
  const nOf = k => nAt(S.med[k], lam());
  const nsNow = () => { const a = []; for (let k = 0; k < S.count; k++) a.push(nOf(k)); return a; };
  const nDepth = () => nAt(S.dMed, lam());
  const curTrace = () => trace(nsNow(), S.iD);
  const recs = () => (S.view === 'refr' ? S.rec : S.drec);
  const lastTheta = tr => deg(tr.th[tr.th.length - 1]);
  const hid = k => !!S.hide[k];
  const lk = k => !!S.locks[k];
  const fv = n => fx(speedOf(n) / 1e8, 2);
  const medName = k => (hid('medname') && k === S.count - 1 && S.view === 'refr' ? 'Medium ?' : MEDIA[S.med[k]].ms);
  const tint = k => (hid('medname') && k === S.count - 1 ? '#ece6f5' : MEDIA[S.med[k]].tint);

  /* ================= API UNTUK MISI ================= */
  const settled = () => S.view === 'depth' || Math.abs(S.iD - S.iT) < 0.06;
  const api = {
    getView: () => S.view,
    setView: v => setView(v, true),
    getCount: () => S.count,
    setCount: c => setCount(c, true),
    getMed: k => S.med[k],
    setMed: (k, key) => { S.med[k] = key; S.rec = []; S.dirty = true; syncAll(); },
    setDepthMed: key => { S.dMed = key; S.drec = []; S.dirty = true; syncAll(); },
    getI: () => S.iT,
    setI: (v, force) => setI(v, force),
    getDepth: () => S.d,
    setDepth: (v, force) => setDepth(v, force),
    getAng: () => S.ang,
    setAng: (v, force) => setAng(v, force),
    setWave: i => setWave(i, true),
    getRec: () => recs(),
    settled,
    isTir: () => curTrace().tirAt > 0,
    getTheta: k => { const t = curTrace().th[k]; return t === undefined ? NaN : deg(t); }
  };
  let MIS = [];
  try { MIS = createMissions(api); } catch (e) { console.error(e); }

  /* ================= SETTERS ================= */
  function setI(v, force) {
    if (lk('i') && !force) return;
    S.iT = clamp(Math.round(v), 0, 90);
    if (force) S.iD = S.iT;
    S.dirty = true; syncSliders(); hideHint();
  }
  function setAng(v, force) {
    if (lk('ang') && !force) return;
    S.ang = clamp(Math.round(v), 2, 60);
    S.dirty = true; syncSliders(); hideHint();
  }
  function setDepth(v, force) {
    if (lk('depth') && !force) return;
    S.d = clamp(Math.round(v), 4, 20);
    S.dirty = true; syncSliders(); hideHint();
  }
  function setWave(i, force) {
    if (lk('wave') && !force) return;
    S.wave = i; S.rec = []; S.drec = []; S.dirty = true; syncAll();
  }
  function setCount(c, force) {
    if (lk('count') && !force) return;
    S.count = c; S.layer = Math.min(S.layer, c - 1); S.rec = []; S.dirty = true;
    if (c === 3 && !force) toast(T.toastCount3);
    syncAll();
  }
  function setView(v, force) {
    if (lk('view') && !force) return;
    S.view = v;
    if (v === 'depth' && S.dMed === 'udara') S.dMed = 'perspek';
    S.dirty = true; syncAll();
    byId('hint').textContent = v === 'refr' ? '⬆ Seret laser untuk menukar sudut tuju' : 'Gerakkan peluncur untuk menukar kedalaman dan sudut pandang';
    byId('hint').classList.remove('hide');
  }
  function hideHint() { byId('hint').classList.add('hide'); }

  /* ================= PAPARAN / UI ================= */
  let toastT = 0;
  function toast(html) {
    const t = byId('toast');
    t.innerHTML = html; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
  }

  function setDis(el, v) { if (el) el.disabled = !!v; }

  function syncSliders() {
    const sa = byId('slider-a'), sb = byId('slider-b');
    const dep = S.view === 'depth';
    byId('trayHead').hidden = !dep;
    byId('rowB').hidden = !dep;
    byId('trayTitle').textContent = dep ? 'Kedalaman dan sudut pandang' : 'Sudut tuju';
    byId('lblATxt').textContent = dep ? 'Sudut pandang, θ' : 'Sudut tuju, i';
    sa.min = dep ? 2 : 0; sa.max = dep ? 60 : 90;
    sa.value = dep ? S.ang : S.iT;
    byId('out-a').textContent = (dep ? S.ang : S.iT) + '°';
    sb.value = S.d; byId('out-b').textContent = S.d + ' cm';
    const setPct = el => {
      const mn = +el.min || 0, mx = +el.max || 100, val = +el.value;
      el.style.setProperty('--pct', ((val - mn) / Math.max(1e-9, mx - mn) * 100).toFixed(2) + '%');
    };
    setPct(sa);
    setPct(sb);
    setDis(sa, dep ? lk('ang') : lk('i'));
    setDis(sb, lk('depth'));
    const pre = byId('angPre');
    const list = dep ? PRESETS_A : PRESETS_I;
    if (pre.dataset.v !== S.view) {
      pre.dataset.v = S.view;
      pre.innerHTML = '';
      list.forEach(a => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'pb-pre'; b.dataset.a = a; b.textContent = a + '°';
        b.onclick = () => (S.view === 'depth' ? setAng(a) : setI(a));
        pre.appendChild(b);
      });
    }
    const curVal = dep ? S.ang : S.iT;
    $$('#angPre .pb-pre').forEach(b => {
      b.disabled = dep ? lk('ang') : lk('i');
      const on = +b.dataset.a === curVal;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
  }
  function nudge(d) { if (S.view === 'depth') setAng(S.ang + d); else setI(S.iT + d); }

  const WAVE_HINT = {
    merah: 'Pembiasan paling kecil',
    kuning: 'Rujukan garis D',
    hijau: 'Pembiasan sederhana',
    biru: 'Pembiasan lebih besar',
    ungu: 'Pembiasan paling besar'
  };

  function syncControls() {
    $$('#viewSeg button').forEach(b => { const on = b.dataset.v === S.view; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.disabled = lk('view'); });
    const dep = S.view === 'depth';
    byId('cntLbl').hidden = dep; byId('cntSeg').hidden = dep; byId('lyTabs').hidden = dep;
    byId('lySub').textContent = dep ? 'Medium dalam bekas' : 'Lapisan';
    $$('#cntSeg button').forEach(b => { const on = +b.dataset.c === S.count; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.disabled = lk('count'); });
    const tabs = byId('lyTabs'); tabs.innerHTML = '';
    for (let k = 0; k < S.count; k++) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = k === S.layer ? 'on' : '';
      b.innerHTML = `Medium ${k + 1}<i style="background:${tint(k)};border:1px solid rgba(37,33,55,.2)"></i>`;
      b.onclick = () => { S.layer = k; syncControls(); };
      tabs.appendChild(b);
    }
    const k = dep ? 0 : S.layer;
    byId('lyName').textContent = dep ? MEDIA[S.dMed].ms : (hid('medname') && k === S.count - 1 ? 'Medium ?' : `Medium ${k + 1}`);
    const cur = dep ? S.dMed : S.med[k];
    const mats = byId('mats'); mats.innerHTML = '';
    MKEYS.forEach(key => {
      const m = MEDIA[key];
      const b = document.createElement('button');
      b.type = 'button';
      const on = key === cur && !(hid('medname') && !dep && k === S.count - 1);
      b.className = on ? 'on' : '';
      const info = hid('mn') ? '' : `n = ${fx(nAt(key, lam()), 2)}`;
      b.innerHTML = `<b><i style="background:${m.dot}"></i>${m.ms}</b><small>${info}&nbsp;</small>`;
      b.disabled = lk('media') || (!dep && k === 0 && lk('med0')) || (dep && key === 'udara');
      b.onclick = () => {
        if (dep) { S.dMed = key; S.drec = []; } else { S.med[k] = key; S.rec = []; }
        S.dirty = true; syncAll();
      };
      mats.appendChild(b);
    });
    // warna
    const w = byId('waves'); w.innerHTML = '';
    WAVES.forEach((q, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = i === S.wave ? 'on' : '';
      const thz = Math.round(C / (q.nm * 1e-9) / 1e12);
      b.innerHTML = `<span class="wv-main"><i style="background:${q.col}"></i><span><b>${q.ms}</b><small>${WAVE_HINT[q.k] || ''}</small></span></span><span class="wv-meta"><strong>${q.nm} nm</strong><span>${thz} THz</span></span>`;
      b.setAttribute('aria-pressed', i === S.wave); b.disabled = lk('wave');
      b.onclick = () => setWave(i);
      w.appendChild(b);
    });
    const sd = byId('specDot');
    if (sd) {
      sd.style.left = clamp((lam() - 405) / (650 - 405) * 100, 0, 100) + '%';
      sd.style.borderColor = WAVES[S.wave].col;
    }
    byId('waveNote').textContent = `λ = ${lam()} nm. Cahaya ungu dibias lebih daripada cahaya merah kerana n lebih besar untuk panjang gelombang yang lebih pendek.`;
    setDis(byId('resetBtn'), false);
  }

  function syncAll() { syncControls(); syncSliders(); renderTable(); S.dirty = true; }

  /* ================= TELEMETRI ================= */
  function setTele(items) {
    byId('tele').innerHTML = items.map(([l, v, q]) => `<div><dt>${l}</dt><dd class="${q ? 'q' : ''}">${v}</dd></div>`).join('');
  }
  function readouts() {
    const dep = S.view === 'depth';
    if (dep) {
      const nd = nDepth(), app = depthApp(nd, S.d, S.ang);
      const ratio = S.d / app;
      byId('kBoxLabel').textContent = 'n = dalam nyata ÷ dalam ketara';
      byId('kVal').textContent = hid('n') ? '?' : fx(ratio, 2);
      byId('kUnit').textContent = hid('app') ? '' : `${fx(S.d, 1)} ÷ ${fx(app, 2)}`;
      byId('kBar').style.width = (hid('n') ? 0 : clamp((ratio - 1) / 1.5, 0, 1) * 100) + '%';
      byId('kMini').innerHTML = '<span>Tepat bila θ kecil</span>';
      const tm = Math.asin(Math.sin(rad(S.ang)) / nd);
      setTele([
        ['Dalam nyata, h', fx(S.d, 1) + ' cm'],
        ['Dalam ketara, h′', hid('app') ? '?' : fx(app, 2) + ' cm', hid('app')],
        ['Indeks bias, n', hid('n') ? '?' : fx(nd, 2), hid('n')],
        ['Kelajuan, v (10⁸ m s⁻¹)', hid('v') ? '?' : fv(nd), hid('v')],
        ['Sudut pandang, θ', S.ang + '°'],
        ['Sudut dalam medium', fx(deg(tm), 1) + '°'],
        ['Hampir menegak: h ÷ n', hid('n') ? '?' : fx(S.d / nd, 2) + ' cm', hid('n')],
        ['Medium', hid('medname') ? '?' : MEDIA[S.dMed].ms, hid('medname')]
      ]);
      byId('tabGraphTxt').textContent = 'Graf h–h′';
      return;
    }
    const ns = nsNow(), tr = curTrace(), N = S.count;
    const nrel = ns[N - 1] / ns[0];
    const last = tr.tirAt ? null : lastTheta(tr);
    byId('tabGraphTxt').textContent = 'Graf sin i–sin r';
    byId('kBoxLabel').textContent = N === 2 ? 'Indeks bias relatif, n' : 'Indeks bias relatif, n₃ ÷ n₁';
    byId('kVal').textContent = hid('rel') ? '?' : fx(nrel, 3);
    byId('kUnit').textContent = N === 2 ? 'n = sin i ÷ sin r = n₂ ÷ n₁' : 'n = sin i ÷ sin θ₃ = n₃ ÷ n₁';
    byId('kBar').style.width = (hid('rel') ? 0 : clamp(nrel / 2.42, 0.03, 1) * 100) + '%';
    byId('kMini').innerHTML = `<span>v = c ÷ n</span><span>c = 3.00 × 10⁸ m s⁻¹</span>`;
    const crit = critOverall(ns);
    const Q = (flag, val) => [hid(flag) ? '?' : val, hid(flag)];
    const items = [['Sudut tuju, i', fx(S.iD, 1) + '°']];
    if (N === 2) {
      const r = tr.tirAt ? 'Tiada' : fx(last, 1) + '°';
      items.push(['Sudut bias, r', hid('r') ? '?' : r, hid('r')]);
    } else {
      for (let j = 1; j < 3; j++) {
        const v = tr.th[j] === undefined ? 'Tiada' : fx(deg(tr.th[j]), 1) + '°';
        items.push([`Sudut bias, θ${SUB[j]}`, hid('r') && j === 2 ? '?' : v, hid('r') && j === 2]);
      }
    }
    for (let k = 0; k < N; k++) { const q = Q('n', fx(ns[k], 2)); items.push([`n${SUB[k]}`, q[0], q[1]]); }
    for (let k = 0; k < N; k++) { const q = Q('v', fv(ns[k])); items.push([`v${SUB[k]} (10⁸ m s⁻¹)`, q[0], q[1]]); }
    const qc = Q('crit', crit ? fx(crit, 1) + '°' : 'Tiada');
    items.push(['Sudut genting, c', qc[0], qc[1]]);
    items.push(['Panjang gelombang', lam() + ' nm']);
    setTele(items);
    if (tr.tirAt && !S.tir) toast(T.toastTir);
    S.tir = !!tr.tirAt;
  }

  /* ================= JADUAL & REKOD ================= */
  function recordNow() {
    if (S.view === 'refr') {
      const tr = curTrace();
      if (!settled()) return toast(T.toastWait);
      if (tr.tirAt) return toast(T.toastNoRefr);
      if (S.iT === 0) return toast('Pada 0°, sin i = 0. Pilih sudut yang lebih besar.');
      if (S.rec.some(q => Math.abs(q.i - S.iT) < 0.5)) return toast(T.toastDup);
      S.rec.push({ i: S.iT, r: lastTheta(tr) });
    } else {
      const app = depthApp(nDepth(), S.d, S.ang);
      if (S.drec.some(q => Math.abs(q.h - S.d) < 0.5 && q.a2 === S.ang)) return toast(T.toastDup);
      S.drec.push({ h: S.d, app, a2: S.ang });
    }
    toast(T.toastRec); renderTable(); S.dirty = true;
  }
  function rows() {
    return S.view === 'refr'
      ? S.rec.map(q => ({ x: Math.sin(rad(q.r)), y: Math.sin(rad(q.i)) }))
      : S.drec.map(q => ({ x: q.app, y: q.h }));
  }
  function renderTable() {
    const head = byId('tHead'), body = byId('tRows');
    const n = recs().length;
    const cnt = byId('tab-record-count'); cnt.hidden = !n; cnt.textContent = n;
    if (S.view === 'refr') {
      head.innerHTML = '<tr><th>#</th><th>i (°)</th><th>r (°)</th><th>sin i</th><th>sin r</th><th>sin i/sin r</th></tr>';
      body.innerHTML = n ? S.rec.map((q, k) => {
        const si = Math.sin(rad(q.i)), sr = Math.sin(rad(q.r));
        return `<tr><td>${k + 1}</td><td>${fx(q.i, 0)}</td><td>${fx(q.r, 1)}</td><td>${fx(si, 3)}</td><td>${fx(sr, 3)}</td><td>${fx(si / sr, 2)}</td></tr>`;
      }).join('') : '<tr class="empty"><td colspan="6">Belum ada data. Tekan Rekod data.</td></tr>';
    } else {
      head.innerHTML = '<tr><th>#</th><th>h (cm)</th><th>h′ (cm)</th><th>h ÷ h′</th></tr>';
      body.innerHTML = n ? S.drec.map((q, k) => `<tr><td>${k + 1}</td><td>${fx(q.h, 0)}</td><td>${hid('app') ? '?' : fx(q.app, 2)}</td><td>${hid('app') ? '?' : fx(q.h / q.app, 2)}</td></tr>`).join('')
        : '<tr class="empty"><td colspan="4">Belum ada data. Tekan Rekod data.</td></tr>';
    }
    const m = fitSlope(rows());
    byId('tFit').textContent = m ? `Kecerunan garis ≈ ${fx(m, 2)}${S.view === 'refr' ? ' (indeks bias relatif)' : ' (indeks bias)'}` : '';
    byId('graphNote').textContent = S.view === 'refr'
      ? (m ? `Garis hijau melalui asalan. Kecerunan = n ≈ ${fx(m, 2)}.` : 'Rekod sekurang-kurangnya 2 titik untuk melihat kecerunan = n.')
      : (m ? `Kecerunan = n ≈ ${fx(m, 2)}.` : 'Rekod beberapa kedalaman. Pandang hampir menegak untuk hasil tepat.');
  }

  /* ================= KANVAS ================= */
  const stage = byId('stage'), sctx = stage.getContext('2d');
  const gcan = byId('graph'), gctx = gcan.getContext('2d');
  let W = 0, H = 0, GW = 0, GH = 0;
  function resize() {
    const wrap = byId('stageWrap');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = wrap.clientWidth; H = wrap.clientHeight;
    stage.width = Math.round(W * dpr); stage.height = Math.round(H * dpr);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gw = byId('graphWrap');
    GW = gw.clientWidth; GH = gw.clientHeight;
    gcan.width = Math.round(GW * dpr); gcan.height = Math.round(GH * dpr);
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S.dirty = true;
  }
  const FONT = '"Plus Jakarta Sans",system-ui,sans-serif';
  function pill(ctx, text, x, y, o = {}) {
    ctx.font = `${o.w || 800} ${o.s || 12}px ${FONT}`;
    const w = ctx.measureText(text).width + 12, h = (o.s || 12) + 8;
    let px = x - (o.align === 'right' ? w : o.align === 'center' ? w / 2 : 0);
    ctx.fillStyle = o.bg || 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.roundRect(px, y - h / 2, w, h, h / 2); ctx.fill();
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.fillStyle = o.color || '#252137'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(text, px + 6, y + .5);
  }
  function layout() {
    const dh = H;
    const ys = S.count === 2 ? [dh * .5] : [dh * .4, dh * .66];
    return { dh, ys, x0: W * .5 };
  }
  function line(ctx, pts, color, w, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.restore();
  }
  function ray(ctx, pts, col, n, alpha) {
    line(ctx, pts, 'rgba(37,33,55,.55)', 6, alpha * .35);
    line(ctx, pts, col, 8, alpha * .18);
    line(ctx, pts, col, 3.4, alpha);
    if (S.opt.pulse) {
      ctx.save(); ctx.setLineDash([5, 20]); ctx.lineDashOffset = -S.phase / n;
      line(ctx, pts, '#fff', 2, alpha * .95); ctx.restore();
    }
  }
  function arc(ctx, cx, cy, r, a1, a2, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, Math.min(a1, a2), Math.max(a1, a2)); ctx.stroke(); ctx.restore();
  }

  function drawRefr() {
    const ctx = sctx, { dh, ys, x0 } = layout(), N = S.count;
    const ns = nsNow(), tr = curTrace(), col = WAVES[S.wave].col;
    ctx.clearRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, dh); ctx.clip();
    const bounds = [0, ...ys, dh];
    for (let k = 0; k < N; k++) { ctx.fillStyle = tint(k); ctx.fillRect(0, bounds[k], W, bounds[k + 1] - bounds[k]); }
    ctx.strokeStyle = 'rgba(37,33,55,.06)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x < W; x += 28) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, dh); }
    for (let y = 0; y < dh; y += 28) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
    ctx.stroke();
    ys.forEach(y => { ctx.strokeStyle = 'rgba(37,33,55,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); });
    // label medium
    for (let k = 0; k < N; k++) {
      const yy = k === 0 ? 20 : bounds[k + 1] - 20;
      const t = medName(k) + (hid('n') ? '' : `  n = ${fx(ns[k], 2)}`);
      pill(ctx, t, W - 10, yy, { align: 'right', s: 12, bg: 'rgba(255,255,255,.8)', color: '#3b3550' });
    }
    // hit points
    const hx = [x0];
    const segs = [];
    const L = Math.max(40, Math.min(W * .38, ys[0] - 58));
    const ia = tr.th[0];
    const P = [x0 - L * Math.sin(ia), ys[0] - L * Math.cos(ia)];
    segs.push({ pts: [P, [x0, ys[0]]], k: 0, a: 1 });
    let x = x0, y = ys[0];
    for (let j = 1; j < tr.th.length; j++) {
      if (Math.abs(Math.cos(tr.th[j])) < 1e-4) {
        segs.push({ pts: [[x, y], [W + 220, y]], k: j, a: 1 });
        break;
      }
      const yN = j < N - 1 ? ys[j] : dh + 220;
      const xN = x + (yN - y) * Math.tan(tr.th[j]);
      segs.push({ pts: [[x, y], [xN, yN]], k: j, a: 1 });
      x = xN; y = yN; if (j < N - 1) hx.push(x);
    }
    if (tr.tirAt) {
      const kk = tr.tirAt - 1; let rx = hx[kk], ry = ys[kk];
      for (let j = kk; j >= 0; j--) {
        if (Math.abs(Math.cos(tr.th[j])) < 1e-4) {
          segs.push({ pts: [[rx, ry], [W + 220, ry]], k: j, a: 1, refl: true });
          break;
        }
        const yT = j >= 1 ? ys[j - 1] : -200;
        const xT = rx + (ry - yT) * Math.tan(tr.th[j]);
        segs.push({ pts: [[rx, ry], [xT, yT]], k: j, a: 1, refl: true });
        rx = xT; ry = yT;
      }
    } else if (S.opt.refl) {
      const a = clamp(Math.sqrt(tr.R[1]) * 1.1, 0.1, .9);
      const reflEnd = Math.abs(Math.cos(ia)) < 1e-4 ? [W + 220, ys[0]] : [x0 + (ys[0] + 200) * Math.tan(ia), -200];
      segs.push({ pts: [[x0, ys[0]], reflEnd], k: 0, a, refl: true });
    }
    // normal + protraktor
    ys.forEach((y, k) => {
      if (S.opt.normal) {
        ctx.save(); ctx.setLineDash([7, 6]); ctx.strokeStyle = 'rgba(37,33,55,.55)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(hx[k], y - Math.min(y, 120)); ctx.lineTo(hx[k], Math.min(dh, y + 120)); ctx.stroke(); ctx.restore();
      }
    });
    const pR = S.opt.prot ? Math.min(72, W * .18) : 34;
    if (S.opt.prot) protractor(ctx, hx[0], ys[0], pR);
    // sasaran misi
    const tg = S.mission && S.mission.d.target;
    if (tg && S.count === 2) {
      const a = rad(tg.r), len = (dh - ys[0]) * .9, ex = x0 + len * Math.sin(a), ey = ys[0] + len * Math.cos(a);
      ctx.save(); ctx.setLineDash([3, 7]); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x0, ys[0]); ctx.lineTo(ex, ey); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(ex, ey, 8, 0, 7); ctx.fill();
      pill(ctx, T.targetFlag, ex + 12, ey - 14, { bg: '#252137', color: '#fbbf24', s: 11 });
    }
    // sinar
    segs.forEach(s => ray(ctx, s.pts, col, ns[s.k], s.a));
    // lengkok sudut
    ys.forEach((y, k) => {
      if (tr.th[k] === undefined) return;
      const a = tr.th[k], px = hx[k], rr = 34;
      if (a > .01) {
        arc(ctx, px, y, rr, -Math.PI / 2 - a, -Math.PI / 2, '#252137');
        const m = -Math.PI / 2 - a / 2;
        const lab = k === 0 ? 'i' : 'θ' + SUB[k];
        if (k === 0) {
          const radI = S.opt.prot ? pR + 26 : rr + 18;
          pill(ctx, `${lab} ${fx(deg(a), 1)}°`, px + radI * Math.cos(m), clamp(y + radI * Math.sin(m), 22, dh - 22), { align: 'center', s: 11, bg: 'rgba(255,255,255,.94)', stroke: 'rgba(37,33,55,.15)' });
        }
      }
      const b = tr.th[k + 1];
      if (b !== undefined && !(hid('r') && k + 1 === N - 1)) {
        arc(ctx, px, y, rr, Math.PI / 2 - b, Math.PI / 2, '#252137');
        const m = Math.PI / 2 - b / 2;
        const lab = N === 2 ? 'r' : 'θ' + SUB[k + 1];
        if (N === 2) {
          const radR = S.opt.prot ? pR + 26 : rr + 18;
          pill(ctx, `${lab} ${fx(deg(b), 1)}°`, px + radR * Math.cos(m), clamp(y + radR * Math.sin(m), 22, dh - 22), { align: 'center', s: 11, bg: 'rgba(255,255,255,.94)', stroke: 'rgba(37,33,55,.15)' });
        } else {
          pill(ctx, `${lab} ${fx(deg(b), 1)}°`, px + (rr + 14) * Math.cos(m) + 10, y + (rr + 14) * Math.sin(m) + 6, { s: 11, bg: 'rgba(255,255,255,.94)', stroke: 'rgba(37,33,55,.15)' });
        }
      }
    });
    if (tr.tirAt) {
      const kk = tr.tirAt - 1;
      pill(ctx, 'Pantulan dalam penuh', hx[kk], ys[kk] + 24, { align: 'center', bg: '#ffe3d1', color: '#9f4122', s: 12 });
    }
    // laser
    drawLaser(ctx, P, ia, col);
    ctx.restore();
    S.handle = { x: P[0] - 18 * Math.sin(ia), y: P[1] - 18 * Math.cos(ia), x0, y0: ys[0] };
  }
  function drawLaser(ctx, P, ia, col) {
    ctx.save(); ctx.translate(P[0], P[1]); ctx.rotate(-ia);
    ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.roundRect(-11, -40, 22, 40, 6); ctx.fill();
    ctx.fillStyle = col; ctx.fillRect(-11, -8, 22, 4);
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(0, -26, 4, 0, 7); ctx.fill();
    ctx.restore();
    if (!lk('i')) {
      ctx.save(); ctx.strokeStyle = 'rgba(245,158,11,.85)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(P[0] - 18 * Math.sin(ia), P[1] - 18 * Math.cos(ia), 28, 0, 7); ctx.stroke(); ctx.restore();
    }
  }
  function protractor(ctx, cx, cy, R) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(37,33,55,.4)'; ctx.fillStyle = 'rgba(37,33,55,.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke();
    for (let a = 0; a < 360; a += 5) {
      const q = rad(a), L = a % 10 === 0 ? 8 : 4;
      ctx.beginPath(); ctx.moveTo(Math.sin(q) * R, -Math.cos(q) * R); ctx.lineTo(Math.sin(q) * (R - L), -Math.cos(q) * (R - L)); ctx.stroke();
    }
    ctx.font = `700 9.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [30, 60].forEach(a => [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sy]) => {
      const q = rad(a), r2 = R + 12;
      ctx.fillText(a, sx * Math.sin(q) * r2, -sy * Math.cos(q) * r2);
    }));
    ctx.restore();
  }

  function drawDepth() {
    const ctx = sctx, dh = H, ys = dh * .3, sc = (dh - ys - 18) / 22;
    const nd = nDepth(), col = WAVES[S.wave].col;
    ctx.clearRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, dh); ctx.clip();
    ctx.fillStyle = MEDIA.udara.tint; ctx.fillRect(0, 0, W, ys);
    ctx.fillStyle = hid('medname') ? '#ece6f5' : MEDIA[S.dMed].tint; ctx.fillRect(0, ys, W, dh - ys);
    ctx.strokeStyle = 'rgba(37,33,55,.06)'; ctx.beginPath();
    for (let x = 0; x < W; x += 28) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, dh); }
    for (let y = 0; y < dh; y += 28) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(37,33,55,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, ys); ctx.lineTo(W, ys); ctx.stroke();
    pill(ctx, 'Udara  n = 1.00', W - 10, 18, { align: 'right', s: 12, bg: 'rgba(255,255,255,.8)', color: '#3b3550' });
    pill(ctx, hid('medname') ? 'Medium ?' : MEDIA[S.dMed].ms + (hid('n') ? '' : `  n = ${fx(nd, 2)}`), W - 10, ys + 18, { align: 'right', s: 12, bg: 'rgba(255,255,255,.8)', color: '#3b3550' });
    // pembaris
    const rx = 12, rw = 34;
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(rx, ys + 6, rw, 21 * sc + 6);
    ctx.strokeStyle = '#252137'; ctx.fillStyle = '#252137'; ctx.lineWidth = 1; ctx.font = `700 10px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (let c = 0; c <= 21; c++) {
      const yy = ys + 6 + c * sc, big = c % 5 === 0, mid = c % 1 === 0;
      ctx.beginPath(); ctx.moveTo(rx + rw, yy); ctx.lineTo(rx + rw - (big ? 14 : 8), yy); ctx.stroke();
      if (c % 2 === 0 && c > 0) ctx.fillText(c, rx + 3, yy);
    }
    ctx.fillText('cm', rx + 3, ys + 15 + 0);
    const dy = c => ys + 6 + c * sc;
    const app = depthApp(nd, S.d, S.ang);
    const thA = rad(S.ang), thM = Math.asin(Math.sin(thA) / nd);
    const xo = clamp(W * .36, rx + rw + 50, W * .5), yo = dy(S.d);
    const X = xo + S.d * sc * Math.tan(thM), Le = Math.min(ys - 24, 130);
    const eye = [X + Le * Math.sin(thA), ys - Le * Math.cos(thA)];
    const yg = dy(app);
    // panduan ke pembaris
    ctx.save(); ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#d97706'; ctx.beginPath(); ctx.moveTo(rx + rw, yo); ctx.lineTo(xo - 20, yo); ctx.stroke();
    ctx.strokeStyle = '#7c3aed'; ctx.beginPath(); ctx.moveTo(rx + rw, yg); ctx.lineTo(xo - 20, yg); ctx.stroke(); ctx.restore();
    // normal
    ctx.save(); ctx.setLineDash([7, 6]); ctx.strokeStyle = 'rgba(37,33,55,.5)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(X, ys - 70); ctx.lineTo(X, ys + 70); ctx.stroke(); ctx.restore();
    // sambungan ke belakang
    ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X, ys);
    ctx.lineTo(xo, yg); ctx.stroke(); ctx.restore();
    // sinar
    ray(ctx, [[xo, yo], [X, ys]], col, nd, 1);
    ray(ctx, [[X, ys], eye], col, 1, 1);
    // lengkok
    if (S.ang > 1) {
      arc(ctx, X, ys, 30, -Math.PI / 2, -Math.PI / 2 + thA, '#252137');
      pill(ctx, `θ ${S.ang}°`, X + 40, ys - 34, { s: 11 });
      arc(ctx, X, ys, 30, Math.PI / 2 - thM, Math.PI / 2, '#252137');
    }
    // syiling dan imej
    ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#855300'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(xo, yo, 15, 6, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = '#7c3aed'; ctx.fillStyle = 'rgba(124,58,237,.12)';
    ctx.beginPath(); ctx.ellipse(xo, yg, 15, 6, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
    pill(ctx, `h = ${fx(S.d, 1)} cm`, xo + 22, yo + (S.d - app > 2.2 ? 0 : 14), { s: 11, bg: '#fff2e2', color: '#855300' });
    pill(ctx, `h′ = ${hid('app') ? '?' : fx(app, 1) + ' cm'}`, xo + 22, yg - (S.d - app > 2.2 ? 0 : 6) - (S.d - app > 2.2 ? 0 : 6), { s: 11, bg: '#ede9fe', color: '#5b21b6' });
    // mata
    ctx.save(); ctx.translate(eye[0], eye[1]); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#252137'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 17, 10, -thA, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill(); ctx.restore();
    ctx.restore();
    S.handle = null;
  }

  function drawGraph() {
    const ctx = gctx; ctx.clearRect(0, 0, GW, GH);
    const dep = S.view === 'depth';
    const l = 40, b = 30, t = 12, r = 14, pw = GW - l - r, ph = GH - t - b;
    const rs = rows();
    let xmax, ymax, slope = null;
    if (dep) { xmax = 20; ymax = 20; slope = hid('n') || hid('kth') ? null : nDepth(); }
    else {
      const ns = nsNow(), nrel = ns[S.count - 1] / ns[0];
      ymax = 1;
      if (hid('n') || hid('kth')) { xmax = niceMax(Math.max(0.25, ...rs.map(q => q.x)) * 1.05); }
      else { slope = nrel; xmax = niceMax(Math.min(1, nrel > 1 ? 1 / nrel : 1)); xmax = Math.max(xmax, ...rs.map(q => q.x)); xmax = niceMax(xmax); }
    }
    const X = v => l + (v / xmax) * pw, Y = v => t + ph - (v / ymax) * ph;
    ctx.font = `700 10px ${FONT}`; ctx.fillStyle = '#5c5670'; ctx.strokeStyle = '#ede8f6'; ctx.lineWidth = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let i = 0; i <= 5; i++) {
      const vx = xmax * i / 5, vy = ymax * i / 5;
      ctx.beginPath(); ctx.moveTo(X(vx), t); ctx.lineTo(X(vx), t + ph); ctx.moveTo(l, Y(vy)); ctx.lineTo(l + pw, Y(vy)); ctx.stroke();
      ctx.fillText(dep ? Math.round(vx) : sg(vx, 2), X(vx), t + ph + 4);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(dep ? Math.round(vy) : sg(vy, 2), l - 5, Y(vy)); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    }
    ctx.strokeStyle = '#252137'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(l, t); ctx.lineTo(l, t + ph); ctx.lineTo(l + pw, t + ph); ctx.stroke();
    ctx.fillStyle = '#252137'; ctx.font = `800 11px ${FONT}`; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText(dep ? "h′ ketara (cm)" : 'sin r', l + pw, GH - 2);
    ctx.save(); ctx.translate(11, t + 4); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(dep ? 'h nyata (cm)' : 'sin i', 0, 0); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(l, t, pw, ph); ctx.clip();
    if (slope) {
      ctx.setLineDash([5, 4]); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(X(0), Y(0)); const xe = Math.min(xmax, ymax / slope); ctx.lineTo(X(xe), Y(xe * slope)); ctx.stroke(); ctx.setLineDash([]);
    }
    const m = fitSlope(rs);
    if (m) { ctx.strokeStyle = '#047857'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); const xe = Math.min(xmax, ymax / m); ctx.lineTo(X(xe), Y(xe * m)); ctx.stroke(); }
    rs.forEach(q => { ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#855300'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), 5, 0, 7); ctx.fill(); ctx.stroke(); });
    // titik semasa
    let live = null;
    if (dep) live = { x: depthApp(nDepth(), S.d, S.ang), y: S.d };
    else { const tr = curTrace(); if (!tr.tirAt && !(hid('r') && false)) live = { x: Math.sin(tr.th[tr.th.length - 1]), y: Math.sin(tr.th[0]) }; }
    if (live && live.x <= xmax * 1.02 && !(dep && hid('app'))) {
      ctx.strokeStyle = 'rgba(37,33,55,.35)'; ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(live.x), Y(0)); ctx.lineTo(X(live.x), Y(live.y)); ctx.lineTo(X(0), Y(live.y)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.arc(X(live.x), Y(live.y), 5.5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }

  /* ================= INTERAKSI KANVAS ================= */
  function angleFromPointer(e) {
    const rc = stage.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top;
    const h = S.handle; if (!h) return null;
    const dx = h.x0 - mx, dy = h.y0 - my;
    if (dy <= 2 && Math.abs(dx) < 2) return 0;
    return deg(Math.atan2(dx, Math.max(dy, 0)));
  }
  function nearHandle(e, pad) {
    const h = S.handle; if (!h) return false;
    const rc = stage.getBoundingClientRect();
    return Math.hypot(e.clientX - rc.left - h.x, e.clientY - rc.top - h.y) < (pad || 36);
  }
  stage.addEventListener('pointerdown', e => {
    if (S.view !== 'refr' || lk('i') || !nearHandle(e, e.pointerType === 'touch' ? 52 : 38)) return;
    S.drag = true; stage.setPointerCapture(e.pointerId); stage.style.cursor = 'grabbing'; e.preventDefault();
  });
  stage.addEventListener('pointermove', e => {
    if (S.drag) { const a = angleFromPointer(e); if (a !== null) setI(clamp(a, 0, 90)); }
    else stage.style.cursor = S.view === 'refr' && !lk('i') && nearHandle(e) ? 'grab' : 'default';
  });
  const endDrag = () => { S.drag = false; stage.style.cursor = 'default'; };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('touchstart', e => {
    if (S.view !== 'refr' || lk('i') || !e.touches[0]) return;
    const rc = stage.getBoundingClientRect(), h = S.handle; if (!h) return;
    if (Math.hypot(e.touches[0].clientX - rc.left - h.x, e.touches[0].clientY - rc.top - h.y) < 52) e.preventDefault();
  }, { passive: false });
  stage.addEventListener('keydown', e => {
    const step = e.shiftKey ? 5 : 1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { nudge(-step); e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { nudge(step); e.preventDefault(); }
  });

  /* ================= TAB ================= */
  function bindTabGroup(el) {
    const tabs = Array.from(el.querySelectorAll('[role=tab]'));
    const select = t => {
      tabs.forEach(b => {
        const on = b === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
        const p = byId(b.getAttribute('aria-controls')); if (p) { if (on) p.removeAttribute('inert'); else p.setAttribute('inert', ''); }
      });
      S.dirty = true;
    };
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => select(b));
      b.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; select(n); n.focus(); }
      });
    });
    return select;
  }
  const selAnalysis = bindTabGroup(byId('analysis-tabs'));
  const selControl = bindTabGroup(byId('pb-tabs'));

  /* ================= BUNYI & CONFETTI ================= */
  let actx = null;
  function beep(f, d, type) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = f; g.gain.value = .05; g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + d);
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + d);
    } catch (_) {}
  }
  const sfx = { ok() { beep(660, .15); setTimeout(() => beep(880, .25), 120); }, err() { beep(200, .2, 'square'); } };
  function confetti() {
    const cv = byId('ghost'), c = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
    const ps = Array.from({ length: 90 }, () => ({ x: innerWidth / 2, y: innerHeight * .4, vx: (Math.random() - .5) * 12, vy: -Math.random() * 12 - 3, c: ['#f59e0b', '#fbbf24', '#7c3aed', '#0e7490', '#047857'][Math.floor(Math.random() * 5)], s: 4 + Math.random() * 5 }));
    let n = 0;
    (function f() {
      c.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .4; c.fillStyle = p.c; c.fillRect(p.x, p.y, p.s, p.s); });
      if (++n < 80) requestAnimationFrame(f); else c.clearRect(0, 0, cv.width, cv.height);
    })();
  }

  /* ================= MISI ================= */
  let prog = { stars: {}, xp: 0 };
  try { const s = localStorage.getItem('pembiasan-prog-v1'); if (s) prog = JSON.parse(s); } catch (_) {}
  const saveProg = () => { try { localStorage.setItem('pembiasan-prog-v1', JSON.stringify(prog)); } catch (_) {} };
  const starsHtml = n => [1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('');

  function resetLab() {
    S.view = 'refr'; S.count = 2; S.med = ['udara', 'perspek', 'crown']; S.layer = 1; S.iT = S.iD = 30; S.wave = 1;
    S.dMed = 'perspek'; S.d = 10; S.ang = 3; S.rec = []; S.drec = []; S.locks = {}; S.hide = {}; S.tir = false;
  }
  function setMode(m) {
    if (S.mode === m) return;
    S.mode = m;
    $$('#modeTabs button').forEach(b => { const on = b.dataset.m === m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    S.mission = null; resetLab(); syncAll(); renderBanner(); byId('hint').classList.remove('hide');
    byId('hint').textContent = '⬆ Seret laser untuk menukar sudut tuju';
    if (m === 'chal') openList();
  }
  let winTimer = 0;
  function startMission(i) {
    clearTimeout(winTimer);
    resetLab();
    const d = MIS[i].gen();
    S.mission = { i, d, tries: 0, hint: false, ok: false, hold: 0 };
    d.setup(); S.locks = d.lock || {}; S.hide = d.hide || {};
    closeSheets(); byId('mInput').value = ''; missionFb('', '');
    byId('hint').classList.add('hide');
    selAnalysis(byId('tab-graph')); selControl(byId('tab-medium'));
    syncAll(); renderBanner(); S.dirty = true;
    setTimeout(() => byId('missionBar').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
  function missionFb(msg, cls) { const f = byId('mFb'); f.className = 'mfb ' + (cls || ''); f.textContent = msg; }
  function renderBanner() {
    const mb = byId('missionBar'); mb.hidden = S.mode !== 'chal';
    if (S.mode !== 'chal') return;
    const q = S.mission;
    if (!q) {
      byId('mNum').textContent = '?'; byId('mTitle').textContent = T.mSelectTitle; byId('mStars').innerHTML = '';
      byId('mText').innerHTML = T.mEmpty; byId('mAns').hidden = true; byId('mProg').hidden = true; return;
    }
    byId('mNum').textContent = q.i + 1; byId('mTitle').textContent = MIS[q.i].t;
    byId('mStars').innerHTML = starsHtml(prog.stars[q.i] || 0);
    byId('mText').innerHTML = q.d.text(); byId('mUnit').textContent = q.d.unit || '';
    byId('mAns').hidden = q.d.kind !== 'num'; byId('mProg').hidden = q.d.kind !== 'state';
  }
  function submitAnswer() {
    const q = S.mission; if (!q || q.ok || q.d.kind === 'state') return;
    const need = q.d.need && q.d.need();
    if (need) { missionFb(need, 'info'); sfx.err(); return; }
    const inp = byId('mInput'), u = parseNum(inp.value);
    const shake = () => { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); };
    if (!isFinite(u)) { missionFb(T.errNum, 'err'); shake(); return; }
    const a = q.d.ans(), tol = q.d.tol(a);
    if (Math.abs(u - a) <= tol) { winMission(); return; }
    q.tries++; sfx.err(); shake();
    let msg = u > a ? T.errTooBig : T.errTooSmall;
    if (u > a * 8 || u < a / 8) msg += T.errUnit;
    missionFb(`${msg} ${T.errTryAgain.replace('{n}', q.tries)}` + (q.tries >= 2 && !q.hint ? T.errHintTip : ''), 'err');
  }
  function winMission() {
    const q = S.mission; if (!q || q.ok) return; q.ok = true;
    let stars = q.tries === 0 ? 3 : q.tries === 1 ? 2 : 1;
    if (q.hint) stars = Math.max(1, stars - 1);
    const prev = prog.stars[q.i] || 0, gain = Math.max(0, stars - prev) * 100;
    if (stars > prev) prog.stars[q.i] = stars;
    prog.xp += gain; saveProg(); sfx.ok(); confetti();
    byId('winStars').innerHTML = starsHtml(stars);
    byId('winTitle').textContent = stars === 3 ? T.winPerfect : T.winGood;
    byId('winXp').textContent = gain ? `+${gain} XP` : T.winRepeat;
    byId('winExpl').innerHTML = `<b>${T.winSolution}</b><br>${q.d.expl()}`;
    byId('winNext').style.display = q.i < MIS.length - 1 ? '' : 'none';
    winTimer = setTimeout(() => byId('winSheet').classList.add('show'), 700);
    renderBanner();
  }
  function rankInfo() {
    let r = 0; RANKS.forEach((q, i) => { if (prog.xp >= q[0]) r = i; });
    const lo = RANKS[r][0], hi = RANKS[r + 1] ? RANKS[r + 1][0] : null;
    return { name: RANKS[r][1], hi, pct: hi ? ((prog.xp - lo) / (hi - lo)) * 100 : 100 };
  }
  function openList() {
    const g = byId('mGrid'); g.innerHTML = '';
    MIS.forEach((m, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mcard';
      b.innerHTML = `<em>${m.ic}</em><span><b>${i + 1}. ${m.t}</b><small>${m.s}</small><div class="stars" style="font-size:13px">${starsHtml(prog.stars[i] || 0)}</div></span>`;
      b.onclick = () => startMission(i); g.appendChild(b);
    });
    const r = rankInfo();
    byId('rankName').textContent = r.name;
    byId('rankXp').textContent = `${prog.xp} XP · ` + (r.hi ? `${r.hi - prog.xp} ${T.rankNext}` : T.rankMax);
    byId('xpFill').style.width = r.pct + '%';
    byId('listSheet').classList.add('show');
  }
  function closeSheets() { byId('listSheet').classList.remove('show'); byId('winSheet').classList.remove('show'); }
  function missionTick(dt) {
    const q = S.mission; if (!q || q.ok || q.d.kind !== 'state') return;
    let ok = false; try { ok = q.d.check(); } catch (_) {}
    q.hold = ok ? q.hold + dt : Math.max(0, q.hold - dt * 2);
    byId('mProgBar').style.width = clamp(q.hold / 1.2 * 100, 0, 100) + '%';
    if (q.hold >= 1.2) winMission();
  }

  /* ================= PAUT ACARA ================= */
  function bind() {
    byId('viewSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setView(b.dataset.v); });
    byId('cntSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setCount(+b.dataset.c); });
    byId('slider-a').addEventListener('input', e => (S.view === 'depth' ? setAng(+e.target.value) : setI(+e.target.value)));
    byId('slider-b').addEventListener('input', e => setDepth(+e.target.value));
    [['tg-normal', 'normal'], ['tg-prot', 'prot'], ['tg-refl', 'refl'], ['tg-pulse', 'pulse']].forEach(([id, k]) => byId(id).addEventListener('change', e => { S.opt[k] = e.target.checked; S.dirty = true; }));
    byId('recBtn2').onclick = recordNow;
    byId('clearRec').onclick = () => { if (S.view === 'refr') S.rec = []; else S.drec = []; renderTable(); S.dirty = true; };
    byId('resetBtn').onclick = () => {
      if (S.mission) { startMission(S.mission.i); return; }
      resetLab(); syncAll(); toast(T.toastReset);
    };
    byId('jumpGraphBtn').onclick = () => { selAnalysis(byId('tab-graph')); byId('graphCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    $$('#modeTabs button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.m)));
    byId('mList').onclick = openList;
    byId('listClose').onclick = closeSheets;
    byId('winList').onclick = () => { byId('winSheet').classList.remove('show'); openList(); };
    byId('winRetry').onclick = () => startMission(S.mission.i);
    byId('winNext').onclick = () => startMission(Math.min(MIS.length - 1, S.mission.i + 1));
    byId('mCheck').onclick = submitAnswer;
    byId('mInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); });
    byId('mHint').onclick = () => { const q = S.mission; if (!q) return; q.hint = true; missionFb('💡 ' + q.d.hint(), 'info'); };
    $$('.sheet').forEach(s => s.addEventListener('click', e => { if (e.target === s) s.classList.remove('show'); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheets(); });
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(byId('stageWrap'));
  }

  function fillTheoryTable() {
    byId('nTable').innerHTML = '<tr><th>Medium</th><th>n</th><th>v (10⁸ m s⁻¹)</th><th>c</th></tr>' + MKEYS.map(k => {
      const n = MEDIA[k].n; return `<tr><td>${MEDIA[k].ms}</td><td>${fx(n, 2)}</td><td>${fx(3 / n, 2)}</td><td>${n > 1 ? fx(deg(Math.asin(1 / n)), 1) + '°' : '–'}</td></tr>`;
    }).join('');
  }

  /* ================= GELUNG ================= */
  let last = performance.now(), lastSig = '';
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    S.phase += dt * 90;
    const diff = S.iT - S.iD;
    if (Math.abs(diff) > 0.02) { S.iD += diff * (1 - Math.exp(-dt * 16)); S.dirty = true; } else if (diff !== 0) { S.iD = S.iT; S.dirty = true; }
    const sig = [S.view, S.count, S.med.join(), S.iD.toFixed(2), S.d, S.ang, S.wave, S.dMed, Object.keys(S.hide).join(), S.rec.length, S.drec.length].join('|');
    if (sig !== lastSig || S.dirty) { lastSig = sig; readouts(); drawGraph(); S.dirty = false; }
    if (W) { if (S.view === 'refr') drawRefr(); else drawDepth(); }
    missionTick(dt);
    requestAnimationFrame(frame);
  }

  function init() {
    fillTheoryTable(); bind(); resize(); syncAll(); renderBanner();
    window.SIM = { S, api, MIS, startMission, setMode, setView, setCount, setI, recordNow, submitAnswer, curTrace };
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
