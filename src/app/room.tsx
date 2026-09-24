import { Canvas } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { daylightFor, RoomScene } from '@/art/room/RoomScene';
import { DECOR, DECOR_SLOTS, type DecorSlot } from '@/data/decor';
import { BAG_SKINS, skinById, themeById, type BagSkinId, type ThemeId } from '@/data/themes';
import { feedback } from '@/features/feedback';
import { useT } from '@/i18n';
import { effectiveRoom, effectiveSkin, totalStars, usePlayerStore } from '@/store/usePlayerStore';
import { useShopStore } from '@/store/useShopStore';
import { Chip, Coin, RoundButton, SoftButton, StarGlyph } from '@/ui/kit';
import { Text } from '@/ui/Text';
import { radius, usePalette } from '@/ui/tokens';

type Tab = DecorSlot | 'bag';

/** One choosable thing in the current tab: a decor piece or a bag pattern. */
interface Option {
  kind: 'decor' | 'skin';
  id: string;
  name: string;
  stars: number;
  price: number;
  theme?: ThemeId;
}

// Decorate the room: pick a slot, try something on (the preview shows it even
// before it's yours), then buy it with buttons, get its theme, or just use it.
export default function Room() {
  const { ui, slots, decor, skins } = useT();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const room = usePlayerStore((s) => s.room);
  const owned = usePlayerStore((s) => s.ownedDecor);
  const ownedSkins = usePlayerStore((s) => s.ownedSkins);
  const bagSkin = usePlayerStore((s) => s.bagSkin);
  const buttons = usePlayerStore((s) => s.buttons);
  const stars = usePlayerStore((s) => totalStars(s.progress));
  const vip = useShopStore((s) => s.entitlements.vip);
  const [tab, setTab] = useState<Tab>('wall');
  const [preview, setPreview] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const liveRoom = effectiveRoom(room, owned, vip);
  const liveSkin = effectiveSkin(bagSkin, ownedSkins, vip);

  const options: Option[] =
    tab === 'bag'
      ? BAG_SKINS.map((s) => ({
          kind: 'skin' as const,
          id: s.id,
          name: skins[s.id],
          stars: s.stars ?? 0,
          price: s.price ?? 0,
          theme: s.theme,
        }))
      : DECOR.filter((d) => d.slot === tab).map((d) => ({
          kind: 'decor' as const,
          id: d.id,
          name: decor[d.id],
          stars: d.stars,
          price: d.price,
          theme: d.theme,
        }));

  const isVipTheme = (t?: ThemeId) => !!t && themeById(t).access.kind === 'vip';
  const has = (o: Option) =>
    (o.kind === 'decor' ? owned.includes(o.id) : ownedSkins.includes(o.id as BagSkinId)) ||
    (vip && isVipTheme(o.theme));
  const isOn = (o: Option) => (o.kind === 'decor' ? liveRoom[tab as DecorSlot] === o.id : liveSkin === o.id);

  const selected = options.find((o) => o.id === preview) ?? options.find(isOn) ?? options[0];
  const shownRoom =
    preview && selected.kind === 'decor' ? { ...liveRoom, [tab as DecorSlot]: preview } : liveRoom;
  const shownSkin = skinById(preview && selected.kind === 'skin' ? preview : liveSkin);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const choose = (o: Option) => {
    if (has(o)) {
      const player = usePlayerStore.getState();
      if (o.kind === 'decor') player.equipDecor(o.id, vip);
      else player.equipSkin(o.id as BagSkinId, vip);
      setPreview(null);
      feedback.place();
    } else {
      setPreview(o.id);
      feedback.pickup();
    }
  };

  const buy = () => {
    const player = usePlayerStore.getState();
    const ok =
      selected.kind === 'decor' ? player.buyDecor(selected.id) : player.buySkin(selected.id as BagSkinId);
    if (ok) {
      setPreview(null);
      feedback.zipClosed();
    } else {
      feedback.nope();
    }
  };

  const themeAction = (theme: ThemeId) => {
    if (themeById(theme).access.kind === 'vip') router.push('/vip');
    else router.push('/shop');
  };

  const tabs: Tab[] = [...DECOR_SLOTS, 'bag'];
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
              skin={shownSkin}
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
          {tabs.map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                setTab(t);
                setPreview(null);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              style={[styles.tab, { backgroundColor: tab === t ? palette.primary : palette.surfaceWarm }]}
            >
              <Text style={[styles.tabText, { color: tab === t ? '#FFFFFF' : palette.text }]}>
                {t === 'bag' ? ui.bagTab : slots[t]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options}>
          {options.map((o) => {
            const on = isOn(o) && !preview;
            const previewing = preview === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => choose(o)}
                accessibilityRole="button"
                accessibilityState={{ selected: on || previewing }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: palette.surfaceWarm,
                    borderColor: on || previewing ? palette.primary : 'transparent',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Text style={[styles.optionName, { color: palette.text }]} numberOfLines={2}>
                  {o.name}
                </Text>
                <View style={styles.optionMeta}>
                  {on ? (
                    <Text style={[styles.meta, { color: palette.success }]}>✓ {ui.equipped}</Text>
                  ) : has(o) ? (
                    <Text style={[styles.meta, { color: palette.textMuted }]}>{ui.equip}</Text>
                  ) : o.theme ? (
                    <Text style={[styles.meta, { color: palette.primary }]}>
                      {isVipTheme(o.theme) ? `★ ${ui.vipLabel}` : ui.packLabel}
                    </Text>
                  ) : o.stars > stars ? (
                    <Text style={[styles.meta, { color: palette.textMuted }]}>🔒 {o.stars}★</Text>
                  ) : (
                    <View style={styles.price}>
                      <Coin size={14} />
                      <Text style={[styles.meta, { color: palette.text }]}>{o.price}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {preview && !has(selected) ? (
          selected.theme ? (
            <SoftButton label={ui.getTheme} onPress={() => themeAction(selected.theme!)} />
          ) : (
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
          )
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
  options: { gap: 10 },
  option: {
    width: 124,
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
