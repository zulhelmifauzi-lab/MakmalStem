const I18N = {
  ms: {
    back: 'Semua Simulasi', langAria: 'Tukar bahasa',
    badge: 'Matematik T4 · Bab 6', title: 'Ketaksamaan Linear',
    graphH: 'Satah Cartes interaktif',
    plotAria: 'Graf ketaksamaan linear dalam dua pemboleh ubah. Seret titik ujian P atau guna kekunci anak panah untuk menggerakkan P.',
    leg1: 'Ketaksamaan 1', leg2: 'Ketaksamaan 2', legR: 'Rantau sepunya (R)',
    controls: 'Panel kawalan', reset: 'Set semula',
    tabControls: 'Kawalan', tabTable: 'Jadual',
    coordinateCaption: '10 pasangan koordinat garis sempadan',
    modeGroup: 'Mod ketaksamaan', modeSingle: '1 Ketaksamaan', modeSystem: 'Sistem (2)',
    lineGroup: 'Pilih ketaksamaan', line1: 'Ketaksamaan 1', line2: 'Ketaksamaan 2',
    opGroup: 'Simbol ketaksamaan',
    decrease_m: 'Kurangkan m', increase_m: 'Tambah m',
    decrease_c: 'Kurangkan c', increase_c: 'Tambah c',
    show: 'Papar', s_shade: 'Rantau berlorek', s_point: 'Titik ujian P', s_intercepts: 'Pintasan', s_labels: 'Label rantau',
    featH: 'Bacaan langsung', f_ineq: 'Ketaksamaan', f_boundary: 'Garis sempadan', f_region: 'Rantau berlorek',
    f_point: 'Titik ujian P', f_intercepts: 'Pintasan', f_intersection: 'Titik persilangan',
    solid: 'Garis padu (termasuk)', dashed: 'Garis putus-putus (tidak termasuk)',
    solidShort: 'Padu', dashedShort: 'Putus-putus',
    above: 'Di atas garis', below: 'Di bawah garis',
    commonRegion: 'Rantau sepunya R', noCommonRegion: 'Tiada rantau sepunya',
    parallel: 'Selari (tiada persilangan)', coincident: 'Garis bertindih',
    noXInt: 'Tiada pintasan-x',
    satisfied: 'Memuaskan', notSatisfied: 'Tidak memuaskan',
    onBoundarySolid: 'Di atas garis padu (memuaskan)',
    onBoundaryDashed: 'Di atas garis putus-putus (tidak memuaskan)',
    triesH: 'Nota pembelajaran', videoTitle: 'Video pembelajaran', videoEmpty: 'Belum ada video pembelajaran.',
    videoPrevious: 'Video sebelumnya', videoNext: 'Video seterusnya',
    noteSolid: 'Simbol ≥ atau ≤ menggunakan garis padu kerana titik di atas garis sempadan turut memuaskan ketaksamaan.',
    noteDashed: 'Simbol > atau < menggunakan garis putus-putus kerana titik di atas garis sempadan tidak memuaskan ketaksamaan.',
    noteAbove: 'Rantau di atas garis dilorekkan.', noteBelow: 'Rantau di bawah garis dilorekkan.',
    noteSystem: 'Mod sistem aktif: rantau sepunya R mengandungi semua titik (x, y) yang memuaskan kedua-dua ketaksamaan serentak.',
    noteSystemEmpty: 'Mod sistem aktif, tetapi tiada rantau sepunya dalam paparan ini kerana kedua-dua rantau tidak bertindih.',
    tries: [
      'Tukar simbol antara ≥ dengan >. Perhatikan perubahan pada garis sempadan daripada garis padu kepada garis putus-putus.',
      'Seret titik ujian P tepat ke atas garis sempadan. Bandingkan status P apabila simbol ialah ≥ berbanding >.',
      'Tetapkan m = 1, c = 1 dan simbol ≤. Uji titik asalan (0, 0) untuk mengesahkan rantau berlorek berada di bawah garis.',
      'Aktifkan mod Sistem (2). Perhatikan rantau sepunya R dan seret titik P masuk serta keluar daripada R.',
      'Dalam mod Sistem (2), cuba jadikan kedua-dua garis selari (nilai m sama) dengan simbol bertentangan. Bilakah tiada rantau sepunya?'
    ]
  },
  en: {
    back: 'All Simulations', langAria: 'Switch language',
    badge: 'Mathematics F4 · Ch 6', title: 'Linear Inequalities',
    graphH: 'Interactive Cartesian plane',
    plotAria: 'Graph of linear inequalities in two variables. Drag test point P or use the arrow keys to move P.',
    leg1: 'Inequality 1', leg2: 'Inequality 2', legR: 'Common region (R)',
    controls: 'Control panel', reset: 'Reset',
    tabControls: 'Controls', tabTable: 'Table',
    coordinateCaption: '10 boundary-line coordinate pairs',
    modeGroup: 'Inequality mode', modeSingle: '1 Inequality', modeSystem: 'System (2)',
    lineGroup: 'Select inequality', line1: 'Inequality 1', line2: 'Inequality 2',
    opGroup: 'Inequality symbol',
    decrease_m: 'Decrease m', increase_m: 'Increase m',
    decrease_c: 'Decrease c', increase_c: 'Increase c',
    show: 'Show', s_shade: 'Shaded region', s_point: 'Test point P', s_intercepts: 'Intercepts', s_labels: 'Region label',
    featH: 'Live readings', f_ineq: 'Inequality', f_boundary: 'Boundary line', f_region: 'Shaded region',
    f_point: 'Test point P', f_intercepts: 'Intercepts', f_intersection: 'Intersection point',
    solid: 'Solid line (included)', dashed: 'Dashed line (excluded)',
    solidShort: 'Solid', dashedShort: 'Dashed',
    above: 'Above the line', below: 'Below the line',
    commonRegion: 'Common region R', noCommonRegion: 'No common region',
    parallel: 'Parallel (no intersection)', coincident: 'Coincident lines',
    noXInt: 'No x-intercept',
    satisfied: 'Satisfies', notSatisfied: 'Does not satisfy',
    onBoundarySolid: 'On solid line (satisfies)',
    onBoundaryDashed: 'On dashed line (excluded)',
    triesH: 'Learning notes', videoTitle: 'Learning videos', videoEmpty: 'No learning videos yet.',
    videoPrevious: 'Previous video', videoNext: 'Next video',
    noteSolid: 'Symbols ≥ or ≤ use a solid line because points on the boundary line also satisfy the inequality.',
    noteDashed: 'Symbols > or < use a dashed line because points on the boundary line do not satisfy the inequality.',
    noteAbove: 'The region above the line is shaded.', noteBelow: 'The region below the line is shaded.',
    noteSystem: 'System mode is active: the common region R contains all points (x, y) that satisfy both inequalities simultaneously.',
    noteSystemEmpty: 'System mode is active, but there is no common region in this view because the two shaded regions do not overlap.',
    tries: [
      'Switch the symbol between ≥ and >. Observe how the boundary line changes from solid to dashed.',
      'Drag test point P directly onto the boundary line. Compare the status of P when the symbol is ≥ versus >.',
      'Set m = 1, c = 1 and symbol ≤. Test the origin (0, 0) to verify that the shaded region lies below the line.',
      'Switch to System (2) mode. Observe the common region R and drag point P into and out of R.',
      'In System (2) mode, make both lines parallel (same m) with opposite symbols. When is there no common region?'
    ]
  }
};

