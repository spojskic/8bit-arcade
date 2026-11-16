import { gsap } from 'gsap';
import { onPage, onScroll, scrollState, prefersReducedMotion, isMobile } from '../engine';

const FRAME_MS = 120;
const MOVE_V = 0.3;
const IDLE_MS = 160;
const EDGE_L = 60;
const CLEAR_DESKTOP = 280;
const CLEAR_MOBILE = 120;
const WIDTH = 16;
const HERO_CUT = 0.7;
const COMPANION_GAP = 64;

const SPRITE = `<svg viewBox="0 0 8 12" width="16" height="24" shape-rendering="crispEdges" focusable="false">
<rect class="walker__gold" x="2" y="0" width="4" height="1"/>
<rect class="walker__gold" x="1" y="1" width="6" height="1"/>
<rect class="walker__face" x="1" y="2" width="6" height="1"/>
<rect class="walker__sky" x="2" y="2" width="4" height="1"/>
<rect class="walker__face" x="1" y="3" width="6" height="1"/>
<rect class="walker__body" x="1" y="4" width="6" height="1"/>
<rect class="walker__body" x="1" y="5" width="6" height="1"/>
<rect class="walker__body" x="2" y="6" width="4" height="1"/>
<rect class="walker__gold" x="2" y="7" width="4" height="1"/>
<g data-frame="a"><rect class="walker__body" x="3" y="8" width="1" height="3"/><rect class="walker__body" x="4" y="8" width="1" height="3"/><rect class="walker__body" x="2" y="11" width="2" height="1"/><rect class="walker__body" x="4" y="11" width="2" height="1"/></g>
<g data-frame="b"><rect class="walker__body" x="2" y="8" width="1" height="3"/><rect class="walker__body" x="5" y="8" width="1" height="3"/><rect class="walker__body" x="1" y="11" width="2" height="1"/><rect class="walker__body" x="5" y="11" width="2" height="1"/></g>
</svg>`;

type Walker = {
  el: HTMLElement;
  flip: HTMLElement;
  frames: SVGGElement[];
  paint: ReturnType<typeof gsap.quickSetter>;
  last: number;
};

function readInventory(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem('sq-inventory');
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function buildWalker(): Walker {
  const el = document.createElement('div');
  el.className = 'walker';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="walker__flip">${SPRITE}</div>`;
  document.body.appendChild(el);
  const flip = el.firstElementChild as HTMLElement;
  const frames = [...el.querySelectorAll<SVGGElement>('[data-frame]')];
  gsap.set(frames[1], { autoAlpha: 0 });
  gsap.set(el, { autoAlpha: 0 });
  return { el, flip, frames, paint: gsap.quickSetter(el, 'x', 'px'), last: NaN };
}

export function startWalk() {
  onPage(() => {
    if (prefersReducedMotion()) return;
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    if (!hero) return;
    const companion = Boolean(readInventory().companion);

    document.querySelectorAll('.walker').forEach((n) => n.remove());
    const lead = buildWalker();
    const mate = companion ? buildWalker() : null;
    if (mate) {
      gsap.set(mate.frames[0], { autoAlpha: 0 });
      gsap.set(mate.frames[1], { autoAlpha: 1 });
    }
    const pair = mate ? [lead.el, mate.el] : lead.el;

    const lane = (): [number, number] => {
      const clearance = isMobile() ? CLEAR_MOBILE : CLEAR_DESKTOP;
      return [EDGE_L, Math.max(EDGE_L, innerWidth - clearance - WIDTH)];
    };

    let [from, to] = lane();
    let heroCut = hero.offsetHeight * HERO_CUT;
    let target = from;
    let current = from;
    let facing = 1;
    let frame = 0;
    let legTime = 0;
    let moving = 0;
    let visible = false;

    const show = (i: number) => {
      if (frame === i) return;
      frame = i;
      lead.frames.forEach((g, k) => gsap.set(g, { autoAlpha: k === i ? 1 : 0 }));
      mate?.frames.forEach((g, k) => gsap.set(g, { autoAlpha: k === i ? 0 : 1 }));
    };

    const setVisible = (on: boolean) => {
      if (on === visible) return;
      visible = on;
      if (on) {
        current = target;
        align();
      } else {
        moving = 0;
        legTime = 0;
        show(0);
      }
      gsap.to(pair, { autoAlpha: on ? 1 : 0, duration: 0.3, ease: 'steps(3)', overwrite: true });
    };

    const align = () => {
      const x = Math.round(current);
      if (x !== lead.last) {
        lead.last = x;
        lead.paint(x);
      }
      if (!mate) return;
      const mx = Math.round(gsap.utils.clamp(0, to, x - COMPANION_GAP));
      if (mx !== mate.last) {
        mate.last = mx;
        mate.paint(mx);
      }
    };

    const tick = (_time: number, delta: number) => {
      if (!visible) return;
      current += (target - current) * 0.3;
      align();
      if (performance.now() > moving) {
        show(0);
        return;
      }
      legTime += delta;
      if (legTime < FRAME_MS) return;
      legTime = 0;
      show(frame === 0 ? 1 : 0);
    };

    const unwatch = onScroll((s) => {
      if (s.y < heroCut) {
        setVisible(false);
        return;
      }
      target = from + (to - from) * s.progress;
      setVisible(true);
      const dir = s.velocity < -MOVE_V ? -1 : s.velocity > MOVE_V ? 1 : facing;
      if (dir !== facing) {
        facing = dir;
        gsap.set(lead.flip, { scaleX: dir });
        if (mate) gsap.set(mate.flip, { scaleX: dir });
      }
      if (Math.abs(s.velocity) > MOVE_V) moving = performance.now() + IDLE_MS;
    });

    const resize = () => {
      [from, to] = lane();
      heroCut = hero.offsetHeight * HERO_CUT;
      target = from + (to - from) * scrollState().progress;
      if (visible) {
        current = target;
        align();
      }
      setVisible(scrollState().y >= heroCut);
    };

    addEventListener('resize', resize, { passive: true });
    gsap.ticker.add(tick);
    align();

    const initial = scrollState();
    if (initial.y >= heroCut) {
      target = from + (to - from) * initial.progress;
      setVisible(true);
    }

    return () => {
      unwatch();
      removeEventListener('resize', resize);
      gsap.ticker.remove(tick);
      for (const w of mate ? [lead, mate] : [lead]) {
        gsap.killTweensOf(w.el);
        gsap.killTweensOf(w.flip);
        w.el.remove();
      }
    };
  });
}
