import { BLACK, RED, createGame, createInitialBoard, getGameStatus, getPieceLabel, toFen } from '../core.mjs';
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
const currentFen = document.getElementById('currentFen');
const statusText = document.getElementById('rootGeneStatus');
const jsonPreview = document.getElementById('geneJson');
const geneName = document.getElementById('geneName');
const geneList = document.getElementById('geneList');
const paletteButtons = [...document.querySelectorAll('.piece-palette-item')];
const eraseButton = document.getElementById('eraseTool');
const firstMoverButton = document.getElementById('firstMoverButton');
const rootStatus = document.querySelector('.rootgene-status');
const rootSaveButton = document.getElementById('rootGeneFooterSave');

let board = createInitialBoard();
let turn = RED;
let selectedPalettePiece = null;
let eraseMode = false;
let currentId = '';
let selectedSavedId = '';
let bankManifest = null;
let isDirty = true;

boardElement.addEventListener('click', handleBoardClick);
paletteButtons.forEach(button => button.addEventListener('click', () => selectPalettePiece(button)));
eraseButton.addEventListener('click', toggleEraseMode);
firstMoverButton.addEventListener('click', toggleFirstMover);
document.getElementById('geneNameCheck').addEventListener('click', checkGeneName);
document.getElementById('savePositionButton').addEventListener('click', savePuzzle);
rootSaveButton.addEventListener('click', savePuzzle);
document.getElementById('generatePositionButton').addEventListener('click', generatePosition);
document.getElementById('testPositionButton').addEventListener('click', testPositionWithEngine);
document.getElementById('validatePositionButton').addEventListener('click', validateCurrentPosition);
document.getElementById('clearPositionButton').addEventListener('click', clearPosition);
document.getElementById('geneDeleteButton').addEventListener('click', deleteSelectedPuzzle);
geneName.addEventListener('input', () => {
  currentId = geneName.value.trim();
  if (currentId !== selectedSavedId) selectedSavedId = '';
  isDirty = true;
  updatePreview();
});

renderBoard();
loadCustomBank();

function renderBoard() {
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
      if (selectedPalettePiece && !piece && !eraseMode) square.classList.add('palette-target');
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'gene-piece'));
      boardElement.append(square);
    }
  }
  document.querySelector('.gene-side-label').textContent = `${turn === RED ? '红方' : '黑方'}走棋`;
  updatePieceCounts();
  updatePreview();
}

function handleBoardClick(event) {
  const square = event.target.closest('.gene-intersection');
  if (!square) return;
  const row = Number(square.dataset.row);
  const col = Number(square.dataset.col);
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
    setStatus('先在左侧选择一个棋子，再点击棋盘放置。', 'warning');
    return;
  }
  if (currentPiece?.toUpperCase() === 'K') {
    setStatus('红帅和黑将固定保留，不能被其它棋子覆盖。', 'warning');
    return;
  }
  board[row][col] = selectedPalettePiece;
  markDirty(`${turnName(selectedPalettePiece)}${getPieceLabel(selectedPalettePiece)}已放置。`);
  renderBoard();
}

function selectPalettePiece(button) {
  eraseMode = false;
  eraseButton.setAttribute('aria-pressed', 'false');
  selectedPalettePiece = button.dataset.pieceCode;
  paletteButtons.forEach(item => item.classList.toggle('active', item === button));
  setStatus(`已选择${turnName(selectedPalettePiece)}${getPieceLabel(selectedPalettePiece)}，点击棋盘交叉点放置。`, 'ready');
  renderBoard();
}

