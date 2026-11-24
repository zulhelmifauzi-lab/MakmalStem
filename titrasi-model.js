const I18N = {
  ms: {
    back: 'Semua Simulasi', classOn: 'Mod Kelas', classOff: 'Keluar Mod Kelas', langAria: 'Tukar bahasa',
    badge: 'Kimia T4 · Bab 6', title: 'Titrasi Asid & Bes',
    intro: 'Titiskan larutan natrium hidroksida (NaOH) daripada buret ke dalam kelalang kon yang mengandungi asid dan penunjuk. Perhatikan perubahan warna, pH dan lengkung titrasi, kemudian cari titik akhir.',
    presets: 'Eksperimen pantas', p_hcl_pp: 'HCl + fenolftalein', p_hcl_mo: 'HCl + metil jingga', p_ch3_pp: 'Asid etanoik + fenolftalein', p_ch3_mo: 'Asid etanoik + metil jingga',
    labH: 'Makmal titrasi', rigAria: 'Buret berisi NaOH di atas kelalang kon berisi asid dan penunjuk', curveAria: 'Lengkung titrasi: pH melawan isi padu NaOH',
    drop: 'Titis 0.1 mL', addOne: 'Tambah 1.0 mL', tapOpen: 'Buka paip', tapClose: 'Tutup paip', reset: 'Set semula',
    r_v: 'Bacaan buret (NaOH)', r_ph: 'pH dalam kelalang', r_col: 'Warna penunjuk', r_eq: 'Titik kesetaraan, Vₛ',
    controls: 'Kawalan', c_acid: 'Asid dalam kelalang', a_hcl: 'Asid hidroklorik, HCl (asid kuat)', a_ch3: 'Asid etanoik, CH₃COOH (asid lemah)',
    c_ind: 'Penunjuk', i_pp: 'Fenolftalein (pH 8.2 – 10.0)', i_mo: 'Metil jingga (pH 3.1 – 4.4)', i_btb: 'Bromotimol biru (pH 6.0 – 7.6)',
    c_ma: 'Kepekatan asid, Mₐ', c_va: 'Isi padu asid, Vₐ', c_mb: 'Kepekatan NaOH, Mb',
    c_hint: 'Menukar apa-apa tetapan akan memulakan semula titrasi. Isi padu kesetaraan dihadkan supaya muat dalam buret 50 mL.',
    mysteryOn: 'Kepekatan asid tidak diketahui', mysteryOff: 'Papar kepekatan asid', calc: 'Hitung kepekatan',
    col_pp: ['tidak berwarna', 'merah jambu pudar', 'merah jambu', 'merah jambu tua'],
    col_mo: ['merah', 'merah kejinggaan', 'jingga', 'kuning'],
    col_btb: ['kuning', 'kuning kehijauan', 'hijau kebiruan', 'biru'],
    hidden: '? (tidak diketahui)',
    n0: 'Buka paip atau tekan Titis untuk menambah NaOH ke dalam kelalang.',
    nAcid: 'Asid masih berlebihan, jadi larutan bersifat asid (pH < 7).', nBase: 'NaOH sudah berlebihan, jadi larutan bersifat alkali (pH > 7).',
    nEq: 'Titik kesetaraan: asid dan NaOH bertindak balas tepat-tepat (peneutralan lengkap). pH pada titik ini ialah',
    nEnd: 'Titik akhir dikesan (warna penunjuk berubah) pada', nDiff: 'Beza antara titik akhir dengan titik kesetaraan ialah',
    nEndHidden: 'Titik akhir dikesan pada', nNeedEnd: 'Titiskan lagi sehingga warna penunjuk berubah, kemudian tekan Hitung kepekatan.',
    nPressCalc: 'Tekan Hitung kepekatan untuk melihat keputusan.',
    resCalc: 'Mₐ = (Mb × V(akhir)) ÷ Vₐ', resTrue: 'Kepekatan sebenar', resErr: 'Ralat', resNote: 'Titik akhir hanya hampir dengan titik kesetaraan jika penunjuk sesuai.',
    triesH: 'Cuba ini',
    tries: [
      'Pilih “HCl + fenolftalein”. Titiskan sehingga warna berubah. Berapakah isi padu pada titik akhir? Bandingkan dengan titik kesetaraan Vₛ.',
      'Lihat lengkung pH. Mengapa pH berubah sangat cepat berhampiran titik kesetaraan?',
      'Pilih “Asid etanoik + metil jingga”. Bilakah warna berubah? Adakah titik akhir sepadan dengan titik kesetaraan? Mengapa penunjuk perlu sesuai?',
      'Bandingkan pH pada titik kesetaraan untuk HCl dengan asid etanoik. Mengapa ia bukan 7 bagi asid lemah?',
      'Hidupkan “Kepekatan asid tidak diketahui”, lakukan titrasi dan tekan Hitung kepekatan. Berapakah peratus ralat anda?'
    ],
    eqH: 'Persamaan dan pengiraan', e_react: 'Persamaan tindak balas', e_formula: 'Formula titrasi (a = b = 1)',
    footer: 'Koleksi Simulasi Makmal STEM', pHx: 'pH', ml: 'mL', endLbl: 'titik akhir', eqLbl: 'kesetaraan', capped: 'Isi padu asid dilaraskan supaya titik kesetaraan muat dalam buret.'
  },
  en: {
    back: 'All Simulations', classOn: 'Class Mode', classOff: 'Exit Class Mode', langAria: 'Switch language',
    badge: 'Chemistry F4 · Ch 6', title: 'Acid-Base Titration',
    intro: 'Drip sodium hydroxide (NaOH) solution from the burette into a conical flask containing acid and indicator. Watch the colour, pH and titration curve change, then find the end point.',
    presets: 'Quick experiments', p_hcl_pp: 'HCl + phenolphthalein', p_hcl_mo: 'HCl + methyl orange', p_ch3_pp: 'Ethanoic acid + phenolphthalein', p_ch3_mo: 'Ethanoic acid + methyl orange',
    labH: 'Titration lab', rigAria: 'A burette of NaOH above a conical flask containing acid and indicator', curveAria: 'Titration curve: pH against volume of NaOH',
    drop: 'Drip 0.1 mL', addOne: 'Add 1.0 mL', tapOpen: 'Open tap', tapClose: 'Close tap', reset: 'Reset',
    r_v: 'Burette reading (NaOH)', r_ph: 'pH in the flask', r_col: 'Indicator colour', r_eq: 'Equivalence point, Vₑ',
    controls: 'Controls', c_acid: 'Acid in the flask', a_hcl: 'Hydrochloric acid, HCl (strong acid)', a_ch3: 'Ethanoic acid, CH₃COOH (weak acid)',
    c_ind: 'Indicator', i_pp: 'Phenolphthalein (pH 8.2 – 10.0)', i_mo: 'Methyl orange (pH 3.1 – 4.4)', i_btb: 'Bromothymol blue (pH 6.0 – 7.6)',
    c_ma: 'Acid concentration, Mₐ', c_va: 'Volume of acid, Vₐ', c_mb: 'NaOH concentration, Mb',
    c_hint: 'Changing any setting restarts the titration. The equivalence volume is limited so that it fits in the 50 mL burette.',
    mysteryOn: 'Unknown acid concentration', mysteryOff: 'Show acid concentration', calc: 'Calculate concentration',
    col_pp: ['colourless', 'pale pink', 'pink', 'deep pink'],
    col_mo: ['red', 'orange-red', 'orange', 'yellow'],
    col_btb: ['yellow', 'greenish yellow', 'bluish green', 'blue'],
    hidden: '? (unknown)',
    n0: 'Open the tap or press Drip to add NaOH to the flask.',
    nAcid: 'There is still excess acid, so the solution is acidic (pH < 7).', nBase: 'There is now excess NaOH, so the solution is alkaline (pH > 7).',
    nEq: 'Equivalence point: the acid and NaOH have reacted exactly (complete neutralisation). The pH at this point is',
    nEnd: 'End point detected (indicator changes colour) at', nDiff: 'The difference between the end point and the equivalence point is',
    nEndHidden: 'End point detected at', nNeedEnd: 'Keep adding NaOH until the indicator changes colour, then press Calculate concentration.',
    nPressCalc: 'Press Calculate concentration to see the result.',
    resCalc: 'Mₐ = (Mb × V(end)) ÷ Vₐ', resTrue: 'Actual concentration', resErr: 'Error', resNote: 'The end point is only close to the equivalence point if the indicator is suitable.',
    triesH: 'Try this',
    tries: [
      'Choose “HCl + phenolphthalein”. Drip until the colour changes. What is the volume at the end point? Compare it with the equivalence point Vₑ.',
      'Look at the pH curve. Why does the pH change so quickly near the equivalence point?',
      'Choose “Ethanoic acid + methyl orange”. When does the colour change? Does the end point match the equivalence point? Why must the indicator be suitable?',
      'Compare the pH at the equivalence point for HCl and ethanoic acid. Why is it not 7 for the weak acid?',
      'Turn on “Unknown acid concentration”, carry out the titration and press Calculate concentration. What is your percentage error?'
    ],
    eqH: 'Equation and calculation', e_react: 'Reaction equation', e_formula: 'Titration formula (a = b = 1)',
    footer: 'Makmal STEM Simulation Collection', pHx: 'pH', ml: 'mL', endLbl: 'end point', eqLbl: 'equivalence', capped: 'The acid volume was adjusted so that the equivalence point fits in the burette.'
  }
};
const KW = 1e-14, VMAX = 50, FLOW = 1.6, DRIP = 3, VEQ_CAP = 45;
const ACIDS = {hcl: {ka: Infinity, react: 'HCl + NaOH → NaCl + H₂O'}, ch3: {ka: 1.8e-5, react: 'CH₃COOH + NaOH → CH₃COONa + H₂O'}};
const INDS = {
  pp:  {lo: 8.2, hi: 10.0, stops: ['#dbe4ee', '#f9a8d4', '#ec4899', '#be185d'], key: 'col_pp'},
  mo:  {lo: 3.1, hi: 4.4, stops: ['#ef4444', '#f97316', '#fb923c', '#facc15'], key: 'col_mo'},
  btb: {lo: 6.0, hi: 7.6, stops: ['#fde047', '#bef264', '#22c55e', '#3b82f6'], key: 'col_btb'}
};
const PRESETS = {hcl_pp: {acid: 'hcl', ind: 'pp'}, hcl_mo: {acid: 'hcl', ind: 'mo'}, ch3_pp: {acid: 'ch3', ind: 'pp'}, ch3_mo: {acid: 'ch3', ind: 'mo'}};
const state = {acid: 'hcl', ind: 'pp', ma: 0.1, mb: 0.1, va: 25, v: 0, vTarget: 0, tapOpen: false, endpointV: null, mystery: false, result: null, preset: 'hcl_pp',
  lang: 'ms', classMode: false, dirty: true, last: 0, phase: 0, capped: false};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r2 = n => Math.round(n * 100) / 100;
