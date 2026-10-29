(() => {
  const contactForm = document.getElementById('contact-form');
  contactForm?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const sector = contactForm.elements.sector.selectedOptions[0].textContent.trim();
    const message = [
      'Hola, QUIAR. Me gustaría solicitar una cotización.',
      '',
      `Empresa: ${data.get('empresa').trim()}`,
      `Sector: ${sector}`,
      `Nombre: ${data.get('nombre').trim()}`,
      `Correo: ${data.get('correo').trim()}`,
      `Requerimiento: ${data.get('requerimiento').trim() || 'Sin especificar'}`,
    ].join('\n');
    window.open(`https://wa.me/5216621128409?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const counters = document.querySelectorAll('[data-count]');

  function animateCounter(counter) {
    const target = Number(counter.dataset.count);
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / 1600, 1);
      const value = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      counter.textContent = `${reducedMotion.matches ? target : value}+`;
      if (progress < 1 && !reducedMotion.matches) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(counter => {
      counter.textContent = '0+';
      observer.observe(counter);
    });
  }

  const carousel = document.querySelector('.sectors-carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.sectors-grid');
  let hovered = false;
  let frameId;
  let previousTime;
  let offset = 0;
  let cardStep = 0;
  const speed = 40; // Pixels por segundo, sin pausas entre tarjetas.

  function measure() {
    const nextStep = track.firstElementChild.getBoundingClientRect().width
      + parseFloat(getComputedStyle(track).gap);
    if (cardStep > 0) offset = (offset / cardStep) * nextStep;
    cardStep = nextStep;
    track.style.transform = `translateX(-${offset}px)`;
  }

  function animate(now) {
    if (previousTime !== undefined) {
      offset += speed * Math.min((now - previousTime) / 1000, 0.1);
      while (cardStep > 0 && offset >= cardStep) {
        track.append(track.firstElementChild);
        offset -= cardStep;
      }
      track.style.transform = `translateX(-${offset}px)`;
    }
    previousTime = now;
    frameId = requestAnimationFrame(animate);
  }

  function schedule() {
    cancelAnimationFrame(frameId);
    previousTime = undefined;
    if (hovered || reducedMotion.matches || document.hidden) return;
    frameId = requestAnimationFrame(animate);
  }

  carousel.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  carousel.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
  window.addEventListener('resize', measure);
  measure();
  schedule();
})();
