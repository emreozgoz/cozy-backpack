import { z } from 'zod';

import { TIP_KEYS } from '@/game/types';

// Runtime shape of the JSON content files. Kept in sync with src/game/types.ts
// (the `satisfies` checks in scripts/validate-levels.ts fail if they drift).

const subject = z.enum([
  'math',
  'turkish',
  'science',
  'life',
  'social',
  'history',
  'english',
  'art',
  'music',
  'pe',
]);
const rotation = z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]);
const shapeRows = z
  .array(z.string().regex(/^[X.]+$/, 'shape rows use only "X" and "."'))
  .min(1)
  .refine((rows) => rows.every((r) => r.length === rows[0].length), 'shape rows must be equal length')
  .refine((rows) => rows.some((r) => r.includes('X')), 'shape needs at least one X');

export const itemDefSchema = z.strictObject({
  shape: shapeRows,
  altShapes: z.array(shapeRows).optional(),
  sprite: z.string(),
  color: z.string(),
  subject: subject.optional(),
  tags: z.array(z.string()).optional(),
  allowedRotations: z.array(rotation).min(1).optional(),
  fragile: z.boolean().optional(),
  pocket: z.enum(['front', 'side']).nullable().optional(),
});

export const catalogSchema = z.record(z.string(), itemDefSchema);

const compartment = z.strictObject({
  id: z.string(),
  kind: z.enum(['main', 'front', 'side']),
  cols: z.number().int().min(1).max(10),
  rows: z.number().int().min(1).max(10),
  blocked: z.array(z.tuple([z.number().int(), z.number().int()])).optional(),
});

export const levelSchema = z.strictObject({
  id: z.string().regex(/^w\d{2}-d[1-5]$/, 'id looks like "w01-d3"'),
  week: z.number().int().min(1),
  day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri']),
  schedule: z.array(subject).min(1),
  bag: z.strictObject({
    type: z.enum(['backpack', 'briefcase', 'college', 'suitcase']),
    compartments: z
      .array(compartment)
      .min(1)
      .refine((cs) => cs.filter((c) => c.kind === 'main').length === 1, 'exactly one main compartment'),
  }),
  items: z
    .array(
      z.strictObject({
        ref: z.string(),
        role: z.enum(['required', 'distractor']),
        appearsAfter: z.number().int().min(1).optional(),
      }),
    )
    .min(1),
  tip: z.enum(TIP_KEYS).optional(),
  cat: z.boolean().optional(),
  par: z.strictObject({ hints: z.number().int().min(0) }).optional(),
});