const DEFAULT_LINES = [
  {m: 1, c: 1, op: '>='},
  {m: -1, c: 3, op: '<='}
];
const DEFAULT_POINT = {x: 0, y: 2};
const COORDINATE_X = Array.from({length: 10}, (_, i) => i - 4);
const LIM = {m: 4, c: 8, view: 10};
const EPS = 1e-9;
const MINUS = '−';
const OP_SYM = {'>': '>', '>=': '≥', '<': '<', '<=': '≤'};

const state = {
  mode: 'single',
  active: 0,
  lines: DEFAULT_LINES.map(l => ({...l})),
  point: {...DEFAULT_POINT},
  show: {shade: true, point: true, intercepts: true, labels: true},
  lang: 'ms',
  dragging: false,
  dirty: true
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r9 = n => Math.round(n * 1e9) / 1e9;
const tr = k => I18N[state.lang][k];

/* ===== Matematik ===== */
const activeLine = () => state.lines[state.active];
const activeLines = () => state.mode === 'system' ? state.lines : [state.lines[0]];
const isSolid = op => op === '>=' || op === '<=';
const isAbove = op => op === '>' || op === '>=';
const yAt = (x, line = activeLine()) => r9(line.m * x + line.c);

function xIntercept(line = activeLine()) {
  if (Math.abs(line.m) < EPS) return null;
  return r9(-line.c / line.m);
}

function satisfies(x, y, line = activeLine()) {
  const diff = y - (line.m * x + line.c);
  if (line.op === '>') return diff > EPS;
  if (line.op === '>=') return diff >= -EPS;
  if (line.op === '<') return diff < -EPS;
  return diff <= EPS;
}

function onBoundary(x, y, line = activeLine()) {
  return Math.abs(y - (line.m * x + line.c)) <= EPS;
}

function satisfiesAll(x = state.point.x, y = state.point.y) {
  return activeLines().every(line => satisfies(x, y, line));
}

function intersectionOf(l1 = state.lines[0], l2 = state.lines[1]) {
  const dm = l1.m - l2.m;
  if (Math.abs(dm) < EPS) {
    return Math.abs(l1.c - l2.c) < EPS ? 'coincident' : null;
  }
  const x = r9((l2.c - l1.c) / dm);
  const y = r9(l1.m * x + l1.c);
  return {x, y};
}

function signedDist(x, y, line) {
  const diff = y - (line.m * x + line.c);
  return isAbove(line.op) ? diff : -diff;
}

function clipPolygon(poly, line) {
  if (!poly.length) return [];
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const da = signedDist(a.x, a.y, line);
    const db = signedDist(b.x, b.y, line);
    const aIn = da >= -EPS, bIn = db >= -EPS;
    if (aIn && bIn) {
      out.push(b);
    } else if (aIn && !bIn) {
      const t = da / (da - db);
      out.push({x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y)});
    } else if (!aIn && bIn) {
      const t = da / (da - db);
      out.push({x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y)});
      out.push(b);
    }
  }
  return out;
}

