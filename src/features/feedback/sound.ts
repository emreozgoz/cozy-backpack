import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

// Short synthesized effects (see scripts/synth-sfx.ts). Each sound gets a
// small pool of players so rapid repeats (zipper teeth) don't cut each other off.

const SOURCES = {
  pickup: require('@/assets/audio/sfx/pickup.wav'),
  place: require('@/assets/audio/sfx/place.wav'),
  rotate: require('@/assets/audio/sfx/rotate.wav'),
  fold: require('@/assets/audio/sfx/fold.wav'),
  zipTick: require('@/assets/audio/sfx/zipTick.wav'),
  zipClose: require('@/assets/audio/sfx/zipClose.wav'),
  stuck: require('@/assets/audio/sfx/stuck.wav'),
  success: require('@/assets/audio/sfx/success.wav'),
  star1: require('@/assets/audio/sfx/star1.wav'),
  star2: require('@/assets/audio/sfx/star2.wav'),
  star3: require('@/assets/audio/sfx/star3.wav'),
  hint: require('@/assets/audio/sfx/hint.wav'),
} as const;

export type Sfx = keyof typeof SOURCES;

const POOL: Partial<Record<Sfx, number>> = { zipTick: 4, place: 2, pickup: 2 };

let enabled = true;
let pools: Partial<Record<Sfx, { players: AudioPlayer[]; next: number }>> = {};
let ready = false;

/** Call once at startup. Mixes with the player's own music instead of stopping it. */
export async function initSound() {
  if (ready) return;
  ready = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
  } catch {
    // Audio session config is best-effort; effects still play without it.
  }
  pools = Object.fromEntries(
    (Object.keys(SOURCES) as Sfx[]).map((name) => [
      name,
      { players: Array.from({ length: POOL[name] ?? 1 }, () => createAudioPlayer(SOURCES[name])), next: 0 },
    ]),
  );
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function play(name: Sfx) {
  if (!enabled) return;
  const pool = pools[name];
  if (!pool) return;
  const player = pool.players[pool.next];
  pool.next = (pool.next + 1) % pool.players.length;
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // A missed effect is never worth crashing over.
  }
}
