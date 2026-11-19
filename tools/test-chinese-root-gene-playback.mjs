import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import * as core from '../chinese-chess/core.mjs';
import { buildNotationPlayback } from '../chinese-chess/shared/notation-playback.mjs';

const source = await readFile(new URL('../chinese-chess/rootgene/rootgene-page.mjs', import.meta.url), 'utf8');
const start = source.indexOf('function exitNotationPlayback(');
const end = source.indexOf('function syncGame(', start);

function editor(text = '1. 兵九进一 卒一进一') {
  const game = core.createGame();
  const timers = new Map();
  const view = {
    hidden: true, children: [], scrollTop: 0, clientHeight: 150,
    replaceChildren() { this.children = []; },
    append(button) { this.children.push(button); },
    querySelectorAll() { return this.children.flatMap(round => round.children.filter(node => node.tagName === 'button')); },
    getBoundingClientRect: () => ({ top: 0 })
  };
  let nextTimer = 0;
  const context = vm.createContext({
    ...core, buildNotationPlayback, game, gameOriginFen: core.toFen(game),
    materialFen: core.toFen(game), draftMaterialFen: '',
    notationPlayback: null, playbackSnapshot: null, playbackStep: 0,
    playbackTimer: undefined, running: false, solutionText: { value: text },
    document: {
      getElementById: () => view,
      createElement: tagName => ({
        tagName, children: [], dataset: {},
        append(node) { this.children.push(node); },
        attributes: {}, active: false, offsetHeight: 30,
        classList: { toggle(name, active) { this.active = active; } },
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(event, callback) { this[event] = callback; },
        getBoundingClientRect: () => ({ top: 60 })
      })
    },
    panel: { getSpeed: () => 10 },
    audio: { stop() {}, move() {} },
    clearSelection() {}, renderBoard() {},
    syncGame() { context.board = context.game.board; context.turn = context.game.turn; },
    setStatus(message, state) { context.status = { message, state }; },
    setTimeout(callback, delay) {
      const id = ++nextTimer;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    cancelEngine() {
      timers.delete(context.playbackTimer);
      context.running = false;
    }
  });
  vm.runInContext(source.slice(start, end), context);
  return { context, game, timers, view };
}

test('current move highlights on play, step, reset and click; exiting restores the editor', () => {
  const { context, view } = editor();
  context.handleNotationControl('play');
  assert.equal(view.hidden, false);
  assert.equal(context.solutionText.hidden, true);
  const buttons = view.querySelectorAll('button');
  assert.equal(view.children.length, 1);
  assert.equal(view.children[0].children[0].textContent, '1.');
  assert.equal(buttons[0].textContent, '兵九进一');
  assert.equal(buttons[1].textContent, '卒一进一');
  assert.equal(buttons[0].dataset.side, 'red');
  assert.equal(buttons[1].dataset.side, 'black');
  assert.equal(buttons[0].attributes['aria-current'], 'step');
  assert.equal(buttons[1].attributes['aria-current'], 'false');
  context.handleNotationControl('redo');
  assert.equal(buttons[0].attributes['aria-current'], 'false');
  assert.equal(buttons[1].attributes['aria-current'], 'step');
  context.handleNotationControl('reset');
  assert.ok(buttons.every(button => button.attributes['aria-current'] === 'false'));
  buttons[0].click();
  assert.equal(context.playbackStep, 1);
  assert.equal(buttons[0].attributes['aria-current'], 'step');
  context.exitNotationPlayback();
  assert.equal(view.hidden, true);
  assert.equal(context.solutionText.hidden, false);
  assert.equal(context.solutionText.value, '1. 兵九进一 卒一进一');
});

test('play follows notation, finishes and can replay from the beginning', () => {
  const { context, timers } = editor();
  context.handleNotationControl('play');
  assert.equal(context.playbackStep, 1);
  assert.equal(context.running, true);
  assert.equal(context.game.board[5][0], 'P');
  const timer = [...timers.values()][0];
  assert.equal(timer.delay, 600);
  timer.callback();
  assert.equal(context.playbackStep, 2);
  assert.equal(context.running, false);
  assert.equal(context.game.board[4][0], 'p');
  context.handleNotationControl('play');
  assert.equal(context.playbackStep, 1);
  assert.equal(context.running, true);
});

test('pause, previous, next and reset work without engine requests', () => {
  const { context, timers } = editor();
  context.handleNotationControl('play');
  context.handleNotationControl('play');
  assert.equal(context.running, false);
  assert.equal(timers.size, 0);
  context.handleNotationControl('undo');
  assert.equal(context.playbackStep, 0);
  context.handleNotationControl('redo');
  assert.equal(context.playbackStep, 1);
  context.handleNotationControl('redo');
  assert.equal(context.playbackStep, 2);
  context.handleNotationControl('reset');
  assert.equal(context.playbackStep, 0);
});

test('exiting playback restores the exact original game and its history', () => {
  const { context, game, timers } = editor();
  core.makeMove(game, { row: 6, col: 2 }, { row: 5, col: 2 });
  const before = core.toFen(game);
  context.handleNotationControl('play');
  assert.notEqual(context.game, game);
  context.exitNotationPlayback();
  assert.equal(context.game, game);
  assert.equal(core.toFen(game), before);
  assert.equal(game.history.length, 1);
  assert.equal(context.playbackSnapshot, null);
  assert.equal(timers.size, 0);
});

test('malformed notation reports an error without altering the board', () => {
  const { context, game, timers } = editor('bad notation');
  context.handleNotationControl('play');
  assert.equal(context.game, game);
  assert.equal(context.playbackSnapshot, null);
  assert.equal(context.status.state, 'error');
  assert.match(context.status.message, /棋谱无法播放/);
  assert.equal(timers.size, 0);
});

test('recorded draft and black-first notation use their own starting FEN', () => {
  const { context } = editor('1. 卒一进一');
  context.draftMaterialFen = core.toFen(core.createGame({ turn: core.BLACK }));
  context.handleNotationControl('play');
  assert.equal(context.playbackStep, 1);
  assert.equal(context.game.board[4][0], 'p');
  assert.equal(context.game.turn, core.RED);
  assert.equal(context.running, false);
});
