import {
  BLACK,
  RED,
  createGame,
  createGameFromFen,
  getGameStatus,
  getLegalMoves,
  getPieceLabel,
  makeMove,
  undoMove,
  redoMove,
  toFen
} from '../core.mjs';
import {
  appendStandardPositionMark,
  createStandardBoardArtwork,
  createStandardPieceElement,
  isCannonStartPosition,
  isPawnStartPosition,
  placeStandardIntersection
} from '../board-standard.mjs';
import { applyBoardStyle, onBoardStyleChange } from '../board-style.mjs';
import { mountBoardControlPanel } from '../shared/board-control-panel.mjs';
import { bindPlayModeSession, restorePlayModeSession } from '../shared/play-mode-session.mjs';

applyBoardStyle();
onBoardStyleChange(() => {});

const boardElement = document.getElementById('humanAiBoard');
const playerSideLabel = document.querySelector('.human-ai-side-label');
const analysisStatus = document.getElementById('humanAnalysisStatus');
const puzzleStatus = document.getElementById('humanPuzzleStatus');
const analysisDepth = document.getElementById('humanDepthStatus');
const analysisNodes = document.getElementById('humanNodesStatus');
const analysisTime = document.getElementById('humanTimeStatus');
const analysisCandidates = document.getElementById('humanCandidates');
const turnStatusLines = document.querySelectorAll('.search-box p');
const analysisFill = document.getElementById('humanAdvantageFill');
const analysisPercent = document.getElementById('humanAdvantagePercent');
const evaluationText = document.getElementById('humanEvaluationText');
const engineStatus = document.getElementById('humanEngineStatus');
const solutionEditor = document.getElementById('humanSolutionText');
const explanationEditor = document.getElementById('humanExplanationText');
const solutionStatus = document.getElementById('humanSolutionStatus');
const explanationStatus = document.getElementById('humanExplanationStatus');
const recordButton = document.getElementById('humanRecordButton');
const saveSolutionButton = document.getElementById('humanSaveSolution');
const saveExplanationButton = document.getElementById('humanSaveExplanation');
const bankTree = document.getElementById('humanBankTree');
const bankSearch = document.getElementById('humanBankSearch');
const bankCount = document.getElementById('humanBankCount');
const positionFile = document.getElementById('humanPositionFile');

const modeSession = restorePlayModeSession();
let game = modeSession?.game || createGame();
let initialFen = modeSession?.initialFen || toFen(game);
let selected = null;
let legalTargets = [];
let engineReady = false;
let engineThinking = false;
let requestToken = 0;
let gameStarted = false;
let humanSide = modeSession?.humanSide || game.turn;
let recording = modeSession?.recording || false;
let recordingStart = modeSession?.recordingStart || 0;
let selectedPuzzle = modeSession?.selectedPuzzle || null;
let bankManifest = null;
let engineAbortController = null;
let soundEnabled = true;
let audioContext = null;
const controlPanel = mountBoardControlPanel(document.getElementById('humanControlPanel'), {
  mode: 'human-ai',
  hrefs: { manual: './index.html', 'human-ai': './human-ai.html', 'ai-ai': './ai-ai.html' },
  side: 'red',
  onAction(action) {
    if (action === 'reset') resetGame();
    if (action === 'play') {
      if (gameStarted) pauseEngine();
      else if (!engineReady) connectEngine();
      else {
        gameStarted = true;
        controlPanel.setPlaying(true);
        if (game.turn !== humanSide) requestEngineMove();
        renderBoard();
      }
    }
    if (action === 'undo') undoTurn();
    if (action === 'redo') redoTurn();
    if (action === 'sound') toggleSound();
    if (action === 'voice') speakStatus();
    if (action === 'side') {
      humanSide = humanSide === RED ? BLACK : RED;
      controlPanel.setSide(humanSide === RED ? 'red' : 'black');
      puzzleStatus.textContent = `你执${sideName(humanSide)}。`;
      if (engineThinking) {
        requestToken += 1;
        engineAbortController?.abort();
        engineThinking = false;
      }
      if (engineReady && gameStarted && game.turn !== humanSide) requestEngineMove();
      renderBoard();
    }
  }
});

