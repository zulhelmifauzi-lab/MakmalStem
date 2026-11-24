'use strict';

/* ==========================================================================
   1. BILINGUAL DICTIONARY (BM / EN)
   ========================================================================== */
const i18n = {
  ms: {
    modelNote: 'Model pembelajaran berskala: semua daya dalam N dan jisim dalam kg. Dimensi objek dan panjang anak panah ialah ilustrasi.',
    crumb: 'Fizik Tingkatan 5 · Bab 1.1',
    back: 'Semua Simulasi',
    reset: 'Set Semula',
    badge: 'Fizik T5 · Bab 1',
    fpsBadge: 'Simulasi Interaktif',
    mainTitle: 'Daya Paduan & Gerakan (Resultant Force)',
    mainSubtitle: 'Gabungkan daya melalui kaedah segi empat selari & segi tiga daya. Terokai kesan daya seimbang (ΣF = 0) vs daya tidak seimbang (F = ma) dalam pelbagai senario dunia sebenar.',
    pRest: 'Seimbang · Pegun',
    pCruise: 'Seimbang · Bergerak (v konstan)',
    pAcc: 'Tidak Seimbang · Memecut',
    scenTugTitle: 'Kapal Tunda Pelabuhan',
    scenTugSub: '2 Bot Tunda · Tarik Bersudut',
    scenTowTitle: 'Acara Tarik Tali',
    scenTowSub: 'Daya Sebaris · 1D Seimbang/Tidak',
    scenCartTitle: 'Makmal Troli & Satah',
    scenCartSub: 'Pita Detik 50Hz · Geseran Permukaan',
    scenFreeTitle: 'Mod Vektor Bebas 360°',
    scenFreeSub: 'Kompas Satah Cartes · Objek Dron',
    play: 'Mula',
    pause: 'Jeda',
    replay: 'Ulang Semula',
    geoOverlays: 'Binaan Geometri',
    chkParallelogram: 'Segi Empat Selari',
    chkTriangle: 'Segi Tiga Daya (H-to-T)',
    chkComponents: 'Leraian Fx & Fy',
    chkValues: 'Nilai & Label Magnitud',
    telemetry: 'Telemetri Langsung',
    netForce: 'Daya Paduan |ΣF|:',
    accel: 'Pecutan |a|:',
    velocity: 'Laju |v|:',
    direction: 'Arah Paduan θ:',
    resultantForce: 'Daya Paduan ΣF',
    velocityVec: 'Halaju (v)',
    graphSectionTitle: 'Graf Gerakan Kinematik Masa Nyata',
    graphVt: 'Graf Halaju - Masa (v - t)',
    graphSt: 'Graf Sesaran - Masa (s - t)',
    pedagogyInsightTitle: 'Sorotan Konsep Fizik & Salah Konsep Lazim SPM',
    pedagogyInsightSub: 'Kefahaman mendalam mengikut DSKP Tingkatan 5 Fizik (Subtopik 1.1)',
    misc1Title: 'Daya Seimbang (ΣF = 0)',
    misc1Text: 'Objek tidak semestinya pegun! Objek boleh meluncur dengan halaju seragam (konstan) tanpa memerlukan sebarang daya paduan (Hukum Newton Pertama).',
    misc2Title: 'Arah Daya vs Arah Gerakan',
    misc2Text: 'Daya paduan menentukan arah pecutan, bukan semestinya arah gerakan semasa! Semasa membrek, daya paduan bertentangan dengan halaju.',
    misc3Title: 'Penjumlahan Vektor Bukan Skalar',
    misc3Text: '30 N + 40 N tidak sentiasa 70 N! Bergantung kepada sudut θ, paduan boleh bernilai antara 10 N (180°) hingga 70 N (0°), dan tepat 50 N pada 90°.',
    paramsTitle: 'Kawalan Parameter',
    paramF1: 'Daya F₁',
    paramAngle1: 'Sudut F₁ (θ₁)',
    paramF2: 'Daya F₂',
    paramAngle2: 'Sudut F₂ (θ₂)',
    paramMass: 'Jisim Objek (m)',
    paramInitialU: 'Halaju Awal (u)',
    liveParameters: 'Daya, sudut, jisim dan geseran berubah secara langsung tanpa mengulang gerakan. Halaju awal digunakan pada t = 0 atau selepas tekan Ulang.',
    paramFriction: 'Pekali Geseran Permukaan (μ)',
    fricSmooth: '0.0 (Licin)',
    fricRough: '0.4 (Kasar)',
    f1Dir: 'Arah F₁',
    f2Dir: 'Arah F₂',
    calcTitle: 'Pengiraan Langkah Demi Langkah',
    step1: '1. Leraian Komponen Daya',
    step2: '2. Hasil Tambah Vektor Komponen',
    step3: '3. Magnitud Daya Paduan |ΣF|',
    step4: '4. Pecutan Mengikut Hukum Newton II',
    chalSectionTitle: 'Cabaran SPM Daya Paduan',
    btnNextChal: 'Tukar Cabaran ↻',
    btnCheckAnswer: 'Semak Jawapan',
    footerText: 'Inisiatif Pembelajaran STEM Interaktif Tanpa Login',
    dskpRef: 'Rujukan DSKP KSSM Fizik T5',
    backToCatalog: 'Koleksi Simulasi Makmal STEM'
  },
  en: {
    crumb: 'Physics Form 5 · Chapter 1.1',
    back: 'All Simulations',
    reset: 'Reset All',
    badge: 'Physics F5 · Ch 1',
    fpsBadge: 'Interactive Simulation',
    mainTitle: 'Resultant Force & Motion',
    mainSubtitle: 'Combine forces using parallelogram of forces and triangle of forces methods. Explore balanced (ΣF = 0) vs unbalanced (F = ma) forces in real-world scenarios.',
    pRest: 'Balanced · At Rest',
    pCruise: 'Balanced · Moving (Const v)',
    pAcc: 'Unbalanced · Accelerating',
    scenTugTitle: 'Port Klang Tugboats',
    scenTugSub: '2 Tugboats · Angled Towing',
    scenTowTitle: 'Tug-of-War Contest',
    scenTowSub: 'Collinear Forces · 1D Balanced/Unbalanced',
    scenCartTitle: 'Physics Cart Lab',
    scenCartSub: '50Hz Ticker Tape · Surface Friction',
    scenFreeTitle: '360° Free Vector Mode',
    scenFreeSub: 'Cartesian Compass · Quadcopter Drone',
    play: 'Play',
    pause: 'Pause',
    replay: 'Replay',
    geoOverlays: 'Geometric Overlays',
    chkParallelogram: 'Parallelogram of Forces',
    chkTriangle: 'Triangle of Forces (H-to-T)',
    chkComponents: 'Resolve Fx & Fy',
    chkValues: 'Magnitudes & Values',
    telemetry: 'Live Telemetry',
    netForce: 'Resultant Force |ΣF|:',
    accel: 'Acceleration |a|:',
    velocity: 'Speed |v|:',
    direction: 'Direction Angle θ:',
    resultantForce: 'Resultant Force ΣF',
    velocityVec: 'Velocity (v)',
    graphSectionTitle: 'Real-Time Kinematics Motion Graph',
    graphVt: 'Velocity - Time (v - t)',
    graphSt: 'Displacement - Time (s - t)',
    pedagogyInsightTitle: 'Physics Concepts & Common SPM Misconceptions',
    pedagogyInsightSub: 'Deep understanding aligned with Form 5 Physics DSKP (Subtopic 1.1)',
    misc1Title: 'Balanced Forces (ΣF = 0)',
    misc1Text: 'An object does not have to be stationary! It can glide at constant velocity with zero resultant force (Newton’s First Law of Motion).',
    misc2Title: 'Force Direction vs Motion Direction',
    misc2Text: 'Resultant force determines acceleration, not necessarily the instantaneous direction of motion! When braking, force opposes velocity.',
    misc3Title: 'Vector Addition is Not Scalar',
    misc3Text: '30 N + 40 N is not always 70 N! Depending on angle θ, the resultant ranges from 10 N (180°) to 70 N (0°), and equals 50 N at 90°.',
    paramsTitle: 'Parameter Controls',
    paramF1: 'Force F₁',
    paramAngle1: 'Angle F₁ (θ₁)',
    paramF2: 'Force F₂',
    paramAngle2: 'Angle F₂ (θ₂)',
    paramMass: 'Object Mass (m)',
    paramInitialU: 'Initial Velocity (u)',
    liveParameters: 'Force, angle, mass and friction update live without restarting motion. Initial velocity applies at t = 0 or after pressing Replay.',
    paramFriction: 'Surface Friction (μ)',
    fricSmooth: '0.0 (Frictionless)',
    fricRough: '0.4 (Rough)',
    f1Dir: 'Direction F₁',
    f2Dir: 'Direction F₂',
    calcTitle: 'Step-by-Step Live Calculation',
    step1: '1. Force Component Resolution',
    step2: '2. Vector Sum of Components',
    step3: '3. Resultant Magnitude |ΣF|',
    step4: '4. Acceleration (Newton II Law)',
    chalSectionTitle: 'SPM Resultant Force Challenges',
    btnNextChal: 'Next Challenge ↻',
    btnCheckAnswer: 'Check Answer',
    footerText: 'Interactive STEM Learning Initiative without Login',
    dskpRef: 'KSSM Form 5 Physics DSKP Reference',
    backToCatalog: 'Makmal STEM Simulations Catalog'
  }
};

