import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT, type LanguageSetting } from '@/i18n';
import { usePlayerStore } from '@/store/usePlayerStore';
import { isAdFree, privacy, useShopStore } from '@/store/useShopStore';
import { RoundButton, SoftButton } from '@/ui/kit';
import { radius, usePalette } from '@/ui/tokens';
import { Text } from '@/ui/Text';

export default function Settings() {
  const { ui } = useT();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const settings = usePlayerStore((s) => s.settings);
  const setSetting = usePlayerStore((s) => s.setSetting);
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const entitlements = useShopStore((s) => s.entitlements);
  const busy = useShopStore((s) => s.busy);
  const [storeMessage, setStoreMessage] = useState<string | null>(null);
  const [privacyNeeded, setPrivacyNeeded] = useState(false);

  useEffect(() => {
    privacy.required().then(setPrivacyNeeded);
  }, []);

  const restore = async () => {
    setStoreMessage((await useShopStore.getState().restore()) ? ui.restoreDone : ui.restoreNone);
  };

  const rows: { key: 'sound' | 'haptics'; label: string }[] = [
    { key: 'sound', label: ui.sound },
    { key: 'haptics', label: ui.haptics },
  ];
  // Language names stay in their own language so anyone can find theirs.
  const languages: { value: LanguageSetting; label: string }[] = [
    { value: 'system', label: ui.languageSystem },
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
  ];

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
        <Text style={[styles.title, { color: palette.text }]}>{ui.settings}</Text>
        <View style={{ width: 46 }} />
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        {rows.map((row, i) => (
          <View
            key={row.key}
            style={[
              styles.row,
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.gridLine },
            ]}
          >
            <Text style={[styles.label, { color: palette.text }]}>{row.label}</Text>
            <Switch
              value={settings[row.key]}
              onValueChange={(v) => setSetting(row.key, v)}
              trackColor={{ true: palette.primary, false: palette.gridLine }}
              accessibilityLabel={row.label}
            />
          </View>
        ))}
        <View
          style={[
            styles.row,
            styles.languageRow,
            { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.gridLine },
          ]}
        >
          <Text style={[styles.label, { color: palette.text }]}>{ui.language}</Text>
          <View
            style={[styles.segment, { backgroundColor: palette.surfaceWarm }]}
            accessibilityRole="radiogroup"
          >
            {languages.map((l) => {
              const on = settings.language === l.value;
              return (
                <Pressable
                  key={l.value}
                  onPress={() => setSetting('language', l.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={[styles.segmentItem, on && { backgroundColor: palette.primary }]}
                >
                  <Text style={[styles.segmentText, { color: on ? '#FFFFFF' : palette.text }]}>
                    {l.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={[styles.card, styles.danger, { backgroundColor: palette.surface }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: palette.text }]}>{ui.membership}</Text>
          <Text style={[styles.status, { color: palette.textMuted }]}>
            {entitlements.vip ? ui.vipActive : isAdFree(entitlements) ? ui.adFreeActive : '—'}
          </Text>
        </View>
        {!entitlements.vip ? (
          <SoftButton label={ui.vipTitle} kind="soft" onPress={() => router.push('/vip')} />
        ) : null}
        <SoftButton label={ui.restore} kind="ghost" onPress={restore} disabled={!!busy} />
        {privacyNeeded ? (
          <SoftButton label={ui.privacyOptions} kind="ghost" onPress={() => privacy.show()} />
        ) : null}
        {storeMessage ? (
          <Text style={[styles.note, { color: palette.textMuted }]}>{storeMessage}</Text>
        ) : null}
      </View>

      <View style={[styles.card, styles.danger, { backgroundColor: palette.surface }]}>
        {confirming ? (
          <>
            <Text style={[styles.confirm, { color: palette.text }]}>{ui.resetConfirm}</Text>
            <View style={styles.confirmRow}>
              <SoftButton
                label={ui.cancel}
                kind="soft"
                onPress={() => setConfirming(false)}
                style={styles.flex}
              />
              <SoftButton
                label={ui.resetYes}
                onPress={() => {
                  usePlayerStore.getState().resetProgress();
                  setConfirming(false);
                  setResetDone(true);
                }}
                style={styles.flex}
              />
            </View>
          </>
        ) : (
          <SoftButton
            label={ui.resetProgress}
            kind="ghost"
            onPress={() => {
              setResetDone(false);
              setConfirming(true);
            }}
          />
        )}
        {resetDone ? <Text style={[styles.note, { color: palette.textMuted }]}>{ui.resetDone}</Text> : null}
      </View>

      <Text style={[styles.version, { color: palette.textMuted }]}>
        {ui.appName} · {ui.version(Constants.expoConfig?.version ?? '1.0.0')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800' },
  card: { borderRadius: radius.l, paddingHorizontal: 16, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  label: { fontSize: 17, fontWeight: '700' },
  status: { fontSize: 15, fontWeight: '700' },
  languageRow: { flexWrap: 'wrap', gap: 10 },
  segment: { flexDirection: 'row', borderRadius: 999, padding: 3 },
  segmentItem: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  segmentText: { fontSize: 14, fontWeight: '800' },
  danger: { paddingVertical: 12, gap: 10 },
  confirm: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  confirmRow: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  note: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  version: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
