'use strict';
let currentLang = 'ms';

function setLanguage(lang) {
  currentLang = lang;
  try { localStorage.setItem('stemlab-lang', lang); } catch {}
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });
  $('btn-lang').setAttribute('aria-label', lang === 'ms' ? 'Tukar bahasa' : 'Switch language');
  
  const modelNote = document.querySelector('[data-i18n="modelNote"]');
  if (modelNote) modelNote.textContent = lang === 'ms' ? 'Model pembelajaran berskala: semua daya dalam N dan jisim dalam kg. Dimensi objek dan panjang anak panah ialah ilustrasi.' : 'Scaled learning model: all forces are in N and masses in kg. Object dimensions and arrow lengths are illustrative.';
  // Update collinear direction buttons
  $('btn-f1-left').textContent = lang === 'ms' ? '← Kiri' : '← Left';
  $('btn-f1-right').textContent = lang === 'ms' ? 'Kanan →' : 'Right →';
  $('btn-f2-left').textContent = lang === 'ms' ? '← Kiri' : '← Left';
  $('btn-f2-right').textContent = lang === 'ms' ? 'Kanan →' : 'Right →';

  // Reload challenge text in the active language without resetting user inputs
  loadChallenge(state.challengeIdx, false);
  updatePlaybackUI();
  updateUI();
}

// DOM Elements
const $ = id => document.getElementById(id);
const canvas = $('sim-canvas');
const ctx = canvas.getContext('2d');
const graphCanvas = $('graph-canvas');
const gctx = graphCanvas.getContext('2d');

/* ==========================================================================
   3. HIGH-DPI CANVAS RESIZING
   ========================================================================== */
let canvasW = 800, canvasH = 480;
let graphW = 800, graphH = 160;

function resizeCanvases() {
  const dpr = window.devicePixelRatio || 1;
  
  const r1 = canvas.getBoundingClientRect();
  canvas.width = Math.round(r1.width * dpr);
  canvas.height = Math.round(r1.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvasW = r1.width;
  canvasH = r1.height;

  const r2 = graphCanvas.getBoundingClientRect();
  graphCanvas.width = Math.round(r2.width * dpr);
  graphCanvas.height = Math.round(r2.height * dpr);
  gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  graphW = r2.width;
  graphH = r2.height;
}
window.addEventListener('resize', resizeCanvases);

/* ==========================================================================
   5. SIMULATION STEP INTEGRATOR (WITH ZERO-CROSSING DECELERATION)
   ========================================================================== */
function resetMotion() {
  state.running = false;
  state.time = 0;
  state.x = 0;
  state.y = 0;
  state.vx = state.u;
  state.vy = 0;
  const f = computeForces();
  state.ax = f.ax;
  state.ay = f.ay;
  state.history = [{ t: 0, s: 0, v: state.u, a: f.ax }];
  lastStamp = null;
  $('chal-feedback').classList.add('hidden');
  updatePlaybackUI();
  updateUI();
}

// Update forces without resetting time, position, velocity or playback.
function refreshLiveParameters() {
  const f = computeForces();
  state.ax = f.ax;
  state.ay = f.ay;
  const point = { t: state.time, s: state.x, v: state.vx, a: f.ax };
  const previous = state.history[state.history.length - 1];
  if (previous && Math.abs(previous.t - state.time) < 1e-8) {
    state.history[state.history.length - 1] = point;
  } else {
    state.history.push(point);
  }
  $('chal-feedback').classList.add('hidden');
  updateUI();
}

/* ==========================================================================
   6. CANVAS RENDERING ENGINE (BEAUTIFUL VISUAL SCENARIOS)
   ========================================================================== */
function drawArrow(c, x1, y1, x2, y2, color, headSize = 10, lineWidth = 3) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  c.save();
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = lineWidth;
  c.lineCap = 'round';

  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();

  c.beginPath();
  c.moveTo(x2, y2);
  c.lineTo(x2 - headSize * Math.cos(angle - Math.PI / 6), y2 - headSize * Math.sin(angle - Math.PI / 6));
  c.lineTo(x2 - headSize * Math.cos(angle + Math.PI / 6), y2 - headSize * Math.sin(angle + Math.PI / 6));
  c.closePath();
  c.fill();
  c.restore();
}

function drawDashedLine(c, x1, y1, x2, y2, color, dash = [5, 4], width = 1.5) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.restore();
}

function drawBadge(c, text, x, y, bgColor = '#ffffff', textColor = '#1e293b') {
  c.save();
  c.font = '600 11px Inter, sans-serif';
  const metrics = c.measureText(text);
  const w = metrics.width + 12;
  const h = 20;

  c.shadowColor = 'rgba(0,0,0,0.2)';
  c.shadowBlur = 4;
  c.shadowOffsetY = 2;

  c.fillStyle = bgColor;
  c.beginPath();
  c.roundRect(x - w / 2, y - h / 2, w, h, 6);
  c.fill();

  c.shadowColor = 'transparent';
  c.fillStyle = textColor;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, x, y + 0.5);
  c.restore();
}

// ------------------- SCENARIO 1: KAPAL TUNDA -------------------
function drawScenarioTugboat(f) {
  // Background: Deep ocean water with gentle waves
  const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
  grad.addColorStop(0, '#0c2340');
  grad.addColorStop(1, '#081728');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Harbor grid lines & dock approach lane
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
  ctx.lineWidth = 1;
  for (let y = 40; y < canvasH; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasW, y);
    ctx.stroke();
  }

  // Approach channel buoy markers
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(canvasW - 40, canvasH * 0.25, 5, 0, Math.PI * 2);
  ctx.arc(canvasW - 40, canvasH * 0.75, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(canvasW - 40, canvasH * 0.5, 6, 0, Math.PI * 2);
  ctx.fill();

  // Harbor Dock pier at the right side
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(canvasW - 24, 0, 24, canvasH);
  ctx.fillStyle = '#f59e0b';
  for (let y = 10; y < canvasH; y += 30) {
    ctx.fillRect(canvasW - 20, y, 6, 15);
  }
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 10px Inter';
  ctx.save();
  ctx.translate(canvasW - 8, canvasH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(currentLang === 'ms' ? 'DERMAGA PELABUHAN KLANG' : 'PORT KLANG HARBOR DOCK', 0, 0);
  ctx.restore();

  // Ship Position: anchored at center-left with camera motion.
  // Notice: canvas Y is inverted, so physics +y (upwards) moves upwards (-y) on canvas!
  const shipX = Math.min(canvasW - 140, 200 + (state.x * 12) % (canvasW - 300));
  const shipY = canvasH / 2 - (state.y * 12);

  // Water Wake behind ship
  if (Math.abs(state.vx) > 0.05 || Math.abs(state.vy) > 0.05) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shipX - 90, shipY);
    ctx.lineTo(shipX - 180, shipY - 35);
    ctx.moveTo(shipX - 90, shipY);
    ctx.lineTo(shipX - 180, shipY + 35);
    ctx.stroke();
    ctx.restore();
  }

  // Container Cargo Ship Body (Grand top-down view)
  ctx.save();
  ctx.translate(shipX, shipY);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(-88, -26, 176, 56, 14);
  ctx.fill();

  // Ship Hull
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-85, -24);
  ctx.lineTo(55, -24);
  ctx.quadraticCurveTo(88, 0, 55, 24);
  ctx.lineTo(-85, 24);
  ctx.quadraticCurveTo(-92, 0, -85, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Colored cargo containers
  const containerColors = ['#ef4444', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6'];
  for (let cx = -70; cx <= 30; cx += 22) {
    for (let cy = -18; cy <= 12; cy += 16) {
      ctx.fillStyle = containerColors[Math.abs(cx + cy * 3) % containerColors.length];
      ctx.fillRect(cx, cy, 18, 12);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, 18, 12);
    }
  }

  // Ship bridge tower
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(-80, -14, 16, 28);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-76, -11, 4, 22);

  // Ship label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(currentLang === 'ms' ? `KAPAL KARGO (${state.mass} kg)` : `CARGO SHIP (${state.mass} kg)`, -10, 3);

  ctx.restore();

  // Tugboat 1 & Tugboat 2 positions (ahead pulling by towrope)
  const ropeLen = 140;
  const rad = Math.PI / 180;
  const bowX = shipX + 70;
  const bowY = shipY;

  const tb1X = bowX + ropeLen * Math.cos(state.angle1 * rad);
  const tb1Y = bowY - ropeLen * Math.sin(state.angle1 * rad);

  const tb2X = bowX + ropeLen * Math.cos(state.angle2 * rad);
  const tb2Y = bowY + ropeLen * Math.sin(state.angle2 * rad);

  // Towropes (Towlines)
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(bowX, bowY);
  ctx.lineTo(tb1X, tb1Y);
  ctx.moveTo(bowX, bowY);
  ctx.lineTo(tb2X, tb2Y);
  ctx.stroke();
  ctx.restore();

  // Draw Tugboat 1 (Top)
  drawMiniTugboat(tb1X, tb1Y, -state.angle1 * rad, '#0891b2', currentLang === 'ms' ? 'BOT TUNDA 1' : 'TUGBOAT 1');

  // Draw Tugboat 2 (Bottom)
  drawMiniTugboat(tb2X, tb2Y, state.angle2 * rad, '#d97706', currentLang === 'ms' ? 'BOT TUNDA 2' : 'TUGBOAT 2');

  // Draw Vector Construction & Resultant Force from Ship Bow (bowX, bowY)
  renderVectorOverlays(bowX, bowY, f);
}

