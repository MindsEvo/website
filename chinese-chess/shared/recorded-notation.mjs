import { getPieceLabel, RED } from '../core.mjs';
import { buildNotationPlayback } from './notation-playback.mjs';

export function formatRecordedNotation(fen, history) {
  const number = value => '一二三四五六七八九'[value - 1];
  const file = (turn, col) => turn === RED ? 9 - col : col + 1;
  const text = history.map((move, index) => {
    const horizontal = move.from.row === move.to.row;
    const forward = move.turn === RED ? move.to.row < move.from.row : move.to.row > move.from.row;
    const target = horizontal || ['H', 'A', 'E'].includes(move.piece.toUpperCase())
      ? file(move.turn, move.to.col) : Math.abs(move.to.row - move.from.row);
    return `${index + 1}. ${getPieceLabel(move.piece)}${number(file(move.turn, move.from.col))}${horizontal ? '平' : forward ? '进' : '退'}${number(target)}`;
  }).join('\n');
  if (history.length) {
    const playback = buildNotationPlayback(fen, text);
    if (playback.moves.some((move, index) => ['from', 'to'].some(key =>
      move[key].row !== history[index][key].row || move[key].col !== history[index][key].col))) {
      throw new Error('棋谱与实际走棋不一致，无法保存。');
    }
  }
  return text;
}
