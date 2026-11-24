const I18N = {
  ms: {
    back: 'Semua Simulasi', langAria: 'Tukar bahasa',
    badge: 'Matematik T4 · Bab 4', title: 'Operasi Set',
    vennH: 'Gambar rajah Venn interaktif',
    vennAria: 'Gambar rajah Venn. Klik nombor untuk menogol keahlian atau seret nombor terus ke dalam atau luar bulatan set.',
    legResult: 'Kawasan hasil',
    controls: 'Panel kawalan', reset: 'Set semula',
    tabControls: 'Kawalan', tabElements: 'Edit Unsur',
    presets: 'Contoh pantas', p_overlap: 'Bertindih', p_subset: 'Subset (A ⊂ B)', p_disjoint: 'Tiada persilangan', p_three: 'Tiga set',
    pd_overlap: 'A = faktor bagi 12, B = faktor bagi 18.', pd_subset: 'A = {2, 4, 6, 8}, B = semua nombor genap.',
    pd_disjoint: 'A = nombor genap, B = nombor ganjil.', pd_three: 'A = nombor genap, B = gandaan 3, C = faktor bagi 12.',
    show: 'Papar', s_shade: 'Lorekan rantau', s_tokens: 'Unsur 1–20', s_counts: 'Bilangan unsur', s_labels: 'Label set',
    featH: 'Bacaan langsung', r_op: 'Operasi dipilih', r_a: 'Set A', r_b: 'Set B', r_c: 'Set C', r_law: 'Hukum Bilangan Unsur',
    c_sets: 'Bilangan set', two: 'Dua set', three: 'Tiga set', c_ops: 'Operasi', c_active: 'Set yang diedit',
    c_elements: 'Unsur (ξ = {1, 2, …, 20})',
    c_hint: 'Klik nombor di sini atau seret nombor terus pada gambar rajah Venn untuk memindahkannya antara kawasan.',
    clear: 'Kosongkan set ini',
    relEq: 'A = B: kedua-dua set mempunyai unsur yang sama.', relAB: 'A ⊂ B: setiap unsur A ialah unsur B, jadi A ialah subset bagi B.',
    relBA: 'B ⊂ A: setiap unsur B ialah unsur A, jadi B ialah subset bagi A.', relDisj: 'A ∩ B = ∅: A dan B tiada unsur sepunya.',
    relOver: 'A dan B ada unsur sepunya, jadi A ∩ B ≠ ∅.', relEmpty: 'Satu set kosong. Set kosong ialah subset bagi setiap set.',
    emptySet: '{ } (set kosong)',
    triesH: 'Nota pembelajaran', videoTitle: 'Video pembelajaran', videoEmpty: 'Belum ada video pembelajaran.',
    videoPrevious: 'Video sebelumnya', videoNext: 'Video seterusnya',
    tries: [
      'Pilih “Bertindih” dan operasi A ∩ B. Senaraikan unsur yang berlorek. Apakah maksud persilangan?',
      'Pilih A ∪ B dan semak: n(A ∪ B) = n(A) + n(B) − n(A ∩ B). Mengapa kita perlu menolak n(A ∩ B)?',
      'Bandingkan A′ dan (A ∪ B)′. Apakah yang dimaksudkan dengan pelengkap sesuatu set?',
      'Pilih “Subset (A ⊂ B)”. Apakah yang berlaku kepada A ∩ B dan A ∪ B? Bandingkan dengan A dan B.',
      'Pilih “Tiga set” dan operasi A ∩ B ∩ C. Seret nombor pada gambar rajah Venn masuk atau keluar kawasan itu.'
    ]
  },
  en: {
    back: 'All Simulations', langAria: 'Switch language',
    badge: 'Mathematics F4 · Ch 4', title: 'Set Operations',
    vennH: 'Interactive Venn diagram',
    vennAria: 'Venn diagram. Click a number to toggle membership or drag it directly into or out of any set circle.',
    legResult: 'Result region',
    controls: 'Control panel', reset: 'Reset',
    tabControls: 'Controls', tabElements: 'Edit Elements',
    presets: 'Quick examples', p_overlap: 'Overlapping', p_subset: 'Subset (A ⊂ B)', p_disjoint: 'No intersection', p_three: 'Three sets',
    pd_overlap: 'A = factors of 12, B = factors of 18.', pd_subset: 'A = {2, 4, 6, 8}, B = all even numbers.',
    pd_disjoint: 'A = even numbers, B = odd numbers.', pd_three: 'A = even numbers, B = multiples of 3, C = factors of 12.',
    show: 'Show', s_shade: 'Shaded region', s_tokens: 'Elements 1–20', s_counts: 'Element counts', s_labels: 'Set labels',
    featH: 'Live readings', r_op: 'Selected operation', r_a: 'Set A', r_b: 'Set B', r_c: 'Set C', r_law: 'Inclusion–Exclusion Law',
    c_sets: 'Number of sets', two: 'Two sets', three: 'Three sets', c_ops: 'Operation', c_active: 'Set being edited',
    c_elements: 'Elements (ξ = {1, 2, …, 20})',
    c_hint: 'Click a number here or drag numbers directly on the Venn diagram to move them across regions.',
    clear: 'Clear this set',
    relEq: 'A = B: both sets have exactly the same elements.', relAB: 'A ⊂ B: every element of A is an element of B, so A is a subset of B.',
    relBA: 'B ⊂ A: every element of B is an element of A, so B is a subset of A.', relDisj: 'A ∩ B = ∅: A and B have no common elements.',
    relOver: 'A and B share some elements, so A ∩ B ≠ ∅.', relEmpty: 'One set is empty. The empty set is a subset of every set.',
    emptySet: '{ } (empty set)',
    triesH: 'Learning notes', videoTitle: 'Learning videos', videoEmpty: 'No learning videos yet.',
    videoPrevious: 'Previous video', videoNext: 'Next video',
    tries: [
      'Choose “Overlapping” and the operation A ∩ B. List the shaded elements. What does intersection mean?',
      'Choose A ∪ B and check: n(A ∪ B) = n(A) + n(B) − n(A ∩ B). Why do we have to subtract n(A ∩ B)?',
      'Compare A′ and (A ∪ B)′. What is meant by the complement of a set?',
      'Choose “Subset (A ⊂ B)”. What happens to A ∩ B and A ∪ B? Compare them with A and B.',
      'Choose “Three sets” and the operation A ∩ B ∩ C. Drag numbers on the Venn diagram into or out of that region.'
    ]
  }
};

