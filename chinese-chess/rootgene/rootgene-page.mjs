import { BLACK, RED, createGame, createInitialBoard, getGameStatus, getLegalMoves, getPieceLabel, makeMove, undoMove, redoMove, parseFen, toFen } from '../core.mjs';
import { PUZZLE_BANK_BASE, loadPuzzleBank, renderPuzzleBank, pairedExplanation } from '../shared/puzzle-bank.mjs';
import { mountBoardControlPanel } from '../shared/board-control-panel.mjs';
import { createBoardAudio } from '../shared/board-audio.mjs';
import { getLessonMoveFeedback } from '../shared/lesson-move-feedback.mjs';
import { buildNotationPlayback } from '../shared/notation-playback.mjs';
import { formatRecordedNotation } from '../shared/recorded-notation.mjs';
import {
  appendStandardPositionMark,
  createStandardBoardArtwork,
  createStandardPieceElement,
  isCannonStartPosition,
  isPawnStartPosition,
  placeStandardIntersection
} from '../board-standard.mjs';
import { applyBoardStyle, onBoardStyleChange } from '../board-style.mjs';
import { getCoursePuzzleLevel } from '../academy/course-puzzle-levels.mjs';
import { findPositionDuplicates } from '../shared/position-duplicates.mjs';
import { CLASSIFICATION_GROUPS, validClassification } from '../academy/classification.mjs';
import { selectAttackingPuzzles } from '../academy/attacking/attacking-catalog.mjs';
import { selectTacticsPuzzles } from '../academy/tactics/tactics-catalog.mjs';
import { selectOpeningPuzzles } from '../academy/opening/opening-catalog.mjs';
import { parsePuzzleName } from './puzzle-name.mjs';
import { readServiceResponse } from './service-response.mjs';

applyBoardStyle();
onBoardStyleChange(() => {});

const boardElement = document.getElementById('geneBoard');
const statusText = document.getElementById('rootGeneStatus');
const geneName = document.getElementById('geneName');
const paletteButtons = [...document.querySelectorAll('.piece-palette-item')];
const firstMoverButton = document.getElementById('firstMoverButton');
const rootSaveButton = document.getElementById('rootGeneFooterSave');
const geneType = document.getElementById('geneType');
const geneLevel = document.getElementById('geneLevel');
const geneGroup = document.getElementById('geneGroup');
const geneCategory = document.getElementById('geneCategory');
const relatedCategories = document.getElementById('relatedCategories');
const bankTree = document.getElementById('bankTree');
const bankSearch = document.getElementById('bankSearch');
const TYPES = { endgame: { prefix: 'eg', label: '残局基础' }, attacking: { prefix: 'at', label: '基本攻杀' }, tactics: { prefix: 'tac', label: '基本战术' }, opening: { prefix: 'oc', label: '开局' } };

let board = createInitialBoard();
let turn = RED;
let selectedPalettePiece = null;
let pendingPlacementTimer;
let pendingPlacement;
let selectedSavedId = '';
let selectedPuzzleId = '';
let replacementTarget = null;
let bankManifest = null;
let paletteSide = RED;
let puzzleLoadToken = 0;
let positionCheckToken = 0;
let selectedBoardSquare = null;
let resetFen = toFen(createGame({ board, turn }));
let game = createGame({ board, turn });
let gameOriginFen = resetFen;
let mode = 'manual';
let humanSide = RED;
let running = false;
let engineThinking = false;
let engineToken = 0;
let engineAbort;
let engineTimer;
let legalTargets = [];
let loadingPuzzle = false;
let materialPuzzle = null;
let materialFen = '';
let materialToken = 0;
let recording = false;
let recordingFen = '';
let recordingStart = 0;
const solutionText = document.getElementById('solutionText');
const explanationText = document.getElementById('explanationText');
const solutionStatus = document.getElementById('solutionStatus');
const explanationStatus = document.getElementById('explanationStatus');
const recordButton = document.getElementById('recordButton');
const solutionVariant = document.getElementById('solutionVariant');
const helpDialog = document.getElementById('rootGeneHelpDialog');
document.getElementById('rootGeneHelpButton').addEventListener('click', () => helpDialog.showModal());
helpDialog.addEventListener('keydown', event => {
  if (event.key === 'Escape') helpDialog.close();
});

const panel = mountBoardControlPanel(document.getElementById('geneBoardToolbar'), {
  mode,
  onModeChange: switchMode,
  onAction: handleControl
});
panel.setVoice(false);
const audio = createBoardAudio(panel, {
  explanation: explanationText,
  onPause() { cancelEngine(); renderBoard(); },
  onStatus: message => setStatus(message, 'warning')
});
recordButton.addEventListener('click', toggleRecording);
document.getElementById('saveSolutionButton').addEventListener('click', () => saveMaterial('solution'));
document.getElementById('saveExplanationButton').addEventListener('click', () => saveMaterial('explanation'));
solutionVariant.addEventListener('change', () => loadMaterials(Number(solutionVariant.value)));
for (const kind of ['solution', 'explanation']) {
  const input = document.getElementById(`${kind}FileInput`);
  document.getElementById(kind === 'solution' ? 'loadSolutionButton' : 'loadExplanationButton').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    const token = ++materialToken;
    try {
      const text = await file.text();
      if (token !== materialToken) return;
      stopRecording();
      (kind === 'solution' ? solutionText : explanationText).value = text;
      (kind === 'solution' ? solutionStatus : explanationStatus).textContent = `已载入 ${file.name}。`;
      audio.refresh();
      renderBoard();
    } catch (error) {
      (kind === 'solution' ? solutionStatus : explanationStatus).textContent = `载入失败：${error.message}`;
    } finally { input.value = ''; }
  });
}

