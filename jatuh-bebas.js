(() => {
'use strict';
const { nowMs, I18N, PLANETS, ITEMS, LEVELS, LEVEL_LBL, LANE_COL, LANE_CANVAS_COL, LANE_NM, clamp, lerp, f, paramsFor, motion, landTime, impactMetrics } = globalThis.FallModel;

const state = {
  planet:'bumi', mode:'vakum', H:20, speed:1,
  running:false, finished:false, t:0,
  lanes:[null, null, null],
  force:true, strobe:false, sound:true,
  graph:'v', prediction:null, predOpen:false, activePreset:-1, lang:'ms', drawerOpen:false
};

const T = k => I18N[state.lang][k];
const itemName = it => state.lang === 'en' ? it.nameEn : it.name;
const planetName = P => state.lang === 'en' ? P.nameEn : P.name;

const params = key => paramsFor(state.planet, state.mode, key);
function info(i){
  const L = state.lanes[i]; if (!L) return null;
  const p = params(L.item), h0 = state.H*LEVELS[L.level];
  const tl = landTime(p, h0);
  const landed = state.t >= tl;
  const tt = Math.min(state.t, tl);
  const m = motion(p, tt);
  return {i, L, it:ITEMS[L.item], p, h0, tl, tt, landed,
    s:landed ? h0 : Math.min(m.s, h0), v:m.v, a:landed ? 0 : m.a,
    R:landed ? 0 : p.k*m.v*m.v, W:p.m*p.g};
}
/* ================= CANVAS SETUP ================= */
const $ = s => document.querySelector(s);
const cv = $('#stage'), ctx = cv.getContext('2d');
const wrap = $('#stageWrap');
let cw = 0, ch = 0, dpr = 1, G = null;
let stars = [], clouds = [], airDots = [], craters = [], rocks = [];

function geom(){
  const sc = clamp(Math.min(ch/620, cw/500), 0.62, 1.08);
  const rulerW = 54*sc, groundH = 52*sc, topY = Math.max(178, 192*sc);
  const groundY = ch - groundH;
  return {sc, rulerW, groundH, topY, groundY, laneW:(cw - rulerW - 10)/3, isz:sc*0.95};
}
const yOf = m => G.groundY - (m/state.H)*(G.groundY - G.topY);
const laneX = i => G.rulerW + 5 + G.laneW*(i + 0.5);
function slotCenter(l, lv){ return {x:laneX(l), y:yOf(state.H*LEVELS[lv]) - 24*G.isz}; }

function resize(){
  const r = wrap.getBoundingClientRect();
  cw = r.width || 600; ch = r.height || 540;
  dpr = Math.min(2.5, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  cv.width = Math.round(cw*dpr); cv.height = Math.round(ch*dpr);
  G = geom();
  positionHeightButtons();
  initAmbient();
}
function rnd(a, b){ return a + Math.random()*(b - a); }
function initAmbient(){
  if (!G) return;
  stars = Array.from({length:110}, () => ({x:rnd(0,cw), y:rnd(0,G.groundY*0.95), r:rnd(0.4,1.7), ph:rnd(0,6.3), sp:rnd(0.6,2.2)}));
  clouds = Array.from({length:4}, () => ({x:rnd(0,cw), y:rnd(G.groundY*0.08, G.groundY*0.52), s:rnd(0.6,1.15), v:rnd(4,12)}));
  craters = Array.from({length:9}, () => ({x:rnd(0,cw), y:rnd(G.groundY+12*G.sc, ch-6), rx:rnd(8,26)*G.sc}));
  rocks = Array.from({length:12}, () => ({x:rnd(0,cw), y:rnd(G.groundY+10*G.sc, ch-4), r:rnd(2,6)*G.sc}));
  resetAirDots();
}
function resetAirDots(){
  const P = PLANETS[state.planet];
  const n = state.mode === 'udara' && P.rho > 0 ? (P.rho > 1 ? 85 : 16) : 0;
  airDots = Array.from({length:n}, () => ({x:rnd(G.rulerW, cw), y:rnd(G.topY - 60*G.sc, G.groundY), vx:rnd(-6,6), vy:rnd(-4,4), r:rnd(0.8,1.8)}));
}
if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(wrap);

/* ================= DRAW HELPERS ================= */
function rr(c, x, y, w, h, r){
  if (!(w > 0) || !(h > 0)){ c.beginPath(); return; }
  r = Math.max(0, Math.min(r, w/2, h/2));
  c.beginPath(); c.moveTo(x+r, y); c.arcTo(x+w, y, x+w, y+h, r); c.arcTo(x+w, y+h, x, y+h, r);
  c.arcTo(x, y+h, x, y, r); c.arcTo(x, y, x+w, y, r); c.closePath();
}
function circ(c, x, y, r){ c.beginPath(); c.arc(x, y, r, 0, Math.PI*2); }
function arrow(c, x1, y1, x2, y2, col, w){
  const len = Math.hypot(x2-x1, y2-y1); if (len < 2) return;
  const a = Math.atan2(y2-y1, x2-x1), hl = Math.min(9*G.sc+w, len*0.6);
  c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - Math.cos(a)*hl*0.7, y2 - Math.sin(a)*hl*0.7); c.stroke();
  c.beginPath(); c.moveTo(x2, y2);
  c.lineTo(x2 - hl*Math.cos(a - 0.45), y2 - hl*Math.sin(a - 0.45));
  c.lineTo(x2 - hl*Math.cos(a + 0.45), y2 - hl*Math.sin(a + 0.45)); c.closePath(); c.fill();
  c.restore();
}

const RENYUK_PTS = (() => { const pts = []; const n = 13; for (let i = 0; i < n; i++){ const a = i/n*Math.PI*2; const r = 12 + ((i*7919) % 5) - 1.5; pts.push([Math.cos(a)*r, Math.sin(a)*r*0.92]); } return pts; })();
const ART = {
  boling(c){
    const g = c.createRadialGradient(-8,-9,2,0,0,24); g.addColorStop(0,'#8b7dff'); g.addColorStop(.45,'#3a2a9a'); g.addColorStop(1,'#120a38');
    c.fillStyle = g; circ(c,0,0,22); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = 2.2;
    c.beginPath(); c.arc(4,6,14,3.6,5.2); c.stroke(); c.beginPath(); c.arc(-6,4,10,0.2,1.6); c.stroke();
    c.fillStyle = '#06031a'; circ(c,-5,-9,3.3); c.fill(); circ(c,3.5,-10,3.3); c.fill(); circ(c,-1,-1.5,3.8); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-10,-12,5,2.6,-0.6,0,Math.PI*2); c.fill();
  },
  tukul(c){
    let g = c.createLinearGradient(-4,0,4,0); g.addColorStop(0,'#d99a5a'); g.addColorStop(1,'#8a5526');
    c.fillStyle = g; rr(c,-3.6,-11,7.2,35,3); c.fill();
    c.fillStyle = '#5a3415'; rr(c,-4.2,14,8.4,9,3); c.fill();
    g = c.createLinearGradient(0,-24,0,-9); g.addColorStop(0,'#f2f4f7'); g.addColorStop(1,'#7a828e');
    c.fillStyle = g; rr(c,-20,-24,40,14,3.5); c.fill();
    c.fillStyle = '#5f6672'; rr(c,14,-24,6,14,2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(-17,-22,26,2.2);
  },
  buku(c){
    c.fillStyle = '#fbf5e3'; rr(c,-19,-13,41,29,2); c.fill();
    c.strokeStyle = '#d6cbb0'; c.lineWidth = 0.8;
    for (let i = 0; i < 4; i++){ c.beginPath(); c.moveTo(-17, 13 - i*1.6 + 2); c.lineTo(21, 13 - i*1.6 + 2); c.stroke(); }
    const g = c.createLinearGradient(-22,-16,20,14); g.addColorStop(0,'#ff6a55'); g.addColorStop(1,'#c9302a');
    c.fillStyle = g; rr(c,-22,-16,41,29,3); c.fill();
    c.fillStyle = '#9f231d'; rr(c,-22,-16,7,29,3); c.fill();
    c.fillStyle = '#ffd36b'; rr(c,-10,-9,22,4.5,2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)'; rr(c,-8,-1,17,2.2,1); c.fill(); rr(c,-8,3.5,12,2.2,1); c.fill();
  },
  epal(c){
    const g = c.createRadialGradient(-6,-2,2,0,4,18); g.addColorStop(0,'#ff7a6b'); g.addColorStop(.6,'#e0262f'); g.addColorStop(1,'#8e0f1a');
    c.fillStyle = g; c.beginPath();
    c.moveTo(0,-9); c.bezierCurveTo(10,-17,20,-6,15,7); c.bezierCurveTo(12,16,4,19,0,16);
    c.bezierCurveTo(-4,19,-12,16,-15,7); c.bezierCurveTo(-20,-6,-10,-17,0,-9); c.fill();
    c.strokeStyle = '#5a3415'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0,-8); c.quadraticCurveTo(1,-14,3,-17); c.stroke();
    c.fillStyle = '#4caf50'; c.beginPath(); c.ellipse(8,-15,6,2.8,-0.5,0,Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-8,-3,3,5,0.4,0,Math.PI*2); c.fill();
  },
  pingpong(c){
    const g = c.createRadialGradient(-4,-4,1,0,0,12); g.addColorStop(0,'#fff3e0'); g.addColorStop(.5,'#ffa047'); g.addColorStop(1,'#d96a12');
    c.fillStyle = g; circ(c,0,0,11); c.fill();
    c.strokeStyle = 'rgba(160,70,0,.4)'; c.lineWidth = 0.9; c.beginPath(); c.ellipse(0,0,11,3.5,0.3,0,Math.PI*2); c.stroke();
  },
  renyuk(c){
    c.fillStyle = '#f4f1e8'; c.strokeStyle = '#b8b2a0'; c.lineWidth = 1.2;
    c.beginPath(); RENYUK_PTS.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(120,112,95,.55)'; c.lineWidth = 0.9; c.beginPath();
    c.moveTo(-8,-5); c.lineTo(0,1); c.lineTo(7,-6); c.moveTo(0,1); c.lineTo(-2,9); c.moveTo(3,4); c.lineTo(9,6); c.moveTo(-9,3); c.lineTo(-3,5); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.07)'; c.beginPath(); c.moveTo(0,1); c.lineTo(7,-6); c.lineTo(11,2); c.lineTo(3,4); c.fill();
  },
  kertas(c){
    c.fillStyle = '#eaf2fb'; c.strokeStyle = '#475569'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-25,-2); c.lineTo(20,-7); c.lineTo(25,2); c.lineTo(-20,7); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(59,130,246,.72)'; c.lineWidth = 1.0;
    for (let i = -2; i <= 2; i++){ c.beginPath(); c.moveTo(-21 + i*0.3, 1.2*i - 0.5); c.lineTo(21 + i*0.3, 1.2*i - 5); c.stroke(); }
  },
  bulu(c){
    c.save(); c.rotate(-0.35);
    const g = c.createLinearGradient(-10,-24,10,22); g.addColorStop(0,'#ffffff'); g.addColorStop(.7,'#efe7d4'); g.addColorStop(1,'#cbb894');
    c.fillStyle = g; c.beginPath(); c.moveTo(0,-24);
    c.quadraticCurveTo(13,-12,10,6); c.quadraticCurveTo(7,16,1,19);
    c.quadraticCurveTo(-9,10,-10,-6); c.quadraticCurveTo(-8,-18,0,-24); c.fill();
    c.strokeStyle = 'rgba(150,130,95,.5)'; c.lineWidth = 0.7;
    for (let i = -18; i < 16; i += 4){ c.beginPath(); c.moveTo(0.5, i); c.lineTo(9, i - 5); c.moveTo(0.5, i); c.lineTo(-8.5, i - 5); c.stroke(); }
    c.strokeStyle = '#8a7350'; c.lineWidth = 1.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0,-24); c.quadraticCurveTo(2,0,0,25); c.stroke();
    c.restore();
  }
};
function drawItem(c, key, x, y, s, rot){
  c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(s, s); ART[key](c); c.restore();
}
function iconCanvas(key, w, h, cvs){
  const d = Math.min(3, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  const el = cvs || document.createElement('canvas');
  el.width = w*d; el.height = h*d; el.style.width = w + 'px'; el.style.height = h + 'px';
  const c = el.getContext('2d'); c.setTransform(d,0,0,d,0,0); c.clearRect(0,0,w,h);
  const it = ITEMS[key]; const s = Math.min((w-4)/it.w, (h-4)/it.h, 1.3);
  drawItem(c, key, w/2, h/2, s, 0);
  return el;
}

/* ================= AUDIO ================= */
let AC = null;
function ac(){
  if (!AC && typeof window !== 'undefined'){ try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume().catch(()=>{});
  return AC;
}
function tone(f1, f2, dur, type, vol, delay=0){
  if (!state.sound) return; const a = ac(); if (!a) return;
  const t0 = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, vol, freq){
  if (!state.sound) return; const a = ac(); if (!a) return;
  const n = Math.floor(a.sampleRate*dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, 2.5);
  const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  s.buffer = b; fl.type = 'lowpass'; fl.frequency.value = freq; g.gain.value = vol;
  s.connect(fl).connect(g).connect(a.destination); s.start();
}
const sfx = {
  clunk(){ tone(220, 90, 0.09, 'square', 0.07); tone(1400, 900, 0.04, 'sine', 0.05); },
  release(){ tone(900, 160, 0.22, 'sawtooth', 0.05); },
  pick(){ tone(520, 760, 0.06, 'sine', 0.06); },
  thud(m, v){
    const p = m*v, vol = clamp(0.05 + Math.log10(1 + p*8)*0.17, 0.04, 0.58);
    if (m > 0.8){ tone(95, 34, 0.38, 'sine', vol); noise(0.28, vol*0.95, 580); }
    else if (m > 0.05){ tone(220, 90, 0.16, 'sine', vol); noise(0.12, vol*0.6, 1500); }
    else { tone(700, 420, 0.06, 'triangle', Math.max(0.03, vol*0.6)); }
  },
  done(){ [523, 659, 784].forEach((fq, i) => tone(fq, fq, 0.18, 'triangle', 0.06, i*0.09)); }
};

/* ================= IMPACT FX & GROUND CRATER ================= */
let particles = [], rings = [], impactWaves = [], shake = 0;
function burst(x, y, m, v, imp){
  if (!G) return;
  const P = PLANETS[state.planet];
  const s = imp.scale;
  const n = Math.round(clamp(5 + s * 44, 5, 54));
  const lowG = state.planet !== 'bumi';
  for (let i = 0; i < n; i++){
    const a = rnd(Math.PI*1.06, Math.PI*1.94);
    const sp = rnd(35, 85 + s * 220) * G.sc;
    particles.push({
      x: x + rnd(-12 * (0.4 + s), 12 * (0.4 + s)) * G.sc,
      y: y - 2 * G.sc,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 1,
      decay: lowG ? rnd(0.32, 0.58) : rnd(0.85, 1.55),
      r: rnd(1.4, 2.2 + s * 3.4) * G.sc,
      col: P.dust[i % P.dust.length],
      g: (lowG ? 125 : 410) * G.sc
    });
  }
  impactWaves.push({ x, y: G.groundY + 2 * G.sc, t0: nowMs(), scale: s, col: P.dust[0] });
  if (s >= 0.48) {
    impactWaves.push({ x, y: G.groundY + 2 * G.sc, t0: nowMs() + 90, scale: s * 1.25, col: '#fde047' });
  }
  shake = Math.max(shake, clamp(s * 13, 0, 13));
}

function drawGroundImpact(c, o){
  const imp = o.L.impact;
  if (!imp) return;
  const P = PLANETS[state.planet];
  const x = laneX(o.i), gy = G.groundY;
  const s = imp.scale;
  const age = clamp((nowMs() - imp.t0) / 260, 0, 1);
  const ease = 1 - Math.pow(1 - age, 3);
  const rx = (10 + s * 36) * G.sc * ease;
  const ry = (2.5 + s * 11) * G.sc * ease;

  // Depression / crater on ground
  c.save();
  c.fillStyle = P.craterRim;
  c.beginPath();
  c.ellipse(x, gy + ry * 0.45, rx, ry, 0, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = 'rgba(15, 10, 10, 0.42)';
  c.beginPath();
  c.ellipse(x, gy + ry * 0.65, rx * 0.78, ry * 0.7, 0, 0, Math.PI * 2);
  c.fill();

  // Raised soil lip on left/right edges for heavy or fast impacts
  if (s >= 0.25) {
    c.fillStyle = P.gTop;
    c.beginPath(); c.ellipse(x - rx * 0.85, gy + 1.5 * G.sc, (3 + s * 7) * G.sc * ease, (2 + s * 3) * G.sc * ease, -0.18, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x + rx * 0.85, gy + 1.5 * G.sc, (3 + s * 7) * G.sc * ease, (2 + s * 3) * G.sc * ease, 0.18, 0, Math.PI * 2); c.fill();
  }

  // Ground cracks for moderate & strong impacts
  if (s >= 0.35) {
    const rays = s >= 0.65 ? 5 : 3;
    c.strokeStyle = 'rgba(15, 10, 10, 0.5)';
    c.lineWidth = (1.1 + s * 1.1) * G.sc;
    c.lineCap = 'round';
    for (let r = 0; r < rays; r++) {
      const dir = (r - (rays - 1) / 2) / Math.max(1, (rays - 1) / 2);
      const len = (10 + s * 22) * G.sc * ease;
      const sx0 = x + dir * rx * 0.55;
      const sy0 = gy + ry * 0.7;
      c.beginPath();
      c.moveTo(sx0, sy0);
      c.lineTo(sx0 + dir * len * 0.55, sy0 + len * 0.42);
      c.lineTo(sx0 + dir * len, sy0 + len * 0.62);
      c.stroke();
    }
  }
  c.restore();
}

/* ================= RENDER ================= */
let clock = 0;
function drawScene(dt){
  const c = ctx, P = PLANETS[state.planet];
  c.setTransform(dpr,0,0,dpr,0,0);
  const sx = shake ? rnd(-shake, shake) : 0, sy = shake ? rnd(-shake, shake) : 0;
  c.translate(sx, sy);

  const g = c.createLinearGradient(0,0,0,G.groundY); g.addColorStop(0,P.sky[0]); g.addColorStop(1,P.sky[1]);
  c.fillStyle = g; c.fillRect(-12,-12,cw+24,ch+24);
  if (state.planet === 'bulan'){
    for (const s of stars){ c.globalAlpha = 0.35 + 0.65*Math.abs(Math.sin(clock*s.sp + s.ph)); c.fillStyle = '#fff'; circ(c,s.x,s.y,s.r); c.fill(); }
    c.globalAlpha = 1;
    const ex = cw*0.82, ey = G.groundY*0.17, er = 22*G.sc;
    const eg = c.createRadialGradient(ex-er*0.3, ey-er*0.3, 2, ex, ey, er); eg.addColorStop(0,'#7cc4ff'); eg.addColorStop(1,'#1d4fa3');
    c.fillStyle = 'rgba(120,180,255,.15)'; circ(c,ex,ey,er*1.5); c.fill();
    c.fillStyle = eg; circ(c,ex,ey,er); c.fill();
    c.fillStyle = '#5cc36a'; c.beginPath(); c.ellipse(ex-er*0.25, ey-er*0.1, er*0.35, er*0.22, 0.5, 0, 7); c.fill();
    c.beginPath(); c.ellipse(ex+er*0.35, ey+er*0.3, er*0.22, er*0.15, -0.4, 0, 7); c.fill();
    c.fillStyle = 'rgba(0,0,20,.45)'; c.beginPath(); c.arc(ex, ey, er, -1.2, 1.9); c.arc(ex - er*0.5, ey, er*0.95, 1.9, -1.2, true); c.fill();
  } else {
    const sunx = cw*0.82, suny = G.groundY*0.15, sr = (state.planet === 'bumi' ? 22 : 12)*G.sc;
    const sg = c.createRadialGradient(sunx, suny, 1, sunx, suny, sr*4); sg.addColorStop(0,'rgba(255,250,220,.95)'); sg.addColorStop(0.25,'rgba(255,240,180,.5)'); sg.addColorStop(1,'rgba(255,240,180,0)');
    c.fillStyle = sg; circ(c, sunx, suny, sr*4); c.fill();
    c.fillStyle = '#fffbe6'; circ(c, sunx, suny, sr); c.fill();
    if (state.planet === 'bumi'){
      for (const cl of clouds){
        cl.x += cl.v*dt; if (cl.x > cw + 80) cl.x = -80;
        const s = cl.s*G.sc; c.fillStyle = 'rgba(255,255,255,.85)';
        circ(c, cl.x, cl.y, 18*s); c.fill(); circ(c, cl.x + 20*s, cl.y - 8*s, 22*s); c.fill(); circ(c, cl.x + 42*s, cl.y, 17*s); c.fill();
        rr(c, cl.x - 16*s, cl.y, 74*s, 16*s, 8*s); c.fill();
      }
    }
  }
  c.fillStyle = P.hill; c.globalAlpha = state.planet === 'bulan' ? 1 : 0.55;
  c.beginPath(); c.moveTo(0, G.groundY);
  for (let x = 0; x <= cw + 20; x += 20){ c.lineTo(x, G.groundY - (18 + 14*Math.sin(x*0.013 + 1) + 9*Math.sin(x*0.031))*G.sc); }
  c.lineTo(cw + 20, G.groundY); c.fill(); c.globalAlpha = 1;

  c.fillStyle = P.gBody; c.fillRect(-12, G.groundY, cw + 24, G.groundH + 12);
  c.fillStyle = P.gTop; c.fillRect(-12, G.groundY, cw + 24, 7*G.sc);
  if (state.planet === 'bulan'){ c.fillStyle = 'rgba(0,0,0,.18)'; for (const k of craters){ c.beginPath(); c.ellipse(k.x, k.y, k.rx, k.rx*0.3, 0, 0, 7); c.fill(); } }
  else { c.fillStyle = 'rgba(0,0,0,.18)'; for (const k of rocks){ circ(c, k.x, k.y, k.r); c.fill(); } }

  const infos = [0,1,2].map(info);
  for (const o of infos){
    if (o && o.landed) drawGroundImpact(c, o);
  }

  c.font = `800 ${Math.round(13*G.sc + 2)}px "Plus Jakarta Sans", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0; i < 3; i++){
    const x = laneX(i), y = G.groundY + G.groundH*0.64;
    c.fillStyle = 'rgba(15,23,42,.55)'; rr(c, x - 13*G.sc, y - 10*G.sc, 26*G.sc, 20*G.sc, 7*G.sc); c.fill();
    c.fillStyle = LANE_CANVAS_COL[i]; c.fillText(LANE_NM[i], x, y + 1);
  }

  const vac = state.mode === 'vakum';
  const chX = G.rulerW + 2, chW = cw - G.rulerW - 8, chTop = G.topY - 86*G.sc;
  if (vac){ c.fillStyle = 'rgba(160,215,255,.1)'; rr(c, chX, chTop, chW, G.groundY - chTop + 2, 20*G.sc); c.fill(); }

  drawRuler(c);

  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.setLineDash([3,7]);
  for (let i = 1; i < 3; i++){ const x = G.rulerW + 5 + G.laneW*i; c.beginPath(); c.moveTo(x, G.topY - 40*G.sc); c.lineTo(x, G.groundY); c.stroke(); }
  c.setLineDash([]);

  if (airDots.length){
    c.fillStyle = state.planet === 'bumi' ? 'rgba(255,255,255,.55)' : 'rgba(255,235,210,.55)';
    for (const d of airDots){
      d.x += d.vx*dt; d.y += d.vy*dt;
      if (d.x < G.rulerW) d.x = cw; if (d.x > cw) d.x = G.rulerW;
      if (d.y < G.topY - 60*G.sc) d.y = G.groundY; if (d.y > G.groundY) d.y = G.topY - 60*G.sc;
      circ(c, d.x, d.y, d.r*G.sc); c.fill();
    }
  }

  const locked = state.t > 0 || state.running;

  for (let l = 0; l < 3; l++){
    for (let lv = 0; lv < 3; lv++){
      const L = state.lanes[l];
      const occupied = L && L.level === lv && !(drag && drag.started && drag.src === 'stage' && drag.fromLane === l);
      const hov = drag && drag.started && drag.hover && drag.hover.lane === l && drag.hover.level === lv;
      if (!occupied && !locked) drawTarget(c, l, lv, hov);
    }
  }

  if (state.strobe && state.t > 0){
    const act = infos.filter(Boolean);
    if (act.length){
      const minTl = Math.min(...act.map(o => o.tl));
      const dtS = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2].find(v => v >= minTl/12) || 2;
      for (const o of act){
        const n = Math.min(160, Math.floor(o.tt/dtS));
        c.globalAlpha = 0.28;
        let lastY = -1e9; const minGap = Math.max(6, o.it.h*G.isz*0.55);
        for (let k = 0; k <= n; k++){
          const s = Math.min(motion(o.p, k*dtS).s, o.h0);
          const y = yOf(o.h0 - s) - o.it.h*G.isz/2;
          if (y - lastY < minGap) continue; lastY = y;
          drawItem(c, o.L.item, laneX(o.i), y, G.isz, 0);
        }
        c.globalAlpha = 1;
      }
    }
  }

  for (const o of infos){
    if (!o) continue;
    if (drag && drag.started && drag.src === 'stage' && drag.fromLane === o.i) continue;
    drawObject(c, o, locked);
  }

  // Shockwaves on impact
  const now = nowMs();
  for (let i = impactWaves.length - 1; i >= 0; i--){
    const w = impactWaves[i];
    if (now < w.t0) continue;
    const k = (now - w.t0) / (420 + w.scale * 380);
    if (k >= 1){ impactWaves.splice(i, 1); continue; }
    const rx = (10 + k * (24 + w.scale * 62)) * G.sc;
    const ry = (3 + k * (7 + w.scale * 16)) * G.sc;
    c.save();
    c.strokeStyle = w.col;
    c.globalAlpha = (1 - k) * (0.45 + w.scale * 0.5);
    c.lineWidth = (1.6 + w.scale * 3.2) * (1 - k * 0.5);
    c.beginPath();
    c.ellipse(w.x, w.y, rx, ry, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  for (let i = particles.length - 1; i >= 0; i--){
    const p = particles[i];
    p.vy += p.g*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.life -= p.decay*dt;
    if (p.y > G.groundY + 4*G.sc){ p.y = G.groundY + 4*G.sc; p.vy *= -0.25; p.vx *= 0.6; }
    if (p.life <= 0){ particles.splice(i, 1); continue; }
    c.globalAlpha = clamp(p.life, 0, 1); c.fillStyle = p.col; circ(c, p.x, p.y, p.r); c.fill();
  }
  c.globalAlpha = 1;

  for (let i = rings.length - 1; i >= 0; i--){
    const r = rings[i], k = (now - r.t0)/450; if (k >= 1){ rings.splice(i, 1); continue; }
    c.strokeStyle = r.col; c.globalAlpha = 1 - k; c.lineWidth = 3*(1 - k) + 0.5;
    circ(c, r.x, r.y, (14 + 34*k)*G.sc); c.stroke();
  }
  c.globalAlpha = 1;

  if (vac){
    c.strokeStyle = 'rgba(210,240,255,.55)'; c.lineWidth = 2; rr(c, chX, chTop, chW, G.groundY - chTop + 2, 20*G.sc); c.stroke();
    const hg = c.createLinearGradient(chX, 0, chX + 40*G.sc, 0); hg.addColorStop(0,'rgba(255,255,255,.18)'); hg.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle = hg; c.fillRect(chX + 6, chTop + 20, 30*G.sc, G.groundY - chTop - 30);
    c.save();
    c.font = `800 ${Math.round(10*G.sc + 2)}px "Plus Jakarta Sans", system-ui, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.shadowColor = 'rgba(15,23,42,0.55)'; c.shadowBlur = 4;
    c.fillStyle = 'rgba(235,248,255,.98)';
    c.fillText(state.lang === 'en' ? 'VACUUM CHAMBER · no air' : 'KEBUK VAKUM · tiada udara', chX + chW/2, chTop - 7*G.sc);
    c.restore();
  }

  if (drag && drag.started && drag.src === 'stage'){
    let x = drag.x, y = drag.y;
    if (drag.hover){ const sc = slotCenter(drag.hover.lane, drag.hover.level); x = lerp(x, sc.x, 0.4); y = lerp(y, sc.y, 0.4); }
    drawItem(c, drag.item, x, y, G.isz*1.12, Math.sin(clock*8)*0.05);
  }
  c.setTransform(1,0,0,1,0,0);
}

function drawRuler(c){
  const px = G.rulerW*0.64, top = G.topY, bot = G.groundY;
  const steps = [0.5, 1, 2, 5, 10, 20, 25, 50];
  const pxPerM = (bot - top)/state.H;
  const step = steps.find(s => s*pxPerM >= 26*G.sc) || 50;

  // Clean vertical scale line (no red-white stripes)
  c.save();
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.lineCap = 'round';
  c.beginPath(); c.moveTo(px, top); c.lineTo(px, bot); c.stroke();

  c.font = `700 ${Math.round(8.5*G.sc + 2)}px "Plus Jakarta Sans", system-ui, sans-serif`;
  c.textAlign = 'right'; c.textBaseline = 'middle';
  const lvY = LEVELS.map(lv => yOf(state.H*lv));
  for (let m = 0; m <= state.H + 1e-6; m += step){
    const y = yOf(m);
    const isMajor = Math.abs(m - state.H) < 1e-6 || m === 0;
    c.strokeStyle = 'rgba(255,255,255,.72)'; c.lineWidth = isMajor ? 1.8 : 1.1;
    c.beginPath(); c.moveTo(px - (isMajor ? 7 : 5)*G.sc, y); c.lineTo(px + 2*G.sc, y); c.stroke();
    if (lvY.some(ly => Math.abs(ly - y) < 14*G.sc)) continue;
    c.fillStyle = 'rgba(255,255,255,.94)';
    c.shadowColor = 'rgba(15,23,42,.75)'; c.shadowBlur = 4;
    const t = (step < 1 ? f(m,1) : Math.round(m)) + '';
    c.fillText(t, px - 8*G.sc, y);
  }

  // Height labels written cleanly above dashed lines inside translucent dark pills
  for (let i = 0; i < 3; i++){
    const y = lvY[i];
    c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,235,160,.5)'; c.lineWidth = 1.3; c.setLineDash([6,6]);
    c.beginPath(); c.moveTo(px + 3*G.sc, y); c.lineTo(cw - 10, y); c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(253,224,71,.88)'; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(px - 6*G.sc, y); c.lineTo(px + 4*G.sc, y); c.stroke();

    const lbl = LEVEL_LBL[i], valTxt = ' · ' + fmtM(state.H*LEVELS[i]);
    c.font = `800 ${Math.round(9.5*G.sc + 2)}px "Plus Jakarta Sans", system-ui, sans-serif`;
    const wLbl = c.measureText(lbl).width;
    c.font = `700 ${Math.round(9*G.sc + 2)}px "Plus Jakarta Sans", system-ui, sans-serif`;
    const wVal = c.measureText(valTxt).width;
    const padX = 6*G.sc, pillH = Math.round(14*G.sc + 3);
    const pillW = wLbl + wVal + padX*2;
    const rightEdge = cw - Math.max(12, 14*G.sc);
    const pillX = rightEdge - pillW;
    const xLbl = pillX + padX, pillY = y + 4*G.sc;
    c.fillStyle = 'rgba(15,23,42,0.48)';
    rr(c, pillX, pillY, pillW, pillH, 5*G.sc);
    c.fill();

    c.shadowColor = 'rgba(15,23,42,.6)'; c.shadowBlur = 3;
    c.textAlign = 'left'; c.textBaseline = 'middle';
    const textY = pillY + pillH/2 + 0.5;
    c.font = `800 ${Math.round(9.5*G.sc + 2)}px "Plus Jakarta Sans", system-ui, sans-serif`;
    c.fillStyle = '#fde047'; c.fillText(lbl, xLbl, textY);
    c.font = `700 ${Math.round(9*G.sc + 2)}px "Plus Jakarta Sans", system-ui, sans-serif`;
    c.fillStyle = '#ffffff'; c.fillText(valTxt, xLbl + wLbl, textY);
  }
  c.restore();
}
const fmtM = m => (Math.abs(m - Math.round(m)) < 1e-6 ? Math.round(m) : f(m, 2).replace(/0$/, '')) + ' m';

function drawTarget(c, l, lv, hov){
  const p = slotCenter(l, lv), r = 22*G.isz;
  const pulse = 0.5 + 0.5*Math.sin(clock*4 + l + lv);
  const dragging = drag && drag.started;
  c.save();
  if (hov){ c.shadowColor = LANE_CANVAS_COL[l]; c.shadowBlur = 24; }
  c.strokeStyle = hov ? LANE_CANVAS_COL[l] : `rgba(255,255,255,${dragging ? 0.6 + pulse*0.3 : 0.34})`;
  c.lineWidth = hov ? 3 : 1.6; c.setLineDash(hov ? [] : [5,5]); c.lineDashOffset = -clock*12;
  circ(c, p.x, p.y, r*(hov ? 1.15 : 1)); c.stroke(); c.setLineDash([]);
  c.restore();
  c.fillStyle = hov ? LANE_CANVAS_COL[l] : 'rgba(255,255,255,.55)';
  c.font = `800 ${Math.round(16*G.sc)}px "Plus Jakarta Sans", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('+', p.x, p.y + 1);
  if (hov){
    c.strokeStyle = LANE_CANVAS_COL[l]; c.lineWidth = 1.5;
    for (let k = 0; k < 3; k++){ const ph = (clock*1.6 + k/3) % 1; c.globalAlpha = 0.7*(1 - ph); circ(c, p.x, p.y, r*(1 + ph*0.9)); c.stroke(); }
    c.globalAlpha = 1;
  }
}

function drawTag(c, x, y, txt, col, sub){
  const fs = Math.round(10*G.sc + 2.5);
  c.font = `800 ${fs}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const w = c.measureText(txt).width + 14*G.sc, h = fs + 9*G.sc;
  const xx = clamp(x - w/2, G.rulerW + 2, cw - w - 4);
  c.fillStyle = 'rgba(15,23,42,.88)'; rr(c, xx, y - h, w, h, h/2); c.fill();
  c.strokeStyle = col; c.lineWidth = 1.6; c.stroke();
  c.fillStyle = sub ? '#6ee7b7' : '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(txt, xx + w/2, y - h/2 + 0.5);
  return h;
}

function drawObject(c, o, locked){
  const it = o.it, s = G.isz, L = o.L;
  let x = laneX(o.i), yb = yOf(o.h0 - o.s);
  if (o.landed && L.impact) yb += (1 + L.impact.scale * 4.5) * G.sc;
  let cy = yb - it.h*s/2, rot = 0;
  if (it.flutter && isFinite(o.p.vt) && o.tt > 0){
    const r = Math.min(1, o.v/o.p.vt), ph = 2.3*o.tt + o.i*1.3;
    const amp = (o.landed ? 0 : 1)*16*G.sc*r;
    x += amp*Math.sin(ph); rot = (o.landed ? 0.25 : 0.55*r*Math.sin(ph + 0.7));
  }
  if (L.snap){
    const k = clamp((nowMs() - L.snap.t0)/380, 0, 1);
    const e = 1 + 2.2*Math.pow(k - 1, 3) + 1.2*Math.pow(k - 1, 2);
    x = lerp(L.snap.x, x, e); cy = lerp(L.snap.y, cy, e);
    if (k >= 1) L.snap = null;
  }
  const top = cy - it.h*s/2;
  const hfrac = clamp(1 - yb/G.groundY, 0, 1);
  c.fillStyle = `rgba(0,0,0,${0.28*(1 - (G.groundY - yb)/(G.groundY - G.topY + 1))})`;
  c.beginPath(); c.ellipse(laneX(o.i), G.groundY + 3*G.sc, it.w*s*0.5*(0.6 + 0.4*(1 - hfrac)), 4*G.sc, 0, 0, 7); c.fill();

  drawItem(c, L.item, x, cy, s, rot);

  if (state.force && !o.landed){
    const base = 34*G.sc, ax = x - it.w*s/2 - 10*G.sc;
    arrow(c, ax, cy, ax, cy + base, '#ff9f43', 3*G.sc);
    c.font = `800 ${Math.round(9*G.sc + 2)}px "Plus Jakarta Sans", system-ui, sans-serif`; c.textAlign = 'right'; c.textBaseline = 'middle';
    c.fillStyle = '#ff9f43'; c.fillText('W', ax - 5*G.sc, cy + base*0.75);
    if (o.p.k > 0){
      const lr = base*clamp(o.R/o.W, 0, 1);
      if (lr > 2){ arrow(c, ax + 7*G.sc, cy, ax + 7*G.sc, cy - lr, '#3fd0ff', 3*G.sc); }
      c.fillStyle = '#3fd0ff'; c.textAlign = 'left'; c.fillText('R', ax + 11*G.sc, cy - Math.max(lr, 8*G.sc)*0.8);
    }
  }
  const tagY = top - 6*G.sc;
  if (o.landed){
    const imp = L.impact;
    const lbl = imp ? `${state.lang === 'en' ? imp.levelEn : imp.levelMs} · ${fmtJ(imp.Ek)}` : `✓ ${f(motion(o.p, o.tl).v)} m s⁻¹`;
    drawTag(c, laneX(o.i), tagY, lbl, LANE_CANVAS_COL[o.i], true);
  } else if (state.t === 0 && !state.running) {
    const readyLbl = cw < 480 ? LANE_NM[o.i] : `${LANE_NM[o.i]} · ${itemName(it)}`;
    drawTag(c, x, tagY, readyLbl, LANE_CANVAS_COL[o.i]);
  } else {
    drawTag(c, x, tagY, `v = ${f(o.v)} m s⁻¹`, LANE_CANVAS_COL[o.i]);
  }
}

/* ================= GRAPH (LIGHT MAKMAL STEM THEME) ================= */
const gcv = $('#graph'), gctx = gcv.getContext('2d');
let gw = 0, gh = 0, gd = 1;
function resizeGraph(){
  const r = $('#graphWrap').getBoundingClientRect();
  gw = r.width || 600; gh = r.height || 240; gd = Math.min(2.5, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  gcv.width = Math.round(gw*gd); gcv.height = Math.round(gh*gd);
  drawGraph();
}
if (typeof ResizeObserver === 'function') new ResizeObserver(resizeGraph).observe($('#graphWrap'));
function niceMax(v){ if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))); const n = v/e; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10)*e; }
function drawGraph(){
  if (!gw) return;
  const c = gctx; c.setTransform(gd,0,0,gd,0,0); c.clearRect(0,0,gw,gh);
  const objs = [0,1,2].map(info).filter(Boolean);
  const L = 48, R = 16, Tpad = 14, B = 32, W = gw - L - R, H = gh - Tpad - B;
  c.font = '600 12px "Plus Jakarta Sans", system-ui, sans-serif'; c.fillStyle = '#645a7a';
  if (!objs.length){
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(state.lang === 'en' ? 'Tap a checkpoint (+) on the tower to view graphs' : 'Ketik checkpoint (+) pada menara untuk melihat graf', gw/2, gh/2);
    return;
  }
  const key = state.graph;
  const val = (o, t) => { if (t >= o.tl) t = o.tl; const m = motion(o.p, t); return key === 'v' ? m.v : key === 's' ? Math.min(m.s, o.h0) : m.a; };
  const maxTl = Math.max(...objs.map(o => o.tl)), minTl = Math.min(...objs.map(o => o.tl));
  const Tm = niceMax(Math.max(0.5, Math.min(maxTl*1.02, Math.max(state.t, minTl)*1.25)));
  let Ym = key === 'v' ? Math.max(...objs.map(o => motion(o.p, o.tl).v)) : key === 's' ? Math.max(...objs.map(o => o.h0)) : PLANETS[state.planet].g;
  Ym = niceMax(Ym*1.05);
  const X = t => L + t/Tm*W, Y = v => Tpad + H - v/Ym*H;

  c.strokeStyle = '#e7e0f3'; c.lineWidth = 1; c.font = '700 11px Inter, system-ui, sans-serif';
  c.fillStyle = '#645a7a'; c.textAlign = 'right'; c.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++){
    const v = Ym*i/4, y = Y(v);
    c.beginPath(); c.moveTo(L, y); c.lineTo(L + W, y); c.stroke();
    c.fillText(v >= 10 ? Math.round(v) : f(v, v < 1 ? 2 : 1), L - 7, y);
  }
  c.textAlign = 'center'; c.textBaseline = 'top';
  for (let i = 0; i <= 5; i++){
    const t = Tm*i/5, x = X(t);
    c.beginPath(); c.moveTo(x, Tpad); c.lineTo(x, Tpad + H); c.stroke();
    c.fillText(t >= 10 ? Math.round(t) : f(t, 1), x, Tpad + H + 5);
  }
  c.strokeStyle = '#3d3652'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(L, Tpad); c.lineTo(L, Tpad + H); c.lineTo(L + W, Tpad + H); c.stroke();

  c.fillStyle = '#252137'; c.font = '750 11px Inter, system-ui, sans-serif';
  c.textAlign = 'right'; c.fillText('t / s', L + W, Tpad + H + 18);
  c.save(); c.translate(13, Tpad + H/2); c.rotate(-Math.PI/2); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(key === 'v' ? 'v / m s⁻¹' : key === 's' ? 's / m' : 'a / m s⁻²', 0, 0); c.restore();

  c.save(); c.beginPath(); c.rect(L, Tpad - 6, W + 6, H + 6); c.clip();
  for (const o of objs){
    const col = LANE_COL[o.i], N = 140;
    c.strokeStyle = col; c.globalAlpha = 0.35; c.lineWidth = 1.8; c.setLineDash([5,4]);
    c.beginPath(); for (let k = 0; k <= N; k++){ const t = o.tl*k/N; k ? c.lineTo(X(t), Y(val(o, t))) : c.moveTo(X(t), Y(val(o, t))); } c.stroke();
    c.setLineDash([]); c.globalAlpha = 1;
    if (o.tt > 0){
      c.lineWidth = 3; c.beginPath();
      for (let k = 0; k <= N; k++){ const t = o.tt*k/N; k ? c.lineTo(X(t), Y(val(o, t))) : c.moveTo(X(t), Y(val(o, t))); } c.stroke();
    }
    const cx = X(o.tt), cy = Y(val(o, o.tt));
    c.fillStyle = col; circ(c, cx, cy, 4.8); c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke();
  }
  c.restore();
}

