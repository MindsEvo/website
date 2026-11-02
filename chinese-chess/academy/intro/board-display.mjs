import {
  appendStandardPositionMark,
  createStandardBoardArtwork,
  isCannonStartPosition,
  isPawnStartPosition,
  placeStandardIntersection
} from '../../board-standard.mjs';
import { applyBoardStyle, onBoardStyleChange } from '../../board-style.mjs';

applyBoardStyle();
onBoardStyleChange(() => {});

const OBSERVATION = [
  { id: 'border', label: '边界', color: '#28a745', description: '棋盘边界由最外侧四条线组成。' },
  { id: 'river', label: '河界', color: '#168ac3', description: '楚河汉界位于棋盘中央，河道内没有横竖棋盘线。' },
  { id: 'palace', label: '九宫', color: '#ed00ba', description: '红黑双方各有一个九宫，每个九宫包含九个交叉点。' },
  { id: 'diagonal', label: '斜线', color: '#8f58d8', description: '九宫里的两条斜线交成“X”，表示士仕的活动路线。' },
  { id: 'horizontal', label: '横线', color: '#27468f', description: '棋盘共有 10 条横线。' },
  { id: 'vertical', label: '竖线', color: '#176a35', description: '棋盘共有 9 条竖线。' },
  { id: 'cannons', label: '炮台', color: '#8a351c', description: '双方各有两个炮位，开局时位于本方第三条横线。' },
  { id: 'pawns', label: '岗哨', color: '#cf2638', description: '双方各有五个兵卒位，在前线隔一路排列。' }
];

const PRACTICE = [
  ['border', '边界', '#28a745'], ['river', '河界', '#16a7b5'], ['palace', '九宫', '#9856b1'], ['diagonal', '斜线', '#df3d51'],
  ['horizontal', '横线', '#19b995'], ['vertical', '竖线', '#ffc400'], ['cannons', '炮台', '#ff8311'], ['pawns', '岗哨', '#e83491']
].map(([id, label, color]) => ({ id, label, color }));

const PRACTICE_PROMPTS = {
  border: '请点击棋盘最的边框。',
  river: '请点击楚河汉界区域内的交叉点。',
  palace: '请点击任意一方九宫内的交叉点。',
  diagonal: '请依次点击同一条九宫斜线上的两个交叉点。',
  horizontal: '请依次点击同一横线上的两个交叉点。',
  vertical: '请依次点击同一竖线上的两个交叉点。',
  cannons: '请点击任意一个炮台位置。',
  pawns: '请点击任意一个兵卒起始位置。'
};

const QUESTIONS = [
  { id: 'border', label: '边界', text: '棋盘的边界是由几条线组成？', options: ['左右两条', '上下两条', '上下左右四条线'], answer: 2, explanation: '棋盘外侧由上、下、左、右四条边界线围成。' },
  { id: 'river', label: '河界', text: '河界在棋盘的哪里？', options: ['上方', '下方', '中间'], answer: 2, explanation: '楚河汉界横在棋盘中央。' },
  { id: 'palace', label: '九宫', text: '棋盘有几个九宫？', options: ['红方一个', '黑方一个', '红黑方各一个'], answer: 2, explanation: '红方和黑方各有一个九宫。' },
  { id: 'diagonal', label: '斜线', text: '斜线的位置在哪里？', options: ['河边', '九宫', '边角'], answer: 1, explanation: '九宫内各有两条交叉斜线。' },
  { id: 'cannons', label: '炮台', text: '棋盘一共有几个炮台？', options: ['红黑方各两个', '红方有5个', '黑方有4个'], answer: 0, explanation: '双方各有两个炮位，共四个。' },
  { id: 'pawns', label: '岗哨', text: '棋盘一共有几个岗哨？', options: ['黑方7个', '红方2个', '红黑方各5个'], answer: 2, explanation: '双方各有五个兵卒位。' },
  { id: 'horizontal', label: '横线数量', text: '象棋棋盘有多少条横线？', options: ['9条', '10条', '11条'], answer: 1, explanation: '棋盘共有十条横线。' },
  { id: 'vertical', label: '竖线数量', text: '象棋棋盘有多少条竖线？', options: ['8条', '9条', '10条'], answer: 1, explanation: '棋盘共有九条竖线。' },
  { id: 'points', label: '棋盘格数', text: '象棋棋盘有多少个交叉点？', options: ['81', '90', '100'], answer: 1, explanation: '十条横线和九条竖线相交，共有九十个交叉点。' }
];

