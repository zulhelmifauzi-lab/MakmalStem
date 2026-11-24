(() => {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || 'pantulan-cahaya';
  const preview = params.get('preview') === '1';
  const stage = $('visual-stage');
  const values = new Map();
  const updateControls = [];
  const records = [];
  const svgNS = 'http://www.w3.org/2000/svg';
  const maxReadings = 8;
  let readings = [];
  let frame = null;
  let connected = false;
  let lesson;

  function element(tag, text = '', className = '') {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function point(degrees, distance) {
    const radians = degrees * Math.PI / 180;
    return [320+distance*Math.sin(radians),230-distance*Math.cos(radians)].map(n=>n.toFixed(2));
  }

  function drawOptics() {
    const angle = values.get('angle');
    const normal = values.get('normal');
    const labels = values.get('labels');
    const incoming = point(-angle,183);
    const outgoing = point(angle,183);
    const arcStart = point(-angle,58);
    const arcEnd = point(angle,58);
    const axis = point(0,58);
    const marks = [];
    for (let tick=-90;tick<=90;tick+=5) {
      const major = tick%15===0;
      const outer = point(tick,176);
      const inner = point(tick,major?165:171);
      marks.push(`<path d="M${outer}L${inner}" stroke="${major?'#89859f':'#524e68'}"/>`);
      if (major) {
        const [x,y] = point(tick,197);
        const labelY = Math.abs(tick)===90 ? Number(y)-11 : y;
        marks.push(`<text x="${x}" y="${labelY}" fill="#c0bacf" font-size="12" text-anchor="middle" dominant-baseline="middle">${Math.abs(tick)}°</text>`);
      }
    }
    const svg = document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox','0 0 640 292');
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label',`Sudut tuju ${angle} darjah dan sudut pantulan ${angle} darjah, diukur dari garis normal.`);
    svg.innerHTML = `
      <defs>
        <pattern id="optics-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#272942"/></pattern>
        <pattern id="optics-mirror" width="10" height="8" patternUnits="userSpaceOnUse"><path d="M0 8L10 0" stroke="#655d80"/></pattern>
        <marker id="ray-in" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#ffbf66"/></marker>
        <marker id="ray-out" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#8ae6f8"/></marker>
      </defs>
      <rect width="640" height="292" fill="url(#optics-grid)"/>
      <path d="M144 230a176 176 0 0 1 352 0" fill="#211f35" stroke="#605973"/>
      <g font-family="system-ui,sans-serif">${marks.join('')}
      ${normal?'<path d="M320 48V230" stroke="#c7b9e6" stroke-dasharray="6 5"/><text x="330" y="54" fill="#e0d4fa" font-size="13">Garis normal</text>':''}
      <rect x="95" y="231" width="450" height="9" fill="url(#optics-mirror)"/>
      <path d="M95 230H545" stroke="#d3c3ef" stroke-width="3"/>
      <text x="320" y="264" text-anchor="middle" font-size="15" fill="#ded4ee">Cermin satah</text>
      <path d="M${incoming}L320 230" stroke="#ffbf66" stroke-width="3"/>
      <path d="M320 230L${outgoing}" stroke="#8ae6f8" stroke-width="3"/>
      <path d="M${point(-angle,100)}L${point(-angle,78)}" stroke="#ffbf66" stroke-width="3" marker-end="url(#ray-in)"/>
      <path d="M${point(angle,100)}L${point(angle,122)}" stroke="#8ae6f8" stroke-width="3" marker-end="url(#ray-out)"/>
      ${angle ? `<path d="M${arcStart}A58 58 0 0 1 ${axis}" stroke="#ffbf66" fill="none"/><path d="M${axis}A58 58 0 0 1 ${arcEnd}" stroke="#8ae6f8" fill="none"/>` : ''}
      <circle cx="320" cy="230" r="4" fill="#fff"/>
      ${labels?'<text x="27" y="27" fill="#ffbf66" font-size="14">Sinar tuju</text><text x="613" y="27" fill="#8ae6f8" font-size="14" text-anchor="end">Sinar pantulan</text>':''}</g>`;
    stage.replaceChildren(svg);
    showReadings([
      {label:'Sudut tuju (i)',value:angle+'°'},
      {label:'Sudut pantulan (r)',value:angle+'°'},
      {label:'Hubungan',value:'i = r'}
    ]);
  }

  function showReadings(items) {
    readings = items;
    $('readings-panel').hidden = !items.length;
    $('module-record').disabled = !items.length;
    $('live-readings').replaceChildren(...items.map(({label,value})=>{
      const tile = element('div');
      tile.append(element('dt',label),element('dd',value));
      return tile;
    }));
  }

  function cell(tag,text) {
    const node = element(tag,text);
    if (tag === 'th') node.scope = 'col';
    return node;
  }

  function renderRecords() {
    const columns = [...new Set(records.flatMap(record=>record.map(reading=>reading.label)))];
    const header = element('tr');
    header.append(cell('th','No.'),...columns.map(label=>cell('th',label)));
    $('record-head').replaceChildren(header);
    $('record-body').replaceChildren(...records.map((record,index)=>{
      const row = element('tr');
      row.append(cell('td',String(index+1)),...columns.map(label=>cell('td',record.find(item=>item.label===label)?.value || '—')));
      return row;
    }));
    $('records-empty').hidden = Boolean(records.length);
    $('record-table').hidden = !records.length;
    $('record-clear').disabled = !records.length;
    const count = $('tab-record-count');
    count.textContent = String(records.length);
    count.hidden = !records.length;
    $('tab-jadual').setAttribute('aria-label', 'Jadual, '+records.length+' bacaan');
  }

  function setupOpticsTabs() {
    const panel = $('control-panel');
    const tabs = $('lab-tabs');
    const controls = $('control-pane');
    const table = $('records-panel');
    const buttons = [...tabs.querySelectorAll('[role="tab"]')];
    const panes = [controls,table];
    for (let index=0; index<panes.length; index++) {
      panes[index].setAttribute('role','tabpanel');
      panes[index].setAttribute('aria-labelledby',buttons[index].id);
    }
    table.tabIndex = 0;
    table.classList.remove('lab-paper');
    panel.classList.add('has-tabs');
    const stacked = element('div','','lab-tab-panes');
    panel.insertBefore(stacked,$('control-status'));
    stacked.append(controls,table);
    panes.forEach(pane=>{ pane.hidden = false; });

    function select(index) {
      for (let i=0; i<buttons.length; i++) {
        buttons[i].setAttribute('aria-selected',String(i===index));
        buttons[i].tabIndex = i===index ? 0 : -1;
        panes[i].inert = i!==index;
      }
    }

    tabs.addEventListener('keydown',event=>{
      const current = buttons.indexOf(event.target);
      if (current===-1) return;
      let next;
      if (event.key==='Home') next=0;
      if (event.key==='End') next=buttons.length-1;
      if (event.key==='ArrowLeft' || event.key==='ArrowRight') next=(current+1)%buttons.length;
      if (next===undefined) return;
      event.preventDefault();
      select(next);
      buttons[next].focus();
    });
    buttons.forEach((button,index)=>button.addEventListener('click',()=>select(index)));
    renderRecords();
    select(0);
    tabs.hidden = false;
  }

  function sendControls(type) {
    if (connected) frame.contentWindow.postMessage({type,values:Object.fromEntries(values)},'*');
  }

  function mountUpload() {
    if (!lesson.html) {
      stage.append(element('p','Fail HTML belum dimuat naik.'));
      return;
    }
    frame = element('iframe');
    frame.title = lesson.visualTitle || lesson.title;
    frame.setAttribute('sandbox','allow-scripts');
    frame.referrerPolicy = 'no-referrer';
    window.addEventListener('message',event=>{
      if (event.source !== frame.contentWindow || event.origin !== 'null') return;
      const message = event.data;
      if (message?.type === 'makmal:ready' && !connected) {
        connected = true;
        $('control-status').textContent = '';
        sendControls('makmal:controls');
      }
      if (connected && message?.type === 'makmal:readings' && Array.isArray(message.readings)) {
        const items = message.readings.slice(0,maxReadings)
          .filter(item=>typeof item?.label==='string' && ['string','number'].includes(typeof item.value))
          .map(item=>({label:item.label.slice(0,48),value:String(item.value).slice(0,80)}));
        showReadings(items);
      }
    });
    // Uploads are returned as JSON and executed only inside this opaque-origin frame.
    frame.srcdoc = '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; font-src data:; media-src data: blob:; base-uri \'none\'; form-action \'none\'"><meta name="viewport" content="width=device-width, initial-scale=1">' + lesson.html;
    stage.append(frame);
  }

  function repaint(type = 'makmal:controls') {
    if (lesson.mode === 'optics') drawOptics();
    else sendControls(type);
  }

  function setControl(control) {
    const group = element('div','','lab-control');
    const input = element('input');
    input.id = 'control-'+control.id;
    input.type = control.type === 'range' ? 'range' : 'checkbox';
    const label = element('label',control.label,control.type==='range'?'lab-range-label':'lab-toggle');
    label.htmlFor = input.id;
    values.set(control.id,control.value);
    if (control.type==='range') {
      const output = element('output');
      output.setAttribute('for',input.id);
      label.append(output);
      Object.assign(input,{min:control.min,max:control.max,step:control.step,value:control.value});
      const marks = element('div','','lab-range-marks');
      marks.append(element('span',control.min+control.unit),element('span',control.max+control.unit));
      const presets = element('div','','lab-presets');
      const buttons = control.presets.map(number=>{
        const button = element('button',number+control.unit,'lab-button lab-secondary');
        button.type = 'button';
        button.setAttribute('aria-label',control.label+' '+number+control.unit);
        button.addEventListener('click',()=>{ input.value=number; transfer(); });
        presets.append(button);
        return [button,number];
      });
      function sync() {
        input.value = values.get(control.id);
        output.value = input.value+control.unit;
        for (const [button,number] of buttons) button.setAttribute('aria-pressed',String(Number(input.value)===number));
      }
      function transfer() {
        values.set(control.id,Number(input.value));
        sync();
        repaint();
      }
      input.addEventListener('input',transfer);
      updateControls.push(sync);
      sync();
      group.append(label,input,marks);
      if (buttons.length) group.append(presets);
    } else {
      label.prepend(input);
      input.checked = control.value;
      input.addEventListener('change',()=>{ values.set(control.id,input.checked); repaint(); });
      updateControls.push(()=>{ input.checked=values.get(control.id); });
      group.append(label);
    }
    return group;
  }

  function run(model) {
    lesson = model;
    document.title = model.title+' (BETA) — Makmal STEM';
    $('module-title').textContent = model.title;
    $('module-meta').textContent = model.subject+' · Tingkatan '+model.level+(preview?' · Pratonton draf':'');
    $('module-objective').textContent = model.objective || model.desc;
    const opticsHeader = model.id === 'pantulan-cahaya';
    if (opticsHeader) {
      $('module-header').classList.add('has-module-logo');
      $('module-logo').querySelector('svg').innerHTML = reflectionArt;
      $('module-logo').hidden = $('module-subject-badge').hidden = false;
      $('module-meta').hidden = $('module-beta').hidden = $('module-objective').hidden = true;
    }
    $('visual-title').textContent = model.visualTitle || 'Visual simulasi';
    $('notes-panel').hidden = !model.notes;
    $('module-notes').textContent = model.notes;
    const reset = $('module-reset');
    const record = $('module-record');
    reset.hidden = !model.resetLabel;
    reset.textContent = model.resetLabel;
    record.hidden = $('records-panel').hidden = !model.recordLabel;
    record.textContent = model.recordLabel;
    record.disabled = true;
    const hasControls = model.controls.length || model.resetLabel || model.recordLabel;
    $('control-panel').hidden = !hasControls;
    $('lab-work').classList.toggle('is-full',!hasControls);
    $('module-controls').replaceChildren(...model.controls.map(setControl));
    if (opticsHeader) {
      if (model.recordLabel) setupOpticsTabs();
      setupLessonVideos(opticsDemo);
    }
    reset.addEventListener('click',()=>{
      for (const control of model.controls) values.set(control.id,control.value);
      updateControls.forEach(sync=>sync());
      if (model.mode === 'html' && frame && !connected) {
        const source = frame.srcdoc;
        frame.srcdoc = source;
      }
      repaint('makmal:reset');
    });
    record.addEventListener('click',()=>{
      if (!readings.length) return;
      if (records.length>=50) {
        $('control-status').textContent = 'Jadual penuh. Kosongkan jadual untuk mencatat lagi.';
        return;
      }
      records.push(readings);
      renderRecords();
      $('control-status').textContent = 'Bacaan '+records.length+' dicatat.';
    });
    $('record-clear').addEventListener('click',()=>{
      records.length=0;
      renderRecords();
      $('control-status').textContent = 'Jadual dikosongkan.';
    });
    if (model.mode==='optics') {
      $('visual-caption').textContent = 'Ukur kedua-dua sudut dari garis normal.';
      $('visual-caption').hidden = false;
      drawOptics();
    } else {
      if (model.html && (model.controls.length || model.recordLabel)) $('control-status').textContent = 'Menunggu sambungan daripada simulasi.';
      mountUpload();
    }
    $('lab-status').hidden = true;
    $('lab-content').hidden = false;

    if (!preview && (opticsHeader || location.protocol !== 'file:')) {
      const feedback = $('penilaian');
      feedback.dataset.simulationFeedback = model.id;
      if (opticsHeader) {
        feedback.setAttribute('data-no-shortcut','');
        feedback.setAttribute('data-review-panel','');
      }
      feedback.hidden = false;
      const script = element('script');
      script.src = 'feedback.js';
      document.body.append(script);
    }
  }

  (async ()=>{
    try {
      if (location.protocol === 'file:' && !preview && id === opticsDemo.id) return run(opticsDemo);
      const route = preview ? 'api/admin/workbench/' : 'api/workbench/';
      const reply = await fetch(route+encodeURIComponent(id));
      if (!reply.ok) throw new Error(reply.status===401?'Log masuk ke panel pentadbir untuk melihat draf.':'Simulasi tidak ditemui atau belum diterbitkan.');
      run(await reply.json());
    } catch(error) {
      $('lab-status').textContent = location.protocol==='file:'
        ? 'Buka laman melalui pelayan Makmal STEM untuk melihat simulasi ini.'
        : error.message || 'Simulasi belum dapat dimuatkan.';
    }
  })();
})();
