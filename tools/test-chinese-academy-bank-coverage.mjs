import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectAttackingPuzzles, ATTACKING_ROOTS } from '../chinese-chess/academy/attacking/attacking-catalog.mjs';
import { selectOpeningPuzzles, OPENING_ROOTS } from '../chinese-chess/academy/opening/opening-catalog.mjs';
import { TACTICS_CATEGORIES } from '../chinese-chess/academy/tactics/tactics-catalog.mjs';

const manifest = JSON.parse(await readFile(new URL('../chinese-chess/bank/manifest.json', import.meta.url), 'utf8'));

const attackingSource = manifest.categories.filter(category => category.family === 'attacking')
  .flatMap(category => category.items);
const attackingLessons = new Set(ATTACKING_ROOTS.flatMap(root =>
  selectAttackingPuzzles(manifest, root.name).map(puzzle => puzzle.id)));
assert.equal(attackingLessons.size, attackingSource.length, 'all source attack puzzles appear in lessons');

const tacticsSource = manifest.categories.filter(category => category.family === 'tactics')
  .flatMap(category => category.items);
const tacticsCategories = new Set(Object.values(TACTICS_CATEGORIES).flat().map(name => `tactics/${name}`));
const tacticsLessons = new Set(manifest.categories
  .filter(category => tacticsCategories.has(category.key))
  .flatMap(category => category.items.map(puzzle => puzzle.id)));
assert.equal(tacticsLessons.size, tacticsSource.length, 'all source tactics puzzles appear in lessons');

const openingSource = manifest.categories.filter(category => category.family === 'opening')
  .flatMap(category => category.items);
const openingLessons = new Set(OPENING_ROOTS.flatMap(root =>
  selectOpeningPuzzles(manifest, root.name).map(puzzle => puzzle.id)));
assert.equal(openingLessons.size, openingSource.length, 'all source opening puzzles appear in lessons');

console.log(`Validated lesson coverage: ${attackingLessons.size} attack, ${tacticsLessons.size} tactics, ${openingLessons.size} opening positions.`);
