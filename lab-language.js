(() => {
  'use strict';

  const toggle = document.querySelector('[data-language-toggle]');
  if (!toggle) return;

  // Translate the display text in modules whose model data is authored in Malay.
  // Keep the nodes, form values and simulation state intact while switching.
  const shared = `
← Kembali ke katalog|← Back to catalogue
← Katalog simulasi|← Simulation catalogue
Semua simulasi|All simulations
Set semula|Reset
Panel kawalan|Control panel
Kawalan|Controls
`;
  const catalogues = {
    optics: `
Simulasi — Makmal STEM|Simulation — Makmal STEM
Memuatkan simulasi…|Loading simulation…
Fizik T5 · Sains T1|Physics F5 · Science F1
Visual simulasi|Simulation display
Jadual|Records
Bacaan langsung|Live readings
Jadual rekod amali|Experiment records
Kosongkan jadual|Clear records
Catat bacaan daripada panel kawalan untuk mengisi jadual.|Record a reading from the control panel to fill the table.
Nota pembelajaran|Learning notes
Video pembelajaran|Learning videos
Pantulan Cahaya dan Cermin Satah (BETA) — Makmal STEM|Reflection of Light and Plane Mirrors (BETA) — Makmal STEM
Pantulan Cahaya dan Cermin Satah|Reflection of Light and Plane Mirrors
Pantulan Cahaya|Reflection of Light
Fizik · Tingkatan 5|Physics · Form 5
Uji hubungan antara sudut tuju dengan sudut pantulan pada cermin satah.|Investigate the relationship between the angles of incidence and reflection in a plane mirror.
Kedua-dua sudut diukur dari garis normal, iaitu garis serenjang dengan permukaan cermin. Pada cermin satah, sudut tuju sama dengan sudut pantulan.|Both angles are measured from the normal, the line perpendicular to the mirror. In a plane mirror, the angle of incidence equals the angle of reflection.
Meja optik|Optics bench
Sudut tuju|Angle of incidence
Sudut tuju (i)|Angle of incidence (i)
Sudut pantulan (r)|Angle of reflection (r)
Hubungan|Relationship
Garis normal|Normal
Label sinar|Ray labels
Cermin satah|Plane mirror
Sinar tuju|Incident ray
Sinar pantulan|Reflected ray
Ukur kedua-dua sudut dari garis normal.|Measure both angles from the normal.
Catat ke jadual|Record reading
Jadual penuh. Kosongkan jadual untuk mencatat lagi.|The table is full. Clear it to record more readings.
Jadual dikosongkan.|Records cleared.
Tonton di YouTube|Watch on YouTube
Tonton di YouTube ↗|Watch on YouTube ↗
`,
    bonds: `
Ikatan Kimia (BETA) — Makmal STEM|Chemical Bonding (BETA) — Makmal STEM
KIMIA TINGKATAN 4 · BAB 5|FORM 4 CHEMISTRY · CHAPTER 5
Ikatan Kimia|Chemical Bonding
Bina ikatan dengan elektron valens, kemudian uji bagaimana struktur bahan mempengaruhi sifatnya.|Build bonds with valence electrons, then investigate how structure affects a substance's properties.
Ulang kaji Struktur Atom ↗|Review Atomic Structure ↗
Teroka pembentukan ikatan|Explore bond formation
Pilih unsur|Choose an element
Pilih ikatan|Choose a bond
Unsur pertama|First element
Unsur kedua|Second element
Jenis ikatan|Bond type
Pilih jenis ikatan|Choose a bond type
Ikatan ion · contoh NaCl|Ionic bond · NaCl example
Ikatan kovalen · contoh Cl₂|Covalent bond · Cl₂ example
Ulang animasi|Replay animation
Pilih dua unsur untuk melihat contoh daripada modul ini.|Choose two elements to see an example from this module.
Pilih ikatan ion atau ikatan kovalen untuk melihat demonstrasi.|Choose ionic or covalent bonding to see a demonstration.
Gabungan ini belum dimodelkan. Cuba Cl + Cl, Na + Cl atau Mg + O.|This combination is not modelled here. Try Cl + Cl, Na + Cl or Mg + O.
Perhatikan perubahan elektron dalam rajah.|Watch how the electrons change in the diagram.
Gunakan kawalan manual atau ulang demonstrasi daripada pilihan terakhir.|Use the manual controls or replay the last demonstration.
Ikatan ion|Ionic bonding
Ikatan kovalen|Covalent bonding
Uji sifat bahan|Test material properties
Pindahkan elektron|Transfer electrons
Perhatikan cas dan susunan elektron setiap atom.|Observe the charge and electron arrangement of each atom.
Model petala|Shell model
Seret e⁻ ke penerima atau tekan|Drag e⁻ to the acceptor or press
. Ikuti laluan elektron ke petala penerima dan lihat cas kedua-dua atom berubah.|. Follow the electron to the acceptor shell and watch both charges change.
Pindah 1 elektron|Transfer 1 electron
Pilih gabungan atom|Choose an atom combination
Semak nisbah ion dalam formula|Check the ion ratio in the formula
Bina nisbah nombor bulat terkecil yang memberikan jumlah cas sifar.|Find the smallest whole-number ratio that gives zero total charge.
Bilangan kation|Number of cations
Bilangan anion|Number of anions
Semak nisbah|Check ratio
Ion berlainan cas menarik antara satu sama lain. Rajah ini mengulang nisbah formula dan menggambarkan bilangan ion dalam kekisi secara ringkas.|Oppositely charged ions attract. This diagram repeats the formula ratio to illustrate the relative numbers of ions in the lattice.
Kongsi pasangan elektron|Share electron pairs
Bina struktur Lewis dengan mengubah bilangan pasangan terkongsi.|Build a Lewis structure by changing the number of shared pairs.
Struktur Lewis|Lewis structure
Titik dan pangkah membezakan sumber elektron. Bentuk rajah ini skematik dan tidak menunjukkan sudut ikatan.|Dots and crosses identify the source of each electron. This diagram is schematic and does not show bond angles.
Pilih molekul|Choose a molecule
Pasangan atom|Pair of atoms
Tambah pasangan|Add a pair
Kurang pasangan|Remove a pair
Papar garis ikatan|Show bond lines
Semak struktur|Check structure
Elektron di sekeliling atom|Electrons around each atom
Satu pasangan dikeluarkan.|One pair removed.
Satu pasangan ditambah.|One pair added.
Pasangan ini tidak boleh berkongsi lebih banyak elektron dalam model ini.|This pair cannot share more electrons in this model.
Betul. Semua atom mencapai duplet atau oktet bagi molekul ini.|Correct. All atoms reach a duplet or octet in this molecule.
Pemindahan selesai. Semak nisbah ion di bawah untuk menentukan formula.|Transfer complete. Check the ion ratio below to find the formula.
Persamaan setengah|Half-equations
Persamaan setengah dipaparkan apabila pemindahan selesai.|The half-equations appear when the transfer is complete.
Seret 1 elektron|Drag 1 electron
Masukkan dua nombor bulat antara 1 dan 6.|Enter two whole numbers between 1 and 6.
Pilih penderma seterusnya dan penerima yang masih memerlukan elektron, atau gunakan butang pindah.|Choose the next donor and an acceptor that still needs electrons, or use the transfer button.
Lihat pergerakan ion dan kaitkan struktur dengan kekonduksian.|Observe ion movement and relate structure to conductivity.
Model zarah|Particle model
Litar NaCl|NaCl circuit
Keadaan bahan|State of matter
Pepejal|Solid
Leburan|Molten
Larutan akueus|Aqueous solution
Hidupkan litar|Turn on the circuit
Matikan litar|Turn off the circuit
Lampu menyala|Lamp on
Lampu padam|Lamp off
− Katod|− Cathode
Anod +|Anode +
Papar orientasi molekul air|Show the orientation of water molecules
Air mengorientasikan hujung O (δ−) ke arah Na⁺ dan hujung H (δ+) ke arah Cl⁻.|Water orients its O end (δ−) towards Na⁺ and its H ends (δ+) towards Cl⁻.
Struktur dan tenaga|Structure and energy
Bandingkan apa yang diatasi apabila bahan dipanaskan.|Compare what must be overcome when each substance is heated.
Tunjuk kesan pemanasan|Show the effect of heating
Kembali ke struktur awal|Return to original structures
NaCl · Kekisi ion|NaCl · Ionic lattice
CH₄ · Molekul ringkas|CH₄ · Simple molecules
SiO₂ · Kovalen gergasi|SiO₂ · Giant covalent structure
Memerlukan tenaga yang tinggi untuk mengatasi tarikan elektrostatik kuat dalam kekisi.|A large amount of energy is needed to overcome strong electrostatic attractions in the lattice.
Tarikan antara molekul diatasi dengan tenaga yang relatif rendah. Molekul CH₄ kekal utuh.|Relatively little energy is needed to overcome intermolecular attractions. The CH₄ molecules remain intact.
Memerlukan tenaga yang tinggi untuk mengatasi ikatan kovalen kuat dalam rangkaian.|A large amount of energy is needed to overcome the strong covalent bonds in the network.
Keterlarutan bergantung pada bahan. NaCl larut dalam air, manakala Mg(OH)₂ sukar larut.|Solubility depends on the substance. NaCl dissolves in water while Mg(OH)₂ is sparingly soluble.
Bandingkan sebatian ion dan kovalen|Compare ionic and covalent compounds
Perbandingan contoh NaCl (ion) dan naftalena (kovalen bermolekul ringkas).|Compare NaCl (an ionic compound) and naphthalene (a simple molecular covalent compound).
Sifat|Property
Naftalena|Naphthalene
Kekonduksian|Conductivity
Pepejal tidak mengalirkan arus. Leburan dan larutan akueus mengalirkan arus kerana ion bebas bergerak.|The solid does not conduct electricity. The molten substance and aqueous solution conduct because the ions can move freely.
Pepejal dan leburan tidak mengalirkan arus kerana molekul neutral tidak membekalkan pembawa cas bergerak.|The solid and molten substance do not conduct because neutral molecules do not supply mobile charge carriers.
Keterlarutan|Solubility
Larut dalam air.|Soluble in water.
Sangat sukar larut dalam air, tetapi larut dalam pelarut organik yang sesuai.|Very slightly soluble in water, but soluble in suitable organic solvents.
Takat lebur dan didih|Melting and boiling points
Lebih tinggi kerana tarikan elektrostatik kuat dalam kekisi ion.|Higher because of the strong electrostatic attractions in the ionic lattice.
Lebih rendah kerana perubahan keadaan mengatasi tarikan antara molekul. Rangkaian kovalen gergasi seperti SiO₂ mempunyai takat lebur tinggi.|Lower because changes of state overcome intermolecular attractions. Giant covalent networks such as SiO₂ have high melting points.
Model skematik · Rujukan: Buku Teks Kimia Tingkatan 4 KSSM, Bab 5, hlm. 110–130.|Schematic models · Reference: KSSM Form 4 Chemistry textbook, Chapter 5, pp. 110–130.
`,
    geometry: `
Transformasi Geometri (BETA) — Makmal STEM|Geometric Transformations (BETA) — Makmal STEM
MATEMATIK · TINGKATAN 5|MATHEMATICS · FORM 5
Matematik|Mathematics
Transformasi|Transformation
MAKMAL GEOMETRI · TRANSFORMASI TUNGGAL & GABUNGAN|GEOMETRY LAB · SINGLE & COMBINED TRANSFORMATIONS
Transformasi Geometri|Geometric Transformations
Seret, putar dan terokai. Lihat bagaimana objek, imej dan koordinat berubah secara langsung.|Drag, rotate and explore how objects, images and coordinates change in real time.
Interaktif · Tanpa login|Interactive · No login
Objek|Object
Poligon|Polygon
Titik|Point
Bentuk permulaan|Starting shape
Segi tiga|Triangle
Segi empat sama|Square
Segi empat tepat|Rectangle
Segi empat selari|Parallelogram
Trapezium|Trapezium
Pentagon|Pentagon
Heksagon|Hexagon
Tarik bucu untuk ubah bentuk. Tekan dan seret bahagian dalam untuk alih seluruh poligon.|Drag a vertex to reshape the polygon. Drag inside it to move the whole polygon.
Seret titik pada grid. Magnet menetapkan kedudukannya pada 0.5 unit.|Drag the point on the grid. It snaps to half-unit increments.
⌖ Magnet grid · 0.5 unit|⌖ Snap to grid · 0.5 units
Alih objek · 0.5 unit|Move object · 0.5 units
Tunggal|Single
Gabungan|Combined
⇅ Tukar tertib P dan Q|⇅ Swap the order of P and Q
Kembali ke grid ↑|Back to the grid ↑
Mulakan semula|Start over
Objek → P|Object → P
Objek → P → Q|Object → P → Q
Tetapan ↓|Settings ↓
Pilih & seret|Select & drag
Imej I|Image I
Imej I′′|Image I′′
Gerak grid|Pan grid
Muatkan semua|Fit all
Seret bucu atau isi poligon. Semua perubahan terus dikira.|Drag a vertex or the polygon interior. All changes are calculated instantly.
● Objek O|● Object O
◆ Imej I · P|◆ Image I · P
■ Imej I′′ · QP|■ Image I′′ · QP
Garis panduan|Guide lines
Ctrl + seret: gerak grid · Ctrl + scroll: zum|Ctrl + drag to pan · Ctrl + scroll to zoom
Pilih & seret: bucu untuk ubah bentuk, isi untuk gerak seluruh poligon.|Select and drag a vertex to reshape the polygon or drag inside it to move it.
Koordinat & pengiraan langsung|Live coordinates & calculations
Lihat langkah pengiraan|Show calculation steps
Titik yang diperhatikan|Point being examined
≈ menandakan nilai dibundarkan. Paparan maksimum 3 tempat perpuluhan; pengiraan menggunakan nilai penuh.|≈ indicates a rounded value. The display uses up to 3 decimal places, and calculations use full precision.
Cara teroka, konsep & rujukan|Exploration guide, concepts & references
Objek:|Object:
Pantulan:|Reflection:
Pembesaran & putaran:|Enlargement & rotation:
Gabungan:|Combined transformations:
Rujukan:|References:
DSKP KPM Matematik Tingkatan 4 & 5, hlm. 99–100|Ministry of Education Mathematics curriculum, Forms 4 & 5, pp. 99–100
Buku Teks KPM Matematik Tingkatan 5, Bab 5|Ministry of Education Form 5 Mathematics textbook, Chapter 5
(salinan digital).|(digital copy).
· Ubah pada grid, faham melalui pengiraan.|· Explore on the grid and understand through calculation.
Transformasi P · pertama|Transformation P · first
Transformasi Q · selepas P|Transformation Q · after P
Jenis|Type
Translasi|Translation
Pantulan|Reflection
Putaran|Rotation
Pembesaran|Enlargement
a · gerakan x|a · horizontal shift
b · gerakan y|b · vertical shift
Seret imej pada grid|Drag the image on the grid
Tarik imej untuk melaras vektor secara langsung.|Drag the image to adjust the vector directly.
✎ Lukis garis pantulan|✎ Draw a line of reflection
Atau pilih garis biasa|Or choose a preset line
Garis bebas|Custom line
x = c · menegak|x = c · vertical
y = c · mendatar|y = c · horizontal
Nilai c|Value of c
Persamaan garis cermin|Equation of the line of reflection
Tekan dan tarik untuk melukis. Pemegang hujung dan garis boleh diseret selepas itu.|Click and drag to draw. You can then drag the line or its handles.
⌖ Pilih pusat pada grid|⌖ Pick a centre on the grid
Tetapkan pusat dengan nombor|Enter centre coordinates
Pusat x|Centre x
Pusat y|Centre y
Pusat P|Centre P
Pusat Q|Centre Q
Faktor skala k (≠ 0)|Scale factor k (≠ 0)
Sudut θ (°) · positif lawan jam|Angle θ (°) · positive anticlockwise
90° ikut jam|90° clockwise
90° lawan jam|90° anticlockwise
Seret imej → pusat berubah, k dikekalkan. Untuk k = 1, seret objek asal.|Drag the image to move the centre while keeping k fixed. If k = 1, drag the original object.
Seret imej → pusat berubah, sudut dikekalkan. Seret pusat atau gelongsorkan sudut untuk meneroka.|Drag the image to move the centre while keeping the angle fixed. Drag the centre or use the angle slider to explore.
P dahulu → Q kemudian. Notasi: QP. Maksimum dua transformasi.|P first → Q next. Notation: QP. Up to two transformations.
Satu transformasi P. Seret dan lihat perubahan secara langsung.|One transformation P. Drag to see the changes in real time.
Imej P|Image P
Imej QP|Image QP
Luas (unit²)|Area (units²)
Tindakan diundur.|Action undone.
Tindakan diulang.|Action redone.
Pemilihan pusat ditamatkan.|Centre selection ended.
Mod pilih pusat aktif. Klik grid berkali-kali; tekan butang ini semula atau Escape untuk tamat.|Centre selection is active. Click the grid to move the centre. Press the button again or Escape to finish.
Tekan dan seret pada grid untuk menentukan dua titik garis pantulan. Escape untuk batal.|Click and drag on the grid to set two points on the reflection line. Press Escape to cancel.
`
  };

  const terms = new Map((shared + catalogues[toggle.dataset.languageToggle])
    .trim().split('\n').map(line => line.split('|')));
  const original = new WeakMap();
  const module = toggle.dataset.languageToggle;
  const elementNames = {
    hidrogen: 'hydrogen', karbon: 'carbon', nitrogen: 'nitrogen', oksigen: 'oxygen',
    fluorin: 'fluorine', natrium: 'sodium', magnesium: 'magnesium', aluminium: 'aluminium', klorin: 'chlorine'
  };
  const patterns = {
    optics: [
      [/^Bacaan (\d+) dicatat\.$/, 'Reading $1 recorded.'],
      [/^Jadual, (\d+) bacaan$/, 'Records, $1 readings'],
      [/^Sudut tuju (\d+) darjah dan sudut pantulan (\d+) darjah, diukur dari garis normal\.$/,
        'Angle of incidence $1 degrees and angle of reflection $2 degrees, measured from the normal.']
    ],
    bonds: [
      [/\b(Hidrogen|Karbon|Nitrogen|Oksigen|Fluorin|Natrium|Magnesium|Aluminium|Klorin)\b/g,
        name => { const en = elementNames[name.toLowerCase()]; return en[0].toUpperCase() + en.slice(1); }],
      [/^Penderma(\s*\d*)$/, 'Donor$1'],
      [/^Penerima(\s*\d*)$/, 'Acceptor$1'],
      [/^Bilangan (\S+)$/, 'Number of $1'],
      [/^(\d+) daripada (\d+) elektron dipindahkan\.$/, '$1 of $2 electrons transferred.'],
      [/^Pasangan dipilih: /, 'Selected pair: '],
      [/(\d+) pasangan(?!\s+elektron)/g, (_, count) => count + (count === '1' ? ' pair' : ' pairs')],
      [/Ion hanya bergetar pada kedudukan kekisi dan tidak bebas membawa cas merentasi pepejal\./,
        'Ions vibrate at fixed lattice positions and cannot carry charge through the solid.'],
      [/Ion bebas bergerak dan boleh membawa cas\./, 'Ions can move freely and carry charge.'],
      [/^Arus mengalir\. /, 'Current flows. '],
      [/^Arus tidak mengalir\. /, 'No current flows. '],
      [/^Litar dimatikan\. /, 'The circuit is off. '],
      [/^(\S+) menderma elektron kepada (\S+)\. Tarikan antara (\S+) dan (\S+) membentuk sebatian ion (\S+)\.$/,
        '$1 donates electrons to $2. The attraction between $3 and $4 forms the ionic compound $5.'],
      [/^(Dua atom \w+|Atom dalam molekul ini) membentuk (ikatan|dua ikatan) kovalen (tunggal|ganda dua|ganda tiga)\. Setiap atom menyumbang satu elektron bagi setiap pasangan\. (Sepasang|Dua pasangan|Tiga pasangan) elektron dikongsi bagi setiap ikatan\. (\S+) ialah (molekul unsur|sebatian kovalen)\.$/,
        (_, atoms, bonds, order, pairs, formula, type) => {
          const subject = atoms.startsWith('Dua atom') ? 'Two ' + elementNames[atoms.slice(9)] + ' atoms' : 'The atoms in this molecule';
          const orderEn = {tunggal:'single', 'ganda dua':'double', 'ganda tiga':'triple'}[order];
          const bond = bonds === 'ikatan' ? 'a ' + orderEn + ' covalent bond' : 'two ' + orderEn + ' covalent bonds';
          const pairsEn = {Sepasang:'One pair of electrons is', 'Dua pasangan':'Two pairs of electrons are', 'Tiga pasangan':'Three pairs of electrons are'}[pairs];
          const kind = type === 'molekul unsur' ? 'a molecule of an element' : 'a covalent compound';
          return subject + ' form ' + bond + '. Each atom contributes one electron to each pair. ' +
            pairsEn + ' shared in each bond. ' + formula + ' is ' + kind + '.';
        }]
    ],
    geometry: [
      [/^Titik ([A-Z])$/, 'Point $1'],
      [/Translasi vektor /g, 'Translation by '],
      [/Pantulan pada /g, 'Reflection in '],
      [/Pembesaran pusat /g, 'Enlargement centred at '],
      [/Putaran ([-.\d]+)° (ikut|lawan) arah jam, pusat /g,
        (_, angle, direction) => 'Rotation ' + angle + '° ' + (direction === 'ikut' ? 'clockwise' : 'anticlockwise') + ', centred at '],
      [/^Garis utama: (\d+) unit · Magnet: 0\.5 unit( · Garis halus: 0\.5 unit)?$/,
        (_, unit, fine) => 'Major grid: ' + unit + ' units · Snap: 0.5 units' + (fine ? ' · Minor grid: 0.5 units' : '')],
      [/Ctrl \+ seret: gerak grid · Ctrl \+ scroll: zum\./, 'Ctrl + drag to pan · Ctrl + scroll to zoom.']
    ]
  };
  const attributes = ['aria-label', 'title', 'placeholder'];
  const ignored = 'script, style, textarea, [contenteditable], [data-simulation-feedback], #lesson-video-name';

  function english(text) {
    const phrase = text.trim().replace(/\s+/g, ' ');
    if (terms.has(phrase)) return text.replace(/\S[\s\S]*\S|\S/, terms.get(phrase));
    return patterns[module].reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
  }

  function translate(node, key, value, set) {
    const translations = original.get(node);
    const saved = translations?.get(key);
    if (document.documentElement.lang === 'ms') {
      if (saved && value === saved.english) set(saved.malay);
      translations?.delete(key);
      return;
    }
    if (saved?.english === value) return;
    const translated = english(value);
    if (translated === value) return;
    if (!translations) original.set(node, new Map());
    original.get(node).set(key, {malay: value, english: translated});
    set(translated);
  }

  function localize(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (!parent || parent.closest(ignored)) return;
      if (document.documentElement.lang === 'en' && parent.matches('option:not([value])')) {
        parent.value = parent.textContent;
      }
      translate(node, 'text', node.data, value => { node.data = value; });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.closest(ignored)) return;
    localizeAttributes(node);
    for (const child of node.childNodes) localize(child);
  }

  function localizeAttributes(node) {
    for (const name of attributes) {
      const value = node.getAttribute(name);
      if (value) translate(node, name, value, translated => node.setAttribute(name, translated));
    }
  }

  const observer = new MutationObserver(changes => {
    for (const change of changes) {
      if (change.type === 'childList') {
        for (const node of change.addedNodes) localize(node);
      } else if (change.type === 'attributes') {
        if (!change.target.closest(ignored)) localizeAttributes(change.target);
      } else localize(change.target);
    }
  });

  function setLanguage(lang) {
    observer.disconnect();
    document.documentElement.lang = lang;
    localize(document.documentElement);
    toggle.setAttribute('aria-label', lang === 'en' ? 'Switch to Bahasa Melayu' : 'Tukar ke bahasa Inggeris');
    try { localStorage.setItem('stemlab-lang', lang); } catch {}
    if (lang === 'en') observer.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes
    });
  }

  let lang = 'ms';
  try { if (localStorage.getItem('stemlab-lang') === 'en') lang = 'en'; } catch {}
  setLanguage(lang);
  toggle.addEventListener('click', () => setLanguage(document.documentElement.lang === 'ms' ? 'en' : 'ms'));
})();