boardElement.addEventListener('click', handleBoardClick);
boardElement.addEventListener('dblclick', handleBoardDoubleClick);
boardElement.addEventListener('keydown', handleBoardKeyDown);
paletteButtons.forEach(button => button.addEventListener('click', () => selectPalettePiece(button)));
firstMoverButton.addEventListener('click', toggleFirstMover);
document.getElementById('savePositionButton').addEventListener('click', savePuzzle);
rootSaveButton.addEventListener('click', savePuzzle);
document.getElementById('checkPositionButton').addEventListener('click', checkPosition);
document.getElementById('clearPositionButton').addEventListener('click', clearPosition);
for (const button of document.querySelectorAll('[data-palette-side]')) {
  button.addEventListener('click', () => {
    paletteSide = button.dataset.paletteSide;
    selectedBoardSquare = null;
    selectedPalettePiece = null;
    renderPalette();
    renderBoard();
    setStatus(`已切换为${paletteSide === RED ? '红方' : '黑方'}，请选择棋子。`, 'ready');
  });
}
geneType.addEventListener('change', () => { changeGeneSelection(); populateGroups(); });
geneLevel.addEventListener('change', changeGeneSelection);
geneGroup.addEventListener('change', populateCategories);
bankSearch.addEventListener('input', renderDirectory);

renderPalette();
populateRelatedCategories();
populateGroups();
updateNameFormat();
renderBoard();
loadCustomBank();

function populateGroups(selected = '') {
  geneGroup.replaceChildren(new Option('请选择组分类', ''));
  for (const group of Object.keys(CLASSIFICATION_GROUPS[geneType.value])) geneGroup.add(new Option(group, group));
  geneGroup.value = selected;
  populateCategories();
}

function populateCategories(selected = '') {
  geneCategory.replaceChildren(new Option('请选择子分类', ''));
  for (const category of CLASSIFICATION_GROUPS[geneType.value][geneGroup.value] || []) {
    geneCategory.add(new Option(category, category));
  }
  geneCategory.value = selected;
}

function populateRelatedCategories(selected = []) {
  relatedCategories.replaceChildren();
  for (const [family, groups] of Object.entries(CLASSIFICATION_GROUPS)) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = TYPES[family].label;
    for (const [group, categories] of Object.entries(groups)) {
      for (const category of categories) {
        const value = JSON.stringify({ family, group, category });
        const option = new Option(`${group} → ${category}`, value);
        option.selected = selected.some(entry => JSON.stringify(entry) === value);
        optgroup.append(option);
      }
    }
    relatedCategories.append(optgroup);
  }
}

function selectedClassification() {
  const primary = { family: geneType.value, group: geneGroup.value, category: geneCategory.value };
  if (!validClassification(primary)) throw new Error('请选择主分类的组分类和子分类。');
  const related = [...relatedCategories.selectedOptions].map(option => JSON.parse(option.value))
    .filter(entry => JSON.stringify(entry) !== JSON.stringify(primary));
  const lessonSections = [geneLevel.value === 'L1' ? 'observation' : 'practice'];
  return { classifications: [primary, ...related], lessonSections };
}

function inferClassification(category, item) {
  const family = category.family;
  if (family === 'endgame') {
    const groups = { rook: '车', horse: '马', cannon: '炮', pawn: '兵卒' };
    const group = item.classificationPending ? '待定' : groups[category.key.split('/').at(-1)] || '组合';
    return { family, group, category: group === '待定' ? '待定' : '' };
  }
  const selector = { attacking: selectAttackingPuzzles, tactics: selectTacticsPuzzles, opening: selectOpeningPuzzles }[family];
  if (!selector) return null;
  for (const [group, names] of Object.entries(CLASSIFICATION_GROUPS[family])) {
    for (const name of names) {
      if (selector(bankManifest, name).some(puzzle => puzzle.id === item.id)) return { family, group, category: name };
    }
  }
  return null;
}

