import {
  RED,
  createEmptyBoard,
  createGame,
  getLegalMoves,
  getPieceLabel,
  makeMove
} from '../../core.mjs';
import {
  appendStandardPositionMark,
  createStandardPieceElement,
  createStandardBoardArtwork,
  isCannonStartPosition,
  isPawnStartPosition,
  placeStandardIntersection
} from '../../board-standard.mjs';
import { applyBoardStyle, onBoardStyleChange } from '../../board-style.mjs';

applyBoardStyle();
onBoardStyleChange(() => {});

const PIECE_DEMOS = [
  { type: 'K', label: '将帅', description: '将帅在九宫内沿横线或竖线走一格。' },
  { type: 'A', label: '士仕', description: '士仕在九宫内沿斜线走一格。' },
  { type: 'E', label: '象相', description: '象相走田字，不可过河，象眼不能受阻。' },
  { type: 'R', label: '车', description: '车沿横线或竖线走，路径不可有棋子阻挡。' },
  { type: 'H', label: '马', description: '马走日字，靠近方向的马腿被挡时不能走。' },
  { type: 'C', label: '炮', description: '炮不吃子时直线行走；吃子时必须隔一个炮架。' },
  { type: 'P', label: '兵卒', description: '兵卒只能前进；过河后可以横走，不能后退。' }
];

const VIEW_DEMOS = {
  observation: [
    { key: 'red', label: '红方棋子', message: '红方棋子用红色字样表示。双方各有 16 枚棋子。' },
    { key: 'black', label: '黑方棋子', message: '黑方棋子用深色字样表示。' },
    { key: 'border', label: '棋盘边框', message: '棋盘最外圈的交叉点构成边界。' },
    { key: 'river', label: '楚河汉界', message: '楚河汉界横贯棋盘中央，分隔红黑两方。' },
    { key: 'palace', label: '九宫', message: '双方九宫位于各自底线中央，共 9 个交叉点。' }
  ],
  pieces: PIECE_DEMOS.map(item => ({
    key: `piece-${item.type}`,
    label: item.label,
    message: `${item.label}：${pieceCount(item.type)} 枚（红黑双方合计）。`
  })),
  summary: [
    { key: 'red', label: '红黑双方', message: '象棋由红黑双方对弈。' },
    { key: 'river', label: '楚河汉界', message: '楚河汉界分隔棋盘两侧。' },
    { key: 'palace', label: '九宫', message: '将帅和士仕受九宫范围约束。' },
    { key: 'pawns', label: '初始兵线', message: '双方各有五枚兵卒，位于本方前线。' }
  ]
};

const elements = {
  section: document.getElementById('lessonDemo'),
  frame: document.querySelector('.lesson-board-frame'),
  title: document.getElementById('demoTitle'),
  kind: document.getElementById('demoKind'),
  controls: document.getElementById('demoControls'),
  board: document.getElementById('lessonBoard'),
  instruction: document.getElementById('demoInstruction'),
  reset: document.getElementById('demoReset')
};

let game = createGame();
let mode = '';
let activeEffect = null;
let activeDemo = null;
let activePiece = null;
let legalTargets = [];

export function initLessonDemo(lessonId) {
  if (!elements.section || (!VIEW_DEMOS[lessonId] && lessonId !== 'piece_moves')) return;

  mode = lessonId;
  elements.section.hidden = false;
  elements.title.textContent = lessonId === 'piece_moves' ? '棋子走法' : lessonId === 'pieces' ? '认识棋子' : lessonId === 'summary' ? '知识回顾' : '棋盘观察';
  elements.kind.textContent = lessonId === 'piece_moves' ? '选择棋子查看合法落点' : '点击主题查看棋盘位置';
  elements.controls.replaceChildren();
  elements.reset.hidden = lessonId !== 'piece_moves';
  elements.reset.addEventListener('click', resetPieceDemo);

  if (lessonId === 'piece_moves') {
    for (const demo of PIECE_DEMOS) addControl(demo.label, () => startPieceDemo(demo), demo.type === 'K');
    resetPieceDemo();
    return;
  }
  for (const [index, demo] of VIEW_DEMOS[lessonId].entries()) {
    addControl(demo.label, () => showBoardFeature(demo), index === 0);
  }
  showBoardFeature(VIEW_DEMOS[lessonId][0]);
}

