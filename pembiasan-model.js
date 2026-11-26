(function (globalScope) {
  'use strict';

  /* ================= UTILITIES ================= */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rad = d => (d * Math.PI) / 180;
  const deg = r => (r * 180) / Math.PI;
  const fx = (x, d = 2) => (Math.abs(x) < 1e-9 ? 0 : x).toFixed(d);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const sg = (x, n = 3) => {
    if (!isFinite(x)) return '–';
    const a = Math.abs(x);
    if (a === 0) return '0';
    return x.toFixed(clamp(n - 1 - Math.floor(Math.log10(a)), 0, 5));
  };
  function parseNum(s) {
    return parseFloat(String(s).replace(',', '.').replace(/[^\d.\-eE]/g, ''));
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    const e = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / e;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * e;
  }

  /* ================= MEDIA & LIGHT ================= */
  // n pada 589 nm (garis D natrium). A = pekali serakan jenis Cauchy (µm²), anggaran daripada nombor Abbe.
  const C = 3.0e8;
  const MKEYS = ['udara', 'zaitun', 'perspek', 'crown', 'flint', 'intan'];
  const MEDIA = {
    udara:   { ms: 'Vakum / udara',  n: 1.00, A: 0,       tint: '#f6f3fb', dot: '#cfc7e3' },
    zaitun:  { ms: 'Minyak zaitun',  n: 1.47, A: 0.0049,  tint: '#eef0bd', dot: '#c2b52e' },
    perspek: { ms: 'Perspek',        n: 1.49, A: 0.00447, tint: '#d9ebf8', dot: '#5b9fd3' },
    crown:   { ms: 'Kaca (crown)',   n: 1.52, A: 0.00424, tint: '#d3eee6', dot: '#3fb094' },
    flint:   { ms: 'Kaca (flint)',   n: 1.62, A: 0.00895, tint: '#e0d6f6', dot: '#8467d2' },
    intan:   { ms: 'Intan',          n: 2.42, A: 0.01344, tint: '#e3f6ff', dot: '#4bbbe6' }
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

  /* ================= REFRACTION PHYSICS ================= */
  function fresnel(na, nb, ta, tb) {
    const ca = Math.cos(ta), cb = Math.cos(tb);
    const ds = na * ca + nb * cb, dp = nb * ca + na * cb;
    const rs = Math.abs(ds) < 1e-12 ? -1 : (na * ca - nb * cb) / ds;
    const rp = Math.abs(dp) < 1e-12 ? 1 : (nb * ca - na * cb) / dp;
    return (rs * rs + rp * rp) / 2;
  }

  // ns: indeks bias setiap medium (2 atau 3), iDeg: sudut tuju dalam medium 1
  function trace(ns, iDeg) {
    const N = ns.length, i = rad(iDeg), s0 = ns[0] * Math.sin(i);
    const th = [i], R = [0];
    let tirAt = 0;
    for (let k = 1; k < N; k++) {
      const s = s0 / ns[k];
      if (s > 1 + 1e-12) { tirAt = k; R[k] = 1; break; }
      const tb = Math.asin(Math.min(1, s));
      R[k] = fresnel(ns[k - 1], ns[k], th[k - 1], tb);
      th.push(tb);
    }
    return { th, R, tirAt, s0 };
  }

  // sudut genting bagi antara muka antara medium a ke b (darjah) atau null
  const critPair = (na, nb) => (nb < na ? deg(Math.asin(nb / na)) : null);
  // sudut tuju paling kecil (dalam medium 1) yang menyebabkan pantulan dalam penuh pada mana-mana antara muka
  function critOverall(ns) {
    const mn = Math.min(...ns.slice(1));
    return mn < ns[0] ? deg(Math.asin(mn / ns[0])) : null;
  }

  function fitSlope(rows) {
    const r = (rows || []).filter(q => isFinite(q.x) && isFinite(q.y));
    if (r.length < 2) return null;
    let a = 0, b = 0;
    r.forEach(q => { a += q.x * q.y; b += q.x * q.x; });
    return b > 0 ? a / b : null;
  }

  /* ================= APPARENT DEPTH ================= */
  // Objek pada kedalaman nyata d (cm) dalam medium n; pemerhati di udara pada sudut pandang thA (darjah)
  function depthApp(n, d, thADeg) {
    const ta = rad(Math.max(thADeg, 0));
    if (ta < 1e-4) return d / n;
    const tm = Math.asin(Math.sin(ta) / n);
    return (d * Math.tan(tm)) / Math.tan(ta);
  }

  const RANKS = [
    [0, 'Pelatih'],
    [300, 'Penyelidik Cahaya'],
    [700, 'Jurutera Optik'],
    [1200, 'Saintis Snell'],
    [1800, 'Pakar Pembiasan']
  ];

  /* ================= COPY (Bahasa Melayu) ================= */
  const I18N = {
    ms: {
      docTitle: 'Pembiasan Cahaya (BETA) — Makmal STEM Fizik',
      statusIdle: 'Sudut tuju 0°',
      statusRefr: '✓ Pembiasan cahaya',
      statusTir: '⚠ Pantulan dalam penuh',
      statusDepth: '✓ Dalam nyata dan dalam ketara',
      toastTir: '⚠️ <b>Pantulan dalam penuh!</b> Sudut tuju melebihi sudut genting.',
      toastRec: 'Data direkod',
      toastNoRefr: 'Tiada pembiasan kerana pantulan dalam penuh. Kurangkan sudut tuju dahulu.',
      toastDup: 'Data untuk sudut ini sudah direkod',
      toastWait: '⏳ Tunggu sinar berhenti bergerak sebelum merekod',
      toastCount3: 'Tiga medium: lapisan 1, 2 dan 3 disusun dari atas ke bawah',
      toastReset: 'Set semula ke keadaan asal',
      errNum: 'Masukkan nombor sebagai jawapan.',
      errTooBig: 'Terlalu besar.',
      errTooSmall: 'Terlalu kecil.',
      errUnit: ' Semak unit dan sama ada anda menggunakan darjah, bukan radian.',
      errTryAgain: 'Cuba lagi (cubaan {n}).',
      errHintTip: ' Tekan 💡 untuk petunjuk.',
      mSelectTitle: 'Pilih misi',
      mEmpty: 'Pilih satu misi daripada senarai untuk bermula. Setiap misi menggunakan nilai rawak, jadi anda boleh ulang berkali-kali.',
      winPerfect: 'Sempurna!',
      winGood: 'Tahniah!',
      winRepeat: 'Sudah pernah mencapai bintang ini',
      winSolution: 'Penyelesaian',
      rankNext: 'XP ke pangkat seterusnya',
      rankMax: 'pangkat tertinggi!',
      targetFlag: 'SASARAN'
    }
  };

  /* ================= MISSIONS ================= */
  function createMissions(api) {
    const list = [];
    const defM = (ic, t, s, gen) => list.push({ ic, t, s, gen });
    const ALL = { count: 1, media: 1, view: 1, wave: 1 };
    const NA = MKEYS.slice(1); // bukan udara
    const nOf = k => MEDIA[k].n;
    const rOf = (n1, n2, i) => deg(Math.asin((n1 * Math.sin(rad(i))) / n2));

    defM('📐', 'Baca Sudut Bias', 'Hukum Snell dan protraktor', () => {
      const m = pick(NA), i = pick([20, 25, 30, 35, 40, 45, 50, 55, 60]);
      const r = rOf(1, nOf(m), i);
      return {
        kind: 'num', unit: '°', icon: '📐',
        text: () => `Cahaya merambat dari <b>udara</b> ke <b>${MEDIA[m].ms}</b> (n = ${fx(nOf(m), 2)}) dengan <b>sudut tuju ${i}°</b>. Kira <b>sudut bias</b>, kemudian tetapkan sudut tuju itu dan semak dengan protraktor. Jawapan dalam <b>darjah</b>.`,
        setup() { api.setView('refr'); api.setCount(2); api.setMed(0, 'udara'); api.setMed(1, m); api.setI(10, true); },
        lock: ALL, hide: { r: 1 },
        ans: () => r,
        tol: a => Math.max(1.0, 0.03 * a),
        need: () => Math.abs(api.getI() - i) <= 1 ? '' : `Tetapkan sudut tuju ${i}° dahulu (sekarang ${fx(api.getI(), 0)}°).`,
        hint: () => 'Guna n₁ sin i = n₂ sin r, jadi sin r = (n₁ ÷ n₂) × sin i. Kemudian guna sin⁻¹ pada kalkulator dalam mod darjah.',
        expl: () => `sin r = (1.00 ÷ ${fx(nOf(m), 2)}) × sin ${i}° = ${fx(Math.sin(rad(i)) / nOf(m), 4)}<br>r = <b>${fx(r, 1)}°</b>`
      };
    });

    defM('🕵️', 'Indeks Bias Misteri', 'Rekod data dan cari kecerunan graf', () => {
      const m = pick(NA);
      return {
        kind: 'num', unit: '', icon: '🕵️',
        text: () => `Medium kedua ini <b>disembunyikan</b>. Ubah sudut tuju, <b>📌 rekod data</b> (sekurang-kurangnya 4 titik), kemudian cari <b>indeks bias n</b> daripada kecerunan graf sin i melawan sin r.`,
        setup() { api.setView('refr'); api.setCount(2); api.setMed(0, 'udara'); api.setMed(1, m); api.setI(20, true); },
        lock: ALL, hide: { n: 1, v: 1, rel: 1, kth: 1, medname: 1, mn: 1, crit: 1 },
        ans: () => nOf(m),
        tol: a => 0.05 * a,
        need: () => api.getRec().length >= 4 ? '' : 'Rekod sekurang-kurangnya 4 set data dahulu (butang 📌 Rekod data).',
        hint: () => 'n = sin i ÷ sin r. Kecerunan garis hijau pada graf ialah n. Cuba sudut tuju berbeza supaya titik tersebar.',
        expl: () => `Graf sin i melawan sin r ialah garis lurus melalui asalan; kecerunan = n.<br>Indeks bias medium ialah <b>${fx(nOf(m), 2)}</b> (${MEDIA[m].ms}).`
      };
    });

    defM('⚡', 'Kelajuan Cahaya', 'v = c ÷ n', () => {
      const m = pick(NA);
      return {
        kind: 'num', unit: '× 10⁸ m s⁻¹', icon: '⚡',
        text: () => `Kelajuan cahaya dalam vakum ialah <b>3.00 × 10⁸ m s⁻¹</b>. Cari <b>kelajuan cahaya dalam ${MEDIA[m].ms}</b> (n = ${fx(nOf(m), 2)}). Jawapan dalam <b>× 10⁸ m s⁻¹</b>.`,
        setup() { api.setView('refr'); api.setCount(2); api.setMed(0, 'udara'); api.setMed(1, m); api.setI(30, true); },
        lock: ALL, hide: { v: 1 },
        ans: () => 3.0 / nOf(m),
        tol: a => Math.max(0.04, 0.03 * a),
        need: () => '',
        hint: () => 'Indeks bias n = c ÷ v, jadi v = c ÷ n.',
        expl: () => `v = c ÷ n = 3.00 × 10⁸ ÷ ${fx(nOf(m), 2)} = <b>${fx(3.0 / nOf(m), 2)} × 10⁸ m s⁻¹</b>`
      };
    });

    defM('🔦', 'Sudut Genting', 'sin c = n₂ ÷ n₁', () => {
      const pairs = [['intan', 'udara'], ['flint', 'udara'], ['crown', 'udara'], ['perspek', 'udara'], ['intan', 'crown'], ['flint', 'perspek'], ['intan', 'zaitun']];
      const [a, b] = pick(pairs);
      const c = deg(Math.asin(nOf(b) / nOf(a)));
      return {
        kind: 'num', unit: '°', icon: '🔦',
        text: () => `Cahaya bergerak dari <b>${MEDIA[a].ms}</b> (n = ${fx(nOf(a), 2)}) ke <b>${MEDIA[b].ms}</b> (n = ${fx(nOf(b), 2)}). Kira <b>sudut genting</b>, kemudian tingkatkan sudut tuju untuk melihat pantulan dalam penuh bermula. Jawapan dalam <b>darjah</b>.`,
        setup() { api.setView('refr'); api.setCount(2); api.setMed(0, a); api.setMed(1, b); api.setI(10, true); },
        lock: ALL, hide: { crit: 1 },
        ans: () => c,
        tol: a2 => Math.max(1.0, 0.025 * a2),
        need: () => '',
        hint: () => 'Pada sudut genting, sudut bias = 90°. Maka n₁ sin c = n₂ sin 90°, jadi sin c = n₂ ÷ n₁.',
        expl: () => `sin c = ${fx(nOf(b), 2)} ÷ ${fx(nOf(a), 2)} = ${fx(nOf(b) / nOf(a), 4)}<br>c = <b>${fx(c, 1)}°</b>`
      };
    });

    defM('🎯', 'Tepat Sasaran', 'Cari sudut tuju untuk sudut bias sasaran', () => {
      const m = pick(NA), it = pick([25, 30, 35, 40, 45, 50, 55, 60, 65]);
      const rt = rOf(1, nOf(m), it);
      return {
        kind: 'state', icon: '🎯', target: { r: rt },
        text: () => `Cahaya dari <b>udara</b> ke <b>${MEDIA[m].ms}</b> (n = ${fx(nOf(m), 2)}). Kira <b>sudut tuju</b> yang memberi <b>sudut bias ${fx(rt, 1)}°</b>, tetapkannya, dan biarkan sinar tepat pada <b>garis sasaran</b>.`,
        setup() { api.setView('refr'); api.setCount(2); api.setMed(0, 'udara'); api.setMed(1, m); api.setI(5, true); },
        lock: ALL, hide: {},
        check: () => api.settled() && Math.abs(api.getTheta(1) - rt) <= 1.0,
        hint: () => 'sin i = n sin r, kerana n₁ = 1.00. Kira i dengan sin⁻¹.',
        expl: () => `sin i = ${fx(nOf(m), 2)} × sin ${fx(rt, 1)}° = ${fx(nOf(m) * Math.sin(rad(rt)), 4)}<br>i ≈ <b>${it}°</b>`
      };
    });

    defM('🧪', 'Pilih Medium', 'Kenal pasti medium daripada sudut bias', () => {
      const m = pick(NA), i = pick([40, 45, 50, 55, 60]);
      const rt = rOf(1, nOf(m), i);
      return {
        kind: 'state', icon: '🧪',
        text: () => `Sudut tuju ditetapkan <b>${i}°</b> dari udara. Medium kedua menghasilkan <b>sudut bias ${fx(rt, 1)}°</b>. Kira <b>n</b> daripada sin i ÷ sin r, bandingkan dengan jadual indeks bias, kemudian <b>pilih medium yang betul</b>.`,
        setup() { api.setView('refr'); api.setCount(2); api.setMed(0, 'udara'); api.setMed(1, NA[(NA.indexOf(m) + 2) % NA.length]); api.setI(i, true); },
        lock: { count: 1, view: 1, wave: 1, i: 1, med0: 1 }, hide: { mn: 1, n: 1, v: 1, rel: 1, kth: 1, r: 1 },
        check: () => api.getMed(1) === m && api.settled(),
        hint: () => 'n = sin i ÷ sin r. Padankan dengan jadual: zaitun 1.47, perspek 1.49, crown 1.52, flint 1.62, intan 2.42.',
        expl: () => `n = sin ${i}° ÷ sin ${fx(rt, 1)}° = ${fx(nOf(m), 2)}<br>Medium ialah <b>${MEDIA[m].ms}</b>.`
      };
    });

    defM('🪞', 'Pantulan Dalam Penuh', 'Lebihi sudut genting', () => {
      const a = pick(['intan', 'flint', 'crown', 'perspek']);
      const b = pick(['udara', 'udara', 'zaitun']);
      const bb = nOf(b) < nOf(a) ? b : 'udara';
      const c = deg(Math.asin(nOf(bb) / nOf(a)));
      return {
        kind: 'state', icon: '🪞',
        text: () => `Cahaya bergerak dari <b>${MEDIA[a].ms}</b> ke <b>${MEDIA[bb].ms}</b>. Tingkatkan sudut tuju sehingga <b>pantulan dalam penuh</b> berlaku, iaitu tiada sinar bias dan semua cahaya dipantulkan. Tahan sudut itu sebentar.`,
        setup() { api.setView('refr'); api.setCount(2); api.setMed(0, a); api.setMed(1, bb); api.setI(10, true); },
        lock: ALL, hide: { crit: 1 },
        check: () => api.isTir() && api.settled(),
        hint: () => 'Pantulan dalam penuh berlaku apabila cahaya bergerak dari medium tumpat ke kurang tumpat dan sudut tuju melebihi sudut genting.',
        expl: () => `Sudut genting c = sin⁻¹(${fx(nOf(bb), 2)} ÷ ${fx(nOf(a), 2)}) = <b>${fx(c, 1)}°</b>. Apabila i > c, berlaku pantulan dalam penuh.`
      };
    });

    defM('🥪', 'Tiga Medium', 'Sudut akhir dalam medium ketiga', () => {
      let m1, m2, m3, i, th;
      do {
        m1 = pick(['udara', 'zaitun', 'perspek', 'crown']);
        m2 = pick(MKEYS); m3 = pick(MKEYS);
        i = pick([30, 35, 40, 45, 50, 55, 60]);
      } while (m1 === m2 || m2 === m3 || m1 === m3 || nOf(m1) * Math.sin(rad(i)) > 0.97 * Math.min(nOf(m2), nOf(m3)));
      th = deg(Math.asin((nOf(m1) * Math.sin(rad(i))) / nOf(m3)));
      return {
        kind: 'num', unit: '°', icon: '🥪',
        text: () => `Cahaya melalui tiga medium: <b>${MEDIA[m1].ms}</b>, <b>${MEDIA[m2].ms}</b>, kemudian <b>${MEDIA[m3].ms}</b>, dengan <b>sudut tuju ${i}°</b>. Kira <b>sudut bias dalam medium ketiga</b>. Tetapkan sudut tuju untuk menyemak. Jawapan dalam <b>darjah</b>.`,
        setup() { api.setView('refr'); api.setCount(3); api.setMed(0, m1); api.setMed(1, m2); api.setMed(2, m3); api.setI(10, true); },
        lock: ALL, hide: { r: 1 },
        ans: () => th,
        tol: a => Math.max(1.0, 0.03 * a),
        need: () => Math.abs(api.getI() - i) <= 1 ? '' : `Tetapkan sudut tuju ${i}° dahulu (sekarang ${fx(api.getI(), 0)}°).`,
        hint: () => 'n sin θ tetap pada setiap antara muka selari: n₁ sin i = n₂ sin θ₂ = n₃ sin θ₃. Medium kedua tidak mengubah sudut akhir.',
        expl: () => `n₁ sin i = n₃ sin θ₃<br>sin θ₃ = ${fx(nOf(m1), 2)} × sin ${i}° ÷ ${fx(nOf(m3), 2)} = ${fx(nOf(m1) * Math.sin(rad(i)) / nOf(m3), 4)}<br>θ₃ = <b>${fx(th, 1)}°</b>`
      };
    });

    defM('🐟', 'Dalam Ketara', 'Dalam ketara = dalam nyata ÷ n', () => {
      const m = pick(NA), d = pick([6, 8, 10, 12, 15, 18]);
      return {
        kind: 'num', unit: 'cm', icon: '🐟',
        text: () => `Sekeping syiling berada pada <b>kedalaman nyata ${d} cm</b> dalam <b>${MEDIA[m].ms}</b> (n = ${fx(nOf(m), 2)}). Pandang hampir menegak dari atas. Kira <b>dalam ketara</b>, kemudian tetapkan kedalaman itu untuk menyemak. Jawapan dalam <b>cm</b>.`,
        setup() { api.setView('depth'); api.setMed(0, 'udara'); api.setDepthMed(m); api.setDepth(6, true); api.setAng(3, true); },
        lock: { view: 1, wave: 1, ang: 1, media: 1, count: 1 }, hide: { app: 1 },
        ans: () => depthApp(nOf(m), d, 3),
        tol: a => Math.max(0.3, 0.05 * a),
        need: () => Math.abs(api.getDepth() - d) <= 0.5 ? '' : `Tetapkan kedalaman nyata ${d} cm dahulu (sekarang ${fx(api.getDepth(), 0)} cm).`,
        hint: () => 'n = dalam nyata ÷ dalam ketara, jadi dalam ketara = dalam nyata ÷ n.',
        expl: () => `Dalam ketara = ${d} ÷ ${fx(nOf(m), 2)} = <b>${fx(d / nOf(m), 2)} cm</b>`
      };
    });

    defM('🔍', 'Indeks Bias daripada Kedalaman', 'n = nyata ÷ ketara', () => {
      const m = pick(NA), d = pick([8, 10, 12, 15, 18]);
      return {
        kind: 'num', unit: '', icon: '🔍',
        text: () => `Medium dalam bekas ini <b>disembunyikan</b>. Syiling berada pada <b>kedalaman nyata ${d} cm</b>. Baca <b>dalam ketara</b> pada pembaris, kemudian kira <b>indeks bias</b> medium itu.`,
        setup() { api.setView('depth'); api.setMed(0, 'udara'); api.setDepthMed(m); api.setDepth(d, true); api.setAng(3, true); },
        lock: { view: 1, wave: 1, ang: 1, media: 1, count: 1, depth: 1 }, hide: { n: 1, kth: 1, medname: 1, mn: 1, v: 1 },
        ans: () => nOf(m),
        tol: a => 0.05 * a,
        need: () => '',
        hint: () => 'n = dalam nyata ÷ dalam ketara. Baca dalam ketara daripada kedudukan imej putus-putus pada pembaris.',
        expl: () => `n = ${d} ÷ ${fx(depthApp(nOf(m), d, 3), 2)} ≈ <b>${fx(nOf(m), 2)}</b> (${MEDIA[m].ms}).`
      };
    });

    return list;
  }

  const exported = {
    clamp, lerp, rad, deg, fx, rnd, rint, pick, sg, parseNum, niceMax,
    C, MKEYS, MEDIA, WAVES, nAt, speedOf, fresnel, trace, critPair, critOverall,
    fitSlope, depthApp, RANKS, I18N, createMissions
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (globalScope) globalScope.RefraksiModel = exported;
})(typeof window !== 'undefined' ? window : globalThis);
