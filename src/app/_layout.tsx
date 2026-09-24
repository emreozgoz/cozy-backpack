import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initSound, setHapticsEnabled, setSoundEnabled } from '@/features/feedback';
import { MockAdOverlay } from '@/features/monetization/MockAdOverlay';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useShopStore } from '@/store/useShopStore';
import { FONTS } from '@/ui/Text';
import { usePalette } from '@/ui/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const palette = usePalette();
  const sound = usePlayerStore((s) => s.settings.sound);
  const haptics = usePlayerStore((s) => s.settings.haptics);

  const [fontsLoaded, fontError] = useFonts(FONTS);
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    initSound();
    useShopStore.getState().init();
  }, []);

  useEffect(() => {
    setSoundEnabled(sound);
    setHapticsEnabled(haptics);
  }, [sound, haptics]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.bg }}>
      <StatusBar style={palette.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="vip" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="daily-reward"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </Stack>
      <MockAdOverlay />
    </GestureHandlerRootView>
  );
}
