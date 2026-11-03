import { BLACK, WHITE, createEmptyBoard, createGame, getGroupInfo, playStone, undoMove } from '../core.mjs';

const boardElement = document.getElementById('shapeBoard');
const turnDot = document.getElementById('shapeTurnDot');
const turnText = document.getElementById('shapeTurnText');
const turnLabel = document.getElementById('shapeTurnLabel');
const counter = document.getElementById('shapeCounter');
const feedback = document.getElementById('shapeFeedback');
const title = document.getElementById('shapeTitle');
const intro = document.getElementById('shapeIntro');
const focus = document.getElementById('shapeFocus');
const task = document.getElementById('shapeTask');
const options = document.getElementById('shapeOptions');
const explanation = document.getElementById('shapeExplanation');
const progress = document.getElementById('shapeProgress');
const progressFill = document.getElementById('shapeProgressFill');
const blackCaptures = document.getElementById('shapeBlackCaptures');
const whiteCaptures = document.getElementById('shapeWhiteCaptures');
const undoButton = document.getElementById('shapeUndoButton');

const LESSONS = [
  {
    id: 'strings', title: '棋串结构', focus: '识别连接关系',
    intro: '同色棋子通过上下左右相邻连成一块，称为棋串。斜角相邻不是直接连接。',
    task: '点击棋盘上的黑棋或白棋，查看它属于哪一块棋串，以及整块棋串共有几口气。',
    explanation: '一块棋串可以包含多颗棋子；判断气时，要看整块棋串边界上的所有空点。',
    setup: () => createGame(9, { board: boardFrom([[4, 3, BLACK], [4, 4, BLACK], [3, 3, WHITE], [3, 4, WHITE], [4, 2, WHITE], [4, 5, WHITE], [6, 4, BLACK], [6, 5, BLACK], [7, 5, WHITE]]) })
  },
  {
    id: 'connect', title: '连接点', focus: '比较连接前后的棋串',
    intro: '两块棋之间如果留下一个空点，落子连接后可能合成同一块棋串。连接会改变棋串数量，也会合并它们的气。',
    task: '黑棋在 D5 与 F5 分开。试着在中间的 E5 落子，把两颗黑棋连成一块。',
    explanation: '先分别点击两颗黑棋，确认它们各自是一块；再落在 E5，检查连接后的棋串大小和气。',
    setup: () => createGame(9, { board: boardFrom([[4, 3, BLACK], [4, 5, BLACK]]), turn: BLACK })
  },
  {
    id: 'cut', title: '分断与断点', focus: '发现关键连接位置',
    intro: '两块棋之间的空点可能是连接点，也可能成为对手分断它们的关键位置。占住这个点，会阻止双方在此处直接连接。',
    task: '白方在 E5 落子，观察它如何占住黑棋 D5 与 F5 之间的连接点。',
    explanation: '局部是否已经连接，要按上下左右逐点判断；不能只凭棋子看起来靠得近就认为相连。',
    setup: () => createGame(9, { board: boardFrom([[4, 3, BLACK], [4, 5, BLACK]]), turn: WHITE })
  },
  {
    id: 'eye', title: '眼点与眼形', focus: '识别棋子围出的内部空间',
    intro: '一块棋串围住的内部空点可以形成眼点。眼形描述的是棋子与空点形成的局部结构。',
    task: '点击中央 E5 眼点，观察它的四个相邻交叉点。',
    explanation: '眼形是重要的棋形观察对象，但看到一个眼点并不能单独证明整块棋已经活棋；还要结合整块棋及周围条件判断。',
    setup: () => createGame(9, { board: eyeRing(), turn: BLACK })
  },
  {
    id: 'patterns', title: '直三与曲三', focus: '比较相同数量下的形状差异',
    intro: '相同数量的棋子可以排成不同形状。形状改变后，连接方向、外部空间和可利用的气也会变化。',
    task: '切换直三和曲三，点击棋子比较棋串大小与气。',
    explanation: '这里先练习描述形状和关系，不直接把某种形状判成活棋或死棋。',
    options: [{ id: 'line', label: '直三' }, { id: 'bend', label: '曲三' }],
    setup: variant => createGame(9, { board: variant === 'bend'
      ? boardFrom([[4, 3, BLACK], [4, 4, BLACK], [5, 4, BLACK]])
      : boardFrom([[4, 3, BLACK], [4, 4, BLACK], [4, 5, BLACK]]), turn: BLACK })
  },
  {
    id: 'observe', title: '综合观察', focus: '由形状推断连接与变化',
    intro: '观察棋子分布后，先区分已连接的棋串、尚未连接的棋块和可能被占据的连接点。',
    task: '分别点击两颗黑棋，确认它们属于不同棋串；然后尝试在 E5 连接，并观察棋串变化。',
    explanation: '准确描述“现在是什么形”，再推演“落一手后会变成什么”，是继续学习死活与手筋的基础。',
    setup: () => createGame(9, { board: boardFrom([[4, 3, BLACK], [4, 5, BLACK], [3, 4, WHITE], [6, 2, BLACK], [6, 3, BLACK], [7, 3, WHITE]]), turn: BLACK })
  }
];

