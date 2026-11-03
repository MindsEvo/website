import { BOARD_SIZES, BLACK, WHITE, calculateAreaScore, createGame, finishScoring, getGroupStones, playStone, passTurn, undoMove, redoMove, resumeAfterScoring } from '../core.mjs';
import { applyEngineMove, toEnginePosition } from '../ai-adapter.mjs';
import { analyzePosition, getEngineInfo, initializeEngine } from '../engine-dist/go-engine.js';

const boardElement = document.getElementById('goBoard');
const turnStone = document.getElementById('turnStone');
const turnText = document.getElementById('turnText');
const gameModeTitle = document.getElementById('gameModeTitle');
const gameStatus = document.getElementById('gameStatus');
const boardSizeLabel = document.getElementById('boardSizeLabel');
const blackCaptures = document.getElementById('blackCaptures');
const whiteCaptures = document.getElementById('whiteCaptures');
const moveCount = document.getElementById('moveCount');
const moveList = document.getElementById('moveList');
const ruleNote = document.getElementById('ruleNote');
const passButton = document.getElementById('passButton');
const undoButton = document.getElementById('undoButton');
const redoButton = document.getElementById('redoButton');
const manualModeButton = document.getElementById('manualModeButton');
const humanAiModeButton = document.getElementById('humanAiModeButton');
const aiAiModeButton = document.getElementById('aiAiModeButton');
const aiRunButton = document.getElementById('aiRunButton');
const scorePanel = document.getElementById('scorePanel');
const scoringInstructions = document.getElementById('scoringInstructions');
const blackAreaScore = document.getElementById('blackAreaScore');
const whiteAreaScore = document.getElementById('whiteAreaScore');
const neutralAreaScore = document.getElementById('neutralAreaScore');
const scoreResultElement = document.getElementById('scoreResult');
const confirmScoreButton = document.getElementById('confirmScoreButton');
const resumeGameButton = document.getElementById('resumeGameButton');
let game = createGame(9);
let mode = 'manual';
let engineInitPromise = null;
let aiRequestToken = 0;
let aiAutoplay = false;
let aiTimer = null;
let cancelActiveAiRequest = null;
const deadStones = new Set();
let finalScore = null;

manualModeButton.addEventListener('click', () => setMode('manual'));
humanAiModeButton.addEventListener('click', () => setMode('human-ai'));
aiAiModeButton.addEventListener('click', () => setMode('ai-ai'));
aiRunButton.addEventListener('click', toggleAiAutoplay);
confirmScoreButton.addEventListener('click', () => {
  if (!game.scoring) return;
  finalScore = calculateAreaScore(game.board, game.size, deadStones);
  finishScoring(game);
  render();
  ruleNote.textContent = resultText(finalScore);
});
resumeGameButton.addEventListener('click', () => {
  if (!resumeAfterScoring(game)) return;
  deadStones.clear();
  finalScore = null;
  render();
  ruleNote.textContent = '已恢复对弈；请继续处理有争议的棋局。';
  maybeRequestAiMove();
});

document.querySelectorAll('[data-size]').forEach(button => {
  button.addEventListener('click', () => {
    const size = Number(button.dataset.size);
    if (!BOARD_SIZES.includes(size) || size === game.size) return;
    cancelAiWork();
    aiAutoplay = false;
    deadStones.clear();
    finalScore = null;
    game = createGame(size);
    render();
    ruleNote.textContent = `已开始新的 ${size} 路棋局。切换棋盘尺寸会重置当前棋局。`;
  });
});

passButton.addEventListener('click', () => {
  if (isAiControlledTurn() || mode === 'ai-ai') return;
  passTurn(game);
  if (game.scoring) {
    deadStones.clear();
    finalScore = null;
  }
  render();
  ruleNote.textContent = game.scoring
    ? '双方连续停着，进入数子确认。标记死棋后确认结果。'
    : `${colorName(otherColor(game.turn))}方停着，现在轮到${colorName(game.turn)}方。`;
  maybeRequestAiMove();
});

