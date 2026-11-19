import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as core from '../chinese-chess/core.mjs';
import { buildNotationPlayback } from '../chinese-chess/shared/notation-playback.mjs';
import { formatRecordedNotation, formatSolutionNotation } from '../chinese-chess/shared/recorded-notation.mjs';
import { parsePuzzleName } from '../chinese-chess/rootgene/puzzle-name.mjs';
import { readServiceResponse } from '../chinese-chess/rootgene/service-response.mjs';
import { getCoursePuzzleLevel } from '../chinese-chess/academy/course-puzzle-levels.mjs';

const source = await readFile(new URL('../chinese-chess/rootgene/rootgene-page.mjs', import.meta.url), 'utf8');
const functions = ['validateBoard', 'toggleRecording', 'updateRecording', 'savePuzzleWhileBusy', 'saveMaterial', 'manageClassification'];
const implementations = functions.map(name => {
  const start = source.search(new RegExp(`^(?:async )?function ${name}\\(`, 'm'));
  assert.notEqual(start, -1, `${name} exists`);
  const next = source.slice(start + 1).search(/\n(?:async )?function /);
  return next === -1 ? source.slice(start) : source.slice(start, start + next + 1);
}).join('\n');

function createEditor() {
  const game = core.createGame();
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      value: '', textContent: '', disabled: false,
      classList: { add() {}, remove() {} }
    });
    return elements.get(id);
  };
  const writes = [];
  const context = vm.createContext({
    ...core, buildNotationPlayback, formatRecordedNotation, formatSolutionNotation, parsePuzzleName, readServiceResponse, getCoursePuzzleLevel,
    board: game.board, turn: game.turn, game, gameOriginFen: core.toFen(game),
    materialFen: '', materialPuzzle: null, materialToken: 0,
    draftMaterialFen: '', recordingFen: '', recordingStart: 0, recording: false,
    selectedSavedId: '', selectedPuzzleId: '', replacementTarget: null, resetFen: '',
    bankManifest: { categories: [] },
    document: { getElementById: element },
    window: { confirm: () => true, prompt: (message, value) => value },
    loadedMaterialFiles: { solution: '', explanation: '' },
    audio: { stop() {} },
    TYPES: { endgame: { prefix: 'eg' } },
    geneType: { value: 'endgame' }, geneLevel: { value: 'L1' }, geneName: { value: '测试记录' },
    solutionText: element('solutionText'), explanationText: element('explanationText'),
    solutionStatus: element('solutionStatus'), explanationStatus: element('explanationStatus'),
    statusText: element('rootGeneStatus'), recordButton: element('recordButton'),
    boardRenders: 0,
    flushPendingPlacement() {}, cancelEngine() {}, clearSelection() {},
    exitNotationPlayback() {}, updateBoardControls() {},
    renderBoard() { context.boardRenders += 1; },
    stopRecording() { context.recording = false; },
    setStatus(message) { context.statusText.textContent = message; },
    setBusy(busy) { context.busy = busy; },
    selectedClassification() {
      return {
        classifications: [{ family: 'endgame', group: '兵卒', category: '单兵对王' }],
        lessonSections: ['observation']
      };
    },
    loadCustomBank: async () => true,
    nextPuzzleId: async () => 'eg_测试记录_L1-001',
    checkPositionDuplicates: async (fen, excludeId, expectedBoardFen) => {
      assert.equal(expectedBoardFen, core.toFen(context.game));
      context.checkedFen = fen;
      return [];
    },
    updateMaterialVersions() {},
    fetch: async (url, options) => {
      const body = JSON.parse(options.body);
      writes.push({ url, body });
      if (url.endsWith('/material')) {
        return Response.json({ relativePath: 'custom/material-001.txt' });
      }
      return Response.json({ id: body.id, item: { title: body.title, solutions: [], explanations: [] } });
    }
  });
  element('solutionVersion').value = '1';
  element('explanationVersion').value = '1';
  vm.runInContext(implementations, context);
  return { context, writes };
}

function movePawn(context) {
  assert.ok(core.makeMove(context.game, { row: 6, col: 0 }, { row: 5, col: 0 }));
  context.board = context.game.board;
  context.turn = context.game.turn;
}

