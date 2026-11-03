import assert from 'node:assert/strict';
import { BLACK, WHITE, createEmptyBoard, createGame, playStone } from '../go/core.mjs';

const invasionStart = createEmptyBoard(9);
invasionStart[5][3] = BLACK;

const mainLine = [
  [WHITE, 6, 2], [BLACK, 6, 3], [WHITE, 5, 2], [BLACK, 4, 2],
  [WHITE, 4, 1], [BLACK, 3, 2], [WHITE, 3, 1], [BLACK, 2, 2]
];

function playLine(state, line, label) {
  for (const [color, row, col] of line) {
    assert.equal(state.turn, color, `${label}: unexpected turn before ${row},${col}`);
    assert.equal(playStone(state, row, col), true, `${label}: illegal move ${row},${col}`);
  }
}

const mainGame = createGame(9, { board: invasionStart, turn: WHITE });
playLine(mainGame, mainLine, 'main line');

const doubleHane = createGame(9, { board: invasionStart, turn: WHITE });
playLine(doubleHane, mainLine.slice(0, 5), 'double hane setup');
playLine(doubleHane, [
  [BLACK, 3, 1], [WHITE, 3, 2], [BLACK, 4, 3], [WHITE, 2, 1],
  [BLACK, 5, 1], [WHITE, 3, 0], [BLACK, 6, 1]
], 'double hane branch');

console.log(`Go joseki passed: main line (${mainGame.captures[BLACK]} captures), double-hane branch (${doubleHane.captures[BLACK]} black captures, ${doubleHane.captures[WHITE]} white captures).`);