function renderBoard() {
  cancelPendingPlacement();
  const feedback = mode === 'manual' && !recording ? null : getLessonMoveFeedback(game);
  const finished = feedback && ['checkmate', 'stalemate', 'invalid'].includes(feedback.state.type);
  if (finished) {
    running = false;
    panel.setPlaying(false);
  }
  boardElement.replaceChildren(createStandardBoardArtwork('gene-grid-svg xiangqi-grid-svg'));
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col];
      const square = document.createElement('button');
      square.type = 'button';
      square.className = 'xiangqi-intersection gene-intersection';
      placeStandardIntersection(square, row, col);
      square.dataset.row = String(row);
      square.dataset.col = String(col);
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 路`
        : `空位，第 ${row + 1} 行第 ${col + 1} 路`);
      const selected = selectedBoardSquare?.row === row && selectedBoardSquare?.col === col;
      square.setAttribute('aria-selected', String(selected));
      if (selected) square.classList.add('board-piece-selected');
      if (mode === 'manual' && !recording && (selectedPalettePiece || selectedBoardSquare) && !piece) square.classList.add('palette-target');
      if ((mode !== 'manual' || recording) && legalTargets.some(target => target.row === row && target.col === col)) square.classList.add('palette-target');
      if (feedback?.capture?.row === row && feedback.capture.col === col) square.classList.add('gene-capture');
      if (piece && piece === feedback?.checkedKing) square.classList.add('gene-check');
      if (piece && piece === feedback?.losingKing) square.classList.add('gene-loser');
      if (piece?.toUpperCase() === 'K' && feedback?.state.winner && piece !== feedback.losingKing) square.classList.add('gene-winner');
      square.disabled = loadingPuzzle || ((mode !== 'manual' || recording) && (finished || engineThinking || mode === 'ai-ai' || (mode === 'human-ai' && game.turn !== humanSide)));
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'gene-piece'));
      boardElement.append(square);
    }
  }
  document.querySelector('.gene-side-label').textContent = `${turn === RED ? '红方' : '黑方'}走棋`;
  panel.controls.play.disabled = mode === 'manual' || Boolean(finished) || loadingPuzzle;
  panel.controls.undo.disabled = !game.history.length || engineThinking || loadingPuzzle;
  panel.controls.redo.disabled = !game.redoStack.length || engineThinking || loadingPuzzle;
  panel.setPlaying(running);
  for (const button of [...paletteButtons, firstMoverButton, ...document.querySelectorAll('[data-palette-side]')]) {
    button.disabled = mode !== 'manual' || recording || loadingPuzzle;
  }
  if (recording) updateRecording();
}

function handleBoardClick(event) {
  const square = event.target.closest('.gene-intersection');
  if (!square) return;
  const row = Number(square.dataset.row);
  const col = Number(square.dataset.col);
  if (loadingPuzzle) return;
  if (mode !== 'manual' || recording) {
    handlePlaySquare({ row, col });
    return;
  }
  if (event.detail > 1) return;
  cancelPendingPlacement();
  const currentPiece = board[row][col];
  if (currentPiece && !selectedBoardSquare) {
    selectedPalettePiece = null;
    renderPalette();
  }
  if (!selectedPalettePiece) {
    if (!selectedBoardSquare) {
      if (!currentPiece) {
        setStatus('请先点击棋盘上的棋子，或从左侧棋子面板选择棋子。', 'warning');
        return;
      }
      selectedBoardSquare = { row, col };
      setStatus(`已选择${turnName(currentPiece)}${getPieceLabel(currentPiece)}，点击目标位置摆放，双击移除。`, 'ready');
    } else if (selectedBoardSquare.row === row && selectedBoardSquare.col === col) {
      selectedBoardSquare = null;
      setStatus('已取消棋子选择。', 'ready');
    } else {
      if (currentPiece?.toUpperCase() === 'K') {
        setStatus('不能覆盖将帅，请选择其它位置；移动将帅时请先选中将帅。', 'warning');
        return;
      }
      const place = () => {
        const piece = board[selectedBoardSquare.row][selectedBoardSquare.col];
        board[selectedBoardSquare.row][selectedBoardSquare.col] = null;
        board[row][col] = piece;
        selectedBoardSquare = null;
        markDirty(`${turnName(piece)}${getPieceLabel(piece)}已摆放到第 ${row + 1} 行第 ${col + 1} 路。`);
        renderBoard();
      };
      if (currentPiece && event.detail !== 0) {
        // Defer replacement so a double-click can remove the destination piece instead.
        pendingPlacement = place;
        pendingPlacementTimer = setTimeout(flushPendingPlacement, 500);
      } else {
        place();
      }
      return;
    }
    updateEditorSelection();
    return;
  }
  if (selectedPalettePiece.toUpperCase() === 'K') {
    for (const rank of board) {
      for (let col = 0; col < rank.length; col += 1) if (rank[col] === selectedPalettePiece) rank[col] = null;
    }
  }
  board[row][col] = selectedPalettePiece;
  markDirty(`${turnName(selectedPalettePiece)}${getPieceLabel(selectedPalettePiece)}已放置。`);
  renderBoard();
}

function cancelPendingPlacement() {
  clearTimeout(pendingPlacementTimer);
  pendingPlacementTimer = undefined;
  pendingPlacement = undefined;
}

function flushPendingPlacement() {
  const place = pendingPlacement;
  cancelPendingPlacement();
  if (place) place();
}

function updateEditorSelection() {
  for (const square of boardElement.querySelectorAll('.gene-intersection')) {
    const row = Number(square.dataset.row);
    const col = Number(square.dataset.col);
    const selected = selectedBoardSquare?.row === row && selectedBoardSquare?.col === col;
    square.setAttribute('aria-selected', String(Boolean(selected)));
    square.classList.toggle('board-piece-selected', Boolean(selected));
    square.classList.toggle('palette-target', Boolean((selectedPalettePiece || selectedBoardSquare) && !board[row][col]));
  }
}

function removeEditorPiece(row, col) {
  const piece = board[row][col];
  if (!piece) return;
  cancelPendingPlacement();
  board[row][col] = null;
  selectedBoardSquare = null;
  selectedPalettePiece = null;
  renderPalette();
  markDirty(`已移除${turnName(piece)}${getPieceLabel(piece)}。`);
  renderBoard();
}

function handleBoardDoubleClick(event) {
  if (loadingPuzzle || mode !== 'manual' || recording) return;
  const square = event.target.closest('.gene-intersection');
  if (!square) return;
  removeEditorPiece(Number(square.dataset.row), Number(square.dataset.col));
}

function handleBoardKeyDown(event) {
  if (loadingPuzzle || mode !== 'manual' || recording || !['Delete', 'Backspace'].includes(event.key)) return;
  const square = event.target.closest('.gene-intersection');
  if (!square || !selectedBoardSquare
    || Number(square.dataset.row) !== selectedBoardSquare.row || Number(square.dataset.col) !== selectedBoardSquare.col) return;
  event.preventDefault();
  removeEditorPiece(selectedBoardSquare.row, selectedBoardSquare.col);
}

function selectPalettePiece(button) {
  cancelPendingPlacement();
  selectedBoardSquare = null;
  selectedPalettePiece = selectedPalettePiece === button.dataset.pieceCode ? null : button.dataset.pieceCode;
  renderPalette();
  setStatus(selectedPalettePiece ? `已选择${turnName(selectedPalettePiece)}${getPieceLabel(selectedPalettePiece)}，点击棋盘交叉点放置。` : '已取消棋子选择。', 'ready');
  renderBoard();
}

function toggleFirstMover() {
  turn = turn === RED ? BLACK : RED;
  firstMoverButton.textContent = `先手：${turn === RED ? '红方' : '黑方'}`;
  markDirty(`已切换为${turn === RED ? '红方' : '黑方'}先行。`);
  renderBoard();
}

function clearPosition() {
  invalidateMaterials();
  selectedSavedId = '';
  selectedPuzzleId = '';
  cancelEngine();
  audio.stop();
  puzzleLoadToken += 1;
  loadingPuzzle = false;
  selectedBoardSquare = null;
  board = Array.from({ length: 10 }, () => Array(9).fill(null));
  board[9][4] = 'K';
  board[0][4] = 'k';
  selectedPalettePiece = null;
  renderPalette();
  markDirty('棋盘已清空，仅保留红帅与黑将。');
  renderBoard();
}

function resetPosition() {
  stopRecording();
  cancelEngine();
  audio.stop();
  loadingPuzzle = false;
  puzzleLoadToken += 1;
  const position = parseFen(resetFen);
  board = position.board;
  turn = position.turn;
  game = createGame({ board, turn });
  gameOriginFen = resetFen;
  legalTargets = [];
  selectedBoardSquare = null;
  selectedPalettePiece = null;
  firstMoverButton.textContent = `先手：${turn === RED ? '红方' : '黑方'}`;
  renderPalette();
  renderBoard();
  setStatus('已恢复到载入时的局面与先手，未修改题库文件。', 'ready');
}

function validateBoard() {
  const count = Object.create(null);
  for (const row of board) {
    for (const piece of row) if (piece) count[piece] = (count[piece] || 0) + 1;
  }
  if (count.K !== 1 || count.k !== 1) throw new Error('棋局必须恰好有一枚红帅和一枚黑将。');
  const limits = { K: 1, A: 2, E: 2, H: 2, R: 2, C: 2, P: 5 };
  for (const [piece, maximum] of Object.entries(limits)) {
    if ((count[piece] || 0) > maximum || (count[piece.toLowerCase()] || 0) > maximum) {
      throw new Error(`${getPieceLabel(piece)}每方最多 ${maximum} 枚。`);
    }
  }
  const state = createGame({ board, turn });
  const fen = toFen(state);
  if (!/^.+ [wb] - - 0 1$/.test(fen)) throw new Error('局面 FEN 生成失败。');
  return { fen, counts: count, state };
}

async function checkPositionDuplicates(fen, excludeId = '') {
  if (!bankManifest) throw new Error('题库目录尚未载入。');
  const selectedId = selectedSavedId;
  const loadToken = puzzleLoadToken;
  const token = ++positionCheckToken;
  const results = document.getElementById('positionMatches');
  results.textContent = '正在检查局面…';
  const latestManifest = await loadPuzzleBank();
  const matches = await findPositionDuplicates(fen, latestManifest, async file => {
    const response = await fetch(`${PUZZLE_BANK_BASE}${file}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`读取 ${file} 失败 (${response.status})`);
    return response.text();
  }, excludeId);
  if (token !== positionCheckToken || loadingPuzzle || puzzleLoadToken !== loadToken
    || validateBoard().fen !== fen || selectedSavedId !== selectedId) {
    throw new Error('局面或已选棋局在检查期间发生变化，请重新检查。');
  }
  results.replaceChildren();
  const summary = document.createElement('p');
  summary.textContent = matches.length ? `找到 ${matches.length} 个相同或相似局面：` : '未发现相同或相似局面。';
  results.append(summary);
  for (const { category, item, exact } of matches) {
    const row = document.createElement('div');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `载入${exact ? '相同' : '行棋方不同'}棋局：${item.title} · ${item.id}`;
    button.addEventListener('click', () => loadSavedPuzzle(category, item));
    row.append(button);
    if (exact) {
      const replace = document.createElement('button');
      replace.type = 'button';
      replace.textContent = replacementTarget?.id === item.id ? '已选为替换对象' : '选为替换对象';
      replace.addEventListener('click', () => {
        replacementTarget = { id: item.id, title: item.title, fen };
        for (const other of results.querySelectorAll('[data-replace-id]')) {
          other.textContent = other.dataset.replaceId === item.id ? '已选为替换对象' : '选为替换对象';
        }
        setStatus(`已选择替换 ${item.id}；棋盘和输入内容不变。`, 'ready');
      });
      replace.dataset.replaceId = item.id;
      row.append(replace);
    }
    results.append(row);
  }
  results.scrollIntoView({ block: 'nearest' });
  return matches;
}

