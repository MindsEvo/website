import {
  BLACK,
  WHITE,
  calculateAreaScore,
  createEmptyBoard,
  createGame,
  finishScoring,
  getGroupInfo,
  passTurn,
  playStone,
  undoMove
} from '../core.mjs';

const BOARD_SIZE = 9;
const COLUMNS = 'ABCDEFGHJ';
const boardElement = document.getElementById('endgameBoard');
const turnDot = document.getElementById('endgameTurnDot');
const turnText = document.getElementById('endgameTurnText');
const stateLabel = document.getElementById('endgameStateLabel');
const counter = document.getElementById('endgameCounter');
const feedback = document.getElementById('endgameFeedback');
const title = document.getElementById('endgameTitle');
const intro = document.getElementById('endgameIntro');
const focus = document.getElementById('endgameFocus');
const task = document.getElementById('endgameTask');
const options = document.getElementById('endgameOptions');
const explanation = document.getElementById('endgameExplanation');
const progress = document.getElementById('endgameProgress');
const progressFill = document.getElementById('endgameProgressFill');
const blackCaptures = document.getElementById('endgameBlackCaptures');
const whiteCaptures = document.getElementById('endgameWhiteCaptures');
const undoButton = document.getElementById('endgameUndoButton');
const passButton = document.getElementById('endgamePassButton');
const scorePanel = document.getElementById('endgameScorePanel');
const blackAreaText = document.getElementById('endgameBlackArea');
const whiteAreaText = document.getElementById('endgameWhiteArea');
const neutralText = document.getElementById('endgameNeutral');
const scoreResult = document.getElementById('endgameResult');
const confirmScoreButton = document.getElementById('endgameConfirmScore');

function neutralStripBoard() {
  const board = createEmptyBoard(BOARD_SIZE);
  board[3].fill(BLACK);
  board[5].fill(WHITE);
  return board;
}

const LESSONS = [
  {
    id: 'neutral', title: '中立点与边界', focus: '识别双方都接触的空点',
    intro: '黑白棋块之间的空点若同时接触双方，在中国数子中属于中立点，尚未计入任一方地盘。',
    task: '点击中间一行的空点，查看当前黑地、白地和中立点数量。',
    explanation: '本例用两条边界线围出一排中立点。数子依据双方棋子与单方包围的空点，不把中立点分给任何一方。',
    setup: () => createGame(BOARD_SIZE, { board: neutralStripBoard() }),
    inspectNeutral: true
  },
  {
    id: 'value', title: '官子目数', focus: '落子后计算地盘变化',
    intro: '在中立点落子后，该点成为己方棋子，不再是中立点。按本系统的中国数子法，这一手会增加一目己方地盘。',
    task: '黑方在 E5 占住一个中立点，比较落子前后的黑方地盘与中立点数。',
    explanation: '本例局部显示黑地 +1、中立点 -1。若比较“黑占”与“白占”两种不同结果，双方分差会相差两目；这不是单手直接得两目。',
    setup: () => createGame(BOARD_SIZE, { board: neutralStripBoard() }),
    target: [4, 4],
    result: 'area-value'
  },
  {
    id: 'sente', title: '先手与后手', focus: '识别迫使对手应手的官子',
    intro: '若一手棋不应对就会立即承受明显损失，对手通常需要先回应；但先手与后手的价值仍要结合后续大小判断。',
    task: '按次序演示：黑 E4 打吃，白 D5 延气。观察黑棋如何迫使白方回应。',
    explanation: '本例展示的是局部强制应手，不是所有打吃都自动成为好官子。若对方可以弃子或取得更大收益，仍需重新比较。',
    setup: () => createGame(BOARD_SIZE, { board: boardFrom([[4, 4, WHITE], [3, 4, BLACK], [4, 5, BLACK]]) }),
    sequence: [[BLACK, 5, 4], [WHITE, 4, 3]],
    result: 'forcing'
  },
  {
    id: 'priority', title: '大小比较', focus: '核实落点实际改变了什么',
    intro: '比较官子时，不要只看空点看起来有多大；要看双方应手后，哪些地盘真正归属发生变化。',
    task: '黑方占一个双方接触的中立点。按中国数子法，黑方当下地盘增加多少？',
    explanation: '棋子本身计入己方地盘，中立区域同时缩小。本例单手使黑方增加一目；对手若占相邻中立点，则另计其自身地盘。',
    options: [
      { id: 'one', label: '增加 1 目' },
      { id: 'two', label: '直接增加 2 目' }
    ],
    answer: 'one',
    setup: () => createGame(BOARD_SIZE, { board: neutralStripBoard() })
  },
  {
    id: 'count', title: '终局数子', focus: '双方停着后确认地盘',
    intro: '双方连续停着后进入数子。确认死棋与中立点后，按中国数子法统计双方地盘，白方另加 7.5 目贴目。',
    task: '双方依次点击“停着”两次，进入数子并查看黑白地盘、中立点与贴目。',
    explanation: '本练习局面没有待处理的死棋。真实对局若对死活有争议，应先协商或恢复对弈，再确认结果。',
    setup: () => createGame(BOARD_SIZE, { board: neutralStripBoard() }),
    passMode: true
  },
  {
    id: 'review', title: '综合取舍', focus: '结合应手和全盘优先级',
    intro: '判断一处官子时，既要估算地盘变化，也要看它是否先手、双方回应后还剩什么，以及全盘是否有更急的棋。',
    task: '选择比较官子大小时更完整的判断方式。',
    explanation: '没有脱离全盘的固定次序。先手、后手、目数和对局目标一起决定实际价值。',
    options: [
      { id: 'fixed-order', label: '任何时候都先下看起来最大的空点' },
      { id: 'evaluate', label: '计算双方应手后的收益，再排全盘优先级' }
    ],
    answer: 'evaluate',
    setup: () => createGame(BOARD_SIZE, { board: neutralStripBoard() })
  }
];

