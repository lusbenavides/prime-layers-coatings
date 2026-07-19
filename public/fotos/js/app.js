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

// Abrir chat Ava desde distintos puntos de la UI
function openAvaChat() {
  const toggle = document.getElementById('chat-toggle');
  const win = document.getElementById('chat-window');
  if (toggle && win && !win.classList.contains('active')) toggle.click();
  document.getElementById('chat-hint')?.classList.remove('visible');
  sessionStorage.setItem('chatHintSeen', '1');
}

document.getElementById('mobile-chat-open')?.addEventListener('click', openAvaChat);
document.getElementById('open-ava-from-form')?.addEventListener('click', openAvaChat);

const chatHint = document.getElementById('chat-hint');
if (chatHint && !sessionStorage.getItem('chatHintSeen')) {
  setTimeout(() => chatHint.classList.add('visible'), 2200);
  chatHint.addEventListener('click', openAvaChat);
}

document.getElementById('chat-toggle')?.addEventListener('click', () => {
  chatHint?.classList.remove('visible');
  sessionStorage.setItem('chatHintSeen', '1');
});
