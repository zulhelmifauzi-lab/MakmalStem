const I18N = {
  ms: {
    back: 'Semua Simulasi', classOn: 'Mod Kelas', classOff: 'Keluar Mod Kelas', langAria: 'Tukar bahasa',
    badge: 'Fizik T4 · Bab 6', title: 'Kanta Cembung & Cekung',
    intro: 'Letakkan objek di hadapan kanta dan lihat tiga sinar utama membentuk imej. Seret objek, ubah panjang fokus, kemudian perhatikan kedudukan, saiz dan ciri imej.',
    presets: 'Kedudukan objek', p_far: 'u > 2f', p_twof: 'u = 2f', p_mid: 'f < u < 2f', p_atf: 'u = f', p_near: 'u < f (pembesar)', p_concave: 'Kanta cekung',
    benchH: 'Bangku optik', benchAria: 'Bangku optik dengan objek, kanta dan imej. Seret objek atau guna anak panah kiri dan kanan untuk menukar jarak objek.',
    play: 'Gerakkan objek', pause: 'Jeda', s_rays: 'Sinar', s_screen: 'Skrin', s_ext: 'Lanjutan sinar',
    r_u: 'Jarak objek, u', r_v: 'Jarak imej, v', r_m: 'Pembesaran, m = v/u', r_p: 'Kuasa kanta, P = 1/f', r_img: 'Ciri-ciri imej',
    noImage: 'Tiada imej (sinar bias selari)', real: 'nyata', virtual: 'maya', inverted: 'songsang', upright: 'tegak', bigger: 'diperbesar', smaller: 'diperkecil', same: 'sama saiz',
    onScreen: 'boleh ditayang pada skrin', noScreen: 'tidak boleh ditayang pada skrin',
    k_gt2f: 'u > 2f: imej terbentuk di antara F dan 2F di sebelah kanan kanta.', k_eq2f: 'u = 2f: imej terbentuk pada 2F di sebelah kanan, sama saiz dengan objek.',
    k_mid: 'f < u < 2f: imej terbentuk di luar 2F di sebelah kanan.', k_eqf: 'u = f: sinar bias menjadi selari, jadi imej terbentuk pada jarak infiniti (tiada imej).',
    k_ltf: 'u < f: sinar bias mencapah. Imej maya terbentuk di belakang objek di sebelah kiri kanta (prinsip kanta pembesar).',
    k_concave: 'Kanta cekung: sinar bias sentiasa mencapah, jadi imej sentiasa maya, tegak dan diperkecil, dan terbentuk di antara F dan kanta.',
    offscreen: 'imej di luar paparan', screenLbl: 'skrin', objLbl: 'objek', imgLbl: 'imej', axis: 'paksi utama',
    controls: 'Kawalan', c_type: 'Jenis kanta', t_convex: 'Kanta cembung', t_concave: 'Kanta cekung', c_u: 'Jarak objek, u', c_f: 'Panjang fokus, f', c_h: 'Tinggi objek, h',
    c_hint: 'Seret objek pada bangku optik, atau pilih bangku dan guna anak panah kiri dan kanan. Skala menegak dikembangkan supaya imej mudah dilihat.',
    triesH: 'Cuba ini',
    tries: [
      'Pilih “u > 2f”. Nyatakan ciri imej (nyata atau maya, songsang atau tegak, saiz). Di manakah imej terbentuk?',
      'Seret objek dari jauh menghampiri kanta. Bilakah imej sama saiz dengan objek? Apakah nilai u ketika itu berbanding f?',
      'Letakkan objek tepat pada F (u = f). Apakah yang berlaku kepada sinar bias dan imej? Mengapa?',
      'Pilih “u < f”. Imej menjadi maya, tegak dan diperbesar. Alat apakah yang menggunakan prinsip ini?',
      'Tukar kepada kanta cekung dan gerakkan objek. Adakah ciri imej berubah? Bandingkan dengan kanta cembung.'
    ],
    eqH: 'Persamaan kanta (nilai semasa)', e_lens: 'Persamaan kanta', e_mag: 'Pembesaran', e_pow: 'Kuasa kanta', footer: 'Koleksi Simulasi Makmal STEM'
  },
  en: {
    back: 'All Simulations', classOn: 'Class Mode', classOff: 'Exit Class Mode', langAria: 'Switch language',
    badge: 'Physics F4 · Ch 6', title: 'Convex & Concave Lenses',
    intro: 'Place an object in front of a lens and watch three principal rays form the image. Drag the object, change the focal length, then observe the position, size and nature of the image.',
    presets: 'Object position', p_far: 'u > 2f', p_twof: 'u = 2f', p_mid: 'f < u < 2f', p_atf: 'u = f', p_near: 'u < f (magnifier)', p_concave: 'Concave lens',
    benchH: 'Optical bench', benchAria: 'Optical bench with an object, a lens and an image. Drag the object or use the left and right arrow keys to change the object distance.',
    play: 'Move the object', pause: 'Pause', s_rays: 'Rays', s_screen: 'Screen', s_ext: 'Ray extensions',
    r_u: 'Object distance, u', r_v: 'Image distance, v', r_m: 'Magnification, m = v/u', r_p: 'Lens power, P = 1/f', r_img: 'Image characteristics',
    noImage: 'No image (refracted rays are parallel)', real: 'real', virtual: 'virtual', inverted: 'inverted', upright: 'upright', bigger: 'magnified', smaller: 'diminished', same: 'same size',
    onScreen: 'can be projected on a screen', noScreen: 'cannot be projected on a screen',
    k_gt2f: 'u > 2f: the image forms between F and 2F on the right of the lens.', k_eq2f: 'u = 2f: the image forms at 2F on the right, the same size as the object.',
    k_mid: 'f < u < 2f: the image forms beyond 2F on the right of the lens.', k_eqf: 'u = f: the refracted rays are parallel, so the image forms at infinity (no image).',
    k_ltf: 'u < f: the refracted rays diverge. A virtual image forms behind the object on the left of the lens (the principle of a magnifying glass).',
    k_concave: 'Concave lens: the refracted rays always diverge, so the image is always virtual, upright and diminished, and forms between F and the lens.',
    offscreen: 'image is off the view', screenLbl: 'screen', objLbl: 'object', imgLbl: 'image', axis: 'principal axis',
    controls: 'Controls', c_type: 'Type of lens', t_convex: 'Convex lens', t_concave: 'Concave lens', c_u: 'Object distance, u', c_f: 'Focal length, f', c_h: 'Object height, h',
    c_hint: 'Drag the object on the bench, or focus the bench and use the left and right arrow keys. The vertical scale is stretched so the image is easy to see.',
    triesH: 'Try this',
    tries: [
      'Choose “u > 2f”. State the image characteristics (real or virtual, inverted or upright, size). Where does the image form?',
      'Drag the object from far away towards the lens. When is the image the same size as the object? What is u then compared with f?',
      'Place the object exactly at F (u = f). What happens to the refracted rays and the image? Why?',
      'Choose “u < f”. The image becomes virtual, upright and magnified. Which device uses this principle?',
      'Switch to the concave lens and move the object. Do the image characteristics change? Compare with the convex lens.'
    ],
    eqH: 'Lens equations (current values)', e_lens: 'Lens equation', e_mag: 'Magnification', e_pow: 'Lens power', footer: 'Makmal STEM Simulation Collection'
  }
};
const L = {uMin: 4, uMax: 60, fMin: 5, fMax: 20, hMin: 2, hMax: 6}, TOL = 0.05;
const PRESETS = {far: {type: 'convex', f: 10, u: 30}, twof: {type: 'convex', f: 10, u: 20}, mid: {type: 'convex', f: 10, u: 15},
  atf: {type: 'convex', f: 10, u: 10}, near: {type: 'convex', f: 10, u: 6}, concave: {type: 'concave', f: 10, u: 20}};
