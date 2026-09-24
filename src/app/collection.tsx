import { Canvas } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeychainCharm } from '@/art/keychains';
import { earnedKeychains, KEYCHAINS, type Keychain } from '@/data/keychains';
import { getLevel } from '@/data/levels';
import { feedback } from '@/features/feedback';
import { useT, type Strings } from '@/i18n';
import { statsOf, usePlayerStore } from '@/store/usePlayerStore';
import { RoundButton } from '@/ui/kit';
import { Text } from '@/ui/Text';
import { radius, usePalette } from '@/ui/tokens';

function goalText(k: Keychain, t: Strings): string {
  const g = k.goal;
  switch (g.kind) {
    case 'stars':
      return t.ui.goalStars(g.count);
    case 'level': {
      const level = getLevel(g.levelId);
      return level ? t.ui.goalLevel(level.week, t.weekdays[level.day]) : '';
    }
    case 'streak':
      return t.ui.goalStreak(g.days);
    case 'daily':
      return t.ui.goalDaily(g.count);
  }
}

// Keychains unlock by themselves as you play; tap an earned one to hang it
// on your bag (in the room and in every level).
export default function Collection() {
  const t = useT();
  const { ui, keychains: names } = t;
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const progress = usePlayerStore((s) => s.progress);
  const dailyPuzzle = usePlayerStore((s) => s.dailyPuzzle);
  const onBag = usePlayerStore((s) => s.keychain);
  const earned = new Set(earnedKeychains(statsOf({ progress, dailyPuzzle })));

  const toggle = (id: string) => {
    usePlayerStore.getState().setKeychain(onBag === id ? null : id);
    feedback.place();
  };

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.header}>
        <RoundButton label="‹" onPress={() => router.back()} accessibilityLabel={ui.home} />
        <Text style={[styles.title, { color: palette.text }]}>{ui.collection}</Text>
        <View style={{ width: 46 }} />
      </View>
      <Text style={[styles.section, { color: palette.text }]}>{ui.keychainsTitle}</Text>
      <Text style={[styles.body, { color: palette.textMuted }]}>{ui.keychainsBody}</Text>

      <View style={styles.grid}>
        {KEYCHAINS.map((k) => {
          const has = earned.has(k.id);
          const hanging = onBag === k.id;
          return (
            <Pressable
              key={k.id}
              disabled={!has}
              onPress={() => toggle(k.id)}
              accessibilityRole="button"
              accessibilityState={{ disabled: !has, selected: hanging }}
              accessibilityLabel={has ? names[k.id] : goalText(k, t)}
              style={({ pressed }) => [
                styles.tile,
                {
                  backgroundColor: palette.surface,
                  borderColor: hanging ? palette.primary : 'transparent',
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <Canvas style={styles.charm}>
                <KeychainCharm id={k.id} cx={45} cy={62} size={52} locked={!has} />
              </Canvas>
              <Text
                style={[styles.name, { color: has ? palette.text : palette.textMuted }]}
                numberOfLines={1}
              >
                {has ? names[k.id] : '?'}
              </Text>
              <Text
                style={[styles.goal, { color: hanging ? palette.primary : palette.textMuted }]}
                numberOfLines={2}
              >
                {hanging ? ui.onBag : has ? ui.hang : goalText(k, t)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 8, maxWidth: 620, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  section: { fontSize: 18, fontWeight: '800' },
  body: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '31%',
    flexGrow: 1,
    minWidth: 100,
    borderRadius: radius.m,
    borderWidth: 2.5,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  charm: { width: 90, height: 100 },
  name: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  goal: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 2, minHeight: 32 },
});
