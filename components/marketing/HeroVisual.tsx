'use client';

import { useEffect, useRef } from 'react';

export function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const progressBar = fillRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Array<{
      x: number; y: number; r: number; vy: number; vx: number; color: string; alpha: number;
    }> = [];
    let progress = 0;
    let growing = true;
    let rafId: number;

    const colors = ['#e8922a', '#f5b55a', '#ffffff', '#1a3a5e', '#7a8fa8'];

    const resize = () => {
      const wrap = canvas.parentElement;
      if (!wrap) return;
      canvas.width = wrap.offsetWidth;
      canvas.height = wrap.offsetHeight;
    };

    const spawn = () => {
      if (particles.length > 48) return;
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 8,
        r: Math.random() * 3 + 1,
        vy: -(Math.random() * 1.2 + 0.4),
        vx: (Math.random() - 0.5) * 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2,
      });
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.003;
        if (p.alpha <= 0 || p.y < -10) return false;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1;
      if (Math.random() > 0.65) spawn();
      rafId = requestAnimationFrame(tick);
    };

    const animateProgress = () => {
      if (progressBar) {
        progress += growing ? 0.35 : -0.35;
        if (progress >= 100) { progress = 100; growing = false; }
        if (progress <= 12) { progress = 12; growing = true; }
        progressBar.style.width = `${progress}%`;
      }
      rafId = requestAnimationFrame(animateProgress);
    };

    resize();
    window.addEventListener('resize', resize);
    tick();
    animateProgress();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <video
        className="hero-video"
        src="/fotos/7720.mp4"
        autoPlay
        loop
        muted
        playsInline
        poster="/fotos/8871.webp"
        aria-label="Painting renovation in progress"
      />
      <canvas ref={canvasRef} id="hero-canvas" aria-hidden="true" />
      <div className="hero-visual-shade" />
      <div className="hero-visual-ui">
        <div className="hero-live-tag"><span className="hero-live-dot" /> Live from our projects</div>
        <div className="hero-progress-wrap">
          <span className="hero-progress-label">Transforming your space</span>
          <div className="hero-progress-track"><div className="hero-progress-fill" ref={fillRef} /></div>
        </div>
      </div>
    </>
  );
}
