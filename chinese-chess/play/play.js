import { PUZZLE_BANK_BASE, loadPuzzleBank, renderPuzzleBank, pairedExplanation } from '../shared/puzzle-bank.mjs';
import {
  BLACK,
  RED,
  createGame,
  getGameStatus,
  getLegalMoves,
  getPieceLabel,
  makeMove,
  undoMove,
  redoMove,
  createGameFromFen,
  toFen
} from '../core.mjs';
import {
  appendStandardPositionMark,
  createStandardPieceElement,
  createStandardBoardArtwork,
  isCannonStartPosition,
  isPawnStartPosition,
  placeStandardIntersection
} from '../board-standard.mjs';
import { applyBoardStyle, onBoardStyleChange } from '../board-style.mjs';
import { mountBoardControlPanel } from '../shared/board-control-panel.mjs';
import { createBoardAudio } from '../shared/board-audio.mjs';
import { buildNotationPlayback } from '../shared/notation-playback.mjs';
import { bindPlayModeSession, restorePlayModeSession } from '../shared/play-mode-session.mjs';

applyBoardStyle();
onBoardStyleChange(() => {});

const boardElement = document.getElementById('board');
const turnText = document.getElementById('turnText');
const turnDetail = document.getElementById('turnDetail');
const turnDot = document.getElementById('turnDot');
const ruleNote = document.getElementById('ruleNote');
const moveList = document.getElementById('moveList');
const moveCount = document.getElementById('moveCount');
const controlPanel = mountBoardControlPanel(document.getElementById('playControlPanel'), {
  mode: 'manual',
  hrefs: { manual: './index.html', 'human-ai': './human-ai.html', 'ai-ai': './ai-ai.html' },
  onAction(action) {
    if (action === 'reset') resetPosition();
    if (action === 'play') togglePlayback();
    if (action === 'undo') doUndo();
    if (action === 'redo') doRedo();
    if (action === 'sound') {
      ruleNote.textContent = controlPanel.getSoundEnabled() ? '音效已开启。' : '音效已关闭。';
    }
  }
});
const solutionText = document.getElementById('solutionText');
const explanationText = document.getElementById('explanationText');
const solutionStatus = document.getElementById('solutionStatus');
const explanationStatus = document.getElementById('explanationStatus');
const bankTree = document.getElementById('bankTree');
const bankSearch = document.getElementById('bankSearch');
const positionTitle = document.getElementById('positionTitle');
const solutionVariant = document.getElementById('solutionVariant');

const modeSession = restorePlayModeSession();
let game = modeSession?.game || createGame();
let selectedSquare = null;
let legalTargets = [];
let bankManifest = null;
let selectedPuzzle = modeSession?.selectedPuzzle || null;
let initialFen = modeSession?.initialFen || toFen(game);
let playbackTimer = null;
let materialLoadToken = 0;
controlPanel.setVoice(false);
const audio = createBoardAudio(controlPanel, {
  explanation: explanationText,
  onPause: stopPlayback,
  onStatus(message) { ruleNote.textContent = message; }
});

if (modeSession) {
  solutionText.value = modeSession.solution || '';
  explanationText.value = modeSession.explanation || '';
  positionTitle.textContent = selectedPuzzle?.title || '当前棋局';
  controlPanel.setSide(modeSession.boardSide || 'red');
  renderSolutionVariants();
  solutionVariant.value = modeSession.solutionVariant || '0';
}
audio.refresh();
bindPlayModeSession(document.getElementById('playControlPanel'), () => ({
  game, initialFen, selectedPuzzle, recording: false, recordingStart: 0,
  solution: solutionText.value, explanation: explanationText.value,
  solutionVariant: solutionVariant.value, boardSide: controlPanel.getSide(),
  humanSide: modeSession?.humanSide
}), stopPlayback);

function doUndo() {
  audio.stop();
  if (!undoMove(game)) return;
  selectedSquare = null;
  legalTargets = [];
  ruleNote.textContent = '已悔棋。';
  render();
}

