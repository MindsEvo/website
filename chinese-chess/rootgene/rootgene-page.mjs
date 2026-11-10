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

applyBoardStyle();
onBoardStyleChange(() => {});

const boardElement = document.getElementById('geneBoard');
const statusText = document.getElementById('rootGeneStatus');
const geneName = document.getElementById('geneName');
const geneList = document.getElementById('geneList');
const paletteButtons = [...document.querySelectorAll('.piece-palette-item')];
const eraseButton = document.getElementById('eraseTool');
const firstMoverButton = document.getElementById('firstMoverButton');
const rootStatus = document.querySelector('.rootgene-status');
const rootSaveButton = document.getElementById('rootGeneFooterSave');
const geneType = document.getElementById('geneType');
const geneLevel = document.getElementById('geneLevel');
const bankTree = document.getElementById('bankTree');
const bankSearch = document.getElementById('bankSearch');
const TYPES = { endgame: { prefix: 'eg', label: '残局基础' }, attacking: { prefix: 'at', label: '基本攻杀' }, tactics: { prefix: 'tac', label: '基本战术' } };
const CUSTOM_ID = /^(eg|at|tac)_CUSTOM_(L[1-3])-\d{3}$/;

let board = createInitialBoard();
let turn = RED;
let selectedPalettePiece = null;
let eraseMode = false;
let selectedSavedId = '';
let selectedPuzzleId = '';
let bankManifest = null;
let paletteSide = RED;
let puzzleLoadToken = 0;
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
paletteButtons.forEach(button => button.addEventListener('click', () => selectPalettePiece(button)));
eraseButton.addEventListener('click', toggleEraseMode);
firstMoverButton.addEventListener('click', toggleFirstMover);
document.getElementById('geneNameCheck').addEventListener('click', checkGeneName);
document.getElementById('savePositionButton').addEventListener('click', savePuzzle);
rootSaveButton.addEventListener('click', savePuzzle);
document.getElementById('generatePositionButton').addEventListener('click', generatePosition);
document.getElementById('clearPositionButton').addEventListener('click', clearPosition);
document.getElementById('geneDeleteButton').addEventListener('click', deleteSelectedPuzzle);
geneName.addEventListener('input', () => {
  if (geneName.value.trim() !== selectedSavedId) selectedSavedId = '';
});
for (const button of document.querySelectorAll('[data-palette-side]')) {
  button.addEventListener('click', () => {
    paletteSide = button.dataset.paletteSide;
    selectedBoardSquare = null;
    if (selectedPalettePiece) selectedPalettePiece = paletteSide === RED ? selectedPalettePiece.toUpperCase() : selectedPalettePiece.toLowerCase();
    renderPalette();
    renderBoard();
  });
}
geneType.addEventListener('change', changeGeneSelection);
geneLevel.addEventListener('change', changeGeneSelection);
bankSearch.addEventListener('input', renderDirectory);

renderPalette();
updateNameFormat();
renderBoard();
loadCustomBank();

