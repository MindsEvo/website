import assert from 'node:assert/strict';
import { BLACK, WHITE, createEmptyBoard, createGame, getGroupInfo, playStone } from '../go/core.mjs';

function boardFrom(stones) {
  const board = createEmptyBoard(9);
  for (const [row, col, color] of stones) board[row][col] = color;
  return board;
}

const attack = createGame(9, { board: boardFrom([[4, 4, WHITE], [3, 4, BLACK], [4, 5, BLACK]]) });
assert.equal(getGroupInfo(attack.board, 4, 4).liberties.length, 2);
assert.equal(playStone(attack, 5, 4), true);
assert.equal(getGroupInfo(attack.board, 4, 4).liberties.length, 1);

const escape = createGame(9, {
  board: boardFrom([[4, 4, WHITE], [3, 4, BLACK], [4, 5, BLACK], [5, 4, BLACK]]),
  turn: WHITE
});
assert.equal(getGroupInfo(escape.board, 4, 4).liberties.length, 1);
assert.equal(playStone(escape, 4, 3), true);
assert.equal(getGroupInfo(escape.board, 4, 3).stones.length, 2);
assert.ok(getGroupInfo(escape.board, 4, 3).liberties.length > 1);

const connect = createGame(9, {
  board: boardFrom([[4, 4, WHITE], [4, 2, WHITE], [3, 4, BLACK], [4, 5, BLACK], [5, 4, BLACK]]),
  turn: WHITE
});
assert.equal(getGroupInfo(connect.board, 4, 4).liberties.length, 1);
assert.equal(playStone(connect, 4, 3), true);
assert.equal(getGroupInfo(connect.board, 4, 4).stones.length, 3);
assert.ok(getGroupInfo(connect.board, 4, 4).liberties.length > 1);

const seal = createGame(9, { board: boardFrom([[4, 4, WHITE], [3, 4, BLACK], [4, 5, BLACK]]) });
assert.equal(playStone(seal, 5, 4), true);
assert.equal(getGroupInfo(seal.board, 4, 4).liberties.length, 1);

console.log('Go attack-defense passed: attack, escape, connect, and restrict liberties.');