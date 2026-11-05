import assert from 'node:assert/strict';
import { BLACK, WHITE, createGame, playStone } from '../go/core.mjs';
import { applyEngineMove, toEnginePosition } from '../go/ai-adapter.mjs';

const game = createGame(9);
assert.equal(playStone(game, 0, 0), true);
assert.equal(playStone(game, 2, 1), true);
const position = toEnginePosition(game);
assert.equal(position.board[0][0], 'black');
assert.equal(position.board[2][1], 'white');
assert.equal(position.currentPlayer, 'black');
assert.deepEqual(position.moveHistory, [
  { x: 0, y: 0, player: 'black' },
  { x: 1, y: 2, player: 'white' }
]);
assert.equal(position.previousBoard[2][1], null);
assert.equal(position.previousPreviousBoard[0][0], null);

const result = applyEngineMove(game, { moves: [
  { x: 0, y: 0, order: 0 },
  { x: 8, y: 8, order: 1 }
] });
assert.equal(result.pass, false);
assert.equal(result.candidate.x, 8);
assert.equal(game.board[8][8], BLACK);
assert.equal(game.turn, WHITE);

const passResult = applyEngineMove(game, { moves: [{ x: -1, y: -1, order: 0 }] });
assert.equal(passResult.pass, true);
assert.equal(game.turn, BLACK);
assert.equal(game.consecutivePasses, 1);

assert.equal(applyEngineMove(game, { moves: [{ x: 9, y: 9, order: 0 }] }), null);
assert.equal(game.turn, BLACK);

console.log('Go AI adapter passed: board conversion, history, legal fallback, pass.');