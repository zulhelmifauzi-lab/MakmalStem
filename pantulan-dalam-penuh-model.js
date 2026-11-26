(function (globalScope) {
  'use strict';

  /* ================= UTILITIES ================= */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const rad = d => (d * Math.PI) / 180;
  const deg = r => (r * 180) / Math.PI;
  const TAU = Math.PI * 2;
  const fx = (x, d = 2) => (Math.abs(x) < 1e-12 ? 0 : x).toFixed(d);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const parseNum = s => parseFloat(String(s).replace(',', '.').replace(/[^\d.\-eE]/g, ''));

  /* ================= VEKTOR ================= */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  const len = a => Math.hypot(a[0], a[1]);
  const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
  const rot = (v, t) => [v[0] * Math.cos(t) - v[1] * Math.sin(t), v[0] * Math.sin(t) + v[1] * Math.cos(t)];
  const V = { add, sub, mul, dot, cross, len, norm, rot };

  /* ================= MEDIUM & CAHAYA ================= */
  // n pada 589 nm; A = pekali serakan jenis Cauchy (µm²), anggaran.
  const C = 3.0e8;
  const MKEYS = ['udara', 'air', 'zaitun', 'perspek', 'crown', 'flint', 'intan'];
  const MEDIA = {
    udara:   { ms: 'Udara',         n: 1.00, A: 0,       tint: '#f6f3fb', dot: '#cfc7e3' },
    air:     { ms: 'Air',           n: 1.33, A: 0.0031,  tint: '#d6eafb', dot: '#3b82f6' },
    zaitun:  { ms: 'Minyak zaitun', n: 1.47, A: 0.0049,  tint: '#eef0bd', dot: '#c2b52e' },
    perspek: { ms: 'Perspek',       n: 1.49, A: 0.00447, tint: '#e2e9f3', dot: '#7d9cc0' },
    crown:   { ms: 'Kaca (crown)',  n: 1.52, A: 0.00424, tint: '#d3eee6', dot: '#3fb094' },
    flint:   { ms: 'Kaca (flint)',  n: 1.62, A: 0.00895, tint: '#e0d6f6', dot: '#8467d2' },
    intan:   { ms: 'Intan',         n: 2.42, A: 0.01344, tint: '#e6f8ff', dot: '#4bbbe6' }
  };
  const WAVES = [
    { k: 'merah',  ms: 'Merah',  nm: 650, col: '#e5242b' },
    { k: 'kuning', ms: 'Kuning', nm: 589, col: '#e08a00' },
    { k: 'hijau',  ms: 'Hijau',  nm: 532, col: '#0b9d58' },
    { k: 'biru',   ms: 'Biru',   nm: 470, col: '#2563eb' },
    { k: 'ungu',   ms: 'Ungu',   nm: 405, col: '#7c3aed' }
  ];
  const LAM0 = 0.5893;
  function nAt(key, nm) {
    const m = MEDIA[key];
    if (!m.A) return m.n;
    const l = (nm || 589.3) / 1000;
    return m.n + m.A * (1 / (l * l) - 1 / (LAM0 * LAM0));
  }
  const speedOf = n => C / n;
  // sudut genting (darjah) dari medium n1 ke n2, null jika tiada
  const critD = (n1, n2) => (n2 < n1 ? deg(Math.asin(n2 / n1)) : null);

  /* ================= PENGESAN SINAR 2D ================= */
  const EPS = 1e-7;
  // sisi "hadapan" ialah sisi yang ditunjuk oleh normal N; nf = indeks di sisi hadapan
  function edge(a, b, inPt, nIn, nOut, tag, extra) {
    const e = sub(b, a);
    const N = norm([e[1], -e[0]]);
    const front = dot(sub(inPt, a), N) > 0;
    return Object.assign({ k: 'seg', a, b, N, nf: front ? nIn : nOut, nb: front ? nOut : nIn, tag }, extra || {});
  }
  function poly(pts, nIn, nOut, tags) {
    const c = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
    return pts.map((p, i) => edge(p, pts[(i + 1) % pts.length], c, nIn, nOut, tags ? tags[i] : ''));
  }
  const arcP = (c, R, a0, span, nIn, nOut, tag) => ({ k: 'arc', c, R, a0, span, nf: nOut, nb: nIn, tag });
  const wall = (a, b) => edge(a, b, [0, 0], 1, 1, 'wall', { absorb: true });

  function hit(pr, p, d) {
    if (pr.k === 'seg') {
      const e = sub(pr.b, pr.a), den = cross(d, e);
      if (Math.abs(den) < 1e-12) return null;
      const ap = sub(pr.a, p), t = cross(ap, e) / den, u = cross(ap, d) / den;
      return t > EPS && u >= -1e-9 && u <= 1 + 1e-9 ? { t, N: pr.N, pr } : null;
    }
    const f = sub(p, pr.c), b = dot(f, d), cc = dot(f, f) - pr.R * pr.R, disc = b * b - cc;
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    for (const t of [-b - sq, -b + sq]) {
      if (t <= EPS) continue;
      const v = sub(add(p, mul(d, t)), pr.c);
      let a = Math.atan2(v[1], v[0]) - pr.a0;
      a = ((a % TAU) + TAU) % TAU;
      if (a <= pr.span + 1e-9) return { t, N: mul(v, 1 / pr.R), pr };
    }
    return null;
  }
  function fresnel(n1, n2, cI, cT) {
    const rs = (n1 * cI - n2 * cT) / (n1 * cI + n2 * cT);
    const rp = (n2 * cI - n1 * cT) / (n2 * cI + n1 * cT);
    return (rs * rs + rp * rp) / 2;
  }
  // opt: {n0, policy(idx)->'reflect', maxHits, far, branch, maxDepth, minI}
  function trace(prims, p0, d0, opt) {
    opt = opt || {};
    const segs = [], evs = [];
    const far = opt.far || 60;
    function go(p, d, n, I, depth, main) {
      let idx = 0;
      const maxH = main ? opt.maxHits || 60 : 14;
      for (let k = 0; k < maxH; k++) {
        let best = null;
        for (const pr of prims) { const h = hit(pr, p, d); if (h && (!best || h.t < best.t)) best = h; }
        if (!best) { segs.push({ a: p, b: add(p, mul(d, far)), n, I, main, depth }); return; }
        const q = add(p, mul(d, best.t));
        segs.push({ a: p, b: q, n, I, main, depth });
        let N = best.N, n1, n2;
        if (dot(d, N) < 0) { n1 = best.pr.nf; n2 = best.pr.nb; } else { N = mul(N, -1); n1 = best.pr.nb; n2 = best.pr.nf; }
        const cosI = clamp(-dot(d, N), 0, 1);
        const ev = { p: q, N, d, i: deg(Math.acos(cosI)), n1, n2, tag: best.pr.tag, main, depth, idx: main ? idx : -1 };
        if (best.pr.absorb) { ev.absorb = true; evs.push(ev); return; }
        if (Math.abs(n1 - n2) < 1e-12) { p = add(q, mul(d, 1e-6)); continue; }
        const eta = n1 / n2, s2 = eta * eta * (1 - cosI * cosI);
        const refl = norm(add(d, mul(N, 2 * cosI)));
        if (s2 > 1) {
          ev.tir = true; ev.r = null; ev.R = 1; ev.out = refl; evs.push(ev);
          if (main) idx++;
          d = refl; n = n1; p = add(q, mul(d, 1e-6));
          continue;
        }
        const cosT = Math.sqrt(1 - s2);
        const tr = norm(add(mul(d, eta), mul(N, eta * cosI - cosT)));
        const R = fresnel(n1, n2, cosI, cosT);
        const wantRefl = main && opt.policy && opt.policy(idx) === 'reflect';
        Object.assign(ev, { tir: false, r: deg(Math.acos(cosT)), R, out: wantRefl ? refl : tr, tr, reflected: wantRefl });
        evs.push(ev);
        if (main) idx++;
        if (opt.branch !== false && depth < (opt.maxDepth || 2)) {
          const bd = wantRefl ? tr : refl, bI = wantRefl ? I * (1 - R) : I * R;
          if (bI > (opt.minI || 0.015)) go(add(q, mul(bd, 1e-6)), bd, wantRefl ? n2 : n1, bI, depth + 1, false);
        }
        if (wantRefl) { d = refl; n = n1; } else { d = tr; n = n2; }
        p = add(q, mul(d, 1e-6));
      }
    }
    go(p0, norm(d0), opt.n0 || 1, 1, 0, true);
    return { segs, evs };
  }

  /* ================= SENARIO ================= */
  // P: {a (parameter utama, darjah), nA (medium utama), nB (medium kedua)}
  function scene(sc, P) {
    const nA = P.nA, nB = P.nB || 1;
    if (sc === 'blok') {
      const R = 3, c = [0, 0], i = rad(P.a);
      const d = [Math.sin(i), -Math.cos(i)];
      return {
        prims: [edge([-R, 0], [R, 0], [0, 1], nA, 1, 'flat'), arcP(c, R, 0, Math.PI, nA, 1, 'arc')],
        rays: [{ p: [-4.6 * Math.sin(i), 4.6 * Math.cos(i)], d, key: true }],
        shapes: [{ t: 'semi', c, R, role: 'A' }],
        bounds: [-5.4, 5.4, -4.4, 5.3], pivot: c, laser: true
      };
    }
    if (sc === 'pelangi') {
      const R = 2.3, c = [0.9, -0.2], i = rad(P.a);
      return {
        prims: [arcP(c, R, 0, TAU, nA, 1, 'drop')],
        rays: [{ p: [-6.2, c[1] - R * Math.sin(i)], d: [1, 0], key: true, policy: k => (k === 1 ? 'reflect' : 'refract') }],
        shapes: [{ t: 'circle', c, R, role: 'A' }],
        bounds: [-6.4, 3.8, -3.6, 4.6], drop: { c, R }
      };
    }
    if (sc === 'periskop') {
      const s = 1.7, x0 = -0.85, yt = -3.8, yb = 2.1, t = rad(P.a);
      const A = [x0, yt], B = [x0, yt + s], Cc = [x0 + s, yt + s];
      const D = [x0, yb], E = [x0 + s, yb], F = [x0 + s, yb + s];
      const w = 0.2, L = x0 - w, Rr = x0 + s + w, Tp = yt - w, Bt = yb + s + w;
      const walls = [[[L, Tp], [Rr, Tp]], [[Rr, Tp], [Rr, yb - 0.15]], [[L, yt + s + 0.15], [L, Bt]], [[L, Bt], [Rr, Bt]]];
      const d = [Math.cos(t), Math.sin(t)];
      const rays = [0.28, 0.5, 0.72].map((f, k) => {
        const tg = [x0, yt + s * f];
        return { p: sub(tg, mul(d, 4.3)), d, key: k === 1 };
      });
      return {
        prims: poly([A, B, Cc], nA, 1, ['in1', 'out1', 'hyp1']).concat(poly([D, E, F], nA, 1, ['in2', 'out2', 'hyp2']), walls.map(q => wall(q[0], q[1]))),
        rays, walls,
        shapes: [{ t: 'poly', pts: [A, B, Cc], role: 'A' }, { t: 'poly', pts: [D, E, F], role: 'A' }],
        bounds: [-5.6, 4.4, -4.3, 4.3], obj: { x: -5.15, y0: yt + 0.2, y1: yt + s - 0.2 }, eye: [x0 + s + 2.3, yb + s / 2]
      };
    }
    if (sc === 'gentian') {
      const x0 = -3.6, x1 = 5.8, h = 0.42, hc = 0.3, hj = 0.14, th = rad(P.a);
      const yT = -h - hc, yB = h + hc;
      const prims = [
        edge([x0, -h], [x0, h], [x0 + 1, 0], nA, 1, 'entC'),
        edge([x0, yT], [x0, -h], [x0 + 1, -h - hc / 2], nB, 1, 'entL'),
        edge([x0, h], [x0, yB], [x0 + 1, h + hc / 2], nB, 1, 'entL'),
        edge([x0, -h], [x1, -h], [0, 0], nA, nB, 'cc'),
        edge([x0, h], [x1, h], [0, 0], nA, nB, 'cc'),
        edge([x0, yT], [x1, yT], [0, 0], 1, 1, 'jak', { absorb: true }),
        edge([x0, yB], [x1, yB], [0, 0], 1, 1, 'jak', { absorb: true }),
        edge([x1, -h], [x1, h], [x1 - 1, 0], nA, 1, 'exC'),
        edge([x1, yT], [x1, -h], [x1 - 1, -h - hc / 2], nB, 1, 'exL'),
        edge([x1, h], [x1, yB], [x1 - 1, h + hc / 2], nB, 1, 'exL')
      ];
      const d = [Math.cos(th), Math.sin(th)], E = [x0, 0];
      return {
        prims, rays: [{ p: sub(E, mul(d, 2.1)), d, key: true }],
        shapes: [
          { t: 'poly', pts: [[x0, yT - hj], [x1, yT - hj], [x1, yT], [x0, yT]], role: 'J' },
          { t: 'poly', pts: [[x0, yB], [x1, yB], [x1, yB + hj], [x0, yB + hj]], role: 'J' },
          { t: 'poly', pts: [[x0, yT], [x1, yT], [x1, -h], [x0, -h]], role: 'B' },
          { t: 'poly', pts: [[x0, h], [x1, h], [x1, yB], [x0, yB]], role: 'B' },
          { t: 'poly', pts: [[x0, -h], [x1, -h], [x1, h], [x0, h]], role: 'A' }
        ],
        bounds: [-7.2, 7.3, -2.4, 2.4], pivot: E, laser: true, fib: { x0, x1, h, hc }
      };
    }
    if (sc === 'matakucing') {
      const x = 1.2, s = 1.5, t = rad(P.a);
      const Pp = [x, -s], Q = [x, s], R = [x + s, 0];
      const d = [Math.cos(t), Math.sin(t)];
      const Lr = 5.2 / Math.max(0.5, Math.cos(t));
      const rays = [-0.95, -0.3, 0.55].map((y, k) => ({ p: sub([x, y], mul(d, Lr)), d, key: k === 1 }));
      return {
        prims: poly([Pp, Q, R], nA, 1, ['hyp', 'f2', 'f1']),
        rays, shapes: [{ t: 'poly', pts: [Pp, Q, R], role: 'A' }],
        bounds: [-5.6, 3.6, -3.4, 3.4], prism: { Pp, Q, R }
      };
    }
    return null;
  }

  /* ================= LOGAMAYA (udara berlapis) ================= */
  const nAir = T => 1 + 2.93e-4 * (293.15 / (T + 273.15));
  function mirage(Troad, i0) {
    const L = 12, th = 0.05, Tair = 30;
    const layers = [];
    for (let k = 0; k < L; k++) {
      const ym = (k + 0.5) * th, T = Tair + (Troad - Tair) * Math.exp(-ym / 0.15);
      layers.push({ y0: k * th, y1: (k + 1) * th, T, n: nAir(T) });
    }
    const nTop = layers[L - 1].n, s0 = nTop * Math.sin(rad(i0));
    const path = [[0, L * th]];
    let x = 0, y = L * th, tirK = -1, iDeep = i0;
    for (let k = L - 1; k >= 0; k--) {
      const s = s0 / layers[k].n;
      if (s >= 1) { tirK = k; break; }
      const a = Math.asin(s); iDeep = deg(a);
      x += th * Math.tan(a); y -= th; path.push([x, y]);
    }
    const tir = tirK >= 0;
    const xTurn = x, yTurn = y;
    if (tir) for (let k = tirK + 1; k < L; k++) { x += th * Math.tan(Math.asin(s0 / layers[k].n)); y += th; path.push([x, y]); }
    const nBot = layers[0].n;
    return { layers, path, tir, nTop, nBot, c: nBot < nTop ? deg(Math.asin(nBot / nTop)) : null, iDeep, turn: [xTurn, yTurn], xTot: x, H: L * th };
  }

  const RANKS = [[0, 'Pelatih'], [300, 'Pemerhati Cahaya'], [700, 'Jurutera Gentian'], [1200, 'Pakar Prisma'], [1800, 'Mahaguru Optik']];

  const I18N = {
    ms: {
      toastPdp: '✨ <b>Pantulan dalam penuh!</b> Sudut tuju melebihi sudut genting.',
      toastLeak: '⚠️ Cahaya bocor kerana sudut tuju kurang daripada sudut genting.',
      toastRec: 'Data direkod',
      toastDup: 'Data untuk keadaan ini sudah direkod',
      toastWait: '⏳ Tunggu sinar berhenti bergerak sebelum merekod',
      toastReset: 'Set semula ke keadaan asal',
      errNum: 'Masukkan nombor sebagai jawapan.',
      errTooBig: 'Terlalu besar.',
      errTooSmall: 'Terlalu kecil.',
      errUnit: ' Semak unit dan pastikan kalkulator dalam mod darjah.',
      errTryAgain: 'Cuba lagi (cubaan {n}).',
      errHintTip: ' Tekan 💡 untuk petunjuk.',
      mSelectTitle: 'Pilih misi',
      mEmpty: 'Pilih satu misi daripada senarai untuk bermula. Setiap misi menggunakan nilai rawak, jadi anda boleh ulang berkali-kali.',
      winPerfect: 'Sempurna!', winGood: 'Tahniah!', winRepeat: 'Sudah pernah mencapai bintang ini', winSolution: 'Penyelesaian',
      rankNext: 'XP ke pangkat seterusnya', rankMax: 'pangkat tertinggi!'
    }
  };

  /* ================= MISI ================= */
  function createMissions(api) {
    const list = [];
    const defM = (ic, t, s, gen) => list.push({ ic, t, s, gen });
    const nY = k => nAt(k, 589);
    const SOLID = ['air', 'zaitun', 'perspek', 'crown', 'flint', 'intan'];
    const L0 = { sc: 1, media: 1, wave: 1 };

    defM('📐', 'Sudut Genting Blok', 'sin c = 1 ÷ n', () => {
      const m = pick(SOLID), n = nY(m), c = critD(n, 1);
      return {
        kind: 'num', unit: '°',
        text: () => `Blok semi bulatan diperbuat daripada <b>${MEDIA[m].ms}</b> (n = ${fx(n, 2)}). Kira <b>sudut genting</b> apabila cahaya keluar dari blok ke udara. Jawapan dalam <b>darjah</b>.`,
        setup() { api.setSc('blok', true); api.setWave(1); api.setMed('blok', m); api.setA(15, true); },
        lock: L0, hide: { c: 1 },
        ans: () => c, tol: a => Math.max(0.6, 0.02 * a), need: () => '',
        hint: () => 'Pada sudut genting, sudut bias = 90°. Jadi n sin c = 1.00 × sin 90°, maka sin c = 1 ÷ n.',
        expl: () => `sin c = 1 ÷ ${fx(n, 2)} = ${fx(1 / n, 4)}<br>c = <b>${fx(c, 1)}°</b>`
      };
    });

    defM('💡', 'Cetuskan Pantulan Dalam Penuh', 'Naikkan sudut tuju melebihi c', () => {
      const m = pick(SOLID), c = critD(nY(m), 1);
      return {
        kind: 'state',
        text: () => `Cahaya dari laser masuk ke blok <b>${MEDIA[m].ms}</b> dan keluar ke udara. Naikkan sudut tuju sehingga <b>pantulan dalam penuh</b> berlaku, iaitu tiada sinar bias keluar ke udara. Tahan sebentar.`,
        setup() { api.setSc('blok', true); api.setWave(1); api.setMed('blok', m); api.setA(10, true); },
        lock: L0, hide: { c: 1 },
        check: () => api.settled() && api.info().state === 'pdp',
        hint: () => 'Pantulan dalam penuh berlaku apabila cahaya dari medium tumpat ke kurang tumpat dan sudut tuju lebih besar daripada sudut genting.',
        expl: () => `Sudut genting ${MEDIA[m].ms} ialah <b>${fx(c, 1)}°</b>. Apabila i > ${fx(c, 1)}°, semua cahaya dipantul semula ke dalam blok.`
      };
    });

    defM('🎯', 'Tepat pada Sudut Genting', 'Sinar bias menyusur permukaan', () => {
      const m = pick(SOLID), c = critD(nY(m), 1);
      return {
        kind: 'state',
        text: () => `Laraskan sudut tuju sehingga <b>sinar bias hampir menyusur permukaan rata</b> blok ${MEDIA[m].ms} (sudut bias menghampiri 90°), tetapi pantulan dalam penuh <b>belum</b> berlaku. Pada keadaan ini, sudut tuju ≈ sudut genting.`,
        setup() { api.setSc('blok', true); api.setWave(1); api.setMed('blok', m); api.setA(5, true); },
        lock: L0, hide: { c: 1 },
        check: () => { const q = api.info(); return api.settled() && !q.tir && q.c != null && q.c - q.i >= 0 && q.c - q.i <= 1; },
        hint: () => 'Naikkan sudut tuju darjah demi darjah. Berhenti sebelum sinar bias hilang.',
        expl: () => `Sudut genting = sin⁻¹(1 ÷ ${fx(nY(m), 2)}) = <b>${fx(c, 1)}°</b>. Sudut tuju ${Math.floor(c)}° memberi sudut bias hampir 90°.`
      };
    });

    defM('🕵️', 'Medium Misteri', 'Cari n daripada sudut genting', () => {
      const m = pick(SOLID), n = nY(m), c = critD(n, 1);
      return {
        kind: 'num', unit: '',
        text: () => `Bahan blok ini <b>disembunyikan</b>. Cari <b>sudut genting</b> dengan menaikkan sudut tuju sehingga sinar bias hilang, kemudian kira <b>indeks biasan n</b> bahan itu.`,
        setup() { api.setSc('blok', true); api.setWave(1); api.setMed('blok', m); api.setA(10, true); },
        lock: L0, hide: { n: 1, c: 1, medname: 1, mn: 1, v: 1 },
        ans: () => n, tol: a => 0.04 * a, need: () => '',
        hint: () => 'n = 1 ÷ sin c. Sudut genting ialah sudut tuju terkecil yang menghasilkan pantulan dalam penuh.',
        expl: () => `Sudut genting ≈ ${fx(c, 1)}°, maka n = 1 ÷ sin ${fx(c, 1)}° = <b>${fx(n, 2)}</b> (${MEDIA[m].ms}).`
      };
    });

    defM('🌈', 'Sudut di Dalam Titisan', 'Hukum Snell pada titisan air', () => {
      const i = pick([40, 50, 60, 70]), n = nY('air'), r = deg(Math.asin(Math.sin(rad(i)) / n));
      return {
        kind: 'num', unit: '°',
        text: () => `Cahaya kuning memasuki titisan air (n = ${fx(n, 2)}) dengan <b>sudut tuju ${i}°</b>. Kira <b>sudut bias r</b> di dalam titisan. Tetapkan sudut tuju ${i}° untuk menyemak. Jawapan dalam <b>darjah</b>.`,
        setup() { api.setSc('pelangi', true); api.setWave(1); api.setMed('pelangi', 'air'); api.setA(20, true); },
        lock: L0, hide: { r: 1 },
        ans: () => r, tol: a => Math.max(0.8, 0.03 * a),
        need: () => (Math.abs(api.getA() - i) <= 1 ? '' : `Tetapkan sudut tuju ${i}° dahulu (sekarang ${fx(api.getA(), 0)}°).`),
        hint: () => 'sin r = sin i ÷ n. Gunakan sin⁻¹ dalam mod darjah.',
        expl: () => `sin r = sin ${i}° ÷ ${fx(n, 2)} = ${fx(Math.sin(rad(i)) / n, 4)}<br>r = <b>${fx(r, 1)}°</b>`
      };
    });

    defM('🔭', 'Baiki Periskop', 'Pilih prisma yang betul', () => ({
      kind: 'state',
      text: () => `Periskop ini menggunakan prisma berisi <b>air</b> (n = 1.33). Cahaya bocor keluar di hipotenus. Pilih <b>bahan prisma lain</b> supaya pantulan dalam penuh berlaku dalam <b>kedua-dua prisma</b>.`,
      setup() { api.setSc('periskop', true); api.setWave(1); api.setMed('periskop', 'air'); api.setA(0, true); },
      lock: { sc: 1, a: 1, wave: 1 }, hide: {},
      check: () => api.settled() && api.info().state === 'pdp',
      hint: () => 'Sudut tuju pada hipotenus ialah 45°. Pantulan dalam penuh memerlukan sudut genting kurang daripada 45°, iaitu n > 1 ÷ sin 45° = 1.41.',
      expl: () => 'Prisma 45°–90°–45° memerlukan c < 45°, maka n > 1.41. Air (c = 48.8°) gagal, manakala perspek, kaca dan intan berjaya.'
    }));

    defM('🧵', 'Sudut Genting Gentian', 'sin c = n₂ ÷ n₁', () => {
      const [a, b] = pick([['flint', 'crown'], ['flint', 'perspek'], ['crown', 'air'], ['intan', 'flint'], ['perspek', 'air'], ['flint', 'zaitun']]);
      const c = critD(nY(a), nY(b));
      return {
        kind: 'num', unit: '°',
        text: () => `Teras gentian optik diperbuat daripada <b>${MEDIA[a].ms}</b> (n = ${fx(nY(a), 2)}) dan pelapisannya <b>${MEDIA[b].ms}</b> (n = ${fx(nY(b), 2)}). Kira <b>sudut genting</b> di sempadan teras–pelapisan. Jawapan dalam <b>darjah</b>.`,
        setup() { api.setSc('gentian', true); api.setWave(1); api.setMed('gentianA', a); api.setMed('gentianB', b); api.setA(20, true); },
        lock: L0, hide: { c: 1 },
        ans: () => c, tol: x => Math.max(0.6, 0.02 * x), need: () => '',
        hint: () => 'Pada sempadan teras–pelapisan, sin c = n pelapisan ÷ n teras.',
        expl: () => `sin c = ${fx(nY(b), 2)} ÷ ${fx(nY(a), 2)} = ${fx(nY(b) / nY(a), 4)}<br>c = <b>${fx(c, 1)}°</b>`
      };
    });

    defM('🔒', 'Kurung Cahaya', 'Pilih pelapisan gentian', () => ({
      kind: 'state',
      text: () => `Sinar memasuki gentian pada <b>sudut 45°</b> dan bocor ke pelapisan. Teras ialah <b>Kaca (flint)</b>. Pilih bahan <b>pelapisan</b> supaya cahaya terkurung di dalam teras hingga ke hujung gentian.`,
      setup() { api.setSc('gentian', true); api.setWave(1); api.setMed('gentianA', 'flint'); api.setMed('gentianB', 'crown'); api.setA(45, true); },
      lock: { sc: 1, a: 1, wave: 1, med_gentianA: 1 }, hide: {},
      check: () => api.settled() && api.info().state === 'pdp',
      hint: () => 'Pelapisan mesti mempunyai indeks biasan yang lebih kecil supaya sudut genting cukup kecil. Bandingkan sudut tuju di sempadan dengan c.',
      expl: () => {
        const r = deg(Math.asin(Math.sin(rad(45)) / nY('flint'))), i = 90 - r;
        return `Di dalam teras, r = ${fx(r, 1)}°, jadi sudut tuju di sempadan = 90° − r = ${fx(i, 1)}°.<br>Perlu c < ${fx(i, 1)}°, maka n pelapisan < ${fx(nY('flint'), 2)} × sin ${fx(i, 1)}° = <b>${fx(nY('flint') * Math.sin(rad(i)), 2)}</b> (contoh: air atau udara).`;
      }
    }));

    defM('🌤️', 'Cipta Logamaya', 'Panaskan permukaan jalan', () => ({
      kind: 'state',
      text: () => `Sudut tuju sinar dari langit ditetapkan <b>89.60°</b>. Naikkan <b>suhu permukaan jalan</b> sehingga <b>logamaya</b> terbentuk, iaitu sinar dipantul dalam penuh oleh lapisan udara panas dan sampai ke mata.`,
      setup() { api.setSc('logamaya', true); api.setWave(1); api.setA(89.6, true); api.setB(35, true); },
      lock: { sc: 1, a: 1, wave: 1 }, hide: {},
      check: () => api.settled() && api.info().tir,
      hint: () => 'Udara panas kurang tumpat (n kecil). Semakin panas jalan, semakin besar beza n, maka sudut genting semakin kecil.',
      expl: () => 'Apabila jalan cukup panas, sudut genting antara udara atas dan udara panas di bawah menjadi kurang daripada 89.60°, lalu berlaku pantulan dalam penuh. Mata melihat imej langit di atas jalan seperti lopak air.'
    }));

    defM('🚗', 'Had Pemantul Mata Jalan', 'Cari kecondongan maksimum', () => {
      const m = pick(['perspek', 'crown', 'flint']);
      const tmin = api.leakTilt(m), c = critD(nY(m), 1);
      return {
        kind: 'state',
        text: () => `Pemantul ini menggunakan prisma <b>${MEDIA[m].ms}</b>. Condongkan sinar lampu kereta perlahan-lahan sehingga cahaya <b>mula bocor</b> keluar dari belakang prisma. Berhenti pada kecondongan <b>terkecil</b> yang menyebabkan kebocoran.`,
        setup() { api.setSc('matakucing', true); api.setWave(1); api.setMed('matakucing', m); api.setA(0, true); },
        lock: L0, hide: {},
        check: () => { const q = api.info(); return api.settled() && q.state === 'bocor' && Math.abs(api.getA()) <= tmin + 1; },
        hint: () => 'Gunakan butang −1° atau +1°. Perhatikan sudut tuju pada permukaan 1 dan 2 berbanding sudut genting.',
        expl: () => `Kebocoran bermula pada kecondongan kira-kira <b>${tmin}°</b>. Ketika itu sudut tuju pada salah satu permukaan prisma menjadi kurang daripada sudut genting ${fx(c, 1)}°.`
      };
    });

    return list;
  }

  const exported = {
    clamp, rad, deg, fx, rnd, pick, parseNum, V, C, MKEYS, MEDIA, WAVES, nAt, speedOf, critD,
    edge, poly, arcP, trace, scene, nAir, mirage, RANKS, I18N, createMissions
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (globalScope) globalScope.PdpModel = exported;
})(typeof window !== 'undefined' ? window : globalThis);
