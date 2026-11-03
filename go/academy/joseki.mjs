import { BLACK, WHITE, createEmptyBoard, createGame, getGroupInfo, playStone, undoMove } from '../core.mjs';

const boardElement = document.getElementById('josekiBoard');
const turnDot = document.getElementById('josekiTurnDot');
const turnText = document.getElementById('josekiTurnText');
const stateLabel = document.getElementById('josekiStateLabel');
const counter = document.getElementById('josekiCounter');
const feedback = document.getElementById('josekiFeedback');
const title = document.getElementById('josekiTitle');
const intro = document.getElementById('josekiIntro');
const focus = document.getElementById('josekiFocus');
const task = document.getElementById('josekiTask');
const options = document.getElementById('josekiOptions');
const explanation = document.getElementById('josekiExplanation');
const progress = document.getElementById('josekiProgress');
const progressFill = document.getElementById('josekiProgressFill');
const blackCaptures = document.getElementById('josekiBlackCaptures');
const whiteCaptures = document.getElementById('josekiWhiteCaptures');
const undoButton = document.getElementById('josekiUndoButton');

const MAIN_LINE = [
  [WHITE, 6, 2], [BLACK, 6, 3], [WHITE, 5, 2], [BLACK, 4, 2],
  [WHITE, 4, 1], [BLACK, 3, 2], [WHITE, 3, 1], [BLACK, 2, 2]
];

const DOUBLE_HANE_LINE = [
  [BLACK, 3, 1], [WHITE, 3, 2], [BLACK, 4, 3], [WHITE, 2, 1],
  [BLACK, 5, 1], [WHITE, 3, 0], [BLACK, 6, 1]
];

const LESSONS = [
  {
    id: 'invasion', title: '三三侵入', focus: '理解角地与外势的交换',
    intro: '在星位附近的三三点侵入，目标是活在角上并取得角地；外围一方通常会围出外势。',
    task: '白方行棋。在黑棋 D4 的内侧三三点 C3 落子，观察黑棋如何选择挡向。',
    explanation: '这是常见的角部定式起点。侵入成功不表示白方全盘占优，黑方获得的外势也需要结合周围棋子判断。',
    setup: () => createGame(9, { board: boardFrom([[5, 3, BLACK]]), turn: WHITE }),
    target: [6, 2],
    success: '白棋进入 C3。局部开始争夺：白方争角地，黑方可围绕外侧构筑势力。'
  },
  {
    id: 'block', title: '挡向选择', focus: '从较宽一侧考虑外势效率',
    intro: '三三侵入后，黑棋可以从不同方向挡。通常要结合外围空旷方向，考虑哪一侧的外势更有用。',
    task: '分别试试 D3 与 C4 两种合法挡法。比较挡向改变后，外侧的棋形方向。',
    explanation: '挡向没有脱离全盘背景的唯一答案。外侧有己方棋时，重复筑势可能效率较低；对方有支援时也要重新判断。',
    setup: () => createGame(9, { board: boardFrom([[5, 3, BLACK], [6, 2, WHITE]]), turn: BLACK }),
    branches: [
      { id: 'main', label: '黑挡 D3', move: [6, 3], note: '黑棋从主线一侧挡住，后续白棋可在 C4 争取角部空间。' },
      { id: 'other', label: '黑挡 C4', move: [5, 2], note: '黑棋改从另一侧挡，外势方向随之改变；要看哪侧更宽、更有支援。' }
    ]
  },
  {
    id: 'main', title: '标准主线', focus: '按次序观察角部如何定型',
    intro: '这条入门主线展示白棋取得角部、黑棋形成外侧厚势的基本交换。定式记的是双方合理次序，不是脱离全盘照抄。',
    task: '按提示交替完成 8 手主线：白 C3、黑 D3、白 C4、黑 C5、白 B5、黑 C6、白 B6、黑 C7。',
    explanation: '这条公开棋谱中的主线以黑方外势、白方角地告一段落。双方所得不同，外围配置会改变局部价值。',
    setup: () => createGame(9, { board: boardFrom([[5, 3, BLACK]]) }),
    sequence: MAIN_LINE,
    finish: '主线完成：黑方获得外围厚势，白方取得角部空间。双方都有所得，不能只数局部落子判断全盘优劣。'
  },
  {
    id: 'double-hane', title: '双扳分支', focus: '观察守角与弃子的变化',
    intro: '黑棋也可以用双扳变化回应。白棋有机会提掉其中一颗黑子，黑方则继续紧逼角部棋形。',
    task: '从主线前五手后的局面开始，按顺序完成黑 B6、白 C6、黑 D5、白 B7、黑 B4、白 A6、黑 B3。',
    explanation: '本例展示公开图谱中的一条双扳变化。白方实际提掉黑 1 子；黑 B3 后角部白棋只剩一气，说明变化仍需继续计算，不能把此刻称作已定胜负。',
    setup: () => createGame(9, { board: boardFrom([
      [5, 3, BLACK], [6, 2, WHITE], [6, 3, BLACK], [5, 2, WHITE], [4, 2, BLACK], [4, 1, WHITE]
    ]) }),
    sequence: DOUBLE_HANE_LINE,
    finish: '双扳变化走到本例终点：白方提黑 1 子；黑方在 B3 继续紧气，角部攻防尚需后续计算。'
  },
  {
    id: 'compare', title: '结果比较', focus: '同时衡量角地、外势与先手',
    intro: '定式结果不能只看角上吃到多少子。角地、外势、先手、周围已有棋子都会改变交换的价值。',
    task: '选择比较两条局部变化时更完整的思路。',
    explanation: '判断局部平衡时，要把双方所得放回全盘：黑方外势是否有用，白方角地是否安定，以及谁先在别处行棋。',
    options: [
      { id: 'count-corner', label: '只看谁得到角地' },
      { id: 'compare-whole', label: '比较角地、外势与先手' }
    ],
    answer: 'compare-whole',
    setup: () => createGame(9, { board: boardFrom([[5, 3, BLACK], [6, 2, WHITE]]) }),
    outcome: 'concept'
  },
  {
    id: 'review', title: '综合复盘', focus: '记变化，更要理解适用条件',
    intro: '对手偏离定式时，不必强行把棋下回谱上；先检查连接、气、断点和全盘方向，再选择应手。',
    task: '定式被对方改变次序时，选择更稳妥的应对原则。',
    explanation: '定式是双方局部合理着法的参考，不是必须完成的固定棋谱。变化未结束时，也不要过早认定一方获胜。',
    options: [
      { id: 'follow-book', label: '不管对方怎么下，都继续背谱' },
      { id: 'read-board', label: '回到棋盘，重新判断棋形与方向' }
    ],
    answer: 'read-board',
    setup: () => createGame(9)
  }
];

