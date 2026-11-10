import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGameFromFen, makeMove, undoMove, redoMove } from '../chinese-chess/core.mjs';
import { buildNotationPlayback } from '../chinese-chess/shared/notation-playback.mjs';
import { getLessonMoveFeedback } from '../chinese-chess/shared/lesson-move-feedback.mjs';

const bank = new URL('../chinese-chess/bank/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', bank), 'utf8'));
const puzzles = manifest.categories.flatMap(category => category.items);
async function position(id, step) {
  const puzzle = puzzles.find(puzzle => puzzle.id === id);
  const fen = await readFile(new URL(puzzle.fen, bank), 'utf8');
  const solution = puzzle.solutions.find(file => file.includes(`${id}-1.txt`));
  const playback = buildNotationPlayback(fen, await readFile(new URL(solution, bank), 'utf8'));
  const game = createGameFromFen(fen);
  for (const move of playback.moves.slice(0, step)) assert.ok(makeMove(game, move.from, move.to));
  return game;
}

const check = getLessonMoveFeedback(await position('at_2R2AE-R_L1-001', 1));
assert.equal(check.state.type, 'check');
assert.equal(check.checkedKing, 'k');
assert.match(check.text, /将军，黑方应将/);
assert.equal(check.losingKing, null);
const captureGame = await position('at_2RAE-RA_L1-001', 5);
const capture = getLessonMoveFeedback(captureGame);
assert.deepEqual(capture.capture, captureGame.history.at(-1).to);
assert.match(capture.text, /吃士；将军/);
undoMove(captureGame);
assert.equal(getLessonMoveFeedback(captureGame).capture, null);
redoMove(captureGame);
assert.deepEqual(getLessonMoveFeedback(captureGame), capture);
const mate = getLessonMoveFeedback(await position('at_HP2AE-RCAE_L1-001', 1));
assert.equal(mate.state.type, 'checkmate');
assert.equal(mate.state.winner, 'red');
assert.equal(mate.losingKing, 'k');
assert.match(mate.text, /将死，红方获胜，黑方负/);
const blackMateGame = await position('at_HP2AE-RCAE_L1-001', 1);
blackMateGame.board = blackMateGame.board.slice().reverse().map(row => row.slice().reverse().map(piece => (
  piece ? (piece === piece.toUpperCase() ? piece.toLowerCase() : piece.toUpperCase()) : null
)));
blackMateGame.turn = 'red';
blackMateGame.history = [];
const blackMate = getLessonMoveFeedback(blackMateGame);
assert.equal(blackMate.state.winner, 'black');
assert.equal(blackMate.losingKing, 'K');
assert.match(blackMate.text, /黑方获胜，红方负/);
const stalemate = getLessonMoveFeedback(await position('eg_H-A_L1-001', 27));
assert.equal(stalemate.state.type, 'stalemate');
assert.equal(stalemate.checkedKing, null);
assert.equal(stalemate.losingKing, 'k');
assert.match(stalemate.text, /困毙，红方获胜，黑方负/);
const ongoing = getLessonMoveFeedback(await position('at_2R2AE-R_L1-001', 2));
assert.equal(ongoing.text, '');
assert.equal(ongoing.state.winner, null);
assert.match(getLessonMoveFeedback(createGameFromFen('9/9/9/9/9/9/9/9/9/4K4 w - - 0 1')).text, /局面无效/);
console.log('Validated capture, check, mate, stalemate, winner, ongoing positions and undo/redo feedback.');
