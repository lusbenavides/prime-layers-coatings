'use client';

import { useEffect } from 'react';

export function ScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 90);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    els.forEach((el) => obs.observe(el));

    const hdr = document.querySelector('header');
    const onScroll = () => {
      if (hdr) {
        hdr.style.boxShadow = window.scrollY > 40 ? '0 4px 28px rgba(0,0,0,0.5)' : 'none';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return null;
}