/* ================= PLANET ORB DRAWER & CONTROLS ================= */
function toggleDrawer(force){
  state.drawerOpen = typeof force === 'boolean' ? force : !state.drawerOpen;
  const dr = $('#planetDrawer'), btn = $('#planetOrbBtn');
  if (dr){
    dr.classList.toggle('open', state.drawerOpen);
    dr.setAttribute('aria-hidden', String(!state.drawerOpen));
    dr.inert = !state.drawerOpen;
  }
  if (btn) btn.setAttribute('aria-expanded', String(state.drawerOpen));
}
function selectPlanet(key){
  if (!PLANETS[key]) return;
  const changed = state.planet !== key;
  if (changed && state.t > 0) resetSim();
  if (changed) state.activePreset = -1;
  state.planet = key;
  toggleDrawer(false);
  buildDrawer();
  syncControls();
  resetAirDots();
  rebuildCards();
  if (changed) sfx.pick();
  if (state.planet === 'bulan' && state.mode === 'udara'){
    toast(state.lang === 'en' ? '🌕 The Moon has no air, so objects still fall in a vacuum!' : '🌕 Bulan tiada udara, jadi objek tetap jatuh seperti dalam vakum!');
  }
}
function buildDrawer(){
  const box = $('#drawerList');
  if (!box) return;
  box.innerHTML = '';
  Object.keys(PLANETS).forEach(key => {
    const P = PLANETS[key];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fall-planet-opt' + (state.planet === key ? ' on' : '');
    b.dataset.p = key;
    const atm = state.lang === 'en' ? P.atmEn : P.atm;
    b.innerHTML = `<span class="fall-planet-sphere is-mini is-${key}" aria-hidden="true"></span>
      <span class="po-meta">
        <span class="po-top"><strong>${planetName(P)}</strong><span>g = ${P.g} m s⁻²</span></span>
        <small>${atm}</small>
      </span>`;
    b.onclick = () => selectPlanet(key);
    box.appendChild(b);
  });
}

