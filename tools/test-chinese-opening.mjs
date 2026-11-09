import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGameFromFen } from '../chinese-chess/core.mjs';
import { buildNotationPlayback, notationContent } from '../chinese-chess/shared/notation-playback.mjs';
import {
  OPENING_GROUPS, OPENING_SUBGROUPS, OPENING_ROOTS, selectOpeningPuzzles
} from '../chinese-chess/academy/opening/opening-catalog.mjs';

assert.equal(Object.keys(OPENING_GROUPS).length, 3);
const categories = Object.values(OPENING_GROUPS).flat();
assert.equal(new Set(categories).size, 12);
assert.deepEqual(categories, Object.keys(OPENING_SUBGROUPS));
const types = Object.values(OPENING_SUBGROUPS).flat();
assert.equal(new Set(types).size, 25);
assert.deepEqual(OPENING_ROOTS.map(root => root.name), types);
assert.equal(new Set(OPENING_ROOTS.map(root => root.id)).size, 25);
for (const root of OPENING_ROOTS) assert.ok(root.knowledge);
assert.throws(() => selectOpeningPuzzles({ categories: [] }, '未知'), /未知开局/);
assert.throws(() => selectOpeningPuzzles({ categories: [] }, '中炮对屏风马'), /题库缺少开局棋局/);
assert.equal(notationContent('１． 炮二平五 炮８平５\n# END'), '炮二平五 炮8平5');

const bank = new URL('../chinese-chess/bank/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', bank), 'utf8'));
const unique = new Map();
let connected = 0;
for (const type of types) {
  const puzzles = selectOpeningPuzzles(manifest, type);
  if (puzzles.length) connected += 1;
  for (const puzzle of puzzles) unique.set(puzzle.id, puzzle);
}
assert.equal(connected, 3);
assert.equal(unique.size, 2);
assert.deepEqual(selectOpeningPuzzles(manifest, '中炮对屏风马'),
  selectOpeningPuzzles(manifest, '屏风马对中炮'));
for (const puzzle of unique.values()) {
  const fen = await readFile(new URL(puzzle.fen, bank), 'utf8');
  assert.equal(createGameFromFen(fen).board.length, 10);
  const text = await readFile(new URL(puzzle.solutions[0], bank), 'utf8');
  if (puzzle.id === 'oc_zhongpao_L1-003') {
    const playback = buildNotationPlayback(fen, text);
    assert.equal(playback.moves.length, 38);
    assert.equal(playback.positions.length, 39);
    assert.deepEqual(playback.moves.slice(0, 2).map(move => move.notation), ['炮八平五', '马2进3']);
    assert.equal(playback.positions[8][2][2], 'h');
    assert.equal(playback.positions[8][2][6], 'h');
  } else {
    assert.equal(puzzle.id, 'oc_zhongpao_L1-002');
    assert.throws(() => buildNotationPlayback(fen, text), /卒7进1 无法确定唯一合法走法/);
    const opening = buildNotationPlayback(fen, text.split(/\r?\n/).slice(0, 4).join('\n'));
    assert.equal(opening.moves.length, 8);
    assert.deepEqual(opening.moves.slice(0, 2).map(move => move.notation), ['炮二平五', '炮8平5']);
    assert.deepEqual(opening.moves.slice(4, 8).map(move => move.notation),
      ['车一进一', '车9平8', '车一平六', '车8进6']);
  }
  for (const file of puzzle.explanations) await readFile(new URL(file, bank), 'utf8');
}
console.log('Validated 3 groups, 12 categories, 25 types, 2 source positions, 38 playable moves and the explicit original same-direction cannon notation error.');