test('unsaved position records without a name or classification and persists its starting FEN', async () => {
  const { context, writes } = createEditor();
  context.geneName.value = '';
  const startFen = core.toFen(context.game);
  context.toggleRecording();
  assert.equal(context.recording, true);
  assert.equal(writes.length, 0);
  movePawn(context);
  const game = context.game;
  const endFen = core.toFen(game);
  const boardRenders = context.boardRenders;
  context.geneName.value = '测试记录';
  await context.saveMaterial('solution');
  assert.equal(writes.length, 2);
  assert.equal(writes[0].body.fen, startFen);
  assert.notEqual(writes[0].body.fen, endFen);
  assert.equal(writes[1].body.text, '1. 兵九进一');
  assert.equal(context.game, game);
  assert.equal(core.toFen(context.game), endFen);
  assert.equal(game.history.length, 1);
  assert.equal(context.materialFen, startFen);
  assert.equal(context.boardRenders, boardRenders);
  assert.equal(context.busy, false);
  assert.match(context.solutionStatus.textContent, /已保存棋谱/);
});

test('explanation can save an unsaved arrangement without resetting the board', async () => {
  const { context, writes } = createEditor();
  context.explanationText.value = '记录前即可编写的解说';
  const game = context.game;
  await context.saveMaterial('explanation');
  assert.equal(writes.length, 2);
  assert.equal(writes[0].body.fen, core.toFen(game));
  assert.equal(writes[1].body.kind, 'explanation');
  assert.equal(context.explanationText.value, writes[1].body.text);
  assert.equal(context.game, game);
  assert.equal(context.boardRenders, 0);
});

test('saving a manual puzzle keeps the game, selection, history and redo stack intact', async () => {
  const { context, writes } = createEditor();
  movePawn(context);
  assert.ok(core.makeMove(context.game, { row: 3, col: 0 }, { row: 4, col: 0 }));
  core.undoMove(context.game);
  const game = context.game;
  const history = game.history;
  const redo = game.redoStack;
  const fen = core.toFen(game);
  context.selectedBoardSquare = { row: 5, col: 0 };
  const selection = context.selectedBoardSquare;
  await context.savePuzzleWhileBusy();
  assert.equal(writes.length, 1);
  assert.equal(context.game, game);
  assert.equal(game.history, history);
  assert.equal(game.history.length, 1);
  assert.equal(game.redoStack, redo);
  assert.equal(game.redoStack.length, 1);
  assert.equal(core.toFen(game), fen);
  assert.equal(context.selectedBoardSquare, selection);
  assert.equal(context.boardRenders, 0);
});

for (const action of ['add-group', 'add-category', 'rename-group', 'rename-category', 'delete-group', 'delete-category']) {
  test(`${action} preserves the current board, game history and editor contents`, async () => {
    const { context } = createEditor();
    movePawn(context);
    const game = context.game;
    const board = context.board;
    const fen = core.toFen(game);
    context.solutionText.value = '保留棋谱';
    context.explanationText.value = '保留解说';
    context.geneGroup = { value: '兵卒' };
    context.geneCategory = { value: '单兵对王' };
    context.relatedCategories = { selectedOptions: [] };
    context.window.prompt = () => '新分类';
    context.mutateClassificationCatalog = async () => ({ endgame: { 兵卒: ['单兵对王', '新分类'], 新分类: ['单兵对王'] } });
    context.populateGroups = () => {};
    context.populateCategories = () => {};
    context.populateRelatedCategories = () => {};
    await context.manageClassification(action);
    assert.match(context.statusText.textContent, /分类目录已更新/);
    assert.equal(context.game, game);
    assert.equal(context.board, board);
    assert.equal(core.toFen(game), fen);
    assert.equal(game.history.length, 1);
    assert.equal(context.boardRenders, 0);
    assert.equal(context.solutionText.value, '保留棋谱');
    assert.equal(context.explanationText.value, '保留解说');
  });
}

