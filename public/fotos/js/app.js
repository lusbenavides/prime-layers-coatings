// Scroll reveal — anima los bloques con clase .reveal cuando entran en pantalla
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 90);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
revealEls.forEach(el => revealObs.observe(el));

// Sombra del header al hacer scroll
const hdr = document.querySelector('header');
window.addEventListener('scroll', () => {
  hdr.style.boxShadow = window.scrollY > 40
    ? '0 4px 28px rgba(0,0,0,0.5)'
    : 'none';
}, { passive: true });