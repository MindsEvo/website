import assert from 'node:assert/strict';
import { BLACK, WHITE, createEmptyBoard, createGame, playStone } from '../go/core.mjs';

const empty = createEmptyBoard(19);
const cornerChoices = [[3, 3], [3, 15], [15, 3], [15, 15], [3, 2]];
for (const [row, col] of cornerChoices) {
  const game = createGame(19);
  assert.equal(playStone(game, row, col), true, `opening point ${row},${col} should be legal`);
}

const fourCorners = createGame(19);
for (const [color, row, col] of [
  [BLACK, 3, 3], [WHITE, 15, 15], [BLACK, 15, 3], [WHITE, 3, 15]
]) {
  assert.equal(fourCorners.turn, color);
  assert.equal(playStone(fourCorners, row, col), true, `four-corner move ${row},${col} should be legal`);
}
assert.equal(fourCorners.moves.length, 4);
assert.deepEqual(fourCorners.captures, { B: 0, W: 0 });

const sideDevelopment = createGame(19);
for (const [row, col] of [[3, 3], [15, 15], [9, 3]]) {
  assert.equal(playStone(sideDevelopment, row, col), true, `side-development move ${row},${col} should be legal`);
}
assert.equal(sideDevelopment.moves.length, 3);

console.log('Go layout passed: 19-line opening points, four-corner development, and side extension.');