$('#planetOrbBtn').addEventListener('click', e => {
  e.stopPropagation();
  toggleDrawer();
});
$('#drawerClose').addEventListener('click', () => toggleDrawer(false));
document.addEventListener('click', e => {
  if (!state.drawerOpen) return;
  const dr = $('#planetDrawer'), trig = $('#planetOrbBtn');
  if (dr && dr.contains && !dr.contains(e.target) && trig && trig.contains && !trig.contains(e.target)){
    toggleDrawer(false);
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.drawerOpen) toggleDrawer(false);
});

function massTxt(m){ return m >= 1 ? `${f(m, m < 10 ? 2 : 1)} kg` : m >= 0.01 ? `${f(m*1000, 0)} g` : `${f(m*1000, 1)} g`; }
function fmtJ(ek){ return (ek >= 100 ? Math.round(ek) : ek >= 1 ? f(ek, 1) : ek >= 0.01 ? f(ek, 3) : f(ek, 4)) + ' J'; }

const PRESETS = [
  {e:'🎳', t:'Boling vs Bulu vs Buku', tEn:'Bowling vs Feather vs Book', tag:'Vakum · Bumi', tagEn:'Vacuum · Earth', planet:'bumi', mode:'vakum', lanes:[['boling',0],['bulu',0],['buku',0]]},
  {e:'💨', t:'Boling vs Bulu vs Buku (Udara)', tEn:'Bowling vs Feather vs Book (Air)', tag:'Udara · Bumi', tagEn:'Air · Earth', planet:'bumi', mode:'udara', lanes:[['boling',0],['bulu',0],['buku',0]]},
  {e:'📄', t:'Kertas rata vs renyuk vs ping pong', tEn:'Flat vs crumpled paper vs ping pong', tag:'Udara · Bumi', tagEn:'Air · Earth', planet:'bumi', mode:'udara', lanes:[['kertas',0],['renyuk',0],['pingpong',0]]},
  {e:'🌕', t:'Tukul vs Bulu di Bulan', tEn:'Hammer vs Feather on Moon', tag:'Apollo 15 · Bulan', tagEn:'Apollo 15 · Moon', planet:'bulan', mode:'udara', lanes:[['tukul',0],['bulu',0],null]},
  {e:'🍎', t:'Epal pada H, ¾H dan ½H', tEn:'Apples at H, ¾H and ½H', tag:'Vakum · Tinggi', tagEn:'Vacuum · Heights', showLvl:true, planet:'bumi', mode:'vakum', lanes:[['epal',0],['epal',1],['epal',2]]},
  {e:'🔴', t:'Bulu vs Kertas vs Boling di Marikh', tEn:'Feather vs Paper vs Bowling on Mars', tag:'Udara · Marikh', tagEn:'Air · Mars', planet:'marikh', mode:'udara', lanes:[['bulu',0],['kertas',0],['boling',0]]}
];
function buildPresets(){
  const box = $('#presets'); box.innerHTML = '';
  PRESETS.forEach((p, idx) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fall-preset' + (state.activePreset === idx ? ' on' : '');
    const title = state.lang === 'en' ? p.tEn : p.t;
    const tag = state.lang === 'en' ? p.tagEn : p.tag;
    b.title = `${title} (${tag})`;
    b.setAttribute('aria-label', `${title} — ${tag}`);
    const row = document.createElement('span');
    row.className = 'fall-preset-icons';
    const activeLanes = p.lanes.filter(Boolean);
    activeLanes.forEach((entry, idx) => {
      if (idx > 0){
        const sep = document.createElement('span');
        sep.className = 'fall-preset-vs';
        sep.textContent = 'vs';
        row.appendChild(sep);
      }
      row.appendChild(iconCanvas(entry[0], 22, 20));
      if (p.showLvl){
        const lv = document.createElement('span');
        lv.className = 'fall-preset-lvl';
        lv.textContent = LEVEL_LBL[entry[1]];
        row.appendChild(lv);
      }
    });
    const badge = document.createElement('span');
    badge.className = 'fall-preset-tag';
    badge.textContent = tag;
    b.appendChild(row);
    b.appendChild(badge);
    b.onclick = () => {
      resetSim();
      state.planet = p.planet; state.mode = p.mode;
      state.lanes = p.lanes.map(x => x ? {item:x[0], level:x[1], snap:null, impact:null} : null);
      state.lanes.forEach((L, i) => { if (L && G){ const sc = slotCenter(i, L.level); L.snap = {x:sc.x, y:sc.y - 120*G.sc - i*30, t0:nowMs() + i*90}; } });
      state.prediction = null;
      state.activePreset = idx;
      state.predOpen = state.lanes.filter(Boolean).length >= 2;
      buildDrawer(); syncControls(); resetAirDots(); rebuildCards(); sfx.clunk();
      if (!state.predOpen) toast(`${p.e} ${title}. ${state.lang === 'en' ? 'Make a prediction, then press Start!' : 'Buat ramalan, kemudian tekan Mula!'}`);
      const go = $('#goBtn'); if (go.classList){ go.classList.remove('pulse'); void go.offsetWidth; go.classList.add('pulse'); }
      if (typeof window !== 'undefined' && window.innerWidth <= 1040 && wrap.scrollIntoView) wrap.scrollIntoView({behavior:'smooth', block:'center'});
    };
    box.appendChild(b);
  });
}
function syncPresetHighlight(){
  const box = $('#presets');
  if (!box || !box.children) return;
  [...box.children].forEach((b, i) => {
    if (b.classList) b.classList.toggle('on', state.activePreset === i);
  });
}