const board = document.getElementById('teachingBoard');
const frame = document.querySelector('.teaching-board-frame');
const status = document.getElementById('boardLessonStatus');
const content = document.getElementById('boardLessonContent');
const observationButtons = document.getElementById('observationButtons');
const practiceButtons = document.getElementById('practiceButtons');
const quizButtons = document.getElementById('boardQuizButtons');
let activePractice = '';
let firstPracticePoint = null;
let observationTimer = null;

export function initBoardDisplay(lesson) {
  renderBoard();
  renderFeatures(observationButtons, OBSERVATION, observeFeature, 'observation-button');
  renderFeatures(practiceButtons, PRACTICE, beginPractice, 'practice-button');
  renderQuizButtons();
  document.getElementById('speakStudent').addEventListener('click', () => speak(lesson.student, '致学生'));
  document.getElementById('speakParent').addEventListener('click', () => speak(lesson.parent, '致家长'));
}

function renderBoard() {
  board.replaceChildren();
  board.append(createStandardBoardArtwork('teaching-lines xiangqi-grid-svg'));

  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const square = document.createElement('button');
      square.type = 'button';
      square.className = 'teaching-square xiangqi-intersection';
      placeStandardIntersection(square, row, col);
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', `第 ${row + 1} 行第 ${col + 1} 路交叉点`);
      square.dataset.row = String(row);
      square.dataset.col = String(col);
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      square.addEventListener('click', () => handleBoardPoint(row, col, square));
      board.append(square);
    }
  }
}

function renderFeatures(container, features, handler, className) {
  for (const feature of features) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.style.setProperty('--button-color', feature.color);
    button.textContent = feature.label;
    button.dataset.feature = feature.id;
    button.addEventListener('click', () => {
      container.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
      handler(feature);
    });
    container.append(button);
  }
}

function observeFeature(feature) {
  stopObservationHighlight();
  activePractice = '';
  firstPracticePoint = null;
  resetPracticeButtons();
  clearFeatureMarks();
  clearQuizButtons();
  frame.dataset.feature = feature.id;
  paintFeature(feature.id);
  showContent(feature.description, 'observation-message');
  status.textContent = `动态观察 · ${feature.label}`;
  speakAudio(feature.description);
  observationTimer = window.setTimeout(stopObservationHighlight, 6000);
}

function beginPractice(feature) {
  stopObservationHighlight();
  firstPracticePoint = null;
  resetPracticeButtons();
  clearQuizButtons();
  clearPracticeMarks();
  observationButtons.querySelectorAll('button').forEach(button => button.classList.remove('active'));
  activePractice = feature.id;
  frame.removeAttribute('data-feature');
  clearFeatureMarks();
  showContent(`操作练习：${PRACTICE_PROMPTS[feature.id]}`, 'practice-message');
  status.textContent = `操作练习 · ${feature.label}`;
  speakAudio(PRACTICE_PROMPTS[feature.id]);
}

function handleBoardPoint(row, col, square) {
  if (!activePractice) return;

  if (['horizontal', 'vertical', 'diagonal'].includes(activePractice)) {
    if (!firstPracticePoint) {
      firstPracticePoint = { row, col, square };
      square.classList.add('practice-point');
      showContent('已选第一个交叉点，请再选同一条线上的第二个点。', 'practice-message');
      status.textContent = '请继续选择第二个交叉点。';
      return;
    }
    const line = getPracticeLine(activePractice, firstPracticePoint, { row, col });
    firstPracticePoint.square.classList.remove('practice-point');
    firstPracticePoint = null;
    finishPracticeAttempt(Boolean(line), square, line);
    return;
  }

  finishPracticeAttempt(isPracticeAnswer(activePractice, row, col), square);
}

