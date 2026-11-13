import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectAttackingPuzzles, ATTACKING_ROOTS } from '../chinese-chess/academy/attacking/attacking-catalog.mjs';
import { selectOpeningPuzzles, OPENING_ROOTS } from '../chinese-chess/academy/opening/opening-catalog.mjs';
import { TACTICS_CATEGORIES, selectTacticsPuzzles } from '../chinese-chess/academy/tactics/tactics-catalog.mjs';

const manifest = JSON.parse(await readFile(new URL('../chinese-chess/bank/manifest.json', import.meta.url), 'utf8'));

const attackingSource = manifest.categories.filter(category => category.family === 'attacking')
  .flatMap(category => category.items);
const attackingLessons = new Set(ATTACKING_ROOTS.flatMap(root =>
  selectAttackingPuzzles(manifest, root.name).map(puzzle => puzzle.id)));
assert.equal(attackingLessons.size, attackingSource.length, 'all source attack puzzles appear in lessons');

const tacticsSource = manifest.categories.filter(category => category.family === 'tactics')
  .flatMap(category => category.items);
const tacticsLessons = new Set([...Object.keys(TACTICS_CATEGORIES), '待定'].flatMap(name =>
  selectTacticsPuzzles(manifest, name).map(puzzle => puzzle.id)));
assert.equal(tacticsLessons.size, tacticsSource.length, 'all source tactics puzzles appear in lessons');

const openingSource = manifest.categories.filter(category => category.family === 'opening')
  .flatMap(category => category.items);
const openingLessons = new Set([...OPENING_ROOTS.map(root => root.name), '待定'].flatMap(name =>
  selectOpeningPuzzles(manifest, name).map(puzzle => puzzle.id)));
assert.equal(openingLessons.size, openingSource.length, 'all source opening puzzles appear in lessons');

console.log(`Validated lesson coverage: ${attackingLessons.size} attack, ${tacticsLessons.size} tactics, ${openingLessons.size} opening positions.`);
