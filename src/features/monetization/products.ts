// In-app products. IDs must match App Store Connect and RevenueCat exactly.
// `fallbackPrice` is only shown in mock mode (Expo Go / no store keys);
// real prices always come from the store, localized for the player.

export type ProductId =
  | 'cb.removeads'
  | 'cb.starter'
  | 'cb.hints.10'
  | 'cb.hints.30'
  | 'cb.hints.80'
  | 'cb.vip.monthly'
  | 'cb.vip.yearly';

export type ProductKind = 'consumable' | 'nonConsumable' | 'subscription';

/** RevenueCat entitlement identifiers. */
export const ENTITLEMENTS = { vip: 'vip', noAds: 'no_ads' } as const;

export interface Grant {
  hints?: number;
  buttons?: number;
  noAds?: boolean;
}

export interface ProductDef {
  id: ProductId;
  kind: ProductKind;
  /** What the purchase gives, applied once per purchase (consumables) or once ever. */
  grant: Grant;
  fallbackPrice: string;
  period?: 'month' | 'year';
  trialDays?: number;
}

export const PRODUCTS: ProductDef[] = [
  { id: 'cb.removeads', kind: 'nonConsumable', grant: { noAds: true, hints: 10 }, fallbackPrice: '$3.99' },
  {
    id: 'cb.starter',
    kind: 'nonConsumable',
    grant: { noAds: true, hints: 20, buttons: 150 },
    fallbackPrice: '$4.99',
  },
  { id: 'cb.hints.10', kind: 'consumable', grant: { hints: 10 }, fallbackPrice: '$0.99' },
  { id: 'cb.hints.30', kind: 'consumable', grant: { hints: 30 }, fallbackPrice: '$2.49' },
  { id: 'cb.hints.80', kind: 'consumable', grant: { hints: 80 }, fallbackPrice: '$4.99' },
  { id: 'cb.vip.monthly', kind: 'subscription', grant: {}, fallbackPrice: '$2.99', period: 'month' },
  {
    id: 'cb.vip.yearly',
    kind: 'subscription',
    grant: {},
    fallbackPrice: '$19.99',
    period: 'year',
    trialDays: 7,
  },
];

export const HINT_PACKS: ProductId[] = ['cb.hints.10', 'cb.hints.30', 'cb.hints.80'];
export const VIP_PLANS: ProductId[] = ['cb.vip.yearly', 'cb.vip.monthly'];

/** Hints VIP members get every day with the daily gift. */
export const VIP_DAILY_HINTS = 3;

/** How long the starter pack is offered after the first launch. */
export const STARTER_OFFER_DAYS = 3;

export function productById(id: ProductId): ProductDef {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown product ${id}`);
  return p;
}
