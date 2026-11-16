import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage } from '../engine';

gsap.registerPlugin(ScrollTrigger);

const clockFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Sarajevo',
});

export function startWorld() {
  onPage(() => {
    const label = document.querySelector<HTMLElement>('[data-world-label]');
    const clock = document.querySelector<HTMLElement>('[data-clock]');
    const fallback = label?.textContent || 'WORLD 1-1';
    const zones = [...document.querySelectorAll<HTMLElement>('[data-world]')];
    const triggers: ScrollTrigger[] = [];

    const sync = () => {
      if (!label) return;
      const active = zones.find((_, i) => triggers[i]?.isActive);
      label.textContent = active?.dataset.world || fallback;
    };

    zones.forEach((zone) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: zone,
          start: 'top 55%',
          end: 'bottom 45%',
          onToggle: sync,
        }),
      );
    });
    if (zones.length) sync();

    let timer: ReturnType<typeof setInterval> | undefined;
    if (clock) {
      const paint = () => {
        clock.textContent = clockFormat.format(new Date());
      };
      paint();
      timer = setInterval(paint, 30000);
    }

    return () => {
      triggers.forEach((t) => t.kill());
      if (timer) clearInterval(timer);
      if (label) label.textContent = fallback;
    };
  });
}
