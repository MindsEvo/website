import { BLACK, WHITE, createEmptyBoard, createGame, getGroupInfo, playStone, undoMove } from '../core.mjs';

const boardElement = document.getElementById('lifeBoard');
const turnDot = document.getElementById('lifeTurnDot');
const turnText = document.getElementById('lifeTurnText');
const stateLabel = document.getElementById('lifeStateLabel');
const counter = document.getElementById('lifeCounter');
const feedback = document.getElementById('lifeFeedback');
const title = document.getElementById('lifeTitle');
const intro = document.getElementById('lifeIntro');
const focus = document.getElementById('lifeFocus');
const task = document.getElementById('lifeTask');
const options = document.getElementById('lifeOptions');
const explanation = document.getElementById('lifeExplanation');
const progress = document.getElementById('lifeProgress');
const progressFill = document.getElementById('lifeProgressFill');
const blackCaptures = document.getElementById('lifeBlackCaptures');
const whiteCaptures = document.getElementById('lifeWhiteCaptures');
const undoButton = document.getElementById('lifeUndoButton');

const LESSONS = [
  {
    id: 'two-eyes', title: '两只真眼', focus: '识别不能被一手同时填掉的眼',
    intro: '在常规围棋规则下，一块棋若确实有两个彼此分开的真眼，对方不能一手同时填掉两眼来提走整块棋。',
    task: '点击黑棋围出的两个空点，确认它们都是同一块棋的眼。',
    explanation: '这里演示的是“两个真眼”成立时的局部结论。棋盘其余部分和对杀条件不在本题讨论范围内。',
    setup: () => createGame(9, { board: boardFrom([
      [3, 3, BLACK], [5, 3, BLACK], [4, 2, BLACK], [4, 4, BLACK],
      [3, 5, BLACK], [5, 5, BLACK], [4, 6, BLACK]
    ]) }),
    eyes: [[4, 3], [4, 5]]
  },
  {
    id: 'false-eye', title: '辨认假眼', focus: '检查眼点的斜向缺陷',
    intro: '眼点四邻同色还不够；内部眼点还要检查四个斜向位置。斜向有对方棋子时，这个眼形可能有缺陷。',
    task: '判断 E5 是牢固真眼，还是需要继续检查的假眼形。然后点击 E5 查看斜向缺陷。',
    explanation: '假眼的判断与所在位置、对角接触及整块棋的连接状况有关。此局面用于识别缺陷，不把单一规则扩展成整块棋的死活结论。',
    options: [{ id: 'true-eye', label: '牢固真眼' }, { id: 'false-eye', label: '有缺陷的眼形' }],
    answer: 'false-eye',
    setup: () => createGame(9, { board: boardFrom([
      [3, 4, BLACK], [5, 4, BLACK], [4, 3, BLACK], [4, 5, BLACK],
      [3, 3, WHITE], [2, 4, BLACK], [2, 5, BLACK], [3, 5, BLACK], [5, 5, BLACK], [6, 5, BLACK]
    ]) }),
    target: [4, 4], vital: [3, 3]
  },
  {
    id: 'one-eye', title: '一眼能否判活', focus: '区分眼与整块棋的外部状况',
    intro: '有一个眼点，只能说明局部眼形存在；若棋块外部仍有气，或还需应对对方着手，就不能仅凭这一眼下死活结论。',
    task: '点击 E5 观察眼点，再点击黑棋查看整块棋的气，比较眼与外部气的不同。',
    explanation: '死活要看整块棋、眼形、外部气及双方后续着手。本例展示的是“信息不足以判定”，不是宣称所有单眼棋都能活。',
    setup: () => createGame(9, { board: boardFrom([
      [3, 4, BLACK], [5, 4, BLACK], [4, 3, BLACK], [4, 5, BLACK],
      [3, 3, BLACK], [3, 5, BLACK], [5, 3, BLACK], [5, 5, BLACK]
    ]) }),
    eyes: [[4, 4]]
  },
  {
    id: 'make-eyes', title: '做眼的要点', focus: '占住边界关键点，保留眼内空间',
    intro: '做眼的目标是补强棋块边界、围出可保留的空点，不是把自己的棋子下进眼里。',
    task: '黑方在 E5 补上边界后，点击 D5，检查它是否成为黑棋围出的眼点。',
    explanation: '一手棋是否能做成眼，还要检查落子是否合法、棋块是否连通以及周边反应。本题只验证指定局部形状。',
    setup: () => createGame(9, { board: boardFrom([
      [3, 3, BLACK], [5, 3, BLACK], [4, 2, BLACK],
      [3, 4, BLACK], [5, 4, BLACK], [4, 5, BLACK]
    ]), turn: BLACK }),
    target: [4, 4], eyes: [[4, 3]]
  },
  {
    id: 'eye-vital', title: '眼形与关键点', focus: '发现双方争夺的要点',
    intro: '眼形中某些空点会影响能否做成两眼。关键点可能是防守方补强的位置，也可能是攻击方限制眼形的着点。',
    task: '点击棋形中央的 E5，观察它如何把两侧潜在眼位联系在一起。',
    explanation: '本例展示局部空间的要点位置，不代表白棋此刻可以无条件合法落入。实战还需计算气、提子与双方先后手。',
    setup: () => createGame(9, { board: boardFrom([
      [3, 3, BLACK], [3, 4, BLACK], [3, 5, BLACK],
      [4, 2, BLACK], [4, 6, BLACK],
      [5, 3, BLACK], [5, 5, BLACK], [6, 3, BLACK], [6, 4, BLACK], [6, 5, BLACK]
    ]) }),
    vital: [4, 4], eyes: [[4, 3], [4, 5]]
  },
  {
    id: 'review', title: '综合判断', focus: '根据局部证据谨慎下结论',
    intro: '先确认棋块是否连接，再检查真眼、假眼、外部气与关键点，最后才讨论活棋或死棋。',
    task: '本局只有一个眼点，棋块外部仍有气。选择最严谨的判断，再点击黑棋核对气数。',
    explanation: '观察到一个眼不等于判活；观察到外部气也不等于已确认活棋。条件不足时，准确说出“还不能判断”就是正确分析。',
    options: [{ id: 'alive', label: '已经确定活棋' }, { id: 'dead', label: '已经确定死棋' }, { id: 'unknown', label: '信息不足，继续计算' }],
    answer: 'unknown',
    setup: () => createGame(9, { board: boardFrom([
      [3, 4, BLACK], [5, 4, BLACK], [4, 3, BLACK], [4, 5, BLACK],
      [3, 3, BLACK], [5, 3, BLACK]
    ]) }),
    eyes: [[4, 4]]
  }
];

