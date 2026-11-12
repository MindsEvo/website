import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGameFromFen } from '../chinese-chess/core.mjs';
import { buildNotationPlayback, notationContent } from '../chinese-chess/shared/notation-playback.mjs';
import {
  ATTACKING_GROUPS, ATTACKING_ROOTS, ATTACKING_UNITS, selectAttackingPuzzles
} from '../chinese-chess/academy/attacking/attacking-catalog.mjs';

const groups = Object.keys(ATTACKING_GROUPS);
assert.equal(groups.length, 6);
assert.deepEqual(Object.values(ATTACKING_GROUPS).map(names => names.length), [4, 6, 7, 5, 2, 1]);
const names = Object.values(ATTACKING_GROUPS).flat();
assert.equal(new Set(names).size, 25);
assert.deepEqual(ATTACKING_ROOTS.map(root => root.name), names);
assert.equal(new Set(ATTACKING_ROOTS.map(root => root.id)).size, 25);
for (const root of ATTACKING_ROOTS) assert.ok(root.knowledge);
for (const group of groups) assert.ok(ATTACKING_UNITS[group]);
assert.throws(() => selectAttackingPuzzles({ categories: [] }, '未知'), /未知杀法/);

const bank = new URL('../chinese-chess/bank/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', bank), 'utf8'));
const unique = new Map();
const pending = [];
for (const name of names) {
  const puzzles = selectAttackingPuzzles(manifest, name);
  if (!puzzles.length) pending.push(name);
  assert.equal(new Set(puzzles.map(puzzle => puzzle.id)).size, puzzles.length);
  for (const puzzle of puzzles) {
    assert.ok(puzzle.fen.startsWith('attacking/'));
    unique.set(puzzle.id, puzzle);
  }
}
assert.deepEqual(pending, ['八角马', '车马冷着', '车炮抽杀', '大胆穿心', '三进兵']);
assert.equal(unique.size, 56);
assert.ok(selectAttackingPuzzles(manifest, '空头炮').some(puzzle => puzzle.title === '空头跑'));
assert.ok(selectAttackingPuzzles(manifest, '高钓马').some(puzzle => puzzle.title === '高掉马'));
assert.ok(selectAttackingPuzzles(manifest, '重炮杀').some(puzzle => puzzle.title === '连环炮（重跑）'));

let playable = 0;
let placeholders = 0;
for (const puzzle of unique.values()) {
  const fen = await readFile(new URL(puzzle.fen, bank), 'utf8');
  assert.equal(createGameFromFen(fen).board.length, 10);
  const numbered = puzzle.solutions.filter(file => file.includes(`${puzzle.id}-`));
  for (const file of numbered.length ? numbered : puzzle.solutions) {
    const text = await readFile(new URL(file, bank), 'utf8');
    if (notationContent(text)) {
      const playback = buildNotationPlayback(fen, text);
      assert.equal(playback.positions.length, playback.moves.length + 1);
      playable += 1;
    } else {
      placeholders += 1;
    }
  }
  if (puzzle.metadata) await readFile(new URL(puzzle.metadata, bank), 'utf8');
  for (const file of puzzle.explanations) await readFile(new URL(file, bank), 'utf8');
}
assert.equal(playable, 14);
assert.equal(placeholders, 43);
console.log(`Validated ${groups.length} units, ${names.length} RootGene IDs, ${unique.size} positions, ${playable} playable solutions, ${placeholders} placeholder files and ${pending.length} pending methods.`);
