import items from '@/assets/data/items.json';
import type { Catalog, ItemDef } from '@/game/types';

export const catalog: Catalog = Object.fromEntries(
  Object.entries(items).map(([id, def]) => [id, { id, ...def } as ItemDef]),
);
