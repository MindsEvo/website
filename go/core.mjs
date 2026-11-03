export const BOARD_SIZES = Object.freeze([9, 13, 19]);
export const BLACK = 'B';
export const WHITE = 'W';

const otherColor = color => color === BLACK ? WHITE : BLACK;
const inBounds = (size, row, col) => row >= 0 && row < size && col >= 0 && col < size;
const pointKey = (row, col) => `${row},${col}`;

export function createEmptyBoard(size) {
  validateSize(size);
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function createGame(size = 9, options = {}) {
  validateSize(size);
  const board = options.board ? cloneBoard(options.board) : createEmptyBoard(size);
  validateBoard(board, size);
  const turn = options.turn || BLACK;
  if (turn !== BLACK && turn !== WHITE) throw new Error('行棋方必须是黑方或白方。');
  return {
    size,
    board,
    turn,
    captures: { [BLACK]: 0, [WHITE]: 0 },
    consecutivePasses: 0,
    scoring: false,
    finished: false,
    previousPositionKey: null,
    lastMove: null,
    moves: [],
    history: [],
    redoStack: []
  };
}

export function playStone(state, row, col) {
  if (state.finished || state.scoring || !inBounds(state.size, row, col) || state.board[row][col]) return false;

  const before = snapshot(state);
  const nextBoard = cloneBoard(state.board);
  const color = state.turn;
  nextBoard[row][col] = color;

  const captured = [];
  const checkedGroups = new Set();
  for (const [nextRow, nextCol] of neighbors(state.size, row, col)) {
    if (nextBoard[nextRow][nextCol] !== otherColor(color)) continue;
    const key = pointKey(nextRow, nextCol);
    if (checkedGroups.has(key)) continue;
    const group = collectGroup(nextBoard, state.size, nextRow, nextCol);
    for (const point of group.stones) checkedGroups.add(pointKey(point.row, point.col));
    if (group.liberties.size === 0) captured.push(...group.stones);
  }

  for (const stone of captured) nextBoard[stone.row][stone.col] = null;
  const ownGroup = collectGroup(nextBoard, state.size, row, col);
  if (ownGroup.liberties.size === 0) return false;

  const nextPositionKey = getPositionKey(nextBoard);
  if (state.previousPositionKey && nextPositionKey === state.previousPositionKey) return false;

  state.history.push(before);
  state.redoStack = [];
  state.previousPositionKey = getPositionKey(state.board);
  state.board = nextBoard;
  state.captures[color] += captured.length;
  state.turn = otherColor(color);
  state.consecutivePasses = 0;
  state.lastMove = { row, col, color };
  state.moves.push({ row, col, color, pass: false });
  return true;
}

export function passTurn(state) {
  if (state.finished || state.scoring) return false;
  const before = snapshot(state);
  const color = state.turn;
  state.history.push(before);
  state.redoStack = [];
  state.turn = otherColor(color);
  state.previousPositionKey = null;
  state.consecutivePasses += 1;
  state.lastMove = null;
  state.moves.push({ color, pass: true });
  if (state.consecutivePasses >= 2) state.scoring = true;
  return true;
}

export function getGroupStones(board, row, col) {
  if (!Array.isArray(board) || !board[row]?.[col]) return [];
  return collectGroup(board, board.length, row, col).stones;
}

export function getGroupInfo(board, row, col) {
  if (!Array.isArray(board) || !board[row]?.[col]) return { stones: [], liberties: [] };
  const group = collectGroup(board, board.length, row, col);
  return {
    stones: group.stones,
    liberties: [...group.liberties].map(key => {
      const [libertyRow, libertyCol] = key.split(',').map(Number);
      return { row: libertyRow, col: libertyCol };
    })
  };
}

export function calculateAreaScore(board, size, deadStones = new Set(), komi = 7.5) {
  validateSize(size);
  validateBoard(board, size);
  const scoredBoard = cloneBoard(board);
  for (const deadStone of deadStones) {
    const [row, col] = deadStone.split(',').map(Number);
    if (inBounds(size, row, col)) scoredBoard[row][col] = null;
  }

  let blackArea = 0;
  let whiteArea = 0;
  let neutralPoints = 0;
  const visited = new Set();

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const stone = scoredBoard[row][col];
      if (stone === BLACK) {
        blackArea += 1;
        continue;
      }
      if (stone === WHITE) {
        whiteArea += 1;
        continue;
      }

      const startKey = pointKey(row, col);
      if (visited.has(startKey)) continue;
      const region = [];
      const borderingColors = new Set();
      const pending = [{ row, col }];
      visited.add(startKey);

      while (pending.length) {
        const point = pending.pop();
        region.push(point);
        for (const [nextRow, nextCol] of neighbors(size, point.row, point.col)) {
          const neighbor = scoredBoard[nextRow][nextCol];
          if (neighbor) {
            borderingColors.add(neighbor);
            continue;
          }
          const key = pointKey(nextRow, nextCol);
          if (!visited.has(key)) {
            visited.add(key);
            pending.push({ row: nextRow, col: nextCol });
          }
        }
      }

      if (borderingColors.size === 1 && borderingColors.has(BLACK)) blackArea += region.length;
      else if (borderingColors.size === 1 && borderingColors.has(WHITE)) whiteArea += region.length;
      else neutralPoints += region.length;
    }
  }

  const blackScore = blackArea;
  const whiteScore = whiteArea + komi;
  const difference = Math.abs(blackScore - whiteScore);
  return {
    blackArea,
    whiteArea,
    neutralPoints,
    komi,
    blackScore,
    whiteScore,
    winner: blackScore === whiteScore ? null : blackScore > whiteScore ? BLACK : WHITE,
    difference
  };
}

