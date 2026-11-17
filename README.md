# SAFET'S QUEST

An 8-bit console game where a software engineer's career is the playthrough. Safet Pojskić's portfolio: projects are numbered worlds, the CV is an inventory and XP timeline, contact is a save point, coins buy world-altering upgrades, and the 404 is GAME OVER.

## Play it

- `npm install`
- `npm run dev` (or `astro dev --background` / `stop` / `status` / `logs`)
- `npm run build` → static site in `dist/`, deploy anywhere

Node 22.23.4+.

## The title screen

The name SAFET is built from destructible pixel blocks. The pointer is player 2: carve through the letters and blocks pop out in stepped sprite motion. Coins fly loose, land on the floor, and are collected by touch — or grabbed and flung with physics. Stop moving and the name reassembles itself, block by block. The world keeps breathing at rest: drifting clouds, twinkling stars, a blinking PRESS START.

## Secrets

| Trigger | Secret |
|---|---|
| Carve every block of the name | Demolition: screen shake, shrapnel, coin geyser, +25 coins |
| Reach 100 total coins | 1-UP, the ancient law |
| Click empty sky above the name | Hidden blocks eject collectible coins |
| Idle 25 s on the title screen | Attract mode: a bat flies across, PRESS START asks if you're still there |
| Type `gg` | Coin confetti, +10 |
| Konami code (`↑ ↑ ↓ ↓ ← → ← → B A`) | Coin shower + palette glitch |
| The 404 monster | 5 clicks defeat it: +30 coins, GAME OVER becomes a victory |
| COINS counter (bottom left) | Opens the shop |

The shop sells world-state with the coins you earned: GAME BOY and Virtual Boy palettes, a coin magnet that makes floor coins drift toward you, a companion that marches behind the walker, and a CRT filter toggle. Everything persists in localStorage.

Bonus stage: COIN RUSH, a 15-second coin-catching run with a persisted best score, opened from the save point.

Sound is a synthesized WebAudio chiptune (no audio files): coin blips, bounces, jingles and an original title-screen loop. The sound button cycles OFF → SFX → SFX+MUSIC.

## How it's built

- Astro, static output (~70 KB JS gzipped, no framework runtime)
- GSAP + Lenis on one clock; the motion engine lives in `src/engine/`
- Press Start 2P + Space Mono, self-hosted in `public/fonts`
- All content in `src/data/site.ts`; the design record in `DESIGN.md`

## Structure

```
src/
  components/    hero, hud, sections, covers, level dividers
  data/site.ts   all copy: quests, log, shop items
  engine/        framework-agnostic motion engine (astro adapter)
  motion/        hero interaction, sound, shop, rush, boss, walker, world
  pages/         index (world 1-1), quest/[slug] (case studies), 404
  styles/        tokens, engine foundation, site styles
```

© 2026 Safet Pojskić