function finishPracticeAttempt(correct, square, line) {
  const selectedButton = practiceButtons.querySelector(`[data-feature="${activePractice}"]`);
  clearPracticeMarks();
  selectedButton?.classList.remove('practice-current', 'practice-correct', 'practice-wrong');
  selectedButton?.classList.add(correct ? 'practice-correct' : 'practice-wrong');
  if (correct && line) line.forEach(point => point.square.classList.add('practice-line-mark'));
  showPracticeMark(square, correct);

  if (!correct) {
    showContent(`还没找到目标，请重试：${PRACTICE_PROMPTS[activePractice]}`, 'retry-message');
    status.textContent = '回答不正确，请再试一次。';
    speakAudio('回答错误，请再试一次');
    return;
  }

  const label = PRACTICE.find(item => item.id === activePractice)?.label || '';
  const description = OBSERVATION.find(item => item.id === activePractice)?.description || '';
  if (line) {
    frame.removeAttribute('data-feature');
    clearFeatureMarks();
    line.forEach(point => point.square.classList.add('practice-line-mark'));
  } else {
    paintFeature(activePractice);
  }
  showContent(`回答正确：${label}。${description}`, 'success-message');
  status.textContent = '回答正确。请选择下一项练习。';
  speakAudio('回答正确');
  activePractice = '';
  firstPracticePoint = null;
  window.setTimeout(clearPracticeMarks, 1800);
}

function getPracticeLine(kind, first, second) {
  const rowDelta = second.row - first.row;
  const colDelta = second.col - first.col;
  if (kind === 'horizontal' && (rowDelta !== 0 || colDelta === 0)) return null;
  if (kind === 'vertical' && (colDelta !== 0 || rowDelta === 0)) return null;
  if (kind === 'diagonal' && (Math.abs(rowDelta) !== Math.abs(colDelta) || rowDelta === 0)) return null;

  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);
  const count = Math.max(Math.abs(rowDelta), Math.abs(colDelta));
  const points = [];
  for (let index = 0; index <= count; index += 1) {
    const row = first.row + rowStep * index;
    const col = first.col + colStep * index;
    if (kind === 'diagonal' && !isPalaceDiagonal(row, col)) return null;
    points.push({ row, col, square: board.querySelector(`[data-row="${row}"][data-col="${col}"]`) });
  }
  return points;
}

function showPracticeMark(square, correct) {
  const mark = document.createElement('span');
  mark.className = `practice-mark ${correct ? 'practice-mark-correct' : 'practice-mark-wrong'}`;
  mark.textContent = correct ? '✓' : '×';
  square.append(mark);
  window.setTimeout(() => mark.remove(), 900);
}

function paintFeature(feature) {
  clearFeatureMarks();
  frame.dataset.feature = feature;
  for (const square of board.querySelectorAll('.teaching-square')) {
    const row = Number(square.dataset.row);
    const col = Number(square.dataset.col);
    if (isFeaturePoint(feature, row, col)) square.classList.add('feature-point');
    if (feature === 'horizontal') square.classList.add('horizontal-point');
    if (feature === 'vertical') square.classList.add('vertical-point');
  }
}

function clearFeatureMarks() {
  board.querySelectorAll('.feature-point, .horizontal-point, .vertical-point, .practice-point, .practice-line-mark').forEach(square => {
    square.classList.remove('feature-point', 'horizontal-point', 'vertical-point', 'practice-point', 'practice-line-mark');
  });
}

function clearPracticeMarks() {
  board.querySelectorAll('.practice-mark').forEach(mark => mark.remove());
  board.querySelectorAll('.practice-line-mark, .practice-point').forEach(square => square.classList.remove('practice-line-mark', 'practice-point'));
}