test('source puzzle can be renamed and re-leveled in place without replacing the board or materials', async () => {
  const { context, writes } = createEditor();
  const previous = { id: 'eg_旧名称_L1-001', title: '旧名称',
    solutions: ['source/answer.txt'], explanations: ['source/explanation.txt'] };
  context.materialPuzzle = previous;
  context.selectedPuzzleId = previous.id;
  context.materialFen = context.gameOriginFen;
  context.geneName.value = '新名称';
  context.geneLevel.value = 'L2';
  context.nextPuzzleId = async () => 'eg_新名称_L2-002';
  context.solutionText.value = '原棋谱';
  context.explanationText.value = '原解说';
  context.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    writes.push({ url, body });
    return Response.json({ id: body.id, source: true,
      item: { ...previous, id: body.id, title: body.title } });
  };
  const game = context.game;
  await context.savePuzzleWhileBusy();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].body.updateSourceId, previous.id);
  assert.equal(writes[0].body.expectedFen, context.gameOriginFen);
  assert.equal(writes[0].body.id, 'eg_新名称_L2-002');
  assert.equal(context.selectedPuzzleId, 'eg_新名称_L2-002');
  assert.equal(context.selectedSavedId, '');
  assert.equal(context.game, game);
  assert.equal(context.boardRenders, 0);
  assert.equal(context.solutionText.value, '原棋谱');
  assert.equal(context.explanationText.value, '原解说');
  assert.deepEqual(context.materialPuzzle.solutions, previous.solutions);
  assert.match(context.statusText.textContent, /已修改/);
});

test('source position changes can be cancelled or retried after save failure without losing edits', async () => {
  const { context, writes } = createEditor();
  context.materialPuzzle = { id: 'eg_测试记录_L1-001', title: '测试记录' };
  context.selectedPuzzleId = context.materialPuzzle.id;
  context.materialFen = context.gameOriginFen;
  movePawn(context);
  const fen = core.toFen(context.game);
  context.window.confirm = () => false;
  await context.savePuzzleWhileBusy();
  assert.equal(writes.length, 0);
  context.window.confirm = () => true;
  context.fetch = async () => Response.json({ error: '写入失败' }, { status: 500 });
  await context.savePuzzleWhileBusy();
  assert.match(context.statusText.textContent, /未保存/);
  assert.notEqual(context.materialFen, fen);
  assert.equal(core.toFen(context.game), fen);
  assert.equal(context.boardRenders, 0);
});

test('recorded notation saves one round per line with a space between both moves', async () => {
  const { context, writes } = createEditor();
  context.toggleRecording();
  movePawn(context);
  assert.ok(core.makeMove(context.game, { row: 3, col: 0 }, { row: 4, col: 0 }));
  assert.ok(core.makeMove(context.game, { row: 9, col: 1 }, { row: 7, col: 2 }));
  context.board = context.game.board;
  context.turn = context.game.turn;
  const endFen = core.toFen(context.game);
  const boardRenders = context.boardRenders;
  await context.saveMaterial('solution');
  const expected = '1. 兵九进一 卒一进一\n2. 马八进七';
  assert.equal(context.solutionText.value, expected);
  assert.equal(writes[1].body.text, expected);
  assert.equal(core.toFen(context.game), endFen);
  assert.equal(context.game.history.length, 3);
  assert.equal(context.boardRenders, boardRenders);
});

test('saving an existing per-move solution reformats the file and editor without updating the board', async () => {
  const { context, writes } = createEditor();
  context.solutionText.value = '1. 兵九进一\n2. 卒一进一\n3. 马八进七\n# END';
  const fen = core.toFen(context.game);
  await context.saveMaterial('solution');
  const expected = '1. 兵九进一 卒一进一\n2. 马八进七\n# END';
  assert.equal(writes[1].body.text, expected);
  assert.equal(context.solutionText.value, expected);
  assert.equal(core.toFen(context.game), fen);
  assert.equal(context.boardRenders, 0);
});

test('black-first draft records and saves after recording is stopped', async () => {
  const { context, writes } = createEditor();
  context.turn = core.BLACK;
  context.game = core.createGame({ board: context.board, turn: context.turn });
  context.gameOriginFen = core.toFen(context.game);
  const startFen = context.gameOriginFen;
  context.toggleRecording();
  assert.ok(core.makeMove(context.game, { row: 3, col: 0 }, { row: 4, col: 0 }));
  context.board = context.game.board;
  context.turn = context.game.turn;
  context.updateRecording();
  context.toggleRecording();
  await context.saveMaterial('solution');
  assert.equal(writes[0].body.fen, startFen);
  assert.equal(writes[1].body.text, '1. 卒一进一');
});