let lesson = LESSONS[0];
let game = lesson.setup();
let answered = false;
let completed = false;
let highlightedStones = new Set();

document.querySelectorAll('[data-joseki-lesson]').forEach(button => {
  button.addEventListener('click', () => selectLesson(button.dataset.josekiLesson));
});
options.addEventListener('click', event => {
  const branch = event.target.closest('[data-variation]');
  if (branch) {
    playBranch(branch.dataset.variation);
    return;
  }
  const button = event.target.closest('[data-answer]');
  if (!button || answered) return;
  const correct = button.dataset.answer === lesson.answer;
  button.classList.add(correct ? 'answer-correct' : 'answer-wrong');
  if (!correct) {
    showFeedback('再想一想：定式关注局部交换，也要看变化是否结束及全盘配置。');
    return;
  }
  answered = true;
  completed = true;
  options.querySelectorAll('[data-answer]').forEach(option => { option.disabled = true; });
  render();
  showFeedback('判断正确。定式提供参考次序，落子仍要服从当前棋盘。', 'success');
});
undoButton.addEventListener('click', () => {
  if (!undoMove(game)) return;
  completed = false;
  highlightedStones = new Set();
  render();
  showFeedback('已撤销上一步。');
});
document.getElementById('josekiResetButton').addEventListener('click', resetLesson);

function selectLesson(id) {
  const next = LESSONS.find(item => item.id === id);
  if (!next) return;
  lesson = next;
  resetLesson();
}

function resetLesson() {
  game = lesson.setup();
  answered = false;
  completed = false;
  highlightedStones = new Set();
  renderContent();
  render();
  showFeedback(startMessage());
}

