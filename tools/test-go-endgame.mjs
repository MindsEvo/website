import assert from 'node:assert/strict';
import { BLACK, WHITE, calculateAreaScore, createEmptyBoard, createGame, passTurn, playStone } from '../go/core.mjs';

const board = createEmptyBoard(9);
board[3].fill(BLACK);
board[5].fill(WHITE);
const game = createGame(9, { board });

const initial = calculateAreaScore(game.board, game.size);
assert.equal(initial.blackArea, 36);
assert.equal(initial.whiteArea, 36);
assert.equal(initial.neutralPoints, 9);

assert.equal(playStone(game, 4, 4), true);
const afterBlack = calculateAreaScore(game.board, game.size);
assert.equal(afterBlack.blackArea, initial.blackArea + 1);
assert.equal(afterBlack.neutralPoints, initial.neutralPoints - 1);
assert.equal(afterBlack.whiteArea, initial.whiteArea);

assert.equal(playStone(game, 4, 5), true);
const afterWhite = calculateAreaScore(game.board, game.size);
assert.equal(afterWhite.blackArea, 37);
assert.equal(afterWhite.whiteArea, 37);
assert.equal(afterWhite.neutralPoints, 7);

assert.equal(passTurn(game), true);
assert.equal(game.scoring, false);
assert.equal(passTurn(game), true);
assert.equal(game.scoring, true);

console.log('Go endgame passed: neutral-point area value, Chinese area score, and consecutive-pass scoring.');