function drawMiniTugboat(x, y, angle, color, label) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Water ripple around tugboat
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Hull
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-18, -9);
  ctx.lineTo(12, -9);
  ctx.quadraticCurveTo(24, 0, 12, 9);
  ctx.lineTo(-18, 9);
  ctx.quadraticCurveTo(-22, 0, -18, -9);
  ctx.closePath();
  ctx.fill();

  // Cabin
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-6, -6, 12, 12);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, -4, 4, 8);

  // Label
  ctx.rotate(-angle);
  ctx.font = 'bold 9px Inter';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, -16);

  ctx.restore();
}

// ------------------- SCENARIO 2: TARIK TALI -------------------
function drawScenarioTugOfWar(f) {
  // Grass field
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Grass stripes
  ctx.fillStyle = '#166534';
  for (let x = 0; x < canvasW; x += 60) {
    ctx.fillRect(x, 0, 30, canvasH);
  }

  // Center field chalk line
  const centerX = canvasW / 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(centerX, 40);
  ctx.lineTo(centerX, canvasH - 40);
  ctx.stroke();

  // Center chalk circle
  ctx.beginPath();
  ctx.arc(centerX, canvasH / 2, 45, 0, Math.PI * 2);
  ctx.stroke();

  // Team Zones Labels
  ctx.font = '800 16px Plus Jakarta Sans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.textAlign = 'center';
  ctx.fillText(currentLang === 'ms' ? 'PASUKAN MERAH (KIRI)' : 'RED TEAM (LEFT)', centerX - 180, 50);
  ctx.fillText(currentLang === 'ms' ? 'PASUKAN BIRU (KANAN)' : 'BLUE TEAM (RIGHT)', centerX + 180, 50);

  // Rope displacement
  const ropeCenter = centerX + state.x * 25;
  const ropeY = canvasH / 2;

  // Heavy Tug-of-war Rope
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ropeCenter - 260, ropeY);
  ctx.lineTo(ropeCenter + 260, ropeY);
  ctx.stroke();

  // Red ribbon marker in middle of rope
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(ropeCenter - 6, ropeY - 18, 12, 36);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ropeCenter, ropeY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Draw Tug-of-War teams pulling
  drawTeamFigures(ropeCenter - 140, ropeY, -1, '#ef4444');
  drawTeamFigures(ropeCenter + 140, ropeY, 1, '#0284c7');

  // Vectors & Overlays from the central ribbon
  renderVectorOverlays(ropeCenter, ropeY, f);
}

