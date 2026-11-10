import { BLACK, RED, createGame, createGameFromFen, getGameStatus, getPieceLabel, makeMove, undoMove, redoMove, toFen } from '../core.mjs';
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

const boardElement = document.getElementById('aiAiBoard');
const advantageText = document.querySelector('.advantage-box p');
const advantageFill = document.querySelector('.advantage-meter i');
const advantagePercent = document.querySelector('.advantage-meter span');
const statusLines = document.querySelectorAll('.search-box p');
const candidateBox = document.querySelector('.candidates-box .waiting-card');
const sideLabel = document.querySelector('.ai-ai-page .human-ai-side-label');
const modeSession = restorePlayModeSession();
let game = modeSession?.game || createGame();
let boardSide = modeSession?.boardSide || RED;
let runToken = 0;
let duelRunning = false;
let baseFen = modeSession?.initialFen || toFen(game);
let selectedPuzzle = modeSession?.selectedPuzzle || null;
const controlPanel = mountBoardControlPanel(document.getElementById('aiAiControlPanel'), {
  mode: 'ai-ai',
  hrefs: { manual: './index.html', 'human-ai': './human-ai.html', 'ai-ai': './ai-ai.html' },
  onAction(action) {
    if (action === 'reset') resetDuel();
    if (action === 'play') {
      if (duelRunning) stopDuel();
      else startDuel();
    }
    if (action === 'undo') undoDuel();
    if (action === 'redo') redoDuel();
    if (action === 'side') boardSide = boardSide === RED ? BLACK : RED;
  }
});

controlPanel.setVoice(false);
const audio = createBoardAudio(controlPanel, {
  onStatus(message) { advantageText.textContent = message; }
});

if (modeSession) {
  controlPanel.setSide(boardSide);
  statusLines[2].textContent = `着法: ${game.history.length} 着`;
}
audio.refresh();
bindPlayModeSession(document.getElementById('aiAiControlPanel'), () => ({
  game, initialFen: baseFen, selectedPuzzle, recording: false, recordingStart: 0,
  solution: modeSession?.solution || '', explanation: modeSession?.explanation || '',
  solutionVariant: modeSession?.solutionVariant, boardSide,
  humanSide: modeSession?.humanSide
}), stopDuel);

renderBoard();

