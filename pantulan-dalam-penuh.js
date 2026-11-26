(function () {
  'use strict';
  const MD = window.PdpModel;
  const { clamp, rad, deg, fx, parseNum, V, C, MKEYS, MEDIA, WAVES, nAt, speedOf, critD, trace, scene, mirage, RANKS, I18N, createMissions } = MD;
  const T = I18N.ms;
  const byId = id => document.getElementById(id);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const FONT = '"Plus Jakarta Sans",system-ui,sans-serif';

  /* ================= SENARIO ================= */
  const SC = {
    blok: { ms: 'Blok semi bulatan', title: 'Blok semi bulatan (teori)', a: { lbl: 'Sudut tuju, i', min: 0, max: 89, step: 1, def: 30, pre: [0, 20, 30, 40, 45, 60, 75] }, roles: [['blok', 'Medium blok']], drag: true, hint: '⬆ Seret laser di sekeliling blok untuk menukar sudut tuju' },
    pelangi: { ms: 'Pelangi', title: 'Pembentukan pelangi dalam titisan air', a: { lbl: 'Sudut tuju pada titisan, i', min: 0, max: 89, step: 1, def: 59, pre: [20, 40, 59, 70, 80] }, roles: [['pelangi', 'Titisan']], hint: 'Ubah sudut tuju dan perhatikan sudut pelangi setiap warna' },
    logamaya: { ms: 'Logamaya', title: 'Logamaya di atas jalan panas', a: { lbl: 'Sudut tuju di lapisan atas, i', min: 89, max: 89.95, step: 0.05, def: 89.7, pre: [89.2, 89.5, 89.7, 89.9], dp: 2 }, b: { lbl: 'Suhu permukaan jalan', min: 25, max: 80, step: 1, def: 60 }, roles: [], hint: 'Naikkan suhu jalan atau sudut tuju untuk mencipta logamaya' },
    periskop: { ms: 'Periskop berprisma', title: 'Periskop berprisma', a: { lbl: 'Kecondongan sinar', min: -10, max: 10, step: 1, def: 0, pre: [-10, -5, 0, 5, 10] }, roles: [['periskop', 'Prisma']], hint: 'Tukar bahan prisma atau condongkan sinar' },
    gentian: { ms: 'Gentian optik', title: 'Gentian optik', a: { lbl: 'Sudut masuk, θ', min: 0, max: 80, step: 1, def: 20, pre: [0, 15, 30, 45, 60] }, roles: [['gentianA', 'Teras'], ['gentianB', 'Pelapisan']], drag: true, hint: '⬆ Seret laser untuk menukar sudut masuk' },
    matakucing: { ms: 'Pemantul mata jalan', title: 'Pemantul mata jalan (mata kucing)', a: { lbl: 'Kecondongan sinar lampu', min: -40, max: 40, step: 1, def: 0, pre: [-30, -15, 0, 15, 30] }, roles: [['matakucing', 'Prisma']], hint: 'Condongkan sinar lampu kereta' }
  };
  const SCK = Object.keys(SC);
  const ICON = {
    blok: '<path d="M3 9h18a9 9 0 0 1-18 0Z"/><path d="M12 9v-6"/>',
    pelangi: '<path d="M3 18a9 9 0 0 1 18 0"/><path d="M7 18a5 5 0 0 1 10 0"/>',
    logamaya: '<circle cx="17" cy="6" r="3"/><path d="M3 15c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 19c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/>',
    periskop: '<path d="M7 3h6v14h5"/><path d="M7 3l6 6M13 17l5 5"/><path d="M3 6h4"/>',
    gentian: '<path d="M2 12c4-6 6 6 10 0s6 6 10 0"/>',
    matakucing: '<path d="M14 5l7 7-7 7z"/><path d="M3 10h8M11 14H3"/>'
  };
  const svgI = (k, s) => `<svg viewBox="0 0 24 24" width="${s || 20}" height="${s || 20}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  const NO_AIR = { blok: 1, pelangi: 1, periskop: 1, matakucing: 1, gentianA: 1 };
  const WAVE_HINT = {
    merah: 'Sudut genting paling besar',
    kuning: 'Rujukan garis D',
    hijau: 'Sudut genting sederhana',
    biru: 'Sudut genting lebih kecil',
    ungu: 'Sudut genting paling kecil'
  };

  /* ================= STATE ================= */
  const defP = () => { const o = {}; SCK.forEach(k => { o[k] = { a: SC[k].a.def, b: SC[k].b ? SC[k].b.def : 0 }; }); return o; };
  const defM = () => ({ blok: 'perspek', pelangi: 'air', periskop: 'crown', gentianA: 'flint', gentianB: 'crown', matakucing: 'perspek' });
  const S = {
    sc: 'blok', p: defP(), m: defM(), role: 0, aD: 30, wave: 1, white: true, rec: [],
    opt: { normal: true, crit: true, prot: true, refl: true, pulse: true },
    mode: 'lab', mission: null, locks: {}, hide: {}, phase: 0, drag: false, dirty: true, lastState: '', cur: null
  };
  const P = () => S.p[S.sc];
  const lam = () => WAVES[S.wave].nm;
  const lk = k => !!S.locks[k];
  const hid = k => !!S.hide[k];
  const fv = n => fx(speedOf(n) / 1e8, 2);
  const keyA = () => (S.sc === 'gentian' ? S.m.gentianA : S.m[S.sc] || 'udara');
  const keyB = () => (S.sc === 'gentian' ? S.m.gentianB : 'udara');
  const pct = R => fx(R * 100, R > 0.995 ? 0 : 1) + '%';
  const nameOf = k => (hid('medname') ? 'Medium ?' : MEDIA[k].ms);

  /* ================= PENGIRAAN ================= */
  function runScene(sc, a, kA, kB, nm) {
    const sco = scene(sc, { a, nA: nAt(kA, nm), nB: nAt(kB, nm) });
    const runs = sco.rays.map((r, ri) => ({ ri, key: r.key, ray: r, res: trace(sco.prims, r.p, r.d, { policy: r.policy, maxHits: sc === 'gentian' ? 90 : 40, minI: sc === 'periskop' || sc === 'matakucing' ? 0.05 : 0.015 }) }));
    return { sco, runs };
  }
  const mainEvs = run => run.res.evs.filter(e => e.main);
  const leakMK = runs => runs.some(run => mainEvs(run).some(e => (e.tag === 'f1' || e.tag === 'f2') && !e.tir));

  function leakTilt(key) {
    for (let t = 0; t <= 40; t++) for (const s of [1, -1]) {
      if (leakMK(runScene('matakucing', s * t, key, 'udara', 589).runs)) return t;
    }
    return 99;
  }

  function compute() {
    const sc = S.sc, a = S.aD;
    if (sc === 'logamaya') {
      const m = mirage(P().b, a);
      const info = { sc, n1: m.nTop, n2: m.nBot, i: a, c: m.c, tir: m.tir, state: m.tir ? 'pdp' : 'bias', mir: m, nrel: m.nTop / m.nBot };
      return { sc, mir: m, info };
    }
    const kA = keyA(), kB = keyB();
    const main = runScene(sc, a, kA, kB, lam());
    const extra = [];
    if (sc === 'pelangi' && S.white) WAVES.forEach((w, wi) => { if (wi !== S.wave) extra.push({ wi, ...runScene(sc, a, kA, kB, w.nm) }); });
    const n1 = nAt(kA, lam()), n2 = nAt(kB, lam());
    const kr = main.runs.find(r => r.key) || main.runs[0];
    const ev = mainEvs(kr);
    const info = { sc, n1, n2, c: critD(n1, n2), nrel: n1 / n2 };
    if (sc === 'blok') {
      const e = ev.find(q => q.tag === 'flat');
      Object.assign(info, { i: e.i, r: e.r, tir: e.tir, R: e.R, keys: [{ ev: e, inL: 'i', outL: 'r', crit: true, prot: true }] });
      info.state = e.tir ? 'pdp' : info.c != null && info.c - e.i <= 1 ? 'genting' : 'bias';
    } else if (sc === 'pelangi') {
      const e0 = ev[0], e1 = ev[1];
      const th = nm => { const n = nAt(kA, nm), ii = rad(a), r = Math.asin(Math.sin(ii) / n); return deg(4 * r - 2 * ii); };
      Object.assign(info, { i: e0 ? e0.i : a, r: e0 ? e0.r : 0, iBack: e1 ? e1.i : null, R: e1 ? e1.R : 0, tir: false, state: 'separa', theta: th(lam()), thR: th(650), thV: th(405), exit: ev[2], keys: [] });
      if (e0) info.keys.push({ ev: e0, inL: 'i', outL: 'r', prot: true });
      if (e1) info.keys.push({ ev: e1, inL: 'r', crit: true });
    } else if (sc === 'periskop') {
      const h1 = ev.find(q => q.tag === 'hyp1'), h2 = ev.find(q => q.tag === 'hyp2');
      const all = main.runs.every(run => { const E = mainEvs(run); const a1 = E.find(q => q.tag === 'hyp1'), a2 = E.find(q => q.tag === 'hyp2'); return a1 && a1.tir && a2 && a2.tir; });
      Object.assign(info, { i: h1 ? h1.i : 45, i2: h2 ? h2.i : null, t1: !!(h1 && h1.tir), t2: !!(h2 && h2.tir), tir: all, state: all ? 'pdp' : 'bocor', keys: [] });
      if (h1) info.keys.push({ ev: h1, inL: 'i', crit: true, prot: true });
      if (h2) info.keys.push({ ev: h2, inL: 'i', crit: true });
    } else if (sc === 'gentian') {
      const en = ev.find(q => q.tag === 'entC'), ccs = ev.filter(q => q.tag === 'cc'), cc = ccs.find(q => q.p[0] > main.sco.fib.x0 + 2.2) || ccs[0];
      const leak = ev.some(q => (q.tag === 'cc' && !q.tir) || q.absorb);
      const tmax = n1 > n2 ? deg(Math.asin(Math.min(1, Math.sqrt(n1 * n1 - n2 * n2)))) : 0;
      Object.assign(info, { th: a, r: en ? en.r : null, i: cc ? cc.i : null, tir: !leak && !!cc, tmax, leak, state: !cc ? 'lurus' : leak ? 'bocor' : 'pdp', keys: [] });
      if (en) info.keys.push({ ev: en, inL: 'θ', outL: 'r' });
      if (cc) info.keys.push({ ev: cc, inL: 'i', crit: true, prot: true });
    } else if (sc === 'matakucing') {
      const fs = ev.filter(q => q.tag === 'f1' || q.tag === 'f2');
      const leak = leakMK(main.runs);
      const segs = kr.res.segs.filter(s => s.main), last = segs[segs.length - 1];
      const dOut = V.norm(V.sub(last.b, last.a)), dIn = kr.ray.d;
      const back = deg(Math.acos(clamp(-V.dot(dOut, dIn), -1, 1)));
      Object.assign(info, { i: fs[0] ? fs[0].i : null, i2: fs[1] ? fs[1].i : null, tir: !leak, back: leak ? null : back, state: leak ? 'bocor' : 'pdp', keys: [] });
      if (fs[0]) info.keys.push({ ev: fs[0], inL: 'i₁', crit: true, prot: true });
      if (fs[1]) info.keys.push({ ev: fs[1], inL: 'i₂', crit: true });
    }
    return { sc, main, extra, info };
  }
  const info = () => (S.cur ? S.cur.info : compute().info);
  const settled = () => Math.abs(S.aD - P().a) < 0.02;

  /* ================= API MISI ================= */
  const api = {
    setSc: (sc, f) => setSc(sc, f),
    setWave: i => { S.wave = i; S.dirty = true; syncAll(); },
    setMed: (role, key) => { S.m[role] = key; S.dirty = true; syncAll(); },
    getA: () => P().a,
    setA: (v, f) => setA(v, f),
    setB: (v, f) => setB(v, f),
    settled,
    info: () => compute().info,
    leakTilt
  };
  let MIS = [];
  try { MIS = createMissions(api); } catch (e) { console.error(e); }

  /* ================= SETTERS ================= */
  const snap = (v, A) => +(Math.round(clamp(v, A.min, A.max) / A.step) * A.step).toFixed(2);
  function setA(v, force) {
    if (lk('a') && !force) return;
    P().a = snap(v, SC[S.sc].a);
    if (force) S.aD = P().a;
    S.dirty = true; syncSliders(); hideHint();
  }
  function setB(v, force) {
    if (!SC[S.sc].b || (lk('b') && !force)) return;
    P().b = snap(v, SC[S.sc].b);
    S.dirty = true; syncSliders(); hideHint();
  }
  function setSc(sc, force) {
    if (lk('sc') && !force) return;
    S.sc = sc; S.role = 0; S.aD = P().a; S.lastState = ''; S.dirty = true;
    syncAll();
    const h = byId('hint'); h.textContent = SC[sc].hint; h.classList.remove('hide');
  }
  function hideHint() { byId('hint').classList.add('hide'); }
  function nudge(k) { setA(P().a + k * SC[S.sc].a.step); }

  let toastT = 0;
  function toast(html) {
    const t = byId('toast'); t.innerHTML = html; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ================= UI SYNC ================= */
  function syncStrip() {
    const st = byId('scStrip');
    if (!st.childElementCount) {
      SCK.forEach(k => {
        const b = document.createElement('button');
        b.type = 'button'; b.dataset.sc = k;
        b.innerHTML = svgI(k, 20) + `<span>${SC[k].ms}</span>`; b.title = SC[k].title;
        b.onclick = () => setSc(k);
        st.appendChild(b);
      });
    }
    $$('#scStrip button').forEach(b => { const on = b.dataset.sc === S.sc; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.disabled = lk('sc') && !on; });
    byId('visual-title').textContent = SC[S.sc].title;
  }
  function syncSliders() {
    const A = SC[S.sc].a, Bc = SC[S.sc].b, sa = byId('slider-a'), sb = byId('slider-b');
    const setPct = el => {
      const mn = +el.min || 0, mx = +el.max || 100, val = +el.value;
      el.style.setProperty('--pct', ((val - mn) / Math.max(1e-9, mx - mn) * 100).toFixed(2) + '%');
    };
    byId('lblA').textContent = A.lbl;
    sa.min = A.min; sa.max = A.max; sa.step = A.step; sa.value = P().a;
    byId('out-a').textContent = fx(P().a, A.dp || 0) + '°';
    sa.disabled = lk('a'); byId('nudgeM').disabled = byId('nudgeP').disabled = lk('a');
    setPct(sa);
    byId('rowB').hidden = !Bc;
    if (Bc) {
      sb.min = Bc.min; sb.max = Bc.max; sb.value = P().b;
      byId('out-b').textContent = P().b + ' °C';
      setPct(sb);
      byId('lblB').textContent = Bc.lbl; sb.disabled = lk('b');
    }
    const pre = byId('angPre');
    if (pre.dataset.sc !== S.sc) {
      pre.dataset.sc = S.sc; pre.innerHTML = '';
      A.pre.forEach(v => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pdp-pre';
        b.dataset.v = v; b.textContent = fx(v, A.dp || 0) + '°';
        b.onclick = () => setA(v); pre.appendChild(b);
      });
    }
    $$('#angPre .pdp-pre').forEach(b => {
      const on = Math.abs(+b.dataset.v - P().a) < 1e-6;
      b.disabled = lk('a');
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
  }
  function syncControls() {
    const roles = SC[S.sc].roles;
    const tabs = byId('lyTabs'); tabs.innerHTML = ''; byId('lyGroup').hidden = roles.length < 2;
    if (roles.length > 1) byId('lyPart').textContent = roles[S.role][1];
    roles.forEach(([r, lbl], k) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = k === S.role ? 'on' : '';
      b.innerHTML = `${lbl}<i style="background:${MEDIA[S.m[r]].tint};border:1px solid rgba(37,33,55,.2)"></i>`;
      b.onclick = () => { S.role = k; syncControls(); };
      tabs.appendChild(b);
    });
    const isMir = S.sc === 'logamaya';
    byId('mats').hidden = isMir; byId('mirInfo').hidden = !isMir;
    byId('lySub').textContent = isMir ? 'Medium' : 'Pilih bahan';
    if (isMir) {
      byId('lyName').textContent = 'Udara berlapis';
      const m = mirage(P().b, P().a), L = m.layers;
      const rows = [L.length - 1, 6, 2, 0].map(k => `<tr><td>${k === L.length - 1 ? 'Atas' : k === 0 ? 'Paling bawah' : 'Lapisan ' + (k + 1)}</td><td>${fx(L[k].T, 1)}</td><td>${fx(L[k].n, 6)}</td></tr>`).join('');
      byId('mirInfo').innerHTML = `<div class="pdp-info">Udara dekat jalan lebih panas, jadi kurang tumpat dan indeks biasannya lebih kecil. Cahaya dari langit bergerak dari udara sejuk (tumpat) ke udara panas (kurang tumpat).</div><table class="mir-table"><tr><th>Lapisan</th><th>T (°C)</th><th>n</th></tr>${rows}</table>`;
    } else {
      const [role] = roles[S.role];
      const cur = S.m[role];
      byId('lyName').textContent = hid('medname') ? 'Medium ?' : MEDIA[cur].ms;
      const mats = byId('mats'); mats.innerHTML = '';
      MKEYS.forEach(key => {
        const b = document.createElement('button'); b.type = 'button';
        b.className = key === cur && !hid('medname') ? 'on' : '';
        b.innerHTML = `<b><i style="background:${MEDIA[key].dot}"></i>${MEDIA[key].ms}</b><small>${hid('mn') ? '&nbsp;' : 'n = ' + fx(nAt(key, lam()), 2)}</small>`;
        b.disabled = lk('media') || lk('med_' + role) || (NO_AIR[role] && key === 'udara');
        b.onclick = () => { S.m[role] = key; S.dirty = true; syncAll(); };
        mats.appendChild(b);
      });
    }
    const w = byId('waves'); w.innerHTML = '';
    WAVES.forEach((q, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = i === S.wave ? 'on' : '';
      const thz = Math.round(C / (q.nm * 1e-9) / 1e12);
      b.innerHTML = `<span class="wv-main"><i style="background:${q.col}"></i><span><b>${q.ms}</b><small>${WAVE_HINT[q.k] || ''}</small></span></span><span class="wv-meta"><strong>${q.nm} nm</strong><span>${thz} THz</span></span>`;
      b.setAttribute('aria-pressed', i === S.wave);
      b.disabled = lk('wave'); b.onclick = () => { S.wave = i; S.dirty = true; syncAll(); };
      w.appendChild(b);
    });
    const sd = byId('specDot');
    if (sd) {
      sd.style.left = clamp((lam() - 405) / (650 - 405) * 100, 0, 100) + '%';
      sd.style.borderColor = WAVES[S.wave].col;
    }
    byId('waveNote').textContent = `λ = ${lam()} nm. Indeks biasan lebih besar untuk cahaya ungu, jadi sudut genting cahaya ungu sedikit lebih kecil daripada cahaya merah.`;
    byId('whiteRow').hidden = S.sc !== 'pelangi';
  }
  function syncAll() { syncStrip(); syncControls(); syncSliders(); renderTable(); S.dirty = true; }

  /* ================= BACAAN ================= */
  const STATE_TXT = {
    bias: ['Pembiasan (i < c)', ''], genting: ['Hampir sudut genting (i ≈ c)', 'warn'], pdp: ['Pantulan dalam penuh (i > c)', 'ok'],
    bocor: ['Cahaya bocor (i < c)', 'bad'], separa: ['Serakan + pantulan dalam titisan', 'ok'], lurus: ['Sinar lurus sepanjang paksi', '']
  };
  function setTele(items) {
    byId('tele').innerHTML = items.map(([l, v, q]) => `<div><dt>${l}</dt><dd class="${q ? 'q' : ''}">${v}</dd></div>`).join('');
  }
  const deg1 = (x, d) => (x == null ? 'Tiada' : fx(x, d == null ? 1 : d) + '°');
  function readouts(q) {
    const sc = S.sc, cDp = sc === 'logamaya' ? 2 : 1, iDp = sc === 'logamaya' ? 2 : 1;
    // kotak sudut genting
    byId('kVal').textContent = hid('c') ? '?' : q.c == null ? 'Tiada' : fx(q.c, cDp) + '°';
    byId('kUnit').textContent = hid('n') ? 'sin c = n₂ ÷ n₁'
      : q.c == null ? (sc === 'logamaya' ? 'Udara dekat jalan tidak lebih panas (n₂ ≥ n₁)' : 'n₁ ≤ n₂: pantulan dalam penuh tidak boleh berlaku')
      : sc === 'logamaya' ? `sin c = ${fx(q.n2, 6)} ÷ ${fx(q.n1, 6)}`
      : `sin c = ${fx(q.n2, 2)} ÷ ${fx(q.n1, 2)}`;
    const lo = sc === 'logamaya' ? 89 : 0, span = 90 - lo;
    const iv = q.i == null ? 0 : q.i;
    byId('kBar').style.width = clamp((iv - lo) / span, 0, 1) * 100 + '%';
    byId('kBarWrap').classList.toggle('is-tir', !!(q.tir && q.c != null && !hid('c')));
    const km = byId('kMark'); km.hidden = q.c == null || hid('c'); if (q.c != null) km.style.left = clamp((q.c - lo) / span, 0, 1) * 100 + '%';
    const cmp = q.c == null || q.i == null ? '' : q.i > q.c + 1e-6 ? 'i > c' : Math.abs(q.i - q.c) < 0.5 ? 'i ≈ c' : 'i < c';
    byId('kMini').innerHTML = `<span>i = ${q.i == null ? '–' : fx(q.i, iDp) + '°'}</span><span>${hid('c') ? '' : cmp}</span>`;
    const H = (f, v) => [hid(f) ? '?' : v, hid(f)];
    let it = [];
    if (sc === 'blok') {
      it = [['Sudut tuju, i', deg1(q.i)], ['Sudut bias, r', ...H('r', q.tir ? 'Tiada' : deg1(q.r))], ['n blok, n₁', ...H('n', fx(q.n1, 2))], ['n udara, n₂', '1.00'],
        ['v blok (10⁸ m s⁻¹)', ...H('v', fv(q.n1))], ['Cahaya dipantul', pct(q.R)], ['Medium', ...H('medname', MEDIA[keyA()].ms)], ['Panjang gelombang', lam() + ' nm']];
    } else if (sc === 'pelangi') {
      it = [['Sudut tuju, i', deg1(q.i)], ['Sudut bias, r', ...H('r', deg1(q.r))], ['Sudut tuju di belakang titisan', ...H('r', deg1(q.iBack))], ['n titisan', fx(q.n1, 3)],
        ['Sudut pelangi warna ini', deg1(q.theta)], ['Cahaya dipantul di belakang', pct(q.R)], ['Sudut pelangi merah', deg1(q.thR)], ['Sudut pelangi ungu', deg1(q.thV)]];
    } else if (sc === 'logamaya') {
      const m = q.mir;
      it = [['Suhu jalan', P().b + ' °C'], ['Suhu udara atas', '30 °C'], ['n lapisan atas', fx(m.nTop, 6)], ['n lapisan bawah', fx(m.nBot, 6)],
        ['Sudut tuju atas, i', deg1(q.i, 2)], ['Sudut terdalam dicapai', deg1(m.iDeep, 2)], ['Beza n (× 10⁻⁵)', fx((m.nTop - m.nBot) * 1e5, 2)], ['Keadaan', m.tir ? 'Logamaya' : 'Tiada logamaya']];
    } else if (sc === 'periskop') {
      it = [['n prisma', ...H('n', fx(q.n1, 2))], ['Kecondongan sinar', deg1(P().a, 0)], ['i di hipotenus prisma 1', deg1(q.i)], ['i di hipotenus prisma 2', deg1(q.i2)],
        ['Prisma 1', q.t1 ? 'Pantulan dalam penuh' : 'Bocor'], ['Prisma 2', q.t2 ? 'Pantulan dalam penuh' : q.i2 == null ? 'Tiada cahaya' : 'Bocor'], ['v prisma (10⁸ m s⁻¹)', ...H('v', fv(q.n1))], ['Imej', q.tir ? 'Tegak, terang' : 'Malap / tiada']];
    } else if (sc === 'gentian') {
      it = [['Sudut masuk, θ', deg1(P().a, 0)], ['Sudut bias di teras, r', ...H('r', deg1(q.r))], ['n teras, n₁', ...H('n', fx(q.n1, 2))], ['n pelapisan, n₂', ...H('n', fx(q.n2, 2))],
        ['i di sempadan teras–pelapisan', deg1(q.i)], ['Sudut masuk maksimum', q.tmax ? deg1(q.tmax) : 'Tiada'], ['v teras (10⁸ m s⁻¹)', ...H('v', fv(q.n1))], ['Keadaan', q.state === 'bocor' ? 'Bocor' : 'Terkurung']];
    } else if (sc === 'matakucing') {
      it = [['n prisma', ...H('n', fx(q.n1, 2))], ['Kecondongan sinar', deg1(P().a, 0)], ['i di permukaan 1', deg1(q.i)], ['i di permukaan 2', deg1(q.i2)],
        ['Sudut sinar balik dengan sinar tuju', q.back == null ? 'Bocor' : deg1(q.back)], ['Keadaan', q.tir ? 'Dipantul balik' : 'Bocor'], ['v prisma (10⁸ m s⁻¹)', ...H('v', fv(q.n1))], ['Panjang gelombang', lam() + ' nm']];
    }
    setTele(it);
    const chip = byId('statusChip');
    let [txt, cls] = STATE_TXT[q.state] || ['', ''];
    if (sc === 'logamaya') [txt, cls] = q.tir ? ['Logamaya terbentuk (i > c)', 'ok'] : q.c == null ? ['Tiada logamaya (jalan sejuk)', ''] : ['Tiada logamaya (i < c)', ''];
    chip.textContent = txt; chip.className = 'pdp-chip ' + cls;
    if (S.lastState && S.lastState !== q.state) {
      if (q.state === 'pdp' && (sc === 'blok' || sc === 'logamaya')) toast(sc === 'logamaya' ? '✨ <b>Logamaya terbentuk!</b> Pantulan dalam penuh dalam udara panas.' : T.toastPdp);
      if (q.state === 'bocor') toast(T.toastLeak);
    }
    S.lastState = q.state;
  }

  /* ================= JADUAL ================= */
  function recordNow() {
    if (!settled()) return toast(T.toastWait);
    const q = info();
    const st = q.state === 'pdp' ? 'PDP' : q.state === 'bocor' ? 'Bocor' : q.r != null && S.sc !== 'pelangi' ? `r = ${fx(q.r, 1)}°` : 'Bias';
    const row = { sc: SC[S.sc].ms, nrel: q.nrel, i: q.i, c: q.c, st, dp: S.sc === 'logamaya' ? 2 : 1 };
    if (S.rec.some(r => r.sc === row.sc && Math.abs(r.nrel - row.nrel) < 1e-9 && Math.abs((r.i || 0) - (row.i || 0)) < 0.01)) return toast(T.toastDup);
    S.rec.push(row); toast(T.toastRec); renderTable(); S.dirty = true;
  }
  function renderTable() {
    const n = S.rec.length, cnt = byId('tab-record-count'); cnt.hidden = !n; cnt.textContent = n;
    byId('tRows').innerHTML = n ? S.rec.map((r, k) => `<tr><td>${k + 1}</td><td style="text-align:left">${r.sc}</td><td>${hid('n') ? '?' : fx(r.nrel, r.dp === 2 ? 5 : 2)}</td><td>${r.i == null ? '–' : fx(r.i, r.dp)}</td><td>${hid('c') ? '?' : r.c == null ? '–' : fx(r.c, r.dp)}</td><td>${r.st}</td></tr>`).join('')
      : '<tr class="empty"><td colspan="6">Belum ada data. Tekan Rekod data.</td></tr>';
  }

  /* ================= KANVAS ================= */
  const stage = byId('stage'), sctx = stage.getContext('2d');
  const gcan = byId('graph'), gctx = gcan.getContext('2d');
  let W = 0, H = 0, GW = 0, GH = 0, XF = { s: 1, ox: 0, oy: 0 };
  function resize() {
    const wrap = byId('stageWrap'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = wrap.clientWidth; H = wrap.clientHeight;
    stage.width = Math.round(W * dpr); stage.height = Math.round(H * dpr); sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gw = byId('graphWrap'); GW = gw.clientWidth; GH = gw.clientHeight;
    gcan.width = Math.round(GW * dpr); gcan.height = Math.round(GH * dpr); gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S.dirty = true;
  }
  function fit(b) {
    const [x0, x1, y0, y1] = b, dh = H, pad = 12;
    const s = Math.min((W - pad * 2) / (x1 - x0), (dh - pad * 2) / (y1 - y0));
    XF = { s, ox: (W - (x1 - x0) * s) / 2 - x0 * s, oy: (dh - (y1 - y0) * s) / 2 - y0 * s };
  }
  const tx = p => [XF.ox + p[0] * XF.s, XF.oy + p[1] * XF.s];
  const itx = (x, y) => [(x - XF.ox) / XF.s, (y - XF.oy) / XF.s];

  function pill(ctx, text, x, y, o = {}) {
    ctx.font = `${o.w || 800} ${o.s || 12}px ${FONT}`;
    const w = ctx.measureText(text).width + 12, h = (o.s || 12) + 8;
    const px = x - (o.align === 'right' ? w : o.align === 'center' ? w / 2 : 0);
    ctx.fillStyle = o.bg || 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.roundRect(px, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.fillStyle = o.color || '#252137'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(text, px + 6, y + 0.5);
  }
  function line(ctx, pts, color, w, alpha, dash) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.restore();
  }
  function ray(ctx, pts, col, n, alpha, wid) {
    const w = wid || 3.4;
    line(ctx, pts, 'rgba(37,33,55,.55)', w + 2.6, alpha * .3);
    line(ctx, pts, col, w + 5, alpha * .16);
    line(ctx, pts, col, w, alpha);
    if (S.opt.pulse && alpha > .5) { ctx.save(); ctx.setLineDash([5, 20]); ctx.lineDashOffset = -S.phase / n; line(ctx, pts, '#fff', Math.max(1.2, w * .55), alpha * .9); ctx.restore(); }
  }
  function grid(ctx, dh) {
    ctx.fillStyle = MEDIA.udara.tint; ctx.fillRect(0, 0, W, dh);
    ctx.strokeStyle = 'rgba(37,33,55,.06)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x < W; x += 28) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, dh); }
    for (let y = 0; y < dh; y += 28) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
    ctx.stroke();
  }
  function tintOf(role) {
    if (role === 'J') return '#3b3550';
    const k = role === 'B' ? keyB() : keyA();
    return hid('medname') && role === 'A' ? '#ece6f5' : MEDIA[k].tint;
  }
  function drawShapes(ctx, sco) {
    sco.shapes.forEach(sh => {
      ctx.beginPath();
      if (sh.t === 'semi') { const c = tx(sh.c); ctx.arc(c[0], c[1], sh.R * XF.s, 0, Math.PI); ctx.closePath(); }
      else if (sh.t === 'circle') { const c = tx(sh.c); ctx.arc(c[0], c[1], sh.R * XF.s, 0, Math.PI * 2); }
      else sh.pts.forEach((p, i) => { const q = tx(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
      ctx.closePath();
      ctx.fillStyle = tintOf(sh.role); ctx.fill();
      if (sh.role !== 'J') {
        ctx.strokeStyle = 'rgba(37,33,55,.45)'; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.save(); ctx.clip(); const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
      }
    });
  }
  function drawRuns(ctx, runs, col, opts) {
    opts = opts || {};
    runs.forEach(run => {
      run.res.segs.forEach((sg, si) => {
        if (!sg.main && !S.opt.refl) return;
        if (opts.skipFirst && si === 0) return;
        const a = sg.main ? (opts.alpha || 1) : clamp(Math.sqrt(sg.I) * 1.1, .12, .7) * (opts.alpha || 1);
        ray(ctx, [tx(sg.a), tx(sg.b)], col, sg.n, a, sg.main ? opts.w : 2.2);
      });
    });
  }
  function normals(ctx, evs, lim) {
    if (!S.opt.normal) return;
    evs.slice(0, lim || 6).forEach(e => {
      if (e.absorb) return;
      const L = Math.min(1.3, 2.4) * XF.s, p = tx(e.p);
      line(ctx, [[p[0] - e.N[0] * L, p[1] - e.N[1] * L], [p[0] + e.N[0] * L, p[1] + e.N[1] * L]], 'rgba(37,33,55,.55)', 1.4, 1, [7, 6]);
    });
  }
  function arcBetween(ctx, p, u, v, r, col) {
    const a1 = Math.atan2(u[1], u[0]); let d = Math.atan2(v[1], v[0]) - a1;
    while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    ctx.save(); ctx.strokeStyle = col || '#252137'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], r, a1, a1 + d, d < 0); ctx.stroke(); ctx.restore();
    return a1 + d / 2;
  }
  function protractor(ctx, c, R, N) {
    const ang = Math.atan2(N[1], N[0]) + Math.PI / 2;
    ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(37,33,55,.4)'; ctx.fillStyle = 'rgba(37,33,55,.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke();
    for (let a = 0; a < 360; a += 5) { const q = rad(a), L = a % 10 === 0 ? 8 : 4; ctx.beginPath(); ctx.moveTo(Math.sin(q) * R, -Math.cos(q) * R); ctx.lineTo(Math.sin(q) * (R - L), -Math.cos(q) * (R - L)); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.translate(c[0], c[1]);
    ctx.font = `700 9.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(37,33,55,.7)';
    [30, 60].forEach(a => [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sy]) => { const q = rad(a), v = V.rot([sx * Math.sin(q) * (R + 12), -sy * Math.cos(q) * (R + 12)], ang); ctx.fillText(a, v[0], v[1]); }));
    ctx.restore();
  }
  function keyAngles(ctx, q) {
    (q.keys || []).forEach(k => {
      const e = k.ev, p = tx(e.p), back = [-e.d[0], -e.d[1]], rr = clamp(XF.s * .7, 26, 40);
      const pr = S.sc === 'blok' ? clamp(XF.s * 1.25, 48, 74) : clamp(XF.s * .8, 36, 52);
      if (k.prot && S.opt.prot) protractor(ctx, p, pr, e.N);
      if (k.crit && S.opt.crit && q.c != null && !hid('c')) {
        const sgn = Math.sign(V.cross(e.N, back)) || 1, dir = V.rot(e.N, sgn * rad(q.c)), L = S.sc === 'gentian' ? clamp(XF.s * .9, 36, 54) : clamp(XF.s * 1.9, 60, 120);
        line(ctx, [p, [p[0] + dir[0] * L, p[1] + dir[1] * L]], '#d97706', 2.2, .95, [4, 5]);
        pill(ctx, `c ${fx(q.c, 1)}°`, p[0] + dir[0] * (L + 4), p[1] + dir[1] * (L + 4), { align: 'center', s: 10.5, bg: '#fff2e2', color: '#855300' });
      }
      if (e.i > .3) {
        const m = arcBetween(ctx, p, e.N, back, rr);
        pill(ctx, `${k.inL} ${fx(e.i, 1)}°`, p[0] + Math.cos(m) * (rr + 16), p[1] + Math.sin(m) * (rr + 16), { align: 'center', s: 11 });
      }
      if (k.outL && e.r != null && !e.reflected && e.r > .3 && !(hid('r') && k.outL === 'r')) {
        const mN = [-e.N[0], -e.N[1]], m = arcBetween(ctx, p, mN, e.out, rr);
        pill(ctx, `${k.outL} ${fx(e.r, 1)}°`, p[0] + Math.cos(m) * (rr + 16), p[1] + Math.sin(m) * (rr + 16), { align: 'center', s: 11 });
      }
      if (e.tir && S.sc === 'blok') pill(ctx, 'Pantulan dalam penuh', p[0] - e.N[0] * (pr + 18), p[1] - e.N[1] * (pr + 18), { align: 'center', s: 10.5, bg: '#d1fae5', color: '#047857' });
    });
  }
  function laser(ctx, p, d, col, drag) {
    const q = tx(p); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(d[1], d[0]));
    ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.roundRect(-44, -11, 44, 22, 6); ctx.fill();
    ctx.fillStyle = col; ctx.fillRect(-6, -11, 4, 22);
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(-28, 0, 4, 0, 7); ctx.fill(); ctx.restore();
    const h = [q[0] - d[0] * 22, q[1] - d[1] * 22];
    if (drag && !lk('a')) { ctx.save(); ctx.strokeStyle = 'rgba(245,158,11,.85)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(h[0], h[1], 30, 0, 7); ctx.stroke(); ctx.restore(); }
    S.handle = drag ? h : null;
  }
  function eye(ctx, p, ang, s) {
    s = s || 1; ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang || 0);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#252137'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 16 * s, 9 * s, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.arc(0, 0, 4.5 * s, 0, 7); ctx.fill(); ctx.restore();
  }
  function legend(ctx, items) {
    items.forEach((t, k) => pill(ctx, t, W - 10, 18 + k * 26, { align: 'right', s: 12, bg: 'rgba(255,255,255,.85)', color: '#3b3550' }));
  }
  const nTxt = (k, n) => (hid('n') ? '' : `  n = ${fx(n, 2)}`);

  function drawScene(cur) {
    const ctx = sctx, dh = H, q = cur.info, col = WAVES[S.wave].col, sco = cur.main.sco;
    ctx.clearRect(0, 0, W, H);
    fit(sco.bounds);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, dh); ctx.clip();
    grid(ctx, dh);
    const sc = S.sc, kA = keyA();
    if (sc === 'matakucing') {
      const pz = sco.prism, P0 = tx([pz.Pp[0] - .15, pz.Pp[1] - .25]), P1 = tx([pz.R[0] + .35, pz.Q[1] + .25]);
      ctx.fillStyle = '#d9d3e6'; ctx.beginPath(); ctx.roundRect(P0[0], P0[1], P1[0] - P0[0], P1[1] - P0[1], 8); ctx.fill();
      pill(ctx, 'Bekas pemantul', (P0[0] + P1[0]) / 2, P1[1] + 14, { align: 'center', s: 10.5, bg: 'rgba(255,255,255,.85)', color: '#5c5670' });
    }
    if (sc === 'periskop') {
      (sco.walls || []).forEach(w => line(ctx, [tx(w[0]), tx(w[1])], '#3b3550', 5, 1));
      const o = sco.obj, a = tx([o.x, o.y1]), b = tx([o.x, o.y0]);
      line(ctx, [a, b], '#047857', 4, 1);
      ctx.fillStyle = '#047857'; ctx.beginPath(); ctx.moveTo(b[0], b[1] - 8); ctx.lineTo(b[0] - 8, b[1] + 6); ctx.lineTo(b[0] + 8, b[1] + 6); ctx.fill();
      pill(ctx, 'Objek', a[0], a[1] + 18, { align: 'center', s: 11 });
      eye(ctx, tx(sco.eye), Math.PI, 1);
      pill(ctx, q.tir ? 'Imej tegak' : 'Imej malap', tx(sco.eye)[0], tx(sco.eye)[1] + 26, { align: 'center', s: 11, bg: q.tir ? '#d1fae5' : '#ffe3d1', color: q.tir ? '#047857' : '#9f4122' });
    }
    drawShapes(ctx, sco);
    if (sc === 'pelangi') {
      const sp = tx([-5.85, sco.rays[0].p[1]]);
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(sp[0], sp[1], 16, 0, 7); ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(sp[0] + Math.cos(a) * 21, sp[1] + Math.sin(a) * 21); ctx.lineTo(sp[0] + Math.cos(a) * 28, sp[1] + Math.sin(a) * 28); ctx.stroke(); }
      if (S.white) {
        const first = cur.main.runs[0].res.segs[0];
        line(ctx, [tx(first.a), tx(first.b)], 'rgba(37,33,55,.5)', 7, .35); line(ctx, [tx(first.a), tx(first.b)], '#fff', 4.5, 1);
        cur.extra.forEach(x => drawRuns(ctx, x.runs, WAVES[x.wi].col, { skipFirst: true, w: 2.4, alpha: .95 }));
        drawRuns(ctx, cur.main.runs, col, { skipFirst: true, w: 3 });
      } else drawRuns(ctx, cur.main.runs, col);
      if (q.exit) {
        const p = tx(q.exit.p), od = q.exit.out, L = clamp(XF.s * 2.2, 70, 140);
        line(ctx, [p, [p[0] - L, p[1]]], 'rgba(37,33,55,.5)', 1.4, 1, [5, 5]);
        const m = arcBetween(ctx, p, [-1, 0], od, L * .55, col);
        pill(ctx, `θ ${fx(q.theta, 1)}°`, p[0] + Math.cos(m) * (L * .55 + 18) - 10, p[1] + Math.sin(m) * (L * .55 + 18), { align: 'center', s: 11, color: '#252137' });
        let f = 1.6; while (f > .7 && (p[1] + od[1] * L * f > dh - 36 || p[0] + od[0] * L * f < 24)) f -= .1;
        const ep = [p[0] + od[0] * L * f, p[1] + od[1] * L * f];
        if (ep[1] < dh - 20 && ep[0] > 10) { eye(ctx, ep, Math.atan2(od[1], od[0]) + Math.PI, .9); pill(ctx, 'Pemerhati', ep[0], ep[1] + 22, { align: 'center', s: 11 }); }
      }
    } else drawRuns(ctx, cur.main.runs, col);
    const kr = cur.main.runs.find(r => r.key) || cur.main.runs[0];
    normals(ctx, mainEvs(kr), sc === 'gentian' ? 3 : 6);
    keyAngles(ctx, q);
    if (sco.laser) laser(ctx, kr.ray.p, kr.ray.d, col, SC[sc].drag); else S.handle = null;
    if (sc === 'matakucing') {
      const lp = tx(kr.ray.p), d = kr.ray.d, pe = [lp[0] + d[1] * 1.35 * XF.s, lp[1] - d[0] * 1.35 * XF.s];
      ctx.save(); ctx.translate(lp[0], lp[1]); ctx.rotate(Math.atan2(d[1], d[0]));
      const hh = 1.15 * XF.s, gl = ctx.createRadialGradient(0, 0, 2, 0, 0, hh * 1.2);
      gl.addColorStop(0, 'rgba(253,230,138,.9)'); gl.addColorStop(1, 'rgba(253,230,138,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, hh * 1.2, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.fillStyle = '#3b3550'; ctx.beginPath(); ctx.roundRect(-16, -hh, 16, hh * 2, [10, 2, 2, 10]); ctx.fill();
      ctx.fillStyle = '#fde68a'; ctx.fillRect(-3, -hh + 4, 3, hh * 2 - 8); ctx.restore();
      pill(ctx, 'Lampu kenderaan', lp[0] - 10, lp[1] + 1.15 * XF.s + 16, { align: 'center', s: 11 });
      eye(ctx, pe, Math.atan2(d[1], d[0]) + Math.PI, .85);
      pill(ctx, 'Pemandu', pe[0] - 8, pe[1] - 20, { align: 'center', s: 11 });
    }
    if (sc === 'gentian') {
      const f = sco.fib, e = tx([f.x1 + .25, 0]);
      ctx.fillStyle = q.state === 'pdp' || q.state === 'lurus' ? '#fbbf24' : '#cfc7e3';
      ctx.beginPath(); ctx.roundRect(e[0], e[1] - 16, 22, 32, 6); ctx.fill();
      pill(ctx, 'Penerima', e[0] + 11, e[1] + 30, { align: 'center', s: 11 });
      if (q.state === 'bocor') { const lk2 = mainEvs(kr).find(z => z.absorb); if (lk2) { const p = tx(lk2.p); pill(ctx, 'Diserap jaket', p[0], p[1] - 18, { align: 'center', s: 10.5, bg: '#ffe3d1', color: '#9f4122' }); } }
    }
    // legenda
    const lg = [];
    if (sc === 'gentian') { lg.push(`Teras: ${nameOf(S.m.gentianA)}${nTxt(0, q.n1)}`); lg.push(`Pelapisan: ${MEDIA[S.m.gentianB].ms}${nTxt(0, q.n2)}`); }
    else { lg.push(`${nameOf(kA)}${nTxt(0, q.n1)}`); lg.push('Udara  n = 1.00'); }
    legend(ctx, lg);
    ctx.restore();
  }

  function drawMirage(cur) {
    const ctx = sctx, dh = H, m = cur.mir, col = WAVES[S.wave].col;
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, dh); g.addColorStop(0, '#dbe9fb'); g.addColorStop(1, '#f6f3fb');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, dh);
    const roadY = dh * .8, yTop = dh * .42, Y = h => roadY - (h / m.H) * (roadY - yTop);
    // matahari
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(W - 46, 46, 18, 0, 7); ctx.fill();
    // lapisan udara
    m.layers.forEach(L => {
      const t = clamp((L.T - 30) / 50, 0, 1);
      ctx.fillStyle = `rgba(255,${Math.round(214 - t * 60)},${Math.round(170 - t * 90)},${(t * .55).toFixed(3)})`;
      ctx.fillRect(0, Y(L.y1), W, Y(L.y0) - Y(L.y1));
      ctx.strokeStyle = 'rgba(37,33,55,.07)'; ctx.beginPath(); ctx.moveTo(0, Y(L.y1) + .5); ctx.lineTo(W, Y(L.y1) + .5); ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(37,33,55,.3)'; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(0, yTop); ctx.lineTo(W, yTop); ctx.stroke(); ctx.setLineDash([]);
    // kilauan haba
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = 0; x <= W; x += 8) { const y = roadY - 6 - k * 7 + Math.sin(x / 22 + S.phase / 40 + k) * 1.6; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    ctx.restore();
    // jalan
    ctx.fillStyle = '#4a4458'; ctx.fillRect(0, roadY, W, dh - roadY);
    ctx.strokeStyle = '#f5f1e8'; ctx.lineWidth = 3; ctx.setLineDash([26, 18]); ctx.beginPath(); ctx.moveTo(0, (roadY + dh) / 2); ctx.lineTo(W, (roadY + dh) / 2); ctx.stroke(); ctx.setLineDash([]);
    // pokok
    const tx0 = W * .09, treeTop = dh * .12;
    const tree = (x, yb, up, a) => {
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = '#7c5a3a'; ctx.fillRect(x - 5, up ? yb - (yb - treeTop) * .55 : yb, 10, (yb - treeTop) * .55);
      ctx.fillStyle = '#16a34a'; const cy = up ? treeTop + (yb - treeTop) * .25 : yb + (yb - treeTop) * .75;
      ctx.beginPath(); ctx.arc(x, cy, (yb - treeTop) * .26, 0, 7); ctx.fill(); ctx.restore();
    };
    tree(tx0, roadY, true, 1);
    // laluan sinar
    const x0 = W * .24, x1 = W * .78;
    const xs = Math.max(m.xTot, 1e-6), X = x => x0 + (x / xs) * (m.tir ? (x1 - x0) : (x1 - x0) * .55);
    const pts = m.path.map(p => [X(p[0]), Y(p[1])]);
    const start = [tx0, treeTop + (roadY - treeTop) * .08];
    const all = [start].concat(pts);
    if (m.tir) {
      const a = pts[pts.length - 2], b = pts[pts.length - 1], dir = V.norm(V.sub(b, a));
      const ex = [b[0] + dir[0] * (W * .92 - b[0]) / Math.max(dir[0], .05), b[1] + dir[1] * (W * .92 - b[0]) / Math.max(dir[0], .05)];
      const eyeP = [Math.min(W * .92, ex[0]), Math.max(24, ex[1])];
      all.push(eyeP);
      // imej maya
      const back = [eyeP[0] - dir[0] * 2000, eyeP[1] - dir[1] * 2000];
      const tImg = (eyeP[0] - tx0) / (eyeP[0] - back[0]);
      const img = [tx0, eyeP[1] + (back[1] - eyeP[1]) * tImg];
      line(ctx, [eyeP, img], '#7c3aed', 1.8, .9, [6, 6]);
      ctx.save(); ctx.beginPath(); ctx.rect(0, roadY - 40, W, dh - roadY + 40); ctx.clip();
      ctx.globalAlpha = .45; ctx.fillStyle = '#93c5fd'; ctx.beginPath(); ctx.ellipse(img[0] + 30, roadY + 6, 70, 9, 0, 0, 7); ctx.fill(); ctx.restore();
      pill(ctx, 'Imej maya (seperti lopak air)', Math.max(12, img[0] - 10), Math.min(dh - 48, roadY + 18), { s: 11, bg: '#ede9fe', color: '#5b21b6' });
      ray(ctx, all, col, 1, 1);
      eye(ctx, eyeP, Math.atan2(dir[1], dir[0]) + Math.PI, 1);
      pill(ctx, 'Pemerhati', eyeP[0] - 8, eyeP[1] + 22, { align: 'right', s: 11 });
      const tp = pts[m.path.findIndex(p => p[0] === m.turn[0] && p[1] === m.turn[1])] || pts[Math.floor(pts.length / 2)];
      if (S.opt.normal) line(ctx, [[tp[0], tp[1] - 60], [tp[0], tp[1] + 30]], 'rgba(37,33,55,.55)', 1.4, 1, [7, 6]);
      pill(ctx, `Pantulan dalam penuh · i ${fx(m.iDeep, 2)}°`, tp[0], tp[1] + 22, { align: 'center', s: 10.5, bg: '#d1fae5', color: '#047857' });
    } else {
      ray(ctx, all, col, 1, 1);
      const e = pts[pts.length - 1];
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(e[0], e[1], 5, 0, 7); ctx.fill();
      pill(ctx, 'Cahaya sampai ke jalan: tiada logamaya', e[0], e[1] - 22, { align: 'center', s: 10.5, bg: '#fff2e2', color: '#855300' });
    }
    pill(ctx, `Lapisan atas: ${fx(m.layers[11].T, 1)} °C, n = ${fx(m.nTop, 6)}`, W - 10, yTop - 14, { align: 'right', s: 11 });
    pill(ctx, `Dekat jalan: ${fx(m.layers[0].T, 1)} °C, n = ${fx(m.nBot, 6)}`, W - 10, roadY - 14, { align: 'right', s: 11, bg: '#fff2e2', color: '#855300' });
    pill(ctx, 'Skala menegak dibesarkan', 10, 18, { s: 10.5, bg: 'rgba(255,255,255,.8)', color: '#5c5670' });
    S.handle = null;
  }

  function drawGraph(q) {
    const ctx = gctx; ctx.clearRect(0, 0, GW, GH);
    const l = 40, b = 30, t = 12, r = 14, pw = GW - l - r, ph = GH - t - b, xmin = 1, xmax = 2.6;
    const X = v => l + ((v - xmin) / (xmax - xmin)) * pw, Y = v => t + ph - (v / 90) * ph;
    ctx.font = `700 10px ${FONT}`; ctx.fillStyle = '#5c5670'; ctx.strokeStyle = '#ede8f6'; ctx.lineWidth = 1;
    for (let k = 0; k <= 8; k++) { const v = 1 + k * .2; ctx.beginPath(); ctx.moveTo(X(v), t); ctx.lineTo(X(v), t + ph); ctx.stroke(); if (k % 2 === 0) { ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(fx(v, 1), X(v), t + ph + 4); } }
    for (let v = 0; v <= 90; v += 15) { ctx.beginPath(); ctx.moveTo(l, Y(v)); ctx.lineTo(l + pw, Y(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(v, l - 5, Y(v)); }
    ctx.strokeStyle = '#252137'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(l, t); ctx.lineTo(l, t + ph); ctx.lineTo(l + pw, t + ph); ctx.stroke();
    ctx.fillStyle = '#252137'; ctx.font = `800 11px ${FONT}`; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('n₁ ÷ n₂', l + pw, GH - 2);
    ctx.save(); ctx.translate(11, t + 4); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('c (°)', 0, 0); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(l, t - 2, pw + 4, ph + 4); ctx.clip();
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.4; ctx.beginPath();
    for (let v = 1.0001; v <= xmax; v += .01) { const y = Y(deg(Math.asin(1 / v))); v < 1.001 ? ctx.moveTo(X(v), y) : ctx.lineTo(X(v), y); }
    ctx.stroke();
    MKEYS.slice(1).forEach(k => {
      const n = nAt(k, lam()), x = X(n), y = Y(deg(Math.asin(1 / n)));
      ctx.fillStyle = MEDIA[k].dot; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
      if (k === 'air' || k === 'intan' || k === 'flint') { ctx.fillStyle = '#5c5670'; ctx.font = `700 9.5px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(k === 'flint' ? 'Flint' : MEDIA[k].ms, x + 5, y - 3); }
    });
    S.rec.forEach(rw => { if (rw.c != null) { ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#855300'; ctx.beginPath(); ctx.arc(X(Math.min(rw.nrel, xmax)), Y(rw.c), 5, 0, 7); ctx.fill(); ctx.stroke(); } });
    if (q.c != null && !hid('c') && !hid('n')) {
      const x = X(clamp(q.nrel, xmin, xmax)), y = Y(q.c);
      ctx.strokeStyle = 'rgba(37,33,55,.35)'; ctx.setLineDash([2, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, t + ph); ctx.lineTo(x, y); ctx.lineTo(l, y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      if (q.i != null) { const yi = Y(clamp(q.i, 0, 90)); ctx.strokeStyle = '#047857'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 9, yi); ctx.lineTo(x + 9, yi); ctx.stroke(); }
    }
    ctx.restore();
    byId('graphNote').textContent = hid('c') || hid('n') ? 'Graf disembunyikan sebahagian semasa misi.'
      : q.c == null ? 'n₁ ≤ n₂: tiada sudut genting, pantulan dalam penuh tidak boleh berlaku.'
      : `Titik hitam: c = ${fx(q.c, S.sc === 'logamaya' ? 2 : 1)}°. Garis hijau: sudut tuju semasa. Jika garis hijau di atas titik, i > c.`;
  }

  /* ================= INTERAKSI ================= */
  function pointerAngle(e) {
    const rc = stage.getBoundingClientRect(), w = itx(e.clientX - rc.left, e.clientY - rc.top);
    const sco = S.cur && S.cur.main && S.cur.main.sco; if (!sco) return null;
    const v = V.sub(w, sco.pivot);
    if (S.sc === 'blok') return deg(Math.atan2(-v[0], v[1]));
    if (S.sc === 'gentian') return deg(Math.atan2(-v[1], -v[0]));
    return null;
  }
  const nearHandle = (e, pad) => { if (!S.handle) return false; const rc = stage.getBoundingClientRect(); return Math.hypot(e.clientX - rc.left - S.handle[0], e.clientY - rc.top - S.handle[1]) < pad; };
  stage.addEventListener('pointerdown', e => {
    if (!SC[S.sc].drag || lk('a') || !nearHandle(e, e.pointerType === 'touch' ? 52 : 38)) return;
    S.drag = true; stage.setPointerCapture(e.pointerId); stage.style.cursor = 'grabbing'; e.preventDefault();
  });
  stage.addEventListener('pointermove', e => {
    if (S.drag) { const a = pointerAngle(e); if (a != null) setA(a); }
    else stage.style.cursor = SC[S.sc].drag && !lk('a') && nearHandle(e, 38) ? 'grab' : 'default';
  });
  const endDrag = () => { S.drag = false; stage.style.cursor = 'default'; };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('touchstart', e => { if (SC[S.sc].drag && !lk('a') && e.touches[0] && nearHandle(e.touches[0], 52)) e.preventDefault(); }, { passive: false });
  stage.addEventListener('keydown', e => {
    const k = e.shiftKey ? 5 : 1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { nudge(-k); e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { nudge(k); e.preventDefault(); }
  });

  function bindTabGroup(el) {
    const tabs = Array.from(el.querySelectorAll('[role=tab]'));
    const select = t => {
      tabs.forEach(b => { const on = b === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; const p = byId(b.getAttribute('aria-controls')); if (p) { if (on) p.removeAttribute('inert'); else p.setAttribute('inert', ''); } });
      S.dirty = true;
    };
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => select(b));
      b.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; select(n); n.focus(); } });
    });
    return select;
  }
  const selAnalysis = bindTabGroup(byId('analysis-tabs'));
  const selControl = bindTabGroup(byId('pdp-tabs'));

  /* ================= BUNYI & KONFETI ================= */
  let actx = null;
  function beep(f, d, type) { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = .05; g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + d); o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + d); } catch (_) {} }
  const sfx = { ok() { beep(660, .15); setTimeout(() => beep(880, .25), 120); }, err() { beep(200, .2, 'square'); } };
  function confetti() {
    const cv = byId('ghost'), c = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
    const ps = Array.from({ length: 90 }, () => ({ x: innerWidth / 2, y: innerHeight * .4, vx: (Math.random() - .5) * 12, vy: -Math.random() * 12 - 3, c: ['#f59e0b', '#fbbf24', '#7c3aed', '#0e7490', '#047857'][Math.floor(Math.random() * 5)], s: 4 + Math.random() * 5 }));
    let n = 0;
    (function f() { c.clearRect(0, 0, cv.width, cv.height); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .4; c.fillStyle = p.c; c.fillRect(p.x, p.y, p.s, p.s); }); if (++n < 80) requestAnimationFrame(f); else c.clearRect(0, 0, cv.width, cv.height); })();
  }

  /* ================= MISI ================= */
  let prog = { stars: {}, xp: 0 };
  try { const s = localStorage.getItem('pdp-prog-v1'); if (s) prog = JSON.parse(s); } catch (_) {}
  const saveProg = () => { try { localStorage.setItem('pdp-prog-v1', JSON.stringify(prog)); } catch (_) {} };
  const starsHtml = n => [1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('');
  function resetLab() {
    S.sc = 'blok'; S.p = defP(); S.m = defM(); S.role = 0; S.aD = S.p.blok.a; S.wave = 1; S.white = true; byId('tg-white').checked = true;
    S.rec = []; S.locks = {}; S.hide = {}; S.lastState = '';
  }
  function resetNow() { if (S.mission) { startMission(S.mission.i); return; } resetLab(); syncAll(); toast(T.toastReset); }
  function setMode(m) {
    if (S.mode === m) return;
    S.mode = m;
    $$('#modeTabs button').forEach(b => { const on = b.dataset.m === m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    S.mission = null; resetLab(); syncAll(); renderBanner();
    byId('hint').textContent = SC[S.sc].hint; byId('hint').classList.remove('hide');
    if (m === 'chal') openList();
  }
  let winTimer = 0;
  function startMission(i) {
    clearTimeout(winTimer);
    resetLab();
    const d = MIS[i].gen();
    S.mission = { i, d, tries: 0, hint: false, ok: false, hold: 0 };
    d.setup(); S.locks = d.lock || {}; S.hide = d.hide || {}; S.lastState = '';
    closeSheets(); byId('mInput').value = ''; missionFb('', ''); hideHint();
    selAnalysis(byId('tab-graph')); selControl(byId('tab-medium'));
    syncAll(); renderBanner();
    setTimeout(() => byId('missionBar').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
  function missionFb(msg, cls) { const f = byId('mFb'); f.className = 'mfb ' + (cls || ''); f.textContent = msg; }
  function renderBanner() {
    const mb = byId('missionBar'); mb.hidden = S.mode !== 'chal';
    if (S.mode !== 'chal') return;
    const q = S.mission;
    if (!q) { byId('mNum').textContent = '?'; byId('mTitle').textContent = T.mSelectTitle; byId('mStars').innerHTML = ''; byId('mText').innerHTML = T.mEmpty; byId('mAns').hidden = true; byId('mProg').hidden = true; return; }
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

  /* ================= ACARA ================= */
  function bind() {
    byId('slider-a').addEventListener('input', e => setA(+e.target.value));
    byId('slider-b').addEventListener('input', e => { setB(+e.target.value); syncControls(); });
    [['tg-normal', 'normal'], ['tg-crit', 'crit'], ['tg-prot', 'prot'], ['tg-refl', 'refl'], ['tg-pulse', 'pulse']].forEach(([id, k]) => byId(id).addEventListener('change', e => { S.opt[k] = e.target.checked; S.dirty = true; }));
    byId('tg-white').addEventListener('change', e => { S.white = e.target.checked; S.dirty = true; });
    byId('recBtn2').onclick = recordNow;
    byId('clearRec').onclick = () => { S.rec = []; renderTable(); S.dirty = true; };
    byId('resetBtn').onclick = resetNow;
    byId('nudgeM').onclick = () => nudge(-1); byId('nudgeP').onclick = () => nudge(1);
    byId('jumpGraphBtn').onclick = () => { selAnalysis(byId('tab-graph')); byId('graphCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    $$('#modeTabs button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.m)));
    byId('mList').onclick = openList; byId('listClose').onclick = closeSheets;
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
    byId('nTable').innerHTML = '<tr><th>Medium</th><th>n</th><th>c ke udara</th></tr>' + MKEYS.slice(1).map(k => `<tr><td>${MEDIA[k].ms}</td><td>${fx(MEDIA[k].n, 2)}</td><td>${fx(critD(MEDIA[k].n, 1), 1)}°</td></tr>`).join('');
  }

  /* ================= GELUNG ================= */
  let last = performance.now(), lastSig = '';
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    S.phase += dt * 90;
    const tgt = P().a, diff = tgt - S.aD;
    if (Math.abs(diff) > .004) S.aD += diff * (1 - Math.exp(-dt * 16)); else S.aD = tgt;
    S.cur = compute();
    const sig = [S.sc, S.aD.toFixed(3), P().b, keyA(), keyB(), S.wave, S.white, Object.keys(S.hide).join(), S.rec.length].join('|');
    if (sig !== lastSig || S.dirty) { lastSig = sig; readouts(S.cur.info); drawGraph(S.cur.info); S.dirty = false; }
    if (W) { if (S.sc === 'logamaya') drawMirage(S.cur); else drawScene(S.cur); }
    missionTick(dt);
    requestAnimationFrame(frame);
  }
  function init() {
    fillTheoryTable(); bind(); resize(); syncAll(); renderBanner();
    byId('hint').textContent = SC[S.sc].hint;
    window.SIM = { S, api, MIS, startMission, setMode, setSc, setA, setB, recordNow, submitAnswer, compute };
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
