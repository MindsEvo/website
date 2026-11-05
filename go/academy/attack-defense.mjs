import { BLACK, WHITE, createEmptyBoard, createGame, getGroupInfo, playStone, undoMove } from '../core.mjs';

const boardElement = document.getElementById('adBoard');
const turnDot = document.getElementById('adTurnDot');
const turnText = document.getElementById('adTurnText');
const stateLabel = document.getElementById('adStateLabel');
const counter = document.getElementById('adCounter');
const feedback = document.getElementById('adFeedback');
const title = document.getElementById('adTitle');
const intro = document.getElementById('adIntro');
const focus = document.getElementById('adFocus');
const task = document.getElementById('adTask');
const options = document.getElementById('adOptions');
const explanation = document.getElementById('adExplanation');
const progress = document.getElementById('adProgress');
const progressFill = document.getElementById('adProgressFill');
const blackCaptures = document.getElementById('adBlackCaptures');
const whiteCaptures = document.getElementById('adWhiteCaptures');
const undoButton = document.getElementById('adUndoButton');

const LESSONS = [
  {
    id: 'attack', title: '攻击弱棋', focus: '先找到对方棋块的气',
    intro: '攻击从准确识别目标开始。使对方棋块只剩一口气，可以迫使对方应手，但不等于已经提子。',
    task: '黑方行棋。找到让 E5 白棋只剩一口气的着点。',
    explanation: '落子后查看白棋整块棋的气。攻击方还需判断对手能否逃跑、连接或反击。',
    setup: () => createGame(9, { board: boardFrom([[4, 4, WHITE], [3, 4, BLACK], [4, 5, BLACK]]) }),
    target: [5, 4], group: [4, 4], outcome: 'atari'
  },
  {
    id: 'escape', title: '逃跑延气', focus: '利用最后一气向外延伸',
    intro: '棋块被打吃时，可以尝试向外延伸，扩大共同气，争取逃跑空间。逃出后仍要检查周围是否安全。',
    task: '白方行棋。E5 白棋只剩 D5 一口气；在 D5 延伸，观察棋块的气如何变化。',
    explanation: '本题只验证局部逃跑后气数增加，不代表棋块已彻底安全。继续跑棋可能被追、被封锁或需要连接。',
    setup: () => createGame(9, { board: boardFrom([[4, 4, WHITE], [3, 4, BLACK], [4, 5, BLACK], [5, 4, BLACK]]), turn: WHITE }),
    target: [4, 3], group: [4, 3], outcome: 'escape'
  },
  {
    id: 'connect', title: '连接防守', focus: '与有根的棋块连成一体',
    intro: '防守不一定是继续逃跑。若附近有己方支援棋，抢占连接点可能让薄弱棋块合并并获得更多气。',
    task: '白方行棋。E5 白棋仅有 D5 一口气；在 D5 连向 C5 的白棋。',
    explanation: '连接后，支援棋的共同气也成为整块棋的气。连接不自动等于安全，还要观察对手能否继续攻击。',
    setup: () => createGame(9, { board: boardFrom([
      [4, 4, WHITE], [4, 2, WHITE], [3, 4, BLACK], [4, 5, BLACK], [5, 4, BLACK]
    ]), turn: WHITE }),
    target: [4, 3], group: [4, 4], outcome: 'connect'
  },
  {
    id: 'seal', title: '封锁出口', focus: '判断追击方向与逃跑路线',
    intro: '攻击时，直接紧气并非唯一办法。靠边的棋块逃跑方向有限，封住关键出口可以压缩它的活动空间。',
    task: '黑方行棋。白棋 E9 沿边有两个出口；黑棋在 F9 落子后，检查白棋还剩几口气。',
    explanation: '封住一个出口只说明局部空间减少。对方可能从另一方向逃跑或反击，不能把“被封住”直接判成死棋。',
    setup: () => createGame(9, { board: boardFrom([[0, 4, WHITE], [0, 3, BLACK]]) }),
    target: [0, 5], group: [0, 4], outcome: 'atari'
  },
  {
    id: 'sacrifice', title: '弃子取舍', focus: '比较棋子价值与全局补偿',
    intro: '受到攻击的棋块不一定要不惜代价救回。判断能否弃子，要比较棋块大小、全局收益、先手与后续安定程度。',
    task: '黑棋一子处于紧气局面。选择弃子决策前最重要的判断依据。',
    explanation: '本题考的是分析框架，不存在脱离全局的固定答案；棋盘只展示被攻击的局部，规则核心不替你计算全局价值。',
    options: [
      { id: 'save-all', label: '所有棋子都必须救回' },
      { id: 'compare', label: '比较损失与全局补偿' }
    ],
    answer: 'compare',
    setup: () => createGame(9, { board: boardFrom([[4, 4, BLACK], [3, 4, WHITE], [4, 5, WHITE], [5, 4, WHITE]]) }),
    group: [4, 4], outcome: 'concept'
  },
  {
    id: 'review', title: '综合攻防', focus: '先读气，再选择攻守方向',
    intro: '攻击方要看目标的逃跑路线，防守方要找延气或连接手段。局部计算之后，再评估整盘的轻重缓急。',
    task: '黑方行棋。先选择合理的局部判断，再落子使白棋 E5 进入一气状态。',
    explanation: '一气是可验证的局部结果，不等同于最终提子。真实攻防还要继续计算对方应手和全局补偿。',
    options: [
      { id: 'certain-capture', label: '一气就代表已经提子' },
      { id: 'force-response', label: '先制造应手，再算后续' }
    ],
    answer: 'force-response',
    setup: () => createGame(9, { board: boardFrom([[4, 4, WHITE], [3, 4, BLACK], [4, 5, BLACK]]) }),
    target: [5, 4], group: [4, 4], outcome: 'atari'
  }
];

