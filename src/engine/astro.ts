import { boot, cleanup, enter, leave, syncFlags, scrollToTarget } from './index';

let navigating = false;

function ownHashLinks() {
  addEventListener(
    'click',
    (e) => {
      if (e.defaultPrevented || (e as MouseEvent).button !== 0) return;
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href')!;
      if (id.length < 2 || !document.getElementById(id.slice(1))) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      scrollToTarget(id);
      history.replaceState(history.state, '', id);
    },
    true,
  );
}

export function start(setup?: () => void) {
  ownHashLinks();
  document.addEventListener('astro:before-preparation', (e) => {
    navigating = true;
    const load = e.loader;
    e.loader = async () => { await Promise.all([leave(), load()]); };
  });
  document.addEventListener('astro:before-swap', () => cleanup());
  document.addEventListener('astro:after-swap', () => {
    syncFlags();
    document.getElementById('loader')?.remove();
  });
  document.addEventListener('astro:page-load', () => {
    if (!navigating) return void boot(setup);
    navigating = false;
    enter();
  });
  boot(setup);
}
