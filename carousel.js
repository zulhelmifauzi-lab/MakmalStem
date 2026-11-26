// All catalog modules, including upcoming modules, appear in the hero carousel.
(() => {
  const root = document.getElementById('hero-carousel');
  if (!root) return;
  const link = document.getElementById('hero-slide');
  const viewport = link.querySelector('.preview-top');
  const imageFrame = link.querySelector('.carousel-frame');
  const name = link.querySelector('.portal-preview-name');
  const action = link.querySelector('.portal-preview-action');
  const position = document.getElementById('slide-position');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const orderSlides = () => [...catalogModules].sort((x, y) => (y.id === 'trigonometri') - (x.id === 'trigonometri'));
  let slides = orderSlides();
  const colors = { Matematik: '#855300', Fizik: '#9f4122', Kimia: '#006c49' };
  const formulas = { 'satelit': 'v = √(GM/r) · vₑ = √(2GM/r)', 'hukum-kepler': 'T² ∝ r³', 'kegravitian': 'F = Gm₁m₂/r²', 'ketaksamaan-linear': 'y ≥ mx + c', 'pantulan-cahaya': 'i = r', 'ikatan-kimia': 'Cl₂', 'jatuh-bebas': 'a = g dalam vakum', transformasi: 'Objek → P → QP', 'daya-paduan': 'ΣF = ma', hooke: 'F = kx', trigonometri: 'y = a sin(bx) + c', atom: 'Proton · Neutron · Elektron', linear: 'v = u + at', set: 'A ∪ B · A ∩ B', titrasi: 'Asid + Bes → Garam + Air', kanta: '1/f = 1/u + 1/v', pembiasan: 'n₁ sin i = n₂ sin r', 'pantulan-dalam-penuh': 'n = 1 ÷ sin c', kuadratik: 'y = ax² + bx + c' };
  let index = 0;
  let timer = null;
  let visible = typeof IntersectionObserver !== 'function';
  let hovered = false;
  let focused = false;
  let outgoing = null;
  let animations = [];

  function show(next) {
    const direction = next < index ? -1 : 1;
    animations.forEach(animation => animation.cancel());
    animations = [];
    if (outgoing) outgoing.remove();
    outgoing = next !== index && !reducedMotion.matches ? imageFrame.cloneNode(true) : null;
    index = (next + slides.length) % slides.length;
    const m = slides[index];
    const ready = m.status === 'ready';
    const color = colors[m.subject];
    link.href = m.url || `simulasi.html?id=${m.id}`;
    link.setAttribute('aria-label', `Buka simulasi ${m.title} (BETA)${ready ? '' : ' — Coming soon'}`);
    imageFrame.style.color = color;
    imageFrame.innerHTML = `
      <span class="preview-label">${m.subject} · Tingkatan ${m.level}</span>
      <svg viewBox="0 0 280 160" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3">${shapes[m.art]}</svg>
      <span class="portal-formula">${escapeCatalogText(formulas[m.id] || m.topic || "")}</span>`;
    name.innerHTML = `${escapeCatalogText(m.title)} <span class="beta-label">(BETA)</span>`;
    action.innerHTML = ready ? 'Buka simulasi <span aria-hidden="true">↗</span>' : 'Coming soon';
    position.textContent = `${index + 1} / ${slides.length}`;
    if (outgoing) {
      const oldFrame = outgoing;
      oldFrame.classList.add('carousel-outgoing');
      oldFrame.setAttribute('aria-hidden', 'true');
      viewport.appendChild(oldFrame);
      const options = { duration: 650, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' };
      const incomingAnimation = imageFrame.animate([
        { opacity: 0, transform: `translateX(${direction * 18}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ], options);
      const outgoingAnimation = oldFrame.animate([
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: `translateX(${-direction * 18}px)` }
      ], options);
      outgoingAnimation.onfinish = () => oldFrame.remove();
      animations = [incomingAnimation, outgoingAnimation];
    }
  }

  function schedule() {
    clearInterval(timer);
    timer = null;
    if (visible && !document.hidden && !hovered && !focused && !reducedMotion.matches) {
      timer = setInterval(() => show(index + 1), 3000);
    }
  }
  function navigate(next) { show(next); schedule(); }
  document.getElementById('slide-prev').onclick = () => navigate(index - 1);
  document.getElementById('slide-next').onclick = () => navigate(index + 1);
  root.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      navigate(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('makmal:catalog-updated',()=>{
    const current = slides[index].id;
    slides = orderSlides();
    index = Math.max(0,slides.findIndex(module=>module.id===current));
    show(index);
  });
  reducedMotion.addEventListener('change', schedule);
  root.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovered = true;
    schedule();
  });
  root.addEventListener('pointerleave', () => {
    hovered = false;
    schedule();
  });
  root.addEventListener('focusin', () => {
    focused = true;
    schedule();
  });
  root.addEventListener('focusout', event => {
    focused = root.contains(event.relatedTarget);
    schedule();
  });
  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= 0.2;
      schedule();
    }, { threshold: 0.2 });
    observer.observe(root);
  }
  show(0);
  schedule();
})();
