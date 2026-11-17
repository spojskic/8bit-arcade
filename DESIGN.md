# SAFET'S QUEST — design document

## Brief

- **Subject:** Safet Pojskić, software engineer (frontend-leaning full-stack), currently at
  HTEC Group, previously frontend tech lead at Pickleball.com and junior engineer at
  Atlantbh. Based in Zenica, Bosnia and Herzegovina.
- **Audience:** recruiters, potential employers, other engineers.
- **Job of the site:** get hired; prove craft by being the craft. His previous portfolio
  (safetpojskic.com) was an interactive Fedora KDE desktop, so "the portfolio is the
  product" is already his established story.
- **Assets:** all content is real, ported from `fedora-portfolio/src/data/portfolio.ts`
  (bio, skills, projects, experience, education, socials, email).
- **Language:** English. No placeholders.

## Stack

**Astro + GSAP + Lenis, static build.** The site is a content-only showcase where motion
is the product: per-page static HTML gives real SEO, a real 404 and ~75 KB of JS, and all
interactivity is imperative DOM work that needs no framework. (Deviation from the
Vite+React stack mentioned in early planning: my call, for SEO + weight + zero
app-features. Content stays in one typed file either way.)

## Concept card

```
Idea:        The portfolio is an 8-bit console game where Safet's real career is the
             playthrough: he changed class from pharmacy to code in 2022 and has been
             leveling up ever since.
Metaphor:    A NES action-RPG world: title screen, dialog boxes, inventory, quest log,
             level select, save point.
Signature:   The hero name "SAFET" built from destructible pixel blocks. The pointer is
             Player 2: it carves through the letters, blocks pop out in stepped sprite
             motion, coins fly loose, and each coin collected ticks a HUD counter with a
             chiptune blip. Leave it alone and the name reassembles itself.
Emotion:     Arcade nostalgia in the first 3 seconds, then "this person builds precise,
             playful things."
Motion verb: Snap like a sprite: stepped eases, whole-pixel movement, 8px grid. CRT
             physics exceptions (power-on flash, screen shake, flicker) may use expo.
Screenshot:  Title screen: pixel-block SAFET over a night sky with drifting 8-bit clouds
             and twinkling stars, gold HUD corners, blinking PRESS START.
```

## Art direction

### Palette (sampled from the NES master palette; roles)

| Role | Hex | Meaning |
|---|---|---|
| `--c-bg` ground | `#101023` "midnight" | night sky / page ground |
| `--c-fg` ink | `#f2efe4` "CRT bone" | text, pixel lines |
| `--c-muted` | `#8f8ca8` "dim violet" | secondary text (AA on ground) |
| `--c-line` | `#f2efe4` at 14% | hairlines |
| `--c-accent` | `#f8b800` "coin gold" | coins, XP, the one loud color |
| `--c-power` | `#e2502e` "power red" | hearts, damage, GAME OVER, urgency |
| `--c-sky` | `#3cbcfc` "sky cyan" | interactive highlight, links, sky details |
| `--c-curtain` | `#0a0a14` "void" | transitions, loader ground |

Gold is the identity color and used rarely; red and cyan carry game semantics only
(health, interactive). No gradients except the flat two-tone sky bands.

### Type

- **Display / HUD:** Press Start 2P (self-hosted woff2, Google OFL). The pixel font is
  the identity: headings, HUD, buttons, level titles. Uppercase only, tracking 0 (the
  font IS the grid). Sizes snap near 8px multiples; display clamps for `SAFET` hero and
  section titles.
- **Body / meta:** Space Mono 400/700 (self-hosted woff2). Terminal-dialog voice,
  16-18px, leading 1.6, measure 38rem max. Tabular numbers everywhere a counter exists.
- Sentence case for body copy; pixel caps for labels that read as game UI.

### Grid, shape, texture

- 8px base unit. 12 columns desktop, 4 on phones. Everything snaps; borders are 2px
  solid ink; zero radius everywhere.
- Pixel "raised" look: 4px hard offset shadow (no blur) on dialog boxes and buttons.
- `image-rendering: pixelated` on all sprite art. CRT overlay: 1px scanlines at 6% ink
  over the whole viewport + faint vignette, off under reduced motion.
