(() => {
  'use strict';

  const M = typeof HookeModel !== 'undefined' ? HookeModel : null;
  if (!M) return;

  const {
    clamp, lerp, fx, rnd, pick, mix, niceMax, sg, parseNum,
    MAT, FBRK, GMAX, MAXN, MASSES, DISC, COLS, PRESETS, RANKS, TOPO, I18N,
    newSp, kOf, xlOf, FlOf, xSpr, nExt, nForce, dist, kIdeal, natLen,
    buildEnvelope, fitSlope, createMissions
  } = M;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const byId = id => document.getElementById(id);

  /* ================= STATE ================= */
  let savedLang = 'ms';
  try {
    if (localStorage.getItem('stemlab-lang') === 'en') savedLang = 'en';
  } catch (_) {}

  const S = {
    lang: savedLang,
    g: 9.81,
    topo: 'single',
    sel: 'A',
    sp: {
      A: newSp('keluli', 12, 1, 12),
      B: newSp('keluli', 12, 1, 12),
      C: newSp('keluli', 12, 1, 12)
    },
    stack: [],
    flying: [],
    debris: [],
    X: 0,
    V: 0,
    Xt: 0,
    Fc: 0,
    per: { A: 0, B: 0, C: 0 },
    pf: { A: 0, B: 0, C: 0 },
    pos: {},
    rec: [],
    trail: [],
    env: null,
    envDirty: true,
    mode: 'lab',
    locks: {},
    hide: {},
    mission: null,
    sound: true,
    dragHover: false
  };

  const tr = key => (I18N[S.lang] && I18N[S.lang][key] !== undefined ? I18N[S.lang][key] : I18N.ms[key] || key);
  const fmtMsg = (key, vars) => {
    let str = tr(key);
    if (vars) Object.keys(vars).forEach(k => { str = str.replaceAll(`{${k}}`, vars[k]); });
    return str;
  };

  const root = () => TOPO[S.topo].tree;
  const ids = () => TOPO[S.topo].ids;
  const totalMass = () => S.stack.reduce((a, b) => a + b, 0);
  const weight = () => (totalMass() / 1000) * S.g;
  const settled = () => Math.abs(S.X - S.Xt) < 4e-4 && Math.abs(S.V) < 0.03 && !S.flying.length;

  function buildEnv() {
    S.env = buildEnvelope(S.sp, root(), ids(), S.g, GMAX);
    S.envDirty = false;
  }

  /* ================= AUDIO ================= */
  let AC = null;
  function ac() {
    if (!AC) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) AC = new AudioCtx();
      } catch (_) {
        AC = null;
      }
    }
    if (AC && AC.state === 'suspended') AC.resume().catch(() => {});
    return AC;
  }

  function tone(f1, f2, dur, type, vol, delay = 0) {
    if (!S.sound) return;
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + delay;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  function noise(dur, vol, freq) {
    if (!S.sound) return;
    const a = ac();
    if (!a) return;
    const n = Math.floor(a.sampleRate * dur);
    const b = a.createBuffer(1, n, a.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2);
    const s = a.createBufferSource();
    const fl = a.createBiquadFilter();
    const g = a.createGain();
    s.buffer = b;
    fl.type = 'lowpass';
    fl.frequency.value = freq;
    g.gain.value = vol;
    s.connect(fl).connect(g).connect(a.destination);
    s.start();
  }

  const sfx = {
    clink() { tone(1500, 1100, 0.09, 'sine', 0.06); tone(2300, 1800, 0.05, 'sine', 0.03, 0.012); },
    boing(v) { tone(170 + v * 40, 300 + v * 70, 0.24, 'triangle', 0.05); },
    pop() { tone(520, 300, 0.07, 'sine', 0.05); },
    ok() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.17, 'triangle', 0.06, i * 0.08)); },
    err() { tone(240, 150, 0.2, 'sawtooth', 0.05); },
    crack() { noise(0.35, 0.3, 2600); tone(320, 60, 0.3, 'square', 0.06); }
  };

  /* ================= CANVAS SETUP ================= */
  let cv, ctx, wrap, gcv, gctx, ghost, gx;
  let cw = 0, ch = 0, dpr = 1, G = null, clock = 0, shake = 0;
  let gw = 0, gh = 0, gd = 1;
  const cam = { s: 8 };
  const particles = [], rings = [], hit = { discs: [] };

  function geom() {
    const sc = clamp(Math.min(cw / 520, ch / 640), 0.72, 1.15);
    const g = {
      sc,
      topY: Math.round(70 * sc),
      floorY: ch - Math.round(36 * sc),
      rulerX: Math.round(46 * sc),
      poleX: cw - Math.round(34 * sc)
    };
    g.cx = (g.rulerX + 30 * sc + g.poleX - 22 * sc) / 2;
    return g;
  }

  function resizeStage() {
    if (!wrap || !cv) return;
    const r = wrap.getBoundingClientRect();
    cw = r.width;
    ch = r.height;
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    cv.width = Math.round(cw * dpr);
    cv.height = Math.round(ch * dpr);
    G = geom();
  }

  function resizeGraph() {
    const gWrap = byId('graphWrap');
    if (!gWrap || !gcv) return;
    const r = gWrap.getBoundingClientRect();
    gw = r.width;
    gh = r.height;
    gd = Math.min(2.5, window.devicePixelRatio || 1);
    gcv.width = Math.round(gw * gd);
    gcv.height = Math.round(gh * gd);
  }

  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function circ(c, x, y, r) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
  }

  /* ================= NETWORK GEOMETRY ================= */
  const spR = p => (6 + p.D * 0.95) * G.sc;
  const lenPx = id => Math.max(26, (S.sp[id].L + 100 * S.per[id]) * cam.s);

  function widthOf(n) {
    if (n.t === 's') return 2 * spR(S.sp[n.id]) + 14;
    if (n.t === 'ser') return Math.max(...n.ch.map(widthOf));
    return n.ch.reduce((a, c) => a + widthOf(c), 0) + 16 * G.sc * (n.ch.length - 1);
  }

  function heightOf(n) {
    if (n.t === 's') return lenPx(n.id);
    if (n.t === 'ser') return n.ch.reduce((a, c) => a + heightOf(c), 0);
    return Math.max(...n.ch.map(heightOf));
  }

  const dims = g => {
    const d = DISC[g];
    return [d[0] * G.sc, d[1] * G.sc];
  };
  const stackPx = () => S.stack.reduce((a, g) => a + dims(g)[1] + 1.5, 0);
  const HANG = 38;
  const slotY = (yb, idx) => {
    let y = yb + HANG * G.sc + 2;
    for (let i = 0; i < idx; i++) y += dims(S.stack[i])[1] + 1.5;
    return y;
  };

  /* ================= DRAW PRIMITIVES ================= */
  function drawBar(c, cx, y, w) {
    const g = c.createLinearGradient(0, y - 4, 0, y + 4);
    g.addColorStop(0, '#a39cbd');
    g.addColorStop(1, '#4a4560');
    c.fillStyle = g;
    rr(c, cx - w / 2, y - 3.5, w, 7, 3);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,.35)';
    for (const dx of [-w / 2 + 6, w / 2 - 6]) {
      circ(c, cx + dx, y, 1.4);
      c.fill();
    }
  }

  function drawSp(c, id, cx, y) {
    const p = S.sp[id], m = MAT[p.mat], sc = G.sc;
    const len = lenPx(id), xl = xlOf(p), ratio = S.per[id] / xl;
    const hot = clamp((ratio - 0.8) / 0.3, 0, 1), over = ratio > 1;
    const c1 = mix(m.c1, '#ff8a4a', hot * 0.85);
    const c2 = mix(m.c2, '#a8261c', hot);
    const R = spR(p);
    const nc = Math.max(5, Math.round((p.L * 10) / (1.5 * p.d) / 5));
    const hk = Math.min(11 * sc, len * 0.2), yb = y + hk, ye = y + len - hk;
    const coilH = Math.max(2, ye - yb);
    let w = (1.3 + (p.d - 0.7) * 3.2) * sc;
    w = Math.max(1, Math.min(w, (coilH / nc) * 0.8));
    const seg = 16, tot = nc * seg + 8, th1 = (nc + 0.5) * Math.PI * 2, e = R * 0.28;
    const px = [], py = [], pz = [];
    for (let i = 0; i <= tot; i++) {
      const t = i / tot, th = -Math.PI / 2 + t * th1;
      px.push(cx + R * Math.sin(th));
      py.push(yb + coilH * t + e * Math.cos(th));
      pz.push(Math.cos(th));
    }
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const pass = front => {
      c.beginPath();
      let pen = false;
      for (let i = 0; i < tot; i++) {
        const f = pz[i] + pz[i + 1] > 0;
        if (f !== front) { pen = false; continue; }
        if (!pen) { c.moveTo(px[i], py[i]); pen = true; }
        c.lineTo(px[i + 1], py[i + 1]);
      }
      c.stroke();
    };
    c.strokeStyle = c2;
    c.lineWidth = w;
    pass(false);
    if (hot > 0) {
      c.shadowColor = over ? '#ff5a3c' : '#ffa24a';
      c.shadowBlur = 10 + 6 * Math.sin(clock * 9) * hot;
    }
    c.strokeStyle = c1;
    c.lineWidth = w;
    pass(true);
    c.shadowBlur = 0;
    c.save();
    c.translate(0, -w * 0.22);
    c.strokeStyle = 'rgba(255,255,255,.5)';
    c.lineWidth = Math.max(0.8, w * 0.3);
    pass(true);
    c.restore();

    c.strokeStyle = c1;
    c.lineWidth = Math.max(1.4, w);
    c.beginPath();
    c.moveTo(cx, y + 5 * sc);
    c.lineTo(px[0], py[0]);
    c.moveTo(px[tot], py[tot]);
    c.lineTo(cx, y + len - 5 * sc);
    c.stroke();
    c.strokeStyle = c2;
    c.lineWidth = 1.8 * sc;
    circ(c, cx, y + 4 * sc, 3.6 * sc);
    c.stroke();
    circ(c, cx, y + len - 4 * sc, 3.6 * sc);
    c.stroke();
    c.restore();

    S.pos[id] = { x: cx, y: y + len / 2, len };
    if (len > 34) {
      const hidk = S.hide.spring;
      const txt = id + (hidk ? '' : ' · ' + sg(kOf(p), 3)) + (p.xperm > 1e-4 ? ' · ' + tr('deformedTag') : '');
      c.font = `800 ${Math.round(10.5 * sc + 1)}px "Plus Jakarta Sans", sans-serif`;
      const tw = c.measureText(txt).width + 12, th = 17 * sc + 2, ty = y + len / 2;
      c.fillStyle = 'rgba(37,33,55,.92)';
      rr(c, cx - tw / 2, ty - th / 2, tw, th, th / 2);
      c.fill();
      c.strokeStyle = p.xperm > 1e-4 ? '#ff9d3d' : COLS[id];
      c.lineWidth = 1.4;
      c.stroke();
      c.fillStyle = '#fff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(txt, cx, ty + 0.5);
    }
    return y + len;
  }

  function drawNode(c, n, cx, y) {
    if (n.t === 's') return drawSp(c, n.id, cx, y);
    if (n.t === 'ser') {
      let yy = y;
      for (const ch of n.ch) yy = drawNode(c, ch, cx, yy);
      return yy;
    }
    const ws = n.ch.map(widthOf), gap = 16 * G.sc;
    const tw = ws.reduce((a, b) => a + b, 0) + gap * (n.ch.length - 1);
    let x = cx - tw / 2;
    const cs = [];
    for (let i = 0; i < ws.length; i++) {
      cs.push(x + ws[i] / 2);
      x += ws[i] + gap;
    }
    const yb = y + Math.max(...n.ch.map(heightOf));
    drawBar(c, cx, y + 3.5, tw + 14);
    n.ch.forEach((ch, i) => {
      const ye = drawNode(c, ch, cs[i], y);
      if (yb - ye > 0.8) {
        c.strokeStyle = '#6f6a89';
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(cs[i], ye);
        c.lineTo(cs[i], yb);
        c.stroke();
      }
    });
    drawBar(c, cx, yb - 1, tw + 14);
    return yb;
  }

  function drawDisc(c, g, x, y, alpha) {
    const [w, h] = dims(g), col = DISC[g][2];
    c.save();
    c.globalAlpha = alpha === undefined ? 1 : alpha;
    const gr = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    gr.addColorStop(0, col[0]);
    gr.addColorStop(1, col[1]);
    c.fillStyle = gr;
    rr(c, x - w / 2, y - h / 2, w, h, 3 * G.sc);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)';
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = 'rgba(0,0,0,.4)';
    c.fillRect(x, y - 1.2, w / 2, 2.4);
    if (h >= 12) {
      c.fillStyle = 'rgba(0,0,0,.75)';
      c.font = `800 ${Math.round(8.5 * G.sc + 1)}px "Plus Jakarta Sans", sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(g + ' g', x - w / 4, y + 0.5);
    }
    c.restore();
  }

  function drawRuler(c, yNat, yEnd) {
    const x = G.rulerX, w = 26 * G.sc, top = G.topY, bot = G.floorY - 4, s = cam.s;
    const gr = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, '#ffe3a8');
    gr.addColorStop(1, '#f1c46a');
    c.fillStyle = gr;
    rr(c, x - w / 2, top, w, bot - top, 4);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)';
    c.lineWidth = 1;
    c.stroke();

    const steps = [0.5, 1, 2, 5, 10, 20, 50];
    const step = steps.find(v => v * s >= 30) || 50;
    const minor = step / 5, cmMax = (bot - top) / s;
    const drawMinor = minor * s >= 5;
    c.strokeStyle = '#3a2f12';
    c.fillStyle = '#3a2f12';
    c.font = `800 ${Math.round(9 * G.sc + 1)}px "Plus Jakarta Sans", sans-serif`;
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    const nMin = Math.floor(cmMax / minor + 1e-6);
    for (let i = 0; i <= nMin; i++) {
      const v = i * minor, y = top + v * s, major = i % 5 === 0;
      if (!major && !drawMinor) continue;
      const L = major ? 11 * G.sc : 6 * G.sc;
      c.lineWidth = major ? 1.4 : 1;
      c.beginPath();
      c.moveTo(x + w / 2, y);
      c.lineTo(x + w / 2 - L, y);
      c.stroke();
      if (major) c.fillText(+(v.toFixed(2)) + '', x - w / 2 + 3, y);
    }
    c.save();
    c.translate(x - w / 2 + 3, bot - 8);
    c.fillStyle = 'rgba(58,47,18,.65)';
    c.font = `800 ${Math.round(8 * G.sc + 1)}px "Plus Jakarta Sans", sans-serif`;
    c.fillText('cm', 0, 0);
    c.restore();

    const hid = S.hide.x;
    c.setLineDash([5, 5]);
    c.lineWidth = 1.3;
    c.strokeStyle = 'rgba(14,116,144,.8)';
    c.beginPath();
    c.moveTo(x + w / 2, yNat);
    c.lineTo(G.cx + 90 * G.sc, yNat);
    c.stroke();
    c.strokeStyle = 'rgba(180,83,9,.9)';
    c.beginPath();
    c.moveTo(x + w / 2, yEnd);
    c.lineTo(G.cx + 90 * G.sc, yEnd);
    c.stroke();
    c.setLineDash([]);

    c.fillStyle = '#b45309';
    c.beginPath();
    c.moveTo(x + w / 2 + 2, yEnd);
    c.lineTo(x + w / 2 + 11 * G.sc, yEnd - 5 * G.sc);
    c.lineTo(x + w / 2 + 11 * G.sc, yEnd + 5 * G.sc);
    c.closePath();
    c.fill();

    c.font = `800 ${Math.round(10 * G.sc + 1)}px "Plus Jakarta Sans", sans-serif`;
    c.textAlign = 'left';
    c.fillStyle = '#0e7490';
    c.fillText('ℓ₀', x + w / 2 + 14 * G.sc, yNat - 7 * G.sc);

    if (!hid && yEnd - yNat > 9) {
      const ax = x + w / 2 + 26 * G.sc;
      c.strokeStyle = '#b45309';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(ax, yNat + 2);
      c.lineTo(ax, yEnd - 2);
      c.stroke();
      c.fillStyle = '#b45309';
      c.beginPath();
      c.moveTo(ax, yEnd);
      c.lineTo(ax - 3.5, yEnd - 7);
      c.lineTo(ax + 3.5, yEnd - 7);
      c.fill();
      if (yEnd - yNat > 26) c.fillText('x', ax + 6, (yNat + yEnd) / 2);
    }
  }

  function drawStand(c, armLeft) {
    const px = G.poleX, top = G.topY, fl = G.floorY, sc = G.sc;
    let g = c.createLinearGradient(px - 6, 0, px + 6, 0);
    g.addColorStop(0, '#8d87a6');
    g.addColorStop(0.5, '#5f5979');
    g.addColorStop(1, '#3b3652');
    c.fillStyle = g;
    rr(c, px - 6 * sc, top - 34 * sc, 12 * sc, fl - top + 34 * sc, 4);
    c.fill();

    g = c.createLinearGradient(0, fl, 0, fl + 14);
    g.addColorStop(0, '#4a4560');
    g.addColorStop(1, '#252137');
    c.fillStyle = g;
    rr(c, px - 56 * sc, fl - 2, 92 * sc, 12 * sc, 5);
    c.fill();

    g = c.createLinearGradient(0, top - 10 * sc, 0, top);
    g.addColorStop(0, '#a8a2c0');
    g.addColorStop(1, '#5f5979');
    c.fillStyle = g;
    rr(c, armLeft, top - 10 * sc, px - armLeft + 6 * sc, 10 * sc, 4);
    c.fill();
    c.fillStyle = '#252137';
    rr(c, px - 11 * sc, top - 18 * sc, 22 * sc, 24 * sc, 5);
    c.fill();
    c.fillStyle = '#f59e0b';
    circ(c, px, top - 6 * sc, 3 * sc);
    c.fill();
  }

  function toast(msg) {
    const t = byId('toast');
    if (!t) return;
    t.innerHTML = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function spawnSparks(x, y, n, cols) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), sp = rnd(60, 260) * G.sc;
      particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        life: 1, decay: rnd(0.9, 1.8), r: rnd(1.5, 3.6) * G.sc, col: pick(cols), g: 520 * G.sc
      });
    }
  }

  function confetti() {
    const cols = ['#f59e0b', '#252137', '#c2336b', '#1d7fa6', '#047857'];
    for (let i = 0; i < 110; i++) {
      particles.push({
        x: rnd(cw * 0.2, cw * 0.8), y: rnd(-20, 40),
        vx: rnd(-120, 120), vy: rnd(40, 260),
        life: 1, decay: rnd(0.25, 0.5), r: rnd(2.5, 5) * G.sc, col: pick(cols), g: 260 * G.sc, sq: true
      });
    }
  }

  function drawScene(dt) {
    if (!ctx || cw <= 0 || ch <= 0) return;
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sx = shake ? rnd(-shake, shake) : 0, sy = shake ? rnd(-shake, shake) : 0;
    c.translate(sx, sy);

    let g = c.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, '#f7f4fc');
    g.addColorStop(1, '#ece7f6');
    c.fillStyle = g;
    c.fillRect(-10, -10, cw + 20, ch + 20);

    c.strokeStyle = 'rgba(133,83,0,.08)';
    c.lineWidth = 1;
    const gs = 28 * G.sc;
    for (let x = G.cx % gs; x < cw; x += gs) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, ch); c.stroke(); }
    for (let y = 0; y < ch; y += gs) { c.beginPath(); c.moveTo(0, y); c.lineTo(cw, y); c.stroke(); }

    const sp = c.createRadialGradient(G.cx, G.topY + 60, 10, G.cx, G.topY + 60, ch * 0.7);
    sp.addColorStop(0, 'rgba(255,221,184,.55)');
    sp.addColorStop(1, 'rgba(255,221,184,0)');
    c.fillStyle = sp;
    c.fillRect(0, 0, cw, ch);

    g = c.createLinearGradient(0, G.floorY, 0, ch);
    g.addColorStop(0, '#d9d0ec');
    g.addColorStop(1, '#c5bbdf');
    c.fillStyle = g;
    c.fillRect(-10, G.floorY, cw + 20, ch - G.floorY + 10);
    c.fillStyle = 'rgba(37,33,55,.18)';
    c.fillRect(-10, G.floorY, cw + 20, 2);

    const R = root(), Lnat = natLen(S.sp, R) * 100;
    const tw = widthOf(R) + 40 * G.sc, armLeft = Math.min(G.cx - tw / 2, G.cx - 40 * G.sc);
    drawStand(c, armLeft);
    const yTop = G.topY, yNat = yTop + Lnat * cam.s;
    const yEndGuess = yTop + heightOf(R);
    drawRuler(c, yNat, yEndGuess);

    const yb = drawNode(c, R, G.cx, yTop);
    S.endY = yb;

    const tg = S.mission && S.mission.d.target;
    if (tg) {
      const yT = yTop + (Lnat + tg.x) * cam.s;
      c.setLineDash([8, 6]);
      c.strokeStyle = '#047857';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(G.rulerX + 14 * G.sc, yT);
      c.lineTo(cw - 60 * G.sc, yT);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = '#047857';
      rr(c, cw - 62 * G.sc - 74 * G.sc, yT - 12 * G.sc, 74 * G.sc, 22 * G.sc, 8);
      c.fill();
      c.fillStyle = '#fff';
      c.font = `800 ${Math.round(10.5 * G.sc + 1)}px "Plus Jakarta Sans", sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(tr('targetFlag'), cw - 62 * G.sc - 37 * G.sc, yT + 0.5);
    }

    const hx = G.cx, sh = G.sc;
    const rodEnd = slotY(yb, S.stack.length) + 6 * sh;
    c.strokeStyle = '#5b5670';
    c.lineWidth = 2.4 * sh;
    c.beginPath();
    c.moveTo(hx, yb + 7 * sh);
    c.lineTo(hx, rodEnd);
    c.stroke();
    c.strokeStyle = '#7a748f';
    c.lineWidth = 1.8 * sh;
    circ(c, hx, yb + 5 * sh, 4 * sh);
    c.stroke();
    c.fillStyle = '#4a4560';
    c.beginPath();
    c.ellipse(hx, yb + HANG * sh * 0.8, 15 * sh, 3.8 * sh, 0, 0, 7);
    c.fill();
    c.fillStyle = '#9690ad';
    c.beginPath();
    c.ellipse(hx, yb + HANG * sh * 0.8 - 1.5, 15 * sh, 3.2 * sh, 0, 0, 7);
    c.fill();

    hit.discs = [];
    S.stack.forEach((gm, i) => {
      const y = slotY(yb, i), [w, h] = dims(gm);
      hit.discs.push({ i, x: hx - w / 2 - 6, y: y - h / 2 - 2, w: w + 12, h: h + 4 });
      drawDisc(c, gm, hx, y + h / 2);
    });
    S.hang = { x: hx, y: slotY(yb, S.stack.length) };
    if (S.dragHover) {
      const a = 0.5 + 0.5 * Math.sin(clock * 8);
      c.strokeStyle = `rgba(4,120,87,${0.5 + 0.4 * a})`;
      c.lineWidth = 3;
      c.setLineDash([6, 5]);
      c.lineDashOffset = -clock * 30;
      circ(c, hx, S.hang.y + 14 * sh, 44 * sh + 4 * a);
      c.stroke();
      c.setLineDash([]);
    }
    S.hangBottom = rodEnd;

    for (const f of S.flying) {
      const u = clamp(f.t / f.dur, 0, 1), e = 1 - Math.pow(1 - u, 3);
      const tx = hx, ty = slotY(yb, S.stack.length) + dims(f.g)[1] / 2;
      const x = lerp(f.x0, tx, e), y = lerp(f.y0, ty, e) - Math.sin(Math.PI * u) * 34 * sh;
      drawDisc(c, f.g, x, y, 1);
    }

    for (const d of S.debris) {
      c.save();
      c.translate(d.x, d.y);
      c.rotate(d.rot);
      c.globalAlpha = clamp(d.life, 0, 1);
      drawDisc(c, d.g, 0, 0, 1);
      c.restore();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0 || p.y > ch + 20) { particles.splice(i, 1); continue; }
      c.globalAlpha = clamp(p.life, 0, 1);
      c.fillStyle = p.col;
      if (p.sq) {
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.life * 9);
        c.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
        c.restore();
      } else {
        circ(c, p.x, p.y, p.r);
        c.fill();
      }
    }

    c.globalAlpha = 1;
    const now = performance.now();
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i], k = (now - r.t0) / 500;
      if (k >= 1) { rings.splice(i, 1); continue; }
      c.strokeStyle = r.col;
      c.globalAlpha = 1 - k;
      c.lineWidth = 3 * (1 - k) + 0.5;
      circ(c, r.x, r.y, (10 + 40 * k) * G.sc);
      c.stroke();
    }
    c.globalAlpha = 1;
    c.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ================= PHYSICS STEP ================= */
  function commit() {
    const R = root(), W = weight(), out = {};
    dist(S.sp, R, W, out, false);
    let broken = null;
    for (const id of ids()) {
      const p = S.sp[id], o = out[id], k = kOf(p), xl = xlOf(p);
      if (o.F > FBRK * k * xl + 1e-9 && !broken) broken = id;
      if (o.x > p.xmax + 1e-12) {
        const had = p.xperm;
        p.xmax = o.x;
        if (o.x > xl + 1e-12) {
          p.xperm = Math.max(p.xperm, o.x - o.F / k);
          if (had < 1e-6 && p.xperm > 1e-4) {
            toast(fmtMsg('toastPlastic', { id }));
            sfx.err();
          }
        }
      }
    }
    if (broken) { doBreak(broken); return; }
    S.Xt = nExt(S.sp, R, W, false);
    const last = S.trail[S.trail.length - 1];
    if (!last || Math.abs(last.F - W) > 1e-9 || Math.abs(last.x - S.Xt * 100) > 1e-6) {
      S.trail.push({ F: W, x: S.Xt * 100 });
      if (S.trail.length > 60) S.trail.shift();
    }
  }

  function stepPhys(dt) {
    const Mkg = totalMass() / 1000, W = weight();
    const keff = S.Xt > 1e-5 && W > 0 ? W / S.Xt : kIdeal(S.sp, root());
    const w = clamp(Math.sqrt(Math.max(keff, 0.5) / (Mkg + 0.03)), 3.2, 15), z = 0.24;
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = -w * w * (S.X - S.Xt) - 2 * z * w * S.V;
      S.V += a * h;
      S.X += S.V * h;
    }
    const x0 = nExt(S.sp, root(), 0, false);
    if (S.X < x0) { S.X = x0; if (S.V < 0) S.V = 0; }
    S.Fc = nForce(S.sp, root(), S.X, false);
    const out = {};
    dist(S.sp, root(), S.Fc, out, false);
    const kf = 1 - Math.exp(-dt * 40);
    for (const id of ids()) {
      S.per[id] += (out[id].x - S.per[id]) * kf;
      S.pf[id] = out[id].F;
    }
    for (const id of ['A', 'B', 'C']) {
      if (!ids().includes(id)) S.per[id] += (xSpr(S.sp[id], 0, false) - S.per[id]) * kf;
    }
    for (let i = S.flying.length - 1; i >= 0; i--) {
      const f = S.flying[i];
      f.t += dt;
      if (f.t >= f.dur) {
        S.flying.splice(i, 1);
        S.stack.push(f.g);
        landMass(f.g);
      }
    }
    for (let i = S.debris.length - 1; i >= 0; i--) {
      const d = S.debris[i];
      d.vy += 900 * G.sc * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rot += d.vr * dt;
      d.life -= dt * 0.9;
      if (d.life <= 0 || d.y > ch + 40) S.debris.splice(i, 1);
    }
    shake *= Math.pow(0.0008, dt);
    if (shake < 0.15) shake = 0;
  }

  function landMass(g) {
    commit();
    rings.push({ x: G.cx, y: (S.endY || G.topY + 100) + 12, t0: performance.now(), col: '#f59e0b' });
    sfx.clink();
    setTimeout(() => sfx.boing(Math.min(3, g / 100)), 40);
    if (navigator.vibrate) try { navigator.vibrate(10); } catch (_) {}
    byId('hint').classList.add('hide');
    syncAll();
  }

  function addMass(g, cx, cy) {
    if (totalMass() + S.flying.reduce((a, f) => a + f.g, 0) + g > GMAX || S.stack.length + S.flying.length >= MAXN) {
      toast(tr('toastMaxMass'));
      sfx.err();
      return;
    }
    const r = cv.getBoundingClientRect();
    S.flying.push({ g, x0: cx - r.left, y0: cy - r.top, t: 0, dur: 0.42 });
    sfx.pop();
  }

  function removeMass(i) {
    if (i < 0 || i >= S.stack.length) return;
    const g = S.stack[i], d = hit.discs.find(q => q.i === i);
    S.stack.splice(i, 1);
    if (d) S.debris.push({ g, x: d.x + d.w / 2, y: d.y + d.h / 2, vx: rnd(-80, 80), vy: -120, rot: 0, vr: rnd(-4, 4), life: 1 });
    sfx.pop();
    commit();
    syncAll();
  }

  function doBreak(id) {
    const pos = S.pos[id] || { x: G.cx, y: G.topY + 100 };
    spawnSparks(pos.x, pos.y, 70, ['#ffd27a', '#ff7a45', '#ffffff', '#ff4d4d']);
    shake = 12;
    sfx.crack();
    const f = byId('flash');
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
    const yb = S.endY || G.topY + 100;
    S.stack.forEach((g, i) => {
      const y = slotY(yb, i) + dims(g)[1] / 2;
      S.debris.push({ g, x: G.cx, y, vx: rnd(-90, 90), vy: rnd(-160, -40), rot: 0, vr: rnd(-6, 6), life: 1 });
    });
    S.stack = [];
    const p = S.sp[id];
    p.xmax = 0;
    p.xperm = 0;
    S.Xt = nExt(S.sp, root(), 0, false);
    S.trail = [];
    toast(fmtMsg('toastBreak', { id }));
    if (S.mission) missionFb(tr('toastBreakMission'), 'err');
  }

  /* ================= GRAPH ================= */
  function drawGraph() {
    if (!gctx || gw <= 0 || gh <= 0) return;
    if (S.envDirty) buildEnv();
    const c = gctx;
    c.setTransform(gd, 0, 0, gd, 0, 0);
    c.clearRect(0, 0, gw, gh);

    const E = S.env, hl = S.hide.lim;
    const Lm = 46, Rm = 14, Tm = 14, Bm = 34, W = gw - Lm - Rm, H = gh - Tm - Bm;
    if (W <= 0 || H <= 0) return;

    let xmaxCm, Fmax;
    if (hl) {
      xmaxCm = Math.max(5, ...S.trail.map(p => p.x), S.X * 100) * 1.25;
      Fmax = Math.max(2, ...S.trail.map(p => p.F), S.Fc) * 1.25;
    } else {
      const ie = E.limI !== null ? Math.min(E.pts.length - 1, Math.ceil(E.limI * 1.7)) : E.pts.length - 1;
      const pe = E.pts[ie];
      xmaxCm = Math.max(pe.x * 100, S.X * 100 * 1.05, 4);
      Fmax = Math.max(pe.F, S.Fc * 1.05, 0.5);
    }

    const xm = niceMax(xmaxCm), Fm = niceMax(Fmax);
    const X = x => Lm + (x / xm) * W, Y = f => Tm + H - (f / Fm) * H;

    c.font = '700 11px "Plus Jakarta Sans", sans-serif';
    c.fillStyle = '#5c5670';
    c.strokeStyle = '#ece7f6';
    c.lineWidth = 1;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const v = (Fm * i) / 4, y = Y(v);
      c.beginPath(); c.moveTo(Lm, y); c.lineTo(Lm + W, y); c.stroke();
      c.fillText(v >= 10 ? Math.round(v) : sg(v, 2), Lm - 6, y);
    }
    c.textAlign = 'center';
    c.textBaseline = 'top';
    for (let i = 0; i <= 5; i++) {
      const v = (xm * i) / 5, x = X(v);
      c.beginPath(); c.moveTo(x, Tm); c.lineTo(x, Tm + H); c.stroke();
      c.fillText(v >= 10 ? Math.round(v) : sg(v, 2), x, Tm + H + 5);
    }

    c.fillStyle = '#252137';
    c.font = '800 11px "Plus Jakarta Sans", sans-serif';
    c.textAlign = 'right';
    c.fillText('x / cm', Lm + W, Tm + H + 18);
    c.save();
    c.translate(11, Tm + H / 2);
    c.rotate(-Math.PI / 2);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('F / N', 0, 0);
    c.restore();

    c.save();
    c.beginPath();
    c.rect(Lm, Tm - 4, W + 4, H + 8);
    c.clip();

    const kth = kIdeal(S.sp, root());
    if (!S.hide.k && !S.hide.kth) {
      c.setLineDash([2, 5]);
      c.strokeStyle = 'rgba(37,33,55,.4)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(X(0), Y(0));
      c.lineTo(X(xm), Y((kth * xm) / 100));
      c.stroke();
      c.setLineDash([]);
    }

    const Fc = S.Fc, Xc = S.X * 100;
    if (!hl) {
      c.beginPath();
      c.moveTo(X(0), Y(0));
      for (const p of E.pts) {
        if (p.F > Fc) break;
        c.lineTo(X(p.x * 100), Y(p.F));
      }
      c.lineTo(X(Xc), Y(Fc));
      c.lineTo(X(Xc), Y(0));
      c.closePath();
      c.fillStyle = 'rgba(245,158,11,.25)';
      c.fill();

      c.setLineDash([6, 4]);
      c.strokeStyle = '#855300';
      c.lineWidth = 2;
      c.beginPath();
      E.pts.forEach((p, i) => (i ? c.lineTo(X(p.x * 100), Y(p.F)) : c.moveTo(X(p.x * 100), Y(p.F))));
      c.stroke();
      c.setLineDash([]);

      if (E.limI !== null) {
        const p = E.pts[E.limI];
        const lx = X(p.x * 100), ly = Y(p.F);
        c.fillStyle = '#c2410c';
        circ(c, lx, ly, 5);
        c.fill();
        c.font = '800 11px "Plus Jakarta Sans", sans-serif';
        if (lx > Lm + 72) {
          c.textAlign = 'right';
          c.textBaseline = 'bottom';
          c.fillText(tr('graphLimitLabel'), lx - 7, ly - 5);
        } else {
          c.textAlign = 'left';
          c.textBaseline = 'top';
          c.fillText(tr('graphLimitLabel'), lx + 7, ly + 6);
        }
      }
      if (E.brkI !== null) {
        const p = E.pts[E.brkI];
        c.strokeStyle = '#c01836';
        c.lineWidth = 2.5;
        const px = X(p.x * 100), py = Y(p.F);
        c.beginPath();
        c.moveTo(px - 5, py - 5); c.lineTo(px + 5, py + 5);
        c.moveTo(px + 5, py - 5); c.lineTo(px - 5, py + 5);
        c.stroke();
        c.fillStyle = '#c01836';
        c.font = '800 11px "Plus Jakarta Sans", sans-serif';
        c.textAlign = 'right';
        c.textBaseline = 'bottom';
        c.fillText(tr('graphBreakLabel'), px - 7, py - 6);
      }
    }

    if (S.trail.length) {
      c.strokeStyle = 'rgba(37,33,55,.5)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(X(0), Y(0));
      S.trail.forEach(p => c.lineTo(X(p.x), Y(p.F)));
      c.stroke();
      S.trail.forEach(p => {
        c.fillStyle = '#fff';
        circ(c, X(p.x), Y(p.F), 3.4);
        c.fill();
        c.strokeStyle = '#252137';
        c.lineWidth = 1.4;
        c.stroke();
      });
    }

    const kf = fitSlope(S.rec);
    if (kf) {
      c.strokeStyle = '#047857';
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(X(0), Y(0));
      c.lineTo(X(xm), Y((kf * xm) / 100));
      c.stroke();
    }

    S.rec.forEach(r => {
      c.fillStyle = '#047857';
      circ(c, X(r.x), Y(r.F), 5);
      c.fill();
      c.strokeStyle = '#fff';
      c.lineWidth = 2;
      c.stroke();
    });

    const cxp = X(Xc), cyp = Y(Fc), pulse = 6 + 2 * Math.sin(clock * 6);
    c.fillStyle = 'rgba(245,158,11,.3)';
    circ(c, cxp, cyp, pulse + 5);
    c.fill();
    c.fillStyle = '#f59e0b';
    circ(c, cxp, cyp, 5.5);
    c.fill();
    c.restore();
  }

  /* ================= UI & TABS ================= */
  const H = k => !!S.hide[k];

  function selectTab(index) {
    const tabs = [byId('tab-spring'), byId('tab-topo'), byId('tab-table')];
    const panes = [byId('pane-spring'), byId('pane-topo'), byId('pane-table')];
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panes[i].inert = !active;
    });
  }

  function setupTabs() {
    const tabs = [byId('tab-spring'), byId('tab-topo'), byId('tab-table')];
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        selectTab(index);
        sfx.pop();
      });
      tab.addEventListener('keydown', e => {
        const len = tabs.length;
        const map = {
          ArrowLeft: (index - 1 + len) % len,
          ArrowRight: (index + 1) % len,
          Home: 0,
          End: len - 1
        };
        const next = map[e.key];
        if (next === undefined) return;
        e.preventDefault();
        selectTab(next);
        tabs[next].focus();
      });
    });
  }

  function syncSpringUI() {
    const p = S.sp[S.sel], act = ids(), L = S.locks;
    byId('spSubName').textContent = S.sel;
    $$('#spTabs button').forEach(b => {
      b.classList.toggle('on', b.dataset.id === S.sel);
      b.classList.toggle('off', !act.includes(b.dataset.id));
    });
    $$('#mats button').forEach(b => {
      b.classList.toggle('on', !H('spring') && b.dataset.m === p.mat);
      b.disabled = !!(L.mat || L.all);
    });
    ['L', 'd', 'D'].forEach(k => {
      const inp = byId('slider-' + k);
      const out = byId('out-' + k);
      const dec = byId('dec-' + k);
      const inc = byId('inc-' + k);
      const hs = H('spring');
      const locked = !!(L[k] || L.all);
      const min = +inp.min, max = +inp.max;
      inp.value = hs ? inp.min : p[k];
      out.textContent = hs ? '?' : p[k] + (k === 'L' ? ' cm' : ' mm');
      inp.disabled = locked;
      if (dec) dec.disabled = locked || hs || p[k] <= min + 1e-9;
      if (inc) inc.disabled = locked || hs || p[k] >= max - 1e-9;
    });

    const k = kOf(p), hid = H('spring');
    byId('kVal').textContent = hid ? '???' : sg(k, 3);
    byId('kBar').style.width = hid ? '0%' : clamp(Math.log10(Math.max(k, 1)) / Math.log10(600) * 100, 3, 100) + '%';
    byId('kMini').innerHTML = hid
      ? tr('kHiddenMsg')
      : `= ${sg(k / 100, 3)} N cm⁻¹ · ${tr('kLimitWord')} ≈ <b>${sg(FlOf(p), 3)} N</b> (${sg((FlOf(p) / S.g) * 1000, 3)} g)` +
        (p.xperm > 1e-4 ? `<br><span style="color:#ffb35c">⚠ ${tr('kPlasticWord')} +${fx(p.xperm * 100, 1)} cm</span>` : '');
    $$('.pre').forEach(b => b.disabled = !!(L.all || L.mat));
    byId('sameBtn').disabled = !!(L.all || L.mat);
    byId('renewBtn').disabled = false;
  }

  function syncTopoUI() {
    $$('#topos .topo').forEach(b => {
      b.classList.toggle('on', b.dataset.t === S.topo);
      b.disabled = !!S.locks.topo;
    });
    const info = TOPO[S.topo][S.lang];
    byId('topoSub').textContent = info.n;
    const kt = kIdeal(S.sp, root());
    byId('formula').innerHTML = info.f + (H('kth') || H('k') ? '' : `<br>${tr('kEffective')} = <b>${sg(kt, 3)} N m⁻¹</b>`);
  }

  function updateUI() {
    const Mkg = totalMass(), W = weight(), X = S.X, x = X * 100;
    const info = TOPO[S.topo][S.lang];
    byId('hudL').innerHTML = `⚖️ <b>${Mkg} g</b> · F = <b>${fx(W, 2)} N</b><small>${info.n}</small>`;
    byId('hudR').innerHTML = H('x') ? 'x = <b>?</b>' : `↕ x = <b>${fx(x, 1)} cm</b>`;
    byId('totM').textContent = Mkg + ' g';
    byId('rM').textContent = Mkg;
    byId('rF').textContent = fx(W, 2);
    byId('rX').textContent = H('x') ? '?' : fx(x, 1);

    const km = W > 0 && X > 1e-4 ? W / X : null;
    const kt = kIdeal(S.sp, root());
    byId('rK').textContent = H('k') ? '?' : (km ? sg(km, 3) : '–');
    byId('rKt').textContent = H('k') || H('kth') ? '?' : sg(kt, 3);

    let E = 0;
    ids().forEach(id => {
      const k = kOf(S.sp[id]);
      E += (0.5 * S.pf[id] * S.pf[id]) / k;
    });
    byId('rE').textContent = H('E') ? '?' : (E < 0.01 ? fx(E, 4) : fx(E, 3));

    const over = ids().some(id => S.sp[id].xperm > 1e-4 || S.per[id] > xlOf(S.sp[id]) + 1e-6);
    const chip = byId('statusChip');
    if (over) {
      chip.className = 'hooke-chip bad';
      chip.textContent = tr('statusBad');
    } else if (W > 0) {
      chip.className = 'hooke-chip ok';
      chip.textContent = tr('statusOk');
    } else {
      chip.className = 'hooke-chip';
      chip.textContent = tr('statusNone');
    }

    byId('perSpring').innerHTML = ids().map(id => {
      const p = S.sp[id], hid = H('spring');
      return `<div class="ps ${S.per[id] > xlOf(p) + 1e-6 ? 'bad' : ''}">` +
        `<b style="background:${COLS[id]}">${id}</b>` +
        `<span><small>k (N m⁻¹)</small>${hid ? '?' : sg(kOf(p), 3)}</span>` +
        `<span><small>F (N)</small>${fx(S.pf[id], 2)}</span>` +
        `<span><small>x (cm)</small>${H('x') ? '?' : fx(S.per[id] * 100, 1)}</span>` +
        `</div>`;
    }).join('');
  }

  function renderTable() {
    const tb = byId('tRows');
    tb.innerHTML = S.rec.map((r, i) =>
      `<tr class="${r.isNew ? 'new' : ''}"><td>${i + 1}</td><td>${r.m}</td><td>${fx(r.F, 3)}</td><td>${fx(r.x, 2)}</td><td>${H('k') ? '?' : sg(r.F / (r.x / 100), 3)}</td></tr>`
    ).join('');
    S.rec.forEach(r => { r.isNew = false; });

    const countBadge = byId('tab-record-count');
    if (countBadge) {
      countBadge.textContent = String(S.rec.length);
      countBadge.hidden = S.rec.length === 0;
    }

    const kf = fitSlope(S.rec);
    if (H('k')) {
      byId('tFit').innerHTML = tr('tableHiddenHint');
    } else if (kf) {
      byId('tFit').innerHTML = `${tr('slopePrefix')} = <b>${sg(kf, 3)} N m⁻¹</b> = ${sg(kf / 100, 3)} N cm⁻¹`;
    } else {
      byId('tFit').innerHTML = tr('tableDefaultHint');
    }
  }

  function syncAll() {
    syncSpringUI();
    syncTopoUI();
    updateUI();
    renderTable();
    renderBanner();
  }

  function topoIcon(key) {
    const w = 50, h = 44, d = Math.min(3, window.devicePixelRatio || 1);
    const el = document.createElement('canvas');
    el.width = w * d;
    el.height = h * d;
    const c = el.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    c.strokeStyle = '#3b3652';
    c.lineWidth = 1.5;
    c.lineJoin = 'round';
    const line = (x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
    const zig = (xc, y0, y1) => {
      const a = y1 - y0, e = Math.min(3, a * 0.15), n = 6;
      c.beginPath();
      c.moveTo(xc, y0);
      c.lineTo(xc, y0 + e);
      for (let i = 0; i < n; i++) c.lineTo(xc + (i % 2 ? -5 : 5), y0 + e + ((a - 2 * e) * (i + 0.5)) / n);
      c.lineTo(xc, y1 - e);
      c.lineTo(xc, y1);
      c.stroke();
    };
    (function dn(n, x0, x1, y0, y1) {
      const xc = (x0 + x1) / 2;
      if (n.t === 's') return zig(xc, y0, y1);
      if (n.t === 'ser') {
        const m = n.ch.length;
        n.ch.forEach((q, i) => dn(q, x0, x1, y0 + ((y1 - y0) * i) / m, y0 + ((y1 - y0) * (i + 1)) / m));
        return;
      }
      const m = n.ch.length, bw = (x1 - x0) / m;
      line(x0 + bw / 2, y0, x1 - bw / 2, y0);
      line(x0 + bw / 2, y1, x1 - bw / 2, y1);
      n.ch.forEach((q, i) => dn(q, x0 + bw * i, x0 + bw * (i + 1), y0, y1));
    })(TOPO[key].tree, 4, w - 4, 7, h - 12);
    c.lineWidth = 2.4;
    line(6, 4, w - 6, 4);
    c.fillStyle = '#f59e0b';
    rr(c, w / 2 - 6, h - 9, 12, 7, 2);
    c.fill();
    return el;
  }

  function massIcon(g) {
    const w = 56, h = 36, d = Math.min(3, window.devicePixelRatio || 1);
    const el = document.createElement('canvas');
    el.width = w * d;
    el.height = h * d;
    const c = el.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    const [dw, dh, col] = DISC[g], k = 1.2, ww = dw * k, hh = dh * k;
    const gr = c.createLinearGradient(0, h / 2 - hh / 2, 0, h / 2 + hh / 2);
    gr.addColorStop(0, col[0]);
    gr.addColorStop(1, col[1]);
    c.fillStyle = gr;
    rr(c, w / 2 - ww / 2, h / 2 - hh / 2, ww, hh, 4);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)';
    c.stroke();
    c.fillStyle = 'rgba(0,0,0,.4)';
    c.fillRect(w / 2, h / 2 - 1.4, ww / 2, 2.8);
    return el;
  }

  function changeSp(k, v) {
    const p = S.sp[S.sel];
    p[k] = v;
    p.cal = 1;
    p.xmax = 0;
    p.xperm = 0;
    afterSp();
  }

  function afterSp() {
    S.trail = [];
    S.envDirty = true;
    commit();
    syncAll();
  }

  function setTopo(k) {
    S.topo = k;
    if (!ids().includes(S.sel)) S.sel = ids()[0];
    S.trail = [];
    S.envDirty = true;
    commit();
    syncAll();
  }

  /* ================= DRAG & DROP ================= */
  let drag = null;
  function drawGhost(g) {
    if (!ghost || !gx) return;
    const d = Math.min(2.5, window.devicePixelRatio || 1), [dw, dh] = DISC[g], k = 1.4;
    const w = dw * k + 16, h = dh * k + 16;
    ghost.width = w * d;
    ghost.height = h * d;
    ghost.style.width = w + 'px';
    ghost.style.height = h + 'px';
    ghost._w = w;
    ghost._h = h;
    gx.setTransform(d, 0, 0, d, 0, 0);
    gx.clearRect(0, 0, w, h);
    const col = DISC[g][2], gr = gx.createLinearGradient(0, 8, 0, h - 8);
    gr.addColorStop(0, col[0]);
    gr.addColorStop(1, col[1]);
    gx.fillStyle = gr;
    rr(gx, 8, 8, dw * k, dh * k, 4);
    gx.fill();
    gx.strokeStyle = 'rgba(0,0,0,.4)';
    gx.stroke();
    gx.fillStyle = 'rgba(0,0,0,.75)';
    gx.font = '800 11px "Plus Jakarta Sans", sans-serif';
    gx.textAlign = 'center';
    gx.textBaseline = 'middle';
    gx.fillText(g + ' g', w / 2, h / 2 + 0.5);
  }

  function bindTray(el, g) {
    el.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      ac();
      drag = { g, sx: e.clientX, sy: e.clientY, started: false, el, pt: e.pointerType };
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
    });
    el.addEventListener('pointermove', e => {
      if (!drag || drag.el !== el) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.started) {
        const mv = Math.hypot(dx, dy);
        const go = drag.pt === 'mouse' ? mv > 6 : (mv > 10 && dy < 0 && Math.abs(dy) > Math.abs(dx) * 0.8);
        if (!go) {
          if (drag.pt !== 'mouse' && Math.abs(dx) > 12) drag = null;
          return;
        }
        drag.started = true;
        el.classList.add('dragging');
        drawGhost(g);
        sfx.pop();
      }
      const r = cv.getBoundingClientRect();
      S.dragHover = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      ghost.style.transform = `translate(${e.clientX - ghost._w / 2}px,${e.clientY - ghost._h / 2}px)`;
    });
    const end = e => {
      if (!drag || drag.el !== el) return;
      const d = drag;
      drag = null;
      S.dragHover = false;
      el.classList.remove('dragging');
      ghost.style.transform = 'translate(-999px,-999px)';
      if (e.type === 'pointercancel') return;
      if (!d.started) {
        const r = el.getBoundingClientRect();
        addMass(g, r.left + r.width / 2, r.top + 10);
        return;
      }
      const r = cv.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        addMass(g, e.clientX, e.clientY);
      } else {
        toast(tr('toastDropAbove'));
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const r = el.getBoundingClientRect();
        addMass(g, r.left + r.width / 2, r.top + 10);
      }
    });
  }

  /* ================= MISSIONS ================= */
  const MIS = createMissions({
    getG: () => S.g,
    getLang: () => S.lang,
    totalMass,
    settled,
    getX: () => S.X,
    getRec: () => S.rec,
    getFlyingLen: () => S.flying.length,
    getSp: id => S.sp[id],
    setSp: (id, val) => { S.sp[id] = val; },
    setTopo: t => { S.topo = t; },
    setSel: s => { S.sel = s; },
    kIdealCurrent: () => kIdeal(S.sp, root())
  });

  let prog = { stars: {}, xp: 0 };
  try {
    const s = localStorage.getItem('hooke-prog-v1');
    if (s) prog = JSON.parse(s);
  } catch (_) {}
  const saveProg = () => {
    try { localStorage.setItem('hooke-prog-v1', JSON.stringify(prog)); } catch (_) {}
  };

  function resetLab() {
    S.sp = {
      A: newSp('keluli', 12, 1, 12),
      B: newSp('keluli', 12, 1, 12),
      C: newSp('keluli', 12, 1, 12)
    };
    S.topo = 'single';
    S.sel = 'A';
    S.stack = [];
    S.flying = [];
    S.debris = [];
    S.rec = [];
    S.trail = [];
    S.X = S.V = S.Xt = 0;
    S.per = { A: 0, B: 0, C: 0 };
    S.pf = { A: 0, B: 0, C: 0 };
    S.locks = {};
    S.hide = {};
    S.envDirty = true;
  }

  function setMode(m) {
    if (S.mode === m) return;
    S.mode = m;
    $$('#modeTabs button').forEach(b => {
      const active = b.dataset.m === m;
      b.classList.toggle('on', active);
      b.setAttribute('aria-pressed', String(active));
    });
    S.mission = null;
    resetLab();
    commit();
    syncAll();
    byId('hint').classList.remove('hide');
    if (m === 'chal') openList();
    renderBanner();
  }

  function startMission(i) {
    resetLab();
    const d = MIS[i].gen();
    S.mission = { i, d, tries: 0, hint: false, ok: false, hold: 0 };
    d.setup();
    S.locks = d.lock || {};
    S.hide = d.hide || {};
    S.envDirty = true;
    commit();
    S.X = S.Xt;
    ids().forEach(id => { S.per[id] = xSpr(S.sp[id], 0, false); });
    closeSheets();
    byId('hint').classList.remove('hide');
    byId('mInput').value = '';
    missionFb('', '');
    selectTab(i === 6 ? 1 : 0);
    syncAll();
    if (window.innerWidth <= 920) {
      setTimeout(() => byId('missionBar').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  }

  function missionFb(msg, cls) {
    const f = byId('mFb');
    f.className = 'mfb ' + (cls || '');
    f.textContent = msg;
  }

  function starsHtml(n) {
    return [1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('');
  }

  function renderBanner() {
    const mb = byId('missionBar');
    mb.hidden = S.mode !== 'chal';
    if (S.mode !== 'chal') return;
    const Mnow = S.mission;
    if (!Mnow) {
      byId('mNum').textContent = '?';
      byId('mTitle').textContent = tr('mSelectTitle');
      byId('mStars').innerHTML = '';
      byId('mText').innerHTML = tr('mEmptyPrompt');
      byId('mAns').hidden = true;
      byId('mProg').hidden = true;
      return;
    }
    byId('mNum').textContent = Mnow.i + 1;
    byId('mTitle').textContent = MIS[Mnow.i].t[S.lang];
    byId('mStars').innerHTML = starsHtml(prog.stars[Mnow.i] || 0);
    byId('mText').innerHTML = Mnow.d.text();
    byId('mUnit').textContent = Mnow.d.unit || '';
    byId('mAns').hidden = Mnow.d.kind !== 'num';
    byId('mProg').hidden = Mnow.d.kind !== 'state';
  }

  function submitAnswer() {
    const Mnow = S.mission;
    if (!Mnow || Mnow.ok || Mnow.d.kind === 'state') return;
    const need = Mnow.d.need && Mnow.d.need();
    if (need) { missionFb(need, 'info'); sfx.err(); return; }
    const inp = byId('mInput');
    const u = parseNum(inp.value);
    if (!isFinite(u)) {
      missionFb(tr('errNum'), 'err');
      inp.classList.remove('shake');
      void inp.offsetWidth;
      inp.classList.add('shake');
      return;
    }
    const a = Mnow.d.ans(), tol = Mnow.d.tol(a);
    if (Math.abs(u - a) <= tol) {
      winMission();
    } else {
      Mnow.tries++;
      sfx.err();
      inp.classList.remove('shake');
      void inp.offsetWidth;
      inp.classList.add('shake');
      let msg = u > a ? tr('errTooBig') : tr('errTooSmall');
      if (u > a * 8 || u < a / 8) msg += tr('errUnit');
      missionFb(
        `${msg} ${fmtMsg('errTryAgain', { n: Mnow.tries })}` + (Mnow.tries >= 2 && !Mnow.hint ? tr('errHintTip') : ''),
        'err'
      );
    }
  }

  function winMission() {
    const Mnow = S.mission;
    if (!Mnow || Mnow.ok) return;
    Mnow.ok = true;
    let stars = Mnow.tries === 0 ? 3 : Mnow.tries === 1 ? 2 : 1;
    if (Mnow.hint) stars = Math.max(1, stars - 1);
    const prev = prog.stars[Mnow.i] || 0;
    const gain = Math.max(0, stars - prev) * 100;
    if (stars > prev) prog.stars[Mnow.i] = stars;
    prog.xp += gain;
    saveProg();
    sfx.ok();
    confetti();
    byId('winStars').innerHTML = starsHtml(stars);
    byId('winTitle').textContent = stars === 3 ? tr('winTitlePerfect') : tr('winTitleGood');
    byId('winXp').textContent = gain ? `+${gain} XP` : tr('winXpRepeat');
    byId('winExpl').innerHTML = `<b>${tr('winSolutionTitle')}</b><br>${Mnow.d.expl()}`;
    byId('winNext').style.display = Mnow.i < MIS.length - 1 ? '' : 'none';
    setTimeout(() => byId('winSheet').classList.add('show'), 700);
    renderBanner();
  }

  function rankInfo() {
    let r = 0;
    RANKS.forEach((q, i) => { if (prog.xp >= q[0]) r = i; });
    const lo = RANKS[r][0], hi = RANKS[r + 1] ? RANKS[r + 1][0] : null;
    return {
      name: RANKS[r][1][S.lang],
      lo,
      hi,
      pct: hi ? ((prog.xp - lo) / (hi - lo)) * 100 : 100
    };
  }

  function openList() {
    const g = byId('mGrid');
    g.innerHTML = '';
    MIS.forEach((m, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mcard';
      b.innerHTML = `<em>${m.ic}</em><span><b>${i + 1}. ${m.t[S.lang]}</b><small>${m.s[S.lang]}</small><div class="stars" style="font-size:13px">${starsHtml(prog.stars[i] || 0)}</div></span>`;
      b.onclick = () => startMission(i);
      g.appendChild(b);
    });
    const r = rankInfo();
    byId('rankName').textContent = r.name;
    byId('rankXp').textContent = `${prog.xp} XP` + (r.hi ? ` · ${r.hi - prog.xp} ${tr('rankNextPrefix')}` : ` · ${tr('rankMax')}`);
    byId('xpFill').style.width = r.pct + '%';
    byId('listSheet').classList.add('show');
  }

  function closeSheets() {
    byId('listSheet').classList.remove('show');
    byId('winSheet').classList.remove('show');
  }

  function missionTick(dt) {
    const Mnow = S.mission;
    if (!Mnow || Mnow.ok || Mnow.d.kind !== 'state') return;
    const ok = Mnow.d.check();
    Mnow.hold = ok ? Mnow.hold + dt : Math.max(0, Mnow.hold - dt * 2);
    byId('mProgBar').style.width = clamp((Mnow.hold / 1.2) * 100, 0, 100) + '%';
    if (Mnow.hold >= 1.2) winMission();
  }

  /* ================= BILINGUAL SWITCHING ================= */
  function setLanguage(lang) {
    S.lang = lang === 'en' ? 'en' : 'ms';
    document.documentElement.lang = S.lang;
    document.title = tr('docTitle');
    try { localStorage.setItem('stemlab-lang', S.lang); } catch (_) {}

    $$('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      if (I18N[S.lang][k] !== undefined) el.textContent = I18N[S.lang][k];
    });
    $$('[data-i18n-html]').forEach(el => {
      const k = el.dataset.i18nHtml;
      if (I18N[S.lang][k] !== undefined) el.innerHTML = I18N[S.lang][k];
    });
    $$('[data-i18n-aria]').forEach(el => {
      const k = el.dataset.i18nAria;
      if (I18N[S.lang][k] !== undefined) el.setAttribute('aria-label', I18N[S.lang][k]);
    });

    const gn = byId('graphNote');
    if (gn) gn.innerHTML = tr('graphNoteHtml');

    const mInput = byId('mInput');
    if (mInput) mInput.placeholder = tr('mPlaceholder');
    const mHint = byId('mHint');
    if (mHint) {
      mHint.title = tr('mHintAria');
      mHint.setAttribute('aria-label', tr('mHintAria'));
    }

    const soundBtn = byId('togSound');
    const soundTxt = byId('soundText');
    if (soundBtn && soundTxt) {
      soundTxt.textContent = S.sound ? tr('soundOn') : tr('soundOff');
      soundBtn.setAttribute('aria-label', S.sound ? tr('soundAriaOn') : tr('soundAriaOff'));
    }

    const langBtn = byId('btn-lang');
    if (langBtn) {
      langBtn.setAttribute('aria-label', S.lang === 'en' ? 'Switch to Bahasa Melayu' : 'Tukar ke bahasa Inggeris');
    }

    $$('#mats button').forEach(b => {
      const m = MAT[b.dataset.m];
      if (!m) return;
      const stars = '★'.repeat(Math.round((m.G / 79) * 4)) + '☆'.repeat(4 - Math.round((m.G / 79) * 4));
      b.querySelector('span').innerHTML = `${m[S.lang]}<small>${stars} ${tr('hardnessLabel')}</small>`;
    });

    $$('#topos .topo').forEach(b => {
      const tp = TOPO[b.dataset.t];
      if (tp) b.querySelector('span').textContent = tp[S.lang].n;
    });

    $$('#tray .item').forEach(el => {
      el.querySelector('span').textContent = sg((+el.dataset.g / 1000) * S.g, 2) + ' N';
    });

    syncAll();
    if (byId('listSheet').classList.contains('show')) openList();
  }

  /* ================= BUILD & BIND ================= */
  function buildStatic() {
    const mats = byId('mats');
    Object.keys(MAT).forEach(k => {
      const m = MAT[k], b = document.createElement('button');
      b.type = 'button';
      b.dataset.m = k;
      const stars = '★'.repeat(Math.round((m.G / 79) * 4)) + '☆'.repeat(4 - Math.round((m.G / 79) * 4));
      b.innerHTML = `<i style="background:${m.dot}"></i><span>${m[S.lang]}<small>${stars} ${tr('hardnessLabel')}</small></span>`;
      b.onclick = () => {
        if (S.locks.mat || S.locks.all) return;
        changeSp('mat', k);
        sfx.pop();
      };
      mats.appendChild(b);
    });

    ['L', 'd', 'D'].forEach(k => {
      const inp = byId('slider-' + k);
      const dec = byId('dec-' + k);
      const inc = byId('inc-' + k);
      const step = k === 'd' ? 0.1 : 1;
      const roundVal = v => (k === 'd' ? +v.toFixed(1) : Math.round(v));

      inp.addEventListener('input', () => {
        if (S.locks[k] || S.locks.all) return;
        changeSp(k, roundVal(+inp.value));
      });
      if (dec) {
        dec.addEventListener('click', () => {
          if (S.locks[k] || S.locks.all) return;
          const next = clamp(roundVal(S.sp[S.sel][k] - step), +inp.min, +inp.max);
          changeSp(k, next);
          sfx.pop();
        });
      }
      if (inc) {
        inc.addEventListener('click', () => {
          if (S.locks[k] || S.locks.all) return;
          const next = clamp(roundVal(S.sp[S.sel][k] + step), +inp.min, +inp.max);
          changeSp(k, next);
          sfx.pop();
        });
      }
    });

    $$('#spTabs button').forEach(b => {
      b.onclick = () => { S.sel = b.dataset.id; sfx.pop(); syncSpringUI(); };
    });

    $$('.pre').forEach(b => {
      b.onclick = () => {
        if (S.locks.all || S.locks.mat) return;
        const q = PRESETS[b.dataset.pre], p = S.sp[S.sel];
        Object.assign(p, { mat: q[0], L: q[1], d: q[2], D: q[3], cal: 1, xmax: 0, xperm: 0 });
        afterSp();
        sfx.pop();
      };
    });

    byId('sameBtn').onclick = () => {
      const a = S.sp[S.sel];
      ['A', 'B', 'C'].forEach(id => {
        if (id !== S.sel) S.sp[id] = Object.assign(newSp(a.mat, a.L, a.d, a.D), { cal: a.cal });
      });
      afterSp();
      toast(fmtMsg('toastSame', { id: S.sel }));
      sfx.pop();
    };

    byId('renewBtn').onclick = () => {
      ids().forEach(id => { S.sp[id].xmax = 0; S.sp[id].xperm = 0; });
      S.trail = [];
      commit();
      syncAll();
      toast(tr('toastRenew'));
      sfx.pop();
    };

    const tp = byId('topos');
    Object.keys(TOPO).forEach(k => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'topo';
      b.dataset.t = k;
      b.appendChild(topoIcon(k));
      b.insertAdjacentHTML('beforeend', `<span>${TOPO[k][S.lang].n}</span>`);
      b.onclick = () => {
        if (S.locks.topo) return;
        setTopo(k);
        sfx.pop();
      };
      tp.appendChild(b);
    });

    const tray = byId('tray');
    MASSES.forEach(g => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'item';
      el.dataset.g = g;
      el.setAttribute('aria-label', `${g} g`);
      el.appendChild(massIcon(g));
      el.insertAdjacentHTML('beforeend', `<b>${g} g</b><span>${sg((g / 1000) * S.g, 2)} N</span>`);
      tray.appendChild(el);
      bindTray(el, g);
    });
  }

  function bindEvents() {
    byId('recBtn').onclick = () => {
      const W = weight();
      if (W <= 0) { toast(tr('toastNeedMass')); return; }
      if (!settled()) { toast(tr('toastWaitSettle')); return; }
      const m = totalMass();
      if (S.rec.some(r => r.m === m)) { toast(tr('toastDupMass')); return; }
      const plastic = ids().some(id => S.sp[id].xperm > 1e-4 || S.per[id] > xlOf(S.sp[id]));
      S.rec.push({ m, F: W, x: S.X * 100, plastic, isNew: true });
      sfx.pop();
      renderTable();
      if (plastic) toast(tr('toastPlasticRec'));
    };

    byId('clearRec').onclick = () => { S.rec = []; renderTable(); };
    byId('undoBtn').onclick = () => { if (S.stack.length) removeMass(S.stack.length - 1); };
    byId('clearBtn').onclick = () => {
      for (let i = S.stack.length - 1; i >= 0; i--) removeMass(i);
      S.trail = [];
      commit();
      syncAll();
    };

    byId('modeTabs').onclick = e => {
      const b = e.target.closest('button');
      if (b) setMode(b.dataset.m);
    };

    byId('gSeg').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      S.g = +b.dataset.g;
      $$('#gSeg button').forEach(x => {
        const active = x === b;
        x.classList.toggle('on', active);
        x.setAttribute('aria-pressed', String(active));
      });
      $$('#tray .item').forEach(el => {
        el.querySelector('span').textContent = sg((+el.dataset.g / 1000) * S.g, 2) + ' N';
      });
      S.envDirty = true;
      S.trail = [];
      commit();
      syncAll();
    };

    byId('togSound').onclick = e => {
      S.sound = !S.sound;
      const btn = e.currentTarget;
      btn.classList.toggle('on', S.sound);
      btn.classList.toggle('off', !S.sound);
      btn.setAttribute('aria-pressed', String(S.sound));
      btn.setAttribute('aria-label', S.sound ? tr('soundAriaOn') : tr('soundAriaOff'));
      byId('soundIcon').textContent = S.sound ? '🔊' : '🔇';
      byId('soundText').textContent = S.sound ? tr('soundOn') : tr('soundOff');
      if (S.sound) sfx.pop();
    };

    cv.addEventListener('click', e => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      for (let i = hit.discs.length - 1; i >= 0; i--) {
        const d = hit.discs[i];
        if (x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h) {
          removeMass(d.i);
          return;
        }
      }
    });

    cv.addEventListener('keydown', e => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && S.stack.length) {
        e.preventDefault();
        removeMass(S.stack.length - 1);
      }
    });

    byId('mList').onclick = openList;
    byId('listClose').onclick = closeSheets;
    byId('winList').onclick = () => { byId('winSheet').classList.remove('show'); openList(); };
    byId('winRetry').onclick = () => startMission(S.mission.i);
    byId('winNext').onclick = () => startMission(Math.min(MIS.length - 1, S.mission.i + 1));
    byId('listSheet').addEventListener('click', e => { if (e.target.id === 'listSheet') closeSheets(); });
    byId('mCheck').onclick = submitAnswer;
    byId('mInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); });
    byId('mHint').onclick = () => {
      const Mnow = S.mission;
      if (!Mnow) return;
      Mnow.hint = true;
      missionFb('💡 ' + Mnow.d.hint(), 'info');
      sfx.pop();
    };

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSheets();
    });

    const langBtn = byId('btn-lang');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        setLanguage(S.lang === 'ms' ? 'en' : 'ms');
      });
    }
  }

  /* ================= LOOP ================= */
  let last = 0, lastUI = 0, gFrame = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    if (G && cw > 0) {
      stepPhys(dt);
      const R = root(), tot = natLen(S.sp, R) * 100 + 100 * Math.max(S.Xt, S.X * 0.98);
      const avail = G.floorY - 16 - G.topY - 12 - (HANG * G.sc + stackPx() + 36 * G.sc);
      const st = clamp(avail / Math.max(tot, 6), 0.7, 17);
      cam.s += (st - cam.s) * (1 - Math.exp(-dt * 3.5));
      drawScene(dt);
      if (now - lastUI > 80) {
        lastUI = now;
        updateUI();
      }
      if (gFrame++ % 2 === 0) drawGraph();
      missionTick(dt);
    }
    requestAnimationFrame(frame);
  }

  /* ================= INIT ================= */
  function init() {
    cv = byId('stage');
    wrap = byId('stageWrap');
    gcv = byId('graph');
    ghost = byId('ghost');
    if (!cv || !wrap || !gcv) return;

    ctx = cv.getContext('2d');
    gctx = gcv.getContext('2d');
    gx = ghost ? ghost.getContext('2d') : null;

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resizeStage).observe(wrap);
      const gWrap = byId('graphWrap');
      if (gWrap) new ResizeObserver(resizeGraph).observe(gWrap);
    }

    buildStatic();
    setupTabs();
    bindEvents();
    resizeStage();
    resizeGraph();
    G = geom();
    cam.s = 8;
    commit();
    setLanguage(S.lang);

    last = typeof performance !== 'undefined' ? performance.now() : 0;
    requestAnimationFrame(frame);

    window.SIM = {
      S,
      kOf,
      xlOf,
      FlOf,
      nExt: (n, F, ideal) => nExt(S.sp, n, F, ideal),
      nForce: (n, x, ideal) => nForce(S.sp, n, x, ideal),
      dist: (n, F, out, ideal) => dist(S.sp, n, F, out, ideal),
      kIdeal: n => kIdeal(S.sp, n),
      commit,
      addMass,
      setTopo,
      startMission,
      MIS,
      totalMass,
      settled,
      setMode,
      weight,
      setLanguage
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
