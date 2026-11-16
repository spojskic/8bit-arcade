import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage, prefersReducedMotion } from '../engine';
import { blip } from './sound';

export function startDialog() {
  onPage(() => {
    const box = document.querySelector<HTMLElement>('[data-typewriter]');
    if (box) wireTypewriter(box);

    document.querySelectorAll<HTMLElement>('.quest__xp i').forEach((bar) => {
      gsap.fromTo(
        bar,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.7,
          ease: 'steps(8)',
          scrollTrigger: { trigger: bar, start: 'top 85%', once: true },
        },
      );
    });
  });
}

function wireTypewriter(box: HTMLElement) {
  if (prefersReducedMotion()) return;
  const paras = [...box.querySelectorAll<HTMLElement>('[data-type-p]')];
  const full = paras.map((p) => p.textContent || '');
  box.setAttribute('aria-label', full.join(' '));
  if (sessionStorage.getItem('sq-story')) return;
  paras.forEach((p) => {
    p.style.height = `${p.offsetHeight}px`;
    p.textContent = '';
  });

  ScrollTrigger.create({
    trigger: box,
    start: 'top 92%',
    once: true,
    onEnter: () => typeAll(paras, full, box),
  });
}

function typeAll(paras: HTMLElement[], full: string[], box: HTMLElement) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    paras.forEach((p, i) => {
      p.style.height = '';
      p.textContent = full[i];
    });
  };
  const tl = gsap.timeline({
    onComplete: () => {
      done = true;
      sessionStorage.setItem('sq-story', '1');
    },
  });
  paras.forEach((p, i) => {
    const state = { n: 0 };
    tl.to(
      state,
      {
        n: full[i].length,
        duration: Math.max(0.3, full[i].length * 0.004),
        ease: 'none',
        onUpdate: () => {
          const slice = full[i].slice(0, Math.round(state.n));
          if (p.textContent !== slice) {
            p.textContent = slice;
            if (Math.round(state.n) % 3 === 0) blip();
          }
        },
        onComplete: () => {
          p.style.height = '';
          p.textContent = full[i];
        },
      },
      i === 0 ? 0.2 : '+=0.3',
    );
  });
  ScrollTrigger.create({
    trigger: box,
    start: 'top bottom',
    end: 'bottom top',
    onLeave: () => {
      tl.progress(1);
      finish();
    },
    onLeaveBack: () => {
      tl.progress(1);
      finish();
    },
  });
}