/* ---- mode, height & playback controls ---- */
const MODE_SVG = {
  vakum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8"/><path d="M9 3v2.5c0 .7-.4 1.3-1 1.7C6.8 8 6 9.3 6 10.8V19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8.2c0-1.5-.8-2.8-2-3.6-.6-.4-1-1-1-1.7V3"/><path d="M6 12h12" opacity=".45"/></svg>',
  udara: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 12h16a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 16h8a2 2 0 1 1-2 2"/></svg>'
};
function toggleMode(next){
  const target = (next === 'vakum' || next === 'udara') ? next : (state.mode === 'vakum' ? 'udara' : 'vakum');
  if (state.mode === target) return;
  if (state.t > 0) resetSim();
  state.activePreset = -1;
  state.mode = target;
  syncControls(); resetAirDots(); rebuildCards(); sfx.pick();
  if (state.planet === 'bulan' && state.mode === 'udara'){
    toast(state.lang === 'en' ? '🌕 The Moon has no air, so objects still fall in a vacuum!' : '🌕 Bulan tiada udara, jadi objek tetap jatuh seperti dalam vakum!');
  }
}
const modeOrb = $('#modeOrbBtn');
if (modeOrb) modeOrb.addEventListener('click', () => toggleMode());
function setH(val){
  const v = clamp(Math.round(val / 5) * 5, 5, 100);
  if (state.t > 0) resetSim();
  state.H = v; syncControls(); rebuildCards(); sfx.pick();
}
function positionHeightButtons(){
  if (!G) return;
  const inc = $('#hInc'), dec = $('#hDec'), lbl = $('#hLbl');
  if (!inc || !dec || !inc.style || !dec.style) return;
  const x = Math.round(clamp(G.rulerW * 0.64, 18, Math.max(18, cw - 20)));
  const topY = Math.round(Math.max(114, G.topY - 36));
  const botY = Math.round(Math.min(Math.max(topY + 40, ch - 36), G.groundY + 5));
  inc.style.left = x + 'px';
  inc.style.top = topY + 'px';
  dec.style.left = x + 'px';
  dec.style.top = botY + 'px';
  if (lbl && lbl.style){
    lbl.style.left = Math.max(24, x) + 'px';
    lbl.style.top = (topY - 21) + 'px';
  }
}
$('#hDec').addEventListener('click', () => setH(state.H - 5));
$('#hInc').addEventListener('click', () => setH(state.H + 5));