/* ==========================================================================
   2. STATE & SIMULATION VARIABLES
   ========================================================================== */
const state = {
  scenario: 'tugboat', // 'tugboat', 'tugofwar', 'cart', 'free'
  running: false,
  slowMo: false,
  time: 0,
  dt: 1 / 60,
  
  // Physics quantities
  f1: 50,       // Newtons
  angle1: 30,   // degrees
  f2: 50,       // Newtons
  angle2: 30,   // degrees
  dir1: 1,      // Collinear: 1 = right, -1 = left
  dir2: -1,     // Collinear: 1 = right, -1 = left
  mass: 20,     // kg; illustrative scale model
  u: 0,         // initial velocity
  frictionMu: 0,// coefficient of friction
  
  // Motion integration
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  ax: 0,
  ay: 0,
  
  // History for graphs
  history: [{ t: 0, s: 0, v: 0, a: 0 }],
  graphMode: 'vt', // 'vt' or 'st'
  
  // Visual Overlays
  showParallelogram: true,
  showTriangle: false,
  showComponents: true,
  showValues: true,
  
  // Active Challenge
  challengeIdx: 0
};

/* ==========================================================================
   4. PHYSICS ENGINE & FORCES RESOLUTION
   ========================================================================== */
function computeForces() {
  const rad = Math.PI / 180;
  let f1x = 0, f1y = 0, f2x = 0, f2y = 0;

  if (state.scenario === 'tugboat') {
    // Boat 1 pulls forward & up (top tugboat) at angle1
    f1x = state.f1 * Math.cos(state.angle1 * rad);
    f1y = state.f1 * Math.sin(state.angle1 * rad);

    // Boat 2 pulls forward & down (bottom tugboat) at -angle2
    f2x = state.f2 * Math.cos(state.angle2 * rad);
    f2y = -state.f2 * Math.sin(state.angle2 * rad);
  } 
  else if (state.scenario === 'tugofwar') {
    // Collinear 1D
    f1x = state.f1 * state.dir1;
    f1y = 0;
    f2x = state.f2 * state.dir2;
    f2y = 0;
  }
  else if (state.scenario === 'cart') {
    // Cart on lab bench (collinear forces F1 & F2 along X)
    f1x = state.f1 * state.dir1;
    f1y = 0;
    f2x = state.f2 * state.dir2;
    f2y = 0;
  }
  else if (state.scenario === 'free') {
    // 360° Arbitrary vectors
    f1x = state.f1 * Math.cos(state.angle1 * rad);
    f1y = state.f1 * Math.sin(state.angle1 * rad);
    f2x = state.f2 * Math.cos(state.angle2 * rad);
    f2y = state.f2 * Math.sin(state.angle2 * rad);
  }

  // Sum of applied forces
  let netFx = f1x + f2x;
  let netFy = f1y + f2y;

  // Friction / Drag calculation
  let fFrictionX = 0, fFrictionY = 0;
  if (state.frictionMu > 0) {
    const speed = Math.hypot(state.vx, state.vy);
    const normalForce = state.mass * 9.81;
    const maxFriction = state.frictionMu * normalForce;
    
    if (speed > 1e-9) {
      fFrictionX = - (state.vx / speed) * maxFriction;
      fFrictionY = - (state.vy / speed) * maxFriction;
    } else if (Math.hypot(netFx, netFy) <= maxFriction) {
      // Static friction balances net force
      fFrictionX = -netFx;
      fFrictionY = -netFy;
    } else {
      const appliedAngle = Math.atan2(netFy, netFx);
      fFrictionX = -Math.cos(appliedAngle) * maxFriction;
      fFrictionY = -Math.sin(appliedAngle) * maxFriction;
    }
  }

  // Total Resultant Force including friction
  const totalNetFx = netFx + fFrictionX;
  const totalNetFy = netFy + fFrictionY;

  // Clean tiny floating point noise
  const cleanFx = Math.abs(totalNetFx) < 1e-6 ? 0 : totalNetFx;
  const cleanFy = Math.abs(totalNetFy) < 1e-6 ? 0 : totalNetFy;
  const magnitude = Math.hypot(cleanFx, cleanFy);

  // Angle in degrees [0, 360)
  let directionDeg = (Math.atan2(cleanFy, cleanFx) / rad + 360) % 360;
  if (magnitude < 1e-5) directionDeg = 0;

  // Acceleration: F = ma => a = F / m
  const ax = cleanFx / state.mass;
  const ay = cleanFy / state.mass;
  const aMagnitude = magnitude / state.mass;

  return {
    f1x, f1y,
    f2x, f2y,
    netFx: cleanFx,
    netFy: cleanFy,
    magnitude,
    directionDeg,
    ax, ay,
    aMagnitude,
    fFrictionX, fFrictionY
  };
}

