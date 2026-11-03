import assert from 'node:assert/strict';
import { BOARD_SIZES, BLACK, WHITE, calculateAreaScore, createEmptyBoard, createGame, finishScoring, getGroupStones, getPositionKey, playStone, passTurn, redoMove, resumeAfterScoring, undoMove } from '../go/core.mjs';

for (const size of BOARD_SIZES) {
  const game = createGame(size);
  assert.equal(game.board.length, size);
  assert.equal(game.board[0].length, size);
  assert.equal(playStone(game, 0, 0), true);
  assert.equal(game.board[0][0], BLACK);
}

const captureBoard = createEmptyBoard(9);
captureBoard[1][1] = WHITE;
captureBoard[0][1] = BLACK;
captureBoard[1][0] = BLACK;
captureBoard[1][2] = BLACK;
const captureGame = createGame(9, { board: captureBoard, turn: BLACK });
assert.equal(playStone(captureGame, 2, 1), true);
assert.equal(captureGame.board[1][1], null);
assert.equal(captureGame.captures[BLACK], 1);

const suicideBoard = createEmptyBoard(9);
suicideBoard[0][1] = WHITE;
suicideBoard[1][0] = WHITE;
suicideBoard[1][2] = WHITE;
suicideBoard[2][1] = WHITE;
const suicideGame = createGame(9, { board: suicideBoard, turn: BLACK });
assert.equal(playStone(suicideGame, 1, 1), false);
assert.equal(suicideGame.board[1][1], null);

const koBoard = createEmptyBoard(9);
koBoard[1][1] = WHITE;
koBoard[0][1] = BLACK;
koBoard[1][0] = BLACK;
koBoard[1][2] = BLACK;
koBoard[3][1] = WHITE;
koBoard[2][0] = WHITE;
koBoard[2][2] = WHITE;
const koGame = createGame(9, { board: koBoard, turn: BLACK });
const originalKoPosition = getPositionKey(koGame.board);
assert.equal(playStone(koGame, 2, 1), true);
assert.equal(playStone(koGame, 1, 1), false);
assert.notEqual(getPositionKey(koGame.board), originalKoPosition);

const passGame = createGame(13);
assert.equal(passTurn(passGame), true);
assert.equal(passGame.turn, WHITE);
assert.equal(passTurn(passGame), true);
assert.equal(passGame.scoring, true);
assert.equal(passGame.finished, false);
assert.equal(passTurn(passGame), false);
assert.equal(playStone(passGame, 4, 4), false);
assert.equal(undoMove(passGame), true);
assert.equal(passGame.finished, false);
assert.equal(passGame.scoring, false);
assert.equal(passGame.turn, WHITE);
assert.equal(redoMove(passGame), true);
assert.equal(passGame.scoring, true);
assert.equal(resumeAfterScoring(passGame), true);
assert.equal(passGame.scoring, false);
assert.equal(passGame.consecutivePasses, 0);
assert.equal(playStone(passGame, 4, 4), true);
assert.equal(passGame.turn, WHITE);
assert.equal(undoMove(passGame), true);
assert.equal(passGame.scoring, false);
assert.equal(passTurn(passGame), true);
assert.equal(passTurn(passGame), true);
assert.equal(passGame.scoring, true);
assert.equal(finishScoring(passGame), true);
assert.equal(passGame.finished, true);

const scoreBoard = createEmptyBoard(9);
for (const [row, col] of [[0, 1], [1, 0], [1, 2], [2, 1]]) scoreBoard[row][col] = BLACK;
scoreBoard[8][8] = WHITE;
assert.equal(getGroupStones(scoreBoard, 8, 8).length, 1);
const liveScore = calculateAreaScore(scoreBoard, 9);
assert.equal(liveScore.blackArea, 6);
assert.equal(liveScore.whiteArea, 1);
assert.equal(liveScore.neutralPoints, 74);
assert.equal(liveScore.whiteScore, 8.5);
assert.equal(liveScore.winner, WHITE);
const deadWhiteScore = calculateAreaScore(scoreBoard, 9, new Set(['8,8']));
assert.equal(deadWhiteScore.blackArea, 81);
assert.equal(deadWhiteScore.whiteScore, 7.5);
assert.equal(deadWhiteScore.winner, BLACK);

console.log('Go rules passed: board sizes, capture, suicide, ko, pass, undo, redo.');