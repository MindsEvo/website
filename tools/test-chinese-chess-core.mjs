import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLACK,
  RED,
  createEmptyBoard,
  createGame,
  createGameFromFen,
  getGameStatus,
  getLegalMoves,
  isInCheck,
  makeMove,
  parseFen,
  redoMove,
  toFen,
  undoMove
} from '../chinese-chess/core.mjs';

function position(pieces, turn = RED) {
  const board = createEmptyBoard();
  for (const [piece, row, col] of pieces) board[row][col] = piece;
  return createGame({ board, turn });
}

function hasMove(game, from, to) {
  return getLegalMoves(game, { row: from[0], col: from[1] })
    .some(move => move.row === to[0] && move.col === to[1]);
}

test('standard position has 32 pieces and red moves first', () => {
  const game = createGame();
  assert.equal(game.board.flat().filter(Boolean).length, 32);
  assert.equal(game.turn, RED);
  assert.equal(hasMove(game, [9, 1], [7, 2]), true);
  assert.equal(hasMove(game, [9, 1], [8, 3]), false);
});

test('cannon requires exactly one screen to capture and no screen to move', () => {
  const game = position([['K', 9, 4], ['k', 0, 3], ['C', 5, 0], ['P', 5, 2], ['p', 5, 5]]);
  assert.equal(hasMove(game, [5, 0], [5, 5]), true);
  assert.equal(hasMove(game, [5, 0], [5, 4]), false);
  game.board[5][4] = null;
  assert.equal(hasMove(game, [5, 0], [5, 3]), false);
});

test('horse leg and elephant eye block movement; elephants stay on their side', () => {
  const horse = position([['K', 9, 4], ['k', 0, 3], ['H', 5, 4], ['P', 4, 4]]);
  assert.equal(hasMove(horse, [5, 4], [3, 3]), false);
  assert.equal(hasMove(horse, [5, 4], [4, 2]), true);

  const elephant = position([['K', 9, 4], ['k', 0, 3], ['E', 8, 2], ['P', 7, 3]]);
  assert.equal(hasMove(elephant, [8, 2], [6, 4]), false);
  elephant.board[7][3] = null;
  assert.equal(hasMove(elephant, [8, 2], [6, 4]), true);
  const river = position([['K', 9, 4], ['k', 0, 3], ['E', 6, 2]]);
  assert.equal(hasMove(river, [6, 2], [4, 4]), false);
});

test('advisor stays in the palace and soldiers gain sideways movement after crossing', () => {
  const game = position([['K', 9, 4], ['k', 0, 3], ['A', 9, 3], ['P', 4, 0]]);
  assert.equal(hasMove(game, [9, 3], [8, 4]), true);
  assert.equal(hasMove(game, [9, 3], [8, 2]), false);
  assert.equal(hasMove(game, [4, 0], [4, 1]), true);
  assert.equal(hasMove(game, [4, 0], [5, 0]), false);
});

test('a pinned blocker cannot move away and expose its general', () => {
  const game = position([['K', 9, 4], ['k', 0, 3], ['r', 0, 4], ['R', 8, 4]]);
  assert.equal(isInCheck(game, RED), false);
  assert.equal(hasMove(game, [8, 4], [8, 3]), false);
});

test('facing generals are check, while checkmate and stalemate both award the opponent', () => {
  const facing = position([['K', 9, 4], ['k', 0, 4]]);
  assert.equal(isInCheck(facing, RED), true);

  const checkmate = position([['K', 9, 4], ['k', 0, 3], ['r', 9, 0], ['r', 7, 4]]);
  assert.deepEqual(getGameStatus(checkmate), { type: 'checkmate', turn: RED, winner: BLACK, inCheck: true });

  const stalemate = position([['K', 9, 4], ['k', 0, 3], ['h', 7, 2], ['h', 7, 6], ['h', 6, 3]], RED);
  assert.deepEqual(getGameStatus(stalemate), { type: 'stalemate', turn: RED, winner: BLACK, inCheck: false });
});

test('FEN parses 10 ranks, normalizes source symbols, and round-trips the initial position', () => {
  const initialFen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
  const game = createGameFromFen(initialFen);
  assert.equal(game.board.flat().filter(Boolean).length, 32);
  assert.equal(toFen(game), initialFen);
  assert.equal(parseFen(initialFen.replace('rnbakabnr', 'rheakaehr')).board.length, 10);
  assert.throws(() => parseFen('9/9 w'), /10 行/);
});

test('moves capture, switch turns, undo and redo consistently', () => {
  const game = position([['K', 9, 4], ['k', 0, 3], ['R', 6, 0], ['p', 4, 0]]);
  assert.equal(makeMove(game, { row: 6, col: 0 }, { row: 4, col: 0 }), true);
  assert.equal(game.turn, BLACK);
  assert.equal(game.board[4][0], 'R');
  assert.equal(undoMove(game), true);
  assert.equal(game.turn, RED);
  assert.equal(game.board[4][0], 'p');
  assert.equal(redoMove(game), true);
  assert.equal(game.turn, BLACK);
  assert.equal(game.board[4][0], 'R');
});