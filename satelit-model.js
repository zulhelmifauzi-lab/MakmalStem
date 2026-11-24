const I18N = {
  ms: {
    back: 'Semua Simulasi', langAria: 'Tukar bahasa',
    badge: 'Fizik T4 · Bab 3', title: 'Satelit Buatan Manusia',
    stageH: 'Pelancaran satelit & orbit mengelilingi Bumi',
    plotAria: 'Simulasi satelit buatan manusia mengelilingi Bumi. Tekan Space untuk main atau jeda, atau tekan R untuk melancarkan semula satelit.',
    legEarth: 'Bumi', legSat: 'Satelit', legStation: 'Stesen Bumi', legVec: 'Vektor laju / graviti',
    controls: 'Panel kawalan', reset: 'Set semula',
    tabControls: 'Kawalan', tabTable: 'Jadual',
    tableCaption: 'Perbandingan satelit mengikut altitud orbit',
    colSat: 'Satelit', colT: 'T (jam)', currentSat: 'Satelit semasa',
    presetGroup: 'Pratetap satelit',
    p_geo: 'Geopegun (GEO)', p_leo: 'ISS / LEO', p_gps: 'GPS / MEO', p_escape: 'Halaju Lepas',
    play: 'Main', pause: 'Jeda', relaunch: 'Lancar semula',
    lbl_h: 'Altitud orbit, h (km)', lbl_ratio: 'Nisbah laju pelancaran, v / v_orbit',
    decrease_h: 'Kurangkan altitud', increase_h: 'Tambah altitud',
    decrease_ratio: 'Kurangkan nisbah laju', increase_ratio: 'Tambah nisbah laju',
    show: 'Papar', s_trail: 'Jejak orbit', s_velocity: 'Vektor laju v', s_station: 'Stesen Bumi', s_refOrbit: 'Orbit rujukan',
    featH: 'Bacaan langsung', f_vorb: 'Halaju orbit, v', f_vesc: 'Halaju lepas, vₑ',
    f_vlaunch: 'Laju pelancaran', f_period: 'Tempoh orbit, T', f_status: 'Status trajektori',
    hrUnit: 'jam',
    stGeo: 'Orbit Geopegun (T ≈ 24 jam)',
    stCircle: 'Orbit Bulatan Bukan Geopegun',
    stEllipseHigh: 'Orbit Elips Tinggi (v_orbit < v < vₑ)',
    stEllipseLow: 'Orbit Elips Rendah (v < v_orbit)',
    stCrash: 'Jatuh ke Bumi (sub-orbit)',
    stEscaped: 'Terlepas ke Angkasa (v ≥ vₑ)',
    stCrashedNow: 'Terhempas di permukaan Bumi!',
    stEscapedNow: 'Berjaya melepasi medan graviti Bumi!',
    canvasTitle: 'Halaju Orbit v = √(GM/r) · Halaju Lepas vₑ = √(2GM/r)',
    stationLabel: 'Stesen',
    triesH: 'Nota pembelajaran', videoTitle: 'Video pembelajaran', videoEmpty: 'Belum ada video pembelajaran.',
    videoPrevious: 'Video sebelumnya', videoNext: 'Video seterusnya',
    noteGeo: 'Satelit Geopegun (h ≈ 35,800 km, v = {vo} km s⁻¹) mempunyai tempoh orbit T ≈ 24 jam sama dengan putaran Bumi. Perhatikan garisan komunikasi kekal terkunci di atas Stesen Bumi.',
    noteCircle: 'Pada nisbah 1.00 × v_orbit, satelit bergerak dalam orbit bulatan stabil dengan halaju linear v = {vo} km s⁻¹. Tempoh orbit T = {T} jam bukan 24 jam, maka satelit bukan geopegun dan bergerak relatif kepada Stesen Bumi.',
    noteEllipseHigh: 'Laju pelancaran ({vl} km s⁻¹) melebihi halaju orbit ({vo} km s⁻¹) tetapi kurang daripada halaju lepas ({ve} km s⁻¹). Satelit memasuki orbit elips yang lebih tinggi.',
    noteEllipseLow: 'Laju pelancaran ({vl} km s⁻¹) kurang daripada halaju orbit ({vo} km s⁻¹), namun titik terendah orbit masih di atas permukaan Bumi. Satelit membentuk orbit elips ke dalam.',
    noteCrash: 'Laju pelancaran ({vl} km s⁻¹) terlalu perlahan berbanding halaju orbit ({vo} km s⁻¹), menyebabkan titik terendah orbit memotong permukaan Bumi dan satelit jatuh semula ke Bumi.',
    noteEscape: 'Laju pelancaran ({vl} km s⁻¹) mencapai atau melebihi halaju lepas vₑ = √2 × v_orbit ({ve} km s⁻¹)! Tenaga kinetik mencukupi untuk mengatasi tarikan graviti Bumi dan satelit terlepas ke angkasa.',
    tries: [
      'Pilih pratetap Geopegun (GEO) dan perhatikan garisan hijau ke Stesen Bumi. Mengapakah satelit ini sentiasa berada di atas tempat yang sama di Bumi?',
      'Tukar kepada ISS / LEO (h = 400 km). Bandingkan halaju orbit v dan tempoh T berbanding satelit Geopegun. Mengapakah satelit lebih rendah bergerak lebih laju?',
      'Pada h = 400 km, turunkan nisbah laju kepada 0.90 × v_orbit. Perhatikan apa yang berlaku apabila halaju lebih rendah daripada halaju orbit linear.',
      'Pilih pratetap Halaju Lepas (atau tetapkan nisbah ≥ 1.45 × v_orbit). Sahkan bahawa halaju lepas ialah √2 ≈ 1.414 kali ganda halaju orbit pada altitud tersebut.',
      'Buka tab Jadual untuk membandingkan altitud, halaju orbit, halaju lepas dan tempoh dari ISS hingga orbit Geopegun.'
    ]
  },
  en: {
    back: 'All Simulations', langAria: 'Switch language',
    badge: 'Physics F4 · Ch 3', title: 'Man-Made Satellites',
    stageH: 'Satellite launch & orbit around Earth',
    plotAria: 'Simulation of man-made satellites orbiting Earth. Press Space to play or pause, or press R to relaunch the satellite.',
    legEarth: 'Earth', legSat: 'Satellite', legStation: 'Ground Station', legVec: 'Velocity / gravity vectors',
    controls: 'Control panel', reset: 'Reset',
    tabControls: 'Controls', tabTable: 'Table',
    tableCaption: 'Comparison of satellites by orbital altitude',
    colSat: 'Satellite', colT: 'T (hr)', currentSat: 'Current satellite',
    presetGroup: 'Satellite presets',
    p_geo: 'Geostationary (GEO)', p_leo: 'ISS / LEO', p_gps: 'GPS / MEO', p_escape: 'Escape Velocity',
    play: 'Play', pause: 'Pause', relaunch: 'Relaunch',
    lbl_h: 'Orbital altitude, h (km)', lbl_ratio: 'Launch speed ratio, v / v_orbit',
    decrease_h: 'Decrease altitude', increase_h: 'Increase altitude',
    decrease_ratio: 'Decrease speed ratio', increase_ratio: 'Increase speed ratio',
    show: 'Show', s_trail: 'Orbit trail', s_velocity: 'Velocity vector v', s_station: 'Ground station', s_refOrbit: 'Reference orbit',
    featH: 'Live readings', f_vorb: 'Orbital velocity, v', f_vesc: 'Escape velocity, vₑ',
    f_vlaunch: 'Launch speed', f_period: 'Orbital period, T', f_status: 'Trajectory status',
    hrUnit: 'hr',
    stGeo: 'Geostationary Orbit (T ≈ 24 hr)',
    stCircle: 'Non-Geostationary Circular Orbit',
    stEllipseHigh: 'High Elliptical Orbit (v_orbit < v < vₑ)',
    stEllipseLow: 'Low Elliptical Orbit (v < v_orbit)',
    stCrash: 'Falls back to Earth (sub-orbital)',
    stEscaped: 'Escapes into Space (v ≥ vₑ)',
    stCrashedNow: 'Impacted Earth surface!',
    stEscapedNow: 'Escaped Earth\'s gravitational pull!',
    canvasTitle: 'Orbital Velocity v = √(GM/r) · Escape Velocity vₑ = √(2GM/r)',
    stationLabel: 'Station',
    triesH: 'Learning notes', videoTitle: 'Learning videos', videoEmpty: 'No learning videos yet.',
    videoPrevious: 'Previous video', videoNext: 'Next video',
    noteGeo: 'A Geostationary satellite (h ≈ 35,800 km, v = {vo} km s⁻¹) has an orbital period T ≈ 24 hr matching Earth\'s rotation. Notice the green link stays locked directly above the Ground Station.',
    noteCircle: 'At 1.00 × v_orbit, the satellite follows a stable circular orbit at v = {vo} km s⁻¹. Since T = {T} hr ≠ 24 hr, it is non-geostationary and moves across the sky above the Ground Station.',
    noteEllipseHigh: 'Launch speed ({vl} km s⁻¹) exceeds orbital velocity ({vo} km s⁻¹) but is below escape velocity ({ve} km s⁻¹), sending the satellite into a larger elliptical orbit.',
    noteEllipseLow: 'Launch speed ({vl} km s⁻¹) is below circular orbital velocity ({vo} km s⁻¹), yet its perigee stays above Earth\'s surface, producing a lower elliptical orbit.',
    noteCrash: 'Launch speed ({vl} km s⁻¹) is too slow compared to orbital velocity ({vo} km s⁻¹), so the trajectory intersects Earth\'s surface and the satellite falls back.',
    noteEscape: 'Launch speed ({vl} km s⁻¹) reaches or exceeds escape velocity vₑ = √2 × v_orbit ({ve} km s⁻¹)! Kinetic energy overcomes gravity and the satellite escapes Earth permanently.',
    tries: [
      'Select the Geostationary (GEO) preset and watch the green line to the Ground Station. Why does this satellite remain stationary above the same point on Earth?',
      'Switch to ISS / LEO (h = 400 km). Compare orbital speed v and period T with the Geostationary preset. Why do lower satellites orbit faster?',
      'At h = 400 km, reduce the speed ratio to 0.90 × v_orbit. Observe what happens when launch speed drops below the required circular orbital velocity.',
      'Select Escape Velocity (or set ratio ≥ 1.45 × v_orbit). Verify that escape velocity is always √2 ≈ 1.414 times the circular orbital velocity at that altitude.',
      'Open the Table tab to compare altitude, orbital speed, escape speed and period from ISS up to Geostationary orbit.'
    ]
  }
};