undoButton.addEventListener('click', () => {
  cancelAiWork();
  if (mode === 'ai-ai') aiAutoplay = false;
  const undoCount = mode === 'human-ai' && game.turn === BLACK && game.history.length > 1 ? 2 : 1;
  let undone = false;
  for (let count = 0; count < undoCount; count += 1) undone = undoMove(game) || undone;
  if (!undone) return;
  deadStones.clear();
  finalScore = null;
  render();
  ruleNote.textContent = '已撤销上一步。';
});

redoButton.addEventListener('click', () => {
  cancelAiWork();
  if (mode === 'ai-ai') aiAutoplay = false;
  const redoCount = mode === 'human-ai' && game.turn === BLACK && game.redoStack.length > 1 ? 2 : 1;
  let redone = false;
  for (let count = 0; count < redoCount; count += 1) redone = redoMove(game) || redone;
  if (!redone) return;
  deadStones.clear();
  finalScore = null;
  render();
  ruleNote.textContent = '已重做一步。';
  maybeRequestAiMove();
});

document.getElementById('resetButton').addEventListener('click', () => {
  cancelAiWork();
  aiAutoplay = false;
  deadStones.clear();
  finalScore = null;
  game = createGame(game.size);
  render();
  ruleNote.textContent = `已重新开始 ${game.size} 路棋局，黑棋先行。`;
});

function setMode(nextMode) {
  if (nextMode === mode) return;
  if ((game.scoring || game.finished) && nextMode !== 'manual') {
    ruleNote.textContent = '请先完成数子或重新开始棋局，再切换 AI 模式。';
    return;
  }
  cancelAiWork();
  aiAutoplay = false;
  mode = nextMode;
  render();
  if (mode !== 'manual') {
    ruleNote.textContent = '正在本地加载围棋 AI，首次启动需要载入模型…';
    if (!engineInitPromise) engineInitPromise = initializeEngine();
    engineInitPromise.then(() => {
      if (mode !== nextMode) return;
      announceEngineReady();
      if (mode === 'human-ai') maybeRequestAiMove();
    }).catch(error => {
      engineInitPromise = null;
      showEngineError(error);
    });
  } else {
    ruleNote.textContent = '双人手动对弈。';
  }
}

function announceEngineReady() {
  const info = getEngineInfo();
  ruleNote.textContent = mode === 'ai-ai'
    ? `本地引擎已就绪（${info.backend || 'WASM'}，小型验证模型）；点击开始运行黑白双方。`
    : `本地引擎已就绪（${info.backend || 'WASM'}，小型验证模型）；你执黑，AI 执白。`;
}

function showEngineError(error) {
  if (mode !== 'manual') ruleNote.textContent = `本地 AI 加载失败：${error.message}`;
}

function toggleAiAutoplay() {
  if (mode !== 'ai-ai' || game.finished) return;
  if (aiAutoplay) {
    aiAutoplay = false;
    cancelAiWork();
    render();
    ruleNote.textContent = 'AI 对弈已暂停，可继续或悔棋。';
    return;
  }

  aiAutoplay = true;
  render();
  ruleNote.textContent = '正在启动 AI 对弈…';
  if (!engineInitPromise) engineInitPromise = initializeEngine();
  engineInitPromise.then(() => {
    if (mode === 'ai-ai' && aiAutoplay) maybeRequestAiMove();
  }).catch(error => {
    engineInitPromise = null;
    aiAutoplay = false;
    render();
    showEngineError(error);
  });
}

function cancelAiWork() {
  aiRequestToken += 1;
  if (aiTimer !== null) {
    window.clearTimeout(aiTimer);
    aiTimer = null;
  }
  cancelActiveAiRequest?.();
  cancelActiveAiRequest = null;
}

function isAiTurn() {
  return mode === 'human-ai' && game.turn === WHITE && !game.finished && !game.scoring;
}

function isAiAiRunning() {
  return mode === 'ai-ai' && aiAutoplay && !game.finished && !game.scoring;
}

