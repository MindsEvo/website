import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createGameFromFen, makeMove, undoMove, redoMove } from '../chinese-chess/core.mjs';
import { formatLastMoveNotation } from '../chinese-chess/shared/move-notation.mjs';

test('formats both sides using their own file numbers and supports undo and redo', () => {
  const game = createGame();
  assert.equal(formatLastMoveNotation(game), '');
  assert.ok(makeMove(game, { row: 7, col: 7 }, { row: 7, col: 4 }));
  assert.equal(formatLastMoveNotation(game), '炮二平五');
  assert.ok(makeMove(game, { row: 0, col: 7 }, { row: 2, col: 6 }));
  assert.equal(formatLastMoveNotation(game), '马八进七');
  assert.ok(undoMove(game));
  assert.equal(formatLastMoveNotation(game), '炮二平五');
  assert.ok(redoMove(game));
  assert.equal(formatLastMoveNotation(game), '马八进七');
});

test('identifies same-file pieces from the moving side before a capture', () => {
  const red = createGameFromFen('5k3/9/9/9/4p4/9/4R4/9/4R4/3K5 w - - 0 1');
  assert.ok(makeMove(red, { row: 6, col: 4 }, { row: 4, col: 4 }));
  assert.equal(formatLastMoveNotation(red), '前车进二');
  const black = createGameFromFen('5k3/4r4/9/4r4/9/9/4P4/9/9/3K5 b - - 0 1');
  assert.ok(makeMove(black, { row: 3, col: 4 }, { row: 6, col: 4 }));
  assert.equal(formatLastMoveNotation(black), '前车进三');
});

test('distinguishes multiple aligned pawn files and three same-file pieces', () => {
  const multiple = createGameFromFen('5k3/9/9/9/9/1P2P4/1P2P4/9/9/3K5 w - - 0 1');
  assert.ok(makeMove(multiple, { row: 5, col: 4 }, { row: 4, col: 4 }));
  assert.equal(formatLastMoveNotation(multiple), '五路前兵进一');
  const three = createGameFromFen('5k3/9/4P4/4P4/4P4/9/9/9/9/3K5 w - - 0 1');
  assert.ok(makeMove(three, { row: 3, col: 4 }, { row: 3, col: 3 }));
  assert.equal(formatLastMoveNotation(three), '中兵平六');
});
