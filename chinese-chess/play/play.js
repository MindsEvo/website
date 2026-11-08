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
      soundEnabled = !soundEnabled;
      ruleNote.textContent = soundEnabled ? '音效已开启。' : '音效已关闭。';
    }
    if (action === 'voice') speakExplanation();
  }
});
const solutionText = document.getElementById('solutionText');
const explanationText = document.getElementById('explanationText');
const solutionStatus = document.getElementById('solutionStatus');
const explanationStatus = document.getElementById('explanationStatus');
const bankTree = document.getElementById('bankTree');
const bankSearch = document.getElementById('bankSearch');
const positionTitle = document.getElementById('positionTitle');
const recordingButton = document.getElementById('recordButton');
const saveSolutionButton = document.getElementById('saveSolutionButton');
const saveExplanationButton = document.getElementById('saveExplanationButton');
const solutionVariant = document.getElementById('solutionVariant');

const modeSession = restorePlayModeSession();
let game = modeSession?.game || createGame();
let selectedSquare = null;
let legalTargets = [];
let bankManifest = null;
let selectedPuzzle = modeSession?.selectedPuzzle || null;
let initialFen = modeSession?.initialFen || toFen(game);
let recording = modeSession?.recording || false;
let recordingStart = modeSession?.recordingStart || 0;
let playbackTimer = null;
let soundEnabled = true;

if (modeSession) {
  solutionText.value = modeSession.solution || '';
  explanationText.value = modeSession.explanation || '';
  saveSolutionButton.disabled = !solutionText.value.trim();
  saveExplanationButton.disabled = !explanationText.value.trim();
  positionTitle.textContent = selectedPuzzle?.title || '当前棋局';
  recordingButton.textContent = recording ? '结束记录' : '开始记录';
  recordingButton.classList.toggle('recording', recording);
  controlPanel.setSide(modeSession.boardSide || 'red');
  const solutions = selectedPuzzle?.solutions || [];
  solutionVariant.replaceChildren();
  solutions.forEach((file, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `答案 ${String(index + 1).padStart(3, '0')}`;
    solutionVariant.append(option);
  });
  solutionVariant.hidden = solutions.length === 0;
  solutionVariant.value = modeSession.solutionVariant || '0';
  document.getElementById('solutionVersionRow').hidden = !recording && solutions.length === 0;
  document.getElementById('explanationVersionRow').hidden = !(selectedPuzzle?.explanations?.length);
  document.getElementById('solutionVersion').value = String(solutions.length + 1);
  document.getElementById('explanationVersion').value = String((selectedPuzzle?.explanations?.length || 0) + 1);
}
bindPlayModeSession(document.getElementById('playControlPanel'), () => ({
  game, initialFen, selectedPuzzle, recording, recordingStart,
  solution: solutionText.value, explanation: explanationText.value,
  solutionVariant: solutionVariant.value, boardSide: controlPanel.getSide(),
  humanSide: modeSession?.humanSide
}), stopPlayback);

function doUndo() {
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
}

document.getElementById('loadPositionButton').addEventListener('click', () => document.getElementById('positionFileInput').click());
document.getElementById('loadSolutionButton').addEventListener('click', () => document.getElementById('solutionFileInput').click());
document.getElementById('loadExplanationButton').addEventListener('click', () => document.getElementById('explanationFileInput').click());
recordingButton.addEventListener('click', toggleRecording);
saveSolutionButton.addEventListener('click', saveSolution);
saveExplanationButton.addEventListener('click', saveExplanation);
document.getElementById('positionFileInput').addEventListener('change', loadPositionFile);
document.getElementById('solutionFileInput').addEventListener('change', event => loadTextFile(event, solutionText, solutionStatus, '答案'));
document.getElementById('explanationFileInput').addEventListener('change', event => loadTextFile(event, explanationText, explanationStatus, '解说'));
solutionText.addEventListener('input', () => { saveSolutionButton.disabled = !solutionText.value.trim(); });
explanationText.addEventListener('input', () => { saveExplanationButton.disabled = !explanationText.value.trim(); });
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
  if (recording) updateRecordedSolution();
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
    playMoveSound(Boolean(lastMove.captured));
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
    const response = await fetch('../bank/endgame/L1/manifest.json');
    if (!response.ok) throw new Error('题库清单暂不可用。');
    bankManifest = await response.json();
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

  const endgames = document.createElement('details');
  endgames.className = 'tree-group endgame-group';
  endgames.open = true;
  const endgameSummary = document.createElement('summary');
  endgameSummary.textContent = '残局基因 (endgame)';
  endgames.append(endgameSummary);

  const level = document.createElement('details');
  level.className = 'tree-group tree-level';
  level.open = true;
  const levelSummary = document.createElement('summary');
  levelSummary.textContent = 'L1 基础';
  level.append(levelSummary);

  for (const category of bankManifest.categories) {
    const matchingItems = category.items.filter(item => (
      !query || item.title.toLocaleLowerCase().includes(query) || item.id.toLocaleLowerCase().includes(query)
    ));
    if (!matchingItems.length) continue;
    const branch = document.createElement('details');
    branch.className = 'tree-group tree-category';
    branch.open = Boolean(query);
    const branchSummary = document.createElement('summary');
    branchSummary.textContent = `${category.label} (${matchingItems.length})`;
    branch.append(branchSummary);

    for (const item of matchingItems) {
      const leaf = document.createElement('button');
      leaf.type = 'button';
      leaf.className = 'bank-leaf';
      leaf.setAttribute('role', 'treeitem');
      const sequence = item.id.match(/-(\d{3})$/)?.[1];
      leaf.textContent = sequence ? `${item.title} · ${sequence}` : item.title;
      leaf.title = item.id;
      leaf.dataset.puzzleId = item.id;
      if (selectedPuzzle?.id === item.id) leaf.classList.add('selected');
      leaf.addEventListener('click', () => loadPuzzle(category, item));
      branch.append(leaf);
    }
    level.append(branch);
  }
  endgames.append(level);
  bankTree.append(endgames);
}

