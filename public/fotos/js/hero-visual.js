// Hero: partículas de pintura + barra de progreso de "transformación"
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('hero-canvas');
  const progressBar = document.querySelector('.hero-progress-fill');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let progress = 0;
  let growing = true;

  const colors = ['#e8922a', '#f5b55a', '#ffffff', '#1a3a5e', '#7a8fa8'];

  function resize() {
    const wrap = canvas.parentElement;
    canvas.width = wrap.offsetWidth;
    canvas.height = wrap.offsetHeight;
  }

  function spawn() {
    if (particles.length > 48) return;
    particles.push({
      x: Math.random() * canvas.width,
      y: canvas.height + 8,
      r: Math.random() * 3 + 1,
      vy: -(Math.random() * 1.2 + 0.4),
      vx: (Math.random() - 0.5) * 0.6,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.2
    });
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.003;
      if (p.alpha <= 0 || p.y < -10) {
        particles.splice(i, 1);
        return;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (Math.random() > 0.65) spawn();
    requestAnimationFrame(tick);
  }

  function animateProgress() {
    if (!progressBar) return;
    progress += growing ? 0.35 : -0.35;
    if (progress >= 100) { progress = 100; growing = false; }
    if (progress <= 12) { progress = 12; growing = true; }
    progressBar.style.width = `${progress}%`;
    requestAnimationFrame(animateProgress);
  }

  resize();
  window.addEventListener('resize', resize);
  tick();
  animateProgress();
});
