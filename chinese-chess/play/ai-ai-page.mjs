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

applyBoardStyle();
onBoardStyleChange(() => {});

const boardElement = document.getElementById('aiAiBoard');
const advantageText = document.querySelector('.advantage-box p');
const advantageFill = document.querySelector('.advantage-meter i');
const advantagePercent = document.querySelector('.advantage-meter span');
const statusLines = document.querySelectorAll('.search-box p');
const candidateBox = document.querySelector('.candidates-box .waiting-card');
const solutionEditor = document.getElementById('aiAiSolutionText');
const explanationEditor = document.getElementById('aiAiExplanationText');
const solutionStatus = document.getElementById('aiAiSolutionStatus');
const explanationStatus = document.getElementById('aiAiExplanationStatus');
const recordButton = document.getElementById('aiAiRecordButton');
const saveSolutionButton = document.getElementById('aiAiSaveSolution');
const saveExplanationButton = document.getElementById('aiAiSaveExplanation');
const positionFile = document.getElementById('aiAiPositionFile');
const bankTree = document.getElementById('aiAiBankTree');
const bankSearch = document.getElementById('aiAiBankSearch');
const bankCount = document.getElementById('aiAiBankCount');
const puzzleStatus = document.getElementById('aiAiPuzzleStatus');
const sideLabel = document.querySelector('.ai-ai-page .human-ai-side-label');
let game = createGame();
let boardSide = RED;
let runToken = 0;
let duelRunning = false;
let baseFen = toFen(game);
let selectedPuzzle = null;
let bankManifest = null;
let recording = false;
let recordingStart = 0;
let soundEnabled = true;
let audioContext = null;
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
    if (action === 'sound') toggleSound();
    if (action === 'voice') speakStatus();
    if (action === 'side') boardSide = boardSide === RED ? BLACK : RED;
  }
});

