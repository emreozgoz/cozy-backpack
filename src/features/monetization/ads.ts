import { Platform } from 'react-native';
import { create } from 'zustand';

import { adUnit, isExpoGo } from './config';

export interface AdService {
  readonly mode: 'admob' | 'mock';
  /** Consent (UMP) → tracking permission (iOS ATT) → SDK init → preload. Safe to call repeatedly. */
  prepare(): Promise<void>;
  /** Resolves true if an ad was actually shown. */
  showInterstitial(): Promise<boolean>;
  /** Resolves true only if the player earned the reward. */
  showRewarded(): Promise<boolean>;
  privacyOptionsRequired(): Promise<boolean>;
  showPrivacyOptions(): Promise<void>;
}

// ---- AdMob ----------------------------------------------------------------

type GMA = typeof import('react-native-google-mobile-ads');
type Interstitial = import('react-native-google-mobile-ads').InterstitialAd;
type Rewarded = import('react-native-google-mobile-ads').RewardedAd;

function admob(g: GMA): AdService {
  let ready: Promise<void> | null = null;
  let canRequest = true;
  let nonPersonalized = true;
  let interstitial: Interstitial | null = null;
  let interstitialLoaded = false;
  let rewarded: Rewarded | null = null;
  let rewardedLoaded = false;
  let onRewardedLoaded: (() => void) | null = null;

  const unit = (kind: 'interstitial' | 'rewarded') =>
    adUnit(kind) ?? (kind === 'interstitial' ? g.TestIds.INTERSTITIAL : g.TestIds.REWARDED);

  const loadInterstitial = () => {
    interstitialLoaded = false;
    interstitial = g.InterstitialAd.createForAdRequest(unit('interstitial'), {
      requestNonPersonalizedAdsOnly: nonPersonalized,
    });
    interstitial.addAdEventListener(g.AdEventType.LOADED, () => (interstitialLoaded = true));
    interstitial.addAdEventListener(g.AdEventType.ERROR, () => setTimeout(loadInterstitial, 60_000));
    interstitial.load();
  };

  const loadRewarded = () => {
    rewardedLoaded = false;
    rewarded = g.RewardedAd.createForAdRequest(unit('rewarded'), {
      requestNonPersonalizedAdsOnly: nonPersonalized,
    });
    rewarded.addAdEventListener(g.RewardedAdEventType.LOADED, () => {
      rewardedLoaded = true;
      onRewardedLoaded?.();
    });
    rewarded.addAdEventListener(g.AdEventType.ERROR, () => setTimeout(loadRewarded, 30_000));
    rewarded.load();
  };

  return {
    mode: 'admob',
    prepare() {
      ready ??= (async () => {
        try {
          const info = await g.AdsConsent.gatherConsent();
          canRequest = info.canRequestAds;
        } catch {
          canRequest = true; // no consent form needed/available (e.g. outside the EEA)
        }
        if (Platform.OS === 'ios') {
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded lazily: absent in Expo Go
            const { requestTrackingPermissionsAsync } = require('expo-tracking-transparency');
            const { status } = await requestTrackingPermissionsAsync();
            nonPersonalized = status !== 'granted';
          } catch {
            nonPersonalized = true;
          }
        } else {
          nonPersonalized = false;
        }
        if (!canRequest) return;
        // A cozy game for all ages: only general-audience ads.
        await g.default().setRequestConfiguration({ maxAdContentRating: g.MaxAdContentRating.G });
        await g.default().initialize();
        loadInterstitial();
        loadRewarded();
      })();
      return ready;
    },
    async showInterstitial() {
      await this.prepare();
      const ad = interstitial;
      if (!canRequest || !ad || !interstitialLoaded) return false;
      return new Promise<boolean>((resolve) => {
        const off = ad.addAdEventListener(g.AdEventType.CLOSED, () => {
          off();
          resolve(true);
          loadInterstitial();
        });
        ad.show().catch(() => {
          off();
          resolve(false);
        });
      });
    },
    async showRewarded() {
      await this.prepare();
      if (!canRequest) return false;
      if (!rewardedLoaded) {
        // Give a just-requested ad a moment to arrive.
        await new Promise<void>((resolve) => {
          const t = setTimeout(resolve, 8000);
          onRewardedLoaded = () => {
            clearTimeout(t);
            resolve();
          };
        });
        onRewardedLoaded = null;
      }
      const ad = rewarded;
      if (!ad || !rewardedLoaded) return false;
      return new Promise<boolean>((resolve) => {
        let earned = false;
        const offEarn = ad.addAdEventListener(g.RewardedAdEventType.EARNED_REWARD, () => (earned = true));
        const offClose = ad.addAdEventListener(g.AdEventType.CLOSED, () => {
          offEarn();
          offClose();
          resolve(earned);
          loadRewarded();
        });
        ad.show().catch(() => {
          offEarn();
          offClose();
          resolve(false);
        });
      });
    },
    async privacyOptionsRequired() {
      try {
        const info = await g.AdsConsent.getConsentInfo();
        return info.privacyOptionsRequirementStatus === g.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
      } catch {
        return false;
      }
    },
    async showPrivacyOptions() {
      try {
        await g.AdsConsent.showPrivacyOptionsForm();
      } catch {
        // form unavailable — nothing to show
      }
    },
  };
}

// ---- Mock -----------------------------------------------------------------

export type MockAdKind = 'interstitial' | 'rewarded';

/** Drives <MockAdOverlay/>: a stand-in "ad" so the flows can be tried anywhere. */
export const useMockAd = create<{
  kind: MockAdKind | null;
  finish: ((earned: boolean) => void) | null;
  open(kind: MockAdKind): Promise<boolean>;
}>((set) => ({
  kind: null,
  finish: null,
  open(kind) {
    return new Promise<boolean>((resolve) => {
      set({
        kind,
        finish: (earned) => {
          set({ kind: null, finish: null });
          resolve(earned);
        },
      });
    });
  },
}));

function mock(): AdService {
  return {
    mode: 'mock',
    async prepare() {},
    showInterstitial: () => useMockAd.getState().open('interstitial'),
    showRewarded: () => useMockAd.getState().open('rewarded'),
    async privacyOptionsRequired() {
      return false;
    },
    async showPrivacyOptions() {},
  };
}

export function createAdService(): AdService {
  if (isExpoGo) return mock();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded lazily: absent in Expo Go
    return admob(require('react-native-google-mobile-ads'));
  } catch {
    return mock();
  }
}
