/**
 * npm run levels
 *
 * Checks every level JSON under assets/levels/, proves each one can be
 * packed, prints a difficulty report, and regenerates src/data/levelIndex.ts
 * (Metro can't list folders at runtime, so the app imports that file).
 */
import fs from 'node:fs';
import path from 'node:path';

import { catalogSchema, levelSchema } from '../src/data/schema';
import { createInstances, usableCellCount } from '../src/game/placement';
import { orientedCells } from '../src/game/shapes';
import { solve } from '../src/game/solver';
import type { Catalog, ItemDef, LevelDef } from '../src/game/types';

const root = path.resolve(__dirname, '..');
const levelsDir = path.join(root, 'assets/levels');
const indexFile = path.join(root, 'src/data/levelIndex.ts');
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
const SOLUTION_CAP = 200;

const errors: string[] = [];
const warnings: string[] = [];

// ---- catalog --------------------------------------------------------------
const rawCatalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/items.json'), 'utf8'));
const parsedCatalog = catalogSchema.safeParse(rawCatalog);
if (!parsedCatalog.success) {
  console.error('items.json is invalid:\n' + parsedCatalog.error.message);
  process.exit(1);
}
const catalog: Catalog = Object.fromEntries(
  Object.entries(parsedCatalog.data).map(([id, def]) => [id, { id, ...def } satisfies ItemDef]),
);

// ---- levels ---------------------------------------------------------------
const files = fs
  .readdirSync(levelsDir, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replaceAll('\\', '/'))
  .sort();

interface Row {
  id: string;
  file: string;
  week: number;
  dayIndex: number;
  grid: string;
  items: string;
  slack: string;
  rotation: string;
  solutions: string;
  ms: number;
}
const rows: Row[] = [];
const seen = new Map<string, string>();

for (const file of files) {
  const where = `assets/levels/${file}`;
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(path.join(levelsDir, file), 'utf8'));
  } catch (e) {
    errors.push(`${where}: not valid JSON (${(e as Error).message})`);
    continue;
  }
  const parsed = levelSchema.safeParse(raw);
  if (!parsed.success) {
    errors.push(
      `${where}:\n  ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ')}`,
    );
    continue;
  }
  const level: LevelDef = parsed.data satisfies LevelDef;
  const err = (msg: string) => errors.push(`${where}: ${msg}`);
  const warn = (msg: string) => warnings.push(`${where}: ${msg}`);

  // naming
  if (path.basename(file, '.json') !== level.id) err(`file name should be ${level.id}.json`);
  if (seen.has(level.id)) err(`duplicate id ${level.id} (also in ${seen.get(level.id)})`);
  seen.set(level.id, where);
  const [, w, d] = /^w(\d+)-d(\d)$/.exec(level.id)!;
  if (Number(w) !== level.week) err(`id says week ${Number(w)} but "week" is ${level.week}`);
  if (DAYS[Number(d) - 1] !== level.day)
    err(`id says day ${d} (${DAYS[Number(d) - 1]}) but "day" is ${level.day}`);

  // content consistency
  const unknown = level.items.filter((i) => !catalog[i.ref]).map((i) => i.ref);
  if (unknown.length) {
    err(`unknown items: ${unknown.join(', ')}`);
    continue;
  }
  const kinds = new Set(level.bag.compartments.map((c) => c.kind));
  for (const { ref, role } of level.items) {
    const def = catalog[ref];
    if (role === 'required' && def.subject && !level.schedule.includes(def.subject)) {
      err(`${ref} is required but ${def.subject} is not on the schedule`);
    }
    if (role === 'required' && def.pocket && !kinds.has(def.pocket)) {
      err(`${ref} needs a ${def.pocket} pocket but the bag has none`);
    }
    if (role === 'distractor' && def.tags?.includes('daily')) {
      warn(`${ref} is a daily item used as a distractor — players may find that unfair`);
    }
  }
  for (const s of level.schedule) {
    if (!level.items.some((i) => i.role === 'required' && catalog[i.ref].subject === s)) {
      err(`${s} is on the schedule but no required item belongs to it`);
    }
  }
  for (const c of level.bag.compartments) {
    for (const [x, y] of c.blocked ?? []) {
      if (x < 0 || y < 0 || x >= c.cols || y >= c.rows) err(`blocked cell ${x},${y} is outside ${c.id}`);
    }
  }

  // solvability + difficulty
  const instances = createInstances(level, catalog);
  const usable = level.bag.compartments.reduce((n, c) => n + usableCellCount(c), 0);
  const needed = instances
    .filter((i) => i.role === 'required')
    .reduce((n, i) => n + orientedCells(i.def, { rotation: 0, shapeIndex: 0 }).length, 0);
  const t0 = Date.now();
  const all = solve(level, instances, { maxSolutions: SOLUTION_CAP });
  const ms = Date.now() - t0;
  if (all.solutions.length === 0) {
    err(
      all.exhaustive ? 'cannot be packed — no solution exists' : 'solver gave up before finding a solution',
    );
  }
  const flat = solve(level, instances, { allowRotation: false });
  const required = instances.filter((i) => i.role === 'required').length;
  const main = level.bag.compartments.find((c) => c.kind === 'main')!;
  const pockets = level.bag.compartments.length - 1;

  rows.push({
    id: level.id,
    file,
    week: level.week,
    dayIndex: (DAYS as readonly string[]).indexOf(level.day),
    grid: `${main.cols}×${main.rows}${pockets ? ` +${pockets}` : ''}`,
    items: `${required}+${instances.length - required}`,
    slack: `${Math.round(((usable - needed) / usable) * 100)}%`,
    rotation: flat.solutions.length ? 'optional' : 'needed',
    solutions:
      all.solutions.length >= SOLUTION_CAP
        ? `${SOLUTION_CAP}+`
        : `${all.solutions.length}${all.exhaustive ? '' : '?'}`,
    ms,
  });
}

// ---- report ---------------------------------------------------------------
rows.sort((a, b) => a.week - b.week || a.dayIndex - b.dayIndex);
const cols: (keyof Row)[] = ['id', 'grid', 'items', 'slack', 'rotation', 'solutions', 'ms'];
const width = (k: keyof Row) => Math.max(k.length, ...rows.map((r) => String(r[k]).length));
const line = (vals: string[]) => vals.map((v, i) => v.padEnd(width(cols[i]))).join('  ');
console.log(line(cols));
console.log(line(cols.map((c) => '-'.repeat(width(c)))));
rows.forEach((r) => console.log(line(cols.map((c) => String(r[c])))));
console.log(`\n${rows.length} levels · items = required+distractors · slack = empty cells when packed`);

warnings.forEach((w) => console.warn(`⚠ ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`✖ ${e}`));
  console.error(`\n${errors.length} problem(s). levelIndex.ts was not updated.`);
  process.exit(1);
}

// ---- index ----------------------------------------------------------------
const body = rows.map((r) => `  require('@/assets/levels/${r.file}'),`).join('\n');
fs.writeFileSync(
  indexFile,
  `// Generated by \`npm run levels\` — do not edit by hand.\nimport type { LevelDef } from '@/game/types';\n\nexport const levelIndex = [\n${body}\n] as LevelDef[];\n`,
);
console.log(`✔ all levels valid · wrote src/data/levelIndex.ts`);
