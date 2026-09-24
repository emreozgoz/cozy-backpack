import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '@/board/Board';
import { nextLevelId } from '@/data/levels';
import { feedback } from '@/features/feedback';
import { isDailyId } from '@/game/daily';
import type { Subject } from '@/game/types';
import { useT } from '@/i18n';
import { useGameStore } from '@/store/useGameStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { rewardedAvailable, useShopStore } from '@/store/useShopStore';
import { Coin, RoundButton, SoftButton } from '@/ui/kit';
import { radius, usePalette, type Palette } from '@/ui/tokens';
import { AnimatedText, Text } from '@/ui/Text';

export default function Play() {
  const { ui, stuckReasons, tips, surprises } = useT();
  const announcement = useGameStore((s) => s.announcement);
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const load = useGameStore((s) => s.load);
  const level = useGameStore((s) => s.level);
  const status = useGameStore((s) => s.status);
  const issues = useGameStore((s) => s.issues);
  const [boardSize, setBoardSize] = useState<{ w: number; h: number } | null>(null);
  const [tipClosed, setTipClosed] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const hints = usePlayerStore((s) => s.hints);

  // Notices (no hints left…) fade away on their own.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    load(levelId);
  }, [levelId, load]);

  const onBoardLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBoardSize({ w: width, h: height });
  };

  const [offerHintAd, setOfferHintAd] = useState(false);
  const canWatch = useShopStore((s) => rewardedAvailable(s));

  const watchForHint = async () => {
    const shop = useShopStore.getState();
    if (!rewardedAvailable(shop)) {
      setNotice(ui.rewardedLimit);
      setOfferHintAd(false);
      return;
    }
    if (await shop.watchRewarded()) {
      usePlayerStore.getState().addHints(1);
      setOfferHintAd(false);
      feedback.hint();
    } else {
      setNotice(ui.adUnavailable);
    }
  };

  const hint = () => {
    const player = usePlayerStore.getState();
    if (player.hints <= 0) {
      setOfferHintAd(true);
      feedback.nope();
      return;
    }
    if (useGameStore.getState().requestHint()) {
      player.spendHint();
      feedback.hint();
    } else {
      setNotice(ui.nothingToHint);
    }
  };

  if (!level || level.id !== levelId) return <View style={{ flex: 1, backgroundColor: palette.bg }} />;

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <RoundButton label="‹" onPress={() => router.back()} accessibilityLabel={ui.home} />
        <ScheduleNote palette={palette} />
        <View>
          <RoundButton label="💡" onPress={hint} accessibilityLabel={`${ui.hint}: ${hints}`} />
          <View
            pointerEvents="none"
            style={[styles.hintCount, { backgroundColor: palette.primary, borderColor: palette.bg }]}
          >
            <Text style={styles.hintCountText}>{hints}</Text>
          </View>
        </View>
      </View>

      <View style={styles.board} onLayout={onBoardLayout}>
        {boardSize ? <Board key={level.id} width={boardSize.w} height={boardSize.h} /> : null}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: palette.desk }]}>
        {announcement ? (
          <AnimatedText
            key={`surprise-${announcement}`}
            entering={FadeIn}
            style={[styles.stuck, { color: palette.text }]}
          >
            {surprises[announcement] ?? stuckReasons.surprise}
          </AnimatedText>
        ) : issues.length ? (
          <AnimatedText
            key={`stuck-${issues[0].kind}`}
            entering={FadeIn}
            style={[styles.stuck, { color: palette.text }]}
          >
            {stuckReasons[issues[0].kind]}
          </AnimatedText>
        ) : offerHintAd && hints === 0 ? (
          <Animated.View key="hint-ad" entering={FadeIn} style={styles.offer}>
            <Text style={[styles.stuck, { color: palette.text }]}>
              {canWatch ? ui.noHints : ui.rewardedLimit}
            </Text>
            {canWatch ? (
              <SoftButton label={ui.watchAdForHint} onPress={watchForHint} style={styles.offerButton} />
            ) : null}
          </Animated.View>
        ) : notice ? (
          <AnimatedText key={notice} entering={FadeIn} style={[styles.stuck, { color: palette.text }]}>
            {notice}
          </AnimatedText>
        ) : level.tip && tipClosed !== level.id ? (
          <Animated.View
            key={`tip-${level.id}`}
            entering={FadeIn.delay(300)}
            style={[styles.tip, { backgroundColor: palette.surface, shadowColor: palette.shadow }]}
          >
            <View style={[styles.tipDot, { backgroundColor: palette.primary }]} />
            <Text style={[styles.tipText, { color: palette.text }]}>{tips[level.tip]}</Text>
            <Pressable
              onPress={() => setTipClosed(level.id)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={ui.closeTip}
            >
              <Text style={[styles.tipClose, { color: palette.textMuted }]}>✕</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Text style={[styles.stuck, { color: palette.textMuted }]}>{ui.pullZip}</Text>
        )}
      </View>

      {status === 'won' ? <WinCard palette={palette} levelId={level.id} /> : null}
    </View>
  );
}

