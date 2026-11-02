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
  ['将/帅', '#ff6a00'], ['士/仕', '#965fff'], ['象/相', '#263c90'], ['马', '#126c38'],
  ['车', '#fb3159'], ['炮', '#842d16'], ['兵/卒', '#ff9d00']
];

const BLACK_PIECES = [['将', 'k'], ['士', 'a'], ['象', 'e'], ['马', 'h'], ['车', 'r'], ['炮', 'c'], ['卒', 'p']];
const RED_PIECES = [['帅', 'K'], ['仕', 'A'], ['相', 'E'], ['马', 'H'], ['车', 'R'], ['炮', 'C'], ['兵', 'P']];
const QUIZ_ITEMS = ['将帅数量', '士仕数量', '象相数量', '马的数量', '炮的数量', '车的数量', '兵卒数量', '单方总数', '全部总数'];

export function initPiecesPage(lesson) {
  document.getElementById('boardCourseTitle').textContent = `${lesson.number}. ${lesson.title}`;
  document.querySelector('.board-course-back').textContent = '返回课程介绍';
  document.getElementById('boardDisplayApp').setAttribute('aria-label', '兵种介绍课程');
  document.getElementById('teachingBoard').setAttribute('aria-label', '中国象棋初始棋盘');
  document.getElementById('boardLessonStatus').hidden = true;
  document.getElementById('boardLessonContent').replaceChildren();
  document.getElementById('boardToolbar').hidden = false;

  renderBoard();
  renderStaticButtons('observationButtons', OBSERVATION_ITEMS, 'observation-button');
  renderPieceLists();
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

function renderPieceLists() {
  const container = document.getElementById('practiceButtons');
  container.className = 'piece-practice-list';
  container.replaceChildren();

  appendSideRow(container, '黑方：', BLACK_PIECES, 'black');
  appendSideRow(container, '红方：', RED_PIECES, 'red');

  const note = document.createElement('p');
  note.className = 'piece-practice-note';
  note.textContent = '点击上方棋子按钮开始练习';
  container.append(note);
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
    strip.append(button);
  }

  row.append(sideLabel, strip);
  container.append(row);
}
