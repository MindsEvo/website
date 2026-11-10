import { createInitialBoard, getPieceLabel } from '../../core.mjs';
import {
  appendStandardPositionMark,
  createStandardBoardArtwork,
  createStandardPieceElement,
  isCannonStartPosition,
  isPawnStartPosition,
  placeStandardIntersection
} from '../../board-standard.mjs';
import { applyBoardStyle, onBoardStyleChange } from '../../board-style.mjs';

applyBoardStyle();
onBoardStyleChange(() => {});

const OBSERVATION_ITEMS = [
  { id: 'red-pieces', label: '红方棋子', color: '#df3445', description: '红方棋子位于棋盘下方，开局时共有 16 枚。' },
  { id: 'black-pieces', label: '黑方棋子', color: '#343a40', description: '黑方棋子位于棋盘上方，开局时共有 16 枚。' },
  { id: 'border', label: '棋盘边框', color: '#27a64b', description: '最外侧四条线围成棋盘边界，限定棋子的活动区域。' },
  { id: 'river', label: '楚河汉界', color: '#0876f9', description: '楚河汉界横在棋盘中央，将红黑双方分隔开。' },
  { id: 'palace', label: '九宫', color: '#e900ce', description: '双方底线中央各有一个九宫，是将帅和士仕活动的区域。' }
];

const PRACTICE_ITEMS = [
  { id: 'red-pieces', label: '选择红方棋子', color: '#df3445', prompt: '请点击任意一枚红方棋子。' },
  { id: 'black-pieces', label: '选择黑方棋子', color: '#343a40', prompt: '请点击任意一枚黑方棋子。' },
  { id: 'palace', label: '九宫', color: '#9856b1', prompt: '请点击红方或黑方九宫内的交叉点。' },
  { id: 'river', label: '河界', color: '#18a8b8', prompt: '请点击楚河汉界区域内的交叉点。' },
  { id: 'border', label: '边框', color: '#27a64b', prompt: '请点击棋盘最外圈的交叉点。' }
];

const QUIZ_ITEMS = [
  { id: 'colors', label: '象棋对弈', text: '中国象棋对弈双方的棋子颜色分别是什么？', options: ['红方和黑方', '黑方和白方', '红方和蓝方'], answer: 0, explanation: '中国象棋由红方和黑方对弈。', highlight: 'red-pieces' },
  { id: 'river-count', label: '棋盘有几条河', text: '棋盘中间有几条河界？', options: ['一条', '两条', '四条'], answer: 0, explanation: '楚河汉界是一条横贯棋盘中央的河界。', highlight: 'river' },
  { id: 'river-position', label: '河的位置', text: '楚河汉界位于棋盘的哪里？', options: ['棋盘中央', '棋盘上方', '棋盘下方'], answer: 0, explanation: '楚河汉界位于棋盘中央，将双方分隔开。', highlight: 'river' },
  { id: 'palace', label: '九宫', text: '红黑双方的九宫位于哪里？', options: ['各自底线中央', '棋盘正中央', '棋盘四角'], answer: 0, explanation: '红黑双方各有一个九宫，分别位于各自底线中央。', highlight: 'palace' }
];
const board = document.getElementById('teachingBoard');
const observationFrame = document.querySelector('.teaching-board-frame');
const observationContent = document.getElementById('boardLessonContent');
let observationTimer = null;
let activePractice = null;
let activePracticeButton = null;

export function initObservationPage(lesson) {
  document.getElementById('boardCourseTitle').textContent = `${lesson.number}. ${lesson.title}`;
  document.querySelector('.board-course-back').textContent = '返回课程介绍';
  document.getElementById('boardDisplayApp').setAttribute('aria-label', '初步观察课程');
  document.getElementById('teachingBoard').setAttribute('aria-label', '中国象棋初始棋盘');
  document.getElementById('boardLessonStatus').hidden = true;
  document.getElementById('boardLessonContent').replaceChildren();
  document.getElementById('boardToolbar').hidden = false;

  renderBoard();
  renderObservationButtons();
  renderPracticeButtons();
  renderQuizButtons();
}

