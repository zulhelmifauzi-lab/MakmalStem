(() => {
'use strict';
const nowMs = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());

/* ================= BILINGUAL UI STRINGS ================= */
const I18N = {
  ms: {
    title: 'Jatuh Bebas',
    badge: 'Fizik T4 · Bab 2',
    controls: 'Panel kawalan',
    pickLoc: 'Pilih lokasi',
    drawerTitle: 'Pilih Lokasi (Planet / Bulan)',
    lblMode: 'Mod Persekitaran',
    mVakum: 'Vakum', mVakumSub: 'tiada udara',
    mUdara: 'Udara', mUdaraSub: 'ada rintangan',
    lblHeight: 'Ketinggian menara, H',
    checkpointNote: 'Checkpoint magnet: <b>H</b>, <b>¾H</b> dan <b>½H</b>.',
    pickTip: '<b>Cara pilih objek:</b> Ketik mana-mana titik magnet <b>(+)</b> pada menara atau pilih eksperimen pantas di bawah.',
    lblPresets: 'Eksperimen pantas',
    lblDisplay: 'Paparan & audio',
    statG: 'Graviti',
    statH: 'Tinggi',
    statMode: 'Mod',
    statTip: '💡 Ketik (+) pada lorong untuk pilih objek atau (+/−) di kiri untuk tinggi.',
    viewResult: '🏁 Lihat keputusan',
    reset: 'Set Semula',
    togForce: 'Daya',
    togStrobe: 'Strob',
    dataTitle: 'Data & bacaan langsung',
    graphTitle: 'Graf gerakan',
    graphNote: 'Garis putus-putus = ramalan teori. Garis penuh = gerakan yang sedang berlaku. Paksi masa mengezum keluar secara automatik.',
    triesH: 'Nota pembelajaran',
    videoTitle: 'Video pembelajaran',
    removeObj: 'Keluarkan objek',
    hint: '👆 Ketik checkpoint (+) untuk pilih objek',
    start: '▶', pause: '⏸', resume: '▶', repeat: '▶',
    stReady: 'SEDIA', stRun: 'SEDANG JATUH', stPause: 'DIJEDA', stDone: 'SELESAI'
  },
  en: {
    title: 'Free Fall',
    badge: 'Physics F4 · Ch 2',
    controls: 'Control panel',
    pickLoc: 'Choose location',
    drawerTitle: 'Choose Location (Planet / Moon)',
    lblMode: 'Environment Mode',
    mVakum: 'Vacuum', mVakumSub: 'no air',
    mUdara: 'Air', mUdaraSub: 'air resistance',
    lblHeight: 'Tower height, H',
    checkpointNote: 'Magnetic checkpoints: <b>H</b>, <b>¾H</b> and <b>½H</b>.',
    pickTip: '<b>How to add objects:</b> Tap any magnetic checkpoint <b>(+)</b> on the tower or choose a quick experiment below.',
    lblPresets: 'Quick experiments',
    lblDisplay: 'Display & audio',
    statG: 'Gravity',
    statH: 'Height',
    statMode: 'Mode',
    statTip: '💡 Tap (+) on any lane to pick objects or (+/−) on the left for height.',
    viewResult: '🏁 View results',
    reset: 'Reset',
    togForce: 'Forces',
    togStrobe: 'Strobe',
    dataTitle: 'Live data & readings',
    graphTitle: 'Motion graphs',
    graphNote: 'Dashed line = theoretical prediction. Solid line = live motion. Time axis auto-scales smoothly.',
    triesH: 'Learning notes',
    videoTitle: 'Learning videos',
    removeObj: 'Remove object',
    hint: '👆 Tap a checkpoint (+) to choose an object',
    start: '▶', pause: '⏸', resume: '▶', repeat: '▶',
    stReady: 'READY', stRun: 'FALLING', stPause: 'PAUSED', stDone: 'FINISHED'
  }
};

/* ================= DATA ================= */
const PLANETS = {
  bumi:   {name:'Bumi',   nameEn:'Earth', icon:'🌍', g:9.81, rho:1.225, sky:['#3f9ef0','#c9ecff'], gTop:'#5fc24a', gBody:'#7b4f2b', craterRim:'#4c2e16', hill:'#4f9a5a', dust:['#8a5a33','#6aa84f','#b08356'], atm:'Atmosfera tebal (ρ ≈ 1.2 kg m⁻³)', atmEn:'Thick atmosphere (ρ ≈ 1.2 kg m⁻³)'},
  bulan:  {name:'Bulan',  nameEn:'Moon',  icon:'🌕', g:1.62, rho:0,     sky:['#02030a','#151a40'], gTop:'#c3c5cc', gBody:'#7c7f8f', craterRim:'#525565', hill:'#3b3e52', dust:['#d6d8de','#a2a4ae'], atm:'Tiada atmosfera (vakum semula jadi)', atmEn:'No atmosphere (natural vacuum)'},
  marikh: {name:'Marikh', nameEn:'Mars',  icon:'🔴', g:3.71, rho:0.020, sky:['#b9714a','#f0c99c'], gTop:'#cc6a3c', gBody:'#8c3c1f', craterRim:'#5a210d', hill:'#a5532f', dust:['#d9875a','#a9502c'], atm:'Atmosfera nipis (ρ ≈ 0.020 kg m⁻³)', atmEn:'Thin atmosphere (ρ ≈ 0.020 kg m⁻³)'}
};
const ITEMS = {
  boling:   {name:'Bola Boling',     nameEn:'Bowling Ball',    m:7.0,    A:0.0366,  Cd:0.47, w:44, h:44},
  tukul:    {name:'Tukul',           nameEn:'Hammer',          m:1.32,   A:0.012,   Cd:1.0,  w:40, h:48},
  buku:     {name:'Buku',            nameEn:'Book',            m:1.0,    A:0.05,    Cd:1.1,  w:44, h:32},
  epal:     {name:'Epal',            nameEn:'Apple',           m:0.2,    A:0.005,   Cd:0.47, w:32, h:36},
  pingpong: {name:'Bola Ping Pong',  nameEn:'Ping Pong Ball',  m:0.0027, A:0.00126, Cd:0.47, w:22, h:22},
  renyuk:   {name:'Kertas Renyuk',   nameEn:'Crumpled Paper',  m:0.005,  A:0.0028,  Cd:0.6,  w:28, h:26},
  kertas:   {name:'Kertas Rata',     nameEn:'Flat Paper',      m:0.005,  A:0.0624,  Cd:1.2,  w:50, h:14, flutter:true},
  bulu:     {name:'Bulu Pelepah',    nameEn:'Feather',         m:0.0005, A:0.02,    Cd:1.3,  w:30, h:48, flutter:true}
};
const LEVELS = [1, 0.75, 0.5];
const LEVEL_LBL = ['H', '¾H', '½H'];
const LANE_COL = ['#d97706', '#0284c7', '#e11d48'];
const LANE_CANVAS_COL = ['#ffcf3f', '#3fd0ff', '#ff5c8a'];
const LANE_NM = ['A', 'B', 'C'];


/* ================= PHYSICS & IMPACT MODEL ================= */
function paramsFor(planet, mode, key){
  const P = PLANETS[planet], it = ITEMS[key];
  const rho = mode === 'udara' ? P.rho : 0;
  const k = 0.5 * rho * it.Cd * it.A;
  const vt = k > 0 ? Math.sqrt(it.m * P.g / k) : Infinity;
  return {g:P.g, k, vt, m:it.m};
}
function logcosh(x){ x = Math.abs(x); return x + Math.log1p(Math.exp(-2*x)) - Math.LN2; }
function motion(p, t){
  if (!isFinite(p.vt)) return {s:0.5*p.g*t*t, v:p.g*t, a:p.g};
  const u = p.g*t/p.vt, th = Math.tanh(u);
  return {s:p.vt*p.vt/p.g*logcosh(u), v:p.vt*th, a:p.g*(1-th*th)};
}
function landTime(p, h){
  if (!isFinite(p.vt)) return Math.sqrt(2*h/p.g);
  const x = h*p.g/(p.vt*p.vt);
  const ac = x > 20 ? x + Math.LN2 : Math.acosh(Math.exp(x));
  return p.vt/p.g*ac;
}
function impactMetrics(m, v){
  const p = m * v;
  const Ek = 0.5 * m * v * v;
  const scale = clamp(Math.log10(1 + Ek * 12) / Math.log10(1 + 2500 * 12), 0.04, 1);
  let tier = 'low', levelMs = 'Impak Kecil', levelEn = 'Light Impact';
  if (Ek >= 600) { tier = 'extreme'; levelMs = 'Impak Sangat Kuat'; levelEn = 'Extreme Impact'; }
  else if (Ek >= 150) { tier = 'high'; levelMs = 'Impak Kuat'; levelEn = 'Heavy Impact'; }
  else if (Ek >= 12) { tier = 'med'; levelMs = 'Impak Sederhana'; levelEn = 'Moderate Impact'; }
  return { m, v, p, Ek, scale, tier, levelMs, levelEn };
}
const f = (x, d=2) => (Math.abs(x) < 1e-9 ? 0 : x).toFixed(d);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a)*t;
globalThis.FallModel = { nowMs, I18N, PLANETS, ITEMS, LEVELS, LEVEL_LBL, LANE_COL, LANE_CANVAS_COL, LANE_NM, clamp, lerp, f, paramsFor, motion, landTime, impactMetrics };
})();
