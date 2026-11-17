import { gsap } from 'gsap';
import { onPage, prefersReducedMotion } from '../engine';
import { coin as coinSfx, fanfare, blip, oneUp } from './sound';

export function readCoins() {
  return parseInt(localStorage.getItem('sq-coins') || '0', 10);
}

function paintCoins(total: number) {
  document.querySelectorAll<HTMLElement>('.coin-count').forEach((el) => {
    el.textContent = String(total).padStart(3, '0');
  });
}

export function addCoins(n: number) {
  const prev = readCoins();
  const total = Math.min(999, prev + n);
  localStorage.setItem('sq-coins', String(total));
  paintCoins(total);
  if (Math.floor(total / 100) > Math.floor(prev / 100)) {
    oneUp();
    showBanner('1UP!', '100 COINS, AS THE ANCIENTS DEMANDED');
  }
}

export function spendCoins(n: number) {
  const prev = readCoins();
  if (prev < n) return false;
  const total = Math.max(0, prev - n);
  localStorage.setItem('sq-coins', String(total));
  paintCoins(total);
  return true;
}

let banner: HTMLElement | null = null;
let bannerTimer: gsap.core.Tween | null = null;

export function showBanner(title: string, sub: string) {
  bannerTimer?.kill();
  banner?.remove();
  const el = document.createElement('div');
  el.className = 'banner';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  const t = document.createElement('strong');
  t.className = 'banner__title';
  t.textContent = title;
  const s = document.createElement('span');
  s.className = 'banner__sub';
  s.textContent = sub;
  el.append(t, s);
  document.body.appendChild(el);
  banner = el;
  if (prefersReducedMotion()) {
    gsap.set(el, { autoAlpha: 1 });
  } else {
    gsap.fromTo(el, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.28, ease: 'steps(3)' });
  }
  bannerTimer = gsap.delayedCall(2.8, () => {
    if (banner !== el) return;
    banner = null;
    if (prefersReducedMotion()) {
      el.remove();
      return;
    }
    gsap.to(el, { y: 16, autoAlpha: 0, duration: 0.2, ease: 'steps(2)', onComplete: () => el.remove() });
  });
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let seq = 0;
let ggSeq = 0;

function konami(e: KeyboardEvent) {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  seq = key === KONAMI[seq] ? seq + 1 : key === KONAMI[0] ? 1 : 0;
  if (seq < KONAMI.length) return;
  seq = 0;
  trigger();
}

function gg(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
  const key = e.key.toLowerCase();
  if (key !== 'g') {
    ggSeq = 0;
    return;
  }
  ggSeq++;
  if (ggSeq < 2) return;
  ggSeq = 0;
  addCoins(10);
  if (!prefersReducedMotion()) shower(8, 12);
  showBanner('GG', '+10 COINS · WELL PLAYED');
}

function shower(count: number, step: number) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;inset:0;z-index:70;pointer-events:none';
  document.body.appendChild(host);
  for (let i = 0; i < count; i++) {
    const c = document.createElement('i');
    c.className = 'coin';
    c.style.cssText = `position:absolute;left:${(i * step + 13) % 96}vw;top:-16px;opacity:1`;
    host.appendChild(c);
    gsap.to(c, {
      y: innerHeight + 40,
      duration: 0.9 + (i % 5) * 0.16,
      delay: (i % 8) * 0.07,
      ease: 'power1.in',
      onComplete: () => c.remove(),
    });
  }
  gsap.delayedCall(2.4, () => host.remove());
}

function trigger() {
  addCoins(30);
  fanfare();
  document.documentElement.classList.add('konami');
  setTimeout(() => document.documentElement.classList.remove('konami'), 400);
  shower(24, 41);
}

export function startHud() {
  addEventListener('keydown', konami);
  addEventListener('keydown', gg);
  onPage(() => {
    paintCoins(readCoins());
  });
}

export { blip };
