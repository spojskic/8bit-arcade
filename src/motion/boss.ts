import { gsap } from 'gsap';
import { onPage, prefersReducedMotion } from '../engine';
import { addCoins, showBanner } from './hud';
import { hit, defeat } from './sound';

export function startBoss() {
  onPage(() => {
    const boss = document.querySelector<HTMLElement>('[data-boss]');
    const sprite = boss?.querySelector<HTMLElement>('[data-boss-sprite]');
    const hpEl = boss?.querySelector<HTMLElement>('[data-boss-hp]');
    if (!boss || !sprite || !hpEl) return;

    const segments = [...hpEl.children] as HTMLElement[];
    const line = document.querySelector<HTMLElement>('[data-boss-line]');
    let hp = segments.length || 5;
    const max = hp;
    let done = false;

    const flash = () => {
      sprite.classList.add('is-hit');
      gsap.delayedCall(0.08, () => sprite.classList.remove('is-hit'));
    };

    const shake = () => {
      gsap
        .timeline({ onComplete: () => gsap.set(sprite, { x: 0, y: 0 }) })
        .to(sprite, { x: 2, duration: 0.04, ease: 'steps(1)' })
        .to(sprite, { x: -2, duration: 0.04, ease: 'steps(1)' })
        .to(sprite, { x: 0, duration: 0.04, ease: 'steps(1)' });
    };

    const shrapnel = (x: number, y: number) => {
      for (let i = 0; i < 10; i++) {
        const p = document.createElement('i');
        p.className = 'boss__shard';
        p.style.cssText = `left:${x}px;top:${y}px`;
        boss.appendChild(p);
        gsap.to(p, {
          x: gsap.utils.random(-90, 90),
          y: gsap.utils.random(-70, 70),
          autoAlpha: 0,
          duration: gsap.utils.random(0.4, 0.75),
          ease: 'steps(4)',
          onComplete: () => p.remove(),
        });
      }
    };

    const explode = () => {
      const r = sprite.getBoundingClientRect();
      const br = boss.getBoundingClientRect();
      const cx = r.left - br.left + r.width / 2;
      const cy = r.top - br.top + r.height / 2;
      defeat();
      if (!prefersReducedMotion()) shrapnel(cx, cy);
      const targets = [sprite, hpEl];
      if (prefersReducedMotion()) {
        gsap.set(targets, { autoAlpha: 0 });
      } else {
        gsap.to(targets, { autoAlpha: 0, duration: 0.24, ease: 'steps(3)' });
      }
      addCoins(30);
      showBanner('MONSTER DEFEATED', '+30 COINS');
      if (line) line.hidden = false;
    };

    const strike = () => {
      if (done) return;
      hp--;
      flash();
      if (!prefersReducedMotion()) shake();
      hit(210 - (max - hp) * 28);
      segments[max - hp - 1]?.classList.add('is-spent');
      if (hp > 0) return;
      done = true;
      explode();
    };

    sprite.addEventListener('pointerdown', strike);
    return () => sprite.removeEventListener('pointerdown', strike);
  });
}
