const I18N = {
  ms: {
    back: 'Semua Simulasi', langAria: 'Tukar bahasa',
    badge: 'Fizik T4 · Bab 3', title: 'Hukum Kepler',
    stageH: 'Orbit elips & sapuan luas sama',
    plotAria: 'Simulasi orbit planet mengelilingi Matahari mengikut Hukum Kepler I, II dan III. Tekan Space untuk main atau jeda, atau anak panah kiri dan kanan untuk melangkah orbit.',
    legSun: 'Matahari (F₁)', legPlanet: 'Planet', legPeri: 'Sektor Perihelion (ΔA₁)', legAphe: 'Sektor Afelion (ΔA₂)',
    controls: 'Panel kawalan', reset: 'Set semula',
    tabControls: 'Kawalan', tabTable: 'Jadual',
    tableCaption: 'Pengesahan Hukum Kepler III (T² / a³)',
    colBody: 'Jasad', colT: 'T (thn)', currentOrbit: 'Orbit semasa',
    presetGroup: 'Pratetap orbit',
    p_ellipse: 'Elips KSSM', p_earth: 'Bumi', p_mars: 'Marikh', p_comet: 'Komet',
    play: 'Main', pause: 'Jeda', speedGroup: 'Kelajuan animasi',
    lbl_a: 'Paksi semi-major, a (AU)', lbl_e: 'Kesipian orbit, e',
    decrease_a: 'Kurangkan paksi semi-major', increase_a: 'Tambah paksi semi-major',
    decrease_e: 'Kurangkan kesipian', increase_e: 'Tambah kesipian',
    show: 'Papar', s_areas: 'Luas sama ΔA', s_velocity: 'Vektor laju v', s_axes: 'Fokus & paksi a', s_radius: 'Garis jejari r',
    featH: 'Bacaan langsung', f_period: 'Tempoh orbit, T', f_ratio: 'Nisbah T² / a³',
    f_r: 'Jarak semasa, r', f_speed: 'Laju orbit, v', f_area: 'Luas sektor (Δt = 0.1T)',
    yrUnit: 'thn', daysUnit: 'hari', ratioUnit: 'thn²/AU³',
    periLabel: 'Peri', apheLabel: 'Afe',
    canvasTitle: 'Hukum I (Elips) · Hukum II (ΔA₁ = ΔA₂) · Hukum III (T² = a³)',
    earthRef: '1 AU (Bumi)', sunLabel: 'Matahari (F₁)', focusLabel: 'F₂',
    triesH: 'Nota pembelajaran', videoTitle: 'Video pembelajaran', videoEmpty: 'Belum ada video pembelajaran.',
    videoPrevious: 'Video sebelumnya', videoNext: 'Video seterusnya',
    noteCircle: 'Pada e = 0, orbit berbentuk bulatan sempurna dengan Matahari di pusat. Laju orbit kekal malar ({vp} km s⁻¹) di sepanjang orbit, dan T²/a³ = 1.00.',
    noteEllipse: 'Hukum I: Orbit elips dengan Matahari pada fokus F₁ (e = {e}). Hukum II: Planet bergerak lebih laju di perihelion ({vp} km s⁻¹) berbanding di afelion ({va} km s⁻¹) supaya luas sektor ΔA₁ = ΔA₂ dalam Δt yang sama. Hukum III: T²/a³ = 1.00.',
    tries: [
      'Perhatikan sektor jingga ΔA₁ (perihelion) dan sektor biru ΔA₂ (afelion). Mengapakah sektor perihelion lebih lebar tetapi pendek, sedangkan kedua-duanya mempunyai luas yang sama?',
      'Bandingkan panjang anak panah vektor laju v ketika planet melepasi perihelion berbanding afelion. Apakah kaitan jarak r dengan kelajuan orbit v?',
      'Turunkan kesipian e kepada 0.00. Bagaimanakah bentuk orbit, kedudukan fokus F₁ dan F₂, serta laju planet berubah?',
      'Naikkan paksi semi-major a daripada 1.0 AU (Bumi) kepada 2.4 AU (Komet). Perhatikan tempoh orbit T meningkat mengikut T² ∝ a³.',
      'Buka tab Jadual untuk menyemak nilai T²/a³ bagi planet Utarid hingga Musytari bersama orbit semasa anda.'
    ]
  },
  en: {
    back: 'All Simulations', langAria: 'Switch language',
    badge: 'Physics F4 · Ch 3', title: "Kepler's Laws",
    stageH: 'Elliptical orbit & equal-area sweep',
    plotAria: "Simulation of a planet orbiting the Sun according to Kepler's Laws I, II and III. Press Space to play or pause, or left and right arrows to step along the orbit.",
    legSun: 'Sun (F₁)', legPlanet: 'Planet', legPeri: 'Perihelion sector (ΔA₁)', legAphe: 'Aphelion sector (ΔA₂)',
    controls: 'Control panel', reset: 'Reset',
    tabControls: 'Controls', tabTable: 'Table',
    tableCaption: "Verification of Kepler's 3rd Law (T² / a³)",
    colBody: 'Body', colT: 'T (yr)', currentOrbit: 'Current orbit',
    presetGroup: 'Orbit presets',
    p_ellipse: 'KSSM Ellipse', p_earth: 'Earth', p_mars: 'Mars', p_comet: 'Comet',
    play: 'Play', pause: 'Pause', speedGroup: 'Animation speed',
    lbl_a: 'Semi-major axis, a (AU)', lbl_e: 'Orbital eccentricity, e',
    decrease_a: 'Decrease semi-major axis', increase_a: 'Increase semi-major axis',
    decrease_e: 'Decrease eccentricity', increase_e: 'Increase eccentricity',
    show: 'Show', s_areas: 'Equal areas ΔA', s_velocity: 'Velocity vector v', s_axes: 'Foci & axis a', s_radius: 'Radius line r',
    featH: 'Live readings', f_period: 'Orbital period, T', f_ratio: 'Ratio T² / a³',
    f_r: 'Current distance, r', f_speed: 'Orbital speed, v', f_area: 'Sector area (Δt = 0.1T)',
    yrUnit: 'yr', daysUnit: 'days', ratioUnit: 'yr²/AU³',
    periLabel: 'Peri', apheLabel: 'Aphe',
    canvasTitle: 'Law I (Ellipse) · Law II (ΔA₁ = ΔA₂) · Law III (T² = a³)',
    earthRef: '1 AU (Earth)', sunLabel: 'Sun (F₁)', focusLabel: 'F₂',
    triesH: 'Learning notes', videoTitle: 'Learning videos', videoEmpty: 'No learning videos yet.',
    videoPrevious: 'Previous video', videoNext: 'Next video',
    noteCircle: 'At e = 0, the orbit is a perfect circle with the Sun at the centre. Orbital speed remains constant ({vp} km s⁻¹) everywhere, and T²/a³ = 1.00.',
    noteEllipse: "Law I: Elliptical orbit with the Sun at focus F₁ (e = {e}). Law II: The planet moves faster at perihelion ({vp} km s⁻¹) than at aphelion ({va} km s⁻¹) so swept areas ΔA₁ = ΔA₂ in equal Δt. Law III: T²/a³ = 1.00.",
    tries: [
      'Compare the amber sector ΔA₁ (perihelion) and blue sector ΔA₂ (aphelion). Why is the perihelion sector wider yet shorter while both have equal area?',
      'Watch the length of the velocity vector v as the planet passes perihelion versus aphelion. How does distance r affect orbital speed v?',
      'Lower eccentricity e to 0.00. How do the orbit shape, foci F₁ and F₂, and orbital speed change?',
      'Increase the semi-major axis a from 1.0 AU (Earth) to 2.4 AU (Comet). Notice how orbital period T increases according to T² ∝ a³.',
      "Open the Table tab to verify that T²/a³ stays constant from Mercury to Jupiter alongside your current orbit."
    ]
  }
};