const G = 6.67e-11;
const M_EARTH = 5.97e24;
const R_EARTH_KM = 6370;
const R_EARTH_M = 6.37e6;
const MU = G * M_EARTH;
const T_UNIT_S = Math.sqrt(Math.pow(R_EARTH_M, 3) / MU);
const EARTH_ROT_NORM = 86400 / T_UNIT_S;
const TAU = 2 * Math.PI;
const REV_SEC = 8.0;
const MAX_TRAIL = 260;

const DEFAULT_STATE = {h: 35800, ratio: 1.0, playing: true};
const LIM = {
  h: {min: 400, max: 40000, step: 200},
  ratio: {min: 0.5, max: 1.55, step: 0.05}
};
const PRESETS = {
  geo: {h: 35800, ratio: 1.0},
  leo: {h: 400, ratio: 1.0},
  gps: {h: 20200, ratio: 1.0},
  escape: {h: 4000, ratio: 1.45}
};
const REF_SATELLITES = [
  {ms: 'ISS (LEO)', en: 'ISS (LEO)', h: 400},
  {ms: 'MEO', en: 'MEO', h: 10000},
  {ms: 'GPS', en: 'GPS', h: 20200},
  {ms: 'Geopegun (MEASAT)', en: 'Geostationary (GEO)', h: 35800}
];

