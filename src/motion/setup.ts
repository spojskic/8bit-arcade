import { gsap } from 'gsap';
import { setLoaderFormat, setLoaderExit, setTransition, onPage, onScroll, ease, stopScroll, startScroll, scrollToTarget, prefersReducedMotion } from '../engine';
import { toggle, soundState, armGesture } from './sound';
import { startHud } from './hud';
import { startHero } from './hero';
import { startDialog } from './dialog';
import { startQuestPreview } from './quests';
import { startWalk } from './walk';
import { startWorld } from './world';
import { startBoss } from './boss';
import { startRush } from './rush';
import { startShop } from './shop';

let nextLevel = { level: '', title: '' };

export function setupMotion() {
  setLoaderFormat((p) => String(Math.round(p)).padStart(3, '0'));

  setLoaderExit((root) => {
    const flash = { opacity: 1 };
    return gsap
      .timeline()
      .to(root.querySelector('.loader__boot'), { autoAlpha: 0, duration: 0.08, ease: 'steps(2)' })
      .to(root.querySelector('.loader__inner'), { autoAlpha: 0, duration: 0.08, ease: 'steps(2)' }, '<0.04')
      .to(root.querySelector('.loader__bar'), { backgroundColor: '#f2efe4', duration: 0.08 }, '<')
      .to(root, { clipPath: 'inset(49.85% 0% 49.85% 0%)', duration: 0.22, ease: 'power2.in' })
      .to(root, { autoAlpha: 0, duration: 0.08 })
      .set(root, { clipPath: 'inset(0% 0% 0% 0%)' });
  });

  setTransition({
    leave: (c) => {
      const level = c.querySelector<HTMLElement>('[data-curtain-level]')!;
      if (nextLevel.level) {
        level.firstChild!.textContent = nextLevel.level;
        level.querySelector<HTMLElement>('[data-curtain-level-title]')!.textContent = nextLevel.title;
      }
      nextLevel = { level: '', title: '' };
      return gsap
        .timeline()
        .set(c, { autoAlpha: 1 })
        .fromTo(c.querySelector('.curtain__panel'), { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: ease.inOut });
    },
    enter: (c) =>
      gsap
        .timeline()
        .to(c.querySelector('.curtain__panel'), { yPercent: -100, duration: 0.65, ease: ease.inOut })
        .set(c, { autoAlpha: 0 }),
  });

  addEventListener(
    'pointerdown',
    (e) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>('a[data-level]');
      if (!a) return;
      nextLevel = { level: a.dataset.level || '', title: a.dataset.levelTitle || '' };
      if (a.getAttribute('href')?.startsWith('/quest/')) {
        sessionStorage.setItem('sq-last-quest', a.getAttribute('href')!);
      }
    },
    true,
  );

  startHud();
  startHero();
  startDialog();
  startQuestPreview();
  startWalk();
  startWorld();
  startBoss();
  startRush();
  startShop();
  armGesture();

  let last = 0;
  onScroll(({ y }) => {
    if (Math.abs(y - last) < 4) return;
    document.documentElement.classList.toggle('frame-away', y > 200 && y > last);
    last = y;
  });

  onPage(() => {
    if (document.querySelector('[data-hero]')) return;
    const chips = [...document.querySelectorAll<HTMLElement>('.hud__bl--dock, .hud__br')];
    if (!chips.length) return;
    let away = false;
    const off = onScroll(({ y }) => {
      const next = y > 400;
      if (next === away) return;
      away = next;
      gsap.to(chips, {
        autoAlpha: next ? 0 : 1,
        duration: prefersReducedMotion() ? 0 : 0.25,
        ease: 'steps(3)',
        overwrite: true,
      });
    });
    return () => {
      off();
      gsap.killTweensOf(chips);
      gsap.set(chips, { clearProps: 'opacity,visibility' });
    };
  });

  onPage(() => {
    const last = sessionStorage.getItem('sq-last-quest');
    if (last) {
      const row = document.querySelector<HTMLElement>(`.qrow[href="${last}"]`);
      if (row) {
        row.classList.add('qrow--visited');
        row.setAttribute('aria-current', 'page');
      }
    }
    document.querySelectorAll<HTMLElement>('[data-fill]').forEach((btn) => {
      const fill = btn.querySelector<HTMLElement>('.btn__fill, .hero__cta-fill');
      if (!fill) return;
      const side = (e: PointerEvent) => {
        const r = btn.getBoundingClientRect();
        return e.clientX < r.left + r.width / 2 ? 'left' : 'right';
      };
      btn.addEventListener('pointerenter', (e) => {
        gsap.set(fill, { transformOrigin: `${side(e as PointerEvent)} center` });
        gsap.to(fill, { scaleX: 1, duration: 0.22, ease: 'steps(3)', overwrite: true });
      });
      btn.addEventListener('pointerleave', (e) => {
        gsap.to(fill, { scaleX: 0, duration: 0.22, ease: 'steps(3)', overwrite: true, onComplete: () => gsap.set(fill, { transformOrigin: `${side(e as PointerEvent)} center` }) });
      });
      btn.addEventListener('focus', () => gsap.to(fill, { scaleX: 1, duration: 0.22, ease: 'steps(3)', overwrite: true }));
      btn.addEventListener('blur', () => gsap.to(fill, { scaleX: 0, duration: 0.22, ease: 'steps(3)', overwrite: true }));
    });

    const syncSound = () => {
      const now = soundState();
      document.querySelectorAll<HTMLElement>('[data-sound]').forEach((b) => {
        b.setAttribute('aria-pressed', String(now !== 'off'));
        b.textContent = now === 'off' ? 'SOUND OFF' : now === 'sfx' ? 'SFX ON' : 'MUSIC ON';
      });
    };
    syncSound();
    document.querySelectorAll<HTMLElement>('[data-sound]').forEach((btn) => {
      btn.addEventListener('click', () => {
        toggle();
        syncSound();
      });
    });

    const openBtns = [...document.querySelectorAll<HTMLElement>('[data-menu-open]')];
    const menu = document.getElementById('menu');
    if (!openBtns.length || !menu) return;
    let open = false;
    let opener: HTMLElement | null = null;

    const setOpen = (v: boolean) => {
      open = v;
      menu!.hidden = !v;
      openBtns.forEach((b) => b.setAttribute('aria-expanded', String(v)));
      if (v) {
        stopScroll();
        (menu!.querySelector('a') as HTMLElement | null)?.focus();
      } else {
        startScroll();
        opener?.focus();
        opener = null;
      }
    };

    openBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (open) {
          setOpen(false);
          return;
        }
        opener = btn;
        setOpen(true);
      });
    });
    menu.addEventListener('click', (e) => {
      if (e.target === menu || (e.target as HTMLElement).matches('[data-menu-close]')) {
        setOpen(false);
        return;
      }
      if ((e.target as HTMLElement).closest('#menu a')) setOpen(false);
    });
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
      if (e.key !== 'Tab') return;
      const links = [...menu!.querySelectorAll<HTMLElement>('a, button')];
      const first = links[0];
      const last = links[links.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    return () => {
      opener = null;
      setOpen(false);
    };
  });
}
