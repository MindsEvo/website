import { BLACK, WHITE, createEmptyBoard, createGame, getGroupInfo, playStone, undoMove } from '../core.mjs';

const boardElement = document.getElementById('tesujiBoard');
const turnDot = document.getElementById('tesujiTurnDot');
const turnText = document.getElementById('tesujiTurnText');
const stateLabel = document.getElementById('tesujiStateLabel');
const counter = document.getElementById('tesujiCounter');
const feedback = document.getElementById('tesujiFeedback');
const title = document.getElementById('tesujiTitle');
const intro = document.getElementById('tesujiIntro');
const focus = document.getElementById('tesujiFocus');
const task = document.getElementById('tesujiTask');
const options = document.getElementById('tesujiOptions');
const explanation = document.getElementById('tesujiExplanation');
const progress = document.getElementById('tesujiProgress');
const progressFill = document.getElementById('tesujiProgressFill');
const blackCaptures = document.getElementById('tesujiBlackCaptures');
const whiteCaptures = document.getElementById('tesujiWhiteCaptures');
const undoButton = document.getElementById('tesujiUndoButton');

const LESSONS = [
  {
    id: 'atari', title: '打吃', focus: '先紧气，再判断后续',
    intro: '打吃是落子后使对方整块棋只剩一口气。它迫使对方回应，但不代表这块棋已经被提走。',
    task: '黑方行棋。找到能让 E5 白棋只剩一口气的落点。',
    explanation: '落子后点击白棋，查看整块棋的共同气。若对方能逃出或反打吃，还要继续计算。',
    setup: () => createGame(9, { board: boardFrom([[4, 4, WHITE], [3, 4, BLACK], [4, 5, BLACK]]) }),
    target: [5, 4], opponent: [4, 4],
    success: () => '打吃成功：白棋现在只剩一口气。它还没有被提走，白方仍可能应对。'
  },
  {
    id: 'cut', title: '断', focus: '占据两块棋之间的连接点',
    intro: '当对方两块棋之间存在可利用的断点，在关键位置落子可以阻止它们直接连成一块。',
    task: '白方行棋。在 D5 与 F5 之间落子，观察两颗黑棋是否仍属于不同棋串。',
    explanation: '判断连接只看上下左右相邻。断后还要留意双方后续是否能通过别处连接或反断。',
    setup: () => createGame(9, { board: boardFrom([[4, 3, BLACK], [4, 5, BLACK]]), turn: WHITE }),
    target: [4, 4]
  },
  {
    id: 'hane', title: '扳', focus: '贴近对方并形成弯曲应对',
    intro: '扳是围棋中常见的贴身手段：己方棋子沿对方棋子的斜向作出弯曲连接，主动争取局部先手与方向。',
    task: '黑方行棋。黑棋 D5 与白棋 E5 已相邻，试着在 D6 扳出弯形。',
    explanation: '扳的价值要结合双方接下来的断、接和气数判断。本题只验证局部形状，不把“扳”本身说成必然得利。',
    setup: () => createGame(9, { board: boardFrom([[4, 3, BLACK], [4, 4, WHITE]]) }),
    target: [3, 3]
  },
  {
    id: 'snapback', title: '倒扑', focus: '先弃一子，再反提整串',
    intro: '倒扑常用弃子制造提子机会：先让对方提走一子，再利用对方棋串气紧，反提更大一串。',
    task: '按棋盘提示依次行棋：黑 E5 扑入，白 F5 提子，黑再回到 E5 反提。',
    explanation: '只有逐手确认合法并数清提子，才能分辨倒扑与普通劫争。本例黑方先弃 1 子，再反提白方整串。',
    setup: () => createGame(9, { board: snapbackBoard() }),
    sequence: [[4, 4], [4, 5], [4, 4]]
  },
  {
    id: 'squeeze', title: '紧气与次序', focus: '先制造应手，再争取提子',
    intro: '许多手筋不是马上提子，而是先占住对方的气，迫使对方应手后再处理棋块。',
    task: '先判断黑棋应直接认为已提子，还是先落在 E4 打吃；答题后在棋盘上验证。',
    explanation: '紧气后的棋块仍可能有逃跑、反打吃或做眼的手段。局部题只验证当前落子造成的一气状态。',
    options: [{ id: 'capture', label: '白棋已经被提走' }, { id: 'atari', label: '先在 E4 打吃' }],
    answer: 'atari',
    setup: () => createGame(9, { board: boardFrom([[4, 4, WHITE], [3, 4, BLACK], [4, 5, BLACK]]) }),
    target: [5, 4], opponent: [4, 4],
    success: () => '顺序正确：黑 E4 后白棋只剩一口气，尚未被提。'
  },
  {
    id: 'review', title: '综合练习', focus: '先找断点，再验证棋串变化',
    intro: '综合练习先看棋形，再选择有效着点，最后用落子后的棋串关系检验判断。',
    task: '判断白棋在哪一点可以切开 D5 与 F5 两颗黑棋，然后在棋盘上完成这手。',
    explanation: '正确答案要同时符合题目目标与围棋规则。局部落子成功后，还应继续思考对方如何应对。',
    options: [{ id: 'e5', label: '在 E5 断开' }, { id: 'c5', label: '在 C5 落子' }],
    answer: 'e5',
    setup: () => createGame(9, { board: boardFrom([[4, 3, BLACK], [4, 5, BLACK]]), turn: WHITE }),
    target: [4, 4]
  }
];