async function loadPuzzle(category, puzzle) {
  stopPlayback();
  finishRecordingForPositionChange();
  try {
    const base = '../bank/endgame/L1/';
    const fenText = await fetchText(base + puzzle.fen);
    game = createGameFromFen(fenText);
    initialFen = fenText.trim();
    selectedPuzzle = { ...puzzle, category, base };
    selectedSquare = null;
    legalTargets = [];
    positionTitle.textContent = puzzle.title;
    solutionVariant.replaceChildren();
    solutionVariant.hidden = puzzle.solutions.length === 0;
    document.getElementById('solutionVersionRow').hidden = puzzle.solutions.length === 0;
    document.getElementById('explanationVersionRow').hidden = puzzle.explanations.length === 0;
    const savedAnswer = localRead(`xiàngqi:solution:${puzzle.id}`);
    const savedNote = localRead(`xiàngqi:explanation:${puzzle.id}`);
    document.getElementById('solutionVersion').value = String(Math.max(puzzle.solutions.length, savedAnswer?.version || 0) + 1);
    document.getElementById('explanationVersion').value = String(Math.max(puzzle.explanations.length, savedNote?.version || 0) + 1);
    puzzle.solutions.forEach((file, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `答案 ${String(index + 1).padStart(3, '0')}`;
      solutionVariant.append(option);
    });
    renderBankTree();
    await loadPuzzleMaterials(0);
    ruleNote.textContent = `已载入：${puzzle.title}`;
    render();
  } catch (error) {
    ruleNote.textContent = `载入失败：${error.message}`;
  }
}

async function loadPuzzleMaterials(solutionIndex) {
  if (!selectedPuzzle) return;
  const { base, solutions, explanations, id } = selectedPuzzle;
  const savedSolution = localRead(`xiàngqi:solution:${id}`);
  const savedExplanation = localRead(`xiàngqi:explanation:${id}`);
  solutionText.value = savedSolution?.text || '';
  explanationText.value = savedExplanation?.text || '';

  if (!solutionText.value && solutions[solutionIndex]) {
    solutionText.value = await fetchText(base + solutions[solutionIndex]).catch(() => '');
  }
  if (!explanationText.value && explanations.length) {
    explanationText.value = await fetchText(base + explanations[0]).catch(() => '');
  }
  solutionStatus.textContent = solutionText.value ? `已载入 ${solutions[solutionIndex] ? `答案 ${solutionIndex + 1}` : '本机保存版本'}。` : '该题暂无答案文件，可开始记录。';
  explanationStatus.textContent = explanationText.value ? `已载入解说（${explanations.length ? '题库版本' : '本机保存版本'}）。` : '该题暂无解说，可在此撰写。';
  saveSolutionButton.disabled = !solutionText.value.trim();
  saveExplanationButton.disabled = !explanationText.value.trim();
}

async function loadPuzzleSolution(index) {
  if (!selectedPuzzle) return;
  solutionText.value = await fetchText(selectedPuzzle.base + selectedPuzzle.solutions[index]).catch(() => '');
  solutionStatus.textContent = solutionText.value ? `已载入答案 ${index + 1}。` : '答案文件载入失败。';
  saveSolutionButton.disabled = !solutionText.value.trim();
  const explanationFile = selectedPuzzle.explanations[index];
  if (explanationFile) {
    explanationText.value = await fetchText(selectedPuzzle.base + explanationFile).catch(() => '');
    explanationStatus.textContent = explanationText.value ? `已载入解法 ${index + 1} 的解说。` : '该解法暂无配套解说。';
    saveExplanationButton.disabled = !explanationText.value.trim();
  }
}