function resetPracticeButtons() {
  practiceButtons.querySelectorAll('button').forEach(button => button.classList.remove('practice-current', 'practice-correct', 'practice-wrong'));
}

function clearQuizButtons() {
  quizButtons.querySelectorAll('button').forEach(button => button.classList.remove('active', 'quiz-correct', 'quiz-wrong'));
}

function stopObservationHighlight() {
  if (observationTimer) window.clearTimeout(observationTimer);
  observationTimer = null;
  if (!activePractice) {
    frame.removeAttribute('data-feature');
    clearFeatureMarks();
  }
}

function isFeaturePoint(feature, row, col) {
  if (feature === 'border') return row === 0 || row === 9 || col === 0 || col === 8;
  if (feature === 'river') return false;
  if (feature === 'palace') return inPalace(row, col);
  if (feature === 'diagonal') return isPalaceDiagonal(row, col);
  if (feature === 'cannons') return isCannon(row, col);
  if (feature === 'pawns') return isPawn(row, col);
  return false;
}

function isPracticeAnswer(feature, row, col) {
  if (feature === 'river') return row === 4 || row === 5;
  return isFeaturePoint(feature, row, col);
}

function isCannon(row, col) {
  return isCannonStartPosition(row, col);
}

function isPawn(row, col) {
  return isPawnStartPosition(row, col);
}

function renderQuizButtons() {
  for (const question of QUESTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'board-quiz-topic';
    button.textContent = question.label;
    button.addEventListener('click', () => showQuestion(question, button));
    quizButtons.append(button);
  }
}

function showQuestion(question, selectedButton) {
  stopObservationHighlight();
  activePractice = '';
  firstPracticePoint = null;
  resetPracticeButtons();
  clearPracticeMarks();
  frame.removeAttribute('data-feature');
  clearFeatureMarks();
  observationButtons.querySelectorAll('button').forEach(button => button.classList.remove('active'));
  practiceButtons.querySelectorAll('button').forEach(button => button.classList.remove('active'));
  clearQuizButtons();
  selectedButton.classList.add('active');
  content.replaceChildren();

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
    option.textContent = text;
    option.addEventListener('click', () => {
      const correct = index === question.answer;
      options.querySelectorAll('button').forEach((item, answerIndex) => {
        item.disabled = true;
        if (answerIndex === question.answer) item.classList.add('correct');
        else if (answerIndex === index) item.classList.add('incorrect');
      });
      feedback.textContent = `${correct ? '答对了！' : `参考答案：${question.options[question.answer]}。`}${question.explanation}`;
      feedback.className = `board-question-feedback ${correct ? 'correct' : 'incorrect'}`;
      selectedButton.classList.add(correct ? 'quiz-correct' : 'quiz-wrong');
      status.textContent = correct ? '回答正确。' : '已显示参考答案。';
      paintFeature(question.id === 'points' ? 'border' : question.id);
      observationTimer = window.setTimeout(stopObservationHighlight, 6000);
      speakAudio(`${correct ? '回答正确。' : '回答错误。'}${question.explanation}`);
    });
    options.append(option);
  });
  content.append(prompt, options, feedback);
  status.textContent = `问答练习 · ${question.label}`;
}

function showContent(text, className) {
  content.replaceChildren();
  const message = document.createElement('p');
  message.className = `board-content-message ${className}`;
  message.textContent = text;
  content.append(message);
}

function speak(text, label) {
  showContent(text, 'guidance-message');
  status.textContent = label;
  speakAudio(text);
}

function speakAudio(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

function inPalace(row, col) {
  return col >= 3 && col <= 5 && (row <= 2 || row >= 7);
}

function isPalaceDiagonal(row, col) {
  return ((row === 0 || row === 2 || row === 7 || row === 9) && (col === 3 || col === 5))
    || (row === 1 && col === 4) || (row === 8 && col === 4);
}