let lesson = LESSONS[0];
let game = lesson.setup();
let answered = false;
let completed = false;
let highlightedStones = new Set();

document.querySelectorAll('[data-endgame-lesson]').forEach(button => {
  button.addEventListener('click', () => selectLesson(button.dataset.endgameLesson));
});
options.addEventListener('click', event => {
  const button = event.target.closest('[data-answer]');
  if (!button || answered) return;
  const correct = button.dataset.answer === lesson.answer;
  button.classList.add(correct ? 'answer-correct' : 'answer-wrong');
  if (!correct) {
    showFeedback('再比较一下：官子价值取决于实际地盘变化和双方后续。');
    return;
  }
  answered = true;
  completed = true;
  options.querySelectorAll('[data-answer]').forEach(option => { option.disabled = true; });
  render();
  showFeedback('判断正确。官子要计算回应后的实际收益，再看全盘次序。', 'success');
});
undoButton.addEventListener('click', () => {
  if (!undoMove(game)) return;
  completed = false;
  highlightedStones = new Set();
  render();
  showFeedback('已撤销上一步。');
});
passButton.addEventListener('click', handlePass);
document.getElementById('endgameResetButton').addEventListener('click', resetLesson);
confirmScoreButton.addEventListener('click', () => {
  if (!game.scoring || !finishScoring(game)) return;
  completed = true;
  render();
  showFeedback(formatScore(calculateAreaScore(game.board, game.size)), 'success');
});

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
  explanation.innerHTML = `<strong>官子要点</strong><br>${lesson.explanation}`;
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
  document.querySelectorAll('[data-endgame-lesson]').forEach(button => {
    const current = button.dataset.endgameLesson === lesson.id;
    button.classList.toggle('is-current', current);
    button.setAttribute('aria-current', current ? 'step' : 'false');
  });
}

function startMessage() {
  if (lesson.id === 'neutral') return '点击中间一行的空点，查看中立点与地盘。';
  if (lesson.id === 'value') return '黑方行棋：在 E5 占住一个中立点。';
  if (lesson.id === 'sente') return '黑方先行：在 E4 打吃。';
  if (lesson.id === 'priority') return '先计算黑棋实际增加的地盘。';
  if (lesson.id === 'count') return '黑方先停着；再由白方停着进入数子。';
  return '先估算大小，再考虑先手与全盘急所。';
}

