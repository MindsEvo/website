import { createInitialBoard, getPieceLabel } from '../core.mjs';
import {
  appendStandardPositionMark,
  createStandardBoardArtwork,
  createStandardPieceElement,
  isCannonStartPosition,
  isPawnStartPosition,
  placeStandardIntersection
} from '../board-standard.mjs';
import { applyBoardStyle, onBoardStyleChange } from '../board-style.mjs';

applyBoardStyle();
onBoardStyleChange(() => {});

const boardElement = document.getElementById('geneBoard');
const board = createInitialBoard();
boardElement.append(createStandardBoardArtwork('gene-grid-svg xiangqi-grid-svg'));

for (let row = 0; row < board.length; row += 1) {
  for (let col = 0; col < board[row].length; col += 1) {
    const piece = board[row][col];
    const square = document.createElement('div');
    square.className = 'xiangqi-intersection gene-intersection';
    placeStandardIntersection(square, row, col);
    square.setAttribute('role', 'gridcell');
    square.setAttribute('aria-label', piece
      ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 路`
      : `空位，第 ${row + 1} 行第 ${col + 1} 路`);
    if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
    if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
    if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'gene-piece'));
    boardElement.append(square);
  }
}
