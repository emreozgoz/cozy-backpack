/**
 * npm run sfx
 *
 * Synthesizes the game's sound effects into assets/audio/sfx/*.wav.
 * Everything is soft on purpose: short envelopes, no harsh transients,
 * woody / papery / bell-like timbres to match the cozy style.
 */
import fs from 'node:fs';
import path from 'node:path';

const RATE = 44100;
const out = path.resolve(__dirname, '../assets/audio/sfx');

type Buf = Float32Array;

const buf = (seconds: number): Buf => new Float32Array(Math.ceil(seconds * RATE));

/** Deterministic noise so re-running the script gives identical files. */
let seed = 1;
const noise = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed / 2147483647) * 2 - 1;
};

/** Adds a decaying sine with optional pitch glide. */
function tone(
  b: Buf,
  {
    at = 0,
    freq,
    to = freq,
    dur,
    amp = 1,
    attack = 0.004,
    decay = dur / 4,
  }: {
    at?: number;
    freq: number;
    to?: number;
    dur: number;
    amp?: number;
    attack?: number;
    decay?: number;
  },
) {
  const start = Math.floor(at * RATE);
  const n = Math.floor(dur * RATE);
  let phase = 0;
  for (let i = 0; i < n && start + i < b.length; i++) {
    const t = i / RATE;
    const f = freq + (to - freq) * Math.min(1, t / dur);
    phase += (2 * Math.PI * f) / RATE;
    const env = Math.min(1, t / attack) * Math.exp(-t / decay);
    b[start + i] += Math.sin(phase) * env * amp;
  }
}

/** Soft bell: fundamental plus a couple of quiet inharmonic partials. */
function bell(b: Buf, at: number, freq: number, amp: number, dur = 0.9) {
  tone(b, { at, freq, dur, amp, attack: 0.003, decay: dur / 3.5 });
  tone(b, { at, freq: freq * 2.01, dur: dur * 0.6, amp: amp * 0.22, attack: 0.002, decay: dur / 6 });
  tone(b, { at, freq: freq * 3.02, dur: dur * 0.3, amp: amp * 0.08, attack: 0.002, decay: dur / 12 });
}

/** Filtered noise burst (one-pole low-pass then high-pass). */
function hush(
  b: Buf,
  {
    at = 0,
    dur,
    amp = 1,
    lp = 0.2,
    hp = 0.02,
    attack = dur / 2,
  }: {
    at?: number;
    dur: number;
    amp?: number;
    lp?: number;
    hp?: number;
    attack?: number;
  },
) {
  const start = Math.floor(at * RATE);
  const n = Math.floor(dur * RATE);
  let low = 0;
  let lowSlow = 0;
  for (let i = 0; i < n && start + i < b.length; i++) {
    const t = i / RATE;
    low += lp * (noise() - low);
    lowSlow += hp * (low - lowSlow);
    const env = t < attack ? t / attack : Math.max(0, 1 - (t - attack) / (dur - attack));
    b[start + i] += (low - lowSlow) * env * env * amp;
  }
}

/** Two short early reflections — a little room so nothing sounds dry. */
function room(b: Buf, mix = 0.18): Buf {
  const outBuf = new Float32Array(b.length);
  const taps = [0.023, 0.041, 0.067].map((s) => Math.floor(s * RATE));
  for (let i = 0; i < b.length; i++) {
    let v = b[i];
    taps.forEach((d, k) => {
      if (i >= d) v += b[i - d] * mix * (1 - k * 0.3);
    });
    outBuf[i] = v;
  }
  return outBuf;
}