if (modeSession) {
  solutionEditor.value = modeSession.solution || '';
  explanationEditor.value = modeSession.explanation || '';
  saveSolutionButton.disabled = !solutionEditor.value.trim();
  saveExplanationButton.disabled = !explanationEditor.value.trim();
  recordButton.textContent = recording ? '结束记录' : '开始记录';
  puzzleStatus.textContent = selectedPuzzle?.title || '当前棋局';
  controlPanel.setSide(humanSide);
}
bindPlayModeSession(document.getElementById('humanControlPanel'), () => ({
  game, selectedPuzzle, recording, recordingStart, humanSide,
  initialFen,
  solution: solutionEditor.value, explanation: explanationEditor.value,
  solutionVariant: modeSession?.solutionVariant, boardSide: controlPanel.getSide()
}), pauseEngine);

document.getElementById('humanLoadPosition').addEventListener('click', () => positionFile.click());
document.getElementById('humanLoadSolution').addEventListener('click', loadSolution);
document.getElementById('humanLoadExplanation').addEventListener('click', loadExplanation);
saveSolutionButton.addEventListener('click', saveSolution);
saveExplanationButton.addEventListener('click', saveExplanation);
recordButton.addEventListener('click', toggleRecording);
solutionEditor.addEventListener('input', () => { saveSolutionButton.disabled = !solutionEditor.value.trim(); });
explanationEditor.addEventListener('input', () => { saveExplanationButton.disabled = !explanationEditor.value.trim(); });
bankSearch.addEventListener('input', renderBankTree);
positionFile.addEventListener('change', loadPositionFile);

renderBoard();
loadBank();
connectEngine();

async function connectEngine() {
  engineStatus.textContent = '正在连接 Pikafish...';
  controlPanel.controls.play.disabled = true;
  try {
    const response = await fetch('http://localhost:8787/api/v1/chinese-chess/engine/health');
    const status = await response.json();
    engineReady = response.ok && Boolean(status.available);
    gameStarted = engineReady;
    engineStatus.textContent = engineReady
      ? 'Pikafish 已就绪 · 人机对弈可用'
      : '未检测到 Pikafish 引擎，请启动本地服务。';
    analysisStatus.textContent = engineReady
      ? `${modeSession ? '当前棋局已恢复。' : ''}你执${sideName(humanSide)}，${game.turn === humanSide ? '请走棋。' : '等待 Pikafish 走棋。'}`
      : '引擎不可用';
  } catch {
    engineReady = false;
    gameStarted = false;
    engineStatus.textContent = '本地引擎服务未连接（端口 8787）。请运行 VS Code 任务“Start MindsEvo local engine server”，然后点击播放重试。';
    analysisStatus.textContent = '等待引擎连接';
  } finally {
    controlPanel.controls.play.disabled = false;
    controlPanel.setPlaying(engineReady && gameStarted);
    controlPanel.controls.play.title = engineReady && game.turn !== humanSide ? '暂停对弈' : engineReady ? '暂停对弈' : '重试连接引擎';
    if (engineReady && gameStarted && game.turn !== humanSide && !engineThinking && !isGameFinished()) requestEngineMove();
    renderBoard();
  }
}