function renderBoard() {
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
      if (mode === 'manual' && !recording && (selectedPalettePiece || selectedBoardSquare) && !piece && !eraseMode) square.classList.add('palette-target');
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
  updatePieceCounts();
  panel.controls.play.disabled = mode === 'manual' || Boolean(finished) || loadingPuzzle;
  panel.controls.undo.disabled = !game.history.length || engineThinking || loadingPuzzle;
  panel.controls.redo.disabled = !game.redoStack.length || engineThinking || loadingPuzzle;
  panel.setPlaying(running);
  for (const button of [...paletteButtons, eraseButton, firstMoverButton, ...document.querySelectorAll('[data-palette-side]')]) {
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
  const currentPiece = board[row][col];

  if (eraseMode) {
    if (!currentPiece) return;
    if (currentPiece.toUpperCase() === 'K') {
      setStatus('红帅和黑将各保留一枚，不能用橡皮擦移除。', 'warning');
      return;
    }
    board[row][col] = null;
    markDirty(`已移除${getPieceLabel(currentPiece)}。`);
    renderBoard();
    return;
  }

  if (!selectedPalettePiece) {
    if (!selectedBoardSquare) {
      if (!currentPiece) {
        setStatus('请先点击棋盘上的棋子，或从左侧棋子面板选择棋子。', 'warning');
        return;
      }
      selectedBoardSquare = { row, col };
      setStatus(`已选择${turnName(currentPiece)}${getPieceLabel(currentPiece)}，点击目标位置摆放；再次点击取消。`, 'ready');
    } else if (selectedBoardSquare.row === row && selectedBoardSquare.col === col) {
      selectedBoardSquare = null;
      setStatus('已取消棋子选择。', 'ready');
    } else {
      if (currentPiece?.toUpperCase() === 'K') {
        setStatus('不能覆盖将帅，请选择其它位置；移动将帅时请先选中将帅。', 'warning');
        return;
      }
      const piece = board[selectedBoardSquare.row][selectedBoardSquare.col];
      board[selectedBoardSquare.row][selectedBoardSquare.col] = null;
      board[row][col] = piece;
      selectedBoardSquare = null;
      markDirty(`${turnName(piece)}${getPieceLabel(piece)}已摆放到第 ${row + 1} 行第 ${col + 1} 路。`);
    }
    renderBoard();
    return;
  }
  if (currentPiece?.toUpperCase() === 'K' && currentPiece !== selectedPalettePiece) {
    setStatus('红帅和黑将固定保留，不能被其它棋子覆盖。', 'warning');
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

function selectPalettePiece(button) {
  selectedBoardSquare = null;
  eraseMode = false;
  eraseButton.setAttribute('aria-pressed', 'false');
  selectedPalettePiece = selectedPalettePiece === button.dataset.pieceCode ? null : button.dataset.pieceCode;
  renderPalette();
  setStatus(selectedPalettePiece ? `已选择${turnName(selectedPalettePiece)}${getPieceLabel(selectedPalettePiece)}，点击棋盘交叉点放置。` : '已取消棋子选择。', 'ready');
  renderBoard();
}

function toggleEraseMode() {
  selectedBoardSquare = null;
  eraseMode = !eraseMode;
  selectedPalettePiece = null;
  renderPalette();
  eraseButton.setAttribute('aria-pressed', String(eraseMode));
  setStatus(eraseMode ? '橡皮擦已启用，点击棋子移除。红帅和黑将会保留。' : '橡皮擦已关闭。', eraseMode ? 'ready' : '');
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
  cancelEngine();
  audio.stop();
  puzzleLoadToken += 1;
  loadingPuzzle = false;
  selectedBoardSquare = null;
  board = Array.from({ length: 10 }, () => Array(9).fill(null));
  board[9][4] = 'K';
  board[0][4] = 'k';
  selectedPalettePiece = null;
  eraseMode = false;
  eraseButton.setAttribute('aria-pressed', 'false');
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
  eraseMode = false;
  eraseButton.setAttribute('aria-pressed', 'false');
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

function generatePosition() {
  try {
    const result = validateBoard();
    setStatus('局面检查通过，FEN 与棋子配置已更新。', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function savePuzzle() {
  cancelEngine();
  audio.stop();
  renderBoard();
  let position;
  try { position = validateBoard(); }
  catch (error) { setStatus(error.message, 'error'); return; }
  const id = geneName.value.trim();
  const validation = validateGeneName(id);
  if (!validation.ok) {
    setStatus(validation.message, 'error');
    return;
  }
  const title = `手工${TYPES[geneType.value].label} ${id.slice(-3)}`;
  setBusy(true);
  setStatus('正在保存到中国象棋题库…', 'ready');
  try {
    const response = await fetch('http://localhost:8787/api/v1/chinese-chess/root-gene/puzzle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, fen: position.fen, updateExisting: selectedSavedId === id })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '保存棋局失败。');
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
    setStatus(`已保存：${result.id} · 可在右侧目录及对弈页题库加载。`, 'success');
    updateMaterialVersions();
  } catch (error) {
    setStatus(error.message || '无法连接本地题库服务。', 'error');
  } finally {
    setBusy(false);
  }
}

function validateGeneName(value) {
  const prefix = `${TYPES[geneType.value].prefix}_CUSTOM_${geneLevel.value}-`;
  if (!CUSTOM_ID.test(value) || !value.startsWith(prefix)) return { ok: false, message: `编号必须符合 ${prefix}001 格式，与当前类型和级别一致。` };
  const exists = bankManifest?.categories.some(category => category.items.some(item => item.id === value));
  if (exists && value !== selectedSavedId) return { ok: false, message: '该编号已存在，请使用下一个三位序号。' };
  return { ok: true, message: '编号格式正确。' };
}

async function checkGeneName() {
  const result = validateGeneName(geneName.value.trim());
  setStatus(result.message, result.ok ? 'success' : 'error');
}

async function loadCustomBank() {
  try {
    bankManifest = await loadPuzzleBank();
    renderSavedPuzzles();
    renderDirectory();
    return true;
  } catch (error) {
    setStatus(error.message || '题库清单载入失败。', 'error');
    document.getElementById('bankSummary').textContent = error.message;
    return false;
  }
}

function renderSavedPuzzles() {
  const categories = bankManifest?.categories.filter(category => category.family === geneType.value && category.level === geneLevel.value) || [];
  const items = categories.flatMap(category => category.items.filter(item => CUSTOM_ID.test(item.id)).map(item => ({ category, item })));
  geneList.replaceChildren();
  for (const { category, item } of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `gene-list-item${item.id === selectedSavedId ? ' active' : ''}`;
    button.textContent = item.title || item.id;
    button.title = item.id;
    button.addEventListener('click', () => loadSavedPuzzle(category, item));
    geneList.append(button);
  }
  const next = Math.max(0, ...items.map(({ item }) => Number(item.id.slice(-3)))) + 1;
  if (!selectedSavedId && !geneName.value.trim()) {
    geneName.value = next <= 999 ? `${TYPES[geneType.value].prefix}_CUSTOM_${geneLevel.value}-${String(next).padStart(3, '0')}` : '';
    if (next > 999) setStatus('当前类型和级别的三位序号已用完。', 'warning');
  }
  document.getElementById('geneDeleteButton').disabled = !selectedSavedId;
}

async function loadSavedPuzzle(category, item) {
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
    geneType.value = category.family;
    geneLevel.value = /^L[1-3]$/.test(category.level) ? category.level : 'L1';
    selectedSavedId = CUSTOM_ID.test(item.id) ? item.id : '';
    geneName.value = selectedSavedId;
    updateNameFormat();
    firstMoverButton.textContent = `先手：${turn === RED ? '红方' : '黑方'}`;
    selectedPalettePiece = null;
    eraseMode = false;
    eraseButton.setAttribute('aria-pressed', 'false');
    renderPalette();
    renderBoard();
    renderSavedPuzzles();
    renderDirectory();
    setStatus(`已载入 ${item.title || item.id}。${category.level === 'ungraded' ? '原题未分级；另存时使用左侧所选级别。' : ''}`, 'success');
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

async function deleteSelectedPuzzle() {
  const id = selectedSavedId;
  if (!CUSTOM_ID.test(id)) {
    setStatus('先从列表选择已保存的手工棋局。', 'warning');
    return;
  }
  if (!window.confirm(`删除手工棋局 ${id} 及其答案/解说文件？`)) return;
  try {
    const response = await fetch(`http://localhost:8787/api/v1/chinese-chess/root-gene/puzzle/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '删除失败。');
    selectedSavedId = '';
    selectedPuzzleId = '';
    geneName.value = '';
    if (await loadCustomBank()) setStatus(`已删除 ${id}。`, 'success');
  } catch (error) { setStatus(error.message || '无法连接本地题库服务。', 'error'); }
}

function updatePieceCounts() {
  paletteButtons.forEach(button => {
    const code = button.dataset.pieceCode;
    const count = board.reduce((total, row) => total + row.filter(piece => piece === code).length, 0);
    button.querySelector('output').textContent = String(count);
  });
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
    const count = document.createElement('output');
    button.replaceChildren(createStandardPieceElement(code, getPieceLabel(code)), count);
  }
  updatePieceCounts();
}

function updateNameFormat() {
  const example = `${TYPES[geneType.value].prefix}_CUSTOM_${geneLevel.value}-001`;
  geneName.placeholder = `编号格式：${example}`;
  document.getElementById('nameFormat').textContent = `编号格式：${example}`;
}

function changeGeneSelection() {
  selectedSavedId = '';
  geneName.value = '';
  updateNameFormat();
  renderSavedPuzzles();
}

function renderDirectory() {
  if (!bankManifest) return;
  const manifest = { ...bankManifest, categories: bankManifest.categories.filter(category => TYPES[category.family]) };
  bankTree.replaceChildren();
  renderPuzzleBank(bankTree, manifest, bankSearch.value.trim().toLocaleLowerCase(), selectedPuzzleId, loadSavedPuzzle);
  document.getElementById('bankSummary').textContent = `${manifest.categories.reduce((total, category) => total + category.items.length, 0)} 个棋局 · 点击目录载入`;
}

function markDirty(message) {
  stopRecording();
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
  rootStatus.dataset.state = state;
  rootStatus.querySelector('i').style.background = state === 'error' ? '#d94a42' : state === 'success' ? '#2bb56c' : '#e5a528';
  rootStatus.lastChild.textContent = state === 'error' ? '需要处理' : state === 'success' ? '操作完成' : '编辑中';
}

function setBusy(busy) {
  document.querySelectorAll('#savePositionButton, #rootGeneFooterSave, #generatePositionButton').forEach(button => { button.disabled = busy; });
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
  eraseMode = false;
  eraseButton.setAttribute('aria-pressed', 'false');
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
  if (!materialPuzzle || !CUSTOM_ID.test(materialPuzzle.id) || selectedSavedId !== materialPuzzle.id) {
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
