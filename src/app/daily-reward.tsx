import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { DAILY_REWARDS, dayKey, type DailyReward } from '@/game/economy';
import { feedback } from '@/features/feedback';
import { useT } from '@/i18n';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Coin, SoftButton } from '@/ui/kit';
import { radius, usePalette } from '@/ui/tokens';

// The 7-day gift strip. Presented as a transparent modal over the room.
export default function DailyRewardModal() {
  const { ui } = useT();
  const palette = usePalette();
  const next = usePlayerStore((s) => s.dailyReward.next);
  const canClaim = usePlayerStore((s) => s.dailyReward.lastClaim !== dayKey());
  const [got, setGot] = useState<DailyReward | null>(null);
  // Which tile was just opened: after claiming, `next` has already moved on.
  const [claimedIndex, setClaimedIndex] = useState<number | null>(null);
  const highlight = claimedIndex ?? next;

  const claim = () => {
    const index = next;
    const reward = usePlayerStore.getState().claimDailyReward(dayKey());
    if (reward) {
      setClaimedIndex(index);
      setGot(reward);
      feedback.zipClosed();
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.scrim}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => router.back()}
        accessibilityLabel={ui.close}
      />
      <Animated.View
        entering={ZoomIn.springify().damping(13)}
        style={[styles.card, { backgroundColor: palette.surface, shadowColor: palette.shadow }]}
      >
        <Text style={[styles.title, { color: palette.text }]}>{ui.dailyRewardTitle}</Text>
        <Text style={[styles.body, { color: palette.textMuted }]}>{ui.dailyRewardBody}</Text>

        <View style={styles.grid}>
          {DAILY_REWARDS.map((r, i) => {
            const done = claimedIndex !== null ? i <= claimedIndex : i < next;
            const current = i === highlight;
            return (
              <View
                key={i}
                style={[
                  styles.tile,
                  i === 6 && styles.bigTile,
                  {
                    backgroundColor: done ? palette.surfaceWarm : palette.note,
                    borderColor: current ? palette.primary : 'transparent',
                    opacity: done && !current ? 0.55 : 1,
                  },
                ]}
              >
                <Text style={[styles.tileDay, { color: palette.textMuted }]}>{ui.day(i + 1)}</Text>
                <RewardLabel reward={r} color={palette.text} />
                {done ? <Text style={styles.check}>✓</Text> : null}
              </View>
            );
          })}
        </View>

        {got ? (
          <Animated.View entering={ZoomIn.springify()} style={styles.got}>
            <RewardLabel reward={got} color={palette.text} big />
          </Animated.View>
        ) : null}

        {canClaim && !got ? (
          <SoftButton label={ui.claim} onPress={claim} style={styles.cta} />
        ) : (
          <>
            <Text style={[styles.body, { color: palette.textMuted, textAlign: 'center' }]}>{ui.claimed}</Text>
            <SoftButton label={ui.close} kind="soft" onPress={() => router.back()} style={styles.cta} />
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

function RewardLabel({ reward, color, big }: { reward: DailyReward; color: string; big?: boolean }) {
  const size = big ? 22 : 15;
  return (
    <View style={styles.rewardRow}>
      {reward.buttons ? (
        <View style={styles.rewardPart}>
          <Coin size={size} />
          <Text style={[styles.rewardText, { color, fontSize: size }]}>{reward.buttons}</Text>
        </View>
      ) : null}
      {reward.hints ? (
        <View style={styles.rewardPart}>
          <Text style={{ fontSize: size - 2 }}>💡</Text>
          <Text style={[styles.rewardText, { color, fontSize: size }]}>{reward.hints}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(36,30,43,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    padding: 22,
    gap: 14,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '22.5%',
    flexGrow: 1,
    minHeight: 72,
    borderRadius: radius.m,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  bigTile: { width: '47%' },
  tileDay: { fontSize: 12, fontWeight: '800' },
  check: { position: 'absolute', top: 4, right: 8, fontSize: 13, color: '#5E9C6D', fontWeight: '800' },
  rewardRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rewardPart: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardText: { fontWeight: '800', fontVariant: ['tabular-nums'] },
  got: { alignItems: 'center', paddingVertical: 4 },
  cta: { alignSelf: 'stretch' },
});
