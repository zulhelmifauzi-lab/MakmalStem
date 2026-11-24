const I18N = {
  ms: {
    back: 'Semua Simulasi', langAria: 'Tukar bahasa',
    badge: 'Kimia T4 · Bab 2', title: 'Struktur Atom 3D',
    atomH: 'Model atom 3D interaktif',
    atomAria: 'Model atom 3D interaktif: seret untuk memutar kamera 360 darjah, tatal untuk zum atau guna kekunci anak panah.',
    camHint: 'Seret untuk putar 3D · Tatal untuk zum',
    zoomOutAria: 'Zum keluar', zoomInAria: 'Zum masuk', camReset: 'Reset 3D',
    viewGroup: 'Mod paparan model atom', view3d: 'Model 3D', view2d: '2D Bohr',
    controls: 'Panel kawalan', reset: 'Set semula',
    tabControls: 'Kawalan', tabElements: 'Unsur (1–20)',
    presets: 'Contoh pantas', p_na: 'Atom Na', p_naion: 'Ion Na⁺', p_clion: 'Ion Cl⁻', p_neon: 'Gas Adi Ne', p_deut: 'Isotop H', p_c14: 'Karbon-14',
    c_el: 'Unsur (nombor proton Z = 1–20)', c_n: 'Bilangan neutron, N', decrease_n: 'Kurangkan neutron', increase_n: 'Tambah neutron',
    c_iso: 'Isotop semula jadi (A)', c_charge: 'Cas ion (tambah atau buang elektron)', gain: '+ Elektron', lose: '− Elektron',
    show: 'Papar', s_spin: 'Putar elektron', s_valence: 'Tonjolkan valens', s_orbits: 'Cincin orbit', s_auto: 'Putar kamera 3D',
    featH: 'Bacaan langsung', r_nuc: 'Notasi nuklid', r_z: 'Nombor proton, Z', r_a: 'Nombor nukleon, A', r_n: 'Bilangan neutron, N',
    r_e: 'Bilangan elektron', r_ch: 'Cas', r_arr: 'Susunan elektron', r_gp: 'Kumpulan · Kala', r_val: 'Elektron valens',
    none: 'tiada', neutral: 'neutral',
    lgProton: 'Proton (+)', lgNeutron: 'Neutron (0)', lgElectron: 'Elektron (−)', lgValence: 'Elektron valens',
    nIsoNat: 'ialah isotop semula jadi', nIsoOther: 'bukan isotop semula jadi yang biasa',
    nIsoSame: 'Isotop ialah atom bagi unsur yang sama (nombor proton sama) tetapi bilangan neutron berbeza, jadi nombor nukleon berbeza. Sifat kimianya sama kerana bilangan elektronnya sama.',
    nIon: 'Atom ini telah menjadi ion', nGain: 'menerima elektron', nLose: 'menderma elektron',
    nNoble: 'Susunan elektron ion ini sama dengan gas adi', nStable: 'iaitu susunan yang stabil.',
    nNobleAtom: 'Atom gas adi mempunyai susunan elektron yang stabil (duplet atau oktet), jadi ia tidak reaktif.',
    nNeutral: 'Atom neutral: bilangan elektron sama dengan bilangan proton.',
    H1: 'protium', H2: 'deuterium', H3: 'tritium',
    triesH: 'Nota pembelajaran', videoTitle: 'Video pembelajaran', videoEmpty: 'Belum ada video pembelajaran.',
    videoPrevious: 'Video sebelumnya', videoNext: 'Video seterusnya',
    tries: [
      'Seret model 3D untuk memutar nukleus dan petala elektron 360°. Kenal pasti proton (merah) dan neutron (kelabu) di dalam nukleus.',
      'Pilih Ion Na⁺ dan bandingkan susunan elektronnya dengan Gas Adi Ne. Mengapakah kedua-duanya mempunyai 10 elektron?',
      'Pilih Isotop H dan tukar antara protium, deuterium dan tritium. Apakah yang berubah dalam nukleus dan apakah yang kekal?',
      'Pilih Karbon-14 dan ubah bilangan neutron. Mengapakah karbon-12 dan karbon-14 mempunyai sifat kimia yang sama?',
      'Buka tab Unsur (1–20), pilih Klorin (Cl) dan klik + Elektron untuk membentuk ion Cl⁻. Berapakah elektron valensnya sekarang?'
    ]
  },
  en: {
    back: 'All Simulations', langAria: 'Switch language',
    badge: 'Chemistry F4 · Ch 2', title: '3D Atomic Structure',
    atomH: 'Interactive 3D atomic model',
    atomAria: 'Interactive 3D atomic model: drag to rotate camera 360 degrees, scroll to zoom or use arrow keys.',
    camHint: 'Drag to orbit 3D · Scroll to zoom',
    zoomOutAria: 'Zoom out', zoomInAria: 'Zoom in', camReset: 'Reset 3D',
    viewGroup: 'Atomic model view mode', view3d: '3D Model', view2d: '2D Bohr',
    controls: 'Control panel', reset: 'Reset',
    tabControls: 'Controls', tabElements: 'Elements (1–20)',
    presets: 'Quick examples', p_na: 'Na Atom', p_naion: 'Na⁺ Ion', p_clion: 'Cl⁻ Ion', p_neon: 'Noble Gas Ne', p_deut: 'H Isotopes', p_c14: 'Carbon-14',
    c_el: 'Element (proton number Z = 1–20)', c_n: 'Number of neutrons, N', decrease_n: 'Decrease neutrons', increase_n: 'Increase neutrons',
    c_iso: 'Natural isotopes (A)', c_charge: 'Ion charge (add or remove electrons)', gain: '+ Electron', lose: '− Electron',
    show: 'Show', s_spin: 'Spin electrons', s_valence: 'Highlight valence', s_orbits: 'Orbit rings', s_auto: 'Auto-orbit 3D',
    featH: 'Live readings', r_nuc: 'Nuclide notation', r_z: 'Proton number, Z', r_a: 'Nucleon number, A', r_n: 'Number of neutrons, N',
    r_e: 'Number of electrons', r_ch: 'Charge', r_arr: 'Electron arrangement', r_gp: 'Group · Period', r_val: 'Valence electrons',
    none: 'none', neutral: 'neutral',
    lgProton: 'Proton (+)', lgNeutron: 'Neutron (0)', lgElectron: 'Electron (−)', lgValence: 'Valence electron',
    nIsoNat: 'is a natural isotope', nIsoOther: 'is not a common natural isotope',
    nIsoSame: 'Isotopes are atoms of the same element (same proton number) with different numbers of neutrons, so their nucleon numbers differ. Their chemical properties are the same because they have the same number of electrons.',
    nIon: 'This atom has become an ion', nGain: 'by gaining electrons', nLose: 'by donating electrons',
    nNoble: 'Its electron arrangement is the same as the noble gas', nStable: 'which is a stable arrangement.',
    nNobleAtom: 'A noble gas atom has a stable electron arrangement (duplet or octet), so it is unreactive.',
    nNeutral: 'Neutral atom: the number of electrons equals the number of protons.',
    H1: 'protium', H2: 'deuterium', H3: 'tritium',
    triesH: 'Learning notes', videoTitle: 'Learning videos', videoEmpty: 'No learning videos yet.',
    videoPrevious: 'Previous video', videoNext: 'Next video',
    tries: [
      'Drag the 3D model to orbit 360° around the nucleus and electron shells. Identify the red protons and grey neutrons inside the nucleus.',
      'Select Na⁺ Ion and compare its electron arrangement with Noble Gas Ne. Why do both have 10 electrons?',
      'Choose H Isotopes and switch between protium, deuterium and tritium. What changes in the nucleus and what stays the same?',
      'Select Carbon-14 and adjust the neutron slider. Why do carbon-12 and carbon-14 share the same chemical properties?',
      'Open the Elements (1–20) tab, select Chlorine (Cl), and click + Electron to form Cl⁻. How many valence electrons are there now?'
    ]
  }
};