let lesson = LESSONS[0];
let game = lesson.setup();
let highlightedStones = new Set();
let markedEyes = new Set();
let markedVital = null;
let answered = false;

document.querySelectorAll('[data-life-lesson]').forEach(button => {
  button.addEventListener('click', () => selectLesson(button.dataset.lifeLesson));
});
options.addEventListener('click', event => {
  const button = event.target.closest('[data-answer]');
  if (!button || answered) return;
  answered = true;
  options.querySelectorAll('[data-answer]').forEach(option => {
    option.disabled = true;
    if (option.dataset.answer === lesson.answer) option.classList.add('answer-correct');
    else if (option === button) option.classList.add('answer-wrong');
  });
  const correct = button.dataset.answer === lesson.answer;
  showFeedback(correct ? '判断正确。请结合棋盘说明依据。' : '还不能这样下结论。再检查题目给出的眼形和外部条件。', correct ? 'success' : '');
});
undoButton.addEventListener('click', () => {
  if (!undoMove(game)) return;
  clearMarks();
  render();
  showFeedback('已撤销上一步。');
});
document.getElementById('lifeResetButton').addEventListener('click', resetLesson);

function selectLesson(id) {
  const next = LESSONS.find(item => item.id === id);
  if (!next) return;
  lesson = next;
  resetLesson();
}

function resetLesson() {
  game = lesson.setup();
  answered = false;
  clearMarks();
  renderContent();
  render();
  showFeedback(startMessage());
}

function clearMarks() {
  highlightedStones = new Set();
  markedEyes = new Set();
  markedVital = null;
}

function renderContent() {
  const index = LESSONS.indexOf(lesson);
  title.textContent = lesson.title;
  intro.textContent = lesson.intro;
  focus.textContent = lesson.focus;
  task.textContent = lesson.task;
  explanation.innerHTML = `<strong>死活要点</strong><br>${lesson.explanation}`;
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
  document.querySelectorAll('[data-life-lesson]').forEach(button => {
    const current = button.dataset.lifeLesson === lesson.id;
    button.classList.toggle('is-current', current);
    button.setAttribute('aria-current', current ? 'step' : 'false');
  });
}