$('#speedChips').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  state.speed = +b.dataset.s; [...($('#speedChips').children || [])].forEach(x => x.classList.toggle('on', x === b));
});
$('#gTabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  state.graph = b.dataset.g; [...($('#gTabs').children || [])].forEach(x => x.classList.toggle('on', x === b)); drawGraph();
});
const togBind = (id, k) => $(id).addEventListener('click', e => {
  state[k] = !state[k];
  e.currentTarget.classList.toggle('on', state[k]);
  if (k === 'sound'){ e.currentTarget.textContent = state.sound ? '🔊' : '🔇'; if (state.sound) sfx.pick(); }
});
togBind('#togForce', 'force'); togBind('#togStrobe', 'strobe'); togBind('#togSound', 'sound');
$('#goBtn').addEventListener('click', startPause);
$('#resetBtn').addEventListener('click', () => { resetSim(); sfx.pick(); });
const reopenBtn = $('#reopenResultBtn');
if (reopenBtn) reopenBtn.addEventListener('click', () => { if (state.finished) showResult(); });
document.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.code === 'Space'){ e.preventDefault(); startPause(); }
  else if (e.key === 'r' || e.key === 'R') resetSim();
});

function setLang(lang){
  state.lang = lang === 'en' ? 'en' : 'ms';
  document.documentElement.lang = state.lang;
  document.title = state.lang === 'en' ? 'Free Fall (BETA) — Makmal STEM' : 'Jatuh Bebas (BETA) — Makmal STEM';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (I18N[state.lang][k] !== undefined) el.textContent = I18N[state.lang][k];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const k = el.dataset.i18nHtml;
    if (I18N[state.lang][k] !== undefined) el.innerHTML = I18N[state.lang][k];
  });
  $('#hint').textContent = T('hint');
  if (typeof localStorage !== 'undefined'){ try { localStorage.setItem('stemlab-lang', state.lang); } catch(e){} }
  const rb = $('#resetBtn');
  if (rb){ const rl = T('reset'); rb.setAttribute('aria-label', rl); rb.title = `${rl} (R)`; }
  buildDrawer(); buildPresets(); syncControls(); rebuildCards(); updateGoBtn();
}
$('#btn-lang').addEventListener('click', () => setLang(state.lang === 'ms' ? 'en' : 'ms'));

