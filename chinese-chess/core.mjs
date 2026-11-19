export const ROWS = 10;
export const COLS = 9;
export const RED = 'red';
export const BLACK = 'black';

const PIECE_TYPES = new Set(['K', 'A', 'E', 'H', 'R', 'C', 'P']);
const FEN_TO_PIECE = { K: 'K', A: 'A', B: 'E', E: 'E', N: 'H', H: 'H', R: 'R', C: 'C', P: 'P' };
const PIECE_TO_FEN = { K: 'K', A: 'A', E: 'B', H: 'N', R: 'R', C: 'C', P: 'P' };
const PIECE_LABELS = {
  K: '帅', A: '仕', E: '相', H: '马', R: '车', C: '炮', P: '兵',
  k: '将', a: '士', e: '象', h: '马', r: '车', c: '炮', p: '卒'
};

const inBounds = (row, col) => row >= 0 && row < ROWS && col >= 0 && col < COLS;
const colorOf = piece => piece === piece.toUpperCase() ? RED : BLACK;
const opponentOf = color => color === RED ? BLACK : RED;
const sign = value => Math.sign(value);

export function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function createInitialBoard() {
  const board = createEmptyBoard();
  const backRank = ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R'];

  board[0] = backRank.map(piece => piece.toLowerCase());
  board[9] = [...backRank];
  board[2][1] = 'c';
  board[2][7] = 'c';
  board[7][1] = 'C';
  board[7][7] = 'C';
  for (const col of [0, 2, 4, 6, 8]) {
    board[3][col] = 'p';
    board[6][col] = 'P';
  }
  return board;
}

export function createGame(options = {}) {
  const board = options.board ? cloneBoard(options.board) : createInitialBoard();
  const turn = options.turn || RED;
  if (turn !== RED && turn !== BLACK) throw new Error('行棋方必须是红方或黑方。');
  validateBoard(board);
  return { board, turn, history: [], redoStack: [] };
}

export function createGameFromFen(fen) {
  const position = parseFen(fen);
  return createGame(position);
}

export function parseFen(fen) {
  const fields = String(fen || '').trim().split(/\s+/);
  if (fields.length < 2) throw new Error('局面格式至少需要棋盘布局和行棋方。');
  if (!/^[wbr]$/i.test(fields[1])) {
    throw new Error('行棋方必须是 w、r 或 b。');
  }

  const ranks = fields[0].split('/');
  if (ranks.length !== ROWS) throw new Error('棋盘布局必须包含 10 行。');
  const board = ranks.map((rank, rowIndex) => {
    const squares = [];
    for (const token of rank) {
      if (/^[1-9]$/.test(token)) {
        for (let count = 0; count < Number(token); count += 1) squares.push(null);
      } else if (FEN_TO_PIECE[token.toUpperCase()]) {
        const normalized = FEN_TO_PIECE[token.toUpperCase()];
        squares.push(token === token.toUpperCase() ? normalized : normalized.toLowerCase());
      } else {
        throw new Error(`第 ${rowIndex + 1} 行含有无效棋子符号：${token}`);
      }
    }
    if (squares.length !== COLS) throw new Error(`第 ${rowIndex + 1} 行必须恰好有 9 列。`);
    return squares;
  });

  return { board, turn: fields[1].toLowerCase() === 'b' ? BLACK : RED };
}

export function toFen(state) {
  const ranks = state.board.map(row => {
    let fenRank = '';
    let emptyCount = 0;
    for (const piece of row) {
      if (!piece) {
        emptyCount += 1;
        continue;
      }
      if (emptyCount) fenRank += String(emptyCount);
      emptyCount = 0;
      const fenPiece = PIECE_TO_FEN[piece.toUpperCase()];
      fenRank += piece === piece.toUpperCase() ? fenPiece : fenPiece.toLowerCase();
    }
    if (emptyCount) fenRank += String(emptyCount);
    return fenRank;
  });
  return `${ranks.join('/')} ${state.turn === RED ? 'w' : 'b'} - - 0 1`;
}

export function getPieceLabel(piece) {
  return piece ? PIECE_LABELS[piece] : '';
}

export function getLegalMoves(state, from, turn = state.turn) {
  if (!inBounds(from.row, from.col)) return [];
  const piece = state.board[from.row][from.col];
  if (!piece || colorOf(piece) !== turn) return [];

  const moves = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (isLegalBoardMove(state.board, from, { row, col }, turn)) moves.push({ row, col });
    }
  }
  return moves;
}

