import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useT } from '@/i18n';
import { SoftButton } from '@/ui/kit';
import { radius, usePalette } from '@/ui/tokens';

import { useMockAd } from './ads';

const REWARD_AFTER_S = 2;

/**
 * Stand-in for a full-screen ad in Expo Go / builds without AdMob, so the
 * ad-driven flows (hints, double buttons, interstitial pacing) can be tried.
 */
export function MockAdOverlay() {
  const { ui } = useT();
  const palette = usePalette();
  const kind = useMockAd((s) => s.kind);
  const finish = useMockAd((s) => s.finish);

  if (!kind || !finish) return null;
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, styles.scrim]}>
      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <Text style={[styles.badge, { color: palette.primary }]}>AD · TEST</Text>
        <Text style={[styles.title, { color: palette.text }]}>{ui.mockAdTitle}</Text>
        <Text style={[styles.body, { color: palette.textMuted }]}>{ui.mockAdBody}</Text>
        {kind === 'rewarded' ? (
          <RewardButtons onDone={finish} claim={ui.mockAdClaim} close={ui.mockAdClose} />
        ) : (
          <SoftButton label={ui.mockAdClose} kind="soft" onPress={() => finish(false)} />
        )}
      </View>
    </Animated.View>
  );
}

function RewardButtons({
  onDone,
  claim,
  close,
}: {
  onDone(earned: boolean): void;
  claim: string;
  close: string;
}) {
  const [left, setLeft] = useState(REWARD_AFTER_S);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return (
    <View style={styles.buttons}>
      <SoftButton
        label={left > 0 ? `${claim} (${left})` : claim}
        disabled={left > 0}
        onPress={() => onDone(true)}
      />
      <SoftButton label={close} kind="ghost" onPress={() => onDone(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: 'rgba(20,16,26,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 1000,
  },
  card: { width: '100%', maxWidth: 360, borderRadius: radius.l, padding: 24, gap: 12 },
  badge: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  body: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  buttons: { gap: 4 },
});