let lesson = LESSONS[0];
let variant = 'line';
let game = lesson.setup(variant);
let selectedGroup = new Set();
let highlightedLiberties = new Set();
let highlightedEye = null;

for (const button of document.querySelectorAll('[data-shape-lesson]')) {
  button.addEventListener('click', () => selectLesson(button.dataset.shapeLesson));
}
options.addEventListener('click', event => {
  const button = event.target.closest('[data-variant]');
  if (!button) return;
  variant = button.dataset.variant;
  resetLesson();
});
undoButton.addEventListener('click', () => {
  if (!undoMove(game)) return;
  clearHighlights();
  render();
  showFeedback('已撤销上一步。');
});
document.getElementById('shapeResetButton').addEventListener('click', resetLesson);

function selectLesson(id) {
  const next = LESSONS.find(item => item.id === id);
  if (!next) return;
  lesson = next;
  variant = next.options?.[0]?.id || '';
  resetLesson();
}

function resetLesson() {
  game = lesson.setup(variant);
  clearHighlights();
  renderContent();
  render();
  showFeedback(initialFeedback());
}

function clearHighlights() {
  selectedGroup = new Set();
  highlightedLiberties = new Set();
  highlightedEye = null;
}

function renderContent() {
  const lessonIndex = LESSONS.indexOf(lesson);
  title.textContent = lesson.title;
  intro.textContent = lesson.intro;
  focus.textContent = lesson.focus;
  task.textContent = lesson.task;
  explanation.innerHTML = `<strong>棋形要点</strong><br>${lesson.explanation}`;
  counter.textContent = `${String(lessonIndex + 1).padStart(2, '0')} / ${String(LESSONS.length).padStart(2, '0')}`;
  progress.textContent = `第 ${lessonIndex + 1} 节 / 共 ${LESSONS.length} 节`;
  progressFill.style.width = `${((lessonIndex + 1) / LESSONS.length) * 100}%`;
  options.replaceChildren();
  for (const option of lesson.options || []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.variant = option.id;
    button.textContent = option.label;
    button.setAttribute('aria-pressed', String(option.id === variant));
    options.append(button);
  }
  document.querySelectorAll('[data-shape-lesson]').forEach(button => {
    button.classList.toggle('is-current', button.dataset.shapeLesson === lesson.id);
    button.setAttribute('aria-current', button.dataset.shapeLesson === lesson.id ? 'step' : 'false');
  });
}

function initialFeedback() {
  if (lesson.id === 'strings') return '点击任一棋子，查看它所在棋串的共同气。';
  if (lesson.id === 'connect') return '两块黑棋目前没有直接连接。';
  if (lesson.id === 'cut') return '两块黑棋之间留有断点。轮到白方观察并占点。';
  if (lesson.id === 'eye') return '点击中央空点 E5，检查它四周的棋子。';
  if (lesson.id === 'patterns') return '选择直三或曲三，再点击棋子进行观察。';
  return '分别点击两颗黑棋，先判断它们是否相连。';
}

function handlePoint(row, col) {
  if (game.finished) return;

  if (lesson.id === 'strings' || lesson.id === 'patterns' || (lesson.id === 'observe' && game.board[row][col])) {
    const info = getGroupInfo(game.board, row, col);
    if (!info.stones.length) {
      showFeedback('这个点没有棋子。请点击棋盘上的一颗棋子观察棋串。');
      return;
    }
    selectedGroup = new Set(info.stones.map(pointKey));
    highlightedLiberties = new Set(info.liberties.map(pointKey));
    render();
    showFeedback(`这是${colorName(game.board[row][col])}方一块棋串，含 ${info.stones.length} 颗棋子、共有 ${info.liberties.length} 口气。`);
    return;
  }

  if (lesson.id === 'eye') {
    if (row !== 4 || col !== 4) {
      showFeedback('请观察棋串围住的中央空点 E5。');
      return;
    }
    const neighbors = [[3, 4], [5, 4], [4, 3], [4, 5]];
    const isBlackEye = neighbors.every(([nextRow, nextCol]) => game.board[nextRow][nextCol] === BLACK);
    if (!isBlackEye) {
      showFeedback('此点的四个相邻位置还没有都被黑棋占住。');
      return;
    }
    highlightedEye = pointKey({ row, col });
    render();
    showFeedback('E5 四邻都是黑棋，是黑棋围出的眼点。眼形是局部结构，不单独证明整块棋活棋。', 'success');
    return;
  }

  const targetRow = 4;
  const targetCol = 4;
  if ((lesson.id === 'connect' || lesson.id === 'cut' || lesson.id === 'observe') && (row !== targetRow || col !== targetCol)) {
    showFeedback('本例的关键位置是两块棋之间的 E5。');
    return;
  }

  const movingColor = game.turn;
  if (!playStone(game, row, col)) {
    showFeedback('这手不合法。检查目标点是否已占用，以及落子后整块棋是否还有气。');
    return;
  }
  const leftGroup = lesson.id === 'connect' || lesson.id === 'observe' ? getGroupInfo(game.board, 4, 3) : null;
  const rightGroup = lesson.id === 'cut' ? getGroupInfo(game.board, 4, 3) : null;
  const otherGroup = lesson.id === 'cut' ? getGroupInfo(game.board, 4, 5) : null;
  render();

  if (lesson.id === 'connect' || lesson.id === 'observe') {
    showFeedback(`连接完成：原来分开的黑棋现在成为一块 ${leftGroup.stones.length} 子棋串，共有 ${leftGroup.liberties.length} 口气。`, 'success');
  } else if (lesson.id === 'cut') {
    showFeedback(`白棋占住 E5。黑棋两侧仍是两块棋串（${rightGroup.stones.length} 子与 ${otherGroup.stones.length} 子），连接点被分断。`, 'success');
  } else {
    showFeedback(`落子完成。现在轮到${colorName(game.turn)}方；观察直三或曲三周围的气。`);
  }
}

