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

export function initClassicGamesPage(lesson) {
  document.getElementById('boardCourseTitle').textContent = `5. ${lesson.title}`;
  document.querySelector('.board-course-back').textContent = '返回课程介绍';
  document.getElementById('boardDisplayApp').setAttribute('aria-label', '棋局演示课程');
  document.getElementById('teachingBoard').setAttribute('aria-label', '棋局演示棋盘');
  document.getElementById('boardLessonStatus').hidden = true;
  document.getElementById('boardToolbar').hidden = false;

  renderBoard();
  setPanelTitle('observationTitle', '动态观察');
  setPanelTitle('practiceTitle', '操作练习');
  setPanelTitle('boardQuizTitle', '问答练习');
  renderNote('observationButtons', lesson.teacher, 'classic-observation-note');
  renderNote('practiceButtons', lesson.state, 'classic-practice-note');
  document.getElementById('practiceButtons').className = 'classic-game-note-panel';
  document.getElementById('boardQuizButtons').replaceChildren();

  const content = document.getElementById('boardLessonContent');
  content.replaceChildren();
  const note = document.createElement('p');
  note.className = 'classic-game-note';
  note.textContent = '棋局问答材料待接入。';
  content.append(note);
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

function setPanelTitle(id, text) {
  document.getElementById(id).textContent = text;
}

function renderNote(containerId, text, messageClass) {
  const container = document.getElementById(containerId);
  container.className = 'classic-game-note-panel';
  container.replaceChildren();
  const note = document.createElement('p');
  note.className = `classic-game-note ${messageClass}`;
  note.textContent = text;
  container.append(note);
}
