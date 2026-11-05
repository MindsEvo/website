import assert from 'node:assert/strict';
import { BLACK, WHITE, createEmptyBoard, createGame, getGroupInfo, playStone } from '../go/core.mjs';

function boardFrom(stones) {
  const board = createEmptyBoard(9);
  for (const [row, col, color] of stones) board[row][col] = color;
  return board;
}

function snapbackBoard() {
  const whiteStones = [[3, 4], [3, 3], [4, 3], [5, 3], [5, 4], [3, 5]];
  const excluded = new Set(['4,4', '4,5', ...whiteStones.map(([row, col]) => `${row},${col}`)]);
  const blackStones = new Set();
  for (const [row, col] of whiteStones) {
    for (const [nextRow, nextCol] of [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]) {
      if (nextRow >= 0 && nextRow < 9 && nextCol >= 0 && nextCol < 9) {
        const key = `${nextRow},${nextCol}`;
        if (!excluded.has(key)) blackStones.add(key);
      }
    }
  }
  blackStones.add('4,6');
  return boardFrom([
    ...whiteStones.map(([row, col]) => [row, col, WHITE]),
    ...[...blackStones].map(key => [...key.split(',').map(Number), BLACK])
  ]);
}

const atari = createGame(9, { board: boardFrom([[4, 4, WHITE], [3, 4, BLACK], [4, 5, BLACK]]) });
assert.equal(getGroupInfo(atari.board, 4, 4).liberties.length, 2);
assert.equal(playStone(atari, 5, 4), true);
assert.equal(getGroupInfo(atari.board, 4, 4).liberties.length, 1);

const cut = createGame(9, { board: boardFrom([[4, 3, BLACK], [4, 5, BLACK]]), turn: WHITE });
assert.equal(playStone(cut, 4, 4), true);
assert.equal(getGroupInfo(cut.board, 4, 3).stones.length, 1);
assert.equal(getGroupInfo(cut.board, 4, 5).stones.length, 1);

const hane = createGame(9, { board: boardFrom([[4, 3, BLACK], [4, 4, WHITE]]) });
assert.equal(playStone(hane, 3, 3), true);
assert.equal(getGroupInfo(hane.board, 4, 3).stones.length, 2);

const snapback = createGame(9, { board: snapbackBoard() });
assert.equal(getGroupInfo(snapback.board, 3, 4).liberties.length, 2);
assert.equal(playStone(snapback, 4, 4), true, 'black throw-in must be legal');
assert.equal(getGroupInfo(snapback.board, 4, 4).liberties.length, 1);
assert.equal(playStone(snapback, 4, 5), true, 'white must capture the throw-in');
assert.equal(snapback.captures[WHITE], 1);
assert.equal(playStone(snapback, 4, 4), true, 'black must be able to recapture the full group');
assert.equal(snapback.captures[BLACK], 7);
assert.equal(snapback.board[4][4], BLACK);

console.log('Go tesuji passed: atari, cut, hane, and snapback sequence.');