const TAU = 2 * Math.PI;
const V_EARTH = 29.78;
const SECTOR_FRAC = 0.10;
const DEFAULT_STATE = {a: 1.2, e: 0.5, meanAnomaly: 0.6, playing: true, speed: 1};
const LIM = {
  a: {min: 0.4, max: 3.0, step: 0.1},
  e: {min: 0.0, max: 0.75, step: 0.05}
};
const PRESETS = {
  ellipse: {a: 1.2, e: 0.50},
  earth: {a: 1.0, e: 0.02},
  mars: {a: 1.5, e: 0.09},
  comet: {a: 2.4, e: 0.70}
};
const SOLAR_PLANETS = [
  {ms: 'Utarid', en: 'Mercury', a: 0.39},
  {ms: 'Zuhrah', en: 'Venus', a: 0.72},
  {ms: 'Bumi', en: 'Earth', a: 1.00},
  {ms: 'Marikh', en: 'Mars', a: 1.52},
  {ms: 'Musytari', en: 'Jupiter', a: 5.20}
];

const state = {
  ...DEFAULT_STATE,
  show: {areas: true, velocity: true, axes: true, radius: true},
  lang: 'ms',
  dirty: true
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r9 = n => Math.round(n * 1e9) / 1e9;
const tr = k => I18N[state.lang][k];

/* ===== Fizik & Matematik (Hukum Kepler I, II, III) ===== */
const semiMinor = (p = state) => p.a * Math.sqrt(Math.max(0, 1 - p.e * p.e));
const focalDist = (p = state) => p.a * p.e;
const periodYears = (a = state.a) => Math.pow(a, 1.5);
const perihelion = (p = state) => p.a * (1 - p.e);
const aphelion = (p = state) => p.a * (1 + p.e);
const totalArea = (p = state) => Math.PI * p.a * semiMinor(p);
const sectorArea = (p = state) => SECTOR_FRAC * totalArea(p);

function solveKepler(M, e) {
  let mNorm = ((M % TAU) + TAU) % TAU;
  let E = e < 0.8 ? mNorm : Math.PI;
  for (let i = 0; i < 8; i++) {
    const f = E - e * Math.sin(E) - mNorm;
    const fp = 1 - e * Math.cos(E);
    E -= f / fp;
  }
  return E;
}

function planetPos(M = state.meanAnomaly, p = state) {
  const E = solveKepler(M, p.e);
  const b = semiMinor(p);
  return {
    x: p.a * (Math.cos(E) - p.e),
    y: b * Math.sin(E),
    r: p.a * (1 - p.e * Math.cos(E)),
    E
  };
}

function orbitalSpeed(r, a = state.a) {
  return V_EARTH * Math.sqrt(Math.max(0, 2 / r - 1 / a));
}

function keplerRatio(a = state.a) {
  const T = periodYears(a);
  return (T * T) / (a * a * a);
}

function stepOrbit(dtSeconds) {
  const T = periodYears(state.a);
  state.meanAnomaly = ((state.meanAnomaly + (TAU * dtSeconds * state.speed) / (T * 4.5)) % TAU + TAU) % TAU;
  state.dirty = true;
}

function nFmt(n, dec = 2) {
  const factor = Math.pow(10, dec);
  let s = String(Math.round(n * factor) / factor);
  if (s === '-0') s = '0';
  return s;
}