function startMessage() {
  if (lesson.id === 'two-eyes') return '点击两个眼点，确认它们是否属于同一块黑棋。';
  if (lesson.id === 'false-eye') return '先作出判断，再点击 E5 检查斜向位置。';
  if (lesson.id === 'one-eye') return '点击 E5 看眼点，再点黑棋查看整块棋的气。';
  if (lesson.id === 'make-eyes') return '黑方行棋：在 E5 补强边界。';
  if (lesson.id === 'eye-vital') return '点击 E5 标出本例的眼形关键点。';
  return '先判断信息是否足够，再点击黑棋查看外部气。';
}

function handlePoint(row, col) {
  if (lesson.id === 'make-eyes' && !game.moves.length && !game.board[row][col]) {
    const [targetRow, targetCol] = lesson.target;
    if (row !== targetRow || col !== targetCol) {
      showFeedback('本题要补强的边界点是 E5。');
      return;
    }
    if (!playStone(game, row, col)) {
      showFeedback('此处不能合法落子，请重置本节后再试。');
      return;
    }
    markedEyes = new Set(lesson.eyes.map(pointKey));
    render();
    showFeedback('边界补成了。D5 现在是局部眼点；注意不要把棋下进自己的眼里。', 'success');
    return;
  }

  if (lesson.id === 'false-eye' && row === 4 && col === 4) {
    markedVital = pointKey({ row: 3, col: 3 });
    render();
    showFeedback('E5 四邻虽为黑棋，但左上斜点有白棋，眼形存在缺陷，不能当作牢固真眼。');
    return;
  }

  if (lesson.id === 'eye-vital' && row === lesson.vital[0] && col === lesson.vital[1]) {
    markedVital = pointKey({ row, col });
    render();
    showFeedback('E5 是本例观察眼形变化的关键点。实际攻防中要分别计算双方落子的合法性和后续变化。');
    return;
  }

  if (lesson.eyes?.some(([eyeRow, eyeCol]) => eyeRow === row && eyeCol === col)) {
    markedEyes.add(pointKey({ row, col }));
    render();
    if (lesson.id === 'two-eyes') {
      const allMarked = lesson.eyes.every(([eyeRow, eyeCol]) => markedEyes.has(pointKey({ row: eyeRow, col: eyeCol })));
      showFeedback(allMarked ? '两个眼点已标出，且都属于同一块黑棋。本题条件下，对手不能一手提掉这块棋。' : '这是一个眼点。继续找同一块棋的另一只眼。', allMarked ? 'success' : '');
    } else if (lesson.id === 'one-eye') {
      showFeedback('眼点已标出。再点击一颗黑棋，查看眼以外的共同气。');
    } else if (lesson.id === 'make-eyes') {
      showFeedback('这里是眼点。请先补上 E5 的边界，再观察局面变化。');
    } else if (lesson.id === 'eye-vital') {
      showFeedback('这是一个潜在眼位。再点击中央 E5 观察关键点。');
    }
    return;
  }

  if (game.board[row][col]) {
    const info = getGroupInfo(game.board, row, col);
    highlightedStones = new Set(info.stones.map(pointKey));
    render();
    showFeedback(`这块${colorName(game.board[row][col])}棋由 ${info.stones.length} 颗棋子组成，共有 ${info.liberties.length} 口气。气数是局部信息，不能单独代替死活判断。`);
    return;
  }

  if (lesson.id === 'make-eyes') showFeedback('请先在 E5 补强边界，形成 D5 眼点。');
  else showFeedback('请点击题目指定的眼点或棋块。');
}

function render() {
  renderBoard();
  turnDot.className = `turn-dot ${game.turn === BLACK ? 'black-turn' : 'white-turn'}`;
  turnText.textContent = lesson.id === 'make-eyes' && !game.moves.length ? '黑方行棋' : '观察局部';
  stateLabel.textContent = game.moves.length ? '局面已变化' : '观察棋形';
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
      if (highlightedStones.has(key)) button.classList.add('life-selected');
      button.addEventListener('click', () => handlePoint(row, col));
      if (stone) {
        const stoneElement = document.createElement('span');
        stoneElement.className = `stone ${stone === BLACK ? 'black-stone' : 'white-stone'}`;
        button.append(stoneElement);
      }
      if (markedEyes.has(key) && !stone) {
        const marker = document.createElement('span');
        marker.className = 'life-eye-mark';
        marker.textContent = '眼';
        button.append(marker);
      }
      if (markedVital === key) {
        const marker = document.createElement('span');
        marker.className = 'life-vital-mark';
        marker.textContent = '要点';
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