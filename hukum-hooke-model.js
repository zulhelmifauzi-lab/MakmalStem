(function (globalScope) {
  'use strict';

  /* ================= UTILITIES ================= */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const fx = (x, d = 2) => (Math.abs(x) < 1e-9 ? 0 : x).toFixed(d);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const hx2 = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  function mix(a, b, t) {
    const A = hx2(a), B = hx2(b);
    return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')';
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    const e = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / e;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * e;
  }
  const sg = (x, n = 3) => {
    if (!isFinite(x)) return '–';
    const a = Math.abs(x);
    if (a === 0) return '0';
    return x.toFixed(clamp(n - 1 - Math.floor(Math.log10(a)), 0, 5));
  };
  function parseNum(s) {
    return parseFloat(String(s).replace(',', '.').replace(/[^\d.\-eE]/g, ''));
  }

  /* ================= CONSTANTS & MATERIALS ================= */
  const MAT = {
    keluli:    { ms: 'Keluli',    en: 'Steel',     G: 79, gam: 0.0063, c1: '#8fa6cf', c2: '#3d5078', dot: '#6f88b8' },
    kuprum:    { ms: 'Kuprum',    en: 'Copper',    G: 45, gam: 0.0035, c1: '#f0976a', c2: '#9b4521', dot: '#d9743f' },
    loyang:    { ms: 'Loyang',    en: 'Brass',     G: 37, gam: 0.0068, c1: '#efc040', c2: '#94700c', dot: '#e0aa1f' },
    aluminium: { ms: 'Aluminium', en: 'Aluminium', G: 26, gam: 0.0038, c1: '#b9c2d6', c2: '#69758f', dot: '#a3aec5' }
  };

  const FBRK = 1.3;
  const KPL = 0.2;
  const GMAX = 2000;
  const MAXN = 12;
  const MASSES = [20, 50, 100, 200, 500];
  const DISC = {
    20:  [34, 10, ['#86f3cc', '#25a07a']],
    50:  [42, 12, ['#92dcff', '#2c82c2']],
    100: [50, 14, ['#ffe680', '#c8961a']],
    200: [58, 16, ['#ffae70', '#c8561a']],
    500: [68, 19, ['#ff93c6', '#b52e6c']]
  };
  const COLS = { A: '#1d7fa6', B: '#e08a00', C: '#c2336b' };
  const PRESETS = {
    lembut:    ['keluli', 16, 0.9, 16],
    sederhana: ['keluli', 12, 1.0, 12],
    keras:     ['keluli', 10, 1.3, 11]
  };
  const RANKS = [
    [0,    { ms: 'Pelatih',         en: 'Trainee' }],
    [300,  { ms: 'Penyelidik',      en: 'Researcher' }],
    [700,  { ms: 'Jurutera Spring', en: 'Spring Engineer' }],
    [1200, { ms: 'Saintis Hooke',   en: 'Hooke Scientist' }],
    [1800, { ms: 'Pakar Kekenyalan',en: 'Elasticity Master' }]
  ];

  /* ================= SPRING & NETWORK PHYSICS ================= */
  const newSp = (mat, L, d, D) => ({ mat, L, d, D, cal: 1, xmax: 0, xperm: 0 });

  // k (N/m): k ∝ G d^4 / (D^3 n), n ∝ L
  const kOf = p => 50 * (MAT[p.mat].G / 79) * Math.pow(p.d, 4) * Math.pow(12 / p.D, 3) * (10 / p.L) * (p.cal || 1);
  const rOf = p => clamp(1.9 * (MAT[p.mat].gam / 0.0063) * Math.pow((p.D / p.d) / 12, 2), 0.6, 2.5);
  const xlOf = p => rOf(p) * p.L / 100; // had kenyal (m)
  const FlOf = p => kOf(p) * xlOf(p);

  function fSpr(p, x, ideal) {
    const k = kOf(p), xl = xlOf(p), Fl = k * xl;
    const xm = ideal ? 0 : p.xmax, xp = ideal ? 0 : p.xperm;
    if (x <= xp) return 0;
    if (x <= xm) return k * (x - xp);
    return x <= xl ? k * x : Fl + k * KPL * (x - xl);
  }

  function xSpr(p, F, ideal) {
    const k = kOf(p), xl = xlOf(p), Fl = k * xl;
    const xm = ideal ? 0 : p.xmax, xp = ideal ? 0 : p.xperm;
    if (F <= 0) return xp;
    if (F <= k * (xm - xp)) return xp + F / k;
    return F <= Fl ? F / k : xl + (F - Fl) / (k * KPL);
  }

  const spN = id => ({ t: 's', id });
  const TOPO = {
    single: {
      ms: { n: 'Tunggal', f: 'Satu spring: <b>F = kx</b>' },
      en: { n: 'Single',  f: 'One spring: <b>F = kx</b>' },
      tree: spN('A'),
      ids: ['A']
    },
    series2: {
      ms: { n: 'Siri 2', f: 'Siri: daya sama, x = x₁ + x₂<br><b>1/k = 1/k₁ + 1/k₂</b>' },
      en: { n: 'Series 2', f: 'Series: equal force, x = x₁ + x₂<br><b>1/k = 1/k₁ + 1/k₂</b>' },
      tree: { t: 'ser', ch: [spN('A'), spN('B')] },
      ids: ['A', 'B']
    },
    parallel2: {
      ms: { n: 'Selari 2', f: 'Selari: F = F₁ + F₂, x sama<br><b>k = k₁ + k₂</b>' },
      en: { n: 'Parallel 2', f: 'Parallel: F = F₁ + F₂, equal x<br><b>k = k₁ + k₂</b>' },
      tree: { t: 'par', ch: [spN('A'), spN('B')] },
      ids: ['A', 'B']
    },
    series3: {
      ms: { n: 'Siri 3', f: 'Siri: <b>1/k = 1/k₁ + 1/k₂ + 1/k₃</b>' },
      en: { n: 'Series 3', f: 'Series: <b>1/k = 1/k₁ + 1/k₂ + 1/k₃</b>' },
      tree: { t: 'ser', ch: [spN('A'), spN('B'), spN('C')] },
      ids: ['A', 'B', 'C']
    },
    parallel3: {
      ms: { n: 'Selari 3', f: 'Selari: <b>k = k₁ + k₂ + k₃</b>' },
      en: { n: 'Parallel 3', f: 'Parallel: <b>k = k₁ + k₂ + k₃</b>' },
      tree: { t: 'par', ch: [spN('A'), spN('B'), spN('C')] },
      ids: ['A', 'B', 'C']
    },
    comboA: {
      ms: { n: 'A∥B + C', f: '(A selari B) bersiri dengan C<br><b>k<sub>AB</sub> = k₁+k₂</b>, kemudian <b>1/k = 1/k<sub>AB</sub> + 1/k₃</b>' },
      en: { n: 'A∥B + C', f: '(A parallel B) in series with C<br><b>k<sub>AB</sub> = k₁+k₂</b>, then <b>1/k = 1/k<sub>AB</sub> + 1/k₃</b>' },
      tree: { t: 'ser', ch: [{ t: 'par', ch: [spN('A'), spN('B')] }, spN('C')] },
      ids: ['A', 'B', 'C']
    },
    comboB: {
      ms: { n: '(A–B) ∥ C', f: '(A bersiri B) selari dengan C<br><b>1/k<sub>AB</sub> = 1/k₁+1/k₂</b>, kemudian <b>k = k<sub>AB</sub> + k₃</b>' },
      en: { n: '(A–B) ∥ C', f: '(A series B) in parallel with C<br><b>1/k<sub>AB</sub> = 1/k₁+1/k₂</b>, then <b>k = k<sub>AB</sub> + k₃</b>' },
      tree: { t: 'par', ch: [{ t: 'ser', ch: [spN('A'), spN('B')] }, spN('C')] },
      ids: ['A', 'B', 'C']
    }
  };

  function bis(fn, target, hi0) {
    let lo = 0, hi = hi0 || 1, n = 0;
    while (fn(hi) < target && n++ < 60) hi *= 2;
    for (let i = 0; i < 44; i++) {
      const m = (lo + hi) / 2;
      if (fn(m) < target) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  }

  function nExt(spMap, n, F, ideal) {
    if (n.t === 's') return xSpr(spMap[n.id], F, ideal);
    if (n.t === 'ser') {
      let s = 0;
      for (const c of n.ch) s += nExt(spMap, c, F, ideal);
      return s;
    }
    const t = Math.max(F, 1e-12);
    const hi = Math.max(1e-4, ...n.ch.map(c => nExt(spMap, c, t, ideal)));
    return bis(x => nForce(spMap, n, x, ideal), t, hi);
  }

  function nForce(spMap, n, x, ideal) {
    if (n.t === 's') return fSpr(spMap[n.id], x, ideal);
    if (n.t === 'par') {
      let s = 0;
      for (const c of n.ch) s += nForce(spMap, c, x, ideal);
      return s;
    }
    if (x <= nExt(spMap, n, 0, ideal)) return 0;
    return bis(F => nExt(spMap, n, F, ideal), x, 5);
  }

  function dist(spMap, n, F, out, ideal) {
    if (n.t === 's') {
      out[n.id] = { F, x: xSpr(spMap[n.id], F, ideal) };
      return;
    }
    if (n.t === 'ser') {
      for (const c of n.ch) dist(spMap, c, F, out, ideal);
      return;
    }
    const x = nExt(spMap, n, F, ideal);
    for (const c of n.ch) dist(spMap, c, nForce(spMap, c, x, ideal), out, ideal);
  }

  function kIdeal(spMap, n) {
    if (n.t === 's') return kOf(spMap[n.id]);
    if (n.t === 'ser') return 1 / n.ch.reduce((a, c) => a + 1 / kIdeal(spMap, c), 0);
    return n.ch.reduce((a, c) => a + kIdeal(spMap, c), 0);
  }

  function natLen(spMap, n) {
    if (n.t === 's') return spMap[n.id].L / 100;
    if (n.t === 'ser') return n.ch.reduce((a, c) => a + natLen(spMap, c), 0);
    return Math.max(...n.ch.map(c => natLen(spMap, c)));
  }

  function buildEnvelope(spMap, node, idList, g, gmax = GMAX) {
    const Fcap = (gmax / 1000) * g;
    const N = 100;
    const pts = [];
    let limF = null, brkF = null;
    for (let i = 0; i <= N; i++) {
      const F = (Fcap * i) / N;
      const out = {};
      dist(spMap, node, F, out, true);
      let over = false, brk = false;
      for (const id of idList) {
        const p = spMap[id], k = kOf(p), xl = xlOf(p);
        if (out[id].x > xl + 1e-9) over = true;
        if (out[id].F > FBRK * k * xl) brk = true;
      }
      pts.push({ F, x: nExt(spMap, node, F, true) });
      if (over && limF === null) limF = i;
      if (brk) { brkF = i; break; }
    }
    return {
      pts,
      limI: limF,
      brkI: brkF,
      Fend: pts[pts.length - 1].F,
      xend: pts[pts.length - 1].x
    };
  }

  function fitSlope(records) {
    const rows = (records || []).filter(r => !r.plastic);
    if (rows.length < 2) return null;
    let a = 0, b = 0;
    rows.forEach(r => {
      const xm = r.x / 100;
      a += r.F * xm;
      b += xm * xm;
    });
    return b > 0 ? a / b : null;
  }

  function springFor(k, fixed) {
    fixed = fixed || {};
    const mats = fixed.mat ? [fixed.mat] : Object.keys(MAT);
    const cand = [];
    for (const mt of mats) {
      for (let d = 0.9; d <= 1.501; d += 0.1) {
        for (let D = 10; D <= 18; D++) {
          for (let L = 8; L <= 20; L++) {
            const p = { mat: mt, L, d: +d.toFixed(1), D, cal: 1 };
            if (Math.abs(kOf(p) / k - 1) < 0.1) cand.push(p);
          }
        }
      }
    }
    const p = cand.length ? pick(cand) : { mat: 'keluli', L: 12, d: 1, D: 12 };
    const q = newSp(p.mat, p.L, p.d, p.D);
    q.cal = k / kOf(q);
    return q;
  }

  function canBuild(kt, fixed) {
    fixed = fixed || {};
    const mats = fixed.mat ? [fixed.mat] : Object.keys(MAT);
    for (const mt of mats) {
      for (let d = 0.9; d <= 1.501; d += 0.1) {
        if (fixed.d && Math.abs(d - fixed.d) > 0.01) continue;
        for (let D = 10; D <= 18; D++) {
          for (let L = 8; L <= 20; L++) {
            if (fixed.L && L !== fixed.L) continue;
            if (Math.abs(kOf({ mat: mt, L, d, D, cal: 1 }) / kt - 1) < 0.05) return true;
          }
        }
      }
    }
    return false;
  }

  /* ================= BILINGUAL COPY ================= */
  const I18N = {
    ms: {
      docTitle: 'Kekenyalan (Hukum Hooke) (BETA) — Makmal STEM Fizik',
      crumb: 'Kekenyalan (Hukum Hooke)',
      title: 'Kekenyalan (Hukum Hooke)',
      badge: 'Fizik T5 · Bab 1.4',
      introSub: 'Gantung jisim berslot pada spring, ubah kekakuan serta susunan siri atau selari, dan terokai hubungan F = kx serta had kenyal.',
      modeLabel: 'Mod',
      modeLab: 'Makmal',
      modeChal: 'Cabaran',
      gLabel: 'Graviti',
      soundOn: 'Bunyi hidup',
      soundOff: 'Bunyi mati',
      soundAriaOn: 'Matikan bunyi',
      soundAriaOff: 'Hidupkan bunyi',
      stageH: 'Eksperimen spring & beban',
      stageAria: 'Simulasi interaktif kekenyalan spring dan Hukum Hooke',
      hintDrag: '⬆ Tarik jisim ke penggantung, atau ketik jisim',
      trayTitle: 'Jisim berslot',
      undoBtn: 'Buang terakhir',
      clearBtn: 'Kosongkan',
      recBtn: 'Rekod data',
      jumpGraphBtn: 'Lihat graf',
      jumpGraphAria: 'Tatal ke graf F melawan x',
      trayNote: 'Ketik jisim pada penggantung untuk membuangnya. Maksimum 2 kg (12 kepingan).',
      controlsTitle: 'Panel kawalan',
      tabSpring: 'Spring',
      tabTopo: 'Susunan',
      tabTable: 'Jadual',
      spSubPrefix: 'Spring ',
      matLabel: 'Bahan dawai',
      hardnessLabel: 'kekerasan',
      lblL: 'Panjang asal, ℓ₀',
      hintL: '↑ panjang → k ↓',
      lbld: 'Ketebalan dawai, d',
      hintd: '↑ tebal → k ↑',
      lblD: 'Diameter spring, D',
      hintD: '↑ lebar → k ↓',
      decL: 'Kurangkan panjang asal',
      incL: 'Tambah panjang asal',
      decd: 'Kurangkan ketebalan dawai',
      incd: 'Tambah ketebalan dawai',
      decD: 'Kurangkan diameter spring',
      incD: 'Tambah diameter spring',
      kBoxLabel: 'Pemalar spring {id}, k',
      kHiddenMsg: 'Pemalar disembunyikan. Tentukan melalui eksperimen.',
      kLimitWord: 'had kenyal',
      kPlasticWord: 'Cacat kekal',
      presetLabel: 'Preset spring',
      preSoft: 'Lembut',
      preMed: 'Sederhana',
      preStiff: 'Keras',
      sameBtn: 'Samakan semua',
      renewBtn: 'Spring baharu',
      topoHeader: 'Susunan Spring',
      kEffective: 'k berkesan',
      readingsTitle: 'Bacaan langsung',
      rMass: 'Jisim, m',
      rForce: 'Daya (berat), F = mg',
      rExt: 'Pemanjangan, x',
      rKmeas: 'k ukuran = F/x',
      rKtheo: 'k teori (susunan)',
      rEnergy: 'Tenaga kenyal, E',
      statusNone: 'Tiada beban',
      statusOk: '✓ Hukum Hooke: F ∝ x',
      statusBad: '⚠ Melebihi had kenyal',
      graphTitle: 'Graf F melawan x',
      analysisTitle: 'Analisis & data',
      tabGraph: 'Graf F–x',
      graphAria: 'Graf daya F melawan pemanjangan x',
      graphNoteHtml: 'Garis putus-putus = lengkung teori. Titik putih = keadaan yang telah dicapai. <b>Luas berwarna</b> = tenaga keupayaan kenyal selagi dalam had kenyal.',
      graphLimitLabel: 'had kenyal',
      graphBreakLabel: 'putus',
      tableCaption: 'Jadual data eksperimen',
      clearRec: 'Padam',
      colIdx: '#',
      colM: 'm (g)',
      colF: 'F (N)',
      colX: 'x (cm)',
      colK: 'F/x (N m⁻¹)',
      tableDefaultHint: 'Tekan <b>Rekod data</b> selepas spring tenang. Kecerunan graf F–x = pemalar spring, k.',
      tableHiddenHint: 'Hitung k = F ÷ x (dalam m) atau kecerunan graf daripada data anda.',
      slopePrefix: 'Kecerunan graf (garis hijau)',
      theoryTitle: 'Konsep Fizik',
      th1Sum: 'Kekenyalan & Hukum Hooke',
      th1Body: 'Bahan kenyal kembali kepada bentuk dan saiz asal apabila daya yang dikenakan dikeluarkan. <b>Hukum Hooke</b>: pemanjangan spring berkadar terus dengan daya yang dikenakan selagi tidak melebihi <b>had kenyal</b>.',
      th1Tail: 'k ialah <b>pemalar spring</b> (N m⁻¹) dan merupakan <b>kecerunan graf F–x</b>. Spring yang keras mempunyai k yang besar.',
      th2Sum: 'Faktor yang mempengaruhi k',
      th2Col1: 'Faktor',
      th2Col2: 'Jika bertambah',
      th2Row1a: 'Kekerasan bahan',
      th2Row1b: 'lebih keras',
      th2Row1c: '↑ bertambah',
      th2Row2a: 'Panjang spring',
      th2Row2c: '↓ berkurang',
      th2Row3a: 'Ketebalan dawai, d',
      th2Row3c: '↑ bertambah',
      th2Row4a: 'Diameter spring, D',
      th2Row4c: '↓ berkurang',
      th2Tail: 'n ialah bilangan lilitan. Spring yang lebih panjang mempunyai lebih banyak lilitan.',
      th3Sum: 'Tenaga keupayaan kenyal',
      th3Body: 'Kerja yang dilakukan untuk meregang spring disimpan sebagai tenaga keupayaan kenyal, iaitu <b>luas di bawah graf F–x</b>.',
      th4Sum: 'Susunan siri & selari',
      th4Body: '<b>Siri</b>: daya sama pada setiap spring, pemanjangan bertambah (x = x₁ + x₂).',
      th4Mid: '<b>Selari</b>: daya dikongsi (F = F₁ + F₂), pemanjangan sama.',
      th4Tail: 'Untuk dua spring serupa: siri → k/2, selari → 2k. Susunan <b>gabungan</b> dikira langkah demi langkah.',
      th5Sum: 'Had kenyal',
      th5Body: 'Jika daya melebihi had kenyal, spring mengalami <b>ubah bentuk kekal (plastik)</b> dan tidak kembali ke panjang asal. Graf F–x tidak lagi garis lurus. Daya yang terlalu besar akan memutuskan spring.',
      footerNote: 'Model: spring helik (k ∝ Gd⁴ / D³n), Hukum Hooke dalam had kenyal, dan ubah bentuk plastik melebihi had. Lukisan tidak mengikut skala lebar; paksi pembaris mengikut skala panjang.',
      mSelectTitle: 'Pilih misi',
      mListBtn: '☰ Senarai misi',
      mPlaceholder: 'Jawapan',
      mCheckBtn: '✔ Semak',
      mHintAria: 'Petunjuk',
      mEmptyPrompt: 'Pilih satu misi daripada senarai untuk bermula. Setiap misi menggunakan nilai rawak, jadi anda boleh ulang berkali-kali.',
      listTitle: '🎮 Misi Cabaran',
      listSub: 'Selesaikan secara hands-on. Kumpul bintang & XP!',
      winCloseAria: 'Tutup',
      winListBtn: '☰ Senarai',
      winRetryBtn: '↻ Ulang',
      winNextBtn: 'Misi seterusnya ▶',
      winTitlePerfect: 'Sempurna!',
      winTitleGood: 'Tahniah!',
      winXpRepeat: 'Sudah pernah mencapai bintang ini',
      winSolutionTitle: 'Penyelesaian',
      rankNextPrefix: 'XP ke pangkat seterusnya',
      rankMax: 'pangkat tertinggi!',
      targetFlag: '🎯 SASARAN',
      deformedTag: 'cacat',
      toastPlastic: '⚠️ <b>Had kenyal dilepasi!</b> Spring {id} cacat kekal.',
      toastMaxMass: '⚠️ Had maksimum 2 kg / 12 kepingan dicapai',
      toastBreak: '💥 <b>Spring {id} putus!</b> Beban melebihi had. Spring baharu dipasang.',
      toastBreakMission: 'Spring putus kerana beban terlalu besar. Cuba semula dengan beban lebih kecil.',
      toastSame: '⧉ Semua spring disamakan dengan spring {id}',
      toastRenew: '♻ Spring baharu dipasang (ubah bentuk kekal dipadam)',
      toastNeedMass: 'Gantung jisim dahulu 🙂',
      toastWaitSettle: '⏳ Tunggu spring tenang sebelum membaca',
      toastDupMass: 'Data untuk jisim ini sudah direkod',
      toastPlasticRec: 'Titik ini melebihi had kenyal, jadi tidak dimasukkan dalam kecerunan.',
      toastDropAbove: 'Lepaskan jisim di atas kawasan eksperimen ⬆',
      errNum: 'Masukkan nombor sebagai jawapan.',
      errTooBig: 'Terlalu besar.',
      errTooSmall: 'Terlalu kecil.',
      errUnit: ' Semak unit (cm ↔ m, g ↔ kg).',
      errTryAgain: 'Cuba lagi (cubaan {n}).',
      errHintTip: ' Tekan 💡 untuk petunjuk.'
    },
    en: {
      docTitle: 'Elasticity (Hooke’s Law) (BETA) — Makmal STEM Physics',
      crumb: 'Elasticity (Hooke’s Law)',
      title: 'Elasticity (Hooke’s Law)',
      badge: 'Physics F5 · Ch 1.4',
      introSub: 'Hang slotted masses on springs, customize spring geometry and series/parallel arrangements, and explore F = kx and the elastic limit.',
      modeLabel: 'Mode',
      modeLab: 'Lab',
      modeChal: 'Challenge',
      gLabel: 'Gravity',
      soundOn: 'Sound on',
      soundOff: 'Sound off',
      soundAriaOn: 'Mute sound',
      soundAriaOff: 'Unmute sound',
      stageH: 'Spring & mass experiment',
      stageAria: 'Interactive elasticity and Hooke’s law spring simulation',
      hintDrag: '⬆ Drag a mass onto the hanger, or tap a mass',
      trayTitle: 'Slotted masses',
      undoBtn: 'Remove last',
      clearBtn: 'Clear all',
      recBtn: 'Record data',
      jumpGraphBtn: 'View graph',
      jumpGraphAria: 'Scroll to F vs x graph',
      trayNote: 'Tap a mass on the hanger to remove it. Maximum 2 kg (12 discs).',
      controlsTitle: 'Control panel',
      tabSpring: 'Spring',
      tabTopo: 'Layout',
      tabTable: 'Table',
      spSubPrefix: 'Spring ',
      matLabel: 'Wire material',
      hardnessLabel: 'stiffness',
      lblL: 'Original length, ℓ₀',
      hintL: '↑ length → k ↓',
      lbld: 'Wire thickness, d',
      hintd: '↑ thick → k ↑',
      lblD: 'Spring diameter, D',
      hintD: '↑ wide → k ↓',
      decL: 'Decrease original length',
      incL: 'Increase original length',
      decd: 'Decrease wire thickness',
      incd: 'Increase wire thickness',
      decD: 'Decrease spring diameter',
      incD: 'Increase spring diameter',
      kBoxLabel: 'Spring {id} constant, k',
      kHiddenMsg: 'Constant hidden. Determine experimentally.',
      kLimitWord: 'elastic limit',
      kPlasticWord: 'Permanent deformation',
      presetLabel: 'Spring presets',
      preSoft: 'Soft',
      preMed: 'Medium',
      preStiff: 'Stiff',
      sameBtn: 'Match all',
      renewBtn: 'Fresh springs',
      topoHeader: 'Spring Arrangement',
      kEffective: 'effective k',
      readingsTitle: 'Live readings',
      rMass: 'Mass, m',
      rForce: 'Weight force, F = mg',
      rExt: 'Extension, x',
      rKmeas: 'measured k = F/x',
      rKtheo: 'theoretical k',
      rEnergy: 'Elastic energy, E',
      statusNone: 'No load',
      statusOk: '✓ Hooke’s Law: F ∝ x',
      statusBad: '⚠ Exceeded elastic limit',
      graphTitle: 'Graph of F against x',
      analysisTitle: 'Analysis & data',
      tabGraph: 'F–x Graph',
      graphAria: 'Graph of force F against extension x',
      graphNoteHtml: 'Dashed line = theoretical curve. White dots = reached states. <b>Shaded area</b> = elastic potential energy within the elastic limit.',
      graphLimitLabel: 'elastic limit',
      graphBreakLabel: 'snap',
      tableCaption: 'Recorded experiment data',
      clearRec: 'Clear',
      colIdx: '#',
      colM: 'm (g)',
      colF: 'F (N)',
      colX: 'x (cm)',
      colK: 'F/x (N m⁻¹)',
      tableDefaultHint: 'Press <b>Record data</b> after the spring settles. Gradient of F–x graph = spring constant, k.',
      tableHiddenHint: 'Calculate k = F ÷ x (in m) or find the graph gradient from your recorded data.',
      slopePrefix: 'Graph gradient (green line)',
      theoryTitle: 'Physics Concepts',
      th1Sum: 'Elasticity & Hooke’s Law',
      th1Body: 'Elastic materials return to their original shape and size when the applied force is removed. <b>Hooke’s Law</b>: the extension of a spring is directly proportional to the applied force provided the <b>elastic limit</b> is not exceeded.',
      th1Tail: 'k is the <b>spring constant</b> (N m⁻¹) and equals the <b>gradient of the F–x graph</b>. Stiffer springs have larger k.',
      th2Sum: 'Factors affecting k',
      th2Col1: 'Factor',
      th2Col2: 'If increased',
      th2Row1a: 'Material stiffness',
      th2Row1b: 'stiffer',
      th2Row1c: '↑ increases',
      th2Row2a: 'Spring length',
      th2Row2c: '↓ decreases',
      th2Row3a: 'Wire thickness, d',
      th2Row3c: '↑ increases',
      th2Row4a: 'Spring diameter, D',
      th2Row4c: '↓ decreases',
      th2Tail: 'n is the number of coils. Longer springs have more coils.',
      th3Sum: 'Elastic potential energy',
      th3Body: 'Work done to stretch the spring is stored as elastic potential energy, equal to the <b>area under the F–x graph</b>.',
      th4Sum: 'Series & parallel arrangements',
      th4Body: '<b>Series</b>: equal force on each spring, extensions add up (x = x₁ + x₂).',
      th4Mid: '<b>Parallel</b>: force is shared (F = F₁ + F₂), extension is equal.',
      th4Tail: 'For two identical springs: series → k/2, parallel → 2k. <b>Combined</b> layouts are solved step by step.',
      th5Sum: 'Elastic limit',
      th5Body: 'If force exceeds the elastic limit, the spring suffers <b>permanent (plastic) deformation</b> and fails to return to its original length. The F–x graph is no longer straight. Excessive force snaps the spring.',
      footerNote: 'Model: helical spring (k ∝ Gd⁴ / D³n), Hooke’s law within elastic limit, and plastic deformation beyond. Drawing width is schematic; ruler axis follows length scale.',
      mSelectTitle: 'Choose mission',
      mListBtn: '☰ Mission list',
      mPlaceholder: 'Answer',
      mCheckBtn: '✔ Check',
      mHintAria: 'Hint',
      mEmptyPrompt: 'Pick a mission from the list to begin. Values are randomized on every attempt so you can replay freely.',
      listTitle: '🎮 Challenge Missions',
      listSub: 'Solve hands-on. Collect stars & XP!',
      winCloseAria: 'Close',
      winListBtn: '☰ List',
      winRetryBtn: '↻ Retry',
      winNextBtn: 'Next mission ▶',
      winTitlePerfect: 'Perfect!',
      winTitleGood: 'Well done!',
      winXpRepeat: 'Stars already earned for this mission',
      winSolutionTitle: 'Solution',
      rankNextPrefix: 'XP to next rank',
      rankMax: 'highest rank!',
      targetFlag: '🎯 TARGET',
      deformedTag: 'bent',
      toastPlastic: '⚠️ <b>Elastic limit exceeded!</b> Spring {id} permanently deformed.',
      toastMaxMass: '⚠️ Maximum load 2 kg / 12 discs reached',
      toastBreak: '💥 <b>Spring {id} snapped!</b> Load exceeded limit. Fresh spring installed.',
      toastBreakMission: 'Spring snapped due to excessive load. Retry with a smaller mass.',
      toastSame: '⧉ All springs matched to spring {id}',
      toastRenew: '♻ Fresh springs installed (permanent deformation cleared)',
      toastNeedMass: 'Hang a mass first 🙂',
      toastWaitSettle: '⏳ Wait for the spring to settle before reading',
      toastDupMass: 'Data for this mass is already recorded',
      toastPlasticRec: 'This point exceeds the elastic limit and is excluded from the linear slope.',
      toastDropAbove: 'Release the mass over the experiment stage ⬆',
      errNum: 'Enter a valid number as your answer.',
      errTooBig: 'Too large.',
      errTooSmall: 'Too small.',
      errUnit: ' Check units (cm ↔ m, g ↔ kg).',
      errTryAgain: 'Try again (attempt {n}).',
      errHintTip: ' Tap 💡 for a hint.'
    }
  };

  /* ================= MISSIONS ================= */
  function createMissions(api) {
    const getG = () => api.getG();
    const getLang = () => api.getLang();
    const totalMass = () => api.totalMass();
    const settled = () => api.settled();
    const getX = () => api.getX();
    const getRec = () => api.getRec();
    const getFlyingLen = () => api.getFlyingLen();
    const getSp = id => api.getSp(id);
    const setSp = (id, val) => api.setSp(id, val);
    const setTopo = t => api.setTopo(t);
    const setSel = s => api.setSel(s);
    const kIdealCurrent = () => api.kIdealCurrent();
    const t = (ms, en) => (getLang() === 'en' ? en : ms);

    const ALL = { topo: 1, mat: 1, L: 1, d: 1, D: 1 };
    const list = [];
    const defM = (ic, tMs, sMs, tEn, sEn, gen) => list.push({ ic, t: { ms: tMs, en: tEn }, s: { ms: sMs, en: sEn }, gen });

    defM('📏', 'Baca Pemanjangan', 'Gantung jisim & baca pembaris', 'Read Extension', 'Hang mass & read the ruler', () => {
      let k, m, x;
      const g = getG();
      do {
        k = pick([20, 25, 30, 40, 50, 60]);
        m = pick([100, 150, 200, 250, 300, 400, 500]);
        x = (m / 1000) * g / k * 100;
      } while (x < 3 || x > 24);
      return {
        kind: 'num', unit: 'cm', icon: '📏',
        text: () => t(
          `Spring ini mempunyai <b>k = ${k} N m⁻¹</b>. Gantung jisim <b>${m} g</b>, kemudian baca <b>pemanjangan</b> spring daripada pembaris. Jawapan dalam <b>cm</b>.`,
          `This spring has <b>k = ${k} N m⁻¹</b>. Hang a <b>${m} g</b> mass, then read the <b>extension</b> from the ruler. Answer in <b>cm</b>.`
        ),
        setup() { setSp('A', springFor(k)); setTopo('single'); },
        lock: ALL, hide: { x: 1, E: 1 },
        ans: () => (m / 1000) * getG() / k * 100,
        tol: a => Math.max(0.5, 0.04 * a),
        need: () => totalMass() === m ? '' : t(`Gantung tepat ${m} g dahulu (sekarang ${totalMass()} g).`, `Hang exactly ${m} g first (currently ${totalMass()} g).`),
        hint: () => t('Guna F = mg, kemudian x = F ÷ k. Tukar unit: g → kg, dan m → cm.', 'Use F = mg, then x = F ÷ k. Convert units: g → kg, and m → cm.'),
        expl: () => {
          const gNow = getG();
          return t(
            `F = mg = ${fx(m / 1000, 3)} × ${gNow} = ${fx((m / 1000) * gNow, 3)} N<br>x = F/k = ${fx((m / 1000) * gNow, 3)} ÷ ${k} = ${fx((m / 1000) * gNow / k, 4)} m = <b>${fx((m / 1000) * gNow / k * 100, 1)} cm</b>`,
            `F = mg = ${fx(m / 1000, 3)} × ${gNow} = ${fx((m / 1000) * gNow, 3)} N<br>x = F/k = ${fx((m / 1000) * gNow, 3)} ÷ ${k} = ${fx((m / 1000) * gNow / k, 4)} m = <b>${fx((m / 1000) * gNow / k * 100, 1)} cm</b>`
          );
        }
      };
    });

    defM('🕵️', 'Pemalar Misteri', 'Rekod data & cari kecerunan graf', 'Mystery Constant', 'Record data & find graph gradient', () => {
      const k = 5 * rint(5, 22);
      return {
        kind: 'num', unit: 'N m⁻¹', icon: '🕵️',
        text: () => t(
          `Pemalar spring ini <b>disembunyikan</b>. Gantung beberapa jisim, <b>📌 rekod data</b> (sekurang-kurangnya 3), kemudian tentukan <b>k</b> daripada kecerunan graf F–x. Jawapan dalam <b>N m⁻¹</b>.`,
          `This spring constant is <b>hidden</b>. Hang several masses, <b>📌 record data</b> (at least 3 points), then determine <b>k</b> from the F–x graph gradient. Answer in <b>N m⁻¹</b>.`
        ),
        setup() { setSp('A', springFor(k)); setTopo('single'); },
        lock: ALL, hide: { k: 1, kth: 1, spring: 1 },
        ans: () => k,
        tol: a => 0.06 * a,
        need: () => getRec().length >= 3 ? '' : t('Rekod sekurang-kurangnya 3 set data dahulu (butang 📌).', 'Record at least 3 data points first (📌 button).'),
        hint: () => t('k = F ÷ x. Gunakan x dalam meter (cm ÷ 100). Cari purata atau lihat kecerunan garis hijau pada graf.', 'k = F ÷ x. Convert x to metres (cm ÷ 100). Average or check the green line gradient on the graph.'),
        expl: () => t(
          `Graf F–x ialah garis lurus melalui asalan; kecerunan = k.<br>Pemalar sebenar spring ialah <b>${k} N m⁻¹</b>.`,
          `The F–x graph is a straight line through the origin; gradient = k.<br>True spring constant is <b>${k} N m⁻¹</b>.`
        )
      };
    });

    defM('🎯', 'Tepat Sasaran', 'Kira jisim untuk capai x sasaran', 'Hit the Target', 'Compute mass to reach target x', () => {
      let k, m, xt;
      const g = getG();
      do {
        k = pick([20, 25, 30, 40, 50, 80]);
        m = pick([100, 150, 200, 250, 300, 350, 400, 450, 500]);
        xt = +((m / 1000) * g / k * 100).toFixed(1);
      } while (xt < 4 || xt > 26);
      return {
        kind: 'state', icon: '🎯', target: { x: xt },
        text: () => t(
          `Spring dengan <b>k = ${k} N m⁻¹</b>. Gunakan Hukum Hooke untuk mendapatkan <b>pemanjangan ${fx(xt, 1)} cm</b>. Kira jisim yang diperlukan, gantungnya, dan biarkan penunjuk berhenti pada <b>🎯 bendera sasaran</b>.`,
          `Spring with <b>k = ${k} N m⁻¹</b>. Use Hooke’s Law to achieve an <b>extension of ${fx(xt, 1)} cm</b>. Calculate the required mass, hang it, and let the pointer rest at the <b>🎯 target flag</b>.`
        ),
        setup() { setSp('A', springFor(k)); setTopo('single'); },
        lock: ALL, hide: { x: 1, E: 1 },
        check: () => settled() && totalMass() > 0 && Math.abs(getX() * 100 - xt) <= Math.max(0.4, 0.025 * xt),
        hint: () => t('F = kx. Tukar x ke meter, kira F, kemudian m = F ÷ g.', 'F = kx. Convert x to metres, calculate F, then m = F ÷ g.'),
        expl: () => {
          const gNow = getG();
          return `F = kx = ${k} × ${fx(xt / 100, 3)} = ${fx(k * xt / 100, 2)} N<br>m = F/g = ${fx(k * xt / 100, 2)} ÷ ${gNow} ≈ <b>${fx((k * xt / 100) / gNow * 1000, 0)} g</b>`;
        }
      };
    });

    defM('🛠️', 'Bina Spring', 'Laras k dengan faktor spring', 'Build a Spring', 'Tune k using spring factors', () => {
      let kt, fixed, kind, val;
      do {
        kt = pick([20, 30, 45, 60, 80, 100, 150]);
        kind = pick(['mat', 'L', 'd']);
        if (kind === 'mat') {
          val = pick(['kuprum', 'loyang', 'aluminium', 'keluli']);
          fixed = { mat: val };
        } else if (kind === 'L') {
          val = pick([8, 10, 12, 15, 18]);
          fixed = { L: val };
        } else {
          val = pick([1.0, 1.2, 1.4]);
          fixed = { d: val };
        }
      } while (!canBuild(kt, fixed));
      return {
        kind: 'state', icon: '🛠️',
        text: () => {
          const lbl = kind === 'mat'
            ? t(`Gunakan bahan <b>${MAT[val].ms}</b>`, `Use material <b>${MAT[val].en}</b>`)
            : kind === 'L'
              ? t(`Panjang asal ditetapkan <b>${val} cm</b>`, `Original length fixed at <b>${val} cm</b>`)
              : t(`Ketebalan dawai ditetapkan <b>${val} mm</b>`, `Wire thickness fixed at <b>${val} mm</b>`);
          return t(
            `Reka spring dengan <b>k ≈ ${kt} N m⁻¹ (±8%)</b>. ${lbl}. Laraskan faktor lain pada tab <b>Spring</b> dan perhatikan nilai k.`,
            `Design a spring with <b>k ≈ ${kt} N m⁻¹ (±8%)</b>. ${lbl}. Adjust the remaining parameters in the <b>Spring</b> tab.`
          );
        },
        setup() {
          setSp('A', newSp(fixed.mat || 'keluli', fixed.L || 12, fixed.d || 1.0, 12));
          setTopo('single');
        },
        lock: { topo: 1, mat: !!fixed.mat, L: !!fixed.L, d: !!fixed.d },
        hide: {},
        check: () => Math.abs(kOf(getSp('A')) / kt - 1) <= 0.08,
        hint: () => t('Dawai lebih tebal → k lebih besar. Spring lebih panjang atau lebih lebar (D) → k lebih kecil. Bahan lebih keras → k lebih besar.', 'Thicker wire → larger k. Longer or wider (D) spring → smaller k. Stiffer material → larger k.'),
        expl: () => t(
          `Anda memahami faktor: k ∝ d⁴ / (D³ n). Spring anda: k = <b>${sg(kOf(getSp('A')), 3)} N m⁻¹</b>.`,
          `You applied k ∝ d⁴ / (D³ n). Your spring: k = <b>${sg(kOf(getSp('A')), 3)} N m⁻¹</b>.`
        )
      };
    });

    defM('⛓️', 'Susunan Siri', 'Kira k berkesan secara siri', 'Series Layout', 'Calculate effective series k', () => {
      const k1 = pick([20, 30, 40, 60]), k2 = pick([20, 30, 40, 60, 80]);
      return {
        kind: 'num', unit: 'N m⁻¹', icon: '⛓️',
        text: () => t(
          `Dua spring <b>k₁ = ${k1}</b> dan <b>k₂ = ${k2} N m⁻¹</b> disusun <b>secara siri</b>. Kira pemalar berkesan, kemudian gantung jisim untuk menyemak (k = F/x). Jawapan dalam <b>N m⁻¹</b>.`,
          `Two springs <b>k₁ = ${k1}</b> and <b>k₂ = ${k2} N m⁻¹</b> are arranged in <b>series</b>. Calculate the effective constant, then hang a mass to verify (k = F/x). Answer in <b>N m⁻¹</b>.`
        ),
        setup() { setSp('A', springFor(k1)); setSp('B', springFor(k2)); setTopo('series2'); setSel('A'); },
        lock: ALL, hide: { k: 1, kth: 1 },
        ans: () => (k1 * k2) / (k1 + k2),
        tol: a => 0.05 * a,
        need: () => totalMass() > 0 ? '' : t('Gantung sekurang-kurangnya satu jisim untuk mengesahkan jawapan anda.', 'Hang at least one mass to verify your calculation.'),
        hint: () => t('Siri: 1/k = 1/k₁ + 1/k₂. Pemanjangan setiap spring dijumlahkan.', 'Series: 1/k = 1/k₁ + 1/k₂. Extensions add up.'),
        expl: () => t(
          `1/k = 1/${k1} + 1/${k2}<br>k = <b>${fx((k1 * k2) / (k1 + k2), 1)} N m⁻¹</b> (lebih kecil daripada setiap spring).`,
          `1/k = 1/${k1} + 1/${k2}<br>k = <b>${fx((k1 * k2) / (k1 + k2), 1)} N m⁻¹</b> (smaller than either spring).`
        )
      };
    });

    defM('🔀', 'Susunan Selari', 'Kira k berkesan secara selari', 'Parallel Layout', 'Calculate effective parallel k', () => {
      const k1 = pick([20, 30, 40, 60]), k2 = pick([20, 30, 40, 60, 80]);
      return {
        kind: 'num', unit: 'N m⁻¹', icon: '🔀',
        text: () => t(
          `Dua spring <b>k₁ = ${k1}</b> dan <b>k₂ = ${k2} N m⁻¹</b> disusun <b>secara selari</b>. Kira pemalar berkesan, kemudian gantung jisim untuk menyemak. Jawapan dalam <b>N m⁻¹</b>.`,
          `Two springs <b>k₁ = ${k1}</b> and <b>k₂ = ${k2} N m⁻¹</b> are arranged in <b>parallel</b>. Calculate the effective constant, then hang a mass to verify. Answer in <b>N m⁻¹</b>.`
        ),
        setup() { setSp('A', springFor(k1)); setSp('B', springFor(k2)); setTopo('parallel2'); setSel('A'); },
        lock: ALL, hide: { k: 1, kth: 1 },
        ans: () => k1 + k2,
        tol: a => 0.05 * a,
        need: () => totalMass() > 0 ? '' : t('Gantung sekurang-kurangnya satu jisim untuk mengesahkan jawapan anda.', 'Hang at least one mass to verify your calculation.'),
        hint: () => t('Selari: daya dikongsi, pemanjangan sama, jadi k = k₁ + k₂.', 'Parallel: force is shared, extension is equal, so k = k₁ + k₂.'),
        expl: () => t(
          `k = k₁ + k₂ = ${k1} + ${k2} = <b>${k1 + k2} N m⁻¹</b> (lebih besar daripada setiap spring).`,
          `k = k₁ + k₂ = ${k1} + ${k2} = <b>${k1 + k2} N m⁻¹</b> (stiffer than either spring).`
        )
      };
    });

    defM('🧩', 'Pilih Susunan', 'Padankan k berkesan sasaran', 'Choose Layout', 'Match target effective k', () => {
      const k = pick([30, 40, 50, 60]);
      const opts = [[1 / 2, 'series2'], [2, 'parallel2'], [1 / 3, 'series3'], [3, 'parallel3'], [2 / 3, 'comboA'], [3 / 2, 'comboB']];
      const [r, topoKey] = pick(opts);
      return {
        kind: 'state', icon: '🧩',
        text: () => t(
          `Anda ada 3 spring serupa (<b>k = ${k} N m⁻¹</b>). Buka tab <b>Susunan</b> supaya pemalar berkesan = <b>${fx(k * r, 1)} N m⁻¹</b>. Gantung jisim untuk menyemak.`,
          `You have 3 identical springs (<b>k = ${k} N m⁻¹</b>). Open the <b>Layout</b> tab and arrange them for effective k = <b>${fx(k * r, 1)} N m⁻¹</b>. Hang a mass to verify.`
        ),
        setup() {
          const s = springFor(k);
          setSp('A', s);
          setSp('B', Object.assign(newSp(s.mat, s.L, s.d, s.D), { cal: s.cal }));
          setSp('C', Object.assign(newSp(s.mat, s.L, s.d, s.D), { cal: s.cal }));
          setTopo('single');
        },
        lock: { mat: 1, L: 1, d: 1, D: 1 }, hide: { kth: 1 },
        check: () => Math.abs(kIdealCurrent() / (k * r) - 1) < 0.02 && totalMass() > 0 && getFlyingLen() === 0,
        hint: () => t('Siri mengurangkan k, selari menambah k. Cuba gabungan: (A∥B) siri C atau (A–B) ∥ C.', 'Series lowers k, parallel increases k. Try combinations: (A∥B) + C or (A–B) ∥ C.'),
        expl: () => {
          const nm = TOPO[topoKey][getLang() === 'en' ? 'en' : 'ms'].n;
          return t(
            `Susunan betul: <b>${nm}</b>.<br>k berkesan = ${fx(k * r, 1)} N m⁻¹.`,
            `Correct arrangement: <b>${nm}</b>.<br>Effective k = ${fx(k * r, 1)} N m⁻¹.`
          );
        }
      };
    });

    defM('💥', 'Had Kenyal', 'Cari beban maksimum sebelum cacat', 'Elastic Limit', 'Find max load before bending', () => {
      let p, F;
      do {
        p = newSp(pick(Object.keys(MAT)), rint(12, 20), pick([0.9, 1.0, 1.1]), rint(13, 18));
        F = FlOf(p);
      } while (F < 1.8 || F > 8);
      return {
        kind: 'num', unit: 'g', icon: '💥',
        text: () => t(
          `Spring ini akan <b>cacat kekal</b> jika dibebani melebihi had kenyal. Tambah jisim sedikit demi sedikit, perhatikan <b>warna spring</b> dan <b>graf F–x</b>. Berapakah <b>jisim maksimum (g)</b> sebelum had kenyal dilepasi? <i>(Awas, spring boleh putus!)</i>`,
          `This spring will <b>permanently deform</b> past its elastic limit. Add masses gradually, watch the <b>spring colour</b> and <b>F–x graph</b>. What is the <b>maximum mass (g)</b> before the elastic limit? <i>(Careful, it can snap!)</i>`
        ),
        setup() { setSp('A', p); setTopo('single'); },
        lock: ALL, hide: { spring: 1, lim: 1, k: 1, kth: 1 },
        ans: () => (FlOf(p) / getG()) * 1000,
        tol: a => Math.max(0.1 * a, 30),
        need: () => '',
        hint: () => t('Selagi dalam had kenyal, x berkadar terus dengan F. Selepas had, spring bertukar jingga dan titik graf tidak lagi pada garis lurus.', 'Within the elastic limit, x is proportional to F. Beyond it, the spring glows orange and graph points curve away from the line.'),
        expl: () => t(
          `Had kenyal ≈ <b>${fx(FlOf(p), 2)} N</b> iaitu kira-kira <b>${fx((FlOf(p) / getG()) * 1000, 0)} g</b>.`,
          `Elastic limit ≈ <b>${fx(FlOf(p), 2)} N</b>, which is roughly <b>${fx((FlOf(p) / getG()) * 1000, 0)} g</b>.`
        )
      };
    });

    defM('🔋', 'Tenaga Kenyal', 'Hitung E = ½kx²', 'Elastic Energy', 'Calculate E = ½kx²', () => {
      let k, m, x;
      const g = getG();
      do {
        k = pick([20, 25, 30, 40, 50]);
        m = pick([200, 300, 400, 500, 600]);
        x = ((m / 1000) * g) / k;
      } while (x * 100 < 5 || x * 100 > 28);
      return {
        kind: 'num', unit: 'J', icon: '🔋',
        text: () => t(
          `Spring <b>k = ${k} N m⁻¹</b> menggantung <b>${m} g</b>. Ukur pemanjangan, kemudian kira <b>tenaga keupayaan kenyal</b> yang tersimpan. Jawapan dalam <b>J</b>.`,
          `A <b>k = ${k} N m⁻¹</b> spring holds <b>${m} g</b>. Measure the extension, then calculate the stored <b>elastic potential energy</b>. Answer in <b>J</b>.`
        ),
        setup() { setSp('A', springFor(k)); setTopo('single'); },
        lock: ALL, hide: { E: 1, kth: 1 },
        ans: () => 0.5 * k * Math.pow(((m / 1000) * getG()) / k, 2),
        tol: a => Math.max(0.005, 0.05 * a),
        need: () => totalMass() === m ? '' : t(`Gantung tepat ${m} g dahulu (sekarang ${totalMass()} g).`, `Hang exactly ${m} g first (currently ${totalMass()} g).`),
        hint: () => t('E = ½Fx = ½kx². Pastikan x dalam meter. Luas segi tiga di bawah graf F–x.', 'E = ½Fx = ½kx². Ensure x is in metres. Equal to the triangle area under the F–x graph.'),
        expl: () => {
          const gNow = getG();
          const xNow = ((m / 1000) * gNow) / k;
          return `x = F/k = ${fx((m / 1000) * gNow, 3)} ÷ ${k} = ${fx(xNow, 4)} m<br>E = ½kx² = ½ × ${k} × ${fx(xNow, 4)}² = <b>${fx(0.5 * k * xNow * xNow, 3)} J</b>`;
        }
      };
    });

    defM('🏆', 'Pakar Gabungan', 'Ramal x bagi susunan gabungan', 'Combo Master', 'Predict x for combined layout', () => {
      let topoKey, k1, k2, k3, m, keff, x;
      const g = getG();
      do {
        topoKey = pick(['comboA', 'comboB']);
        k1 = pick([20, 30, 40, 60]);
        k2 = pick([20, 30, 40, 60]);
        k3 = pick([20, 30, 40, 60]);
        m = pick([200, 300, 400, 500]);
        keff = topoKey === 'comboA' ? ((k1 + k2) * k3) / (k1 + k2 + k3) : (k1 * k2) / (k1 + k2) + k3;
        x = ((m / 1000) * g / keff) * 100;
      } while (x < 3 || x > 26);
      return {
        kind: 'num', unit: 'cm', icon: '🏆',
        text: () => {
          const desc = topoKey === 'comboA'
            ? t('<b>A selari B</b>, kemudian bersiri dengan <b>C</b>', '<b>A parallel to B</b>, then in series with <b>C</b>')
            : t('<b>A bersiri B</b>, kemudian selari dengan <b>C</b>', '<b>A in series with B</b>, then parallel to <b>C</b>');
          return t(
            `Susunan gabungan: ${desc}. Dengan <b>k₁ = ${k1}</b>, <b>k₂ = ${k2}</b>, <b>k₃ = ${k3} N m⁻¹</b>. Ramal <b>pemanjangan keseluruhan</b> apabila digantung <b>${m} g</b> dan sahkan dengan pembaris. Jawapan dalam <b>cm</b>.`,
            `Combined layout: ${desc}. Given <b>k₁ = ${k1}</b>, <b>k₂ = ${k2}</b>, <b>k₃ = ${k3} N m⁻¹</b>. Predict the <b>total extension</b> for <b>${m} g</b> and check with the ruler. Answer in <b>cm</b>.`
          );
        },
        setup() {
          setSp('A', springFor(k1));
          setSp('B', springFor(k2));
          setSp('C', springFor(k3));
          setTopo(topoKey);
          setSel('A');
        },
        lock: ALL, hide: { x: 1, k: 1, kth: 1, E: 1 },
        ans: () => ((m / 1000) * getG() / keff) * 100,
        tol: a => Math.max(0.5, 0.05 * a),
        need: () => totalMass() === m ? '' : t(`Gantung tepat ${m} g dahulu (sekarang ${totalMass()} g).`, `Hang exactly ${m} g first (currently ${totalMass()} g).`),
        hint: () => t('Kira k berkesan langkah demi langkah, kemudian x = F ÷ k berkesan.', 'Compute effective k step by step, then x = F ÷ effective k.'),
        expl: () => {
          const gNow = getG();
          return t(
            `k berkesan = <b>${fx(keff, 1)} N m⁻¹</b><br>x = F/k = ${fx((m / 1000) * gNow, 3)} ÷ ${fx(keff, 1)} = <b>${fx(((m / 1000) * gNow / keff) * 100, 1)} cm</b>`,
            `effective k = <b>${fx(keff, 1)} N m⁻¹</b><br>x = F/k = ${fx((m / 1000) * gNow, 3)} ÷ ${fx(keff, 1)} = <b>${fx(((m / 1000) * gNow / keff) * 100, 1)} cm</b>`
          );
        }
      };
    });

    return list;
  }

  const exported = {
    clamp, lerp, fx, rnd, rint, pick, hx2, mix, niceMax, sg, parseNum,
    MAT, FBRK, KPL, GMAX, MAXN, MASSES, DISC, COLS, PRESETS, RANKS, TOPO, I18N,
    newSp, kOf, rOf, xlOf, FlOf, fSpr, xSpr, spN,
    bis, nExt, nForce, dist, kIdeal, natLen, buildEnvelope, fitSlope,
    springFor, canBuild, createMissions
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
  if (globalScope) {
    globalScope.HookeModel = exported;
  }
})(typeof window !== 'undefined' ? window : globalThis);