function doRedo() {
  if (!redoMove(game)) return;
  selectedSquare = null;
  legalTargets = [];
  ruleNote.textContent = '已重做。';
  render();
  audio.move(game);
}

solutionVariant.addEventListener('change', () => loadPuzzleSolution(Number(solutionVariant.value)));
bankSearch.addEventListener('input', renderBankTree);

loadBank();

function render() {
  const status = getGameStatus(game);
  renderStatus(status);
  renderBoard();
  renderMoves();
  controlPanel.controls.undo.disabled = game.history.length === 0;
  controlPanel.controls.redo.disabled = game.redoStack.length === 0;
}

function renderStatus(status) {
  const side = status.turn === RED ? '红方' : '黑方';
  turnDot.className = `turn-dot ${status.turn === RED ? 'red-turn' : 'black-turn'}`;

  if (status.type === 'checkmate') {
    turnText.textContent = `${side}将死`;
    turnDetail.textContent = `${status.winner === RED ? '红方' : '黑方'}获胜`;
  } else if (status.type === 'stalemate') {
    turnText.textContent = `${side}困毙`;
    turnDetail.textContent = `${status.winner === RED ? '红方' : '黑方'}获胜`;
  } else if (status.type === 'invalid') {
    turnText.textContent = '棋局无效';
    turnDetail.textContent = '缺少一方将帅';
  } else {
    turnText.textContent = game.history.length === 0 ? `${side}先行` : `${side}走棋`;
    turnDetail.textContent = status.type === 'check' ? `${side}被将军` : `${side}回合`;
  }
}