async function checkPosition() {
  flushPendingPlacement();
  let token = positionCheckToken;
  try {
    const pending = checkPositionDuplicates(validateBoard().fen);
    token = positionCheckToken;
    const matches = await pending;
    setStatus(`局面检查完成：找到 ${matches.length} 个相同或相似局面。`, 'success');
  } catch (error) {
    if (token !== positionCheckToken) return;
    document.getElementById('positionMatches').textContent = `查重失败：${error.message}`;
    setStatus(`局面查重失败：${error.message}`, 'error');
  }
}

async function savePuzzle() {
  flushPendingPlacement();
  setBusy(true);
  try {
    await savePuzzleWhileBusy();
  } finally {
    setBusy(false);
  }
}

async function savePuzzleWhileBusy() {
  cancelEngine();
  audio.stop();
  renderBoard();
  let position;
  try { position = validateBoard(); }
  catch (error) { setStatus(error.message, 'error'); return; }
  const nameInput = geneName.value.trim();
  let name;
  try { name = parsePuzzleName(nameInput, TYPES[geneType.value].prefix, geneLevel.value, materialPuzzle?.title); }
  catch (error) { setStatus(error.message, 'error'); return; }
  const { title } = name;
  let classification;
  try { classification = selectedClassification(); }
  catch (error) { setStatus(error.message, 'error'); return; }
  let confirmedDuplicateIds = [];
  try {
    if (!await loadCustomBank()) throw new Error('无法刷新题库目录。');
    if (replacementTarget) {
      if (replacementTarget.fen !== position.fen) throw new Error('局面已改变，请重新检查并选择替换对象。');
      if (!/^[\p{L}\p{N}]+$/u.test(title)) throw new Error('新棋局名称只能包含文字和数字。');
      const target = replacementTarget;
      const id = name.id || await nextPuzzleId(title);
      const matches = await checkPositionDuplicates(position.fen);
      if (!matches.some(match => match.exact && match.item.id === target.id && match.item.title === target.title)) {
        throw new Error('替换对象已变化，请重新检查。');
      }
      if (validateBoard().fen !== position.fen || geneName.value.trim() !== nameInput) {
        throw new Error('局面或名称在检查期间发生变化，请重新保存。');
      }
      if (!window.confirm(`用 ${id} 替换 ${target.id}？\n棋谱、解说和原文件将保留，其他相同局面不会删除。`)) return;
      const response = await fetch('http://localhost:8787/api/v1/chinese-chess/root-gene/replace', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, fen: position.fen, replaceId: target.id, expectedTitle: target.title, ...classification })
      });
      const result = await readServiceResponse(response, '替换失败');
      replacementTarget = null;
      resetFen = position.fen;
      if (!await loadCustomBank()) {
        setStatus(`已替换为 ${result.id}，但目录刷新失败，请刷新页面。`, 'warning');
        return;
      }
      const category = bankManifest.categories.find(entry => entry.items.some(item => item.id === result.id));
      const item = category?.items.find(entry => entry.id === result.id);
      if (!item) throw new Error(`替换已保存，但目录未找到 ${result.id}，请刷新页面。`);
      await loadSavedPuzzle(category, item);
      setStatus(`已用 ${result.id} 替换 ${result.replacedId}，并按分类和级别加入专题。`, 'success');
      return;
    }
    if (selectedPuzzleId && materialPuzzle && !selectedSavedId) {
      if (title !== materialPuzzle.title || (name.id && name.id !== selectedPuzzleId) || position.fen !== materialFen
        || getCoursePuzzleLevel(materialPuzzle) !== geneLevel.value) {
        throw new Error('原题局面、名称或级别的更新暂不支持；原题未修改。');
      }
      if (!window.confirm(`保存 ${selectedPuzzleId} 的分类？原局面和棋谱不会修改。`)) return;
      const response = await fetch(`http://localhost:8787/api/v1/chinese-chess/root-gene/puzzle/${encodeURIComponent(selectedPuzzleId)}/classification`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(classification)
      });
      await readServiceResponse(response, '保存分类失败');
      Object.assign(materialPuzzle, classification);
      if (await loadCustomBank()) setStatus(`已保存 ${selectedPuzzleId} 的分类。`, 'success');
      return;
    }
    const sameCustom = selectedSavedId && materialPuzzle?.title === title
      && selectedSavedId.startsWith(`${TYPES[geneType.value].prefix}_`)
      && selectedSavedId.includes(`_${geneLevel.value}-`)
      && (!name.id || name.id === selectedSavedId);
    if (!sameCustom && !/^[\p{L}\p{N}]+$/u.test(title)) throw new Error('新棋局名称只能包含文字和数字。');
    if (selectedSavedId && !sameCustom
      && !window.confirm('名称、类型或级别已更改，将另存为新棋局，原棋局保持不变。确定继续吗？')) return;
    const id = sameCustom ? selectedSavedId : name.id || await nextPuzzleId(title);
    if (!sameCustom && bankManifest.categories.some(category => category.items.some(item => item.id === id))) {
      throw new Error(`编号 ${id} 已存在，请更换序号或载入原棋局。`);
    }
    if (sameCustom && position.fen !== materialFen
      && (materialPuzzle.solutions?.length || materialPuzzle.explanations?.length)
      && !window.confirm('修改局面会删除此手工棋局的旧棋谱和解说，请先备份。确定继续吗？')) return;
    const matches = await checkPositionDuplicates(position.fen, selectedSavedId === id ? id : '');
    if (validateBoard().fen !== position.fen || geneName.value.trim() !== nameInput) {
      throw new Error('局面或名称在检查期间发生变化，请重新保存。');
    }
    if (matches.some(match => match.exact)
      && !window.confirm('题库中已有相同局面。请先查看匹配结果；确定仍要保存吗？')) return;
    confirmedDuplicateIds = matches.filter(match => match.exact).map(match => match.item.id);
    setStatus('正在保存到中国象棋题库…', 'ready');
    const response = await fetch('http://localhost:8787/api/v1/chinese-chess/root-gene/puzzle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, fen: position.fen, updateExisting: Boolean(sameCustom), confirmedDuplicateIds, ...classification })
    });
    const result = await readServiceResponse(response, '保存棋局失败');
    selectedSavedId = result.id;
    selectedPuzzleId = result.id;
    materialPuzzle = { ...result.item, id: result.id, rootGene: 'manual' };
    for (const key of ['solutions', 'explanations']) materialPuzzle[key] = (result.item[key] || []).map(file => `endgame/L1/${file}`);
    materialFen = position.fen;
    resetFen = position.fen;
    stopRecording();
    game = createGame({ board, turn });
    gameOriginFen = position.fen;
    if (!await loadCustomBank()) {
      setStatus(`已保存 ${result.id}，但目录刷新失败，请刷新页面。`, 'warning');
      return;
    }
    setStatus(`已保存：${result.id} · 已按分类和级别加入专题。`, 'success');
    updateMaterialVersions();
  } catch (error) {
    setStatus(`未保存：${error.message || '无法连接本地题库服务。'}`, 'error');
  }
}

