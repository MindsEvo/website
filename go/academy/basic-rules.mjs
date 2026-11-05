import {
  BLACK,
  WHITE,
  calculateAreaScore,
  createEmptyBoard,
  createGame,
  finishScoring,
  getGroupInfo,
  getGroupStones,
  passTurn,
  playStone,
  redoMove,
  resumeAfterScoring,
  undoMove
} from '../core.mjs';

const boardElement = document.getElementById('lessonBoard');
const turnDot = document.getElementById('lessonTurnDot');
const turnText = document.getElementById('lessonTurnText');
const boardHint = document.getElementById('lessonBoardHint');
const counter = document.getElementById('lessonCounter');
const feedback = document.getElementById('lessonFeedback');
const title = document.getElementById('lessonTitle');
const intro = document.getElementById('lessonIntro');
const focus = document.getElementById('lessonFocus');
const task = document.getElementById('lessonTask');
const options = document.getElementById('lessonOptions');
const explanation = document.getElementById('ruleExplanation');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const passButton = document.getElementById('lessonPassButton');
const undoButton = document.getElementById('lessonUndoButton');
const blackCaptures = document.getElementById('lessonBlackCaptures');
const whiteCaptures = document.getElementById('lessonWhiteCaptures');
const scorePanel = document.getElementById('lessonScorePanel');
const blackScoreText = document.getElementById('lessonBlackScore');
const whiteScoreText = document.getElementById('lessonWhiteScore');
const neutralScoreText = document.getElementById('lessonNeutralScore');
const confirmScoreButton = document.getElementById('lessonConfirmScore');
const resumeButton = document.getElementById('lessonResume');
const resultText = document.getElementById('lessonScoreResult');

const LESSONS = [
  {
    id: 'board', title: '棋盘与落子', focus: '规则理解与空间观察',
    intro: '围棋子落在横线与竖线的交叉点上。黑方先行，双方轮流落一子；落下的棋子不会移动。',
    task: '在棋盘上任选几个交叉点落子，观察先后顺序与棋子位置。',
    explanation: '同一个交叉点只能有一颗棋子。落子后，后续变化只会通过提子改变棋盘。',
    setup: () => createGame(9)
  },
  {
    id: 'liberties', title: '气与棋串', focus: '观察局部连接关系',
    intro: '棋子上下左右相邻的空交叉点叫作“气”。同色棋子上下左右连接成棋串后，共享这整块棋串的气。',
    task: '点击黑棋棋串，观察它包含几颗棋子、共有几口气；再点白棋比较。',
    explanation: '斜角相邻不算连接。棋串的气是整组共享的空点，不是每颗棋子各自单独计算。',
    setup: () => {
      const board = createEmptyBoard(9);
      for (const [row, col, color] of [
        [4, 3, BLACK], [4, 4, BLACK], [3, 3, WHITE], [3, 4, WHITE],
        [4, 2, WHITE], [4, 5, WHITE], [6, 4, BLACK], [6, 5, BLACK], [7, 5, WHITE]
      ]) board[row][col] = color;
      return createGame(9, { board, turn: BLACK });
    }
  },
  {
    id: 'capture', title: '提子', focus: '观察条件变化与结果',
    intro: '当一整块对方棋串的最后一口气被占据，这块棋串就被提走。提的是整块棋串，不只是最后那颗棋子。',
    task: '白棋只剩一口气。找出并占住它的最后一口气，观察白棋被提走。',
    explanation: '先找出棋串，再数它的气。落子前预测结果，落子后检查棋盘是否与预测一致。',
    setup: () => createGame(9, { board: capturePuzzle(), turn: BLACK })
  },
  {
    id: 'suicide', title: '禁入点', focus: '判断落子成立的条件',
    intro: '在本系统采用的规则中，不能下出让自己整块棋串无气、又没有提掉对方棋子的着法。',
    task: '选择一个练习情境，然后尝试目标交叉点。先预测是否合法，再观察规则检查结果。',
    explanation: '若落子同时提掉对方棋串，落子后腾出的空点会成为己方的气，因此那不是自杀着。',
    options: [
      { id: 'forbidden', label: '自杀禁入', description: '黑在四颗白棋围住的中心落子应被禁止。' },
      { id: 'capture', label: '提子后可落', description: '黑占白棋最后一口气并提子，这一手合法。' }
    ],
    setup: variant => createGame(9, { board: variant === 'capture' ? suicideCapturePuzzle() : suicidePuzzle(), turn: BLACK })
  },
  {
    id: 'ko', title: '打劫', focus: '理解重复局面的限制',
    intro: '单劫中，提劫的一方不能让对手立即回提并还原刚才的棋盘局面。通常要先到别处找劫材、应劫，再回来争劫。',
    task: '黑先在 B7 提劫；随后试着让白棋立即在 B8 回提，观察规则如何阻止局面立刻重复。',
    explanation: '打劫不是禁止以后再提回，而是禁止立即还原同一个局面。此处练习的是单劫规则。',
    setup: () => createGame(9, { board: koPuzzle(), turn: BLACK })
  },
  {
    id: 'pass', title: '停着与终局', focus: '区分回合结束与对局结束',
    intro: '“停着”表示本方这一回合不落子，并把行棋权交给对方。只有双方连续停着，才进入终局数子；一次停着并不结束棋局。',
    task: '先停着一次，再由另一方落子，观察连续停着计数被清零。之后双方连续停着，进入数子阶段。',
    explanation: '终局数子时还要确认死棋。若双方对死活有争议，可以恢复对弈继续处理。',
    setup: () => createGame(9)
  },
  {
    id: 'score', title: '数子与胜负', focus: '比较地盘并作出判断',
    intro: '本系统采用中国数子法：计算棋盘上的棋子与被一方单独包围的空点。双方都接触到的中立点不计，白方另加 7.5 目贴目。',
    task: '双方已停着。点击被包围的白棋标记死棋，观察死棋移除后，黑白地盘和胜负如何变化。',
    explanation: '死棋需要从终局局面中移除后再数子。提子数不另加到中国数子法的面积分中。',
    setup: () => {
      const board = createEmptyBoard(9);
      for (const [row, col] of [[0, 1], [1, 0], [1, 2], [2, 1]]) board[row][col] = BLACK;
      board[8][8] = WHITE;
      const game = createGame(9, { board, turn: BLACK });
      passTurn(game);
      passTurn(game);
      return game;
    }
  },
  {
    id: 'practice', title: '综合练习', focus: '观察、预测、验证与说明',
    intro: '把基础规则连起来使用：选择落点前先看棋串和气，落子后检查提子与回合变化，最后用停着进入数子。',
    task: '在空棋盘上完成一段短局。至少下四手，再让双方连续停着，进入终局数子并查看结果。',
    explanation: '每一手都可以问自己：这手是否合法？改变了哪些棋串的气？下一步会发生什么？',
    setup: () => createGame(9)
  }
];

