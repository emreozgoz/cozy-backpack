import type { ProductId } from '@/features/monetization/products';

// Cosmetic themes: each is a bag pattern plus two room decor pieces.
// Two are sold as packs, two come with VIP. Art: src/art/bagSkins.tsx and
// src/art/room/RoomScene.tsx; names live in src/i18n.

export type ThemeId = 'autumn' | 'sweets' | 'starry' | 'garden';

export type ThemeAccess = { kind: 'pack'; products: ProductId[] } | { kind: 'vip' };

export interface Theme {
  id: ThemeId;
  access: ThemeAccess;
  bagSkin: BagSkinId;
  decor: string[];
}

export const THEMES: Theme[] = [
  {
    id: 'autumn',
    access: { kind: 'pack', products: ['cb.theme.autumn', 'cb.theme.bundle'] },
    bagSkin: 'autumn',
    decor: ['curtain_autumn', 'rug_leaf'],
  },
  {
    id: 'sweets',
    access: { kind: 'pack', products: ['cb.theme.sweets', 'cb.theme.bundle'] },
    bagSkin: 'candy',
    decor: ['wall_cupcake', 'lamp_candy'],
  },
  { id: 'starry', access: { kind: 'vip' }, bagSkin: 'starry', decor: ['wall_constellation', 'rug_moon'] },
  { id: 'garden', access: { kind: 'vip' }, bagSkin: 'garden', decor: ['curtain_floral', 'plant_flowers'] },
];

export type BagPattern = 'none' | 'dots' | 'stars' | 'leaves' | 'sprinkles' | 'flowers';

export type BagSkinId = 'peach' | 'sky' | 'autumn' | 'candy' | 'starry' | 'garden';

export interface BagSkin {
  id: BagSkinId;
  body: { light: string; dark: string };
  inside: { light: string; dark: string };
  pattern: BagPattern;
  patternColors: string[];
  /** Earnable skins: stars needed and button price. Theme skins: see THEMES. */
  stars?: number;
  price?: number;
  theme?: ThemeId;
}

export const BAG_SKINS: BagSkin[] = [
  {
    id: 'peach',
    body: { light: '#F4B8A4', dark: '#B97F72' },
    inside: { light: '#FBE3D6', dark: '#4A3B4C' },
    pattern: 'none',
    patternColors: [],
    stars: 0,
    price: 0,
  },
  {
    id: 'sky',
    body: { light: '#A8D8F0', dark: '#6F9DB5' },
    inside: { light: '#E6F4FB', dark: '#3A4656' },
    pattern: 'dots',
    patternColors: ['#FFFFFF'],
    stars: 30,
    price: 120,
  },
  {
    id: 'autumn',
    body: { light: '#E8A87C', dark: '#A8704F' },
    inside: { light: '#FBE8D6', dark: '#4C3B36' },
    pattern: 'leaves',
    patternColors: ['#F6C177', '#C97B4F'],
    theme: 'autumn',
  },
  {
    id: 'candy',
    body: { light: '#F7B6C8', dark: '#B97C8E' },
    inside: { light: '#FDEAF0', dark: '#4C3A45' },
    pattern: 'sprinkles',
    patternColors: ['#FFFFFF', '#A8D8F0', '#FFE29A', '#BDE7C9'],
    theme: 'sweets',
  },
  {
    id: 'starry',
    body: { light: '#4B5A8C', dark: '#39446B' },
    inside: { light: '#E3E6F5', dark: '#2E3348' },
    pattern: 'stars',
    patternColors: ['#FFE29A', '#FFFFFF'],
    theme: 'starry',
  },
  {
    id: 'garden',
    body: { light: '#9ED5B0', dark: '#6FA283' },
    inside: { light: '#EAF7EE', dark: '#34463B' },
    pattern: 'flowers',
    patternColors: ['#FFFFFF', '#F7B6C8', '#FFE29A'],
    theme: 'garden',
  },
];

export function themeById(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id)!;
}

export function skinById(id: string): BagSkin {
  return BAG_SKINS.find((s) => s.id === id) ?? BAG_SKINS[0];
}

/** Which theme (if any) a decor item belongs to. */
export function themeOfDecor(decorId: string): Theme | undefined {
  return THEMES.find((t) => t.decor.includes(decorId));
}
