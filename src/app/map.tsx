import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { levelsByWeek } from '@/data/levels';
import { formatMs, RUSH_UNLOCK_LEVEL } from '@/game/time';
import type { LevelDef } from '@/game/types';
import { useT } from '@/i18n';
import { isUnlocked, nextToPlay, usePlayerStore } from '@/store/usePlayerStore';
import { RoundButton, StarGlyph } from '@/ui/kit';
import { radius, usePalette, type Palette } from '@/ui/tokens';
import { Text } from '@/ui/Text';

// The level map is a weekly planner: one notebook page per school week,
// swiped sideways. It opens on the week of the next day to play.
export default function Map() {
  const { ui } = useT();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const progress = usePlayerStore((s) => s.progress);
  const rushBest = usePlayerStore((s) => s.rushBest);
  const rushOpen = progress[RUSH_UNLOCK_LEVEL] !== undefined;
  const [rush, setRush] = useState(false);
  const weeks = levelsByWeek();
  const current = nextToPlay(progress);
  const startIndex = Math.max(
    0,
    weeks.findIndex((w) => w.levels.some((l) => l.id === current)),
  );
  const list = useRef<FlatList>(null);

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <RoundButton label="‹" onPress={() => router.back()} accessibilityLabel={ui.home} />
        <Text style={[styles.title, { color: palette.text }]}>{rush ? ui.rushTitle : ui.levels}</Text>
        {rushOpen ? (
          <RoundButton
            label={rush ? '★' : '⏱'}
            onPress={() => setRush(!rush)}
            accessibilityLabel={rush ? ui.levels : ui.rushTitle}
            badge={!rush && Object.keys(rushBest).length === 0}
          />
        ) : (
          <View style={{ width: 46 }} />
        )}
      </View>
      {rush ? <Text style={[styles.rushBody, { color: palette.textMuted }]}>{ui.rushBody}</Text> : null}
      <FlatList
        ref={list}
        data={weeks}
        horizontal
        pagingEnabled
        initialScrollIndex={startIndex}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(w) => String(w.week)}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}>
            <WeekPage
              week={item.week}
              levels={item.levels}
              progress={progress}
              current={current}
              palette={palette}
              rush={rush}
              rushBest={rushBest}
            />
          </View>
        )}
      />
    </View>
  );
}

function WeekPage({
  week,
  levels,
  progress,
  current,
  palette,
  rush,
  rushBest,
}: {
  week: number;
  levels: LevelDef[];
  progress: Record<string, number>;
  current: string;
  palette: Palette;
  rush: boolean;
  rushBest: Record<string, number>;
}) {
  const { ui, weekdays, subjects, weekNames } = useT();
  return (
    <View style={[styles.page, { backgroundColor: palette.note, shadowColor: palette.shadow }]}>
      {/* notebook rings and ruled lines */}
      <View style={styles.rings}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={[styles.ring, { backgroundColor: palette.bg }]} />
        ))}
      </View>
      <Text style={styles.weekLabel}>{ui.week(week)}</Text>
      <Text style={styles.weekName}>{weekNames[week] ?? ''}</Text>
      <View style={styles.days}>
        {levels.map((level) => {
          // Sabah Telaşı replays finished days only.
          const open = rush ? progress[level.id] !== undefined : isUnlocked(level.id, progress);
          const stars = progress[level.id];
          const isCurrent = level.id === current;
          return (
            <Pressable
              key={level.id}
              disabled={!open}
              onPress={() =>
                router.push({
                  pathname: '/play/[levelId]',
                  params: rush ? { levelId: level.id, mode: 'rush' } : { levelId: level.id },
                })
              }
              accessibilityRole="button"
              accessibilityState={{ disabled: !open }}
              accessibilityLabel={`${weekdays[level.day]}, ${level.schedule.map((s) => subjects[s]).join(', ')}${
                stars ? `, ${ui.starsCount(stars)}` : ''
              }${open ? '' : `, ${ui.locked}`}`}
              style={({ pressed }) => [
                styles.day,
                {
                  backgroundColor: palette.surface,
                  opacity: open ? 1 : 0.55,
                  borderColor: isCurrent ? palette.primary : 'transparent',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={styles.dayText}>
                <Text style={[styles.dayName, { color: palette.text }]}>{weekdays[level.day]}</Text>
                <Text style={[styles.subjects, { color: palette.textMuted }]} numberOfLines={1}>
                  {open ? level.schedule.map((s) => subjects[s]).join(' · ') : ui.locked}
                </Text>
              </View>
              {open && rush ? (
                <Text style={[styles.best, { color: palette.text }]}>
                  {rushBest[level.id] !== undefined ? `⏱ ${formatMs(rushBest[level.id])}` : ui.noRecord}
                </Text>
              ) : open ? (
                <View style={styles.stars}>
                  {[1, 2, 3].map((n) => (
                    <StarGlyph key={n} size={18} filled={!!stars && n <= stars} />
                  ))}
                </View>
              ) : (
                <Text style={styles.lock}>🔒</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800' },
  page: {
    flex: 1,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    borderRadius: radius.l,
    paddingTop: 30,
    paddingHorizontal: 18,
    paddingBottom: 18,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  rings: {
    position: 'absolute',
    top: 10,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ring: { width: 12, height: 12, borderRadius: 6 },
  weekLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E9826C',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  weekName: { fontSize: 26, fontWeight: '800', color: '#5B4636', marginBottom: 14 },
  days: { gap: 10 },
  day: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.m,
    borderWidth: 2.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dayText: { flex: 1 },
  dayName: { fontSize: 17, fontWeight: '800' },
  subjects: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  stars: { flexDirection: 'row', gap: 2 },
  lock: { fontSize: 18 },
  best: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rushBody: { fontSize: 14, fontWeight: '600', paddingHorizontal: 20, marginBottom: 10, textAlign: 'center' },
});
