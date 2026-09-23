import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { dayKey, daysBetween } from '@/game/economy';
import {
  initialCounters,
  rewardedLeftToday,
  shouldShowInterstitial,
  type AdCounters,
} from '@/features/monetization/adPolicy';
import { createAdService, type AdService } from '@/features/monetization/ads';
import {
  PRODUCTS,
  STARTER_OFFER_DAYS,
  VIP_DAILY_HINTS,
  productById,
  type ProductId,
} from '@/features/monetization/products';
import {
  createPurchaseService,
  type Entitlements,
  type PurchaseOutcome,
  type PurchaseService,
} from '@/features/monetization/purchases';

import { kvStorage } from './storage';
import { usePlayerStore } from './usePlayerStore';

let purchases: PurchaseService | null = null;
let ads: AdService | null = null;
const services = () => {
  purchases ??= createPurchaseService();
  ads ??= createAdService();
  return { purchases, ads };
};

interface ShopState {
  entitlements: Entitlements;
  /** Non-consumables whose one-time bonus (hints, buttons) was already given. */
  granted: ProductId[];
  counters: AdCounters;
  /** Day VIP daily hints were last given. */
  vipHintsDay: string | null;

  // runtime only (not saved)
  mode: 'store' | 'mock';
  prices: Partial<Record<ProductId, string>>;
  busy: ProductId | 'restore' | null;

  init(today?: string): Promise<void>;
  buy(id: ProductId): Promise<PurchaseOutcome>;
  restore(): Promise<boolean>;
  noteLevelCleared(isDaily: boolean): void;
  /** Shows an interstitial if the gentle ad policy allows it right now. */
  maybeShowInterstitial(isDaily: boolean): Promise<void>;
  /** Player-initiated rewarded ad; resolves true when the reward was earned. */
  watchRewarded(): Promise<boolean>;
  claimVipHints(today: string): number;
}

export function isAdFree(e: Entitlements): boolean {
  return e.noAds || e.vip;
}

export function rewardedAvailable(s: Pick<ShopState, 'counters'>, today = dayKey()): boolean {
  return rewardedLeftToday(s.counters, today) > 0;
}

/** The starter pack is offered for the first few days, once. */
export function starterOffered(
  s: Pick<ShopState, 'counters' | 'granted' | 'entitlements'>,
  today = dayKey(),
) {
  const first = s.counters.firstOpenDay;
  return (
    !s.granted.includes('cb.starter') &&
    !isAdFree(s.entitlements) &&
    first !== null &&
    daysBetween(first, today) < STARTER_OFFER_DAYS
  );
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => {
      const grant = (id: ProductId) => {
        const def = productById(id);
        const oneTime = def.kind === 'nonConsumable';
        if (oneTime && get().granted.includes(id)) return;
        const player = usePlayerStore.getState();
        if (def.grant.hints) player.addHints(def.grant.hints);
        if (def.grant.buttons) player.addButtons(def.grant.buttons);
        if (oneTime) set({ granted: [...get().granted, id] });
      };

      // Ad-free is permanent only through a one-time product (remove ads, starter
      // pack). VIP's ad-free follows the subscription and ends with it.
      const ownsNoAdsProduct = () => get().granted.some((id) => productById(id).grant.noAds);
      const mergeEntitlements = (e: Entitlements) =>
        set({ entitlements: { vip: e.vip, noAds: e.noAds || ownsNoAdsProduct() } });

      return {
        entitlements: { vip: false, noAds: false },
        granted: [],
        counters: initialCounters,
        vipHintsDay: null,
        mode: 'mock',
        prices: {},
        busy: null,

        async init(today = dayKey()) {
          const { purchases: p, ads: a } = services();
          const { counters } = get();
          if (!counters.firstOpenDay) set({ counters: { ...counters, firstOpenDay: today } });
          set({
            mode: p.mode === 'revenuecat' ? 'store' : 'mock',
            prices: Object.fromEntries(PRODUCTS.map((x) => [x.id, x.fallbackPrice])),
          });
          try {
            const e = await p.init(mergeEntitlements);
            if (e) mergeEntitlements(e);
            const list = await p.products();
            set({ prices: { ...get().prices, ...Object.fromEntries(list.map((x) => [x.id, x.price])) } });
          } catch {
            // Store unreachable: keep remembered entitlements and fallback prices.
          }
          // Returning players: get consent/ads ready early. On the first day we
          // don't ask for anything unless they choose a rewarded ad.
          if (get().counters.firstOpenDay !== today && !isAdFree(get().entitlements)) {
            a.prepare().catch(() => {});
          }
        },

        async buy(id) {
          if (get().busy) return 'failed';
          set({ busy: id });
          try {
            const result = await services().purchases.purchase(id);
            if (result.outcome === 'ok') {
              grant(id);
              if (result.entitlements) mergeEntitlements(result.entitlements);
              if (productById(id).grant.noAds) set({ entitlements: { ...get().entitlements, noAds: true } });
            }
            return result.outcome;
          } finally {
            set({ busy: null });
          }
        },

        async restore() {
          if (get().busy) return false;
          set({ busy: 'restore' });
          try {
            const e = await services().purchases.restore();
            if (e) mergeEntitlements(e);
            return !!e && (e.vip || e.noAds);
          } finally {
            set({ busy: null });
          }
        },

        noteLevelCleared(isDaily) {
          if (isDaily) return;
          const c = get().counters;
          set({ counters: { ...c, levelsCleared: c.levelsCleared + 1, levelsSinceAd: c.levelsSinceAd + 1 } });
        },

        async maybeShowInterstitial(isDaily) {
          const { counters, entitlements } = get();
          const ctx = { now: Date.now(), today: dayKey(), adFree: isAdFree(entitlements), isDaily };
          if (!shouldShowInterstitial(counters, ctx)) return;
          const shown = await services().ads.showInterstitial();
          if (shown) {
            set({ counters: { ...get().counters, levelsSinceAd: 0, lastInterstitialAt: Date.now() } });
          }
        },

        async watchRewarded() {
          const today = dayKey();
          if (!rewardedAvailable(get(), today)) return false;
          const earned = await services().ads.showRewarded();
          if (earned) {
            const c = get().counters;
            set({
              counters: {
                ...c,
                lastRewardedAt: Date.now(),
                rewardedDay: today,
                rewardedToday: (c.rewardedDay === today ? c.rewardedToday : 0) + 1,
              },
            });
          }
          return earned;
        },

        claimVipHints(today) {
          const { entitlements, vipHintsDay } = get();
          if (!entitlements.vip || vipHintsDay === today) return 0;
          usePlayerStore.getState().addHints(VIP_DAILY_HINTS);
          set({ vipHintsDay: today });
          return VIP_DAILY_HINTS;
        },
      };
    },
    {
      name: 'cozy-backpack/shop',
      version: 1,
      storage: createJSONStorage(() => kvStorage),
      partialize: (s) => ({
        entitlements: s.entitlements,
        granted: s.granted,
        counters: s.counters,
        vipHintsDay: s.vipHintsDay,
      }),
    },
  ),
);

/** Settings → "Privacy options" (required in the EEA once consent was asked). */
export const privacy = {
  required: () => services().ads.privacyOptionsRequired(),
  show: () => services().ads.showPrivacyOptions(),
};
