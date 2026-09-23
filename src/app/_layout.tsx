import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initSound, setHapticsEnabled, setSoundEnabled } from '@/features/feedback';
import { usePlayerStore } from '@/store/usePlayerStore';
import { usePalette } from '@/ui/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const palette = usePalette();
  const sound = usePlayerStore((s) => s.settings.sound);
  const haptics = usePlayerStore((s) => s.settings.haptics);

  useEffect(() => {
    SplashScreen.hideAsync();
    initSound();
  }, []);

  useEffect(() => {
    setSoundEnabled(sound);
    setHapticsEnabled(haptics);
  }, [sound, haptics]);

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
        <Stack.Screen
          name="daily-reward"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
