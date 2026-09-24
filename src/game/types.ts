// Core game types. Pure data — no React, no rendering.

export type Rotation = 0 | 90 | 180 | 270;
export const ROTATIONS: readonly Rotation[] = [0, 90, 180, 270];

/** Grid cell. x = column (left → right), y = row (top → bottom). */
export interface Cell {
  x: number;
  y: number;
}

export type Subject =
  'math' | 'turkish' | 'science' | 'life' | 'social' | 'history' | 'english' | 'art' | 'music' | 'pe';

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type CompartmentKind = 'main' | 'front' | 'side';

/** An item as defined in the catalog (items.json). */
export interface ItemDef {
  id: string;
  /** Rows of 'X' (filled) and '.' (empty), top row first. */
  shape: string[];
  /** Soft items can be folded into these alternative shapes. */
  altShapes?: string[][];
  /** Which art component draws this item. */
  sprite: string;
  /** Base color token for the prototype renderer. */
  color: string;
  subject?: Subject;
  tags?: string[];
  /** Rotations the item may rest in when the bag is zipped. Defaults to all. */
  allowedRotations?: Rotation[];
  /** Nothing may be placed in the cells directly above a fragile item. */
  fragile?: boolean;
  /** If set, the item only belongs in a compartment of this kind. */
  pocket?: Exclude<CompartmentKind, 'main'> | null;
}

export interface CompartmentDef {
  id: string;
  kind: CompartmentKind;
  cols: number;
  rows: number;
  /** Cells that are not usable (seams, straps). [x, y] pairs. */
  blocked?: [number, number][];
}

/** Short coaching line shown on the desk for levels that introduce something. */
export const TIP_KEYS = [
  'drag',
  'hint',
  'rotate',
  'distractor',
  'flute',
  'upright',
  'bottle',
  'art',
  'tight',
  'finale',
  'clothes',
  'pocket',
  'surprise',
  'fragile',
  'homework',
  'shapes',
  'full',
  'cat',
  'library',
  'kit',
  'poster',
] as const;
export type TipKey = (typeof TIP_KEYS)[number];

export type ItemRole = 'required' | 'distractor';

export interface LevelItemRef {
  ref: string;
  role: ItemRole;
  /** Surprise: the item drops onto the desk once this many items are packed. */
  appearsAfter?: number;
}

export interface LevelDef {
  id: string;
  week: number;
  day: Weekday;
  schedule: Subject[];
  bag: {
    type: 'backpack' | 'briefcase' | 'college' | 'suitcase';
    compartments: CompartmentDef[];
  };
  items: LevelItemRef[];
  tip?: TipKey;
  /** The desk cat visits this level. */
  cat?: boolean;
  par?: { hints: number };
}

/** One concrete item on the desk / in the bag during play. */
export interface ItemInstance {
  /** Unique within a level, e.g. "book_math#0". */
  uid: string;
  def: ItemDef;
  role: ItemRole;
  /** Hidden on the desk until revealed (see LevelItemRef.appearsAfter). */
  appearsAfter?: number;
}

/** Where and how an instance sits in the bag. */
export interface Placement {
  compartmentId: string;
  x: number;
  y: number;
  rotation: Rotation;
  /** 0 = def.shape, 1.. = def.altShapes[i - 1]. */
  shapeIndex: number;
}

/** How an instance is currently oriented, whether on the desk or in the bag. */
export interface Orientation {
  rotation: Rotation;
  shapeIndex: number;
}

export type Catalog = Record<string, ItemDef>;