function renderBoard() {
  const position = createInitialBoard();
  const artwork = createStandardBoardArtwork('teaching-lines xiangqi-grid-svg');
  for (const row of [0, 7]) {
    const region = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    region.setAttribute('class', 'observation-palace-region');
    region.setAttribute('x', '3');
    region.setAttribute('y', String(row));
    region.setAttribute('width', '2');
    region.setAttribute('height', '2');
    artwork.prepend(region);
  }
  const riverRegion = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  riverRegion.setAttribute('class', 'observation-river-region');
  riverRegion.setAttribute('x', '0');
  riverRegion.setAttribute('y', '4');
  riverRegion.setAttribute('width', '8');
  riverRegion.setAttribute('height', '1');
  artwork.prepend(riverRegion);
  board.replaceChildren(artwork);

  for (let row = 0; row < position.length; row += 1) {
    for (let col = 0; col < position[row].length; col += 1) {
      const piece = position[row][col];
      const square = document.createElement('div');
      square.className = 'teaching-square xiangqi-intersection';
      placeStandardIntersection(square, row, col);
      square.dataset.row = String(row);
      square.dataset.col = String(col);
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 路`
        : `空位，第 ${row + 1} 行第 ${col + 1} 路`);
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'teaching-piece'));
      square.addEventListener('click', () => handlePracticeClick(row, col, square));
      board.append(square);
    }
  }
}

function renderObservationButtons() {
  const container = document.getElementById('observationButtons');
  container.replaceChildren();
  for (const feature of OBSERVATION_ITEMS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'observation-button';
    button.textContent = feature.label;
    button.style.setProperty('--button-color', feature.color);
    button.dataset.observe = feature.id;
    button.addEventListener('click', () => runObservation(feature, button));
    container.append(button);
  }
}

function runObservation(feature, selectedButton) {
  resetPracticeState();
  clearObservation();
  document.querySelectorAll('#observationButtons button').forEach(button => {
    button.classList.toggle('active', button === selectedButton);
  });
  observationFrame.dataset.feature = feature.id;

  const message = document.createElement('p');
  message.className = 'board-content-message observation-message';
  message.textContent = feature.description;
  observationContent.replaceChildren(message);
  speakObservation(feature.description);
  observationTimer = window.setTimeout(clearObservation, 10000);
}

function clearObservation() {
  if (observationTimer) {
    window.clearTimeout(observationTimer);
    observationTimer = null;
  }
  observationFrame.removeAttribute('data-feature');
}

function speakObservation(text) {
  if (document.querySelector('#boardToolbar [data-control="voice"]')?.getAttribute('aria-pressed') === 'false') return;
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  const volumeControl = document.querySelector('#boardToolbar [data-control="volume"]');
  const speedControl = document.querySelector('#boardToolbar [data-control="speed"]');
  if (volumeControl) utterance.volume = Number(volumeControl.value) / 100;
  if (speedControl) utterance.rate = 0.75 + Number(speedControl.value) / 20;
  window.speechSynthesis.speak(utterance);
}

function renderPracticeButtons() {
  const container = document.getElementById('practiceButtons');
  container.replaceChildren();
  for (const practice of PRACTICE_ITEMS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'practice-button';
    button.textContent = practice.label;
    button.style.setProperty('--button-color', practice.color);
    button.dataset.practice = practice.id;
    button.addEventListener('click', () => armPractice(practice, button));
    container.append(button);
  }
}

function renderQuizButtons() {
  const container = document.getElementById('boardQuizButtons');
  container.replaceChildren();
  for (const question of QUIZ_ITEMS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'board-quiz-topic';
    button.textContent = question.label;
    button.dataset.quiz = question.id;
    button.addEventListener('click', () => showQuizQuestion(question, button));
    container.append(button);
  }
}

function showQuizQuestion(question, selectedButton) {
  resetPracticeState();
  clearObservation();
  document.querySelectorAll('#observationButtons button').forEach(button => button.classList.remove('active'));
  document.querySelectorAll('#boardQuizButtons button').forEach(button => button.classList.toggle('active', button === selectedButton));

  const prompt = document.createElement('p');
  prompt.className = 'board-question-text';
  prompt.textContent = question.text;
  const options = document.createElement('div');
  options.className = 'board-question-options';
  const feedback = document.createElement('p');
  feedback.className = 'board-question-feedback';
  feedback.setAttribute('role', 'status');

  question.options.forEach((text, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'board-answer-option';
    option.textContent = `${String.fromCharCode(65 + index)}. ${text}`;
    option.addEventListener('click', () => {
      const correct = index === question.answer;
      options.querySelectorAll('button').forEach((item, answerIndex) => {
        item.disabled = true;
        if (answerIndex === question.answer) item.classList.add('correct');
        else if (answerIndex === index) item.classList.add('incorrect');
      });
      feedback.textContent = `${correct ? '答对了！' : `参考答案：${question.options[question.answer]}。`}${question.explanation}`;
      feedback.className = `board-question-feedback ${correct ? 'correct' : 'incorrect'}`;
      highlightQuizConcept(question.highlight);
      speakObservation(`${correct ? '回答正确。' : '回答错误。'}${question.explanation}`);
    });
    options.append(option);
  });

  observationContent.replaceChildren(prompt, options, feedback);
  speakObservation(question.text);
}

function highlightQuizConcept(feature) {
  clearObservation();
  observationFrame.dataset.feature = feature;
  observationTimer = window.setTimeout(clearObservation, 8000);
}

function armPractice(practice, button) {
  resetPracticeState();
  clearObservation();
  clearPracticeMarks();
  activePractice = practice;
  activePracticeButton = button;
  document.querySelectorAll('#practiceButtons button').forEach(item => {
    item.classList.toggle('practice-current', item === button);
    item.classList.remove('practice-correct', 'practice-wrong');
  });
  observationFrame.removeAttribute('data-feature');
  setPracticeMessage(`操作练习：${practice.prompt}`, 'practice-prompt');
  speakObservation(practice.prompt);
}

function handlePracticeClick(row, col, square) {
  if (!activePractice) return;
  const piece = square.querySelector('.teaching-piece');
  let correct = false;
  if (activePractice.id === 'red-pieces') correct = Boolean(piece?.classList.contains('xiangqi-piece-red'));
  else if (activePractice.id === 'black-pieces') correct = Boolean(piece?.classList.contains('xiangqi-piece-black'));
  else if (activePractice.id === 'palace') correct = (row <= 2 || row >= 7) && col >= 3 && col <= 5;
  else if (activePractice.id === 'river') correct = row === 4 || row === 5;
  else if (activePractice.id === 'border') correct = row === 0 || row === 9 || col === 0 || col === 8;

  clearPracticeMarks();
  showPracticeMark(square, correct);
  if (correct) {
    activePracticeButton.classList.remove('practice-current', 'practice-wrong');
    activePracticeButton.classList.add('practice-correct');
    setPracticeMessage(`回答正确！${activePractice.label.replace(/^选择/, '')}位置正确。`, 'success-message');
    speakObservation('回答正确');
    activePractice = null;
    activePracticeButton = null;
    return;
  }

  activePracticeButton.classList.remove('practice-current');
  activePracticeButton.classList.add('practice-wrong');
  setPracticeMessage(`再试一次：${activePractice.prompt}`, 'retry-message');
  speakObservation('回答错误，请再试一次');
}

function showPracticeMark(square, correct) {
  const mark = document.createElement('span');
  mark.className = `practice-mark ${correct ? 'practice-mark-correct' : 'practice-mark-wrong'}`;
  mark.textContent = correct ? '✓' : '×';
  square.append(mark);
  window.setTimeout(() => mark.remove(), 900);
}

function clearPracticeMarks() {
  board.querySelectorAll('.practice-mark').forEach(mark => mark.remove());
}

function resetPracticeState() {
  activePractice = null;
  activePracticeButton = null;
  clearPracticeMarks();
  document.querySelectorAll('#practiceButtons button').forEach(button => {
    button.classList.remove('practice-current', 'practice-correct', 'practice-wrong');
  });
}

function setPracticeMessage(text, className) {
  const message = document.createElement('p');
  message.className = `board-content-message ${className}`;
  message.textContent = text;
  observationContent.replaceChildren(message);
}
