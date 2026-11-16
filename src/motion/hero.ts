import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { onPage, scrollToTarget, isTouch, prefersReducedMotion } from '../engine';
import { coin as coinSfx, blip, achievement, bounce as bounceSfx } from './sound';
import { addCoins, showBanner } from './hud';

gsap.registerPlugin(Physics2DPlugin);

type BlockState = {
  el: HTMLElement;
  gx: number;
  gy: number;
  alive: boolean;
};

type CoinState = {
  el: HTMLElement;
  x: number;
  y: number;
  active: boolean;
  settled: boolean;
  toy: boolean;
  drag: boolean;
  pointer: number;
  ox: number;
  oy: number;
  samples: { t: number; x: number; y: number }[];
  ttl: gsap.core.Tween | null;
  toyCall: gsap.core.Tween | null;
  rest: gsap.core.Tween | null;
  fly: gsap.core.Tween | null;
};

const REASSEMBLE_MS = 850;
const COLLECT_R = 26;
const CARVE_R = 1.9;
const ATTRACT_MS = 25000;
const HIDDEN_LIMIT = 3;
const COIN_SIZE = 12;
const COIN_TTL = 7;
const TOY_DELAY = 1.5;
const TOY_REST = 8;
const MAGNET_R = 300;
const MAGNET_V = 70;
const DUST_MAX = 24;
const PUNCH_GAP = 80;
const FLING_MAX = 2200;
const FLING_G = 2000;
const FLING_FRICTION = 0.02;
const FLING_BOUNCE = 0.4;
const BOUNCE_MAX = 3;