let lesson = LESSONS[0];
let game = lesson.setup();
let highlightedStones = new Set();
let answered = false;
let completed = false;

document.querySelectorAll('[data-ad-lesson]').forEach(button => {
  button.addEventListener('click', () => selectLesson(button.dataset.adLesson));
});
options.addEventListener('click', event => {
  const button = event.target.closest('[data-answer]');
  if (!button || answered) return;
  const correct = button.dataset.answer === lesson.answer;
  button.classList.add(correct ? 'answer-correct' : 'answer-wrong');
  if (!correct) {
    showFeedback('这个判断不够周全，再考虑棋块价值与双方后续。');
    return;
  }
  answered = true;
  options.querySelectorAll('[data-answer]').forEach(option => { option.disabled = true; });
  if (lesson.outcome === 'concept') {
    completed = true;
    highlightedStones = new Set(getGroupInfo(game.board, ...lesson.group).stones.map(pointKey));
    render();
    showFeedback('判断正确。是否弃子还要结合全局得失，本例不替你预设答案。', 'success');
  } else {
    showFeedback('判断正确。现在在棋盘上完成这手局部攻防。', 'success');
  }
});
undoButton.addEventListener('click', () => {
  if (!undoMove(game)) return;
  completed = false;
  highlightedStones = new Set();
  render();
  showFeedback('已撤销上一步。');
});
document.getElementById('adResetButton').addEventListener('click', resetLesson);

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
  explanation.innerHTML = `<strong>攻防要点</strong><br>${lesson.explanation}`;
  counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(LESSONS.length).padStart(2, '0')}`;
  progress.textContent = `第 ${index + 1} 节 / 共 ${LESSONS.length} 节`;
  progressFill.style.width = `${((index + 1) / LESSONS.length) * 100}%`;
  options.replaceChildren();
  for (const option of lesson.options || []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.answer = option.id;
    button.textContent = option.label;
    options.append(button);
  }
  document.querySelectorAll('[data-ad-lesson]').forEach(button => {
    const current = button.dataset.adLesson === lesson.id;
    button.classList.toggle('is-current', current);
    button.setAttribute('aria-current', current ? 'step' : 'false');
  });
}

function startMessage() {
  if (lesson.id === 'attack') return '黑方行棋：找出紧气的落点。';
  if (lesson.id === 'escape') return '白方行棋：从最后一气向外延伸。';
  if (lesson.id === 'connect') return '白方行棋：连接 E5 与 C5 的白棋。';
  if (lesson.id === 'seal') return '黑方行棋：观察白棋沿边的出口。';
  if (lesson.id === 'sacrifice') return '先判断弃子时需要比较什么。';
  return '先选出合理的攻防判断，再在棋盘上验证。';
}

function handlePoint(row, col) {
  if (completed) {
    showFeedback('本题已完成。可以悔棋重做，或切换到下一节。', 'success');
    return;
  }
  if (lesson.answer && !answered) {
    showFeedback('先选择判断，再到棋盘上验证。');
    return;
  }
  const [targetRow, targetCol] = lesson.target || [];
  if (row !== targetRow || col !== targetCol) {
    showFeedback(`本题关键点是 ${coordinateName(targetCol)}${game.size - targetRow}，先观察落子后的攻守变化。`);
    return;
  }
  if (!playStone(game, row, col)) {
    showFeedback('这手不合法。检查目标点是否空着，以及落子后整块棋是否还有气。');
    return;
  }

  const info = getGroupInfo(game.board, ...lesson.group);
  highlightedStones = new Set(info.stones.map(pointKey));
  completed = true;
  render();
  if (lesson.outcome === 'escape') {
    showFeedback(`逃跑成功：白棋连成 ${info.stones.length} 子棋串，共有 ${info.liberties.length} 口气。仍需继续观察周围威胁。`, 'success');
  } else if (lesson.outcome === 'connect') {
    showFeedback(`连接完成：白棋合成 ${info.stones.length} 子棋串，共有 ${info.liberties.length} 口气。`, 'success');
  } else if (lesson.outcome === 'atari' && lesson.id === 'seal') {
    showFeedback(`出口被占后，白棋只剩 ${info.liberties.length} 口气。黑棋压缩了逃跑空间，但尚未提子。`, 'success');
  } else if (lesson.outcome === 'atari') {
    showFeedback(`攻击完成：白棋现在只剩 ${info.liberties.length} 口气。它尚未被提走，白方仍可能逃跑或反击。`, 'success');
  }
}

function render() {
  renderBoard();
  turnDot.className = `turn-dot ${game.turn === BLACK ? 'black-turn' : 'white-turn'}`;
  turnText.textContent = `${colorName(game.turn)}方行棋`;
  stateLabel.textContent = completed ? '本题完成' : lesson.options && !answered ? '先作判断' : '局部观察';
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
      if (highlightedStones.has(key)) button.classList.add('ad-selected');
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