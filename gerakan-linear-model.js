/* ===== Teks dwibahasa / bilingual text ===== */
const I18N = {
  ms: {
    back: 'Semua Simulasi', classOn: 'Mod Kelas', classOff: 'Keluar Mod Kelas', langAria: 'Tukar bahasa',
    badge: 'Fizik T4 · Bab 2', title: 'Gerakan Linear',
    intro: 'Gerakkan kereta di landasan lurus. Ubah halaju awal, pecutan dan tempoh gerakan, kemudian perhatikan jarak, sesaran, laju, halaju serta graf gerakan secara langsung.',
    presets: 'Senario pantas', p_uniform: 'Halaju seragam', p_accel: 'Memecut', p_decel: 'Nyahpecut', p_turn: 'Berpatah balik',
    stage: 'Landasan', trackAria: 'Landasan lurus dengan kereta. Seret atau guna anak panah kiri dan kanan untuk menukar kedudukan.',
    play: 'Main', pause: 'Jeda', reset: 'Set semula', speed: 'Kelajuan',
    r_time: 'Masa, t', r_dist: 'Jarak', r_dist_h: 'magnitud sahaja', r_disp: 'Sesaran, s', r_disp_h: 'ada arah (+ kanan, − kiri)',
    r_speed: 'Laju', r_speed_h: 'magnitud halaju', r_vel: 'Halaju, v',
    dirRight: 'ke kanan', dirLeft: 'ke kiri', dirStop: 'berhenti seketika',
    noteTurn: 'Kereta telah berpatah balik, jadi jarak lebih besar daripada magnitud sesaran. Laju sentiasa positif tetapi halaju boleh negatif.',
    noteIdle: 'Tekan Main atau pilih satu senario pantas.', noteRun: 'Jarak dan sesaran sama selagi kereta tidak berpatah balik.',
    controls: 'Kawalan', c_u: 'Halaju awal, u', c_a: 'Pecutan, a', c_t: 'Tempoh gerakan, t',
    c_x0: 'Seret kereta atau guna anak panah papan kekunci untuk menukar kedudukan.',
    triesH: 'Cuba ini',
    tries: [
      'Pilih “Halaju seragam”. Apakah bentuk graf halaju–masa dan graf sesaran–masa? Apa maksud cerun graf sesaran–masa?',
      'Pilih “Berpatah balik” dan tunggu sehingga tamat. Bandingkan jarak dengan sesaran. Mengapa nilainya berbeza?',
      'Tekan “Tunjuk luas di bawah graf”. Bandingkan luas di bawah graf v–t dengan sesaran.',
      'Set u = 10 m/s dan a = −2 m/s². Bilakah kereta berhenti seketika? Semak dengan t = −u/a.',
      'Ubah pecutan dan lihat cerun graf v–t. Apakah kaitan cerun itu dengan pecutan?'
    ],
    graphsH: 'Graf gerakan', areaOn: 'Tunjuk luas di bawah graf', areaOff: 'Sembunyi luas di bawah graf',
    g_s: 'Sesaran–masa (s–t)', g_v: 'Halaju–masa (v–t)', g_a: 'Pecutan–masa (a–t)',
    areaNote: 'Luas di bawah graf v–t ialah sesaran. Cerun graf v–t ialah pecutan, dan cerun graf s–t ialah halaju.',
    areaPlain: 'Tekan butang untuk melihat luas, cerun dan hubungannya dengan sesaran, halaju dan pecutan.',
    eqH: 'Persamaan gerakan (nilai semasa)', footer: 'Koleksi Simulasi Makmal STEM',
    start: 'mula', trace: 'jejak setiap 1 s', area: 'Luas', slope: 'cerun'
  },
  en: {
    back: 'All Simulations', classOn: 'Class Mode', classOff: 'Exit Class Mode', langAria: 'Switch language',
    badge: 'Physics F4 · Ch 2', title: 'Linear Motion',
    intro: 'Drive the car along a straight track. Change the initial velocity, acceleration and duration, then watch distance, displacement, speed, velocity and the motion graphs update live.',
    presets: 'Quick scenarios', p_uniform: 'Uniform velocity', p_accel: 'Accelerating', p_decel: 'Decelerating', p_turn: 'Turning back',
    stage: 'Track', trackAria: 'Straight track with a car. Drag it or use the left and right arrow keys to change its position.',
    play: 'Play', pause: 'Pause', reset: 'Reset', speed: 'Speed',
    r_time: 'Time, t', r_dist: 'Distance', r_dist_h: 'magnitude only', r_disp: 'Displacement, s', r_disp_h: 'has direction (+ right, − left)',
    r_speed: 'Speed', r_speed_h: 'magnitude of velocity', r_vel: 'Velocity, v',
    dirRight: 'to the right', dirLeft: 'to the left', dirStop: 'momentarily at rest',
    noteTurn: 'The car has turned back, so the distance is greater than the magnitude of the displacement. Speed is always positive but velocity can be negative.',
    noteIdle: 'Press Play or choose a quick scenario.', noteRun: 'Distance and displacement are equal while the car does not turn back.',
    controls: 'Controls', c_u: 'Initial velocity, u', c_a: 'Acceleration, a', c_t: 'Duration, t',
    c_x0: 'Drag the car or use the keyboard arrow keys to change its position.',
    triesH: 'Try this',
    tries: [
      'Choose “Uniform velocity”. What shape are the velocity–time and displacement–time graphs? What does the gradient of the s–t graph mean?',
      'Choose “Turning back” and wait until it ends. Compare the distance with the displacement. Why are they different?',
      'Press “Show area under graph”. Compare the area under the v–t graph with the displacement.',
      'Set u = 10 m/s and a = −2 m/s². When does the car stop momentarily? Check with t = −u/a.',
      'Change the acceleration and watch the gradient of the v–t graph. How is the gradient related to acceleration?'
    ],
    graphsH: 'Motion graphs', areaOn: 'Show area under graph', areaOff: 'Hide area under graph',
    g_s: 'Displacement–time (s–t)', g_v: 'Velocity–time (v–t)', g_a: 'Acceleration–time (a–t)',
    areaNote: 'The area under the v–t graph is the displacement. The gradient of the v–t graph is the acceleration, and the gradient of the s–t graph is the velocity.',
    areaPlain: 'Press the button to see the area, the gradients and how they relate to displacement, velocity and acceleration.',
    eqH: 'Equations of motion (current values)', footer: 'Makmal STEM Simulation Collection',
    start: 'start', trace: 'trace every 1 s', area: 'Area', slope: 'gradient'
  }
};
const L = {uMin: -10, uMax: 20, aMin: -5, aMax: 5, tMin: 1, tMax: 10, x0Min: -50, x0Max: 50};
const PRESETS = {uniform: {u: 5, a: 0, T: 10}, accel: {u: 0, a: 2, T: 10}, decel: {u: 20, a: -4, T: 5}, turn: {u: 12, a: -3, T: 10}};
const C = {s: '#4f46e5', neg: '#e11d48', v: '#0891b2', a: '#ea580c', ink: '#131b2e', mute: '#777587', grid: '#e4e7f1'};
const state = {u: 0, a: 2, T: 10, x0: 0, time: 0, running: false, speed: 1, lang: 'ms', showArea: false, preset: null,
  classMode: false, face: 1, dragRange: null, dirty: true, last: 0};