const state = {type: 'convex', f: 10, u: 30, h: 4, rays: true, screen: true, ext: true, running: false, preset: 'far', lang: 'ms', classMode: false, dirty: true, last: 0, dragging: false};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const MINUS = '−';
const f1 = (n, d = 1) => { let s = Number(n).toFixed(d); if (/^-0(\.0+)?$/.test(s)) s = s.slice(1); return s.replace('-', MINUS); };
const tr = k => I18N[state.lang][k];
const fSigned = (p = state) => (p.type === 'convex' ? p.f : -p.f);

/* ===== Optik: 1/f = 1/u + 1/v (nyata positif), f positif untuk kanta cembung, negatif untuk kanta cekung ===== */
function imageOf(p = state) {
  const fs = fSigned(p), u = p.u;
  if (p.type === 'convex' && Math.abs(u - p.f) < 1e-6) return {none: true};
  const v = u * fs / (u - fs), m = -v / u;
  return {none: false, v, m, hi: m * p.h, real: v > 0, upright: m > 0, size: Math.abs(Math.abs(m) - 1) < 0.02 ? 'same' : Math.abs(m) > 1 ? 'bigger' : 'smaller'};
}
function caseOf(p = state) {
  if (p.type === 'concave') return 'concave';
  const u = p.u, f = p.f;
  if (Math.abs(u - f) < TOL) return 'eqf';
  if (Math.abs(u - 2 * f) < TOL) return 'eq2f';
  return u > 2 * f ? 'gt2f' : u > f ? 'mid' : 'ltf';
}
/* Tiga sinar utama: pada kanta di tinggi yl, kemudian cerun dy/dx selepas kanta */
function raysOf(p = state) {
  const fs = fSigned(p), u = p.u, h = p.h;
  return [
    {yl: h, slope: -h / fs, color: '#dc2626'},                    // selari paksi, kemudian melalui F (atau seolah-olah dari F)
    {yl: 0, slope: -h / u, color: '#16a34a'},                      // melalui pusat optik, tidak terbias
    {yl: -h * fs / (u - fs), slope: 0, color: '#2563eb'}           // menuju F, kemudian selari paksi
  ];
}
const powerOf = (p = state) => 100 / fSigned(p); // dioptre, f dalam cm

/* ===== Kawalan ===== */
