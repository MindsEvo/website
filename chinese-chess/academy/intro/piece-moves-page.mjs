import { BLACK, RED, createEmptyBoard, createGame, createInitialBoard, getGameStatus, getLegalMoves, getPieceLabel, isInCheck, makeMove } from '../../core.mjs';
import {
  appendStandardPositionMark,
  createStandardBoardArtwork,
  createStandardPieceElement,
  isCannonStartPosition,
  isPawnStartPosition,
  placeStandardIntersection
} from '../../board-standard.mjs';
import { applyBoardStyle, onBoardStyleChange } from '../../board-style.mjs';

applyBoardStyle();
onBoardStyleChange(() => {});

const OBSERVATION_ITEMS = [
  { type: 'K', label: '将帅', color: '#ff6a00', description: '将帅只能在九宫内沿横线或竖线走一格，不能在同一路上无遮挡相见。' },
  { type: 'A', label: '士', color: '#965fff', description: '红方称仕，黑方称士，只能在各自九宫内斜走一格，不能横走、竖走或出九宫。' },
  { type: 'E', label: '象', color: '#263c90', description: '象相斜走两格，不可过河，且象眼不能受阻。' },
  { type: 'H', label: '马', color: '#126c38', description: '马走日字，靠近方向的马腿被挡时不能走。' },
  { type: 'R', label: '车', color: '#fb3159', description: '车沿横线或竖线走，路径不可有棋子阻挡。' },
  { type: 'C', label: '炮', color: '#842d16', description: '炮不吃子时直线行走；吃子时必须隔一个炮架。' },
  { type: 'P', label: '兵卒', color: '#ff9d00', description: '兵卒只能前进；过河后可以横走，不能后退。' }
];

const QUIZ_ITEMS = [
  { type: 'R', label: '车', text: '车如何行走？', options: ['沿横线或竖线走，不能越子', '斜走两格', '走日字'], answer: 0, explanation: '车沿横线或竖线行走，途中不能有棋子阻挡。' },
  { type: 'H', label: '马', text: '马走什么形状？', options: ['田字', '日字，且要注意马腿', '直线任意格'], answer: 1, explanation: '马走日字，马腿被挡住时不能走。' },
  { type: 'C', label: '炮', text: '炮吃子时需要什么条件？', options: ['不需要炮架', '隔一个棋子作炮架', '隔两个棋子'], answer: 1, explanation: '炮吃子时，炮与目标之间必须恰好隔一个棋子。' },
  { type: 'K', label: '将帅', text: '将帅可以在哪个范围内行走？', options: ['九宫内', '整个棋盘', '只能在河界附近'], answer: 0, explanation: '将帅受九宫限制，每次沿横线或竖线走一格。' },
  { type: 'A', label: '士', text: '士仕如何行走？', options: ['斜走一格且不出九宫', '直走两格', '走日字'], answer: 0, explanation: '士仕在九宫内沿斜线走一格。' },
  { type: 'E', label: '象', text: '象相可以过河吗？', options: ['可以', '不可以', '只有红方可以'], answer: 1, explanation: '象相不能过河，且走田字时象眼不能受阻。' },
  { type: 'P', label: '兵卒', text: '兵卒过河后可以怎样走？', options: ['可以后退', '可以横走但不能后退', '可以斜走'], answer: 1, explanation: '兵卒过河后可以横走，但始终不能后退。' }
];
const CAPTURE_EXAMPLES = {
  K: [
    { from: [8, 4], to: [7, 4], text: '将帅在九宫内向前走一格，吃掉对方棋子。' },
    { from: [8, 4], to: [8, 3], target: 'h', text: '将帅在九宫内横走一格吃子，不能斜走或走出九宫。' }
  ],
  A: [
    { from: [8, 4], to: [7, 3], text: '士仕在九宫内斜走一格，吃掉对方棋子。' },
    { from: [8, 4], to: [7, 5], text: '换一条九宫斜线，斜走一格吃子。' }
  ],
  E: [
    { from: [9, 2], to: [7, 4], text: '相象沿斜线走两格吃子，象眼必须空着。' },
    { from: [7, 4], to: [5, 2], text: '相象走田字吃子，不能过河，也不能越过象眼上的棋子。' }
  ],
  H: [
    { from: [7, 2], to: [5, 1], text: '马走日字吃子，先直走一格的位置不能有棋子挡住。' },
    { from: [7, 2], to: [6, 4], text: '先横走一格，再斜走一格吃子，马腿必须畅通。' }
  ],
  R: [
    { from: [7, 2], to: [7, 6], text: '车沿横线走到对方棋子的位置吃子，途中不能有棋子阻挡。' },
    { from: [7, 2], to: [4, 2], text: '车沿竖线吃子，可以走任意格，但不能越子。' }
  ],
  C: [
    { from: [7, 1], to: [3, 1], target: 'h', screen: [5, 1], text: '炮沿竖线吃子，炮和目标之间必须恰好隔一个棋子作炮架。黄色描边标出了炮架。' },
    { from: [7, 1], to: [7, 7], target: 'h', screen: [7, 4], text: '炮沿横线隔着炮架吃子。没有炮架，或者隔着两个棋子，都不能这样吃子。' }
  ],
  P: [
    { from: [6, 2], to: [5, 2], text: '兵卒过河前向前走一格吃子，不能斜着吃，也不能横着吃。' },
    { from: [4, 2], to: [3, 2], text: '过河后仍然可以向前走一格吃子，不能后退。' },
    { from: [4, 2], to: [4, 3], target: 'h', text: '过河后也可以横走一格吃子。中国象棋的兵卒吃子方向和走法相同。' }
  ]
};
const content = document.getElementById('boardLessonContent');
const board = document.getElementById('teachingBoard');

export function initPieceMovesPage(lesson) {
  document.getElementById('boardCourseTitle').textContent = `${lesson.number}. ${lesson.title}`;
  document.querySelector('.board-course-back').textContent = '返回课程介绍';
  document.getElementById('boardDisplayApp').setAttribute('aria-label', '棋子走法课程');
  document.getElementById('teachingBoard').setAttribute('aria-label', '棋子走法演示棋盘');
  document.getElementById('boardLessonStatus').hidden = true;
  document.getElementById('boardLessonContent').replaceChildren();
  document.getElementById('boardToolbar').hidden = false;

  stopAutomaticObservation();
  mode = 'practice';
  game = createGame();
  renderBoard();
  renderObservationButtons();
  renderPracticePanel();
  renderQuizButtons();
}

let game = createGame();
let mode = 'practice';
let activeObservation = null;
let activePiece = null;
let legalTargets = [];
let selectedQuestion = null;
let practiceNote = null;
let activeMovePractice = null;
let capturePractice = null;
let observationTargets = [];
let observationMoves = [];
let observationTimer = null;
let observationPath = [];
let observationOrigins = [];
let kingFacingWarning = false;
let elephantEyes = [];
let elephantForbidden = [];
let horseLegs = [];
let horseForbidden = [];
let horseDiagonal = [];
let pawnForbidden = [];
let captureScreens = [];
let observationGeneration = 0;
let speechGeneration = 0;
let speechQueue = Promise.resolve(true);
let speechFinish = null;
let speechGapTimer = null;
let currentSpeech = null;
window.addEventListener('pagehide', stopAutomaticObservation);