function renderBoard() {
  playerSideLabel.textContent = `${sideName(humanSide)}走棋`;
  boardElement.replaceChildren(createStandardBoardArtwork('human-ai-lines xiangqi-grid-svg'));
  const targets = new Set(legalTargets.map(squareKey));
  const gameStatus = getGameStatus(game);
  const gameEnded = gameStatus.type === 'checkmate' || gameStatus.type === 'stalemate' || gameStatus.type === 'invalid';

  for (let row = 0; row < game.board.length; row += 1) {
    for (let col = 0; col < game.board[row].length; col += 1) {
      const piece = game.board[row][col];
      const position = { row, col };
      const square = document.createElement('button');
      square.type = 'button';
      square.className = 'xiangqi-intersection human-ai-square';
      placeStandardIntersection(square, row, col);
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 路`
        : `空位，第 ${row + 1} 行第 ${col + 1} 路`);
      if (selected && sameSquare(position, selected)) square.classList.add('human-selected');
      if (targets.has(squareKey(position))) square.classList.add(piece ? 'human-capture-target' : 'human-move-target');
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'human-ai-piece'));
      square.disabled = !engineReady || engineThinking || !gameStarted || gameEnded;
      square.addEventListener('click', () => handleSquareClick(position));
      boardElement.append(square);
    }
  }

  controlPanel.controls.undo.disabled = game.history.length < 2 || engineThinking;
  controlPanel.controls.redo.disabled = game.redoStack.length < 2 || engineThinking;
}

function handleSquareClick(position) {
  if (!engineReady || engineThinking || !gameStarted || game.turn !== humanSide) return;

  if (selected && legalTargets.some(target => sameSquare(target, position))) {
    makeMove(game, selected, position);
    playMoveSound();
    selected = null;
    legalTargets = [];
    renderBoard();
    updateTurnStatus();
    updateRecording();
    if (game.turn !== humanSide && !isGameFinished()) requestEngineMove();
    return;
  }

  const piece = game.board[position.row][position.col];
  if (piece && (piece === piece.toUpperCase() ? RED : BLACK) === humanSide) {
    selected = position;
    legalTargets = getLegalMoves(game, position, humanSide);
    renderBoard();
    analysisStatus.textContent = `${sideName(humanSide)}${getPieceLabel(piece)} · ${legalTargets.length} 个合法落点`;
  } else {
    selected = null;
    legalTargets = [];
    renderBoard();
  }
}

async function requestEngineMove() {
  const token = ++requestToken;
  engineThinking = true;
  analysisStatus.textContent = 'Pikafish 正在思考...';
  analysisCandidates.textContent = '引擎搜索中...';
  turnStatusLines[game.turn === RED ? 0 : 1].textContent = `${sideName(game.turn)}: 思考中`;
  turnStatusLines[game.turn === RED ? 1 : 0].textContent = `${sideName(game.turn === RED ? BLACK : RED)}: 等待中`;
  turnStatusLines[2].textContent = `着法: ${Math.ceil(game.history.length / 2)} 回合`;
  renderBoard();

  try {
    await new Promise(resolve => setTimeout(resolve, Math.max(100, 1100 - Number(controlPanel.controls.speed.value) * 100)));
    if (token !== requestToken) return;
    const settings = {
      threads: 1,
      hash: 128,
      depth: Math.min(Number(document.getElementById('humanDepth').value), Number(document.getElementById('humanSkill').value)),
      movetime: Number(document.getElementById('humanMoveTime').value),
      multiPv: Number(document.getElementById('humanMultiPv').value)
    };
    engineAbortController = new AbortController();
    const response = await fetch('http://localhost:8787/api/v1/chinese-chess/engine/ai-ai/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen: toFen(game), side: game.turn === RED ? 'red' : 'black', settings }),
      signal: engineAbortController.signal
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `引擎请求失败 (${response.status})`);
    if (token !== requestToken) return;
    if (!result.move || !makeMove(game, result.move.from, result.move.to)) throw new Error('引擎返回的着法无法应用。');
    playMoveSound();
    updateAnalysis(result);
    updateRecording();
    analysisStatus.textContent = `轮到${sideName(humanSide)}走棋。`;
  } catch (error) {
    if (token === requestToken) analysisStatus.textContent = error.message || 'Pikafish 请求失败。';
  } finally {
    if (token === requestToken) {
      engineAbortController = null;
      engineThinking = false;
      renderBoard();
      updateTurnStatus();
    }
  }
}

function updateAnalysis(result) {
  const info = result.info || {};
  const score = Number(info.score?.value) || 0;
  const redScore = -score;
  const percentage = Math.round(Math.max(5, Math.min(95, 50 + redScore * 8)));
  analysisFill.style.width = `${percentage}%`;
  analysisPercent.textContent = `${percentage}%`;
  analysisDepth.textContent = `深度: ${info.depth ?? '-'} 层`;
  analysisNodes.textContent = `节点: ${Number(info.nodes || 0).toLocaleString()}`;
  analysisTime.textContent = `时间: ${info.time ?? 0}ms`;
  evaluationText.textContent = `Pikafish 评估: ${scoreText(info.score)} · 主变化 ${result.info?.pv?.slice(0, 5).join(' ') || result.bestMove}`;
  analysisCandidates.textContent = (result.multipv || []).map((line, index) => (
    `${index + 1}. ${line.pv?.slice(0, 4).join(' ') || result.bestMove}  ${scoreText(line.score)}`
  )).join('\n') || result.bestMove;
  analysisCandidates.style.whiteSpace = 'pre-line';
  turnStatusLines[0].textContent = `红方: ${game.turn === RED ? '等待中' : '已完成'}`;
  turnStatusLines[1].textContent = `黑方: ${game.turn === BLACK ? '等待中' : '已完成'}`;
  turnStatusLines[2].textContent = `着法: ${Math.ceil(game.history.length / 2)} 回合`;
}

function scoreText(score) {
  if (!score) return '评估中';
  return score.type === 'mate' ? `杀 ${score.value}` : `${score.value > 0 ? '+' : ''}${score.value.toFixed(2)}`;
}

function updateTurnStatus() {
  const status = getGameStatus(game);
  if (status.type === 'playing') {
    analysisStatus.textContent = game.turn === humanSide ? `轮到${sideName(humanSide)}走棋。` : `${sideName(game.turn)}准备应手。`;
    return;
  }
  if (status.type === 'checkmate') {
    analysisStatus.textContent = `${status.winner === RED ? '红方' : '黑方'}将死，${status.winner === RED ? '你获胜' : 'Pikafish获胜'}。`;
  } else if (status.type === 'stalemate') {
    analysisStatus.textContent = '困毙，和棋。';
  } else if (status.type === 'check') {
    analysisStatus.textContent = `${game.turn === RED ? '红方' : '黑方'}被将军。`;
  }
}

function isGameFinished() {
  const type = getGameStatus(game).type;
  return type === 'checkmate' || type === 'stalemate' || type === 'invalid';
}

function undoTurn() {
  if (engineThinking) return;
  engineAbortController?.abort();
  requestToken += 1;
  undoMove(game);
  if (game.history.length && game.turn !== humanSide) undoMove(game);
  selected = null;
  legalTargets = [];
  renderBoard();
  updateRecording();
  analysisStatus.textContent = `已悔去最近一回合。轮到${sideName(humanSide)}。`;
}

function redoTurn() {
  if (engineThinking) return;
  if (redoMove(game) && game.turn !== humanSide) redoMove(game);
  selected = null;
  legalTargets = [];
  renderBoard();
  updateRecording();
  updateTurnStatus();
}

function resetGame() {
  engineAbortController?.abort();
  requestToken += 1;
  engineThinking = false;
  gameStarted = true;
  game = createGame();
  initialFen = toFen(game);
  humanSide = RED;
  controlPanel.setSide('red');
  controlPanel.setPlaying(engineReady);
  selected = null;
  legalTargets = [];
  selectedPuzzle = null;
  puzzleStatus.textContent = '从右侧残局题库选择棋局，开始练习。';
  recording = false;
  recordingStart = 0;
  recordButton.textContent = '开始记录';
  solutionEditor.value = '';
  explanationEditor.value = '';
  saveSolutionButton.disabled = true;
  saveExplanationButton.disabled = true;
  solutionStatus.textContent = '答案保存在本机浏览器并可下载文本。';
  explanationStatus.textContent = '解说单独保存为本机草稿与下载文件。';
  analysisStatus.textContent = engineReady ? '你执红方，请先走棋。' : '请先连接 Pikafish 引擎。';
  analysisDepth.textContent = '深度: - 层';
  analysisNodes.textContent = '节点: -';
  analysisTime.textContent = '时间: --s';
  analysisCandidates.textContent = '走棋后显示 Pikafish 候选着法。';
  turnStatusLines[0].textContent = '红方: 等待中';
  turnStatusLines[1].textContent = '黑方: 等待中';
  turnStatusLines[2].textContent = '着法: 0 回合';
  analysisFill.style.width = '50%';
  analysisPercent.textContent = '50%';
  evaluationText.textContent = '开始对弈后显示引擎评估与主要变化。';
  renderBoard();
}

async function loadBank() {
  try {
    const response = await fetch('../bank/endgame/L1/manifest.json');
    if (!response.ok) throw new Error('题库清单暂不可用。');
    bankManifest = await response.json();
    const total = bankManifest.categories.reduce((sum, category) => sum + category.items.length, 0);
    bankCount.textContent = `${total} 局`;
    renderBankTree();
  } catch {
    bankCount.textContent = '不可用';
    bankTree.replaceChildren();
    const note = document.createElement('p');
    note.className = 'bank-note';
    note.textContent = '题库暂不可用，请通过本地服务访问。';
    bankTree.append(note);
  }
}

function renderBankTree() {
  if (!bankManifest) return;
  const query = bankSearch.value.trim().toLocaleLowerCase();
  bankTree.replaceChildren();

  const recommendation = document.createElement('details');
  const recommendationTitle = document.createElement('summary');
  recommendationTitle.textContent = '手动推荐';
  const recommendationNote = document.createElement('p');
  recommendationNote.className = 'bank-note';
  recommendationNote.textContent = '个性化推荐暂未接入。';
  recommendation.append(recommendationTitle, recommendationNote);
  bankTree.append(recommendation);

  const endgames = document.createElement('details');
  endgames.open = true;
  const endgameTitle = document.createElement('summary');
  endgameTitle.textContent = '残局基因 (endgame)';
  const level = document.createElement('details');
  level.open = true;
  const levelTitle = document.createElement('summary');
  levelTitle.textContent = 'L1 基础';
  level.append(levelTitle);

  for (const category of bankManifest.categories) {
    const matchingItems = category.items.filter(item => (
      !query || item.title.toLocaleLowerCase().includes(query) || item.id.toLocaleLowerCase().includes(query)
    ));
    if (!matchingItems.length) continue;
    const categoryNode = document.createElement('details');
    categoryNode.open = Boolean(query);
    const title = document.createElement('summary');
    title.textContent = `${category.label} (${matchingItems.length})`;
    categoryNode.append(title);
    for (const item of matchingItems) {
      const leaf = document.createElement('button');
      leaf.type = 'button';
      leaf.className = `bank-leaf${selectedPuzzle?.id === item.id ? ' selected' : ''}`;
      leaf.textContent = item.title;
      leaf.title = item.id;
      leaf.addEventListener('click', () => loadPuzzle(category, item));
      categoryNode.append(leaf);
    }
    level.append(categoryNode);
  }
  endgames.append(endgameTitle, level);
  bankTree.append(endgames);
}

async function loadPuzzle(category, puzzle) {
  try {
    const response = await fetch(`../bank/endgame/L1/${puzzle.fen}`);
    if (!response.ok) throw new Error('残局局面文件载入失败。');
    const fen = (await response.text()).trim();
    engineAbortController?.abort();
    requestToken += 1;
    engineThinking = false;
    gameStarted = true;
    game = createGameFromFen(fen);
    initialFen = toFen(game);
    humanSide = game.turn;
    controlPanel.setSide(humanSide === RED ? 'red' : 'black');
    selectedPuzzle = { ...puzzle, category, base: '../bank/endgame/L1/' };
    puzzleStatus.textContent = `${puzzle.title} · ${category.label} · ${humanSide === RED ? '红方先行' : '黑方先行'}`;
    selected = null;
    legalTargets = [];
    recording = false;
    recordingStart = game.history.length;
    recordButton.textContent = '开始记录';
    solutionEditor.value = '';
    explanationEditor.value = '';
    saveSolutionButton.disabled = true;
    saveExplanationButton.disabled = true;
    analysisCandidates.textContent = `已载入：${puzzle.title}`;
    analysisStatus.textContent = `局面已载入，你执${sideName(humanSide)}。`;
    renderBoard();
    renderBankTree();
    if (engineReady && game.turn !== humanSide) requestEngineMove();
  } catch (error) {
    analysisStatus.textContent = error.message || '局面载入失败。';
  }
}

async function loadSolution() {
  if (!selectedPuzzle) {
    const saved = readLocal(`xiàngqí:solution:${'manual-game'}`);
    if (saved?.text) solutionEditor.value = saved.text;
    solutionStatus.textContent = solutionEditor.value ? '已载入本机答案草稿。' : '请先选择题库局面或开始记录。';
  } else if (selectedPuzzle.solutions?.length) {
    try {
      const response = await fetch(selectedPuzzle.base + selectedPuzzle.solutions[0]);
      if (!response.ok) throw new Error('答案文件载入失败。');
      solutionEditor.value = await response.text();
      solutionStatus.textContent = '已载入题库答案预览。';
    } catch (error) { solutionStatus.textContent = error.message; }
  } else solutionStatus.textContent = '该局面暂无配套答案文件。';
  saveSolutionButton.disabled = !solutionEditor.value.trim();
}

async function loadExplanation() {
  if (!selectedPuzzle) {
    const saved = readLocal('xiàngqí:explanation:manual-game');
    if (saved?.text) explanationEditor.value = saved.text;
    explanationStatus.textContent = explanationEditor.value ? '已载入本机解说草稿。' : '请先选择题库局面。';
  } else if (selectedPuzzle.explanations?.length) {
    try {
      const response = await fetch(selectedPuzzle.base + selectedPuzzle.explanations[0]);
      if (!response.ok) throw new Error('解说文件载入失败。');
      explanationEditor.value = await response.text();
      explanationStatus.textContent = '已载入题库解说预览。';
    } catch (error) { explanationStatus.textContent = error.message; }
  } else explanationStatus.textContent = '该局面暂无配套解说文件。';
  saveExplanationButton.disabled = !explanationEditor.value.trim();
}

function toggleRecording() {
  if (!recording) {
    recording = true;
    recordingStart = game.history.length;
    solutionEditor.value = '';
    recordButton.textContent = '结束记录';
    solutionStatus.textContent = '正在记录后续手动着法。';
  } else {
    recording = false;
    recordButton.textContent = '开始记录';
    solutionStatus.textContent = solutionEditor.value.trim() ? '记录结束，可保存到本机并下载棋谱。' : '记录结束，尚无新着法。';
  }
  saveSolutionButton.disabled = !solutionEditor.value.trim();
}

function updateRecording() {
  if (!recording) return;
  const moves = game.history.slice(recordingStart);
  solutionEditor.value = moves.map((move, index) => {
    const number = Math.floor(index / 2) + 1;
    return `${move.turn === RED ? `${number}.` : `${number}…`} ${formatUcci(move)}`;
  }).join('\n');
  saveSolutionButton.disabled = !moves.length;
  solutionStatus.textContent = `${moves.length} 着已记录。`;
}

function formatUcci(move) {
  const files = 'abcdefghi';
  return `${files[move.from.col]}${9 - move.from.row}${files[move.to.col]}${9 - move.to.row}`;
}

function saveSolution() {
  saveLocal(`xiàngqí:solution:${selectedPuzzle?.id || 'manual-game'}`, `${solutionEditor.value.trim()}\n# END\n`);
  downloadText(`${selectedPuzzle?.id || 'manual-game'}-1.txt`, `${solutionEditor.value.trim()}\n# END\n`);
  solutionStatus.textContent = '已保存到本机并下载棋谱文本。';
}

function saveExplanation() {
  saveLocal(`xiàngqí:explanation:${selectedPuzzle?.id || 'manual-game'}`, explanationEditor.value.trim());
  downloadText(`${selectedPuzzle?.id || 'manual-game'}_exp.txt`, explanationEditor.value.trim());
  explanationStatus.textContent = '已保存到本机并下载解说文本。';
}

function saveLocal(key, text) {
  try { localStorage.setItem(key, JSON.stringify({ text, updatedAt: new Date().toISOString() })); }
  catch { analysisStatus.textContent = '浏览器本机存储不可用，请使用下载文件保留内容。'; }
}

function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function downloadText(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function loadPositionFile(event) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (!file) return;
  file.text().then(text => {
    try {
      engineAbortController?.abort();
      requestToken += 1;
      engineThinking = false;
      gameStarted = true;
      game = createGameFromFen(text.trim());
      initialFen = toFen(game);
      humanSide = game.turn;
      controlPanel.setSide(humanSide === RED ? 'red' : 'black');
      selectedPuzzle = null;
      puzzleStatus.textContent = '已载入本地局面文件。';
      selected = null;
      legalTargets = [];
      analysisStatus.textContent = `局面已载入，你执${sideName(humanSide)}。`;
      renderBoard();
    } catch (error) { analysisStatus.textContent = error.message || '局面文件无效。'; }
    input.value = '';
  });
}

function pauseEngine() {
  requestToken += 1;
  engineAbortController?.abort();
  engineAbortController = null;
  engineThinking = false;
  gameStarted = false;
  controlPanel.setPlaying(false);
  analysisStatus.textContent = '引擎搜索已暂停，点击 ▶ 可继续。';
  renderBoard();
}

function speakStatus() {
  if (!('speechSynthesis' in window)) {
    analysisStatus.textContent = '当前浏览器不支持语音播报。';
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`${analysisStatus.textContent}。${evaluationText.textContent}`);
  utterance.lang = 'zh-CN';
  utterance.volume = controlPanel.getVolume() / 100;
  window.speechSynthesis.speak(utterance);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  controlPanel.controls.sound.setAttribute('aria-pressed', String(soundEnabled));
  controlPanel.controls.sound.setAttribute('aria-label', soundEnabled ? '关闭音效' : '开启音效');
  controlPanel.controls.sound.title = soundEnabled ? '关闭音效' : '开启音效';
}

function playMoveSound() {
  if (!soundEnabled) return;
  const volume = controlPanel.getVolume();
  if (volume <= 0) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ||= new AudioContextClass();
  if (audioContext.state === 'suspended') audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = 520;
  gain.gain.setValueAtTime(volume / 100 * 0.12, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.07);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.07);
}

function sideName(side) {
  return side === RED ? '红方' : '黑方';
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`文件载入失败 (${response.status})`);
  return response.text();
}

function sameSquare(first, second) {
  return first.row === second.row && first.col === second.col;
}

function squareKey(square) {
  return `${square.row},${square.col}`;
}
