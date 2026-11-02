import { BLACK, RED, createEmptyBoard, createGame, getGameStatus, getLegalMoves, getPieceLabel, makeMove } from '../../core.mjs';
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
  { type: 'K', label: '将帅', color: '#ff6a00', description: '将帅只能在九宫内沿横线或竖线走一格。' },
  { type: 'A', label: '士', color: '#965fff', description: '士仕只能在九宫内沿斜线走一格。' },
  { type: 'E', label: '象', color: '#263c90', description: '象相斜走两格，不可过河，且象眼不能受阻。' },
  { type: 'H', label: '马', color: '#126c38', description: '马走日字，靠近方向的马腿被挡时不能走。' },
  { type: 'R', label: '车', color: '#fb3159', description: '车沿横线或竖线走，路径不可有棋子阻挡。' },
  { type: 'C', label: '炮', color: '#842d16', description: '炮不吃子时直线行走；吃子时必须隔一个炮架。' },
  { type: 'P', label: '兵卒', color: '#ff9d00', description: '兵卒只能前进；过河后可以横走，不能后退。' }
];

const BLACK_PIECES = [['将', 'k'], ['士', 'a'], ['象', 'e'], ['马', 'h'], ['车', 'r'], ['炮', 'c'], ['卒', 'p']];
const RED_PIECES = [['帅', 'K'], ['仕', 'A'], ['相', 'E'], ['马', 'H'], ['车', 'R'], ['炮', 'C'], ['兵', 'P']];
const QUIZ_ITEMS = [
  { type: 'R', label: '车', text: '车如何行走？', options: ['沿横线或竖线走，不能越子', '斜走两格', '走日字'], answer: 0, explanation: '车沿横线或竖线行走，途中不能有棋子阻挡。' },
  { type: 'H', label: '马', text: '马走什么形状？', options: ['田字', '日字，且要注意马腿', '直线任意格'], answer: 1, explanation: '马走日字，马腿被挡住时不能走。' },
  { type: 'C', label: '炮', text: '炮吃子时需要什么条件？', options: ['不需要炮架', '隔一个棋子作炮架', '隔两个棋子'], answer: 1, explanation: '炮吃子时，炮与目标之间必须恰好隔一个棋子。' },
  { type: 'K', label: '将帅', text: '将帅可以在哪个范围内行走？', options: ['九宫内', '整个棋盘', '只能在河界附近'], answer: 0, explanation: '将帅受九宫限制，每次沿横线或竖线走一格。' },
  { type: 'A', label: '士', text: '士仕如何行走？', options: ['斜走一格且不出九宫', '直走两格', '走日字'], answer: 0, explanation: '士仕在九宫内沿斜线走一格。' },
  { type: 'E', label: '象', text: '象相可以过河吗？', options: ['可以', '不可以', '只有红方可以'], answer: 1, explanation: '象相不能过河，且走田字时象眼不能受阻。' },
  { type: 'P', label: '兵卒', text: '兵卒过河后可以怎样走？', options: ['可以后退', '可以横走但不能后退', '可以斜走'], answer: 1, explanation: '兵卒过河后可以横走，但始终不能后退。' }
];
const PRACTICE_MODES = [
  ['练习模式', 'practice-mode', 'practice'],
  ['对弈模式', 'play-mode', 'play'],
  ['清除棋子', 'clear-mode', 'clear']
];
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
let activePracticeTarget = null;
let legalTargets = [];
let selectedQuestion = null;
let practiceNote = null;
let observationTargets = [];
let observationMoves = [];