function renderBoard() {
  const lastMove = game.history.at(-1);
  const targets = new Set(legalTargets.map(squareKey));
  boardElement.replaceChildren();

  boardElement.append(createStandardBoardArtwork('palace-lines xiangqi-grid-svg'));

  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const piece = game.board[row][col];
      const square = document.createElement('button');
      const position = { row, col };
      square.type = 'button';
      square.className = 'square xiangqi-intersection';
      placeStandardIntersection(square, row, col);
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${pieceColor(piece)}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 列`
        : `空位，第 ${row + 1} 行第 ${col + 1} 列`);

      if (selectedSquare && sameSquare(position, selectedSquare)) square.classList.add('selected');
      if (targets.has(squareKey(position))) square.classList.add(piece ? 'capture-target' : 'move-target');
      if (lastMove && sameSquare(position, lastMove.from)) square.classList.add('last-from');
      if (lastMove && sameSquare(position, lastMove.to)) square.classList.add('last-to');
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      if (piece) {
        square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'piece'));
      }
      square.addEventListener('click', () => handleSquareClick(position));
      boardElement.append(square);
    }
  }
}

function handleSquareClick(position) {
  if (playbackTimer) stopPlayback();
  const status = getGameStatus(game);
  if (status.type === 'checkmate' || status.type === 'stalemate' || status.type === 'invalid') return;

  if (selectedSquare && legalTargets.some(target => sameSquare(target, position))) {
    makeMove(game, selectedSquare, position);
    selectedSquare = null;
    legalTargets = [];
    const lastMove = game.history.at(-1);
    ruleNote.textContent = lastMove.captured ? '吃子完成。' : '落子完成。';
    playMoveSound();
    render();
    return;
  }

  const piece = game.board[position.row][position.col];
  if (piece && (piece === piece.toUpperCase() ? RED : BLACK) === game.turn) {
    selectedSquare = position;
    legalTargets = getLegalMoves(game, position);
    ruleNote.textContent = `${pieceColor(piece)}${getPieceLabel(piece)} · ${legalTargets.length} 个合法落点`;
  } else if (selectedSquare) {
    ruleNote.textContent = '此处不是合法落点。';
  }
  render();
}

function renderMoves() {
  moveList.replaceChildren();
  if (game.history.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'move-empty';
    empty.textContent = '棋局开始，红方先行';
    moveList.append(empty);
    return;
  }

  game.history.forEach((move, index) => {
    const item = document.createElement('li');
    item.className = `move-item ${move.turn === RED ? 'move-red' : 'move-black'}`;
    const number = document.createElement('span');
    number.className = 'move-number';
    number.textContent = `${Math.floor(index / 2) + 1}${move.turn === RED ? '.' : '…'}`;
    const side = document.createElement('span');
    side.className = 'move-side';
    side.textContent = move.turn === RED ? '红' : '黑';
    const notation = document.createElement('span');
    notation.className = 'move-notation';
    notation.textContent = `${getPieceLabel(move.piece)} ${fileNumber(move.turn, move.from.col)}路 ${move.from.row + 1}行 → ${fileNumber(move.turn, move.to.col)}路 ${move.to.row + 1}行`;
    item.append(number, side, notation);
    moveList.append(item);
  });
  moveList.scrollTop = moveList.scrollHeight;
}

function renderCaptured() {
  const capturedByRed = game.history.filter(move => move.captured && move.turn === RED).map(move => move.captured);
  const capturedByBlack = game.history.filter(move => move.captured && move.turn === BLACK).map(move => move.captured);
  renderCapturedRow(document.getElementById('redCaptured'), capturedByRed);
  renderCapturedRow(document.getElementById('blackCaptured'), capturedByBlack);
}

function renderCapturedRow(container, pieces) {
  container.replaceChildren();
  if (pieces.length === 0) {
    container.textContent = '暂无';
    return;
  }
  for (const piece of pieces) {
    const token = document.createElement('span');
    token.className = `captured-piece ${piece === piece.toUpperCase() ? 'piece-red' : 'piece-black'}`;
    token.textContent = getPieceLabel(piece);
    container.append(token);
  }
}

function pieceColor(piece) {
  return piece === piece.toUpperCase() ? '红方' : '黑方';
}

function fileNumber(color, col) {
  return color === RED ? 9 - col : col + 1;
}

function squareKey(square) {
  return `${square.row},${square.col}`;
}

function sameSquare(first, second) {
  return first.row === second.row && first.col === second.col;
}

async function loadBank() {
  try {
    bankManifest = await loadPuzzleBank();
    renderBankTree();
    const count = bankManifest.categories.reduce((total, category) => total + category.items.length, 0);
    document.getElementById('bankCount').textContent = `${count} 局`;
  } catch (error) {
    bankTree.replaceChildren();
    const message = document.createElement('p');
    message.className = 'bank-empty';
    message.textContent = '题库载入失败，请通过本地服务访问页面。';
    bankTree.append(message);
    document.getElementById('bankCount').textContent = '不可用';
  }
}

function renderBankTree() {
  if (!bankManifest) return;
  const query = bankSearch.value.trim().toLocaleLowerCase();
  bankTree.replaceChildren();

  const recommendations = document.createElement('section');
  recommendations.className = 'recommendation-groups';
  for (const [label, detail] of [
    ['手动推荐', '需连接 Windows 版推荐数据服务后显示真实推荐。'],
    ['智能推荐', '需接入学习记录和推荐服务后显示个性化题目。'],
    ['专家推荐', '需连接专家系统数据库后显示推荐题目。']
  ]) {
    const group = document.createElement('details');
    group.className = 'tree-group recommendation-group';
    const summary = document.createElement('summary');
    summary.textContent = label;
    const note = document.createElement('p');
    note.className = 'recommendation-note';
    note.textContent = detail;
    group.append(summary, note);
    recommendations.append(group);
  }
  bankTree.append(recommendations);

  renderPuzzleBank(bankTree, bankManifest, query, selectedPuzzle?.id, loadPuzzle);
}

async function loadPuzzle(category, puzzle) {
  audio.stop();
  stopPlayback();
  try {
    const base = PUZZLE_BANK_BASE;
    const fenText = await fetchText(base + puzzle.fen);
    game = createGameFromFen(fenText);
    initialFen = fenText.trim();
    selectedPuzzle = { ...puzzle, category, base };
    selectedSquare = null;
    legalTargets = [];
    positionTitle.textContent = puzzle.title;
    renderSolutionVariants();
    renderBankTree();
    await loadPuzzleMaterials(0);
    ruleNote.textContent = `已载入：${puzzle.title}`;
    render();
  } catch (error) {
    ruleNote.textContent = `载入失败：${error.message}`;
  }
}

async function loadPuzzleMaterials(solutionIndex) {
  const token = ++materialLoadToken;
  audio.stop();
  if (!selectedPuzzle) return;
  const { base, solutions } = selectedPuzzle;
  solutionText.value = '';
  explanationText.value = '';
  try {
    if (solutions[solutionIndex]) {
      const text = await fetchText(base + solutions[solutionIndex]);
      if (token !== materialLoadToken) return;
      solutionText.value = text;
    }
    solutionStatus.textContent = solutionText.value ? `已载入答案 ${solutionIndex + 1}。` : '该题暂无答案文件。';
  } catch (error) {
    if (token !== materialLoadToken) return;
    solutionStatus.textContent = error.message;
  }
  try {
    const explanation = pairedExplanation(selectedPuzzle, solutionIndex);
    if (explanation) {
      const text = await fetchText(base + explanation);
      if (token !== materialLoadToken) return;
      explanationText.value = text;
    }
    explanationStatus.textContent = explanationText.value ? '已载入配套解说。' : '该解法暂无配套解说。';
  } catch (error) {
    if (token !== materialLoadToken) return;
    explanationStatus.textContent = error.message;
  }
  audio.refresh();
}

async function loadPuzzleSolution(index) {
  stopPlayback();
  await loadPuzzleMaterials(index);
}

function renderSolutionVariants() {
  const solutions = selectedPuzzle?.solutions || [];
  solutionVariant.replaceChildren();
  solutionVariant.disabled = solutions.length === 0;
  if (!solutions.length) {
    solutionVariant.append(new Option(selectedPuzzle ? '暂无答案' : '请选择棋局', ''));
    return;
  }
  solutions.forEach((file, index) => {
    const version = file.match(/-(\d{3})\.txt$/)?.[1] || String(index + 1).padStart(3, '0');
    solutionVariant.append(new Option(`棋谱答案 ${version}`, String(index)));
  });
}

function resetPosition() {
  audio.stop();
  stopPlayback();
  game = initialFen ? createGameFromFen(initialFen) : createGame();
  selectedSquare = null;
  legalTargets = [];
  ruleNote.textContent = '局面已重置。';
  render();
}

function togglePlayback() {
  audio.stop();
  if (playbackTimer) {
    stopPlayback();
    return;
  }
  let history = game.history.map(move => ({ from: { ...move.from }, to: { ...move.to } }));
  if (!history.length && solutionText.value.trim()) {
    try { history = buildNotationPlayback(initialFen, solutionText.value).moves; }
    catch (error) {
      ruleNote.textContent = `棋谱无法播放：${error.message}`;
      controlPanel.setPlaying(false);
      return;
    }
  }
  if (history.length === 0) {
    ruleNote.textContent = '当前棋局还没有可回放的着法。';
    controlPanel.setPlaying(false);
    return;
  }
  game = createGameFromFen(initialFen);
  selectedSquare = null;
  legalTargets = [];
  let index = 0;
  controlPanel.setPlaying(true);
  const tick = () => {
    if (index >= history.length) {
      stopPlayback();
      return;
    }
    makeMove(game, history[index].from, history[index].to);
    audio.move(game);
    index += 1;
    render();
    const delay = 1100 - Number(controlPanel.controls.speed.value) * 90;
    playbackTimer = setTimeout(tick, delay);
  };
  tick();
}

function stopPlayback() {
  if (playbackTimer) clearTimeout(playbackTimer);
  playbackTimer = null;
  controlPanel.setPlaying(false);
}

function playMoveSound() {
  audio.move(game);
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`文件载入失败 (${response.status})`);
  return response.text();
}

render();