function addControl(label, callback, active = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `demo-control${active ? ' active' : ''}`;
  button.textContent = label;
  button.setAttribute('aria-pressed', String(active));
  button.addEventListener('click', () => {
    elements.controls.querySelectorAll('.demo-control').forEach(item => {
      item.classList.remove('active');
      item.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    callback();
  });
  elements.controls.append(button);
}

function showBoardFeature(effect) {
  activeEffect = effect.key;
  activeDemo = null;
  activePiece = null;
  legalTargets = [];
  game = createGame();
  elements.reset.hidden = true;
  elements.instruction.textContent = effect.message;
  renderBoard();
}

function resetPieceDemo() {
  startPieceDemo(activeDemo || PIECE_DEMOS[0]);
}

function startPieceDemo(demo) {
  mode = 'piece_moves';
  activeDemo = demo;
  activeEffect = null;
  game = createGame({ board: createPracticeBoard(demo.type), turn: RED });
  activePiece = findDemoPiece(demo.type);
  legalTargets = getLegalMoves(game, activePiece);
  elements.reset.hidden = false;
  elements.instruction.textContent = `${demo.description} 高亮位置为该棋子的合法落点，可点击其中一处亲自移动。`;
  renderBoard();
}

function handleSquareClick(position) {
  if (mode !== 'piece_moves' || !activePiece) return;
  if (legalTargets.some(target => sameSquare(target, position))) {
    makeMove(game, activePiece, position);
    activePiece = null;
    legalTargets = [];
    elements.instruction.textContent = '走法正确。选择上方棋子可查看另一种走法。';
    renderBoard();
    return;
  }

  const piece = game.board[position.row][position.col];
  if (piece && piece === piece.toUpperCase() && piece.toUpperCase() === activeDemo.type) {
    activePiece = position;
    legalTargets = getLegalMoves(game, position);
    renderBoard();
    return;
  }
  elements.instruction.textContent = '请点击高亮的合法落点。';
}

function renderBoard() {
  elements.board.replaceChildren();
  elements.frame.dataset.feature = activeEffect || '';
  elements.board.append(createStandardBoardArtwork('xiangqi-grid-svg'));
  const targetKeys = new Set(legalTargets.map(squareKey));
  const highlighted = new Set(effectSquares(activeEffect));

  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const position = { row, col };
      const piece = game.board[row][col];
      const square = document.createElement('button');
      square.type = 'button';
      square.className = `lesson-square xiangqi-intersection${highlighted.has(squareKey(position)) ? ' feature-highlight' : ''}`;
      placeStandardIntersection(square, row, col);
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 列` : `空位，第 ${row + 1} 行第 ${col + 1} 列`);
      if (activeEffect === 'red' && piece && piece === piece.toUpperCase()) square.classList.add('feature-piece');
      if (activeEffect === 'black' && piece && piece === piece.toLowerCase()) square.classList.add('feature-piece');
      if (activeEffect?.startsWith('piece-') && piece?.toUpperCase() === activeEffect.slice(6)) square.classList.add('feature-piece');
      if (activePiece && sameSquare(activePiece, position)) square.classList.add('demo-selected');
      if (targetKeys.has(squareKey(position))) square.classList.add(piece ? 'demo-capture-target' : 'demo-move-target');
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');

      if (piece) {
        const chip = createStandardPieceElement(piece, getPieceLabel(piece), `lesson-demo-piece${square.classList.contains('feature-piece') ? ' piece-emphasis' : ''}`);
        square.append(chip);
      }
      square.disabled = mode !== 'piece_moves';
      square.addEventListener('click', () => handleSquareClick(position));
      elements.board.append(square);
    }
  }
}

function createPracticeBoard(type) {
  const board = createEmptyBoard();
  board[type === 'K' ? 8 : 9][4] = 'K';
  board[0][3] = 'k';
  const placements = {
    K: [], A: [[9, 3, 'A']], E: [[8, 2, 'E']], H: [[5, 4, 'H']],
    R: [[5, 0, 'R']], C: [[5, 0, 'C'], [5, 2, 'P'], [5, 5, 'p']], P: [[5, 4, 'P']]
  };
  for (const [row, col, piece] of placements[type]) board[row][col] = piece;
  return board;
}

function findDemoPiece(type) {
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (game.board[row][col] === type) return { row, col };
    }
  }
  return null;
}

function effectSquares(effect) {
  const squares = [];
  if (effect === 'border') {
    for (let row = 0; row < 10; row += 1) for (let col = 0; col < 9; col += 1) if (row === 0 || row === 9 || col === 0 || col === 8) squares.push({ row, col });
  } else if (effect === 'river') {
    for (let col = 0; col < 9; col += 1) squares.push({ row: 4, col }, { row: 5, col });
  } else if (effect === 'palace' || effect === 'diagonal') {
    for (let row = 0; row < 10; row += 1) for (let col = 3; col <= 5; col += 1) if ((row <= 2 || row >= 7) && (effect !== 'diagonal' || isPalaceDiagonal(row, col))) squares.push({ row, col });
  } else if (effect === 'cannons') {
    [[2, 1], [2, 7], [7, 1], [7, 7]].forEach(([row, col]) => squares.push({ row, col }));
  } else if (effect === 'pawns') {
    for (const col of [0, 2, 4, 6, 8]) squares.push({ row: 3, col }, { row: 6, col });
  }
  return squares.map(squareKey);
}

function isPalaceDiagonal(row, col) {
  return ((row === 0 || row === 2 || row === 7 || row === 9) && (col === 3 || col === 5))
    || (row === 1 && col === 4) || (row === 8 && col === 4);
}

function pieceCount(type) {
  return type === 'K' ? 2 : type === 'P' ? 10 : 4;
}

function squareKey(square) {
  return `${square.row},${square.col}`;
}

function sameSquare(first, second) {
  return first.row === second.row && first.col === second.col;
}
