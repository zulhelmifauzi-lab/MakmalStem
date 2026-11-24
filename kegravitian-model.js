const I18N = {
  ms: {
    back: 'Semua Simulasi', langAria: 'Tukar bahasa',
    badge: 'Fizik T4 · Bab 3', title: 'Kegravitian Semesta',
    stageH: 'Medan graviti & graf g melawan r',
    plotAria: 'Simulasi daya graviti antara planet dan objek serta graf pecutan graviti melawan jarak. Seret objek atau guna kekunci anak panah untuk mengubah jarak r.',
    legPlanet: 'Planet (M₁)', legObj: 'Objek / Satelit (m₂)', legVec: 'Daya graviti (F)', legCurve: 'Lengkung g(r)',
    controls: 'Panel kawalan', reset: 'Set semula',
    tabControls: 'Kawalan', tabTable: 'Jadual',
    tableCaption: 'Variasi g dan F mengikut jarak r',
    presetGroup: 'Jarak rujukan pantas',
    p_inside: '0.5R (Dalam)', p_surface: '1R (Permukaan)', p_orbit: '2R (Orbit)', p_far: '3R (Jauh)',
    lbl_M: 'Jisim planet, M₁ (× M_Bumi)', lbl_m: 'Jisim objek, m₂ (kg)', lbl_r: 'Jarak dari pusat, r (× R)',
    decrease_M: 'Kurangkan jisim planet', increase_M: 'Tambah jisim planet',
    decrease_m: 'Kurangkan jisim objek', increase_m: 'Tambah jisim objek',
    decrease_r: 'Kurangkan jarak', increase_r: 'Tambah jarak',
    show: 'Papar', s_vectors: 'Vektor daya F', s_distance: 'Label jarak r', s_graph: 'Graf g lwn r', s_field: 'Garis medan',
    featH: 'Bacaan langsung', f_force: 'Daya graviti, F', f_g: 'Pecutan graviti, g',
    f_r: 'Jarak dari pusat, r', f_alt: 'Kedudukan / Altitud', f_law: 'Hubungan Hukum',
    altSurface: 'Permukaan planet (h = 0 km)',
    altAbove: 'Altitud h = {km} km di atas permukaan',
    altInside: 'Kedalaman {km} km di bawah permukaan',
    lawInside: 'g ∝ r (dalam planet)', lawOutside: 'F ∝ 1/r² (luar planet)',
    canvasSurface: 'Permukaan r = R',
    canvasTitleTop: 'Hukum Kegravitian Semesta: F = Gm₁m₂ / r²',
    canvasTitleGraph: 'Graf Pecutan Graviti, g (m s⁻²) melawan Jarak, r',
    triesH: 'Nota pembelajaran', videoTitle: 'Video pembelajaran', videoEmpty: 'Belum ada video pembelajaran.',
    videoPrevious: 'Video sebelumnya', videoNext: 'Video seterusnya',
    noteInside: 'Di dalam sfera seragam (r < R), pecutan graviti g berkadar terus dengan jarak dari pusat (g ∝ r) dan menjadi sifar di pusat (r = 0). Nilai g tetap tidak bergantung pada jisim objek m₂.',
    noteSurface: 'Di permukaan planet (r = R), pecutan graviti mencapai nilai maksimum g₀ = GM₁/R². Semua objek mengalami pecutan graviti g yang sama tanpa mengira jisim m₂.',
    noteOutside: 'Di luar planet (r ≥ R), daya graviti dan pecutan graviti mematuhi hukum kuasa dua songsang (g ∝ 1/r²): pada r = {r}R, nilai g dan F menjadi {frac} daripada nilai di permukaan. Nilai g tidak bergantung pada jisim m₂.',
    tries: [
      'Tetapkan r = 1R, kemudian tekan pratetap 2R dan 3R. Bagaimanakah nilai daya graviti F dan pecutan graviti g berubah apabila r digandakan dua dan tiga kali?',
      'Ubah jisim objek m₂ daripada 500 kg kepada 1000 kg sambil mengekalkan M₁ dan r. Perhatikan bahawa F berganda dua kali, tetapi pecutan graviti g kekal sama. Mengapa?',
      'Naikkan jisim planet M₁ kepada 2× M_Bumi pada r = 1R. Bagaimanakah puncak lengkung graf g melawan r berubah?',
      'Seret objek masuk ke dalam planet (r < 1R, contohnya 0.5R). Mengapakah pecutan graviti g menurun secara linear apabila menghampiri pusat planet?',
      'Buka tab Jadual untuk membandingkan nilai g dan F dari r = 0.5R hingga 5R bagi mengesahkan corak graf g melawan r.'
    ]
  },
  en: {
    back: 'All Simulations', langAria: 'Switch language',
    badge: 'Physics F4 · Ch 3', title: 'Universal Gravitation',
    stageH: 'Gravitational field & g vs r graph',
    plotAria: 'Simulation of gravitational force between a planet and an object with a graph of gravitational acceleration versus distance. Drag the object or use arrow keys to change r.',
    legPlanet: 'Planet (M₁)', legObj: 'Object / Satellite (m₂)', legVec: 'Gravitational force (F)', legCurve: 'Curve g(r)',
    controls: 'Control panel', reset: 'Reset',
    tabControls: 'Controls', tabTable: 'Table',
    tableCaption: 'Variation of g and F with distance r',
    presetGroup: 'Quick reference distances',
    p_inside: '0.5R (Inside)', p_surface: '1R (Surface)', p_orbit: '2R (Orbit)', p_far: '3R (Far)',
    lbl_M: 'Planet mass, M₁ (× M_Earth)', lbl_m: 'Object mass, m₂ (kg)', lbl_r: 'Distance from centre, r (× R)',
    decrease_M: 'Decrease planet mass', increase_M: 'Increase planet mass',
    decrease_m: 'Decrease object mass', increase_m: 'Increase object mass',
    decrease_r: 'Decrease distance', increase_r: 'Increase distance',
    show: 'Show', s_vectors: 'Force vectors F', s_distance: 'Distance label r', s_graph: 'g vs r graph', s_field: 'Field lines',
    featH: 'Live readings', f_force: 'Gravitational force, F', f_g: 'Gravitational acceleration, g',
    f_r: 'Distance from centre, r', f_alt: 'Position / Altitude', f_law: 'Law Relationship',
    altSurface: 'Planet surface (h = 0 km)',
    altAbove: 'Altitude h = {km} km above surface',
    altInside: 'Depth {km} km below surface',
    lawInside: 'g ∝ r (inside planet)', lawOutside: 'F ∝ 1/r² (outside planet)',
    canvasSurface: 'Surface r = R',
    canvasTitleTop: "Newton's Universal Law of Gravitation: F = Gm₁m₂ / r²",
    canvasTitleGraph: 'Gravitational Acceleration, g (m s⁻²) vs Distance, r',
    triesH: 'Learning notes', videoTitle: 'Learning videos', videoEmpty: 'No learning videos yet.',
    videoPrevious: 'Previous video', videoNext: 'Next video',
    noteInside: 'Inside a uniform sphere (r < R), gravitational acceleration g is directly proportional to distance from the centre (g ∝ r) and drops to zero at the centre (r = 0). Notice g does not depend on object mass m₂.',
    noteSurface: 'At the planet surface (r = R), gravitational acceleration reaches its maximum g₀ = GM₁/R². Every object experiences the same g regardless of its mass m₂.',
    noteOutside: 'Outside the planet (r ≥ R), both F and g obey the inverse-square law (g ∝ 1/r²): at r = {r}R, g and F drop to {frac} of their surface values. Note that g is independent of m₂.',
    tries: [
      'Start at r = 1R, then select presets 2R and 3R. How do gravitational force F and acceleration g change when r is doubled and tripled?',
      'Change object mass m₂ from 500 kg to 1000 kg while keeping M₁ and r constant. Observe that F doubles while g stays unchanged. Why?',
      'Increase planet mass M₁ to 2× M_Earth at r = 1R. How does the peak of the g vs r curve change?',
      'Drag the object inside the planet (r < 1R, e.g. 0.5R). Why does gravitational acceleration g decrease linearly toward the centre?',
      'Open the Table tab to compare g and F from r = 0.5R to 5R and verify the shape of the g vs r graph.'
    ]
  }
};