function drawTeamFigures(startX, y, dir, teamColor) {
  // 3 cartoon athletes pulling rope
  for (let i = 0; i < 3; i++) {
    const x = startX + dir * (i * 42);
    ctx.save();
    ctx.translate(x, y);

    // Body leaning backwards
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(dir * -8, -28, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Torso leaning
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(dir * -8, -20);
    ctx.lineTo(dir * 8, 8);
    ctx.stroke();

    // Legs pulling on ground
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(dir * 8, 8);
    ctx.lineTo(dir * -12, 28); // back leg brace
    ctx.moveTo(dir * 8, 8);
    ctx.lineTo(dir * 18, 28); // front leg
    ctx.stroke();

    ctx.restore();
  }
}

// ------------------- SCENARIO 3: MAKMAL TROLI -------------------
function drawScenarioCart(f) {
  // Lab background: sleek physics classroom lab bench
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const benchY = canvasH * 0.65;

  // Wooden bench top
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, benchY, canvasW, canvasH - benchY);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, benchY, canvasW, 8);

  // Aluminum track
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(30, benchY - 6, canvasW - 60, 6);

  // Metric ruler marks along aluminum track
  ctx.fillStyle = '#64748b';
  ctx.font = '9px Inter';
  for (let px = 40; px < canvasW - 40; px += 40) {
    ctx.fillRect(px, benchY - 14, 1.5, 8);
    const m = ((px - 40) / 40) * 0.5;
    ctx.fillText(`${m.toFixed(1)}m`, px - 10, benchY - 18);
  }

  // Ticker Timer (Pemasa Detik 50 Hz) at the left
  ctx.fillStyle = '#334155';
  ctx.fillRect(20, benchY - 38, 34, 32);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(37, benchY - 26, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 8px Inter';
  ctx.fillText('50Hz', 26, benchY - 10);

  // Trolley cart position (world to screen with camera loop)
  const cartX = Math.max(80, Math.min(canvasW - 120, 240 + state.x * 35));
  const cartY = benchY - 16;

  // Paper Ticker Tape trailing from timer to cart with vibrating ink dots
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(54, benchY - 24, cartX - 94, 6);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(54, benchY - 24, cartX - 94, 6);

  // Dots on tape (spacing proportional to velocity!)
  ctx.fillStyle = '#0f172a';
  const dt = 1 / 50; // 50 Hz
  let currentTapeX = cartX - 98;
  let simV = Math.abs(state.vx);
  let stepPx = Math.max(3, simV * 35 * dt * 4);
  while (currentTapeX > 56) {
    ctx.beginPath();
    ctx.arc(currentTapeX, benchY - 21, 1.5, 0, Math.PI * 2);
    ctx.fill();
    currentTapeX -= stepPx;
  }

  // Physics Dynamics Trolley
  ctx.save();
  ctx.translate(cartX, cartY);

  // Trolley Body
  ctx.fillStyle = '#0284c7';
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-42, -26, 84, 26, 6);
  ctx.fill();
  ctx.stroke();

  // Slotted weights on top
  ctx.fillStyle = '#cbd5e1';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.fillRect(-24, -36, 48, 10);
  ctx.strokeRect(-24, -36, 48, 10);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 9px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(`${state.mass} kg`, 0, -28);

  // Front bumper spring
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(42, -13);
  ctx.lineTo(48, -13);
  ctx.stroke();

  // Rotating ball-bearing wheels
  ctx.fillStyle = '#1e293b';
  for (const wx of [-26, 26]) {
    ctx.beginPath();
    ctx.arc(wx, 3, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();

  // Vectors & Overlays from Trolley Center
  renderVectorOverlays(cartX, cartY - 13, f);
}

// ------------------- SCENARIO 4: MOD VEKTOR BEBAS 360° -------------------
function drawScenarioFree(f) {
  // Dark high-tech radar / Cartesian grid
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const cx = canvasW / 2;
  const cy = canvasH / 2;

  // Concentric range circles
  ctx.strokeStyle = 'rgba(79, 70, 229, 0.15)';
  ctx.lineWidth = 1;
  for (let r = 50; r <= 220; r += 50) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Compass Rose tick marks (every 15 degrees)
  ctx.strokeStyle = 'rgba(79, 70, 229, 0.35)';
  ctx.fillStyle = '#818cf8';
  ctx.font = '9px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let deg = 0; deg < 360; deg += 30) {
    const rad = deg * Math.PI / 180;
    const x1 = cx + 220 * Math.cos(rad);
    const y1 = cy - 220 * Math.sin(rad);
    const x2 = cx + 230 * Math.cos(rad);
    const y2 = cy - 230 * Math.sin(rad);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const tx = cx + 242 * Math.cos(rad);
    const ty = cy - 242 * Math.sin(rad);
    ctx.fillText(`${deg}°`, tx, ty);
  }

  // Cartesian Axes X and Y
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, cy);
  ctx.lineTo(canvasW - 40, cy);
  ctx.moveTo(cx, 30);
  ctx.lineTo(cx, canvasH - 30);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Inter';
  ctx.fillText('+X (0°)', canvasW - 25, cy + 3);
  ctx.fillText('+Y (90°)', cx, 20);
  ctx.fillText('-X (180°)', 20, cy + 3);
  ctx.fillText('-Y (270°)', cx, canvasH - 18);

  // Drone Quadcopter Object at center
  const droneX = cx + (state.x * 12);
  const droneY = cy - (state.y * 12);

  ctx.save();
  ctx.translate(droneX, droneY);

  // Glowing drone body
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c7d2fe';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Rotors arms
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-22, -22); ctx.lineTo(22, 22);
  ctx.moveTo(-22, 22); ctx.lineTo(22, -22);
  ctx.stroke();

  // Spinning rotor blades
  ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
  for (const [rx, ry] of [[-22, -22], [22, -22], [-22, 22], [22, 22]]) {
    ctx.beginPath();
    ctx.arc(rx, ry, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Vectors & Overlays from Drone Center
  renderVectorOverlays(droneX, droneY, f);
}

// ------------------- VECTOR OVERLAYS RENDERING -------------------
function renderVectorOverlays(originX, originY, f) {
  // Scale factor: pixels per Newton
  const scale = state.scenario === 'free' ? 1.6 : 1.4;

  // Coordinate mapping: canvas Y is inverted (up is -Y)
  const p1 = { x: originX + f.f1x * scale, y: originY - f.f1y * scale };
  const p2 = { x: originX + f.f2x * scale, y: originY - f.f2y * scale };
  const pNet = { x: originX + f.netFx * scale, y: originY - f.netFy * scale };

  // 1. Component Resolution Overlays (Orthogonal projections)
  if (state.showComponents && (state.scenario === 'tugboat' || state.scenario === 'free')) {
    // F1 components
    drawDashedLine(ctx, p1.x, p1.y, p1.x, originY, '#0891b2', [3, 3], 1.2);
    drawDashedLine(ctx, p1.x, originY, originX, originY, '#0891b2', [3, 3], 1.2);

    // F2 components
    drawDashedLine(ctx, p2.x, p2.y, p2.x, originY, '#d97706', [3, 3], 1.2);
    drawDashedLine(ctx, p2.x, originY, originX, originY, '#d97706', [3, 3], 1.2);

    // Resultant components
    drawDashedLine(ctx, pNet.x, pNet.y, pNet.x, originY, '#ea580c', [4, 4], 1.5);
    drawDashedLine(ctx, pNet.x, pNet.y, originX, pNet.y, '#ea580c', [4, 4], 1.5);
  }

  // 2. Parallelogram of Forces Overlay
  if (state.showParallelogram && (state.scenario === 'tugboat' || state.scenario === 'free')) {
    // Dashed lines from tip of F1 to tip of ΣF and from tip of F2 to tip of ΣF
    drawDashedLine(ctx, p1.x, p1.y, pNet.x, pNet.y, '#38bdf8', [5, 4], 2);
    drawDashedLine(ctx, p2.x, p2.y, pNet.x, pNet.y, '#fbbf24', [5, 4], 2);
  }

  // 3. Triangle of Forces Overlay (Head-to-tail)
  if (state.showTriangle && (state.scenario === 'tugboat' || state.scenario === 'free')) {
    // F2 placed with tail at tip of F1, leading directly to tip of ΣF
    drawArrow(ctx, p1.x, p1.y, pNet.x, pNet.y, '#fbbf24', 9, 2.5);
  }

  // 4. Force Vectors (F1 & F2)
  if (state.f1 > 0) {
    drawArrow(ctx, originX, originY, p1.x, p1.y, '#0891b2', 11, 3.5);
    if (state.showValues) {
      const midX = (originX + p1.x) / 2;
      const midY = (originY + p1.y) / 2 - 14;
      drawBadge(ctx, `F₁ = ${state.f1} N`, midX, midY, '#0891b2', '#ffffff');
    }
  }

  if (state.f2 > 0) {
    drawArrow(ctx, originX, originY, p2.x, p2.y, '#d97706', 11, 3.5);
    if (state.showValues) {
      const midX = (originX + p2.x) / 2;
      const midY = (originY + p2.y) / 2 + 14;
      drawBadge(ctx, `F₂ = ${state.f2} N`, midX, midY, '#d97706', '#ffffff');
    }
  }

  // 5. Resultant Force Vector (ΣF)
  if (f.magnitude > 0.05) {
    // Glowing outline for resultant force
    ctx.save();
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 14;
    drawArrow(ctx, originX, originY, pNet.x, pNet.y, '#ea580c', 13, 4.5);
    ctx.restore();

    if (state.showValues) {
      const midX = (originX + pNet.x) / 2 + 10;
      const midY = (originY + pNet.y) / 2 - 16;
      drawBadge(ctx, `ΣF = ${f.magnitude.toFixed(1)} N`, midX, midY, '#ea580c', '#ffffff');
    }
  } else {
    // Balanced forces badge
    drawBadge(ctx, currentLang === 'ms' ? 'ΣF = 0 N (SEIMBANG)' : 'ΣF = 0 N (BALANCED)', originX, originY - 26, '#10b981', '#ffffff');
  }

  // Origin anchor point dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(originX, originY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// Main Draw Dispatcher
function draw() {
  ctx.clearRect(0, 0, canvasW, canvasH);
  const f = computeForces();

  if (state.scenario === 'tugboat') {
    drawScenarioTugboat(f);
  } else if (state.scenario === 'tugofwar') {
    drawScenarioTugOfWar(f);
  } else if (state.scenario === 'cart') {
    drawScenarioCart(f);
  } else if (state.scenario === 'free') {
    drawScenarioFree(f);
  }

  drawMotionGraph();
}

/* ==========================================================================
   7. REAL-TIME MOTION GRAPH (v-t and s-t)
   ========================================================================== */
function drawMotionGraph() {
  gctx.clearRect(0, 0, graphW, graphH);

  // Graph background
  gctx.fillStyle = '#ffffff';
  gctx.fillRect(0, 0, graphW, graphH);

  const left = 55;
  const right = graphW - 25;
  const top = 25;
  const bottom = graphH - 25;

  const isVt = state.graphMode === 'vt';
  const dataKey = isVt ? 'v' : 's';
  const unit = isVt ? 'm/s' : 'm';
  const title = (state.scenario === 'free' || state.scenario === 'tugboat') ? (isVt ? (currentLang === 'ms' ? 'Halaju x – Masa (vₓ–t)' : 'x Velocity – Time (vₓ–t)') : (currentLang === 'ms' ? 'Sesaran x – Masa (x–t)' : 'x Displacement – Time (x–t)')) : isVt ? (currentLang === 'ms' ? 'Graf Halaju - Masa (v - t)' : 'Velocity - Time Graph (v - t)') : (currentLang === 'ms' ? 'Graf Sesaran - Masa (s - t)' : 'Displacement - Time Graph (s - t)');

  // Include the current state between stored history samples.
  const points = [...state.history];
  const live = {t: state.time, s: state.x, v: state.vx};
  if (points.length && Math.abs(points[points.length - 1].t - state.time) < 1e-9) points[points.length - 1] = live;
  else points.push(live);
  const vals = points.map(h => h[dataKey]);
  let minVal = Math.min(0, ...vals);
  let maxVal = Math.max(isVt ? 4 : 10, ...vals);

  // Padding on Y
  const span = Math.max(1, maxVal - minVal);
  minVal -= span * 0.15;
  maxVal += span * 0.15;

  const maxT = Math.max(5, state.time);

  const mapX = t => left + (t / maxT) * (right - left);
  const mapY = v => bottom - ((v - minVal) / (maxVal - minVal)) * (bottom - top);

  // Grid lines
  gctx.strokeStyle = '#f1f5f9';
  gctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const v = minVal + (maxVal - minVal) * (i / 4);
    const y = mapY(v);
    gctx.beginPath();
    gctx.moveTo(left, y);
    gctx.lineTo(right, y);
    gctx.stroke();

    gctx.fillStyle = '#94a3b8';
    gctx.font = '9px Inter';
    gctx.textAlign = 'right';
    gctx.fillText(v.toFixed(1), left - 6, y + 3);
  }

  // Zero axis line
  if (minVal <= 0 && maxVal >= 0) {
    const zeroY = mapY(0);
    gctx.strokeStyle = '#cbd5e1';
    gctx.lineWidth = 1.5;
    gctx.beginPath();
    gctx.moveTo(left, zeroY);
    gctx.lineTo(right, zeroY);
    gctx.stroke();
  }

  // X Axis time labels
  gctx.fillStyle = '#64748b';
  gctx.font = '9px Inter';
  gctx.textAlign = 'center';
  gctx.fillText('0s', left, bottom + 16);
  gctx.fillText(`${(maxT / 2).toFixed(1)}s`, (left + right) / 2, bottom + 16);
  gctx.fillText(`${maxT.toFixed(1)}s`, right, bottom + 16);

  // Graph Title & Unit
  gctx.fillStyle = isVt ? '#0891b2' : '#4f46e5';
  gctx.font = 'bold 10px Inter';
  gctx.textAlign = 'left';
  gctx.fillText(`${title} [${unit}]`, left, top - 8);

  // Plot Path
  if (points.length > 0) {
    gctx.save();
    gctx.strokeStyle = isVt ? '#0891b2' : '#4f46e5';
    gctx.lineWidth = 2.5;
    gctx.beginPath();
    points.forEach((pt, i) => {
      const x = mapX(pt.t);
      const y = mapY(pt[dataKey]);
      if (i === 0) gctx.moveTo(x, y);
      else gctx.lineTo(x, y);
    });
    gctx.stroke();

    // Glowing live cursor at tip
    const last = points[points.length - 1];
    const cx = mapX(last.t);
    const cy = mapY(last[dataKey]);

    gctx.fillStyle = isVt ? '#06b6d4' : '#6366f1';
    gctx.beginPath();
    gctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    gctx.fill();
    gctx.strokeStyle = '#ffffff';
    gctx.lineWidth = 1.5;
    gctx.stroke();

    gctx.restore();
  }
}

/* ==========================================================================
   8. UI SYNC & LIVE STEP-BY-STEP CALCULATION ENGINE
   ========================================================================== */
function updateUI() {
  const f = computeForces();
  const is2D = state.scenario === 'free' || state.scenario === 'tugboat';
  const scenarioKeys = {tugboat:'scenTug', tugofwar:'scenTow', cart:'scenCart', free:'scenFree'};
  const scenarioKey = scenarioKeys[state.scenario];
  $('scenario-banner-title').textContent = i18n[currentLang][scenarioKey + 'Title'];
  $('scenario-banner-state').textContent = i18n[currentLang][scenarioKey + 'Sub'];
  document.title = (currentLang === 'ms' ? 'Daya Paduan' : 'Resultant Force') + ' (BETA) — Makmal STEM';
  ['f1','f2','angle1','angle2','mass','u','friction'].forEach((name, i) => {
    const keys=['paramF1','paramF2','paramAngle1','paramAngle2','paramMass','paramInitialU','paramFriction'];
    $('slider-' + name).setAttribute('aria-label', i18n[currentLang][keys[i]]);
  });
  ['slow','step','restart'].forEach((name,i) => $('btn-' + name).setAttribute('aria-label', currentLang === 'ms' ? ['Gerakan perlahan 0.4 kali','Maju 0.1 saat','Ulang gerakan'][i] : ['Slow motion 0.4 times','Advance 0.1 seconds','Restart motion'][i]));
  $('btn-slow').setAttribute('aria-pressed', String(state.slowMo));


  // Sliders & value badges
  $('slider-f1').value = state.f1;
  $('val-f1').textContent = `${state.f1} N`;
  $('legend-f1-val').textContent = `${state.f1} N`;

  $('slider-f2').value = state.f2;
  $('val-f2').textContent = `${state.f2} N`;
  $('legend-f2-val').textContent = `${state.f2} N`;

  $('slider-angle1').value = state.angle1;
  $('val-angle1').textContent = `${state.angle1}°`;

  $('slider-angle2').value = state.angle2;
  $('val-angle2').textContent = `${state.angle2}°`;

  $('slider-mass').value = state.mass;
  $('val-mass').textContent = `${state.mass} kg`;

  $('slider-u').value = state.u;
  $('val-u').textContent = `${state.u.toFixed(1)} m/s`;

  $('slider-friction').value = state.frictionMu;
  $('val-friction').textContent = state.frictionMu === 0 ? (currentLang === 'ms' ? '0.00 (Licin)' : '0.00 (Smooth)') : state.frictionMu.toFixed(2);

  ['f1', 'f2'].forEach(force => {
    ['left', 'right'].forEach(side => {
      const button = $('btn-' + force + '-' + side);
      const active = state[force === 'f1' ? 'dir1' : 'dir2'] === (side === 'right' ? 1 : -1);
      button.setAttribute('aria-pressed', String(active));
      button.className = 'flex-1 py-1 text-center font-bold ' + (active ? (force === 'f1' ? 'bg-primary text-white' : 'bg-amber-600 text-white') : 'bg-surface-container-low text-on-surface-variant');
    });
  });
  $('btn-graph-vt').setAttribute('aria-pressed', String(state.graphMode === 'vt'));
  $('btn-graph-st').setAttribute('aria-pressed', String(state.graphMode === 'st'));
  $('graph-note').textContent = currentLang === 'ms'
    ? (is2D ? 'Graf menunjukkan komponen x: kecerunan vₓ–t = aₓ; kecerunan x–t = vₓ.' : 'Kecerunan v–t = pecutan; kecerunan s–t = halaju.')
    : (is2D ? 'x components: slope of vₓ–t = aₓ; slope of x–t = vₓ.' : 'Slope of v–t = acceleration; slope of s–t = velocity.');
  // Mode pill
  const modePills = {
    tugboat: currentLang === 'ms' ? 'KAPAL TUNDA (2D)' : 'TUGBOATS (2D)',
    tugofwar: currentLang === 'ms' ? 'TARIK TALI (1D)' : 'TUG-OF-WAR (1D)',
    cart: currentLang === 'ms' ? 'MAKMAL TROLI (1D)' : 'CART LAB (1D)',
    free: currentLang === 'ms' ? 'VEKTOR BEBAS (360°)' : 'FREE VECTOR (360°)'
  };
  $('mode-badge-pill').textContent = modePills[state.scenario];

  // HUD Telemetry
  $('hud-time').textContent = `t = ${state.time.toFixed(2)} s`;
  $('hud-net-force').textContent = `${f.magnitude.toFixed(1)} N`;
  $('hud-accel').textContent = `${f.aMagnitude.toFixed(2)} m/s²`;
  const currentSpeed = Math.hypot(state.vx, state.vy);
  $('hud-velocity').textContent = `${currentSpeed.toFixed(2)} m/s`;
  $('hud-direction').textContent = f.magnitude < 1e-4 ? '—' : `${f.directionDeg.toFixed(1)}°`;

  // Camera readout
  $('camera-readout').textContent = `x = ${state.x.toFixed(2)} m · v = ${state.vx.toFixed(2)} m/s`;

  // Dynamic State Ribbon Message
  const isBalanced = f.magnitude < 1e-4;
  const dot = $('motion-indicator-dot');
  const ribbonText = $('ribbon-text');
  const ribbonSub = $('ribbon-sub');

  if (isBalanced) {
    dot.className = 'w-3 h-3 rounded-full bg-emerald-500';
    if (currentSpeed < 1e-3) {
      ribbonText.textContent = currentLang === 'ms' 
        ? 'ΣF = 0 N: Daya Seimbang. Objek kekal pegun (Hukum Newton Pertama).' 
        : 'ΣF = 0 N: Balanced Forces. Object remains at rest (Newton I Law).';
    } else {
      ribbonText.textContent = currentLang === 'ms'
        ? `ΣF = 0 N: Daya Seimbang. Objek meluncur pada halaju seragam v = ${currentSpeed.toFixed(1)} m/s!`
        : `ΣF = 0 N: Balanced Forces. Object glides at constant velocity v = ${currentSpeed.toFixed(1)} m/s!`;
    }
    ribbonSub.textContent = 'a = 0.00 m/s²';
  } else {
    dot.className = 'w-3 h-3 rounded-full bg-amber-500 animate-pulse';
    ribbonText.textContent = currentLang === 'ms'
      ? `ΣF = ${f.magnitude.toFixed(1)} N: Daya Tidak Seimbang. Memecut a = ${f.aMagnitude.toFixed(2)} m/s² pada arah ${f.directionDeg.toFixed(1)}°.`
      : `ΣF = ${f.magnitude.toFixed(1)} N: Unbalanced Forces. Accelerating at a = ${f.aMagnitude.toFixed(2)} m/s² towards ${f.directionDeg.toFixed(1)}°.`;
    ribbonSub.textContent = `a = ${f.aMagnitude.toFixed(2)} m/s²`;
  }

  // Step-by-Step Live Calculations
  if (state.scenario === 'tugboat') {
    $('calc-step1').innerHTML = `
      F₁x = ${state.f1} cos(${state.angle1}°) = ${f.f1x.toFixed(1)} N<br>
      F₁y = ${state.f1} sin(${state.angle1}°) = ${f.f1y.toFixed(1)} N<br>
      F₂x = ${state.f2} cos(${state.angle2}°) = ${f.f2x.toFixed(1)} N<br>
      F₂y = -${state.f2} sin(${state.angle2}°) = ${f.f2y.toFixed(1)} N
    `;
    $('calc-step2').innerHTML = `
      ΣFx = ${f.f1x.toFixed(1)} + ${f.f2x.toFixed(1)} = ${(f.f1x + f.f2x).toFixed(1)} N<br>
      ΣFy = ${f.f1y.toFixed(1)} + (${f.f2y.toFixed(1)}) = ${(f.f1y + f.f2y).toFixed(1)} N
    `;
    $('calc-step3').innerHTML = `
      |ΣF| = √[(${(f.f1x + f.f2x).toFixed(1)})² + (${(f.f1y + f.f2y).toFixed(1)})²]<br>
      |ΣF| = ${f.magnitude.toFixed(1)} N
    `;
    $('calc-step4').innerHTML = `
      a = |ΣF| / m = ${f.magnitude.toFixed(1)} / ${state.mass} = ${f.aMagnitude.toFixed(2)} m/s²<br>
      ${currentLang === 'ms' ? 'Arah' : 'Direction'} θ = atan2(${f.netFy.toFixed(1)}, ${f.netFx.toFixed(1)}) = ${f.directionDeg.toFixed(1)}°
    `;
  } else if (state.scenario === 'free') {
    $('calc-step1').innerHTML = `
      F₁x = ${state.f1} cos(${state.angle1}°) = ${f.f1x.toFixed(1)} N, &nbsp; F₁y = ${state.f1} sin(${state.angle1}°) = ${f.f1y.toFixed(1)} N<br>
      F₂x = ${state.f2} cos(${state.angle2}°) = ${f.f2x.toFixed(1)} N, &nbsp; F₂y = ${state.f2} sin(${state.angle2}°) = ${f.f2y.toFixed(1)} N
    `;
    $('calc-step2').innerHTML = `
      ΣFx = ${f.f1x.toFixed(1)} + (${f.f2x.toFixed(1)}) = ${f.netFx.toFixed(1)} N<br>
      ΣFy = ${f.f1y.toFixed(1)} + (${f.f2y.toFixed(1)}) = ${f.netFy.toFixed(1)} N
    `;
    $('calc-step3').innerHTML = `
      |ΣF| = √[(${f.netFx.toFixed(1)})² + (${f.netFy.toFixed(1)})²] = ${f.magnitude.toFixed(1)} N
    `;
    $('calc-step4').innerHTML = `
      a = ${f.magnitude.toFixed(1)} / ${state.mass} = ${f.aMagnitude.toFixed(2)} m/s²<br>
      θ = ${f.directionDeg.toFixed(1)}°
    `;
  } else {
    // Collinear 1D
    const f1DirStr = state.dir1 > 0 ? (currentLang === 'ms' ? 'Kanan (+)' : 'Right (+)') : (currentLang === 'ms' ? 'Kiri (-)' : 'Left (-)');
    const f2DirStr = state.dir2 > 0 ? (currentLang === 'ms' ? 'Kanan (+)' : 'Right (+)') : (currentLang === 'ms' ? 'Kiri (-)' : 'Left (-)');
    $('calc-step1').innerHTML = `
      F₁ = ${state.f1 * state.dir1} N (${f1DirStr})<br>
      F₂ = ${state.f2 * state.dir2} N (${f2DirStr})
    `;
    $('calc-step2').innerHTML = `
      ΣFx = (${state.f1 * state.dir1}) + (${state.f2 * state.dir2})${state.frictionMu > 0 ? ` + (${f.fFrictionX.toFixed(2)})` : ''} = ${f.netFx.toFixed(1)} N<br>
      ΣFy = 0.0 N (${currentLang === 'ms' ? 'Daya sebaris mendatar' : 'Horizontal collinear forces'})
    `;
    $('calc-step3').innerHTML = `
      |ΣF| = |ΣFx| = ${f.magnitude.toFixed(1)} N
    `;
    $('calc-step4').innerHTML = `
      a = |ΣF| / m = ${f.magnitude.toFixed(1)} / ${state.mass} = ${f.aMagnitude.toFixed(2)} m/s²<br>
      ${currentLang === 'ms' ? 'Arah' : 'Direction'}: ${f.netFx > 0 ? (currentLang === 'ms' ? 'Kanan →' : 'Right →') : f.netFx < 0 ? (currentLang === 'ms' ? 'Kiri ←' : 'Left ←') : (currentLang === 'ms' ? 'Pegun / Seragam' : 'Equilibrium')}
    `;
  }
}

function updatePlaybackUI() {
  const btnPlay = $('btn-play');
  const iconPlay = $('icon-play');
  const textPlay = $('text-play');

  if (state.running) {
    iconPlay.textContent = 'pause';
    textPlay.textContent = currentLang === 'ms' ? 'Jeda' : 'Pause';
  } else if (state.time >= 30) {
    iconPlay.textContent = 'replay';
    textPlay.textContent = currentLang === 'ms' ? 'Ulang' : 'Replay';
  } else {
    iconPlay.textContent = 'play_arrow';
    textPlay.textContent = currentLang === 'ms' ? 'Mula' : 'Play';
  }
}

/* ==========================================================================
   9. SCENARIO SWITCHER & CONTROLS BINDING
   ========================================================================== */
function setScenario(scen) {
  state.scenario = scen;

  // Update tabs styling
  document.querySelectorAll('.scenario-tab').forEach(tab => {
    if (tab.getAttribute('data-scenario') === scen) {
      tab.className = 'scenario-tab flex-1 min-w-[190px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all bg-primary text-white shadow-sm';
    } else {
      tab.className = 'scenario-tab flex-1 min-w-[190px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all';
    }
  });

  document.querySelectorAll('.scenario-tab').forEach(tab => tab.setAttribute('aria-pressed', String(tab.getAttribute('data-scenario') === scen)));
  // Update control visibility
  const isCollinear = scen === 'tugofwar' || scen === 'cart';
  $('group-angle1').classList.toggle('hidden', isCollinear);
  $('group-angle2').classList.toggle('hidden', isCollinear);
  $('group-collinear-dirs').classList.toggle('hidden', !isCollinear);
  $('group-friction').classList.toggle('hidden', scen !== 'cart');

  // Default presets per scenario
  if (scen === 'tugboat') {
    state.f1 = 50; state.angle1 = 30;
    state.f2 = 50; state.angle2 = 30;
    state.mass = 20;
    state.u = 0;
    state.frictionMu = 0;
    $('slider-angle1').max = 90;
    $('slider-angle2').max = 90;
    $('angle1-max-lbl').textContent = '90°';
    $('angle2-max-lbl').textContent = '90°';
    $('scenario-banner-title').textContent = currentLang === 'ms' ? 'Kapal Tunda Pelabuhan Klang' : 'Port Klang Harbor Tugboats';
    $('scenario-banner-state').textContent = currentLang === 'ms' ? 'Dua bot tunda menarik kapal kargo masuk ke dermaga' : 'Two tugboats guiding container ship into the dock';
  } else if (scen === 'tugofwar') {
    state.f1 = 60; state.dir1 = 1; // Team 1 pulling right
    state.f2 = 40; state.dir2 = -1;// Team 2 pulling left
    state.mass = 15;
    state.u = 0;
    state.frictionMu = 0;
    $('scenario-banner-title').textContent = currentLang === 'ms' ? 'Acara Tarik Tali Padang Sekolah' : 'School Field Tug-of-War';
    $('scenario-banner-state').textContent = currentLang === 'ms' ? 'Daya sebaris bertindak pada tali satu dimensi' : 'Collinear forces acting on one-dimensional rope';
  } else if (scen === 'cart') {
    state.f1 = 30; state.dir1 = 1;
    state.f2 = 10; state.dir2 = -1;
    state.mass = 5;
    state.u = 0;
    state.frictionMu = 0.05;
    $('scenario-banner-title').textContent = currentLang === 'ms' ? 'Makmal Troli & Satah Dinamik' : 'Dynamic Cart & Plane Lab';
    $('scenario-banner-state').textContent = currentLang === 'ms' ? 'Pita detik 50Hz merekodkan titik gerakan semasa memecut' : '50Hz ticker timer recording motion dots during acceleration';
  } else if (scen === 'free') {
    state.f1 = 45; state.angle1 = 40;
    state.f2 = 35; state.angle2 = 130;
    state.mass = 10;
    state.u = 0;
    state.frictionMu = 0;
    $('slider-angle1').max = 360;
    $('slider-angle2').max = 360;
    $('angle1-max-lbl').textContent = '360°';
    $('angle2-max-lbl').textContent = '360°';
    $('scenario-banner-title').textContent = currentLang === 'ms' ? 'Mod Vektor Bebas 360°' : '360° Free Vector Explorer';
    $('scenario-banner-state').textContent = currentLang === 'ms' ? 'Penerokaan vektor dua dimensi pada satah Cartes' : 'Two-dimensional vector exploration on Cartesian plane';
  }

  const maxAngle = scen === 'free' ? 360 : 90;
  ['1', '2'].forEach(i => {
    $('angle' + i + '-mid-lbl').textContent = (maxAngle / 2) + '°';
  });
  resetMotion();
}

/* ==========================================================================
   10. SPM PHYSICS CHALLENGES ENGINE (BILINGUAL & TARGET VALIDATION)
   ========================================================================== */
const challenges = [
  {
    badge: { ms: 'CABARAN 1', en: 'CHALLENGE 1' },
    title: { ms: 'Kemudi Kapal Tunda Pelabuhan (Straight Docking)', en: 'Steer Port Klang Tugboats (Straight Docking)' },
    desc: {
      ms: 'Laras sudut atau daya kedua-dua bot tunda supaya kapal kontena bergerak lurus tepat ke dermaga (ΣFy = 0 N) dan mencapai pecutan tepat ax = 1.20 m/s².',
      en: 'Adjust angles or forces of both tugboats so the container ship glides straight into the dock (ΣFy = 0 N) with an exact acceleration ax = 1.20 m/s².'
    },
    hint: {
      ms: 'Petunjuk: Pastikan F₁ sin(θ₁) = F₂ sin(θ₂) supaya daya sisi saling membatalkan!',
      en: 'Hint: Ensure F₁ sin(θ₁) = F₂ sin(θ₂) so lateral forces cancel out completely!'
    },
    setup: () => {
      setScenario('tugboat');
      state.f1 = 40; state.angle1 = 30;
      state.f2 = 30; state.angle2 = 45;
      state.mass = 20;
      state.u = 0;
      resetMotion();
    },
    validate: f => {
      if (state.scenario !== 'tugboat') {
        return {
          pass: false,
          msg: currentLang === 'ms' ? 'Tukar ke senario Kapal Tunda untuk cabaran ini.' : 'Switch to Tugboat scenario for this challenge.'
        };
      }
      const fyZero = Math.abs(f.netFy) < 0.1;
      const axTarget = Math.abs(f.ax - 1.20) < 0.08;
      if (fyZero && axTarget) {
        return {
          pass: true,
          msg: currentLang === 'ms'
            ? 'Tahniah! Kapal tunda seimbang di sisi (ΣFy = 0) dan kapal meluncur lurus tepat ke dermaga dengan pecutan 1.20 m/s².'
            : 'Congratulations! Tugboats are balanced laterally (ΣFy = 0) and the ship glides straight to the dock with ax = 1.20 m/s².'
        };
      } else if (!fyZero) {
        return {
          pass: false,
          msg: currentLang === 'ms'
            ? `Kapal masih terpesong ke sisi! ΣFy = ${f.netFy.toFixed(1)} N (Sasaran: 0.0 N). Laras F₁ sin(θ₁) = F₂ sin(θ₂).`
            : `Ship is still drifting laterally! ΣFy = ${f.netFy.toFixed(1)} N (Target: 0.0 N). Balance F₁ sin(θ₁) = F₂ sin(θ₂).`
        };
      } else {
        return {
          pass: false,
          msg: currentLang === 'ms'
            ? `Kapal bergerak lurus, tetapi pecutan ax sekarang ialah ${f.ax.toFixed(2)} m/s² (Sasaran: 1.20 m/s²).`
            : `Ship glides straight, but acceleration ax is now ${f.ax.toFixed(2)} m/s² (Target: 1.20 m/s²).`
        };
      }
    }
  },
  {
    badge: { ms: 'CABARAN 2', en: 'CHALLENGE 2' },
    title: { ms: 'Imbangan Sifar Tarik Tali (Equilibrium Net Force)', en: 'Zero Net Force Equilibrium (Tug-of-War)' },
    desc: {
      ms: 'Dalam senario Tarik Tali, Pasukan Merah mengenakan F₁ = 70 N ke kanan. Seimbangkan sistem supaya daya paduan ΣF = 0 N (a = 0 m/s²).',
      en: 'In Tug-of-War, Red Team exerts F₁ = 70 N to the right. Balance the system so resultant force ΣF = 0 N (a = 0 m/s²).'
    },
    hint: {
      ms: 'Petunjuk: Daya seimbang berlaku apabila Pasukan Biru mengenakan F₂ = 70 N bertentangan arah (ke kiri).',
      en: 'Hint: Equilibrium occurs when Blue Team exerts F₂ = 70 N in opposite direction (left).'
    },
    setup: () => {
      setScenario('tugofwar');
      state.f1 = 70; state.dir1 = 1;
      state.f2 = 40; state.dir2 = -1;
      state.mass = 15;
      state.u = 0;
      resetMotion();
    },
    validate: f => {
      if (state.scenario !== 'tugofwar' || state.f1 !== 70 || state.dir1 !== 1) {
        return {pass: false, msg: currentLang === 'ms' ? 'Gunakan senario Tarik Tali dan kekalkan F₁ = 70 N ke kanan. Laraskan F₂ untuk mengimbanginya.' : 'Use Tug-of-War and keep F₁ = 70 N to the right. Adjust F₂ to balance it.'};
      }
      if (Math.abs(f.magnitude) < 0.05) {
        return {
          pass: true,
          msg: currentLang === 'ms'
            ? 'Tepat sekali! ΣF = 0 N. Sistem berada dalam keseimbangan daya dan pecutan a = 0 m/s².'
            : 'Spot on! ΣF = 0 N. System is in dynamic/static equilibrium with acceleration a = 0 m/s².'
        };
      } else {
        return {
          pass: false,
          msg: currentLang === 'ms'
            ? `Belum seimbang. Daya paduan sekarang ialah |ΣF| = ${f.magnitude.toFixed(1)} N. Laraskan F₂ untuk membatalkan F₁.`
            : `Not balanced yet. Net force is currently |ΣF| = ${f.magnitude.toFixed(1)} N. Adjust F₂ to balance F₁.`
        };
      }
    }
  },
  {
    badge: { ms: 'CABARAN 3', en: 'CHALLENGE 3' },
    title: { ms: 'Ketepatan Brek Troli (Target Deceleration)', en: 'Precision Trolley Braking (Target Deceleration)' },
    desc: {
      ms: 'Troli bergerak dengan halaju awal u = +6.0 m/s. Kenakan daya brek bertentangan supaya pecutannya tepat a = -1.50 m/s² untuk mencapai halaju sifar selepas 4.0 s. Jika daya itu dikekalkan selepas berhenti, troli akan berbalik arah.',
      en: 'Trolley moves with initial velocity u = +6.0 m/s. Apply opposing braking force to achieve acceleration ax = -1.50 m/s² to reach zero velocity after 4.0 s. If this force remains after stopping, the trolley will reverse.'
    },
    hint: {
      ms: 'Petunjuk: Guna F = ma = m × (-1.50). Contohnya jika m = 20 kg, perlukan daya bersih brek ΣFx = -30 N (ke kiri)!',
      en: 'Hint: Use F = ma = m × (-1.50). For instance if m = 20 kg, net braking force must be ΣFx = -30 N (leftward)!'
    },
    setup: () => {
      setScenario('cart');
      state.mass = 20;
      state.u = 6.0;
      state.f1 = 0; state.dir1 = -1;
      state.f2 = 0; state.dir2 = -1;
      state.frictionMu = 0;
      resetMotion();
    },
    validate: f => {
      if (state.scenario !== 'cart' || Math.abs(state.u - 6) > 1e-9) {
        return {pass: false, msg: currentLang === 'ms' ? 'Gunakan senario Makmal Troli dengan halaju awal u = +6.0 m/s untuk cabaran ini.' : 'Use the Cart Lab with initial velocity u = +6.0 m/s for this challenge.'};
      }
      const targetA = -1.50;
      // Must decelerate to the left (opposing positive initial velocity)
      if (Math.abs(f.ax - targetA) < 0.1) {
        return {
          pass: true,
          msg: currentLang === 'ms'
            ? 'Cemerlang! Daya brek menghasilkan pecutan tepat ax = -1.50 m/s², memberikan halaju sifar pada 4.0 s jika daya dikekalkan. Selepas itu troli akan berbalik arah.'
            : 'Excellent! Braking force produces exact acceleration ax = -1.50 m/s², giving zero velocity at 4.0 s if the force is maintained. The trolley reverses after that.'
        };
      } else if (f.ax > 0) {
        return {
          pass: false,
          msg: currentLang === 'ms'
            ? `Daya anda memecutkan troli ke hadapan (ax = +${f.ax.toFixed(2)} m/s²)! Kenakan daya bertentangan ke kiri untuk membrek.`
            : `Your force is accelerating the trolley forward (ax = +${f.ax.toFixed(2)} m/s²)! Apply opposing leftward force to brake.`
        };
      } else {
        return {
          pass: false,
          msg: currentLang === 'ms'
            ? `Pecutan brek sekarang ialah ax = ${f.ax.toFixed(2)} m/s². Sasaran yang dikehendaki ialah -1.50 m/s². Semak F = m × a.`
            : `Current braking acceleration is ax = ${f.ax.toFixed(2)} m/s². Desired target is -1.50 m/s². Verify F = m × a.`
        };
      }
    }
  }
];

function loadChallenge(idx, applySetup = false) {
  state.challengeIdx = idx % challenges.length;
  const c = challenges[state.challengeIdx];
  $('chal-badge').textContent = c.badge[currentLang];
  $('chal-title').textContent = c.title[currentLang];
  $('chal-desc').textContent = c.desc[currentLang];
  $('chal-hint').textContent = c.hint[currentLang];
  $('chal-feedback').className = 'hidden';
  if (applySetup && typeof c.setup === 'function') {
    c.setup();
  }
}

/* ==========================================================================
   11. EVENT LISTENERS SETUP
   ========================================================================== */
function initListeners() {
  // Scenario tabs
  document.querySelectorAll('.scenario-tab').forEach(tab => {
    tab.addEventListener('click', () => setScenario(tab.getAttribute('data-scenario')));
  });

  // Quick presets
  document.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-quick');
      if (q === 'rest' || q === 'cruise') {
        setScenario('cart');
        state.frictionMu = 0;
      }
      if (q === 'rest') {
        state.f1 = 40; state.f2 = 40;
        state.angle1 = 30; state.angle2 = 30;
        state.dir1 = 1; state.dir2 = -1;
        state.u = 0;
        resetMotion();
      } else if (q === 'cruise') {
        state.f1 = 40; state.f2 = 40;
        state.angle1 = 30; state.angle2 = 30;
        state.dir1 = 1; state.dir2 = -1;
        state.u = 3.0; // moves at constant velocity!
        resetMotion();
      } else if (q === 'accelerate') {
        state.f1 = 70; state.f2 = 25;
        state.angle1 = 20; state.angle2 = 35;
        state.dir1 = 1; state.dir2 = -1;
        state.u = 0;
        resetMotion();
      }
    });
  });

  // Slider inputs
  $('slider-f1').addEventListener('input', e => { state.f1 = parseFloat(e.target.value); refreshLiveParameters(); });
  $('slider-f2').addEventListener('input', e => { state.f2 = parseFloat(e.target.value); refreshLiveParameters(); });
  $('slider-angle1').addEventListener('input', e => { state.angle1 = parseFloat(e.target.value); refreshLiveParameters(); });
  $('slider-angle2').addEventListener('input', e => { state.angle2 = parseFloat(e.target.value); refreshLiveParameters(); });
  $('slider-mass').addEventListener('input', e => { state.mass = parseFloat(e.target.value); refreshLiveParameters(); });
  $('slider-u').addEventListener('input', e => {
    state.u = parseFloat(e.target.value);
    // Initial velocity is a starting condition, not an instantaneous impulse.
    if (state.time === 0) state.vx = state.u;
    refreshLiveParameters();
  });
  $('slider-friction').addEventListener('input', e => { state.frictionMu = parseFloat(e.target.value); refreshLiveParameters(); });

  // Collinear Direction Toggles
  $('btn-f1-left').addEventListener('click', () => {
    state.dir1 = -1;
    $('btn-f1-left').className = 'flex-1 py-1 text-center font-bold bg-primary text-white';
    $('btn-f1-right').className = 'flex-1 py-1 text-center font-bold bg-surface-container-low text-on-surface-variant';
    refreshLiveParameters();
  });
  $('btn-f1-right').addEventListener('click', () => {
    state.dir1 = 1;
    $('btn-f1-right').className = 'flex-1 py-1 text-center font-bold bg-primary text-white';
    $('btn-f1-left').className = 'flex-1 py-1 text-center font-bold bg-surface-container-low text-on-surface-variant';
    refreshLiveParameters();
  });
  $('btn-f2-left').addEventListener('click', () => {
    state.dir2 = -1;
    $('btn-f2-left').className = 'flex-1 py-1 text-center font-bold bg-amber-600 text-white';
    $('btn-f2-right').className = 'flex-1 py-1 text-center font-bold bg-surface-container-low text-on-surface-variant';
    refreshLiveParameters();
  });
  $('btn-f2-right').addEventListener('click', () => {
    state.dir2 = 1;
    $('btn-f2-right').className = 'flex-1 py-1 text-center font-bold bg-amber-600 text-white';
    $('btn-f2-left').className = 'flex-1 py-1 text-center font-bold bg-surface-container-low text-on-surface-variant';
    refreshLiveParameters();
  });

  // Overlay checkboxes
  $('chk-parallelogram').addEventListener('change', e => { state.showParallelogram = e.target.checked; });
  $('chk-triangle').addEventListener('change', e => { state.showTriangle = e.target.checked; });
  $('chk-components').addEventListener('change', e => { state.showComponents = e.target.checked; });
  $('chk-values').addEventListener('change', e => { state.showValues = e.target.checked; });

  // Playback Buttons
  $('btn-play').addEventListener('click', () => {
    if (state.time >= 30) resetMotion();
    state.running = !state.running;
    updatePlaybackUI();
  });
  $('btn-slow').addEventListener('click', () => {
    state.slowMo = !state.slowMo;
    $('btn-slow').classList.toggle('bg-primary/20', state.slowMo);
    $('btn-slow').classList.toggle('text-primary', state.slowMo);
  });
  $('btn-step').addEventListener('click', () => {
    if (state.time >= 30) resetMotion();
    state.running = true;
    stepSimulation(0.1);
    state.running = false;
    updatePlaybackUI();
    updateUI();
  });
  $('btn-restart').addEventListener('click', resetMotion);
  $('btn-global-reset').addEventListener('click', () => {
    state.slowMo = false;
    state.showParallelogram = true;
    state.showTriangle = false;
    state.showComponents = true;
    state.showValues = true;
    state.graphMode = 'vt';
    $('chk-parallelogram').checked = true;
    $('chk-triangle').checked = false;
    $('chk-components').checked = true;
    $('chk-values').checked = true;
    $('btn-slow').classList.remove('bg-primary/20', 'text-primary');
    $('btn-graph-vt').click();
    loadChallenge(0, false);
    setScenario('tugboat');
  });

  // Graph mode buttons
  $('btn-graph-vt').addEventListener('click', () => {
    state.graphMode = 'vt';
    $('btn-graph-vt').className = 'px-3 py-1 rounded-lg bg-white text-primary shadow-xs transition-all font-bold';
    $('btn-graph-st').className = 'px-3 py-1 rounded-lg text-on-surface-variant hover:text-on-surface transition-all';
    updateUI();
  });
  $('btn-graph-st').addEventListener('click', () => {
    state.graphMode = 'st';
    $('btn-graph-st').className = 'px-3 py-1 rounded-lg bg-white text-primary shadow-xs transition-all font-bold';
    $('btn-graph-vt').className = 'px-3 py-1 rounded-lg text-on-surface-variant hover:text-on-surface transition-all';
    updateUI();
  });

  // Bilingual Button
  try {
    if (localStorage.getItem('stemlab-lang') === 'en') setLanguage('en');
  } catch {}
  $('btn-lang').addEventListener('click', () => {
    setLanguage(currentLang === 'ms' ? 'en' : 'ms');
  });

  // Challenges
  $('btn-next-chal').addEventListener('click', () => {
    loadChallenge(state.challengeIdx + 1, true);
  });
  $('btn-check-chal').addEventListener('click', () => {
    const c = challenges[state.challengeIdx];
    const res = c.validate(computeForces());
    const fb = $('chal-feedback');
    fb.classList.remove('hidden');
    if (res.pass) {
      fb.className = 'p-3 rounded-xl text-xs font-semibold leading-relaxed bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm';
      fb.innerHTML = `🌟 <strong>${currentLang === 'ms' ? 'PENCAPAIAN CEMERLANG!' : 'GREAT SUCCESS!'}</strong><br>${res.msg}`;
    } else {
      fb.className = 'p-3 rounded-xl text-xs font-medium leading-relaxed bg-amber-50 text-amber-900 border border-amber-300 shadow-sm';
      fb.innerHTML = `⚠️ <strong>${currentLang === 'ms' ? 'PERLU PENYESUAIAN:' : 'NEEDS ADJUSTMENT:'}</strong><br>${res.msg}`;
    }
  });
}

/* ==========================================================================
   12. ANIMATION LOOP (SMOOTH 60 FPS)
   ========================================================================== */
let lastStamp = null;
let uiElapsed = 0;

function loop(stamp) {
  if (!lastStamp) lastStamp = stamp;
  let delta = (stamp - lastStamp) / 1000;
  lastStamp = stamp;

  // Cap delta time to avoid large jumps on tab switch
  delta = Math.min(delta, 0.05);

  if (state.running) {
    const effectiveDt = state.slowMo ? delta * 0.4 : delta;
    stepSimulation(effectiveDt);
    uiElapsed += delta;
    if (uiElapsed >= 0.1 || !state.running) {
      updateUI();
      uiElapsed = 0;
    }
  }

  draw();
  requestAnimationFrame(loop);
}

// Initialize simulation on page load
window.addEventListener('DOMContentLoaded', () => {
  resizeCanvases();
  initListeners();
  loadChallenge(0, false);
  setScenario('tugboat');
  requestAnimationFrame(loop);
});