function isAiControlledTurn() {
  return isAiTurn() || isAiAiRunning();
}

function maybeRequestAiMove() {
  if (!isAiControlledTurn() || !engineInitPromise || cancelActiveAiRequest) return;
  const token = ++aiRequestToken;
  let aborted = false;
  const listeners = new Set();
  cancelActiveAiRequest = () => {
    aborted = true;
    for (const listener of listeners) listener();
    listeners.clear();
  };
  const signal = {
    get aborted() { return aborted; },
    addAbortListener(listener) {
      if (aborted) {
        listener();
        return () => {};
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
  ruleNote.textContent = '本地 AI 正在思考…';
  render();
  const movingColor = game.turn;
  analyzePosition(toEnginePosition(game), signal).then(analysis => {
    if (token !== aiRequestToken || !isAiControlledTurn()) return;
    const result = applyEngineMove(game, analysis);
    if (!result) throw new Error('引擎未返回合法着法');
    cancelActiveAiRequest = null;
    if (game.scoring) {
      aiAutoplay = false;
      deadStones.clear();
      finalScore = null;
      render();
      ruleNote.textContent = '双方连续停着，进入数子确认。标记死棋后确认结果。';
      return;
    }
    render();
    ruleNote.textContent = mode === 'ai-ai'
      ? `${colorName(movingColor)}方 AI 已落子，搜索 ${analysis.rootVisits} 次。`
      : `本地 AI 已落子（搜索 ${analysis.rootVisits} 次）。`;
    if (mode === 'ai-ai' && aiAutoplay) {
      aiTimer = window.setTimeout(() => {
        aiTimer = null;
        maybeRequestAiMove();
      }, 450);
    }
  }).catch(error => {
    if (token !== aiRequestToken) return;
    cancelActiveAiRequest = null;
    if (error?.name === 'KataGoCanceledError') return;
    if (mode === 'ai-ai') aiAutoplay = false;
    render();
    ruleNote.textContent = `本地 AI 分析失败：${error.message}`;
  });
}

function render() {
  renderBoard();
  renderStatus();
  renderMoves();
  blackCaptures.textContent = game.captures[BLACK];
  whiteCaptures.textContent = game.captures[WHITE];
  renderScorePanel();
  undoButton.disabled = game.history.length === 0;
  redoButton.disabled = game.redoStack.length === 0;
  passButton.disabled = game.finished || game.scoring || isAiControlledTurn() || mode === 'ai-ai';
  gameModeTitle.textContent = mode === 'human-ai' ? '人机对弈' : mode === 'ai-ai' ? 'AI 自动对弈' : '双人手动对弈';
  document.title = `${gameModeTitle.textContent} | MindsEvo 围棋`;
  manualModeButton.classList.toggle('is-active', mode === 'manual');
  manualModeButton.setAttribute('aria-pressed', String(mode === 'manual'));
  humanAiModeButton.classList.toggle('is-active', mode === 'human-ai');
  humanAiModeButton.setAttribute('aria-pressed', String(mode === 'human-ai'));
  humanAiModeButton.disabled = game.scoring || game.finished;
  humanAiModeButton.title = `使用本地 AI 进行 ${game.size} 路人机对弈`;
  aiAiModeButton.classList.toggle('is-active', mode === 'ai-ai');
  aiAiModeButton.setAttribute('aria-pressed', String(mode === 'ai-ai'));
  aiAiModeButton.disabled = game.scoring || game.finished;
  aiRunButton.hidden = mode !== 'ai-ai';
  aiRunButton.disabled = game.finished || game.scoring;
  aiRunButton.title = aiAutoplay ? '暂停 AI 对弈' : '开始或继续 AI 对弈';
  aiRunButton.setAttribute('aria-label', aiRunButton.title);
  aiRunButton.querySelector('.tool-icon').textContent = aiAutoplay ? 'Ⅱ' : '▶';
  aiRunButton.querySelector('span:last-child').textContent = aiAutoplay ? '暂停 AI' : game.moves.length ? '继续 AI' : '开始 AI';
  boardSizeLabel.textContent = `${game.size} 路`;
  document.querySelectorAll('[data-size]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.size) === game.size));
  });
}

function renderBoard() {
  boardElement.replaceChildren();
  boardElement.style.setProperty('--size', game.size);
  boardElement.setAttribute('aria-label', `${game.size} 路围棋棋盘`);

  const grid = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  grid.classList.add('go-grid');
  grid.setAttribute('viewBox', '0 0 1000 1000');
  grid.setAttribute('aria-hidden', 'true');
  const margin = 40;
  const step = (1000 - margin * 2) / (game.size - 1);
  for (let index = 0; index < game.size; index += 1) {
    const offset = margin + index * step;
    addLine(grid, margin, offset, 1000 - margin, offset);
    addLine(grid, offset, margin, offset, 1000 - margin);
  }
  for (const row of starPoints(game.size)) {
    for (const col of starPoints(game.size)) {
      const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      star.setAttribute('cx', margin + col * step);
      star.setAttribute('cy', margin + row * step);
      star.setAttribute('r', game.size === 19 ? '7' : '8');
      star.setAttribute('fill', '#3d3324');
      grid.append(star);
    }
  }
  boardElement.append(grid);

  for (let row = 0; row < game.size; row += 1) {
    for (let col = 0; col < game.size; col += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'intersection';
      button.style.left = `${4 + (92 * col / (game.size - 1))}%`;
      button.style.top = `${4 + (92 * row / (game.size - 1))}%`;
      const key = `${row},${col}`;
      const isDead = deadStones.has(key);
      button.setAttribute('aria-label', `${coordinateName(col)} ${game.size - row}${game.board[row][col] ? `，${colorName(game.board[row][col])}棋${isDead ? '，标记为死棋' : ''}` : '，空位'}`);
      if (isDead) button.classList.add('dead-selected');
      button.disabled = game.finished || (game.scoring
        ? !game.board[row][col]
        : Boolean(game.board[row][col]) || isAiControlledTurn() || mode === 'ai-ai');
      button.addEventListener('click', () => handleIntersection(row, col));

      const stone = game.board[row][col];
      if (stone) {
        const stoneElement = document.createElement('span');
        stoneElement.className = `stone ${stone === BLACK ? 'black-stone' : 'white-stone'}`;
        button.append(stoneElement);
      }
      if (game.lastMove?.row === row && game.lastMove?.col === col) {
        const marker = document.createElement('span');
        marker.className = 'last-mark';
        button.append(marker);
      }
      if (isDead) {
        const deadMark = document.createElement('span');
        deadMark.className = 'dead-mark';
        deadMark.textContent = '×';
        button.append(deadMark);
      }
      boardElement.append(button);
    }
  }
}

function handleIntersection(row, col) {
  if (game.scoring) {
    toggleDeadGroup(row, col);
    render();
    ruleNote.textContent = '已更新死棋标记；确认结果前可以继续调整。';
    return;
  }
  if (isAiControlledTurn() || mode === 'ai-ai') return;
  const priorCaptures = game.captures[game.turn];
  if (playStone(game, row, col)) {
    const taken = game.captures[game.turn] - priorCaptures;
    render();
    ruleNote.textContent = taken ? `${colorName(otherColor(game.turn))}方被提 ${taken} 子。` : '落子完成。';
    maybeRequestAiMove();
  } else {
    ruleNote.textContent = '此处不能落子：请检查是否已有棋子、自杀禁入或违反劫规则。';
  }
}

function renderStatus() {
  turnStone.className = `turn-stone ${game.turn === BLACK ? 'black-stone' : 'white-stone'}`;
  turnText.textContent = game.finished
    ? finalScore ? resultText(finalScore) : '本局已结束'
    : game.scoring ? '终局数子'
    : isAiAiRunning() ? 'AI 自动对弈'
      : isAiTurn() ? '本地 AI 行棋' : mode === 'human-ai' ? '你（黑）行棋' : `${colorName(game.turn)}方行棋`;
  gameStatus.textContent = game.finished
    ? finalScore ? finalScore.winner ? `${colorName(finalScore.winner)}方胜` : '和棋' : '本局已结束'
    : game.scoring ? '标记死棋并确认胜负'
    : mode === 'ai-ai' ? aiAutoplay ? '本地 AI 分析中' : 'AI 对弈已暂停'
      : isAiTurn() ? '本地分析中'
      : game.consecutivePasses === 1 ? '对方已停着' : `${colorName(game.turn)}方回合`;
}

function renderScorePanel() {
  const visible = game.scoring || Boolean(finalScore);
  scorePanel.hidden = !visible;
  if (!visible) return;
  const score = finalScore || calculateAreaScore(game.board, game.size, deadStones);
  blackAreaScore.textContent = `${score.blackArea} 目`;
  whiteAreaScore.textContent = `${score.whiteArea} + ${score.komi.toFixed(1)} = ${score.whiteScore.toFixed(1)} 目`;
  neutralAreaScore.textContent = `${score.neutralPoints} 目`;
  scoringInstructions.textContent = game.finished
    ? '本局已完成数子。'
    : '点击棋盘上的死棋棋子，整块棋会一起标记；再次点击可取消。';
  confirmScoreButton.hidden = !game.scoring;
  resumeGameButton.hidden = !game.scoring;
  scoreResultElement.hidden = !finalScore;
  scoreResultElement.textContent = finalScore ? resultText(finalScore) : '';
}

function toggleDeadGroup(row, col) {
  const group = getGroupStones(game.board, row, col);
  if (!group.length) return;
  const groupKeys = group.map(stone => `${stone.row},${stone.col}`);
  const remove = groupKeys.every(key => deadStones.has(key));
  for (const key of groupKeys) {
    if (remove) deadStones.delete(key);
    else deadStones.add(key);
  }
}

function resultText(score) {
  if (!score.winner) return `和棋：黑 ${score.blackScore.toFixed(1)} 目，白 ${score.whiteScore.toFixed(1)} 目。`;
  return `${colorName(score.winner)}方胜 ${score.difference.toFixed(1)} 目（黑 ${score.blackScore.toFixed(1)}，白 ${score.whiteScore.toFixed(1)}，含 7.5 贴目）。`;
}

function renderMoves() {
  moveCount.textContent = `${game.moves.length} 手`;
  moveList.replaceChildren();
  if (!game.moves.length) {
    const empty = document.createElement('li');
    empty.className = 'move-empty';
    empty.textContent = '棋局开始后，落子记录会显示在这里。';
    moveList.append(empty);
    return;
  }
  game.moves.forEach((move, index) => {
    const item = document.createElement('li');
    item.className = 'move-item';
    const number = document.createElement('span');
    number.className = 'move-number';
    number.textContent = `${index + 1}.`;
    const color = document.createElement('span');
    color.className = 'move-color';
    color.textContent = move.color === BLACK ? '黑' : '白';
    const coordinate = document.createElement('span');
    coordinate.className = 'move-coordinate';
    coordinate.textContent = move.pass ? '停着' : `${coordinateName(move.col)} ${game.size - move.row}`;
    item.append(number, color, coordinate);
    moveList.append(item);
  });
  moveList.scrollTop = moveList.scrollHeight;
}

function addLine(svg, x1, y1, x2, y2) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', '#59492f');
  line.setAttribute('stroke-width', '2.2');
  svg.append(line);
}

function starPoints(size) {
  if (size === 9) return [2, 4, 6];
  if (size === 13) return [3, 6, 9];
  return [3, 9, 15];
}

function coordinateName(col) {
  const letter = String.fromCharCode(65 + col + (col >= 8 ? 1 : 0));
  return letter;
}

function colorName(color) {
  return color === BLACK ? '黑' : '白';
}

function otherColor(color) {
  return color === BLACK ? WHITE : BLACK;
}

render();