import { getPieceLabel, parseFen, RED } from '../core.mjs';
import { buildNotationPlayback, notationContent } from './notation-playback.mjs';

function notationRounds(fen, notations) {
  const rounds = [];
  const offset = parseFen(fen).turn === RED ? 0 : 1;
  notations.forEach((notation, index) => {
    const ply = index + offset;
    if (index === 0 || ply % 2 === 0) {
      rounds.push(`${Math.floor(ply / 2) + 1}. ${notation}`);
    } else {
      rounds[rounds.length - 1] += ` ${notation}`;
    }
  });
  return rounds;
}

export function formatSolutionNotation(fen, text) {
  const playback = buildNotationPlayback(fen, text);
  const rounds = notationRounds(fen, playback.moves.map(move => move.notation));
  const comments = new Map();
  const offset = parseFen(fen).turn === RED ? 0 : 1;
  let moveCount = 0;
  for (const line of text.split(/\r?\n/)) {
    moveCount += notationContent(line).replace(/\s/g, '').length / 4;
    const comment = line.match(/\/\/.*|#.*/)?.[0];
    if (!comment) continue;
    const round = moveCount ? Math.floor((moveCount - 1 + offset) / 2) : -1;
    if (!comments.has(round)) comments.set(round, []);
    comments.get(round).push(comment);
  }
  return [
    ...(comments.get(-1) || []),
    ...rounds.flatMap((round, index) => [round, ...(comments.get(index) || [])])
  ].join('\n');
}

export function formatRecordedNotation(fen, history) {
  const number = value => '一二三四五六七八九'[value - 1];
  const file = (turn, col) => turn === RED ? 9 - col : col + 1;
  const notations = history.map(move => {
    const horizontal = move.from.row === move.to.row;
    const forward = move.turn === RED ? move.to.row < move.from.row : move.to.row > move.from.row;
    const target = horizontal || ['H', 'A', 'E'].includes(move.piece.toUpperCase())
      ? file(move.turn, move.to.col) : Math.abs(move.to.row - move.from.row);
    return `${getPieceLabel(move.piece)}${number(file(move.turn, move.from.col))}${horizontal ? '平' : forward ? '进' : '退'}${number(target)}`;
  });
  const text = notationRounds(fen, notations).join('\n');
  if (history.length) {
    const playback = buildNotationPlayback(fen, text);
    if (playback.moves.some((move, index) => ['from', 'to'].some(key =>
      move[key].row !== history[index][key].row || move[key].col !== history[index][key].col))) {
      throw new Error('棋谱与实际走棋不一致，无法保存。');
    }
  }
  return text;
}