function handlePoint(row, col) {
  if (completed) {
    showFeedback('本节已完成。可以悔棋重做，或切换到下一小节。', 'success');
    return;
  }
  if (lesson.answer && !answered) {
    showFeedback('先选择判断，再继续观察棋盘。');
    return;
  }
  if (lesson.inspectNeutral) {
    if (row !== 4 || game.board[row][col]) {
      showFeedback('请点击中间一行的中立空点。');
      return;
    }
    highlightedStones = new Set([`${row},${col}`]);
    completed = true;
    const score = calculateAreaScore(game.board, game.size);
    render();
    showFeedback(`这个空点仍属中立。当前黑地 ${score.blackArea}、白地 ${score.whiteArea}、中立 ${score.neutralPoints} 点。`, 'success');
    return;
  }
  if (lesson.sequence) {
    handleSequenceMove(row, col);
    return;
  }
  const [targetRow, targetCol] = lesson.target || [];
  if (row !== targetRow || col !== targetCol) {
    showFeedback(`本节关键点是 ${coordinateName(targetCol)}${game.size - targetRow}。`);
    return;
  }
  const scoreBefore = lesson.result === 'area-value' ? calculateAreaScore(game.board, game.size) : null;
  if (!playStone(game, row, col)) {
    showFeedback('这手不合法。检查目标点是否空着，以及落子后棋串是否有气。');
    return;
  }
  highlightedStones = new Set([pointKey({ row, col })]);
  completed = true;
  render();
  if (lesson.result === 'area-value') {
    const scoreAfter = calculateAreaScore(game.board, game.size);
    showFeedback(`黑方地盘从 ${scoreBefore.blackArea} 增至 ${scoreAfter.blackArea}，增加 ${scoreAfter.blackArea - scoreBefore.blackArea} 目；中立点减少 ${scoreBefore.neutralPoints - scoreAfter.neutralPoints} 个。`, 'success');
  } else {
    showFeedback('官子落子完成。比较局面时要继续考虑对方最有力的应手。', 'success');
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
    showFeedback('这手不合法。请重置本节并检查局部气数。');
    return;
  }
  highlightedStones = new Set([pointKey({ row, col })]);
  render();
  if (index === lesson.sequence.length - 1) {
    completed = true;
    const info = getGroupInfo(game.board, 4, 4);
    showFeedback(`白棋应手后由 ${info.stones.length} 子组成，共有 ${info.liberties.length} 口气。是否值得应对，还要结合棋块价值与全盘局势。`, 'success');
    return;
  }
  const next = lesson.sequence[index + 1];
  if (index === 0) {
    const info = getGroupInfo(game.board, 4, 4);
    showFeedback(`黑棋打吃后，白棋只剩 ${info.liberties.length} 口气；此处不应轻易忽略。`);
  } else {
    showFeedback(`第 ${index + 1} / ${lesson.sequence.length} 手完成，接下来${colorName(next[0])}方行棋。`);
  }
}

function handlePass() {
  if (lesson.id !== 'count' || game.finished || !passTurn(game)) return;
  render();
  showFeedback(game.scoring
    ? '双方连续停着，进入终局数子。查看右侧地盘、中立点与贴目。'
    : `${colorName(game.moves.at(-1).color)}方停着；现在轮到${colorName(game.turn)}方。`);
}

function render() {
  renderBoard();
  turnDot.className = `turn-dot ${game.turn === BLACK ? 'black-turn' : 'white-turn'}`;
  turnText.textContent = game.scoring || game.finished ? '终局数子' : `${colorName(game.turn)}方行棋`;
  stateLabel.textContent = game.finished ? '计分完成' : game.scoring ? '核对地盘' : completed ? '本节完成' : lesson.sequence ? `第 ${game.moves.length + 1} 手` : '观察终局';
  blackCaptures.textContent = game.captures[BLACK];
  whiteCaptures.textContent = game.captures[WHITE];
  undoButton.disabled = game.history.length === 0;
  passButton.hidden = lesson.id !== 'count' || game.scoring || game.finished;
  scorePanel.hidden = lesson.id !== 'count' || (!game.scoring && !game.finished);
  if (!scorePanel.hidden) renderScorePanel();
}

function renderScorePanel() {
  const score = calculateAreaScore(game.board, game.size);
  blackAreaText.textContent = `${score.blackArea} 目`;
  whiteAreaText.textContent = `${score.whiteArea} + ${score.komi} = ${score.whiteScore} 目`;
  neutralText.textContent = `${score.neutralPoints} 目`;
  scoreResult.textContent = game.finished ? formatScore(score) : '数子完成后，请确认双方对死活和中立点没有争议。';
  confirmScoreButton.hidden = game.finished;
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
    for (const [starRow, starCol] of [[point, point], [point, 8 - point], [8 - point, point], [8 - point, 8 - point]]) {
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
      if (highlightedStones.has(key)) button.classList.add('endgame-selected');
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

function formatScore(score) {
  if (score.winner === null) return `双方和棋：黑白均 ${score.blackScore} 目。`;
  const winner = score.winner === BLACK ? '黑' : '白';
  return `${winner}方胜 ${score.difference} 目。`;
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