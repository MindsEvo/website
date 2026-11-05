import { BLACK, WHITE, createEmptyBoard, createGame, getGroupInfo, playStone, undoMove } from '../core.mjs';

const BOARD_SIZE = 19;
const COLUMNS = 'ABCDEFGHJKLMNOPQRST';
const boardElement = document.getElementById('midBoard');
const turnDot = document.getElementById('midTurnDot');
const turnText = document.getElementById('midTurnText');
const stateLabel = document.getElementById('midStateLabel');
const counter = document.getElementById('midCounter');
const feedback = document.getElementById('midFeedback');
const title = document.getElementById('midTitle');
const intro = document.getElementById('midIntro');
const focus = document.getElementById('midFocus');
const task = document.getElementById('midTask');
const options = document.getElementById('midOptions');
const explanation = document.getElementById('midExplanation');
const progress = document.getElementById('midProgress');
const progressFill = document.getElementById('midProgressFill');
const blackCaptures = document.getElementById('midBlackCaptures');
const whiteCaptures = document.getElementById('midWhiteCaptures');
const undoButton = document.getElementById('midUndoButton');

const ATTACK_ESCAPE_LINE = [[BLACK, 10, 8], [WHITE, 9, 7]];

const LESSONS = [
  {
    id: 'weak', title: '发现弱棋', focus: '先看棋块的气与支援',
    intro: '中盘常围绕薄弱棋块展开。判断强弱时，要看棋串的共同气、是否连向己方，以及周围有没有可借用的空间。',
    task: '点击中央白棋，查看它的棋串大小和共同气数。',
    explanation: '气数是局部信息，不是死活结论。棋块还可能通过逃跑、连接、做眼或弃子转换改变处境。',
    setup: () => createGame(BOARD_SIZE, { board: boardFrom([
      [9, 8, WHITE], [8, 8, BLACK], [9, 9, BLACK]
    ]) }),
    inspect: [9, 8]
  },
  {
    id: 'attack', title: '攻击与紧气', focus: '制造应手，而非盲目追杀',
    intro: '攻击弱棋可以先紧气，迫使对方应手，同时让己方在追击中获得发展。是否能吃掉目标，需要继续计算。',
    task: '黑方行棋。在 J9 落子，把 J10 的白棋压到一口气。',
    explanation: '黑棋落子后白棋仍在棋盘上，白方可尝试逃跑或连接。攻击的收益也可能来自外围棋形，而不只是提子。',
    setup: () => createGame(BOARD_SIZE, { board: boardFrom([
      [9, 8, WHITE], [8, 8, BLACK], [9, 9, BLACK]
    ]) }),
    target: [10, 8], group: [9, 8], result: 'atari'
  },
  {
    id: 'connect', title: '连接防守', focus: '向支援棋靠拢，增加共同气',
    intro: '被攻击的棋块可以逃跑，也可以寻找附近支援。连接后，支援棋的共同气会加入整块棋的气数。',
    task: '白方行棋。J10 白棋只剩 H10 一口气；在 H10 连向 G10 的白棋。',
    explanation: '连接能改变棋块的规模与气数，但不保证完全安全。落子后仍需评估对方的攻击路线。',
    setup: () => createGame(BOARD_SIZE, { board: boardFrom([
      [9, 8, WHITE], [9, 6, WHITE], [8, 8, BLACK], [9, 9, BLACK], [10, 8, BLACK]
    ]), turn: WHITE }),
    target: [9, 7], group: [9, 8], result: 'connect'
  },
  {
    id: 'invade', title: '侵消模样', focus: '进入框架时要留意出路',
    intro: '对方的外势或模样尚未成为实地时，可以考虑侵入或消减。选择落点时要同时考虑己方的根基与逃跑方向。',
    task: '白方在 G10 进入黑棋沿 D 线展开的框架，观察这手是否合乎规则。',
    explanation: '合法侵入不等于成功活出，也不等于框架已被完全破坏。下一步要计算双方的联络、气和攻守方向。',
    setup: () => createGame(BOARD_SIZE, { board: boardFrom([
      [3, 3, BLACK], [9, 3, BLACK], [15, 3, BLACK]
    ]), turn: WHITE }),
    target: [9, 6], group: [9, 6], result: 'invasion'
  },
  {
    id: 'attack-run', title: '攻击与逃跑', focus: '从紧气转换到延气',
    intro: '中盘攻守会连续转换：一方紧气，另一方寻找出路；追击方再判断是否继续攻击或转向经营外围。',
    task: '按提示完成两手：黑 J9 打吃，白 H10 向外延伸，观察棋块气数变化。',
    explanation: '这两手只展示局部攻守转换。白棋逃出后是否安全，还要继续看周围黑棋、连接点和下一手先后。',
    setup: () => createGame(BOARD_SIZE, { board: boardFrom([
      [9, 8, WHITE], [8, 8, BLACK], [9, 9, BLACK]
    ]) }),
    sequence: ATTACK_ESCAPE_LINE
  },
  {
    id: 'review', title: '全盘判断', focus: '兼顾局部安全与全局所得',
    intro: '中盘不只计算能否提子，还要衡量攻击所得、己方弱棋、外围厚势和全局急所。',
    task: '选择更完整的攻击判断标准。',
    explanation: '强攻可能帮助对方安定或让己方变薄。判断时既要读局部变化，也要看整盘的轻重缓急。',
    options: [
      { id: 'capture-only', label: '只有提掉对方棋子才算攻击成功' },
      { id: 'whole-board', label: '比较攻守变化与全盘所得' }
    ],
    answer: 'whole-board',
    setup: () => createGame(BOARD_SIZE, { board: boardFrom([
      [9, 8, WHITE], [8, 8, BLACK], [9, 9, BLACK], [3, 3, BLACK], [15, 15, WHITE]
    ]) })
  }
];