function stepSimulation(dt) {
  if (!state.running || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, Math.max(0, 30 - state.time));
  let remaining = dt;
  // With constant controls, a 1D frictional step has at most one stop.
  // Split at that instant so static friction or reverse sliding applies immediately.
  for (let segment = 0; segment < 2 && remaining > 1e-12; segment++) {
    const f = computeForces();
    let duration = remaining;
    let stops = false;
    if (state.scenario === 'cart' && state.frictionMu > 0 && state.vx * f.ax < 0) {
      const stopTime = -state.vx / f.ax;
      if (stopTime <= remaining) { duration = stopTime; stops = true; }
    }
    state.x += state.vx * duration + 0.5 * f.ax * duration * duration;
    state.y += state.vy * duration + 0.5 * f.ay * duration * duration;
    state.vx += f.ax * duration;
    state.vy += f.ay * duration;
    if (stops) state.vx = 0;
    remaining -= duration;
  }
  state.time += dt;
  const current = computeForces();
  state.ax = current.ax;
  state.ay = current.ay;
  if (state.time >= 30 - 1e-9) {
    state.time = 30;
    state.running = false;
    if (typeof updatePlaybackUI === 'function') updatePlaybackUI();
  }
  const lastHist = state.history[state.history.length - 1];
  if (!lastHist || state.time - lastHist.t >= 0.08 || !state.running) {
    const point = {t: state.time, s: state.x, v: state.vx, a: current.ax};
    if (lastHist && Math.abs(lastHist.t - state.time) < 1e-9) state.history[state.history.length - 1] = point;
    else state.history.push(point);
  }
}
