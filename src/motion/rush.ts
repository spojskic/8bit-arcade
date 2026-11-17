import { gsap } from 'gsap';
import { onPage, prefersReducedMotion, startScroll, stopScroll } from '../engine';
import { addCoins, showBanner } from './hud';
import { bounce, coin } from './sound';

const KEY = 'sq-rush-best';
const DURATION = 15;
const PROXIMITY = 32;
const TAP = 64;

type CoinRec = { el: HTMLElement; dead: boolean };

const readBest = () => parseInt(localStorage.getItem(KEY) || '0', 10) || 0;
const pad = (n: number) => String(n).padStart(2, '0');

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
}

function syncBest() {
  document.querySelectorAll<HTMLElement>('[data-rush-best]').forEach((n) => {
    n.textContent = pad(readBest());
  });
}

function modal(label: string) {
  const o = el('div', 'rush');
  o.setAttribute('role', 'dialog');
  o.setAttribute('aria-modal', 'true');
  o.setAttribute('aria-label', label);
  document.body.appendChild(o);
  return o;
}

export function startRush() {
  onPage(() => {
    const triggers = [...document.querySelectorAll<HTMLElement>('[data-rush-open]')];
    if (!triggers.length) return;
    syncBest();
    let active: (() => void) | null = null;

    const open = (trigger: HTMLElement) => {
      if (active) return;
      const release = () => {
        active = null;
        trigger.focus();
      };
      active = prefersReducedMotion() ? openStatic(release) : openGame(release);
    };

    const listeners = triggers.map((btn) => {
      const fn = () => open(btn);
      btn.addEventListener('click', fn);
      return () => btn.removeEventListener('click', fn);
    });

    return () => {
      listeners.forEach((off) => off());
      active?.();
      active = null;
    };
  });
}

function openStatic(release: () => void) {
  stopScroll();
  const o = modal('Coin Rush bonus stage');
  o.classList.add('rush--static');
  const box = el('div', 'dialog rush__static');
  const title = el('h2', 'rush__static-title', 'COIN RUSH');
  const text = el('p', 'rush__static-text', 'This bonus stage needs motion. Have 10 coins on the house.');
  const closeBtn = el('button', 'btn rush__static-close');
  closeBtn.type = 'button';
  const fill = el('span', 'btn__fill');
  fill.setAttribute('aria-hidden', 'true');
  closeBtn.append(fill, 'CLOSE');
  box.append(title, text, closeBtn);
  o.appendChild(box);

  let closed = false;
  const shut = (grant: boolean) => {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    o.remove();
    startScroll();
    if (grant) {
      addCoins(10);
      showBanner('BONUS STAGE', '+10 COINS');
    }
    release();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    shut(false);
  };

  closeBtn.addEventListener('click', () => shut(true));
  document.addEventListener('keydown', onKey);
  closeBtn.focus();
  return () => shut(false);
}

