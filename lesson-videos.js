const quadraticLessonVideos = {
  id:'kuadratik',
  videos:[
    {id:'NPu8CFIc-qs',title:'Fungsi kuadratik — Cikgu Chong'},
    {id:'pcL7ci9_q50',title:'Mencari punca persamaan kuadratik — Cikgu Chong'}
  ]
};

const trigLessonVideos = {
  id:'trigonometri',
  videos:[
    {id:'KORHSvx0aWo',title:'Graf sinus, kosinus dan tangen — Cikgu Chong'},
    {id:'5vpZSWWk7r8',title:'Nisbah dan graf fungsi trigonometri — Cikgu FaizaL'}
  ]
};

if (typeof module !== 'undefined' && module.exports) module.exports = {quadraticLessonVideos, trigLessonVideos};

const DEV_NOTICE_TEXT = {
  ms: 'Ciri ini sedang dalam pembangunan dan akan tersedia tidak lama lagi',
  en: 'This feature is currently in development and will be available soon'
};

let devNoticeObserverAttached = false;

function getDevNoticeMessage() {
  const lang = (document.documentElement.lang || 'ms').toLowerCase();
  return lang.startsWith('en') ? DEV_NOTICE_TEXT.en : DEV_NOTICE_TEXT.ms;
}

function syncDevNotices() {
  const text = getDevNoticeMessage();
  document.querySelectorAll('.lab-dev-notice').forEach(el => {
    el.textContent = text;
  });
}

function applyDevPlaceholder(panel) {
  if (!panel) return;
  Array.from(panel.children).forEach(child => {
    if (child.tagName === 'H2' || child.classList.contains('lab-dev-notice')) return;
    child.hidden = true;
    child.style.display = 'none';
  });
  let notice = panel.querySelector('.lab-dev-notice');
  if (!notice) {
    notice = document.createElement('p');
    notice.className = 'lab-dev-notice';
    panel.appendChild(notice);
  }
  notice.hidden = false;
  notice.style.display = '';
  notice.textContent = getDevNoticeMessage();
  panel.hidden = false;
}

function applyLearningPanelsPlaceholder() {
  const notesPanel = document.getElementById('notes-panel');
  if (notesPanel) applyDevPlaceholder(notesPanel);

  const videoPanel = document.getElementById('learning-video');
  if (videoPanel) {
    applyDevPlaceholder(videoPanel);
    if (videoPanel.parentElement) videoPanel.parentElement.classList.add('has-companion');
  }

  if (!devNoticeObserverAttached && typeof MutationObserver === 'function' && document.documentElement) {
    devNoticeObserverAttached = true;
    const observer = new MutationObserver(syncDevNotices);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
}

async function setupLessonVideos() {
  applyLearningPanelsPlaceholder();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLearningPanelsPlaceholder);
  } else {
    applyLearningPanelsPlaceholder();
  }
}
