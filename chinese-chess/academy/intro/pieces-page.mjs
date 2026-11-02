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
  { code: 'k', label: '将/帅', color: '#ff6a00', description: '黑方称将，红方称帅，双方各有一枚。' },
  { code: 'a', label: '士/仕', color: '#965fff', description: '黑方称士，红方称仕，双方各有两枚，守护九宫。' },
  { code: 'e', label: '象/相', color: '#263c90', description: '黑方称象，红方称相，双方各有两枚。' },
  { code: 'h', label: '马', color: '#126c38', description: '红黑双方各有两匹马。' },
  { code: 'r', label: '车', color: '#fb3159', description: '红黑双方各有两辆车。' },
  { code: 'c', label: '炮', color: '#842d16', description: '红黑双方各有两门炮。' },
  { code: 'p', label: '兵/卒', color: '#ff9d00', description: '红方称兵，黑方称卒，双方各有五枚。' }
];

const BLACK_PIECES = [['将', 'k'], ['士', 'a'], ['象', 'e'], ['马', 'h'], ['车', 'r'], ['炮', 'c'], ['卒', 'p']];
const RED_PIECES = [['帅', 'K'], ['仕', 'A'], ['相', 'E'], ['马', 'H'], ['车', 'R'], ['炮', 'C'], ['兵', 'P']];
const QUIZ_ITEMS = [
  { id: 'king-count', label: '将帅数量', text: '红方帅和黑方将各有几枚？', options: ['各一枚', '各两枚', '红方一枚、黑方两枚'], answer: 0, explanation: '红方有一枚帅，黑方有一枚将。', codes: ['k', 'K'] },
  { id: 'advisor-count', label: '士仕数量', text: '红黑双方各有几枚士或仕？', options: ['各一枚', '各两枚', '各三枚'], answer: 1, explanation: '双方各有两枚士或仕。', codes: ['a', 'A'] },
  { id: 'elephant-count', label: '象相数量', text: '红黑双方各有几枚象或相？', options: ['各一枚', '各两枚', '各三枚'], answer: 1, explanation: '双方各有两枚象或相。', codes: ['e', 'E'] },
  { id: 'horse-count', label: '马的数量', text: '红黑双方各有几匹马？', options: ['各一匹', '各两匹', '各三匹'], answer: 1, explanation: '双方各有两匹马。', codes: ['h', 'H'] },
  { id: 'cannon-count', label: '炮的数量', text: '红黑双方各有几门炮？', options: ['各一门', '各两门', '各三门'], answer: 1, explanation: '双方各有两门炮。', codes: ['c', 'C'] },
  { id: 'rook-count', label: '车的数量', text: '红黑双方各有几辆车？', options: ['各一辆', '各两辆', '各三辆'], answer: 1, explanation: '双方各有两辆车。', codes: ['r', 'R'] },
  { id: 'pawn-count', label: '兵卒数量', text: '红方有几枚兵，黑方有几枚卒？', options: ['各三枚', '各四枚', '各五枚'], answer: 2, explanation: '红黑双方各有五枚兵或卒。', codes: ['p', 'P'] },
  { id: 'side-total', label: '单方总数', text: '开局时单方共有多少枚棋子？', options: ['14 枚', '16 枚', '18 枚'], answer: 1, explanation: '每方开局各有 16 枚棋子。', codes: ['all'] },
  { id: 'all-total', label: '全部总数', text: '开局时红黑双方总共有多少枚棋子？', options: ['30 枚', '32 枚', '34 枚'], answer: 1, explanation: '红黑双方各有 16 枚，合计 32 枚棋子。', codes: ['all'] }
];
const board = document.getElementById('teachingBoard');
const frame = document.querySelector('.teaching-board-frame');
const content = document.getElementById('boardLessonContent');
let practiceNote = null;
let activePractice = null;
let activePracticeButton = null;
let observationTimer = null;

