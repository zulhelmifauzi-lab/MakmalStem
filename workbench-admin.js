function createWorkbenchEditor(request) {
  const $ = id => document.getElementById(id);
  const form = $('editor-form');
  const list = $('editor-list');
  const status = $('editor-status');
  const fields = form.elements;
  const file = $('editor-file');
  const controls = $('editor-controls');
  const editable = ['id','title','subject','level','desc','objective','visualTitle','notes','resetLabel','recordLabel'];
  const empty = {id:'',mode:'html',level:5,subject:'Fizik',controls:[],revision:null,live:false};
  let lesson = empty;
  let version = 0;
  let busy = false;
  let changed = false;

  function text(tag, value) {
    const node = document.createElement(tag);
    node.textContent = value;
    return node;
  }

  function input(label, name, value, type = 'text') {
    const wrapper = text('label',label);
    const field = document.createElement('input');
    field.type = type;
    field.name = name;
    if (type === 'number') field.step = 'any';
    if (type === 'checkbox') {
      field.checked = value;
      wrapper.className = 'editor-flag';
      wrapper.prepend(field);
    } else {
      field.value = value ?? '';
      wrapper.append(field);
    }
    return wrapper;
  }

  function renderControl(control) {
    const group = document.createElement('fieldset');
    group.className = 'editor-control';
    group.dataset.type = control.type;
    group.append(text('legend',control.type==='range'?'Slider':'Kotak tanda'));
    const meta = document.createElement('div');
    meta.className = 'editor-control-meta';
    const id = input('ID kawalan','control-id',control.id);
    const key = id.querySelector('input');
    key.required = true;
    key.maxLength = 32;
    key.pattern = '[a-z0-9]+(?:-[a-z0-9]+)*';
    key.readOnly = lesson.mode === 'optics';
    const label = input('Label','control-label',control.label);
    label.querySelector('input').required = true;
    label.querySelector('input').maxLength = 60;
    meta.append(id,label);
    group.append(meta);
    if (control.type==='range') {
      const range = document.createElement('div');
      range.className = 'editor-control-range';
      for (const [name,title] of [['min','Minimum'],['max','Maksimum'],['step','Sela'],['value','Nilai mula']]) {
        const field = input(title,name,control[name],'number');
        field.querySelector('input').required = true;
        range.append(field);
      }
      group.append(range,input('Unit','unit',control.unit),input('Nilai pratetap (pisah dengan koma)','presets',control.presets.join(', ')));
    } else {
      group.append(input('Ditanda pada permulaan','value',control.value,'checkbox'));
    }
    if (lesson.mode !== 'optics') {
      const remove = text('button','Buang kawalan');
      remove.type = 'button';
      remove.className = 'feedback-button feedback-secondary';
      remove.addEventListener('click',()=>{ group.remove(); dirty(); });
      group.append(remove);
    }
    return group;
  }

  function refreshLinks() {
    const saved = lesson.revision !== null;
    const preview = $('editor-preview');
    preview.hidden = !saved;
    if (saved) preview.href = 'makmal.html?preview=1&id='+encodeURIComponent(lesson.id);
    const publish = form.querySelector('[value=publish]');
    publish.textContent = lesson.live ? 'Terbitkan perubahan' : 'Terbitkan';
    $('editor-unpublish').hidden = !lesson.live;
  }

  function show(model) {
    lesson = model;
    changed = false;
    for (const name of editable) fields[name].value = model[name] ?? '';
    fields.id.readOnly = model.revision !== null;
    file.value = '';
    $('editor-form-title').textContent = model.revision === null ? 'Simulasi baharu' : model.title;
    $('editor-upload').hidden = model.mode==='optics';
    $('editor-file-status').textContent = model.html ? 'Fail HTML sudah disimpan. Pilih fail baharu untuk menggantikannya.' : 'Gunakan satu fail HTML dengan CSS dan JavaScript terbina dalam.';
    $('editor-control-help').textContent = model.mode==='optics'
      ? 'Ubah label, julat dan pratetap. ID kawalan optik digunakan oleh rajah.'
      : 'Kawalan di sini memerlukan sambungan daripada fail HTML. Kosongkan bahagian ini untuk guna kawalan asal fail.';
    $('editor-add-controls').hidden = model.mode==='optics';
    controls.replaceChildren(...model.controls.map(renderControl));
    refreshLinks();
    form.hidden = false;
  }

  function dirty() {
    changed = true;
    status.textContent = 'Perubahan belum disimpan.';
  }

  function canSwitch() {
    return !busy && (!changed || window.confirm('Maklumat belum disimpan. Buka pilihan lain?'));
  }

  async function open() {
    const requestId = ++version;
    try {
      const modules = await request('workbench');
      if (requestId !== version) return;
      list.replaceChildren(...modules.map(module=>{
        const row = document.createElement('div');
        const label = document.createElement('span');
        label.append(text('strong',module.title),document.createTextNode(module.live?' · Diterbitkan':' · Draf'));
        const edit = text('button','Sunting');
        edit.type = 'button';
        edit.className = 'feedback-button feedback-secondary';
        edit.setAttribute('aria-label','Sunting '+module.title);
        edit.addEventListener('click',async ()=>{
          if (!canSwitch()) return;
          const requestId = ++version;
          status.textContent = 'Memuatkan draf…';
          try {
            const draft = await request('workbench/'+encodeURIComponent(module.id));
            if (requestId !== version) return;
            show(draft);
            status.textContent = '';
            fields.title.focus();
          } catch(error) { if(requestId===version) status.textContent=error.message; }
        });
        row.append(label,edit);
        return row;
      }));
    } catch(error) { if(requestId===version) status.textContent=error.message; }
  }

  function parseControl(group) {
    const valueOf = name => group.querySelector('[name='+name+']');
    const value = name => valueOf(name).value.trim();
    const base = {id:value('control-id'),label:value('control-label'),type:group.dataset.type};
    if (base.type==='toggle') return {...base,value:valueOf('value').checked};
    const numbers = Object.fromEntries(['min','max','step','value'].map(name=>[name,Number(value(name))]));
    const presets = value('presets').split(',').map(item=>item.trim()).filter(Boolean).map(Number);
    if (presets.some(number=>!Number.isFinite(number))) throw new Error('Gunakan nombor untuk nilai pratetap.');
    return {...base,...numbers,unit:value('unit'),presets};
  }

  function clear() {
    version++;
    changed = false;
    form.hidden = true;
    form.reset();
    controls.replaceChildren();
    list.replaceChildren();
    lesson = empty;
    status.textContent = '';
  }

  $('editor-new').addEventListener('click',()=>{
    if (!canSwitch()) return;
    version++;
    show(empty);
    status.textContent = '';
    fields.id.focus();
  });
  for (const type of ['range','toggle']) {
    $('editor-add-'+type).addEventListener('click',()=>{
      if (controls.children.length>=10) {
        status.textContent = 'Masukkan sehingga 10 kawalan.';
        return;
      }
      const group = renderControl({id:'',label:'',type,min:0,max:100,step:1,value:type==='range'?50:false,presets:[],unit:''});
      controls.append(group);
      group.querySelector('input').focus();
      dirty();
    });
  }
  form.addEventListener('input',dirty);
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if (busy) return;
    const action = event.submitter?.value || 'save';
    if (action==='unpublish' && !window.confirm('Tarik balik simulasi ini daripada katalog?')) return;
    const submitted = lesson;
    const buttons = [...form.querySelectorAll('button[type=submit]')];
    let model;
    busy = true;
    for (const button of buttons) button.disabled = true;
    status.textContent = 'Menyimpan simulasi…';
    try {
      model = Object.fromEntries(editable.map(name=>[name,fields[name].value]));
      model.level = Number(model.level);
      model.mode = lesson.mode;
      model.revision = lesson.revision;
      model.action = action;
      model.controls = [...controls.children].map(parseControl);
      const selected = file.files[0];
      if (selected) {
        if (!/\.html?$/i.test(selected.name) || selected.size>500_000) throw new Error('Pilih fail HTML sehingga 500 KB.');
        model.html = await selected.text();
      }
      const result = await request('workbench',model);
      if (lesson !== submitted) return;
      show({...model,...result,html:model.html ?? submitted.html});
      status.textContent = {save:'Draf disimpan.',publish:'Simulasi diterbitkan dalam katalog.',unpublish:'Penerbitan ditarik balik. Draf masih disimpan.'}[action];
      await open();
    } catch(error) {
      if (lesson === submitted) status.textContent=error.message || 'Simulasi tidak dapat disimpan.';
    } finally {
      busy = false;
      for (const button of buttons) button.disabled = false;
    }
  });
  return {open,clear};
}