function toggleRecording() {
  if (!recording) {
    recording = true;
    recordingStart = game.history.length;
    solutionText.value = '';
    recordingButton.textContent = '结束记录';
    recordingButton.classList.add('recording');
    saveSolutionButton.disabled = true;
    document.getElementById('solutionVersionRow').hidden = false;
    solutionStatus.textContent = '正在记录后续手动着法。';
    ruleNote.textContent = '记录已开始，走棋会写入中间棋谱区。';
    return;
  }
  recording = false;
  recordingButton.textContent = '开始记录';
  recordingButton.classList.remove('recording');
  saveSolutionButton.disabled = !solutionText.value.trim();
  solutionStatus.textContent = solutionText.value.trim() ? '记录结束，可保存到本机并下载棋谱。' : '记录结束，尚无新着法。';
}

function updateRecordedSolution() {
  const moves = game.history.slice(recordingStart);
  solutionText.value = moves.map((move, index) => {
    const turnNumber = Math.floor(index / 2) + 1;
    const prefix = move.turn === RED ? `${turnNumber}.` : `${turnNumber}…`;
    return `${prefix} ${formatMove(move)}`;
  }).join('\n');
  saveSolutionButton.disabled = moves.length === 0;
  solutionStatus.textContent = `${moves.length} 着已记录${moves.length ? '。' : '，请在棋盘上走棋。'}`;
}

function formatMove(move) {
  const file = fileNumber(move.turn, move.from.col);
  const targetFile = fileNumber(move.turn, move.to.col);
  const forward = move.turn === RED ? move.to.row < move.from.row : move.to.row > move.from.row;
  const direction = move.from.row === move.to.row ? '平' : forward ? '进' : '退';
  const distance = move.from.row === move.to.row ? targetFile : Math.abs(move.to.row - move.from.row);
  return `${getPieceLabel(move.piece)}${chineseNumber(file)}${direction}${chineseNumber(distance)}`;
}

function chineseNumber(number) {
  return ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'][number] || String(number);
}

async function saveSolution() {
  const text = solutionText.value.trim();
  if (!text) return;
  const version = Math.max(1, Number(document.getElementById('solutionVersion').value) || 1);
  const id = selectedPuzzle?.id || 'manual-game';
  const content = `${text}\n# END\n# 解法 ${version}\n`;
  if (selectedPuzzle?.rootGene === 'manual') {
    try {
      const response = await fetch(`http://localhost:8787/api/v1/chinese-chess/root-gene/puzzle/${encodeURIComponent(id)}/material`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'solution', version, text })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '题库棋谱保存失败。');
      selectedPuzzle.solutions ||= [];
      if (!selectedPuzzle.solutions.includes(result.relativePath)) selectedPuzzle.solutions.push(result.relativePath);
      solutionVariant.replaceChildren();
      selectedPuzzle.solutions.forEach((file, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = `答案 ${String(index + 1).padStart(3, '0')}`;
        solutionVariant.append(option);
      });
      solutionVariant.hidden = selectedPuzzle.solutions.length < 2;
      document.getElementById('solutionVersionRow').hidden = false;
      solutionVariant.value = '0';
      solutionStatus.textContent = `答案版本 ${String(version).padStart(3, '0')} 已保存到中国象棋题库。`;
    } catch (error) {
      solutionStatus.textContent = `${error.message || '题库服务不可用'}；已保存本机副本并下载。`;
    }
  }
  localWrite(`xiàngqi:solution:${id}`, { text: content, version, updatedAt: new Date().toISOString() });
  downloadText(`${id}-${String(version).padStart(3, '0')}.txt`, content);
  document.getElementById('solutionVersionRow').hidden = false;
  if (selectedPuzzle?.rootGene !== 'manual') solutionStatus.textContent = `已保存答案版本 ${version} 到本机，并下载文本文件。`;
  recording = false;
  recordingButton.textContent = '开始记录';
  recordingButton.classList.remove('recording');
}

