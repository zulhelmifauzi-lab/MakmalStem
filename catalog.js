// Add future modules here; change status to 'ready' and supply the module URL.
const modules = [
 {id:'satelit',title:'Satelit Buatan Manusia',subject:'Fizik',level:4,status:'ready',url:'satelit.html',desc:'Lancar satelit pada pelbagai altitud dan laju. Terokai halaju orbit, halaju lepas dan orbit geopegun 24 jam.',topic:'Bab 3 · Kegravitian',art:'satellite',keywords:'satelit geopegun halaju lepas orbit linear iss measat graviti'},
 {id:'hukum-kepler',title:'Hukum Kepler',subject:'Fizik',level:4,status:'ready',url:'hukum-kepler.html',desc:'Terokai orbit elips (Hukum I), sapuan luas sama dalam masa sama (Hukum II) dan hubungan T² ∝ r³ (Hukum III).',topic:'Bab 3 · Kegravitian',art:'kepler',keywords:'kepler orbit elips perihelion afelion luas sama tempoh planet'},
 {id:'kegravitian',title:'Kegravitian Semesta',subject:'Fizik',level:4,status:'ready',url:'kegravitian.html',desc:'Terokai Hukum Kegravitian Semesta Newton F = Gm₁m₂/r² serta graf variasi pecutan graviti g melawan jarak r.',topic:'Bab 3 · Kegravitian',art:'gravity',keywords:'graviti newton pecutan satelit jisim jarak songsang kuasa dua'},
 {id:'ketaksamaan-linear',title:'Ketaksamaan Linear',subject:'Matematik',level:4,status:'ready',url:'ketaksamaan-linear.html',desc:'Terokai garis sempadan padu dan putus-putus, rantau berlorek, titik ujian serta sistem dua ketaksamaan linear.',topic:'Bab 6 · Ketaksamaan Linear dalam Dua Pemboleh Ubah',art:'inequality',keywords:'rantau berlorek garis putus-putus padu sistem ketaksamaan linear'},
 {id:'ikatan-kimia',title:'Ikatan Kimia',subject:'Kimia',level:4,status:'ready',url:'ikatan-kimia.html',desc:'Pindahkan elektron, bina struktur Lewis dan uji kekonduksian NaCl dalam tiga keadaan.',topic:'Bab 5 · Ikatan Ion dan Kovalen',art:'bond',keywords:'valens kekisi ikatan kimia duplet oktet'},
 {id:'transformasi',title:'Transformasi Geometri',subject:'Matematik',level:5,status:'ready',url:'transformasi/index.html',desc:'Seret objek dan imej pada grid. Terokai translasi, pantulan, putaran, pembesaran serta gabungan dua transformasi.',topic:'Transformasi Tunggal & Gabungan',art:'transformation'},
 {id:'daya-paduan',title:'Daya Paduan',subject:'Fizik',level:5,status:'ready',url:'daya-paduan.html',desc:'Tolak dan tarik troli. Gabungkan daya sebaris atau bersudut dan terokai hubungan daya, jisim dan pecutan.',topic:'1.1 Daya Paduan',art:'force'},
 {id:'hooke',title:'Hukum Hooke',subject:'Fizik',level:5,status:'ready',desc:'Ubah jisim beban dan kekakuan spring. Terokai hubungan daya dengan pemanjangan.',topic:'Kekenyalan',art:'spring'},
 {id:'trigonometri',title:'Graf Fungsi Trigonometri',subject:'Matematik',level:5,status:'ready',url:'graf-trigonometri.html',desc:'Terokai sinus, kosinus dan tangen. Ubah amplitud, kala serta anjakan graf.',topic:'Trigonometri',art:'wave'},
 {id:'atom',title:'Struktur Atom',subject:'Kimia',level:4,status:'ready',url:'struktur-atom.html',desc:'Terokai model atom dan susunan elektron melalui visualisasi interaktif.',topic:'Struktur Atom',art:'atom'},
 {id:'linear',title:'Gerakan Linear',subject:'Fizik',level:4,status:'ready',url:'gerakan-linear.html',desc:'Kenali hubungan sesaran, halaju dan masa melalui gerakan objek.',topic:'Daya & Gerakan',art:'motion'},
 {id:'jatuh-bebas',keywords:'graviti pecutan vakum rintangan udara',title:'Jatuh Bebas',subject:'Fizik',level:4,status:'ready',url:'jatuh-bebas.html',desc:'Lepaskan bola besi dan bulu serentak. Bandingkan jatuhan dalam vakum dan udara, serta di Bumi, Bulan dan Musytari.',topic:'Daya & Gerakan',art:'fall'},
 {id:'set',title:'Operasi Set',subject:'Matematik',level:4,status:'ready',url:'operasi-set.html',desc:'Visualisasikan kesatuan, persilangan dan pelengkap set dalam gambar rajah Venn.',topic:'Set',art:'venn'},
 {id:'titrasi',title:'Titrasi Asid & Bes',subject:'Kimia',level:4,status:'ready',url:'titrasi.html',desc:'Kenali peneutralan dan perubahan penunjuk dalam eksperimen titrasi maya.',topic:'Asid & Bes',art:'flask'},
 {id:'kanta',title:'Kanta Cembung & Cekung',subject:'Fizik',level:4,status:'ready',url:'kanta.html',desc:'Perhatikan rajah sinar, titik fokus dan pembentukan imej oleh kanta.',topic:'Optik',art:'lens'},
 {id:'kuadratik',title:'Fungsi Kuadratik',subject:'Matematik',level:4,status:'ready',url:'fungsi-kuadratik.html',desc:'Terokai bentuk parabola, paksi simetri dan titik maksimum atau minimum.',topic:'Graf Fungsi',art:'parabola'}
];
const shapes={
 module:'<rect x="53" y="30" width="174" height="100" rx="8"/><path d="M66 106h151M88 103l28-35 28 22 36-45 22 26" stroke-linejoin="round"/>',
 satellite:'<circle cx="110" cy="85" r="33" fill="currentColor" fill-opacity=".14"/><circle cx="110" cy="85" r="64" stroke-dasharray="5 5" opacity=".4"/><rect x="163" y="42" width="16" height="16" rx="3" fill="currentColor" fill-opacity=".22"/><path d="M153 50h10m16 0h10m-18 8v9" stroke-width="2"/><path d="M110 85h4m-2-2v4"/><path d="M174 34l18 12-10-18" stroke-width="2" opacity=".6"/>',
 kepler:'<ellipse cx="140" cy="80" rx="92" ry="50"/><path d="M98 80L210 47A92 50 0 0 1 210 113Z" fill="currentColor" fill-opacity=".16" stroke="none"/><path d="M98 80L64 46A92 50 0 0 0 64 114Z" fill="currentColor" fill-opacity=".16" stroke="none"/><circle cx="98" cy="80" r="12" fill="currentColor"/><circle cx="222" cy="59" r="7" fill="currentColor"/>',
 gravity:'<circle cx="95" cy="80" r="36" fill="currentColor" fill-opacity=".14"/><circle cx="95" cy="80" r="5" fill="currentColor"/><circle cx="205" cy="80" r="11" fill="currentColor" fill-opacity=".22"/><path d="M95 80h110" stroke-dasharray="4 4" opacity=".4"/><path d="M126 68h22m-7-5 7 5-7 5M174 68h-22m7-5-7 5 7 5" stroke-width="2"/><path d="M95 26a54 54 0 0 1 110 54" stroke-dasharray="4 5" opacity=".35"/>',
 inequality:'<polygon points="56,24 224,24 224,52 56,128" fill="currentColor" fill-opacity=".14" stroke="none"/><path d="M40 132h200M140 16v128" opacity=".25" stroke-width="1.5"/><path d="M56 128L224 52" stroke-dasharray="8 6"/><circle cx="152" cy="56" r="6" fill="currentColor"/>',
 bond: '<circle cx="99" cy="80" r="53" fill="currentColor" fill-opacity=".07"/><circle cx="181" cy="80" r="53" fill="currentColor" fill-opacity=".07"/><circle cx="99" cy="80" r="11" fill="currentColor"/><circle cx="181" cy="80" r="11" fill="currentColor"/><circle cx="140" cy="72" r="4" fill="currentColor"/><circle cx="140" cy="88" r="4" fill="currentColor"/>',
 force: '<path d="M54 120h172" opacity=".4"/><rect x="96" y="69" width="88" height="35" rx="5" fill="currentColor" fill-opacity=".1"/><circle cx="112" cy="112" r="7"/><circle cx="167" cy="112" r="7"/><path d="M140 52h78m-12-9 12 9-12 9M115 52H62m10-9-10 9 10 9"/>',
 fall: '<path d="M90 135h100M110 65v52m-7-9 7 9 7-9m54-43v52m-7-9 7 9 7-9"/><circle cx="110" cy="44" r="12" fill="currentColor" fill-opacity=".25"/><path d="M162 55q-5-19 20-28 0 22-20 28m-3 3 18-22"/><path d="M140 22v112" stroke-dasharray="4 5" opacity=".3"/>',
 transformation:'<path d="M25 130H255M140 15V145" opacity=".2" stroke-width="1"/><path d="M50 105H105L65 45Z" fill="#006f82" fill-opacity=".12" stroke="#006f82"/><path d="M165 105H220L180 45Z" fill="currentColor" fill-opacity=".15"/><path d="M110 70h45m-10-8 10 8-10 8" stroke-width="2" stroke-dasharray="4 3"/>',spring:'<path d="M120 12v12l-22 7 44 12-44 12 44 12-44 12 44 12-22 7v15"/><rect x="97" y="112" width="46" height="26" rx="5" fill="currentColor" opacity=".18"/><path d="M170 20v110m-5-90h10m-10 20h10m-10 20h10m-10 20h10" stroke-width="2"/>',wave:'<path d="M20 80h240M35 15v125" stroke-width="1" opacity=".3"/><path d="M35 80C65 80 65 25 95 25s30 55 60 55 30 55 60 55 30-55 45-55"/>',atom:'<ellipse cx="140" cy="78" rx="75" ry="28"/><ellipse cx="140" cy="78" rx="75" ry="28" transform="rotate(60 140 78)"/><ellipse cx="140" cy="78" rx="75" ry="28" transform="rotate(120 140 78)"/><circle cx="140" cy="78" r="12" fill="currentColor"/><circle cx="215" cy="78" r="6" fill="currentColor"/>',motion:'<path d="M30 115h230M40 100h30m-10-20h30m-10-20h30" opacity=".4"/><circle cx="170" cy="80" r="25" fill="currentColor" opacity=".2"/><path d="M140 45h70m-15-12 15 12-15 12"/>',venn:'<rect x="40" y="15" width="210" height="120" rx="8" opacity=".3"/><circle cx="119" cy="75" r="44" fill="currentColor" fill-opacity=".12"/><circle cx="174" cy="75" r="44" fill="currentColor" fill-opacity=".12"/>',flask:'<path d="M117 20h46m-36 0v50l-35 54q-8 15 10 15h77q18 0 10-15l-36-54V20M106 105h68"/><circle cx="135" cy="92" r="4"/><circle cx="151" cy="117" r="5"/>',lens:'<path d="M140 15q-40 65 0 130 40-65 0-130Z" fill="currentColor" fill-opacity=".12"/><path d="M25 80h240M25 35l115 0 110 90M25 125l115 0L250 35" stroke-width="2"/>'};