function renderBoard() {
  boardElement.replaceChildren(createStandardBoardArtwork('ai-ai-lines xiangqi-grid-svg'));
  sideLabel.textContent = `${sideName(boardSide)}走棋`;

  for (let row = 0; row < game.board.length; row += 1) {
    for (let col = 0; col < game.board[row].length; col += 1) {
      const piece = game.board[row][col];
      const square = document.createElement('div');
      square.className = 'xiangqi-intersection human-ai-square';
      placeStandardIntersection(square, row, col);
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 路`
        : `空位，第 ${row + 1} 行第 ${col + 1} 路`);
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'human-ai-piece'));
      boardElement.append(square);
    }
  }
  controlPanel.controls.undo.disabled = game.history.length < 2;
  controlPanel.controls.redo.disabled = game.redoStack.length < 2;
}

async function startDuel() {
  audio.stop();
  if (duelRunning) return;
  duelRunning = true;
  const token = ++runToken;
  controlPanel.setPlaying(true);
  advantageText.textContent = '正在连接 Pikafish...';
  candidateBox.textContent = '等待引擎搜索...';

  const sideSettings = { red: getSideSettings('Red'), black: getSideSettings('Black') };

  try {
    const configResponse = await fetch('http://localhost:8787/api/v1/chinese-chess/engine/ai-ai/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sideSettings)
    });
    if (!configResponse.ok) throw new Error(await readError(configResponse));

    while (token === runToken) {
      const gameStatus = getGameStatus(game);
      if (gameStatus.type === 'checkmate' || gameStatus.type === 'stalemate' || gameStatus.type === 'invalid') {
        advantageText.textContent = gameStatus.type === 'checkmate'
          ? `${sideName(gameStatus.winner)}胜利 · 将死`
          : gameStatus.type === 'stalemate' ? `${sideName(gameStatus.winner)}胜利 · 困毙` : '棋局无效';
        candidateBox.textContent = '对局结束';
        break;
      }

      const side = game.turn === RED ? 'red' : 'black';
      sideSettings[side] = getSideSettings(side === 'red' ? 'Red' : 'Black');
      const response = await fetch('http://localhost:8787/api/v1/chinese-chess/engine/ai-ai/move', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: toFen(game), side, settings: sideSettings[side] })
      });
      if (!response.ok) throw new Error(await readError(response));
      const result = await response.json();
      if (token !== runToken) break;
      if (!result.move || !makeMove(game, result.move.from, result.move.to)) throw new Error(`${sideName(game.turn)}引擎返回了无效着法。`);

      playMoveSound();
      renderBoard();
      updateAnalysis(side, result);
      await delay(Math.max(100, 1100 - Number(controlPanel.controls.speed.value) * 100));
    }
  } catch (error) {
    if (token === runToken) {
      advantageText.textContent = error.message || 'Pikafish 服务不可用';
      candidateBox.textContent = '请运行 VS Code 任务“Start MindsEvo local engine server”启动本地引擎服务（端口 8787），然后点击播放重试。';
    }
  } finally {
    if (token === runToken) {
      duelRunning = false;
      controlPanel.setPlaying(false);
    }
  }
}

function stopDuel() {
  runToken += 1;
  duelRunning = false;
  controlPanel.setPlaying(false);
  advantageText.textContent = 'AI 对弈已停止';
  candidateBox.textContent = '可重新开始对弈';
}

function resetDuel() {
  audio.stop();
  runToken += 1;
  duelRunning = false;
  game = createGameFromFen(baseFen);
  controlPanel.setPlaying(false);
  renderBoard();
  advantageText.textContent = '等待引擎启动...';
  advantageFill.style.width = '50%';
  advantagePercent.textContent = '50%';
  statusLines[0].textContent = '红方: 等待中';
  statusLines[1].textContent = '黑方: 等待中';
  statusLines[2].textContent = '着法: 0 回合';
  candidateBox.textContent = '等待引擎启动...';
}

function getSideSettings(side) {
  return {
    threads: 1,
    hash: 128,
    depth: Math.min(Number(document.getElementById(`aiAi${side}Depth`).value), Number(document.getElementById(`aiAi${side}Skill`).value)),
    movetime: Number(document.getElementById(`aiAi${side}MoveTime`).value),
    multiPv: Number(document.getElementById(`aiAi${side}MultiPv`).value)
  };
}

function undoDuel() {
  audio.stop();
  stopDuel();
  if (game.history.length < 2) return;
  undoMove(game);
  undoMove(game);
  renderBoard();
  advantageText.textContent = '已悔去最近一回合。';
}

function redoDuel() {
  stopDuel();
  if (!redoMove(game)) return;
  if (game.turn === BLACK) redoMove(game);
  renderBoard();
  advantageText.textContent = '已重做最近一回合。';
  audio.move(game);
}

function playMoveSound() {
  audio.move(game);
}

function updateAnalysis(side, result) {
  const info = result.info || {};
  const rawScore = Number(info.score?.value) || 0;
  const redScore = side === 'red' ? rawScore : -rawScore;
  const percentage = Math.round(Math.max(5, Math.min(95, 50 + redScore * 8)));
  advantageFill.style.width = `${percentage}%`;
  advantagePercent.textContent = `${percentage}%`;
  advantageText.textContent = `${sideName(side)}已走 ${result.bestMove || ''} · ${info.depth || result.settings.depth} 层`;
  statusLines[0].textContent = `红方: ${game.turn === RED ? '思考中' : '完成'}`;
  statusLines[1].textContent = `黑方: ${game.turn === BLACK ? '思考中' : '完成'}`;
  statusLines[2].textContent = `着法: ${Math.ceil(game.history.length / 2)} 回合`;
  candidateBox.textContent = (result.multipv || []).map((line, index) => `${index + 1}. ${line.pv?.[0] || result.bestMove} ${formatScore(line.score)}`).join('\n') || result.bestMove;
  candidateBox.style.whiteSpace = 'pre-line';
}

function formatScore(score) {
  if (!score) return '';
  return score.type === 'mate' ? `杀 ${score.value}` : `${score.value > 0 ? '+' : ''}${score.value.toFixed(2)}`;
}

function sideName(side) {
  if (side === RED || side === 'red') return '红方';
  if (side === BLACK || side === 'black') return '黑方';
  return '对方';
}

async function readError(response) {
  try {
    const data = await response.json();
    return data.error || `引擎服务错误 (${response.status})`;
  } catch {
    return `引擎服务错误 (${response.status})`;
  }
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
