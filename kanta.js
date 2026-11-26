(function () {
  'use strict';
  const MD = window.KantaModel;
  const { clamp, fx, parseNum, niceMax, image, power, objCase, CASE_LABEL, SUMMARY, fitLine, RANKS, I18N, createMissions, micro, tele, cam, SENSOR } = MD;
  const T = I18N.ms;
  const byId = id => document.getElementById(id);
  const kq = id => byId(id) || { style: {}, textContent: '', innerHTML: '' };
  const $$ = s => Array.from(document.querySelectorAll(s));
  const FONT = '"Plus Jakarta Sans",system-ui,sans-serif';
  const OBJX = 5, LENS_MAX = 90, RL = 3;
  const COL = { obj: '#252137', real: '#c2336b', virt: '#7c3aed', r1: '#e08a00', r2: '#0e7490', r3: '#c2336b' };
  const LENS_ICON = {
    cembung: '<path d="M12 3c3.5 4 3.5 14 0 18c-3.5-4-3.5-14 0-18Z"/><path d="M3 12h18" stroke-opacity=".4"/>',
    cekung: '<path d="M8 3h8c-3 5-3 13 0 18H8c3-5 3-13 0-18Z"/><path d="M3 12h18" stroke-opacity=".4"/>'
  };
  const svgI = (p, s) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;

  /* ================= ALAT OPTIK (Bab 6.5) ================= */
  const INS = {
    mikro: { ms: 'Mikroskop majmuk', title: 'Alat optik: mikroskop majmuk', icon: '<path d="M9 3h6v4H9zM10 7l-1 9h6l-1-9M6 21h12M12 16v5"/>', tray: ['u', 'L'], panel: ['fo', 'fe'], def: { fo: 2, fe: 4, u: 2.6, L: 11 } },
    teleskop: { ms: 'Teleskop astronomi', title: 'Alat optik: teleskop astronomi', icon: '<path d="M3 14 17 6l2 4-14 8zM8 16l-2 5M12 14l2 7"/>', tray: ['a', 'L'], panel: ['fo', 'fe'], def: { fo: 40, fe: 5, a: 3, L: 45 } },
    kamera: { ms: 'Telefon pintar / CCTV', title: 'Alat optik: kamera telefon pintar & CCTV', icon: '<rect x="6" y="2" width="12" height="20" rx="3"/><circle cx="12" cy="7" r="2"/>', tray: ['u'], panel: ['f'], def: { f: 4.2, u: 3 } }
  };
  const VIEWS = [
    { k: 'rajah', lbl: 'Rajah sinar', icon: '<path d="M12 3c3 4 3 14 0 18c-3-4-3-14 0-18Z"/><path d="M2 8h10l9 8M2 16h10l9-8"/>' },
    { k: 'bangku', lbl: 'Bangku optik', icon: '<path d="M2 19h20"/><path d="M5 19v-8M12 19V8M19 19v-12"/><rect x="2.5" y="7" width="5" height="4" rx="1"/>' },
    { k: 'mikro', lbl: 'Mikroskop majmuk', inst: true },
    { k: 'teleskop', lbl: 'Teleskop astronomi', inst: true },
    { k: 'kamera', lbl: 'Telefon pintar / CCTV', inst: true }
  ];
  const PSPEC = {
    mikro: {
      u: { lbl: 'Jarak objek, uₒ', min: p => p.fo + 0.05, max: () => 4.5, step: 0.05, unit: 'cm', dp: 2 },
      L: { lbl: 'Jarak antara kanta, L', min: () => 6, max: () => 24, step: 0.1, unit: 'cm', dp: 1 },
      fo: { lbl: 'Fokus kanta objek, fₒ', min: () => 1, max: () => 2.5, step: 0.1, unit: 'cm', dp: 1 },
      fe: { lbl: 'Fokus kanta mata, fₑ', min: () => 3, max: () => 6, step: 0.1, unit: 'cm', dp: 1 }
    },
    teleskop: {
      a: { lbl: 'Sudut objek, α', min: () => 1, max: () => 6, step: 0.5, unit: '°', dp: 1 },
      L: { lbl: 'Jarak antara kanta, L', min: p => p.fo + 1, max: p => p.fo + p.fe + 12, step: 0.5, unit: 'cm', dp: 1 },
      fo: { lbl: 'Fokus kanta objek, fₒ', min: () => 20, max: () => 60, step: 1, unit: 'cm', dp: 0 },
      fe: { lbl: 'Fokus kanta mata, fₑ', min: () => 2, max: () => 10, step: 0.5, unit: 'cm', dp: 1 }
    },
    kamera: {
      u: { lbl: 'Jarak objek, u', min: () => 0.2, max: () => 10, step: 0.1, unit: 'm', dp: 1 },
      f: { lbl: 'Panjang fokus, f', min: () => 2, max: () => 12, step: 0.1, unit: 'mm', dp: 1 }
    }
  };
  const HO_CAM = 1.7;
  const defIns = () => JSON.parse(JSON.stringify({ mikro: INS.mikro.def, teleskop: INS.teleskop.def, kamera: INS.kamera.def }));

  /* ================= STATE ================= */
  const S = {
    view: 'rajah', type: 'cembung', fA: 10, u: 25, ho: 4, scr: 60, inst: 'mikro', ins: defIns(), insD: defIns(),
    uD: 25, fD: 10, hoD: 4, scrD: 60, half: 40,
    rec: [], opt: { r1: true, r2: true, r3: true, ext: true, lbl: true, dim: true, pulse: true },
    mode: 'lab', mission: null, locks: {}, hide: {}, phase: 0, drag: null, dirty: true, cur: null, sharpPrev: false
  };
  const sgn = () => (S.type === 'cembung' ? 1 : -1);
  const lk = k => !!S.locks[k];
  const hid = k => !!S.hide[k];
  const snap = (v, st) => +(Math.round(v / st) * st).toFixed(2);
  const sfmt = (x, d) => (x > 0 ? '+' : '') + fx(x, d);

  /* ================= PENGIRAAN ================= */
  function compute() {
    const f = sgn() * S.fD, u = S.uD, ho = S.hoD;
    const img = image(f, u, ho);
    const lensX = OBJX + u, scr = S.scrD;
    const vm = scr - lensX;
    const sharp = !img.inf && img.real && Math.abs(vm - img.v) <= 0.6;
    const hs = (-ho * vm) / u;
    const cs = objCase(f, u);
    return { f, u, ho, img, cs, bench: { lensX, scr, vm, sharp, hs } };
  }
  const info = () => (S.cur || compute());
  const insSettled = () => Object.keys(S.ins[S.inst]).every(k => Math.abs(S.insD[S.inst][k] - S.ins[S.inst][k]) < 0.005);
  const settled = () => (S.view === 'alat' ? insSettled() : true) && Math.abs(S.uD - S.u) < 0.01 && Math.abs(S.fD - S.fA) < 0.01 && Math.abs(S.hoD - S.ho) < 0.01 && Math.abs(S.scrD - S.scr) < 0.01;

  /* ================= API MISI ================= */
  const api = {
    setView: v => setView(v, true),
    setType: t => setType(t, true),
    setF: v => setF(v, true, true),
    setU: (v, now) => setU(v, true, now),
    setHo: v => setHo(v, true, true),
    setScr: v => { S.scr = S.scrD = clamp(v, 0, 100); S.dirty = true; syncAll(); },
    getRec: () => S.rec,
    setInst: k => setInst(k, true),
    setIns: (k, v) => { setIns(k, v, true); S.insD[S.inst][k] = S.ins[S.inst][k]; },
    getIns: k => S.ins[S.inst][k],
    info: () => compute(),
    settled
  };
  let MIS = [];
  try { MIS = createMissions(api); } catch (e) { console.error(e); }

  /* ================= SETTERS ================= */
  const uMax = () => (S.view === 'bangku' ? LENS_MAX - OBJX : 60);
  function setU(v, force, now) {
    if (lk('u') && !force) return;
    S.u = snap(clamp(v, S.view === 'bangku' ? 2 : 1, uMax()), 0.5);
    if (now) S.uD = S.u;
    if (S.view === 'bangku' && OBJX + S.u >= S.scr - 1) S.scr = Math.min(100, OBJX + S.u + 1);
    S.dirty = true; syncSliders(); hideHint();
  }
  function setHo(v, force, now) { if (lk('ho') && !force) return; S.ho = snap(clamp(v, 1, 8), 0.5); if (now) S.hoD = S.ho; S.dirty = true; syncSliders(); hideHint(); }
  function setF(v, force, now) { if (lk('f') && !force) return; S.fA = snap(clamp(v, 5, 20), 0.5); if (now) S.fD = S.fA; S.dirty = true; syncControls(); syncSliders(); }
  function setScr(v, force) { if (lk('scr') && !force) return; S.scr = snap(clamp(v, OBJX + S.u + 1, 100), 0.1); S.dirty = true; syncSliders(); hideHint(); }
  function setType(t, force) { if (lk('type') && !force) return; S.type = t; S.dirty = true; syncAll(); }
  function normIns() {
    const p = S.ins[S.inst], sp = PSPEC[S.inst];
    Object.keys(sp).forEach(k => { p[k] = snap(clamp(p[k], sp[k].min(p), sp[k].max(p)), sp[k].step); });
  }
  function setIns(k, v, force) {
    if ((lk('ins') || lk('ins_' + k)) && !force) return;
    S.ins[S.inst][k] = v; normIns(); S.dirty = true; syncInst(); hideHint();
  }
  function setInst(k, force) {
    if (lk('inst') && !force) return;
    S.inst = k; normIns(); S.dirty = true; syncAll();
  }
  function setView(v, force) {
    if (lk('view') && !force) return;
    S.view = v;
    if (v === 'rajah' && S.u > 60) setU(60, true, true);
    if (v === 'bangku' && S.scr <= OBJX + S.u + 1) S.scr = S.scrD = Math.min(100, OBJX + S.u + 20);
    S.dirty = true; syncAll();
    const h = byId('hint'); h.textContent = HINT[v]; h.classList.remove('hide');
  }
  const HINT = { rajah: '⬆ Seret objek, hujung anak panah atau titik F', bangku: '⬆ Seret kanta dan skrin sehingga imej pada skrin tajam', alat: 'Pilih alat optik dan ubah peluncur untuk melihat pembentukan imej' };
  function hideHint() { byId('hint').classList.add('hide'); }

  let toastT = 0;
  function toast(html) { const t = byId('toast'); t.innerHTML = html; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }

  function setStatusChip(text, tone) {
    const chip = byId('statusChip');
    if (!chip) return;
    chip.textContent = text;
    chip.className = 'kt-chip' + (tone ? ' ' + tone : '');
  }

  /* ================= UI SYNC ================= */
  function presetList() {
    const f = S.fA;
    if (S.view === 'alat') {
      const p = S.ins[S.inst];
      if (S.inst === 'mikro') {
        const r0 = micro(p.fo, p.fe, p.u, p.L);
        return [
          { lbl: 'Imej akhir pada 25 cm', go: () => setIns('L', r0.vo + (25 * p.fe) / (25 + p.fe)), on: Math.abs(r0.ve + 25) < 0.6 },
          { lbl: 'Imej akhir di infiniti', go: () => setIns('L', r0.vo + p.fe), on: Math.abs(r0.ue - p.fe) < 0.06 }
        ];
      }
      if (S.inst === 'teleskop') return [
        { lbl: 'Pelarasan normal', go: () => setIns('L', p.fo + p.fe), on: Math.abs(p.L - p.fo - p.fe) < 0.26 },
        { lbl: 'α = 2°', go: () => setIns('a', 2), on: p.a === 2 },
        { lbl: 'α = 5°', go: () => setIns('a', 5), on: p.a === 5 }
      ];
      return [['Telefon · 4.2 mm', 4.2], ['Telefoto · 9 mm', 9], ['CCTV · 2.8 mm', 2.8]].map(([l, v]) => ({ lbl: l, go: () => setIns('f', v), on: Math.abs(p.f - v) < 1e-6 }));
    }
    if (S.view === 'bangku') return [15, 20, 25, 30, 40].map(u => ({ lbl: `u = ${u}`, u, on: Math.abs(S.u - u) < 1e-6 }));
    if (S.type === 'cekung') return [[.5, '½|f|'], [1, '|f|'], [2, '2|f|'], [3, '3|f|']].map(([k, l]) => ({ lbl: `u = ${l}`, u: k * f, on: Math.abs(S.u - snap(k * f, .5)) < 1e-6 }));
    const cur = objCase(f, S.u);
    return [['u>2f', Math.min(60, 3 * f)], ['u=2f', 2 * f], ['f<u<2f', 1.5 * f], ['u=f', f], ['u<f', 0.5 * f]].map(([k, u]) => ({ lbl: CASE_LABEL[k], u, on: cur === k }));
  }
  function syncSliders() {
    const sa = byId('slider-a'), sb = byId('slider-b'), bench = S.view === 'bangku';
    const setP = (el, v, a, b) => el.style.setProperty('--p', ((v - a) / (b - a)) * 100 + '%');
    const hideObj = bench || S.view === 'alat';
    byId('rowA').hidden = byId('rowB').hidden = hideObj;
    const objGrp = byId('objGroup'); if (objGrp) objGrp.hidden = hideObj;
    byId('benchGroup').hidden = !bench;
    const sl = byId('slider-l'), ss = byId('slider-s');
    sl.value = OBJX + S.u; byId('out-l').textContent = fx(OBJX + S.u, 1) + ' cm'; setP(sl, OBJX + S.u, OBJX + 2, LENS_MAX);
    ss.value = S.scr; byId('out-s').textContent = fx(S.scr, 1) + ' cm'; setP(ss, S.scr, 8, 100);
    sl.disabled = byId('nudgeLM').disabled = byId('nudgeLP').disabled = lk('u');
    ss.disabled = byId('nudgeSM').disabled = byId('nudgeSP').disabled = lk('scr');
    if (bench) {
      byId('lblA').textContent = 'Kedudukan kanta';
      sa.min = OBJX + 2; sa.max = LENS_MAX; sa.step = 0.5; sa.value = OBJX + S.u;
      byId('out-a').textContent = fx(OBJX + S.u, 1) + ' cm'; setP(sa, OBJX + S.u, OBJX + 2, LENS_MAX);
      byId('lblB').textContent = 'Kedudukan skrin';
      sb.min = 8; sb.max = 100; sb.step = 0.1; sb.value = S.scr;
      byId('out-b').textContent = fx(S.scr, 1) + ' cm'; setP(sb, S.scr, 8, 100);
      sa.disabled = lk('u'); sb.disabled = lk('scr');
    } else {
      byId('lblA').textContent = 'Jarak objek, u';
      sa.min = 1; sa.max = 60; sa.step = 0.5; sa.value = S.u;
      byId('out-a').textContent = fx(S.u, 1) + ' cm'; setP(sa, S.u, 1, 60);
      byId('lblB').textContent = 'Tinggi objek, hₒ';
      sb.min = 1; sb.max = 8; sb.step = 0.5; sb.value = S.ho;
      byId('out-b').textContent = fx(S.ho, 1) + ' cm'; setP(sb, S.ho, 1, 8);
      sa.disabled = lk('u'); sb.disabled = lk('ho');
    }
    byId('nudgeM').disabled = byId('nudgeP').disabled = sa.disabled;
    byId('nudgeBM').disabled = byId('nudgeBP').disabled = sb.disabled;
    const sf = byId('slider-f'); sf.value = S.fA; sf.disabled = lk('f');
    byId('nudgeFM').disabled = byId('nudgeFP').disabled = sf.disabled;
    sf.style.setProperty('--p', ((S.fA - 5) / 15) * 100 + '%');
    byId('out-f').textContent = hid('f') ? '?' : fx(sgn() * S.fA, 1) + ' cm';
    // pratetap
    const pre = byId('angPre'), L = presetList();
    const sig = S.view + S.type + S.fA + S.inst + (S.view === 'alat' ? JSON.stringify(S.ins[S.inst]) : '');
    if (pre.dataset.sig !== sig) {
      pre.dataset.sig = sig; pre.innerHTML = '';
      L.forEach(p => { const b = document.createElement('button'); b.type = 'button'; b.className = 'kt-pre'; b.textContent = p.lbl; b.onclick = () => (p.go ? p.go() : setU(p.u)); pre.appendChild(b); });
      const rb = document.createElement('button'); rb.type = 'button'; rb.className = 'kt-pre icon'; rb.title = 'Set semula'; rb.setAttribute('aria-label', 'Set semula');
      rb.innerHTML = svgI('<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>', 16);
      rb.onclick = resetNow; pre.appendChild(rb);
      pre.style.setProperty('--n', L.length + 1);
    }
    Array.from(pre.children).forEach((b, k) => { if (k < L.length) { b.classList.toggle('on', L[k].on && !hid('f')); b.disabled = S.view === 'alat' ? lk('ins') : lk('u'); } });
    byId('autoBtn').hidden = !bench; byId('autoBtn').disabled = lk('auto');
    const trayActions = byId('trayActions');
    if (trayActions) trayActions.classList.toggle('is-empty', !bench);
    const alat = S.view === 'alat';
    byId('instRows').hidden = !alat;
    if (alat) { byId('rowA').hidden = byId('rowB').hidden = true; byId('benchGroup').hidden = true; }
    syncInst();
  }
  function rowHtml(k) {
    const sp = PSPEC[S.inst][k];
    return `<div class="kt-slider-row"><div class="slt"><label for="ins-${k}"><span>${sp.lbl}</span></label><span class="slt-r"><button type="button" class="kt-nudge" data-k="${k}" data-d="-1" aria-label="Kurangkan">−</button><output id="out-ins-${k}"></output><button type="button" class="kt-nudge" data-k="${k}" data-d="1" aria-label="Tambah">+</button></span></div><input id="ins-${k}" data-k="${k}" class="kt-range" type="range"></div>`;
  }
  function syncInst() {
    const alat = S.view === 'alat', box = byId('instRows'), pan = byId('instPanel');
    pan.hidden = !alat;
    if (!alat) return;
    if (box.dataset.inst !== S.inst) {
      box.dataset.inst = S.inst;
      box.innerHTML = INS[S.inst].tray.map(rowHtml).join('');
      pan.innerHTML = INS[S.inst].panel.map(rowHtml).join('');
    }
    const p = S.ins[S.inst], sp = PSPEC[S.inst];
    Object.keys(sp).forEach(k => {
      const el = byId('ins-' + k); if (!el) return;
      const s = sp[k], mn = s.min(p), mx = s.max(p);
      el.min = mn; el.max = mx; el.step = s.step; el.value = p[k];
      el.style.setProperty('--p', ((p[k] - mn) / (mx - mn)) * 100 + '%');
      byId('out-ins-' + k).textContent = fx(p[k], s.dp) + (s.unit === '°' ? '°' : ' ' + s.unit);
      const dis = lk('ins') || lk('ins_' + k);
      el.disabled = dis; $$(`.kt-nudge[data-k="${k}"]`).forEach(b => { b.disabled = dis; });
    });
  }
  function syncControls() {
    const tt = byId('typeTiles');
    if (!tt.childElementCount) {
      [['cembung', 'Kanta cembung'], ['cekung', 'Kanta cekung']].forEach(([k, l]) => {
        const b = document.createElement('button'); b.type = 'button'; b.dataset.t = k;
        b.innerHTML = svgI(LENS_ICON[k], 28) + `<span>${l}</span>`; b.onclick = () => setType(k); tt.appendChild(b);
      });
    }
    const vs = byId('viewStrip');
    if (!vs.childElementCount) {
      VIEWS.forEach(o => {
        const b = document.createElement('button'); b.type = 'button'; b.dataset.k = o.k;
        b.innerHTML = svgI(o.inst ? INS[o.k].icon : o.icon, 22) + `<span>${o.lbl}</span>`;
        b.onclick = () => { if (o.inst) { if (lk('view') && S.view !== 'alat') return; setView('alat'); setInst(o.k); } else setView(o.k); };
        vs.appendChild(b);
      });
    }
    const alat = S.view === 'alat';
    $$('#viewStrip button').forEach(b => {
      const o = VIEWS.find(v => v.k === b.dataset.k), on = o.inst ? alat && S.inst === o.k : S.view === o.k;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      b.disabled = !on && (lk('view') || (o.inst && alat && lk('inst')));
    });
    byId('typeGroup').hidden = alat; byId('fGroup').hidden = alat;
    $$('#typeTiles button').forEach(b => { const on = b.dataset.t === S.type; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.disabled = lk('type') && !on; });
    byId('typeName').textContent = S.type === 'cembung' ? 'Penumpu' : 'Pencapah';
    byId('visual-title').textContent = alat ? INS[S.inst].title : S.view === 'bangku' ? 'Eksperimen bangku optik' : `Rajah sinar kanta ${S.type}`;
    const f = sgn() * S.fA;
    byId('formula').innerHTML = hid('f') ? '1/f = 1/u + 1/v<br>P = 1 ÷ f (f dalam meter)'
      : `1/f = 1/u + 1/v<br>P = 1 ÷ ${fx(f / 100, 3)} m = ${hid('p') ? '?' : sfmt(power(f), 1) + ' D'}`;
    byId('lensInfo').innerHTML = `<div class="kt-formula">${S.type === 'cembung'
      ? 'Kanta cembung (penumpu): f positif. Sinar selari ditumpukan ke titik fokus nyata.'
      : 'Kanta cekung (pencapah): f negatif. Sinar selari dicapahkan seolah-olah dari titik fokus maya.'}</div>`;
    if (alat) {
      const p = S.ins[S.inst];
      byId('formula').innerHTML = S.inst === 'mikro' ? 'M = m₁ × m₂<br>fₒ &lt; fₑ, L &gt; fₒ + fₑ' : S.inst === 'teleskop' ? `M = fₒ ÷ fₑ = ${fx(p.fo / p.fe, 1)}<br>Pelarasan normal: L = fₒ + fₑ = ${fx(p.fo + p.fe, 1)} cm` : `Sudut pandangan = 2 tan⁻¹(${SENSOR} ÷ 2f)<br>Tinggi penderia imej = ${SENSOR} mm`;
      byId('lensInfo').innerHTML = `<div class="kt-formula">${S.inst === 'mikro' ? 'Kanta objek berkuasa tinggi (f pendek) membentuk imej pertama yang diperbesar; kanta mata bertindak sebagai kanta pembesar.' : S.inst === 'teleskop' ? 'Kanta objek berpanjang fokus panjang mengumpul cahaya dari objek jauh; kanta mata berpanjang fokus pendek membesarkan imej pertama.' : 'Kanta sangat kecil dengan f beberapa milimeter: modul kamera nipis, sudut pandangan lebar, dan fokus automatik dengan anjakan mikrometer.'}</div>`;
    }
    byId('rayNote').textContent = S.type === 'cembung'
      ? 'Sinar 1 terbias melalui F. Sinar 2 lurus melalui O. Sinar 3 melalui F lalu terbias selari dengan paksi utama.'
      : 'Sinar 1 terbias seolah-olah dari F. Sinar 2 lurus melalui O. Sinar 3 menuju F di sebelah sana lalu terbias selari.';
  }
  function syncAll() { syncControls(); syncSliders(); renderTable(); S.dirty = true; }

  /* ================= BACAAN ================= */
  function ciriTags(q) {
    const im = q.img;
    if (im.inf) return [['inf', 'Imej di infiniti']];
    return [[im.real ? 'real' : 'virt', im.real ? 'Nyata' : 'Maya'], [im.upright ? 'up' : 'inv', im.upright ? 'Tegak' : 'Songsang'],
      ['size', im.size === 'besar' ? 'Diperbesar' : im.size === 'kecil' ? 'Diperkecil' : 'Sama saiz']];
  }
  const tagHtml = tags => tags.map(([c, t]) => `<span class="kt-tag ${c}">${t}</span>`).join('');
  function setTele(items) { byId('tele').innerHTML = items.map(([l, v, q]) => `<div><dt>${l}</dt><dd class="${q ? 'q' : ''}">${v}</dd></div>`).join(''); }
  const sci3 = x => fx(x * 1000, 2) + ' × 10⁻³';
  function instReadouts() {
    const p = S.insD[S.inst], H = (k, v) => [hid(k) ? '?' : v, hid(k)];
    let tele_ = [], tags = [], pos = '';
    if (S.inst === 'mikro') {
      const r0 = micro(p.fo, p.fe, p.u, p.L);
      tele_ = [['Panjang fokus kanta objek, fₒ', fx(p.fo, 1) + ' cm'], ['Panjang fokus kanta mata, fₑ', fx(p.fe, 1) + ' cm'], ['Jarak objek, uₒ', fx(p.u, 2) + ' cm'], ['Jarak imej pertama, v₁', fx(r0.vo, 2) + ' cm'],
        ['Jarak I₁ ke kanta mata, u₂', fx(r0.ue, 2) + ' cm'], ['Jarak imej akhir, v₂', ...H('ve', r0.inf ? '∞' : fx(r0.ve, 2) + ' cm')], ['Pembesaran kanta objek, m₁', ...H('m1', fx(r0.m1, 2))],
        ['Pembesaran kanta mata, m₂', ...H('m2', r0.inf ? '∞' : fx(r0.m2, 2))], ['Pembesaran keseluruhan, M', ...H('M', r0.inf ? '∞' : fx(r0.M, 1))], ['Jarak antara kanta, L', fx(p.L, 1) + ' cm']];
      if (!r0.ok) { tags = [['inf', 'I₁ terbentuk selepas kanta mata']]; pos = 'Tambah jarak antara kanta supaya imej pertama berada di antara kanta.'; setStatusChip('Laraskan jarak L', 'bad'); }
      else if (r0.inf) { tags = [['inf', 'Imej akhir di infiniti'], ['inv', 'Songsang'], ['size', 'Diperbesar']]; pos = 'I₁ tepat di Fₑ: sinar keluar dari kanta mata selari.'; setStatusChip('Imej akhir di ∞', 'warn'); }
      else if (r0.finalReal) { tags = [['real', 'Nyata'], ['up', 'Tegak'], ['inf', 'Kanta mata terlalu jauh']]; pos = 'I₁ berada di luar Fₑ, jadi imej akhir nyata dan tidak boleh dilihat melalui kanta mata.'; setStatusChip('Kanta mata terlalu jauh', 'bad'); }
      else { tags = [['virt', 'Maya'], ['inv', 'Songsang'], ['size', 'Diperbesar']]; pos = `Imej akhir ${hid('ve') ? '?' : fx(Math.abs(r0.ve), 1)} cm di hadapan kanta mata. Imej pertama I₁: nyata, songsang, diperbesar.`; setStatusChip(`M = ${hid('M') ? '?' : fx(r0.M, 1)}×`, 'virt'); }
      kq('hudL');
    } else if (S.inst === 'teleskop') {
      const r0 = tele(p.fo, p.fe, p.L, p.a);
      tele_ = [['Panjang fokus kanta objek, fₒ', fx(p.fo, 0) + ' cm'], ['Panjang fokus kanta mata, fₑ', fx(p.fe, 1) + ' cm'], ['Jarak antara kanta, L', fx(p.L, 1) + ' cm'], ['fₒ + fₑ', fx(p.fo + p.fe, 1) + ' cm'],
        ['Sudut objek, α', fx(p.a, 1) + '°'], ['Sudut imej, β', fx(r0.beta, 1) + '°'], ['Pembesaran sudut, β ÷ α', fx(r0.M, 1)], ['Pembesaran, fₒ ÷ fₑ', fx(r0.Mth, 1)],
        ['Jarak imej akhir', r0.inf ? '∞' : fx(r0.ve, 1) + ' cm'], ['Pelarasan', r0.normal ? 'Normal' : 'Tidak normal']];
      if (r0.normal) { tags = [['inf', 'Imej akhir di infiniti'], ['virt', 'Maya'], ['inv', 'Songsang'], ['size', 'Diperbesar']]; pos = 'Pelarasan normal: I₁ di titik fokus kedua-dua kanta.'; setStatusChip('Pelarasan normal', 'ok'); }
      else if (r0.finalReal) { tags = [['real', 'Nyata'], ['up', 'Tegak']]; pos = 'L terlalu besar: imej akhir nyata, tidak sesuai untuk pemerhatian.'; setStatusChip('L terlalu besar', 'bad'); }
      else { tags = [['virt', 'Maya'], ['inv', 'Songsang'], ['size', 'Diperbesar']]; pos = `Imej akhir ${fx(Math.abs(r0.ve), 1)} cm di hadapan kanta mata. Laraskan L = fₒ + fₑ untuk pelarasan normal.`; setStatusChip('Tidak normal', 'warn'); }
    } else {
      const r0 = cam(p.f, p.u, HO_CAM);
      tele_ = [['Panjang fokus kanta, f', fx(p.f, 1) + ' mm'], ['Jarak objek, u', fx(p.u, 1) + ' m'], ['Jarak imej, v', ...H('v', fx(r0.v, 3) + ' mm')], ['Anjakan fokus, v − f', ...H('dv', fx(r0.delta, 1) + ' µm')],
        ['Tinggi objek, hₒ', fx(HO_CAM, 2) + ' m'], ['Tinggi imej, hᵢ', fx(r0.hi, 2) + ' mm'], ['Pembesaran, m', sci3(r0.m)], ['Sudut pandangan', fx(r0.fov, 0) + '°'],
        ['Tinggi penderia', SENSOR + ' mm'], ['Bingkai', r0.fits ? 'Objek muat' : 'Terpotong']];
      tags = [['real', 'Nyata'], ['inv', 'Songsang'], ['size', 'Diperkecil']];
      if (!r0.fits) tags.push(['inf', 'Objek terpotong']);
      pos = `Imej pada penderia imej, ${hid('v') ? '?' : fx(r0.v, 3) + ' mm'} dari kanta.`;
      setStatusChip(r0.fits ? `Sudut ${fx(r0.fov, 0)}° · Muat` : 'Objek terpotong', r0.fits ? 'ok' : 'bad');
    }
    setTele(tele_);
    byId('ciriTags').innerHTML = tagHtml(tags); byId('ciriPos').textContent = pos;
    $$('#sumRows tr').forEach(tr => tr.classList.remove('on'));
  }
  function readouts(q) {
    if (S.view === 'alat') return instReadouts();
    const im = q.img, b = q.bench, bench = S.view === 'bangku';
    const H = (k, v) => [hid(k) ? '?' : v, hid(k)];
    const vTxt = im.inf ? '∞' : fx(im.v, 1) + ' cm';
    const mVal = im.inf ? null : im.m;
    if (!bench) {
      kq('kLbl').textContent = 'Jarak imej, v';
      kq('kVal').textContent = hid('v') ? '?' : vTxt;
      kq('kUnit').textContent = hid('v') || hid('f') ? '1/f = 1/u + 1/v' : im.inf ? 'u = f: sinar terbias selari' : `1/v = 1/(${fx(q.f, 1)}) − 1/${fx(q.u, 1)}`;
      kq('kBar').style.width = (hid('m') || mVal == null ? 0 : clamp(mVal / 4, 0, 1) * 100) + '%';
      kq('kMini').innerHTML = `<span>m = ${hid('m') ? '?' : mVal == null ? '∞' : fx(mVal, 2)}</span><span>${im.inf ? 'Di infiniti' : im.real ? 'Imej nyata' : 'Imej maya'}</span>`;
      setTele([['Jarak objek, u', fx(q.u, 1) + ' cm'], ['Jarak imej, v', ...H('v', vTxt)], ['Panjang fokus, f', ...H('f', fx(q.f, 1) + ' cm')],
        ['Kuasa kanta, P', ...(hid('f') || hid('p') ? ['?', true] : [sfmt(power(q.f), 1) + ' D'])], ['Tinggi objek, hₒ', fx(q.ho, 1) + ' cm'],
        ['Tinggi imej, hᵢ', ...H('hi', im.inf ? '∞' : fx(Math.abs(im.hi), 2) + ' cm')], ['Pembesaran, m', ...H('m', mVal == null ? '∞' : fx(mVal, 2))],
        ['Kedudukan objek', ...H('f', CASE_LABEL[q.cs])]]);
      if (hid('f')) setStatusChip(im.inf ? 'Di infiniti' : im.real ? 'Imej nyata' : 'Imej maya', im.inf ? 'bad' : im.real ? 'ok' : 'virt');
      else if (S.type === 'cekung') setStatusChip('Kanta cekung · Maya', 'virt');
      else setStatusChip(`${CASE_LABEL[q.cs]} · ${im.inf ? 'Infiniti' : im.real ? 'Nyata' : 'Maya'}`, im.inf ? 'bad' : im.real ? 'ok' : 'virt');
    } else {
      const ok = b.sharp, mm = Math.abs(b.hs) / q.ho;
      kq('kLbl').textContent = 'Pembesaran linear, m';
      kq('kVal').textContent = ok ? fx(mm, 2) : '–';
      kq('kUnit').textContent = ok ? `m = v ÷ u = ${fx(b.vm, 1)} ÷ ${fx(q.u, 1)} = hᵢ ÷ hₒ` : 'm = v ÷ u = hᵢ ÷ hₒ';
      kq('kBar').style.width = (ok ? clamp(mm / 4, 0, 1) * 100 : 0) + '%';
      kq('kMini').innerHTML = `<span>u = ${fx(q.u, 1)} cm</span><span>${ok ? 'Imej tajam' : S.type === 'cekung' || !im.real ? 'Tiada imej nyata' : 'Imej kabur'}</span>`;
      setTele([['Kedudukan objek', OBJX.toFixed(1) + ' cm'], ['Kedudukan kanta', fx(b.lensX, 1) + ' cm'], ['Kedudukan skrin', fx(b.scr, 1) + ' cm'],
        ['Jarak objek, u', fx(q.u, 1) + ' cm'], ['Jarak skrin, v', fx(b.vm, 1) + ' cm'], ['Panjang fokus, f', ...H('f', fx(q.f, 1) + ' cm')],
        ['Tinggi imej, hᵢ', ok ? fx(Math.abs(b.hs), 2) + ' cm' : '–'], ['Keadaan imej', ok ? 'Tajam' : S.type === 'cekung' || !im.real ? 'Tiada pada skrin' : 'Kabur']]);
      setStatusChip(ok ? 'Imej tajam pada skrin' : S.type === 'cekung' || !im.real ? 'Tiada imej nyata' : 'Imej kabur', ok ? 'ok' : S.type === 'cekung' || !im.real ? 'virt' : 'warn');
    }
    const tags = ciriTags(q);
    let st = '';
    if (bench) st = b.sharp ? '<span class="kt-tag real">✓ Imej tajam pada skrin</span>' : S.type === 'cekung' || !im.real ? '<span class="kt-tag virt">Tiada imej nyata pada skrin</span>' : '<span class="kt-tag inf">Imej kabur: gerakkan skrin</span>';
    byId('ciriTags').innerHTML = st + (bench && !b.sharp && im.real && S.type === 'cembung' ? '' : tagHtml(tags));
    const row = SUMMARY.find(r => r.key === q.cs);
    byId('ciriPos').innerHTML = hid('f') ? (im.inf ? 'Sinar terbias selari.' : im.real ? 'Imej di sisi bertentangan dengan objek.' : 'Imej di sisi yang sama dengan objek.') : row ? `<b>Kedudukan imej:</b> ${row.img}.` : '';
    let ov = tagHtml(tags);
    if (bench) ov = b.sharp ? '<span class="kt-tag real">✓ Imej tajam pada skrin</span>' + ov
      : S.type === 'cekung' || !im.real ? '<span class="kt-tag virt">Tiada imej nyata pada skrin</span>' : '<span class="kt-tag inf">Imej kabur: gerakkan skrin</span>';
    kq('ciriOverlay').innerHTML = ov;
    $$('#sumRows tr').forEach(tr => tr.classList.toggle('on', !hid('f') && tr.dataset.k === q.cs && tr.dataset.l === S.type));
    if (!bench) {
      kq('hudL').innerHTML = `<span>u</span><b>${fx(q.u, 1)} cm</b><span>v</span><b>${hid('v') ? '?' : vTxt}</b>`;
      kq('hudR').innerHTML = `<span>m</span><b>${hid('m') ? '?' : mVal == null ? '∞' : fx(mVal, 2)}</b><span>hᵢ</span><b>${hid('hi') ? '?' : im.inf ? '∞' : fx(Math.abs(im.hi), 2) + ' cm'}</b>`;
    } else {
      kq('hudL').innerHTML = `<span>u</span><b>${fx(q.u, 1)} cm</b><span>v</span><b>${fx(b.vm, 1)} cm</b>`;
      kq('hudR').innerHTML = `<span>hₒ</span><b>${fx(q.ho, 1)} cm</b><span>hᵢ</span><b>${b.sharp ? fx(Math.abs(b.hs), 2) + ' cm' : '–'}</b>`;
      if (b.sharp && !S.sharpPrev) toast(T.toastSharp);
    }
    S.sharpPrev = bench && b.sharp;
  }

  /* ================= JADUAL ================= */
  function recordNow() {
    if (S.view === 'alat') return toast('Rekod data digunakan untuk rajah sinar dan bangku optik (Bab 6.3 dan 6.4).');
    if (!settled()) return toast(T.toastWait);
    const q = info(), im = q.img;
    let row;
    if (S.view === 'rajah') {
      if (im.inf) return toast(T.toastInf);
      row = { u: q.u, v: +im.v.toFixed(1), m: im.m };
    } else {
      if (S.type === 'cekung' || !im.real) return toast(T.toastConcave);
      if (!q.bench.sharp) return toast(T.toastBlur);
      row = { u: q.u, v: +q.bench.vm.toFixed(1), m: Math.abs(q.bench.hs) / q.ho };
    }
    if (S.rec.some(r => Math.abs(r.u - row.u) < 0.01)) return toast(T.toastDup);
    S.rec.push(row); toast(T.toastRec); renderTable(); S.dirty = true;
  }
  function renderTable() {
    const n = S.rec.length, cnt = byId('tab-record-count'); cnt.hidden = !n; cnt.textContent = n;
    byId('tRows').innerHTML = n ? S.rec.map((r, k) => `<tr><td>${k + 1}</td><td>${fx(r.u, 1)}</td><td>${fx(r.v, 1)}</td><td>${fx(1 / r.u, 3)}</td><td>${fx(1 / r.v, 3)}</td><td>${fx(r.m, 2)}</td></tr>`).join('')
      : '<tr class="empty"><td colspan="6">Belum ada data. Tekan Rekod data.</td></tr>';
  }
  function renderSummary() {
    byId('sumRows').innerHTML = SUMMARY.map(r => `<tr data-k="${r.key}" data-l="${r.lens}"><td>${r.lens === 'cembung' ? 'Cembung' : 'Cekung'}</td><td>${r.pos}</td><td>${r.img}</td><td>${r.ciri}</td><td>${r.guna}</td></tr>`).join('');
  }

  /* ================= KANVAS ================= */
  const stage = byId('stage'), sctx = stage.getContext('2d');
  const gcan = byId('graph'), gctx = gcan.getContext('2d');
  let W = 0, H = 0, FH = 0, GW = 0, GH = 0;
  function resize() {
    const wrap = byId('stageWrap'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = wrap.clientWidth; H = wrap.clientHeight;
    { const fh = parseFloat(getComputedStyle(wrap).getPropertyValue('--floor-h')); FH = isNaN(fh) ? 0 : fh; }
    stage.width = Math.round(W * dpr); stage.height = Math.round(H * dpr); sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gw = byId('graphWrap'); GW = gw.clientWidth; GH = gw.clientHeight;
    gcan.width = Math.round(GW * dpr); gcan.height = Math.round(GH * dpr); gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S.dirty = true;
  }
  function pill(ctx, text, x, y, o = {}) {
    ctx.font = `${o.w || 700} ${o.s || 12}px ${FONT}`;
    const w = ctx.measureText(text).width + 12, h = (o.s || 12) + 9;
    let px = x - (o.align === 'right' ? w : o.align === 'center' ? w / 2 : 0);
    px = clamp(px, 4, W - w - 4);
    ctx.fillStyle = o.bg || 'rgba(255,255,255,.92)';
    ctx.beginPath(); ctx.roundRect(px, y - h / 2, w, h, h / 2); ctx.fill();
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.fillStyle = o.color || '#252137'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(text, px + 6, y + .5);
  }
  function line(ctx, a, b, col, w, alpha, dash) {
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
  }
  function ray(ctx, a, b, col) {
    line(ctx, a, b, col, 7, .14); line(ctx, a, b, col, 2.6, 1);
    if (S.opt.pulse) { ctx.save(); ctx.setLineDash([4, 18]); ctx.lineDashOffset = -S.phase; line(ctx, a, b, '#fff', 1.4, .85); ctx.restore(); }
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = Math.atan2(b[1] - a[1], b[0] - a[0]);
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 40) {
      ctx.save(); ctx.translate(m[0], m[1]); ctx.rotate(d); ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  function arrow(ctx, x, y0, y1, col, o = {}) {
    const dir = Math.sign(y1 - y0) || -1, hl = Math.min(14, Math.abs(y1 - y0) * .45);
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = o.w || 4; ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1 - dir * hl * .6); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - 8, y1 - dir * hl); ctx.lineTo(x + 8, y1 - dir * hl); ctx.closePath();
    if (o.hollow) { ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha *= .35; ctx.fill(); } else ctx.fill();
    ctx.restore();
  }
  function grid(ctx, dh) {
    ctx.fillStyle = '#f6f3fb'; ctx.fillRect(0, 0, W, dh);
    ctx.strokeStyle = 'rgba(37,33,55,.06)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x < W; x += 28) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, dh); }
    for (let y = 0; y < dh; y += 28) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
    ctx.stroke();
  }
  function floor(ctx, dh) {
    if (FH <= 0) return;
    ctx.fillStyle = '#ebe6f5'; ctx.fillRect(0, dh, W, FH);
    ctx.strokeStyle = 'rgba(37,33,55,.18)'; ctx.beginPath(); ctx.moveTo(0, dh + .5); ctx.lineTo(W, dh + .5); ctx.stroke();
  }
  function lensShape(ctx, x, yT, yB, b, type, glass) {
    const cy = (yT + yB) / 2;
    ctx.beginPath();
    if (type === 'cembung') { ctx.moveTo(x, yT); ctx.quadraticCurveTo(x + 2 * b, cy, x, yB); ctx.quadraticCurveTo(x - 2 * b, cy, x, yT); }
    else { ctx.moveTo(x - b, yT); ctx.lineTo(x + b, yT); ctx.quadraticCurveTo(x + 6 - b, cy, x + b, yB); ctx.lineTo(x - b, yB); ctx.quadraticCurveTo(x - 6 + b, cy, x - b, yT); }
    ctx.closePath();
    ctx.fillStyle = glass || 'rgba(147,197,253,.38)'; ctx.fill();
    ctx.strokeStyle = 'rgba(37,99,235,.55)'; ctx.lineWidth = 1.6; ctx.stroke();
  }
  function ring(ctx, x, y, r) { ctx.save(); ctx.strokeStyle = 'rgba(245,158,11,.9)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.restore(); }

  /* ---------- rajah sinar ---------- */
  let RX = null;
  function drawRay(q) {
    const ctx = sctx, dh = H - FH, ax = dh * .5, f = q.f, u = q.u, ho = q.ho, im = q.img;
    const sx = (W / 2 - 30) / S.half, sy = (dh * .4) / 9.5;
    const X = x => W / 2 + x * sx, Y = y => ax - y * sy, Pt = p => [X(p[0]), Y(p[1])];
    RX = { sx, sy, ax };
    ctx.clearRect(0, 0, W, H); grid(ctx, dh);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, dh); ctx.clip();
    line(ctx, [0, ax], [W, ax], 'rgba(37,33,55,.55)', 1.4, 1);
    pill(ctx, 'Paksi utama', W - 8, ax - 13, { align: 'right', s: 10.5, bg: 'rgba(255,255,255,.7)', color: '#5c5670', w: 600 });
    const fa = Math.abs(f);
    // titik F dan 2F
    if (S.opt.lbl && !hid('f')) {
      [[-2 * fa, '2F'], [-fa, 'F'], [fa, 'F'], [2 * fa, '2F']].forEach(([x, l]) => {
        const p = [X(x), ax];
        ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 7); ctx.fill();
        ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(l, p[0], ax + 8);
      });
      if (!lk('f')) ring(ctx, X(fa), ax, 13);
    }
    // kanta
    const lh = 9.2;
    lensShape(ctx, W / 2, Y(lh), Y(-lh), S.type === 'cembung' ? 11 : 9, S.type);
    line(ctx, [W / 2, Y(lh) - 6], [W / 2, Y(-lh) + 6], 'rgba(37,99,235,.25)', 1, 1, [3, 4]);
    ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.arc(W / 2, ax, 3.5, 0, 7); ctx.fill();
    ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('O', W / 2 + 6, ax + 6);
    // sinar
    const P = [-u, ho], xR = S.half * 1.4, rays = [];
    const outEnd = (p0, d) => { const t = (xR - p0[0]) / d[0]; return [p0[0] + d[0] * t, p0[1] + d[1] * t]; };
    const sf = f > 0 ? 1 : -1;
    const d1 = [fa, -ho * sf];
    rays.push({ on: S.opt.r1, col: COL.r1, inc: [P, [0, ho]], out: [[0, ho], outEnd([0, ho], d1)], cons: sf < 0 ? [[[0, ho], [f, 0]]] : [] });
    rays.push({ on: S.opt.r2, col: COL.r2, inc: [P, [0, 0]], out: [[0, 0], outEnd([0, 0], [u, -ho])], cons: [] });
    if (Math.abs(u - f) > 0.05) {
      const y3 = (-ho * f) / (u - f), c3 = [];
      if (sf > 0 && u < f) c3.push([[-f, 0], P]);
      if (sf < 0) c3.push([[0, y3], [-f, 0]]);
      rays.push({ on: S.opt.r3, col: COL.r3, inc: [P, [0, y3]], out: [[0, y3], [xR, y3]], cons: c3 });
    }
    const virt = !im.inf && im.v < 0, IP = im.inf ? null : [im.v, im.hi];
    rays.forEach(r => {
      if (!r.on) return;
      ray(ctx, Pt(r.inc[0]), Pt(r.inc[1]), r.col);
      ray(ctx, Pt(r.out[0]), Pt(r.out[1]), r.col);
      if (S.opt.ext) {
        r.cons.forEach(c => line(ctx, Pt(c[0]), Pt(c[1]), r.col, 1.8, .75, [6, 5]));
        if (virt) line(ctx, Pt(r.out[0]), Pt(IP), r.col, 1.8, .75, [6, 5]);
      }
    });
    // objek
    const ob = [X(-u), ax], ot = [X(-u), Y(ho)];
    const imgLeftOfObj = virt && !im.inf && im.v < -u;
    arrow(ctx, ob[0], ob[1], ot[1], COL.obj, { w: 4.5 });
    if (imgLeftOfObj) {
      if (X(0) - ot[0] >= 58) pill(ctx, 'Objek', ot[0] + 10, (ax + ot[1]) / 2, { align: 'left', s: 11 });
      else pill(ctx, 'Objek', ob[0], ax + 22, { align: 'center', s: 11 });
    } else {
      pill(ctx, 'Objek', ot[0] - 12, (ax + ot[1]) / 2, { align: 'right', s: 11 });
    }
    if (!lk('ho')) ring(ctx, ot[0], ot[1], 12);
    // imej
    if (im.inf) {
      pill(ctx, 'Sinar terbias selari: imej terbentuk di infiniti', W / 2, 22, { align: 'center', s: 12, bg: '#ffe3d1', color: '#9f4122' });
    } else {
      const ix = X(im.v), iy = Y(im.hi);
      const inView = Math.abs(im.v) <= S.half * 1.02 && Math.abs(im.hi) < 12;
      if (inView) {
        arrow(ctx, ix, ax, iy, virt ? COL.virt : COL.real, virt ? { w: 3.5, dash: [6, 5], hollow: true } : { w: 4.5 });
        if (!hid('v')) {
          const pillY = im.hi < 0 ? Math.max((ax + iy) / 2, ax + 30) : Math.min((ax + iy) / 2, ax - 18);
          pill(ctx, virt ? 'Imej maya' : 'Imej nyata', imgLeftOfObj ? ix - 12 : ix + 12, pillY, { align: imgLeftOfObj ? 'right' : 'left', s: 11, bg: virt ? '#ede9fe' : '#fde4ee', color: virt ? '#5b21b6' : '#9d174d' });
        }
      } else {
        const right = im.v > 0, ex = right ? W - 12 : 12;
        pill(ctx, `${right ? '' : '← '}Imej di luar paparan: v = ${hid('v') ? '?' : fx(im.v, 1) + ' cm'}${right ? ' →' : ''}`, ex, 22, { align: right ? 'right' : 'left', s: 11.5, bg: '#fff2e2', color: '#855300' });
      }
    }
    // ukuran u dan v
    if (S.opt.dim) {
      const y1 = dh - 20;
      const dim = (x0, x1, y, txt, col) => {
        line(ctx, [x0, y], [x1, y], col, 1.4, .9); line(ctx, [x0, y - 6], [x0, y + 6], col, 1.4, .9); line(ctx, [x1, y - 6], [x1, y + 6], col, 1.4, .9);
        pill(ctx, txt, (x0 + x1) / 2, y, { align: 'center', s: 11, bg: '#fff', stroke: '#e1dbec', color: col });
      };
      dim(X(-u), W / 2, y1, `u = ${fx(u, 1)} cm`, '#252137');
      if (!im.inf && Math.abs(im.v) <= S.half * 1.02) dim(W / 2, X(im.v), y1 - (virt ? 28 : 0), `v = ${hid('v') ? '?' : fx(im.v, 1) + ' cm'}`, virt ? COL.virt : COL.real);
    }
    ctx.restore();
    floor(ctx, dh);
  }

  /* ---------- bangku optik ---------- */
  let BX = null;
  function drawBench(q) {
    const ctx = sctx, dh = H - FH, m = 34, im = q.img, b = q.bench;
    const sc = (W - 2 * m) / 100, X = x => m + x * sc;
    const ax = dh * .47, sy = clamp(dh * .02, 5.5, 10), Y = y => ax - y * sy, railY = dh * .84;
    BX = { X, sc, m, ax, sy, railY };
    ctx.clearRect(0, 0, W, H); grid(ctx, dh);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, dh); ctx.clip();
    // pembaris & landasan
    ctx.fillStyle = '#fff'; ctx.fillRect(X(0) - 6, railY - 30, X(100) - X(0) + 12, 30);
    ctx.strokeStyle = '#d9d2e8'; ctx.strokeRect(X(0) - 6 + .5, railY - 30 + .5, X(100) - X(0) + 11, 29);
    ctx.strokeStyle = '#252137'; ctx.fillStyle = '#5c5670'; ctx.font = `600 10px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let c = 0; c <= 100; c++) {
      const L = c % 10 === 0 ? 12 : c % 5 === 0 ? 8 : 4;
      if (sc < 4 && c % 5 && c % 10) continue;
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(c) + .5, railY - 30); ctx.lineTo(X(c) + .5, railY - 30 + L); ctx.stroke();
      if (c % 10 === 0) ctx.fillText(c, X(c), railY - 16);
    }
    ctx.fillStyle = '#3b3550'; ctx.beginPath(); ctx.roundRect(X(0) - 12, railY, X(100) - X(0) + 24, 14, 5); ctx.fill();
    pill(ctx, 'Pembaris meter (cm)', X(100), railY + 28, { align: 'right', s: 10.5, bg: 'rgba(255,255,255,.75)', color: '#5c5670', w: 600 });
    line(ctx, [X(0), ax], [X(100), ax], 'rgba(37,33,55,.25)', 1, 1, [4, 6]);
    // kon cahaya
    const lx = b.lensX, scr = b.scr;
    const yAt = (edge, x) => {
      if (im.inf) return edge + (-q.ho / q.u) * (x - lx);
      return edge + (im.hi - edge) * (x - lx) / im.v;
    };
    const T = [OBJX, q.ho];
    ctx.save(); ctx.fillStyle = 'rgba(251,191,36,.16)';
    ctx.beginPath(); ctx.moveTo(X(T[0]), Y(T[1])); ctx.lineTo(X(lx), Y(RL)); ctx.lineTo(X(lx), Y(-RL)); ctx.closePath(); ctx.fill();
    const ya = yAt(RL, scr), yb = yAt(-RL, scr);
    ctx.fillStyle = 'rgba(245,158,11,.2)';
    ctx.beginPath(); ctx.moveTo(X(lx), Y(RL)); ctx.lineTo(X(scr), Y(ya)); ctx.lineTo(X(scr), Y(yb)); ctx.lineTo(X(lx), Y(-RL)); ctx.closePath(); ctx.fill();
    ctx.restore();
    [[RL, ya], [-RL, yb]].forEach(([e, y]) => { line(ctx, [X(T[0]), Y(T[1])], [X(lx), Y(e)], '#e08a00', 1.3, .7); line(ctx, [X(lx), Y(e)], [X(scr), Y(y)], '#e08a00', 1.3, .7); });
    line(ctx, [X(T[0]), Y(T[1])], [X(scr), Y(b.hs)], COL.r2, 1.4, .8, [5, 5]);
    // objek bercahaya
    const bx = X(OBJX);
    const gl = ctx.createRadialGradient(bx, Y(q.ho / 2), 4, bx, Y(q.ho / 2), 70); gl.addColorStop(0, 'rgba(253,230,138,.65)'); gl.addColorStop(1, 'rgba(253,230,138,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(bx, Y(q.ho / 2), 70, 0, 7); ctx.fill();
    ctx.fillStyle = '#3b3550'; ctx.beginPath(); ctx.roundRect(bx - 26, Y(9), 24, Y(-3) - Y(9), 5); ctx.fill();
    ctx.fillStyle = '#fde68a'; ctx.fillRect(bx - 4, Y(9) + 3, 4, Y(-3) - Y(9) - 6);
    line(ctx, [bx - 14, Y(-3)], [bx - 14, railY], '#3b3550', 4, 1);
    arrow(ctx, bx + 3, ax, Y(q.ho), COL.obj, { w: 4 });
    pill(ctx, 'Objek bercahaya', bx - 14, Y(9) - 16, { align: 'center', s: 11 });
    // kanta
    lensShape(ctx, X(lx), Y(RL + .6), Y(-RL - .6), 7, S.type);
    line(ctx, [X(lx), Y(-RL - .6)], [X(lx), railY], '#3b3550', 4, 1);
    if (!lk('u')) ring(ctx, X(lx), Y(RL + .6) - 14, 10);
    pill(ctx, 'Kanta', X(lx), Y(RL + .6) - 32, { align: 'center', s: 11 });
    // imej maya (hantu)
    if (!im.inf && im.v < 0) {
      const vx = lx + im.v;
      if (vx > 0) { arrow(ctx, X(vx), ax, Y(im.hi), COL.virt, { w: 3, dash: [5, 5], hollow: true, alpha: .8 }); pill(ctx, 'Imej maya (dilihat melalui kanta)', X(vx), Y(Math.max(im.hi, 0)) - 18, { align: 'center', s: 10.5, bg: '#ede9fe', color: '#5b21b6' }); }
    }
    // skrin
    const sxp = X(scr), top = Y(12), bot = Y(-12);
    line(ctx, [sxp + 5, bot], [sxp + 5, railY], '#3b3550', 4, 1);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#cfc7e3'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(sxp, top, 10, bot - top, 3); ctx.fill(); ctx.stroke();
    // imej pada skrin
    const spot = Math.abs(ya - yb) * sy;
    if (S.type === 'cembung' && im.real && !im.inf) {
      const blur = b.sharp ? 0 : Math.min(18, spot / 2);
      ctx.save(); ctx.beginPath(); ctx.rect(sxp - 14, top, 30, bot - top); ctx.clip();
      if (blur > 0.5) ctx.filter = `blur(${blur.toFixed(1)}px)`;
      if (!b.sharp) { ctx.save(); ctx.filter = 'blur(6px)'; ctx.fillStyle = 'rgba(194,51,107,.28)'; ctx.beginPath(); ctx.ellipse(sxp - 1, Y((ya + yb) / 2 + b.hs / 2), 7, clamp(spot / 2 + Math.abs(b.hs) * sy / 2, 8, (bot - top) / 2), 0, 0, 7); ctx.fill(); ctx.restore(); }
      arrow(ctx, sxp - 2, ax, Y(clamp(b.hs, -11.5, 11.5)), COL.real, { w: 4, alpha: b.sharp ? 1 : clamp(1.3 - blur / 16, .45, .9) });
      ctx.restore();
    } else {
      ctx.save(); ctx.fillStyle = 'rgba(245,158,11,.25)'; ctx.filter = 'blur(8px)';
      ctx.beginPath(); ctx.ellipse(sxp + 2, Y((ya + yb) / 2), 8, clamp(spot / 2, 10, (bot - top) / 2), 0, 0, 7); ctx.fill(); ctx.restore();
    }
    if (!lk('scr')) ring(ctx, sxp + 5, top - 14, 10);
    pill(ctx, b.sharp ? 'Skrin ✓' : 'Skrin', sxp + 5, top - 32, { align: 'center', s: 11, bg: b.sharp ? '#d1fae5' : '#fff', color: b.sharp ? '#047857' : '#252137' });
    // ukuran
    if (S.opt.dim) {
      const y1 = railY - 46;
      const dim = (x0, x1, y, txt, col) => { line(ctx, [x0, y], [x1, y], col, 1.3, .9); line(ctx, [x0, y - 5], [x0, y + 5], col, 1.3, .9); line(ctx, [x1, y - 5], [x1, y + 5], col, 1.3, .9); pill(ctx, txt, (x0 + x1) / 2, y, { align: 'center', s: 11, bg: '#fff', stroke: '#e1dbec', color: col }); };
      dim(X(OBJX), X(lx), y1, `u = ${fx(q.u, 1)} cm`, '#252137');
      dim(X(lx), sxp, y1, `v = ${fx(b.vm, 1)} cm`, b.sharp ? COL.real : '#5c5670');
    }
    ctx.restore();
    floor(ctx, dh);
  }

  /* ---------- alat optik ---------- */
  function traceP(lenses, x0, y0, s, xEnd) {
    const pts = [[x0, y0]]; let x = x0, y = y0;
    lenses.forEach(L => { y += s * (L.x - x); x = L.x; pts.push([x, y]); s -= y / L.f; });
    y += s * (xEnd - x); pts.push([xEnd, y]);
    return { pts, s };
  }
  function drawRays2(ctx, P, pts, col, virtPt) {
    for (let k = 0; k < pts.length - 1; k++) ray(ctx, P(pts[k]), P(pts[k + 1]), col);
    if (virtPt && S.opt.ext) line(ctx, P(pts[pts.length - 2]), P(virtPt), col, 1.8, .75, [6, 5]);
  }
  function focal(ctx, P, x, lbl, ax) {
    const p = P([x, 0]); ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.arc(p[0], ax, 3.5, 0, 7); ctx.fill();
    ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(lbl, p[0], ax + 7);
  }
  function drawInst() {
    const ctx = sctx, dh = H - FH, p = S.insD[S.inst];
    ctx.clearRect(0, 0, W, H); grid(ctx, dh);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, dh); ctx.clip();
    if (S.inst === 'kamera') drawCam(ctx, dh, p); else drawScope(ctx, dh, p);
    ctx.restore();
  }
  function drawScope(ctx, dh, p) {
    const mic = S.inst === 'mikro';
    let lenses, r0, rays = [], xmin, xmax, I1, fin = null, h1;
    if (mic) {
      r0 = micro(p.fo, p.fe, p.u, p.L); lenses = [{ x: 0, f: p.fo }, { x: p.L, f: p.fe }];
      h1 = r0.h1; I1 = [r0.vo, h1];
      xmin = -p.u - 1.2; xmax = p.L + p.fe + 3.5;
      if (r0.ok && !r0.inf && !r0.finalReal && p.L + r0.ve > -40) { fin = [p.L + r0.ve, r0.hf]; xmin = Math.min(xmin, fin[0] - 1); }
      if (r0.ok && r0.finalReal) fin = [p.L + r0.ve, r0.hf];
      rays = [traceP(lenses, -p.u, 1, 0, xmax), traceP(lenses, -p.u, 1, -1 / p.u, xmax)];
    } else {
      r0 = tele(p.fo, p.fe, p.L, p.a); lenses = [{ x: 0, f: p.fo }, { x: p.L, f: p.fe }];
      const s = -Math.tan(p.a * Math.PI / 180), a = Math.max(1, 0.8 * Math.abs(r0.h1));
      xmin = -0.22 * p.L; xmax = p.L + Math.max(p.fe * 3.5, 0.22 * p.L);
      h1 = r0.h1; I1 = [p.fo, h1];
      rays = [a, 0, -a].map(yk => traceP(lenses, xmin, yk + s * xmin, s, xmax));
      if (!r0.inf && !r0.normal && r0.ve < 0 && p.L + r0.ve > xmin) fin = [p.L + r0.ve, h1 * (-r0.ve / r0.ue)];
    }
    // skala (menegak dibesarkan)
    let ymax = 0;
    rays.forEach(rr => rr.pts.slice(1, 3).forEach(q => { ymax = Math.max(ymax, Math.abs(q[1])); }));
    ymax = Math.max(ymax, mic ? 1 : 0, Math.abs(h1), fin && !(mic && r0.finalReal) ? Math.min(Math.abs(fin[1]), 4 * Math.max(1, Math.abs(h1))) : 0) * 1.15;
    const ax = dh * .5, sx = (W - 60) / (xmax - xmin), sy = (dh * .42) / ymax;
    const X = x => 30 + (x - xmin) * sx, Y = y => ax - y * sy, P = q => [X(q[0]), Y(q[1])];
    line(ctx, [0, ax], [W, ax], 'rgba(37,33,55,.55)', 1.4, 1);
    // kanta
    lenses.forEach((L, k) => {
      const hgt = Math.max(...rays.map(rr => Math.abs(rr.pts[k + 1][1]))) * 1.15 + ymax * .06;
      lensShape(ctx, X(L.x), Y(hgt), Y(-hgt), mic ? (k ? 9 : 7) : (k ? 7 : 11), 'cembung');
      pill(ctx, k ? 'Kanta mata' : 'Kanta objek', X(L.x), Y(hgt) - 14, { align: 'center', s: 11 });
    });
    if (S.opt.lbl) {
      const midClose = Math.abs(p.fo - (p.L - p.fe)) * sx < 24;
      if (-p.fo > xmin && -p.fo < xmax) focal(ctx, P, -p.fo, 'Fₒ', ax);
      if (midClose) {
        const mx = (p.fo + (p.L - p.fe)) / 2;
        if (mx > xmin && mx < xmax) focal(ctx, P, mx, 'Fₒ, Fₑ', ax);
      } else {
        if (p.fo > xmin && p.fo < xmax) focal(ctx, P, p.fo, 'Fₒ', ax);
        if (p.L - p.fe > xmin && p.L - p.fe < xmax) focal(ctx, P, p.L - p.fe, 'Fₑ', ax);
      }
      if (p.L + p.fe > xmin && p.L + p.fe < xmax) focal(ctx, P, p.L + p.fe, 'Fₑ', ax);
    }
    // sinar
    const cols = [COL.r1, COL.r2, COL.r3];
    const virt = fin && !r0.finalReal ? fin : null;
    rays.forEach((rr, k) => drawRays2(ctx, P, rr.pts, cols[k % 3], virt));
    // objek & imej
    if (mic) {
      arrow(ctx, X(-p.u), ax, Y(1), COL.obj, { w: 4 });
      pill(ctx, 'Objek', X(-p.u) - 10, Y(.5), { align: 'right', s: 11 });
    } else {
      pill(ctx, `Cahaya dari objek jauh · α = ${fx(p.a, 1)}°`, 10, 22, { s: 11.5, bg: '#fff2e2', color: '#855300' });
    }
    arrow(ctx, X(I1[0]), ax, Y(I1[1]), COL.real, { w: 3.5 });
    pill(ctx, 'I₁', X(I1[0]) + 8, (ax + Y(I1[1])) / 2, { s: 11, bg: '#fde4ee', color: '#9d174d' });
    if (fin && Math.abs(fin[1]) < ymax * 1.6) {
      const real = r0.finalReal;
      arrow(ctx, X(fin[0]), ax, Y(fin[1]), real ? COL.real : COL.virt, real ? { w: 3.5 } : { w: 3.2, dash: [6, 5], hollow: true });
      pill(ctx, real ? 'Imej akhir (nyata)' : 'Imej akhir (maya)', X(fin[0]) + 8, (ax + Y(fin[1])) / 2, { s: 11, bg: real ? '#fde4ee' : '#ede9fe', color: real ? '#9d174d' : '#5b21b6' });
    } else if (mic && r0.ok && !r0.inf && !r0.finalReal) {
      pill(ctx, `← Imej akhir di luar paparan: v₂ = ${hid('ve') ? '?' : fx(r0.ve, 1) + ' cm'}`, 10, 22, { s: 11.5, bg: '#fff2e2', color: '#855300' });
    }
    if ((mic && r0.inf) || (!mic && r0.normal)) pill(ctx, 'Sinar keluar selari: imej akhir di infiniti', W - 10, dh - 74, { align: 'right', s: 11.5, bg: '#d1fae5', color: '#047857' });
    if (!mic) pill(ctx, `β = ${fx(r0.beta, 1)}°`, X(p.L) + 72, ax + 24, { s: 11, bg: '#fff', stroke: '#e1dbec' });
    eye(ctx, [Math.min(W - 24, X(p.L) + 46), ax], Math.PI, .9);
    // ukuran L
    if (S.opt.dim) {
      const y = dh - 20, x0 = X(0), x1 = X(p.L);
      line(ctx, [x0, y], [x1, y], '#252137', 1.4, .9); line(ctx, [x0, y - 6], [x0, y + 6], '#252137', 1.4, .9); line(ctx, [x1, y - 6], [x1, y + 6], '#252137', 1.4, .9);
      pill(ctx, `L = ${fx(p.L, 1)} cm`, (x0 + x1) / 2, y, { align: 'center', s: 11, bg: '#fff', stroke: '#e1dbec' });
      if (mic) { const y2 = y - 26, xo = X(-p.u); line(ctx, [xo, y2], [x0, y2], '#252137', 1.2, .8); pill(ctx, `uₒ = ${fx(p.u, 2)} cm`, (xo + x0) / 2, y2, { align: 'center', s: 10.5, bg: '#fff', stroke: '#e1dbec' }); }
    }
    pill(ctx, 'Skala menegak dibesarkan', W - 10, dh - 48, { align: 'right', s: 10, bg: 'rgba(255,255,255,.75)', color: '#5c5670', w: 600 });
  }
  function eye(ctx, pt, ang, s) {
    s = s || 1; ctx.save(); ctx.translate(pt[0], pt[1]); ctx.rotate(ang || 0);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#252137'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 16 * s, 9 * s, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.arc(0, 0, 4.5 * s, 0, 7); ctx.fill(); ctx.restore();
  }
  function drawCam(ctx, dh, p) {
    const r0 = cam(p.f, p.u, HO_CAM), cctv = p.f <= 3.2;
    const wide = W > 640, splitX = wide ? W * .5 : W;
    const gy = wide ? dh * .78 : dh * .4;
    // pemandangan
    const sx0 = 30, devX = wide ? splitX - 60 : W - 70;
    ctx.fillStyle = '#e7f3e8'; ctx.fillRect(0, gy, splitX, 6);
    const hp = wide ? dh * .38 : dh * .22, ox = sx0 + 20;
    ctx.save(); ctx.fillStyle = '#634395';
    ctx.beginPath(); ctx.arc(ox, gy - hp + 10, 10, 0, 7); ctx.fill();
    ctx.fillRect(ox - 7, gy - hp + 22, 14, hp - 22); ctx.restore();
    arrow(ctx, ox + 24, gy, gy - hp, COL.obj, { w: 3 });
    pill(ctx, `hₒ = ${HO_CAM} m`, ox + 32, gy - hp / 2, { s: 11 });
    const lensP = [devX, gy - hp * .45];
    ctx.save(); ctx.fillStyle = 'rgba(245,158,11,.14)'; ctx.beginPath(); ctx.moveTo(ox, gy - hp); ctx.lineTo(lensP[0], lensP[1]); ctx.lineTo(ox, gy); ctx.closePath(); ctx.fill(); ctx.restore();
    line(ctx, [ox, gy - hp], lensP, '#e08a00', 1.4, .8); line(ctx, [ox, gy], lensP, '#e08a00', 1.4, .8);
    if (cctv) {
      ctx.fillStyle = '#3b3550'; ctx.beginPath(); ctx.roundRect(devX - 6, lensP[1] - 14, 46, 28, 8); ctx.fill();
      line(ctx, [devX + 30, lensP[1] - 14], [devX + 30, lensP[1] - 40], '#3b3550', 4, 1);
    } else {
      ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.roundRect(devX - 4, lensP[1] - 50, 24, 100, 6); ctx.fill();
    }
    ctx.fillStyle = '#93c5fd'; ctx.beginPath(); ctx.arc(devX, lensP[1], 5, 0, 7); ctx.fill();
    pill(ctx, cctv ? 'Kamera CCTV' : 'Telefon pintar', devX + 8, lensP[1] + 64, { align: 'center', s: 11 });
    const dy = gy + 26;
    line(ctx, [ox, dy], [devX, dy], '#252137', 1.3, .9); line(ctx, [ox, dy - 6], [ox, dy + 6], '#252137', 1.3, .9); line(ctx, [devX, dy - 6], [devX, dy + 6], '#252137', 1.3, .9);
    pill(ctx, `u = ${fx(p.u, 1)} m (tidak ikut skala)`, (ox + devX) / 2, dy, { align: 'center', s: 11, bg: '#fff', stroke: '#e1dbec' });
    // modul kamera (dibesarkan)
    const bx = wide ? splitX + 16 : 16, by = wide ? 46 : gy + 60, bw = (wide ? W - splitX : W) - 32, bh = wide ? dh - 92 : dh - by - 20;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e1dbec'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 14); ctx.fill(); ctx.stroke();
    pill(ctx, 'Modul kamera (dibesarkan)', bx + 10, by - 2 + 16, { s: 11, bg: '#f1edf8', color: '#3b3550' });
    const px = Math.min((bw - 90) / 12.5, (bh - 60) / (SENSOR * 1.25)), cy = by + bh / 2 + 10, lx = bx + 50;
    const Xm = mm => lx + mm * px, Ym = mm => cy - mm * px;
    line(ctx, [bx + 8, cy], [bx + bw - 8, cy], 'rgba(37,33,55,.4)', 1.2, 1);
    const A = Math.min(p.f / 1.8 / 2, SENSOR / 2 * .8);
    const sxp = Xm(r0.v), hi = -Math.min(r0.hi, SENSOR / 2 * 1.4);
    ctx.save(); ctx.fillStyle = 'rgba(245,158,11,.18)';
    ctx.beginPath(); ctx.moveTo(Xm(0), Ym(A)); ctx.lineTo(sxp, Ym(hi)); ctx.lineTo(Xm(0), Ym(-A)); ctx.closePath(); ctx.fill(); ctx.restore();
    [A, -A].forEach(a => { line(ctx, [bx + 8, Ym(a)], [Xm(0), Ym(a)], '#e08a00', 1.4, .8); line(ctx, [Xm(0), Ym(a)], [sxp, Ym(hi)], '#e08a00', 1.6, .9); });
    line(ctx, [bx + 8, Ym((hi / r0.v) * -((Xm(0) - bx - 8) / px))], [sxp, Ym(hi)], COL.r2, 1.6, .9, [5, 4]);
    lensShape(ctx, Xm(0), Ym(A + .4), Ym(-A - .4), Math.max(4, A * px * .35), 'cembung');
    ctx.fillStyle = '#e8e3f3'; ctx.strokeStyle = '#3b3550'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(sxp, Ym(SENSOR / 2), 8, SENSOR * px); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(sxp - 12, Ym(SENSOR / 2), 22, SENSOR * px); ctx.clip();
    arrow(ctx, sxp - 2, cy, Ym(hi), COL.real, { w: 3.5 }); ctx.restore();
    pill(ctx, 'Penderia imej', sxp + 4, Ym(SENSOR / 2) - 14, { align: 'center', s: 10.5 });
    pill(ctx, `f = ${fx(p.f, 1)} mm`, Xm(0), Ym(A + .4) - 14, { align: 'center', s: 10.5 });
    const yb = by + bh - 18;
    line(ctx, [Xm(0), yb], [sxp, yb], COL.real, 1.3, .9); line(ctx, [Xm(0), yb - 5], [Xm(0), yb + 5], COL.real, 1.3, .9); line(ctx, [sxp, yb - 5], [sxp, yb + 5], COL.real, 1.3, .9);
    pill(ctx, `v = ${hid('v') ? '?' : fx(r0.v, 3) + ' mm'}`, (Xm(0) + sxp) / 2, yb, { align: 'center', s: 10.5, bg: '#fff', stroke: '#e1dbec', color: COL.real });
    pill(ctx, `Anjakan fokus: ${hid('dv') ? '?' : fx(r0.delta, 1) + ' µm'}`, bx + bw - 10, by + 16, { align: 'right', s: 10.5, bg: '#fff2e2', color: '#855300' });
    pill(ctx, `Sudut pandangan ${fx(r0.fov, 0)}°`, bx + bw - 10, by + 40, { align: 'right', s: 10.5, bg: '#e0f2fe', color: '#0e7490' });
    if (!r0.fits) pill(ctx, 'Imej lebih tinggi daripada penderia: objek terpotong', bx + bw / 2, by + bh - 44, { align: 'center', s: 10.5, bg: '#ffe3d1', color: '#9f4122' });
  }

  /* ---------- graf 1/v melawan 1/u ---------- */
  function drawGraph(q) {
    const ctx = gctx; ctx.clearRect(0, 0, GW, GH);
    const l = 54, b = 30, t = 12, r = 14, pw = GW - l - r, ph = GH - t - b;
    const f = q.f, inv = 1 / f, pts = S.rec.map(r2 => ({ x: 1 / r2.u, y: 1 / r2.v }));
    let live = null;
    if (S.view === 'alat') live = null;
    else if (S.view === 'rajah' && !q.img.inf) live = { x: 1 / q.u, y: 1 / q.img.v };
    if (S.view === 'bangku' && q.bench.sharp) live = { x: 1 / q.u, y: 1 / q.bench.vm };
    const showT = !hid('f');
    let xmax = niceMax(Math.max(showT ? 1.35 * Math.abs(inv) : 0.1, live ? live.x * 1.1 : 0, ...pts.map(p => p.x), 0.05));
    let ys = [0].concat(pts.map(p => p.y));
    if (showT) ys.push(inv, inv - xmax);
    if (live && live.x <= xmax) ys.push(live.y);
    let ymin = Math.min(...ys), ymax = Math.max(...ys);
    const pad = (ymax - ymin || .1) * .1; ymin -= pad; ymax += pad;
    const X = v => l + (v / xmax) * pw, Y = v => t + ph - ((v - ymin) / (ymax - ymin)) * ph;
    ctx.font = `600 10px ${FONT}`; ctx.fillStyle = '#5c5670'; ctx.strokeStyle = '#ede8f6'; ctx.lineWidth = 1;
    for (let k = 0; k <= 5; k++) { const v = xmax * k / 5; ctx.beginPath(); ctx.moveTo(X(v), t); ctx.lineTo(X(v), t + ph); ctx.stroke(); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(fx(v, xmax / 5 < .01 ? 3 : xmax / 5 < .1 ? 2 : 1), X(v), t + ph + 4); }
    const ystep = niceMax((ymax - ymin) / 5);
    for (let v = Math.ceil(ymin / ystep) * ystep; v <= ymax; v += ystep) { ctx.beginPath(); ctx.moveTo(l, Y(v)); ctx.lineTo(l + pw, Y(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(fx(v, ystep < .01 ? 3 : ystep < .1 ? 2 : 1), l - 5, Y(v)); }
    ctx.strokeStyle = '#252137'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(l, t); ctx.lineTo(l, t + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(l, Y(0)); ctx.lineTo(l + pw, Y(0)); ctx.stroke();
    ctx.fillStyle = '#252137'; ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('1/u (cm⁻¹)', l + pw, GH - 2);
    ctx.save(); ctx.translate(11, t + 4); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('1/v (cm⁻¹)', 0, 0); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(l, t, pw, ph); ctx.clip();
    if (showT) { ctx.setLineDash([5, 4]); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(inv)); ctx.lineTo(X(xmax), Y(inv - xmax)); ctx.stroke(); ctx.setLineDash([]); }
    const fit = fitLine(pts);
    if (fit) { ctx.strokeStyle = '#047857'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X(0), Y(fit.a)); ctx.lineTo(X(xmax), Y(fit.a + fit.b * xmax)); ctx.stroke(); }
    pts.forEach(p => { ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#855300'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 5, 0, 7); ctx.fill(); ctx.stroke(); });
    if (live && live.x <= xmax) { ctx.fillStyle = '#252137'; ctx.beginPath(); ctx.arc(X(live.x), Y(live.y), 5.5, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();
    let note;
    if (fit && pts.length >= 2) note = `Garis hijau: kecerunan ≈ ${fx(fit.b, 2)}, pintasan-y ≈ ${fx(fit.a, 3)} cm⁻¹ → f ≈ ${fx(1 / fit.a, 1)} cm.`;
    else note = showT ? `Garis putus-putus: 1/v = 1/f − 1/u. Rekod ≥ 2 titik untuk garis padanan.` : 'Rekod sekurang-kurangnya 2 titik imej tajam untuk melukis graf.';
    byId('graphNote').textContent = note;
  }

  /* ================= INTERAKSI ================= */
  function hitTest(px, py) {
    if (S.view === 'alat') return null;
    const q = info();
    if (S.view === 'rajah' && RX) {
      const ax = RX.ax, X = x => W / 2 + x * RX.sx, Y = y => ax - y * RX.sy;
      const ox = X(-q.u), oy = Y(q.ho);
      if (!lk('ho') && Math.hypot(px - ox, py - oy) < 18) return 'ho';
      if (!lk('u') && Math.abs(px - ox) < 16 && py > oy - 6 && py < ax + 16) return 'u';
      if (!lk('f') && !hid('f') && S.opt.lbl && Math.hypot(px - X(Math.abs(q.f)), py - ax) < 18) return 'f';
    }
    if (S.view === 'bangku' && BX) {
      const { X, ax, sy, railY } = BX;
      if (!lk('u') && Math.abs(px - X(q.bench.lensX)) < 18 && py > ax - (RL + 3) * sy && py < railY) return 'lens';
      if (!lk('scr') && Math.abs(px - X(q.bench.scr) - 5) < 18 && py > ax - 14 * sy && py < railY) return 'scr';
    }
    return null;
  }
  function pos(e) { const rc = stage.getBoundingClientRect(); return [e.clientX - rc.left, e.clientY - rc.top]; }
  stage.addEventListener('pointerdown', e => {
    const [px, py] = pos(e), h = hitTest(px, py); if (!h) return;
    S.drag = h; stage.setPointerCapture(e.pointerId); stage.style.cursor = 'grabbing'; hideHint(); e.preventDefault();
  });
  stage.addEventListener('pointermove', e => {
    const [px, py] = pos(e);
    if (!S.drag) { stage.style.cursor = hitTest(px, py) ? 'grab' : 'default'; return; }
    if (S.view === 'rajah') {
      const wx = (px - W / 2) / RX.sx, wy = (RX.ax - py) / RX.sy;
      if (S.drag === 'u') { setU(Math.min(-wx, S.half * .98)); S.uD = S.u; }
      if (S.drag === 'ho') { setHo(wy); S.hoD = S.ho; }
      if (S.drag === 'f') { setF(Math.abs(wx)); S.fD = S.fA; }
    } else {
      const wx = (px - BX.m) / BX.sc;
      if (S.drag === 'lens') { setU(wx - OBJX); S.uD = S.u; S.scrD = S.scr; }
      if (S.drag === 'scr') { setScr(wx - 5 / BX.sc); S.scrD = S.scr; }
    }
  });
  const endDrag = () => { S.drag = null; stage.style.cursor = 'default'; };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('touchstart', e => { if (e.touches[0]) { const [px, py] = pos(e.touches[0]); if (hitTest(px, py)) e.preventDefault(); } }, { passive: false });
  stage.addEventListener('keydown', e => {
    const k = e.shiftKey ? 5 : 1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { nudgeA(-k); e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { nudgeA(k); e.preventDefault(); }
  });
  function nudgeA(k) { setU(S.u + (S.view === 'bangku' ? k : -k) * 0.5); }
  function nudgeB(k) { if (S.view === 'bangku') setScr(S.scr + k * 0.1); else setHo(S.ho + k * 0.5); }

  function bindTabGroup(el) {
    const tabs = Array.from(el.querySelectorAll('[role=tab]'));
    const select = t => { tabs.forEach(b => { const on = b === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; const p = byId(b.getAttribute('aria-controls')); if (p) on ? p.removeAttribute('inert') : p.setAttribute('inert', ''); }); S.dirty = true; };
    tabs.forEach((b, i) => { b.addEventListener('click', () => select(b)); b.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; select(n); n.focus(); } }); });
    return select;
  }
  const selAnalysis = bindTabGroup(byId('analysis-tabs'));
  const selControl = bindTabGroup(byId('kt-tabs'));

  /* ================= BUNYI & KONFETI ================= */
  let actx = null;
  function beep(fq, d, type) { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = type || 'sine'; o.frequency.value = fq; g.gain.value = .05; g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + d); o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + d); } catch (_) {} }
  const sfx = { ok() { beep(660, .15); setTimeout(() => beep(880, .25), 120); }, err() { beep(200, .2, 'square'); } };
  function confetti() {
    const cv = byId('ghost'), c = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
    const ps = Array.from({ length: 90 }, () => ({ x: innerWidth / 2, y: innerHeight * .4, vx: (Math.random() - .5) * 12, vy: -Math.random() * 12 - 3, c: ['#f59e0b', '#fbbf24', '#7c3aed', '#0e7490', '#047857'][Math.floor(Math.random() * 5)], s: 4 + Math.random() * 5 }));
    let n = 0;
    (function fr() { c.clearRect(0, 0, cv.width, cv.height); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .4; c.fillStyle = p.c; c.fillRect(p.x, p.y, p.s, p.s); }); if (++n < 80) requestAnimationFrame(fr); else c.clearRect(0, 0, cv.width, cv.height); })();
  }

  /* ================= MISI ================= */
  let prog = { stars: {}, xp: 0 };
  try { const s = localStorage.getItem('kanta-prog-v1'); if (s) prog = JSON.parse(s); } catch (_) {}
  const saveProg = () => { try { localStorage.setItem('kanta-prog-v1', JSON.stringify(prog)); } catch (_) {} };
  const starsHtml = n => [1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('');
  function resetLab() {
    Object.assign(S, { inst: 'mikro', ins: defIns(), insD: defIns(), view: 'rajah', type: 'cembung', fA: 10, u: 25, ho: 4, scr: 60, uD: 25, fD: 10, hoD: 4, scrD: 60, rec: [], locks: {}, hide: {}, sharpPrev: false });
  }
  function resetNow() { if (S.mission) { startMission(S.mission.i); return; } resetLab(); syncAll(); toast(T.toastReset); }
  function setMode(m) {
    if (S.mode === m) return;
    S.mode = m;
    $$('#modeTabs button').forEach(b => { const on = b.dataset.m === m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    S.mission = null; resetLab(); syncAll(); renderBanner();
    byId('hint').textContent = HINT[S.view]; byId('hint').classList.remove('hide');
    if (m === 'chal') openList();
  }
  let winTimer = 0;
  function startMission(i) {
    clearTimeout(winTimer); resetLab();
    const d = MIS[i].gen();
    S.mission = { i, d, tries: 0, hint: false, ok: false, hold: 0 };
    d.setup(); S.locks = d.lock || {}; S.hide = d.hide || {};
    closeSheets(); byId('mInput').value = ''; missionFb('', ''); hideHint();
    selAnalysis(byId('tab-graph')); selControl(byId('tab-lens'));
    syncAll(); renderBanner();
    setTimeout(() => byId('missionBar').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
  function missionFb(msg, cls) { const f = byId('mFb'); f.className = 'mfb ' + (cls || ''); f.textContent = msg; }
  function renderBanner() {
    const mb = byId('missionBar'); mb.hidden = S.mode !== 'chal';
    if (S.mode !== 'chal') return;
    const q = S.mission;
    if (!q) { byId('mNum').textContent = '?'; byId('mTitle').textContent = T.mSelectTitle; byId('mStars').innerHTML = ''; byId('mText').innerHTML = T.mEmpty; byId('mAns').hidden = true; byId('mProg').hidden = true; return; }
    byId('mNum').textContent = q.i + 1; byId('mTitle').textContent = MIS[q.i].t;
    byId('mStars').innerHTML = starsHtml(prog.stars[q.i] || 0);
    byId('mText').innerHTML = q.d.text(); byId('mUnit').textContent = q.d.unit || '';
    byId('mAns').hidden = q.d.kind !== 'num'; byId('mProg').hidden = q.d.kind !== 'state';
  }
  function submitAnswer() {
    const q = S.mission; if (!q || q.ok || q.d.kind === 'state') return;
    const need = q.d.need && q.d.need();
    if (need) { missionFb(need, 'info'); sfx.err(); return; }
    const inp = byId('mInput'), u = parseNum(inp.value);
    const shake = () => { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); };
    if (!isFinite(u)) { missionFb(T.errNum, 'err'); shake(); return; }
    const a = q.d.ans(), tol = q.d.tol(a);
    if (Math.abs(u - a) <= tol) { winMission(); return; }
    q.tries++; sfx.err(); shake();
    if (q.d.signHint && Math.abs(-u - a) <= tol) { missionFb(`${T.errSign} ${T.errTryAgain.replace('{n}', q.tries)}`, 'err'); return; }
    let msg = u > a ? T.errTooBig : T.errTooSmall;
    if (Math.abs(u) > Math.abs(a) * 8 || Math.abs(u) < Math.abs(a) / 8) msg += T.errUnit;
    missionFb(`${msg} ${T.errTryAgain.replace('{n}', q.tries)}` + (q.tries >= 2 && !q.hint ? T.errHintTip : ''), 'err');
  }
  function winMission() {
    const q = S.mission; if (!q || q.ok) return; q.ok = true;
    let stars = q.tries === 0 ? 3 : q.tries === 1 ? 2 : 1;
    if (q.hint) stars = Math.max(1, stars - 1);
    const prev = prog.stars[q.i] || 0, gain = Math.max(0, stars - prev) * 100;
    if (stars > prev) prog.stars[q.i] = stars;
    prog.xp += gain; saveProg(); sfx.ok(); confetti();
    byId('winStars').innerHTML = starsHtml(stars);
    byId('winTitle').textContent = stars === 3 ? T.winPerfect : T.winGood;
    byId('winXp').textContent = gain ? `+${gain} XP` : T.winRepeat;
    byId('winExpl').innerHTML = `<b>${T.winSolution}</b><br>${q.d.expl()}`;
    byId('winNext').style.display = q.i < MIS.length - 1 ? '' : 'none';
    winTimer = setTimeout(() => byId('winSheet').classList.add('show'), 700);
    renderBanner();
  }
  function rankInfo() {
    let r = 0; RANKS.forEach((q, i) => { if (prog.xp >= q[0]) r = i; });
    const lo = RANKS[r][0], hi = RANKS[r + 1] ? RANKS[r + 1][0] : null;
    return { name: RANKS[r][1], hi, pct: hi ? ((prog.xp - lo) / (hi - lo)) * 100 : 100 };
  }
  function openList() {
    const g = byId('mGrid'); g.innerHTML = '';
    MIS.forEach((m, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mcard'; b.innerHTML = `<em>${m.ic}</em><span><b>${i + 1}. ${m.t}</b><small>${m.s}</small><div class="stars" style="font-size:13px">${starsHtml(prog.stars[i] || 0)}</div></span>`; b.onclick = () => startMission(i); g.appendChild(b); });
    const r = rankInfo();
    byId('rankName').textContent = r.name;
    byId('rankXp').textContent = `${prog.xp} XP · ` + (r.hi ? `${r.hi - prog.xp} ${T.rankNext}` : T.rankMax);
    byId('xpFill').style.width = r.pct + '%';
    byId('listSheet').classList.add('show');
  }
  function closeSheets() { byId('listSheet').classList.remove('show'); byId('winSheet').classList.remove('show'); }
  function missionTick(dt) {
    const q = S.mission; if (!q || q.ok || q.d.kind !== 'state') return;
    let ok = false; try { ok = q.d.check(); } catch (_) {}
    q.hold = ok ? q.hold + dt : Math.max(0, q.hold - dt * 2);
    byId('mProgBar').style.width = clamp(q.hold / 1.2 * 100, 0, 100) + '%';
    if (q.hold >= 1.2) winMission();
  }

  /* ================= ACARA ================= */
  function bind() {
    byId('slider-a').addEventListener('input', e => { const v = +e.target.value; S.view === 'bangku' ? setU(v - OBJX) : setU(v); });
    byId('slider-b').addEventListener('input', e => { const v = +e.target.value; S.view === 'bangku' ? setScr(v) : setHo(v); });
    byId('slider-f').addEventListener('input', e => setF(+e.target.value));
    byId('nudgeM').onclick = () => setU(S.u - 0.5); byId('nudgeP').onclick = () => setU(S.u + 0.5);
    byId('nudgeBM').onclick = () => nudgeB(-1); byId('nudgeBP').onclick = () => nudgeB(1);
    byId('nudgeFM').onclick = () => setF(S.fA - 0.5); byId('nudgeFP').onclick = () => setF(S.fA + 0.5);
    [['tg-r1', 'r1'], ['tg-r2', 'r2'], ['tg-r3', 'r3'], ['tg-ext', 'ext'], ['tg-lbl', 'lbl'], ['tg-dim', 'dim'], ['tg-pulse', 'pulse']].forEach(([id, k]) => byId(id).addEventListener('change', e => { S.opt[k] = e.target.checked; S.dirty = true; }));
    byId('recBtn2').onclick = recordNow;
    ['instRows', 'instPanel'].forEach(id => {
      byId(id).addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.k; if (k && e.target.type === 'range') setIns(k, +e.target.value); });
      byId(id).addEventListener('click', e => { const b = e.target.closest('.kt-nudge'); if (!b || !b.dataset.k) return; const k = b.dataset.k; setIns(k, S.ins[S.inst][k] + +b.dataset.d * PSPEC[S.inst][k].step); });
    });
    byId('slider-l').addEventListener('input', e => setU(+e.target.value - OBJX));
    byId('slider-s').addEventListener('input', e => setScr(+e.target.value));
    byId('nudgeLM').onclick = () => setU(S.u - 0.5); byId('nudgeLP').onclick = () => setU(S.u + 0.5);
    byId('nudgeSM').onclick = () => setScr(S.scr - 0.1); byId('nudgeSP').onclick = () => setScr(S.scr + 0.1);
    byId('clearRec').onclick = () => { S.rec = []; renderTable(); S.dirty = true; };
    byId('autoBtn').onclick = () => {
      if (lk('auto')) return; const q = compute();
      if (S.type === 'cekung' || !q.img.real || q.img.inf) return toast(T.toastConcave);
      const target = OBJX + S.u + q.img.v; if (target > 100) return toast('Imej terlalu jauh untuk panjang bangku optik. Jauhkan kanta dari objek.');
      setScr(target);
    };
    byId('jumpGraphBtn').onclick = () => { selAnalysis(byId('tab-graph')); byId('graphCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    $$('#modeTabs button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.m)));
    byId('mList').onclick = openList; byId('listClose').onclick = closeSheets;
    byId('winList').onclick = () => { byId('winSheet').classList.remove('show'); openList(); };
    byId('winRetry').onclick = () => startMission(S.mission.i);
    byId('winNext').onclick = () => startMission(Math.min(MIS.length - 1, S.mission.i + 1));
    byId('mCheck').onclick = submitAnswer;
    byId('mInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); });
    byId('mHint').onclick = () => { const q = S.mission; if (!q) return; q.hint = true; missionFb('💡 ' + q.d.hint(), 'info'); };
    $$('.sheet').forEach(s => s.addEventListener('click', e => { if (e.target === s) s.classList.remove('show'); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheets(); });
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(byId('stageWrap'));
  }

  /* ================= GELUNG ================= */
  let last = performance.now(), lastSig = '';
  const ease = (cur, tgt, dt, k) => (Math.abs(tgt - cur) < 0.003 ? tgt : cur + (tgt - cur) * (1 - Math.exp(-dt * k)));
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    S.phase += dt * 40;
    S.uD = ease(S.uD, S.u, dt, 14); S.fD = ease(S.fD, S.fA, dt, 14); S.hoD = ease(S.hoD, S.ho, dt, 14); S.scrD = ease(S.scrD, S.scr, dt, 14);
    const pi = S.ins[S.inst], pd = S.insD[S.inst];
    Object.keys(pi).forEach(k => { pd[k] = ease(pd[k], pi[k], dt, 12); if (Math.abs(pd[k] - pi[k]) < 0.002) pd[k] = pi[k]; });
    if (!S.drag) S.half = ease(S.half, Math.max(3.4 * S.fD, S.uD * 1.18 + 4, 14), dt, 5);
    S.cur = compute();
    const sig = [S.inst, JSON.stringify(pd), S.view, S.type, S.uD.toFixed(3), S.fD.toFixed(3), S.hoD.toFixed(3), S.scrD.toFixed(3), Object.keys(S.hide).join(), S.rec.length].join('|');
    if (sig !== lastSig || S.dirty) { lastSig = sig; readouts(S.cur); drawGraph(S.cur); syncSliders(); S.dirty = false; }
    if (W) { if (S.view === 'rajah') drawRay(S.cur); else if (S.view === 'bangku') drawBench(S.cur); else drawInst(); }
    missionTick(dt);
    requestAnimationFrame(frame);
  }
  function init() {
    renderSummary(); bind(); resize(); syncAll(); renderBanner();
    byId('hint').textContent = HINT[S.view];
    window.SIM = { S, api, MIS, setInst, setIns, startMission, setMode, setView, setType, setU, setF, setHo, setScr, recordNow, submitAnswer, compute };
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
