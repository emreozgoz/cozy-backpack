import { Canvas } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { daylightFor, RoomScene } from '@/art/room/RoomScene';
import { DECOR, DECOR_SLOTS, type DecorItem, type DecorSlot } from '@/data/decor';
import { feedback } from '@/features/feedback';
import { useT } from '@/i18n';
import { totalStars, usePlayerStore } from '@/store/usePlayerStore';
import { Chip, Coin, RoundButton, SoftButton, StarGlyph } from '@/ui/kit';
import { radius, usePalette } from '@/ui/tokens';

// Decorate the room: pick a slot, try an item on (the preview shows it even
// before buying), then buy or equip it.
export default function Room() {
  const { ui, slots, decor } = useT();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const room = usePlayerStore((s) => s.room);
  const owned = usePlayerStore((s) => s.ownedDecor);
  const buttons = usePlayerStore((s) => s.buttons);
  const stars = usePlayerStore((s) => totalStars(s.progress));
  const [slot, setSlot] = useState<DecorSlot>('wall');
  const [preview, setPreview] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const selected = DECOR.find((d) => d.id === (preview ?? room[slot]))!;
  const shownRoom = preview ? { ...room, [selected.slot]: preview } : room;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const choose = (item: DecorItem) => {
    if (owned.includes(item.id)) {
      usePlayerStore.getState().equipDecor(item.id);
      setPreview(null);
      feedback.place();
    } else {
      setPreview(item.id);
      feedback.pickup();
    }
  };

  const buy = () => {
    if (usePlayerStore.getState().buyDecor(selected.id)) {
      setPreview(null);
      feedback.zipClosed();
    } else {
      feedback.nope();
    }
  };

  const locked = selected.stars > stars;
  const canAfford = buttons >= selected.price;

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg }]}>
      <View style={styles.preview} onLayout={onLayout}>
        {size ? (
          <Canvas style={StyleSheet.absoluteFill}>
            <RoomScene
              w={size.w}
              h={size.h}
              room={shownRoom}
              isDark={palette.isDark}
              daylight={daylightFor(new Date().getHours(), palette.isDark)}
            />
          </Canvas>
        ) : null}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <RoundButton label="‹" onPress={() => router.back()} accessibilityLabel={ui.home} />
          <View style={styles.chips}>
            <Chip icon={<StarGlyph />} value={stars} label={ui.stars} />
            <Chip icon={<Coin />} value={buttons} label={ui.buttons} />
          </View>
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: palette.surface, paddingBottom: insets.bottom + 16 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {DECOR_SLOTS.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                setSlot(s);
                setPreview(null);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: slot === s }}
              style={[styles.tab, { backgroundColor: slot === s ? palette.primary : palette.surfaceWarm }]}
            >
              <Text style={[styles.tabText, { color: slot === s ? '#FFFFFF' : palette.text }]}>
                {slots[s]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.options}>
          {DECOR.filter((d) => d.slot === slot).map((item) => {
            const isOwned = owned.includes(item.id);
            const isOn = room[slot] === item.id && !preview;
            const isPreview = preview === item.id;
            const itemLocked = item.stars > stars;
            return (
              <Pressable
                key={item.id}
                onPress={() => choose(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: isOn || isPreview }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: palette.surfaceWarm,
                    borderColor: isOn || isPreview ? palette.primary : 'transparent',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Text style={[styles.optionName, { color: palette.text }]} numberOfLines={2}>
                  {decor[item.id]}
                </Text>
                <View style={styles.optionMeta}>
                  {isOn ? (
                    <Text style={[styles.meta, { color: palette.success }]}>✓ {ui.equipped}</Text>
                  ) : isOwned ? (
                    <Text style={[styles.meta, { color: palette.textMuted }]}>{ui.equip}</Text>
                  ) : itemLocked ? (
                    <Text style={[styles.meta, { color: palette.textMuted }]}>🔒 {item.stars}★</Text>
                  ) : (
                    <View style={styles.price}>
                      <Coin size={14} />
                      <Text style={[styles.meta, { color: palette.text }]}>{item.price}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {preview ? (
          <SoftButton
            label={
              locked
                ? ui.needStars(selected.stars)
                : canAfford
                  ? `${ui.buy} · ${selected.price}`
                  : ui.notEnough
            }
            icon={!locked && canAfford ? <Coin size={18} /> : undefined}
            onPress={buy}
            disabled={locked || !canAfford}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  preview: { flex: 1, overflow: 'hidden' },
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
  chips: { flexDirection: 'row', gap: 6 },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  tabs: { gap: 8 },
  tab: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  tabText: { fontSize: 15, fontWeight: '800' },
  options: { flexDirection: 'row', gap: 10 },
  option: {
    flex: 1,
    minHeight: 92,
    borderRadius: radius.m,
    borderWidth: 2.5,
    padding: 12,
    justifyContent: 'space-between',
  },
  optionName: { fontSize: 14, fontWeight: '800' },
  optionMeta: { marginTop: 8 },
  meta: { fontSize: 13, fontWeight: '800' },
  price: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