let lesson = LESSONS[0];
let game = lesson.setup();
let answered = false;
let completed = false;
let highlightedStones = new Set();

document.querySelectorAll('[data-mid-lesson]').forEach(button => {
  button.addEventListener('click', () => selectLesson(button.dataset.midLesson));
});
options.addEventListener('click', event => {
  const button = event.target.closest('[data-answer]');
  if (!button || answered) return;
  const correct = button.dataset.answer === lesson.answer;
  button.classList.add(correct ? 'answer-correct' : 'answer-wrong');
  if (!correct) {
    showFeedback('再考虑攻击后双方的棋形变化，以及这手棋在全盘中的收益。');
    return;
  }
  answered = true;
  completed = true;
  options.querySelectorAll('[data-answer]').forEach(option => { option.disabled = true; });
  render();
  showFeedback('判断正确。局部计算和全盘价值需要一起考虑。', 'success');
});
undoButton.addEventListener('click', () => {
  if (!undoMove(game)) return;
  completed = false;
  highlightedStones = new Set();
  render();
  showFeedback('已撤销上一步。');
});
document.getElementById('midResetButton').addEventListener('click', resetLesson);

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
  explanation.innerHTML = `<strong>中盘要点</strong><br>${lesson.explanation}`;
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
  document.querySelectorAll('[data-mid-lesson]').forEach(button => {
    const current = button.dataset.midLesson === lesson.id;
    button.classList.toggle('is-current', current);
    button.setAttribute('aria-current', current ? 'step' : 'false');
  });
}

function startMessage() {
  if (lesson.id === 'weak') return '点击中央白棋，查看它所在棋串的共同气。';
  if (lesson.id === 'attack') return '黑方行棋：在 J9 紧气。';
  if (lesson.id === 'connect') return '白方行棋：在 H10 连向左侧支援棋。';
  if (lesson.id === 'invade') return '白方行棋：选择 G10 进入框架。';
  if (lesson.id === 'attack-run') return '黑方先行：在 J9 打吃。';
  return '先选择完整的攻防判断标准。';
}

