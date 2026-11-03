import { BLACK, WHITE, createEmptyBoard, createGame, playStone, undoMove } from '../core.mjs';

const BOARD_SIZE = 19;
const COLUMNS = 'ABCDEFGHJKLMNOPQRST';
const boardElement = document.getElementById('layoutBoard');
const turnDot = document.getElementById('layoutTurnDot');
const turnText = document.getElementById('layoutTurnText');
const stateLabel = document.getElementById('layoutStateLabel');
const counter = document.getElementById('layoutCounter');
const feedback = document.getElementById('layoutFeedback');
const title = document.getElementById('layoutTitle');
const intro = document.getElementById('layoutIntro');
const focus = document.getElementById('layoutFocus');
const task = document.getElementById('layoutTask');
const options = document.getElementById('layoutOptions');
const explanation = document.getElementById('layoutExplanation');
const progress = document.getElementById('layoutProgress');
const progressFill = document.getElementById('layoutProgressFill');
const blackCaptures = document.getElementById('layoutBlackCaptures');
const whiteCaptures = document.getElementById('layoutWhiteCaptures');
const undoButton = document.getElementById('layoutUndoButton');

const FOUR_CORNERS = [
  [BLACK, 3, 3], [WHITE, 15, 15], [BLACK, 15, 3], [WHITE, 3, 15]
];

const LESSONS = [
  {
    id: 'corner', title: '空角起手', focus: '先在角部建立根据',
    intro: '棋盘边缘帮助棋块围空和做眼，角部有两条边界，通常是开局建立根据的高效区域。',
    task: '黑方先行。选择一个空角的四四星位落子，观察它与两条边的距离。',
    explanation: '四四与三四都是常见角部起点。开局原则用于帮助取舍，不意味着每盘必须从同一个坐标开始。',
    setup: () => createGame(BOARD_SIZE),
    allowed: [[3, 3], [3, 15], [15, 3], [15, 15]],
    success: '角部落子完成。两条边界为后续围空与安定提供了条件。'
  },
  {
    id: 'four-corners', title: '四角展开', focus: '在空角间保持全盘平衡',
    intro: '角部通常比中腹容易形成确定地盘。双方在空角落子后，可以继续寻找未被占据的角与大场。',
    task: '按次序完成四个四四点：黑 D16、白 Q4、黑 D4、白 Q16。',
    explanation: '这只是演示四角分布的一组合法开局，不是要求照搬的定式。周围有棋子时，应重新评估每个角的价值。',
    setup: () => createGame(BOARD_SIZE),
    sequence: FOUR_CORNERS,
    finish: '四角落子完成。棋盘四角均有着点，接下来可比较边线框架与角部安定的先后。'
  },
  {
    id: 'side', title: '角向边线', focus: '从角部向边上扩展框架',
    intro: '占据角部后，可以向边线发展，扩大潜在空间并限制对方进入。框架仍不是已经确认的实地。',
    task: '黑 D16 已占角。试在同一侧的 D10 扩展，观察角与边之间的空间关系。',
    explanation: '边上的棋子可以支撑框架，但对方仍可能侵入或消减。不要把尚未安定的模样直接计作实地。',
    setup: () => createGame(BOARD_SIZE, { board: boardFrom([[3, 3, BLACK]]) }),
    target: [9, 3],
    success: '边线着点落下。D16 与 D10 展开了一段潜在框架；后续仍需经营和应对侵消。'
  },
  {
    id: 'lines', title: '三线与四线', focus: '理解实地与外势的侧重',
    intro: '靠近边线的低位着法较容易围住实地；较高的着法更重视向外影响。两者各有用途，布局需要结合目标平衡。',
    task: '选择对三线与四线含义的恰当描述。',
    explanation: '三线偏向实地，四线偏向外势，是入门观察角度，不是判定每一手好坏的绝对标准。',
    options: [
      { id: 'reverse', label: '三线偏外势，四线偏实地' },
      { id: 'balanced', label: '三线偏实地，四线偏外势' }
    ],
    answer: 'balanced',
    setup: () => createGame(BOARD_SIZE, { board: boardFrom([[3, 3, BLACK]]) })
  },
  {
    id: 'influence', title: '势力与实地', focus: '区分潜力与已围住的地盘',
    intro: '外势和模样代表影响力或潜在地盘，不等于已经围住的实地。对方可以侵入，己方也要准备后续应对。',
    task: '判断一条尚未封闭的边线框架能否直接当作已得目数。',
    explanation: '围棋的地盘要结合双方后续着手确认。开局评价不能只数模样包围了多少交叉点。',
    options: [
      { id: 'territory', label: '框架围住的点都已是实地' },
      { id: 'potential', label: '这是潜在空间，仍可能被侵消' }
    ],
    answer: 'potential',
    setup: () => createGame(BOARD_SIZE, { board: boardFrom([
      [3, 3, BLACK], [9, 3, BLACK], [15, 3, BLACK]
    ]) })
  },
  {
    id: 'review', title: '全盘复盘', focus: '从角部走向全盘协调',
    intro: '把布局思路串起来：先看空角，再看角部是否需要安定，随后发展边线，并比较实地、外势和全盘急所。',
    task: '选择更稳妥的开局判断原则。',
    explanation: '布局原则帮助寻找候选点，不提供固定答案。周围棋子、先后手与对方弱点都会改变优先次序。',
    options: [
      { id: 'fixed', label: '每盘都按同一套坐标顺序落子' },
      { id: 'context', label: '先看全盘配置，再比较候选点' }
    ],
    answer: 'context',
    setup: () => createGame(BOARD_SIZE)
  }
];