async function nextPuzzleId(title) {
  const stem = `${TYPES[geneType.value].prefix}_${title}_${geneLevel.value}-`;
  const response = await fetch('http://localhost:8787/api/v1/chinese-chess/root-gene/next-id', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stem })
  });
  const result = await readServiceResponse(response, '无法生成编号');
  return result.id;
}

async function loadCustomBank() {
  try {
    bankManifest = await loadPuzzleBank();
    renderDirectory();
    return true;
  } catch (error) {
    setStatus(error.message || '题库清单载入失败。', 'error');
    document.getElementById('bankSummary').textContent = error.message;
    return false;
  }
}

async function loadSavedPuzzle(category, item) {
  if (toFen(createGame({ board, turn })) !== resetFen
    && !window.confirm(`载入 ${item.title || item.id} 将替换当前棋盘，未保存的局面会丢失。确定继续吗？`)) return;
  positionCheckToken += 1;
  replacementTarget = null;
  document.getElementById('positionMatches').replaceChildren();
  invalidateMaterials();
  cancelEngine();
  audio.stop();
  loadingPuzzle = true;
  renderBoard();
  const token = ++puzzleLoadToken;
  try {
    const response = await fetch(`${PUZZLE_BANK_BASE}${item.fen}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('局面文件载入失败。');
    const position = parseFen(await response.text());
    if (token !== puzzleLoadToken) return;
    board = position.board;
    turn = position.turn;
    game = createGame({ board, turn });
    gameOriginFen = toFen(game);
    legalTargets = [];
    resetFen = toFen(createGame({ board, turn }));
    materialFen = resetFen;
    materialPuzzle = item;
    selectedBoardSquare = null;
    selectedPuzzleId = item.id;
    if (TYPES[category.family]) geneType.value = category.family;
    const level = getCoursePuzzleLevel(item, category.level);
    geneLevel.value = /^L[1-3]$/.test(level) ? level : 'L1';
    selectedSavedId = item.rootGene === 'manual' ? item.id : '';
    const primary = item.classifications?.[0] || inferClassification(category, item);
    if (primary) geneType.value = primary.family;
    populateGroups(primary?.group);
    populateCategories(primary?.category);
    populateRelatedCategories(item.classifications?.slice(1) || []);
    geneName.value = item.title;
    updateNameFormat();
    firstMoverButton.textContent = `先手：${turn === RED ? '红方' : '黑方'}`;
    selectedPalettePiece = null;
    renderPalette();
    renderBoard();
    renderDirectory();
    setStatus(`已载入 ${item.title || item.id}。${!/^L[1-3]$/.test(level) ? '原题未分级；另存时使用左侧所选级别。' : ''}`, 'success');
    updateMaterialVersions();
    await loadMaterials(0);
  } catch (error) {
    if (token !== puzzleLoadToken) return;
    setStatus(error.message || '局面载入失败。', 'error');
  } finally {
    if (token === puzzleLoadToken) {
      loadingPuzzle = false;
      renderBoard();
    }
  }
}

function renderPalette() {
  for (const button of document.querySelectorAll('[data-palette-side]')) {
    button.setAttribute('aria-pressed', String(button.dataset.paletteSide === paletteSide));
  }
  for (const button of paletteButtons) {
    const code = paletteSide === RED ? button.dataset.pieceType : button.dataset.pieceType.toLowerCase();
    button.dataset.pieceCode = code;
    button.setAttribute('aria-label', `${turnName(code)}${getPieceLabel(code)}`);
    button.setAttribute('aria-pressed', String(code === selectedPalettePiece));
    button.classList.toggle('active', code === selectedPalettePiece);
    button.replaceChildren(createStandardPieceElement(code, getPieceLabel(code)));
  }
}

function updateNameFormat() {
  document.getElementById('nameFormat').textContent = `编号：${TYPES[geneType.value].prefix}_名称_${geneLevel.value}-序号；${geneLevel.value === 'L1' ? '动态观察' : '操作练习'}`;
}

function changeGeneSelection() {
  updateNameFormat();
}

function renderDirectory() {
  if (!bankManifest) return;
  const manifest = {
    ...bankManifest,
    categories: bankManifest.categories.filter(category => TYPES[category.family] || category.family === 'opening')
  };
  bankTree.replaceChildren();
  renderPuzzleBank(bankTree, manifest, bankSearch.value.trim().toLocaleLowerCase(), selectedPuzzleId, loadSavedPuzzle);
  document.getElementById('bankSummary').textContent = `${manifest.categories.reduce((total, category) => total + category.items.length, 0)} 个棋局 · 点击目录载入`;
}

function markDirty(message) {
  stopRecording();
  positionCheckToken += 1;
  replacementTarget = null;
  document.getElementById('positionMatches').replaceChildren();
  game = createGame({ board, turn });
  gameOriginFen = toFen(game);
  legalTargets = [];
  setStatus(message, 'ready');
}

function turnName(piece) {
  return piece === piece.toUpperCase() ? '红方' : '黑方';
}

function setStatus(message, state = '') {
  statusText.textContent = message;
  statusText.dataset.state = state;
}

function setBusy(busy) {
  document.querySelectorAll('#savePositionButton, #rootGeneFooterSave').forEach(button => { button.disabled = busy; });
  document.querySelector('.rootgene-workspace').inert = busy;
}

function cancelEngine() {
  engineToken += 1;
  engineAbort?.abort();
  engineAbort = null;
  clearTimeout(engineTimer);
  engineThinking = false;
  running = false;
  panel.setPlaying(false);
}

function clearSelection() {
  selectedBoardSquare = null;
  selectedPalettePiece = null;
  legalTargets = [];
  renderPalette();
}

function switchMode(value) {
  cancelEngine();
  audio.stop();
  mode = value;
  humanSide = panel.getSide() === 'red' ? RED : BLACK;
  clearSelection();
  panel.setMode(mode);
  running = mode === 'human-ai';
  renderPlayStatus();
  continueEngine();
}

function handleControl(action) {
  if (action === 'reset') {
    resetPosition();
  } else if (action === 'play') {
    if (running) cancelEngine();
    else running = mode !== 'manual';
    renderPlayStatus();
    continueEngine();
  } else if (action === 'undo' || action === 'redo') {
    cancelEngine();
    audio.stop();
    const changed = action === 'undo' ? undoMove(game) : redoMove(game);
    clearSelection();
    syncGame();
    renderPlayStatus();
    if (changed && action === 'redo') audio.move(game);
  } else if (action === 'side') {
    cancelEngine();
    audio.stop();
    humanSide = panel.getSide() === 'red' ? RED : BLACK;
    clearSelection();
    running = mode === 'human-ai';
    renderPlayStatus();
    continueEngine();
  }
}

function syncGame() {
  board = game.board;
  turn = game.turn;
  firstMoverButton.textContent = `先手：${turn === RED ? '红方' : '黑方'}`;
}

function renderPlayStatus() {
  renderBoard();
  const label = { manual: recording ? '手动记录' : '手动摆子', 'human-ai': '人机对弈', 'ai-ai': 'AI-AI' }[mode];
  const feedback = mode === 'manual' && !recording ? '' : getLessonMoveFeedback(game).text;
  setStatus(`${label} · ${turn === RED ? '红方' : '黑方'}走棋 · ${feedback || (engineThinking ? '引擎思考中…' : mode === 'manual' ? '点击棋子后选择摆放位置' : running ? '保留当前局面' : '已暂停，点击播放继续')}`, 'ready');
}

function handlePlaySquare(point) {
  if (engineThinking || mode === 'ai-ai' || (mode === 'human-ai' && game.turn !== humanSide)
    || ['checkmate', 'stalemate', 'invalid'].includes(getGameStatus(game).type)) return;
  if (selectedBoardSquare && legalTargets.some(target => target.row === point.row && target.col === point.col)) {
    if (!makeMove(game, selectedBoardSquare, point)) {
      setStatus('当前着法不合法。', 'warning');
      return;
    }
    clearSelection();
    syncGame();
    running = true;
    renderPlayStatus();
    audio.move(game);
    continueEngine();
    return;
  }
  const piece = board[point.row][point.col];
  const sameSquare = selectedBoardSquare?.row === point.row && selectedBoardSquare?.col === point.col;
  selectedBoardSquare = !sameSquare && piece && (piece === piece.toUpperCase() ? RED : BLACK) === game.turn ? point : null;
  legalTargets = selectedBoardSquare ? getLegalMoves(game, point) : [];
  renderPlayStatus();
}

function continueEngine() {
  if (loadingPuzzle || mode === 'manual' || !running || engineThinking
    || (mode === 'human-ai' && game.turn === humanSide)) return;
  if (['checkmate', 'stalemate', 'invalid'].includes(getGameStatus(game).type)) {
    running = false;
    renderPlayStatus();
    return;
  }
  requestEngineMove();
}

async function requestEngineMove() {
  const token = ++engineToken;
  engineAbort = new AbortController();
  engineThinking = true;
  renderPlayStatus();
  try {
    const response = await fetch('http://localhost:8787/api/v1/chinese-chess/engine/ai-ai/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: engineAbort.signal,
      body: JSON.stringify({ fen: toFen(game), side: game.turn, settings: { threads: 1, hash: 128, depth: 12, movetime: 1000, multiPv: 1 } })
    });
    const result = await response.json();
    if (token !== engineToken) return;
    if (!response.ok) throw new Error(result.error || `引擎请求失败 (${response.status})`);
    if (!result.move || !makeMove(game, result.move.from, result.move.to)) throw new Error('引擎返回了无法应用的着法。');
    engineThinking = false;
    clearSelection();
    syncGame();
    renderPlayStatus();
    audio.move(game);
    engineTimer = setTimeout(continueEngine, 2600 - panel.getSpeed() * 200);
  } catch (error) {
    if (token !== engineToken) return;
    cancelEngine();
    renderPlayStatus();
    setStatus(`引擎不可用：${error.message}。请启动本地服务（8787），点击播放重试；当前局面已保留。`, 'error');
  } finally {
    if (token === engineToken) engineAbort = null;
  }
}

window.addEventListener('pagehide', cancelEngine);

function stopRecording() {
  recording = false;
  recordButton.textContent = '开始记录';
  recordButton.classList.remove('recording');
}

function invalidateMaterials() {
  materialToken += 1;
  stopRecording();
  materialPuzzle = null;
  materialFen = '';
  solutionText.value = '';
  explanationText.value = '';
  solutionVariant.replaceChildren(new Option('暂无答案', ''));
  document.getElementById('solutionVersion').value = '1';
  document.getElementById('explanationVersion').value = '1';
  solutionStatus.textContent = '先保存局面，再保存配套棋谱。';
  explanationStatus.textContent = '请编辑当前局面的解说。';
  audio.refresh();
}

function toggleRecording() {
  cancelEngine();
  audio.stop();
  if (recording) {
    stopRecording();
    solutionStatus.textContent = '记录已结束，可保存棋谱。';
    renderBoard();
    return;
  }
  recordingFen = toFen(game);
  if (!materialPuzzle || recordingFen !== materialFen) {
    solutionStatus.textContent = '请先保存当前起始局面，或重置到已载入的起始局面，再开始记录。';
    return;
  }
  recordingStart = game.history.length;
  recording = true;
  clearSelection();
  solutionText.value = '';
  recordButton.textContent = '结束记录';
  recordButton.classList.add('recording');
  solutionStatus.textContent = '正在记录：手动走棋，或切换人机／AI-AI 后点击播放。';
  renderBoard();
}

function updateRecording() {
  try {
    solutionText.value = formatRecordedNotation(recordingFen, game.history.slice(recordingStart));
    solutionStatus.textContent = `已记录 ${game.history.length - recordingStart} 着；AI-AI 点击播放求解，结束后保存。`;
  } catch (error) {
    stopRecording();
    cancelEngine();
    solutionStatus.textContent = `记录失败：${error.message} 请调整或手工输入可识别棋谱。`;
  }
}

function updateMaterialVersions() {
  solutionVariant.replaceChildren();
  for (const [index, file] of (materialPuzzle?.solutions || []).entries()) {
    solutionVariant.append(new Option(`答案 ${file.match(/-(\d{3})\.txt$/)?.[1] || index + 1}`, String(index)));
  }
  if (!solutionVariant.options.length) solutionVariant.append(new Option('暂无答案', ''));
  for (const kind of ['solution', 'explanation']) {
    const files = materialPuzzle?.[kind === 'solution' ? 'solutions' : 'explanations'] || [];
    const next = Math.max(0, ...files.map(file => Number(file.match(/(?:-|_exp-)(\d{3})\.txt$/)?.[1] || 1))) + 1;
    document.getElementById(`${kind}Version`).value = String(next);
  }
}

async function loadMaterials(index) {
  const token = ++materialToken;
  const puzzle = materialPuzzle;
  if (!puzzle) return;
  stopRecording();
  audio.stop();
  renderBoard();
  await Promise.all(['solution', 'explanation'].map(async kind => {
    const editor = kind === 'solution' ? solutionText : explanationText;
    const status = kind === 'solution' ? solutionStatus : explanationStatus;
    const file = kind === 'solution' ? puzzle.solutions?.[index] : pairedExplanation(puzzle, index);
    editor.value = '';
    if (!file) { status.textContent = `暂无${kind === 'solution' ? '答案' : '解说'}，可导入或编辑。`; return; }
    try {
      const response = await fetch(`${PUZZLE_BANK_BASE}${file}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`文件载入失败 (${response.status})`);
      const text = await response.text();
      if (token !== materialToken) return;
      editor.value = text;
      status.textContent = '已载入题库材料。';
      audio.refresh();
    } catch (error) {
      if (token === materialToken) status.textContent = error.message;
    }
  }));
  if (token === materialToken) audio.refresh();
}