export function initPiecesPage(lesson) {
  document.getElementById('boardCourseTitle').textContent = `${lesson.number}. ${lesson.title}`;
  document.querySelector('.board-course-back').textContent = '返回课程介绍';
  document.getElementById('boardDisplayApp').setAttribute('aria-label', '兵种介绍课程');
  document.getElementById('teachingBoard').setAttribute('aria-label', '中国象棋初始棋盘');
  document.getElementById('boardLessonStatus').hidden = true;
  document.getElementById('boardLessonContent').replaceChildren();
  document.getElementById('boardToolbar').hidden = false;

  renderBoard();
  renderObservationButtons();
  renderPieceLists();
  renderQuizButtons();
}

function renderBoard() {
  const position = createInitialBoard();
  board.replaceChildren(createStandardBoardArtwork('teaching-lines xiangqi-grid-svg'));

  for (let row = 0; row < position.length; row += 1) {
    for (let col = 0; col < position[row].length; col += 1) {
      const piece = position[row][col];
      const square = document.createElement('div');
      square.className = 'teaching-square xiangqi-intersection';
      placeStandardIntersection(square, row, col);
      square.dataset.row = String(row);
      square.dataset.col = String(col);
      square.dataset.piece = piece || '';
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 路`
        : `空位，第 ${row + 1} 行第 ${col + 1} 路`);
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'teaching-piece'));
      square.addEventListener('click', () => handlePracticeClick(square));
      board.append(square);
    }
  }
}

function renderObservationButtons() {
  const container = document.getElementById('observationButtons');
  container.replaceChildren();
  for (const item of OBSERVATION_ITEMS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'observation-button';
    button.textContent = item.label;
    button.style.setProperty('--button-color', item.color);
    button.addEventListener('click', () => runObservation(item, button));
    container.append(button);
  }
}

function runObservation(item, button) {
  resetPractice();
  clearQuizState();
  clearHighlights();
  content.replaceChildren();
  document.querySelectorAll('#observationButtons button').forEach(node => node.classList.toggle('active', node === button));
  const codes = [item.code.toLowerCase(), item.code.toUpperCase()];
  board.querySelectorAll('.teaching-square').forEach(square => {
    if (codes.includes(square.dataset.piece)) square.querySelector('.teaching-piece')?.classList.add('piece-observe-active');
  });
  setPieceMessage(item.description, 'piece-observation-message');
  speak(item.description);
  observationTimer = window.setTimeout(clearHighlights, 10000);
}

function setPieceMessage(text, className) {
  const message = document.createElement('p');
  message.className = `board-content-message ${className}`;
  message.textContent = text;
  content.replaceChildren(message);
}

function renderPieceLists() {
  const container = document.getElementById('practiceButtons');
  container.className = 'piece-practice-list';
  container.replaceChildren();

  appendSideRow(container, '黑方：', BLACK_PIECES, 'black');
  appendSideRow(container, '红方：', RED_PIECES, 'red');

  practiceNote = document.createElement('p');
  practiceNote.className = 'piece-practice-note';
  practiceNote.setAttribute('role', 'status');
  practiceNote.textContent = '点击棋种按钮，再在棋盘上找到对应棋子。';
  container.append(practiceNote);
}

function appendSideRow(container, label, pieces, side) {
  const row = document.createElement('div');
  row.className = `piece-side-row ${side}-side-row`;
  const sideLabel = document.createElement('strong');
  sideLabel.textContent = label;
  const strip = document.createElement('div');
  strip.className = 'piece-choice-strip';

  for (const [pieceLabel, pieceCode] of pieces) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = pieceLabel;
    button.setAttribute('aria-label', `${label}${pieceLabel}`);
    button.className = pieceCode === pieceCode.toUpperCase() ? 'red-choice' : 'black-choice';
    button.dataset.pieceCode = pieceCode;
    button.dataset.side = side;
    button.addEventListener('click', () => armPractice(button, pieceLabel, side, pieceCode));
    strip.append(button);
  }

  row.append(sideLabel, strip);
  container.append(row);
}

function armPractice(button, label, side, pieceCode) {
  clearHighlights();
  clearQuizState();
  content.replaceChildren();
  resetPractice();
  activePractice = { label, side, pieceCode };
  activePracticeButton = button;
  button.classList.add('practice-current');
  const sideLabel = side === 'red' ? '红方' : '黑方';
  const sidePieceLabel = side === 'red' ? label : label;
  practiceNote.textContent = `${sideLabel}：请点击${sidePieceLabel}。`;
  speak(`请点击${sideLabel}${sidePieceLabel}`);
}

function handlePracticeClick(square) {
  if (!activePractice) return;
  const correct = square.dataset.piece === activePractice.pieceCode;
  clearPracticeMarks();
  showPracticeMark(square, correct);
  activePracticeButton.classList.remove('practice-current', 'practice-correct', 'practice-wrong');
  activePracticeButton.classList.add(correct ? 'practice-correct' : 'practice-wrong');
  const sideLabel = activePractice.side === 'red' ? '红方' : '黑方';
  practiceNote.textContent = correct
    ? `回答正确：${sideLabel}${activePractice.label}。`
    : `回答错误，请再找一枚${sideLabel}${activePractice.label}。`;
  speak(correct ? '回答正确' : '回答错误，请再试一次');
  if (correct) {
    activePractice = null;
    activePracticeButton = null;
  }
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

function resetPractice() {
  activePractice = null;
  activePracticeButton = null;
  clearPracticeMarks();
  if (practiceNote) practiceNote.textContent = '点击棋种按钮，再在棋盘上找到对应棋子。';
  document.querySelectorAll('#practiceButtons .piece-choice-strip button').forEach(button => {
    button.classList.remove('practice-current', 'practice-correct', 'practice-wrong');
  });
}

function renderQuizButtons() {
  const container = document.getElementById('boardQuizButtons');
  container.replaceChildren();
  for (const question of QUIZ_ITEMS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'board-quiz-topic';
    button.textContent = question.label;
    button.addEventListener('click', () => showQuizQuestion(question, button));
    container.append(button);
  }
}

function showQuizQuestion(question, button) {
  resetPractice();
  clearHighlights();
  clearQuizState();
  document.querySelectorAll('#observationButtons button').forEach(node => node.classList.remove('active'));
  document.querySelectorAll('#boardQuizButtons button').forEach(node => node.classList.toggle('active', node === button));
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
    option.addEventListener('click', () => answerQuiz(question, options, feedback, index, button));
    options.append(option);
  });
  content.replaceChildren(prompt, options, feedback);
  speak(question.text);
}

function answerQuiz(question, options, feedback, selectedIndex, topicButton) {
  const correct = selectedIndex === question.answer;
  options.querySelectorAll('button').forEach((option, index) => {
    option.disabled = true;
    if (index === question.answer) option.classList.add('correct');
    else if (index === selectedIndex) option.classList.add('incorrect');
  });
  feedback.textContent = `${correct ? '答对了！' : `参考答案：${question.options[question.answer]}。`}${question.explanation}`;
  feedback.className = `board-question-feedback ${correct ? 'correct' : 'incorrect'}`;
  topicButton.classList.remove('quiz-correct', 'quiz-wrong');
  topicButton.classList.add(correct ? 'quiz-correct' : 'quiz-wrong');
  highlightQuestionPieces(question.codes);
  speak(`${correct ? '回答正确。' : '回答错误。'}${question.explanation}`);
}

function highlightQuestionPieces(codes) {
  clearHighlights();
  const allCodes = ['k', 'K', 'a', 'A', 'e', 'E', 'h', 'H', 'r', 'R', 'c', 'C', 'p', 'P'];
  const targets = codes.includes('all') ? allCodes : codes;
  board.querySelectorAll('.teaching-square').forEach(square => {
    if (targets.includes(square.dataset.piece)) square.querySelector('.teaching-piece')?.classList.add('piece-observe-active');
  });
  observationTimer = window.setTimeout(clearHighlights, 8000);
}

function clearHighlights() {
  if (observationTimer) {
    window.clearTimeout(observationTimer);
    observationTimer = null;
  }
  board.querySelectorAll('.piece-observe-active').forEach(piece => piece.classList.remove('piece-observe-active'));
}

function clearQuizState() {
  document.querySelectorAll('#boardQuizButtons button').forEach(button => button.classList.remove('active', 'quiz-correct', 'quiz-wrong'));
}

function speak(text) {
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