function ScheduleNote({ palette }: { palette: Palette }) {
  const { weekdays, subjects } = useT();
  const level = useGameStore((s) => s.level)!;
  const instances = useGameStore((s) => s.instances);
  const placements = useGameStore((s) => s.placements);
  const issues = useGameStore((s) => s.issues);

  const missing = new Set(issues.flatMap((i) => (i.kind === 'missing' && i.subject ? [i.subject] : [])));
  const done = (s: Subject) =>
    instances.filter((i) => i.role === 'required' && i.def.subject === s).every((i) => placements[i.uid]);

  return (
    <View style={[styles.note, { backgroundColor: palette.note, shadowColor: palette.shadow }]}>
      <View style={[styles.tape, { backgroundColor: palette.tape }]} />
      <Text style={styles.noteDay}>{weekdays[level.day]}</Text>
      <View style={styles.noteRow}>
        {level.schedule.map((s) => (
          <Text
            key={s}
            style={[
              styles.subject,
              done(s) && styles.subjectDone,
              missing.has(s) && { backgroundColor: `${palette.gentleWarn}66` },
            ]}
          >
            {done(s) ? '✓ ' : '○ '}
            {subjects[s]}
          </Text>
        ))}
      </View>
    </View>
  );
}

const STAR_DELAY = 650;
const STAR_STEP = 220;