function polygonArea(poly) {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}

function polygonCentroid(poly) {
  let sx = 0, sy = 0;
  for (const p of poly) { sx += p.x; sy += p.y; }
  return {x: sx / poly.length, y: sy / poly.length};
}

function regionPolygon(lines = activeLines(), V = LIM.view) {
  let poly = [{x: -V, y: -V}, {x: V, y: -V}, {x: V, y: V}, {x: -V, y: V}];
  for (const line of lines) poly = clipPolygon(poly, line);
  return poly;
}

function n2(n) {
  let s = String(Math.round(n * 100) / 100);
  if (s === '-0') s = '0';
  return s.replace('-', MINUS);
}

function rhsStr(line = activeLine()) {
  const m = line.m, c = line.c;
  let s = '';
  if (Math.abs(m) >= EPS) {
    const absM = Math.abs(m);
    const mag = Math.abs(absM - 1) < EPS ? '' : n2(absM);
    s = (m < 0 ? MINUS : '') + mag + 'x';
  }
  if (Math.abs(c) >= EPS) {
    const absC = Math.abs(c);
    if (!s) s = (c < 0 ? MINUS : '') + n2(absC);
    else s += ` ${c < 0 ? MINUS : '+'} ${n2(absC)}`;
  }
  return s || '0';
}

function ineqStr(line = activeLine()) {
  return `y ${OP_SYM[line.op]} ${rhsStr(line)}`;
}
