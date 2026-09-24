import type { ThemeId } from '@/data/themes';

import { isExpoGo, revenueCatKey } from './config';
import { ENTITLEMENTS, PRODUCTS, productById, type ProductId } from './products';

export interface StoreProduct {
  id: ProductId;
  /** Localized, ready to show ("₺49,99", "$3.99"). */
  price: string;
}

export interface Entitlements {
  vip: boolean;
  noAds: boolean;
  /** Theme packs owned (non-consumables, restorable). */
  themes: ThemeId[];
}

export type PurchaseOutcome = 'ok' | 'cancelled' | 'pending' | 'failed';

export interface PurchaseResult {
  outcome: PurchaseOutcome;
  entitlements?: Entitlements;
}

export interface PurchaseService {
  readonly mode: 'revenuecat' | 'mock';
  init(onChange: (e: Entitlements) => void): Promise<Entitlements | null>;
  products(): Promise<StoreProduct[]>;
  purchase(id: ProductId): Promise<PurchaseResult>;
  restore(): Promise<Entitlements | null>;
}

// ---- RevenueCat -----------------------------------------------------------

type RC = typeof import('react-native-purchases').default;
type RCCustomerInfo = import('react-native-purchases').CustomerInfo;
type RCProduct = import('react-native-purchases').PurchasesStoreProduct;

function toEntitlements(info: RCCustomerInfo): Entitlements {
  const active = info.entitlements.active;
  const vip = !!active[ENTITLEMENTS.vip];
  const themes = (Object.entries(ENTITLEMENTS.themes) as [ThemeId, string][])
    .filter(([, key]) => !!active[key])
    .map(([id]) => id);
  return { vip, noAds: vip || !!active[ENTITLEMENTS.noAds], themes };
}

function revenueCat(Purchases: RC, apiKey: string): PurchaseService {
  const cache = new Map<ProductId, RCProduct>();
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded lazily: absent in Expo Go
  const { PRODUCT_CATEGORY, PURCHASES_ERROR_CODE } = require('react-native-purchases');

  const load = async () => {
    const one = PRODUCTS.filter((p) => p.kind !== 'subscription').map((p) => p.id);
    const subs = PRODUCTS.filter((p) => p.kind === 'subscription').map((p) => p.id);
    const [a, b] = await Promise.all([
      Purchases.getProducts(one, PRODUCT_CATEGORY.NON_SUBSCRIPTION),
      Purchases.getProducts(subs, PRODUCT_CATEGORY.SUBSCRIPTION),
    ]);
    for (const p of [...a, ...b]) cache.set(p.identifier as ProductId, p);
  };

  return {
    mode: 'revenuecat',
    async init(onChange) {
      Purchases.configure({ apiKey });
      Purchases.addCustomerInfoUpdateListener((info) => onChange(toEntitlements(info)));
      return toEntitlements(await Purchases.getCustomerInfo());
    },
    async products() {
      if (!cache.size) await load();
      return [...cache.values()].map((p) => ({ id: p.identifier as ProductId, price: p.priceString }));
    },
    async purchase(id) {
      try {
        if (!cache.has(id)) await load();
        const product = cache.get(id);
        if (!product) return { outcome: 'failed' };
        const { customerInfo } = await Purchases.purchaseStoreProduct(product);
        return { outcome: 'ok', entitlements: toEntitlements(customerInfo) };
      } catch (e) {
        const err = e as { userCancelled?: boolean; code?: string };
        if (err.userCancelled || err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          return { outcome: 'cancelled' };
        }
        if (err.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return { outcome: 'pending' };
        return { outcome: 'failed' };
      }
    },
    async restore() {
      try {
        return toEntitlements(await Purchases.restorePurchases());
      } catch {
        return null;
      }
    },
  };
}

// ---- Mock (Expo Go, no keys) ---------------------------------------------

function mock(): PurchaseService {
  let current: Entitlements = { vip: false, noAds: false, themes: [] };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  return {
    mode: 'mock',
    async init() {
      return null; // keep whatever the shop store remembered
    },
    async products() {
      return PRODUCTS.map((p) => ({ id: p.id, price: p.fallbackPrice }));
    },
    async purchase(id) {
      await wait(500);
      const def = productById(id);
      current = {
        vip: current.vip || def.kind === 'subscription',
        noAds: current.noAds || def.kind === 'subscription' || !!def.grant.noAds,
        themes: [...new Set([...current.themes, ...(def.grant.themes ?? [])])],
      };
      return { outcome: 'ok', entitlements: current };
    },
    async restore() {
      await wait(400);
      return null;
    },
  };
}

export function createPurchaseService(): PurchaseService {
  const key = revenueCatKey();
  if (!key || isExpoGo) return mock();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded lazily: absent in Expo Go
    const Purchases: RC = require('react-native-purchases').default;
    return revenueCat(Purchases, key);
  } catch {
    return mock();
  }
}