const N = 20, NAMES = ['A', 'B', 'C'], COL = {A: '#4f46e5', B: '#0891b2', C: '#d97706'}, TR = 11;
const range = (from, to) => Array.from({length: to - from + 1}, (_, i) => from + i);
const OPS = {
  u:   {label: 'A ∪ B', sets: 2, test: m => m.a || m.b},
  i:   {label: 'A ∩ B', sets: 2, test: m => m.a && m.b},
  ac:  {label: 'A′', sets: 2, test: m => !m.a},
  bc:  {label: 'B′', sets: 2, test: m => !m.b},
  uc:  {label: '(A ∪ B)′', sets: 2, test: m => !(m.a || m.b)},
  ic:  {label: '(A ∩ B)′', sets: 2, test: m => !(m.a && m.b)},
  amb: {label: 'A ∩ B′', sets: 2, test: m => m.a && !m.b},
  bma: {label: 'A′ ∩ B', sets: 2, test: m => !m.a && m.b},
  u3:  {label: 'A ∪ B ∪ C', sets: 3, test: m => m.a || m.b || m.c},
  i3:  {label: 'A ∩ B ∩ C', sets: 3, test: m => m.a && m.b && m.c},
  uc3: {label: '(A ∪ B ∪ C)′', sets: 3, test: m => !(m.a || m.b || m.c)},
  aub: {label: '(A ∩ B) ∪ C', sets: 3, test: m => (m.a && m.b) || m.c},
  abc: {label: 'A ∩ (B ∪ C)', sets: 3, test: m => m.a && (m.b || m.c)},
  cc:  {label: 'C′', sets: 3, test: m => !m.c}
};
const PRESETS = {
  overlap:  {A: [1, 2, 3, 4, 6, 12], B: [1, 2, 3, 6, 9, 18], three: false},
  subset:   {A: [2, 4, 6, 8], B: range(1, N).filter(n => n % 2 === 0), three: false},
  disjoint: {A: range(1, N).filter(n => n % 2 === 0), B: range(1, N).filter(n => n % 2 === 1), three: false},
  three:    {A: range(1, N).filter(n => n % 2 === 0), B: range(1, N).filter(n => n % 3 === 0), C: [1, 2, 3, 4, 6, 12], three: true}
};
const emptyMem = () => ({A: Array(N).fill(false), B: Array(N).fill(false), C: Array(N).fill(false)});
const state = {
  mem: emptyMem(),
  three: false,
  active: 'A',
  op: 'i',
  preset: null,
  show: {shade: true, tokens: true, counts: true, labels: true},
  lang: 'ms',
  dirty: true,
  tok: [],
  geo: null
};
let drag = null;

const has = (s, n) => !!state.mem[s][n - 1];
const membership = n => ({a: has('A', n), b: has('B', n), c: state.three && has('C', n)});
const membersOf = s => range(1, N).filter(n => has(s, n));
const nSets = () => (state.three ? 3 : 2);
const resultOf = (op = state.op) => range(1, N).filter(n => OPS[op].test(membership(n)));
const setStr = list => list.length ? '{' + list.join(', ') + '}' : tr('emptySet');
const tr = k => I18N[state.lang][k];
const isSubset = (x, y) => x.every(n => y.includes(n));
