(() => {
  const $ = id => document.getElementById(id);
  const keys = ['a', 'b', 'c'];
  const defaults = {a:1, b:1, c:0};
  const sliders = Object.fromEntries(keys.map(key => [key, $('slider-' + key)]));
  const stepButtons = [...document.querySelectorAll('[data-step]')];
  const options = [...document.querySelectorAll('.lab-display-toggles input')];
  const tabs = [...document.querySelectorAll('.lab-tabs [role=tab]')];
  const localized = [...document.querySelectorAll('[data-en], [data-en-label]')].map(element => ({
    element, malay:element.dataset.enLabel ? element.getAttribute('aria-label') : element.textContent
  }));
  const plot = $('trig-plot');
  let lang = 'ms';
  let target = null;
  let message = '';
  let probe = null;
  const tr = (ms, en) => lang === 'ms' ? ms : en;
  const fmt = value => String(Number(value.toFixed(2))).replace('-', '−');
  const undefinedText = () => tr('Tak tertakrif', 'Undefined');

  function valueAt(x, fn, {a, b, c}) {
    const rad = b * x * Math.PI / 180;
    if (fn === 'tan' && Math.abs(Math.cos(rad)) < 1e-7) return NaN;
    return a * Math[fn](rad) + c;
  }

  function coefficients() {
    return Object.fromEntries(keys.map(key => [key, sliders[key].valueAsNumber]));
  }

  function formula(fn, {a, b, c}) {
    const scale = a === 1 ? '' : a === -1 ? '−' : fmt(a) + ' ';
    const shift = c ? (c < 0 ? ' − ' : ' + ') + fmt(Math.abs(c)) : '';
    return 'y = ' + scale + fn + '(' + (b === 1 ? '' : fmt(b)) + 'x)' + shift;
  }

  function draw() {
    const width = plot.clientWidth || 520;
    const height = plot.clientHeight || 360;
    const left = 34, right = width - 21, top = 17, bottom = height - 29, limit = 8;
    const X = x => left + (right - left) * x / 360;
    const Y = y => top + (bottom - top) * (limit - y) / (2 * limit);
    const fn = $('trig-function').value;
    const current = coefficients();
    plot.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    function line(x1, y1, x2, y2, type) {
      return '<line class="' + type + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>';
    }

    function curve(params, type) {
      let path = '', previous = null;
      for (let x = 0; x <= 360; x += .5) {
        const y = valueAt(x, fn, params);
        const branch = fn === 'tan' ? Math.floor((params.b * x + 90) / 180) : 0;
        if (!Number.isFinite(y) || Math.abs(y) > 80) { previous = null; continue; }
        path += (previous === branch ? 'L' : 'M') + X(x).toFixed(2) + ' ' + Y(y).toFixed(2);
        previous = branch;
      }
      return '<path class="' + type + '" d="' + path + '"/>';
    }

    const grid = $('show-grid').checked ? 'trig-grid' : 'trig-grid-off';
    const ticks = [];
    for (let x = 0; x <= 360; x += width < 355 ? 90 : 45) {
      ticks.push(line(X(x), top, X(x), bottom, grid));
      ticks.push('<text x="' + X(x) + '" y="' + (bottom + 18) + '" text-anchor="middle">' + x + '°</text>');
    }
    for (let y = -8; y <= 8; y += 2) {
      ticks.push(line(left, Y(y), right, Y(y), grid));
      ticks.push('<text x="' + (left - 7) + '" y="' + (Y(y) + 4) + '" text-anchor="end">' + fmt(y) + '</text>');
    }
    const overlays = [];
    if ($('show-midline').checked) overlays.push(line(left, Y(current.c), right, Y(current.c), 'trig-midline'));
    if ($('show-reference').checked) overlays.push(curve(defaults, 'trig-reference'));
    if (target) overlays.push(curve(target, 'trig-target'));
    if (fn === 'tan' && $('show-asymptotes').checked) {
      for (let angle = 90; angle / current.b <= 360; angle += 180) {
        const x = X(angle / current.b);
        overlays.push(line(x, top, x, bottom, 'trig-asymptote'));
      }
    }
    overlays.push(curve(current, 'trig-curve'));
    let cursor = '';
    if (probe !== null) {
      const y = valueAt(probe, fn, current);
      overlays.push(line(X(probe), top, X(probe), bottom, 'trig-probe'));
      if (Number.isFinite(y) && Math.abs(y) <= limit) {
        overlays.push('<circle class="trig-probe-dot" cx="' + X(probe) + '" cy="' + Y(y) + '" r="4"/>');
      }
      cursor = '<text class="trig-probe-label" x="' + (left + 7) + '" y="' + (top + 16) + '">(' +
        fmt(probe) + '°, ' + (Number.isFinite(y) ? fmt(y) : undefinedText()) + ')</text>';
    }
    plot.innerHTML = '<defs><clipPath id="trig-clip"><rect x="' + left + '" y="' + top + '" width="' +
      (right - left) + '" height="' + (bottom - top) + '"/></clipPath></defs>' + ticks.join('') +
      line(left,Y(0),right,Y(0),'trig-axis') + line(left,top,left,bottom,'trig-axis') +
      '<g clip-path="url(#trig-clip)">' + overlays.join('') + '</g>' + cursor;
  }

  function update() {
    const fn = $('trig-function').value;
    const params = coefficients();
    const {a, b, c} = params;
    const tangent = fn === 'tan';
    for (const key of keys) $('value-' + key).textContent = fmt(params[key]);
    for (const button of stepButtons) {
      const slider = sliders[button.dataset.step];
      button.disabled = slider.valueAsNumber === Number(button.dataset.direction === '1' ? slider.max : slider.min);
    }
    $('show-asymptotes').disabled = !tangent;
    $('equation').textContent = formula(fn, params);
    $('amplitude').textContent = tangent ? '—' : fmt(Math.abs(a));
    $('period').textContent = a === 0 ? '—' : fmt((tangent ? 180 : 360) / b) + '°';
    $('maximum').textContent = tangent ? '—' : fmt(c + Math.abs(a));
    $('minimum').textContent = tangent ? '—' : fmt(c - Math.abs(a));
    $('coordinates').innerHTML = Array.from({length:9}, (_, i) => {
      const x = i * 45, y = valueAt(x, fn, params);
      return '<tr><th scope="row">' + x + '°</th><td>' + (Number.isFinite(y) ? fmt(y) : undefinedText()) + '</td></tr>';
    }).join('');
    const messages = {
      target:tr('Graf hijau ialah sasaran anda.', 'The green curve is your target.'),
      start:tr('Mulakan cabaran baharu dahulu.', 'Start a new challenge first.'),
      matched:tr('Tepat! Graf anda sepadan.', 'Correct! Your graph matches.'),
      retry:tr('Belum sepadan. Bandingkan kala, skala menegak dan paksi tengah.', 'Not yet. Compare the period, vertical scale and midline.')
    };
    $('challenge-status').textContent = messages[message] || '';
    draw();
  }

  function selectTab(index) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.tabIndex = active ? 0 : -1;
      tab.setAttribute('aria-selected', String(active));
      $(tab.getAttribute('aria-controls')).inert = !active;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', event => {
      const next = {ArrowLeft:1-index, ArrowRight:1-index, Home:0, End:1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectTab(next);
      tabs[next].focus();
    });
  });

  function changeLanguage(next) {
    lang = next;
    document.documentElement.lang = lang;
    $('language').setAttribute('aria-label', tr('Tukar ke bahasa Inggeris', 'Switch to Bahasa Melayu'));
    for (const {element, malay} of localized) {
      if (element.dataset.enLabel) element.setAttribute('aria-label', tr(malay, element.dataset.enLabel));
      else element.textContent = tr(malay, element.dataset.en);
    }
    document.title = document.querySelector('h1').textContent + ' — Makmal STEM';
    try { localStorage.setItem('stemlab-lang', lang); } catch {}
    update();
  }

  for (const slider of Object.values(sliders)) slider.addEventListener('input', update);
  for (const button of stepButtons) {
    button.addEventListener('click', () => { sliders[button.dataset.step].stepUp(Number(button.dataset.direction)); update(); });
  }
  for (const option of options) option.addEventListener('change', draw);
  $('trig-function').addEventListener('change', () => { target = null; message = ''; update(); });
  $('reset').addEventListener('click', () => {
    for (const key of keys) sliders[key].value = defaults[key];
    for (const option of options) option.checked = option.defaultChecked;
    $('trig-function').value = 'sin';
    target = probe = null;
    message = '';
    update();
  });
  $('challenge').addEventListener('click', () => {
    const pick = values => values[Math.floor(Math.random() * values.length)];
    target = {a:pick([1,2,3]), b:pick([.5,1,2]), c:pick([-2,-1,0,1,2])};
    const now = coefficients();
    if (keys.every(key => now[key] === target[key])) target.c = target.c === 2 ? 1 : target.c + 1;
    message = 'target';
    update();
  });
  $('verify').addEventListener('click', () => {
    const now = coefficients();
    message = target ? (keys.every(key => now[key] === target[key]) ? 'matched' : 'retry') : 'start';
    update();
  });

  const setProbe = x => { probe = Math.min(360, Math.max(0,x)); draw(); };
  function pointAt(event) {
    const rect = plot.getBoundingClientRect();
    setProbe(Math.round((event.clientX - rect.left - 34) / Math.max(1, rect.width - 55) * 360));
  }
  plot.addEventListener('pointerdown', pointAt);
  plot.addEventListener('pointermove', event => { if (event.pointerType === 'mouse' || event.buttons) pointAt(event); });
  plot.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { probe = null; draw(); } });
  plot.addEventListener('keydown', event => {
    const delta = {ArrowLeft:-5, ArrowRight:5}[event.key];
    if (!delta) return;
    event.preventDefault();
    setProbe(probe === null ? 0 : probe + delta);
  });
  if (typeof ResizeObserver === 'function') new ResizeObserver(draw).observe(plot);
  else window.addEventListener('resize', draw);
  $('language').addEventListener('click', () => changeLanguage(lang === 'ms' ? 'en' : 'ms'));
  let saved;
  try { saved = localStorage.getItem('stemlab-lang'); } catch {}
  changeLanguage(saved === 'en' ? 'en' : 'ms');
  setupLessonVideos(trigLessonVideos);
})();