export function isLegalMove(state, from, to, turn = state.turn) {
  if (!inBounds(from.row, from.col) || !inBounds(to.row, to.col)) return false;
  if (from.row === to.row && from.col === to.col) return false;
  return isLegalBoardMove(state.board, from, to, turn);
}

export function isInCheck(state, color = state.turn) {
  const king = findKing(state.board, color);
  if (!king) return true;

  const opposingKing = findKing(state.board, opponentOf(color));
  if (opposingKing && king.col === opposingKing.col && clearPath(state.board, king, opposingKing)) return true;
  return isSquareAttacked(state.board, king, opponentOf(color));
}

export function isTerminalGameStatus(status) {
  return ['checkmate', 'stalemate', 'invalid', 'draw', 'forfeit'].includes(status?.type);
}

export function getGameStatus(state) {
  if (state.result?.type === 'draw') {
    return { type: 'draw', turn: state.turn, winner: null, inCheck: isInCheck(state, state.turn), reason: 'agreement' };
  }
  const hasRedKing = Boolean(findKing(state.board, RED));
  const hasBlackKing = Boolean(findKing(state.board, BLACK));
  if (!hasRedKing || !hasBlackKing) {
    return { type: 'invalid', turn: state.turn, winner: null, inCheck: true };
  }

  const inCheck = isInCheck(state, state.turn);
  const hasMoves = state.board.some((row, rowIndex) => row.some((piece, colIndex) => (
    piece && colorOf(piece) === state.turn && getLegalMoves(state, { row: rowIndex, col: colIndex }).length > 0
  )));

  if (!hasMoves) {
    return {
      type: inCheck ? 'checkmate' : 'stalemate',
      turn: state.turn,
      winner: opponentOf(state.turn),
      inCheck
    };
  }
  const repetition = getRepetitionResult(state);
  if (repetition) {
    return {
      type: repetition.type,
      turn: state.turn,
      ...(repetition.loser ? { loser: repetition.loser } : {}),
      winner: repetition.winner,
      inCheck,
      reason: repetition.reason
    };
  }
  if (state.board.flat().every(piece => !piece || piece.toUpperCase() === 'K')) {
    return { type: 'draw', turn: state.turn, winner: null, inCheck, reason: 'no-material' };
  }
  let quietPlies = 0;
  const checks = { [RED]: 0, [BLACK]: 0 };
  for (let index = state.history.length - 1; index >= 0 && !state.history[index].captured; index -= 1) {
    quietPlies += 1;
    if (state.history[index].check) checks[state.history[index].turn] += 1;
  }
  if (quietPlies >= 120 && checks[RED] <= 10 && checks[BLACK] <= 10) {
    return { type: 'draw', turn: state.turn, winner: null, inCheck, reason: 'natural-limit' };
  }
  return { type: inCheck ? 'check' : 'playing', turn: state.turn, winner: null, inCheck };
}

export function agreeToDraw(state) {
  state.result = { type: 'draw', reason: 'agreement' };
}

function getRepetitionResult(state) {
  if (state.history.length < 8) return null;
  const positions = getHistoryPositions(state);
  const current = positionKey(positions.at(-1));
  const occurrences = [];
  for (let index = positions.length - 1; index >= 0; index -= 1) {
    if (positionKey(positions[index]) === current) occurrences.push(index);
  }
  if (occurrences.length < 3) return null;
  for (let latest = 0; latest < occurrences.length - 2; latest += 1) {
    const end = occurrences[latest];
    for (let middleIndex = latest + 1; middleIndex < occurrences.length - 1; middleIndex += 1) {
      const middle = occurrences[middleIndex];
      const period = end - middle;
      if (period <= 0) continue;
      for (let startIndex = middleIndex + 1; startIndex < occurrences.length; startIndex += 1) {
        const start = occurrences[startIndex];
        if (middle - start !== period || !samePositionCycle(positions, start, middle, end)) continue;
        const result = adjudicateRepetition(state, positions, start, end);
        if (result) return result;
      }
    }
  }
  return null;
}

function getHistoryPositions(state) {
  const positions = new Array(state.history.length + 1);
  let board = cloneBoard(state.board);
  let turn = state.turn;
  positions[state.history.length] = { board: cloneBoard(board), turn };
  for (let index = state.history.length - 1; index >= 0; index -= 1) {
    const move = state.history[index];
    board[move.from.row][move.from.col] = move.piece;
    board[move.to.row][move.to.col] = move.captured;
    turn = move.turn;
    positions[index] = { board: cloneBoard(board), turn };
  }
  return positions;
}

function positionKey(position) {
  return `${position.turn}:${position.board.map(row => row.map(piece => piece || '.').join('')).join('/')}`;
}