export function finishScoring(state) {
  if (!state.scoring || state.finished) return false;
  state.scoring = false;
  state.finished = true;
  return true;
}

export function resumeAfterScoring(state) {
  if (!state.scoring || state.finished) return false;
  state.history.push(snapshot(state));
  state.redoStack = [];
  state.scoring = false;
  state.consecutivePasses = 0;
  state.lastMove = null;
  return true;
}

export function undoMove(state) {
  if (!state.history.length) return false;
  const current = snapshot(state);
  const previous = state.history.pop();
  state.redoStack.push(current);
  restore(state, previous);
  return true;
}

export function redoMove(state) {
  if (!state.redoStack.length) return false;
  const current = snapshot(state);
  const next = state.redoStack.pop();
  state.history.push(current);
  restore(state, next);
  return true;
}

export function getPositionKey(board) {
  return board.map(row => row.map(stone => stone || '.').join('')).join('/');
}

function collectGroup(board, size, startRow, startCol) {
  const color = board[startRow][startCol];
  const stones = [];
  const liberties = new Set();
  const visited = new Set([pointKey(startRow, startCol)]);
  const pending = [{ row: startRow, col: startCol }];

  while (pending.length) {
    const point = pending.pop();
    stones.push(point);
    for (const [row, col] of neighbors(size, point.row, point.col)) {
      const key = pointKey(row, col);
      if (!board[row][col]) liberties.add(key);
      else if (board[row][col] === color && !visited.has(key)) {
        visited.add(key);
        pending.push({ row, col });
      }
    }
  }
  return { stones, liberties };
}

function neighbors(size, row, col) {
  return [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]
    .filter(([nextRow, nextCol]) => inBounds(size, nextRow, nextCol));
}

function snapshot(state) {
  return {
    board: cloneBoard(state.board),
    turn: state.turn,
    captures: { ...state.captures },
    consecutivePasses: state.consecutivePasses,
    scoring: state.scoring,
    finished: state.finished,
    previousPositionKey: state.previousPositionKey,
    lastMove: state.lastMove ? { ...state.lastMove } : null,
    moves: state.moves.map(move => ({ ...move }))
  };
}

function restore(state, saved) {
  state.board = cloneBoard(saved.board);
  state.turn = saved.turn;
  state.captures = { ...saved.captures };
  state.consecutivePasses = saved.consecutivePasses;
  state.scoring = saved.scoring;
  state.finished = saved.finished;
  state.previousPositionKey = saved.previousPositionKey;
  state.lastMove = saved.lastMove ? { ...saved.lastMove } : null;
  state.moves = saved.moves.map(move => ({ ...move }));
}

function cloneBoard(board) {
  return board.map(row => [...row]);
}

function validateSize(size) {
  if (!BOARD_SIZES.includes(size)) throw new Error('棋盘尺寸必须是 9、13 或 19 路。');
}

function validateBoard(board, size) {
  if (!Array.isArray(board) || board.length !== size || board.some(row => (
    !Array.isArray(row) || row.length !== size || row.some(stone => stone !== null && stone !== BLACK && stone !== WHITE)
  ))) throw new Error('棋盘局面与棋盘尺寸不匹配。');
}