function handlePoint(row, col) {
  if (completed) {
    showFeedback('本节已完成。可以悔棋重做，或切换到另一小节。', 'success');
    return;
  }
  if (lesson.answer && !answered) {
    showFeedback('先选择判断，再继续观察棋盘。');
    return;
  }
  if (lesson.id === 'weak') {
    if (row !== 9 || col !== 8 || game.board[row][col] !== WHITE) {
      showFeedback('请点击中央的白棋，观察它的共同气。');
      return;
    }
    const info = getGroupInfo(game.board, row, col);
    highlightedStones = new Set(info.stones.map(pointKey));
    completed = true;
    render();
    showFeedback(`这块白棋由 ${info.stones.length} 子组成，共有 ${info.liberties.length} 口气。还要查看支援与逃跑路线，才能判断它是否真正危险。`);
    return;
  }
  if (lesson.sequence) {
    handleSequenceMove(row, col);
    return;
  }
  const [targetRow, targetCol] = lesson.target || [];
  if (row !== targetRow || col !== targetCol) {
    showFeedback(`本节关键点是 ${coordinateName(targetCol)}${game.size - targetRow}，观察落子后的攻守变化。`);
    return;
  }
  if (!playStone(game, row, col)) {
    showFeedback('这手不合法。检查目标点是否空着，以及落子后整块棋是否有气。');
    return;
  }
  const info = getGroupInfo(game.board, ...lesson.group);
  highlightedStones = new Set(info.stones.map(pointKey));
  completed = true;
  render();
  if (lesson.result === 'atari') {
    showFeedback(`攻击完成：白棋现在只剩 ${info.liberties.length} 口气，尚未被提走。`, 'success');
  } else if (lesson.result === 'connect') {
    showFeedback(`连接完成：白棋合成 ${info.stones.length} 子棋串，共有 ${info.liberties.length} 口气。`, 'success');
  } else {
    showFeedback('侵入落子合法。黑棋框架尚未成为实地，后续需要继续计算联络与出路。', 'success');
  }
}

function handleSequenceMove(row, col) {
  const index = game.moves.length;
  const move = lesson.sequence[index];
  const [color, targetRow, targetCol] = move;
  if (row !== targetRow || col !== targetCol) {
    showFeedback(`${colorName(color)}方第 ${index + 1} 手目标是 ${coordinateName(targetCol)}${game.size - targetRow}。`);
    return;
  }
  if (!playStone(game, row, col)) {
    showFeedback('这手不合法。请重置本节并检查当前棋形。');
    return;
  }
  highlightedStones = new Set([pointKey({ row, col })]);
  render();
  if (index === lesson.sequence.length - 1) {
    completed = true;
    const info = getGroupInfo(game.board, 9, 8);
    showFeedback(`攻守转换完成：白棋延气后成为 ${info.stones.length} 子棋串，共有 ${info.liberties.length} 口气。周围仍需继续观察。`, 'success');
    return;
  }
  const next = lesson.sequence[index + 1];
  if (index === 0) {
    const info = getGroupInfo(game.board, 9, 8);
    showFeedback(`黑棋打吃后，白棋剩 ${info.liberties.length} 口气。现在轮到白方应对。`);
  } else {
    showFeedback(`第 ${index + 1} / ${lesson.sequence.length} 手完成，接下来${colorName(next[0])}方行棋。`);
  }
}

function render() {
  renderBoard();
  turnDot.className = `turn-dot ${game.turn === BLACK ? 'black-turn' : 'white-turn'}`;
  turnText.textContent = `${colorName(game.turn)}方行棋`;
  stateLabel.textContent = completed ? '本节完成' : lesson.sequence ? `第 ${game.moves.length + 1} 手` : '全盘观察';
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
  for (const starRow of [3, 9, 15]) {
    for (const starCol of [3, 9, 15]) {
      const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      star.setAttribute('cx', margin + starCol * step);
      star.setAttribute('cy', margin + starRow * step);
      star.setAttribute('r', '5');
      star.setAttribute('fill', '#3d3324');
      svg.append(star);
    }
  }
  boardElement.append(svg);
  for (let col = 0; col < game.size; col += 1) addCoordinate(COLUMNS[col], `${4 + (92 * col / (game.size - 1))}%`, '1.2%', 'file-coordinate');
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
      button.setAttribute('aria-label', `${COLUMNS[col]} ${game.size - row}${stone ? `，${colorName(stone)}棋` : '，空位'}`);
      if (highlightedStones.has(key)) button.classList.add('mid-last-move');
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
  line.setAttribute('stroke-width', '1.7');
  svg.append(line);
}

function showFeedback(text, state = '') {
  feedback.textContent = text;
  feedback.className = `rule-note${state ? ` ${state}` : ''}`;
}

function boardFrom(stones) {
  const board = createEmptyBoard(BOARD_SIZE);
  for (const [row, col, color] of stones) board[row][col] = color;
  return board;
}

function pointKey(point) {
  return `${point.row},${point.col}`;
}

function coordinateName(col) {
  return COLUMNS[col];
}

function colorName(color) {
  return color === BLACK ? '黑' : '白';
}

resetLesson();