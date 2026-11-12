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
const solutionPlayback = document.getElementById('solutionPlayback');
const explanationText = document.getElementById('explanationText');
const solutionStatus = document.getElementById('solutionStatus');
const explanationStatus = document.getElementById('explanationStatus');
const bankTree = document.getElementById('bankTree');
const bankSearch = document.getElementById('bankSearch');
const positionTitle = document.getElementById('positionTitle');
const solutionVariant = document.getElementById('solutionVariant');
const puzzleDetails = document.getElementById('puzzleDetails');
const puzzleDetailsContent = document.getElementById('puzzleDetailsContent');

const modeSession = restorePlayModeSession();
let game = modeSession?.game || createGame();
let selectedSquare = null;
let legalTargets = [];
let bankManifest = null;
let selectedPuzzle = modeSession?.selectedPuzzle || null;
let initialFen = modeSession?.initialFen || toFen(game);
let playbackTimer = null;
let playbackDelayResolve = null;
let playbackGeneration = 0;
let playbackActive = false;
let materialLoadToken = 0;
let metadataLoadToken = 0;
const audio = createBoardAudio(controlPanel, {
  explanation: explanationText,
  onPause: stopPlayback,
  onStatus(message) { ruleNote.textContent = message; }
});

if (modeSession) {
  solutionText.value = modeSession.solution || '';
  explanationText.value = modeSession.explanation || '';
  positionTitle.textContent = selectedPuzzle?.title || '当前棋局';
  if (selectedPuzzle) loadPuzzleDetails(selectedPuzzle, selectedPuzzle.category || {
    familyLabel: '', level: '', label: ''
  });
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
  audio.effectMove(game);
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
    const isCurrent = index === game.history.length - 1;
    item.className = `move-item ${move.turn === RED ? 'move-red' : 'move-black'}${isCurrent ? ' is-current' : ''}`;
    if (isCurrent) item.setAttribute('aria-current', 'step');
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
    loadPuzzleDetails(selectedPuzzle, category);
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
  clearSolutionMoveHighlight();
  explanationText.value = '';
  try {
    if (solutions[solutionIndex]) {
      const text = await fetchText(base + solutions[solutionIndex]);
      if (token !== materialLoadToken) return;
      solutionText.value = hasPuzzleMaterial(text, selectedPuzzle) ? text : '';
    }
    solutionStatus.textContent = solutionText.value ? `已载入答案 ${solutionIndex + 1}。`
      : solutions[solutionIndex] ? '源题库尚未录入正式棋谱，当前不能回放。' : '该题暂无答案文件。';
  } catch (error) {
    if (token !== materialLoadToken) return;
    solutionStatus.textContent = error.message;
  }
  try {
    const explanation = pairedExplanation(selectedPuzzle, solutionIndex);
    if (explanation) {
      const text = await fetchText(base + explanation);
      if (token !== materialLoadToken) return;
      explanationText.value = hasPuzzleMaterial(text, selectedPuzzle) ? text : '';
    }
    explanationStatus.textContent = explanationText.value ? '已载入配套解说。'
      : explanation ? '源题库暂无正式解说内容。' : '该解法暂无配套解说。';
  } catch (error) {
    if (token !== materialLoadToken) return;
    explanationStatus.textContent = error.message;
  }
  audio.refresh();
}

async function loadPuzzleDetails(puzzle, category) {
  const token = ++metadataLoadToken;
  puzzleDetails.hidden = false;
  puzzleDetails.open = false;
  puzzleDetailsContent.textContent = '正在载入棋局资料…';
  if (!puzzle.metadata) {
    renderPuzzleDetails(null, puzzle, category, '源题库没有提供元数据文件。');
    return;
  }
  try {
    const text = await fetchText(puzzle.base + puzzle.metadata);
    if (token !== metadataLoadToken || selectedPuzzle?.id !== puzzle.id) return;
    const metadata = parsePuzzleMetadata(text);
    renderPuzzleDetails(metadata, puzzle, category);
  } catch (error) {
    if (token !== metadataLoadToken || selectedPuzzle?.id !== puzzle.id) return;
    renderPuzzleDetails(null, puzzle, category, `棋局资料载入失败：${error.message}`);
  }
}

function renderPuzzleDetails(metadata, puzzle, category, notice = '') {
  puzzleDetailsContent.replaceChildren();
  const detailInfo = metadata?.displayInfo || {};
  const pedagogical = metadata?.pedagogical || {};
  const familyLabels = {
    endgame: '残局基因',
    attacking: '攻杀基因',
    tactics: '战术基因',
    opening: '开局基因',
    comprehensive: '综合基因'
  };
  const levelLabels = category.family === 'opening'
    ? { classic: '经典', modern: '现代' }
    : { L1: 'L1 基础', L2: 'L2 组合', L3: 'L3 复杂' };
  const categoryPath = [
    familyLabels[category.family] || category.familyLabel,
    levelLabels[category.level],
    category.label
  ].filter(Boolean).join(' · ');
  const rows = [
    ['来源目录', categoryPath],
    ['棋局编号', puzzle.id],
    ['内容说明', detailInfo.description || metadata?.description || metadata?.openingData?.approach || '源题库未提供文字说明。'],
    ['难度', metadata?.metadata?.difficulty || category.level || '未标注'],
    ['适合对象', pedagogical.targetAudience],
    ['预计学习时间', pedagogical.estimatedStudyTime]
  ];
  for (const [label, value] of rows) {
    if (!value) continue;
    const paragraph = document.createElement('p');
    const heading = document.createElement('strong');
    heading.textContent = `${label}：`;
    paragraph.append(heading, document.createTextNode(value));
    puzzleDetailsContent.append(paragraph);
  }
  appendDetailList(puzzleDetailsContent, '学习目标', pedagogical.learningObjectives);
  appendDetailList(puzzleDetailsContent, '练习要点', pedagogical.practicePoints);
  appendDetailList(puzzleDetailsContent, '常见误区', pedagogical.commonMistakes);
  const keyMoves = (metadata?.solutions || []).flatMap((solution, index) =>
    (solution.keyMoves || []).map(move => {
      const description = [move.move, move.description, move.annotation].filter(Boolean).join(' · ');
      return `${solution.description || `解法 ${index + 1}`}：${description}`;
    }));
  appendDetailList(puzzleDetailsContent, '源数据关键着法', keyMoves);
  if (notice) {
    const message = document.createElement('p');
    message.className = 'puzzle-detail-notice';
    message.textContent = notice;
    puzzleDetailsContent.append(message);
  }
}

