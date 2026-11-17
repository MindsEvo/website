import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createGameFromFen } from '../chinese-chess/core.mjs';
import { buildNotationPlayback, notationContent } from '../chinese-chess/shared/notation-playback.mjs';
import {
  OPENING_GROUPS, OPENING_SUBGROUPS, OPENING_ROOTS, selectOpeningPuzzles
} from '../chinese-chess/academy/opening/opening-catalog.mjs';

assert.equal(Object.keys(OPENING_GROUPS).length, 3);
const categories = Object.values(OPENING_GROUPS).flat();
assert.equal(new Set(categories).size, 12);
assert.deepEqual(categories, Object.keys(OPENING_SUBGROUPS));
const types = categories.flatMap(category => OPENING_SUBGROUPS[category] || [category]);
assert.equal(new Set(types).size, 25);
assert.deepEqual(OPENING_ROOTS.map(root => root.name), types);
assert.equal(new Set(OPENING_ROOTS.map(root => root.id)).size, 25);
for (const root of OPENING_ROOTS) assert.ok(root.knowledge);
assert.deepEqual(selectOpeningPuzzles({ categories: [] }, '未知'), []);
assert.throws(() => selectOpeningPuzzles({ categories: [] }, '中炮对屏风马'), /题库缺少开局棋局/);
assert.equal(notationContent('１． 炮二平五 炮８平５\n# END'), '炮二平五 炮8平5');

const bank = new URL('../chinese-chess/bank/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', bank), 'utf8'));
const unique = new Map();
let connected = 0;
for (const type of [...types, '待定']) {
  const puzzles = selectOpeningPuzzles(manifest, type);
  if (puzzles.length) connected += 1;
  for (const puzzle of puzzles) unique.set(puzzle.id, puzzle);
}
assert.equal(connected, 3);
assert.equal(unique.size, 4);
assert.deepEqual(selectOpeningPuzzles(manifest, '中炮对屏风马').map(puzzle => puzzle.id), ['oc_待定中炮对屏风马棋局_L1-003']);
assert.deepEqual(selectOpeningPuzzles(manifest, '顺炮直车对横车').map(puzzle => puzzle.id), ['oc_弃车十三招_L1-002']);
assert.deepEqual(selectOpeningPuzzles(manifest, '待定').map(puzzle => puzzle.id),
  ['oc_待定中炮开局_L1-001', 'oc_待定中炮对屏风马棋局_L1-003', 'oc_待定棋局_L1-200']);
for (const puzzle of unique.values()) {
  assert.match(puzzle.id, /^oc_[\u4e00-\u9fffA-Za-z0-9]+_L[123]-\d{3}$/u);
  assert.match(puzzle.originalId, /^oc_zhongpao_L1-\d{3}$/);
  assert.equal(puzzle.id.match(/_L[123]-\d{3}$/)[0], puzzle.originalId.match(/_L[123]-\d{3}$/)[0]);
  const metadata = JSON.parse(await readFile(new URL(puzzle.metadata, bank), 'utf8'));
  assert.equal(metadata.geneId, puzzle.id);
  assert.equal(metadata.originalId, puzzle.originalId);
  assert.equal(metadata.displayInfo.chineseName, puzzle.title);
  assert.equal(Boolean(metadata.namingPending), Boolean(puzzle.namingPending));
  assert.equal(Boolean(metadata.classificationPending), Boolean(puzzle.classificationPending));
  if (puzzle.originalTitle) assert.equal(metadata.displayInfo.originalName, puzzle.originalTitle);
  for (const file of [puzzle.fen, puzzle.metadata, ...puzzle.solutions, ...puzzle.explanations, ...puzzle.pgn]) {
    assert.ok(file.includes(puzzle.id));
    await access(new URL(file, bank));
  }
  const fen = await readFile(new URL(puzzle.fen, bank), 'utf8');
  assert.equal(createGameFromFen(fen).board.length, 10);
  for (const file of puzzle.solutions) {
    const text = await readFile(new URL(file, bank), 'utf8');
    if (puzzle.id === 'oc_待定中炮对屏风马棋局_L1-003') {
      const playback = buildNotationPlayback(fen, text);
      assert.equal(playback.moves.length, 38);
      assert.equal(playback.positions.length, 39);
      assert.deepEqual(playback.moves.slice(0, 2).map(move => move.notation), ['炮八平五', '马2进3']);
      assert.equal(playback.positions[8][2][2], 'h');
      assert.equal(playback.positions[8][2][6], 'h');
    } else if (puzzle.id === 'oc_弃车十三招_L1-002') {
      assert.throws(() => buildNotationPlayback(fen, text), /卒7进1 无法确定唯一合法走法/);
      const opening = buildNotationPlayback(fen, text.split(/\r?\n/).slice(0, 4).join('\n'));
      assert.equal(opening.moves.length, 8);
      assert.deepEqual(opening.moves.slice(0, 2).map(move => move.notation), ['炮二平五', '炮8平5']);
      assert.deepEqual(opening.moves.slice(4, 8).map(move => move.notation),
        ['车一进一', '车9平8', '车一平六', '车8进6']);
    } else {
      assert.equal(notationContent(text), '');
    }
  }
  if (puzzle.id === 'oc_待定中炮对屏风马棋局_L1-003') {
    assert.equal(puzzle.solutions.length, 1);
  } else if (puzzle.id === 'oc_弃车十三招_L1-002') {
    assert.equal(puzzle.solutions.length, 1);
  } else if (puzzle.id === 'oc_待定棋局_L1-200') {
    assert.equal(puzzle.solutions.length, 0);
  } else {
    assert.equal(puzzle.id, 'oc_待定中炮开局_L1-001');
  }
  for (const file of puzzle.explanations) await readFile(new URL(file, bank), 'utf8');
}
console.log('Validated 12 lesson categories, 25 opening types, 4 source positions and 3 pending names.');
