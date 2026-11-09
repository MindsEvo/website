import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGameFromFen } from '../chinese-chess/core.mjs';
import { buildNotationPlayback, notationContent } from '../chinese-chess/shared/notation-playback.mjs';
import { TACTICS_GROUPS, TACTICS_CATEGORIES } from '../chinese-chess/academy/tactics/tactics-catalog.mjs';

const bank = new URL('../chinese-chess/bank/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', bank), 'utf8'));
assert.equal(Object.keys(TACTICS_GROUPS).length, 7);
const tactics = Object.values(TACTICS_GROUPS).flat();
assert.equal(tactics.length, 24);
assert.equal(new Set(tactics).size, 24);
for (const tactic of Object.keys(TACTICS_CATEGORIES)) assert.ok(tactics.includes(tactic));
const names = Object.values(TACTICS_CATEGORIES).flat();
assert.equal(names.length, 13);
assert.equal(new Set(names).size, 13);
let count = 0;
let placeholders = 0;
for (const name of names) {
  const category = manifest.categories.find(category => category.key === `tactics/${name}`);
  assert.ok(category?.items.length, `${name} has indexed puzzles`);
  for (const puzzle of category.items) {
    const fen = await readFile(new URL(puzzle.fen, bank), 'utf8');
    assert.equal(createGameFromFen(fen).board.length, 10);
    const numbered = puzzle.solutions.filter(file => file.includes(`${puzzle.id}-`));
    for (const file of numbered.length ? numbered : puzzle.solutions) {
      const text = await readFile(new URL(file, bank), 'utf8');
      if (notationContent(text)) buildNotationPlayback(fen, text);
      else placeholders += 1;
    }
    for (const file of puzzle.explanations) await readFile(new URL(file, bank), 'utf8');
    count += 1;
  }
}
assert.equal(count, 43);
assert.equal(notationContent('// 1. 车一平二 将5退1\n# END'), '');
console.log(`Validated 7 groups, 24 tactics, 13 source categories, ${count} positions and ${placeholders} explicitly unfilled solution files.`);