function renderBoard() {
  const board = document.getElementById('teachingBoard');
  const artwork = createStandardBoardArtwork('teaching-lines xiangqi-grid-svg');
  if (activeObservation?.type === 'K' || activeObservation?.type === 'A') {
    for (const row of [0, 7]) {
      const palace = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      palace.setAttribute('class', activeObservation.type === 'A' ? 'advisor-observation-palace' : 'king-observation-palace');
      palace.setAttribute('x', '3');
      palace.setAttribute('y', String(row));
      palace.setAttribute('width', '2');
      palace.setAttribute('height', '2');
      artwork.prepend(palace);
    }
    if (kingFacingWarning) {
      const facingLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      facingLine.setAttribute('class', 'king-facing-line');
      facingLine.setAttribute('d', 'M4 0V9');
      artwork.append(facingLine);
    }
  }
  if (['A', 'P'].includes(activeObservation?.type) && observationPath.length === 4) {
    const route = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    route.setAttribute('class', activeObservation.type === 'P' ? 'pawn-observation-route' : 'advisor-observation-route');
    route.setAttribute('d', [0, 2].map(index => {
      const from = observationPath[index];
      const to = observationPath[index + 1];
      return `M${from.col} ${from.row}L${to.col} ${to.row}`;
    }).join(' '));
    artwork.append(route);
  }
  if (board.dataset.capturePiece && ['K', 'R', 'C'].includes(activeObservation?.type) && observationPath.length === 4) {
    const route = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    route.setAttribute('class', 'capture-observation-route');
    route.setAttribute('d', [0, 2].map(index => {
      const from = observationPath[index];
      const to = observationPath[index + 1];
      return `M${from.col} ${from.row}L${to.col} ${to.row}`;
    }).join(' '));
    artwork.append(route);
  }
  if (activeObservation?.type === 'H' && observationPath.length === 6) {
    const route = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    route.setAttribute('class', 'horse-observation-route');
    route.setAttribute('d', [0, 3].map(index => {
      const from = observationPath[index];
      const leg = observationPath[index + 1];
      const to = observationPath[index + 2];
      return `M${from.col} ${from.row}L${leg.col} ${leg.row}L${to.col} ${to.row}`;
    }).join(' '));
    artwork.append(route);
  }
  if (activeObservation?.type === 'E') {
    if (board.dataset.elephantRule === 'river') {
      const river = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      river.setAttribute('class', 'elephant-observation-river');
      river.setAttribute('x', '0');
      river.setAttribute('y', '4');
      river.setAttribute('width', '8');
      river.setAttribute('height', '1');
      artwork.prepend(river);
    }
    if (observationPath.length === 6) {
      const route = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      route.setAttribute('class', 'elephant-observation-route');
      route.setAttribute('d', [0, 3].map(index => {
        const from = observationPath[index];
        const to = observationPath[index + 2];
        return `M${from.col} ${from.row}L${to.col} ${to.row}`;
      }).join(' '));
      artwork.append(route);
    }
  }
  board.replaceChildren(artwork);
  const targetKeys = new Set(legalTargets.map(position => `${position.row},${position.col}`));
  const observationTargetKeys = new Set(observationTargets.map(position => `${position.row},${position.col}`));
  const pathKeys = new Set(observationPath.map(position => `${position.row},${position.col}`));

  for (let row = 0; row < game.board.length; row += 1) {
    for (let col = 0; col < game.board[row].length; col += 1) {
      const piece = game.board[row][col];
      const square = document.createElement('div');
      square.className = 'teaching-square xiangqi-intersection';
      placeStandardIntersection(square, row, col);
      square.dataset.row = String(row);
      square.dataset.col = String(col);
      square.dataset.piece = piece || '';
      if (capturePractice?.actors.some(actor => samePosition(actor, { row, col }))) {
        square.classList.add('practice-capture-actor');
        square.title = '练习棋子';
      }
      if (capturePractice?.targets.some(target => samePosition(target, { row, col }))) {
        square.classList.add('practice-capture-goal');
        square.title = '吃子目标';
      }
      if (elephantEyes.some(eye => eye.row === row && eye.col === col)) square.classList.add('elephant-eye');
      if (elephantForbidden.some(target => target.row === row && target.col === col)) square.classList.add('elephant-forbidden');
      if (horseLegs.some(leg => leg.row === row && leg.col === col)) square.classList.add('horse-leg');
      if (horseForbidden.some(target => target.row === row && target.col === col)) square.classList.add('horse-forbidden');
      if (horseDiagonal.some(target => target.row === row && target.col === col)) square.classList.add('horse-diagonal-obstacle');
      if (pawnForbidden.some(target => target.row === row && target.col === col)) square.classList.add('pawn-forbidden');
      if (captureScreens.some(screen => screen.row === row && screen.col === col)) square.classList.add('capture-screen');
      if (pathKeys.has(`${row},${col}`)) square.classList.add('piece-observation-path');
      if ((activePiece && activePiece.row === row && activePiece.col === col)
        || observationOrigins.some(origin => origin.row === row && origin.col === col)) square.classList.add('piece-move-origin');
      if (kingFacingWarning && piece?.toUpperCase() === 'K') square.classList.add('king-facing-piece');
      if (targetKeys.has(`${row},${col}`)) square.classList.add(piece ? 'demo-capture-target' : 'demo-move-target');
      if (observationTargetKeys.has(`${row},${col}`)) square.classList.add(piece ? 'demo-capture-target' : 'demo-move-target');
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 路`
        : `空位，第 ${row + 1} 行第 ${col + 1} 路`);
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'teaching-piece'));
      if (activeObservation && piece?.toUpperCase() === activeObservation.type
        && (!board.dataset.capturePiece || observationOrigins.some(origin => origin.row === row && origin.col === col))) square.classList.add('piece-observation-target');
      square.addEventListener('click', () => handleBoardClick(row, col));
      board.append(square);
    }
  }
  document.querySelector('.teaching-side-label').textContent = activeMovePractice
    ? capturePractice ? `${game.turn === RED ? '红方' : '黑方'}走棋` : `${activeMovePractice.label}走法练习` : activeObservation?.type === 'K'
    ? '将帅走法演示' : activeObservation?.type === 'A' ? '红仕与黑士走法演示'
      : activeObservation?.type === 'E' ? '相象走法演示'
        : activeObservation?.type === 'H' ? '马走法演示'
          : activeObservation?.type === 'P' ? '兵卒走法演示' : `${game.turn === RED ? '红方' : '黑方'}走棋`;
}

function renderObservationButtons() {
  const container = document.getElementById('observationButtons');
  container.replaceChildren();
  for (const item of OBSERVATION_ITEMS) {
    const dropdown = document.createElement('details');
    dropdown.className = 'piece-practice-dropdown piece-observation-dropdown';
    dropdown.setAttribute('name', 'piece-observation');
    dropdown.style.setProperty('--button-color', item.color);
    const summary = document.createElement('summary');
    summary.className = 'observation-button';
    summary.textContent = item.label;
    summary.dataset.observePiece = item.type;
    const menu = document.createElement('div');
    menu.className = 'piece-practice-menu';
    const demos = [['walk', '走法演示']];
    if (item.type === 'K') demos.push(['facing', '将帅不能见面']);
    if (item.type === 'H') demos.push(['leg', '蹩马腿演示']);
    if (item.type === 'E') demos.push(['eye', '蹩象眼演示']);
    demos.push(['capture', '吃子演示']);
    for (const [demo, label] of demos) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'piece-observation-option';
      option.dataset.observationDemo = demo;
      if (demo === 'capture') option.dataset.capturePiece = item.type;
      if (item.type === 'K') option.dataset.kingDemo = demo;
      else if (item.type === 'H') option.dataset.horseDemo = demo;
      else if (item.type === 'E') option.dataset.elephantDemo = demo;
      option.textContent = label;
      option.addEventListener('click', () => {
        dropdown.open = false;
        startObservation(item, summary, demo);
      });
      menu.append(option);
    }
    dropdown.append(summary, menu);
    container.append(dropdown);
  }
}

function startObservation(item, selectedButton, observationDemo = 'walk') {
  stopAutomaticObservation();
  document.querySelectorAll('#observationButtons details').forEach(dropdown => { dropdown.open = false; });
  clearPracticeButtonStates();
  activeObservation = item;
  mode = 'observe';
  activePiece = null;
  selectedQuestion = null;
  legalTargets = [];
  observationTargets = [];
  observationMoves = [];
  game = createPieceDemoGame(item.type);
  board.style.setProperty('--piece-demo-color', item.color);
  board.dataset.observation = item.type;
  if (['R', 'K', 'A', 'E', 'H', 'C', 'P'].includes(item.type)) {
    document.querySelectorAll('#observationButtons .observation-button').forEach(button => button.classList.toggle('active', button === selectedButton));
    clearQuizButtons();
    if (observationDemo === 'capture') {
      showCaptureObservationStep(item.type, 0);
      return;
    }
    if (item.type === 'K') {
      if (observationDemo === 'facing') showKingFacingRule(true);
      else {
        const position = createEmptyBoard();
        position[9][3] = 'K';
        position[0][5] = 'k';
        position[5][4] = 'P';
        game = createGame({ board: position });
        board.dataset.kingRule = 'walk';
        showKingObservationStep(0);
      }
    } else if (item.type === 'A') {
      const position = createEmptyBoard();
      position[9][4] = 'K';
      position[0][4] = 'k';
      position[5][4] = 'P';
      position[8][4] = 'A';
      position[1][4] = 'a';
      game = createGame({ board: position });
      showAdvisorObservationStep(0);
    } else if (item.type === 'E') {
      if (observationDemo === 'eye') showElephantRule('eye');
      else startElephantObservation();
    } else if (item.type === 'H') {
      if (observationDemo === 'leg') showHorseLegRule('leg');
      else startHorseObservation();
    } else if (item.type === 'P') {
      showPawnObservationStep(0);
    }
    else showStraightObservationStep(item.type, 0);
    return;
  }
  for (let row = 0; row < game.board.length; row += 1) {
    for (let col = 0; col < game.board[row].length; col += 1) {
      const piece = game.board[row][col];
      if (!piece || piece.toUpperCase() !== item.type) continue;
      const side = piece === piece.toUpperCase() ? RED : BLACK;
      const from = { row, col };
      const moves = getLegalMoves(game, from, side);
      observationTargets.push(...moves);
      observationMoves.push(...moves.map(to => ({ from, to, side })));
    }
  }
  observationTargets = [...new Map(observationTargets.map(position => [`${position.row},${position.col}`, position])).values()];
  document.querySelectorAll('#observationButtons .observation-button').forEach(button => button.classList.toggle('active', button === selectedButton));
  clearQuizButtons();
  setPieceMessage(`${item.description} 高亮位置为该棋种在示例局面中的合法落点。`, 'piece-observation-message');
  speakLesson(item.description);
  renderBoard();
}

function stopAutomaticObservation() {
  observationGeneration += 1;
  cancelLessonSpeech();
  if (observationTimer !== null) window.clearTimeout(observationTimer);
  observationTimer = null;
  observationPath = [];
  observationOrigins = [];
  kingFacingWarning = false;
  elephantEyes = [];
  elephantForbidden = [];
  horseLegs = [];
  horseForbidden = [];
  horseDiagonal = [];
  pawnForbidden = [];
  captureScreens = [];
  board.removeAttribute('data-king-rule');
  board.removeAttribute('data-elephant-rule');
  board.removeAttribute('data-horse-rule');
  board.removeAttribute('data-pawn-phase');
  board.removeAttribute('data-capture-piece');
  board.removeAttribute('data-capture-stage');
  board.removeAttribute('data-capture-example');
}

function continueAfterNarration(narration, minimumDelay, next) {
  const generation = observationGeneration;
  observationTimer = window.setTimeout(() => {
    observationTimer = null;
    narration.then(completed => {
      if (completed && generation === observationGeneration) next();
    });
  }, minimumDelay);
}

function createCapturePosition(type, example) {
  const redFrom = { row: example.from[0], col: example.from[1] };
  const redTo = { row: example.to[0], col: example.to[1] };
  const reflect = square => ({ row: 9 - square.row, col: 8 - square.col });
  const blackFrom = reflect(redFrom);
  const blackTo = reflect(redTo);
  const position = createEmptyBoard();
  if (type !== 'K') {
    position[9][4] = 'K';
    position[0][4] = 'k';
  }
  position[5][4] = 'P';
  position[redFrom.row][redFrom.col] = type;
  position[blackFrom.row][blackFrom.col] = type.toLowerCase();
  const target = example.target || 'p';
  position[redTo.row][redTo.col] = target;
  position[blackTo.row][blackTo.col] = target.toUpperCase();
  const screens = [];
  if (example.screen) {
    const redScreen = { row: example.screen[0], col: example.screen[1] };
    const blackScreen = reflect(redScreen);
    position[redScreen.row][redScreen.col] = 'H';
    position[blackScreen.row][blackScreen.col] = 'h';
    screens.push(redScreen, blackScreen);
  }
  return { state: createGame({ board: position }), redFrom, blackFrom, redTo, blackTo, screens };
}

function showCaptureObservationStep(type, index) {
  const examples = CAPTURE_EXAMPLES[type];
  const label = activeObservation.label;
  if (index >= examples.length) {
    observationTargets = [];
    observationPath = [];
    elephantEyes = [];
    horseLegs = [];
    captureScreens = [];
    observationTimer = null;
    board.dataset.captureStage = 'complete';
    const message = `${label}吃子演示结束。吃对方棋子，吃子后停在目标位置，仍须遵守本棋种的走法限制。`;
    setPieceMessage(message, 'piece-observation-message');
    speakLesson(message);
    renderBoard();
    return;
  }
  const example = examples[index];
  const { state, redFrom, blackFrom, redTo, blackTo, screens } = createCapturePosition(type, example);
  game = state;
  captureScreens = screens;
  board.dataset.capturePiece = type;
  board.dataset.captureStage = 'preview';
  board.dataset.captureExample = String(index);
  observationOrigins = [redFrom, blackFrom];
  observationTargets = [redTo, blackTo];
  observationPath = [redFrom, redTo, blackFrom, blackTo];
  elephantEyes = [];
  horseLegs = [];
  if (type === 'E') highlightElephantMoves(redTo, blackTo);
  if (type === 'H') highlightHorseMoves(redTo, blackTo);
  const validRed = getLegalMoves(game, redFrom, RED).some(to => samePosition(to, redTo));
  const validBlack = getLegalMoves(game, blackFrom, BLACK).some(to => samePosition(to, blackTo));
  if (!validRed || !validBlack) {
    stopAutomaticObservation();
    setPieceMessage('吃子示例不合法，已停止。', 'practice-message');
    renderBoard();
    return;
  }
  const intro = index === 0 ? `这是${label}吃子演示，不是实际对弈。吃掉对方棋子，被吃的棋子要从棋盘移除。` : '';
  setPieceMessage(intro + example.text, 'piece-observation-message');
  const narration = speakLesson(intro + example.text);
  renderBoard();
  continueAfterNarration(narration, 2500, () => {
    game.turn = RED;
    const redCaptured = makeMove(game, redFrom, redTo);
    const blackCaptured = redCaptured && makeMove(game, blackFrom, blackTo);
    if (!redCaptured || !blackCaptured) {
      stopAutomaticObservation();
      setPieceMessage('吃子着法不合法，已停止。', 'practice-message');
      renderBoard();
      return;
    }
    observationOrigins = [redTo, blackTo];
    observationTargets = [];
    board.dataset.captureStage = 'captured';
    const message = '吃掉对方棋子，停在目标位置。';
    setPieceMessage(message, 'success-message');
    const completed = speakLesson(message);
    renderBoard();
    continueAfterNarration(completed, 1800, () => showCaptureObservationStep(type, index + 1));
  });
}

function updatePawnRestrictions() {
  pawnForbidden = [];
  for (const [code, side, forward] of [['P', RED, -1], ['p', BLACK, 1]]) {
    const from = findPiece(code);
    const legal = getLegalMoves(game, from, side);
    const candidates = [
      { row: from.row - forward, col: from.col },
      { row: from.row, col: from.col - 1 },
      { row: from.row, col: from.col + 1 }
    ];
    pawnForbidden.push(...candidates.filter(to =>
      to.row >= 0 && to.row < 10 && to.col >= 0 && to.col < 9
      && !legal.some(target => samePosition(target, to))));
  }
}

function showPawnObservationStep(index) {
  const redRoute = [[6, 2], [5, 2], [4, 2], [4, 1], [4, 2], [3, 2], [2, 2], [1, 2], [0, 2], [0, 1], [0, 2]];
  const blackRoute = [[3, 6], [4, 6], [5, 6], [5, 7], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [9, 7], [9, 6]];
  const redFrom = findPiece('P');
  const blackFrom = findPiece('p');
  updatePawnRestrictions();
  observationOrigins = [redFrom, blackFrom];
  if (index >= redRoute.length - 1) {
    board.dataset.pawnPhase = 'complete';
    observationPath = [];
    observationTargets = [...getLegalMoves(game, redFrom, RED), ...getLegalMoves(game, blackFrom, BLACK)];
    observationTimer = null;
    const summary = '兵卒过河前只能向前走一格，过河后可以向前或横走一格，始终不能后退。到底线后只能横走，不能回头。';
    setPieceMessage(summary, 'piece-observation-message');
    speakLesson(summary);
    renderBoard();
    return;
  }
  const redTo = { row: redRoute[index + 1][0], col: redRoute[index + 1][1] };
  const blackTo = { row: blackRoute[index + 1][0], col: blackRoute[index + 1][1] };
  observationTargets = [redTo, blackTo];
  observationPath = [redFrom, redTo, blackFrom, blackTo];
  board.dataset.pawnPhase = redFrom.row === 0 ? 'bottom' : redFrom.row <= 4 ? 'after-river' : 'before-river';
  let message;
  if (index === 0) {
    message = '红兵在第3列，黑卒在第7列。这是走法演示，不是实际对弈。过河前只能向前走一格，不能横走，也不能后退。';
  } else if (index === 1) {
    message = '向前走一格，跨过楚河汉界。过河后可以向前或横走一格，但仍然不能后退。';
  } else if (index >= 8) {
    message = '已经到底线，不能再向前，也不能回头。只能沿底线横走一格。';
  } else if (redFrom.row === redTo.row) {
    message = '过河后可以横走一格，但不能斜走，也不能后退。';
  } else if (redTo.row === 0) {
    message = '向前走一格，到达底线。到底线后只能横走，不能回头。';
  } else {
    message = '过河后也可以继续向前，每次走一格，不能后退。';
  }
  setPieceMessage(message, 'piece-observation-message');
  const narration = speakLesson(message);
  renderBoard();
  observationTimer = window.setTimeout(() => {
    game.turn = RED;
    const redMoved = makeMove(game, redFrom, redTo);
    const blackMoved = redMoved && makeMove(game, blackFrom, blackTo);
    if (!redMoved || !blackMoved) {
      stopAutomaticObservation();
      setPieceMessage('演示着法不合法，已停止。', 'practice-message');
      renderBoard();
      return;
    }
    observationOrigins = [redTo, blackTo];
    observationTargets = [...getLegalMoves(game, redTo, RED), ...getLegalMoves(game, blackTo, BLACK)];
    updatePawnRestrictions();
    renderBoard();
    continueAfterNarration(narration, 1250, () => showPawnObservationStep(index + 1));
  }, 1250);
}

function highlightHorseMoves(redTo, blackTo) {
  const redFrom = findPiece('H');
  const blackFrom = findPiece('h');
  const legFor = (from, to) => Math.abs(to.row - from.row) === 2
    ? { row: from.row + Math.sign(to.row - from.row), col: from.col }
    : { row: from.row, col: from.col + Math.sign(to.col - from.col) };
  horseLegs = [legFor(redFrom, redTo), legFor(blackFrom, blackTo)];
  observationOrigins = [redFrom, blackFrom];
  observationPath = [redFrom, horseLegs[0], redTo, blackFrom, horseLegs[1], blackTo];
  observationTargets = [];
  horseForbidden = [];
  for (const [from, to, side] of [[redFrom, redTo, RED], [blackFrom, blackTo, BLACK]]) {
    const legal = getLegalMoves(game, from, side).some(target => samePosition(target, to));
    (legal ? observationTargets : horseForbidden).push(to);
  }
}

function startHorseObservation() {
  const position = createInitialBoard().map(row => row.map(piece => ['H', 'K'].includes(piece?.toUpperCase()) ? piece : null));
  position[5][4] = 'P';
  game = createGame({ board: position });
  board.dataset.horseRule = 'start';
  observationOrigins = [{ row: 9, col: 1 }, { row: 9, col: 7 }, { row: 0, col: 1 }, { row: 0, col: 7 }];
  const message = '马可以过河，也可以后退。马的初始位置在底线第2列和第8列。这是走法演示，不是实际对弈。接下来在空旷位置演示走日字。';
  setPieceMessage(message, 'piece-observation-message');
  const narration = speakLesson(message);
  renderBoard();
  continueAfterNarration(narration, 4000, () => showHorseObservationStep(0));
}

function moveHorsePair(redTo, blackTo) {
  const redFrom = findPiece('H');
  const blackFrom = findPiece('h');
  game.turn = RED;
  const redMoved = makeMove(game, redFrom, redTo);
  const blackMoved = redMoved && makeMove(game, blackFrom, blackTo);
  if (!redMoved || !blackMoved) {
    stopAutomaticObservation();
    setPieceMessage('演示着法不合法，已停止。', 'practice-message');
    renderBoard();
    return false;
  }
  observationOrigins = [redTo, blackTo];
  observationTargets = [];
  renderBoard();
  return true;
}

function showHorseObservationStep(index) {
  const directions = [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]];
  if (index >= directions.length) {
    completeHorseObservation('walk');
    return;
  }
  game = createPieceDemoGame('H');
  board.dataset.horseRule = 'move';
  const [rowDelta, colDelta] = directions[index];
  const redFrom = findPiece('H');
  const blackFrom = findPiece('h');
  const redTo = { row: redFrom.row + rowDelta, col: redFrom.col + colDelta };
  const blackTo = { row: blackFrom.row - rowDelta, col: blackFrom.col - colDelta };
  highlightHorseMoves(redTo, blackTo);
  const message = index === 0
    ? '马走日字，先直走一格，再斜走一格。黄色方框标出了先直走的马腿位置。'
    : Math.abs(rowDelta) === 2 ? '先沿竖线走一格，再斜走一格，走到日字的对角。' : '先沿横线走一格，再斜走一格，走到日字的对角。';
  setPieceMessage(message, 'piece-observation-message');
  const narration = speakLesson(message);
  renderBoard();
  observationTimer = window.setTimeout(() => {
    if (moveHorsePair(redTo, blackTo)) {
      continueAfterNarration(narration, 1250, () => showHorseObservationStep(index + 1));
    }
  }, 1250);
}

function showHorseLegRule(phase) {
  game = createPieceDemoGame('H');
  board.dataset.horseRule = phase;
  const redFrom = findPiece('H');
  const blackFrom = findPiece('h');
  const redTo = { row: redFrom.row - 2, col: redFrom.col - 1 };
  const blackTo = { row: blackFrom.row + 2, col: blackFrom.col + 1 };
  horseDiagonal = [];
  let message;
  let nextPhase;
  if (phase === 'leg') {
    message = '这是蹩马腿演示，不是实际对弈。马先直走一格的位置叫马腿。黄色方框内没有棋子，这个方向的日字走法就畅通。';
    nextPhase = 'blocked';
  } else if (phase === 'blocked') {
    game.board[redFrom.row - 1][redFrom.col] = 'c';
    game.board[blackFrom.row + 1][blackFrom.col] = 'C';
    message = '炮占住马腿，马就不能往这个方向走。这叫蹩马腿。红叉标出的两个落点都是蹩马腿，都不能走。';
    nextPhase = 'diagonal';
  } else if (phase === 'diagonal') {
    const redObstacle = { row: redFrom.row - 1, col: redFrom.col - 1 };
    const blackObstacle = { row: blackFrom.row + 1, col: blackFrom.col + 1 };
    game.board[redObstacle.row][redObstacle.col] = 'c';
    game.board[blackObstacle.row][blackObstacle.col] = 'C';
    horseDiagonal = [redObstacle, blackObstacle];
    message = '把炮移到斜对角。蓝色描边的位置不是马腿，黄色方框内的马腿空着，不会蹩马腿。现在仍然可以走到日字落点。';
    nextPhase = 'clear';
  } else {
    message = '移开马腿上的棋子，日字走法恢复畅通。先直走一格，再斜走一格。';
  }
  highlightHorseMoves(redTo, blackTo);
  if (phase === 'blocked') {
    horseForbidden.push({ row: redTo.row, col: redFrom.col + 1 }, { row: blackTo.row, col: blackFrom.col - 1 });
  }
  setPieceMessage(message, phase === 'blocked' ? 'board-question-feedback incorrect' : 'piece-observation-message');
  const narration = speakLesson(message);
  renderBoard();
  if (phase === 'diagonal') {
    observationTimer = window.setTimeout(() => {
      if (moveHorsePair(redTo, blackTo)) {
        continueAfterNarration(narration, 1250, () => showHorseLegRule('clear'));
      }
    }, 1250);
  } else if (nextPhase) {
    continueAfterNarration(narration, 4000, () => showHorseLegRule(nextPhase));
  } else {
    observationTimer = window.setTimeout(() => {
      if (moveHorsePair(redTo, blackTo)) {
        continueAfterNarration(narration, 1250, () => completeHorseObservation('leg'));
      }
    }, 1250);
  }
}

function completeHorseObservation(demo) {
  horseLegs = [];
  horseForbidden = [];
  horseDiagonal = [];
  observationPath = [];
  observationTimer = null;
  board.dataset.horseRule = `${demo}-complete`;
  observationTargets = [...getLegalMoves(game, findPiece('H'), RED), ...getLegalMoves(game, findPiece('h'), BLACK)];
  const message = demo === 'walk'
    ? '马走日字，先直走一格，再斜走一格。马可以过河，也可以后退。'
    : '马腿是先直走一格的位置，有棋子就不能往那个方向走。斜对角不是马腿，不会挡住这个方向的日字走法。';
  setPieceMessage(message, 'piece-observation-message');
  speakLesson(message);
  renderBoard();
}

function highlightElephantMoves(redTo, blackTo) {
  const redFrom = findPiece('E');
  const blackFrom = findPiece('e');
  observationOrigins = [redFrom, blackFrom];
  elephantEyes = [
    { row: (redFrom.row + redTo.row) / 2, col: (redFrom.col + redTo.col) / 2 },
    { row: (blackFrom.row + blackTo.row) / 2, col: (blackFrom.col + blackTo.col) / 2 }
  ];
  observationPath = [redFrom, elephantEyes[0], redTo, blackFrom, elephantEyes[1], blackTo];
  observationTargets = [];
  elephantForbidden = [];
  for (const [from, to, side] of [[redFrom, redTo, RED], [blackFrom, blackTo, BLACK]]) {
    const legal = getLegalMoves(game, from, side).some(target => samePosition(target, to));
    (legal ? observationTargets : elephantForbidden).push(to);
  }
  return { redFrom, blackFrom };
}

function moveElephantPair(redTo, blackTo) {
  const redFrom = findPiece('E');
  const blackFrom = findPiece('e');
  game.turn = RED;
  const redMoved = makeMove(game, redFrom, redTo);
  const blackMoved = redMoved && makeMove(game, blackFrom, blackTo);
  if (!redMoved || !blackMoved) {
    stopAutomaticObservation();
    setPieceMessage('演示着法不合法，已停止。', 'practice-message');
    renderBoard();
    return false;
  }
  observationOrigins = [redTo, blackTo];
  observationTargets = [];
  renderBoard();
  return true;
}

function startElephantObservation() {
  const position = createInitialBoard().map(row => row.map(piece => piece?.toUpperCase() === 'E' || piece?.toUpperCase() === 'K' ? piece : null));
  position[5][4] = 'P';
  game = createGame({ board: position });
  board.dataset.elephantRule = 'start';
  observationOrigins = [{ row: 9, col: 2 }, { row: 9, col: 6 }, { row: 0, col: 2 }, { row: 0, col: 6 }];
  const message = '相象的初始位置在底线第3列和第7列。这是走法演示，不是实际对弈。接下来用一枚相和一枚象演示走田字。';
  setPieceMessage(message, 'piece-observation-message');
  const narration = speakLesson(message);
  renderBoard();
  continueAfterNarration(narration, 4000, () => {
    game = createPieceDemoGame('E');
    showElephantObservationStep(0);
  });
}

function showElephantObservationStep(index) {
  const redRoute = [[9, 2], [7, 4], [5, 6], [7, 8], [9, 6], [7, 4], [5, 2], [7, 0], [9, 2]];
  const blackRoute = [[0, 6], [2, 4], [4, 2], [2, 0], [0, 2], [2, 4], [4, 6], [2, 8], [0, 6]];
  if (index >= redRoute.length - 1) {
    showElephantRule('river');
    return;
  }
  board.dataset.elephantRule = 'move';
  const redTo = { row: redRoute[index + 1][0], col: redRoute[index + 1][1] };
  const blackTo = { row: blackRoute[index + 1][0], col: blackRoute[index + 1][1] };
  highlightElephantMoves(redTo, blackTo);
  const positionDescription = redTo.col === 4
    ? '飞到第5列，叫飞中象。'
    : redTo.col === 0 || redTo.col === 8 ? '飞到第1列或第9列的边路，叫飞边象。'
      : redTo.row === 5 ? '飞到靠近楚河汉界的位置，叫河边象。' : '飞回底线的相象初始位置。';
  const message = (index === 0
    ? '这是相象走法演示，不是实际对弈。红方称相，黑方称象。沿斜线走两格，像走一个田字，中间的交叉点叫象眼。'
    : '沿斜线走两格，象眼空着，就可以走到田字的对角。') + positionDescription;
  setPieceMessage(message, 'piece-observation-message');
  const narration = speakLesson(message);
  renderBoard();
  observationTimer = window.setTimeout(() => {
    if (moveElephantPair(redTo, blackTo)) {
      continueAfterNarration(narration, 1250, () => showElephantObservationStep(index + 1));
    }
  }, 1250);
}

function showElephantRule(phase) {
  game = createPieceDemoGame('E');
  board.dataset.elephantRule = phase;
  let redTo = { row: 7, col: 4 };
  let blackTo = { row: 2, col: 4 };
  let message;
  let nextPhase;
  if (phase === 'river') {
    game.board[9][2] = null;
    game.board[0][6] = null;
    game.board[5][2] = 'E';
    game.board[4][6] = 'e';
    redTo = { row: 3, col: 4 };
    blackTo = { row: 6, col: 4 };
    message = '相象不能过河，只能在自己的半边棋盘活动。红叉标出的落点越过了楚河汉界，即使象眼没有棋子，也不能走。';
  } else if (phase === 'eye') {
    message = '这是蹩象眼演示，不是实际对弈。田字正中的交叉点叫象眼。黄色圆圈标出了象眼，象眼空着，这条斜线就畅通。';
    nextPhase = 'blocked';
  } else if (phase === 'blocked') {
    game.board[8][3] = 'h';
    game.board[1][5] = 'H';
    message = '马占住象眼，就不能沿这条斜线走到红叉位置。这叫塞象眼，也常说蹩象眼。不论象眼上是自己的棋子还是对方的棋子，都不能越过。';
    nextPhase = 'clear';
  } else {
    message = '移开象眼上的棋子，斜线恢复畅通。现在可以沿斜线走两格，但仍然不能过河。';
  }
  highlightElephantMoves(redTo, blackTo);
  setPieceMessage(message, phase === 'river' || phase === 'blocked' ? 'board-question-feedback incorrect' : 'piece-observation-message');
  const narration = speakLesson(message);
  renderBoard();
  if (phase === 'river') {
    continueAfterNarration(narration, 4000, () => completeElephantObservation('walk'));
    return;
  }
  if (nextPhase) {
    continueAfterNarration(narration, 4000, () => showElephantRule(nextPhase));
  } else {
    observationTimer = window.setTimeout(() => {
      if (!moveElephantPair(redTo, blackTo)) return;
      continueAfterNarration(narration, 1250, () => completeElephantObservation('eye'));
    }, 1250);
  }
}

function completeElephantObservation(demo) {
  elephantEyes = [];
  elephantForbidden = [];
  observationPath = [];
  observationTimer = null;
  board.dataset.elephantRule = `${demo}-complete`;
  observationTargets = [...getLegalMoves(game, findPiece('E'), RED), ...getLegalMoves(game, findPiece('e'), BLACK)];
  const summary = demo === 'walk'
    ? '相象走田字，沿斜线走两格，只能在自己的半边棋盘活动，不能过河。'
    : '象眼是斜线中间的交叉点。象眼有棋子阻挡就不能走，移开阻挡后才能走到田字的对角。';
  setPieceMessage(summary, 'piece-observation-message');
  speakLesson(summary);
  renderBoard();
}

function showAdvisorObservationStep(index) {
  const redRoute = [[8, 4], [7, 3], [8, 4], [7, 5], [8, 4], [9, 3], [8, 4], [9, 5], [8, 4]];
  const blackRoute = [[1, 4], [2, 5], [1, 4], [2, 3], [1, 4], [0, 5], [1, 4], [0, 3], [1, 4]];
  const redFrom = findPiece('A');
  const blackFrom = findPiece('a');
  if (index >= redRoute.length - 1) {
    observationPath = [];
    observationOrigins = [redFrom, blackFrom];
    observationTargets = [...getLegalMoves(game, redFrom, RED), ...getLegalMoves(game, blackFrom, BLACK)];
    observationTimer = null;
    const message = '红方称仕，黑方称士。只能在各自九宫的中心与四角之间斜走一格，不能横走、竖走，也不能走出九宫。';
    setPieceMessage(message, 'piece-observation-message');
    speakLesson(message);
    renderBoard();
    return;
  }
  const redTo = { row: redRoute[index + 1][0], col: redRoute[index + 1][1] };
  const blackTo = { row: blackRoute[index + 1][0], col: blackRoute[index + 1][1] };
  observationOrigins = [redFrom, blackFrom];
  observationTargets = [redTo, blackTo];
  observationPath = [redFrom, redTo, blackFrom, blackTo];
  const message = index === 0
    ? '这是士仕走法演示，不是实际对弈。从九宫中心沿斜线走一格。'
    : index % 2 === 0 ? '从九宫中心斜走一格，走到九宫的角上。' : '沿斜线走一格，回到九宫中心。';
  setPieceMessage(message, 'piece-observation-message');
  const narration = speakLesson(message);
  renderBoard();
  observationTimer = window.setTimeout(() => {
    game.turn = RED;
    const redMoved = makeMove(game, redFrom, redTo);
    const blackMoved = redMoved && makeMove(game, blackFrom, blackTo);
    if (!redMoved || !blackMoved) {
      stopAutomaticObservation();
      setPieceMessage('演示着法不合法，已停止。', 'practice-message');
      renderBoard();
      return;
    }
    observationOrigins = [redTo, blackTo];
    observationTargets = [];
    renderBoard();
    continueAfterNarration(narration, 1250, () => showAdvisorObservationStep(index + 1));
  }, 1250);
}

function showKingObservationStep(index) {
  const redRoute = [[9, 3], [8, 3], [7, 3], [7, 4], [7, 5], [8, 5], [9, 5], [9, 4], [9, 3]];
  const blackRoute = [[0, 5], [1, 5], [2, 5], [2, 4], [2, 3], [1, 3], [0, 3], [0, 4], [0, 5]];
  if (index >= redRoute.length - 1) {
    observationPath = [];
    observationOrigins = [findPiece('K'), findPiece('k')];
    observationTargets = [...getLegalMoves(game, findPiece('K'), RED), ...getLegalMoves(game, findPiece('k'), BLACK)];
    observationTimer = null;
    board.dataset.kingRule = 'walk-complete';
    const message = '将帅在九宫内每次横走或竖走一格，不能斜走，也不能出九宫。';
    setPieceMessage(message, 'piece-observation-message');
    speakLesson(message);
    renderBoard();
    return;
  }
  const redFrom = findPiece('K');
  const blackFrom = findPiece('k');
  const redTo = { row: redRoute[index + 1][0], col: redRoute[index + 1][1] };
  const blackTo = { row: blackRoute[index + 1][0], col: blackRoute[index + 1][1] };
  observationOrigins = [redFrom, blackFrom];
  observationTargets = [redTo, blackTo];
  observationPath = [redFrom, redTo, blackFrom, blackTo];
  const message = index === 0
    ? '这是将帅走法演示，不是实际对弈。在九宫内横走或竖走一格。中间的兵阻挡将帅视线。'
    : redFrom.row === redTo.row ? '在九宫内横走一格。' : '在九宫内竖走一格。';
  setPieceMessage(message, 'piece-observation-message');
  const narration = speakLesson(message);
  renderBoard();
  observationTimer = window.setTimeout(() => {
    game.turn = RED;
    const redMoved = makeMove(game, redFrom, redTo);
    const blackMoved = redMoved && makeMove(game, blackFrom, blackTo);
    if (!redMoved || !blackMoved) {
      stopAutomaticObservation();
      setPieceMessage('演示着法不合法，已停止。', 'practice-message');
      renderBoard();
      return;
    }
    observationOrigins = [redTo, blackTo];
    observationTargets = [];
    renderBoard();
    continueAfterNarration(narration, 1250, () => showKingObservationStep(index + 1));
  }, 1250);
}

function showKingFacingRule(blocked) {
  const position = createEmptyBoard();
  position[9][4] = 'K';
  position[0][4] = 'k';
  if (blocked) position[5][4] = 'P';
  game = createGame({ board: position });
  kingFacingWarning = isInCheck(game, RED);
  observationOrigins = [];
  observationTargets = [];
  observationPath = Array.from({ length: 10 }, (_, row) => ({ row, col: 4 }));
  board.dataset.kingRule = blocked ? 'blocked' : 'facing';
  const message = blocked
    ? '这是将帅不能见面的演示，不是实际对弈。将帅虽然在同一路上，但中间有兵阻挡，不算直接相见。'
    : '错误示例：移去中间的兵，将帅在同一路上无遮挡相见，这是不允许的。必须错开一路，或保留棋子阻挡。';
  setPieceMessage(message, blocked ? 'piece-observation-message' : 'board-question-feedback incorrect');
  const narration = speakLesson(message);
  renderBoard();
  continueAfterNarration(narration, blocked ? 3500 : 5000, () => {
    if (blocked) {
      showKingFacingRule(false);
      return;
    }
    game = createPieceDemoGame('K');
    observationPath = [];
    kingFacingWarning = false;
    board.dataset.kingRule = 'separated';
    setPieceMessage('正确局面：将帅错开一路，不直接相见。将帅不能在同一路上无遮挡相见。', 'piece-observation-message');
    speakLesson('将帅不能在同一路上无遮挡相见。');
    observationTimer = null;
    renderBoard();
  });
}

function showStraightObservationStep(type, index) {
  const label = getPieceLabel(type);
  const directions = [
    { row: 0, col: -1, label: '向左横走' },
    { row: 0, col: 1, label: '向右横走' },
    { row: -1, col: 0, label: '向上直走' },
    { row: 1, col: 0, label: '向下直走' }
  ];
  if (index >= 8) {
    activeObservation = null;
    activePiece = null;
    observationTargets = [];
    observationPath = [];
    observationTimer = null;
    setPieceMessage(type === 'C'
      ? '炮沿横线或竖线行走。不吃子时不能越子，吃子时必须隔一个棋子作炮架。'
      : '车沿横线或竖线行走，不能越过其他棋子。', 'piece-observation-message');
    renderBoard();
    return;
  }
  game = createPieceDemoGame(type);
  const side = index < 4 ? RED : BLACK;
  game.turn = side;
  const from = findPiece(side === RED ? type : type.toLowerCase());
  const direction = directions[index % 4];
  const moves = getLegalMoves(game, from, side).filter(to =>
    type !== 'C' || !game.board[to.row][to.col]).filter(to =>
    direction.row ? to.col === from.col && Math.sign(to.row - from.row) === direction.row
      : to.row === from.row && Math.sign(to.col - from.col) === direction.col);
  moves.sort((first, second) =>
    Math.abs(second.row - from.row) + Math.abs(second.col - from.col)
      - Math.abs(first.row - from.row) - Math.abs(first.col - from.col));
  const to = moves[0];
  activePiece = from;
  observationTargets = moves;
  observationPath = [];
  if (to) {
    const distance = Math.abs(to.row - from.row) + Math.abs(to.col - from.col);
    for (let step = 0; step <= distance; step += 1) {
      observationPath.push({ row: from.row + direction.row * step, col: from.col + direction.col * step });
    }
  }
  const opening = type === 'C'
    ? '炮可以沿横线或竖线走任意格。不吃子时不能越过棋子，吃子时必须隔一个棋子作炮架。'
    : '车可以沿横线或竖线走任意格，但不能越过其他棋子。';
  const message = (index === 0 ? opening : '')
    + `${side === RED ? '红方' : '黑方'}${label}${direction.label}。`;
  setPieceMessage(message, 'piece-observation-message');
  const narration = speakLesson(message);
  renderBoard();
  observationTimer = window.setTimeout(() => {
    if (to) makeMove(game, from, to);
    activePiece = to || from;
    observationTargets = [];
    renderBoard();
    continueAfterNarration(narration, 1250, () => showStraightObservationStep(type, index + 1));
  }, 1250);
}

function createPieceDemoGame(type) {
  return createGame({ board: createPieceDemoBoard(type), turn: RED });
}

function createPieceDemoBoard(type) {
  const board = createEmptyBoard();
  board[9][3] = 'K';
  board[0][5] = 'k';
  const examples = {
    K: [],
    A: [[8, 3, 'A'], [1, 5, 'a']],
    E: [[9, 2, 'E'], [0, 6, 'e']],
    H: [[7, 2, 'H'], [2, 6, 'h']],
    R: [[5, 4, 'R'], [3, 7, 'r']],
    C: [[7, 1, 'C'], [2, 7, 'c']],
    P: [[6, 2, 'P'], [3, 6, 'p']]
  };
  for (const [row, col, piece] of examples[type] || []) board[row][col] = piece;
  if (type === 'E' || type === 'H') {
    board[9][3] = null;
    board[0][5] = null;
    board[9][4] = 'K';
    board[0][4] = 'k';
    board[5][4] = 'P';
  }
  return board;
}

function renderPracticePanel() {
  const container = document.getElementById('practiceButtons');
  container.className = 'piece-move-practice';
  container.replaceChildren();

  const choices = document.createElement('div');
  choices.className = 'piece-practice-choices';
  for (const item of OBSERVATION_ITEMS) {
    const dropdown = document.createElement('details');
    dropdown.className = 'piece-practice-dropdown';
    dropdown.setAttribute('name', 'piece-move-practice');
    dropdown.dataset.practicePiece = item.type;
    dropdown.style.setProperty('--button-color', item.color);
    const summary = document.createElement('summary');
    summary.textContent = item.label;
    const menu = document.createElement('div');
    menu.className = 'piece-practice-menu';
    const groups = ['1. 走法', '2. 吃子与对弈'];
    if (item.type === 'K') groups.push('3. 将军应将');
    for (const label of groups) {
      const heading = document.createElement('strong');
      heading.className = 'piece-practice-group';
      heading.textContent = label;
      menu.append(heading);
      if (label === '1. 走法') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'piece-practice-option';
        button.dataset.movePractice = item.type;
        button.textContent = '1.1 走法练习';
        button.addEventListener('click', () => startMovePractice(item));
        menu.append(button);
      } else if (label === '2. 吃子与对弈') {
        CAPTURE_EXAMPLES[item.type].forEach((example, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'piece-practice-option';
          button.dataset.capturePractice = item.type;
          button.dataset.captureIndex = String(index);
          button.textContent = `2.${index + 1} 吃子对弈`;
          button.addEventListener('click', () => startMovePractice(item, index));
          menu.append(button);
        });
      } else {
        const empty = document.createElement('span');
        empty.className = 'piece-practice-empty';
        empty.textContent = '暂无练习';
        menu.append(empty);
      }
    }
    dropdown.append(summary, menu);
    choices.append(dropdown);
  }
  container.append(choices);
  practiceNote = document.createElement('p');
  practiceNote.className = 'piece-practice-note';
  practiceNote.setAttribute('role', 'status');
  practiceNote.textContent = '';
  container.append(practiceNote);
}

function renderQuizButtons() {
  const container = document.getElementById('boardQuizButtons');
  container.replaceChildren();
  for (const question of QUIZ_ITEMS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'board-quiz-topic';
    button.textContent = question.label;
    button.addEventListener('click', () => showQuizQuestion(question, button));
    container.append(button);
  }
}

function clearPracticeButtonStates() {
  activeMovePractice = null;
  capturePractice = null;
  board.removeAttribute('data-practice-kind');
  board.removeAttribute('data-practice-complete');
  document.querySelectorAll('#practiceButtons details').forEach(dropdown => {
    dropdown.open = false;
    dropdown.classList.remove('practice-current');
  });
}

function startMovePractice(item, captureIndex = null) {
  stopAutomaticObservation();
  clearPracticeButtonStates();
  clearQuizButtons();
  document.querySelectorAll('#observationButtons details').forEach(dropdown => { dropdown.open = false; });
  document.querySelectorAll('#observationButtons .observation-button').forEach(button => button.classList.remove('active'));
  board.removeAttribute('data-observation');
  mode = 'practice';
  activeMovePractice = item;
  activeObservation = null;
  selectedQuestion = null;
  activePiece = null;
  legalTargets = [];
  observationTargets = [];
  observationMoves = [];
  if (captureIndex !== null) {
    const example = CAPTURE_EXAMPLES[item.type][captureIndex];
    const setup = createCapturePosition(item.type, example);
    game = setup.state;
    captureScreens = setup.screens;
    capturePractice = {
      actors: [setup.redFrom, setup.blackFrom],
      targets: [setup.redTo, setup.blackTo]
    };
  } else {
    const position = createPieceDemoBoard(item.type);
    if (item.type === 'K' || item.type === 'A') {
      position[9][3] = null;
      position[0][5] = null;
      position[9][4] = 'K';
      position[0][4] = 'k';
      position[5][4] = 'P';
      if (item.type === 'A') {
        position[8][3] = null;
        position[1][5] = null;
        position[8][4] = 'A';
        position[1][4] = 'a';
      }
    }
    game = createGame({ board: position });
  }
  board.dataset.practiceKind = capturePractice ? 'duel' : 'move';
  board.style.setProperty('--piece-demo-color', item.color);
  document.querySelector(`#practiceButtons [data-practice-piece="${item.type}"]`).classList.add('practice-current');
  const prompt = capturePractice
    ? `${item.label}吃子对弈：${CAPTURE_EXAMPLES[item.type][captureIndex].text} 红方先行。`
    : `${item.label}走法练习：${item.description}`;
  practiceNote.textContent = prompt;
  setPieceMessage(prompt, 'practice-message');
  speakLesson(prompt);
  renderBoard();
}

function practiceTargets(position) {
  const piece = game.board[position.row][position.col];
  if (capturePractice) return getLegalMoves(game, position);
  const side = piece === piece.toUpperCase() ? RED : BLACK;
  return getLegalMoves(game, position, side).filter(to => !game.board[to.row][to.col]);
}

function practiceDuelStatus() {
  const status = getGameStatus(game);
  const side = game.turn === RED ? '红方' : '黑方';
  if (status.type === 'invalid') return { finished: true, text: '棋局无效，请重新选择练习局面。' };
  if (status.type === 'checkmate' || status.type === 'stalemate') {
    return { finished: true, text: `${status.type === 'checkmate' ? '将死' : '困毙'}，${status.winner === RED ? '红方' : '黑方'}获胜。` };
  }
  return { finished: false, text: status.type === 'check' ? `${side}被将军，轮到${side}应将。` : `轮到${side}走棋。` };
}

function handleMovePracticeClick(position) {
  if (capturePractice) {
    const status = practiceDuelStatus();
    if (status.finished) {
      practiceNote.textContent = status.text;
      setPieceMessage(status.text, 'success-message');
      return;
    }
  }
  const piece = game.board[position.row][position.col];
  const controllable = capturePractice
    ? piece && (piece === piece.toUpperCase() ? RED : BLACK) === game.turn
    : piece?.toUpperCase() === activeMovePractice.type;
  if (controllable) {
    if (activePiece && samePosition(activePiece, position)) {
      activePiece = null;
      legalTargets = [];
    } else {
      activePiece = position;
      legalTargets = practiceTargets(position);
    }
    practiceNote.textContent = activePiece
      ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}：${legalTargets.length} 个合法落点。`
      : '已取消选择。';
    renderBoard();
    return;
  }
  if (!activePiece) {
    practiceNote.textContent = capturePractice
      ? `请选择${game.turn === RED ? '红方' : '黑方'}棋子。`
      : `请选择${activeMovePractice.label}棋子。`;
    return;
  }
  if (!legalTargets.some(target => samePosition(target, position))) {
    const message = capturePractice
      ? `这个位置不是合法着法。${practiceDuelStatus().text}`
      : piece ? '走法练习不吃子，请选择空的合法落点。' : `这个位置不能走。${activeMovePractice.description}`;
    practiceNote.textContent = message;
    setPieceMessage(message, 'practice-message');
    return;
  }
  const movingPiece = game.board[activePiece.row][activePiece.col];
  const capturedPiece = game.board[position.row][position.col];
  if (!capturePractice) game.turn = movingPiece === movingPiece.toUpperCase() ? RED : BLACK;
  if (!makeMove(game, activePiece, position)) return;
  activePiece = position;
  let message = '走法正确，可以继续练习。';
  if (capturePractice) {
    capturePractice.actors = [];
    capturePractice.targets = [];
    captureScreens = [];
    activePiece = null;
    legalTargets = [];
    const status = practiceDuelStatus();
    message = `${capturedPiece ? `吃掉${getPieceLabel(capturedPiece)}。` : ''}${status.text}`;
    if (status.finished) speakLesson(message);
  } else legalTargets = practiceTargets(position);
  practiceNote.textContent = message;
  setPieceMessage(message, 'success-message');
  renderBoard();
}

function clearQuizButtons() {
  document.querySelectorAll('#boardQuizButtons button').forEach(button => {
    button.classList.remove('active', 'quiz-correct', 'quiz-wrong');
  });
}

function findPiece(pieceCode) {
  for (let row = 0; row < game.board.length; row += 1) {
    for (let col = 0; col < game.board[row].length; col += 1) {
      if (game.board[row][col] === pieceCode) return { row, col };
    }
  }
  return null;
}

function handleBoardClick(row, col) {
  if (mode === 'practice' && activeMovePractice) {
    handleMovePracticeClick({ row, col });
    return;
  }
  if (mode !== 'observe' || ['R', 'K', 'A', 'E', 'H', 'C', 'P'].includes(activeObservation?.type)) return;
  const position = { row, col };

  if (mode === 'observe') {
    const candidates = observationMoves.filter(item => samePosition(item.to, position));
    if (!candidates.length) {
      setPieceMessage('请点击棋盘上的高亮落点，观察该棋种如何移动。', 'practice-message');
      return;
    }
    let moved = false;
    for (const move of candidates) {
      game.turn = move.side;
      if (makeMove(game, move.from, move.to)) {
        moved = true;
        break;
      }
    }
    if (moved) {
      activeObservation = null;
      observationMoves = [];
      observationTargets = [];
      setPieceMessage('示例着法已走出。选择上方棋种可重新观察其他落点。', 'success-message');
      speakLesson('示例着法已走出');
      renderBoard();
    }
    return;
  }

}

function showQuizQuestion(question, button) {
  stopAutomaticObservation();
  board.removeAttribute('data-observation');
  mode = 'quiz';
  game = createGame();
  activeObservation = null;
  activePiece = null;
  legalTargets = [];
  observationTargets = [];
  observationMoves = [];
  selectedQuestion = question;
  document.querySelectorAll('#observationButtons .observation-button').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('#observationButtons details').forEach(dropdown => { dropdown.open = false; });
  document.querySelectorAll('#boardQuizButtons button').forEach(item => item.classList.toggle('active', item === button));
  clearPracticeButtonStates();
  const prompt = document.createElement('p');
  prompt.className = 'board-question-text';
  prompt.textContent = question.text;
  const options = document.createElement('div');
  options.className = 'board-question-options';
  const feedback = document.createElement('p');
  feedback.className = 'board-question-feedback';
  feedback.setAttribute('role', 'status');
  question.options.forEach((text, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'board-answer-option';
    option.textContent = `${String.fromCharCode(65 + index)}. ${text}`;
    option.addEventListener('click', () => answerQuiz(question, button, options, feedback, index));
    options.append(option);
  });
  content.replaceChildren(prompt, options, feedback);
  practiceNote.textContent = `问答练习：${question.label}`;
  speakLesson(question.text);
  renderBoard();
}

function answerQuiz(question, topicButton, options, feedback, selectedIndex) {
  const correct = selectedIndex === question.answer;
  options.querySelectorAll('button').forEach((option, index) => {
    option.disabled = true;
    if (index === question.answer) option.classList.add('correct');
    else if (index === selectedIndex) option.classList.add('incorrect');
  });
  topicButton.classList.remove('quiz-correct', 'quiz-wrong');
  topicButton.classList.add(correct ? 'quiz-correct' : 'quiz-wrong');
  feedback.textContent = `${correct ? '答对了！' : `参考答案：${question.options[question.answer]}。`}${question.explanation}`;
  feedback.className = `board-question-feedback ${correct ? 'correct' : 'incorrect'}`;
  const codes = question.type === 'all' ? ['K', 'A', 'E', 'H', 'R', 'C', 'P'] : [question.type];
  for (const square of board.querySelectorAll('.teaching-square')) {
    if (codes.includes(square.dataset.piece?.toUpperCase())) square.classList.add('piece-observation-target');
  }
  speakLesson(`${correct ? '回答正确。' : '回答错误。'}${question.explanation}`);
}

function setPieceMessage(text, className) {
  const message = document.createElement('p');
  message.className = `board-content-message ${className}`;
  message.textContent = text;
  content.replaceChildren(message);
}

function cancelLessonSpeech() {
  speechGeneration += 1;
  if (speechGapTimer !== null) window.clearTimeout(speechGapTimer);
  speechGapTimer = null;
  speechFinish?.(false);
  currentSpeech = null;
  speechQueue = Promise.resolve(true);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function speakLesson(text) {
  if (document.querySelector('#boardToolbar [data-control="voice"]')?.getAttribute('aria-pressed') === 'false') return Promise.resolve(true);
  if (!('speechSynthesis' in window) || !text) return Promise.resolve(true);
  const generation = speechGeneration;
  const sentences = String(text).match(/[^。！？!?]+[。！？!?]?/g) || [text];
  speechQueue = speechQueue.then(async () => {
    for (const sentence of sentences) {
      if (document.querySelector('#boardToolbar [data-control="voice"]')?.getAttribute('aria-pressed') === 'false') return true;
      if (generation !== speechGeneration) return false;
      const completed = await new Promise(resolve => {
        const utterance = new SpeechSynthesisUtterance(sentence.trim());
        currentSpeech = utterance;
        const finish = result => {
          if (speechFinish === finish) {
            speechFinish = null;
            currentSpeech = null;
          }
          resolve(result);
        };
        speechFinish = finish;
        utterance.lang = 'zh-CN';
        const volumeControl = document.querySelector('#boardToolbar [data-control="volume"]');
        const speedControl = document.querySelector('#boardToolbar [data-control="speed"]');
        if (volumeControl) utterance.volume = Number(volumeControl.value) / 100;
        if (speedControl) utterance.rate = 0.75 + Number(speedControl.value) / 20;
        utterance.onend = () => finish(true);
        utterance.onerror = () => finish(true);
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          finish(true);
        }
      });
      if (!completed || generation !== speechGeneration) return false;
      const delayed = await new Promise(resolve => {
        const finish = result => {
          if (speechFinish === finish) {
            speechFinish = null;
            speechGapTimer = null;
          }
          resolve(result);
        };
        speechFinish = finish;
        speechGapTimer = window.setTimeout(() => finish(true), 1000);
      });
      if (!delayed || generation !== speechGeneration) return false;
    }
    return true;
  });
  return speechQueue;
}

function samePosition(first, second) {
  return first.row === second.row && first.col === second.col;
}