- Sky: flat two-band background (deep navy over darker navy) with pixel cloud sprites and
  twinkling star dots, driven by the pointer (parallax) and time (idle drift).

### Motion language

| Thing | Duration | Ease |
|---|---|---|
| Block pop / coin collect | 0.12 to 0.3s | `steps(3)`-style snaps, `soft` |
| Hovers (fill flood, letter roll) | 0.25 to 0.5s | hard-stepped edges, `soft` |
| CRT moments (power-on, shake) | 0.6 to 1.2s | `out`, `inOut` |
| Page transition each way | ≤ 1s | `inOut` |

One treatment per role:

| Role | Treatment |
|---|---|
| Primary buttons (SAVE, PRESS START) | 8-bit fill flood from the pointer's side; label inverts |
| Project / quest links | row lifts one tile, hard shadow grows, cursor label "ENTER" |
| Nav links | letter roll (per-letter stagger, duplicated span aria-hidden) |
| Utility links (socials, colophon) | color change to gold |
| Inline links | underline at rest, rises into gold band on hover |

Idle state: clouds drift, stars twinkle (steps), PRESS START blinks on a 1s step clock,
coins shimmer. Paused off screen; zero under reduced motion. Ambient, not decoration:
it is the game world breathing.

## Pages and composition

### `/` (one-page world)

```
┌────────────────────────────────────────────────┐
│ SAFET'S QUEST              ABOUT QUESTS LOG    │  HUD corners (frame steps aside on scroll)
│                            SOUND OFF           │
│              ░░ S A F E T ░░                  │  destructible pixel-block name (stage)
│         SOFTWARE ENGINEER · WORLD 1-1          │
│                ▓ PRESS START ▓                 │  blinks, scrolls to dialog
│ COINS ×000                          © 2026     │
│            ~ drifting pixel clouds ~           │  canvas sky + parallax to pointer
└────────────────────────────────────────────────┘
```

- **About — dialog box cutscene.** NPC-style dialog box (2px border, hard shadow): the
  class-change story (pharmacy → code, 2022). Typewriter reveal on scroll; final text
  stays in the DOM. Pixel avatar sprite (procedural "SP" sprite, honest, not a fake
  photo). Statement family: large text 8-10 cols.
- **Skills — inventory.** Three group shelves (Languages, Frameworks, Tools); each skill
  an item slot: 24px pixel sprite + label + rarity color. Slots reveal with a stagger.
- **Quests — level select index.** Four full-width rows (WORLD 2-1 RATION, 2-2
  RECONNED, 2-3 FEDORA PORTFOLIO, 2-4 PORTFOLIO V1): title in Press Start 2P, tagline,
  tech chips, "ENTER" cursor follower with a floating pixel cover preview on desktop;
  inline cover on touch. Rows link to case pages.
- **Log — quest log.** Experience as quests on a timeline: HTEC = ACTIVE QUEST (blinking
  marker), Pickleball = tech lead boss fight framing stays honest to the real bullets,
  Atlantbh (+ internship sub-quest), BH Futures Foundation mentorship as a side quest,
  education as "training arc". Gold XP bar fills as you scroll through it.
- **Save — save point.** Centered dialog: "SAVE YOUR GAME?" with a mailto CTA
  (pm@safetpojskic.com), socials as three labeled warp pipes (GitHub, LinkedIn,
  Website). Location line: ZENICA, BiH.
- **Footer — finale.** Giant pixel "SAFET" outline (aria-hidden decorative), colophon:
  built with Astro + GSAP, type credits, real links, © 2026 Safet Pojskić, "CONTINUE?".

### `/quest/[slug]` — case study per project (3)

Level intro via page transition. Title screen hero: "WORLD 2-1 — RECONNED" + summary
line. Meta row: role, stack, status. Body: context / idea / craft / outcome, each as a
dialog-box block with a small pixel divider. Live link ("VISIT SITE") as the gold CTA
button. Ends with "NEXT QUEST →" to the following project (loop back to first). Honest
outcome text only: what shipped, no invented metrics.

### `/404` — GAME OVER

Power red "GAME OVER", a small score table (PAGE NOT FOUND × 1), "CONTINUE?" link home.
Real 404 status from static hosting.

## Systems