let lesson = LESSONS[0];
let game = lesson.setup();
let answered = false;
let completed = false;
let highlightedStones = new Set();

document.querySelectorAll('[data-layout-lesson]').forEach(button => {
  button.addEventListener('click', () => selectLesson(button.dataset.layoutLesson));
});
options.addEventListener('click', event => {
  const button = event.target.closest('[data-answer]');
  if (!button || answered) return;
  const correct = button.dataset.answer === lesson.answer;
  button.classList.add(correct ? 'answer-correct' : 'answer-wrong');
  if (!correct) {
    showFeedback('再比较一下：开局原则描述的是侧重，不是脱离局面的绝对规则。');
    return;
  }
  answered = true;
  completed = true;
  options.querySelectorAll('[data-answer]').forEach(option => { option.disabled = true; });
  render();
  showFeedback('判断正确。把这一原则放回全盘，再选择具体落点。', 'success');
});
undoButton.addEventListener('click', () => {
  if (!undoMove(game)) return;
  completed = false;
  highlightedStones = new Set();
  render();
  showFeedback('已撤销上一步。');
});
document.getElementById('layoutResetButton').addEventListener('click', resetLesson);

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
  explanation.innerHTML = `<strong>布局要点</strong><br>${lesson.explanation}`;
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
  document.querySelectorAll('[data-layout-lesson]').forEach(button => {
    const current = button.dataset.layoutLesson === lesson.id;
    button.classList.toggle('is-current', current);
    button.setAttribute('aria-current', current ? 'step' : 'false');
  });
}

function startMessage() {
  if (lesson.id === 'corner') return '黑方行棋：先在空角建立落点。';
  if (lesson.id === 'four-corners') return '黑方先行：依次完成双方的四个角部着点。';
  if (lesson.id === 'side') return '黑方行棋：从 D16 向 D10 延展。';
  if (lesson.id === 'lines') return '先思考低位与高位的空间侧重。';
  if (lesson.id === 'influence') return '观察黑棋在左侧形成的潜在框架。';
  return '先选择符合全盘思考的判断。';
}

function handlePoint(row, col) {
  if (completed) {
    showFeedback('本节已完成。可以悔棋重做，或切换到下一节。', 'success');
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
  if (lesson.allowed) {
    if (!lesson.allowed.some(([allowedRow, allowedCol]) => row === allowedRow && col === allowedCol)) {
      showFeedback('请先从四个空角的四四星位中选择一处。');
      return;
    }
  } else if (lesson.target) {
    const [targetRow, targetCol] = lesson.target;
    if (row !== targetRow || col !== targetCol) {
      showFeedback(`本节观察点是 ${coordinateName(targetCol)}${game.size - targetRow}，从角部向边线展开。`);
      return;
    }
  } else {
    showFeedback('本节通过右侧选项观察布局原则。');
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
    showFeedback(`${colorName(color)}方第 ${index + 1} 手目标是 ${coordinateName(targetCol)}${game.size - targetRow}。`);
    return;
  }
  if (!playStone(game, row, col)) {
    showFeedback('这手不合法。请重置本节后检查棋盘上的落点。');
    return;
  }
  highlightedStones = new Set([pointKey({ row, col })]);
  render();
  if (index === lesson.sequence.length - 1) {
    completed = true;
    showFeedback(lesson.finish, 'success');
    return;
  }
  const next = lesson.sequence[index + 1];
  showFeedback(`第 ${index + 1} / ${lesson.sequence.length} 手完成，接下来${colorName(next[0])}方行棋。`);
}

function render() {
  renderBoard();
  turnDot.className = `turn-dot ${game.turn === BLACK ? 'black-turn' : 'white-turn'}`;
  turnText.textContent = `${colorName(game.turn)}方行棋`;
  stateLabel.textContent = completed ? '本节完成' : lesson.sequence ? `第 ${game.moves.length + 1} 手` : '观察全盘';
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
      if (highlightedStones.has(key)) button.classList.add('layout-last-move');
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