let lesson = LESSONS[0];
let game = lesson.setup();
let highlightedStones = new Set();
let answered = false;
let completed = false;

document.querySelectorAll('[data-tesuji-lesson]').forEach(button => {
  button.addEventListener('click', () => selectLesson(button.dataset.tesujiLesson));
});
options.addEventListener('click', event => {
  const button = event.target.closest('[data-answer]');
  if (!button || answered) return;
  const correct = button.dataset.answer === lesson.answer;
  button.classList.add(correct ? 'answer-correct' : 'answer-wrong');
  if (!correct) {
    showFeedback('这个选择不符合题目目标，再看一遍棋盘上的连接与气。');
    return;
  }
  answered = true;
  options.querySelectorAll('[data-answer]').forEach(option => { option.disabled = true; });
  showFeedback('判断正确。现在在棋盘上完成关键着。', 'success');
});
undoButton.addEventListener('click', () => {
  if (!undoMove(game)) return;
  completed = false;
  highlightedStones = new Set();
  render();
  showFeedback('已撤销上一步。');
});
document.getElementById('tesujiResetButton').addEventListener('click', resetLesson);

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
  explanation.innerHTML = `<strong>手筋要点</strong><br>${lesson.explanation}`;
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
  document.querySelectorAll('[data-tesuji-lesson]').forEach(button => {
    const current = button.dataset.tesujiLesson === lesson.id;
    button.classList.toggle('is-current', current);
    button.setAttribute('aria-current', current ? 'step' : 'false');
  });
}