- **Driver:** one pointer-field + time module feeds the hero: block carve radius, coin
  spawns, cloud parallax, star twinkle phase, CRT flicker amplitude. Idle input from
  `gsap.ticker`; paused when hero off screen; zero under reduced motion.
- **Sound:** WebAudio square-wave chiptune synthesized in code (coin B5→E6, blip, level
  fanfare, achievement and 1-UP arpeggios), default OFF, persisted, stays off under
  reduced motion as the default. The HUD sound button cycles three states:
  OFF → SFX → SFX+MUSIC, where MUSIC adds a quiet title-screen chiptune loop
  (a short scheduled square-wave melody, lookahead sequencer on the gsap ticker).
  Stored value migrates from the old 'on' to 'sfx'. No audio files, no autoplay.
- **Bonus stage:** COIN RUSH — a 15-second coin-catching mini-game opened from the save
  screen, with a high score persisted in localStorage ('sq-rush-best').
- **The shop:** coins are spendable. A pixel shop in the save section sells world-state
  unlocks, owned items persisted in localStorage ('sq-inventory'): GAME BOY palette
  (50, the 4-shade green DMG screen), Virtual Boy palette (50, red on black), coin
  magnet (100, a permanent power-up: floor coins drift toward the pointer), walker
  companion (75, a second sprite joins the hero on his walk), CRT toggle (25, turns
  the scanline overlay on or off). Palettes are token swaps on html[data-skin];
  purchasing plays a short jingle; insufficient funds shake the price tag. This
  completes the loop: collect (carve, toys, secrets, COIN RUSH) → milestone (1-UP)
  → spend (change the world).
- **Konami code:** unlocks a coin shower + brief palette shift. Pays off explorers;
  continuity with the previous portfolio's Konami glitch.
- **Easter eggs (all real NES mechanics, banner feedback, silent under reduced motion):**
  - *Demolition:* carve every block of the hero name and the screen shakes, shrapnel
    bursts, a coin geyser erupts, +25 coins, "SECRET FOUND" banner. Rewards mastering
    the signature interaction.
  - *100 coins = 1-UP:* the persisted counter crossing any multiple of 100 plays the
    1-UP arpeggio and a banner. The NES coin economy, honored.
  - *Hidden blocks:* clicking empty sky pops an invisible block that ejects a
    collectible coin. The classic SMB invisible 1-UP block. Max 3 per visit.
  - *Attract mode:* 25 s idle on the title screen and a pixel bat flies across while
    PRESS START becomes "STILL THERE?". NES games demoed themselves; so does this.
  - *"GG" typed:* coin confetti, +10, banner.
- **Cursor:** native cursor kept (`cursor: crosshair` reads as a game crosshair); the
  engine follower is restyled into a square pixel chip that grows labels ("ENTER",
  "PLAY") over targets. Never hides the native cursor.
- **Reduced motion / no-JS:** static sky bands, complete visible content, no loader
  theatrics, native scroll, no reveals needed. The static fallback is designed, not a
  downgrade.
- **Idle decisions:** the home hero keeps breathing on the GSAP ticker (clouds drift,
  stars twinkle, PRESS START blinks), paused off screen and zero under reduced motion.
  Case-study pages and the 404 are deliberately still at rest: the HUD carries the frame,
  and their hovers and the level transition carry the life.
- **Mobile (390px):** solid top bar (brand + MENU, sound toggle lives inside the menu
  overlay), HUD coin counter becomes a bordered chip so it never sits illegibly over
  copy, hero stage scales via cqi; blocks stay grabbable by touch (tap = carve burst +
  coin). Quest rows show inline covers. Tap targets ≥ 24px, primary ≥ 44px.
- **Frame behavior:** the four HUD corners step aside on scroll down (translate, stepped)
  and return on scroll up, so body type never collides with them; anchors land clear
  via scroll-padding-top. Loader: full boot sequence on first visit, device-paced
  (shorter on touch), skipped entirely on repeat visits within the session.

## Content voice

Plain, specific, a little playful; sentence case body; game labels stay game-y but say
what they are ("QUESTS", "SAVE"). No em dashes, no banned verbs, copy fits the device
(no "hover" on touch). One CTA name everywhere: "SAVE YOUR GAME" = email.
