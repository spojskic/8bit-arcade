import { gsap } from 'gsap';
import { prefersReducedMotion } from '../engine/env';

type SoundState = 'off' | 'sfx' | 'music';

const KEY = 'sq-sound';
const BPM = 104;
const STEP = 60 / BPM / 2;
const LOOKAHEAD = 0.3;
const LOOP = 64;
const BASS_ROOT = [110, 87.31, 130.81, 98];
const LEAD = [
  440, 523.25, 659.25, 523.25, 659.25, 587.33, 523.25, 493.88,
  440, 523.25, 698.46, 659.25, 523.25, 440, 392, 440,
  392, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 587.33,
  493.88, 587.33, 783.99, 587.33, 493.88, 440, 493.88, 587.33,
  659.25, 523.25, 440, 523.25, 659.25, 880, 783.99, 659.25,
  698.46, 659.25, 523.25, 440, 523.25, 698.46, 659.25, 523.25,
  659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 523.25, 587.33,
  587.33, 493.88, 392, 440, 493.88, 587.33, 493.88, 392,
];

function readState(): SoundState {
  const stored = localStorage.getItem(KEY);
  if (stored === 'off' || stored === 'sfx' || stored === 'music') return stored;
  if (stored === 'on') {
    localStorage.setItem(KEY, 'sfx');
    return 'sfx';
  }
  return 'off';
}

let state: SoundState = readState();
let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
let step = 0;
let nextNote = 0;
let ticking = false;

export const soundOn = () => state !== 'off';
export const soundState = () => state;

const audible = () => state !== 'off';

function ensureCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function toneAt(freq: number, when: number, dur: number, vol = 0.12, type: OscillatorType = 'square', dest?: AudioNode) {
  const ac = ensureCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(gain).connect(dest ?? ac.destination);
  osc.start(when);
  osc.stop(when + dur);
}

function tone(freq: number, start: number, dur: number, vol = 0.12, type: OscillatorType = 'square') {
  toneAt(freq, ensureCtx().currentTime + start, dur, vol, type);
}

function schedule() {
  if (!ctx || !bus || state !== 'music') return;
  const now = ctx.currentTime;
  if (nextNote < now - 0.1) nextNote = now + 0.05;
  while (nextNote < now + LOOKAHEAD) {
    if (step % 4 === 0) toneAt(BASS_ROOT[Math.floor(step / 8) % 4], nextNote, STEP * 3.7, 0.05, 'square', bus);
    const lead = LEAD[step];
    if (lead) toneAt(lead, nextNote, STEP * 0.9, 0.04, 'square', bus);
    step = (step + 1) % LOOP;
    nextNote += STEP;
  }
}

function startMusic() {
  if (state !== 'music' || ticking) return;
  const ac = ensureCtx();
  if (!bus) {
    bus = ac.createGain();
    bus.connect(ac.destination);
  }
  step = 0;
  nextNote = ac.currentTime + 0.08;
  ticking = true;
  gsap.ticker.add(schedule);
}

function stopMusic() {
  if (ticking) {
    gsap.ticker.remove(schedule);
    ticking = false;
  }
  if (bus && ctx) {
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.disconnect();
  }
  bus = null;
}

export function blip() {
  if (!audible() || !ctx) return;
  tone(660, 0, 0.06, 0.06);
}

export function coin() {
  if (!audible()) return;
  ensureCtx();
  tone(988, 0, 0.09, 0.09);
  tone(1319, 0.09, 0.28, 0.09);
}

export function bounce(freq: number) {
  if (!audible()) return;
  ensureCtx();
  tone(freq, 0, 0.07, 0.08);
}

export function fanfare() {
  if (!audible()) return;
  ensureCtx();
  tone(523, 0, 0.09);
  tone(659, 0.1, 0.09);
  tone(784, 0.2, 0.2);
}

export function achievement() {
  if (!audible()) return;
  ensureCtx();
  tone(784, 0, 0.08, 0.1);
  tone(1047, 0.08, 0.08, 0.1);
  tone(1319, 0.16, 0.22, 0.1);
}

export function oneUp() {
  if (!audible()) return;
  ensureCtx();
  [988, 1319, 1568, 2093].forEach((freq, i) => tone(freq, i * 0.09, 0.09, 0.1));
}

export function purchase() {
  if (!audible()) return;
  ensureCtx();
  tone(523, 0, 0.09, 0.1);
  tone(659, 0.09, 0.09, 0.1);
  tone(880, 0.18, 0.22, 0.1);
}

export function denied() {
  if (!audible()) return;
  ensureCtx();
  tone(155, 0, 0.12, 0.11);
  tone(110, 0.13, 0.18, 0.11);
}

export function hit(freq: number) {
  if (!audible()) return;
  ensureCtx();
  tone(freq, 0, 0.09, 0.1);
  tone(freq / 2, 0.01, 0.1, 0.06);
}

export function defeat() {
  if (!audible()) return;
  ensureCtx();
  [392, 311, 233, 155].forEach((freq, i) => tone(freq, i * 0.11, 0.16, 0.1));
}

export function toggle() {
  state = state === 'off' ? 'sfx' : state === 'sfx' ? 'music' : 'off';
  localStorage.setItem(KEY, state);
  if (state === 'off') {
    stopMusic();
    return state;
  }
  ensureCtx();
  coin();
  if (state === 'music') startMusic();
  else stopMusic();
  return state;
}

export function armGesture() {
  if (state !== 'music' || prefersReducedMotion()) return;
  if (ctx) {
    startMusic();
    return;
  }
  const unlock = () => {
    removeEventListener('pointerdown', unlock);
    ensureCtx();
    if (state === 'music') startMusic();
  };
  addEventListener('pointerdown', unlock, { once: true });
}