const EL = [
  ['H', 'Hidrogen', 'Hydrogen', [1, 2, 3]], ['He', 'Helium', 'Helium', [4, 3]], ['Li', 'Litium', 'Lithium', [7, 6]], ['Be', 'Berilium', 'Beryllium', [9]],
  ['B', 'Boron', 'Boron', [11, 10]], ['C', 'Karbon', 'Carbon', [12, 13, 14]], ['N', 'Nitrogen', 'Nitrogen', [14, 15]], ['O', 'Oksigen', 'Oxygen', [16, 17, 18]],
  ['F', 'Fluorin', 'Fluorine', [19]], ['Ne', 'Neon', 'Neon', [20, 21, 22]], ['Na', 'Natrium', 'Sodium', [23]], ['Mg', 'Magnesium', 'Magnesium', [24, 25, 26]],
  ['Al', 'Aluminium', 'Aluminium', [27]], ['Si', 'Silikon', 'Silicon', [28, 29, 30]], ['P', 'Fosforus', 'Phosphorus', [31]], ['S', 'Sulfur', 'Sulphur', [32, 34, 33, 36]],
  ['Cl', 'Klorin', 'Chlorine', [35, 37]], ['Ar', 'Argon', 'Argon', [40, 36, 38]], ['K', 'Kalium', 'Potassium', [39, 41, 40]], ['Ca', 'Kalsium', 'Calcium', [40, 44, 42]]
];
const CAP = [2, 8, 8, 18], NOBLE = {'2': 'He', '2.8': 'Ne', '2.8.8': 'Ar'}, SHELL = ['K', 'L', 'M', 'N'];
const SHELL_TILTS = [[0.42, 0.18], [-0.55, 0.72], [0.68, -0.48], [-0.32, -0.82]];
const PRESETS = {na: {Z: 11, A: 23, charge: 0}, naion: {Z: 11, A: 23, charge: 1}, clion: {Z: 17, A: 35, charge: -1}, neon: {Z: 10, A: 20, charge: 0}, deut: {Z: 1, A: 2, charge: 0}, c14: {Z: 6, A: 14, charge: 0}};