function renderContent() {
  const index = LESSONS.indexOf(lesson);
  title.textContent = lesson.title;
  intro.textContent = lesson.intro;
  focus.textContent = lesson.focus;
  task.textContent = lesson.task;
  explanation.innerHTML = `<strong>定式要点</strong><br>${lesson.explanation}`;
  counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(LESSONS.length).padStart(2, '0')}`;
  progress.textContent = `第 ${index + 1} 节 / 共 ${LESSONS.length} 节`;
  progressFill.style.width = `${((index + 1) / LESSONS.length) * 100}%`;
  options.replaceChildren();
  for (const branch of lesson.branches || []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.variation = branch.id;
    button.textContent = branch.label;
    options.append(button);
  }
  for (const option of lesson.options || []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.answer = option.id;
    button.textContent = option.label;
    options.append(button);
  }
  document.querySelectorAll('[data-joseki-lesson]').forEach(button => {
    const current = button.dataset.josekiLesson === lesson.id;
    button.classList.toggle('is-current', current);
    button.setAttribute('aria-current', current ? 'step' : 'false');
  });
}

function startMessage() {
  if (lesson.id === 'invasion') return '白方行棋：在 C3 三三点侵入。';
  if (lesson.id === 'block') return '选择黑棋的挡向，落子后再观察外势方向。';
  if (lesson.id === 'main') return '白方先行：依次完成主线 8 手。';
  if (lesson.id === 'double-hane') return '黑方先行：从第五手后的局面进入双扳分支。';
  if (lesson.id === 'compare') return '先比较两条变化各自的所得。';
  return '选择定式被打乱后的应对原则。';
}

function handlePoint(row, col) {
  if (completed) {
    showFeedback('本节已完成。可以悔棋重做，或切换到另一条变化。', 'success');
    return;
  }
  if (lesson.answer && !answered) {
    showFeedback('先选择判断，再继续观察棋盘。');
    return;
  }
  if (lesson.sequence) {
    handleSequenceMove(row, col);
    return;
  }
  if (!lesson.target) {
    showFeedback('本节先比较变化说明或选择分支。');
    return;
  }
  const [targetRow, targetCol] = lesson.target;
  if (row !== targetRow || col !== targetCol) {
    showFeedback(`本手目标是 ${coordinateName(targetCol)}${game.size - targetRow}，观察它与角部黑棋的相对位置。`);
    return;
  }
  if (!playStone(game, row, col)) {
    showFeedback('这手不合法。检查目标点是否空着，以及落子后棋串是否有气。');
    return;
  }
  completed = true;
  highlightedStones = new Set([pointKey({ row, col })]);
  render();
  showFeedback(lesson.success, 'success');
}

function playBranch(branchId) {
  if (completed) return;
  const branch = lesson.branches.find(item => item.id === branchId);
  if (!branch) return;
  const [row, col] = branch.move;
  if (!playStone(game, row, col)) {
    showFeedback('这手在当前局面不合法，请重置本节后再试。');
    return;
  }
  completed = true;
  highlightedStones = new Set([pointKey({ row, col })]);
  render();
  showFeedback(branch.note, 'success');
}

function handleSequenceMove(row, col) {
  const index = game.moves.length;
  const move = lesson.sequence[index];
  if (!move) {
    completed = true;
    render();
    showFeedback(lesson.finish, 'success');
    return;
  }
  const [color, targetRow, targetCol] = move;
  if (row !== targetRow || col !== targetCol) {
    showFeedback(`${colorName(color)}方第 ${index + 1} 手在 ${coordinateName(targetCol)}${game.size - targetRow}。`);
    return;
  }
  if (!playStone(game, row, col)) {
    showFeedback('这手在当前局面不合法。请重置本节检查变化次序。');
    return;
  }
  highlightedStones = new Set([pointKey({ row, col })]);
  render();
  if (index === lesson.sequence.length - 1) {
    completed = true;
    if (lesson.id === 'double-hane') {
      const cornerGroup = getGroupInfo(game.board, 6, 2);
      showFeedback(`${lesson.finish} 当前角部白棋有 ${cornerGroup.liberties.length} 口气。`, 'success');
    } else {
      showFeedback(lesson.finish, 'success');
    }
    return;
  }
  const next = lesson.sequence[index + 1];
  showFeedback(`第 ${index + 1} / ${lesson.sequence.length} 手完成。接下来${colorName(next[0])}方行棋。`);
}

function render() {
  renderBoard();
  turnDot.className = `turn-dot ${game.turn === BLACK ? 'black-turn' : 'white-turn'}`;
  turnText.textContent = `${colorName(game.turn)}方行棋`;
  stateLabel.textContent = completed ? '本节完成' : lesson.sequence ? `第 ${game.moves.length + 1} 手` : '观察角部';
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
      if (highlightedStones.has(key)) button.classList.add('joseki-last-move');
      button.addEventListener('click', () => handlePoint(row, col));
      if (stone) {
        const stoneElement = document.createElement('span');
        stoneElement.className = `stone ${stone === BLACK ? 'black-stone' : 'white-stone'}`;
        button.append(stoneElement);
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

function boardFrom(stones) {
  const board = createEmptyBoard(9);
  for (const [row, col, color] of stones) board[row][col] = color;
  return board;
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

resetLesson();