import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLACK,
  RED,
  agreeToDraw,
  createEmptyBoard,
  createGame,
  createGameFromFen,
  getGameStatus,
  getLegalMoves,
  isInCheck,
  isTerminalGameStatus,
  makeMove,
  parseFen,
  redoMove,
  toFen,
  undoMove
} from '../chinese-chess/core.mjs';
import { bindPlayModeSession, restorePlayModeSession } from '../chinese-chess/shared/play-mode-session.mjs';

function modeTransferHarness() {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
  let listener;
  const link = {
    href: 'http://localhost/web/chinese-chess/play/human-ai.html',
    getAttribute: () => null,
    addEventListener: (type, callback) => { listener = callback; }
  };
  const container = { querySelectorAll: () => [link] };
  return { storage, link, container, click: event => listener({ button: 0, ...event }) };
}

test('mode switching preserves the position, history, redo, puzzle and recording drafts', () => {
  const harness = modeTransferHarness();
  const game = createGame();
  const initialFen = toFen(game);
  makeMove(game, { row: 6, col: 0 }, { row: 5, col: 0 });
  makeMove(game, { row: 3, col: 0 }, { row: 4, col: 0 });
  undoMove(game);
  let paused = false;
  bindPlayModeSession(harness.container, () => ({
    game, initialFen, selectedPuzzle: { id: 'test', solutions: ['test-001.txt'] },
    recording: true, recordingStart: 0, solution: 'draft', explanation: 'note'
  }), () => { paused = true; }, harness.storage);
  harness.click();
  assert.equal(paused, true);
  assert.equal(restorePlayModeSession(harness.storage, '/other-page'), null);
  const restored = restorePlayModeSession(harness.storage, '/web/chinese-chess/play/human-ai.html');
  assert.deepEqual(restored.game, game);
  assert.equal(restored.initialFen, initialFen);
  assert.equal(restored.selectedPuzzle.base, '../bank/endgame/L1/');
  assert.equal(restored.recording, true);
  assert.equal(restored.solution, 'draft');
  assert.equal(restored.explanation, 'note');
  assert.equal(redoMove(restored.game), true);
  assert.equal(undoMove(restored.game), true);
  assert.equal(undoMove(restored.game), true);
  assert.equal(toFen(restored.game), initialFen);
  assert.equal(restorePlayModeSession(harness.storage, '/web/chinese-chess/play/human-ai.html'), null);
});

