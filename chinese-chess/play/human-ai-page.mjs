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
import { createBoardAudio } from '../shared/board-audio.mjs';
import { bindPlayModeSession, restorePlayModeSession } from '../shared/play-mode-session.mjs';

applyBoardStyle();
onBoardStyleChange(() => {});

const boardElement = document.getElementById('humanAiBoard');
const playerSideLabel = document.querySelector('.human-ai-side-label');
const analysisStatus = document.getElementById('humanAnalysisStatus');
const analysisDepth = document.getElementById('humanDepthStatus');
const analysisNodes = document.getElementById('humanNodesStatus');
const analysisTime = document.getElementById('humanTimeStatus');
const analysisCandidates = document.getElementById('humanCandidates');
const turnStatusLines = document.querySelectorAll('.search-box p');
const analysisFill = document.getElementById('humanAdvantageFill');
const analysisPercent = document.getElementById('humanAdvantagePercent');
const evaluationText = document.getElementById('humanEvaluationText');
const engineStatus = document.getElementById('humanEngineStatus');

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
let selectedPuzzle = modeSession?.selectedPuzzle || null;
let engineAbortController = null;
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
    if (action === 'side') {
      humanSide = humanSide === RED ? BLACK : RED;
      controlPanel.setSide(humanSide === RED ? 'red' : 'black');
      analysisStatus.textContent = `你执${sideName(humanSide)}。`;
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

controlPanel.setVoice(false);
const audio = createBoardAudio(controlPanel, {
  onStatus(message) { analysisStatus.textContent = message; }
});

if (modeSession) {
  controlPanel.setSide(humanSide);
}
audio.refresh();
bindPlayModeSession(document.getElementById('humanControlPanel'), () => ({
  game, selectedPuzzle, recording: false, recordingStart: 0, humanSide,
  initialFen,
  solution: modeSession?.solution || '', explanation: modeSession?.explanation || '',
  solutionVariant: modeSession?.solutionVariant, boardSide: controlPanel.getSide()
}), pauseEngine);


renderBoard();
connectEngine();

async function connectEngine() {
  const token = requestToken;
  engineStatus.textContent = '正在连接 Pikafish...';
  controlPanel.controls.play.disabled = true;
  try {
    const response = await fetch('http://localhost:8787/api/v1/chinese-chess/engine/health');
    const status = await response.json();
    engineReady = response.ok && Boolean(status.available);
    gameStarted = engineReady && token === requestToken;
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
  if (status.type === 'checkmate' || status.type === 'stalemate') {
    analysisStatus.textContent = `${sideName(status.turn)}${status.type === 'checkmate' ? '将死' : '困毙'}，${sideName(status.winner)}获胜（${status.winner === humanSide ? '你获胜' : 'Pikafish获胜'}）。`;
  } else if (status.type === 'check') {
    analysisStatus.textContent = `${game.turn === RED ? '红方' : '黑方'}被将军。`;
  }
}

function isGameFinished() {
  const type = getGameStatus(game).type;
  return type === 'checkmate' || type === 'stalemate' || type === 'invalid';
}

function undoTurn() {
  audio.stop();
  if (engineThinking) return;
  engineAbortController?.abort();
  requestToken += 1;
  undoMove(game);
  if (game.history.length && game.turn !== humanSide) undoMove(game);
  selected = null;
  legalTargets = [];
  renderBoard();
  analysisStatus.textContent = `已悔去最近一回合。轮到${sideName(humanSide)}。`;
}

function redoTurn() {
  if (engineThinking) return;
  const replayed = redoMove(game);
  if (replayed && game.turn !== humanSide) redoMove(game);
  selected = null;
  legalTargets = [];
  renderBoard();
  updateTurnStatus();
  if (replayed) audio.move(game);
}

function resetGame() {
  audio.stop();
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

function playMoveSound() {
  audio.move(game);
}

function sideName(side) {
  return side === RED ? '红方' : '黑方';
}

function sameSquare(first, second) {
  return first.row === second.row && first.col === second.col;
}

function squareKey(square) {
  return `${square.row},${square.col}`;
}
