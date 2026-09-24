import { Canvas } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { daylightFor, roomLayout, RoomScene } from '@/art/room/RoomScene';
import { getLevel } from '@/data/levels';
import { dailyId } from '@/game/daily';
import { dayKey } from '@/game/economy';
import { useT } from '@/i18n';
import type { KeychainId } from '@/data/keychains';
import { skinById } from '@/data/themes';
import { effectiveRoom, effectiveSkin, nextToPlay, totalStars, usePlayerStore } from '@/store/usePlayerStore';
import { useShopStore } from '@/store/useShopStore';
import { Chip, Coin, RoundButton, SoftButton, StarGlyph } from '@/ui/kit';
import { radius, usePalette } from '@/ui/tokens';
import { Text } from '@/ui/Text';

// Offer the daily reward once per app launch, not every time Home re-mounts.
let rewardOffered = false;

export default function Home() {
  const { ui, weekdays } = useT();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const progress = usePlayerStore((s) => s.progress);
  const buttons = usePlayerStore((s) => s.buttons);
  const hints = usePlayerStore((s) => s.hints);
  const room = usePlayerStore((s) => s.room);
  const ownedDecor = usePlayerStore((s) => s.ownedDecor);
  const ownedSkins = usePlayerStore((s) => s.ownedSkins);
  const bagSkin = usePlayerStore((s) => s.bagSkin);
  const vip = useShopStore((s) => s.entitlements.vip);
  const keychain = usePlayerStore((s) => s.keychain);
  const dailyPuzzle = usePlayerStore((s) => s.dailyPuzzle);
  const canClaim = usePlayerStore((s) => s.dailyReward.lastClaim !== dayKey());
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const today = dayKey();
  const next = getLevel(nextToPlay(progress))!;
  const dailyDone = dailyPuzzle.results[today] !== undefined;

  useEffect(() => {
    if (canClaim && !rewardOffered) {
      rewardOffered = true;
      const t = setTimeout(() => router.push('/daily-reward'), 600);
      return () => clearTimeout(t);
    }
  }, [canClaim]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const L = size ? roomLayout(size.w, size.h) : null;
  const play = () => router.push({ pathname: '/play/[levelId]', params: { levelId: next.id } });

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg }]} onLayout={onLayout}>
      {size && L ? (
        <>
          <Canvas style={StyleSheet.absoluteFill}>
            <RoomScene
              w={size.w}
              h={size.h}
              room={effectiveRoom(room, ownedDecor, vip)}
              skin={skinById(effectiveSkin(bagSkin, ownedSkins, vip))}
              keychain={keychain as KeychainId | null}
              bagType={next.bag.type}
              isDark={palette.isDark}
              daylight={daylightFor(new Date().getHours(), palette.isDark)}
            />
          </Canvas>

          {/* backpack on the desk = play the next day */}
          <Pressable
            onPress={play}
            accessibilityRole="button"
            accessibilityLabel={`${ui.packBag}: ${weekdays[next.day]}, ${ui.week(next.week)}`}
            style={[
              styles.hotspot,
              { left: L.backpack.x, top: L.backpack.y, width: L.backpack.w, height: L.backpack.h },
            ]}
          />
          <PlayBubble
            x={L.backpack.x + L.backpack.w / 2}
            y={L.backpack.y - 20 * L.u}
            title={ui.packBag}
            subtitle={`${weekdays[next.day]} · ${ui.week(next.week)}`}
            onPress={play}
          />

          {/* wall calendar = level map */}
          <Pressable
            onPress={() => router.push('/map')}
            accessibilityRole="button"
            accessibilityLabel={ui.levels}
            style={[
              styles.hotspot,
              { left: L.calendar.x, top: L.calendar.y, width: L.calendar.w, height: L.calendar.h },
            ]}
          >
            <View style={[styles.tag, { backgroundColor: palette.surface, shadowColor: palette.shadow }]}>
              <Text style={[styles.tagText, { color: palette.text }]}>{ui.levels}</Text>
            </View>
          </Pressable>
        </>
      ) : null}

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.leftButtons}>
          <RoundButton
            label="🎁"
            onPress={() => router.push('/daily-reward')}
            accessibilityLabel={ui.dailyReward}
            badge={canClaim}
          />
          <RoundButton label="🛍" onPress={() => router.push('/shop')} accessibilityLabel={ui.shop} />
          <RoundButton
            label="🔑"
            onPress={() => router.push('/collection')}
            accessibilityLabel={ui.collection}
          />
        </View>
        <View style={styles.chips}>
          <Chip icon={<StarGlyph />} value={totalStars(progress)} label={ui.stars} />
          <Chip icon={<Coin />} value={buttons} label={ui.buttons} />
          <Chip icon={<Text style={styles.chipIcon}>💡</Text>} value={hints} label={ui.hints} />
        </View>
        <RoundButton label="⚙︎" onPress={() => router.push('/settings')} accessibilityLabel={ui.settings} />
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push({ pathname: '/play/[levelId]', params: { levelId: dailyId(today) } })}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.dailyCard,
            {
              backgroundColor: palette.surface,
              shadowColor: palette.shadow,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={[styles.dailyTitle, { color: palette.text }]}>{ui.dailyPuzzle}</Text>
          <Text style={[styles.dailySub, { color: palette.textMuted }]}>
            {dailyDone ? ui.dailyDone(dailyPuzzle.streak) : ui.dailyTodo(dailyPuzzle.streak)}
          </Text>
        </Pressable>
        <SoftButton
          label={ui.decorate}
          kind="soft"
          onPress={() => router.push('/room')}
          style={styles.decorate}
        />
      </View>
    </View>
  );
}

function PlayBubble({
  x,
  y,
  title,
  subtitle,
  onPress,
}: {
  x: number;
  y: number;
  title: string;
  subtitle: string;
  onPress(): void;
}) {
  const palette = usePalette();
  const bob = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    bob.set(withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1));
  }, [bob, reduceMotion]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.get() * 5 }] }));
  const [w, setW] = useState(160);

  return (
    <Animated.View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[styles.bubbleWrap, { left: x - w / 2, top: y - 58 }, style]}
    >
      <Pressable
        onPress={onPress}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.bubble, { backgroundColor: palette.primary }]}
      >
        <Text style={styles.bubbleTitle}>{title}</Text>
        <Text style={styles.bubbleSub}>{subtitle}</Text>
      </Pressable>
      <View style={[styles.bubbleTail, { borderTopColor: palette.primary }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hotspot: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  tag: {
    marginBottom: -14,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tagText: { fontSize: 13, fontWeight: '800' },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftButtons: { flexDirection: 'column', gap: 8 },
  chips: { flexDirection: 'row', gap: 6, flexShrink: 1, flexWrap: 'wrap', justifyContent: 'center' },
  chipIcon: { fontSize: 14 },
  bottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
    maxWidth: 560,
    alignSelf: 'center',
  },
  dailyCard: {
    flex: 1,
    borderRadius: radius.l,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    justifyContent: 'center',
  },
  dailyTitle: { fontSize: 16, fontWeight: '800' },
  dailySub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  decorate: { paddingHorizontal: 16 },
  bubbleWrap: { position: 'absolute', alignItems: 'center' },
  bubble: { borderRadius: radius.m, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  bubbleTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  bubbleSub: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', opacity: 0.9 },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