function render() {
  renderBoard();
  turnDot.className = `turn-dot ${game.turn === BLACK ? 'black-turn' : 'white-turn'}`;
  turnText.textContent = `${colorName(game.turn)}方行棋`;
  turnLabel.textContent = `${colorName(game.turn)}方行棋`;
  blackCaptures.textContent = game.captures[BLACK];
  whiteCaptures.textContent = game.captures[WHITE];
  undoButton.disabled = game.history.length === 0;
}

function renderBoard() {
  boardElement.replaceChildren();
  boardElement.style.setProperty('--size', game.size);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('go-grid');
  svg.setAttribute('viewBox', '0 0 1000 1000');
  svg.setAttribute('aria-hidden', 'true');
  const margin = 40;
  const step = (1000 - margin * 2) / (game.size - 1);
  for (let index = 0; index < game.size; index += 1) {
    const offset = margin + index * step;
    addLine(svg, margin, offset, 1000 - margin, offset);
    addLine(svg, offset, margin, offset, 1000 - margin);
  }
  for (const point of [2, 4, 6]) {
    const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    star.setAttribute('cx', margin + point * step);
    star.setAttribute('cy', margin + point * step);
    star.setAttribute('r', '8');
    star.setAttribute('fill', '#3d3324');
    svg.append(star);
  }
  boardElement.append(svg);
  for (let col = 0; col < game.size; col += 1) addCoordinate(coordinateName(col), `${4 + (92 * col / (game.size - 1))}%`, '1.2%', 'file-coordinate');
  for (let row = 0; row < game.size; row += 1) addCoordinate(String(game.size - row), '1.2%', `${4 + (92 * row / (game.size - 1))}%`, 'rank-coordinate');

  for (let row = 0; row < game.size; row += 1) {
    for (let col = 0; col < game.size; col += 1) {
      const key = `${row},${col}`;
      const stone = game.board[row][col];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'intersection lesson-intersection';
      button.style.left = `${4 + (92 * col / (game.size - 1))}%`;
      button.style.top = `${4 + (92 * row / (game.size - 1))}%`;
      button.setAttribute('aria-label', `${coordinateName(col)} ${game.size - row}${stone ? `，${colorName(stone)}棋` : '，空位'}`);
      if (selectedGroup.has(key)) button.classList.add('group-selected');
      button.disabled = false;
      button.addEventListener('click', () => handlePoint(row, col));
      if (stone) {
        const stoneElement = document.createElement('span');
        stoneElement.className = `stone ${stone === BLACK ? 'black-stone' : 'white-stone'}`;
        button.append(stoneElement);
      }
      if (highlightedLiberties.has(key) && !stone) {
        const marker = document.createElement('span');
        marker.className = 'liberty-mark';
        button.append(marker);
      }
      if (highlightedEye === key) {
        const marker = document.createElement('span');
        marker.className = 'eye-mark';
        marker.textContent = '眼';
        button.append(marker);
      }
      boardElement.append(button);
    }
  }
}

function addCoordinate(text, left, top, className) {
  const label = document.createElement('span');
  label.className = `board-coordinate ${className}`;
  label.textContent = text;
  label.style.left = left;
  label.style.top = top;
  label.setAttribute('aria-hidden', 'true');
  boardElement.append(label);
}

function addLine(svg, x1, y1, x2, y2) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', '#59492f');
  line.setAttribute('stroke-width', '2.2');
  svg.append(line);
}

function showFeedback(text, state = '') {
  feedback.textContent = text;
  feedback.className = `rule-note${state ? ` ${state}` : ''}`;
}

function pointKey(point) {
  return `${point.row},${point.col}`;
}

function coordinateName(col) {
  return String.fromCharCode(65 + col + (col >= 8 ? 1 : 0));
}

function colorName(color) {
  return color === BLACK ? '黑' : '白';
}

function boardFrom(stones) {
  const board = createEmptyBoard(9);
  for (const [row, col, color] of stones) board[row][col] = color;
  return board;
}

function eyeRing() {
  const stones = [];
  for (let row = 3; row <= 5; row += 1) {
    for (let col = 3; col <= 5; col += 1) {
      if (row !== 4 || col !== 4) stones.push([row, col, BLACK]);
    }
  }
  return boardFrom(stones);
}

resetLesson();