function write(
  name: string,
  b: Buf,
  peak: number,
  { rate = RATE, dir = out, fadeOut = true }: { rate?: number; dir?: string; fadeOut?: boolean } = {},
) {
  // normalise, then a 6ms fade-out so nothing clicks at the end (not for loops)
  let max = 0;
  for (const v of b) max = Math.max(max, Math.abs(v));
  const gain = max ? peak / max : 0;
  const fade = fadeOut ? Math.floor(0.006 * rate) : 0;
  const data = Buffer.alloc(b.length * 2);
  for (let i = 0; i < b.length; i++) {
    const f = i > b.length - fade ? (b.length - i) / fade : 1;
    const s = Math.max(-1, Math.min(1, b[i] * gain * f));
    data.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.wav`), Buffer.concat([header, data]));
  console.log(`  ${name}.wav  ${(b.length / rate).toFixed(2)}s`);
}

fs.mkdirSync(out, { recursive: true });
console.log('Synthesizing sfx →', path.relative(process.cwd(), out));

// pickup — a soft round "pop" that dips in pitch
{
  const b = buf(0.14);
  tone(b, { freq: 620, to: 380, dur: 0.12, amp: 1, attack: 0.004, decay: 0.035 });
  tone(b, { freq: 1240, to: 760, dur: 0.05, amp: 0.15, decay: 0.012 });
  write('pickup', room(b, 0.1), 0.55);
}

// place — the satisfying "tık": a small wood block with a soft thump
{
  const b = buf(0.22);
  tone(b, { freq: 880, dur: 0.12, amp: 1, attack: 0.001, decay: 0.022 });
  tone(b, { freq: 880 * 2.76, dur: 0.05, amp: 0.25, attack: 0.001, decay: 0.008 });
  tone(b, { freq: 190, to: 140, dur: 0.1, amp: 0.55, attack: 0.002, decay: 0.03 });
  hush(b, { dur: 0.012, amp: 0.25, lp: 0.6, hp: 0.2, attack: 0.001 });
  write('place', room(b), 0.7);
}

// rotate — a quick papery swish
{
  const b = buf(0.16);
  hush(b, { dur: 0.15, amp: 1, lp: 0.35, hp: 0.08, attack: 0.05 });
  tone(b, { freq: 520, to: 700, dur: 0.1, amp: 0.12, decay: 0.05 });
  write('rotate', b, 0.35);
}

// zipTick — one tiny tooth
{
  const b = buf(0.03);
  hush(b, { dur: 0.012, amp: 1, lp: 0.8, hp: 0.35, attack: 0.001 });
  tone(b, { freq: 2600, dur: 0.02, amp: 0.4, attack: 0.001, decay: 0.004 });
  write('zipTick', b, 0.3);
}

// zipClose — the zipper running home, speeding up, then a soft landing
{
  const b = buf(0.62);
  let t = 0;
  for (let i = 0; i < 22; i++) {
    hush(b, { at: t, dur: 0.01, amp: 0.8, lp: 0.8, hp: 0.35, attack: 0.001 });
    tone(b, { at: t, freq: 2200 + i * 30, dur: 0.015, amp: 0.3, attack: 0.001, decay: 0.004 });
    t += 0.022 - i * 0.0005;
  }
  tone(b, { at: t + 0.01, freq: 300, to: 220, dur: 0.12, amp: 0.8, attack: 0.003, decay: 0.035 });
  write('zipClose', room(b, 0.12), 0.5);
}

// stuck — a gentle "bonk", low and rounded, never alarming
{
  const b = buf(0.3);
  tone(b, { freq: 240, to: 170, dur: 0.24, amp: 1, attack: 0.006, decay: 0.07 });
  tone(b, { at: 0.07, freq: 200, to: 150, dur: 0.18, amp: 0.45, attack: 0.006, decay: 0.05 });
  write('stuck', room(b, 0.12), 0.45);
}

// success — little C-major bell arpeggio
{
  const b = buf(1.4);
  [1046.5, 1318.5, 1568.0, 2093.0].forEach((f, i) => bell(b, i * 0.085, f, 1 - i * 0.12));
  write('success', room(b, 0.22), 0.5);
}

// star1..3 — one soft ding per star, climbing
[1318.5, 1568.0, 2093.0].forEach((f, i) => {
  const b = buf(0.7);
  bell(b, 0, f, 1, 0.6);
  write(`star${i + 1}`, room(b, 0.2), 0.42);
});

// hint — a sparkle
{
  const b = buf(0.6);
  [2637, 3136, 3520, 4186].forEach((f, i) => bell(b, i * 0.05, f, 0.8 - i * 0.12, 0.35));
  write('hint', room(b, 0.25), 0.3);
}

// fold — soft items flopping into another shape
{
  const b = buf(0.2);
  hush(b, { dur: 0.18, amp: 1, lp: 0.12, hp: 0.03, attack: 0.03 });
  tone(b, { freq: 300, to: 220, dur: 0.12, amp: 0.3, decay: 0.04 });
  write('fold', b, 0.35);
}

// ---- music: a soft lo-fi loop ----------------------------------------------
// 72 BPM, 8 bars of Fmaj7 → Em7 → Dm7 → Cmaj7 on a warm electric piano,
// round bass, brushed drums, a sparse pentatonic melody and faint vinyl
// crackle. Rendered with a tail that is folded back to the start, so the loop
// point is seamless.
{
  const BPM = 72;
  const beat = 60 / BPM;
  const bar = beat * 4;
  const bars = 8;
  const loopLen = bar * bars;
  const tail = 2.5;
  const b = buf(loopLen + tail);

  const chords = [
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [164.81, 196.0, 246.94, 293.66], // Em7
    [146.83, 174.61, 220.0, 261.63], // Dm7
    [130.81, 164.81, 196.0, 246.94], // Cmaj7
  ];

  /** Electric-piano note: sine + soft 2nd harmonic, gentle tremolo, long decay. */
  const keys = (at: number, f: number, amp: number, dur = 1.8) => {
    const start = Math.floor(at * RATE);
    const n = Math.floor(dur * RATE);
    for (let i = 0; i < n && start + i < b.length; i++) {
      const t = i / RATE;
      const env = Math.min(1, t / 0.012) * Math.exp(-t / (dur / 3));
      const trem = 1 + 0.12 * Math.sin(2 * Math.PI * 4.5 * t);
      const v = Math.sin(2 * Math.PI * f * t) + 0.18 * Math.sin(2 * Math.PI * 2 * f * t) + 0.05 * Math.sin(2 * Math.PI * 3 * f * t);
      b[start + i] += v * env * trem * amp;
    }
  };

  const melody = [
    [0, 2, 523.25],
    [0, 3.5, 587.33],
    [1, 1, 659.25],
    [2, 2.5, 587.33],
    [3, 0.5, 523.25],
    [3, 2, 440.0],
    [4, 2, 659.25],
    [4, 3, 783.99],
    [5, 1.5, 659.25],
    [6, 2, 587.33],
    [6, 3.5, 523.25],
    [7, 1, 440.0],
  ];

  for (let barIdx = 0; barIdx < bars; barIdx++) {
    const t0 = barIdx * bar;
    const chord = chords[barIdx % chords.length];
    // chord hits on beats 1 and 3, lightly strummed
    for (const hit of [0, 2]) {
      chord.forEach((f, k) => keys(t0 + hit * beat + k * 0.018, f, hit === 0 ? 0.22 : 0.16));
    }
    // bass: root an octave down on 1 and the "and" of 2
    tone(b, { at: t0, freq: chord[0] / 2, dur: beat * 1.4, amp: 0.55, attack: 0.01, decay: 0.5 });
    tone(b, { at: t0 + beat * 1.5, freq: chord[0] / 2, dur: beat, amp: 0.35, attack: 0.01, decay: 0.35 });
    for (let k = 0; k < 4; k++) {
      const bt = t0 + k * beat;
      // soft kick on 1 and 3
      if (k % 2 === 0) tone(b, { at: bt, freq: 90, to: 50, dur: 0.18, amp: 0.5, attack: 0.002, decay: 0.06 });
      // brushed snare on 2 and 4
      if (k % 2 === 1) hush(b, { at: bt, dur: 0.16, amp: 0.16, lp: 0.5, hp: 0.12, attack: 0.01 });
      // hat on the off-beats, slightly swung
      hush(b, { at: bt + beat * 0.56, dur: 0.05, amp: 0.07, lp: 0.9, hp: 0.5, attack: 0.002 });
    }
  }
  for (const [barIdx, beatPos, f] of melody) {
    bell(b, barIdx * bar + beatPos * beat, f, 0.11, 1.1);
  }
  // vinyl: very quiet noise bed and sparse crackles
  hush(b, { dur: loopLen + tail, amp: 0.012, lp: 0.3, hp: 0.05, attack: 0.5 });
  for (let t = 0.3; t < loopLen; t += 0.37 + (Math.abs(noise()) * 0.9)) {
    hush(b, { at: t, dur: 0.004, amp: 0.05, lp: 0.9, hp: 0.6, attack: 0.001 });
  }

  // warm it up: gentle low-pass
  let lp = 0;
  for (let i = 0; i < b.length; i++) {
    lp += 0.22 * (b[i] - lp);
    b[i] = lp;
  }
  // fold the tail over the start → seamless loop
  const loopN = Math.floor(loopLen * RATE);
  const loop = new Float32Array(loopN);
  for (let i = 0; i < loopN; i++) loop[i] = b[i];
  for (let i = loopN; i < b.length; i++) loop[i - loopN] += b[i];
  // 22.05 kHz is plenty for soft music and halves the file size
  const half = new Float32Array(Math.floor(loopN / 2));
  for (let i = 0; i < half.length; i++) half[i] = (loop[2 * i] + loop[2 * i + 1]) / 2;
  write('cozy-loop', half, 0.55, {
    rate: RATE / 2,
    dir: path.resolve(__dirname, '../assets/audio/music'),
    fadeOut: false,
  });
}

console.log('✔ done');
