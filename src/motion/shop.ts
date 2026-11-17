import { gsap } from 'gsap';
import { onPage } from '../engine';
import { spendCoins, showBanner } from './hud';
import { blip, denied, purchase } from './sound';

type Skin = 'gameboy' | 'virtualboy';
type ActiveSkin = Skin | 'none';

const INV = 'sq-inventory';
const SKIN = 'sq-skin';
const CRT = 'sq-crt';

const isSkin = (id: string): id is Skin => id === 'gameboy' || id === 'virtualboy';

function readInv(): Record<string, boolean> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(INV) || '{}');
    return raw && typeof raw === 'object' ? (raw as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeInv(inv: Record<string, boolean>) {
  localStorage.setItem(INV, JSON.stringify(inv));
}

function readSkin(): ActiveSkin {
  const stored = localStorage.getItem(SKIN) || '';
  return isSkin(stored) ? stored : 'none';
}

function readCrt() {
  return localStorage.getItem(CRT) !== 'off';
}

function applySkin(skin: ActiveSkin) {
  localStorage.setItem(SKIN, skin);
  if (skin === 'none') delete document.documentElement.dataset.skin;
  else document.documentElement.dataset.skin = skin;
}

function applyCrt(on: boolean) {
  localStorage.setItem(CRT, on ? 'on' : 'off');
  document.documentElement.classList.toggle('crt-off', !on);
}

function syncRow(row: HTMLElement, inv: Record<string, boolean>, skin: ActiveSkin, crt: boolean) {
  const id = row.dataset.item || '';
  const price = row.dataset.price || '0';
  const btn = row.querySelector<HTMLButtonElement>('[data-shop-buy]');
  if (!btn) return;
  const label = btn.querySelector<HTMLElement>('[data-shop-label]') || btn;
  btn.disabled = false;
  btn.removeAttribute('aria-pressed');
  if (!inv[id]) {
    label.textContent = `BUY ×${price}`;
    return;
  }
  if (id === 'crt') {
    label.textContent = crt ? 'CRT ON' : 'CRT OFF';
    btn.setAttribute('aria-pressed', String(crt));
    return;
  }
  if (isSkin(id)) {
    const active = skin === id;
    label.textContent = active ? 'EQUIPPED' : 'EQUIP';
    btn.setAttribute('aria-pressed', String(active));
    return;
  }
  label.textContent = 'OWNED';
  btn.disabled = true;
}

function shake(el: Element | null) {
  if (!el) return;
  gsap.fromTo(el, { x: 0 }, { x: 3, duration: 0.06, repeat: 4, yoyo: true, ease: 'steps(1)', clearProps: 'x' });
}

function buy(row: HTMLElement, inv: Record<string, boolean>) {
  const id = row.dataset.item || '';
  const name = row.querySelector<HTMLElement>('[data-shop-name]')?.textContent || '';
  const price = Number(row.dataset.price || '0');
  if (!spendCoins(price)) {
    denied();
    shake(row.querySelector('[data-shop-price]'));
    showBanner('NOT ENOUGH GOLD', 'Carve the name, play the rush');
    return;
  }
  purchase();
  inv[id] = true;
  writeInv(inv);
  if (isSkin(id)) applySkin(id);
  if (id === 'crt') applyCrt(false);
  showBanner('ITEM GET', `${name} UNLOCKED`);
}

export function startShop() {
  const restore = () => {
    applySkin(readSkin());
    applyCrt(readCrt());
  };

  restore();
  document.addEventListener('astro:after-swap', restore);

  onPage(() => {
    const shop = document.querySelector<HTMLElement>('[data-shop]');
    if (!shop) return;
    const rows = [...shop.querySelectorAll<HTMLElement>('[data-shop-row]')];
    if (!rows.length) return;

    const sync = () => {
      const inv = readInv();
      const skin = readSkin();
      const crt = readCrt();
      rows.forEach((row) => syncRow(row, inv, skin, crt));
    };

    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-shop-buy]');
      if (!btn || btn.disabled) return;
      const row = btn.closest<HTMLElement>('[data-shop-row]');
      if (!row) return;
      const id = row.dataset.item || '';
      const inv = readInv();
      if (!inv[id]) {
        buy(row, inv);
        sync();
        return;
      }
      if (id === 'crt') {
        applyCrt(!readCrt());
        blip();
        sync();
        return;
      }
      if (isSkin(id)) {
        applySkin(readSkin() === id ? 'none' : id);
        blip();
        sync();
      }
    };

    sync();
    shop.addEventListener('click', onClick);
    return () => shop.removeEventListener('click', onClick);
  });
}
