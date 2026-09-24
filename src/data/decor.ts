// Room decor (names live in src/i18n). Each slot holds one item; the first item of every slot is owned
// from the start. `stars` = total stars needed before it can be bought,
// `price` = buttons it costs. All art is drawn in src/art/room/.

export type DecorSlot = 'wall' | 'curtain' | 'lamp' | 'plant' | 'rug';

export interface DecorItem {
  id: string;
  slot: DecorSlot;
  stars: number;
  price: number;
}

export const DECOR_SLOTS: DecorSlot[] = ['wall', 'curtain', 'lamp', 'plant', 'rug'];

export const DECOR: DecorItem[] = [
  { id: 'wall_timetable', slot: 'wall', stars: 0, price: 0 },
  { id: 'wall_rainbow', slot: 'wall', stars: 8, price: 40 },
  { id: 'wall_cat', slot: 'wall', stars: 36, price: 130 },

  { id: 'curtain_mint', slot: 'curtain', stars: 0, price: 0 },
  { id: 'curtain_lavender', slot: 'curtain', stars: 4, price: 30 },
  { id: 'curtain_butter', slot: 'curtain', stars: 28, price: 100 },

  { id: 'lamp_basic', slot: 'lamp', stars: 0, price: 0 },
  { id: 'lamp_mushroom', slot: 'lamp', stars: 20, price: 80 },
  { id: 'lamp_moon', slot: 'lamp', stars: 72, price: 250 },

  { id: 'plant_none', slot: 'plant', stars: 0, price: 0 },
  { id: 'plant_cactus', slot: 'plant', stars: 3, price: 20 },
  { id: 'plant_monstera', slot: 'plant', stars: 46, price: 160 },

  { id: 'rug_round', slot: 'rug', stars: 0, price: 0 },
  { id: 'rug_rainbow', slot: 'rug', stars: 14, price: 60 },
  { id: 'rug_cloud', slot: 'rug', stars: 58, price: 200 },
];

export const DEFAULT_ROOM: Record<DecorSlot, string> = {
  wall: 'wall_timetable',
  curtain: 'curtain_mint',
  lamp: 'lamp_basic',
  plant: 'plant_none',
  rug: 'rug_round',
};

export function decorById(id: string): DecorItem | undefined {
  return DECOR.find((d) => d.id === id);
}

/** Decor that becomes buyable when total stars go from `before` to `after`. */
export function newlyUnlocked(before: number, after: number): DecorItem[] {
  return DECOR.filter((d) => d.stars > 0 && d.stars > before && d.stars <= after);
}
