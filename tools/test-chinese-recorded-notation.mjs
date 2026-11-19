import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createGameFromFen, makeMove, toFen, undoMove, redoMove } from '../chinese-chess/core.mjs';
import { formatRecordedNotation, formatSolutionNotation } from '../chinese-chess/shared/recorded-notation.mjs';
import { buildNotationPlayback } from '../chinese-chess/shared/notation-playback.mjs';

test('recorded pawn, horse, elephant and cannon moves round-trip exactly', () => {
  const game = createGame();
  const fen = toFen(game);
  const moves = [[6, 0, 5, 0], [3, 0, 4, 0], [9, 1, 7, 2], [0, 1, 2, 2], [9, 2, 7, 4], [0, 2, 2, 4], [7, 1, 8, 1]];
  for (const [r1, c1, r2, c2] of moves) {
    assert.ok(makeMove(game, { row: r1, col: c1 }, { row: r2, col: c2 }));
  }
  const text = formatRecordedNotation(fen, game.history);
  assert.equal(text, '1. 兵九进一 卒一进一\n2. 马八进七 马二进三\n3. 相七进五 象三进五\n4. 炮八退一');
  assert.match(text, /马八进七/);
  assert.match(text, /相七进五/);
  const parsed = buildNotationPlayback(fen, text);
  assert.deepEqual(parsed.positions.at(-1), game.board);
  undoMove(game);
  assert.equal(buildNotationPlayback(fen, formatRecordedNotation(fen, game.history)).moves.length, 6);
  redoMove(game);
  assert.equal(formatRecordedNotation(fen, game.history), text);
});

test('black-first recording and empty recording are valid without ellipsis markers', () => {
  const game = createGameFromFen(toFen(createGame()).replace(' w ', ' b '));
  const fen = toFen(game);
  assert.equal(formatRecordedNotation(fen, []), '');
  assert.ok(makeMove(game, { row: 3, col: 0 }, { row: 4, col: 0 }));
  const text = formatRecordedNotation(fen, game.history);
  assert.equal(text, '1. 卒一进一');
  assert.deepEqual(buildNotationPlayback(fen, text).positions.at(-1), game.board);
  assert.throws(() => formatRecordedNotation(toFen(createGame()), game.history), /无法确定|不一致/);
  assert.ok(makeMove(game, { row: 6, col: 0 }, { row: 5, col: 0 }));
  assert.ok(makeMove(game, { row: 0, col: 1 }, { row: 2, col: 2 }));
  assert.equal(formatRecordedNotation(fen, game.history), '1. 卒一进一\n2. 兵九进一 马二进三');
});

test('existing per-move notation normalizes to rounds and retains comments', () => {
  const fen = toFen(createGame());
  const text = '# 起始局面\n1. 兵九进一 // 红兵\n2. 卒一进一\n3. 马八进七\n# END';
  const expected = '# 起始局面\n1. 兵九进一 卒一进一\n// 红兵\n2. 马八进七\n# END';
  assert.equal(formatSolutionNotation(fen, text), expected);
  assert.equal(formatSolutionNotation(fen, expected), expected);
  assert.deepEqual(buildNotationPlayback(fen, expected), buildNotationPlayback(fen, text));
});
