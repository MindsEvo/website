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
  ['红方棋子', '#df3445'],
  ['黑方棋子', '#343a40'],
  ['棋盘边框', '#27a64b'],
  ['楚河汉界', '#0876f9'],
  ['九宫', '#e900ce']
];

const PRACTICE_ITEMS = [
  ['选择红方棋子', '#df3445'],
  ['选择黑方棋子', '#343a40'],
  ['九宫', '#9856b1'],
  ['河界', '#18a8b8'],
  ['边框', '#27a64b']
];

const QUIZ_ITEMS = ['象棋对弈', '棋盘有几条河', '河的位置', '九宫'];

export function initObservationPage(lesson) {
  document.getElementById('boardCourseTitle').textContent = `${lesson.number}. ${lesson.title}`;
  document.querySelector('.board-course-back').textContent = '返回课程介绍';
  document.getElementById('boardDisplayApp').setAttribute('aria-label', '初步观察课程');
  document.getElementById('teachingBoard').setAttribute('aria-label', '中国象棋初始棋盘');
  document.getElementById('boardLessonStatus').hidden = true;
  document.getElementById('boardLessonContent').replaceChildren();
  document.getElementById('boardToolbar').hidden = false;

  renderBoard();
  renderStaticButtons('observationButtons', OBSERVATION_ITEMS, 'observation-button');
  renderStaticButtons('practiceButtons', PRACTICE_ITEMS, 'practice-button');
  renderStaticButtons('boardQuizButtons', QUIZ_ITEMS.map(label => [label, '#0876f9']), 'board-quiz-topic');
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

function renderStaticButtons(containerId, items, className) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  for (const [label, color] of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.style.setProperty('--button-color', color);
    container.append(button);
  }
}
