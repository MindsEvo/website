import { createGameFromFen, getLegalMoves, makeMove, RED } from '../core.mjs';

const NUMBERS = '一二三四五六七八九';
const PIECES = { 车: 'R', 馬: 'H', 马: 'H', 炮: 'C', 兵: 'P', 卒: 'P', 帅: 'K', 将: 'K', 仕: 'A', 士: 'A', 相: 'E', 象: 'E' };
const MOVE_PATTERN = /[车馬马炮兵卒帅将仕士相象][一二三四五六七八九1-9][进退平][一二三四五六七八九1-9]/g;
const number = text => NUMBERS.includes(text) ? NUMBERS.indexOf(text) + 1 : Number(text);

export function notationContent(text) {
  return text.split(/\r?\n/).map(line => line.split('//')[0].split('#')[0]).join('\n')
    .replace(/[０-９]/g, digit => String(digit.charCodeAt(0) - '０'.charCodeAt(0)))
    .replace(/\d+\s*[.．、]/g, '').trim();
}

export function buildNotationPlayback(fen, text) {
  const game = createGameFromFen(fen);
  const content = notationContent(text);
  const notations = content.match(MOVE_PATTERN) || [];
  if (!notations.length || content.replace(MOVE_PATTERN, '').trim()) {
    throw new Error('棋谱包含无法识别的着法。');
  }
  const positions = [game.board.map(row => [...row])];
  const moves = [];
  for (const notation of notations) {
    const red = game.turn === RED;
    const piece = red ? PIECES[notation[0]] : PIECES[notation[0]].toLowerCase();
    const sourceFile = number(notation[1]);
    const col = red ? 9 - sourceFile : sourceFile - 1;
    const target = number(notation[3]);
    const direction = notation[2];
    const candidates = [];
    for (let row = 0; row < 10; row += 1) {
      if (game.board[row][col] !== piece) continue;
      const from = { row, col };
      for (const to of getLegalMoves(game, from)) {
        const forward = red ? to.row < row : to.row > row;
        if (direction === '平') {
          if (to.row !== row || (red ? 9 - to.col : to.col + 1) !== target) continue;
        } else {
          if (to.row === row || forward !== (direction === '进')) continue;
          const value = ['H', 'A', 'E'].includes(piece.toUpperCase())
            ? (red ? 9 - to.col : to.col + 1) : Math.abs(to.row - row);
          if (value !== target) continue;
        }
        candidates.push({ from, to });
      }
    }
    if (candidates.length !== 1) throw new Error(`${notation} 无法确定唯一合法走法。`);
    const move = candidates[0];
    makeMove(game, move.from, move.to);
    moves.push({ ...move, notation });
    positions.push(game.board.map(row => [...row]));
  }
  return { positions, moves };
}