/* ===== Fizik (kinematik tepat, bukan pengamiran berangka) ===== */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const posAt = (t, p = state) => p.x0 + p.u * t + 0.5 * p.a * t * t;
const velAt = (t, p = state) => p.u + p.a * t;
function distanceAt(t, p = state) {
  const x = posAt(t, p);
  if (p.a !== 0) {
    const ts = -p.u / p.a;
    if (ts > 0 && ts < t) { const xs = posAt(ts, p); return Math.abs(xs - p.x0) + Math.abs(x - xs); }
  }
  return Math.abs(x - p.x0);
}
function niceStep(span) {
  const raw = Math.max(span, 1e-9) / 6, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}
function niceRange(lo, hi) {
  const step = niceStep(hi - lo);
  let min = Math.floor(lo / step + 1e-9) * step, max = Math.ceil(hi / step - 1e-9) * step;
  if (max <= min) max = min + step;
  return {min, max, step};
}
function turnTime(p = state) { return p.a !== 0 && -p.u / p.a > 0 && -p.u / p.a < p.T ? -p.u / p.a : null; }
function trackRange(p = state) {
  const xs = [p.x0, posAt(p.T, p)], ts = turnTime(p);
  if (ts !== null) xs.push(posAt(ts, p));
  const lo = Math.min(...xs), hi = Math.max(...xs), span = Math.max(hi - lo, 20), pad = span * 0.12;
  return niceRange(lo - pad, hi + pad + (span === 20 && hi - lo < 20 ? 0 : 0));
}
function graphRange(vals, minSpan) {
  let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  if (hi - lo < minSpan) { lo -= minSpan / 2; hi += minSpan / 2; }
  const pad = (hi - lo) * 0.08;
  return niceRange(lo - (lo < 0 ? pad : 0), hi + (hi > 0 ? pad : 0));
}
function fmt(n, d = 1) {
  let s = Number(n).toFixed(d);
  if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
  return s.replace('-', '−');
}
const tr = k => I18N[state.lang][k];

/* ===== Kawalan simulasi ===== */
function stepSimulation(dt) {
  if (!state.running) return;
  state.time = Math.min(state.T, state.time + dt);
  if (state.time >= state.T) state.running = false;
  state.dirty = true;
}