document.getElementById('aiAiLoadPosition').addEventListener('click', () => positionFile.click());
document.getElementById('aiAiLoadSolution').addEventListener('click', loadSolution);
document.getElementById('aiAiLoadExplanation').addEventListener('click', loadExplanation);
recordButton.addEventListener('click', toggleRecording);
saveSolutionButton.addEventListener('click', saveSolution);
saveExplanationButton.addEventListener('click', saveExplanation);
solutionEditor.addEventListener('input', () => { saveSolutionButton.disabled = !solutionEditor.value.trim(); });
explanationEditor.addEventListener('input', () => { saveExplanationButton.disabled = !explanationEditor.value.trim(); });
positionFile.addEventListener('change', loadPositionFile);
bankSearch.addEventListener('input', renderBankTree);
loadBank();
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
          : gameStatus.type === 'stalemate' ? '和棋 · 困毙' : '棋局无效';
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
      updateRecordedSolution();
      await delay(Math.max(100, 1100 - Number(controlPanel.controls.speed.value) * 100));
    }
  } catch (error) {
    if (token === runToken) {
      advantageText.textContent = error.message || 'Pikafish 服务不可用';
      candidateBox.textContent = '请启动本地象棋引擎服务后重试。';
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
  runToken += 1;
  duelRunning = false;
  game = createGameFromFen(baseFen);
  controlPanel.setPlaying(false);
  recording = false;
  recordingStart = game.history.length;
  recordButton.textContent = '开始记录';
  saveSolutionButton.disabled = true;
  solutionEditor.value = '';
  renderBoard();
  advantageText.textContent = '等待引擎启动...';
  advantageFill.style.width = '50%';
  advantagePercent.textContent = '50%';
  statusLines[0].textContent = '红方: 等待中';
  statusLines[1].textContent = '黑方: 等待中';
  statusLines[2].textContent = '着法: 0 回合';
  candidateBox.textContent = '等待引擎启动...';
  puzzleStatus.textContent = selectedPuzzle ? `${selectedPuzzle.title} · 已重置到题目局面` : '已重置到起始局面。';
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
  stopDuel();
  if (game.history.length < 2) return;
  undoMove(game);
  undoMove(game);
  renderBoard();
  updateRecordedSolution();
  advantageText.textContent = '已悔去最近一回合。';
}

function redoDuel() {
  stopDuel();
  if (!redoMove(game)) return;
  if (game.turn === BLACK) redoMove(game);
  renderBoard();
  updateRecordedSolution();
  advantageText.textContent = '已重做最近一回合。';
}

function toggleRecording() {
  recording = !recording;
  if (recording) {
    recordingStart = game.history.length;
    solutionEditor.value = '';
    recordButton.textContent = '结束记录';
    solutionStatus.textContent = '正在记录后续 AI 着法。';
  } else {
    recordButton.textContent = '开始记录';
    solutionStatus.textContent = '记录结束，可保存棋谱。';
  }
  updateRecordedSolution();
}

function updateRecordedSolution() {
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

async function loadBank() {
  try {
    const response = await fetch('../bank/endgame/L1/manifest.json');
    if (!response.ok) throw new Error('题库清单暂不可用。');
    bankManifest = await response.json();
    const count = bankManifest.categories.reduce((total, category) => total + category.items.length, 0);
    bankCount.textContent = `${count} 局`;
    renderBankTree();
  } catch {
    bankCount.textContent = '不可用';
    bankTree.textContent = '题库暂不可用，请通过本地服务访问。';
  }
}

function renderBankTree() {
  if (!bankManifest) return;
  const query = bankSearch.value.trim().toLocaleLowerCase();
  bankTree.replaceChildren();
  const root = document.createElement('details');
  root.open = true;
  const rootTitle = document.createElement('summary');
  rootTitle.textContent = '残局基因 (endgame)';
  const level = document.createElement('details');
  level.open = true;
  const levelTitle = document.createElement('summary');
  levelTitle.textContent = 'L1 基础';
  level.append(levelTitle);
  for (const category of bankManifest.categories) {
    const items = category.items.filter(item => !query || `${item.title} ${item.id}`.toLocaleLowerCase().includes(query));
    if (!items.length) continue;
    const group = document.createElement('details');
    group.open = Boolean(query);
    const groupTitle = document.createElement('summary');
    groupTitle.textContent = `${category.label} (${items.length})`;
    group.append(groupTitle);
    for (const item of items) {
      const leaf = document.createElement('button');
      leaf.type = 'button';
      leaf.className = `bank-leaf${selectedPuzzle?.id === item.id ? ' selected' : ''}`;
      leaf.textContent = item.title;
      leaf.title = item.id;
      leaf.addEventListener('click', () => loadPuzzle(item));
      group.append(leaf);
    }
    level.append(group);
  }
  root.append(rootTitle, level);
  bankTree.append(root);
}

async function loadPuzzle(puzzle) {
  try {
    const response = await fetch(`../bank/endgame/L1/${puzzle.fen}`);
    if (!response.ok) throw new Error('残局局面文件载入失败。');
    stopDuel();
    baseFen = (await response.text()).trim();
    game = createGameFromFen(baseFen);
    selectedPuzzle = puzzle;
    recording = false;
    recordButton.textContent = '开始记录';
    solutionEditor.value = '';
    explanationEditor.value = '';
    saveSolutionButton.disabled = true;
    saveExplanationButton.disabled = true;
    puzzleStatus.textContent = `${puzzle.title} · ${puzzle.id}`;
    advantageText.textContent = `已载入：${puzzle.title}`;
    renderBoard();
    renderBankTree();
  } catch (error) {
    advantageText.textContent = error.message || '局面载入失败。';
  }
}

async function loadSolution() {
  if (!selectedPuzzle?.solutions?.length) {
    solutionStatus.textContent = '先从题库选择棋局。';
    return;
  }
  try {
    const response = await fetch(`../bank/endgame/L1/${selectedPuzzle.solutions[0]}`);
    if (!response.ok) throw new Error('棋谱答案载入失败。');
    solutionEditor.value = await response.text();
    saveSolutionButton.disabled = false;
    solutionStatus.textContent = '已载入题库答案预览。';
  } catch (error) { solutionStatus.textContent = error.message; }
}

async function loadExplanation() {
  if (!selectedPuzzle?.explanations?.length) {
    explanationStatus.textContent = '先选择包含解说的题库局面。';
    return;
  }
  try {
    const response = await fetch(`../bank/endgame/L1/${selectedPuzzle.explanations[0]}`);
    if (!response.ok) throw new Error('解说文件载入失败。');
    explanationEditor.value = await response.text();
    saveExplanationButton.disabled = false;
    explanationStatus.textContent = '已载入题库解说预览。';
  } catch (error) { explanationStatus.textContent = error.message; }
}

function loadPositionFile(event) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (!file) return;
  file.text().then(text => {
    try {
      stopDuel();
      baseFen = text.trim();
      game = createGameFromFen(baseFen);
      selectedPuzzle = null;
      puzzleStatus.textContent = '已载入本地局面文件。';
      renderBoard();
      renderBankTree();
      advantageText.textContent = '局面已载入，可开始 AI 对弈。';
    } catch (error) { advantageText.textContent = error.message || '局面文件无效。'; }
    input.value = '';
  });
}

async function saveSolution() {
  const content = `${solutionEditor.value.trim()}\n# END\n`;
  if (selectedPuzzle?.rootGene === 'manual') {
    try {
      const version = (selectedPuzzle.solutions?.length || 0) + 1;
      const response = await fetch(`http://localhost:8787/api/v1/chinese-chess/root-gene/puzzle/${encodeURIComponent(selectedPuzzle.id)}/material`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'solution', version, text: solutionEditor.value.trim() })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '棋谱未能保存到题库。');
      selectedPuzzle.solutions ||= [];
      selectedPuzzle.solutions.push(result.relativePath);
      saveLocal(`xiàngqí:solution:${selectedPuzzle.id}`, content);
      downloadText(`${selectedPuzzle.id}-${String(version).padStart(3, '0')}.txt`, content);
      renderBankTree();
      solutionStatus.textContent = `答案版本 ${String(version).padStart(3, '0')} 已保存到中国象棋题库。`;
      return;
    } catch (error) {
      solutionStatus.textContent = error.message || '题库服务不可用，已保留本机下载副本。';
      saveLocal(`xiàngqí:solution:${selectedPuzzle.id}`, content);
      downloadText(`${selectedPuzzle.id}-1.txt`, content);
      return;
    }
  }
  saveLocal(`xiàngqí:solution:${selectedPuzzle?.id || 'ai-ai-game'}`, content);
  downloadText(`${selectedPuzzle?.id || 'ai-ai-game'}-1.txt`, content);
  solutionStatus.textContent = '已保存到本机并下载棋谱文本。';
}