function toggleEraseMode() {
  eraseMode = !eraseMode;
  selectedPalettePiece = null;
  paletteButtons.forEach(button => button.classList.remove('active'));
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
  board = Array.from({ length: 10 }, () => Array(9).fill(null));
  board[9][4] = 'K';
  board[0][4] = 'k';
  selectedPalettePiece = null;
  eraseMode = false;
  eraseButton.setAttribute('aria-pressed', 'false');
  paletteButtons.forEach(button => button.classList.remove('active'));
  markDirty('棋盘已清空，仅保留红帅与黑将。');
  renderBoard();
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
    updatePreview(result);
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

function validateCurrentPosition() {
  try {
    const { state } = validateBoard();
    const gameStatus = getGameStatus(state);
    if (gameStatus.type === 'invalid') throw new Error('局面无效，请检查双方将帅。');
    setStatus(gameStatus.type === 'check' ? '局面结构有效；当前行棋方正被将军。' : '局面结构与双方将帅校验通过。', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function testPositionWithEngine() {
  let position;
  try { position = validateBoard(); }
  catch (error) { setStatus(error.message, 'error'); return; }
  setStatus('正在请求 Pikafish 测试局面…', 'ready');
  try {
    const response = await fetch('http://localhost:8787/api/v1/chinese-chess/engine/ai-ai/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen: position.fen, side: turn === RED ? 'red' : 'black', settings: { threads: 1, hash: 64, depth: 8, movetime: 500, multiPv: 1 } })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Pikafish 测试失败。');
    setStatus(`AI 测试通过：建议着法 ${result.bestMove || ''}。`, 'success');
  } catch (error) {
    setStatus(error.message || 'Pikafish 服务不可用。', 'error');
  }
}

async function savePuzzle() {
  let position;
  try { position = validateBoard(); }
  catch (error) { setStatus(error.message, 'error'); return; }
  const id = geneName.value.trim();
  const validation = validateGeneName(id);
  if (!validation.ok) {
    setStatus(validation.message, 'error');
    return;
  }
  const title = `手工残局 ${id.slice(-3)}`;
  setBusy(true);
  setStatus('正在保存到中国象棋残局题库…', 'ready');
  try {
    const response = await fetch('http://localhost:8787/api/v1/chinese-chess/root-gene/puzzle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, fen: position.fen, updateExisting: selectedSavedId === id })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '保存棋局失败。');
    currentId = result.id;
    selectedSavedId = result.id;
    isDirty = false;
    await loadCustomBank(false);
    setStatus(`已保存：${result.id} · 后续可在对弈页题库加载。`, 'success');
    updatePreview(position);
  } catch (error) {
    setStatus(error.message || '无法连接本地题库服务。', 'error');
  } finally {
    setBusy(false);
  }
}

function validateGeneName(value) {
  if (!/^eg_CUSTOM_L1-\d{3}$/.test(value)) return { ok: false, message: '编号必须符合 eg_CUSTOM_L1-001 格式。' };
  const exists = bankManifest?.categories?.find(category => category.key === 'custom')?.items?.some(item => item.id === value);
  if (exists && value !== selectedSavedId) return { ok: false, message: '该编号已存在，请使用下一个三位序号。' };
  return { ok: true, message: '编号格式正确。' };
}

async function checkGeneName() {
  const result = validateGeneName(geneName.value.trim());
  setStatus(result.message, result.ok ? 'success' : 'error');
}

async function loadCustomBank(selectFirst = true) {
  try {
    const response = await fetch('../bank/endgame/L1/manifest.json');
    if (!response.ok) throw new Error('题库清单暂不可用。');
    bankManifest = await response.json();
    renderSavedPuzzles(selectFirst);
  } catch (error) {
    setStatus(error.message || '题库清单载入失败。', 'error');
  }
}

function renderSavedPuzzles(selectFirst) {
  const items = bankManifest?.categories?.find(category => category.key === 'custom')?.items || [];
  geneList.replaceChildren();
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `gene-list-item${item.id === selectedSavedId ? ' active' : ''}`;
    button.textContent = item.title || item.id;
    button.title = item.id;
    button.addEventListener('click', () => loadSavedPuzzle(item));
    geneList.append(button);
  }
  const next = Math.max(0, ...items.map(item => Number(item.id.match(/(\d{3})$/)?.[1]) || 0)) + 1;
  if (!selectedSavedId && !geneName.value.trim()) geneName.value = `eg_CUSTOM_L1-${String(Math.min(next, 999)).padStart(3, '0')}`;
  if (selectFirst && items.length) loadSavedPuzzle(items[items.length - 1]);
}

async function loadSavedPuzzle(item) {
  try {
    const response = await fetch(`../bank/endgame/L1/${item.fen}`);
    if (!response.ok) throw new Error('局面文件载入失败。');
    const { parseFen } = await import('../core.mjs');
    const position = parseFen(await response.text());
    board = position.board;
    turn = position.turn;
    currentId = item.id;
    selectedSavedId = item.id;
    geneName.value = item.id;
    firstMoverButton.textContent = `先手：${turn === RED ? '红方' : '黑方'}`;
    selectedPalettePiece = null;
    eraseMode = false;
    eraseButton.setAttribute('aria-pressed', 'false');
    paletteButtons.forEach(button => button.classList.remove('active'));
    isDirty = false;
    renderBoard();
    renderSavedPuzzles(false);
    setStatus(`已载入 ${item.title || item.id}。`, 'success');
  } catch (error) {
    setStatus(error.message || '局面载入失败。', 'error');
  }
}

async function deleteSelectedPuzzle() {
  const id = selectedSavedId || geneName.value.trim();
  if (!/^eg_CUSTOM_L1-\d{3}$/.test(id)) {
    setStatus('先从列表选择已保存的手工棋局。', 'warning');
    return;
  }
  if (!window.confirm(`删除手工棋局 ${id} 及其答案/解说文件？`)) return;
  try {
    const response = await fetch(`http://localhost:8787/api/v1/chinese-chess/root-gene/puzzle/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '删除失败。');
    selectedSavedId = '';
    currentId = '';
    geneName.value = '';
    await loadCustomBank(false);
    setStatus(`已删除 ${id}。`, 'success');
  } catch (error) { setStatus(error.message || '无法连接本地题库服务。', 'error'); }
}

function updatePieceCounts() {
  paletteButtons.forEach(button => {
    const code = button.dataset.pieceCode;
    const count = board.reduce((total, row) => total + row.filter(piece => piece === code).length, 0);
    button.querySelector('output').textContent = String(count);
  });
}

function updatePreview(validated) {
  let fen = '等待编辑…';
  try { fen = (validated || validateBoard()).fen; } catch {}
  currentFen.textContent = fen;
  const id = geneName.value.trim() || '未命名';
  const metadata = {
    geneId: id,
    title: `手工残局 ${id.slice(-3)}`,
    type: 'endgame',
    difficulty: 'L1',
    sequence: Number(id.match(/(\d{3})$/)?.[1]) || null,
    firstMover: turn === RED ? 'red' : 'black',
    verified: !isDirty,
    fen
  };
  jsonPreview.value = JSON.stringify(metadata, null, 2);
}

function markDirty(message) {
  isDirty = true;
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
  rootStatus.lastChild.textContent = state === 'error' ? '需要处理' : state === 'success' ? '已保存' : '编辑中';
  updatePreview();
}

function setBusy(busy) {
  document.querySelectorAll('#savePositionButton, #rootGeneFooterSave, #generatePositionButton').forEach(button => { button.disabled = busy; });
}
