import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, usePalette } from './tokens';
import { Text } from './Text';

/** The "düğme" currency icon: a little sewing button with four holes. */
export function Coin({ size = 18 }: { size?: number }) {
  const hole = size * 0.16;
  const off = size * 0.17;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#F7B6C8',
        borderWidth: Math.max(1.5, size * 0.09),
        borderColor: '#E893AA',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {[
        [-off, -off],
        [off, -off],
        [-off, off],
        [off, off],
      ].map(([x, y]) => (
        <View
          key={`${x},${y}`}
          style={{
            position: 'absolute',
            width: hole,
            height: hole,
            borderRadius: hole / 2,
            backgroundColor: '#C9708A',
            transform: [{ translateX: x }, { translateY: y }],
          }}
        />
      ))}
    </View>
  );
}

export function StarGlyph({ size = 16, filled = true }: { size?: number; filled?: boolean }) {
  const palette = usePalette();
  return (
    <Text style={{ fontSize: size, lineHeight: size * 1.15, color: filled ? '#F6C177' : palette.gridLine }}>
      ★
    </Text>
  );
}

/** Small rounded counter: icon + number. */
export function Chip({ icon, value, label }: { icon: ReactNode; value: number | string; label: string }) {
  const palette = usePalette();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.chip, { backgroundColor: palette.surface, shadowColor: palette.shadow }]}
    >
      {icon}
      <Text style={[styles.chipText, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress(): void;
  kind?: 'primary' | 'soft' | 'ghost';
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function SoftButton({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  style,
  accessibilityHint,
}: ButtonProps) {
  const palette = usePalette();
  const bg = kind === 'primary' ? palette.primary : kind === 'soft' ? palette.surface : 'transparent';
  const fg = kind === 'primary' ? '#FFFFFF' : kind === 'soft' ? palette.text : palette.textMuted;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.button,
        kind !== 'ghost' && {
          shadowColor: palette.shadow,
          shadowOpacity: 1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
        },
        { backgroundColor: bg, opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Round icon button (back, settings…). */
export function RoundButton({
  label,
  onPress,
  accessibilityLabel,
  badge,
}: {
  label: string;
  onPress(): void;
  accessibilityLabel: string;
  badge?: boolean;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.round,
        {
          backgroundColor: palette.surface,
          shadowColor: palette.shadow,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
      ]}
    >
      <Text style={[styles.roundText, { color: palette.text }]}>{label}</Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: palette.primary, borderColor: palette.surface }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  chipText: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.l,
    paddingVertical: 15,
    paddingHorizontal: 22,
  },
  buttonText: { fontSize: 17, fontWeight: '800' },
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  roundText: { fontSize: 20, fontWeight: '700' },
  badge: { position: 'absolute', top: 2, right: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
});