test('missing name preserves recording and explanation without writing either file', async () => {
  const { context, writes } = createEditor();
  context.toggleRecording();
  movePawn(context);
  context.geneName.value = '';
  context.explanationText.value = '保留解说';
  const endFen = core.toFen(context.game);
  await context.saveMaterial('solution');
  assert.equal(writes.length, 0);
  assert.equal(context.solutionText.value, '1. 兵九进一');
  assert.equal(context.explanationText.value, '保留解说');
  assert.equal(core.toFen(context.game), endFen);
  assert.match(context.solutionStatus.textContent, /材料未保存.*请输入棋局名称/);
  assert.equal(context.busy, false);
});

test('material failure retains the saved starting position and retries only material', async () => {
  const { context, writes } = createEditor();
  context.toggleRecording();
  movePawn(context);
  const fetch = context.fetch;
  context.fetch = async (url, options) => {
    if (url.endsWith('/material')) throw new Error('test connection failure');
    return fetch(url, options);
  };
  await context.saveMaterial('solution');
  assert.equal(writes.length, 1);
  assert.match(context.solutionStatus.textContent, /保存失败.*编辑内容已保留/);
  context.fetch = fetch;
  await context.saveMaterial('solution');
  assert.equal(writes.length, 2);
  assert.ok(writes[1].url.endsWith('/material'));
  assert.equal(context.game.history.length, 1);
});

test('cancelled duplicate confirmation leaves all draft materials unsaved', async () => {
  const { context, writes } = createEditor();
  context.toggleRecording();
  movePawn(context);
  context.window.confirm = () => false;
  context.checkPositionDuplicates = async () => [{ exact: true, item: { id: 'existing' } }];
  await context.saveMaterial('solution');
  assert.equal(writes.length, 0);
  assert.equal(context.solutionText.value, '1. 兵九进一');
  assert.equal(context.game.history.length, 1);
  assert.match(context.solutionStatus.textContent, /材料未保存/);
});

test('an edited source position is saved as a new manual draft, without changing its source', async () => {
  const { context, writes } = createEditor();
  context.materialPuzzle = { id: 'original', title: '原题', rootGene: 'source' };
  context.selectedPuzzleId = 'original';
  context.materialFen = context.gameOriginFen;
  context.board[6][0] = null;
  context.board[5][0] = 'P';
  context.game = core.createGame({ board: context.board, turn: context.turn });
  context.gameOriginFen = core.toFen(context.game);
  context.explanationText.value = '调整后的新局面';
  await context.saveMaterial('explanation');
  assert.equal(writes.length, 2);
  assert.equal(writes[0].body.updateExisting, false);
  assert.equal(writes[0].body.fen, context.gameOriginFen);
  assert.notEqual(writes[0].body.id, 'original');
});

test('invalid notation is rejected and source materials can be overwritten directly', async () => {
  const { context, writes } = createEditor();
  context.solutionText.value = 'invalid notation';
  await context.saveMaterial('solution');
  assert.equal(writes.length, 0);
  assert.match(context.solutionStatus.textContent, /棋谱校验失败/);
  context.materialPuzzle = { id: 'original', rootGene: 'source' };
  context.materialFen = context.gameOriginFen;
  context.explanationText.value = '解说';
  await context.saveMaterial('explanation');
  assert.equal(writes.length, 1);
  assert.match(writes[0].url, /original\/material$/);
  assert.match(context.explanationStatus.textContent, /已保存解说/);
});

test('save prompt defaults to the loaded name and permits manual numbering', async () => {
  const { context, writes } = createEditor();
  context.materialPuzzle = { id: 'original', rootGene: 'source' };
  context.materialFen = context.gameOriginFen;
  context.loadedMaterialFiles.explanation = 'source/解说_02.txt';
  context.explanationText.value = '修订解说';
  context.window.prompt = (message, value) => {
    assert.equal(value, '解说_02.txt');
    return '解说_03.txt';
  };
  await context.saveMaterial('explanation');
  assert.equal(writes.length, 1);
  assert.equal(writes[0].body.filename, '解说_03.txt');
});

test('cancelling the filename prompt does not save and preserves editor contents', async () => {
  const { context, writes } = createEditor();
  context.explanationText.value = '保留草稿';
  context.window.prompt = () => null;
  await context.saveMaterial('explanation');
  assert.equal(writes.length, 0);
  assert.equal(context.explanationText.value, '保留草稿');
});