async function saveMaterial(kind) {
  cancelEngine();
  if (recording) updateRecording();
  stopRecording();
  renderBoard();
  const status = kind === 'solution' ? solutionStatus : explanationStatus;
  const text = (kind === 'solution' ? solutionText : explanationText).value.trim();
  if (!text) { status.textContent = '保存内容不能为空。'; return; }
  if (!materialPuzzle || materialPuzzle.rootGene !== 'manual' || selectedSavedId !== materialPuzzle.id) {
    status.textContent = '请先将当前局面存储为手工棋局，原题库文件不允许覆盖。';
    return;
  }
  if (gameOriginFen !== materialFen) { status.textContent = '局面已编辑，请先保存新局面后再保存材料。'; return; }
  const version = Number(document.getElementById(`${kind}Version`).value);
  if (!Number.isInteger(version) || version < 1 || version > 999) { status.textContent = '版本号须为 1–999 的整数。'; return; }
  if (kind === 'solution') {
    try { buildNotationPlayback(materialFen, text); }
    catch (error) { status.textContent = `棋谱校验失败：${error.message}`; return; }
  }
  const puzzle = materialPuzzle;
  const token = materialToken;
  const button = document.getElementById(kind === 'solution' ? 'saveSolutionButton' : 'saveExplanationButton');
  button.disabled = true;
  try {
    const response = await fetch(`http://localhost:8787/api/v1/chinese-chess/root-gene/puzzle/${encodeURIComponent(puzzle.id)}/material`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, version, text })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '保存失败。');
    if (token !== materialToken) return;
    const files = puzzle[kind === 'solution' ? 'solutions' : 'explanations'] ||= [];
    const path = `endgame/L1/${result.relativePath}`;
    if (!files.includes(path)) files.push(path);
    files.sort();
    updateMaterialVersions();
    status.textContent = `已保存${kind === 'solution' ? '棋谱' : '解说'}版本 ${String(version).padStart(3, '0')} 到题库。`;
    await loadCustomBank();
  } catch (error) {
    if (token === materialToken) status.textContent = `保存失败：${error.message}；编辑内容已保留，请重试。`;
  } finally { button.disabled = false; }
}