const DEFAULT_CAM = {yaw: 0.45, pitch: 0.35, zoom: 1.0, fov: 440, dist: 460};
const cam = {...DEFAULT_CAM};

const state = {
  Z: 11, N: 12, charge: 0,
  spin: true, valence: true, orbits: true, autoRotate: false, view3d: true,
  preset: 'na', lang: 'ms', dirty: true, last: 0, angle: 0
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const MINUS = '−';
const TAU = 2 * Math.PI;
const tr = k => I18N[state.lang][k];

/* ===== Kimia ===== */
function arrangement(e) {
  const out = [];
  let left = e;
  for (const c of CAP) {
    if (left <= 0) break;
    out.push(Math.min(c, left));
    left -= c;
  }
  return out;
}
const arrString = (a, empty = '—') => (a.length ? a.join('.') : empty);
const valenceOf = a => (a.length ? a[a.length - 1] : 0);
const groupOf = Z => {
  if (Z === 1) return 1;
  if (Z === 2) return 18;
  const v = valenceOf(arrangement(Z));
  return v <= 2 ? v : 10 + v;
};
const periodOf = Z => arrangement(Z).length;
const electronsOf = (p = state) => p.Z - p.charge;
const massOf = (p = state) => p.Z + p.N;
const maxN = Z => Math.round(Z * 1.5) + 6;
const isNatural = (p = state) => EL[p.Z - 1][3].includes(massOf(p));
const chargeStr = c => (c === 0 ? '' : (Math.abs(c) > 1 ? Math.abs(c) : '') + (c > 0 ? '+' : MINUS));
const nameOf = (p = state) => EL[p.Z - 1][state.lang === 'ms' ? 1 : 2];
function isoName() {
  const [sym, ms, en] = EL[state.Z - 1], A = massOf();
  return state.Z === 1 && tr('H' + A) ? `${tr('H' + A)} (${sym}-${A})` : `${state.lang === 'ms' ? ms : en}-${A}`;
}
