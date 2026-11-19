import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import * as core from '../chinese-chess/core.mjs';
import { getLessonMoveFeedback } from '../chinese-chess/shared/lesson-move-feedback.mjs';

const rootgene = await readFile(new URL('../chinese-chess/rootgene/rootgene-page.mjs', import.meta.url), 'utf8');
const endgame = await readFile(new URL('../chinese-chess/academy/endgame/endgame-page.mjs', import.meta.url), 'utf8');
const pieceMoves = await readFile(new URL('../chinese-chess/academy/intro/piece-moves-page.mjs', import.meta.url), 'utf8');
const humanAi = await readFile(new URL('../chinese-chess/play/human-ai-page.mjs', import.meta.url), 'utf8');
const aiAi = await readFile(new URL('../chinese-chess/play/ai-ai-page.mjs', import.meta.url), 'utf8');
const manualPlay = await readFile(new URL('../chinese-chess/play/play.js', import.meta.url), 'utf8');

test('all live play pages use the shared terminal status predicate', () => {
  assert.match(rootgene, /if \(isTerminalGameStatus\(getGameStatus\(game\)\)\)/);
  assert.match(endgame, /if \(isTerminalGameStatus\(state\)\)/);
  assert.match(endgame, /isTerminalGameStatus\(getGameStatus\(game\)\)/);
  assert.match(humanAi, /return isTerminalGameStatus\(getGameStatus\(game\)\)/);
  assert.match(aiAi, /if \(isTerminalGameStatus\(gameStatus\)\)/);
  assert.match(manualPlay, /if \(isTerminalGameStatus\(status\)\) return/);
});

test('shared move feedback clearly labels a draw', () => {
  const board = core.createEmptyBoard();
  board[9][4] = 'K';
  board[0][3] = 'k';
  const feedback = getLessonMoveFeedback(core.createGame({ board }));

  assert.equal(core.getGameStatus(core.createGame({ board })).type, 'draw');
  assert.equal(feedback.text, '和棋 · 双方均无可取胜棋子');
});

test('shared move feedback names the perpetual checker as the loser', () => {
  const board = core.createEmptyBoard();
  board[9][5] = 'K';
  board[0][3] = 'k';
  board[2][4] = 'R';
  const game = core.createGame({ board });
  const cycle = [
    [[2, 4], [2, 3]], [[0, 3], [0, 4]],
    [[2, 3], [2, 4]], [[0, 4], [0, 3]]
  ];
  for (let repetition = 0; repetition < 2; repetition += 1) {
    for (const [from, to] of cycle) {
      assert.equal(core.makeMove(game, { row: from[0], col: from[1] }, { row: to[0], col: to[1] }), true);
    }
  }

  const feedback = getLessonMoveFeedback(game);
  assert.equal(feedback.state.type, 'forfeit');
  assert.equal(feedback.state.loser, core.RED);
  assert.equal(feedback.text, '红方因长将或长捉判负，黑方获胜');
});

test('piece-move duel practice ends with the shared draw and forfeit messages', () => {
  const start = pieceMoves.indexOf('function practiceDuelStatus()');
  const end = pieceMoves.indexOf('function handleMovePracticeClick(', start);
  const context = vm.createContext({ ...core, getLessonMoveFeedback });
  vm.runInContext(pieceMoves.slice(start, end), context);

  const bareGenerals = core.createEmptyBoard();
  bareGenerals[9][4] = 'K';
  bareGenerals[0][3] = 'k';
  context.game = core.createGame({ board: bareGenerals });
  let result = context.practiceDuelStatus();
  assert.equal(result.finished, true);
  assert.equal(result.text, '和棋 · 双方均无可取胜棋子');

  const checkCycle = [
    [[2, 4], [2, 3]], [[0, 3], [0, 4]],
    [[2, 3], [2, 4]], [[0, 4], [0, 3]]
  ];
  const checkingBoard = core.createEmptyBoard();
  checkingBoard[9][5] = 'K';
  checkingBoard[0][3] = 'k';
  checkingBoard[2][4] = 'R';
  context.game = core.createGame({ board: checkingBoard });
  for (let repetition = 0; repetition < 2; repetition += 1) {
    for (const [from, to] of checkCycle) {
      assert.equal(core.makeMove(context.game, { row: from[0], col: from[1] }, { row: to[0], col: to[1] }), true);
    }
  }
  result = context.practiceDuelStatus();
  assert.equal(result.finished, true);
  assert.equal(result.text, '红方因长将或长捉判负，黑方获胜');
});