let lesson = LESSONS[0];
let game = lesson.setup();
let variant = 'forbidden';
let selectedGroup = new Set();
let highlightedLiberties = new Set();
let deadStones = new Set();
let finalScore = null;

for (const button of document.querySelectorAll('[data-lesson]')) {
  button.addEventListener('click', () => selectLesson(button.dataset.lesson));
}
passButton.addEventListener('click', handlePass);
undoButton.addEventListener('click', () => {
  if (!undoMove(game)) return;
  clearScoringMarks();
  render();
  showFeedback('已撤销上一步。');
});
document.getElementById('lessonResetButton').addEventListener('click', resetLesson);
confirmScoreButton.addEventListener('click', () => {
  if (!game.scoring) return;
  finalScore = calculateAreaScore(game.board, game.size, deadStones);
  finishScoring(game);
  render();
  showFeedback(formatScore(finalScore), 'success');
});
resumeButton.addEventListener('click', () => {
  if (!resumeAfterScoring(game)) return;
  clearScoringMarks();
  render();
  showFeedback('已恢复对弈，可以继续处理棋局。');
});

function selectLesson(id) {
  const next = LESSONS.find(item => item.id === id);
  if (!next) return;
  lesson = next;
  variant = next.options?.[0]?.id || '';
  resetLesson();
}

function resetLesson() {
  game = lesson.setup(variant);
  selectedGroup = new Set();
  highlightedLiberties = new Set();
  deadStones = new Set();
  finalScore = null;
  renderContent();
  render();
  showFeedback(initialFeedback());
}

