import assert from 'node:assert/strict';
import { BLACK, WHITE, createEmptyBoard, createGame, getGroupInfo, playStone } from '../go/core.mjs';

function boardFrom(stones) {
  const board = createEmptyBoard(19);
  for (const [row, col, color] of stones) board[row][col] = color;
  return board;
}

const attack = createGame(19, { board: boardFrom([[9, 8, WHITE], [8, 8, BLACK], [9, 9, BLACK]]) });
assert.equal(getGroupInfo(attack.board, 9, 8).liberties.length, 2);
assert.equal(playStone(attack, 10, 8), true);
assert.equal(getGroupInfo(attack.board, 9, 8).liberties.length, 1);

const escape = createGame(19, {
  board: boardFrom([[9, 8, WHITE], [8, 8, BLACK], [9, 9, BLACK], [10, 8, BLACK]]),
  turn: WHITE
});
assert.equal(getGroupInfo(escape.board, 9, 8).liberties.length, 1);
assert.equal(playStone(escape, 9, 7), true);
assert.equal(getGroupInfo(escape.board, 9, 8).stones.length, 2);
assert.ok(getGroupInfo(escape.board, 9, 8).liberties.length > 1);

const connection = createGame(19, {
  board: boardFrom([[9, 8, WHITE], [9, 6, WHITE], [8, 8, BLACK], [9, 9, BLACK], [10, 8, BLACK]]),
  turn: WHITE
});
assert.equal(getGroupInfo(connection.board, 9, 8).liberties.length, 1);
assert.equal(playStone(connection, 9, 7), true);
assert.equal(getGroupInfo(connection.board, 9, 8).stones.length, 3);
assert.ok(getGroupInfo(connection.board, 9, 8).liberties.length > 1);

const reduction = createGame(19, {
  board: boardFrom([[3, 3, BLACK], [9, 3, BLACK], [15, 3, BLACK]]),
  turn: WHITE
});
assert.equal(playStone(reduction, 9, 6), true);
assert.equal(reduction.board[9][6], WHITE);

const attackAndRun = createGame(19, { board: boardFrom([[9, 8, WHITE], [8, 8, BLACK], [9, 9, BLACK]]) });
assert.equal(playStone(attackAndRun, 10, 8), true);
assert.equal(getGroupInfo(attackAndRun.board, 9, 8).liberties.length, 1);
assert.equal(playStone(attackAndRun, 9, 7), true);
assert.equal(getGroupInfo(attackAndRun.board, 9, 8).stones.length, 2);
assert.ok(getGroupInfo(attackAndRun.board, 9, 8).liberties.length > 1);

console.log('Go middlegame passed: attack, escape, connect, reduce, and attack-run sequence.');