const MINUS = '−';
const tr = k => I18N[state.lang][k];
const f2 = (n, d = 2) => Number(n).toFixed(d).replace('-', MINUS);

/* ===== Kimia ===== */
/* Baki cas: [Na+] + [H+] = [A-] + [OH-]. Selesaikan untuk [H+] (bisection pada pH; fungsi menokok dengan [H+]). */
function solveH(ca, cb, ka) {
  let lo = -1, hi = 15;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2, h = Math.pow(10, -mid), A = ka === Infinity ? ca : ca * ka / (ka + h), f = cb + h - A - KW / h;
    if (f > 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
function pHAt(V, p = state) {
  const Vt = p.va + V;
  return solveH(p.ma * p.va / Vt, p.mb * V / Vt, ACIDS[p.acid].ka);
}
const vEq = (p = state) => p.ma * p.va / p.mb;
const fractionAt = (pH, ind = state.ind) => clamp((pH - INDS[ind].lo) / (INDS[ind].hi - INDS[ind].lo), 0, 1);
function hex(c) { return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); }
function colorAt(pH, ind = state.ind) {
  const s = INDS[ind].stops, x = fractionAt(pH, ind) * (s.length - 1), i = Math.min(s.length - 2, Math.floor(x)), t = x - i;
  const a = hex(s[i]), b = hex(s[i + 1]);
  return '#' + a.map((v, k) => Math.round(v + (b[k] - v) * t).toString(16).padStart(2, '0')).join('');
}
function colorName(pH, ind = state.ind) {
  const f = fractionAt(pH, ind), names = tr(INDS[ind].key);
  return names[f < 0.15 ? 0 : f < 0.5 ? 1 : f < 0.85 ? 2 : 3];
}
function enforceLimits() {
  state.capped = false;
  while (vEq() > VEQ_CAP && state.va > 10) { state.va -= 5; state.capped = true; }
}
function computeResult() {
  if (state.endpointV === null) return null;
  const maCalc = state.mb * state.endpointV / state.va;
  return {maCalc, ma: state.ma, err: (maCalc - state.ma) / state.ma * 100};
}

/* ===== Kawalan ===== */
function resetTitration() { Object.assign(state, {v: 0, vTarget: 0, tapOpen: false, endpointV: null, result: null}); state.dirty = true; }
function stepSimulation(dt) {
  if (state.tapOpen) state.vTarget = Math.min(VMAX, state.vTarget + FLOW * dt);
  if (state.vTarget >= VMAX) state.tapOpen = false;
  if (state.v < state.vTarget) {
    state.v = Math.min(state.vTarget, state.v + DRIP * dt); state.phase = (state.phase + dt * 3) % 1;
    if (state.endpointV === null && fractionAt(pHAt(state.v)) >= 0.5) state.endpointV = state.v;
    state.dirty = true;
  }
}
function addVolume(dv) { state.vTarget = Math.min(VMAX, Math.round((state.vTarget + dv) * 1000) / 1000); state.dirty = true; }
function toggleTap() { if (state.vTarget < VMAX) state.tapOpen = !state.tapOpen; state.dirty = true; }
