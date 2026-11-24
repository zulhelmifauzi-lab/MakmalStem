
const I18N = {

  ms: {

    back: 'Semua Simulasi', langAria: 'Tukar bahasa',

    badge: 'Matematik T4 · Bab 1', title: 'Fungsi Kuadratik',

    intro: 'Ubah nilai a, b dan c (atau terus ubah verteks) dan lihat bagaimana parabola berubah. Perhatikan verteks, paksi simetri, punca dan diskriminan secara langsung.',

    graphH: 'Satah Cartes interaktif', plotAria: 'Graf fungsi kuadratik. Guna anak panah untuk menggerakkan verteks.',

    show: 'Papar', s_axis: 'Paksi simetri', s_vertex: 'Verteks', s_roots: 'Punca', s_yint: 'Pintasan-y',

    controls: 'Panel kawalan', reset: 'Set semula',

    tabControls: 'Kawalan', tabTable: 'Jadual', coordinateCaption: '10 pasangan koordinat',

    decrease_a: 'Kurangkan a', increase_a: 'Tambah a',

    decrease_b: 'Kurangkan b', increase_b: 'Tambah b',

    decrease_c: 'Kurangkan c', increase_c: 'Tambah c',

    triesH: 'Nota pembelajaran', videoTitle: 'Video pembelajaran', videoEmpty: 'Belum ada video pembelajaran.',

    videoPrevious: 'Video sebelumnya', videoNext: 'Video seterusnya',

    tries: [

      'Ubah a daripada positif kepada negatif. Apakah yang berlaku kepada bentuk graf? Bilakah ada titik minimum atau maksimum?',

      'Dengan a = 1 dan b = −2, naikkan c daripada −3 hingga 2. Bagaimanakah bilangan punca berubah?',

      'Tetapkan a = 1, b = −2 dan c = 1. Di manakah verteks berbanding paksi-x?',

      'Dengan a dan b tetap, ubah c. Bandingkan kedudukan verteks dan paksi simetri.',

      'Seret verteks pada graf. Perhatikan b dan c berubah tetapi a kekal. Mengapa?'

    ],

    featH: 'Bacaan langsung', f_equation: 'Persamaan', f_vertex: 'Titik Max/Min', f_axis: 'Paksi simetri', f_yint: 'Pintasan-y',

    f_roots: 'Punca (pintasan-x)', noRoots: 'tiada punca nyata',

    notePos: 'a > 0: graf berbentuk U dan mempunyai titik minimum.', noteNeg: 'a < 0: graf berbentuk ∩ dan mempunyai titik maksimum.',

    noteD2: 'D > 0: graf memotong paksi-x pada dua titik, iaitu dua punca nyata yang berbeza.',

    noteD1: 'D = 0: graf menyentuh paksi-x pada satu titik sahaja, iaitu satu punca (verteks di atas paksi-x).',

    noteD0: 'D < 0: graf tidak memotong paksi-x, jadi tiada punca nyata.',

    offscreen: 'Verteks di luar paparan', footer: 'Koleksi Simulasi Makmal STEM', vtx: 'Verteks', min: 'Min', max: 'Maks'

  },

  en: {

    back: 'All Simulations', langAria: 'Switch language',

    badge: 'Mathematics F4 · Ch 1', title: 'Quadratic Functions',

    intro: 'Change a, b and c (or move the vertex directly) and watch the parabola change. See the vertex, axis of symmetry, roots and discriminant update live.',

    graphH: 'Interactive Cartesian plane', plotAria: 'Graph of a quadratic function. Use the arrow keys to move the vertex.',

    show: 'Show', s_axis: 'Axis of symmetry', s_vertex: 'Vertex', s_roots: 'Roots', s_yint: 'y-intercept',

    controls: 'Control panel', reset: 'Reset',

    tabControls: 'Controls', tabTable: 'Table', coordinateCaption: '10 coordinate pairs',

    decrease_a: 'Decrease a', increase_a: 'Increase a',

    decrease_b: 'Decrease b', increase_b: 'Increase b',

    decrease_c: 'Decrease c', increase_c: 'Increase c',

    triesH: 'Learning notes', videoTitle: 'Learning videos', videoEmpty: 'No learning videos yet.',

    videoPrevious: 'Previous video', videoNext: 'Next video',

    tries: [

      'Change a from positive to negative. What happens to the shape of the graph? When is there a minimum or maximum point?',

      'With a = 1 and b = −2, raise c from −3 to 2. How does the number of roots change?',

      'Set a = 1, b = −2 and c = 1. Where is the vertex relative to the x-axis?',

      'Keep a and b fixed, then change c. Compare the position of the vertex and the axis of symmetry.',

      'Drag the vertex on the graph. Notice that b and c change but a stays the same. Why?'

    ],

    featH: 'Live readings', f_equation: 'Equation', f_vertex: 'Max/Min Point', f_axis: 'Axis of symmetry', f_yint: 'y-intercept',

    f_roots: 'Roots (x-intercepts)', noRoots: 'no real roots',

    notePos: 'a > 0: the graph is U-shaped and has a minimum point.', noteNeg: 'a < 0: the graph is ∩-shaped and has a maximum point.',

    noteD2: 'D > 0: the graph crosses the x-axis at two points, so there are two distinct real roots.',

    noteD1: 'D = 0: the graph just touches the x-axis at one point, so there is one root (the vertex lies on the x-axis).',

    noteD0: 'D < 0: the graph does not cross the x-axis, so there are no real roots.',

    offscreen: 'Vertex is outside the view', footer: 'Makmal STEM Simulation Collection', vtx: 'Vertex', min: 'Min', max: 'Max'

  }

};

const DEFAULT_COEFFICIENTS = {a: 1, b: -2, c: -3};

const COORDINATE_X = Array.from({length: 10}, (_, i) => i - 5);

const LIM = {a: 5, bc: 20, hk: 10, view: 10};

const state = {...DEFAULT_COEFFICIENTS, show: {axis: true, vertex: true, roots: true, yint: true}, lang: 'ms', dragging: false, dirty: true};



const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const r9 = n => Math.round(n * 1e9) / 1e9;

const MINUS = '−';

/* ===== Matematik ===== */

const discriminant = (p = state) => r9(p.b * p.b - 4 * p.a * p.c);

const vertexOf = (p = state) => ({h: r9(-p.b / (2 * p.a)), k: r9(p.c - p.b * p.b / (4 * p.a))});

function rootsOf(p = state) {

  const D = discriminant(p);

  if (D < 0) return [];

  if (D === 0) return [r9(-p.b / (2 * p.a))];

  const s = Math.sqrt(D), x1 = (-p.b - s) / (2 * p.a), x2 = (-p.b + s) / (2 * p.a);

  return [r9(Math.min(x1, x2)), r9(Math.max(x1, x2))];

}

const yAt = (x, p = state) => p.a * x * x + p.b * x + p.c;

function n2(n) { let s = String(Math.round(n * 100) / 100); if (s === '-0') s = '0'; return s.replace('-', MINUS); }

function coef(v, first, suffix) {

  if (v === 0) return '';

  const abs = Math.abs(v), mag = abs === 1 && suffix ? '' : n2(abs), sign = v < 0 ? MINUS : '+';

  return first ? (v < 0 ? MINUS : '') + mag + suffix : ` ${sign} ${mag}${suffix}`;

}

function polyStr(p = state) {

  let s = coef(p.a, true, 'x²') + coef(p.b, !p.a, 'x') + coef(p.c, !p.a && !p.b, '');

  return 'y = ' + (s || '0');

}

const tr = k => I18N[state.lang][k];