function openGame(release: () => void) {
  stopScroll();
  const prevBest = readBest();
  const o = modal('Coin Rush bonus stage');
  const frame = el('div', 'rush__frame');
  const hud = el('div', 'rush__hud');
  const title = el('span', 'rush__hud-title', 'COIN RUSH');
  const clockEl = el('span', 'num', `TIME ×${DURATION}`);
  const scoreEl = el('span', 'num', 'SCORE ×0');
  const bestEl = el('span', 'num', `BEST ×${pad(prevBest)}`);
  const end = el('button', 'rush__end', 'END');
  end.type = 'button';
  hud.append(title, clockEl, scoreEl, bestEl, end);
  const play = el('div', 'rush__play');
  const count = el('div', 'rush__count', '3');
  play.appendChild(count);
  frame.append(hud, play);
  o.appendChild(frame);

  let closed = false;
  let playing = false;
  let started = false;
  let awarded = false;
  let score = 0;
  let coins: CoinRec[] = [];
  let pointer: { x: number; y: number } | null = null;
  let startAt = 0;
  let lastSecond = DURATION;
  let spawnCall: gsap.core.Tween | null = null;
  let intro: gsap.core.Timeline | null = null;

  const despawn = (c: CoinRec) => {
    if (c.dead) return;
    c.dead = true;
    coins = coins.filter((k) => k !== c);
    c.el.remove();
  };

  const grab = (c: CoinRec) => {
    if (c.dead) return;
    c.dead = true;
    coins = coins.filter((k) => k !== c);
    score++;
    scoreEl.textContent = `SCORE ×${score}`;
    coin();
    gsap.killTweensOf(c.el);
    gsap.to(c.el, { scale: 0, autoAlpha: 0, duration: 0.18, ease: 'steps(2)', onComplete: () => c.el.remove() });
  };

  const spawn = () => {
    if (closed || !playing) return;
    const width = play.clientWidth;
    const c = el('div', 'coin');
    c.style.left = `${gsap.utils.random(4, Math.max(4, width - 16))}px`;
    c.style.top = '-12px';
    play.appendChild(c);
    gsap.set(c, { autoAlpha: 1, scale: 1, y: 0 });
    const rec: CoinRec = { el: c, dead: false };
    coins.push(rec);
    gsap.to(c, {
      y: play.clientHeight + 16,
      duration: 1.6,
      ease: 'none',
      onComplete: () => despawn(rec),
    });
    const elapsed = (performance.now() - startAt) / 1000;
    const gap = 0.26 - (Math.min(DURATION, elapsed) / DURATION) * 0.08;
    spawnCall = gsap.delayedCall(Math.max(0.18, gap), spawn);
  };

  const award = () => {
    if (awarded) return;
    awarded = true;
    if (score > prevBest) localStorage.setItem(KEY, String(score));
    syncBest();
    bestEl.textContent = `BEST ×${pad(Math.max(prevBest, score))}`;
    if (score > 0) addCoins(score);
  };

  const result = (newBest: boolean) => {
    const panel = el('div', 'rush__result');
    const big = el('p', 'rush__result-score num', `SCORE ×${score}`);
    const line = el('p', newBest ? 'rush__result-best rush__result-best--new' : 'rush__result-best', newBest ? 'NEW BEST!' : `BEST ×${pad(readBest())}`);
    const closeBtn = el('button', 'btn rush__close');
    closeBtn.type = 'button';
    const fill = el('span', 'btn__fill');
    fill.setAttribute('aria-hidden', 'true');
    closeBtn.append(fill, 'CLOSE');
    closeBtn.addEventListener('click', () => close());
    panel.append(big, line, closeBtn);
    play.appendChild(panel);
    closeBtn.focus();
  };

  const finish = () => {
    if (!playing) return;
    playing = false;
    spawnCall?.kill();
    spawnCall = null;
    gsap.ticker.remove(tick);
    clockEl.textContent = 'TIME ×0';
    for (const c of coins) {
      gsap.killTweensOf(c.el);
      gsap.to(c.el, { autoAlpha: 0, duration: 0.2, onComplete: () => c.el.remove() });
    }
    coins = [];
    const newBest = score > prevBest;
    award();
    result(newBest);
  };

  const tick = () => {
    if (closed || !playing) return;
    const remaining = Math.max(0, DURATION - (performance.now() - startAt) / 1000);
    const sec = Math.ceil(remaining);
    if (sec !== lastSecond) {
      lastSecond = sec;
      clockEl.textContent = `TIME ×${sec}`;
    }
    if (remaining <= 0) {
      finish();
      return;
    }
    if (!pointer) return;
    for (const c of [...coins]) {
      if (c.dead) continue;
      const r = c.el.getBoundingClientRect();
      const dx = pointer.x - (r.left + r.width / 2);
      const dy = pointer.y - (r.top + r.height / 2);
      if (dx * dx + dy * dy <= PROXIMITY * PROXIMITY) grab(c);
    }
  };

  const begin = () => {
    started = true;
    playing = true;
    count.remove();
    clockEl.textContent = `TIME ×${DURATION}`;
    startAt = performance.now();
    spawn();
    gsap.ticker.add(tick);
  };

  const countdown = () => {
    const steps = ['3', '2', '1'];
    intro = gsap.timeline({ onComplete: begin });
    steps.forEach((label, i) => {
      intro!.call(() => {
        count.textContent = label;
        bounce(440 + i * 130);
        gsap.fromTo(count, { scale: 0.6 }, { scale: 1, duration: 0.24, ease: 'steps(3)' });
      }, [], i * 0.7);
    });
    intro.to(count, { autoAlpha: 0, duration: 0.14, ease: 'steps(1)' }, 2.1);
  };

  const close = () => {
    if (closed) return;
    closed = true;
    intro?.kill();
    if (playing) {
      playing = false;
      spawnCall?.kill();
      gsap.ticker.remove(tick);
    }
    for (const c of coins) {
      gsap.killTweensOf(c.el);
      c.el.remove();
    }
    coins = [];
    if (started && !awarded) award();
    document.removeEventListener('keydown', onKey);
    play.removeEventListener('pointermove', move);
    play.removeEventListener('pointerdown', down);
    play.removeEventListener('pointerleave', leave);
    o.remove();
    startScroll();
    if (started) showBanner('COIN RUSH OVER', `SCORE ×${score}`);
    release();
  };

  const move = (e: PointerEvent) => {
    pointer = { x: e.clientX, y: e.clientY };
  };

  const down = (e: PointerEvent) => {
    pointer = { x: e.clientX, y: e.clientY };
    if (!playing) return;
    for (const c of [...coins]) {
      const r = c.el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (dx * dx + dy * dy <= TAP * TAP) grab(c);
    }
  };

  const leave = () => {
    pointer = null;
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...o.querySelectorAll<HTMLElement>('button')];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  end.addEventListener('click', close);
  play.addEventListener('pointermove', move);
  play.addEventListener('pointerdown', down);
  play.addEventListener('pointerleave', leave);
  document.addEventListener('keydown', onKey);
  end.focus();
  countdown();

  return close;
}
