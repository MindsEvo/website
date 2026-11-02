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
  ['红黑双方', '#df3445'],
  ['楚河汉界', '#0876f9'],
  ['九宫', '#9856b1'],
  ['初始兵线', '#27a64b']
];

export function initSummaryPage(lesson) {
  document.getElementById('boardCourseTitle').textContent = `${lesson.number}. ${lesson.title}`;
  document.querySelector('.board-course-back').textContent = '返回课程介绍';
  document.getElementById('boardDisplayApp').setAttribute('aria-label', '总结与回顾课程');
  document.getElementById('teachingBoard').setAttribute('aria-label', '中国象棋总结棋盘');
  document.getElementById('boardLessonStatus').hidden = true;
  document.getElementById('boardToolbar').hidden = false;

  renderBoard();
  renderObservationButtons();
  renderTopics(lesson.topics);
  renderMessage(lesson.student, lesson.state);
}

function renderBoard() {
  const board = document.getElementById('teachingBoard');
  const position = createInitialBoard();
  board.replaceChildren(createStandardBoardArtwork('teaching-lines xiangqi-grid-svg'));

  for (let row = 0; row < position.length; row += 1) {
    for (let col = 0; col < position[row].length; col += 1) {
      const piece = position[row][col];
      const square = document.createElement('div');
      square.className = 'teaching-square xiangqi-intersection';
      placeStandardIntersection(square, row, col);
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 路`
        : `空位，第 ${row + 1} 行第 ${col + 1} 路`);
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'teaching-piece'));
      board.append(square);
    }
  }
}

function renderObservationButtons() {
  const container = document.getElementById('observationButtons');
  container.replaceChildren();
  for (const [label, color] of OBSERVATION_ITEMS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'observation-button';
    button.textContent = label;
    button.style.setProperty('--button-color', color);
    container.append(button);
  }
}

function renderTopics(topics) {
  const container = document.getElementById('practiceButtons');
  container.className = 'summary-topic-list';
  container.replaceChildren();
  topics.forEach((topic, index) => {
    const row = document.createElement('p');
    row.className = 'summary-topic';
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const text = document.createElement('span');
    text.textContent = topic;
    row.append(number, text);
    container.append(row);
  });
}

function renderMessage(studentText, stateText) {
  const title = document.getElementById('boardQuizTitle');
  title.textContent = '学习寄语';
  document.getElementById('boardQuizButtons').replaceChildren();
  const content = document.getElementById('boardLessonContent');
  content.replaceChildren();

  const message = document.createElement('p');
  message.className = 'summary-message';
  message.textContent = studentText;
  const state = document.createElement('p');
  state.className = 'summary-state';
  state.textContent = stateText;
  content.append(message, state);
}
