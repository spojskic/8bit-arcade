import { gsap } from 'gsap';
import { onPage, isTouch } from '../engine';

export function startQuestPreview() {
  onPage(() => {
    const list = document.querySelector<HTMLElement>('.quests');
    const box = document.querySelector<HTMLElement>('.preview');
    if (!list || !box || isTouch()) return;

    const covers = [...box.querySelectorAll<HTMLElement>('.preview__cover')];
    const x = gsap.quickTo(box, 'x', { duration: 0.5, ease: 'power3.out' });
    const y = gsap.quickTo(box, 'y', { duration: 0.5, ease: 'power3.out' });

    const show = (seed: string) => {
      covers.forEach((c) => (c.hidden = c.dataset.seed !== seed));
      gsap.to(box, { autoAlpha: 1, duration: 0.2, ease: 'steps(2)' });
    };
    const hide = () => gsap.to(box, { autoAlpha: 0, duration: 0.2, ease: 'steps(2)' });

    list.querySelectorAll<HTMLAnchorElement>('a[data-preview]').forEach((a) => {
      a.addEventListener('pointerenter', () => show(a.dataset.preview!));
      a.addEventListener('focus', () => show(a.dataset.preview!));
      a.addEventListener('blur', hide);
    });
    list.addEventListener('pointerleave', hide);

    const move = (e: PointerEvent) => {
      x(e.clientX + scrollX);
      y(e.clientY - 18 + scrollY);
    };
    addEventListener('pointermove', move, { passive: true });
    return () => removeEventListener('pointermove', move);
  });
}
