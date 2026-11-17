import { getPieceLabel, RED } from '../core.mjs';

const number = value => '一二三四五六七八九'[value - 1];
const file = (turn, col) => turn === RED ? 9 - col : col + 1;

export function formatLastMoveNotation(game) {
  const move = game.history.at(-1);
  if (!move) return '';
  const board = game.board.map(row => [...row]);
  board[move.from.row][move.from.col] = move.piece;
  board[move.to.row][move.to.col] = move.captured;
  const sameFile = [];
  for (let row = 0; row < board.length; row += 1) {
    if (board[row][move.from.col] === move.piece) sameFile.push(row);
  }
  const label = getPieceLabel(move.piece);
  let origin = `${label}${number(file(move.turn, move.from.col))}`;
  if (sameFile.length > 1) {
    sameFile.sort((a, b) => move.turn === RED ? a - b : b - a);
    const index = sameFile.indexOf(move.from.row);
    const prefix = sameFile.length === 2 ? ['前', '后'][index]
      : sameFile.length === 3 ? ['前', '中', '后'][index]
        : number(index + 1);
    const otherDuplicateFile = board[0].some((_, col) => col !== move.from.col
      && board.filter(row => row[col] === move.piece).length > 1);
    origin = `${otherDuplicateFile ? `${number(file(move.turn, move.from.col))}路` : ''}${prefix}${label}`;
  }
  const horizontal = move.from.row === move.to.row;
  const forward = move.turn === RED ? move.to.row < move.from.row : move.to.row > move.from.row;
  const target = horizontal || ['H', 'A', 'E'].includes(move.piece.toUpperCase())
    ? file(move.turn, move.to.col) : Math.abs(move.to.row - move.from.row);
  return `${origin}${horizontal ? '平' : forward ? '进' : '退'}${number(target)}`;
}