export function startHero() {
  onPage(({ intro }) => {
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    if (!hero) return;
    wirePressStart(hero);

    if (prefersReducedMotion()) return;
    const magnet = Boolean(readInventory().magnet);
    const stage = hero.querySelector<HTMLElement>('[data-stage]')!;
    const blocks: BlockState[] = [...stage.querySelectorAll<HTMLElement>('.block')].map((el) => ({
      el,
      gx: parseFloat(el.dataset.col || '0') + 0.5,
      gy: parseFloat(el.dataset.row || '0') + 0.5,
      alive: true,
    }));
    const coins: CoinState[] = [...hero.querySelectorAll<HTMLElement>('.coin')].map((el) => ({
      el, x: 0, y: 0, active: false, settled: false, toy: false, drag: false, pointer: -1, ox: 0, oy: 0, samples: [], ttl: null, toyCall: null, rest: null, fly: null,
    }));

    gsap.set(blocks.map((b) => b.el), { autoAlpha: 0, scale: 0 });
    intro.add(
      gsap.to(blocks.map((b) => b.el), {
        autoAlpha: 1,
        scale: 1,
        duration: 0.24,
        ease: 'steps(2)',
        stagger: { each: 0.006, from: 'start' },
      }),
      0.1,
    );
    intro.add(gsap.from('[data-hero] .hero__sub, [data-hero] .hero__cta', { autoAlpha: 0, y: 24, duration: 0.4, ease: 'steps(4)', stagger: 0.1 }), 0.5);

    const idleTl = gsap.timeline({ paused: true });
    hero.querySelectorAll<HTMLElement>('.star').forEach((el, i) => {
      idleTl.fromTo(el, { opacity: 0.25 }, {
        opacity: 0.85,
        duration: 1.2,
        ease: 'steps(1)',
        repeat: -1,
        yoyo: true,
        delay: (i % 8) * 0.15,
      }, 0);
    });
    hero.querySelectorAll<HTMLElement>('.cloud').forEach((el, i) => {
      const dur = 46 + i * 14;
      idleTl.fromTo(el, { x: -innerWidth * 0.2 }, {
        x: innerWidth * 1.25,
        duration: dur,
        ease: 'none',
        repeat: -1,
        delay: -(i * dur) / 4,
      }, 0);
    });
    const cta = hero.querySelector<HTMLElement>('[data-press-start]');
    let cleanupCta = () => {};
    if (cta) {
      const pulse = gsap
        .timeline({ paused: true, repeat: -1 })
        .to(cta, { opacity: 0.45, duration: 0.28, ease: 'steps(2)', overwrite: 'auto' })
        .to(cta, { opacity: 1, duration: 0.85, ease: 'steps(2)', overwrite: 'auto' });
      const hold = () => {
        pulse.pause();
        gsap.set(cta, { opacity: 1 });
      };
      const release = () => pulse.resume();
      intro.add(() => pulse.play(0));
      cta.addEventListener('pointerenter', hold);
      cta.addEventListener('pointerleave', release);
      cta.addEventListener('focus', hold);
      cta.addEventListener('blur', release);
      cleanupCta = () => {
        cta.removeEventListener('pointerenter', hold);
        cta.removeEventListener('pointerleave', release);
        cta.removeEventListener('focus', hold);
        cta.removeEventListener('blur', release);
      };
    }

    const far = hero.querySelector<HTMLElement>('[data-sky-far]');
    const near = hero.querySelector<HTMLElement>('[data-sky-near]');
    const farX = far ? gsap.quickTo(far, 'x', { duration: 1.1, ease: 'power2.out' }) : null;
    const farY = far ? gsap.quickTo(far, 'y', { duration: 1.1, ease: 'power2.out' }) : null;
    const nearX = near ? gsap.quickTo(near, 'x', { duration: 0.8, ease: 'power2.out' }) : null;
    const nearY = near ? gsap.quickTo(near, 'y', { duration: 0.8, ease: 'power2.out' }) : null;

    let px = -9999;
    let py = -9999;
    let lastMove = performance.now();
    let lastCell = -1;
    let carved = 0;
    let running = false;
    let demolition = false;
    let hiddenCount = 0;
    let attractDone = false;

    const stageRect = () => stage.getBoundingClientRect();
    const heroRect = () => hero.getBoundingClientRect();
    const groundY = () => hero.offsetHeight - 24 - COIN_SIZE;

    const anchor = (c: CoinState) => {
      const tx = Number(gsap.getProperty(c.el, 'x')) || 0;
      const ty = Number(gsap.getProperty(c.el, 'y')) || 0;
      c.x = gsap.utils.clamp(0, hero.offsetWidth - COIN_SIZE, c.x + tx);
      c.y = gsap.utils.clamp(0, groundY(), c.y + ty);
      gsap.set(c.el, { left: c.x, top: c.y, x: 0, y: 0 });
    };

    const release = (c: CoinState) => {
      c.active = false;
      c.settled = false;
      c.toy = false;
      c.drag = false;
      c.pointer = -1;
      c.samples = [];
      c.ttl?.kill();
      c.ttl = null;
      c.toyCall?.kill();
      c.toyCall = null;
      c.rest?.kill();
      c.rest = null;
      c.fly?.kill();
      c.fly = null;
      c.el.classList.remove('coin--toy');
      gsap.set(c.el, { pointerEvents: 'none', touchAction: 'auto' });
      gsap.killTweensOf(c.el);
    };

    const armRest = (c: CoinState) => {
      c.rest?.kill();
      c.rest = null;
      if (!c.active || !c.toy || c.drag) return;
      c.rest = gsap.delayedCall(TOY_REST, () => {
        c.rest = null;
        if (!c.active || !c.toy || c.drag) return;
        release(c);
        addCoins(1);
        coinSfx();
        gsap.to(c.el, { y: '-=20', scale: 0.4, autoAlpha: 0, duration: 0.24, ease: 'steps(2)' });
      });
    };

    const makeToy = (c: CoinState) => {
      c.toyCall = null;
      if (!c.active || c.toy || c.drag || prefersReducedMotion()) return;
      c.toy = true;
      c.ttl?.kill();
      c.ttl = null;
      c.el.classList.add('coin--toy');
      gsap.set(c.el, { pointerEvents: 'auto', touchAction: 'none' });
      armRest(c);
    };

    const landed = (c: CoinState) => {
      if (!c.active) return;
      anchor(c);
      c.settled = true;
      c.ttl?.kill();
      c.ttl = gsap.delayedCall(COIN_TTL, () => {
        c.ttl = null;
        if (!c.active || c.toy) return;
        c.active = false;
        gsap.to(c.el, { autoAlpha: 0, duration: 0.2, ease: 'steps(2)' });
      });
      c.toyCall?.kill();
      c.toyCall = gsap.delayedCall(TOY_DELAY, () => makeToy(c));
    };

    let punchedAt = -999;
    const punch = () => {
      const now = performance.now();
      if (now - punchedAt < PUNCH_GAP) return;
      punchedAt = now;
      gsap.fromTo(stage, { y: 0 }, { y: 2, duration: 0.035, ease: 'steps(1)', yoyo: true, repeat: 1 });
    };

    let dust: HTMLElement[] = [];
    let dustAt = 0;
    const dustBurst = (x: number, y: number, gold: boolean) => {
      if (!dust.length) {
        for (let i = 0; i < DUST_MAX; i++) {
          const p = document.createElement('div');
          p.setAttribute('aria-hidden', 'true');
          p.style.cssText = 'position:absolute;width:4px;height:4px;pointer-events:none;opacity:0';
          hero.appendChild(p);
          dust.push(p);
        }
      }
      for (let i = 0; i < 3; i++) {
        const p = dust[dustAt % DUST_MAX];
        dustAt++;
        gsap.killTweensOf(p);
        const angle = Math.random() * Math.PI * 2;
        const dist = gsap.utils.random(8, 24);
        gsap.set(p, { left: x, top: y, x: 0, y: 0, scale: 1, autoAlpha: 1, backgroundColor: gold ? 'var(--c-accent)' : 'var(--c-fg)' });
        gsap.to(p, {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          scale: 0,
          autoAlpha: 0,
          duration: 0.25,
          ease: 'steps(2)',
        });
      }
    };

    const fling = (c: CoinState, vx: number, vy: number, hop: number) => {
      const room = hero.offsetWidth - COIN_SIZE;
      const floor = groundY();
      let hit = false;
      let lastT = performance.now();
      let lastY = 0;

      c.fly = gsap.to(c.el, {
        physics2D: {
          velocity: Math.min(FLING_MAX, Math.hypot(vx, vy)),
          angle: (Math.atan2(vy, vx) * 180) / Math.PI,
          gravity: FLING_G,
          friction: FLING_FRICTION,
        },
        duration: 4,
        onUpdate: () => {
          if (hit || !c.active) return;
          const now = performance.now();
          const dt = Math.max(0.004, (now - lastT) / 1000);
          const nx = Number(gsap.getProperty(c.el, 'x')) || 0;
          const ny = Number(gsap.getProperty(c.el, 'y')) || 0;
          const speedY = (ny - lastY) / dt;
          lastT = now;
          lastY = ny;
          if (c.x + nx < 0 || c.x + nx > room) {
            hit = true;
            c.fly?.kill();
            c.fly = null;
            gsap.set(c.el, { x: gsap.utils.clamp(-c.x, room - c.x, nx) });
            anchor(c);
            fling(c, -vx * 0.45, speedY, hop);
            return;
          }
          if (c.y + ny >= floor) {
            hit = true;
            c.fly?.kill();
            c.fly = null;
            gsap.set(c.el, { y: floor - c.y });
            anchor(c);
            const speed = Math.abs(speedY);
            if (hop < BOUNCE_MAX && speed >= 150) {
              bounceSfx(140 + Math.min(620, speed * 0.38));
              fling(c, vx * 0.85, -speed * FLING_BOUNCE, hop + 1);
            } else {
              armRest(c);
            }
          }
        },
      });
    };

    const grab = (c: CoinState, e: PointerEvent) => {
      if (!c.toy || c.drag) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      c.fly?.kill();
      c.fly = null;
      c.rest?.kill();
      c.rest = null;
      anchor(c);
      const r = c.el.getBoundingClientRect();
      c.drag = true;
      c.pointer = e.pointerId;
      c.ox = e.clientX - r.left;
      c.oy = e.clientY - r.top;
      c.samples = [{ t: performance.now(), x: e.clientX, y: e.clientY }];
      c.el.setPointerCapture(e.pointerId);
      gsap.set(c.el, { scale: 1.15 });
      e.preventDefault();
    };

    const drag = (c: CoinState, e: PointerEvent) => {
      if (!c.drag || e.pointerId !== c.pointer) return;
      const hr = heroRect();
      c.x = gsap.utils.clamp(0, hero.offsetWidth - COIN_SIZE, e.clientX - hr.left - c.ox);
      c.y = gsap.utils.clamp(0, groundY(), e.clientY - hr.top - c.oy);
      gsap.set(c.el, { left: c.x, top: c.y, x: 0, y: 0 });
      c.samples.push({ t: performance.now(), x: e.clientX, y: e.clientY });
      while (c.samples.length > 4) c.samples.shift();
    };

    const drop = (c: CoinState, e: PointerEvent) => {
      if (!c.drag || e.pointerId !== c.pointer) return;
      c.drag = false;
      c.pointer = -1;
      if (c.el.hasPointerCapture(e.pointerId)) c.el.releasePointerCapture(e.pointerId);
      gsap.set(c.el, { scale: 1 });
      const first = c.samples[0];
      const last = c.samples[c.samples.length - 1];
      const dt = first && last ? Math.max(8, last.t - first.t) / 1000 : 1;
      const stale = !last || performance.now() - last.t > 100;
      const vx = !stale && first && last ? (last.x - first.x) / dt : 0;
      const vy = !stale && first && last ? (last.y - first.y) / dt : 0;
      c.samples = [];
      const speed = Math.hypot(vx, vy);
      const k = speed > FLING_MAX ? FLING_MAX / speed : 1;
      if (speed < 90 && c.y >= groundY() - 1) {
        anchor(c);
        armRest(c);
        return;
      }
      fling(c, vx * k, vy * k, 0);
    };

    const spawnCoin = (b: BlockState) => {
      const c = coins.find((k) => !k.active);
      if (!c) return;
      const sr = stageRect();
      release(c);
      c.active = true;
      c.settled = false;
      c.x = sr.left - heroRect().left + (b.gx / 29) * sr.width;
      c.y = sr.top - heroRect().top + (b.gy / 7) * sr.height;
      gsap.set(c.el, { x: 0, y: 0, scale: 1, autoAlpha: 1, left: c.x, top: c.y });
      gsap
        .timeline()
        .to(c.el, { y: -34, duration: 0.16, ease: 'steps(2)' })
        .to(c.el, { y: groundY() - c.y, duration: 0.34, ease: 'power1.in' })
        .to(c.el, { y: (groundY() - c.y) - 10, duration: 0.1, ease: 'steps(1)' })
        .to(c.el, { y: groundY() - c.y, duration: 0.1, ease: 'steps(1)' })
        .add(() => landed(c));
    };

    const collect = (c: CoinState) => {
      release(c);
      addCoins(1);
      coinSfx();
      gsap.to(c.el, { y: '-=44', scale: 0, autoAlpha: 0, duration: 0.2, ease: 'steps(2)' });
    };

    const geyser = () => {
      const sr = stageRect();
      const hr = heroRect();
      const cx = sr.left - hr.left + sr.width / 2 - 6;
      const cy = sr.top - hr.top + sr.height / 2;
      let n = 0;
      for (const c of coins) {
        if (c.active) continue;
        if (n >= 4) break;
        const delay = n * 0.08;
        n++;
        release(c);
        c.active = true;
        c.settled = false;
        c.x = cx;
        c.y = cy;
        gsap.set(c.el, { x: 0, y: 0, scale: 1, autoAlpha: 1, left: c.x, top: c.y });
        gsap
          .timeline({ delay })
          .to(c.el, { y: -gsap.utils.random(70, 120), duration: 0.4, ease: 'power2.out' })
          .to(c.el, { y: groundY() - c.y, duration: 0.5, ease: 'power1.in' })
          .add(() => landed(c));
      }
    };

    const shrapnel = () => {
      const sr = stageRect();
      const hr = heroRect();
      const cx = sr.left - hr.left + sr.width / 2 - 6;
      const cy = sr.top - hr.top + sr.height / 2 - 6;
      for (let i = 0; i < 8; i++) {
        const p = document.createElement('i');
        p.className = 'coin';
        p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;opacity:1`;
        hero.appendChild(p);
        gsap.to(p, {
          x: gsap.utils.random(-120, 120),
          y: gsap.utils.random(-120, 120),
          scale: gsap.utils.random(0.6, 1.4),
          autoAlpha: 0,
          duration: gsap.utils.random(0.45, 0.8),
          ease: 'steps(4)',
          onComplete: () => p.remove(),
        });
      }
    };

    const shake = () => {
      gsap
        .timeline({ onComplete: () => gsap.set(hero, { x: 0, y: 0 }) })
        .to(hero, { x: 10, y: -8, duration: 0.06, ease: 'steps(2)' })
        .to(hero, { x: -9, y: 7, duration: 0.06, ease: 'steps(2)' })
        .to(hero, { x: 8, y: 9, duration: 0.06, ease: 'steps(2)' })
        .to(hero, { x: -7, y: -9, duration: 0.06, ease: 'steps(2)' })
        .to(hero, { x: 5, y: 6, duration: 0.06, ease: 'steps(2)' })
        .to(hero, { x: -4, y: -5, duration: 0.06, ease: 'steps(2)' });
    };

    const demolish = () => {
      demolition = true;
      shake();
      shrapnel();
      geyser();
      addCoins(25);
      achievement();
      showBanner('SECRET FOUND', 'DEMOLITION · +25 COINS');
    };

    const carve = (b: BlockState) => {
      if (!b.alive) return;
      b.alive = false;
      carved++;
      const gold = b.el.classList.contains('block--gold');
      const sr = stageRect();
      const hr = heroRect();
      dustBurst(
        sr.left - hr.left + (b.gx / 29) * sr.width - 2,
        sr.top - hr.top + (b.gy / 7) * sr.height - 2,
        gold,
      );
      punch();
      gsap.to(b.el, {
        x: gsap.utils.random(-34, 34),
        y: gsap.utils.random(-14, 46),
        autoAlpha: 0,
        scale: 0,
        duration: 0.2,
        ease: 'steps(2)',
      });
      if (Math.random() < (gold ? 0.75 : 0.22)) spawnCoin(b);
      if (carved >= blocks.length && !demolition) demolish();
    };

    const reassemble = () => {
      const order = [...blocks].sort((a, b) => a.gy - b.gy || a.gx - b.gx);
      order.forEach((b, i) => {
        if (b.alive) return;
        b.alive = true;
        gsap.set(b.el, { x: 0, y: 0, scale: 1, autoAlpha: 1, delay: i * 0.004 });
        if (i % 14 === 0) blip();
      });
      carved = 0;
      demolition = false;
    };

    const pointerToGrid = (e: PointerEvent) => {
      const sr = stageRect();
      return {
        gx: ((e.clientX - sr.left) / sr.width) * 29,
        gy: ((e.clientY - sr.top) / sr.height) * 7,
        inside: e.clientX >= sr.left && e.clientX <= sr.right && e.clientY >= sr.top && e.clientY <= sr.bottom,
      };
    };

    const onMove = (e: PointerEvent) => {
      const hr = heroRect();
      px = e.clientX - hr.left;
      py = e.clientY - hr.top;
      lastMove = performance.now();
      if (farX && farY && nearX && nearY) {
        const nx = (e.clientX / innerWidth - 0.5) * 2;
        const ny = (e.clientY / innerHeight - 0.5) * 2;
        farX(nx * -10); farY(ny * -6);
        nearX(nx * -22); nearY(ny * -12);
      }
      const g = pointerToGrid(e);
      if (!g.inside) return;
      const cell = Math.floor(g.gy) * 29 + Math.floor(g.gx);
      if (cell === lastCell) return;
      lastCell = cell;
      for (const b of blocks) {
        const dx = b.gx - g.gx;
        const dy = (b.gy - g.gy) * (29 / 7);
        if (dx * dx + dy * dy < CARVE_R * CARVE_R) carve(b);
      }
    };

    const onTap = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!stage.contains(target)) return;
      const g = pointerToGrid(e);
      for (const b of blocks) {
        const dx = b.gx - g.gx;
        const dy = (b.gy - g.gy) * (29 / 7);
        if (dx * dx + dy * dy < 6.25) carve(b);
      }
    };

    const hiddenBlock = (x: number, y: number) => {
      const block = document.createElement('i');
      block.setAttribute('aria-hidden', 'true');
      block.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:12px;height:12px;background:var(--c-accent);box-shadow:inset -3px -3px 0 0 #b8860b,inset 3px 3px 0 0 #ffe27a;pointer-events:none`;
      hero.appendChild(block);
      gsap.fromTo(block, { scale: 0 }, { scale: 1, duration: 0.18, ease: 'steps(3)' });
      gsap.to(block, { autoAlpha: 0, duration: 0.3, delay: 1.9, ease: 'steps(2)', onComplete: () => block.remove() });

      const c = coins.find((k) => !k.active);
      if (!c) return;
      c.active = true;
      c.settled = false;
      c.x = x - 6;
      c.y = y - 12;
      gsap.set(c.el, { x: 0, y: 0, scale: 1, autoAlpha: 1, left: c.x, top: c.y });
      gsap
        .timeline({ delay: 0.14 })
        .to(c.el, { y: -26, duration: 0.18, ease: 'steps(2)' })
        .to(c.el, { y: groundY() - c.y, duration: 0.4, ease: 'power1.in' })
        .to(c.el, { y: (groundY() - c.y) - 8, duration: 0.08, ease: 'steps(1)' })
        .to(c.el, { y: groundY() - c.y, duration: 0.08, ease: 'steps(1)' })
        .add(() => {
          if (!c.active) return;
          c.active = false;
          addCoins(1);
          coinSfx();
          gsap.to(c.el, { y: '-=44', scale: 0, autoAlpha: 0, duration: 0.2, ease: 'steps(2)' });
        });
    };

    const onHidden = (e: PointerEvent) => {
      if (hiddenCount >= HIDDEN_LIMIT) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-stage], .hero__cta, .coin, a, button')) return;
      const hr = heroRect();
      hiddenCount++;
      hiddenBlock(e.clientX - hr.left, e.clientY - hr.top);
    };

    const attract = () => {
      attractDone = true;
      const bat = document.createElement('div');
      bat.setAttribute('aria-hidden', 'true');
      bat.style.cssText = 'position:absolute;left:-40px;top:24%;pointer-events:none;z-index:3';
      bat.innerHTML =
        '<svg width="24" height="12" viewBox="0 0 24 12" fill="#8f8ca8"><rect class="bat__wing" x="0" y="2" width="10" height="4"/><rect class="bat__wing" x="14" y="2" width="10" height="4"/><rect x="10" y="4" width="4" height="5"/></svg>';
      hero.appendChild(bat);
      const wings = bat.querySelectorAll<SVGRectElement>('.bat__wing');
      gsap.set(wings, { transformBox: 'fill-box', transformOrigin: 'center' });
      const flap = gsap.to(wings, { scaleY: 0.2, duration: 0.12, ease: 'steps(2)', repeat: -1, yoyo: true });
      const wobble = gsap.to(bat, { y: 14, duration: 0.9, ease: 'sine.inOut', repeat: 3, yoyo: true });
      gsap.to(bat, {
        x: hero.offsetWidth + 60,
        duration: 4,
        ease: 'none',
        onComplete: () => {
          flap.kill();
          wobble.kill();
          bat.remove();
        },
      });
      if (!cta) return;
      const ctaLabel = cta.querySelector<HTMLElement>('.hero__cta-label') || cta;
      ctaLabel.textContent = 'STILL THERE?';
      gsap.delayedCall(5, () => {
        if (cta) ctaLabel.textContent = 'PRESS START';
      });
    };

    const tick = () => {
      if (carved > 0 && performance.now() - lastMove > REASSEMBLE_MS) reassemble();
      if (!attractDone && running && performance.now() - lastMove > ATTRACT_MS) attract();
      if (isTouch()) return;
      const pull = magnet ? (MAGNET_V * gsap.ticker.deltaRatio()) / 60 : 0;
      for (const c of coins) {
        if (!c.active || c.toy || c.drag) continue;
        const dx = px - (c.x + 6);
        const dy = py - (c.y + 6);
        const d2 = dx * dx + dy * dy;
        if (d2 < COLLECT_R * COLLECT_R) {
          collect(c);
          continue;
        }
        if (!pull || !c.settled || d2 > MAGNET_R * MAGNET_R) continue;
        const step = pull / Math.sqrt(d2);
        c.x = gsap.utils.clamp(0, hero.offsetWidth - COIN_SIZE, c.x + dx * step);
        c.y = gsap.utils.clamp(0, groundY(), c.y + dy * step);
        gsap.set(c.el, { left: Math.round(c.x), top: Math.round(c.y), x: 0, y: 0 });
      }
    };

    const coinAt = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('.coin');
      return el ? coins.find((c) => c.el === el) : undefined;
    };
    const coinDown = (e: PointerEvent) => {
      const c = coinAt(e);
      if (c) grab(c, e);
    };
    const coinMove = (e: PointerEvent) => {
      const c = coinAt(e);
      if (c) drag(c, e);
    };
    const coinUp = (e: PointerEvent) => {
      const c = coinAt(e);
      if (c) drop(c, e);
    };

    const move = (e: PointerEvent) => onMove(e);
    const down = (e: PointerEvent) => onTap(e);
    const hidden = (e: PointerEvent) => onHidden(e);

    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerdown', hidden, { passive: true });
    if (isTouch()) hero.addEventListener('pointerdown', down, { passive: true });
    hero.addEventListener('pointerdown', coinDown);
    hero.addEventListener('pointermove', coinMove);
    hero.addEventListener('pointerup', coinUp);
    hero.addEventListener('pointercancel', coinUp);

    const st = ScrollTrigger.create({
      trigger: hero,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        running = self.isActive;
        idleTl.paused(!self.isActive);
        gsap.ticker[self.isActive ? 'add' : 'remove'](tick);
      },
    });

    return () => {
      cleanupCta();
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerdown', hidden);
      hero.removeEventListener('pointerdown', down);
      hero.removeEventListener('pointerdown', coinDown);
      hero.removeEventListener('pointermove', coinMove);
      hero.removeEventListener('pointerup', coinUp);
      hero.removeEventListener('pointercancel', coinUp);
      gsap.ticker.remove(tick);
      for (const c of coins) {
        c.ttl?.kill();
        c.toyCall?.kill();
        c.rest?.kill();
        c.fly?.kill();
      }
      st.kill();
    };
  });
}

function readInventory(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem('sq-inventory');
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function wirePressStart(hero: HTMLElement) {
  const btn = hero.querySelector<HTMLElement>('[data-press-start]');
  if (!btn) return;
  btn.addEventListener('click', () => scrollToTarget('#about'));
}