function syncControls(){
  const en = state.lang === 'en';
  const orb = $('#planetOrbSphere');
  if (orb) orb.className = `fall-planet-sphere is-${state.planet}`;
  const pc = $('#planetCaption');
  if (pc) pc.textContent = planetName(PLANETS[state.planet]);
  const mb = $('#modeOrbBtn'), mi = $('#modeOrbIcon'), mc = $('#modeCaption');
  if (mb){
    mb.className = `fall-mode-orb-btn is-${state.mode}`;
    const lbl = state.mode === 'vakum' ? T('mVakum') : T('mUdara');
    mb.setAttribute('aria-label', `${lbl} — ${en ? 'Tap to switch environment' : 'Ketik untuk tukar mod'}`);
    mb.title = lbl;
  }
  if (mi) mi.innerHTML = MODE_SVG[state.mode];
  if (mc) mc.textContent = state.mode === 'vakum' ? T('mVakum') : T('mUdara');
  const dec = $('#hDec'), inc = $('#hInc');
  dec.disabled = state.H <= 5; inc.disabled = state.H >= 100;
  dec.title = en ? 'Decrease height (−5 m)' : 'Kurangkan ketinggian (−5 m)';
  dec.setAttribute('aria-label', dec.title);
  inc.title = en ? 'Increase height (+5 m)' : 'Tambah ketinggian (+5 m)';
  inc.setAttribute('aria-label', inc.title);
  $('#dataSub').textContent = `H = ${state.H} m`;
  const sg = $('#statG'), sh = $('#statH'), sm = $('#statMode');
  if (sg) sg.textContent = `${PLANETS[state.planet].g.toFixed(2)} m s⁻²`;
  if (sh) sh.textContent = `${state.H} m`;
  if (sm) sm.textContent = state.mode === 'vakum' ? T('mVakum') : T('mUdara');
  syncPresetHighlight();
}

/* ---- data cards ---- */
function rebuildCards(){
  const box = $('#lanes'); box.innerHTML = '';
  const en = state.lang === 'en';
  for (let i = 0; i < 3; i++){
    const L = state.lanes[i];
    const d = document.createElement('div');
    if (d.style && d.style.setProperty) d.style.setProperty('--lc', LANE_COL[i]);
    if (!L){
      d.className = 'fall-lane empty';
      d.textContent = en ? `Lane ${LANE_NM[i]} is empty. Tap + on the tower to add.` : `Lorong ${LANE_NM[i]} kosong. Ketik (+) pada menara untuk pilih objek.`;
      box.appendChild(d); continue;
    }
    const it = ITEMS[L.item], p = params(L.item);
    d.className = 'fall-lane'; d.id = 'lane' + i;
    d.innerHTML = `<div class="top"></div>
      <div class="fall-vals">
        <div><i>${en ? 'Time, t' : 'Masa, t'}</i><b data-k="t">0.00<u>s</u></b></div>
        <div><i>${en ? 'Velocity, v' : 'Halaju, v'}</i><b data-k="v">0.00<u>m s⁻¹</u></b></div>
        <div><i>${en ? 'Accel., a' : 'Pecutan, a'}</i><b data-k="a">0.00<u>m s⁻²</u></b></div>
        <div><i>${en ? 'Displ., s' : 'Sesaran, s'}</i><b data-k="s">0.00<u>m</u></b></div>
        <div><i>${en ? 'Weight, W' : 'Berat, W'}</i><b data-k="W">0<u>N</u></b></div>
        <div><i>${en ? 'Drag, R' : 'Rintangan, R'}</i><b data-k="R">0<u>N</u></b></div>
      </div>
      <div class="fall-lane-impact" data-k="imp"><span>${en ? 'Ground impact' : 'Impak tanah'}</span><b>—</b></div>`;
    const top = d.querySelector ? d.querySelector('.top') : null;
    if (top){
      top.appendChild(iconCanvas(L.item, 38, 34));
      top.insertAdjacentHTML('beforeend', `<div class="nm">${LANE_NM[i]} · ${itemName(it)}<small>m = ${massTxt(it.m)} · A = ${fmtA(it.A)} · h₀ = ${fmtM(state.H*LEVELS[L.level])} (${LEVEL_LBL[L.level]})${isFinite(p.vt) ? ` · v<sub>T</sub> ≈ ${f(p.vt, p.vt < 10 ? 2 : 1)} m s⁻¹` : ''}</small></div><span class="fall-pill">${en ? 'READY' : 'SEDIA'}</span>`);
    }
    box.appendChild(d);
  }
  $('#hint').classList.toggle('hide', state.lanes.some(Boolean));
  buildPredRow();
  updateCards(true);
  updateImpactBanner();
  drawGraph();
}
function fmtA(A){ const cm = A*1e4; return (cm >= 100 ? Math.round(cm) : f(cm, 1)) + ' cm²'; }
function fmtN(x){ return x >= 10 ? f(x, 1) : x >= 0.1 ? f(x, 2) : x >= 0.001 ? f(x, 4) : f(x, 5); }
let lastCardUpd = 0;
function updateCards(force){
  const now = nowMs(); if (!force && now - lastCardUpd < 70) return; lastCardUpd = now;
  const en = state.lang === 'en';
  for (let i = 0; i < 3; i++){
    const o = info(i); if (!o) continue;
    const el = document.getElementById('lane' + i); if (!el || !el.querySelector) continue;
    const set = (k, v, u) => { const b = el.querySelector(`[data-k="${k}"]`); if (b) b.innerHTML = `${v}<u>${u}</u>`; };
    set('t', f(o.tt), 's');
    set('v', f(o.landed ? motion(o.p, o.tl).v : o.v), 'm s⁻¹');
    set('a', f(o.a), 'm s⁻²');
    set('s', f(o.s), 'm');
    set('W', fmtN(o.W), 'N');
    set('R', o.p.k > 0 ? fmtN(o.R) : '0', 'N');
    const impBox = el.querySelector('[data-k="imp"]');
    if (impBox){
      if (o.landed && o.L.impact){
        const imp = o.L.impact;
        impBox.className = `fall-lane-impact ${imp.tier}`;
        impBox.innerHTML = `<span>💥 ${en ? imp.levelEn : imp.levelMs}</span><b>Eₖ = ${fmtJ(imp.Ek)} · p = ${fmtN(imp.p)} kg m s⁻¹</b>`;
      } else {
        impBox.className = 'fall-lane-impact';
        impBox.innerHTML = `<span>${en ? 'Ground impact' : 'Impak tanah'}</span><b>—</b>`;
      }
    }
    const pill = el.querySelector('.fall-pill');
    if (pill){
      if (o.landed){ pill.className = 'fall-pill land'; pill.textContent = en ? 'LANDED ✓' : 'MENDARAT ✓'; }
      else if (state.t > 0){ pill.className = 'fall-pill fall'; pill.textContent = state.running ? (en ? 'FALLING…' : 'JATUH…') : (en ? 'PAUSED' : 'DIJEDA'); }
      else { pill.className = 'fall-pill'; pill.textContent = en ? 'READY' : 'SEDIA'; }
    }
  }
}

function updateImpactBanner(){
  const box = $('#impactBanner');
  if (!box) return;
  const en = state.lang === 'en';
  const landed = [0,1,2].map(info).filter(o => o && o.landed && o.L.impact);
  if (!landed.length){
    box.innerHTML = en
      ? '<b>💡 Impact Concept (Eₖ = ½mv² &amp; p = mv):</b> Drop heavier objects (like a Bowling Ball) or release from a greater height <b>H</b> to see larger ground craters, deeper shockwaves, and higher impact energy!'
      : '<b>💡 Konsep Impak Tanah (Eₖ = ½mv² &amp; p = mv):</b> Jatuhkan objek berjisim besar (seperti Bola Boling) atau lepaskan dari ketinggian lebih tinggi untuk melihat kawah tanah lebih besar dan tenaga hentaman lebih tinggi.';
    return;
  }
  const sorted = landed.slice().sort((a, b) => b.L.impact.Ek - a.L.impact.Ek);
  const top = sorted[0], low = sorted[sorted.length - 1];
  if (sorted.length > 1 && top.L.impact.Ek > low.L.impact.Ek * 1.1){
    const ratio = Math.round(top.L.impact.Ek / Math.max(1e-6, low.L.impact.Ek));
    box.innerHTML = en
      ? `<b>💥 Ground Impact Analysis:</b> <b>${itemName(top.it)}</b> (${LANE_NM[top.i]}) produced the largest impact (<b>Eₖ = ${fmtJ(top.L.impact.Ek)}</b> at v = ${f(top.L.impact.v)} m s⁻¹) — ~<b>${ratio}×</b> stronger than <b>${itemName(low.it)}</b> (${fmtJ(low.L.impact.Ek)}). Greater <b>mass (m)</b> or <b>impact velocity (v)</b> dramatically increases kinetic energy transferred to the ground!`
      : `<b>💥 Analisis Impak Tanah:</b> <b>${itemName(top.it)}</b> (Lorong ${LANE_NM[top.i]}) menghasilkan kawah &amp; hentaman terbesar (<b>Eₖ = ${fmtJ(top.L.impact.Ek)}</b> pada v = ${f(top.L.impact.v)} m s⁻¹) — kira-kira <b>${ratio}×</b> lebih kuat berbanding <b>${itemName(low.it)}</b> (${fmtJ(low.L.impact.Ek)}). Jisim (<b>m</b>) atau halaju (<b>v</b>) yang lebih tinggi meningkatkan tenaga kinetik Eₖ = ½mv² yang dipindahkan ke tanah!`;
  } else {
    box.innerHTML = en
      ? `<b>💥 Ground Impact:</b> <b>${itemName(top.it)}</b> hit the ground at <b>v = ${f(top.L.impact.v)} m s⁻¹</b> with kinetic energy <b>Eₖ = ${fmtJ(top.L.impact.Ek)}</b> (momentum p = ${fmtN(top.L.impact.p)} kg m s⁻¹). Try comparing a heavier object or greater height!`
      : `<b>💥 Impak Tanah:</b> <b>${itemName(top.it)}</b> menghentam tanah pada <b>v = ${f(top.L.impact.v)} m s⁻¹</b> dengan tenaga kinetik <b>Eₖ = ${fmtJ(top.L.impact.Ek)}</b> (momentum p = ${fmtN(top.L.impact.p)} kg m s⁻¹). Cuba bandingkan dengan objek berbeza jisim atau ketinggian!`;
  }
}