if (typeof reflectionArt !== 'undefined') shapes.reflection = reflectionArt;
if (typeof parabolaArt !== 'undefined') shapes.parabola = parabolaArt;

const escapeCatalogText = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[character]);

const catalogModules = [...modules];
if (typeof location !== 'undefined' && location.protocol === 'file:' && typeof opticsDemo !== 'undefined') {
  catalogModules.unshift({...opticsDemo,art:'reflection',status:'ready',url:'makmal.html?id='+opticsDemo.id});
}

if (typeof module !== 'undefined' && module.exports) module.exports = modules;
if (typeof document !== 'undefined') setupCatalog();

function setupCatalog() {
  const $ = id => document.getElementById(id);
  const search = $('search');
  const level = $('level');
  const status = $('status');
  const subjectButtons = [...document.querySelectorAll('[data-filter]')];
  const subjectStyles = { Matematik: 'math', Fizik: 'physics', Kimia: 'chem' };
  let subject = '';
  let ratings = new Map();

  function renderCard(module) {
    const ready = module.status === 'ready';
    const href = module.url || 'simulasi.html?id=' + module.id;
    const lastWord = module.title.lastIndexOf(' ') + 1;
    return `<article class="card ${subjectStyles[module.subject]}">
      <div class="card-art">
        <svg viewBox="0 0 280 160" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">${shapes[module.art]}</svg>
      </div>
      <div class="card-content">
        <span class="portal-card-subject">${module.subject} · Tingkatan ${module.level}</span>
        <h3>${escapeCatalogText(module.title.slice(0,lastWord))}<span class="portal-title-end">${escapeCatalogText(module.title.slice(lastWord))} <span class="beta-label">(BETA)</span></span></h3>
        <p>${escapeCatalogText(module.desc)}</p>
        <span class="catalog-rating" data-catalog-rating="${module.id}" hidden><span aria-hidden="true">★</span> <span></span></span>
        <div class="card-foot">
          ${ready ? `<a href="${href}" aria-label="Buka simulasi ${escapeCatalogText(module.title)} (BETA)">Buka simulasi <span aria-hidden="true">↗</span></a>` : '<span class="portal-card-status">Coming soon</span>'}
        </div>
      </div>
    </article>`;
  }

  function updateRatingLabels() {
    document.querySelectorAll('[data-catalog-rating]').forEach(label => {
      const summary = ratings.get(label.dataset.catalogRating);
      label.hidden = !summary?.count;
      if (label.hidden) return;
      const average = summary.average.toLocaleString('ms-MY', { maximumFractionDigits: 1 });
      label.lastElementChild.textContent = `${average}/5 (${summary.count} penilaian)`;
    });
  }

  function render() {
    const terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const results = catalogModules.filter(module => {
      const searchable = [module.title, module.topic, module.desc, module.keywords, module.subject, 'Tingkatan ' + module.level].join(' ').toLocaleLowerCase();
      return (!subject || module.subject === subject)
        && (!level.value || String(module.level) === level.value)
        && (!status.value || module.status === status.value)
        && terms.every(term => searchable.includes(term));
    });
    $('cards').innerHTML = results.map(renderCard).join('');
    updateRatingLabels();
    $('empty').hidden = results.length !== 0;
    const total = catalogModules.filter(module => !subject || module.subject === subject).length;
    const count = results.length === total ? total : `${results.length} daripada ${total}`;
    const summary = subject ? `${count} simulasi ${subject}` : `${count} simulasi`;
    if ($('count').textContent !== summary) $('count').textContent = summary;
    $('catalog-title').textContent = subject ? 'Simulasi ' + subject : 'Semua simulasi';
    subjectButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === subject)));
  }

  function updateCounts() {
    document.querySelectorAll('[data-module-count]').forEach(label => {
      const category = label.dataset.moduleCount;
      label.textContent = catalogModules.filter(module => !category || module.subject === category).length;
    });
  }
  updateCounts();
  subjectButtons.forEach(button => {
    button.onclick = () => {
      subject = button.dataset.filter;
      render();
      const catalog = $('simulasi');
      catalog.focus({ preventScroll: true });
      catalog.scrollIntoView({ block: 'start' });
    };
  });
  [search, level, status].forEach(input => input.addEventListener('input', render));
  function clearFilters() {
    subject = '';
    search.value = '';
    level.value = '';
    status.value = '';
    render();
    search.focus();
  }
  $('clear').onclick = clearFilters;
  $('empty-clear').onclick = clearFilters;
  if (typeof location !== 'undefined' && typeof URLSearchParams === 'function') {
    const qp = new URLSearchParams(location.search);
    const s = qp.get('subjek');
    const lv = qp.get('tingkatan');
    if (s && subjectStyles[s]) subject = s;
    if (lv && (lv === '4' || lv === '5') && level) level.value = lv;
  }
  document.querySelectorAll('[data-footer-filter], [data-footer-level]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      subject = link.dataset.footerFilter || '';
      if (level) level.value = link.dataset.footerLevel || '';
      if (status) status.value = '';
      if (search) search.value = '';
      render();
      const catalog = $('simulasi');
      if (catalog) {
        if (catalog.focus) catalog.focus({ preventScroll: true });
        if (catalog.scrollIntoView) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  render();
  if (typeof location !== 'undefined' && location.protocol !== 'file:') {
    fetch('api/workbench').then(response=>response.ok?response.json():[]).then(items=>{
      if (!items.length) return;
      catalogModules.unshift(...items);
      updateCounts();
      render();
      document.dispatchEvent(new Event('makmal:catalog-updated'));
    }).catch(()=>{});
    fetch('api/ratings').then(response => {
      if (!response.ok) return [];
      return response.json();
    }).then(items => {
      ratings = new Map(items.map(item => [item.simulation, item]));
      if (ratings.size) updateRatingLabels();
    }).catch(() => {});
  }

}
