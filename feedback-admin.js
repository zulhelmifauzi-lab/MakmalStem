(() => {
  const $ = id => document.getElementById(id);
  const login = $('admin-login');
  const loginForm = login.querySelector('form');
  const panel = $('admin-panel');
  const editor = createWorkbenchEditor(request);
  const logout = $('admin-logout');
  const videoForm = $('admin-video-form');
  const videoList = $('admin-video-list');
  const videoStatus = $('admin-video-status');
  const videoModule = $('admin-video-module');
  const videoEndpoint = () => 'learning-videos/' + encodeURIComponent(videoModule.value);
  let videoBusy = false;
  const filter = $('admin-view');
  const items = $('admin-items');
  const status = $('admin-status');
  const tabs = [...panel.querySelectorAll('[data-section]')];
  const pageSize = 25;
  const views = {
    comments: [['pending','Menunggu semakan'],['approved','Diluluskan'],['hidden','Disembunyikan']],
    messages: [['unread','Belum dibaca'],['read','Sudah dibaca']]
  };
  const date = new Intl.DateTimeFormat('ms-MY',{ dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Kuala_Lumpur' });
  let kind = 'comments';
  let offset = 0;
  let requestVersion = 0;

  async function request(route, body) {
    const options = body === undefined ? undefined : {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
    };
    const reply = await fetch('api/admin/' + route, options);
    const contentType = reply.headers.get('content-type') || '';
    if ([404,405,501].includes(reply.status) && !contentType.includes('application/json') ||
        reply.ok && !contentType.includes('application/json')) {
      throw new Error('Pelayan ini hanya memaparkan fail laman. Hidupkan pelayan Makmal STEM dengan Buka-Panel.cmd.');
    }
    const data = await reply.json();
    if (!reply.ok) throw Object.assign(new Error(data.error),{ status:reply.status });
    return data;
  }

  function signedIn(active) {
    login.hidden = active;
    panel.hidden = logout.hidden = !active;
    if (!active) {
      items.replaceChildren();
      editor.clear();
      videoForm.reset();
      videoList.replaceChildren();
      videoStatus.textContent = '';
      selectKind('comments');
    }
  }

  function selectKind(next) {
    kind = next;
    offset = 0;
    for (const tab of tabs) tab.setAttribute('aria-pressed', String(tab.dataset.section === next));
    $('admin-review').hidden = !views[next];
    $('admin-editor').hidden = next !== 'editor';
    $('admin-videos').hidden = next !== 'videos';
    if (views[next]) filter.replaceChildren(...views[kind].map(([value,label]) => new Option(label,value)));
  }

  function line(tag,text) {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
  }

  function renderVideos(items) {
    videoList.replaceChildren();
    if (!items.length) videoList.append(line('p','Belum ada video. Tambah pautan YouTube di atas.'));
    items.forEach((item,index)=>{
      const row = document.createElement('div');
      const link = line('a',item.title || 'Video '+(index+1));
      link.href = 'https://www.youtube.com/watch?v='+item.id;
      link.target = '_blank';
      link.rel = 'noopener';
      const remove = line('button','Buang');
      remove.type = 'button';
      remove.className = 'feedback-button feedback-secondary';
      remove.setAttribute('aria-label','Buang '+link.textContent);
      remove.addEventListener('click',()=>saveVideo({action:'remove',id:item.id}));
      row.append(link,remove);
      videoList.append(row);
    });
  }

  async function saveVideo(body) {
    if (videoBusy) return;
    videoBusy = true;
    const version = requestVersion;
    const submit = videoForm.querySelector('[type=submit]');
    submit.disabled = videoModule.disabled = true;
    videoStatus.textContent = 'Menyimpan senarai…';
    try {
      const items = await request(videoEndpoint(),body);
      if (body.action==='add' && !panel.hidden) videoForm.reset();
      if (kind==='videos' && !panel.hidden) {
        renderVideos(items);
        videoStatus.textContent = body.action==='add' ? 'Video ditambah.' : 'Video dibuang.';
        if (body.action==='remove') submit.focus();
      }
    } catch(error) {
      if (version!==requestVersion) return;
      if (error.status===401) signedIn(false);
      status.textContent = error.status===401 ? error.message : '';
      videoStatus.textContent = error.message || 'Senarai video tidak dapat disimpan.';
    } finally {
      videoBusy = false;
      submit.disabled = videoModule.disabled = false;
    }
  }

  videoModule.addEventListener('change', () => {
    videoList.replaceChildren();
    refresh();
  });

  videoForm.addEventListener('submit',event=>{
    event.preventDefault();
    saveVideo({action:'add',...Object.fromEntries(new FormData(videoForm))});
  });

  function renderItem(item) {
    const card = document.createElement('article');
    card.className = 'feedback-record';
    const detail = item.category || item.alias || 'Pengguna tanpa nama';
    card.append(line('h3',item.title),line('small',detail+' · '+date.format(new Date(item.created))),line('p',item.message));
    const actions = document.createElement('div');
    actions.className = 'feedback-admin-actions';
    const itemKind = kind;

    function action(label, body) {
      const button = line('button',label);
      button.type = 'button';
      button.className = 'feedback-button';
      button.addEventListener('click', async () => {
        for (const control of actions.children) control.disabled = true;
        const version = requestVersion;
        try {
          await request(itemKind + '/' + item.id,body);
          if (version === requestVersion) {
            await refresh('Perubahan disimpan.');
            filter.focus();
          }
        } catch (error) {
          if (error.status === 401) signedIn(false);
          status.textContent = error.status ? error.message : 'Sambungan terputus. Cuba lagi.';
          for (const control of actions.children) control.disabled = false;
        }
      });
      actions.append(button);
    }

    if (kind === 'comments') {
      if (item.status !== 'approved') action('Luluskan komen', {status:'approved'});
      if (item.status !== 'hidden') action('Sembunyikan komen', {status:'hidden'});
    } else {
      action(item.seen ? 'Tanda belum dibaca' : 'Tanda sudah dibaca', {seen:!item.seen});
    }
    card.append(actions);
    return card;
  }

  async function refresh(done = '') {
    const version = ++requestVersion;
    if (kind === 'editor') {
      status.textContent = '';
      return editor.open();
    }
    if (kind === 'videos') {
      status.textContent = '';
      videoStatus.textContent = 'Memuatkan video…';
      try {
        const items = await request(videoEndpoint());
        if (version!==requestVersion || videoBusy) return;
        renderVideos(items);
        videoStatus.textContent = '';
      } catch(error) {
        if (version!==requestVersion) return;
        if (error.status===401) {
          signedIn(false);
          status.textContent = error.message;
        } else {
          videoStatus.textContent = 'Senarai video tidak dapat dimuatkan.';
        }
      }
      return;
    }
    const view = filter.value;
    items.replaceChildren();
    $('admin-pages').hidden = true;
    status.textContent = 'Memuatkan hantaran…';
    try {
      const result = await request('queue?view='+encodeURIComponent(view)+'&offset='+offset);
      if (version !== requestVersion) return;
      if (!result.items.length && offset > 0) {
        offset -= pageSize;
        return refresh(done);
      }
      signedIn(true);
      items.replaceChildren(...result.items.map(renderItem));
      if (!result.items.length) items.append(line('p','Tiada hantaran dalam senarai ini.'));
      $('admin-pages').hidden = !offset && !result.more;
      $('admin-prev').disabled = !offset;
      $('admin-next').disabled = !result.more;
      $('admin-page').textContent = 'Halaman '+ (offset/pageSize+1);
      status.textContent = done;
    } catch (error) {
      if (version !== requestVersion) return;
      if (error.status === 401) {
        signedIn(false);
        status.textContent = '';
      } else {
        status.textContent = error instanceof TypeError || error instanceof SyntaxError
          ? 'Panel tidak dapat menyambung. Jalankan Buka-Panel.cmd, kemudian muat semula halaman.'
          : error.message;
      }
    }
  }

  loginForm.addEventListener('submit',async event => {
    event.preventDefault();
    const button = loginForm.querySelector('button');
    button.disabled = true;
    status.textContent = 'Menyemak kata laluan…';
    try {
      await request('login',{password:new FormData(loginForm).get('password')});
      loginForm.reset();
      await refresh();
    } catch (error) {
      status.textContent = error.status ? error.message : 'Panel tidak dapat disambungkan.';
    } finally { button.disabled = false; }
  });
  logout.addEventListener('click',async () => {
    const version = ++requestVersion;
    logout.disabled = true;
    try {
      await request('logout',{});
      if (version === requestVersion) {
        signedIn(false);
        status.textContent = 'Anda telah log keluar.';
        loginForm.elements.password.focus();
      }
    } catch (error) {
      if (error.status === 401) signedIn(false);
      status.textContent = error.status ? error.message : 'Log keluar gagal. Cuba lagi.';
    } finally { logout.disabled = false; }
  });
  for (const tab of tabs) tab.addEventListener('click',() => { selectKind(tab.dataset.section); refresh(); });
  filter.addEventListener('change',() => { offset = 0; refresh(); });
  $('admin-prev').addEventListener('click',() => { offset -= pageSize; refresh(); });
  $('admin-next').addEventListener('click',() => { offset += pageSize; refresh(); });
  if (location.protocol === 'file:') {
    status.textContent = 'Panel ini dibuka sebagai fail. Jalankan Buka-Panel.cmd, kemudian buka panel melalui pautan di bawah.';
    $('admin-local-link').hidden = false;
    return;
  }
  selectKind(kind);
  refresh();
})();
