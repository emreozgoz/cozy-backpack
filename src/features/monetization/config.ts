import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Store and ad keys come from EXPO_PUBLIC_* environment variables (.env,
// see .env.example). Missing keys, or running in Expo Go, switch the game to
// mock services: purchases succeed locally and ads are a stand-in overlay.

const env = {
  revenueCatIos: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  revenueCatAndroid: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  admobIosInterstitial: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL,
  admobIosRewarded: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED,
  admobAndroidInterstitial: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL,
  admobAndroidRewarded: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED,
};

/** Expo Go ships without the RevenueCat / AdMob native modules. */
export const isExpoGo = Constants.executionEnvironment === 'storeClient';

export function revenueCatKey(): string | undefined {
  return Platform.OS === 'ios' ? env.revenueCatIos : env.revenueCatAndroid;
}

/**
 * Real ad unit IDs only in release builds that have them configured;
 * development builds always use Google's test units (null = use TestIds).
 */
export function adUnit(kind: 'interstitial' | 'rewarded'): string | null {
  if (__DEV__) return null;
  const ios = kind === 'interstitial' ? env.admobIosInterstitial : env.admobIosRewarded;
  const android = kind === 'interstitial' ? env.admobAndroidInterstitial : env.admobAndroidRewarded;
  return (Platform.OS === 'ios' ? ios : android) ?? null;
}

/** Placeholder pages until the real ones are published in M8. */
export const LEGAL = {
  terms: 'https://emreozgoz.github.io/cozy-backpack/terms',
  privacy: 'https://emreozgoz.github.io/cozy-backpack/privacy',
  appleEula: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
};