function renderContent() {
  const index = LESSONS.indexOf(lesson);
  title.textContent = lesson.title;
  intro.textContent = lesson.intro;
  focus.textContent = lesson.focus;
  task.textContent = lesson.task;
  explanation.innerHTML = `<strong>规则要点</strong><br>${lesson.explanation}`;
  counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(LESSONS.length).padStart(2, '0')}`;
  progressText.textContent = `第 ${index + 1} 节 / 共 ${LESSONS.length} 节`;
  progressFill.style.width = `${((index + 1) / LESSONS.length) * 100}%`;
  boardHint.textContent = lesson.id === 'board' || lesson.id === 'practice' ? '9 路自由练习' : '9 路示例局面';
  passButton.hidden = !['pass', 'score', 'practice'].includes(lesson.id);
  options.replaceChildren();
  for (const option of lesson.options || []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = option.label;
    button.setAttribute('aria-pressed', String(option.id === variant));
    button.addEventListener('click', () => {
      variant = option.id;
      resetLesson();
    });
    options.append(button);
  }
  document.querySelectorAll('[data-lesson]').forEach(button => {
    button.classList.toggle('is-current', button.dataset.lesson === lesson.id);
    button.setAttribute('aria-current', button.dataset.lesson === lesson.id ? 'step' : 'false');
  });
}

function initialFeedback() {
  if (lesson.id === 'score') return '双方已停着。观察当前分区，再试着标记白棋为死棋。';
  if (lesson.id === 'liberties') return '点击任一棋子，查看它所在棋串的共同气。';
  if (lesson.id === 'ko') return '轮到黑方；目标是 B7。';
  if (lesson.id === 'capture') return '轮到黑方；白棋仅剩 E4 一口气。';
  if (lesson.id === 'suicide') return lesson.options[0].description;
  return '选择棋盘交叉点开始练习。';
}

function handlePass() {
  if (game.finished || game.scoring || !passTurn(game)) return;
  selectedGroup.clear();
  highlightedLiberties.clear();
  render();
  showFeedback(game.scoring
    ? '双方连续停着，已进入终局数子。死棋确认后再计算胜负。'
    : `${colorName(game.moves.at(-1).color)}方停着；现在轮到${colorName(game.turn)}方。`);
}

function handlePoint(row, col) {
  if (game.scoring) {
    toggleDeadGroup(row, col);
    render();
    showFeedback('死棋标记已更新，确认结果前可以继续调整。');
    return;
  }
  if (game.finished) return;

  if (lesson.id === 'liberties') {
    const info = getGroupInfo(game.board, row, col);
    if (!info.stones.length) {
      showFeedback('这个交叉点没有棋子。点击一块黑棋或白棋查看整串的气。');
      return;
    }
    selectedGroup = new Set(info.stones.map(pointKey));
    highlightedLiberties = new Set(info.liberties.map(pointKey));
    render();
    showFeedback(`${colorName(game.board[row][col])}棋串由 ${info.stones.length} 颗棋子组成，共有 ${info.liberties.length} 口气。`);
    return;
  }

  if (lesson.id === 'capture' && !(row === 5 && col === 4)) {
    showFeedback('先预测白棋最后一口气在哪里。提示：它在棋串的正下方。');
    return;
  }
  if (lesson.id === 'ko') {
    const target = game.turn === BLACK ? [2, 1] : [1, 1];
    if (row !== target[0] || col !== target[1]) {
      showFeedback(game.turn === BLACK ? '本题先在 B7 提劫。' : '观察刚才被提的位置：白方若立即在 B8 回提，会还原刚才的局面。');
      return;
    }
  }
  if (lesson.id === 'suicide' && variant === 'forbidden' && !(row === 4 && col === 4)) {
    showFeedback('请试中心点 E5：四周都是白棋，黑棋落下后会不会有气？');
    return;
  }
  if (lesson.id === 'suicide' && variant === 'capture' && !(row === 5 && col === 4)) {
    showFeedback('请在 E4 落子，堵住白棋最后一口气并提掉它。');
    return;
  }

  const capturedBefore = game.captures[game.turn];
  const movingColor = game.turn;
  if (!playStone(game, row, col)) {
    if (lesson.id === 'suicide' && variant === 'forbidden' && row === 4 && col === 4) {
      showFeedback('这手不合法：黑棋落下后没有气，也没有提掉白棋，因此是自杀着。');
    } else if (lesson.id === 'ko' && game.turn === WHITE && row === 1 && col === 1) {
      showFeedback('规则阻止了立即回提：这会还原刚才的棋盘局面。白方需要先到别处应对。');
    } else {
      showFeedback('这手不合法。先检查交叉点是否已占用，以及棋串落子后是否还有气。');
    }
    return;
  }

  const captured = game.captures[movingColor] - capturedBefore;
  render();
  if (lesson.id === 'board') {
    showFeedback(`落子完成。现在轮到${colorName(game.turn)}方；棋子留在刚才的交叉点。`);
  } else if (lesson.id === 'capture' && captured > 0) {
    showFeedback(`正确，白方整串被提走，共 ${captured} 子。` , 'success');
  } else if (lesson.id === 'capture') {
    showFeedback('这手合法，但还没有提子。可以重置本节，再找白棋的最后一口气。');
  } else if (lesson.id === 'suicide' && variant === 'capture' && captured > 0) {
    showFeedback(`这手合法：黑棋提掉白棋 ${captured} 子后获得了气。`, 'success');
  } else if (lesson.id === 'suicide') {
    showFeedback('落子合法。观察棋串和气的变化，再试着完成本节目标。');
  } else if (lesson.id === 'ko' && movingColor === BLACK) {
    showFeedback('黑方提劫成功。轮到白方；立即在 B8 回提会被单劫规则禁止。');
  } else if (lesson.id === 'practice' && game.moves.filter(move => !move.pass).length >= 4) {
    showFeedback('已完成四手合法落子。还可以继续练习，或双方停着后进入数子。', 'success');
  } else {
    showFeedback('落子合法。观察这手棋怎样改变相邻棋串的气。');
  }
}

function toggleDeadGroup(row, col) {
  const group = getGroupStones(game.board, row, col);
  if (!group.length) return;
  const keys = group.map(pointKey);
  const remove = keys.every(key => deadStones.has(key));
  for (const key of keys) {
    if (remove) deadStones.delete(key);
    else deadStones.add(key);
  }
}

function pointKey(point) {
  return `${point.row},${point.col}`;
}

function renderBoard() {
  boardElement.replaceChildren();
  boardElement.style.setProperty('--size', game.size);
  boardElement.setAttribute('aria-label', `${game.size} 路基础规则练习棋盘`);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('go-grid');
  svg.setAttribute('viewBox', '0 0 1000 1000');
  svg.setAttribute('aria-hidden', 'true');
  const margin = 40;
  const step = (1000 - margin * 2) / (game.size - 1);
  for (let index = 0; index < game.size; index += 1) {
    const offset = margin + index * step;
    appendLine(svg, margin, offset, 1000 - margin, offset);
    appendLine(svg, offset, margin, offset, 1000 - margin);
  }
  for (const point of [2, 4, 6]) {
    const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    star.setAttribute('cx', margin + point * step);
    star.setAttribute('cy', margin + point * step);
    star.setAttribute('r', '8');
    star.setAttribute('fill', '#3d3324');
    svg.append(star);
  }
  for (let col = 0; col < game.size; col += 1) {
    addBoardCoordinate(coordinateName(col), `${4 + (92 * col / (game.size - 1))}%`, '1.2%', 'file-coordinate');
  }
  for (let row = 0; row < game.size; row += 1) {
    addBoardCoordinate(String(game.size - row), '1.2%', `${4 + (92 * row / (game.size - 1))}%`, 'rank-coordinate');
  }
  boardElement.append(svg);

  const liberties = new Set(highlightedLiberties);
  for (let row = 0; row < game.size; row += 1) {
    for (let col = 0; col < game.size; col += 1) {
      const key = `${row},${col}`;
      const stone = game.board[row][col];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'intersection lesson-intersection';
      button.style.left = `${4 + (92 * col / (game.size - 1))}%`;
      button.style.top = `${4 + (92 * row / (game.size - 1))}%`;
      button.setAttribute('aria-label', `${coordinateName(col)} ${game.size - row}${stone ? `，${colorName(stone)}棋${deadStones.has(key) ? '，标记死棋' : ''}` : ', 空位'}`);
      if (selectedGroup.has(key)) button.classList.add('group-selected');
      if (deadStones.has(key)) button.classList.add('dead-selected');
      button.disabled = game.finished || (game.scoring ? !stone : false);
      button.addEventListener('click', () => handlePoint(row, col));

      if (stone) {
        const stoneElement = document.createElement('span');
        stoneElement.className = `stone ${stone === BLACK ? 'black-stone' : 'white-stone'}`;
        button.append(stoneElement);
      }
      if (game.lastMove?.row === row && game.lastMove?.col === col) {
        const lastMark = document.createElement('span');
        lastMark.className = `last-mark${stone === BLACK ? ' on-black' : ''}`;
        button.append(lastMark);
      }
      if (liberties.has(key) && !stone) {
        const liberty = document.createElement('span');
        liberty.className = 'liberty-mark';
        button.append(liberty);
      }
      if (deadStones.has(key)) {
        const deadMark = document.createElement('span');
        deadMark.className = 'dead-mark';
        deadMark.textContent = '×';
        button.append(deadMark);
      }
      boardElement.append(button);
    }
  }
}

function renderScore() {
  scorePanel.hidden = !game.scoring && !game.finished;
  if (scorePanel.hidden) return;
  const score = calculateAreaScore(game.board, game.size, deadStones);
  blackScoreText.textContent = `${score.blackArea} 目`;
  whiteScoreText.textContent = `${score.whiteArea} + ${score.komi.toFixed(1)} = ${score.whiteScore.toFixed(1)} 目`;
  neutralScoreText.textContent = `${score.neutralPoints} 目`;
  resultText.hidden = !finalScore;
  resultText.textContent = finalScore ? formatScore(finalScore) : '';
  confirmScoreButton.hidden = !game.scoring;
  resumeButton.hidden = !game.scoring;
}

function appendLine(svg, x1, y1, x2, y2) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', '#59492f');
  line.setAttribute('stroke-width', '2.2');
  svg.append(line);
}

function addBoardCoordinate(text, left, top, className) {
  const label = document.createElement('span');
  label.className = `board-coordinate ${className}`;
  label.textContent = text;
  label.style.left = left;
  label.style.top = top;
  label.setAttribute('aria-hidden', 'true');
  boardElement.append(label);
}

function showFeedback(text, state = '') {
  feedback.textContent = text;
  feedback.className = `rule-note${state ? ` ${state}` : ''}`;
}

function coordinateName(col) {
  return String.fromCharCode(65 + col + (col >= 8 ? 1 : 0));
}

function colorName(color) {
  return color === BLACK ? '黑' : '白';
}

function formatScore(score) {
  if (!score.winner) return `和棋：黑 ${score.blackScore.toFixed(1)} 目，白 ${score.whiteScore.toFixed(1)} 目。`;
  return `${colorName(score.winner)}方胜 ${score.difference.toFixed(1)} 目（黑 ${score.blackScore.toFixed(1)}，白 ${score.whiteScore.toFixed(1)}，含 7.5 贴目）。`;
}

function capturePuzzle() {
  const board = createEmptyBoard(9);
  board[4][4] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][5] = BLACK;
  return board;
}

function suicidePuzzle() {
  const board = createEmptyBoard(9);
  for (const [row, col] of [[3, 4], [4, 3], [4, 5], [5, 4]]) board[row][col] = WHITE;
  return board;
}

function suicideCapturePuzzle() {
  const board = createEmptyBoard(9);
  board[4][4] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][5] = BLACK;
  return board;
}

function koPuzzle() {
  const board = createEmptyBoard(9);
  board[1][1] = WHITE;
  board[0][1] = BLACK;
  board[1][0] = BLACK;
  board[1][2] = BLACK;
  board[3][1] = WHITE;
  board[2][0] = WHITE;
  board[2][2] = WHITE;
  return board;
}

function scoringPuzzle() {
  const board = createEmptyBoard(9);
  for (const [row, col] of [[0, 1], [1, 0], [1, 2], [2, 1]]) board[row][col] = BLACK;
  board[8][8] = WHITE;
  const position = createGame(9, { board });
  passTurn(position);
  passTurn(position);
  return position;
}

function render() {
  const index = LESSONS.indexOf(lesson);
  renderBoard();
  renderScore();
  turnDot.className = `turn-dot ${game.turn === BLACK ? 'black-turn' : 'white-turn'}`;
  turnText.textContent = game.scoring ? '终局数子' : game.finished ? '本节完成' : `${colorName(game.turn)}方行棋`;
  boardHint.textContent = '9 路练习棋盘';
  counter.textContent = `${String(index + 1).padStart(2, '0')} / 08`;
  progressText.textContent = `第 ${index + 1} 节 / 共 8 节`;
  progressFill.style.width = `${((index + 1) / 8) * 100}%`;
  blackCaptures.textContent = game.captures[BLACK];
  whiteCaptures.textContent = game.captures[WHITE];
  undoButton.disabled = !game.history.length || game.finished;
  passButton.disabled = !['pass', 'score', 'practice'].includes(lesson.id) || game.scoring || game.finished;
  scorePanel.hidden = !game.scoring && !game.finished;
  document.querySelectorAll('[data-lesson]').forEach(button => {
    button.classList.toggle('is-current', button.dataset.lesson === lesson.id);
    button.setAttribute('aria-current', button.dataset.lesson === lesson.id ? 'step' : 'false');
  });
}

resetLesson();
