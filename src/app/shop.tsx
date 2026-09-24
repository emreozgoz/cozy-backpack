import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { feedback } from '@/features/feedback';
import { HINT_PACKS, productById, type ProductId } from '@/features/monetization/products';
import { useT } from '@/i18n';
import { isAdFree, starterOffered, useShopStore } from '@/store/useShopStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Chip, Coin, RoundButton, SoftButton } from '@/ui/kit';
import { radius, usePalette } from '@/ui/tokens';
import { Text } from '@/ui/Text';

export default function Shop() {
  const { ui } = useT();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const shop = useShopStore();
  const hints = usePlayerStore((s) => s.hints);
  const buttons = usePlayerStore((s) => s.buttons);
  const [message, setMessage] = useState<string | null>(null);
  const adFree = isAdFree(shop.entitlements);

  const buy = async (id: ProductId) => {
    setMessage(null);
    const outcome = await shop.buy(id);
    if (outcome === 'ok') {
      feedback.zipClosed();
      setMessage(ui.purchaseThanks);
    } else if (outcome === 'pending') setMessage(ui.purchasePending);
    else if (outcome === 'failed') setMessage(ui.purchaseFailed);
  };

  const restore = async () => {
    setMessage(null);
    setMessage((await shop.restore()) ? ui.restoreDone : ui.restoreNone);
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
        <Text style={[styles.title, { color: palette.text }]}>{ui.shop}</Text>
        <View style={styles.chips}>
          <Chip icon={<Text>💡</Text>} value={hints} label={ui.hints} />
          <Chip icon={<Coin />} value={buttons} label={ui.buttons} />
        </View>
      </View>

      {shop.mode === 'mock' ? (
        <Text style={[styles.testMode, { color: palette.textMuted, backgroundColor: palette.surfaceWarm }]}>
          {ui.shopTestMode}
        </Text>
      ) : null}
      {message ? <Text style={[styles.message, { color: palette.text }]}>{message}</Text> : null}

      {/* VIP */}
      <Pressable
        onPress={() => router.push('/vip')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.card,
          styles.vip,
          { backgroundColor: palette.primary, transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <Text style={styles.vipTitle}>{ui.vipTitle}</Text>
        <Text style={styles.vipBody}>{shop.entitlements.vip ? ui.vipActive : ui.vipBody}</Text>
      </Pressable>

      {/* starter pack (first days only) or remove ads */}
      {starterOffered(shop) ? (
        <OfferCard
          title={ui.starterTitle}
          body={ui.starterBody}
          price={shop.prices['cb.starter']}
          busy={shop.busy === 'cb.starter'}
          onBuy={() => buy('cb.starter')}
        />
      ) : null}
      <OfferCard
        title={ui.removeAdsTitle}
        body={ui.removeAdsBody}
        price={adFree ? undefined : shop.prices['cb.removeads']}
        doneLabel={adFree ? ui.adFreeActive : undefined}
        busy={shop.busy === 'cb.removeads'}
        onBuy={() => buy('cb.removeads')}
      />

      <Text style={[styles.section, { color: palette.textMuted }]}>{ui.hintPacks}</Text>
      <View style={styles.packs}>
        {HINT_PACKS.map((id) => (
          <Pressable
            key={id}
            onPress={() => buy(id)}
            disabled={!!shop.busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.pack,
              { backgroundColor: palette.surface, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.packIcon}>💡</Text>
            <Text style={[styles.packName, { color: palette.text }]}>
              {ui.hintPack(productById(id).grant.hints!)}
            </Text>
            <Text style={[styles.packPrice, { color: palette.primary }]}>
              {shop.busy === id ? '…' : shop.prices[id]}
            </Text>
          </Pressable>
        ))}
      </View>

      <SoftButton label={ui.restore} kind="ghost" onPress={restore} disabled={!!shop.busy} />
    </ScrollView>
  );
}

function OfferCard({
  title,
  body,
  price,
  doneLabel,
  busy,
  onBuy,
}: {
  title: string;
  body: string;
  price?: string;
  doneLabel?: string;
  busy: boolean;
  onBuy(): void;
}) {
  const palette = usePalette();
  return (
    <View style={[styles.card, { backgroundColor: palette.surface }]}>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.cardBody, { color: palette.textMuted }]}>{body}</Text>
      </View>
      {doneLabel ? (
        <Text style={[styles.done, { color: palette.success }]}>{doneLabel}</Text>
      ) : (
        <SoftButton
          label={busy ? '…' : (price ?? '')}
          onPress={onBuy}
          disabled={busy}
          style={styles.priceButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 22, fontWeight: '800', flex: 1 },
  chips: { flexDirection: 'row', gap: 6 },
  testMode: { fontSize: 13, fontWeight: '700', borderRadius: radius.s, padding: 10, overflow: 'hidden' },
  message: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  card: { borderRadius: radius.l, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardBody: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  priceButton: { paddingHorizontal: 16, paddingVertical: 12 },
  done: { fontSize: 15, fontWeight: '800' },
  vip: { flexDirection: 'column', alignItems: 'flex-start', gap: 4, paddingVertical: 22 },
  vipTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  vipBody: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', opacity: 0.95 },
  section: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 4 },
  packs: { flexDirection: 'row', gap: 10 },
  pack: { flex: 1, borderRadius: radius.m, paddingVertical: 16, alignItems: 'center', gap: 6 },
  packIcon: { fontSize: 26 },
  packName: { fontSize: 15, fontWeight: '800' },
  packPrice: { fontSize: 15, fontWeight: '800' },
});
