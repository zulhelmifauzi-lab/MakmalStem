(function (globalScope) {
  'use strict';

  /* ================= UTILITI ================= */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fx = (x, d = 2) => (Math.abs(x) < 1e-12 ? 0 : x).toFixed(d);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const parseNum = s => parseFloat(String(s).replace(',', '.').replace(/[^\d.\-eE]/g, ''));
  function niceMax(v) {
    if (v <= 0) return 1;
    const e = Math.pow(10, Math.floor(Math.log10(v))), n = v / e;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * e;
  }

  /* ================= FIZIK KANTA NIPIS =================
     Konvensyen KSSM "nyata adalah positif":
     f > 0 kanta cembung, f < 0 kanta cekung; u > 0 (objek nyata);
     v > 0 imej nyata (sisi bertentangan), v < 0 imej maya (sisi sama). */
  const EPS = 1e-6;
  function image(f, u, ho) {
    ho = ho == null ? 1 : ho;
    if (Math.abs(u - f) < EPS) return { inf: true, v: Infinity, m: Infinity, hi: Infinity, real: null, upright: null, size: null };
    const v = (u * f) / (u - f);
    const m = Math.abs(v) / u;
    const hi = (-v / u) * ho; // tanda: negatif = songsang
    const size = Math.abs(m - 1) < 0.005 ? 'sama' : m > 1 ? 'besar' : 'kecil';
    return { inf: false, v, m, hi, real: v > 0, upright: v < 0, size };
  }
  const power = f => 100 / f; // f dalam cm → P dalam D

  // kes kedudukan objek (kanta cembung) dengan toleransi kecil
  function objCase(f, u) {
    if (f < 0) return 'cekung';
    const t = 0.26;
    if (Math.abs(u - f) <= t) return 'u=f';
    if (Math.abs(u - 2 * f) <= t) return 'u=2f';
    if (u < f) return 'u<f';
    if (u < 2 * f) return 'f<u<2f';
    return 'u>2f';
  }
  const CASE_LABEL = { 'u>2f': 'u > 2f', 'u=2f': 'u = 2f', 'f<u<2f': 'f < u < 2f', 'u=f': 'u = f', 'u<f': 'u < f', cekung: 'Sebarang u' };

  // Jadual ringkasan ciri imej (KSSM)
  const SUMMARY = [
    { lens: 'cembung', key: 'inf', pos: 'u = ∞ (sangat jauh)', img: 'Di F, sisi bertentangan', ciri: 'Nyata, songsang, diperkecil', guna: 'Kanta objek teleskop' },
    { lens: 'cembung', key: 'u>2f', pos: 'u > 2f', img: 'f < v < 2f, sisi bertentangan', ciri: 'Nyata, songsang, diperkecil', guna: 'Kamera, mata manusia' },
    { lens: 'cembung', key: 'u=2f', pos: 'u = 2f', img: 'v = 2f, sisi bertentangan', ciri: 'Nyata, songsang, sama saiz', guna: 'Mesin fotostat (salinan sama saiz)' },
    { lens: 'cembung', key: 'f<u<2f', pos: 'f < u < 2f', img: 'v > 2f, sisi bertentangan', ciri: 'Nyata, songsang, diperbesar', guna: 'Projektor slaid, projektor LCD' },
    { lens: 'cembung', key: 'u=f', pos: 'u = f', img: 'Di infiniti', ciri: 'Sinar terbias selari; imej di infiniti', guna: 'Lampu sorot' },
    { lens: 'cembung', key: 'u<f', pos: 'u < f', img: 'Sisi sama dengan objek, di belakang objek', ciri: 'Maya, tegak, diperbesar', guna: 'Kanta pembesar' },
    { lens: 'cekung', key: 'cekung', pos: 'Sebarang kedudukan', img: 'Antara F dan O, sisi sama dengan objek', ciri: 'Maya, tegak, diperkecil', guna: 'Cermin mata rabun jauh, lubang intai pintu' }
  ];

  // garis lurus padanan kuasa dua terkecil: y = a + b x
  function fitLine(pts) {
    const p = (pts || []).filter(q => isFinite(q.x) && isFinite(q.y));
    if (p.length < 2) return null;
    const n = p.length, sx = p.reduce((s, q) => s + q.x, 0), sy = p.reduce((s, q) => s + q.y, 0);
    const sxx = p.reduce((s, q) => s + q.x * q.x, 0), sxy = p.reduce((s, q) => s + q.x * q.y, 0);
    const den = n * sxx - sx * sx;
    if (Math.abs(den) < 1e-12) return null;
    const b = (n * sxy - sx * sy) / den, a = (sy - b * sx) / n;
    return { a, b, xInt: b !== 0 ? -a / b : null };
  }

  /* ================= ALAT OPTIK (Bab 6.5) ================= */
  // Mikroskop majmuk: unit cm, objek setinggi 1 unit
  function micro(fo, fe, u, L) {
    const i1 = image(fo, u, 1);
    const vo = i1.v, m1 = vo / u, h1 = -m1;
    const ue = L - vo, ok = ue > 0.05;
    const inf = Math.abs(ue - fe) < 0.02;
    const ve = inf ? Infinity : (ue * fe) / (ue - fe);
    const m2 = inf ? Infinity : Math.abs(ve) / ue;
    const hf = inf ? Infinity : h1 * (-ve / ue);
    return { vo, m1, h1, ue, ve, m2, M: m1 * m2, hf, inf, ok, finalReal: !inf && ve > 0 };
  }
  // Teleskop astronomi: objek di infiniti, sudut objek a (darjah)
  function tele(fo, fe, L, aDeg) {
    const a = (aDeg * Math.PI) / 180, h1 = -fo * Math.tan(a), ue = L - fo;
    const normal = Math.abs(ue - fe) < 0.26;
    const inf = Math.abs(ue - fe) < 1e-6;
    const ve = inf ? Infinity : (ue * fe) / (ue - fe);
    const b = Math.atan(Math.abs(h1) / ue);
    return { h1, ue, ve, normal, inf, beta: (b * 180) / Math.PI, M: b / a, Mth: fo / fe, finalReal: !inf && ve > 0 };
  }
  // Kamera telefon pintar / CCTV: f dalam mm, u dalam m, ho dalam m
  const SENSOR = 4.8; // tinggi penderia imej (mm)
  function cam(fmm, um, hoM) {
    const u = um * 1000, v = (u * fmm) / (u - fmm), m = v / u, hi = hoM * 1000 * m;
    return { v, m, hi, delta: (v - fmm) * 1000, fov: (2 * Math.atan(SENSOR / 2 / fmm) * 180) / Math.PI, fits: hi <= SENSOR / 2 + 1e-9 };
  }

  const RANKS = [[0, 'Pelatih'], [300, 'Pemerhati Imej'], [700, 'Juruteknik Optik'], [1200, 'Pakar Kanta'], [1800, 'Mahaguru Optik']];

  const I18N = {
    ms: {
      toastRec: 'Data direkod',
      toastDup: 'Data untuk jarak objek ini sudah direkod',
      toastWait: '⏳ Tunggu objek berhenti bergerak sebelum merekod',
      toastInf: 'Imej di infiniti: jarak imej tidak boleh direkod',
      toastBlur: 'Imej belum tajam. Gerakkan skrin sehingga imej pada skrin tajam.',
      toastConcave: 'Kanta cekung tidak membentuk imej nyata pada skrin.',
      toastSharp: '✨ <b>Imej tajam!</b> Baca jarak imej pada pembaris.',
      toastReset: 'Set semula ke keadaan asal',
      errNum: 'Masukkan nombor sebagai jawapan.',
      errTooBig: 'Terlalu besar.',
      errTooSmall: 'Terlalu kecil.',
      errSign: 'Magnitud betul, tetapi semak tanda. Imej maya / kanta cekung menggunakan nilai negatif.',
      errUnit: ' Semak unit (cm atau m).',
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
    const LR = { view: 1, type: 1, f: 1 };

    defM('🪞', 'Imej Sama Saiz', 'Mesin fotostat', () => {
      const f = pick([8, 10, 12, 15]);
      return {
        kind: 'state',
        text: () => `Kanta cembung ini mempunyai <b>panjang fokus ${f} cm</b>. Gerakkan objek sehingga imej yang terbentuk <b>nyata, songsang dan sama saiz</b> dengan objek. Tahan sebentar.`,
        setup() { api.setView('rajah'); api.setType('cembung'); api.setF(f); api.setU(Math.min(55, 3.5 * f), true); api.setHo(4); },
        lock: LR, hide: {},
        check: () => { const q = api.info(); return api.settled() && q.img.real && Math.abs(q.img.m - 1) <= 0.02; },
        hint: () => 'Imej sama saiz terbentuk apabila objek berada pada 2F.',
        expl: () => `u = 2f = 2 × ${f} = <b>${2 * f} cm</b>. Maka v = ${2 * f} cm dan m = v ÷ u = 1.`
      };
    });

    defM('🔍', 'Kanta Pembesar', 'Imej maya diperbesar 3 kali', () => {
      const f = pick([9, 12, 15]), u = (2 * f) / 3;
      return {
        kind: 'state',
        text: () => `Gunakan kanta cembung (f = ${f} cm) sebagai <b>kanta pembesar</b>. Gerakkan objek supaya imej <b>maya, tegak</b> dan <b>3 kali lebih besar</b> daripada objek (m = 3).`,
        setup() { api.setView('rajah'); api.setType('cembung'); api.setF(f); api.setU(2 * f, true); api.setHo(2); },
        lock: LR, hide: {},
        check: () => { const q = api.info(); return api.settled() && q.img.upright && Math.abs(q.img.m - 3) <= 0.1; },
        hint: () => 'Imej maya terbentuk apabila u < f. Untuk m = 3, v = −3u. Gunakan 1/f = 1/u + 1/v.',
        expl: () => `1/${f} = 1/u − 1/(3u) = 2/(3u) → u = 2f ÷ 3 = <b>${fx(u, 1)} cm</b>, v = −${fx(3 * u, 1)} cm.`
      };
    });

    defM('📽️', 'Projektor Slaid', 'Imej nyata diperbesar 2 kali', () => {
      const f = pick([8, 10, 12, 14]);
      return {
        kind: 'state',
        text: () => `Projektor menggunakan kanta cembung (f = ${f} cm). Gerakkan objek (slaid) supaya imej pada skrin <b>nyata, songsang</b> dan <b>2 kali lebih besar</b> (m = 2).`,
        setup() { api.setView('rajah'); api.setType('cembung'); api.setF(f); api.setU(3 * f, true); api.setHo(3); },
        lock: LR, hide: {},
        check: () => { const q = api.info(); return api.settled() && q.img.real && Math.abs(q.img.m - 2) <= 0.05; },
        hint: () => 'Imej nyata diperbesar terbentuk apabila f < u < 2f. Untuk m = 2, v = 2u.',
        expl: () => `1/${f} = 1/u + 1/(2u) = 3/(2u) → u = 1.5f = <b>${fx(1.5 * f, 1)} cm</b>, v = ${fx(3 * f, 1)} cm.`
      };
    });

    defM('📷', 'Kamera', 'Imej nyata diperkecil separuh', () => {
      const f = pick([6, 8, 10, 12]);
      return {
        kind: 'state',
        text: () => `Kanta kamera ialah kanta cembung (f = ${f} cm). Gerakkan objek supaya imej <b>nyata, songsang</b> dan <b>separuh saiz objek</b> (m = 0.5).`,
        setup() { api.setView('rajah'); api.setType('cembung'); api.setF(f); api.setU(1.5 * f, true); api.setHo(5); },
        lock: LR, hide: {},
        check: () => { const q = api.info(); return api.settled() && q.img.real && Math.abs(q.img.m - 0.5) <= 0.02; },
        hint: () => 'Imej diperkecil terbentuk apabila u > 2f. Untuk m = 0.5, v = u ÷ 2.',
        expl: () => `1/${f} = 1/u + 2/u = 3/u → u = 3f = <b>${3 * f} cm</b>, v = ${fx(1.5 * f, 1)} cm.`
      };
    });

    defM('🧮', 'Cari Jarak Imej', '1/f = 1/u + 1/v', () => {
      let f, u;
      do { f = pick([8, 10, 12, 15, 20]); u = pick([12, 15, 18, 20, 25, 30, 40]); } while (Math.abs(u - f) < 2 || u < f);
      const v = image(f, u).v;
      return {
        kind: 'num', unit: 'cm',
        text: () => `Objek diletakkan <b>${u} cm</b> di hadapan kanta cembung dengan panjang fokus <b>${f} cm</b>. Hitung <b>jarak imej, v</b>. Jawapan dalam <b>cm</b>.`,
        setup() { api.setView('rajah'); api.setType('cembung'); api.setF(f); api.setU(u, true); api.setHo(3); },
        lock: { view: 1, type: 1, f: 1, u: 1 }, hide: { v: 1, m: 1, hi: 1 },
        ans: () => v, tol: a => Math.max(0.3, 0.02 * Math.abs(a)), need: () => '',
        hint: () => '1/v = 1/f − 1/u. Kira 1/v dahulu, kemudian salingkan.',
        expl: () => `1/v = 1/${f} − 1/${u} = ${fx(1 / f - 1 / u, 4)}<br>v = <b>${fx(v, 1)} cm</b> (positif: imej nyata)`
      };
    });

    defM('🔻', 'Imej Kanta Cekung', 'v negatif bagi imej maya', () => {
      const f = -pick([10, 15, 20]), u = pick([10, 15, 20, 30]);
      const v = image(f, u).v;
      return {
        kind: 'num', unit: 'cm', signHint: true,
        text: () => `Objek berada <b>${u} cm</b> di hadapan kanta cekung dengan panjang fokus <b>${-f} cm</b>. Hitung <b>jarak imej, v</b> menggunakan konvensyen tanda KSSM. Jawapan dalam <b>cm</b>.`,
        setup() { api.setView('rajah'); api.setType('cekung'); api.setF(-f); api.setU(u, true); api.setHo(4); },
        lock: { view: 1, type: 1, f: 1, u: 1 }, hide: { v: 1, m: 1, hi: 1 },
        ans: () => v, tol: a => Math.max(0.3, 0.02 * Math.abs(a)), need: () => '',
        hint: () => `Bagi kanta cekung, f negatif: f = ${f} cm. Imej maya memberi v negatif.`,
        expl: () => `1/v = 1/f − 1/u = 1/(${f}) − 1/${u} = ${fx(1 / f - 1 / u, 4)}<br>v = <b>${fx(v, 1)} cm</b> (negatif: imej maya)`
      };
    });

    defM('📏', 'Ketinggian Imej', 'm = v ÷ u = hᵢ ÷ hₒ', () => {
      let f, u;
      do { f = pick([8, 10, 12, 15]); u = pick([6, 12, 15, 18, 20, 24, 30]); } while (Math.abs(u - f) < 2);
      const ho = pick([2, 3, 4, 5]), im = image(f, u, ho);
      return {
        kind: 'num', unit: 'cm',
        text: () => `Objek setinggi <b>${ho} cm</b> berada <b>${u} cm</b> dari kanta cembung (f = ${f} cm). Hitung <b>ketinggian imej, hᵢ</b>. Jawapan dalam <b>cm</b>.`,
        setup() { api.setView('rajah'); api.setType('cembung'); api.setF(f); api.setU(u, true); api.setHo(ho); },
        lock: { view: 1, type: 1, f: 1, u: 1, ho: 1 }, hide: { v: 1, m: 1, hi: 1 },
        ans: () => Math.abs(im.hi), tol: a => Math.max(0.1, 0.03 * a), need: () => '',
        hint: () => 'Cari v dahulu dengan formula kanta, kemudian m = v ÷ u dan hᵢ = m × hₒ.',
        expl: () => `v = ${fx(im.v, 1)} cm, m = ${fx(Math.abs(im.v), 1)} ÷ ${u} = ${fx(im.m, 2)}<br>hᵢ = ${fx(im.m, 2)} × ${ho} = <b>${fx(Math.abs(im.hi), 2)} cm</b>`
      };
    });

    defM('🔬', 'Panjang Fokus Misteri', 'Eksperimen bangku optik', () => {
      const f = pick([8, 10, 12, 15]);
      return {
        kind: 'num', unit: 'cm',
        text: () => `Panjang fokus kanta cembung ini <b>disembunyikan</b>. Pada bangku optik, gerakkan kanta dan skrin untuk mendapatkan <b>imej tajam</b>. Rekod sekurang-kurangnya <b>3 set data</b>, kemudian tentukan <b>panjang fokus f</b> daripada graf 1/v melawan 1/u.`,
        setup() { api.setView('bangku'); api.setType('cembung'); api.setF(f); api.setU(3 * f, true); api.setScr(Math.min(100, 5 + 3 * f + 2.2 * f)); api.setHo(4); },
        lock: { view: 1, type: 1, f: 1, auto: 1 }, hide: { f: 1 },
        ans: () => f, tol: a => 0.05 * a,
        need: () => (api.getRec().length >= 3 ? '' : 'Rekod sekurang-kurangnya 3 set data imej tajam dahulu.'),
        hint: () => 'Pintasan-y dan pintasan-x graf 1/v melawan 1/u sama dengan 1/f. Atau guna 1/f = 1/u + 1/v untuk setiap set data dan ambil purata.',
        expl: () => `Pintasan graf ≈ 1/f = ${fx(1 / f, 3)} cm⁻¹, maka f = <b>${f} cm</b>.`
      };
    });

    defM('🕵️', 'Kanta Misteri', 'Gunakan imej sama saiz', () => {
      const f = pick([7, 9, 11, 13, 16]);
      return {
        kind: 'num', unit: 'cm',
        text: () => `Titik fokus kanta cembung ini <b>disembunyikan</b>. Gerakkan objek sehingga imej <b>sama saiz</b> dengan objek, kemudian tentukan <b>panjang fokus f</b>.`,
        setup() { api.setView('rajah'); api.setType('cembung'); api.setF(f); api.setU(Math.min(55, 3.4 * f), true); api.setHo(4); },
        lock: LR, hide: { f: 1, v: 1 },
        ans: () => f, tol: a => 0.04 * a, need: () => '',
        hint: () => 'Imej sama saiz (m = 1) apabila u = v = 2f. Bandingkan ketinggian imej dengan objek.',
        expl: () => `Imej sama saiz pada u = ${2 * f} cm = 2f, maka f = <b>${f} cm</b>.`
      };
    });

    defM('⚡', 'Kuasa Kanta', 'P = 1 ÷ f (f dalam meter)', () => {
      const cvx = Math.random() < 0.55, fa = pick([5, 8, 10, 12.5, 20]), f = cvx ? fa : -fa;
      return {
        kind: 'num', unit: 'D', signHint: true,
        text: () => `Sebuah <b>kanta ${cvx ? 'cembung' : 'cekung'}</b> mempunyai panjang fokus <b>${fa} cm</b>. Hitung <b>kuasa kanta, P</b>. Jawapan dalam <b>diopter (D)</b>.`,
        setup() { api.setView('rajah'); api.setType(cvx ? 'cembung' : 'cekung'); api.setF(fa); api.setU(25, true); api.setHo(4); },
        lock: { view: 1, type: 1, f: 1 }, hide: { p: 1 },
        ans: () => power(f), tol: a => Math.max(0.1, 0.02 * Math.abs(a)), need: () => '',
        hint: () => 'Tukar f kepada meter dahulu. Kanta cekung mempunyai f dan P negatif.',
        expl: () => `f = ${fx(f / 100, 3)} m<br>P = 1 ÷ ${fx(f / 100, 3)} = <b>${fx(power(f), 1)} D</b>`
      };
    });

    defM('🔬', 'Pembesaran Mikroskop', 'M = m₁ × m₂', () => {
      let fo, fe, u, L, r;
      do { fo = pick([1.5, 2]); fe = pick([4, 5]); u = +(fo * pick([1.25, 1.3, 1.4])).toFixed(2); L = pick([11, 12, 13, 14]); r = micro(fo, fe, u, L); } while (!(r.ue > 0.8 && r.ue < fe - 0.6));
      return {
        kind: 'num', unit: '',
        text: () => `Mikroskop majmuk: kanta objek f<sub>o</sub> = ${fo} cm, kanta mata f<sub>e</sub> = ${fe} cm, jarak antara kanta L = ${L} cm. Objek berada ${u} cm dari kanta objek. Hitung <b>pembesaran keseluruhan M = m₁ × m₂</b>.`,
        setup() { api.setView('alat'); api.setInst('mikro'); api.setIns('fo', fo); api.setIns('fe', fe); api.setIns('u', u); api.setIns('L', L); },
        lock: { view: 1, inst: 1, ins: 1 }, hide: { M: 1, m1: 1, m2: 1, ve: 1 },
        ans: () => r.M, tol: a => 0.04 * a, need: () => '',
        hint: () => 'Langkah 1: v₁ dengan 1/fₒ = 1/u + 1/v₁, m₁ = v₁ ÷ u. Langkah 2: jarak I₁ ke kanta mata = L − v₁, cari v₂ dan m₂. Langkah 3: M = m₁ × m₂.',
        expl: () => `v₁ = ${fx(r.vo, 2)} cm, m₁ = ${fx(r.m1, 2)}<br>u₂ = ${L} − ${fx(r.vo, 2)} = ${fx(r.ue, 2)} cm, v₂ = ${fx(r.ve, 2)} cm, m₂ = ${fx(r.m2, 2)}<br>M = ${fx(r.m1, 2)} × ${fx(r.m2, 2)} = <b>${fx(r.M, 1)}</b>`
      };
    });

    defM('🔭', 'Pelarasan Normal Teleskop', 'L = fₒ + fₑ', () => {
      const fo = pick([30, 40, 50]), fe = pick([4, 5, 8]);
      return {
        kind: 'state',
        text: () => `Teleskop astronomi ini mempunyai f<sub>o</sub> = ${fo} cm dan f<sub>e</sub> = ${fe} cm. Laraskan <b>jarak antara kanta</b> supaya teleskop berada dalam <b>pelarasan normal</b>, iaitu imej akhir di infiniti dan sinar keluar selari.`,
        setup() { api.setView('alat'); api.setInst('teleskop'); api.setIns('fo', fo); api.setIns('fe', fe); api.setIns('a', 3); api.setIns('L', fo + fe + 6); },
        lock: { view: 1, inst: 1, ins_fo: 1, ins_fe: 1, ins_a: 1 }, hide: {},
        check: () => api.settled() && Math.abs(api.getIns('L') - (fo + fe)) < 0.26,
        hint: () => 'Dalam pelarasan normal, titik fokus kanta objek bertindih dengan titik fokus kanta mata.',
        expl: () => `L = fₒ + fₑ = ${fo} + ${fe} = <b>${fo + fe} cm</b>. Pembesaran M = fₒ ÷ fₑ = ${fx(fo / fe, 1)}.`
      };
    });

    defM('📱', 'Fokus Automatik Kamera', 'Anjakan kanta yang sangat kecil', () => {
      const f = pick([4, 5]), u = pick([0.5, 1, 2]), r = cam(f, u, 1.7);
      return {
        kind: 'num', unit: 'µm',
        text: () => `Kamera telefon pintar mempunyai kanta f = ${f} mm. Untuk objek di infiniti, penderia imej berada tepat ${f} mm dari kanta. Jika objek kini <b>${u} m</b> dari kanta, berapa jauh kanta perlu <b>digerakkan</b> (v − f) untuk mendapatkan imej tajam? Jawapan dalam <b>mikrometer (µm)</b>.`,
        setup() { api.setView('alat'); api.setInst('kamera'); api.setIns('f', f); api.setIns('u', u); },
        lock: { view: 1, inst: 1, ins: 1 }, hide: { dv: 1, v: 1 },
        ans: () => r.delta, tol: a => Math.max(0.3, 0.03 * a), need: () => '',
        hint: () => `Tukar u kepada mm (${u * 1000} mm). Cari v dengan 1/f = 1/u + 1/v, kemudian v − f. 1 mm = 1000 µm.`,
        expl: () => `v = ${fx(r.v, 4)} mm<br>v − f = ${fx(r.v - f, 4)} mm = <b>${fx(r.delta, 1)} µm</b>. Anjakan sekecil ini dilakukan oleh motor fokus automatik.`
      };
    });

    return list;
  }

  const exported = { micro, tele, cam, SENSOR, clamp, fx, pick, parseNum, niceMax, image, power, objCase, CASE_LABEL, SUMMARY, fitLine, RANKS, I18N, createMissions };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (globalScope) globalScope.KantaModel = exported;
})(typeof window !== 'undefined' ? window : globalThis);