function samePositionCycle(positions, start, middle, end) {
  for (let index = 0; index <= middle - start; index += 1) {
    if (positionKey(positions[start + index]) !== positionKey(positions[middle + index])) return false;
  }
  return positionKey(positions[middle]) === positionKey(positions[end]);
}

function adjudicateRepetition(state, positions, start, end) {
  const moves = state.history.slice(start, end);
  const identityBoard = positions[start].board.map((row, rowIndex) => row.map((piece, colIndex) =>
    piece ? `${rowIndex},${colIndex}` : null));
  const chaseBySide = { [RED]: [], [BLACK]: [] };
  const checksBySide = { [RED]: [], [BLACK]: [] };
  for (let index = start; index < end; index += 1) {
    const move = state.history[index];
    const after = positions[index + 1];
    const side = move.turn;
    checksBySide[side].push(isInCheck(after, after.turn));
    identityBoard[move.to.row][move.to.col] = identityBoard[move.from.row][move.from.col];
    identityBoard[move.from.row][move.from.col] = null;
    chaseBySide[side].push(findChaseTargets(after, side, identityBoard));
  }
  const sides = [RED, BLACK].filter(side => checksBySide[side].length);
  const checking = side => checksBySide[side].every(Boolean);
  const chased = side => {
    const turns = chaseBySide[side];
    if (!turns.length) return false;
    const common = turns[0].filter(target => turns.every(targets => targets.includes(target)));
    return common.length > 0;
  };
  const forbidden = side => checksBySide[side].length > 0
    && (checking(side) || chased(side));
  const offenders = sides.filter(forbidden);
  if (offenders.length === 1) {
    return {
      type: 'forfeit',
      loser: offenders[0],
      winner: offenders[0] === RED ? BLACK : RED,
      reason: 'perpetual-attack'
    };
  }
  return { type: 'draw', winner: null, reason: offenders.length ? 'mutual-repetition' : 'repetition' };
}

function findChaseTargets(position, attacker, identities) {
  const defender = opponentOf(attacker);
  const chased = [];
  for (let targetRow = 0; targetRow < ROWS; targetRow += 1) {
    for (let targetCol = 0; targetCol < COLS; targetCol += 1) {
      const target = position.board[targetRow][targetCol];
      if (!target || colorOf(target) !== defender || target.toUpperCase() === 'K') continue;
      const sources = [];
      for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
          if (position.board[row][col] && colorOf(position.board[row][col]) === attacker
            && isLegalBoardMove(position.board, { row, col }, { row: targetRow, col: targetCol }, attacker)) {
            sources.push({ row, col, piece: position.board[row][col] });
          }
        }
      }
      if (!sources.length || sources.every(source => ['K', 'P'].includes(source.piece.toUpperCase()))) continue;
      if (target.toUpperCase() !== 'R' && !isChaseUnprotected(position, attacker, targetRow, targetCol, sources)) continue;
      const identity = identities[targetRow][targetCol];
      if (identity) chased.push(identity);
    }
  }
  return chased;
}

function isChaseUnprotected(position, attacker, targetRow, targetCol, sources) {
  const defender = opponentOf(attacker);
  const targetPiece = position.board[targetRow][targetCol];
  const values = { K: 100, R: 9, C: 4, H: 4, A: 2, E: 2, P: 1 };
  const targetValue = values[targetPiece.toUpperCase()];
  return sources.some(source => {
    const board = cloneBoard(position.board);
    board[targetRow][targetCol] = source.piece;
    board[source.row][source.col] = null;
    const attackerValue = values[source.piece.toUpperCase()];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const piece = board[row][col];
        if (!piece || colorOf(piece) !== defender) continue;
        if (getLegalMoves({ board, turn: defender }, { row, col }, defender)
          .some(to => to.row === targetRow && to.col === targetCol)) {
          return targetValue > attackerValue;
        }
      }
    }
    return true;
  });
}

export function makeMove(state, from, to) {
  if (state.result) return false;
  if (!isLegalMove(state, from, to)) return false;
  applyMove(state, from, to);
  state.redoStack = [];
  return true;
}

export function undoMove(state) {
  const move = state.history.pop();
  if (!move) return false;
  delete state.result;
  state.board[move.from.row][move.from.col] = move.piece;
  state.board[move.to.row][move.to.col] = move.captured;
  state.turn = move.turn;
  state.redoStack.push(move);
  return true;
}

export function redoMove(state) {
  const move = state.redoStack.pop();
  if (!move || !isLegalMove(state, move.from, move.to)) {
    if (move) state.redoStack.push(move);
    return false;
  }
  applyMove(state, move.from, move.to);
  return true;
}