function startMessage() {
  if (lesson.id === 'atari') return '黑方行棋：找到打吃白棋的落点。';
  if (lesson.id === 'cut') return '白方行棋：观察 D5 与 F5 之间的 E5。';
  if (lesson.id === 'hane') return '黑方行棋：在 D6 扳出弯形。';
  if (lesson.id === 'snapback') return '黑方先行：第一手在 E5 扑入。';
  if (lesson.id === 'squeeze') return '先选择当前局面的正确判断。';
  return '先选择能完成断点目标的着法。';
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
  if (lesson.sequence) {
    handleSequenceMove(row, col);
    return;
  }
  const [targetRow, targetCol] = lesson.target;
  if (row !== targetRow || col !== targetCol) {
    showFeedback(`本题关键点是 ${coordinateName(targetCol)}${game.size - targetRow}，先判断这手能带来什么变化。`);
    return;
  }
  if (!playStone(game, row, col)) {
    showFeedback('这手不合法。确认目标点为空，并检查整块棋落子后是否有气。');
    return;
  }
  if (lesson.id === 'atari' || lesson.id === 'squeeze') {
    const info = getGroupInfo(game.board, ...lesson.opponent);
    highlightedStones = new Set(info.stones.map(pointKey));
    completed = true;
    render();
    showFeedback(lesson.success(), 'success');
    return;
  }
  if (lesson.id === 'cut' || lesson.id === 'review') {
    const left = getGroupInfo(game.board, 4, 3);
    const right = getGroupInfo(game.board, 4, 5);
    if (left.stones.length !== 1 || right.stones.length !== 1) {
      showFeedback('棋串变化与预期不同，请重置本题再观察。');
      return;
    }
    completed = true;
    render();
    showFeedback('断点成立：D5 与 F5 现在仍属于两块不同的黑棋。', 'success');
    return;
  }
  if (lesson.id === 'hane') {
    const group = getGroupInfo(game.board, row, col);
    completed = true;
    highlightedStones = new Set(group.stones.map(pointKey));
    render();
    showFeedback('扳子落下，黑棋沿 D5 形成弯曲连接。后续得失还要结合双方应对计算。', 'success');
  }
}

function handleSequenceMove(row, col) {
  const moveIndex = game.moves.length;
  const expected = lesson.sequence[moveIndex];
  if (!expected) {
    completed = true;
    showFeedback('倒扑变化已完成。', 'success');
    return;
  }
  if (row !== expected[0] || col !== expected[1]) {
    const color = game.turn === BLACK ? '黑' : '白';
    showFeedback(`${color}方这手先走 ${coordinateName(expected[1])}${game.size - expected[0]}。`);
    return;
  }
  if (!playStone(game, row, col)) {
    showFeedback('这手不合法。请重置棋局并检查倒扑前提。');
    return;
  }
  const stones = game.turn === BLACK ? [[3, 4], [4, 3], [5, 4], [3, 3], [3, 5], [5, 3]] : [];
  highlightedStones = new Set(stones.map(([stoneRow, stoneCol]) => `${stoneRow},${stoneCol}`));
  render();
  if (moveIndex === 0) {
    showFeedback('黑棋扑入成功，白棋下一手在 F5 提掉这颗黑子。');
  } else if (moveIndex === 1) {
    showFeedback(`白棋提掉 1 子。现在黑方在 E5 反扑，目标是提走整块白棋。`);
  } else {
    completed = true;
    showFeedback(`倒扑完成：白棋提掉黑 1 子后，黑棋反提白 ${game.captures[BLACK]} 子。`, 'success');
  }
}

function render() {
  renderBoard();
  turnDot.className = `turn-dot ${game.turn === BLACK ? 'black-turn' : 'white-turn'}`;
  turnText.textContent = `${colorName(game.turn)}方行棋`;
  stateLabel.textContent = completed ? '本题完成' : lesson.sequence ? `第 ${game.moves.length + 1} 手` : '找出关键着';
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
      if (highlightedStones.has(key)) button.classList.add('tesuji-selected');
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

function snapbackBoard() {
  const whiteStones = [[3, 4], [3, 3], [4, 3], [5, 3], [5, 4], [3, 5]];
  const excluded = new Set(['4,4', '4,5', ...whiteStones.map(([row, col]) => `${row},${col}`)]);
  const blackStones = new Set();
  for (const [row, col] of whiteStones) {
    for (const [nextRow, nextCol] of [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]) {
      if (nextRow >= 0 && nextRow < 9 && nextCol >= 0 && nextCol < 9) {
        const key = `${nextRow},${nextCol}`;
        if (!excluded.has(key)) blackStones.add(key);
      }
    }
  }
  blackStones.add('4,6');
  return boardFrom([
    ...whiteStones.map(([row, col]) => [row, col, WHITE]),
    ...[...blackStones].map(key => [...key.split(',').map(Number), BLACK])
  ]);
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