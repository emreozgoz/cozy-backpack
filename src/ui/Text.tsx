import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';

// Nunito everywhere. Static weights are registered as separate families
// (variable fonts don't pick weights reliably on iOS), so this maps the
// usual `fontWeight` in styles to the right file. Letters Nunito lacks
// (★, ✓…) fall back to the system font automatically.

export const FONTS = {
  'Nunito-Regular': require('@/assets/fonts/Nunito-Regular.ttf'),
  'Nunito-SemiBold': require('@/assets/fonts/Nunito-SemiBold.ttf'),
  'Nunito-Bold': require('@/assets/fonts/Nunito-Bold.ttf'),
  'Nunito-ExtraBold': require('@/assets/fonts/Nunito-ExtraBold.ttf'),
  'Nunito-Black': require('@/assets/fonts/Nunito-Black.ttf'),
};

function familyFor(weight: TextStyle['fontWeight']): keyof typeof FONTS {
  const w = typeof weight === 'number' ? weight : Number(weight === 'bold' ? 700 : (weight ?? 400));
  if (w >= 900) return 'Nunito-Black';
  if (w >= 800) return 'Nunito-ExtraBold';
  if (w >= 700) return 'Nunito-Bold';
  if (w >= 600) return 'Nunito-SemiBold';
  return 'Nunito-Regular';
}

export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return <RNText style={style} {...rest} />;
  return (
    <RNText style={[style, { fontFamily: familyFor(flat.fontWeight), fontWeight: undefined }]} {...rest} />
  );
}

export const AnimatedText = Animated.createAnimatedComponent(Text);