function WinCard({ palette, levelId }: { palette: Palette; levelId: string }) {
  const { ui, decor } = useT();
  const completion = useGameStore((s) => s.completion);
  const stars = useGameStore((s) => s.stars) ?? 1;
  const load = useGameStore((s) => s.load);
  const daily = isDailyId(levelId);
  const streak = usePlayerStore((s) => s.dailyPuzzle.streak);
  const next = daily ? undefined : nextLevelId(levelId);
  const canWatch = useShopStore((s) => rewardedAvailable(s));
  const [doubled, setDoubled] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const double = async () => {
    if (!completion || doubled) return;
    if (await useShopStore.getState().watchRewarded()) {
      usePlayerStore.getState().addButtons(completion.buttons);
      setDoubled(true);
      feedback.zipClosed();
    }
  };

  // A gentle interstitial may sit between days (never after the daily puzzle).
  const goOn = async () => {
    if (leaving) return;
    setLeaving(true);
    await useShopStore.getState().maybeShowInterstitial(daily);
    if (next) router.replace({ pathname: '/play/[levelId]', params: { levelId: next } });
    else router.back();
  };

  // One ding per earned star, in step with the stars popping in.
  useEffect(() => {
    const timers = ([1, 2, 3] as const)
      .filter((n) => n <= stars)
      .map((n) => setTimeout(() => feedback.star(n), STAR_DELAY + n * STAR_STEP + 120));
    return () => timers.forEach(clearTimeout);
  }, [stars]);

  return (
    <Animated.View entering={FadeIn.delay(450).duration(250)} style={[StyleSheet.absoluteFill, styles.scrim]}>
      <Animated.View
        entering={ZoomIn.delay(450).springify().damping(12)}
        style={[styles.winCard, { backgroundColor: palette.surface, shadowColor: palette.shadow }]}
      >
        <Text style={[styles.winTitle, { color: palette.text }]}>{daily ? ui.dailyComplete : ui.packed}</Text>
        <View style={styles.stars}>
          {[1, 2, 3].map((n) => (
            <AnimatedText
              key={n}
              entering={ZoomIn.delay(STAR_DELAY + n * STAR_STEP)
                .springify()
                .damping(8)}
              style={[styles.star, { color: n <= stars ? '#F6C177' : palette.gridLine }]}
            >
              ★
            </AnimatedText>
          ))}
        </View>
        {completion ? (
          <Animated.View entering={FadeIn.delay(STAR_DELAY + 4 * STAR_STEP)} style={styles.rewards}>
            <View style={styles.earned}>
              <Coin size={22} />
              <Text style={[styles.earnedText, { color: palette.text }]}>
                {ui.earned(doubled ? completion.buttons * 2 : completion.buttons)}
              </Text>
            </View>
            {doubled ? (
              <Text style={[styles.rewardLine, { color: palette.success }]}>{ui.doubled}</Text>
            ) : canWatch && completion.buttons > 0 ? (
              <SoftButton label={ui.doubleButtons} kind="soft" onPress={double} style={styles.offerButton} />
            ) : null}
            {daily && streak > 1 ? (
              <Text style={[styles.rewardLine, { color: palette.textMuted }]}>{ui.streak(streak)}</Text>
            ) : null}
            {completion.unlocked.map((d) => (
              <Text key={d.id} style={[styles.rewardLine, { color: palette.primary }]}>
                ✨ {ui.newDecor(decor[d.id])}
              </Text>
            ))}
          </Animated.View>
        ) : null}
        <Pressable
          onPress={goOn}
          disabled={leaving}
          style={[styles.zipButton, { backgroundColor: palette.primary }]}
        >
          <Text style={styles.zipText}>{next ? ui.next : ui.home}</Text>
        </Pressable>
        <Pressable onPress={() => load(levelId)} style={styles.secondary}>
          <Text style={[styles.secondaryText, { color: palette.textMuted }]}>{ui.replay}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, gap: 12 },
  board: { flex: 1 },
  footer: { paddingHorizontal: 24, paddingTop: 4, alignItems: 'center', gap: 8 },
  note: {
    flex: 1,
    borderRadius: radius.s,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    transform: [{ rotate: '-1.2deg' }],
  },
  tape: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    width: 64,
    height: 18,
    borderRadius: 3,
    transform: [{ rotate: '2deg' }],
  },
  noteDay: { fontSize: 17, fontWeight: '800', color: '#5B4636' },
  noteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  subject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A6454',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  subjectDone: { color: '#5E9C6D' },
  stuck: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 10 },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 520,
    width: '100%',
    borderRadius: radius.m,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  tipDot: { width: 8, height: 8, borderRadius: 4 },
  tipText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 19 },
  tipClose: { fontSize: 15, fontWeight: '700' },
  zipButton: {
    alignSelf: 'stretch',
    maxWidth: 420,
    width: '100%',
    borderRadius: radius.l,
    paddingVertical: 16,
    alignItems: 'center',
  },
  zipText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  scrim: {
    backgroundColor: 'rgba(36,30,43,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  winCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  winTitle: { fontSize: 26, fontWeight: '800' },
  stars: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 48 },
  secondary: { paddingVertical: 6 },
  offer: { alignItems: 'center', gap: 8, paddingVertical: 6 },
  offerButton: { paddingVertical: 11, paddingHorizontal: 18 },
  rewards: { alignItems: 'center', gap: 4 },
  earned: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  earnedText: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rewardLine: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  hintCount: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  hintCountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  secondaryText: { fontSize: 16, fontWeight: '700' },
});