const state = {
  ...DEFAULT_STATE,
  show: {trail: true, velocity: true, station: true, refOrbit: true},
  lang: 'ms',
  dirty: true
};

const sat = {
  x: 1, y: 0, vx: 0, vy: 1,
  earthAngle: 0,
  crashed: false,
  escaped: false,
  trail: []
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r9 = n => Math.round(n * 1e9) / 1e9;
const tr = k => I18N[state.lang][k];

/* ===== Fizik & Mekanik Orbit (KSSM T4 Bab 3.3) ===== */
const orbitRadiusM = (h = state.h) => R_EARTH_M + h * 1000;
const orbitRadiusNorm = (h = state.h) => 1 + h / R_EARTH_KM;
const orbitalSpeedKms = (h = state.h) => Math.sqrt(MU / orbitRadiusM(h)) / 1000;
const escapeSpeedKms = (h = state.h) => Math.sqrt((2 * MU) / orbitRadiusM(h)) / 1000;
const launchSpeedKms = (h = state.h, ratio = state.ratio) => ratio * orbitalSpeedKms(h);
const periodHours = (h = state.h) => (TAU * Math.sqrt(Math.pow(orbitRadiusM(h), 3) / MU)) / 3600;

function isGeostationary(h = state.h, ratio = state.ratio) {
  return Math.abs(ratio - 1.0) < 0.015 && Math.abs(periodHours(h) - 24) <= 0.35;
}

function classifyOrbit(h = state.h, ratio = state.ratio) {
  if (ratio >= Math.SQRT2 - 1e-4) return 'escape';
  if (Math.abs(ratio - 1.0) < 0.015) return isGeostationary(h, ratio) ? 'geo' : 'circle';
  if (ratio > 1.0) return 'ellipseHigh';
  const r0 = orbitRadiusNorm(h);
  const a2 = ratio * ratio;
  const rp = (r0 * a2) / (2 - a2);
  return rp <= 1.02 ? 'crash' : 'ellipseLow';
}

function initSatellite() {
  const r0 = orbitRadiusNorm();
  sat.x = r0;
  sat.y = 0;
  sat.vx = 0;
  sat.vy = state.ratio * Math.sqrt(1 / r0);
  sat.earthAngle = 0;
  sat.crashed = false;
  sat.escaped = false;
  sat.trail = [{x: sat.x, y: sat.y}];
  state.dirty = true;
}

function stepPhysics(dtSeconds) {
  if (sat.crashed || sat.escaped) return;
  const r0 = orbitRadiusNorm();
  const Tnorm = TAU * Math.pow(r0, 1.5);
  const simDt = (dtSeconds * Tnorm) / REV_SEC;
  const substeps = Math.min(200, Math.max(8, Math.ceil(simDt / 0.03)));
  const h = simDt / substeps;
  const omegaEarth = TAU / EARTH_ROT_NORM;

  for (let i = 0; i < substeps; i++) {
    const r2 = sat.x * sat.x + sat.y * sat.y;
    const r = Math.sqrt(r2);
    const invR3 = 1 / (r2 * r);
    const ax0 = -sat.x * invR3;
    const ay0 = -sat.y * invR3;

    sat.x += sat.vx * h + 0.5 * ax0 * h * h;
    sat.y += sat.vy * h + 0.5 * ay0 * h * h;

    const r2n = sat.x * sat.x + sat.y * sat.y;
    const rn = Math.sqrt(r2n);
    const invR3n = 1 / (r2n * rn);
    const ax1 = -sat.x * invR3n;
    const ay1 = -sat.y * invR3n;

    sat.vx += 0.5 * (ax0 + ax1) * h;
    sat.vy += 0.5 * (ay0 + ay1) * h;
    sat.earthAngle = (sat.earthAngle + omegaEarth * h) % TAU;

    if (rn <= 1.0) {
      sat.x /= rn;
      sat.y /= rn;
      sat.vx = 0;
      sat.vy = 0;
      sat.crashed = true;
      sat.trail.push({x: sat.x, y: sat.y});
      break;
    }
    if (state.ratio >= Math.SQRT2 - 1e-4 && rn > Math.max(16, 2.8 * r0)) {
      sat.escaped = true;
      sat.trail.push({x: sat.x, y: sat.y});
      break;
    }
  }

  const last = sat.trail[sat.trail.length - 1];
  if (!last || Math.hypot(sat.x - last.x, sat.y - last.y) > r0 * 0.03) {
    sat.trail.push({x: sat.x, y: sat.y});
    if (sat.trail.length > MAX_TRAIL) sat.trail.shift();
  }
  state.dirty = true;
}

function nFmt(n, dec = 2) {
  const factor = Math.pow(10, dec);
  let s = String(Math.round(n * factor) / factor);
  if (s === '-0') s = '0';
  return s;
}