async function saveExplanation() {
  const content = explanationEditor.value.trim();
  if (selectedPuzzle?.rootGene === 'manual') {
    try {
      const version = (selectedPuzzle.explanations?.length || 0) + 1;
      const response = await fetch(`http://localhost:8787/api/v1/chinese-chess/root-gene/puzzle/${encodeURIComponent(selectedPuzzle.id)}/material`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'explanation', version, text: content })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '解说未能保存到题库。');
      selectedPuzzle.explanations ||= [];
      selectedPuzzle.explanations.push(result.relativePath);
      saveLocal(`xiàngqí:explanation:${selectedPuzzle.id}`, content);
      downloadText(`${selectedPuzzle.id}_exp-${String(version).padStart(3, '0')}.txt`, content);
      renderBankTree();
      explanationStatus.textContent = `解说版本 ${String(version).padStart(3, '0')} 已保存到中国象棋题库。`;
      return;
    } catch (error) {
      explanationStatus.textContent = error.message || '题库服务不可用，已保留本机下载副本。';
      saveLocal(`xiàngqí:explanation:${selectedPuzzle.id}`, content);
      downloadText(`${selectedPuzzle.id}_exp-1.txt`, content);
      return;
    }
  }
  saveLocal(`xiàngqí:explanation:${selectedPuzzle?.id || 'ai-ai-game'}`, content);
  downloadText(`${selectedPuzzle?.id || 'ai-ai-game'}_exp.txt`, content);
  explanationStatus.textContent = '已保存到本机并下载解说文本。';
}

function saveLocal(key, text) {
  try { localStorage.setItem(key, JSON.stringify({ text, updatedAt: new Date().toISOString() })); }
  catch { solutionStatus.textContent = '本机存储不可用，请保留下载文件。'; }
}

function downloadText(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function speakStatus() {
  if (!('speechSynthesis' in window)) {
    puzzleStatus.textContent = '当前浏览器不支持语音播报。';
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`${advantageText.textContent}。${candidateBox.textContent}`);
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
  oscillator.frequency.value = game.turn === RED ? 520 : 390;
  gain.gain.setValueAtTime(volume / 100 * 0.12, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.07);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.07);
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