/* ---- prediction ---- */
function buildPredRow(){
  const row = $('#predRow');
  const act = state.lanes.map((L, i) => L ? i : -1).filter(i => i >= 0);
  if (state.prediction != null && state.prediction !== 'tie' && !state.lanes[state.prediction]) state.prediction = null;
  if (!state.predOpen || state.running || state.t > 0 || act.length < 2){
    if (row.classList) row.classList.remove('show');
    row.innerHTML = '';
    return;
  }
  const en = state.lang === 'en';
  row.innerHTML = `<div class="pred-head"><span>🔮 ${en ? 'Predict: who lands first?' : 'Ramalan: siapa dulu?'}</span><button type="button" class="pred-close" aria-label="${en ? 'Close prediction' : 'Tutup ramalan'}">✕</button></div><div class="fall-chips" id="predChips">${act.map(i => `<button type="button" data-p="${i}"><i class="fall-pred-dot" style="background:${LANE_CANVAS_COL[i]}"></i>${LANE_NM[i]}</button>`).join('')}<button type="button" data-p="tie">${en ? 'Tie' : 'Serentak'}</button></div>`;
  [...(row.querySelectorAll ? row.querySelectorAll('button[data-p]') : [])].forEach(b => {
    const active = String(state.prediction) === b.dataset.p;
    b.classList.toggle('on', active);
    b.onclick = () => {
      if (state.t > 0){ toast(en ? 'Make a prediction before starting. Reset first.' : 'Ramalan dibuat sebelum mula. Set semula dahulu.'); return; }
      const val = b.dataset.p === 'tie' ? 'tie' : +b.dataset.p;
      state.prediction = val;
      state.predOpen = false;
      sfx.pick();
      buildPredRow();
      const pickTxt = val === 'tie' ? (en ? 'Tie' : 'Serentak') : LANE_NM[val];
      toast(en ? `🎯 Prediction: ${pickTxt} — Press ▶ Start!` : `🎯 Ramalan: ${pickTxt} — Tekan ▶ Mula!`);
    };
  });
  const cb = row.querySelector ? row.querySelector('.pred-close') : null;
  if (cb) cb.onclick = () => { state.predOpen = false; buildPredRow(); };
  if (row.classList) row.classList.add('show');
}