function cloneBoard(board) {
  return board.map(row => [...row]);
}

function validateBoard(board) {
  if (!Array.isArray(board) || board.length !== ROWS || board.some(row => !Array.isArray(row) || row.length !== COLS)) {
    throw new Error('棋盘必须是 10 行 9 列。');
  }
  for (const row of board) {
    for (const piece of row) {
      if (piece && (!PIECE_TYPES.has(piece.toUpperCase()) || (piece !== piece.toUpperCase() && piece !== piece.toLowerCase()))) {
        throw new Error(`无效棋子：${piece}`);
      }
    }
  }
}

function findKing(board, color) {
  const king = color === RED ? 'K' : 'k';
  for (let row = 0; row < ROWS; row += 1) {
    const col = board[row].indexOf(king);
    if (col >= 0) return { row, col };
  }
  return null;
}

function isLegalBoardMove(board, from, to, turn) {
  const piece = board[from.row][from.col];
  if (!piece || colorOf(piece) !== turn) return false;
  const target = board[to.row][to.col];
  if (target && (colorOf(target) === turn || target.toUpperCase() === 'K')) return false;
  if (!canMoveByRule(board, piece, from, to)) return false;

  const nextBoard = cloneBoard(board);
  nextBoard[to.row][to.col] = piece;
  nextBoard[from.row][from.col] = null;
  return !isInCheck({ board: nextBoard }, turn);
}

function canMoveByRule(board, piece, from, to) {
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;
  const absRow = Math.abs(rowDiff);
  const absCol = Math.abs(colDiff);
  const color = colorOf(piece);
  const target = board[to.row][to.col];
  const type = piece.toUpperCase();

  if (type === 'K') {
    const inPalace = color === RED
      ? to.row >= 7 && to.row <= 9 && to.col >= 3 && to.col <= 5
      : to.row >= 0 && to.row <= 2 && to.col >= 3 && to.col <= 5;
    return inPalace && absRow + absCol === 1;
  }
  if (type === 'A') {
    const inPalace = color === RED
      ? to.row >= 7 && to.row <= 9 && to.col >= 3 && to.col <= 5
      : to.row >= 0 && to.row <= 2 && to.col >= 3 && to.col <= 5;
    return inPalace && absRow === 1 && absCol === 1;
  }
  if (type === 'E') {
    const staysOnOwnSide = color === RED ? to.row >= 5 : to.row <= 4;
    if (!staysOnOwnSide || absRow !== 2 || absCol !== 2) return false;
    return !board[from.row + rowDiff / 2][from.col + colDiff / 2];
  }
  if (type === 'H') {
    if (!((absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2))) return false;
    const legRow = absRow === 2 ? from.row + sign(rowDiff) : from.row;
    const legCol = absCol === 2 ? from.col + sign(colDiff) : from.col;
    return !board[legRow][legCol];
  }
  if (type === 'R' || type === 'C') {
    if (rowDiff !== 0 && colDiff !== 0) return false;
    const screens = countBetween(board, from, to);
    return type === 'R' ? screens === 0 : target ? screens === 1 : screens === 0;
  }
  if (type === 'P') {
    const forward = color === RED ? -1 : 1;
    if (rowDiff === forward && colDiff === 0) return true;
    const hasCrossedRiver = color === RED ? from.row <= 4 : from.row >= 5;
    return hasCrossedRiver && rowDiff === 0 && absCol === 1;
  }
  return false;
}

function countBetween(board, from, to) {
  const rowStep = sign(to.row - from.row);
  const colStep = sign(to.col - from.col);
  let count = 0;
  for (let row = from.row + rowStep, col = from.col + colStep; row !== to.row || col !== to.col; row += rowStep, col += colStep) {
    if (board[row][col]) count += 1;
  }
  return count;
}

function clearPath(board, from, to) {
  return countBetween(board, from, to) === 0;
}

function isSquareAttacked(board, target, byColor) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const piece = board[row][col];
      if (!piece || colorOf(piece) !== byColor) continue;
      if (canMoveByRule(board, piece, { row, col }, target)) return true;
    }
  }
  return false;
}

function applyMove(state, from, to) {
  const piece = state.board[from.row][from.col];
  const captured = state.board[to.row][to.col];
  state.board[to.row][to.col] = piece;
  state.board[from.row][from.col] = null;
  const move = { from: { ...from }, to: { ...to }, piece, captured, turn: state.turn };
  state.history.push(move);
  state.turn = opponentOf(state.turn);
  move.check = isInCheck(state, state.turn);
}