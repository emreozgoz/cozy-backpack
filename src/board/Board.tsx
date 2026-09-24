import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Celebration } from '@/art/fx/Celebration';

import { canPlace } from '@/game/placement';
import { orientedCells } from '@/game/shapes';
import type { Cell } from '@/game/types';
import type { KeychainId } from '@/data/keychains';
import { skinById } from '@/data/themes';
import { useGameStore, visibleInstances } from '@/store/useGameStore';
import { effectiveSkin, usePlayerStore } from '@/store/usePlayerStore';
import { useShopStore } from '@/store/useShopStore';
import { usePalette } from '@/ui/tokens';

import { solve } from '@/game/solver';

import { useT } from '@/i18n';

import { BagView } from './BagView';
import { DeskCat } from './DeskCat';
import { DragHand } from './DragHand';
import { DraggableItem, type Highlight } from './DraggableItem';
import { GhostPreview, type GhostMode } from './GhostPreview';
import { Zipper } from './Zipper';
import { springs } from './springs';
import { computeLayout, itemPixelSize, snapCell, targetFor, type Target } from './layout';

interface Ghost {
  uid: string;
  cells: Cell[];
  x: number;
  y: number;
  mode: GhostMode;
}

export function Board({ width, height }: { width: number; height: number }) {
  const palette = usePalette();
  const level = useGameStore((s) => s.level);
  const allInstances = useGameStore((s) => s.instances);
  const revealed = useGameStore((s) => s.revealed);
  // Surprise items stay off the desk until they drop in.
  const instances = useMemo(() => visibleInstances(allInstances, revealed), [allInstances, revealed]);
  const placements = useGameStore((s) => s.placements);
  const orient = useGameStore((s) => s.orient);
  const issues = useGameStore((s) => s.issues);
  const hint = useGameStore((s) => s.hint);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const status = useGameStore((s) => s.status);
  const { ui } = useT();
  const vip = useShopStore((s) => s.entitlements.vip);
  const skin = skinById(
    effectiveSkin(
      usePlayerStore((s) => s.bagSkin),
      usePlayerStore((s) => s.ownedSkins),
      vip,
    ),
  );

  // The desk cat: on cat levels she curls up on a desk item shortly after the
  // first move and stays until petted.
  const [catOn, setCatOn] = useState<string | null>(null);
  const [catDone, setCatDone] = useState(false);
  const placedCount = Object.keys(placements).length;
  useEffect(() => {
    if (!level?.cat || catDone || catOn || status !== 'playing' || placedCount < 1) return;
    const t = setTimeout(() => {
      const s = useGameStore.getState();
      const onDesk = visibleInstances(s.instances, s.revealed).filter((i) => !s.placements[i.uid]);
      // Prefer something she is "guarding" that the player actually needs.
      const pick = onDesk.find((i) => i.role === 'required') ?? onDesk[0];
      if (pick) setCatOn(pick.uid);
    }, 1400);
    return () => clearTimeout(t);
  }, [level, catDone, catOn, status, placedCount]);

  // The packed bag hops once when it zips shut.
  const hop = useSharedValue(0);
  useEffect(() => {
    if (status !== 'won') return;
    hop.set(withDelay(300, withSequence(withTiming(1, { duration: 140 }), withSpring(0, springs.bouncy))));
  }, [status, hop]);

  const layout = useMemo(
    () => (level ? computeLayout(width, height, level, instances, orient) : null),
    [width, height, level, instances, orient],
  );
  // Level 1 coach: show a hand carrying the first item into the bag until
  // the player makes their first placement.
  const showHand = level?.tip === 'drag' && status === 'playing' && Object.keys(placements).length === 0;
  const handPath = useMemo(() => {
    if (!showHand || !level || !layout) return null;
    const first = instances.find((i) => i.role === 'required');
    const goal = first && solve(level, instances).solutions[0]?.[first.uid];
    if (!first || !goal) return null;
    return {
      from: targetFor(layout, first, orient[first.uid], undefined),
      to: targetFor(layout, first, goal, goal),
    };
  }, [showHand, level, layout, instances, orient]);

  const bagCenterY = layout ? layout.bag.y + layout.bag.h / 2 - height / 2 : 0;
  const hopStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bagCenterY - hop.get() * 10 },
      { scaleX: 1 + hop.get() * 0.03 },
      { scaleY: 1 + hop.get() * 0.045 },
      { translateY: -bagCenterY },
    ],
  }));

  if (!level || !layout) return null;

  const frameOf = (id: string) => layout.compartments.find((c) => c.id === id);

  const onDragMove = (uid: string, left: number, top: number) => {
    const s = useGameStore.getState();
    const inst = s.instances.find((i) => i.uid === uid);
    if (!inst || !s.level) return;
    const o = s.orient[uid];
    const snap = snapCell(layout, left, top, itemPixelSize(inst, o, layout.cell));
    const frame = snap && frameOf(snap.compartmentId);
    if (!snap || !frame) {
      setGhost(null);
      return;
    }
    const fits = canPlace(s.level, s.instances, s.placements, inst, { ...snap, ...o });
    setGhost({
      uid,
      cells: orientedCells(inst.def, o),
      x: frame.x + snap.x * layout.cell,
      y: frame.y + snap.y * layout.cell,
      mode: fits ? 'fits' : 'blocked',
    });
  };

  const onDrop = (uid: string, left: number, top: number): Target => {
    setGhost(null);
    const s = useGameStore.getState();
    const inst = s.instances.find((i) => i.uid === uid)!;
    const o = s.orient[uid];
    const snap = snapCell(layout, left, top, itemPixelSize(inst, o, layout.cell));
    if (!snap) {
      s.unplace(uid);
      return targetFor(layout, inst, o, undefined);
    }
    if (s.place(uid, snap.compartmentId, snap.x, snap.y)) {
      return targetFor(layout, inst, o, useGameStore.getState().placements[uid]);
    }
    return targetFor(layout, inst, o, s.placements[uid]);
  };

  const onTap = (uid: string) => useGameStore.getState().rotate(uid);

  const troubled = new Set(issues.map((i) => i.uid));
  const highlightOf = (uid: string): Highlight =>
    troubled.has(uid) ? 'issue' : hint?.uid === uid ? 'hint' : 'none';

  let hintGhost: Ghost | null = null;
  if (hint?.kind === 'place' && !ghost) {
    const inst = instances.find((i) => i.uid === hint.uid);
    const frame = frameOf(hint.placement.compartmentId);
    if (inst && frame) {
      hintGhost = {
        uid: hint.uid,
        cells: orientedCells(inst.def, hint.placement),
        x: frame.x + hint.placement.x * layout.cell,
        y: frame.y + hint.placement.y * layout.cell,
        mode: 'hint',
      };
    }
  }
  const shownGhost = ghost ?? hintGhost;

  return (
    <View style={{ width, height }}>
      <Animated.View style={[StyleSheet.absoluteFill, hopStyle]}>
        <View
          style={[
            styles.desk,
            {
              top: layout.desk.y,
              height: layout.desk.h,
              backgroundColor: palette.desk,
              borderColor: palette.deskEdge,
            },
          ]}
        />
        <BagView
          layout={layout}
          level={level}
          palette={palette}
          skin={skin}
          keychain={usePlayerStore.getState().keychain as KeychainId | null}
        />
        {shownGhost ? (
          <GhostPreview
            cells={shownGhost.cells}
            x={shownGhost.x}
            y={shownGhost.y}
            cell={layout.cell}
            mode={shownGhost.mode}
            fitsColor={palette.success}
            blockedColor={palette.gentleWarn}
            hintColor={palette.primary}
          />
        ) : null}
        {instances.map((inst) => (
          <DraggableItem
            key={inst.uid}
            inst={inst}
            orientation={orient[inst.uid]}
            cell={layout.cell}
            target={targetFor(layout, inst, orient[inst.uid], placements[inst.uid])}
            placed={!!placements[inst.uid]}
            highlight={highlightOf(inst.uid)}
            isDark={palette.isDark}
            warnColor={palette.gentleWarn}
            hintColor={palette.primary}
            onDragMove={onDragMove}
            onDrop={onDrop}
            onTap={onTap}
            enter={inst.appearsAfter !== undefined}
            locked={inst.uid === catOn}
          />
        ))}
        <View style={[StyleSheet.absoluteFill, styles.zipLayer]} pointerEvents="box-none">
          <Zipper key={level.id} layout={layout} palette={palette} />
        </View>
      </Animated.View>
      {catOn && !placements[catOn] ? (
        <DeskCat
          x={
            targetFor(
              layout,
              instances.find((i) => i.uid === catOn)!,
              orient[catOn],
              undefined,
            ).x
          }
          y={
            targetFor(
              layout,
              instances.find((i) => i.uid === catOn)!,
              orient[catOn],
              undefined,
            ).y
          }
          size={Math.max(56, layout.cell * 1.3)}
          petLabel={ui.petCat}
          onGone={() => {
            setCatOn(null);
            setCatDone(true);
          }}
        />
      ) : null}
      {handPath ? <DragHand from={handPath.from} to={handPath.to} /> : null}
      {status === 'won' ? (
        <View style={[StyleSheet.absoluteFill, styles.fxLayer]} pointerEvents="none">
          <Celebration
            x={layout.bag.x + layout.bag.w / 2}
            y={layout.bag.y + layout.cell * 0.4}
            spread={layout.bag.w}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  zipLayer: { zIndex: 200 },
  fxLayer: { zIndex: 300 },
  desk: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 6,
  },
});