async function saveExplanation() {
  const text = explanationText.value.trim();
  if (!text) return;
  const version = Math.max(1, Number(document.getElementById('explanationVersion').value) || 1);
  const id = selectedPuzzle?.id || 'manual-game';
  if (selectedPuzzle?.rootGene === 'manual') {
    try {
      const response = await fetch(`http://localhost:8787/api/v1/chinese-chess/root-gene/puzzle/${encodeURIComponent(id)}/material`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'explanation', version, text })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '题库解说保存失败。');
      selectedPuzzle.explanations ||= [];
      if (!selectedPuzzle.explanations.includes(result.relativePath)) selectedPuzzle.explanations.push(result.relativePath);
      explanationStatus.textContent = `解说版本 ${String(version).padStart(3, '0')} 已保存到中国象棋题库。`;
    } catch (error) {
      explanationStatus.textContent = `${error.message || '题库服务不可用'}；已保存本机副本并下载。`;
    }
  }
  localWrite(`xiàngqi:explanation:${id}`, { text, version, updatedAt: new Date().toISOString() });
  downloadText(`${id}_exp-${String(version).padStart(3, '0')}.txt`, `${text}\n`);
  document.getElementById('explanationVersionRow').hidden = false;
  if (selectedPuzzle?.rootGene !== 'manual') explanationStatus.textContent = `解说版本 ${version} 已保存到本机，并下载文本文件。`;
}

function syncSavedSolutionVersions() {
  solutionVariant.replaceChildren();
  for (const [index] of (selectedPuzzle?.solutions || []).entries()) {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `答案 ${String(index + 1).padStart(3, '0')}`;
    solutionVariant.append(option);
  }
  solutionVariant.hidden = selectedPuzzle.solutions.length < 2;
  document.getElementById('solutionVersionRow').hidden = false;
}

async function loadPositionFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    finishRecordingForPositionChange();
    const text = await file.text();
    let fen = text.trim();
    if (file.name.toLowerCase().endsWith('.json')) {
      const data = JSON.parse(text);
      fen = data.boardData?.initialPosition || data.content?.fen || data.generated_data?.fen_positions || data.fen || '';
    }
    game = createGameFromFen(fen);
    initialFen = fen;
    selectedPuzzle = null;
    selectedSquare = null;
    legalTargets = [];
    solutionVariant.replaceChildren();
    solutionVariant.hidden = true;
    document.getElementById('solutionVersionRow').hidden = true;
    document.getElementById('explanationVersionRow').hidden = true;
    positionTitle.textContent = file.name;
    solutionText.value = '';
    explanationText.value = '';
    solutionStatus.textContent = '已载入本地局面文件。';
    explanationStatus.textContent = '可为此局面撰写解说。';
    renderBankTree();
    render();
    ruleNote.textContent = `已载入局面：${file.name}`;
  } catch (error) {
    ruleNote.textContent = `局面文件无法载入：${error.message}`;
  } finally {
    event.target.value = '';
  }
}

async function loadTextFile(event, target, status, label) {
  const file = event.target.files?.[0];
  if (!file) return;
  target.value = await file.text();
  status.textContent = `已载入本地${label}文件：${file.name}`;
  if (target === solutionText) saveSolutionButton.disabled = !target.value.trim();
  else saveExplanationButton.disabled = !target.value.trim();
  event.target.value = '';
}

function resetPosition() {
  stopPlayback();
  game = initialFen ? createGameFromFen(initialFen) : createGame();
  selectedSquare = null;
  legalTargets = [];
  recording = false;
  recordingButton.textContent = '开始记录';
  recordingButton.classList.remove('recording');
  ruleNote.textContent = '局面已重置。';
  render();
}

function finishRecordingForPositionChange() {
  if (!recording) return;
  recording = false;
  recordingButton.textContent = '开始记录';
  recordingButton.classList.remove('recording');
}

function togglePlayback() {
  if (playbackTimer) {
    stopPlayback();
    return;
  }
  const history = game.history.map(move => ({ from: { ...move.from }, to: { ...move.to } }));
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

function speakExplanation() {
  if (!explanationText.value.trim()) {
    ruleNote.textContent = '当前没有可朗读的解说。';
    return;
  }
  if (!window.speechSynthesis) {
    ruleNote.textContent = '此浏览器暂不支持语音朗读。';
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(explanationText.value);
  utterance.lang = 'zh-CN';
  utterance.volume = controlPanel.getVolume() / 100;
  utterance.rate = 0.75 + controlPanel.controls.speed.value / 20;
  speechSynthesis.speak(utterance);
}

function playMoveSound(capture) {
  if (!soundEnabled || controlPanel.getVolume() === 0) return;
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = capture ? 300 : 460;
    gain.gain.value = controlPanel.getVolume() / 1000;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.07);
    oscillator.onended = () => audio.close();
  } catch {}
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`文件载入失败 (${response.status})`);
  return response.text();
}

function localRead(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function localWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    ruleNote.textContent = '浏览器本机存储不可用，请使用下载文件保留内容。';
    return false;
  }
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

render();