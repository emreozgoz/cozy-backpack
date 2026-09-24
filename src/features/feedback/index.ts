import * as Haptics from 'expo-haptics';

import { play } from './sound';

export { initSound, setSoundEnabled } from './sound';
export { initMusic, setMusicEnabled, withMusicPaused } from './music';

let hapticsOn = true;
export function setHapticsEnabled(on: boolean) {
  hapticsOn = on;
}

const haptic = {
  selection: () => hapticsOn && Haptics.selectionAsync(),
  impact: (style: Haptics.ImpactFeedbackStyle) => hapticsOn && Haptics.impactAsync(style),
  notify: (type: Haptics.NotificationFeedbackType) => hapticsOn && Haptics.notificationAsync(type),
};

/** Every game moment's sound + haptic in one place (style guide §4). */
export const feedback = {
  pickup() {
    haptic.selection();
    play('pickup');
  },
  place() {
    haptic.impact(Haptics.ImpactFeedbackStyle.Light);
    play('place');
  },
  rotate() {
    haptic.impact(Haptics.ImpactFeedbackStyle.Soft);
    play('rotate');
  },
  fold() {
    haptic.impact(Haptics.ImpactFeedbackStyle.Soft);
    play('fold');
  },
  /** An action that can't happen right now (e.g. no room to rotate). */
  nope() {
    haptic.impact(Haptics.ImpactFeedbackStyle.Rigid);
  },
  zipTick() {
    haptic.selection();
    play('zipTick');
  },
  zipClosed() {
    haptic.notify(Haptics.NotificationFeedbackType.Success);
    play('zipClose');
    setTimeout(() => play('success'), 380);
  },
  zipStuck() {
    haptic.notify(Haptics.NotificationFeedbackType.Warning);
    play('stuck');
  },
  hint() {
    haptic.selection();
    play('hint');
  },
  star(n: 1 | 2 | 3) {
    haptic.impact(Haptics.ImpactFeedbackStyle.Light);
    play(`star${n}`);
  },
};
