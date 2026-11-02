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

export function getGameStatus(state) {
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
  return { type: inCheck ? 'check' : 'playing', turn: state.turn, winner: null, inCheck };
}

export function makeMove(state, from, to) {
  if (!isLegalMove(state, from, to)) return false;
  applyMove(state, from, to);
  state.redoStack = [];
  return true;
}

export function undoMove(state) {
  const move = state.history.pop();
  if (!move) return false;
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
  state.history.push({ from: { ...from }, to: { ...to }, piece, captured, turn: state.turn });
  state.turn = opponentOf(state.turn);
}