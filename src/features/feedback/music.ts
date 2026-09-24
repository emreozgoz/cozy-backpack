import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { AppState } from 'react-native';

// Background music: one soft synthesized lo-fi loop (scripts/synth-sfx.ts).
// Quiet under the effects, paused in the background and while ads play.

const VOLUME = 0.32;

let player: AudioPlayer | null = null;
let enabled = true;
let appActive = AppState.currentState === 'active';
let holds = 0; // e.g. an ad is showing

function apply() {
  if (!player) return;
  try {
    if (enabled && appActive && holds === 0) player.play();
    else player.pause();
  } catch {
    // Audio is best-effort; never crash the game over it.
  }
}

export function initMusic() {
  if (player) return;
  try {
    player = createAudioPlayer(require('@/assets/audio/music/cozy-loop.wav'));
    player.loop = true;
    player.volume = VOLUME;
  } catch {
    player = null;
  }
  AppState.addEventListener('change', (state) => {
    appActive = state === 'active';
    apply();
  });
  apply();
}

export function setMusicEnabled(on: boolean) {
  enabled = on;
  apply();
}

/** Keeps the music paused while `work` runs (full-screen ads bring their own sound). */
export async function withMusicPaused<T>(work: () => Promise<T>): Promise<T> {
  holds++;
  apply();
  try {
    return await work();
  } finally {
    holds--;
    apply();
  }
}