const G = 6.67e-11;
const M_EARTH = 5.97e24;
const R_EARTH = 6.37e6;
const DEFAULT_STATE = {M: 1, m: 500, r: 1};
const LIM = {
  M: {min: 0.5, max: 3.0, step: 0.5},
  m: {min: 100, max: 2000, step: 100},
  r: {min: 0.2, max: 5.0, step: 0.2}
};
const COORDINATE_R = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];
const G_MAX_AXIS = 32;
const MINUS = '−';

const state = {
  ...DEFAULT_STATE,
  show: {vectors: true, distance: true, graph: true, field: true},
  lang: 'ms',
  dragging: false,
  dirty: true
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r9 = n => Math.round(n * 1e9) / 1e9;
const tr = k => I18N[state.lang][k];

/* ===== Fizik & Matematik ===== */
const mass1Kg = (p = state) => p.M * M_EARTH;
const distMeters = (p = state) => p.r * R_EARTH;
const surfaceG = (p = state) => (G * mass1Kg(p)) / (R_EARTH * R_EARTH);

function accelG(rRatio = state.r, p = state) {
  const g0 = surfaceG(p);
  if (rRatio < 1) return rRatio * g0;
  return g0 / (rRatio * rRatio);
}

function forceN(rRatio = state.r, p = state) {
  return p.m * accelG(rRatio, p);
}

function altitudeKm(rRatio = state.r) {
  return Math.round((rRatio - 1) * (R_EARTH / 1000));
}

function nFmt(n, dec = 2) {
  const factor = Math.pow(10, dec);
  let s = String(Math.round(n * factor) / factor);
  if (s === '-0') s = '0';
  return s.replace('-', MINUS);
}

function fmtForce(f) {
  if (f >= 1000) return `${Math.round(f).toLocaleString('en-US')} N (${nFmt(f / 1000, 2)} kN)`;
  return `${nFmt(f, 1)} N`;
}

function fmtInt(n) {
  return Math.round(n).toLocaleString('en-US');
}