function renderBoard() {
  const board = document.getElementById('teachingBoard');
  board.replaceChildren(createStandardBoardArtwork('teaching-lines xiangqi-grid-svg'));
  const targetKeys = new Set(legalTargets.map(position => `${position.row},${position.col}`));
  const observationTargetKeys = new Set(observationTargets.map(position => `${position.row},${position.col}`));

  for (let row = 0; row < game.board.length; row += 1) {
    for (let col = 0; col < game.board[row].length; col += 1) {
      const piece = game.board[row][col];
      const square = document.createElement('div');
      square.className = 'teaching-square xiangqi-intersection';
      placeStandardIntersection(square, row, col);
      square.dataset.row = String(row);
      square.dataset.col = String(col);
      square.dataset.piece = piece || '';
      if (activePiece && activePiece.row === row && activePiece.col === col) square.classList.add('piece-move-origin');
      if (targetKeys.has(`${row},${col}`)) square.classList.add(piece ? 'demo-capture-target' : 'demo-move-target');
      if (observationTargetKeys.has(`${row},${col}`)) square.classList.add(piece ? 'demo-capture-target' : 'demo-move-target');
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 路`
        : `空位，第 ${row + 1} 行第 ${col + 1} 路`);
      if (mode !== 'observe' && isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (mode !== 'observe' && isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'teaching-piece'));
      if (activeObservation && piece?.toUpperCase() === activeObservation.type) square.classList.add('piece-observation-target');
      square.addEventListener('click', () => handleBoardClick(row, col));
      board.append(square);
    }
  }
  document.querySelector('.teaching-side-label').textContent = `${game.turn === RED ? '红方' : '黑方'}走棋`;
}

function renderObservationButtons() {
  const container = document.getElementById('observationButtons');
  container.replaceChildren();
  for (const item of OBSERVATION_ITEMS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'observation-button';
    button.textContent = item.label;
    button.style.setProperty('--button-color', item.color);
    button.addEventListener('click', () => startObservation(item, button));
    container.append(button);
  }
}

function startObservation(item, selectedButton) {
  clearPracticeButtonStates();
  activeObservation = item;
  mode = 'observe';
  activePiece = null;
  activePracticeTarget = null;
  selectedQuestion = null;
  legalTargets = [];
  observationTargets = [];
  observationMoves = [];
  game = createPieceDemoGame(item.type);
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
  document.querySelectorAll('#observationButtons button').forEach(button => button.classList.toggle('active', button === selectedButton));
  document.querySelectorAll('.piece-move-modes button').forEach(button => {
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  });
  clearQuizButtons();
  setPieceMessage(`${item.description} 高亮位置为该棋种在示例局面中的合法落点。`, 'piece-observation-message');
  speakLesson(item.description);
  renderBoard();
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
    E: [[7, 2, 'E'], [2, 6, 'e']],
    H: [[5, 1, 'H'], [4, 7, 'h']],
    R: [[5, 0, 'R'], [4, 8, 'r']],
    C: [[6, 1, 'C'], [3, 7, 'c']],
    P: [[6, 4, 'P'], [3, 4, 'p']]
  };
  for (const [row, col, piece] of examples[type] || []) board[row][col] = piece;
  return board;
}

function renderPracticePanel() {
  const container = document.getElementById('practiceButtons');
  container.className = 'piece-move-practice';
  container.replaceChildren();

  const modeButtons = document.createElement('div');
  modeButtons.className = 'piece-move-modes';
  for (const [label, className, modeKey] of PRACTICE_MODES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `${className}${mode === modeKey ? ' active' : ''}`;
    button.textContent = label;
    button.dataset.mode = modeKey;
    button.addEventListener('click', () => setMode(modeKey));
    modeButtons.append(button);
  }
  container.append(modeButtons);
  appendSideRow(container, '选择黑方', BLACK_PIECES, 'black');
  appendSideRow(container, '选择红方', RED_PIECES, 'red');
  practiceNote = document.createElement('p');
  practiceNote.className = 'piece-practice-note';
  practiceNote.setAttribute('role', 'status');
  practiceNote.textContent = '选择模式后，再选择棋种开始。';
  container.append(practiceNote);
}

function appendSideRow(container, label, pieces, side) {
  const row = document.createElement('div');
  row.className = `piece-side-row ${side}-side-row`;
  const sideLabel = document.createElement('strong');
  sideLabel.textContent = label;
  const strip = document.createElement('div');
  strip.className = 'piece-choice-strip';

  for (const [pieceLabel, pieceCode] of pieces) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = pieceLabel;
    button.setAttribute('aria-label', `${label}${pieceLabel}`);
    button.className = pieceCode === pieceCode.toUpperCase() ? 'red-choice' : 'black-choice';
    button.dataset.pieceCode = pieceCode;
    button.dataset.side = side;
    button.addEventListener('click', () => armPiecePractice(button, pieceLabel, side, pieceCode));
    strip.append(button);
  }

  row.append(sideLabel, strip);
  container.append(row);
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

function setMode(nextMode) {
  mode = nextMode;
  game = createGame();
  activeObservation = null;
  activePiece = null;
  activePracticeTarget = null;
  legalTargets = [];
  observationTargets = [];
  observationMoves = [];
  selectedQuestion = null;
  observationMoves = [];
  document.querySelectorAll('.piece-move-modes button').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('#observationButtons button, #boardQuizButtons button').forEach(button => {
    button.classList.remove('active', 'quiz-correct', 'quiz-wrong');
  });
  clearPracticeButtonStates();
  const messages = {
    practice: '练习模式：选择颜色和棋种，再点击棋盘上的棋子与合法落点。',
    play: '对弈模式：红黑双方轮流选择棋子并走棋。',
    clear: '清除棋子：点击棋盘上的棋子移除，双方将帅保留。'
  };
  practiceNote.textContent = messages[mode];
  setPieceMessage(messages[mode], 'practice-message');
  renderBoard();
}

function clearPracticeButtonStates() {
  document.querySelectorAll('#practiceButtons .piece-choice-strip button').forEach(button => {
    button.classList.remove('practice-current', 'practice-correct', 'practice-wrong');
  });
}

function clearQuizButtons() {
  document.querySelectorAll('#boardQuizButtons button').forEach(button => {
    button.classList.remove('active', 'quiz-correct', 'quiz-wrong');
  });
}

function armPiecePractice(button, label, side, pieceCode) {
  if (mode !== 'practice') setMode('practice');
  activeObservation = null;
  selectedQuestion = null;
  activePracticeTarget = { label, side, pieceCode };
  game = createGame({ board: createPieceDemoBoard(pieceCode.toUpperCase()), turn: side === 'red' ? RED : BLACK });
  activePiece = findPiece(pieceCode);
  legalTargets = activePiece ? getLegalMoves(game, activePiece) : [];
  clearPracticeButtonStates();
  button.classList.add('practice-current');
  document.querySelectorAll('#observationButtons button, #boardQuizButtons button').forEach(item => item.classList.remove('active', 'quiz-correct', 'quiz-wrong'));
  practiceNote.textContent = `${side === 'red' ? '红方' : '黑方'}：${label}，点击棋盘上的高亮落点完成练习。`;
  setPieceMessage(practiceNote.textContent, 'practice-message');
  speakLesson(practiceNote.textContent);
  renderBoard();
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
  const position = { row, col };
  const piece = game.board[row][col];

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

  if (mode === 'clear') {
    if (!piece) return;
    if (piece.toUpperCase() === 'K') {
      practiceNote.textContent = '将帅需要保留，不能清除。';
      return;
    }
    const boardCopy = game.board.map(boardRow => [...boardRow]);
    boardCopy[row][col] = null;
    game = createGame({ board: boardCopy, turn: game.turn });
    activePiece = null;
    legalTargets = [];
    practiceNote.textContent = `已清除${getPieceLabel(piece)}。`;
    renderBoard();
    return;
  }

  if (mode === 'practice' && !activePracticeTarget) {
    practiceNote.textContent = '先点击黑方或红方的棋种按钮，再在棋盘上练习。';
    return;
  }

  if (activePiece && legalTargets.some(target => samePosition(target, position))) {
    const movingPiece = game.board[activePiece.row][activePiece.col];
    if (makeMove(game, activePiece, position)) {
      const message = mode === 'practice'
        ? `走法正确：${getPieceLabel(movingPiece)}已走到高亮位置。`
        : getGameStatus(game).type === 'checkmate'
          ? '将死，对局结束。'
          : `${game.turn === RED ? '红方' : '黑方'}回合，请选择棋子。`;
      activePiece = null;
      legalTargets = [];
      if (mode === 'practice') {
        activePracticeTarget = null;
        practiceNote.textContent = message;
      }
      setPieceMessage(message, 'success-message');
      renderBoard();
    }
    return;
  }

  if (!piece) {
    activePiece = null;
    legalTargets = [];
    renderBoard();
    return;
  }

  const pieceSide = piece === piece.toUpperCase() ? 'red' : 'black';
  if (mode === 'practice' && (piece !== activePracticeTarget.pieceCode || pieceSide !== activePracticeTarget.side)) {
    practiceNote.textContent = `请点击${activePracticeTarget.side === 'red' ? '红方' : '黑方'}${activePracticeTarget.label}。`;
    return;
  }
  if (mode === 'play' && pieceSide !== (game.turn === RED ? 'red' : 'black')) {
    practiceNote.textContent = `现在轮到${game.turn === RED ? '红方' : '黑方'}走棋。`;
    return;
  }

  activePiece = position;
  legalTargets = getLegalMoves(game, position);
  if (legalTargets.length) {
    const prompt = mode === 'practice' ? '点击一个高亮落点完成练习。' : '点击高亮落点完成走棋。';
    practiceNote.textContent = prompt;
    setPieceMessage(prompt, 'practice-message');
  } else {
    practiceNote.textContent = '该棋子当前没有合法落点。';
  }
  renderBoard();
}

function showQuizQuestion(question, button) {
  mode = 'quiz';
  game = createGame();
  activeObservation = null;
  activePracticeTarget = null;
  activePiece = null;
  legalTargets = [];
  observationTargets = [];
  observationMoves = [];
  selectedQuestion = question;
  document.querySelectorAll('.piece-move-modes button').forEach(item => {
    item.classList.remove('active');
    item.setAttribute('aria-pressed', 'false');
  });
  document.querySelectorAll('#observationButtons button').forEach(item => item.classList.remove('active'));
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

function speakLesson(text) {
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  const volumeControl = document.querySelector('#boardToolbar [data-control="volume"]');
  const speedControl = document.querySelector('#boardToolbar [data-control="speed"]');
  if (volumeControl) utterance.volume = Number(volumeControl.value) / 100;
  if (speedControl) utterance.rate = 0.75 + Number(speedControl.value) / 20;
  window.speechSynthesis.speak(utterance);
}

function samePosition(first, second) {
  return first.row === second.row && first.col === second.col;
}