/* ---- toast ---- */
let toastT = 0;
function toast(msg){ const t = $('#toast'); t.innerHTML = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

/* ================= SIM CONTROL ================= */
function startPause(){
  ac();
  if (!state.lanes.some(Boolean)){ toast(state.lang === 'en' ? 'Tap a magnetic checkpoint (+) on the tower to add an object first 🧲' : 'Ketik checkpoint magnet (+) pada menara untuk pilih objek dahulu 🧲'); return; }
  if (state.finished){ resetSim(); }
  if (state.running){ state.running = false; }
  else {
    if (state.t === 0){
      sfx.release();
      state.lanes.forEach((L, i) => { if (L){ L.snap = null; L.fx = false; L.impact = null; if (G) rings.push({x:laneX(i), y:yOf(state.H*LEVELS[L.level]) - ITEMS[L.item].h*G.isz - 6*G.sc, t0:nowMs(), col:'#ffcf3f'}); } });
    }
    state.running = true; state.predOpen = false; buildPredRow(); hideResult();
  }
  updateGoBtn();
}
function resetSim(){
  state.t = 0; state.running = false; state.finished = false; state.predOpen = false;
  state.lanes.forEach(L => { if (L){ L.fx = false; L.impact = null; } });
  particles = []; impactWaves = []; shake = 0; hideResult();
  const ht = $('#hudT'); if (ht) ht.textContent = '0.00 s';
  updateGoBtn(); buildPredRow(); updateCards(true); updateImpactBanner(); drawGraph();
}
function updateGoBtn(){
  const b = $('#goBtn');
  b.classList.toggle('pause', state.running);
  b.textContent = state.running ? T('pause') : state.finished ? T('repeat') : state.t > 0 ? T('resume') : T('start');
  const en = state.lang === 'en';
  const lbl = state.running ? (en ? 'Pause' : 'Jeda') : state.finished ? (en ? 'Replay' : 'Ulang') : state.t > 0 ? (en ? 'Resume' : 'Sambung') : (en ? 'Start' : 'Mula');
  b.setAttribute('aria-label', lbl);
  b.title = `${lbl} (Space)`;
  const st = $('#hudS');
  st.className = 'st' + (state.running ? ' run' : state.finished ? ' done' : state.t > 0 ? ' pause' : '');
  st.textContent = state.running ? T('stRun') : state.finished ? T('stDone') : state.t > 0 ? T('stPause') : T('stReady');
  const tip = $('#statTip'), rbtn = $('#reopenResultBtn');
  if (tip) tip.hidden = state.finished;
  if (rbtn) rbtn.hidden = !state.finished;
}

function step(dt){
  if (!state.running) return;
  const prevT = state.t;
  state.t += dt*state.speed;
  let all = true, anyNewImpact = false;
  for (let i = 0; i < 3; i++){
    const L = state.lanes[i]; if (!L) continue;
    const p = params(L.item), h0 = state.H*LEVELS[L.level], tl = landTime(p, h0);
    if (state.t >= tl && !L.fx){
      L.fx = true;
      const v = motion(p, tl).v;
      const imp = impactMetrics(p.m, v);
      L.impact = { ...imp, t0: nowMs() };
      anyNewImpact = true;
      if (G) burst(laneX(i), G.groundY + 2*G.sc, p.m, v, imp);
      sfx.thud(p.m, v);
    }
    if (state.t < tl) all = false;
  }
  if (anyNewImpact) updateImpactBanner();
  if (all){
    const maxTl = Math.max(...state.lanes.map((L, i) => L ? info(i).tl : 0));
    state.t = Math.max(prevT, Math.min(state.t, maxTl));
    state.running = false; state.finished = true; updateGoBtn();
    setTimeout(() => { if (state.finished){ showResult(); sfx.done(); } }, 600);
  }
}

/* ---- results ---- */
function hideResult(){ $('#result').classList.remove('show'); }
function showResult(){
  const P = PLANETS[state.planet], en = state.lang === 'en';
  const objs = [0,1,2].map(info).filter(Boolean).sort((a, b) => a.tl - b.tl);
  if (!objs.length) return;
  const tie = objs.length > 1 && Math.abs(objs[objs.length - 1].tl - objs[0].tl) < 0.005;
  let pos = 0, prev = -1;
  const rows = objs.map((o, k) => {
    if (k === 0 || Math.abs(o.tl - prev) >= 0.005) pos = k + 1; prev = o.tl;
    const vImp = motion(o.p, o.tl).v;
    const imp = o.L.impact || impactMetrics(o.p.m, vImp);
    return `<div><div class="r-head"><span class="pos" style="background:${LANE_COL[o.i]}">${pos}</span><span>${LANE_NM[o.i]} · ${itemName(o.it)} <small style="color:#645a7a">(${LEVEL_LBL[o.L.level]})</small></span></div><span class="v">t = ${f(o.tl)} s · v = ${f(vImp)} m s⁻¹ · Eₖ = ${fmtJ(imp.Ek)} (${en ? imp.levelEn : imp.levelMs})</span></div>`;
  }).join('');
  let pred = '';
  if (state.prediction != null && objs.length > 1){
    const firstSet = objs.filter(o => o.tl - objs[0].tl < 0.005).map(o => o.i);
    const ok = state.prediction === 'tie' ? tie : (!tie && firstSet[0] === state.prediction);
    pred = `<div class="pred ${ok ? 'ok' : 'no'}">${ok ? (en ? '🎉 Your prediction was CORRECT!' : '🎉 Ramalan anda TEPAT!') : (en ? '🤔 Not quite! Check the explanation below.' : '🤔 Ramalan kurang tepat. Lihat penjelasan di bawah.')}</div>`;
  }
  const air = state.mode === 'udara' && P.rho > 0;
  const sameH = objs.every(o => o.L.level === objs[0].L.level);
  const ps = [];
  if (!air){
    if (objs.length > 1 && sameH) ps.push(en ? `All objects landed <b>simultaneously</b> (t = ${f(objs[0].tl)} s). In vacuum, only gravity acts so all accelerate equally at <b>g = ${P.g} m s⁻²</b>.` : `Semua objek mendarat <b>serentak</b> (t = ${f(objs[0].tl)} s) kerana dalam vakum hanya graviti bertindak (<b>g = ${P.g} m s⁻²</b>).`);
    else if (objs.length > 1) ps.push(en ? `Higher checkpoints give longer fall times and higher impact speeds (<b>t = √(2h/g)</b>).` : `Kedudukan lebih tinggi mengambil masa lebih lama dan menghentam lebih laju (<b>t = √(2h/g)</b>).`);
    else { const o = objs[0]; ps.push(`t = √(2h/g) = <b>${f(Math.sqrt(2*o.h0/P.g))} s</b> · v = gt = <b>${f(P.g*Math.sqrt(2*o.h0/P.g))} m s⁻¹</b>.`); }
    if (state.mode === 'udara' && P.rho === 0) ps[0] += en ? ' (Moon has no air, just like Apollo 15.)' : ' (Bulan tiada udara — seperti Apollo 15.)';
  } else {
    const first = objs[0], low = objs.slice().sort((a, b) => a.p.vt - b.p.vt)[0];
    if (objs.length > 1) ps.push(en ? `<b>${itemName(first.it)}</b> landed first. Air resistance R slows lighter wide objects until R = W (terminal speed of ${itemName(low.it)}: v<sub>T</sub> ≈ <b>${f(low.p.vt)} m s⁻¹</b>).` : `<b>${itemName(first.it)}</b> mendarat dahulu; rintangan udara R memperlahankan objek ringan hingga halaju terminal (v<sub>T</sub> ${itemName(low.it)} ≈ <b>${f(low.p.vt)} m s⁻¹</b>).`);
    else ps.push(en ? `In air, drag R opposes weight W until terminal speed v<sub>T</sub> ≈ <b>${f(objs[0].p.vt)} m s⁻¹</b>.` : `Dalam udara, rintangan R menentang berat W sehingga halaju terminal v<sub>T</sub> ≈ <b>${f(objs[0].p.vt)} m s⁻¹</b>.`);
  }

  // Mass & Velocity Impact explanation
  const byEk = objs.slice().sort((a, b) => (b.L.impact?.Ek ?? 0) - (a.L.impact?.Ek ?? 0));
  const heavy = byEk[0], light = byEk[byEk.length - 1];
  const hEk = heavy.L.impact ? heavy.L.impact.Ek : 0.5 * heavy.p.m * motion(heavy.p, heavy.tl).v ** 2;
  const lEk = light.L.impact ? light.L.impact.Ek : 0.5 * light.p.m * motion(light.p, light.tl).v ** 2;
  const impactHtml = objs.length > 1
    ? (en
      ? `<div class="impact-box"><strong>💥 Impak Tanah (Eₖ = ½mv²):</strong> <b>${itemName(heavy.it)}</b> (${fmtJ(hEk)}) produced a much larger crater than <b>${itemName(light.it)}</b> (${fmtJ(lEk)}) — higher <b>mass (m)</b> or <b>velocity (v)</b> increases impact energy.</div>`
      : `<div class="impact-box"><strong>💥 Impak Tanah (Eₖ = ½mv²):</strong> <b>${itemName(heavy.it)}</b> (${fmtJ(hEk)}) menghasilkan kawah jauh lebih besar berbanding <b>${itemName(light.it)}</b> (${fmtJ(lEk)}) kerana <b>jisim (m)</b> atau <b>halaju (v)</b> lebih tinggi.</div>`)
    : (en
      ? `<div class="impact-box"><strong>💥 Ground Impact:</strong> <b>${itemName(heavy.it)}</b> hit with <b>Eₖ = ${fmtJ(hEk)}</b>. Compare different objects or heights (<b>H</b> vs <b>½H</b>) to see crater differences.</div>`
      : `<div class="impact-box"><strong>💥 Impak Tanah:</strong> <b>${itemName(heavy.it)}</b> menghentam dengan <b>Eₖ = ${fmtJ(hEk)}</b>. Bandingkan objek atau tinggi berbeza untuk lihat perbezaan saiz kawah.</div>`);

  $('#result').innerHTML = `<h4>🏁 ${en ? 'Results' : 'Keputusan'} <button type="button" class="x" aria-label="Tutup">✕</button></h4>${pred}<div class="rank">${rows}</div>${ps.map(p => `<p>${p}</p>`).join('')}${impactHtml}`;
  const closeBtn = $('#result .x');
  if (closeBtn) closeBtn.onclick = hideResult;
  $('#result').classList.add('show');
}

/* ================= STAGE DRAG / CLICK & PICKER SHEET ================= */
let drag = null;
function isLocked(){ return state.t > 0 || state.running; }
function toCanvas(cx, cy){ const r = cv.getBoundingClientRect(); return {x:cx - r.left, y:cy - r.top, inside:cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom}; }
function findSlot(x, y, rad){
  let best = null, bd = 1e9;
  for (let l = 0; l < 3; l++) for (let lv = 0; lv < 3; lv++){
    const p = slotCenter(l, lv), d = Math.hypot(p.x - x, p.y - y);
    if (d < bd){ bd = d; best = {lane:l, level:lv}; }
  }
  return bd < (rad || 66*Math.max(G.sc, 0.85)) ? best : null;
}
function hitObject(x, y){
  for (let i = 0; i < 3; i++){
    const L = state.lanes[i]; if (!L) continue;
    const it = ITEMS[L.item], s = G.isz, yb = yOf(state.H*LEVELS[L.level]);
    const cx = laneX(i), cy = yb - it.h*s/2, hw = Math.max(it.w*s/2, 18) + 8, hh = Math.max(it.h*s/2, 16) + 10;
    if (Math.abs(x - cx) < hw && y > cy - hh - 16*G.sc && y < cy + hh) return i;
  }
  return null;
}
function placeAt(slot, item, from, relX, relY){
  const target = state.lanes[slot.lane];
  const sc = G ? slotCenter(slot.lane, slot.level) : {x:0, y:0};
  if (from){
    const moved = state.lanes[from.lane];
    if (from.lane === slot.lane){ moved.level = slot.level; moved.impact = null; }
    else {
      state.lanes[from.lane] = target ? {item:target.item, level:from.level, impact:null, snap:{x:sc.x, y:sc.y, t0:nowMs()}} : null;
      state.lanes[slot.lane] = {item:moved.item, level:slot.level, impact:null};
      if (target) toast(state.lang === 'en' ? '🔁 Lanes swapped' : '🔁 Objek ditukar lorong');
    }
  } else {
    if (target && target.item !== item) toast(`${itemName(ITEMS[target.item])} → ${itemName(ITEMS[item])}`);
    state.lanes[slot.lane] = {item, level:slot.level, impact:null};
  }
  const L = state.lanes[slot.lane];
  L.snap = {x:relX != null ? relX : sc.x, y:relY != null ? relY : sc.y - 60*(G ? G.sc : 1), t0:nowMs()};
  if (G) rings.push({x:sc.x, y:sc.y, t0:nowMs(), col:LANE_CANVAS_COL[slot.lane]});
  sfx.clunk(); if (typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate(12); } catch(e){}
  state.prediction = null; state.activePreset = -1; state.predOpen = state.lanes.filter(Boolean).length >= 2; syncPresetHighlight(); rebuildCards();
}
function quickPlace(key){
  if (isLocked()){ toast(state.lang === 'en' ? 'Press ↺ Reset to rearrange objects' : 'Tekan ↺ Set Semula untuk menyusun semula objek'); return; }
  const lane = state.lanes.findIndex(L => !L);
  if (lane < 0){ toast(state.lang === 'en' ? 'Max 3 objects. Tap a lane on the tower to replace.' : 'Maksimum 3 objek. Ketik objek pada menara untuk tukar.'); return; }
  placeAt({lane, level:0}, key, null);
}

cv.addEventListener('touchstart', e => {
  if (isLocked()) return;
  const t = e.touches[0], p = toCanvas(t.clientX, t.clientY);
  if (hitObject(p.x, p.y) != null || findSlot(p.x, p.y, 34*Math.max(G.sc, 0.85))) e.preventDefault();
}, {passive:false});
cv.addEventListener('pointerdown', e => {
  ac();
  if (state.drawerOpen) toggleDrawer(false);
  const p = toCanvas(e.clientX, e.clientY);
  const hit = hitObject(p.x, p.y);
  const slot = hit == null ? findSlot(p.x, p.y, 38*Math.max(G.sc, 0.85)) : null;
  if (hit == null && !slot) return;
  if (isLocked()){ toast(state.lang === 'en' ? 'Press ↺ Reset to rearrange objects' : 'Tekan ↺ Set Semula untuk menyusun semula objek'); return; }
  drag = {src:'stage', sx:e.clientX, sy:e.clientY, started:false, x:p.x, y:p.y, hover:null, tapSlot:slot};
  if (hit != null){ drag.fromLane = hit; drag.item = state.lanes[hit].item; drag.fromLevel = state.lanes[hit].level; }
  if (cv.setPointerCapture) try { cv.setPointerCapture(e.pointerId); } catch(_){}
});
cv.addEventListener('pointermove', e => {
  const p = toCanvas(e.clientX, e.clientY);
  if (!drag || drag.src !== 'stage'){
    if (!isLocked()) cv.style.cursor = (hitObject(p.x, p.y) != null) ? 'grab' : findSlot(p.x, p.y, 38*Math.max(G.sc,.85)) ? 'pointer' : 'default';
    return;
  }
  if (drag.fromLane == null) return;
  if (!drag.started && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6){ drag.started = true; cv.style.cursor = 'grabbing'; sfx.pick(); }
  if (!drag.started) return;
  drag.x = p.x; drag.y = p.y - 6;
  drag.hover = findSlot(drag.x, drag.y);
});
const stageEnd = e => {
  if (!drag || drag.src !== 'stage') return;
  const d = drag; drag = null; cv.style.cursor = 'default';
  if (e.type === 'pointercancel') return;
  if (!d.started){
    openPicker(d.fromLane != null ? {lane:d.fromLane, level:d.fromLevel} : d.tapSlot);
    return;
  }
  if (d.hover){ placeAt(d.hover, d.item, {lane:d.fromLane, level:d.fromLevel}, d.x, d.y); return; }
  const p = toCanvas(e.clientX, e.clientY);
  if (!p.inside || p.y > G.groundY - 4){
    toast(`${itemName(ITEMS[d.item])} ${state.lang === 'en' ? 'removed' : 'dikeluarkan'}`); state.lanes[d.fromLane] = null; state.prediction = null; state.predOpen = false; state.activePreset = -1; syncPresetHighlight(); sfx.pick(); rebuildCards();
  } else {
    const L = state.lanes[d.fromLane]; L.snap = {x:d.x, y:d.y, t0:nowMs()};
  }
};
cv.addEventListener('pointerup', stageEnd); cv.addEventListener('pointercancel', stageEnd);

/* ---- picker sheet ---- */
let pickSlot = null;
function openPicker(slot){
  if (!slot) return; pickSlot = slot;
  const cur = state.lanes[slot.lane], en = state.lang === 'en';
  $('#sheetTitle').textContent = cur && cur.level === slot.level ? (en ? 'Change object' : 'Tukar objek') : (en ? 'Choose object to drop' : 'Pilih objek untuk dijatuhkan');
  $('#sheetSub').textContent = `${en ? 'Lane' : 'Lorong'} ${LANE_NM[slot.lane]} · Checkpoint ${LEVEL_LBL[slot.level]} (${fmtM(state.H*LEVELS[slot.level])})`;
  const g = $('#sheetGrid'); g.innerHTML = '';
  Object.keys(ITEMS).forEach(key => {
    const it = ITEMS[key], b = document.createElement('button');
    b.type = 'button';
    b.className = 'fall-item' + (cur && cur.item === key && cur.level === slot.level ? ' cur' : '');
    b.appendChild(iconCanvas(key, 52, 44));
    b.insertAdjacentHTML('beforeend', `<b>${itemName(it)}</b><span>${massTxt(it.m)}</span>`);
    b.onclick = () => { closePicker(); placeAt(slot, key, null); };
    g.appendChild(b);
  });
  $('#sheetRemove').style.display = cur ? '' : 'none';
  $('#sheet').classList.add('show');
}
function closePicker(){ $('#sheet').classList.remove('show'); }
$('#sheetClose').onclick = closePicker;
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closePicker(); });
$('#sheetRemove').onclick = () => {
  if (pickSlot && state.lanes[pickSlot.lane]){ toast(`${itemName(ITEMS[state.lanes[pickSlot.lane].item])} ${state.lang === 'en' ? 'removed' : 'dikeluarkan'}`); state.lanes[pickSlot.lane] = null; state.prediction = null; state.predOpen = false; state.activePreset = -1; syncPresetHighlight(); rebuildCards(); }
  closePicker();
};

/* ================= LOOP ================= */
let last = nowMs(), gFrame = 0;
function frame(now){
  const dt = Math.min(0.05, (now - last)/1000); last = now; clock += dt;
  if (G && cw > 0){
    step(dt);
    shake *= Math.pow(0.0008, dt); if (shake < 0.15) shake = 0;
    drawScene(dt);
    $('#hudT').textContent = `${f(state.t)} s`;
    updateCards(false);
    if (state.running || (gFrame++ % 20 === 0)) drawGraph();
  }
  requestAnimationFrame(frame);
}

/* ================= INIT & TEST API ================= */
resize();
resizeGraph();
let savedLang = null;
if (typeof localStorage !== 'undefined'){ try { savedLang = localStorage.getItem('stemlab-lang'); } catch(e){} }
setLang(savedLang === 'en' ? 'en' : 'ms');
if (typeof setupLessonVideos === 'function') setupLessonVideos({id:'jatuh-bebas', videos:[]});
if (typeof requestAnimationFrame === 'function') requestAnimationFrame(frame);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { rebuildCards(); });

if (typeof window !== 'undefined') {
  window.FallSim = {
    state, PLANETS, ITEMS, LEVELS, I18N,
    params, motion, landTime, impactMetrics, info, step, setH, setLang,
    selectPlanet, toggleMode, toggleDrawer, placeAt, quickPlace, startPause, resetSim
  };
}
})();
