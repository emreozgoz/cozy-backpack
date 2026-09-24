import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { feedback } from '@/features/feedback';
import { LEGAL } from '@/features/monetization/config';
import { productById, VIP_PLANS, type ProductId } from '@/features/monetization/products';
import { useT } from '@/i18n';
import { useShopStore } from '@/store/useShopStore';
import { SoftButton } from '@/ui/kit';
import { radius, usePalette } from '@/ui/tokens';
import { Text } from '@/ui/Text';

// VIP paywall. Apple requires: plan price and period, auto-renew terms, a way
// to restore, and links to the Terms (EULA) and Privacy Policy — all here.
export default function Vip() {
  const { ui } = useT();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const shop = useShopStore();
  const [plan, setPlan] = useState<ProductId>('cb.vip.yearly');
  const [message, setMessage] = useState<string | null>(null);
  const trial = productById(plan).trialDays;

  const subscribe = async () => {
    setMessage(null);
    const outcome = await shop.buy(plan);
    if (outcome === 'ok') {
      feedback.zipClosed();
      router.back();
    } else if (outcome === 'pending') setMessage(ui.purchasePending);
    else if (outcome === 'failed') setMessage(ui.purchaseFailed);
  };

  const restore = async () => {
    setMessage((await shop.restore()) ? ui.restoreDone : ui.restoreNone);
  };

  if (shop.entitlements.vip) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: palette.bg }]}>
        <Text style={[styles.headline, { color: palette.text }]}>{ui.vipActive}</Text>
        <SoftButton label={ui.close} kind="soft" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={styles.close}
        accessibilityLabel={ui.close}
      >
        <Text style={[styles.closeText, { color: palette.textMuted }]}>✕</Text>
      </Pressable>

      <Text style={[styles.club, { color: palette.primary }]}>{ui.vipTitle}</Text>
      <Text style={[styles.headline, { color: palette.text }]}>{ui.vipHeadline}</Text>

      <View style={[styles.benefits, { backgroundColor: palette.surface }]}>
        {ui.vipBenefits.map((b) => (
          <Text key={b} style={[styles.benefit, { color: palette.text }]}>
            ✓ {b}
          </Text>
        ))}
      </View>

      <View style={styles.plans} accessibilityRole="radiogroup">
        {VIP_PLANS.map((id) => {
          const def = productById(id);
          const on = plan === id;
          const price = shop.prices[id] ?? def.fallbackPrice;
          return (
            <Pressable
              key={id}
              onPress={() => setPlan(id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={[
                styles.plan,
                { backgroundColor: palette.surface, borderColor: on ? palette.primary : 'transparent' },
              ]}
            >
              {def.period === 'year' ? (
                <Text style={[styles.best, { backgroundColor: palette.primary }]}>{ui.bestValue}</Text>
              ) : null}
              <Text style={[styles.planName, { color: palette.text }]}>
                {def.period === 'year' ? ui.planYearly : ui.planMonthly}
              </Text>
              <Text style={[styles.planPrice, { color: palette.text }]}>
                {def.period === 'year' ? ui.perYear(price) : ui.perMonth(price)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {message ? <Text style={[styles.message, { color: palette.text }]}>{message}</Text> : null}
      <SoftButton
        label={shop.busy ? '…' : trial ? ui.trial(trial) : ui.subscribe}
        onPress={subscribe}
        disabled={!!shop.busy}
      />
      <Text style={[styles.terms, { color: palette.textMuted }]}>{ui.subscriptionTerms}</Text>

      <View style={styles.links}>
        <SoftButton label={ui.restore} kind="ghost" onPress={restore} disabled={!!shop.busy} />
        <View style={styles.legal}>
          <Pressable onPress={() => WebBrowser.openBrowserAsync(LEGAL.terms)} accessibilityRole="link">
            <Text style={[styles.link, { color: palette.textMuted }]}>{ui.terms}</Text>
          </Pressable>
          <Text style={{ color: palette.textMuted }}>·</Text>
          <Pressable onPress={() => WebBrowser.openBrowserAsync(LEGAL.privacy)} accessibilityRole="link">
            <Text style={[styles.link, { color: palette.textMuted }]}>{ui.privacy}</Text>
          </Pressable>
        </View>
        <SoftButton label={ui.notNow} kind="ghost" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  content: { paddingHorizontal: 20, gap: 16, maxWidth: 520, width: '100%', alignSelf: 'center' },
  close: { position: 'absolute', right: 20, top: 16, zIndex: 1 },
  closeText: { fontSize: 20, fontWeight: '700' },
  club: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headline: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  benefits: { borderRadius: radius.l, padding: 18, gap: 10 },
  benefit: { fontSize: 16, fontWeight: '700' },
  plans: { flexDirection: 'row', gap: 10 },
  plan: {
    flex: 1,
    borderRadius: radius.m,
    borderWidth: 2.5,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  best: {
    position: 'absolute',
    top: -11,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  planName: { fontSize: 16, fontWeight: '800' },
  planPrice: { fontSize: 15, fontWeight: '700' },
  message: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  terms: { fontSize: 12, fontWeight: '600', lineHeight: 17, textAlign: 'center' },
  links: { alignItems: 'center', gap: 4 },
  legal: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  link: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