test('current-mode and modified clicks do not reload or pause the game', () => {
  const harness = modeTransferHarness();
  let paused = false;
  let prevented = false;
  bindPlayModeSession(harness.container, () => ({ game: createGame() }), () => { paused = true; }, harness.storage);
  harness.click({ ctrlKey: true });
  assert.equal(paused, false);
  harness.link.getAttribute = () => 'page';
  harness.click({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(paused, false);
});

test('blocked storage cancels switching instead of silently losing the position', () => {
  const harness = modeTransferHarness();
  let prevented = false;
  harness.storage.setItem = () => { throw new Error('blocked'); };
  bindPlayModeSession(harness.container, () => ({ game: createGame() }), () => {}, harness.storage);
  harness.click({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
});

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

test('all terminal Xiangqi outcomes are recognized consistently', () => {
  for (const type of ['checkmate', 'stalemate', 'invalid', 'draw', 'forfeit']) {
    assert.equal(isTerminalGameStatus({ type }), true, type);
  }
  for (const type of ['playing', 'check']) {
    assert.equal(isTerminalGameStatus({ type }), false, type);
  }
  assert.equal(isTerminalGameStatus(null), false);
});

test('three identical full-position cycles are drawn when both sides use allowed moves', () => {
  const game = position([['K', 9, 4], ['k', 0, 3], ['R', 8, 0], ['r', 1, 8]]);
  const cycle = [
    [[8, 0], [7, 0]], [[1, 8], [2, 8]],
    [[7, 0], [8, 0]], [[2, 8], [1, 8]]
  ];
  for (let repetition = 0; repetition < 2; repetition += 1) {
    for (const [from, to] of cycle) {
      assert.equal(makeMove(game, { row: from[0], col: from[1] }, { row: to[0], col: to[1] }), true);
    }
  }
  assert.deepEqual(getGameStatus(game), {
    type: 'draw', turn: RED, winner: null, inCheck: false, reason: 'repetition'
  });
});

test('repetition matching distinguishes pieces on different squares in the same rank', () => {
  const game = position([['K', 9, 3], ['k', 0, 3], ['a', 1, 3], ['a', 1, 4], ['R', 5, 0]]);
  const moves = [
    [[5, 0], [5, 1]], [[0, 3], [0, 4]],
    [[5, 1], [5, 2]], [[0, 4], [0, 3]],
    [[5, 2], [5, 3]], [[0, 3], [0, 4]],
    [[5, 3], [5, 4]], [[0, 4], [0, 3]]
  ];
  for (const [from, to] of moves) {
    assert.equal(makeMove(game, { row: from[0], col: from[1] }, { row: to[0], col: to[1] }), true);
  }
  assert.notEqual(getGameStatus(game).type, 'draw');
});

test('a repeated unilateral perpetual check is adjudicated as a loss', () => {
  const game = position([['K', 9, 5], ['k', 0, 3], ['R', 2, 4]]);
  const cycle = [
    [[2, 4], [2, 3]], [[0, 3], [0, 4]],
    [[2, 3], [2, 4]], [[0, 4], [0, 3]]
  ];
  for (let repetition = 0; repetition < 2; repetition += 1) {
    for (const [from, to] of cycle) {
      assert.equal(makeMove(game, { row: from[0], col: from[1] }, { row: to[0], col: to[1] }), true);
    }
  }
  assert.deepEqual(getGameStatus(game), {
    type: 'forfeit', turn: RED, loser: RED, winner: BLACK, inCheck: false, reason: 'perpetual-attack'
  });
  assert.equal(undoMove(game), true);
  assert.notEqual(getGameStatus(game).type, 'forfeit');
  assert.equal(redoMove(game), true);
  assert.equal(getGameStatus(game).type, 'forfeit');
});

test('a perpetual checker is reported as the loser even when the other side moves next', () => {
  const game = position([['K', 9, 5], ['k', 0, 3], ['R', 2, 3]], BLACK);
  const cycle = [
    [[0, 3], [0, 4]], [[2, 3], [2, 4]],
    [[0, 4], [0, 3]], [[2, 4], [2, 3]]
  ];
  for (let repetition = 0; repetition < 2; repetition += 1) {
    for (const [from, to] of cycle) {
      assert.equal(makeMove(game, { row: from[0], col: from[1] }, { row: to[0], col: to[1] }), true);
    }
  }
  assert.deepEqual(getGameStatus(game), {
    type: 'forfeit', turn: BLACK, loser: RED, winner: BLACK, inCheck: true, reason: 'perpetual-attack'
  });
});

test('a repeated chase of an unprotected piece is adjudicated as a loss', () => {
  const game = position([['K', 9, 5], ['k', 0, 3], ['R', 5, 0], ['h', 5, 3], ['r', 1, 8]]);
  const cycle = [
    [[5, 0], [5, 1]], [[1, 8], [2, 8]],
    [[5, 1], [5, 0]], [[2, 8], [1, 8]]
  ];
  for (let repetition = 0; repetition < 2; repetition += 1) {
    for (const [from, to] of cycle) {
      assert.equal(makeMove(game, { row: from[0], col: from[1] }, { row: to[0], col: to[1] }), true);
    }
  }
  assert.deepEqual(getGameStatus(game), {
    type: 'forfeit', turn: RED, loser: RED, winner: BLACK, inCheck: false, reason: 'perpetual-attack'
  });
});

test('60 consecutive rounds without a capture are automatically drawn', () => {
  const game = position([['K', 9, 4], ['k', 0, 3], ['R', 8, 0]]);
  game.history = Array.from({ length: 120 }, (_, index) => ({
    from: { row: 9, col: 4 }, to: { row: 9, col: 4 }, piece: 'K', captured: null,
    turn: index % 2 ? BLACK : RED
  }));
  assert.equal(getGameStatus(game).reason, 'natural-limit');
  game.history.pop();
  assert.notEqual(getGameStatus(game).reason, 'natural-limit');
  game.history = Array.from({ length: 120 }, (_, index) => ({
    from: { row: 9, col: 4 }, to: { row: 9, col: 4 }, piece: 'K', captured: null,
    turn: index % 2 ? BLACK : RED, check: index % 10 === 0
  }));
  assert.notEqual(getGameStatus(game).reason, 'natural-limit');
});

test('bare generals are drawn, and a capture resets the natural-limit counter', () => {
  const bareGenerals = position([['K', 9, 4], ['k', 0, 3]]);
  assert.equal(getGameStatus(bareGenerals).reason, 'no-material');
  const game = position([['K', 9, 4], ['k', 0, 3], ['R', 8, 0], ['p', 6, 0]]);
  game.history = Array.from({ length: 119 }, (_, index) => ({
    from: { row: 8, col: 0 }, to: { row: 8, col: 0 }, piece: 'R', captured: null,
    turn: index % 2 ? BLACK : RED
  }));
  game.history.push({ from: { row: 8, col: 0 }, to: { row: 6, col: 0 }, piece: 'R', captured: 'p', turn: RED });
  assert.notEqual(getGameStatus(game).reason, 'natural-limit');
});

test('a draw agreement ends the game and undoing a move reopens the position', () => {
  const game = createGame();
  assert.equal(makeMove(game, { row: 6, col: 4 }, { row: 5, col: 4 }), true);
  agreeToDraw(game);
  assert.deepEqual(getGameStatus(game), {
    type: 'draw', turn: BLACK, winner: null, inCheck: false, reason: 'agreement'
  });
  assert.equal(makeMove(game, { row: 3, col: 4 }, { row: 4, col: 4 }), false);
  assert.equal(undoMove(game), true);
  assert.equal(getGameStatus(createGame()).type, 'playing');
  assert.equal(getGameStatus(game).type, 'playing');
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