function appendDetailList(container, title, values) {
  if (!Array.isArray(values) || !values.length) return;
  const section = document.createElement('section');
  const heading = document.createElement('strong');
  heading.textContent = `${title}：`;
  const list = document.createElement('ul');
  for (const value of values) {
    const item = document.createElement('li');
    item.textContent = value;
    list.append(item);
  }
  section.append(heading, list);
  container.append(section);
}

function parsePuzzleMetadata(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const normalized = text.replace(/,\s*([}\]])/g, '$1');
    if (normalized === text) throw error;
    return JSON.parse(normalized);
  }
}

function hasPuzzleMaterial(text, puzzle) {
  const meaningfulLines = text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//') && !line.startsWith('#') && line !== puzzle?.id);
  return meaningfulLines.length > 0;
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
  if (playbackActive) {
    stopPlayback();
    return;
  }
  let history;
  if (game.history.length === 0 && solutionText.value.trim()) {
    try { history = buildNotationPlayback(initialFen, solutionText.value).moves; }
    catch (error) {
      ruleNote.textContent = `棋谱无法播放：${error.message}`;
      controlPanel.setPlaying(false);
      return;
    }
  }
  if (!history) {
    history = game.history.map(move => ({ from: { ...move.from }, to: { ...move.to } }));
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
  playbackActive = true;
  const generation = ++playbackGeneration;
  controlPanel.setPlaying(true);
  const tick = () => {
    if (!playbackActive || generation !== playbackGeneration) return;
    if (index >= history.length) {
      stopPlayback();
      return;
    }
    const currentMove = history[index];
    makeMove(game, currentMove.from, currentMove.to);
    const speech = audio.move(game, currentMove.notation || '');
    index += 1;
    render();
    highlightSolutionMove(index - 1);
    const delay = 1100 - Number(controlPanel.controls.speed.value) * 90;
    const waitForDelay = new Promise(resolve => {
      playbackDelayResolve = resolve;
      playbackTimer = setTimeout(() => {
        playbackTimer = null;
        playbackDelayResolve = null;
        resolve();
      }, delay);
    });
    Promise.all([speech, waitForDelay]).then(() => {
      if (playbackActive && generation === playbackGeneration) tick();
    });
  };
  tick();
}

function stopPlayback() {
  playbackGeneration += 1;
  playbackActive = false;
  if (playbackTimer) clearTimeout(playbackTimer);
  playbackTimer = null;
  playbackDelayResolve?.();
  playbackDelayResolve = null;
  audio.stop();
  controlPanel.setPlaying(false);
}

function highlightSolutionMove(index) {
  const ranges = getSolutionMoveRanges(solutionText.value);
  const range = ranges[index];
  if (!range) return;
  solutionText.hidden = true;
  solutionPlayback.hidden = false;
  const highlightedMove = document.createElement('mark');
  highlightedMove.textContent = solutionText.value.slice(range.start, range.end);
  solutionPlayback.replaceChildren(
    document.createTextNode(solutionText.value.slice(0, range.start)),
    highlightedMove,
    document.createTextNode(solutionText.value.slice(range.end))
  );
  highlightedMove.scrollIntoView({ block: 'nearest' });
}

function clearSolutionMoveHighlight() {
  solutionText.hidden = false;
  solutionPlayback.hidden = true;
  solutionPlayback.replaceChildren();
  solutionText.setSelectionRange(0, 0);
}

function getSolutionMoveRanges(text) {
  const ranges = [];
  const movePattern = /[车馬马炮兵卒帅将仕士相象][一二三四五六七八九1-9０-９][进退平][一二三四五六七八九1-9０-９]/g;
  let lineOffset = 0;
  for (const line of text.split(/\r?\n/)) {
    const commentStart = [line.indexOf('//'), line.indexOf('#')].filter(index => index >= 0);
    const content = line.slice(0, commentStart.length ? Math.min(...commentStart) : line.length);
    movePattern.lastIndex = 0;
    for (const match of content.matchAll(movePattern)) {
      ranges.push({ start: lineOffset + match.index, end: lineOffset + match.index + match[0].length });
    }
    lineOffset += line.length;
    if (text.startsWith('\r\n', lineOffset)) lineOffset += 2;
    else if (text[lineOffset] === '\n' || text[lineOffset] === '\r') lineOffset += 1;
  }
  return ranges;
}

function playMoveSound() {
  audio.effectMove(game);
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`文件载入失败 (${response.status})`);
  return response.text();
}

render();